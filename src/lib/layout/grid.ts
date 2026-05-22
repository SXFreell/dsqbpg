import type { GridPos, GridSize } from "./types";

// ── Building Footprint Database ──────────────────────────────────────
// Standard DSP building sizes in grid tiles.

const BUILDING_SIZES = new Map<number, GridSize>([
  // Mining
  [2301, { width: 6, height: 6 }],   // 采矿机 (Mining Machine)
  [2316, { width: 8, height: 16 }],  // 大型采矿机 (Advanced Mining Machine)

  // Smelting
  [2302, { width: 3, height: 6 }],   // 电弧熔炉 (Arc Smelter)
  [2315, { width: 3, height: 6 }],   // 位面熔炉 (Plane Smelter)
  [2319, { width: 3, height: 6 }],   // 负熵熔炉 (Negentropy Smelter)

  // Assembly
  [2303, { width: 4, height: 4 }],   // 制造台 Mk.I (Assembling Machine Mk.I)
  [2304, { width: 4, height: 4 }],   // 制造台 Mk.II
  [2305, { width: 4, height: 4 }],   // 制造台 Mk.III
  [2318, { width: 4, height: 4 }],   // 重组式制造台 (Reforming Assembler)

  // Fluid / Chemical
  [2306, { width: 5, height: 5 }],   // 抽水站 (Water Pump)
  [2307, { width: 6, height: 6 }],   // 原油萃取站 (Oil Extractor)
  [2308, { width: 6, height: 12 }],  // 原油精炼厂 (Oil Refinery)
  [2309, { width: 5, height: 8 }],   // 化工厂 (Chemical Plant)
  [2317, { width: 5, height: 8 }],   // 量子化工厂 (Quantum Chemical Plant)
  [2310, { width: 8, height: 14 }],  // 微型粒子对撞机 (Mini Particle Collider)

  // Special
  [2314, { width: 4, height: 12 }],  // 分馏塔 (Fractionator)

  // Research
  [2901, { width: 5, height: 5 }],   // 矩阵研究站 (Matrix Lab)
  [2902, { width: 5, height: 5 }],   // 矩阵研究站 (Matrix Lab - upgraded)

  // Belts (conveyors)
  [2001, { width: 1, height: 1 }],   // 传送带 Mk.I
  [2002, { width: 1, height: 1 }],   // 传送带 Mk.II
  [2003, { width: 1, height: 1 }],   // 传送带 Mk.III

  // Sorters
  [2011, { width: 1, height: 1 }],   // 分拣器 Mk.I
  [2012, { width: 1, height: 1 }],   // 分拣器 Mk.II
  [2013, { width: 1, height: 1 }],   // 分拣器 Mk.III

  // Storage
  [2101, { width: 5, height: 5 }],   // 小型储物仓 Mk.I
  [2102, { width: 6, height: 8 }],   // 大型储物仓 Mk.II
  [2106, { width: 5, height: 5 }],   // 储液罐 (Storage Tank)
]);

const DEFAULT_SIZE: GridSize = { width: 4, height: 4 };

/**
 * Get the grid footprint of a building by its item ID.
 * Returns a sensible default (4×4) for unknown buildings.
 */
export function getBuildingSize(buildingId: number): GridSize {
  return BUILDING_SIZES.get(buildingId) ?? DEFAULT_SIZE;
}

/**
 * Check whether two axis-aligned rectangles overlap.
 * Rectangles are defined by their top-left corner and size.
 * Touching edges (adjacent but not overlapping) return false.
 */
export function checkOverlap(
  a: GridPos,
  aSize: GridSize,
  b: GridPos,
  bSize: GridSize,
): boolean {
  // Use strict < so that adjacent (touching) buildings are NOT considered overlapping.
  return (
    a.x < b.x + bSize.width &&
    a.x + aSize.width > b.x &&
    a.y < b.y + bSize.height &&
    a.y + aSize.height > b.y
  );
}

/**
 * Compute Manhattan (grid) distance between two points.
 * Suitable for quick proximity checks on a rectilinear grid.
 */
export function gridDistance(a: GridPos, b: GridPos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
