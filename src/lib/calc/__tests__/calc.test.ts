import { describe, test, expect } from "bun:test";
import { calculate, expandRecipeChain, getRawInputs, calcMiners } from "../index";
import type { CalcTarget, CalcNode } from "../index";
import type { DSPData } from "../../dsp/types";
import { loadDSPData } from "../../dsp/index";

// Load the full game data once
let data: DSPData;
let loaded = false;
function getData(): DSPData {
  if (!loaded) {
    data = loadDSPData();
    loaded = true;
  }
  return data;
}

// ── Helpers for test assertions ──

function findNode(nodes: CalcNode[], itemId: number) {
  return nodes.find((n) => n.itemId === itemId);
}

function round(v: number, places: number = 2): number {
  return Number(v.toFixed(places));
}

// ── Tests ───────────────────────────────────────────────────────────

describe("Core Calculator", () => {
  // Test 1: Simple single-step chain
  test("iron plate at 60/min → 1 smelter, 60 iron ore/min", () => {
    const d = getData();
    const targets: CalcTarget[] = [{ itemId: 1101, ratePerMinute: 60 }];

    const result = calculate(targets, d);

    // Check iron plate node
    const plateNode = findNode(result.nodes, 1101);
    expect(plateNode).toBeDefined();
    expect(round(plateNode!.ratePerMinute)).toBe(60);
    expect(round(plateNode!.buildingCount)).toBe(1);
    expect(plateNode!.buildingName).toBe("电弧熔炉");
    expect(plateNode!.isRaw).toBe(false);

    // Check it has iron ore as input
    expect(plateNode!.inputs.has(1001)).toBe(true);
    if (plateNode!.inputs.has(1001)) {
      expect(round(plateNode!.inputs.get(1001)!)).toBe(60);
    }

    // Check raw consumption
    expect(result.rawConsumption.has(1001)).toBe(true);
    if (result.rawConsumption.has(1001)) {
      expect(round(result.rawConsumption.get(1001)!)).toBe(60);
    }
  });

  // Test 2: Two-step chain
  test("gear at 60/min → includes iron plate, assembler count", () => {
    const d = getData();
    const targets: CalcTarget[] = [{ itemId: 1201, ratePerMinute: 60 }];

    const result = calculate(targets, d);

    // Gear node
    const gearNode = findNode(result.nodes, 1201);
    expect(gearNode).toBeDefined();
    expect(round(gearNode!.ratePerMinute)).toBe(60);

    // With default assembler Mk.I (speed=0.75), gears/min = 45 per assembler
    // 60/45 = 1.333 assemblers
    expect(round(gearNode!.buildingCount)).toBe(1.33);
    expect(gearNode!.buildingName.startsWith("制造台")).toBe(true);
    expect(gearNode!.isRaw).toBe(false);

    // Gear needs iron plates
    expect(gearNode!.inputs.has(1101)).toBe(true);
    if (gearNode!.inputs.has(1101)) {
      expect(round(gearNode!.inputs.get(1101)!)).toBe(60);
    }

    // Iron plate node should exist
    const plateNode = findNode(result.nodes, 1101);
    expect(plateNode).toBeDefined();
    expect(round(plateNode!.ratePerMinute)).toBe(60);
    expect(round(plateNode!.buildingCount)).toBe(1);

    // Raw ore
    expect(result.rawConsumption.has(1001)).toBe(true);
    if (result.rawConsumption.has(1001)) {
      expect(round(result.rawConsumption.get(1001)!)).toBe(60);
    }
  });

  // Test 3: Error on unknown item
  test("throws on unknown item ID", () => {
    const d = getData();
    const targets: CalcTarget[] = [{ itemId: 99999, ratePerMinute: 60 }];

    expect(() => calculate(targets, d)).toThrow("Unknown item ID");
  });

  // Test 4: Empty targets
  test("empty targets returns empty result", () => {
    const d = getData();
    const result = calculate([], d);

    expect(result.nodes).toHaveLength(0);
    expect(result.rawConsumption.size).toBe(0);
    expect(result.totalPowerMW).toBe(0);
  });

  // Test 5: Multiple targets sharing intermediate
  test("iron plate + copper plate share raw inputs", () => {
    const d = getData();
    const targets: CalcTarget[] = [
      { itemId: 1101, ratePerMinute: 60 },   // iron plate
      { itemId: 1104, ratePerMinute: 60 },   // copper plate
    ];

    const result = calculate(targets, d);

    const ironNode = findNode(result.nodes, 1101);
    const copperNode = findNode(result.nodes, 1104);
    expect(ironNode).toBeDefined();
    expect(copperNode).toBeDefined();

    expect(round(ironNode!.buildingCount)).toBe(1);
    expect(round(copperNode!.buildingCount)).toBe(1);

    expect(result.rawConsumption.has(1001)).toBe(true); // iron ore
    expect(result.rawConsumption.has(1002)).toBe(true); // copper ore
    if (result.rawConsumption.has(1001)) {
      expect(round(result.rawConsumption.get(1001)!)).toBe(60);
    }
    if (result.rawConsumption.has(1002)) {
      expect(round(result.rawConsumption.get(1002)!)).toBe(60);
    }
  });

  // Test 6: Verify building power is computed
  test("nodes include power consumption", () => {
    const d = getData();
    const targets: CalcTarget[] = [{ itemId: 1101, ratePerMinute: 60 }];

    const result = calculate(targets, d);

    // Smelter: 6000 workEnergyPerTick * 0.00006 MW = 0.36 MW per smelter
    const plateNode = findNode(result.nodes, 1101);
    expect(plateNode).toBeDefined();
    expect(plateNode!.powerMW).toBeGreaterThan(0);
    expect(result.totalPowerMW).toBeGreaterThan(0);
  });
});

describe("Recipe Chain Utilities", () => {
  test("expandRecipeChain for iron plate returns the smelting recipe", () => {
    const d = getData();
    const chain = expandRecipeChain(1101, d);

    expect(chain.length).toBeGreaterThanOrEqual(1);
    expect(chain[0]!.outputItems).toContain(1101);
  });

  test("expandRecipeChain for gear returns iron plate then gear", () => {
    const d = getData();
    const chain = expandRecipeChain(1201, d);

    // Should have iron plate recipe (id=1) first, then gear recipe (id=5)
    expect(chain.length).toBeGreaterThanOrEqual(2);
    const recipeIds = chain.map((r) => r.id);
    expect(recipeIds).toContain(1);  // iron plate
    expect(recipeIds).toContain(5);  // gear
  });

  test("getRawInputs for iron plate returns iron ore", () => {
    const d = getData();
    const raws = getRawInputs(1101, d);

    expect(raws).toContain(1001); // iron ore
  });

  test("getRawInputs for gear returns iron ore", () => {
    const d = getData();
    const raws = getRawInputs(1201, d);

    expect(raws).toContain(1001); // iron ore
    // gear → iron plate → iron ore (no copper needed for simple gear)
  });
});

describe("Mining Calculation", () => {
  test("calcMiners for iron ore at 60/min with VU=0", () => {
    const d = getData();
    const result = calcMiners(1001, 60, 0, d);

    // Small miner: speed=0.5, covers 8 veins → 0.5*8*1 = 4 items/sec = 240 items/min
    // Need: 60/240 = 0.25 miners
    expect(round(result.count)).toBe(0.25);
    expect(result.minerName).toBe("采矿机");
  });

  test("calcMiners for iron ore at high rate with VU=5", () => {
    const d = getData();
    const result = calcMiners(1001, 600, 5, d);

    // VU 5: 1 + 5*0.1 = 1.5 multiplier
    // Miner: 0.5*8*1.5 = 6 items/sec = 360 items/min
    // Need: 600/360 = 1.667 miners
    expect(round(result.count)).toBe(1.67);
  });

  test("calcMiners for unknown item returns 0", () => {
    const d = getData();
    const result = calcMiners(99999, 60, 0, d);

    expect(result.count).toBe(0);
  });
});
