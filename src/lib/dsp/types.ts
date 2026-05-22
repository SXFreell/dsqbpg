/** Recipe type: 1=smelting, 2=chemical, 3=refining, 4=particle, 5=research, 6=other */
export type RecipeType = 1 | 2 | 3 | 4 | 5 | 6;

/** Item category: 1=raw, 2=intermediate, 3=final, 4=logistics, 5=building, 6=production */
export type ItemType = 1 | 2 | 3 | 4 | 5 | 6;

/** Proliferator support: 0=none, 1=charging-only, 3=speed+extra, 4=special (lens) */
export type ProliferatorType = 0 | 1 | 3 | 4;

export interface Recipe {
  id: number;
  type: number;
  name: string;
  factoryIds: number[];
  inputItems: number[];
  inputCounts: number[];
  outputItems: number[];
  outputCounts: number[];
  timeSpend: number;
  proliferator: ProliferatorType;
  iconName: string;
}

export interface Item {
  id: number;
  type: number;
  name: string;
  gridIndex: number;
  iconName: string;
}

export interface Building extends Item {
  workEnergyPerTick: number;
  speed: number;
  space: number;
}

export interface BeltData {
  id: number;
  name: string;
  speed: number;
}

export interface DSPData {
  items: Map<number, Item>;
  recipes: Recipe[];
  buildings: Building[];
  belts: BeltData[];
  /** Lookup: item ID → recipes that produce this item */
  recipesByOutput: Map<number, Recipe[]>;
  /** Lookup: item ID → recipes that consume this item */
  recipesByInput: Map<number, Recipe[]>;
}
