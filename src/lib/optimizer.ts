import { BOSS_LIST, JOKER_BOSSES } from '../constants';
import type { BossId, MaterialKey, JokerPriority } from '../constants';

// Player inventory type
export type PlayerInventory = Record<MaterialKey | 'stygian', number>;

// Initialize empty inventory
export function createEmptyInventory(): PlayerInventory {
    return {
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
}

// Check if inventory is completely empty
export function isInventoryEmpty(inv: PlayerInventory): boolean {
    return Object.values(inv).every(v => v === 0);
}

// Result types
export interface BossResult {
    bossId: BossId;
    summons: number;
    stygianUsed: number;
}

export interface Trade {
    fromPlayer: number;
    toPlayer: number;
    material: MaterialKey | 'stygian';
    amount: number;
}

export interface OptimizationResult {
    bossResults: BossResult[];
    totalSummons: number;
    trades: Trade[];
    playerDuties: Record<number, Record<BossId, number>>; // player -> boss -> summons to do
    stygianUsagePerPlayer: Record<number, Record<BossId, number>>; // player -> boss -> stygian to use
    partySize: number;
}

// Main optimization function
// Main optimization function
// Main optimization function
export function optimizeRota(
    inventories: PlayerInventory[],
    jokerPriority: JokerPriority,
    playerActive: boolean[] = [true, true, true, true],
    partySize: number = 4
): OptimizationResult {
    // Step 1: Calculate global pool (only from active players)
    const globalPool: PlayerInventory = createEmptyInventory();
    const materialKeys = Object.keys(globalPool) as (MaterialKey | 'stygian')[];

    for (let i = 0; i < inventories.length; i++) {
        if (!playerActive[i]) continue;

        for (const key of materialKeys) {
            globalPool[key] += inventories[i][key];
        }
    }

    let remainingStygian = globalPool.stygian;
    const bossResults: BossResult[] = [];

    // Step 2: Calculate standard (non-joker) boss kills (Full Party Rotations)
    // Materials are used to LOOT chests after the kill, not to summon
    // So 1 rotation = 1 boss kill, where each player uses (cost) materials to loot
    for (const boss of BOSS_LIST) {
        if (!boss.isJokerCompatible) {
            const available = globalPool[boss.materialKey];
            // Calculate how many FULL rotations the party can do
            // 1 Rotation = cost * partySize (each player needs 'cost' materials to loot)
            const costPerRotation = boss.cost * partySize;

            // Avoid division by zero if partySize is 0
            const rotations = partySize > 0 ? Math.floor(available / costPerRotation) : 0;
            // Each rotation = 1 boss kill (party kills boss together, each loots once)
            const totalKills = rotations;

            bossResults.push({
                bossId: boss.id,
                summons: totalKills,
                stygianUsed: 0,
            });
        }
    }

    // Step 3: Calculate joker boss kills with Stygian Stone substitution
    // Logic:
    // 1. First, calculate base rotations from specific materials alone
    // 2. Then use Stygian to add more rotations, prioritizing the selected boss

    const jokerResults: Map<BossId, BossResult> = new Map();
    // Initialize joker results
    for (const boss of JOKER_BOSSES) {
        jokerResults.set(boss.id, {
            bossId: boss.id,
            summons: 0,
            stygianUsed: 0,
        });
    }

    if (partySize > 0) {
        // Track available specific materials for each boss
        const specificPools = new Map<BossId, number>();
        for (const boss of JOKER_BOSSES) {
            specificPools.set(boss.id, globalPool[boss.materialKey]);
        }

        // Phase 1: Calculate rotations using ONLY specific materials (no Stygian)
        for (const boss of JOKER_BOSSES) {
            const costPerRotation = boss.cost * partySize;
            const availableSpecific = specificPools.get(boss.id)!;
            const rotations = Math.floor(availableSpecific / costPerRotation);

            if (rotations > 0) {
                const result = jokerResults.get(boss.id)!;
                // Each rotation = 1 boss kill (not partySize)
                result.summons = rotations;

                // Update pool - consume the used materials
                const used = rotations * costPerRotation;
                specificPools.set(boss.id, availableSpecific - used);
            }
        }

        // Phase 2: Use Stygian stones to complete partial rotations or add more
        // Priority boss gets Stygian first, then others if balanced
        const bossOrder = jokerPriority === 'balanced'
            ? JOKER_BOSSES
            : [
                JOKER_BOSSES.find(b => b.id === jokerPriority)!,
                ...JOKER_BOSSES.filter(b => b.id !== jokerPriority)
              ];

        for (const boss of bossOrder) {
            if (remainingStygian <= 0) break;

            const costPerRotation = boss.cost * partySize;
            const availableSpecific = specificPools.get(boss.id)!;

            // Try to complete rotations using Stygian to fill gaps
            while (remainingStygian > 0) {
                const fromSpecific = Math.min(availableSpecific, costPerRotation);
                const fromStygian = costPerRotation - fromSpecific;

                // Need at least some Stygian benefit or full specific materials
                if (fromStygian > remainingStygian) break;
                if (fromSpecific === 0 && fromStygian === 0) break;

                // Only use Stygian if we have leftover specific materials to combine
                // OR if this is the priority boss
                if (fromSpecific === 0 && boss.id !== jokerPriority && jokerPriority !== 'balanced') {
                    break;
                }

                // Commit to this rotation (1 rotation = 1 boss kill)
                const result = jokerResults.get(boss.id)!;
                result.summons += 1;
                result.stygianUsed += fromStygian;

                // Update pools
                specificPools.set(boss.id, specificPools.get(boss.id)! - fromSpecific);
                remainingStygian -= fromStygian;
            }
        }
    }

    // Add joker results
    for (const boss of JOKER_BOSSES) {
        bossResults.push(jokerResults.get(boss.id)!);
    }

    // Sort by original boss order
    const bossOrder = BOSS_LIST.map(b => b.id);
    bossResults.sort((a, b) => bossOrder.indexOf(a.bossId) - bossOrder.indexOf(b.bossId));

    // Step 4: Calculate trades
    const { trades, playerDuties, stygianUsagePerPlayer } = calculateMinimalTrades(inventories, bossResults, playerActive, partySize);

    const totalSummons = bossResults.reduce((sum, r) => sum + r.summons, 0);

    return {
        bossResults,
        totalSummons,
        trades,
        playerDuties,
        stygianUsagePerPlayer,
        partySize,
    };
}

function calculateMinimalTrades(
    inventories: PlayerInventory[],
    bossResults: BossResult[],
    playerActive: boolean[],
    partySize: number
): { trades: Trade[]; playerDuties: Record<number, Record<BossId, number>>; stygianUsagePerPlayer: Record<number, Record<BossId, number>> } {
    const trades: Trade[] = [];
    const playerDuties: Record<number, Record<BossId, number>> = {
        0: {} as Record<BossId, number>,
        1: {} as Record<BossId, number>,
        2: {} as Record<BossId, number>,
        3: {} as Record<BossId, number>,
    };
    const emptyStygianUsage: Record<number, Record<BossId, number>> = {
        0: {} as Record<BossId, number>,
        1: {} as Record<BossId, number>,
        2: {} as Record<BossId, number>,
        3: {} as Record<BossId, number>,
    };

    if (partySize === 0) return { trades: [], playerDuties, stygianUsagePerPlayer: emptyStygianUsage };

    // Create mutable copy of inventories to track trades
    const currentInv = inventories.map(inv => ({ ...inv }));

    for (const result of bossResults) {
        if (result.summons === 0) continue;

        const boss = BOSS_LIST.find(b => b.id === result.bossId)!;

        // result.summons = number of boss kills (rotations)
        // Each player participates in all kills and needs (cost * kills) materials
        const killsTotal = result.summons;
        const costPerPlayer = killsTotal * boss.cost;

        // Assign duties (everyone participates in all kills)
        for (let i = 0; i < 4; i++) {
            if (playerActive[i]) {
                playerDuties[i][result.bossId] = killsTotal;
            }
        }

        // Calculate trades for Specific Materials
        // Strategy: 
        // 1. Determine who has SURPLUS specific mats (Active players only)
        // 2. Determine who has DEFICIT specific mats
        // 3. Move surplus to deficit
        // 4. Any remaining deficit must be covered by Stygian (globally)

        const surplusList: { player: number, amount: number }[] = [];
        const deficitList: { player: number, amount: number }[] = [];

        for (let p = 0; p < 4; p++) {
            if (!playerActive[p]) continue;

            const has = currentInv[p][boss.materialKey];
            // How much of the specific material SHOULD they use?
            // They need 'costPerPlayer' total value.
            // Ideally they use their own specific mats up to that amount.
            // If they have more, that's SURPLUS (tradeable).
            // If they have less, that's DEFICIT (needs trade).

            // Wait: The Global Logic optimized maximizing usage of specific mats.
            // But Stygian substitution happens globally. 
            // We need to know how much SPECIFIC material was allocated vs Stygian for this boss.
            // Actually, we don't. We just need to ensure everyone has enough TARGET VALUE.
            // But we should prioritize trading Specific mats before resorting to Stygian.

            if (has > costPerPlayer) {
                surplusList.push({ player: p, amount: has - costPerPlayer });
            } else if (has < costPerPlayer) {
                deficitList.push({ player: p, amount: costPerPlayer - has });
            }
            // If has == costPerPlayer, they are perfect.
        }

        // Execute trades from Surplus to Deficit
        for (const deficit of deficitList) {
            let needed = deficit.amount;

            for (let i = 0; i < surplusList.length && needed > 0; i++) {
                const surplus = surplusList[i];
                if (surplus.amount > 0) {
                    const transfer = Math.min(surplus.amount, needed);

                    trades.push({
                        fromPlayer: surplus.player,
                        toPlayer: deficit.player,
                        material: boss.materialKey,
                        amount: transfer,
                    });

                    surplus.amount -= transfer;
                    currentInv[surplus.player][boss.materialKey] -= transfer;
                    currentInv[deficit.player][boss.materialKey] += transfer;
                    needed -= transfer;
                }
            }
            // If needed > 0 here, it means Global Specific Materials weren't enough 
            // to cover the "Pure Specific" cost for everyone. 
            // This implies Stygian must be used.
            // The deficit remains in 'currentInv' (they have less than needed).
            // We handle Stygian distribution separately/implicitly? 
            // No, we need to trade Stygian if they don't have it.
        }
    }

    // Handle Stygian Trades
    // After specific calc, some players might still be short on "Value" for their summons
    // because they replaced Specific with Stygian.
    // Also, Stygian is shared across bosses.

    // Calculate Stygian needed per player AND per boss
    const stygianNeededPerPlayer = [0, 0, 0, 0];
    const stygianUsagePerPlayer: Record<number, Record<BossId, number>> = {
        0: {} as Record<BossId, number>,
        1: {} as Record<BossId, number>,
        2: {} as Record<BossId, number>,
        3: {} as Record<BossId, number>,
    };

    for (let p = 0; p < 4; p++) {
        if (!playerActive[p]) continue;

        for (const result of bossResults) {
            const boss = BOSS_LIST.find(b => b.id === result.bossId)!;
            const summons = playerDuties[p]?.[result.bossId] || 0;
            if (summons === 0) continue;

            const costTotal = summons * boss.cost;
            const hasSpecific = currentInv[p][boss.materialKey]; // Current after trades

            // If they have 5 specific and need 10 cost, they need 5 Stygian value.
            // Note: costTotal is strictly <= amount they "should" have if we traded perfectly.
            // But if we ran out of specific mats, 'hasSpecific' will be < 'costTotal'.
            // The gap MUST be filled by Stygian.

            if (hasSpecific < costTotal) {
                const stygianForBoss = costTotal - hasSpecific;
                stygianNeededPerPlayer[p] += stygianForBoss;
                stygianUsagePerPlayer[p][result.bossId] = stygianForBoss;
            }
        }
    }

    // Now trade Stygian to meet needs
    const stygSurplus: { player: number, amount: number }[] = [];
    const stygDeficit: { player: number, amount: number }[] = [];

    for (let p = 0; p < 4; p++) {
        if (!playerActive[p]) continue;

        const hasStygian = currentInv[p].stygian;
        const needed = stygianNeededPerPlayer[p];

        if (hasStygian > needed) {
            stygSurplus.push({ player: p, amount: hasStygian - needed });
        } else if (hasStygian < needed) {
            stygDeficit.push({ player: p, amount: needed - hasStygian });
        }
    }

    for (const deficit of stygDeficit) {
        let needed = deficit.amount;

        for (let i = 0; i < stygSurplus.length && needed > 0; i++) {
            const surplus = stygSurplus[i];
            if (surplus.amount > 0) {
                const transfer = Math.min(surplus.amount, needed);

                trades.push({
                    fromPlayer: surplus.player,
                    toPlayer: deficit.player,
                    material: 'stygian',
                    amount: transfer,
                });

                surplus.amount -= transfer;
                // currentInv updates not strictly needed for logic but good for consistency
                needed -= transfer;
            }
        }
    }

    // Consolidate trades (combine same from->to with same material)
    const tradeMap = new Map<string, Trade>();
    for (const trade of trades) {
        const key = `${trade.fromPlayer}-${trade.toPlayer}-${trade.material}`;
        if (tradeMap.has(key)) {
            tradeMap.get(key)!.amount += trade.amount;
        } else {
            tradeMap.set(key, { ...trade });
        }
    }

    return {
        trades: Array.from(tradeMap.values()).filter(t => t.amount > 0),
        playerDuties,
        stygianUsagePerPlayer,
    };
}
