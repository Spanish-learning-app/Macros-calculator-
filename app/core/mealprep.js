// Whole-pot recipes, meal-prep batches, use-by and shopping lists. Pure: no I/O, no clock.
// Owner: Lena (Sprint 2). Contract: docs/ARCHITECTURE.md §13 and §13.2.
import { addDays, isISODate } from './dates.js';
import {
  NUTRIENT_KEYS,
  HALAL_STATUSES,
  findServing,
  gramsForPortion,
  nutrientsForGrams,
  sumNutrients,
} from './foods.js';

export const RECIPE_PREFIX = 'my-recipe-';
export const BOX_STORAGES = Object.freeze(['fridge', 'freezer']);
export const BOX_STATUSES = Object.freeze(['available', 'placed', 'eaten', 'discarded']);

const MEAT_GROUPS = new Set(['meat-fish', 'curry-meat', 'grill-kebab']);
const DEFAULT_SECTIONS = [
  { id: 'butcher', label: 'Halal butcher' },
  { id: 'supermarket', label: 'Supermarket' },
];
const KATORIS = [
  { id: 'katori-small', label: 'small katori', ml: 155 },
  { id: 'katori', label: 'katori', ml: 200 },
  { id: 'katori-large', label: 'large katori', ml: 360 },
  { id: 'tbsp', label: 'tablespoon', ml: 15 },
];
/** Ingredient group → storage rule id (NUTRITION.md §5.4). `dry-staple` is split by name below. */
const STORAGE_BY_GROUP = {
  'grain-cooked': 'cooked-starch',
  'rice-dish': 'cooked-starch',
  'pasta-dish': 'cooked-starch',
  'meat-fish': 'cooked-meat',
  'curry-meat': 'cooked-meat',
  'grill-kebab': 'cooked-meat',
  egg: 'egg-dish',
  'daal-legume': 'cooked-curry',
  'curry-veg': 'cooked-curry',
  soup: 'cooked-curry',
  bread: 'cooked-flatbread',
  'bread-fried': 'cooked-flatbread',
  'side-dip': 'cold-salad',
  chaat: 'cold-salad',
};
const STARCH_WORDS =
  /\b(rice|chawal|arroz|basmati|pasta|macaroni|spaghetti|noodles?|couscous|bulgur|quinoa|semolina|vermicelli)\b/i;
const LEGUME_WORDS =
  /\b(lentils?|lentejas|daal|dal|chana|chickpeas?|garbanzos|beans?|moong|masoor)\b/i;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const show = (v) => (typeof v === 'string' ? `'${v}'` : String(v));

function checkRecipe(recipe) {
  if (!isObject(recipe)) throw new TypeError('recipe must be an object');
  if (!Array.isArray(recipe.ingredients))
    throw new TypeError('recipe.ingredients must be an array');
}

/** null/undefined = the ingredients' weight; otherwise a weighed pot in grams, > 0. */
function checkCookedWeight(recipe) {
  const w = recipe.cookedWeightG;
  if (w === null || w === undefined) return;
  if (typeof w !== 'number') throw new TypeError('cookedWeightG must be a number or null');
  if (!(Number.isFinite(w) && w > 0)) throw new RangeError(`cookedWeightG must be > 0, got ${w}`);
}

function checkIndex(foodIndex) {
  if (!(foodIndex instanceof Map)) throw new TypeError('foodIndex must be a Map');
}

/**
 * The worst halal status among `foods` (RULES.vocab.halalRules.worstFirst), with that food's reason.
 * @param {object[]} foods @param {object|null} [rules]
 * @returns {{ status: string, reason: string|null, foodId: string|null }}
 */
export function worstHalal(foods, rules = null) {
  if (!Array.isArray(foods)) throw new TypeError('foods must be an array');
  const order = rules?.vocab?.halalRules?.worstFirst ?? [...HALAL_STATUSES].reverse();
  let best = { status: 'halal', reason: null, foodId: null };
  let rank = order.indexOf('halal');
  for (const food of foods) {
    const status = food?.halal?.status;
    const r = order.indexOf(status);
    if (r === -1 || r >= rank) continue;
    rank = r;
    best = { status, reason: food.halal.reason ?? null, foodId: food.id ?? null };
  }
  return best;
}

/**
 * Ingredient lines with grams and nutrients, the raw total and the cooked weight.
 * @param {object} recipe @param {Map<string, object>} foodIndex
 */
export function recipeTotals(recipe, foodIndex) {
  checkRecipe(recipe);
  checkCookedWeight(recipe);
  checkIndex(foodIndex);
  const lines = [];
  const missing = [];
  for (const ing of recipe.ingredients) {
    const food = foodIndex.get(ing?.foodId);
    let grams = null;
    if (food) {
      try {
        grams = gramsForPortion(food, ing.servingId, ing.qty);
      } catch {
        grams = null;
      }
    }
    if (grams === null) {
      missing.push(ing?.foodId ?? null);
      continue;
    }
    lines.push({
      foodId: food.id,
      servingId: ing.servingId,
      qty: ing.qty,
      grams,
      nutrients: nutrientsForGrams(food, grams),
    });
  }
  const rawGrams = lines.reduce((sum, l) => sum + l.grams, 0);
  const weighed = typeof recipe.cookedWeightG === 'number';
  return {
    lines,
    total: sumNutrients(lines.map((l) => l.nutrients)),
    rawGrams,
    cookedGrams: weighed ? recipe.cookedWeightG : rawGrams,
    missing,
  };
}

function boxCount(recipe) {
  const n = recipe.boxes;
  if (!(Number.isInteger(n) && n >= 1)) {
    throw new RangeError(`boxes must be a whole number >= 1, got ${show(n)}`);
  }
  return n;
}

/**
 * A Food record for a user recipe (ARCHITECTURE §13). Per 100 g of the cooked pot.
 * @param {object} recipe @param {Map<string, object>} foodIndex @param {object|null} rules
 * @returns {object} Food
 */
export function foodFromRecipe(recipe, foodIndex, rules) {
  checkRecipe(recipe);
  if (typeof recipe.id !== 'string' || recipe.id === '') {
    throw new TypeError('recipe.id must be a string');
  }
  const boxes = boxCount(recipe);
  const totals = recipeTotals(recipe, foodIndex);
  if (totals.lines.length === 0)
    throw new RangeError(`recipe ${recipe.id} has no known ingredient`);
  if (!(totals.cookedGrams > 0)) throw new RangeError(`recipe ${recipe.id} weighs nothing`);
  const per100g = {};
  for (const k of NUTRIENT_KEYS) per100g[k] = (totals.total[k] / totals.cookedGrams) * 100;
  const boxGrams = totals.cookedGrams / boxes;
  const chai = recipe.kind === 'chai';

  let servings;
  if (chai) {
    servings = [
      { id: 'cup', label: `1 cup (${Math.round(boxGrams)} ml)`, grams: boxGrams, default: true },
    ];
  } else {
    // A family pot counted in katori (Review 2): logging opens on a katori, not the whole pot.
    const pot = Number.isFinite(recipe.potKatori) && recipe.potKatori > 0;
    servings = [
      {
        id: 'box',
        label: boxes > 1 ? '1 box' : pot ? '1 whole pot' : '1 whole recipe',
        grams: boxGrams,
        ...(pot ? {} : { default: true }),
      },
    ];
    if (boxes > 1) servings.push({ id: 'pot', label: '1 whole pot', grams: totals.cookedGrams });
    for (const k of KATORIS) {
      const ml = rules?.householdMeasures?.find((m) => m.id === k.id)?.ml ?? k.ml;
      servings.push({
        id: k.id,
        label: `1 ${k.label} (about ${ml} g)`,
        grams: ml,
        ...(pot && k.id === 'katori' ? { default: true } : {}),
      });
    }
  }

  const ingredientFoods = totals.lines.map((l) => foodIndex.get(l.foodId));
  const worst = worstHalal(ingredientFoods, rules);
  const culprit = worst.foodId ? foodIndex.get(worst.foodId) : null;
  const halal =
    worst.status === 'halal'
      ? { status: 'halal' }
      : {
          status: worst.status,
          reason: worst.reason ?? 'Check this ingredient.',
          ingredient: culprit?.name ?? null, // the UI says which ingredient the reason is about
        };

  const n = totals.lines.length;
  return {
    id: recipe.id,
    name: String(recipe.name ?? 'My recipe'),
    aliases: chai ? ['chai', 'my chai', 'meri chai', 'tea', 'چائے'] : ['my recipe'],
    group: chai ? 'drink-tea-coffee' : 'lunchbox',
    state: chai ? 'your chai, as you make it' : 'your recipe, as cooked',
    per100g,
    servings,
    tags: chai ? [] : ['meal-prep'],
    ...(chai ? { slots: ['breakfast', 'evening', 'snacks'] } : {}),
    halal,
    source: {
      citation: 'Your recipe',
      method: 'recipe',
      confidence: 'C',
      notes:
        `The sum of your ${n} ingredient${n === 1 ? '' : 's'} from the Katori food list, ` +
        (recipe.cookedWeightG > 0
          ? `divided by the pot you weighed (${Math.round(totals.cookedGrams)} g).`
          : `divided by their weight (${Math.round(totals.cookedGrams)} g).`),
    },
    userRecipe: true,
  };
}

/**
 * Storage rule ids for a recipe: its own `storage`, else inferred from the ingredient groups.
 * @param {object} recipe @param {Map<string, object>} foodIndex @param {object|null} rules
 * @returns {string[]}
 */
export function storageIds(recipe, foodIndex, rules) {
  checkRecipe(recipe);
  checkIndex(foodIndex);
  const known = (rules?.mealPrep?.storage ?? []).map((s) => s.id);
  const order = (ids) =>
    [...new Set(ids)].sort((a, b) => {
      const ia = known.indexOf(a);
      const ib = known.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  if (Array.isArray(recipe.storage) && recipe.storage.length > 0) {
    return order(recipe.storage.map((s) => (isObject(s) ? s.id : s)).filter(Boolean));
  }
  const ids = [];
  let anyKnown = false;
  for (const ing of recipe.ingredients) {
    const food = foodIndex.get(ing?.foodId);
    if (!food) continue;
    anyKnown = true;
    let id = STORAGE_BY_GROUP[food.group];
    if (!id && food.group === 'dry-staple') {
      const text = `${food.name} ${food.nameRoman ?? ''}`;
      if (STARCH_WORDS.test(text)) id = 'cooked-starch';
      else if (LEGUME_WORDS.test(text)) id = 'cooked-curry';
    }
    if (id) ids.push(id);
  }
  if (ids.length) return order(ids);
  // Ingredients but no rule matched: cooked leftovers (USDA FSIS). No data at all: the strictest.
  return [anyKnown ? 'cooked-curry' : 'cooked-starch'];
}

function rulesFor(ids, rules) {
  const all = rules?.mealPrep?.storage ?? [];
  const found = ids.map((id) => all.find((s) => s.id === id)).filter(Boolean);
  return found.length ? found : all.filter((s) => s.id === 'cooked-starch');
}

function fridgeDaysOf(found) {
  const days = found.map((s) => s.fridgeDays).filter(Number.isFinite);
  return days.length ? Math.min(...days) : 1;
}

/**
 * Default fridge/freezer split: the boxes eaten within the fridge life stay in the fridge.
 * @returns {{ fridgeDays: number, freezable: boolean, storage: ('fridge'|'freezer')[] }}
 */
export function storagePlan(recipe, boxes, foodIndex, rules) {
  if (!(Number.isInteger(boxes) && boxes >= 1)) {
    throw new RangeError(`boxes must be a whole number >= 1, got ${show(boxes)}`);
  }
  const found = rulesFor(storageIds(recipe, foodIndex, rules), rules);
  const fridgeDays = fridgeDaysOf(found);
  // A side pot packed on its own ({ id, pot: true }, e.g. the raita) does not stop the box from
  // being frozen; it still counts for the fridge life.
  // Judged per entry, not per id: the same id can be both in the box and in a side pot (chana
  // chaat: the chaat is a cold salad and so is its raita pot), and the box one still counts.
  const own = Array.isArray(recipe.storage) && recipe.storage.length ? recipe.storage : null;
  const mainIds = own
    ? own.filter((s) => !(isObject(s) && s.pot === true)).map((s) => (isObject(s) ? s.id : s))
    : null;
  const main = mainIds ? found.filter((s) => mainIds.includes(s.id)) : found;
  const judged = main.length ? main : found;
  const freezable = judged.length > 0 && judged.every((s) => s.freezable === true);
  const storage = Array.from({ length: boxes }, (_, i) =>
    !freezable || i < fridgeDays ? 'fridge' : 'freezer',
  );
  return { fridgeDays, freezable, storage };
}

/**
 * Use-by of one box: fridge = cookedOn + shortest fridge life (or moved date + thawed days);
 * freezer = null (NUTRITION.md §5.4).
 * @returns {string|null} 'YYYY-MM-DD'
 */
export function boxUseBy(batch, box, recipe, foodIndex, rules) {
  if (!isObject(batch) || !isISODate(batch.cookedOn)) {
    throw new TypeError('batch needs a cookedOn date');
  }
  if (!isObject(box)) throw new TypeError('box must be an object');
  if (!BOX_STORAGES.includes(box.storage)) {
    throw new RangeError(`unknown storage ${show(box.storage)}`);
  }
  // A box taken out of the freezer counts from the day it was moved, whatever `storage` says.
  if (box.movedToFridgeOn) {
    if (!isISODate(box.movedToFridgeOn)) throw new RangeError('movedToFridgeOn must be a date');
    return addDays(box.movedToFridgeOn, rules?.mealPrep?.thawedFridgeDays ?? 1);
  }
  if (box.storage === 'freezer') return null;
  const found = rulesFor(storageIds(recipe, foodIndex, rules), rules);
  return addDays(batch.cookedOn, fridgeDaysOf(found));
}

/** @returns {null|'ok'|'last-day'|'past'} */
export function useByStatus(useBy, date) {
  if (useBy === null || useBy === undefined) return null;
  if (!isISODate(useBy) || !isISODate(date)) throw new RangeError('dates must be YYYY-MM-DD');
  if (date < useBy) return 'ok';
  return date === useBy ? 'last-day' : 'past';
}

/** @param {object} batch @returns {number} */
export function boxesLeft(batch) {
  if (!isObject(batch) || !Array.isArray(batch.boxes)) throw new TypeError('batch needs boxes');
  return batch.boxes.filter((b) => b.status === 'available').length;
}

/**
 * @param {object} batch @param {string} boxId @param {{ date: string, entryId: string }} placed
 * @returns {object} new batch
 */
export function placeBox(batch, boxId, placed) {
  if (!isObject(batch) || !Array.isArray(batch.boxes)) throw new TypeError('batch needs boxes');
  if (!isObject(placed) || !isISODate(placed.date) || typeof placed.entryId !== 'string') {
    throw new TypeError('placed must be { date, entryId }');
  }
  const box = batch.boxes.find((b) => b.id === boxId);
  if (!box || box.status !== 'available') {
    throw new RangeError(`box ${show(boxId)} is not available`);
  }
  return {
    ...batch,
    boxes: batch.boxes.map((b) =>
      b.id === boxId
        ? { ...b, status: 'placed', placed: { date: placed.date, entryId: placed.entryId } }
        : b,
    ),
  };
}

/**
 * Box statuses follow the entries that point at them (boxRef). Same array back when unchanged.
 * @param {object[]} batches @param {Record<string, { entries: object[] }>} days
 */
export function syncBatches(batches, days) {
  if (!Array.isArray(batches)) throw new TypeError('batches must be an array');
  if (batches.length === 0) return batches;
  const refs = new Map();
  for (const [date, day] of Object.entries(days ?? {})) {
    for (const e of day?.entries ?? []) {
      if (e?.boxRef) refs.set(`${e.boxRef.batchId}/${e.boxRef.boxId}`, { date, entry: e });
    }
  }
  let changed = false;
  const out = batches.map((batch) => {
    let batchChanged = false;
    const boxes = (batch.boxes ?? []).map((box) => {
      if (box.status === 'discarded') return box;
      const ref = refs.get(`${batch.id}/${box.id}`);
      let next;
      if (ref) {
        next = {
          status: ref.entry.status === 'eaten' ? 'eaten' : 'placed',
          placed: { date: ref.date, entryId: ref.entry.id },
        };
      } else {
        next = { status: 'available', placed: null };
      }
      const had = box.placed !== null && box.placed !== undefined;
      const has = next.placed !== null;
      const same =
        box.status === next.status &&
        had === has &&
        (!has ||
          (box.placed.date === next.placed.date && box.placed.entryId === next.placed.entryId));
      if (same) return box;
      batchChanged = true;
      return { ...box, ...next };
    });
    if (!batchChanged) return batch;
    changed = true;
    return { ...batch, boxes };
  });
  return changed ? out : batches;
}

function sectionLabels(rules) {
  const given = rules?.mealPrep?.shopSections;
  return Array.isArray(given) && given.length ? given : DEFAULT_SECTIONS;
}

/**
 * Ingredients × batches, merged by food (else by name), in shop sections (butcher first).
 * @param {{ recipe: object, boxes: number }[]} plans @param {Map<string, object>} foodIndex
 * @param {object|null} [rules]
 */
export function shoppingList(plans, foodIndex, rules = null) {
  if (!Array.isArray(plans)) throw new TypeError('plans must be an array');
  checkIndex(foodIndex);
  const items = new Map();
  for (const plan of plans) {
    checkRecipe(plan?.recipe);
    const base =
      Number.isFinite(plan.recipe.boxes) && plan.recipe.boxes > 0 ? plan.recipe.boxes : 1;
    if (!(Number.isFinite(plan.boxes) && plan.boxes > 0)) {
      throw new RangeError(`boxes must be > 0, got ${show(plan.boxes)}`);
    }
    const factor = plan.boxes / base;
    for (const ing of plan.recipe.ingredients) {
      if (!isObject(ing)) continue;
      const food = ing.foodId ? foodIndex.get(ing.foodId) : undefined;
      let grams = null;
      let count = null;
      if (Number.isFinite(ing.grams) && ing.grams > 0) grams = ing.grams;
      else if (food) {
        try {
          grams = gramsForPortion(food, ing.servingId, ing.qty);
        } catch {
          grams = null;
        }
      }
      if (grams === null) continue;
      if (food && ing.servingId && ing.servingId !== 'g' && Number.isFinite(ing.qty)) {
        const serving = findServing(food, ing.servingId);
        if (serving) {
          count = { servingId: serving.id, qty: ing.qty * factor, label: countLabel(serving) };
        }
      }
      const name = ing.name ?? food?.name ?? String(ing.foodId ?? 'Ingredient');
      const key = ing.foodId ? `food:${ing.foodId}` : `name:${name.trim().toLowerCase()}`;
      const section =
        ing.section ?? (food && MEAT_GROUPS.has(food.group) ? 'butcher' : 'supermarket');
      const prev = items.get(key);
      if (!prev) {
        items.set(key, {
          key,
          foodId: ing.foodId ?? null,
          name,
          grams: grams * factor,
          count,
          section,
        });
      } else {
        prev.grams += grams * factor;
        prev.count =
          prev.count && count && prev.count.servingId === count.servingId
            ? { ...prev.count, qty: prev.count.qty + count.qty }
            : null;
      }
    }
  }
  const labels = sectionLabels(rules);
  const ids = [
    ...new Set([...labels.map((s) => s.id), ...[...items.values()].map((i) => i.section)]),
  ];
  const sections = [];
  for (const id of ids) {
    const list = [...items.values()].filter((i) => i.section === id);
    if (!list.length) continue;
    sections.push({
      id,
      label: labels.find((s) => s.id === id)?.label ?? id,
      items: list.map(({ section: _section, count, ...rest }) => ({
        ...rest,
        count: count ? { qty: count.qty, label: count.label } : null,
      })),
    });
  }
  return { sections };
}

/** "1 medium potato" → "medium potato"; "1 teaspoon" → "teaspoon". */
function countLabel(serving) {
  return String(serving.label).replace(/^1\s+/, '');
}

// ------------------------------------------------------------------ shopping as you buy (Review 2)

export const CUPBOARD_SECTION = Object.freeze({ id: 'cupboard', label: 'Check you have' });
/** Servings that are things you count at the shop ("10 large eggs", "3 medium potatoes"). */
const COUNT_SERVINGS = new Set([
  'large',
  'medium',
  'small',
  'egg',
  'fruit',
  'piece',
  'clove',
  'lemon',
  'avocado',
  'bunch',
  'whole',
]);
const COUNT_BY_ID = new Set(['lemon', 'avocado', 'egg', 'clove']); // label is "Juice of 1 lemon"
const COUNT_GROUPS = new Set(['egg', 'fruit', 'vegetable', 'condiment']);
const STAPLE_GROUPS = new Set(['condiment', 'fat-oil', 'dry-staple', 'sugar-sweetener']);
const STAPLE_WORDS =
  /\b(salt|namak|black pepper|paprika|pimenton|cumin|zeera|jeera|turmeric|haldi|masala|cinnamon|cardamom|cloves|bay lea(f|ves)|oregano|thyme|rosemary|ras el hanout|chill?i powder|coriander seeds?|spices?|saffron|nutmeg|mustard seeds?|fennel seeds?|ajwain|kalonji|stock cube)\b/i;

/** Spices, salt, oil and ghee: what most kitchens have (not butter, which is bought fresh). */
function isStaple(name, food) {
  if (food?.group === 'fat-oil') return !/butter|mantequilla/i.test(food.name ?? '');
  if (food && !STAPLE_GROUPS.has(food.group)) return false;
  return STAPLE_WORDS.test(name);
}

/** "medium potato" → "medium potatoes"; "clove of garlic" → "cloves of garlic". */
export function pluralLabel(label) {
  const head = String(label).split(' (')[0].trim();
  const words = head.split(' ');
  let i = words.indexOf('of') > 0 ? words.indexOf('of') - 1 : words.length - 1;
  if (i < 0) i = 0;
  const w = words[i];
  if (/(s|x|ch|sh)$/i.test(w)) words[i] = `${w}es`;
  else if (/[^aeiou]y$/i.test(w)) words[i] = `${w.slice(0, -1)}ies`;
  else if (/[^aeiou]o$/i.test(w)) words[i] = `${w}es`;
  else words[i] = `${w}s`;
  return words.join(' ');
}

function countServingOf(food) {
  if (!food || !COUNT_GROUPS.has(food.group)) return null;
  const servings = (food.servings ?? []).filter((s) => COUNT_SERVINGS.has(s.id) && s.grams > 0);
  return servings.find((s) => s.default) ?? servings.find((s) => s.id === 'medium') ?? servings[0];
}

/**
 * How to buy `grams` of a food (Review 2, Mariam #1): whole packs when the food has
 * `pack: { grams, label }` ("2 × 400 g jar"; with `uses`, the count it uses when the food is
 * countable: "1 × 12 eggs, uses 7 large eggs"), else a whole count of a countable serving
 * ("10 large eggs"), else grams.
 * @param {object|undefined} food @param {number} grams
 * @returns {{ kind: 'pack', packs: number, label: string, grams: number,
 *     uses: { qty: number, label: string }|null }
 *   | { kind: 'count', qty: number, label: string, grams: number }
 *   | { kind: 'grams', grams: number }}
 */
export function buyAmount(food, grams) {
  const serving = countServingOf(food);
  let count = null;
  const label = String(serving?.label ?? '');
  // "1 medium onion" → "medium onion"; "Juice of 1 lemon" (id 'lemon') → "lemon"; else no count.
  const one = /^1\s/.test(label)
    ? label.replace(/^1\s+/, '').split(' (')[0].trim() // "small bunch (9 sprigs)" → "small bunch"
    : COUNT_BY_ID.has(serving?.id)
      ? serving.id
      : null;
  if (serving && one) {
    const n = Math.max(1, Math.ceil(grams / serving.grams - 0.05)); // 3.02 potatoes is 3, 3.4 is 4
    count = { qty: n, label: n === 1 ? one : pluralLabel(one) };
  }
  const pack = food?.pack;
  if (pack && Number.isFinite(pack.grams) && pack.grams > 0 && typeof pack.label === 'string') {
    return {
      kind: 'pack',
      packs: Math.max(1, Math.ceil(grams / pack.grams - 1e-9)),
      label: pack.label,
      grams,
      uses: count,
    };
  }
  return count ? { kind: 'count', ...count, grams } : { kind: 'grams', grams };
}

/**
 * A shopping list (from `shoppingList`) as you buy it: spices, salt, oil and ghee move to a last
 * "Check you have" section (`cupboard`), and each item gets `buy` (see buyAmount). Items keep
 * key, foodId, name, grams and count. Empty sections are left out.
 * @param {{ sections: object[] }} list @param {Map<string, object>} foodIndex
 * @param {object|null} [rules]
 * @returns {{ sections: { id: string, label: string, items: object[] }[] }}
 */
export function shoppingForShop(list, foodIndex, rules = null) {
  if (!isObject(list) || !Array.isArray(list.sections)) {
    throw new TypeError('list must come from shoppingList');
  }
  checkIndex(foodIndex);
  const order = [...sectionLabels(rules), CUPBOARD_SECTION];
  const items = [];
  for (const section of list.sections) {
    for (const item of section.items ?? []) {
      const food = item.foodId ? foodIndex.get(item.foodId) : undefined;
      const staple = section.id !== 'butcher' && isStaple(item.name, food);
      items.push({ ...item, section: staple ? CUPBOARD_SECTION.id : section.id });
    }
  }
  const ids = [...new Set([...order.map((s) => s.id), ...items.map((i) => i.section)])];
  const sections = [];
  for (const id of ids) {
    const inSection = items.filter((i) => i.section === id);
    if (!inSection.length) continue;
    sections.push({
      id,
      label:
        order.find((s) => s.id === id)?.label ??
        list.sections.find((s) => s.id === id)?.label ??
        id,
      items: inSection.map(({ section: _section, ...rest }) => ({
        ...rest,
        buy: buyAmount(rest.foodId ? foodIndex.get(rest.foodId) : undefined, rest.grams),
      })),
    });
  }
  return { sections };
}
