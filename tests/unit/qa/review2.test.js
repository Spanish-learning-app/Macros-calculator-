// QA suite for the Review 2 fix wave (Meeting 004, decision A), written from the decisions in
// team/meetings/004-review-2.md and the doc comments of the functions, with every expected value
// worked by hand, not from running the code. Owner: Kenji.
//   A1 search ranking     A2 ingredient quantities   A4 the weekly shopping list
//   A5 pork/alcohol note  A7 the family pot
// The browser side of the same items is tests/e2e/review2.spec.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { qa } from './_helpers.js';
import { FOODS, RULES } from '../../../app/data/index.js';
import { buildSearchIndex, searchFoods, foodKind } from '../../../app/core/search.js';
import { buildFoodIndex, validateFood } from '../../../app/core/foods.js';
import {
  shoppingList,
  shoppingForShop,
  buyAmount,
  foodFromRecipe,
  CUPBOARD_SECTION,
} from '../../../app/core/mealprep.js';
import {
  parseQuickAmount,
  quickPortion,
  rankIngredients,
} from '../../../app/ui/components/ingredient-sheet.js';
import { excludedTopic, searchNoteText } from '../../../app/ui/components/search-notes.js';
import { itemText, listText } from '../../../app/ui/views/prep.js';

const REAL = buildSearchIndex(FOODS);
const BY_ID = buildFoodIndex(FOODS);
const real = (id) => {
  const f = BY_ID.get(id);
  assert.ok(f, `test data: no food ${id}`);
  return f;
};
const ids = (hits) => hits.map((h) => h.food.id);

// =============================================================================== A1 search ranking

test('A1: "roti" lists every single food before any prep box, real data, no limit', () => {
  const { hits } = searchFoods(REAL, 'roti', { limit: Infinity });
  const kinds = hits.map((h) => foodKind(h.food));
  const firstPrep = kinds.indexOf('prep');
  assert.ok(firstPrep > 0, 'the roti search finds preps, and they are not first');
  assert.ok(
    kinds.slice(firstPrep).every((k) => k === 'prep'),
    `a single food comes after a prep: ${hits.map((h, i) => `${kinds[i]}:${h.food.id}`).join(' ')}`,
  );
  // the plain rotis lead
  assert.equal(hits[0].food.id, 'pk-roti', 'Roti / chapati is first');
  for (const id of ['pk-roti', 'pk-roti-ghee', 'pk-tandoori-roti']) {
    assert.ok(ids(hits).indexOf(id) < firstPrep, `${id} is above the preps`);
  }
});

test('A1: a prep is a Lab lunchbox record, and only those', () => {
  for (const f of FOODS) {
    assert.equal(foodKind(f), f.group === 'lunchbox' ? 'prep' : 'single', f.id);
  }
  assert.equal(foodKind({ ...real('pk-roti'), userRecipe: true }), 'own');
  assert.equal(foodKind({ group: 'lunchbox', userRecipe: true }), 'own');
});

test('A1: the prep tag is for preps, the own tag for own recipes (the sheet reads foodKind)', () => {
  const own = { ...real('pk-chicken-tikka-rice-box'), id: 'my-recipe-1', userRecipe: true };
  assert.equal(foodKind(own), 'own');
  assert.equal(foodKind(real('pk-chicken-tikka-rice-box')), 'prep');
  assert.equal(foodKind(real('pk-roti')), 'single');
});

test('A1: a single food and a prep with the same name: the single food first, in any input order', () => {
  const single = { id: 's', name: 'Roti', group: 'bread', servings: [] };
  const prep = { id: 'p', name: 'Roti', group: 'lunchbox', servings: [] };
  for (const list of [
    [prep, single],
    [single, prep],
  ]) {
    assert.deepEqual(ids(searchFoods(buildSearchIndex(list), 'roti').hits), ['s', 'p']);
  }
});

test('A1: own recipes come first, ahead of an exact single-food match', () => {
  const foods = [
    { id: 'roti', name: 'Roti', group: 'bread', servings: [] },
    {
      id: 'my-recipe-a',
      name: 'Salan with roti',
      group: 'lunchbox',
      userRecipe: true,
      servings: [],
    },
    { id: 'other', name: 'Roti wrap', group: 'bread', servings: [] },
  ];
  const { hits } = searchFoods(buildSearchIndex(foods), 'roti');
  assert.equal(hits[0].food.id, 'my-recipe-a');
  assert.deepEqual(ids(hits).slice(1), ['roti', 'other']);
});

test('A1: two own recipes order by match quality, then name, and then everything else', () => {
  const foods = [
    { id: 'z-single', name: 'Salan, plain', group: 'curry-veg', servings: [] },
    { id: 'o2', name: 'Zeera salan', group: 'lunchbox', userRecipe: true, servings: [] },
    { id: 'o1', name: 'Salan masala', group: 'lunchbox', userRecipe: true, servings: [] },
  ];
  const { hits } = searchFoods(buildSearchIndex(foods), 'salan');
  // o1 is a prefix match, o2 a word-prefix match; both own, so both above the single food
  assert.deepEqual(ids(hits), ['o1', 'o2', 'z-single']);
});

test('A1: plurals fold: "potatoes" and "eggs" find the potato and the egg', () => {
  assert.ok(ids(searchFoods(REAL, 'potatoes', { limit: 5 }).hits).includes('intl-potato-raw'));
  assert.ok(ids(searchFoods(REAL, 'eggs', { limit: 8 }).hits).includes('intl-egg-raw'));
});

// "rotis" ends in -is, which singularWord() keeps (its -ss/-us/-is guard), so "roti" is never
// searched: the only hits are the Spanish "2 rotis integrales" preps. "2 rotis" is how people type it.
qa(
  `BUG-S1 (fixed by Omar, reported to Lena): the plural "rotis" finds Roti / chapati, as "roti" does`,
  [searchFoods],
  () => {
    const top = ids(searchFoods(REAL, 'rotis', { limit: 8 }).hits);
    assert.ok(top.includes('pk-roti'), `rotis finds pk-roti in the first 8: ${top.join(', ')}`);
    assert.equal(foodKind(real(top[0])), 'single', 'and a single food leads, not a prep');
  },
);

// ====================================================================== A2 ingredient quantities

/** What the recipe ingredient sheet does for a typed line: parse, search, rank, first row. */
function pickFor(text) {
  const { amount, query } = parseQuickAmount(text);
  const found = searchFoods(REAL, query, { limit: 30 });
  const ok = rankIngredients(
    [...found.hits, ...found.hidden]
      .map((h) => h.food)
      .filter((f) => !f.userRecipe && f.halal?.status !== 'not-halal'),
  );
  return { amount, query, rows: ok, top: ok[0], portion: quickPortion(ok[0], amount) };
}

test('A2: "3 medium potatoes" is the raw potato, 3 medium (3 × 213 g = 639 g)', () => {
  const { amount, top, portion } = pickFor('3 medium potatoes');
  assert.deepEqual(amount, { unit: null, qty: 3, size: 'medium' });
  assert.equal(top.id, 'intl-potato-raw');
  assert.deepEqual(portion, { servingId: 'medium', qty: 3 });
  assert.equal(top.servings.find((s) => s.id === 'medium').grams * 3, 639);
});

test('A2: "5 eggs" is the raw egg, 5 of them, before the boiled and fried eggs', () => {
  const { top, portion, rows } = pickFor('5 eggs');
  assert.equal(top.id, 'intl-egg-raw');
  assert.equal(portion.qty, 5);
  const grams = top.servings.find((s) => s.id === portion.servingId).grams;
  assert.ok([220, 250].includes(grams * 5), `5 eggs weigh 5 × 44 or 5 × 50 g, got ${grams * 5}`);
  const at = (id) => rows.findIndex((f) => f.id === id);
  if (at('intl-egg-boiled') >= 0) assert.ok(at('intl-egg-raw') < at('intl-egg-boiled'));
  if (at('intl-egg-fried') >= 0) assert.ok(at('intl-egg-raw') < at('intl-egg-fried'));
});

test('A2: "250 g lentils" is dry lentils, 250 g, and the stew comes after every dry kind', () => {
  const { amount, top, portion, rows } = pickFor('250 g lentils');
  assert.deepEqual(amount, { unit: 'g', qty: 250 });
  assert.match(top.state, /\b(dry|raw)\b/i, `${top.id} is a dry or raw food`);
  assert.notEqual(top.id, 'es-lentejas');
  assert.deepEqual(portion, { servingId: 'g', qty: 250 });
  const stew = rows.findIndex((f) => f.id === 'es-lentejas');
  const jar = rows.findIndex((f) => f.id === 'es-lentejas-cocidas');
  const dry = ['es-lentejas-pardinas-secas', 'intl-masoor-dal-dry'].map((id) =>
    rows.findIndex((f) => f.id === id),
  );
  assert.ok(
    dry.every((i) => i >= 0 && i < stew && i < jar),
    `dry ${dry} before stew ${stew}/${jar}`,
  );
});

test('A2: sizes, counts and kitchen units parse as the decision says', () => {
  assert.deepEqual(parseQuickAmount('2 large eggs').amount, { unit: null, qty: 2, size: 'large' });
  assert.deepEqual(parseQuickAmount('small onion').amount, { unit: null, qty: 1, size: 'small' });
  assert.deepEqual(parseQuickAmount('1.5 kg rice').amount, { unit: 'g', qty: 1500 });
  assert.deepEqual(parseQuickAmount('1 pao chicken').amount, { unit: 'g', qty: 250 });
  assert.deepEqual(parseQuickAmount('2 tbsp oil').amount, { unit: 'tbsp', qty: 2 });
  assert.equal(parseQuickAmount('chicken').amount, null);
  assert.equal(parseQuickAmount('3').amount, null);
});

test('A2: a size the food has is used; a size it lacks falls back to the default serving', () => {
  const potato = real('intl-potato-raw'); // small 170, medium 213, large 369
  assert.deepEqual(quickPortion(potato, { unit: null, qty: 2, size: 'large' }), {
    servingId: 'large',
    qty: 2,
  });
  const lentils = real('es-lentejas-pardinas-secas');
  const q = quickPortion(lentils, { unit: null, qty: 2, size: 'large' });
  assert.equal(q.qty, 2);
  assert.ok(lentils.servings.some((s) => s.id === q.servingId));
});

// ================================================================== A4 the weekly shopping list

// Hand-built foods so every number below can be worked on paper.
const food = (id, name, group, servings, extra = {}) => ({ id, name, group, servings, ...extra });
const G = { id: 'g', label: '1 g', grams: 1 };
const KITCHEN = [
  food('chicken', 'Chicken thigh, raw', 'meat-fish', [G]),
  food('onion', 'Onion, raw', 'vegetable', [
    { id: 'medium', label: '1 medium onion', grams: 110, default: true },
  ]),
  food('tomato', 'Chopped tomatoes', 'vegetable', [G], {
    pack: { grams: 400, label: '400 g tin' },
  }),
  food(
    'egg',
    'Egg, raw',
    'egg',
    [{ id: 'large', label: '1 large egg', grams: 50, default: true }],
    { pack: { grams: 600, label: '12 eggs' } },
  ),
  food('rice', 'Basmati rice, dry', 'dry-staple', [G]),
  food('cumin', 'Cumin seeds', 'dry-staple', [G]),
  food('oil', 'Olive oil', 'fat-oil', [G]),
];
const KINDEX = new Map(KITCHEN.map((f) => [f.id, f]));

// Batch A: 4 boxes cooked as written. Batch B: written for 4, cooked as 8 boxes, so x2.
const recipeA = {
  id: 'ra',
  name: 'Chicken rice',
  boxes: 4,
  ingredients: [
    { foodId: 'cumin', grams: 5 },
    { foodId: 'oil', grams: 27 },
    { foodId: 'onion', servingId: 'medium', qty: 2 }, // 220 g
    { foodId: 'tomato', grams: 400 },
    { foodId: 'rice', grams: 320 },
    { foodId: 'chicken', grams: 800 },
  ],
};
const recipeB = {
  id: 'rb',
  name: 'Egg curry',
  boxes: 4,
  ingredients: [
    { foodId: 'egg', servingId: 'large', qty: 7 }, // 350 g
    { foodId: 'onion', servingId: 'medium', qty: 1 }, // 110 g
    { foodId: 'tomato', grams: 400 },
    { foodId: 'chicken', grams: 500 },
  ],
};
const PLANS = [
  { recipe: recipeA, boxes: 4 },
  { recipe: recipeB, boxes: 8 },
];
// Merged by hand:
//   chicken 800 + 500 x2 = 1800 g          onion 220 + 110 x2 = 440 g = 4 medium (2 + 1 x2)
//   tomato 400 + 400 x2 = 1200 g           egg 350 x2 = 700 g = 14 large
//   rice 320 g   cumin 5 g   oil 27 g

const flat = (list) => list.sections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.id })));
const item = (list, id) => flat(list).find((i) => i.foodId === id);

test('A4: shoppingList merges by food across batches and scales a batch by boxes ÷ recipe boxes', () => {
  const list = shoppingList(PLANS, KINDEX, RULES);
  const all = flat(list);
  assert.equal(new Set(all.map((i) => i.foodId)).size, all.length, 'each food once');
  assert.equal(all.length, 7);
  const grams = Object.fromEntries(all.map((i) => [i.foodId, i.grams]));
  assert.deepEqual(grams, {
    chicken: 1800,
    onion: 440,
    tomato: 1200,
    egg: 700,
    rice: 320,
    cumin: 5,
    oil: 27,
  });
  assert.deepEqual(item(list, 'onion').count, { qty: 4, label: 'medium onion' });
  assert.deepEqual(item(list, 'egg').count, { qty: 14, label: 'large egg' });
});

test('A4: butcher section first for meat, supermarket for the rest', () => {
  const list = shoppingList(PLANS, KINDEX, RULES);
  assert.deepEqual(
    list.sections.map((s) => s.id),
    ['butcher', 'supermarket'],
  );
  assert.deepEqual(
    list.sections[0].items.map((i) => i.foodId),
    ['chicken'],
  );
  assert.equal(list.sections[0].label, 'Halal butcher');
});

test('A4: shoppingForShop orders butcher, supermarket, then "Check you have"', () => {
  const shop = shoppingForShop(shoppingList(PLANS, KINDEX, RULES), KINDEX, RULES);
  assert.deepEqual(
    shop.sections.map((s) => s.id),
    ['butcher', 'supermarket', CUPBOARD_SECTION.id],
  );
  assert.equal(shop.sections[2].label, 'Check you have');
  assert.deepEqual(
    shop.sections[2].items.map((i) => i.foodId).sort(),
    ['cumin', 'oil'],
    'spices and oil are the cupboard staples; rice and tomatoes are shopping',
  );
  assert.deepEqual(
    shop.sections[0].items.map((i) => i.foodId),
    ['chicken'],
  );
  assert.deepEqual(shop.sections[1].items.map((i) => i.foodId).sort(), [
    'egg',
    'onion',
    'rice',
    'tomato',
  ]);
});

test('A4: packs when the food has a pack, counts when it is countable, else grams', () => {
  const shop = shoppingForShop(shoppingList(PLANS, KINDEX, RULES), KINDEX, RULES);
  const buy = (id) => item(shop, id).buy;
  // tomatoes: 1200 g ÷ 400 g tin = exactly 3 tins
  assert.deepEqual(buy('tomato'), {
    kind: 'pack',
    packs: 3,
    label: '400 g tin',
    grams: 1200,
    uses: null,
  });
  // eggs: 700 g ÷ 600 g per 12 = 1.17, so 2 packs; they use 14 large eggs
  assert.deepEqual(buy('egg'), {
    kind: 'pack',
    packs: 2,
    label: '12 eggs',
    grams: 700,
    uses: { qty: 14, label: 'large eggs' },
  });
  // onions: no pack, 440 g ÷ 110 g = exactly 4 medium onions
  assert.deepEqual(buy('onion'), { kind: 'count', qty: 4, label: 'medium onions', grams: 440 });
  // chicken and rice: neither a pack nor a count
  assert.deepEqual(buy('chicken'), { kind: 'grams', grams: 1800 });
  assert.deepEqual(buy('rice'), { kind: 'grams', grams: 320 });
});

test('A4: buyAmount rounds up whole packs and counts, with a small allowance for rounding', () => {
  const potato = food('potato', 'Potato, raw', 'vegetable', [
    { id: 'medium', label: '1 medium potato', grams: 150, default: true },
  ]);
  // 453 g is 3.02 potatoes: a person buys 3; 510 g is 3.4: 4; 150 g is 1: "potato", not "potatoes"
  assert.deepEqual(buyAmount(potato, 453), {
    kind: 'count',
    qty: 3,
    label: 'medium potatoes',
    grams: 453,
  });
  assert.equal(buyAmount(potato, 510).qty, 4);
  assert.deepEqual(buyAmount(potato, 150), {
    kind: 'count',
    qty: 1,
    label: 'medium potato',
    grams: 150,
  });
  const jar = food('jar', 'Achaar', 'condiment', [G], { pack: { grams: 400, label: '400 g jar' } });
  assert.equal(buyAmount(jar, 400).packs, 1, 'exactly one jar');
  assert.equal(buyAmount(jar, 400.5).packs, 2, 'a gram over is a second jar');
  assert.equal(buyAmount(jar, 1).packs, 1, 'a pinch still needs a jar');
  assert.deepEqual(buyAmount(undefined, 123), { kind: 'grams', grams: 123 });
});

test('A4: a name-only ingredient merges by name (any case) and lands in the supermarket', () => {
  const recipe = (id, grams) => ({
    id,
    name: id,
    boxes: 1,
    ingredients: [{ name: id === 'x' ? 'Fresh coriander' : 'fresh CORIANDER', grams }],
  });
  const list = shoppingList(
    [
      { recipe: recipe('x', 30), boxes: 1 },
      { recipe: recipe('y', 20), boxes: 1 },
    ],
    KINDEX,
    RULES,
  );
  const all = flat(list);
  assert.equal(all.length, 1);
  assert.equal(all[0].grams, 50);
  assert.equal(all[0].section, 'supermarket');
});

test('A4: nothing in the cupboard group means no empty "Check you have" section', () => {
  const plan = [
    {
      recipe: { id: 'r', name: 'r', boxes: 1, ingredients: [{ foodId: 'rice', grams: 100 }] },
      boxes: 1,
    },
  ];
  const shop = shoppingForShop(shoppingList(plan, KINDEX, RULES), KINDEX, RULES);
  assert.deepEqual(
    shop.sections.map((s) => s.id),
    ['supermarket'],
  );
});

test('A4: the list copies as text: a title, section names in order, one "- " line per food', () => {
  const shop = shoppingForShop(shoppingList(PLANS, KINDEX, RULES), KINDEX, RULES);
  const text = listText('Shopping for this week: 2 batches', shop);
  const lines = text.split('\n');
  assert.equal(lines[0], 'Shopping for this week: 2 batches');
  const heads = lines.filter((l) => l && !l.startsWith('- ') && l !== lines[0]);
  assert.deepEqual(heads, ['Halal butcher', 'Supermarket', 'Check you have']);
  assert.equal(lines.filter((l) => l.startsWith('- ')).length, 7);
  assert.ok(text.indexOf('Halal butcher') < text.indexOf('Supermarket'));
  assert.ok(text.indexOf('Supermarket') < text.indexOf('Check you have'));
  assert.doesNotMatch(text, /<[a-z]/i, 'plain text, no markup');
  // the lines carry what to buy
  assert.match(text, /Chopped tomatoes: 3 × 400 g tin/);
  assert.match(text, /Egg, raw: 2 packs of 12 eggs \(uses 14 large eggs/);
  assert.match(text, /Onion, raw: 4 medium onions/);
  assert.match(text, /Chicken thigh, raw: 1\.8 kg/);
  assert.match(text, /Basmati rice, dry: 320 g/);
});

test('A4: a pack line reads "N × label" for weights and "N packs of label" for counts', () => {
  const pack = (packs, label) =>
    itemText({ name: 'X', grams: 100, buy: { kind: 'pack', packs, label, uses: null } });
  assert.match(pack(2, '400 g jar'), /^X: 2 × 400 g jar/);
  assert.match(pack(1, '12 eggs'), /^X: 1 pack of 12 eggs/);
  assert.match(pack(2, '12 eggs'), /^X: 2 packs of 12 eggs/);
  assert.match(
    itemText({ name: 'Onion', grams: 330, buy: { kind: 'count', qty: 3, label: 'medium onions' } }),
    /^Onion: 3 medium onions \(330 g\)$/,
  );
  assert.equal(
    itemText({ name: 'Rice', grams: 1500, buy: { kind: 'grams', grams: 1500 } }),
    'Rice: 1.5 kg',
  );
});

test('A4: real data: two library batches merge by food, with the invariants of a shopping list', async () => {
  const { default: recipes } = await import('../../../app/data/recipes-mealprep.js');
  const usable = recipes.filter((r) => r.ingredients?.some((i) => i.foodId));
  assert.ok(usable.length >= 2, 'the Lab has recipes with ingredient lists');
  const plans = [
    { recipe: usable[0], boxes: usable[0].boxes ?? 4 },
    { recipe: usable[1], boxes: 2 * (usable[1].boxes ?? 4) },
  ];
  const list = shoppingList(plans, BY_ID, RULES);
  // independent expectation: grams per food key, summed straight from the recipe lines
  const want = new Map();
  for (const { recipe, boxes } of plans) {
    const factor = boxes / (recipe.boxes ?? 1);
    for (const ing of recipe.ingredients) {
      const key = ing.foodId
        ? `food:${ing.foodId}`
        : `name:${String(ing.name).trim().toLowerCase()}`;
      want.set(key, (want.get(key) ?? 0) + ing.grams * factor);
    }
  }
  const got = new Map(flat(list).map((i) => [i.key, i.grams]));
  assert.deepEqual([...got.keys()].sort(), [...want.keys()].sort());
  for (const [key, grams] of want) assert.ok(Math.abs(got.get(key) - grams) < 1e-6, key);
  const order = shoppingForShop(list, BY_ID, RULES).sections.map((s) => s.id);
  const rank = { butcher: 0, supermarket: 1, cupboard: 2 };
  assert.deepEqual(
    order,
    [...order].sort((a, b) => rank[a] - rank[b]),
  );
});

qa(
  `BUG-SH1 (fixed by Omar, reported to Javier): a pack must cover the eggs it says it uses: 14 large eggs is 2 packs of 12, not 1`,
  [buyAmount],
  () => {
    const egg = real('intl-egg-raw'); // large = 50 g, pack "12 eggs"
    const grams = 14 * egg.servings.find((s) => s.id === 'large').grams; // 700 g
    const buy = buyAmount(egg, grams);
    assert.equal(buy.uses.qty, 14);
    assert.equal(
      buy.packs,
      2,
      `1 × 12 eggs cannot give 14 eggs (pack.grams is ${egg.pack.grams} g)`,
    );
  },
);

qa(
  `BUG-SH1 (fixed by Omar, reported to Javier): every real pack with a count in its label covers the count the line says it uses (50 g to 3 kg)`,
  [buyAmount],
  () => {
    for (const f of FOODS.filter((x) => x.pack)) {
      const n = Number(String(f.pack.label).match(/^(\d+)\s/)?.[1]);
      if (!Number.isFinite(n)) continue;
      for (let grams = 50; grams <= 3000; grams += 50) {
        const buy = buyAmount(f, grams);
        if (buy.kind !== 'pack' || !buy.uses) continue;
        assert.ok(
          buy.packs * n >= buy.uses.qty,
          `${f.id}: ${grams} g uses ${buy.uses.qty} ${buy.uses.label} but buys ${buy.packs} × "${f.pack.label}"`,
        );
      }
    }
  },
);

test('A4: every pack in the real data is a positive weight with a label', () => {
  for (const f of FOODS.filter((x) => x.pack)) {
    assert.ok(Number.isFinite(f.pack.grams) && f.pack.grams > 0, `${f.id} pack.grams`);
    assert.ok(typeof f.pack.label === 'string' && f.pack.label.trim() !== '', `${f.id} pack.label`);
  }
});

// ===================================================================== A5 pork, alcohol, shellfish

const CALM = 'Katori has no pork or alcohol foods. Everything here is pork-free.';

test('A5: pork and alcohol words get the calm line when nothing is found', () => {
  for (const q of [
    'chorizo',
    'Chorizo',
    'chorizos',
    'jamón',
    'jamon serrano',
    'jamón ibérico',
    'bacon',
    'pork',
    'sobrasada',
    'cerveza',
    'una cerveza',
    'cervezas',
    'beer',
    'wine',
    'vino tinto',
    'sangria',
    'vodka',
  ]) {
    assert.equal(searchNoteText(q, { hits: 0 }), CALM, q);
  }
});

test('A5: chorizo and cerveza really find nothing in the real data (so the note is the answer)', () => {
  for (const q of ['chorizo', 'cerveza']) {
    assert.deepEqual(searchFoods(REAL, q, { limit: Infinity }), { hits: [], hidden: [] }, q);
    assert.equal(excludedTopic(q)?.topic, q === 'chorizo' ? 'pork' : 'alcohol');
  }
});

test('A5: ordinary food words never get the pork or alcohol line (real hit counts)', () => {
  // "pepper" starts pepperoni and "gin" starts ginger: only whole-word "gin" counts, and a partial
  // word shows the line only when nothing is found
  for (const q of [
    'chicken',
    'tikka',
    'rice',
    'ginger',
    'pepper',
    'hamburger',
    'roti',
    'daal',
    'beet',
    'ginger tea',
  ]) {
    const hits = searchFoods(REAL, q, { limit: 20 }).hits.length;
    assert.equal(searchNoteText(q, { hits }), null, `${q} (${hits} foods)`);
  }
});

test('A5: halal filter off: the line tells the truth about lard in bakery foods', () => {
  const text = searchNoteText('bacon', { hits: 0, halalOnly: false });
  assert.match(text, /no pork or alcohol foods/);
  assert.match(text, /lard/);
  assert.match(text, /Not halal/);
});

test('A5: a partly typed word (5+ letters) shows the line only while nothing is found', () => {
  assert.equal(searchNoteText('chori', { hits: 0 }), CALM);
  assert.equal(searchNoteText('chori', { hits: 3 }), null);
  assert.equal(searchNoteText('chorizo', { hits: 3 }), CALM, 'a whole word always shows it');
});

test('A5: gambas, calamares, pulpo and mejillones find the seafood records, with no pork line', () => {
  for (const [q, tag] of [
    ['gambas', 'seafood-prawn'],
    ['prawns', 'seafood-prawn'],
    ['calamares', 'seafood-other'],
    ['pulpo', 'seafood-other'],
    ['mejillones', 'seafood-other'],
  ]) {
    const { hits } = searchFoods(REAL, q, { limit: 20 });
    assert.ok(hits.length > 0, `${q} finds food`);
    assert.ok(
      hits.some((h) => h.food.tags?.includes(tag)),
      `${q} finds a ${tag} record: ${ids(hits).join(', ')}`,
    );
    assert.equal(
      searchNoteText(q, { hits: hits.length }),
      null,
      `${q} shows no note when it finds food`,
    );
    assert.equal(excludedTopic(q)?.topic, 'shellfish', q);
  }
});

test('A5: gambas al ajillo and gambas cocidas are both found by "gambas"', () => {
  const found = ids(searchFoods(REAL, 'gambas', { limit: 20 }).hits);
  assert.ok(found.includes('es-gambas-al-ajillo'));
  assert.ok(found.includes('intl-prawns-raw') || found.includes('intl-prawns-cooked'));
});

test('A5: a shellfish word with no record says so, calmly (and not the pork line)', () => {
  const none = searchNoteText('langosta', { hits: 0, hasShellfish: false });
  assert.match(none, /no (food for|prawns)/i);
  assert.doesNotMatch(none, /pork-free/);
  const some = searchNoteText('langosta', { hits: 0, hasShellfish: true });
  assert.match(some, /prawns/);
  assert.doesNotMatch(some, /pork-free/);
});

// ================================================================================ A7 the family pot

const potRecipe = (patch = {}) => ({
  id: 'my-recipe-pot',
  name: 'Mum’s salan',
  boxes: 1,
  cookedWeightG: 1600, // 8 katori x 200 ml, what the editor stores for a family pot
  ingredients: [
    { foodId: 'intl-chicken-thigh-raw', servingId: '100g', qty: 8 }, // 800 g, 149 kcal per 100 g
    { foodId: 'intl-cooking-oil', servingId: 'tbsp', qty: 2 }, // 2 x 13.6 = 27.2 g, 884 kcal per 100 g
  ],
  ...patch,
});

test('A7: a family pot logs by the katori: 1 katori = one eighth of an 8-katori pot', () => {
  const f = foodFromRecipe(potRecipe({ potKatori: 8 }), BY_ID, RULES);
  assert.deepEqual(validateFood(f, RULES), []);
  assert.equal(f.userRecipe, true);
  const servings = Object.fromEntries(f.servings.map((s) => [s.id, s]));
  assert.equal(servings.katori.grams, 200);
  assert.equal(servings.katori.default, true);
  assert.equal(servings.box.grams, 1600);
  assert.equal(servings.box.label, '1 whole pot');
  assert.ok(!servings.box.default);
  assert.equal(f.servings.filter((s) => s.default).length, 1, 'exactly one default serving');
  // per 100 g of the cooked pot: total kcal / 1600 g x 100
  const totalKcal = (149 * 800) / 100 + (884 * 27.2) / 100;
  assert.ok(Math.abs(f.per100g.kcal - (totalKcal / 1600) * 100) < 1e-9);
  // one katori (200 g) is totalKcal / 8
  assert.ok(Math.abs((f.per100g.kcal * servings.katori.grams) / 100 - totalKcal / 8) < 1e-9);
  // eight katori are the whole pot
  assert.ok(Math.abs(servings.katori.grams * 8 - servings.box.grams) < 1e-9);
});

test('A7: without potKatori the recipe still opens on the whole recipe, as before', () => {
  const f = foodFromRecipe(potRecipe({ boxes: 1, cookedWeightG: null }), BY_ID, RULES);
  const def = f.servings.find((s) => s.default);
  assert.equal(def.id, 'box');
  assert.equal(def.label, '1 whole recipe');
  assert.equal(def.grams, 800 + 27.2);
});

test('A7: a box recipe keeps "1 box" as its default, and also offers katori', () => {
  const f = foodFromRecipe(potRecipe({ boxes: 4, cookedWeightG: null }), BY_ID, RULES);
  assert.equal(f.servings.find((s) => s.default).id, 'box');
  assert.equal(f.servings.find((s) => s.id === 'box').label, '1 box');
  assert.equal(f.servings.find((s) => s.id === 'box').grams, (800 + 27.2) / 4);
  assert.ok(f.servings.some((s) => s.id === 'katori'));
});

test('A7: a pot of 6.5 katori is 1300 g; a katori of it is still 200 g and 1/6.5 of the pot', () => {
  const f = foodFromRecipe(potRecipe({ potKatori: 6.5, cookedWeightG: 1300 }), BY_ID, RULES);
  const kat = f.servings.find((s) => s.id === 'katori');
  const box = f.servings.find((s) => s.id === 'box');
  assert.equal(kat.grams, 200);
  assert.equal(box.grams, 1300);
  assert.ok(Math.abs(box.grams / kat.grams - 6.5) < 1e-9);
});

test('A7: own recipes rank first in search, by the same rule as a Lab dish of the same name', () => {
  const own = foodFromRecipe(potRecipe({ potKatori: 8, name: 'Salan' }), BY_ID, RULES);
  const index = buildSearchIndex([...FOODS, own]);
  const { hits } = searchFoods(index, 'salan', { limit: 10 });
  assert.equal(hits[0].food.id, own.id);
  assert.ok(hits.length > 1, 'and the library salan is still listed below it');
});
