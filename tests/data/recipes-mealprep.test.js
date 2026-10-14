// Data gate for app/data/recipes-mealprep.js (ARCHITECTURE §13, Yusuf): every foodId exists, every
// ingredient foodId exists, boxes ≥ 1, storage ids are valid (RULES.mealPrep.storage). The test
// passes trivially while the file is missing (Sprint 2 in progress) and starts checking the day it
// lands, with no edit. Owner: Kenji.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS, RULES } from '../../app/data/index.js';
import { checkMealprepRecipes } from './_gate.js';

/** The recipes array: the default export, else a named array export, else null (file missing). */
async function loadRecipes() {
  let mod;
  try {
    mod = await import('../../app/data/recipes-mealprep.js');
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
  if (Array.isArray(mod.default)) return mod.default;
  const named = Object.values(mod).find(Array.isArray);
  return named ?? mod.default;
}

const foodsById = new Map(FOODS.map((f) => [f.id, f]));

test('recipes-mealprep.js: foodIds, ingredient foodIds, boxes and storage ids are valid', async (t) => {
  const recipes = await loadRecipes();
  if (recipes === null) {
    t.diagnostic('app/data/recipes-mealprep.js does not exist yet: nothing to check');
    return;
  }
  const { fails, warns } = checkMealprepRecipes(recipes, { foodsById, rules: RULES });
  for (const w of warns) t.diagnostic(`warn ${w.gate} ${w.id}: ${w.message}`);
  assert.deepEqual(
    fails.map((x) => `${x.id} ${x.gate}: ${x.message}`),
    [],
  );
});

test('recipes-mealprep.js: every Lab lunch box has a recipe record (when the file exists)', async (t) => {
  const recipes = await loadRecipes();
  if (recipes === null) {
    t.diagnostic('app/data/recipes-mealprep.js does not exist yet');
    return;
  }
  const have = new Set(recipes.map((r) => r.foodId));
  const missing = FOODS.filter((f) => f.group === 'lunchbox' && !have.has(f.id)).map((f) => f.id);
  assert.deepEqual(missing, [], 'lunch boxes without a recipe record (no shopping list for them)');
});
