import type { PlayerInventory, OptimizationResult } from './optimizer';
import type { JokerPriority } from '../constants';

// Helper to check if a player slot has any data (name or materials)
export function hasSlotData(player: SessionPlayer): boolean {
  if (player.player_name && player.player_name.trim() !== '') return true;
  return Object.values(player.inventory).some(v => v > 0);
}

// Slot states for UI display
export type SlotState = 'connected' | 'manual' | 'empty';

export function getSlotState(player: SessionPlayer): SlotState {
  if (player.is_connected) return 'connected';
  if (hasSlotData(player)) return 'manual';
  return 'empty';
}

// Check if a slot is available for a new player to join
export function isSlotAvailable(player: SessionPlayer): boolean {
  return !player.is_connected && !hasSlotData(player);
}

export interface Session {
  id: string;
  code: string;
  host_slot: number;
  priority: JokerPriority;
  result: OptimizationResult | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  slot: number;
  player_name: string;
  is_active: boolean;
  is_ready: boolean;
  is_connected: boolean;
  inventory: PlayerInventory;
  client_id: string | null;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

// Supabase database types
export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'updated_at' | 'expires_at' | 'result'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
          result?: OptimizationResult | null;
        };
        Update: Partial<Omit<Session, 'id' | 'created_at'>>;
        Relationships: [];
      };
      session_players: {
        Row: SessionPlayer;
        Insert: Omit<SessionPlayer, 'id' | 'created_at' | 'updated_at' | 'last_seen'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_seen?: string;
        };
        Update: Partial<Omit<SessionPlayer, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'session_players_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
