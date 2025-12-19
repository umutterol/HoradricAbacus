import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Session, SessionPlayer } from '../lib/database.types';
import { isSlotAvailable } from '../lib/database.types';
import type { OptimizationResult } from '../lib/optimizer';
import type { JokerPriority, MaterialKey } from '../constants';
import { createEmptyInventory } from '../lib/optimizer';

// Generate a unique client ID for this browser session
function getClientId(): string {
  let clientId = sessionStorage.getItem('horadric-client-id');
  if (!clientId) {
    clientId = crypto.randomUUID();
    sessionStorage.setItem('horadric-client-id', clientId);
  }
  return clientId;
}

// Generate a short shareable code (6 chars, no ambiguous characters)
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface SessionState {
  session: Session | null;
  players: SessionPlayer[];
  mySlot: number | null;
  isHost: boolean;
  isConnected: boolean;
  isSupabaseAvailable: boolean;
  connectionError: string | null;
}

export interface SessionActions {
  createSession: (playerName?: string) => Promise<string | null>;
  joinSession: (code: string, playerName?: string) => Promise<'success' | 'not_found' | 'full' | 'error'>;
  leaveSession: () => Promise<void>;
  updateMyInventory: (material: MaterialKey | 'stygian', value: number) => void;
  updateMyName: (name: string) => void;
  toggleMyActive: () => void;
  toggleMyReady: () => void;
  updatePriority: (priority: JokerPriority) => void;
  broadcastResult: (result: OptimizationResult) => void;
  // For editing other players' slots (manual entry for friends)
  updateSlotInventory: (slot: number, material: MaterialKey | 'stygian', value: number) => void;
  updateSlotName: (slot: number, name: string) => void;
  clearSlot: (slot: number) => void;
  // Check if a slot can be edited by current user
  canEditSlot: (slot: number) => boolean;
}

const emptyInventory = createEmptyInventory();

export function useSession(): [SessionState, SessionActions] {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [mySlot, setMySlot] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const clientId = useRef(getClientId());
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);

  const isHost = session !== null && mySlot === session.host_slot;
  const isSupabaseAvailable = isSupabaseConfigured();

  // Subscribe to session changes
  useEffect(() => {
    if (!session || !supabase) return;

    const channel = supabase
      .channel(`session:${session.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSession(payload.new as Session);
          } else if (payload.eventType === 'DELETE') {
            handleSessionEnded();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${session.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as SessionPlayer]);
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === (payload.new as SessionPlayer).id ? (payload.new as SessionPlayer) : p
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prev) =>
              prev.filter((p) => p.id !== (payload.old as SessionPlayer).id)
            );
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR') {
          setConnectionError('Connection lost. Trying to reconnect...');
        } else if (status === 'SUBSCRIBED') {
          setConnectionError(null);
        }
      });

    channelRef.current = channel;

    // Heartbeat to keep connection alive and track presence
    const heartbeat = setInterval(async () => {
      if (mySlot !== null && supabase) {
        await supabase
          .from('session_players')
          .update({ last_seen: new Date().toISOString() })
          .eq('session_id', session.id)
          .eq('slot', mySlot);
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [session?.id, mySlot]);

  const handleSessionEnded = useCallback(() => {
    setSession(null);
    setPlayers([]);
    setMySlot(null);
    setIsConnected(false);
    setConnectionError('Session has ended');
  }, []);

  const createSession = useCallback(async (playerName?: string): Promise<string | null> => {
    if (!supabase) {
      setConnectionError('Supabase not configured');
      return null;
    }

    try {
      const code = generateSessionCode();

      // Create session
      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          code,
          host_slot: 0,
          priority: 'duriel' as JokerPriority,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create all 4 player slots
      const playerInserts = [0, 1, 2, 3].map((slot) => ({
        session_id: newSession.id,
        slot,
        is_connected: slot === 0,
        is_active: true,
        is_ready: false,
        client_id: slot === 0 ? clientId.current : null,
        inventory: emptyInventory,
        player_name: slot === 0 ? (playerName || '') : '',
      }));

      const { data: newPlayers, error: playersError } = await supabase
        .from('session_players')
        .insert(playerInserts)
        .select();

      if (playersError) throw playersError;

      setSession(newSession as Session);
      setPlayers((newPlayers as SessionPlayer[]).sort((a, b) => a.slot - b.slot));
      setMySlot(0);
      setConnectionError(null);

      return code;
    } catch (error) {
      setConnectionError('Failed to create session');
      console.error('Create session error:', error);
      return null;
    }
  }, []);

  const joinSession = useCallback(async (code: string, playerName?: string): Promise<'success' | 'not_found' | 'full' | 'error'> => {
    if (!supabase) {
      setConnectionError('Supabase not configured');
      return 'error';
    }

    try {
      // Find session by code
      const { data: foundSession, error: findError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code.toUpperCase())
        .gt('expires_at', new Date().toISOString())
        .single();

      if (findError || !foundSession) {
        setConnectionError('Session not found or expired');
        return 'not_found';
      }

      // Get all players
      const { data: sessionPlayers, error: playersError } = await supabase
        .from('session_players')
        .select('*')
        .eq('session_id', foundSession.id)
        .order('slot');

      if (playersError) throw playersError;

      const typedPlayers = sessionPlayers as SessionPlayer[];

      // Find first available slot (not connected AND no manual data)
      const availableSlot = typedPlayers.find((p) => isSlotAvailable(p));
      if (!availableSlot) {
        setConnectionError('Session is full');
        return 'full';
      }

      // Claim the slot (clear any stale data and connect)
      const { error: claimError } = await supabase
        .from('session_players')
        .update({
          is_connected: true,
          client_id: clientId.current,
          last_seen: new Date().toISOString(),
          player_name: playerName || availableSlot.player_name || '',
        })
        .eq('id', availableSlot.id);

      if (claimError) throw claimError;

      setSession(foundSession as Session);
      setPlayers(
        typedPlayers
          .map((p) =>
            p.id === availableSlot.id
              ? { ...p, is_connected: true, client_id: clientId.current }
              : p
          )
          .sort((a, b) => a.slot - b.slot)
      );
      setMySlot(availableSlot.slot);
      setConnectionError(null);

      return 'success';
    } catch (error) {
      setConnectionError('Failed to join session');
      console.error('Join session error:', error);
      return 'error';
    }
  }, []);

  const leaveSession = useCallback(async () => {
    if (!supabase || !session || mySlot === null) {
      setSession(null);
      setPlayers([]);
      setMySlot(null);
      setIsConnected(false);
      return;
    }

    try {
      // Mark slot as disconnected
      await supabase
        .from('session_players')
        .update({
          is_connected: false,
          is_ready: false,
          client_id: null,
        })
        .eq('session_id', session.id)
        .eq('slot', mySlot);
    } catch (error) {
      console.error('Leave session error:', error);
    } finally {
      setSession(null);
      setPlayers([]);
      setMySlot(null);
      setIsConnected(false);
    }
  }, [session, mySlot]);

  const updateMyInventory = useCallback(
    (material: MaterialKey | 'stygian', value: number) => {
      if (!supabase || !session || mySlot === null) return;

      const myPlayer = players.find((p) => p.slot === mySlot);
      if (!myPlayer) return;

      const newInventory = { ...myPlayer.inventory, [material]: value };

      // Optimistic update
      setPlayers((prev) =>
        prev.map((p) => (p.slot === mySlot ? { ...p, inventory: newInventory } : p))
      );

      // Persist to database
      supabase
        .from('session_players')
        .update({ inventory: newInventory })
        .eq('id', myPlayer.id)
        .then(({ error }) => {
          if (error) console.error('Update inventory error:', error);
        });
    },
    [session, mySlot, players]
  );

  const updateMyName = useCallback(
    (name: string) => {
      if (!supabase || !session || mySlot === null) return;

      const myPlayer = players.find((p) => p.slot === mySlot);
      if (!myPlayer) return;

      setPlayers((prev) =>
        prev.map((p) => (p.slot === mySlot ? { ...p, player_name: name } : p))
      );

      supabase
        .from('session_players')
        .update({ player_name: name })
        .eq('id', myPlayer.id)
        .then(({ error }) => {
          if (error) console.error('Update name error:', error);
        });
    },
    [session, mySlot, players]
  );

  const toggleMyActive = useCallback(() => {
    if (!supabase || !session || mySlot === null) return;

    const myPlayer = players.find((p) => p.slot === mySlot);
    if (!myPlayer) return;

    const newActive = !myPlayer.is_active;

    setPlayers((prev) =>
      prev.map((p) => (p.slot === mySlot ? { ...p, is_active: newActive } : p))
    );

    supabase
      .from('session_players')
      .update({ is_active: newActive })
      .eq('id', myPlayer.id)
      .then(({ error }) => {
        if (error) console.error('Toggle active error:', error);
      });
  }, [session, mySlot, players]);

  const toggleMyReady = useCallback(() => {
    if (!supabase || !session || mySlot === null) return;

    const myPlayer = players.find((p) => p.slot === mySlot);
    if (!myPlayer) return;

    const newReady = !myPlayer.is_ready;

    setPlayers((prev) =>
      prev.map((p) => (p.slot === mySlot ? { ...p, is_ready: newReady } : p))
    );

    supabase
      .from('session_players')
      .update({ is_ready: newReady })
      .eq('id', myPlayer.id)
      .then(({ error }) => {
        if (error) console.error('Toggle ready error:', error);
      });
  }, [session, mySlot, players]);

  const updatePriority = useCallback(
    (priority: JokerPriority) => {
      if (!supabase || !session) return;

      setSession((prev) => (prev ? { ...prev, priority } : null));

      supabase
        .from('sessions')
        .update({ priority })
        .eq('id', session.id)
        .then(({ error }) => {
          if (error) console.error('Update priority error:', error);
        });
    },
    [session]
  );

  const broadcastResult = useCallback(
    (result: OptimizationResult) => {
      if (!supabase || !session) return;

      supabase
        .from('sessions')
        .update({ result })
        .eq('id', session.id)
        .then(({ error }) => {
          if (error) console.error('Broadcast result error:', error);
        });
    },
    [session]
  );

  // Check if current user can edit a specific slot
  // Can edit: own slot OR empty/disconnected slots (for manual entry)
  const canEditSlot = useCallback(
    (slot: number): boolean => {
      if (!session) return false;
      if (slot === mySlot) return true;

      // Can edit disconnected slots for manual entry
      const player = players.find((p) => p.slot === slot);
      if (!player) return false;
      return !player.is_connected;
    },
    [session, mySlot, players]
  );

  // Update inventory for any editable slot
  const updateSlotInventory = useCallback(
    (slot: number, material: MaterialKey | 'stygian', value: number) => {
      if (!supabase || !session || !canEditSlot(slot)) return;

      const player = players.find((p) => p.slot === slot);
      if (!player) return;

      const newInventory = { ...player.inventory, [material]: value };

      // Optimistic update
      setPlayers((prev) =>
        prev.map((p) => (p.slot === slot ? { ...p, inventory: newInventory } : p))
      );

      // Persist to database
      supabase
        .from('session_players')
        .update({ inventory: newInventory })
        .eq('id', player.id)
        .then(({ error }) => {
          if (error) console.error('Update slot inventory error:', error);
        });
    },
    [session, players, canEditSlot]
  );

  // Update name for any editable slot
  const updateSlotName = useCallback(
    (slot: number, name: string) => {
      if (!supabase || !session || !canEditSlot(slot)) return;

      const player = players.find((p) => p.slot === slot);
      if (!player) return;

      setPlayers((prev) =>
        prev.map((p) => (p.slot === slot ? { ...p, player_name: name } : p))
      );

      supabase
        .from('session_players')
        .update({ player_name: name })
        .eq('id', player.id)
        .then(({ error }) => {
          if (error) console.error('Update slot name error:', error);
        });
    },
    [session, players, canEditSlot]
  );

  // Clear a slot (reset to empty state, making it available for joining)
  const clearSlot = useCallback(
    (slot: number) => {
      if (!supabase || !session) return;
      // Can't clear own slot or connected slots
      if (slot === mySlot) return;

      const player = players.find((p) => p.slot === slot);
      if (!player || player.is_connected) return;

      const emptyState = {
        player_name: '',
        inventory: createEmptyInventory(),
        is_active: true,
        is_ready: false,
      };

      // Optimistic update
      setPlayers((prev) =>
        prev.map((p) => (p.slot === slot ? { ...p, ...emptyState } : p))
      );

      supabase
        .from('session_players')
        .update(emptyState)
        .eq('id', player.id)
        .then(({ error }) => {
          if (error) console.error('Clear slot error:', error);
        });
    },
    [session, mySlot, players]
  );

  const state: SessionState = {
    session,
    players,
    mySlot,
    isHost,
    isConnected,
    isSupabaseAvailable,
    connectionError,
  };

  const actions: SessionActions = {
    createSession,
    joinSession,
    leaveSession,
    updateMyInventory,
    updateMyName,
    toggleMyActive,
    toggleMyReady,
    updatePriority,
    broadcastResult,
    updateSlotInventory,
    updateSlotName,
    clearSlot,
    canEditSlot,
  };

  return [state, actions];
}
