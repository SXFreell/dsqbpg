import type { DSPData } from "../dsp/types";

/**
 * Calculate miners needed for a raw resource at a given rate.
 *
 * Mining rate depends on:
 * - Miner type (small/large)
 * - Vein utilization level (0 = base)
 * - Number of veins covered by the miner
 *
 * @param itemId - The raw item ID (e.g., iron ore = 1001)
 * @param ratePerMinute - Required production rate (items/min)
 * @param veinUtilization - Vein utilization level (0 = base, each level adds 10% efficiency)
 * @param data - DSP game data
 * @returns Number of miners needed and the miner building name
 */
export function calcMiners(
  itemId: number,
  ratePerMinute: number,
  veinUtilization: number,
  data: DSPData,
): { count: number; minerName: string } {
  const item = data.items.get(itemId);
  if (!item) {
    return { count: 0, minerName: "采矿机" };
  }

  // Default to small miner
  const miner = data.buildings.find((b) => b.name === "采矿机");
  if (!miner) {
    return { count: 0, minerName: "采矿机" };
  }

  // Base mining rate (items/sec): miner speed
  // At VU 0, default coverage = 8 veins
  // Each VU level gives +10% yield (additive on base)
  const baseSpeed = miner.speed; // 0.5 items/sec per vein cluster
  const coveredVeins = 8; // small miner covers ~8 veins
  const vuMultiplier = 1 + veinUtilization * 0.1;

  // Items per second per miner
  const perSec = baseSpeed * coveredVeins * vuMultiplier;

  // Convert to per minute
  const perMin = perSec * 60;

  // Count
  const count = perMin > 0 ? ratePerMinute / perMin : 0;

  return { count, minerName: miner.name };
}
