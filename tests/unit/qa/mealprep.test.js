// QA suite for app/core/mealprep.js, written from ARCHITECTURE §13 and §13.2 (the binding
// signatures), NUTRITION §4.6 (worst halal) and §5.4 (storage), and CUSTOMER A10, A16–A18, not from
// the code. Owner: Kenji.
//
// The module is imported dynamically: while app/core/mealprep.js (or one of its functions) is
// missing, each test is TODO ("stub: <name>"), so `npm run check` stays green; the same tests become
// real the day the function lands. Expected values are worked out by hand in the comments.
//
// Reading of §13/§13.2 used here (ask Lena if it is wrong):
//   - a box moved out of the freezer has `storage: 'fridge'` and `movedToFridgeOn` set; boxUseBy
//     then gives movedToFridgeOn + thawedFridgeDays; a box still in the freezer has no use-by;
//   - `days` for syncBatches is UserData.days: an object keyed by 'YYYY-MM-DD'.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  qa,
  RULES,
  frozen,
  indexOf,
  assertBadInput,
  assertThrowsKind,
  assertClose,
  expectedFor,
  NUTRIENT_KEYS,
  rng,
  shuffled,
} from './_helpers.js';
import { validateFood } from '../../../app/core/foods.js';
import {
  createEntry,
  entryNutrients,
  addEntry,
  emptyDay,
  dayTotals,
} from '../../../app/core/days.js';

// ------------------------------------------------------------------ the module under test

const mod = await import('../../../app/core/mealprep.js').catch((error) => {
  if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
  throw error;
});

/** The real function, or a stub that throws 'not implemented' (so `qa` marks the test TODO). */
function pick(name) {
  if (typeof mod?.[name] === 'function') return mod[name];
  return {
    [name]() {
      throw new Error(`not implemented: mealprep.${name}`);
    },
  }[name];
}
const foodFromRecipe = pick('foodFromRecipe');
const boxUseBy = pick('boxUseBy');
const boxesLeft = pick('boxesLeft');
const placeBox = pick('placeBox');
const worstHalal = pick('worstHalal');
const recipeTotals = pick('recipeTotals');
const storageIds = pick('storageIds');
const storagePlan = pick('storagePlan');
const useByStatus = pick('useByStatus');
const syncBatches = pick('syncBatches');
const shoppingList = pick('shoppingList');

test(
  'mealprep.js exports the §13.2 functions',
  { todo: mod ? undefined : 'app/core/mealprep.js does not exist yet' },
  () => {
    assert.ok(mod, 'module missing');
    for (const name of [
      'worstHalal',
      'recipeTotals',
      'foodFromRecipe',
      'storageIds',
      'storagePlan',
      'boxUseBy',
      'useByStatus',
      'boxesLeft',
      'placeBox',
      'syncBatches',
      'shoppingList',
    ])
      assert.equal(typeof mod[name], 'function', name);
    assert.equal(mod.RECIPE_PREFIX, 'my-recipe-');
    assert.deepEqual([...mod.BOX_STORAGES], ['fridge', 'freezer']);
    assert.deepEqual([...mod.BOX_STATUSES], ['available', 'placed', 'eaten', 'discarded']);
  },
);

// ------------------------------------------------------------------ test foods (per 100 g)

const food = (id, p, servings, halal = { status: 'halal' }, extra = {}) => ({
  id,
  name: id,
  aliases: [],
  group: 'vegetable',
  state: 'raw',
  per100g: { kcal: p[0], protein: p[1], carbs: p[2], fat: p[3], fiber: p[4] },
  servings,
  tags: ['pakistani'],
  halal,
  source: {
    citation: 'QA fixture',
    method: 'direct',
    confidence: 'A',
    reviewer: 'qa',
    date: '2026-10-14',
  },
  ...extra,
});
const one = (id, grams, label = `1 ${id}`) => [{ id, label, grams, default: true }];

const CHICKEN = food('qa-chicken', [165, 31, 0, 3.6, 0], one('piece', 100), undefined, {
  group: 'meat-fish',
});
const DAHI = food('qa-dahi', [61, 3.5, 4.7, 3.3, 0], one('cup', 245), undefined, {
  group: 'dairy',
});
const OIL = food('qa-oil', [884, 0, 0, 100, 0], one('tbsp', 13.6), undefined, { group: 'fat-oil' });
const RICE = food('qa-rice', [360, 7, 78, 0.6, 1.3], one('cup', 185), undefined, {
  group: 'dry-staple',
});
const CUCUMBER = food('qa-cucumber', [15, 0.7, 3.6, 0.1, 0.5], one('medium', 150));
const CHEESE = food(
  'qa-cheese',
  [300, 20, 2, 24, 0],
  one('slice', 20),
  { status: 'check', reason: 'Rennet may be animal-derived. Check the label.' },
  { group: 'dairy' },
);
const WINE = food(
  'qa-wine-sauce',
  [90, 1, 6, 5, 0],
  one('tbsp', 15),
  { status: 'check', reason: 'Often cooked with wine. Ask.' },
  { group: 'condiment' },
);
const PASTRY = food(
  'qa-pastry',
  [400, 6, 45, 22, 1],
  one('piece', 60),
  { status: 'not-halal', reason: 'Traditionally made with pork lard (saïm).' },
  { group: 'biscuit-bakery' },
);
const ALL = [CHICKEN, DAHI, OIL, RICE, CUCUMBER, CHEESE, WINE, PASTRY];
const INDEX = indexOf(ALL);

const ing = (foodId, servingId, qty) => ({ foodId, servingId, qty });
const grams = (foodId, g) => ing(foodId, 'g', g);

/** A16 step 2: "Tikka bowls": 800 g chicken, 200 g dahi, 2 tbsp oil, 320 g dry rice, 2 cucumbers. */
const tikka = (patch = {}) => ({
  id: 'my-recipe-qa-tikka',
  name: 'Tikka bowls',
  createdAt: '2026-11-01',
  ingredients: [
    grams('qa-chicken', 800),
    grams('qa-dahi', 200),
    ing('qa-oil', 'tbsp', 2),
    grams('qa-rice', 320),
    ing('qa-cucumber', 'medium', 2),
  ],
  cookedWeightG: null,
  boxes: 4,
  ...patch,
});

// Hand sums for tikka() (ingredient grams: 800 + 200 + 2 × 13.6 + 320 + 2 × 150 = 1647.2 g):
//   chicken 800 g  kcal 1320     P 248   C 0      F 28.8   fibre 0
//   dahi    200 g  kcal 122      P 7     C 9.4    F 6.6    fibre 0
//   oil    27.2 g  kcal 240.448  P 0     C 0      F 27.2   fibre 0
//   rice    320 g  kcal 1152     P 22.4  C 249.6  F 1.92   fibre 4.16
//   cucumber 300 g kcal 45       P 2.1   C 10.8    F 0.3    fibre 1.5
const TOTAL = { kcal: 2879.448, protein: 279.5, carbs: 269.8, fat: 64.82, fiber: 5.66 };
const SUM_G = 1647.2;
// A stored per100g may be rounded (kcal whole, macros 1 decimal), so allow that much.
const EPS = { kcal: 0.51, protein: 0.051, carbs: 0.051, fat: 0.051, fiber: 0.051 };

const per100 = (total, cooked) =>
  Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, (total[k] / cooked) * 100]));
const perBox = (total, boxes) =>
  Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, total[k] / boxes]));
/**
 * How far a quantity of `grams` of the derived food may sit from the exact figure when per100g was
 * stored rounded (kcal whole, macros to 0.1 g, as in Lab records): half a unit per 100 g, scaled.
 */
const slack = (grams, k) => ((k === 'kcal' ? 0.5 : 0.05) * grams) / 100 + 0.01;
/** Each nutrient of `got` within the rounding slack of `want` for `grams` of food. */
function assertPortion(got, want, grams, message = '') {
  for (const k of NUTRIENT_KEYS) assertClose(got[k], want[k], slack(grams, k), `${message} ${k}`);
}
const box = (f) => f.servings.find((s) => s.id === 'box');
const derive = (recipe, index = INDEX) => foodFromRecipe(recipe, index, RULES);

// ------------------------------------------------------------------ foodFromRecipe

qa(
  'foodFromRecipe: no cooked weight → the cooked weight is the sum of the ingredient grams',
  [foodFromRecipe],
  () => {
    // per100g = Σ nutrients / 1647.2 × 100:
    //   kcal 2879.448 / 16.472 = 174.81     protein 279.5 / 16.472 = 16.97    carbs 269.8 / 16.472 = 16.38
    //   fat 64.82 / 16.472 = 3.935          fibre 5.66 / 16.472 = 0.3436
    const f = derive(tikka());
    const want = { kcal: 174.81, protein: 16.97, carbs: 16.38, fat: 3.935, fiber: 0.3436 };
    for (const k of NUTRIENT_KEYS) assertClose(f.per100g[k], want[k], EPS[k], k);
    assertClose(per100(TOTAL, SUM_G).kcal, want.kcal, 0.01, 'oracle self-check');
    // the box serving is the whole cooked weight over 4: 1647.2 / 4 = 411.8 g
    assertClose(box(f).grams, 411.8, 0.05, 'box grams');
  },
);

qa(
  'foodFromRecipe: a weighed pot (1300 g) divides the same total by the cooked weight',
  [foodFromRecipe],
  () => {
    // per100g = Σ / 1300 × 100: kcal 221.496, protein 21.5, carbs 20.7538, fat 4.9862, fibre 0.4354
    // box = 1300 / 4 = 325 g. The whole pot lost water (2879 → 1300 g) but not nutrients.
    const f = derive(tikka({ cookedWeightG: 1300 }));
    const want = { kcal: 221.496, protein: 21.5, carbs: 20.7538, fat: 4.9862, fiber: 0.4354 };
    for (const k of NUTRIENT_KEYS) assertClose(f.per100g[k], want[k], EPS[k], k);
    assertClose(box(f).grams, 325, 0.05, 'box grams');
  },
);

qa(
  'foodFromRecipe: per box = recipe total ÷ boxes, whatever the cooked weight (A16 step 2)',
  [foodFromRecipe],
  () => {
    // total ÷ 4: 719.862 kcal, 69.875 P, 67.45 C, 16.205 F, 1.415 fibre
    // total ÷ 5: 575.8896 kcal, 55.9 P, 53.96 C, 12.964 F, 1.132 fibre
    for (const cooked of [null, 1300, 2000]) {
      for (const [boxes, want] of [
        [4, { kcal: 719.862, protein: 69.875, carbs: 67.45, fat: 16.205, fiber: 1.415 }],
        [5, { kcal: 575.8896, protein: 55.9, carbs: 53.96, fat: 12.964, fiber: 1.132 }],
      ]) {
        const f = derive(tikka({ boxes, cookedWeightG: cooked }));
        assertPortion(
          expectedFor(f, box(f).grams),
          want,
          box(f).grams,
          `cooked ${cooked} boxes ${boxes}`,
        );
      }
    }
  },
);

qa(
  'foodFromRecipe: changing 4 boxes to 5 changes the box size, not the per-100 g values',
  [foodFromRecipe],
  () => {
    const four = derive(tikka({ boxes: 4, cookedWeightG: 1300 }));
    const five = derive(tikka({ boxes: 5, cookedWeightG: 1300 }));
    assert.deepEqual(four.per100g, five.per100g);
    assertClose(box(four).grams, 325, 0.05); // 1300 / 4
    assertClose(box(five).grams, 260, 0.05); // 1300 / 5
  },
);

qa(
  'foodFromRecipe: one box is the whole pot (A10): half is exactly half of the total',
  [foodFromRecipe],
  () => {
    // Mi tortilla style: boxes 1, cooked weight 1300 g. 1 box = 1300 g = the whole total.
    const f = derive(tikka({ boxes: 1, cookedWeightG: 1300 }));
    assertClose(box(f).grams, 1300, 0.05);
    assertPortion(expectedFor(f, box(f).grams), TOTAL, 1300, 'whole pot');
    // the day functions work unchanged: ½ box and ⅓ box (the D4 lentejas pot) are exact fractions
    for (const [qty, frac] of [
      [0.5, 1 / 2],
      [1 / 3, 1 / 3],
    ]) {
      const e = createEntry({
        id: 'e1',
        slot: 'dinner',
        food: f,
        servingId: 'box',
        qty,
        status: 'planned',
      });
      const n = entryNutrients(e, indexOf([f]));
      const want = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, TOTAL[k] * frac]));
      assertPortion(n, want, 1300 * frac, `× ${qty}`);
    }
  },
);

qa(
  'foodFromRecipe: a box is a planned Lunch entry of "1 box" (A17): same numbers in the day totals',
  [foodFromRecipe],
  () => {
    const f = derive(tikka());
    const e = createEntry({
      id: 'e1',
      slot: 'lunch',
      food: f,
      servingId: 'box',
      qty: 1,
      status: 'planned',
    });
    assert.equal(e.foodId, 'my-recipe-qa-tikka');
    assert.equal(e.servingId, 'box');
    assert.equal(e.qty, 1);
    const idx = indexOf([f]);
    const day = addEntry(emptyDay('2026-11-02'), {
      ...e,
      boxRef: { batchId: 'b1', boxId: 'box-1' },
    });
    const want = perBox(TOTAL, 4);
    const planned = dayTotals(day, idx, { include: 'planned' });
    assertPortion(planned.total, want, box(f).grams, 'planned total');
    assertPortion(planned.bySlot.lunch, want, box(f).grams, 'Lunch');
    // the eaten total is still empty (planned only)
    assert.equal(dayTotals(day, idx, { include: 'eaten' }).total.kcal, 0);
    assert.deepEqual(day.entries[0].boxRef, { batchId: 'b1', boxId: 'box-1' });
  },
);

qa(
  'foodFromRecipe: identity, group and source (confidence C even when every ingredient is A)',
  [foodFromRecipe],
  () => {
    assert.equal(CHICKEN.source.confidence, 'A'); // premise
    const f = derive(tikka());
    assert.equal(f.id, 'my-recipe-qa-tikka');
    assert.equal(f.name, 'Tikka bowls');
    assert.equal(f.group, 'lunchbox');
    assert.equal(f.source.citation, 'Your recipe');
    assert.equal(f.source.method, 'recipe');
    assert.equal(f.source.confidence, 'C');
  },
);

qa(
  'foodFromRecipe: servings are the box (default), the pot, the katori set and tbsp at 1 g per ml (§13.2)',
  [foodFromRecipe],
  () => {
    const f = derive(tikka({ cookedWeightG: 1300 }));
    assert.deepEqual(
      f.servings.filter((s) => s.default === true).map((s) => s.id),
      ['box'],
    );
    assert.ok(f.servings.every((s) => Number.isFinite(s.grams) && s.grams > 0));
    assert.equal(new Set(f.servings.map((s) => s.id)).size, f.servings.length, 'ids unique');
    assert.ok(!f.servings.some((s) => s.id === 'g'), "'g' is the reserved raw-grams id");
    // 4 boxes: the whole pot is a serving too (1300 g)
    assertClose(f.servings.find((s) => s.id === 'pot').grams, 1300, 0.05, 'pot grams');
    // the katori set and tbsp: 1 g per ml, ml from RULES.householdMeasures (155, 200, 360, 15)
    const ml = Object.fromEntries(RULES.householdMeasures.map((m) => [m.id, m.ml]));
    for (const id of ['katori-small', 'katori', 'katori-large', 'tbsp']) {
      const s = f.servings.find((x) => x.id === id);
      assert.ok(s, `missing serving ${id}`);
      assertClose(s.grams, ml[id], 0.05, id);
    }
    // one box: the box is the whole recipe, so there is no separate pot serving
    const single = derive(tikka({ boxes: 1, cookedWeightG: 1300 }));
    assert.ok(!single.servings.some((s) => s.id === 'pot'));
    assert.deepEqual(
      single.servings.filter((s) => s.default === true).map((s) => s.id),
      ['box'],
    );
    assertClose(single.servings.find((s) => s.id === 'box').grams, 1300, 0.05);
  },
);

qa(
  'foodFromRecipe: a "chai" recipe has the single serving cup, in the tea and coffee group',
  [foodFromRecipe],
  () => {
    const f = derive(tikka({ kind: 'chai', boxes: 1, cookedWeightG: 400 }));
    assert.deepEqual(
      f.servings.map((s) => s.id),
      ['cup'],
    );
    assert.equal(f.servings[0].default, true);
    assert.equal(f.group, 'drink-tea-coffee');
  },
);

qa('foodFromRecipe: tags are ["meal-prep"] and the food validates', [foodFromRecipe], () => {
  assert.deepEqual(derive(tikka()).tags, ['meal-prep']);
});

qa(
  'foodFromRecipe: the derived food is a valid Food (every hard field present)',
  [foodFromRecipe],
  () => {
    for (const recipe of [tikka(), tikka({ cookedWeightG: 1300, boxes: 5 })]) {
      assert.deepEqual(validateFood(derive(recipe), RULES), []);
    }
  },
);

qa(
  'foodFromRecipe: halal is the worst status among the ingredients, with its reason and name (NUTRITION §4.6)',
  [foodFromRecipe],
  () => {
    const only = (...foods) => derive(tikka({ ingredients: foods.map((f) => grams(f.id, 100)) }));
    assert.equal(only(CHICKEN, RICE, DAHI).halal.status, 'halal');
    // one `check`: the recipe is `check`; the reason names the ingredient and carries its reason (A16)
    const c = only(CHICKEN, CHEESE, RICE).halal;
    assert.equal(c.status, 'check');
    assert.equal(c.reason, CHEESE.halal.reason);
    assert.equal(c.ingredient, 'qa-cheese', 'names the ingredient for the UI');
    // not-halal beats check beats halal, with the lard reason
    const n = only(CHICKEN, CHEESE, PASTRY).halal;
    assert.equal(n.status, 'not-halal');
    assert.equal(n.reason, PASTRY.halal.reason);
    assert.equal(n.ingredient, 'qa-pastry');
    // two `check`s: still `check`, with a reason
    const two = only(CHEESE, WINE, CHICKEN).halal;
    assert.equal(two.status, 'check');
    assert.ok(typeof two.reason === 'string' && two.reason.length > 0);
    assert.equal(only(PASTRY).halal.status, 'not-halal');
  },
);

qa(
  'foodFromRecipe: the halal status and the numbers do not depend on ingredient order',
  [foodFromRecipe],
  () => {
    const random = rng(7);
    const base = tikka({
      ingredients: [...tikka().ingredients, grams('qa-cheese', 60), grams('qa-wine-sauce', 45)],
    });
    const ref = derive(base);
    assert.equal(ref.halal.status, 'check');
    for (let i = 0; i < 25; i++) {
      const f = derive({ ...base, ingredients: shuffled(base.ingredients, random) });
      assert.equal(f.halal.status, 'check');
      for (const k of NUTRIENT_KEYS) assertClose(f.per100g[k], ref.per100g[k], 0.051, k);
      assertClose(box(f).grams, box(ref).grams, 1e-6);
    }
  },
);

qa(
  'foodFromRecipe: an ingredient given in a serving counts serving grams × qty ("g" counts raw grams)',
  [foodFromRecipe],
  () => {
    // 2 tbsp oil = 27.2 g and 27.2 g of oil are the same recipe
    const a = derive(
      tikka({ ingredients: [ing('qa-oil', 'tbsp', 2), grams('qa-rice', 100)], boxes: 1 }),
    );
    const b = derive(
      tikka({ ingredients: [grams('qa-oil', 27.2), grams('qa-rice', 100)], boxes: 1 }),
    );
    for (const k of NUTRIENT_KEYS) assertClose(a.per100g[k], b.per100g[k], 0.051, k);
    // oil 27.2 g + rice 100 g = 127.2 g: kcal (240.448 + 360) / 127.2 × 100 = 472.0
    assertClose(a.per100g.kcal, 472.0, 0.51);
    assertClose(box(a).grams, 127.2, 0.05);
  },
);

qa('foodFromRecipe: does not change its inputs', [foodFromRecipe], () => {
  const recipe = frozen(tikka({ cookedWeightG: 1300 }));
  const index = new Map([...INDEX].map(([id, f]) => [id, frozen(f)]));
  const rules = frozen(RULES);
  const f = foodFromRecipe(recipe, index, rules);
  assert.equal(f.id, recipe.id);
  assert.notEqual(f, INDEX.get('qa-chicken'));
});

qa(
  'foodFromRecipe: bad input throws (RangeError: no known ingredient, cooked weight not > 0)',
  [foodFromRecipe],
  () => {
    for (const boxes of [0, -1, 2.5, NaN])
      assertThrowsKind(() => derive(tikka({ boxes })), [RangeError], `boxes ${boxes}`);
    for (const cookedWeightG of [0, -5, NaN])
      assertThrowsKind(
        () => derive(tikka({ cookedWeightG })),
        [RangeError],
        `cooked ${cookedWeightG}`,
      );
    assertBadInput(() => derive(tikka({ ingredients: [] })), 'no ingredients');
    assertBadInput(() => derive(tikka({ ingredients: 'rice' })), 'ingredients not an array');
    assertBadInput(() => derive(null), 'null recipe');
    // no ingredient is known (unknown food, unknown serving, bad qty) → RangeError
    for (const bad of [grams('qa-nothing', 100), ing('qa-rice', 'bucket', 1), grams('qa-rice', 0)])
      assertThrowsKind(
        () => derive(tikka({ ingredients: [bad] })),
        [RangeError],
        JSON.stringify(bad),
      );
  },
);

qa(
  'foodFromRecipe: an unknown ingredient is skipped when another one is known (§13.2)',
  [foodFromRecipe, recipeTotals],
  () => {
    // chicken 800 g alone: per 100 g = chicken (165 kcal, 31 P, 0 C, 3.6 F, 0 fibre); cooked weight 800 g
    const f = derive(
      tikka({ ingredients: [grams('qa-chicken', 800), grams('qa-nothing', 500)], boxes: 4 }),
    );
    assertClose(f.per100g.kcal, 165, 1e-6);
    assertClose(f.per100g.protein, 31, 1e-6);
    assertClose(box(f).grams, 200, 0.05); // 800 / 4
    const t = recipeTotals(
      tikka({ ingredients: [grams('qa-chicken', 800), grams('qa-nothing', 500)] }),
      INDEX,
    );
    assert.deepEqual(t.missing, ['qa-nothing']);
    assert.equal(t.lines.length, 1);
  },
);

qa(
  'foodFromRecipe: property, 200 random recipes: totals, box × boxes and cooked weight agree',
  [foodFromRecipe],
  () => {
    const random = rng(2026);
    for (let i = 0; i < 200; i++) {
      const n = 1 + Math.floor(random() * 6);
      const picks = shuffled(
        ALL.filter((f) => f.halal.status !== 'not-halal'),
        random,
      ).slice(0, n);
      const ingredients = picks.map((f) =>
        grams(f.id, Math.round((10 + random() * 700) * 10) / 10),
      );
      const sumG = ingredients.reduce((a, x) => a + x.qty, 0);
      const total = Object.fromEntries(
        NUTRIENT_KEYS.map((k) => [
          k,
          ingredients.reduce((a, x) => a + (INDEX.get(x.foodId).per100g[k] * x.qty) / 100, 0),
        ]),
      );
      const boxes = 1 + Math.floor(random() * 12);
      const cookedWeightG =
        random() < 0.5 ? null : Math.round(sumG * (0.5 + random() * 0.7) * 10) / 10;
      const cooked = cookedWeightG ?? sumG;
      const f = derive(tikka({ ingredients, boxes, cookedWeightG }));
      const ctx = `#${i} n=${n} boxes=${boxes} cooked=${cooked}`;
      assertClose(box(f).grams * boxes, cooked, 0.06 * boxes, `box × boxes ${ctx}`);
      const want = per100(total, cooked);
      for (const k of NUTRIENT_KEYS) {
        assertClose(f.per100g[k], want[k], EPS[k] + 1e-9, `${k} per100g ${ctx}`);
        assertClose(
          expectedFor(f, box(f).grams)[k] * boxes,
          total[k],
          slack(cooked, k) + 0.1 + (0.06 * boxes * f.per100g[k]) / 100, // + box grams rounded to 0.1 g
          `${k} box×boxes ${ctx}`,
        );
      }
    }
  },
);

// ------------------------------------------------------------------ boxUseBy

// NUTRITION §5.4 (hand-copied, so a change to RULES shows up here): fridge days and the thaw rule.
const FRIDGE_DAYS = {
  'cooked-starch': 1,
  'cooked-meat': 3,
  'egg-dish': 3,
  'cold-salad': 2,
  'cooked-curry': 3,
  'egg-muffin': 3,
  'overnight-oats': 3,
  'cooked-flatbread': 2,
};

test('RULES.mealPrep matches NUTRITION §5.4 (fridge days per component, 1 day after thawing)', () => {
  for (const [id, days] of Object.entries(FRIDGE_DAYS)) {
    const row = RULES.mealPrep.storage.find((s) => s.id === id);
    assert.ok(row, id);
    assert.equal(row.fridgeDays, days, id);
  }
  assert.equal(RULES.mealPrep.storage.length, Object.keys(FRIDGE_DAYS).length);
  assert.equal(RULES.mealPrep.thawedFridgeDays, 1);
});

/** A library-style recipe record (shape of app/data/recipes-mealprep.js). */
const lib = (...storage) => ({
  foodId: 'pk-qa-box',
  ingredients: [grams('qa-chicken', 400), grams('qa-rice', 120)],
  boxes: 4,
  storage,
});
const boxOf = (id, storage = 'fridge', movedToFridgeOn = null, status = 'available') => ({
  id,
  storage,
  movedToFridgeOn,
  placed: null,
  status,
});
const batchOf = (cookedOn, ...boxes) => ({
  id: 'batch-1',
  recipeId: 'pk-qa-box',
  cookedOn,
  boxes: boxes.length ? boxes : [boxOf('box-1')],
});
/** Use-by of the first box of a fresh fridge batch cooked on `cookedOn`. */
const fridgeUseBy = (cookedOn, ...storage) => {
  const batch = batchOf(cookedOn);
  return boxUseBy(batch, batch.boxes[0], lib(...storage), INDEX, RULES);
};
/** Independent date oracle: calendar arithmetic in UTC (no clock, no zone). */
const plusDays = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

qa('boxUseBy: a fridge box gets cooked date + the fridge life of its component', [boxUseBy], () => {
  // curry 3 days: Mon 12 Oct → Thu 15 Oct; meat 3 days: Sun 1 Nov → Wed 4 Nov
  assert.equal(fridgeUseBy('2026-10-12', 'cooked-curry'), '2026-10-15');
  assert.equal(fridgeUseBy('2026-11-01', 'cooked-meat'), '2026-11-04');
  assert.equal(fridgeUseBy('2026-11-01', 'cooked-flatbread'), '2026-11-03'); // 2 days
  assert.equal(fridgeUseBy('2026-11-01', 'overnight-oats'), '2026-11-04'); // 3 days
});

qa(
  'boxUseBy: rice keeps 1 day (A18 step 2: box 1 cooked Sunday 1 Nov is good until Monday)',
  [boxUseBy],
  () => {
    assert.equal(fridgeUseBy('2026-11-01', 'cooked-starch'), '2026-11-02');
    assert.equal(fridgeUseBy('2026-12-31', 'cooked-starch'), '2027-01-01'); // year end
  },
);

qa(
  'boxUseBy: the shortest component wins, in any order (rice + meat + raita → 1 day)',
  [boxUseBy],
  () => {
    // tikka box: meat 3, rice 1, raita (cold-salad) 2 → min 1 → Monday 2 Nov
    const parts = ['cooked-meat', 'cooked-starch', 'cold-salad'];
    const perms = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ];
    for (const p of perms)
      assert.equal(fridgeUseBy('2026-11-01', ...p.map((i) => parts[i])), '2026-11-02');
    // without the rice: meat 3, raita 2 → 2 → Tuesday 3 Nov
    assert.equal(fridgeUseBy('2026-11-01', 'cooked-meat', 'cold-salad'), '2026-11-03');
    // curry 3, egg-dish 3, flatbread 2 → 2
    assert.equal(
      fridgeUseBy('2026-11-01', 'cooked-curry', 'egg-dish', 'cooked-flatbread'),
      '2026-11-03',
    );
    // a single repeated component changes nothing
    assert.equal(fridgeUseBy('2026-11-01', 'cooked-meat', 'cooked-meat'), '2026-11-04');
  },
);

qa(
  'boxUseBy: the cold chana chaat box (A18 step 6): cold-salad 2 days, cooked Sunday → Tuesday',
  [boxUseBy],
  () => {
    assert.equal(fridgeUseBy('2026-11-01', 'cold-salad'), '2026-11-03');
  },
);

qa('boxUseBy: a frozen box has no use-by until it is moved to the fridge', [boxUseBy], () => {
  const batch = batchOf('2026-11-01', boxOf('box-2', 'freezer'));
  for (const storage of [['cooked-starch'], ['cooked-meat'], ['cooked-curry', 'cooked-meat']])
    assert.equal(boxUseBy(batch, batch.boxes[0], lib(...storage), INDEX, RULES), null);
});

qa(
  'boxUseBy: moved to the fridge on Monday 2 Nov → use-by Tuesday 3 Nov (A18 step 4)',
  [boxUseBy],
  () => {
    // moved date + thawedFridgeDays (1), whatever the components and the cooked date
    const moved = batchOf('2026-11-01', boxOf('box-2', 'fridge', '2026-11-02'));
    for (const storage of [
      ['cooked-starch'],
      ['cooked-meat'],
      ['cooked-meat', 'cold-salad', 'cooked-starch'],
    ])
      assert.equal(boxUseBy(moved, moved.boxes[0], lib(...storage), INDEX, RULES), '2026-11-03');
    const late = batchOf('2026-11-01', boxOf('box-2', 'fridge', '2026-12-31'));
    assert.equal(boxUseBy(late, late.boxes[0], lib('cooked-meat'), INDEX, RULES), '2027-01-01');
  },
);

qa(
  'boxUseBy: a rice batch of 4 (A18 step 1–2): box 1 fridge, boxes 2–4 freezer',
  [boxUseBy],
  () => {
    const batch = batchOf(
      '2026-11-01',
      boxOf('box-1'),
      boxOf('box-2', 'freezer'),
      boxOf('box-3', 'freezer'),
      boxOf('box-4', 'freezer'),
    );
    const recipe = lib('cooked-meat', 'cooked-starch', 'cold-salad');
    const got = batch.boxes.map((b) => boxUseBy(batch, b, recipe, INDEX, RULES));
    assert.deepEqual(got, ['2026-11-02', null, null, null]);
  },
);

qa(
  'boxUseBy: across the Madrid clock change on Sun 25 Oct 2026 (a 25-hour day) days still count whole',
  [boxUseBy],
  () => {
    // Cooked Sat 24 Oct. A naive "+24 h × n" in Madrid time lands one hour early after the change.
    assert.equal(fridgeUseBy('2026-10-24', 'cooked-starch'), '2026-10-25'); // +1
    assert.equal(fridgeUseBy('2026-10-24', 'cold-salad'), '2026-10-26'); // +2
    assert.equal(fridgeUseBy('2026-10-24', 'cooked-meat'), '2026-10-27'); // +3
    assert.equal(fridgeUseBy('2026-10-23', 'cooked-meat'), '2026-10-26'); // +3 over the long Sunday
    assert.equal(fridgeUseBy('2026-10-25', 'cooked-starch'), '2026-10-26'); // cooked on the day itself
    assert.equal(fridgeUseBy('2026-10-25', 'cooked-meat'), '2026-10-28');
    // thawed box moved on the long Sunday
    const moved = batchOf('2026-10-10', boxOf('box-2', 'fridge', '2026-10-25'));
    assert.equal(boxUseBy(moved, moved.boxes[0], lib('cooked-meat'), INDEX, RULES), '2026-10-26');
    // other changes: Madrid spring 29 Mar 2026 (23-hour day) and Los Angeles fall back 1 Nov 2026
    assert.equal(fridgeUseBy('2026-03-28', 'cooked-meat'), '2026-03-31');
    assert.equal(fridgeUseBy('2026-03-29', 'cooked-starch'), '2026-03-30');
    assert.equal(fridgeUseBy('2026-10-31', 'cooked-meat'), '2026-11-03');
  },
);

qa(
  'boxUseBy: every date of 2026–2027 × every fridge life equals calendar arithmetic (all DST changes)',
  [boxUseBy],
  () => {
    const lives = [
      ['cooked-starch', 1],
      ['cold-salad', 2],
      ['cooked-meat', 3],
    ];
    const rows = [];
    for (let d = '2026-01-01'; d <= '2027-12-31'; d = plusDays(d, 1)) rows.push(d);
    assert.equal(rows.length, 730);
    for (const date of rows) {
      for (const [id, days] of lives)
        assert.equal(fridgeUseBy(date, id), plusDays(date, days), `${date} ${id}`);
      const moved = batchOf('2026-01-01', boxOf('box-2', 'freezer', date));
      assert.equal(
        boxUseBy(moved, moved.boxes[0], lib('cooked-meat'), INDEX, RULES),
        plusDays(date, 1),
        `moved ${date}`,
      );
    }
  },
);

qa('boxUseBy: the answer is an ISO date string and nothing is changed', [boxUseBy], () => {
  const batch = frozen(batchOf('2026-11-01', boxOf('box-1'), boxOf('box-2', 'freezer')));
  const recipe = frozen(lib('cooked-meat', 'cooked-starch'));
  const index = new Map([...INDEX].map(([id, f]) => [id, frozen(f)]));
  const rules = frozen(RULES);
  const a = boxUseBy(batch, batch.boxes[0], recipe, index, rules);
  assert.match(a, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(boxUseBy(batch, batch.boxes[1], recipe, index, rules), null);
  assert.equal(boxUseBy(batch, batch.boxes[0], recipe, index, rules), a, 'pure: same answer twice');
});

qa(
  'boxUseBy: the use-by does not depend on the box status (placed, eaten, discarded keep their date)',
  [boxUseBy],
  () => {
    for (const status of ['available', 'placed', 'eaten', 'discarded']) {
      const batch = batchOf('2026-11-01', boxOf('box-1', 'fridge', null, status));
      assert.equal(
        boxUseBy(batch, batch.boxes[0], lib('cooked-starch'), INDEX, RULES),
        '2026-11-02',
        status,
      );
    }
  },
);

// ------------------------------------------------------------------ boxesLeft (A17)

const statuses = (...list) => ({
  id: 'b',
  recipeId: 'r',
  cookedOn: '2026-11-01',
  boxes: list.map((status, i) => boxOf(`box-${i + 1}`, 'fridge', null, status)),
});

qa('boxesLeft: counts the boxes with status "available"', [boxesLeft], () => {
  assert.equal(boxesLeft(statuses('available', 'available', 'available', 'available')), 4);
  assert.equal(boxesLeft(statuses('available', 'placed', 'eaten', 'discarded')), 1);
  assert.equal(boxesLeft(statuses('placed', 'placed', 'placed', 'placed')), 0); // A17: "0 of 4 left"
  assert.equal(boxesLeft(statuses('eaten', 'discarded')), 0);
  assert.equal(boxesLeft(statuses()), 0);
  assert.equal(typeof boxesLeft(statuses('available')), 'number');
});

qa('boxesLeft: frozen boxes that are available count as left', [boxesLeft], () => {
  const batch = {
    ...statuses('available', 'available', 'available', 'available'),
    boxes: [
      boxOf('box-1'),
      boxOf('box-2', 'freezer'),
      boxOf('box-3', 'freezer'),
      boxOf('box-4', 'freezer', '2026-11-02'),
    ],
  };
  assert.equal(boxesLeft(batch), 4);
});

qa(
  'boxesLeft: property: always the number of available boxes, never negative, input unchanged',
  [boxesLeft],
  () => {
    const random = rng(17);
    const all = ['available', 'placed', 'eaten', 'discarded'];
    for (let i = 0; i < 200; i++) {
      const list = Array.from(
        { length: Math.floor(random() * 13) },
        () => all[Math.floor(random() * 4)],
      );
      const batch = frozen(statuses(...list));
      const left = boxesLeft(batch);
      assert.equal(left, list.filter((s) => s === 'available').length, list.join());
      assert.ok(left >= 0);
    }
  },
);

// ------------------------------------------------------------------ useByStatus (A18 steps 3 and 5)

qa(
  'useByStatus: null without a use-by, then ok / last-day / past by calendar date',
  [useByStatus],
  () => {
    assert.equal(useByStatus(null, '2026-11-02'), null);
    // box 1 of the A18 batch: use-by Monday 2 Nov
    assert.equal(useByStatus('2026-11-02', '2026-11-01'), 'ok'); // Sunday 21:00
    assert.equal(useByStatus('2026-11-02', '2026-11-02'), 'last-day'); // Monday 12:00
    assert.equal(useByStatus('2026-11-02', '2026-11-03'), 'past'); // Tuesday 09:00
    assert.equal(useByStatus('2026-11-02', '2027-01-01'), 'past');
    // across the long Sunday of 25 Oct 2026 (comparison is by date, not by hours)
    assert.equal(useByStatus('2026-10-26', '2026-10-25'), 'ok');
    assert.equal(useByStatus('2026-10-25', '2026-10-25'), 'last-day');
    assert.equal(useByStatus('2026-10-25', '2026-10-26'), 'past');
    assert.equal(useByStatus('2026-12-31', '2027-01-01'), 'past');
  },
);

qa('useByStatus: bad dates throw RangeError or TypeError', [useByStatus], () => {
  assertBadInput(() => useByStatus('2026-11-02', 'tomorrow'));
  assertBadInput(() => useByStatus('2026-13-45', '2026-11-02'));
});

// ------------------------------------------------------------------ recipeTotals

qa(
  'recipeTotals: lines, unrounded totals, raw and cooked grams (hand sums above)',
  [recipeTotals],
  () => {
    const t = recipeTotals(tikka(), INDEX);
    assert.deepEqual(
      t.lines.map((l) => [l.foodId, l.servingId, l.qty]),
      [
        ['qa-chicken', 'g', 800],
        ['qa-dahi', 'g', 200],
        ['qa-oil', 'tbsp', 2],
        ['qa-rice', 'g', 320],
        ['qa-cucumber', 'medium', 2],
      ],
    );
    assertClose(t.lines[2].grams, 27.2, 1e-9); // 2 × 13.6
    assertClose(t.lines[4].grams, 300, 1e-9); // 2 × 150
    assertClose(t.lines[0].nutrients.kcal, 1320, 1e-9); // 165 × 8
    assertClose(t.lines[2].nutrients.kcal, 240.448, 1e-9); // 884 × 0.272
    assertClose(t.rawGrams, SUM_G, 1e-9);
    assertClose(t.cookedGrams, SUM_G, 1e-9, 'no weighed pot: cooked = raw');
    for (const k of NUTRIENT_KEYS) assertClose(t.total[k], TOTAL[k], 1e-9, k);
    assert.deepEqual(t.missing, []);
    assertClose(recipeTotals(tikka({ cookedWeightG: 1300 }), INDEX).cookedGrams, 1300, 1e-9);
  },
);

qa('foodFromRecipe: per100g is unrounded: total / cooked × 100 (§13.2)', [foodFromRecipe], () => {
  const f = derive(tikka({ cookedWeightG: 1300 }));
  const want = per100(TOTAL, 1300);
  for (const k of NUTRIENT_KEYS) assertClose(f.per100g[k], want[k], 1e-9, k);
});

// ------------------------------------------------------------------ worstHalal (§13.2, NUTRITION §4.6)

qa("worstHalal: not-halal > check > halal, with that food's reason and id", [worstHalal], () => {
  assert.deepEqual(worstHalal([]), { status: 'halal', reason: null, foodId: null });
  assert.equal(worstHalal([CHICKEN, RICE]).status, 'halal');
  assert.equal(worstHalal([CHICKEN, RICE]).reason, null);
  assert.deepEqual(worstHalal([CHICKEN, CHEESE, RICE]), {
    status: 'check',
    reason: CHEESE.halal.reason,
    foodId: 'qa-cheese',
  });
  assert.deepEqual(worstHalal([CHEESE, PASTRY, CHICKEN]), {
    status: 'not-halal',
    reason: PASTRY.halal.reason,
    foodId: 'qa-pastry',
  });
  assert.equal(worstHalal([PASTRY, CHEESE]).status, 'not-halal');
  assert.equal(worstHalal([WINE, CHEESE]).status, 'check');
  assert.ok([CHEESE.halal.reason, WINE.halal.reason].includes(worstHalal([WINE, CHEESE]).reason));
});

qa(
  'worstHalal: the rules order decides (worstFirst) and the status never depends on list order',
  [worstHalal],
  () => {
    assert.deepEqual(RULES.vocab.halalRules.worstFirst, ['not-halal', 'check', 'halal']);
    const random = rng(11);
    const pool = [CHICKEN, RICE, CHEESE, WINE, PASTRY, DAHI];
    for (let i = 0; i < 60; i++) {
      const list = shuffled(pool, random).slice(0, 1 + Math.floor(random() * 5));
      const want = list.some((f) => f.halal.status === 'not-halal')
        ? 'not-halal'
        : list.some((f) => f.halal.status === 'check')
          ? 'check'
          : 'halal';
      assert.equal(worstHalal(list, RULES).status, want, list.map((f) => f.id).join());
      assert.equal(worstHalal(list).status, want, 'without rules');
    }
  },
);

qa('worstHalal: bad input throws TypeError', [worstHalal], () => {
  assertBadInput(() => worstHalal(null));
  assertBadInput(() => worstHalal('qa-cheese'));
});

// ------------------------------------------------------------------ storageIds and storagePlan (NUTRITION §5.4, A18)

/** A food of a given group (for the group-based storage inference of §13.2). */
const inGroup = (group) =>
  food(`qa-${group}`, [100, 5, 10, 2, 1], one('portion', 100), undefined, { group });
const GROUP_FOODS = [
  'meat-fish',
  'egg',
  'vegetable',
  'bread',
  'grain-cooked',
  'pasta-dish',
  'daal-legume',
  'side-dip',
  'fruit',
].map(inGroup);
const GINDEX = indexOf(GROUP_FOODS);
const recipeOfGroups = (groups, patch = {}) => ({
  id: 'my-recipe-qa-groups',
  name: 'Groups',
  createdAt: '2026-11-01',
  ingredients: groups.map((g) => grams(`qa-${g}`, 100)),
  cookedWeightG: null,
  boxes: 4,
  ...patch,
});
const inferred = (...groups) =>
  [...new Set(storageIds(recipeOfGroups(groups), GINDEX, RULES))].sort();

qa("storageIds: the recipe's own non-empty list wins, as given", [storageIds], () => {
  const own = tikka({ storage: ['cooked-meat', 'cold-salad'] });
  assert.deepEqual(storageIds(own, INDEX, RULES), ['cooked-meat', 'cold-salad']);
});

qa(
  'storageIds: inferred from the ingredient groups when the list is null or empty (§13.2)',
  [storageIds],
  () => {
    for (const storage of [null, [], undefined]) {
      assert.deepEqual(
        [...new Set(storageIds(recipeOfGroups(['meat-fish'], { storage }), GINDEX, RULES))],
        ['cooked-meat'],
      );
    }
    assert.deepEqual(inferred('meat-fish'), ['cooked-meat']);
    assert.deepEqual(inferred('egg'), ['egg-dish']);
    assert.deepEqual(inferred('grain-cooked'), ['cooked-starch']); // rice
    assert.deepEqual(inferred('pasta-dish'), ['cooked-starch']);
    assert.deepEqual(inferred('vegetable'), ['cooked-curry']);
    assert.deepEqual(inferred('daal-legume'), ['cooked-curry']);
    assert.deepEqual(inferred('bread'), ['cooked-flatbread']);
    assert.deepEqual(inferred('side-dip'), ['cold-salad']);
    assert.deepEqual(inferred('meat-fish', 'grain-cooked'), ['cooked-meat', 'cooked-starch']);
    assert.deepEqual(inferred('fruit'), ['cooked-curry'], 'nothing matches → cooked-curry');
  },
);

qa(
  'storagePlan: first min(boxes, fridge days) boxes in the fridge, the rest frozen (A18 step 1)',
  [storagePlan],
  () => {
    const plan = (ids, boxes) => storagePlan(tikka({ storage: ids }), boxes, INDEX, RULES);
    // rice keeps 1 day: box 1 in the fridge, boxes 2–4 in the freezer
    assert.deepEqual(plan(['cooked-starch'], 4), {
      fridgeDays: 1,
      freezable: true,
      storage: ['fridge', 'freezer', 'freezer', 'freezer'],
    });
    // meat keeps 3 days: boxes 1–3 fridge, box 4 freezer; 2 boxes → both fridge
    assert.deepEqual(plan(['cooked-meat'], 4).storage, ['fridge', 'fridge', 'fridge', 'freezer']);
    assert.equal(plan(['cooked-meat'], 4).fridgeDays, 3);
    assert.deepEqual(plan(['cooked-meat'], 2).storage, ['fridge', 'fridge']);
    assert.deepEqual(plan(['cooked-starch'], 1).storage, ['fridge']);
    // the shortest component sets the fridge days: meat 3 + rice 1 → 1
    assert.equal(plan(['cooked-meat', 'cooked-starch'], 4).fridgeDays, 1);
    assert.deepEqual(plan(['cooked-meat', 'cooked-starch'], 4).storage, [
      'fridge',
      'freezer',
      'freezer',
      'freezer',
    ]);
    // chaat salad: 2 days and "do not freeze" → every box stays in the fridge (A18 step 6)
    assert.deepEqual(plan(['cold-salad'], 4), {
      fridgeDays: 2,
      freezable: false,
      storage: ['fridge', 'fridge', 'fridge', 'fridge'],
    });
    for (const id of ['egg-dish', 'overnight-oats'])
      assert.deepEqual(
        plan([id], 3),
        { fridgeDays: 3, freezable: false, storage: ['fridge', 'fridge', 'fridge'] },
        id,
      );
  },
);

// ------------------------------------------------------------------ placeBox (A17)

qa(
  'placeBox: marks that box placed on the date with the entry id; the other boxes are untouched',
  [placeBox],
  () => {
    const batch = frozen(statuses('available', 'available', 'available', 'available'));
    const next = placeBox(batch, 'box-2', { date: '2026-11-02', entryId: 'entry-mon' });
    assert.equal(next.boxes[1].status, 'placed');
    assert.deepEqual(next.boxes[1].placed, { date: '2026-11-02', entryId: 'entry-mon' });
    for (const i of [0, 2, 3]) assert.deepEqual(next.boxes[i], batch.boxes[i]);
    assert.equal(boxesLeft(next), 3);
    // the box keeps its storage and the batch keeps its identity
    assert.equal(next.boxes[1].storage, 'fridge');
    assert.equal(next.id, batch.id);
    assert.equal(next.recipeId, batch.recipeId);
    assert.equal(next.cookedOn, batch.cookedOn);
  },
);

qa(
  'placeBox: four placements Mon–Thu leave "0 of 4 left" (A17 step 1)',
  [placeBox, boxesLeft],
  () => {
    let batch = statuses('available', 'available', 'available', 'available');
    const dates = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];
    dates.forEach((date, i) => {
      batch = placeBox(batch, `box-${i + 1}`, { date, entryId: `entry-${i + 1}` });
    });
    assert.equal(boxesLeft(batch), 0);
    assert.deepEqual(
      batch.boxes.map((b) => b.placed.date),
      dates,
    );
    assert.equal(new Set(batch.boxes.map((b) => b.placed.entryId)).size, 4);
    assert.ok(batch.boxes.every((b) => b.status === 'placed'));
  },
);

qa(
  'placeBox: a box that is not available (or not there) is a RangeError (A17 step 2: no boxes left)',
  [placeBox],
  () => {
    const batch = statuses('placed', 'eaten', 'discarded', 'available');
    const at = { date: '2026-11-06', entryId: 'entry-fri' };
    for (const id of ['box-1', 'box-2', 'box-3', 'box-99'])
      assertThrowsKind(() => placeBox(batch, id, at), [RangeError], id);
    assert.equal(placeBox(batch, 'box-4', at).boxes[3].status, 'placed');
  },
);

qa('placeBox: does not change the batch it is given', [placeBox], () => {
  const batch = frozen(statuses('available', 'available'));
  const copy = structuredClone(batch);
  placeBox(batch, 'box-1', { date: '2026-11-02', entryId: 'entry-1' });
  assert.deepEqual(batch, copy);
});

// ------------------------------------------------------------------ syncBatches (§13.2: boxes follow their entries)

const entryFor = (id, status, boxRef) => ({
  id,
  slot: 'lunch',
  foodId: 'pk-qa-box',
  servingId: 'box',
  qty: 1,
  status,
  snapshot: { name: 'Box', grams: 400, kcal: 600, protein: 40, carbs: 60, fat: 20, fiber: 8 },
  ...(boxRef ? { boxRef } : {}),
});
const dayOf = (date, ...entries) => ({ date, entries });
const ref = (boxId, batchId = 'b') => ({ batchId, boxId });
const boxStates = (batch) => batch.boxes.map((b) => b.status);

qa(
  "syncBatches: a planned entry places its box on the entry's date; eaten makes it eaten",
  [syncBatches],
  () => {
    const batches = [statuses('available', 'available', 'available')];
    const days = {
      '2026-11-02': dayOf('2026-11-02', entryFor('e1', 'planned', ref('box-1'))),
      '2026-11-03': dayOf('2026-11-03', entryFor('e2', 'eaten', ref('box-2'))),
    };
    const [out] = syncBatches(batches, days);
    assert.deepEqual(boxStates(out), ['placed', 'eaten', 'available']);
    assert.deepEqual(out.boxes[0].placed, { date: '2026-11-02', entryId: 'e1' });
    assert.equal(out.boxes[2].placed, null);
    assert.equal(boxesLeft(out), 1);
  },
);

qa(
  'syncBatches: ticking Monday eaten (A17 step 3) and deleting an entry frees its box',
  [syncBatches, boxesLeft],
  () => {
    const placed = (n) => ({
      ...statuses(...Array(4).fill('available')),
      boxes: Array.from({ length: 4 }, (_, i) => ({
        ...boxOf(`box-${i + 1}`, 'fridge', null, i < n ? 'placed' : 'available'),
        placed: i < n ? { date: `2026-11-0${i + 2}`, entryId: `e${i + 1}` } : null,
      })),
    });
    const mon = (status) => dayOf('2026-11-02', entryFor('e1', status, ref('box-1')));
    const tue = dayOf('2026-11-03', entryFor('e2', 'planned', ref('box-2')));
    const wed = dayOf('2026-11-04', entryFor('e3', 'planned', ref('box-3')));
    const thu = dayOf('2026-11-05', entryFor('e4', 'planned', ref('box-4')));
    const days = (m) => ({
      '2026-11-02': m,
      '2026-11-03': tue,
      '2026-11-04': wed,
      '2026-11-05': thu,
    });
    // everything planned: nothing to change, "0 of 4 left"
    const same = [placed(4)];
    assert.equal(syncBatches(same, days(mon('planned'))), same, 'same array back');
    // tick Monday: box 1 eaten, still 0 left
    const [ticked] = syncBatches(same, days(mon('eaten')));
    assert.deepEqual(boxStates(ticked), ['eaten', 'placed', 'placed', 'placed']);
    assert.equal(boxesLeft(ticked), 0);
    // delete Thursday's entry: box 4 is available again
    const [freed] = syncBatches(same, {
      ...days(mon('planned')),
      '2026-11-05': dayOf('2026-11-05'),
    });
    assert.deepEqual(boxStates(freed), ['placed', 'placed', 'placed', 'available']);
    assert.equal(freed.boxes[3].placed, null);
    assert.equal(boxesLeft(freed), 1);
  },
);

qa(
  'syncBatches: an entry moved to another day keeps its box, with the new date',
  [syncBatches],
  () => {
    const batch = {
      ...statuses('placed'),
      boxes: [
        {
          ...boxOf('box-1', 'fridge', null, 'placed'),
          placed: { date: '2026-11-02', entryId: 'e1' },
        },
      ],
    };
    const [out] = syncBatches([batch], {
      '2026-11-04': dayOf('2026-11-04', entryFor('e1', 'planned', ref('box-1'))),
    });
    assert.equal(out.boxes[0].status, 'placed');
    assert.deepEqual(out.boxes[0].placed, { date: '2026-11-04', entryId: 'e1' });
  },
);

qa(
  'syncBatches: an eaten or placed box with no entry is available again; discarded stays discarded',
  [syncBatches],
  () => {
    const batch = statuses('placed', 'eaten', 'discarded', 'available');
    const [out] = syncBatches([batch], {});
    assert.deepEqual(boxStates(out), ['available', 'available', 'discarded', 'available']);
    // a discarded box stays discarded even when an entry still points at it
    const [again] = syncBatches([batch], {
      '2026-11-02': dayOf('2026-11-02', entryFor('e1', 'planned', ref('box-3'))),
    });
    assert.equal(again.boxes[2].status, 'discarded');
  },
);

qa(
  'syncBatches: entries of another batch, or without a boxRef, change nothing',
  [syncBatches],
  () => {
    const batches = [statuses('available', 'available')];
    const days = {
      '2026-11-02': dayOf(
        '2026-11-02',
        entryFor('e1', 'planned', ref('box-1', 'other-batch')),
        entryFor('e2', 'eaten', null),
      ),
    };
    assert.equal(syncBatches(batches, days), batches);
    // two batches: each box follows only its own batch's entry
    const two = [
      { ...statuses('available', 'available'), id: 'b1' },
      { ...statuses('available', 'available'), id: 'b2' },
    ];
    const [one1, two2] = syncBatches(two, {
      '2026-11-02': dayOf('2026-11-02', entryFor('e1', 'planned', ref('box-1', 'b2'))),
    });
    assert.deepEqual(boxStates(one1), ['available', 'available']);
    assert.deepEqual(boxStates(two2), ['placed', 'available']);
  },
);

qa(
  'syncBatches: does not change its inputs and returns the same array when nothing changed',
  [syncBatches],
  () => {
    const batches = frozen([statuses('available', 'available')]);
    const days = frozen({
      '2026-11-02': dayOf('2026-11-02', entryFor('e1', 'planned', ref('box-1'))),
    });
    const out = syncBatches(batches, days);
    assert.notEqual(out, batches);
    assert.equal(batches[0].boxes[0].status, 'available');
    assert.equal(syncBatches(out, days), out, 'second run: nothing to change');
    assert.deepEqual(syncBatches([], days), []);
  },
);

// ------------------------------------------------------------------ shoppingList (A18 step 7)

const sectionsOf = (list) => list.sections.map((s) => s.id);
const itemsOf = (list) => list.sections.flatMap((s) => s.items);
const gramsOfFood = (list, foodId) =>
  itemsOf(list)
    .filter((i) => i.foodId === foodId)
    .map((i) => i.grams);
const sectionOfFood = (list, foodId) =>
  list.sections.find((s) => s.items.some((i) => i.foodId === foodId))?.id;
const LABELS = { butcher: 'Halal butcher', supermarket: 'Supermarket' };
const labelOf = (id) => RULES.mealPrep.shopSections?.find((s) => s.id === id)?.label ?? LABELS[id];
const list = (plans) => shoppingList(plans, INDEX, RULES);

qa(
  'shoppingList: every line scales with the boxes: 8 boxes doubles 4 boxes (A18 step 7)',
  [shoppingList],
  () => {
    const at4 = list([{ recipe: tikka(), boxes: 4 }]);
    // tikka(): chicken 800 g, dahi 200 g, oil 2 tbsp = 27.2 g, rice 320 g, cucumber 2 × 150 = 300 g
    const want = {
      'qa-chicken': 800,
      'qa-dahi': 200,
      'qa-oil': 27.2,
      'qa-rice': 320,
      'qa-cucumber': 300,
    };
    for (const [id, g] of Object.entries(want)) {
      assert.equal(gramsOfFood(at4, id).length, 1, `${id} appears once`);
      assertClose(gramsOfFood(at4, id)[0], g, 1e-9, id);
    }
    for (const [boxes, factor] of [
      [8, 2],
      [2, 0.5],
      [5, 1.25],
      [12, 3],
    ]) {
      const out = list([{ recipe: tikka(), boxes }]);
      for (const [id, g] of Object.entries(want))
        assertClose(gramsOfFood(out, id)[0], g * factor, 1e-9, `${id} × ${factor}`);
    }
  },
);

qa(
  'shoppingList: a food used twice in a recipe, or in two plans, appears once with the summed grams',
  [shoppingList],
  () => {
    // oil twice in one recipe: 2 tbsp (27.2 g) + 20 g
    const twice = tikka({
      ingredients: [ing('qa-oil', 'tbsp', 2), grams('qa-oil', 20), grams('qa-rice', 100)],
    });
    assertClose(gramsOfFood(list([{ recipe: twice, boxes: 4 }]), 'qa-oil')[0], 47.2, 1e-9);
    assert.equal(gramsOfFood(list([{ recipe: twice, boxes: 4 }]), 'qa-oil').length, 1);
    // dahi in a user recipe (200 g for 4 boxes) and a library recipe (300 g for 4 boxes, cooked 2 boxes → 150 g)
    const library = {
      foodId: 'pk-qa-box',
      boxes: 4,
      storage: ['cooked-meat'],
      ingredients: [
        { foodId: 'qa-dahi', grams: 300 },
        { foodId: 'qa-chicken', grams: 400 },
      ],
    };
    const out = list([
      { recipe: tikka(), boxes: 4 },
      { recipe: library, boxes: 2 },
    ]);
    assert.deepEqual(
      gramsOfFood(out, 'qa-dahi').map((g) => Math.round(g * 1e6) / 1e6),
      [350],
    );
    assert.deepEqual(
      gramsOfFood(out, 'qa-chicken').map((g) => Math.round(g * 1e6) / 1e6),
      [1000],
    ); // 800 + 200
  },
);

qa(
  'shoppingList: ingredients without a foodId merge by name and show that name',
  [shoppingList],
  () => {
    const a = {
      foodId: 'pk-qa-a',
      boxes: 4,
      storage: ['cooked-meat'],
      ingredients: [
        { name: 'Fresh mint', grams: 8 },
        { foodId: 'qa-chicken', name: 'Chicken thigh, boneless', grams: 400 },
      ],
    };
    const b = {
      foodId: 'pk-qa-b',
      boxes: 4,
      storage: ['cooked-meat'],
      ingredients: [{ name: 'Fresh mint', grams: 4 }],
    };
    const out = list([
      { recipe: a, boxes: 4 },
      { recipe: b, boxes: 8 },
    ]);
    const mint = itemsOf(out).filter((i) => i.name === 'Fresh mint');
    assert.equal(mint.length, 1);
    assertClose(mint[0].grams, 16, 1e-9); // 8 + 4 × 2
    // a given name is shown; else the food's own name
    assert.equal(
      itemsOf(out).find((i) => i.foodId === 'qa-chicken').name,
      'Chicken thigh, boneless',
    );
    const plain = list([{ recipe: tikka(), boxes: 4 }]);
    assert.equal(itemsOf(plain).find((i) => i.foodId === 'qa-rice').name, 'qa-rice');
    assert.equal(
      new Set(itemsOf(out).map((i) => i.key)).size,
      itemsOf(out).length,
      'keys are unique',
    );
  },
);

qa(
  'shoppingList: meat is under the halal butcher (first), everything else under the supermarket',
  [shoppingList],
  () => {
    const out = list([{ recipe: tikka(), boxes: 4 }]);
    assert.deepEqual(sectionsOf(out), ['butcher', 'supermarket']);
    assert.deepEqual(
      out.sections.map((s) => s.label),
      [labelOf('butcher'), labelOf('supermarket')],
    );
    assert.equal(sectionOfFood(out, 'qa-chicken'), 'butcher');
    for (const id of ['qa-dahi', 'qa-oil', 'qa-rice', 'qa-cucumber'])
      assert.equal(sectionOfFood(out, id), 'supermarket', id);
    // empty sections are left out
    const veg = list([
      { recipe: tikka({ ingredients: [grams('qa-rice', 100), grams('qa-dahi', 50)] }), boxes: 4 },
    ]);
    assert.deepEqual(sectionsOf(veg), ['supermarket']);
    // curry-meat and grill-kebab foods are meat too
    const curry = inGroup('curry-meat');
    const kebab = inGroup('grill-kebab');
    const idx = indexOf([curry, kebab, RICE]);
    const recipe = tikka({
      ingredients: [
        grams('qa-curry-meat', 300),
        grams('qa-grill-kebab', 300),
        grams('qa-rice', 100),
      ],
    });
    const out2 = shoppingList([{ recipe, boxes: 4 }], idx, RULES);
    assert.equal(sectionOfFood(out2, 'qa-curry-meat'), 'butcher');
    assert.equal(sectionOfFood(out2, 'qa-grill-kebab'), 'butcher');
  },
);

qa(
  "shoppingList: an ingredient's own `section` overrides the group default",
  [shoppingList],
  () => {
    const recipe = {
      foodId: 'pk-qa-box',
      boxes: 4,
      storage: ['cooked-meat'],
      ingredients: [
        { foodId: 'qa-chicken', grams: 400, section: 'supermarket' },
        { foodId: 'qa-rice', grams: 100, section: 'butcher' },
      ],
    };
    const out = list([{ recipe, boxes: 4 }]);
    assert.equal(sectionOfFood(out, 'qa-chicken'), 'supermarket');
    assert.equal(sectionOfFood(out, 'qa-rice'), 'butcher');
  },
);

qa('shoppingList: no plans → no sections; inputs are not changed', [shoppingList], () => {
  assert.deepEqual(list([]), { sections: [] });
  const plans = frozen([{ recipe: tikka(), boxes: 8 }]);
  const index = new Map([...INDEX].map(([id, f]) => [id, frozen(f)]));
  const out = shoppingList(plans, index, frozen(RULES));
  assert.equal(itemsOf(out).length, 5);
});

qa(
  'shoppingList: property: scaling by k scales every line by k, whatever the boxes',
  [shoppingList],
  () => {
    const random = rng(5);
    for (let i = 0; i < 100; i++) {
      const recipeBoxes = 1 + Math.floor(random() * 8);
      const boxes = 1 + Math.floor(random() * 16);
      const recipe = tikka({ boxes: recipeBoxes });
      const base = list([{ recipe, boxes: recipeBoxes }]);
      const scaled = list([{ recipe, boxes }]);
      for (const item of itemsOf(base))
        assertClose(
          gramsOfFood(scaled, item.foodId)[0],
          (item.grams * boxes) / recipeBoxes,
          1e-9,
          `${item.foodId} ${boxes}/${recipeBoxes}`,
        );
    }
  },
);
