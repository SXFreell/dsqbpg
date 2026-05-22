import { describe, test, expect } from "bun:test";
import { planLayout, checkOverlap, getBuildingSize } from "../index";
import type { LayoutNode } from "../planner";

// ── Helpers ──

/** Shorthand: create a layout node with sensible defaults. */
function node(
  buildingId: number,
  buildingCount: number,
  recipeId: number = 1,
  depth: number = 0,
): LayoutNode {
  return { buildingId, buildingCount, recipeId, depth };
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Verify no pair of devices overlaps. */
function assertNoOverlaps(devices: { buildingId: number; position: { x: number; y: number } }[]) {
  for (let i = 0; i < devices.length; i++) {
    const a = devices[i]!;
    const aSize = getBuildingSize(a.buildingId);
    for (let j = i + 1; j < devices.length; j++) {
      const b = devices[j]!;
      const bSize = getBuildingSize(b.buildingId);
      expect(
        checkOverlap(a.position, aSize, b.position, bSize),
      ).toBe(false);
    }
  }
}

// ── Tests ────────────────────────────────────────────────────────────

describe("v1 Linear Layout Engine", () => {
  // ── Test 1: Single device ──
  test("single assembler placed at origin", () => {
    const result = planLayout([node(2303, 1)]); // Assembler Mk.I, 4×4

    expect(result.devices).toHaveLength(1);
    expect(result.devices[0]!.position).toEqual({ x: 0, y: 0 });
    expect(result.devices[0]!.buildingId).toBe(2303);
    expect(result.devices[0]!.rotation).toBe(0);

    expect(result.bounds).toEqual({ minX: 0, minY: 0, maxX: 4, maxY: 4 });
    expect(result.totalWidth).toBe(4);
    expect(result.totalHeight).toBe(4);
    expect(result.belts).toEqual([]);
    expect(result.sorters).toEqual([]);
  });

  // ── Test 2: Two devices, same depth → vertical stacking ──
  test("two smelters stacked vertically in same column", () => {
    const result = planLayout([node(2302, 2)]); // Smelter, 3×6, spacing=3

    expect(result.devices).toHaveLength(2);

    // Both at x=0 (same column)
    expect(result.devices[0]!.position).toEqual({ x: 0, y: 0 });
    expect(result.devices[1]!.position.x).toBe(0);

    // Second smelter is below the first with spacing
    // Smelter height=6, spacing=3 → second at y=6+3=9
    expect(result.devices[1]!.position.y).toBe(9);

    // No overlap
    assertNoOverlaps(result.devices);

    // Bounds: column width=3, height spans both smelters
    expect(result.bounds.minX).toBe(0);
    expect(result.bounds.minY).toBe(0);
    expect(result.bounds.maxX).toBe(3);
    expect(result.bounds.maxY).toBe(15); // 0 + 6 + 3 + 6
    expect(result.totalWidth).toBe(3);
    expect(result.totalHeight).toBe(15);
  });

  // ── Test 3: Two depths → two columns ──
  test("two depths produce separate columns", () => {
    const result = planLayout([
      node(2302, 1, 1, 0), // Smelter 3×6, depth=0
      node(2303, 1, 2, 1), // Assembler 4×4, depth=1
    ]);

    expect(result.devices).toHaveLength(2);

    // Smelter at column 0, x=0
    const smelter = result.devices[0]!;
    expect(smelter.position).toEqual({ x: 0, y: 0 });
    expect(smelter.buildingId).toBe(2302);

    // Assembler at column 1: x = column0_maxWidth(3) + colSpacing(6) = 9
    const assembler = result.devices[1]!;
    expect(assembler.position.x).toBe(9);
    expect(assembler.position.y).toBe(0);
    expect(assembler.buildingId).toBe(2303);

    assertNoOverlaps(result.devices);

    // Bounds span both columns
    expect(result.bounds.maxX).toBe(13); // 9 + 4
    expect(result.bounds.maxY).toBe(6);  // max(6, 4) = 6 from smelter
    expect(result.totalWidth).toBe(13);
    expect(result.totalHeight).toBe(6);
  });

  // ── Test 4: No overlap across many devices ──
  test("ten devices across three depths have zero overlaps", () => {
    const result = planLayout([
      node(2302, 3, 1, 0), // 3 smelters (3×6) at depth 0
      node(2303, 4, 2, 1), // 4 assemblers (4×4) at depth 1
      node(2302, 3, 3, 2), // 3 smelters (3×6) at depth 2
    ]);

    expect(result.devices.length).toBeGreaterThanOrEqual(10);
    assertNoOverlaps(result.devices);
  });

  // ── Test 5: Deterministic output ──
  test("deterministic — same input produces identical output", () => {
    const input: LayoutNode[] = [
      node(2302, 2, 1, 0),
      node(2303, 1, 2, 1),
      node(2302, 3, 3, 2),
    ];

    const a = planLayout(input);
    const b = planLayout(deepClone(input));

    expect(a).toEqual(b);

    // Run a third time with different argument-passing to flush out any
    // accidental shared-mutation bugs.
    const c = planLayout([
      { buildingId: 2302, buildingCount: 2, recipeId: 1, depth: 0 },
      { buildingId: 2303, buildingCount: 1, recipeId: 2, depth: 1 },
      { buildingId: 2302, buildingCount: 3, recipeId: 3, depth: 2 },
    ]);

    expect(a).toEqual(c);
  });

  // ── Test 6: Empty input ──
  test("empty input returns empty result without errors", () => {
    const result = planLayout([]);

    expect(result.devices).toEqual([]);
    expect(result.belts).toEqual([]);
    expect(result.sorters).toEqual([]);
    expect(result.bounds).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
    expect(result.totalWidth).toBe(0);
    expect(result.totalHeight).toBe(0);
  });

  // ── Bonus: custom spacing arguments are respected ──
  test("custom spacing and colSpacing are respected", () => {
    const result = planLayout(
      [node(2303, 2, 1, 0)], // Two 4×4 assemblers, depth 0
      10,  // vertical spacing
      20,  // column spacing
    );

    expect(result.devices).toHaveLength(2);
    expect(result.devices[0]!.position).toEqual({ x: 0, y: 0 });
    // Second at y = 0 + 4 + 10 = 14
    expect(result.devices[1]!.position).toEqual({ x: 0, y: 14 });

    assertNoOverlaps(result.devices);
  });

  // ── Bonus: fractional building counts are rounded up ──
  test("fractional building counts are rounded up", () => {
    const result = planLayout([node(2303, 0.7, 1, 0)]);

    // 0.7 → ceil → 1 building
    expect(result.devices).toHaveLength(1);
  });
});

describe("getBuildingSize", () => {
  test("known buildings return correct sizes", () => {
    expect(getBuildingSize(2302)).toEqual({ width: 3, height: 6 });  // Smelter
    expect(getBuildingSize(2303)).toEqual({ width: 4, height: 4 });  // Assembler Mk.I
    expect(getBuildingSize(2308)).toEqual({ width: 6, height: 12 }); // Oil Refinery
    expect(getBuildingSize(2310)).toEqual({ width: 8, height: 14 }); // Collider
  });

  test("unknown buildings return 4×4 default", () => {
    expect(getBuildingSize(99999)).toEqual({ width: 4, height: 4 });
  });
});

describe("checkOverlap", () => {
  test("adjacent buildings (touching edges) do NOT overlap", () => {
    // A: [0,4)×[0,4)  B: [4,8)×[0,4) — touching on right edge
    expect(
      checkOverlap(
        { x: 0, y: 0 }, { width: 4, height: 4 },
        { x: 4, y: 0 }, { width: 4, height: 4 },
      ),
    ).toBe(false);
  });

  test("overlapping buildings return true", () => {
    expect(
      checkOverlap(
        { x: 0, y: 0 }, { width: 5, height: 5 },
        { x: 3, y: 2 }, { width: 5, height: 5 },
      ),
    ).toBe(true);
  });

  test("completely separated buildings return false", () => {
    expect(
      checkOverlap(
        { x: 0, y: 0 }, { width: 2, height: 2 },
        { x: 10, y: 10 }, { width: 2, height: 2 },
      ),
    ).toBe(false);
  });
});
