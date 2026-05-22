import type { DSPData, Recipe } from "../dsp/types";

/**
 * Check whether an item is effectively raw: no recipe produces it,
 * or all its recipes have zero inputs (extraction/mining only).
 */
function isEffectivelyRaw(itemId: number, data: DSPData): boolean {
  const recipes = data.recipesByOutput.get(itemId);
  if (!recipes || recipes.length === 0) return true;
  return recipes.every((r) => r.inputItems.length === 0);
}

/**
 * Expand a recipe chain: given a final product, return all recipes
 * needed to produce it, in consumption order (raw first).
 *
 * Items with zero-input recipes (e.g., mining extraction) are
 * considered raw and are NOT included.
 */
export function expandRecipeChain(
  targetItemId: number,
  data: DSPData,
  maxDepth?: number,
): Recipe[] {
  const result: Recipe[] = [];
  const added = new Set<number>();

  function walk(itemId: number, depth: number): void {
    if (maxDepth !== undefined && depth > maxDepth) return;

    if (isEffectivelyRaw(itemId, data)) return;

    const recipes = data.recipesByOutput.get(itemId);
    if (!recipes || recipes.length === 0) return;

    const recipe = recipes[0];
    if (!recipe) return;

    // Recurse into inputs first (raw materials first in output)
    for (const inputId of recipe.inputItems) {
      walk(inputId, depth + 1);
    }

    if (!added.has(recipe.id)) {
      added.add(recipe.id);
      result.push(recipe);
    }
  }

  walk(targetItemId, 0);
  return result;
}

/**
 * Get all raw items needed for a given item.
 *
 * An item is "raw" if:
 * - It has no recipe producing it, OR
 * - All its recipes have zero inputs (extraction/mining recipes)
 */
export function getRawInputs(itemId: number, data: DSPData): number[] {
  const rawIds = new Set<number>();
  const visited = new Set<number>();

  function walk(id: number): void {
    if (visited.has(id)) return;
    visited.add(id);

    if (isEffectivelyRaw(id, data)) {
      rawIds.add(id);
      return;
    }

    const recipes = data.recipesByOutput.get(id);
    if (!recipes || recipes.length === 0) return;

    const recipe = recipes[0];
    if (!recipe) return;

    for (const inputId of recipe.inputItems) {
      walk(inputId);
    }
  }

  walk(itemId);
  return Array.from(rawIds).sort((a, b) => a - b);
}
