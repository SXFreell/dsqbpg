import type { Recipe, Building, BeltData, DSPData } from "../dsp/types";

/** User's target: produce this item at this rate (items per minute) */
export interface CalcTarget {
  itemId: number;
  ratePerMinute: number; // target production rate in items/min
}

/** Per-recipe settings (mirrors scheme_data in the reference) */
export interface RecipeSettings {
  /** Which building index in the recipe's factory list (0 = first available) */
  buildingIndex: number;
  /** Proliferator mode: 0=none, 1=speed, 2=extra, 4=special */
  proliferatorMode: number;
  /** Proliferator points (level): 0=none, 1/2/3 */
  proliferatorPoints: number;
}

/** Proliferator effect for a given level */
export interface ProliferatorEffect {
  extraProductRate: number;
  speedRate: number;
  powerRate: number;
}

/** Settings that affect calculation behavior */
export interface CalcSettings {
  /** Treat these items as infinite (raw ores). Item IDs. */
  mineralizeList: number[];
  /** Proliferator effects per level (index 0 = none) */
  proliferatorEffects: ProliferatorEffect[];
  /** Whether to proliferate proliferator sprays themselves */
  proliferateItself: boolean;
  /** Vein utilization multiplier */
  miningSpeedMultiple: number;
  /** Covered veins count for small miners */
  coveredVeinsSmall: number;
  /** Covered veins count for large miners */
  coveredVeinsLarge: number;
  /** Large miner efficiency bonus */
  miningEfficiencyLarge: number;
  /** Acceleration rate modifier */
  accRate: number;
  /** Increase rate modifier */
  incRate: number;
  /** Lab stacking count */
  stackResearchLab: number;
  /** Fractionating speed */
  fractionatingSpeed: number;
  /** Icarus manufacturing speed */
  icarusManufacturingSpeed: number;
  /** Per-recipe override settings. Key = recipeId, value = settings */
  recipeSettings?: Map<number, RecipeSettings>;
}

/** Default proliferator effects (0～5 levels, mirroring the game) */
export const DEFAULT_PROLIFERATOR_EFFECTS: ProliferatorEffect[] = [
  { extraProductRate: 1.0, speedRate: 1.0, powerRate: 1.0 },
  { extraProductRate: 1.125, speedRate: 1.25, powerRate: 1.3 },
  { extraProductRate: 1.2, speedRate: 1.5, powerRate: 1.7 },
  { extraProductRate: 1.225, speedRate: 1.75, powerRate: 2.1 },
  { extraProductRate: 1.25, speedRate: 2.0, powerRate: 2.5 },
  { extraProductRate: 1.275, speedRate: 2.25, powerRate: 2.9 },
  { extraProductRate: 1.3, speedRate: 2.5, powerRate: 3.3 },
  { extraProductRate: 1.325, speedRate: 2.75, powerRate: 3.7 },
];

export const DEFAULT_SETTINGS: CalcSettings = {
  mineralizeList: [],
  proliferatorEffects: DEFAULT_PROLIFERATOR_EFFECTS,
  proliferateItself: true,
  miningSpeedMultiple: 1.0,
  coveredVeinsSmall: 8,
  coveredVeinsLarge: 16,
  miningEfficiencyLarge: 3.0,
  accRate: 1.0,
  incRate: 1.0,
  stackResearchLab: 15,
  fractionatingSpeed: 30,
  icarusManufacturingSpeed: 1.0,
};

/** Internal: per-item production graph node */
export interface ItemGraphNode {
  /** Material inputs per unit of output (itemId → amount) */
  inputs: Map<number, number>;
  /** By-products per unit of output (itemId → amount) */
  byproducts: Map<number, number>;
  /** Items that can be produced from this item (itemId → multiplier) */
  produces: Map<number, number>;
  /** Effective recipe execution count per unit of target (incorporates building & proliferator effects) */
  yieldMultiplier: number;
  /** Self-consumption ratio (when item appears in both inputs and outputs) */
  selfConsume: number;
  /** Recipe ID used */
  recipeId: number;
  /** Building ID used */
  buildingId: number;
}

/** One row in the calculation result table */
export interface CalcNode {
  itemId: number;
  itemName: string;
  /** Production rate required (items/min) */
  ratePerMinute: number;
  /** Number of buildings needed */
  buildingCount: number;
  /** Building type used */
  buildingId: number;
  buildingName: string;
  /** Recipe used */
  recipeId: number;
  /** Input materials for this node (itemId → rate/min) */
  inputs: Map<number, number>;
  /** Is this a raw resource (mined)? */
  isRaw: boolean;
  /** Depth in production chain (0 = raw, higher = deeper) */
  depth: number;
  /** Power consumption in MW */
  powerMW: number;
}

export interface CalcResult {
  /** All production nodes in topological order (raw first, final last) */
  nodes: CalcNode[];
  /** Total raw resource consumption (itemId → items/min) */
  rawConsumption: Map<number, number>;
  /** Total power consumption (MW) */
  totalPowerMW: number;
}
