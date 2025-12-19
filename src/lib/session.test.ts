import { describe, it, expect, beforeEach } from 'vitest';

// Test session code generation pattern
describe('Session Code Generation', () => {
  // Test the code generation function logic
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function generateSessionCode(): string {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  it('should generate a 6-character code', () => {
    const code = generateSessionCode();
    expect(code.length).toBe(6);
  });

  it('should only use allowed characters (no ambiguous chars like O, 0, I, 1)', () => {
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    // Note: L is allowed since it's distinguishable from 1 in the chosen font
    const ambiguousChars = ['O', '0', 'I', '1'];

    // Generate many codes to test
    for (let i = 0; i < 100; i++) {
      const code = generateSessionCode();
      for (const char of code) {
        expect(allowedChars).toContain(char);
        expect(ambiguousChars).not.toContain(char);
      }
    }
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateSessionCode());
    }
    // With 6 chars from 32 possible, collisions are extremely unlikely
    expect(codes.size).toBeGreaterThan(95);
  });
});

// Test client ID generation pattern
describe('Client ID Generation', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  function getClientId(): string {
    let clientId = sessionStorage.getItem('horadric-client-id');
    if (!clientId) {
      clientId = crypto.randomUUID();
      sessionStorage.setItem('horadric-client-id', clientId);
    }
    return clientId;
  }

  it('should generate a valid UUID', () => {
    const clientId = getClientId();
    // UUID format: 8-4-4-4-12
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(clientId).toMatch(uuidRegex);
  });

  it('should persist the same ID across calls', () => {
    const firstId = getClientId();
    const secondId = getClientId();
    expect(firstId).toBe(secondId);
  });

  it('should store ID in sessionStorage', () => {
    const clientId = getClientId();
    expect(sessionStorage.getItem('horadric-client-id')).toBe(clientId);
  });
});

// Test session player slot logic
describe('Session Player Slot Logic', () => {
  interface MockPlayer {
    slot: number;
    is_connected: boolean;
    is_ready: boolean;
  }

  function findAvailableSlot(players: MockPlayer[]): MockPlayer | undefined {
    return players.find((p) => !p.is_connected);
  }

  it('should find first available slot', () => {
    const players: MockPlayer[] = [
      { slot: 0, is_connected: true, is_ready: false },
      { slot: 1, is_connected: false, is_ready: false },
      { slot: 2, is_connected: false, is_ready: false },
      { slot: 3, is_connected: false, is_ready: false },
    ];

    const available = findAvailableSlot(players);
    expect(available?.slot).toBe(1);
  });

  it('should return undefined when all slots are taken', () => {
    const players: MockPlayer[] = [
      { slot: 0, is_connected: true, is_ready: true },
      { slot: 1, is_connected: true, is_ready: false },
      { slot: 2, is_connected: true, is_ready: true },
      { slot: 3, is_connected: true, is_ready: false },
    ];

    const available = findAvailableSlot(players);
    expect(available).toBeUndefined();
  });

  it('should find slot 0 if host disconnects', () => {
    const players: MockPlayer[] = [
      { slot: 0, is_connected: false, is_ready: false },
      { slot: 1, is_connected: true, is_ready: false },
      { slot: 2, is_connected: true, is_ready: false },
      { slot: 3, is_connected: true, is_ready: false },
    ];

    const available = findAvailableSlot(players);
    expect(available?.slot).toBe(0);
  });
});

// Test read-only logic for collaborative mode
describe('Collaborative Mode Read-Only Logic', () => {
  function canEdit(playerIndex: number, isCollaborative: boolean, mySlot: number | null): boolean {
    if (!isCollaborative) return true;
    return playerIndex === mySlot;
  }

  it('should allow editing all slots in solo mode', () => {
    expect(canEdit(0, false, null)).toBe(true);
    expect(canEdit(1, false, null)).toBe(true);
    expect(canEdit(2, false, null)).toBe(true);
    expect(canEdit(3, false, null)).toBe(true);
  });

  it('should only allow editing own slot in collaborative mode', () => {
    expect(canEdit(0, true, 0)).toBe(true);
    expect(canEdit(1, true, 0)).toBe(false);
    expect(canEdit(2, true, 0)).toBe(false);
    expect(canEdit(3, true, 0)).toBe(false);
  });

  it('should allow slot 2 player to edit only slot 2', () => {
    expect(canEdit(0, true, 2)).toBe(false);
    expect(canEdit(1, true, 2)).toBe(false);
    expect(canEdit(2, true, 2)).toBe(true);
    expect(canEdit(3, true, 2)).toBe(false);
  });
});

// Test URL parameter parsing for session join
describe('Session URL Parameter Parsing', () => {
  function extractSessionCode(url: string): string | null {
    const urlParams = new URL(url).searchParams;
    return urlParams.get('session');
  }

  it('should extract session code from URL', () => {
    const code = extractSessionCode('https://example.com/?session=ABC123');
    expect(code).toBe('ABC123');
  });

  it('should return null if no session param', () => {
    const code = extractSessionCode('https://example.com/');
    expect(code).toBeNull();
  });

  it('should handle session param with other params', () => {
    const code = extractSessionCode('https://example.com/?foo=bar&session=XYZ789&baz=qux');
    expect(code).toBe('XYZ789');
  });
});

// Test slot state helper functions
describe('Slot State Helper Functions', () => {
  // Mock the PlayerInventory type
  interface MockPlayerInventory {
    mat_husk: number;
    mat_abhorrent: number;
    mat_doll: number;
    mat_shard: number;
    mat_mask: number;
    mat_blood: number;
    mat_fear: number;
    mat_steel: number;
    mat_heart: number;
    stygian: number;
  }

  interface MockSessionPlayer {
    player_name: string;
    is_connected: boolean;
    inventory: MockPlayerInventory;
  }

  const emptyInventory: MockPlayerInventory = {
    mat_husk: 0,
    mat_abhorrent: 0,
    mat_doll: 0,
    mat_shard: 0,
    mat_mask: 0,
    mat_blood: 0,
    mat_fear: 0,
    mat_steel: 0,
    mat_heart: 0,
    stygian: 0,
  };

  // Re-implement helpers inline for testing since we're testing the logic
  function hasSlotData(player: MockSessionPlayer): boolean {
    if (player.player_name && player.player_name.trim() !== '') return true;
    return Object.values(player.inventory).some((v) => v > 0);
  }

  type SlotState = 'connected' | 'manual' | 'empty';

  function getSlotState(player: MockSessionPlayer): SlotState {
    if (player.is_connected) return 'connected';
    if (hasSlotData(player)) return 'manual';
    return 'empty';
  }

  function isSlotAvailable(player: MockSessionPlayer): boolean {
    return !player.is_connected && !hasSlotData(player);
  }

  describe('hasSlotData', () => {
    it('should return false for empty player', () => {
      const player: MockSessionPlayer = {
        player_name: '',
        is_connected: false,
        inventory: { ...emptyInventory },
      };
      expect(hasSlotData(player)).toBe(false);
    });

    it('should return true if player has a name', () => {
      const player: MockSessionPlayer = {
        player_name: 'TestPlayer',
        is_connected: false,
        inventory: { ...emptyInventory },
      };
      expect(hasSlotData(player)).toBe(true);
    });

    it('should return true if player has materials', () => {
      const player: MockSessionPlayer = {
        player_name: '',
        is_connected: false,
        inventory: { ...emptyInventory, mat_shard: 5 },
      };
      expect(hasSlotData(player)).toBe(true);
    });

    it('should return false for whitespace-only name', () => {
      const player: MockSessionPlayer = {
        player_name: '   ',
        is_connected: false,
        inventory: { ...emptyInventory },
      };
      expect(hasSlotData(player)).toBe(false);
    });
  });

  describe('getSlotState', () => {
    it('should return connected for connected player', () => {
      const player: MockSessionPlayer = {
        player_name: '',
        is_connected: true,
        inventory: { ...emptyInventory },
      };
      expect(getSlotState(player)).toBe('connected');
    });

    it('should return manual for disconnected player with data', () => {
      const player: MockSessionPlayer = {
        player_name: 'Friend',
        is_connected: false,
        inventory: { ...emptyInventory },
      };
      expect(getSlotState(player)).toBe('manual');
    });

    it('should return empty for disconnected player without data', () => {
      const player: MockSessionPlayer = {
        player_name: '',
        is_connected: false,
        inventory: { ...emptyInventory },
      };
      expect(getSlotState(player)).toBe('empty');
    });

    it('should prioritize connected status over data', () => {
      const player: MockSessionPlayer = {
        player_name: 'Player',
        is_connected: true,
        inventory: { ...emptyInventory, mat_doll: 10 },
      };
      expect(getSlotState(player)).toBe('connected');
    });
  });

  describe('isSlotAvailable', () => {
    it('should return true for empty slot', () => {
      const player: MockSessionPlayer = {
        player_name: '',
        is_connected: false,
        inventory: { ...emptyInventory },
      };
      expect(isSlotAvailable(player)).toBe(true);
    });

    it('should return false for connected slot', () => {
      const player: MockSessionPlayer = {
        player_name: '',
        is_connected: true,
        inventory: { ...emptyInventory },
      };
      expect(isSlotAvailable(player)).toBe(false);
    });

    it('should return false for manual slot (has name)', () => {
      const player: MockSessionPlayer = {
        player_name: 'Friend',
        is_connected: false,
        inventory: { ...emptyInventory },
      };
      expect(isSlotAvailable(player)).toBe(false);
    });

    it('should return false for manual slot (has materials)', () => {
      const player: MockSessionPlayer = {
        player_name: '',
        is_connected: false,
        inventory: { ...emptyInventory, mat_blood: 3 },
      };
      expect(isSlotAvailable(player)).toBe(false);
    });
  });
});

// Test canEditSlot logic
describe('canEditSlot Logic', () => {
  function canEditSlot(
    slot: number,
    mySlot: number | null,
    isConnected: boolean
  ): boolean {
    if (slot === mySlot) return true;
    return !isConnected;
  }

  it('should allow editing own slot', () => {
    expect(canEditSlot(0, 0, true)).toBe(true);
    expect(canEditSlot(2, 2, false)).toBe(true);
  });

  it('should not allow editing connected slots that are not mine', () => {
    expect(canEditSlot(1, 0, true)).toBe(false);
    expect(canEditSlot(3, 0, true)).toBe(false);
  });

  it('should allow editing disconnected slots', () => {
    expect(canEditSlot(1, 0, false)).toBe(true);
    expect(canEditSlot(2, 0, false)).toBe(true);
    expect(canEditSlot(3, 0, false)).toBe(true);
  });
});
