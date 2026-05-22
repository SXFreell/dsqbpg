import solver from "javascript-lp-solver";
import type { DSPData, Building } from "../dsp/types";
import {
  type CalcTarget,
  type CalcResult,
  type CalcNode,
  type CalcSettings,
  type ItemGraphNode,
  type RecipeSettings,
  DEFAULT_SETTINGS,
} from "./types";

// ── Helpers ─────────────────────────────────────────────────────────

function itemName(data: DSPData, id: number): string {
  return data.items.get(id)?.name ?? `Unknown#${id}`;
}

function isRawItem(data: DSPData, itemId: number, mineralize: Set<number>): boolean {
  if (mineralize.has(itemId)) return true;
  const recipes = data.recipesByOutput.get(itemId);
  if (!recipes || recipes.length === 0) return true;
  return recipes.every((r) => r.inputItems.length === 0);
}

function getBuilding(buildingId: number, data: DSPData): Building | undefined {
  return data.buildings.find((b) => b.id === buildingId);
}

// ── Item Graph Builder ─────────────────────────────────────────────

interface BuildContext {
  data: DSPData;
  settings: CalcSettings;
  recipeSettings: Map<number, RecipeSettings>;
}

/**
 * Build a production graph for all craftable items.
 * Each node captures: inputs per unit output, yield per second per building,
 * byproducts, recipe and building IDs.
 */
function buildItemGraph(ctx: BuildContext): Map<number, ItemGraphNode> {
  const { data, settings } = ctx;
  const graph = new Map<number, ItemGraphNode>();

  for (const [itemId] of data.items) {
    const recipes = data.recipesByOutput.get(itemId);
    if (!recipes || recipes.length === 0) continue;

    // ── Pick recipe ──
    const recipe = recipes[0]!;
    const cfg = settings.recipeSettings?.get(recipe.id);

    // ── Pick building ──
    const bIdx = cfg?.buildingIndex ?? 0;
    const bId = recipe.factoryIds[bIdx] ?? recipe.factoryIds[0]!;
    const building = getBuilding(bId, data);
    if (!building) continue;

    // ── Normalize time ──
    const timeSec = recipe.timeSpend / 60;       // ticks → seconds
    const outputPerCycle = recipe.outputItems
      .reduce((sum, outId, i) =>
        outId === itemId ? sum + (recipe.outputCounts[i] ?? 0) : sum, 0);

    // yieldMultiplier = items / second / building  (before proliferator / mining)
    let yieldMult = outputPerCycle / timeSec;

    // ── Inputs per unit output ──
    const inputs = new Map<number, number>();
    let totalRatio = 0;
    for (let i = 0; i < recipe.inputItems.length; i++) {
      const inId = recipe.inputItems[i]!;
      const inCt = recipe.inputCounts[i]!;
      const ratio = inCt / outputPerCycle;
      inputs.set(inId, ratio);
      totalRatio += ratio;
    }

    // ── By-products ──
    const byproducts = new Map<number, number>();
    for (let i = 0; i < recipe.outputItems.length; i++) {
      const outId = recipe.outputItems[i]!;
      if (outId === itemId) continue;
      const outCt = recipe.outputCounts[i]!;
      byproducts.set(outId, outCt / outputPerCycle);
    }

    // ── Proliferator (simplified Phase 2) ──
    const pm = cfg?.proliferatorMode ?? 0;
    const pp = cfg?.proliferatorPoints ?? 0;
    if (pm > 0 && pp > 0) {
      const eff = settings.proliferatorEffects[pp];
      if (eff) {
        if (pm === 1) yieldMult *= eff.speedRate * settings.accRate;
        else if (pm === 2) yieldMult *= eff.extraProductRate * settings.incRate;
        // mode 4 (fractionator) not implemented in phase 2
      }
    }

    // ── Self-consumption ──
    let selfConsume = 0;
    const selfInput = inputs.get(itemId);
    if (selfInput !== undefined) {
      const denom = 1 - selfInput;
      if (denom > 0) {
        const sc = 1 / denom;
        yieldMult /= sc;
        selfConsume = sc - 1;
        inputs.delete(itemId);
        for (const [k, v] of inputs) inputs.set(k, v * sc);
        for (const [k, v] of byproducts) byproducts.set(k, v * sc);
      }
    }

    // ── Building speed ──
    yieldMult *= building.speed;

    // ── Mining / special multiplier ──
    yieldMult = applyMiningMult(yieldMult, building, itemId, data, settings);

    graph.set(itemId, {
      inputs,
      byproducts,
      produces: new Map(),
      yieldMultiplier: yieldMult,
      selfConsume,
      recipeId: recipe.id,
      buildingId: building.id,
    });
  }

  // ── Reverse edges: which items can be made from each input ──
  for (const [, node] of graph) {
    for (const [inId] of node.inputs) {
      const inNode = graph.get(inId);
      if (inNode) {
        const amount = node.inputs.get(inId) ?? 1;
        inNode.produces.set(node.recipeId, 1 / amount);
      }
    }
  }

  return graph;
}

function applyMiningMult(
  out: number, bld: Building, itemId: number,
  data: DSPData, s: CalcSettings,
): number {
  const n = bld.name;
  if (n === "采矿机")                return out * s.miningSpeedMultiple * s.coveredVeinsSmall;
  if (n === "大型采矿机")            return out * s.miningSpeedMultiple * s.coveredVeinsLarge * s.miningEfficiencyLarge;
  if (n === "原油萃取站")            return out * s.miningSpeedMultiple;
  if (n.includes("分馏塔"))          return out * s.fractionatingSpeed;
  if (n === "伊卡洛斯")             return out * s.icarusManufacturingSpeed;
  return out;
}

// ── Topological Sort ───────────────────────────────────────────────

interface TopoResult {
  ordered: number[];        // raw → final
  cycleKeys: number[];
}

function topologicalSort(
  graph: Map<number, ItemGraphNode>,
  rawIds: Set<number>,
): TopoResult {
  const ordered: number[] = [];
  const done = new Set<number>();
  const remaining = new Map(graph);

  // Remove raw items immediately
  for (const id of rawIds) {
    ordered.push(id);
    done.add(id);
    remaining.delete(id);
  }

  let progress = true;
  while (progress && remaining.size) {
    progress = false;
    const ready: number[] = [];
    for (const [id, node] of remaining) {
      let ok = true;
      for (const inId of node.inputs.keys()) {
        if (!done.has(inId) && !rawIds.has(inId)) { ok = false; break; }
      }
      if (ok) ready.push(id);
    }
    for (const id of ready) {
      ordered.push(id);
      done.add(id);
      remaining.delete(id);
      progress = true;
    }
  }

  // Remaining = cycles
  const cycleKeys: number[] = [];
  if (remaining.size) {
    // Choose one node to "break" the cycle
    let best: number | undefined;
    let bestScore = -1;
    for (const [id, node] of remaining) {
      const s = node.inputs.size + node.produces.size;
      if (s > bestScore) { bestScore = s; best = id; }
    }
    if (best !== undefined) {
      cycleKeys.push(best);
      ordered.push(best);
      done.add(best);
      remaining.delete(best);

      // Try again
      progress = true;
      while (progress && remaining.size) {
        progress = false;
        const ready: number[] = [];
        for (const [id, node] of remaining) {
          let ok = true;
          for (const inId of node.inputs.keys()) {
            if (!done.has(inId) && !rawIds.has(inId)) { ok = false; break; }
          }
          if (ok) ready.push(id);
        }
        for (const id of ready) {
          ordered.push(id);
          done.add(id);
          remaining.delete(id);
          progress = true;
        }
      }

      for (const id of remaining.keys()) ordered.push(id);
    }
  }

  return { ordered, cycleKeys };
}

// ── LP Solver ──────────────────────────────────────────────────────

function runLP(
  demands: Map<number, number>,   // itemId → net demand (items/sec)
  graph: Map<number, ItemGraphNode>,
  _data: DSPData,
  _settings: CalcSettings,
): Map<number, number> {          // itemId → recipe executions/sec
  const result = new Map<number, number>();
  if (demands.size === 0) return result;

  type Vars = Record<string, number>;
  const model: {
    optimize: "cost";
    opType: "min";
    constraints: Record<string, { min: number }>;
    variables: Record<string, Vars>;
  } = {
    optimize: "cost",
    opType: "min",
    constraints: {},
    variables: {},
  };

  for (const [itemId, demand] of demands) {
    const vn = `i${itemId}`;
    model.constraints[vn] = { min: demand };

    const node = graph.get(itemId);
    const vars: Vars = { cost: node ? 1 : 0 };

    // Output
    vars[vn] = 1;

    if (node) {
      // Inputs (negative)
      for (const [inId, ratio] of node.inputs) {
        const ik = `i${inId}`;
        vars[ik] = (vars[ik] ?? 0) - ratio;
      }
      // By-products (positive)
      for (const [byId, ratio] of node.byproducts) {
        const bk = `i${byId}`;
        vars[bk] = (vars[bk] ?? 0) + ratio;
      }
    }

    model.variables[vn] = vars;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const solution = solver.Solve(model as any);

  if (!solution.feasible) {
    throw new Error("线性规划无解,请检查来源配方设定是否可能满足需求");
  }

  for (const [k, v] of Object.entries(solution)) {
    if (k === "result" || k === "feasible" || k === "bounded") continue;
    const id = parseInt(k.slice(1), 10);
    if (!isNaN(id) && typeof v === "number" && v > 1e-10) {
      result.set(id, v);
    }
  }

  return result;
}

// ── Chain expansion ────────────────────────────────────────────────

/**
 * Expand targets into their full production chain.
 * Returns: net demands (items/sec for each item, >0 = need, <0 = surplus).
 *
 * Iterates until all demands are fully expanded (or max rounds reached).
 */
function expandChain(
  targets: CalcTarget[],
  graph: Map<number, ItemGraphNode>,
  _ordered: number[],
  cycleKeySet: Set<number>,
  rawSet: Set<number>,
): Map<number, number> {
  const net = new Map<number, number>();

  // Initial targets (items/min → items/sec)
  for (const t of targets) {
    net.set(t.itemId, (net.get(t.itemId) ?? 0) + t.ratePerMinute / 60);
  }

  // Queue of items that need expansion
  const queue: number[] = [];
  const inQueue = new Set<number>();

  for (const t of targets) {
    if (!rawSet.has(t.itemId) && !cycleKeySet.has(t.itemId) && graph.has(t.itemId)) {
      queue.push(t.itemId);
      inQueue.add(t.itemId);
    }
  }

  let iterations = 0;
  const MAX_ITERATIONS = 1000;

  while (queue.length > 0 && iterations++ < MAX_ITERATIONS) {
    const itemId = queue.shift()!;
    inQueue.delete(itemId);

    if (rawSet.has(itemId)) continue;
    if (cycleKeySet.has(itemId)) continue;

    const d = net.get(itemId);
    if (!d || d <= 0) continue;

    const node = graph.get(itemId);
    if (!node) continue;

    // Expand inputs
    for (const [inId, ratio] of node.inputs) {
      const prev = net.get(inId) ?? 0;
      net.set(inId, prev + d * ratio);

      // If this input wasn't in the queue and needs expansion, add it
      if (!rawSet.has(inId) && !cycleKeySet.has(inId)
          && graph.has(inId) && !inQueue.has(inId)) {
        queue.push(inId);
        inQueue.add(inId);
      }
    }

    // Subtract byproducts
    for (const [byId, ratio] of node.byproducts) {
      const prev = net.get(byId) ?? 0;
      net.set(byId, prev - d * ratio);
    }
  }

  return net;
}

// ── Main Entry Point ───────────────────────────────────────────────

/**
 * Core calculator: given production targets, compute all buildings
 * and raw material requirements.
 *
 * Unit convention: internally uses **items / second**.
 * Public API accepts & returns **items / minute**.
 */
export function calculate(
  targets: CalcTarget[],
  data: DSPData,
  settings?: Partial<CalcSettings>,
): CalcResult {
  // ── Validate ──
  for (const t of targets) {
    if (!data.items.has(t.itemId)) {
      throw new Error(`Unknown item ID: ${t.itemId}`);
    }
  }

  if (targets.length === 0) {
    return { nodes: [], rawConsumption: new Map(), totalPowerMW: 0 };
  }

  const s: CalcSettings = { ...DEFAULT_SETTINGS, ...settings };
  const recipeSettings = s.recipeSettings ?? new Map<number, RecipeSettings>();

  // ── Identify raw items ──
  const mineralize = new Set(s.mineralizeList);
  const rawIds = new Set<number>();
  for (const [itemId] of data.items) {
    if (isRawItem(data, itemId, mineralize)) rawIds.add(itemId);
  }

  // ── Build graph ──
  const ctx: BuildContext = { data, settings: s, recipeSettings };
  const graph = buildItemGraph(ctx);

  // ── Topological sort ──
  const { ordered, cycleKeys } = topologicalSort(graph, rawIds);
  const cycleKeySet = new Set(cycleKeys);

  // ── Expand chain ──
  const netDemands = expandChain(targets, graph, ordered, cycleKeySet, rawIds);

  // ── LP for cycle items ──
  const lpDemands = new Map<number, number>();
  const lpResults = new Map<number, number>();

  for (const [itemId, d] of netDemands) {
    if (d > 0 && cycleKeySet.has(itemId)) {
      lpDemands.set(itemId, d);
      netDemands.delete(itemId); // LP will resolve this
    }
  }

  if (lpDemands.size > 0) {
    const lpr = runLP(lpDemands, graph, data, s);
    for (const [itemId, executions] of lpr) {
      const node = graph.get(itemId);
      if (!node) continue;
      // LP variable value = recipe executions/sec
      // Actual production rate = executions * yieldMultiplier
      const rate = executions * node.yieldMultiplier;
      lpResults.set(itemId, rate);

      // Propagate LP results to inputs
      for (const [inId, ratio] of node.inputs) {
        lpResults.set(inId, (lpResults.get(inId) ?? 0) + rate * ratio);
      }
    }
  }

  // ── Merge LP results into netDemands ──
  for (const [itemId, rate] of lpResults) {
    netDemands.set(itemId, (netDemands.get(itemId) ?? 0) + rate);
  }

  // ── Build result nodes ──
  const nodes: CalcNode[] = [];
  let totalPowerMW = 0;

  // Assign depths
  const depth = new Map<number, number>();
  for (const id of ordered) {
    const node = graph.get(id);
    let maxInDepth = 0;
    if (node) {
      for (const inId of node.inputs.keys()) {
        const d = depth.get(inId) ?? 0;
        if (d > maxInDepth) maxInDepth = d;
      }
    }
    depth.set(id, rawIds.has(id) ? 0 : maxInDepth + 1);
  }

  for (const [itemId, ratePerSec] of netDemands) {
    if (ratePerSec <= 1e-10) continue; // negligible / surplus only

    const ratePerMin = ratePerSec * 60;
    const node = graph.get(itemId);

    if (rawIds.has(itemId)) {
      // ── Raw resource ──
      const miner = getMiner(itemId, data);
      const mBld = data.buildings.find((b) => b.name === miner);
      let minerYield = 1;
      let mCount = 1;

      if (mBld) {
        // Base mining rate: Speed * (60 sec / 1 sec mining time) = items / sec
        const baseYield = mBld.speed;
        const special = applyMiningMult(baseYield, mBld, itemId, data, s);
        minerYield = special;
        mCount = special > 0 ? ratePerSec / special : 0;
      }

      const powerMW = mBld ? mCount * mBld.workEnergyPerTick * 0.00006 : 0;

      nodes.push({
        itemId,
        itemName: itemName(data, itemId),
        ratePerMinute: ratePerMin,
        buildingCount: mCount,
        buildingId: mBld?.id ?? 0,
        buildingName: miner,
        recipeId: 0,
        inputs: new Map(),
        isRaw: true,
        depth: depth.get(itemId) ?? 0,
        powerMW,
      });

      totalPowerMW += powerMW;
    } else if (node) {
      // ── Crafted item ──
      // buildings = rate / yieldMultiplier
      const bCount = node.yieldMultiplier > 0
        ? ratePerSec / node.yieldMultiplier
        : 0;
      const bld = getBuilding(node.buildingId, data);
      const bName = bld?.name ?? `Building#${node.buildingId}`;
      const powerMW = bld ? bCount * bld.workEnergyPerTick * 0.00006 : 0;

      const inputRates = new Map<number, number>();
      for (const [inId, ratio] of node.inputs) {
        inputRates.set(inId, ratePerMin * ratio);
      }

      nodes.push({
        itemId,
        itemName: itemName(data, itemId),
        ratePerMinute: ratePerMin,
        buildingCount: bCount,
        buildingId: node.buildingId,
        buildingName: bName,
        recipeId: node.recipeId,
        inputs: inputRates,
        isRaw: false,
        depth: depth.get(itemId) ?? 1,
        powerMW,
      });

      totalPowerMW += powerMW;
    }
    // else: item in demand but no recipe/building → skip (shouldn't happen)
  }

  // Sort: raw first, then by depth
  nodes.sort((a, b) => {
    if (a.isRaw !== b.isRaw) return a.isRaw ? -1 : 1;
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.itemId - b.itemId;
  });

  // ── Raw consumption map ──
  const rawConsumption = new Map<number, number>();
  for (const n of nodes) {
    if (n.isRaw) {
      rawConsumption.set(n.itemId, n.ratePerMinute);
    }
  }

  return { nodes, rawConsumption, totalPowerMW };
}

function getMiner(itemId: number, data: DSPData): string {
  const n = data.items.get(itemId)?.name ?? "";
  if (n === "水") return "抽水站";
  if (n === "原油") return "原油萃取站";
  return "采矿机";
}
