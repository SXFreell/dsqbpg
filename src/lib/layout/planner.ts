import type { LayoutResult, PlacedDevice } from "./types";
import { getBuildingSize } from "./grid";

/**
 * Input node from the calculator. Mirrors CalcNode fields used by the layout engine.
 */
export interface LayoutNode {
  buildingId: number;
  buildingCount: number;
  recipeId: number;
  depth: number;
}

// ── Column Bookkeeping ───────────────────────────────────────────────

interface Column {
  depth: number;
  nodes: LayoutNode[];
  maxWidth: number;
  x: number; // assigned later
}

/**
 * Layout devices using the v1 linear column strategy.
 *
 * Algorithm:
 * 1. Group devices by production chain depth (raw=leftmost, final=rightmost).
 * 2. Within each depth, stack devices vertically with the given spacing.
 * 3. Each column's width = max building width in that column.
 * 4. Columns are arranged left-to-right, separated by colSpacing tiles.
 *
 * @param nodes - Production nodes from the calculator (in topological order).
 *   Each node has: { buildingId, buildingCount, recipeId, depth }.
 * @param spacing - Vertical gap between buildings in tiles (default: 3).
 * @param colSpacing - Horizontal gap between columns in tiles (default: 6).
 * @returns Complete layout result (belts and sorters are empty in v1).
 */
export function planLayout(
  nodes: LayoutNode[],
  spacing: number = 3,
  colSpacing: number = 6,
): LayoutResult {
  const devices: PlacedDevice[] = [];

  if (nodes.length === 0) {
    return {
      devices: [],
      belts: [],
      sorters: [],
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      totalWidth: 0,
      totalHeight: 0,
    };
  }

  // ── 1. Group nodes by depth ──
  const depthMap = new Map<number, LayoutNode[]>();

  for (const node of nodes) {
    const list = depthMap.get(node.depth);
    if (list) {
      list.push(node);
    } else {
      depthMap.set(node.depth, [node]);
    }
  }

  // ── 2. Build column descriptors sorted by depth ──
  const depths = Array.from(depthMap.keys()).sort((a, b) => a - b);

  const columns: Column[] = depths.map((depth) => {
    const colNodes = depthMap.get(depth)!;
    let maxWidth = 0;

    for (const n of colNodes) {
      const size = getBuildingSize(n.buildingId);
      if (size.width > maxWidth) maxWidth = size.width;
    }

    return { depth, nodes: colNodes, maxWidth, x: 0 };
  });

  // ── 3. Assign x positions for each column ──
  let cursorX = 0;

  for (let ci = 0; ci < columns.length; ci++) {
    const col = columns[ci]!;
    col.x = cursorX;
    cursorX += col.maxWidth;
    if (ci < columns.length - 1) {
      cursorX += colSpacing;
    }
  }

  // ── 4. Place buildings within each column ──
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const col of columns) {
    let cursorY = 0;

    for (const node of col.nodes) {
      const size = getBuildingSize(node.buildingId);
      // Round up fractional building counts — you can't place 0.7 of a building.
      const count = Math.ceil(node.buildingCount);

      for (let i = 0; i < count; i++) {
        const x = col.x;
        const y = cursorY;

        devices.push({
          buildingId: node.buildingId,
          recipeId: node.recipeId,
          position: { x, y },
          rotation: 0,
        });

        // Update bounds
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + size.width > maxX) maxX = x + size.width;
        if (y + size.height > maxY) maxY = y + size.height;

        cursorY += size.height + spacing;
      }
    }
  }

  // ── 5. Build result ──
  // If no devices were placed (e.g. all counts rounded to 0), return empty bounds.
  if (devices.length === 0) {
    return {
      devices: [],
      belts: [],
      sorters: [],
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      totalWidth: 0,
      totalHeight: 0,
    };
  }

  return {
    devices,
    belts: [],
    sorters: [],
    bounds: { minX, minY, maxX, maxY },
    totalWidth: maxX - minX,
    totalHeight: maxY - minY,
  };
}
