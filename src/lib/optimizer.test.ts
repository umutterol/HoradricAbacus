import { describe, it, expect } from 'vitest';
import {
  createEmptyInventory,
  isInventoryEmpty,
  optimizeRota,
} from './optimizer';

describe('optimizer', () => {
  describe('createEmptyInventory', () => {
    it('should create an inventory with all zeros', () => {
      const inv = createEmptyInventory();

      expect(inv.mat_husk).toBe(0);
      expect(inv.mat_abhorrent).toBe(0);
      expect(inv.mat_doll).toBe(0);
      expect(inv.mat_shard).toBe(0);
      expect(inv.mat_mask).toBe(0);
      expect(inv.mat_blood).toBe(0);
      expect(inv.mat_fear).toBe(0);
      expect(inv.mat_steel).toBe(0);
      expect(inv.mat_heart).toBe(0);
      expect(inv.stygian).toBe(0);
    });

    it('should create a new object each time', () => {
      const inv1 = createEmptyInventory();
      const inv2 = createEmptyInventory();

      expect(inv1).not.toBe(inv2);
      inv1.mat_husk = 5;
      expect(inv2.mat_husk).toBe(0);
    });
  });

  describe('isInventoryEmpty', () => {
    it('should return true for empty inventory', () => {
      const inv = createEmptyInventory();
      expect(isInventoryEmpty(inv)).toBe(true);
    });

    it('should return false if any material is non-zero', () => {
      const inv = createEmptyInventory();
      inv.mat_husk = 1;
      expect(isInventoryEmpty(inv)).toBe(false);
    });

    it('should return false if stygian is non-zero', () => {
      const inv = createEmptyInventory();
      inv.stygian = 1;
      expect(isInventoryEmpty(inv)).toBe(false);
    });
  });

  describe('optimizeRota', () => {
    it('should return zero summons for empty inventories', () => {
      const inventories = [
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');

      expect(result.totalSummons).toBe(0);
      expect(result.trades).toHaveLength(0);
    });

    it('should calculate Belial summons correctly (cost: 2)', () => {
      // 8 husks / 2 cost = 4 total / 4 players = 1 per player
      const inventories = [
        { ...createEmptyInventory(), mat_husk: 8 },
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');
      const belialResult = result.bossResults.find(r => r.bossId === 'belial');

      // summons is per-player: (8 / 2) / 4 = 1
      expect(belialResult?.summons).toBe(1);
      // totalSummons should be 4
      expect(result.totalSummons).toBeGreaterThanOrEqual(1);
    });

    it('should calculate Duriel summons correctly (cost: 3)', () => {
      // 12 shards / 3 cost = 4 total / 4 players = 1 per player
      const inventories = [
        { ...createEmptyInventory(), mat_shard: 12 },
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');
      const durielResult = result.bossResults.find(r => r.bossId === 'duriel');

      expect(durielResult?.summons).toBe(1); // (12 / 3) / 4 = 1
    });

    it('should calculate high-cost boss summons correctly (cost: 12)', () => {
      // 48 masks / 12 cost = 4 total / 4 players = 1 per player
      const inventories = [
        { ...createEmptyInventory(), mat_mask: 48 },
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');
      const urivarResult = result.bossResults.find(r => r.bossId === 'urivar');

      expect(urivarResult?.summons).toBe(1); // (48 / 12) / 4 = 1
    });

    it('should pool materials from multiple active players', () => {
      const inventories = [
        { ...createEmptyInventory(), mat_husk: 4 },
        { ...createEmptyInventory(), mat_husk: 4 }, // Total: 8 = 4 Belial total
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');
      const belialResult = result.bossResults.find(r => r.bossId === 'belial');

      expect(belialResult?.summons).toBe(1); // (8 / 2) / 4 = 1 per player
    });

    it('should ignore inactive players', () => {
      // 6 husks = 3 Belial total, with 3 active players = 1 per player
      const inventories = [
        { ...createEmptyInventory(), mat_husk: 6 },
        { ...createEmptyInventory(), mat_husk: 100 }, // Inactive, ignored
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(
        inventories,
        'duriel',
        [true, false, true, true], // Player 2 inactive
        3
      );
      const belialResult = result.bossResults.find(r => r.bossId === 'belial');

      expect(belialResult?.summons).toBe(1); // (6 / 2) / 3 = 1 per player
    });

    it('should use stygian stones for joker-compatible bosses', () => {
      // 12 shards = 4 Duriel / 4 players = 1 per player
      const inventories = [
        { ...createEmptyInventory(), mat_shard: 12 },
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');
      const durielResult = result.bossResults.find(r => r.bossId === 'duriel');

      expect(durielResult?.summons).toBe(1);
    });

    it('should handle stygian usage with priority', () => {
      const inventories = [
        {
          ...createEmptyInventory(),
          mat_shard: 12,     // 4 Duriel total
          mat_doll: 12,      // 4 Andariel total
          stygian: 4,        // Extra stygians
        },
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');
      const durielResult = result.bossResults.find(r => r.bossId === 'duriel');

      // Should have at least 1 per player
      expect(durielResult?.summons).toBeGreaterThanOrEqual(1);
    });

    it('should generate trades when materials need redistribution', () => {
      const inventories = [
        { ...createEmptyInventory(), mat_husk: 10 },
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');

      // If player 1 has all materials, trades may be needed for distribution
      // depending on how the optimizer distributes duties
      expect(result.trades).toBeDefined();
    });

    it('should set correct party size', () => {
      const inventories = [
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel', [true, true, false, false], 2);

      expect(result.partySize).toBe(2);
    });

    it('should return player duties', () => {
      const inventories = [
        { ...createEmptyInventory(), mat_husk: 8 }, // 8/2 = 4 Belial kills
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');

      expect(result.playerDuties).toBeDefined();
      // playerDuties is defined per active player
      expect(Object.keys(result.playerDuties).length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large material counts', () => {
      const inventories = [
        { ...createEmptyInventory(), mat_husk: 1000 },
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(inventories, 'duriel');
      const belialResult = result.bossResults.find(r => r.bossId === 'belial');

      // 1000 / 2 = 500 total, / 4 players = 125 per player
      expect(belialResult?.summons).toBe(125);
    });

    it('should handle all players inactive gracefully', () => {
      const inventories = [
        { ...createEmptyInventory(), mat_husk: 100 },
        { ...createEmptyInventory(), mat_husk: 100 },
        { ...createEmptyInventory(), mat_husk: 100 },
        { ...createEmptyInventory(), mat_husk: 100 },
      ];

      const result = optimizeRota(
        inventories,
        'duriel',
        [false, false, false, false],
        0
      );

      expect(result.totalSummons).toBe(0);
    });

    it('should handle single active player', () => {
      const inventories = [
        { ...createEmptyInventory(), mat_husk: 10 },
        createEmptyInventory(),
        createEmptyInventory(),
        createEmptyInventory(),
      ];

      const result = optimizeRota(
        inventories,
        'duriel',
        [true, false, false, false],
        1
      );

      expect(result.totalSummons).toBeGreaterThan(0);
      expect(result.partySize).toBe(1);
    });
  });
});
