import type { DSPData } from "./types";
import { items as allItems } from "./items";
import { recipes } from "./recipes";
import { buildings } from "./buildings";
import { belts } from "./belts";

export { type DSPData } from "./types";
export { type Recipe, type RecipeType, type ProliferatorType } from "./types";
export { type Item, type ItemType } from "./types";
export { type Building } from "./types";
export { type BeltData } from "./types";

export { items as allItems } from "./items";
export { recipes } from "./recipes";
export { buildings, buildingsById } from "./buildings";
export { belts, beltsById, beltMk1, beltMk2, beltMk3 } from "./belts";

export function loadDSPData(): DSPData {
  const items = new Map<number, (typeof allItems)[number]>();
  for (const item of allItems) {
    items.set(item.id, item);
  }

  const recipesByOutput = new Map<number, (typeof recipes)[number][]>();
  const recipesByInput = new Map<number, (typeof recipes)[number][]>();

  for (const recipe of recipes) {
    for (const outputId of recipe.outputItems) {
      const list = recipesByOutput.get(outputId) ?? [];
      list.push(recipe);
      recipesByOutput.set(outputId, list);
    }
    for (const inputId of recipe.inputItems) {
      const list = recipesByInput.get(inputId) ?? [];
      list.push(recipe);
      recipesByInput.set(inputId, list);
    }
  }

  return {
    items,
    recipes,
    buildings,
    belts,
    recipesByOutput,
    recipesByInput,
  };
}
