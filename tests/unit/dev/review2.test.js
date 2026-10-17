// Author's tests for the Review 2 fix wave (team/meetings/004-review-2.md, decision A items 1–5,
// 7 and 8). Owner: Lena. Search ranking (own recipes, single foods, preps, plurals), the recipe
// picker's amounts and raw-first order, the pork / alcohol / shellfish line, the shopping list as
// you buy it and the weekly list, batch counts, the family pot in katori, and frozen-box wording.
// Real-data checks on app/data make a Lab edit that breaks a tester's repro show up here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchIndex, searchFoods, foodKind, singularWord } from '../../../app/core/search.js';
import {
  shoppingList,
  shoppingForShop,
  buyAmount,
  pluralLabel,
  foodFromRecipe,
  CUPBOARD_SECTION,
} from '../../../app/core/mealprep.js';
import { createStore } from '../../../app/ui/store.js';
import { RULES, FOODS } from '../../../app/data/index.js';
import LIBRARY from '../../../app/data/recipes-mealprep.js';
import {
  parseQuickAmount,
  quickPortion,
  ingredientRank,
  rankIngredients,
  amountText,
} from '../../../app/ui/components/ingredient-sheet.js';
import { excludedTopic, searchNoteText } from '../../../app/ui/components/search-notes.js';
import { frozenDueText, shortPrepName } from '../../../app/ui/components/prep-bits.js';
import { itemText, listText } from '../../../app/ui/views/prep.js';

const food = (id, name, extra = {}) => ({
  id,
  name,
  aliases: [],
  group: 'bread',
  halal: { status: 'halal' },
  servings: [{ id: 'piece', label: '1 piece', grams: 50, default: true }],
  per100g: { kcal: 100, protein: 5, carbs: 10, fat: 2, fiber: 1 },
  ...extra,
});
const ids = (result) => result.hits.map((h) => h.food.id);

// ------------------------------------------------------------------ item 1: search ranking

test('foodKind: own recipes, Lab preps (group lunchbox) and single foods', () => {
  assert.equal(foodKind(food('a', 'Roti')), 'single');
  assert.equal(foodKind(food('b', 'Roti box', { group: 'lunchbox', tags: ['meal-prep'] })), 'prep');
  assert.equal(foodKind(food('c', 'Boiled egg', { group: 'egg', tags: ['meal-prep'] })), 'single');
  assert.equal(foodKind(food('d', 'My pot', { group: 'lunchbox', userRecipe: true })), 'own');
  assert.equal(foodKind(null), 'single');
});

test('single foods rank before preps: a prep matches one tier lower, then singles win ties', () => {
  const foods = [
    food('prep-exact', 'Pan con tomate breakfast plate', {
      group: 'lunchbox',
      aliases: ['pan con tomate'],
    }),
    food('single-exact', 'Pan con tomate'),
    food('prep-prefix', 'Roti wrap box', { group: 'lunchbox' }),
    food('single-prefix', 'Roti with ghee'),
    food('single-word', 'Tandoori roti'),
    food('single-exact-roti', 'Roti'),
  ];
  const index = buildSearchIndex(foods);
  assert.deepEqual(ids(searchFoods(index, 'pan con tomate')), ['single-exact', 'prep-exact']);
  const roti = searchFoods(index, 'roti');
  assert.deepEqual(ids(roti), ['single-exact-roti', 'single-prefix', 'single-word', 'prep-prefix']);
  // the prep's prefix match is reported one tier lower, so hits stay sorted by score
  assert.equal(roti.hits.find((h) => h.food.id === 'prep-prefix').tier, 'wordPrefix');
  for (let i = 1; i < roti.hits.length; i += 1) {
    assert.ok(roti.hits[i - 1].score >= roti.hits[i].score);
  }
});

test('own recipes come first, whatever their tier (not fuzzy)', () => {
  const foods = [
    food('lib-salan', 'Chicken salan', { aliases: ['salan'], group: 'curry-meat' }),
    food('my-recipe-1', 'Ammi ka chicken salan pot', { group: 'lunchbox', userRecipe: true }),
    food('lib-egg-salan', 'Anda curry', { aliases: ['egg salan'], group: 'egg' }),
  ];
  const index = buildSearchIndex(foods);
  assert.deepEqual(ids(searchFoods(index, 'salan')), ['my-recipe-1', 'lib-salan', 'lib-egg-salan']);
});

test('singularWord and plural queries: "potatoes" finds potato, "peas" does not find peanuts', () => {
  assert.equal(singularWord('potatoes'), 'potato');
  assert.equal(singularWord('onions'), 'onion');
  assert.equal(singularWord('berries'), 'berry');
  assert.equal(singularWord('pies'), 'pie');
  assert.equal(singularWord('patatas'), 'patata');
  assert.equal(singularWord('hummus'), 'hummus');
  assert.equal(singularWord('glass'), 'glass');
  assert.equal(singularWord('egg'), 'egg');
  const foods = [
    food('potato', 'Potato, raw', { group: 'vegetable' }),
    food('meatballs', 'Meatballs with peas and potatoes', { group: 'lunchbox' }),
    food('peanuts', 'Peanuts', { group: 'nuts-seeds' }),
    food('pea', 'Pea shoots', { group: 'vegetable' }),
  ];
  const index = buildSearchIndex(foods);
  assert.deepEqual(ids(searchFoods(index, 'potatoes')), ['potato', 'meatballs']);
  assert.ok(!ids(searchFoods(index, 'peas')).includes('peanuts'));
  assert.ok(ids(searchFoods(index, 'peas')).includes('pea'));
});

test('real data: "roti" at Lunch lists rotis first; "pan con tomate" the single food first', () => {
  const store = makeStore({ now: new Date(2026, 9, 19, 13, 30) });
  const roti = store.search('roti', { slot: 'lunch' }).hits.map((h) => h.food);
  assert.equal(roti[0].id, 'pk-roti');
  assert.ok(
    roti.slice(0, 3).every((f) => f.group !== 'lunchbox'),
    roti.map((f) => f.id).join(', '),
  );
  const pct = store.search('pan con tomate', { slot: 'breakfast' }).hits;
  assert.equal(pct[0].food.id, 'es-pan-con-tomate');
  for (const q of ['potatoes', 'onions']) {
    const top = store.search(q).hits[0].food;
    assert.notEqual(top.group, 'lunchbox', q);
  }
});

// ------------------------------------------------------------------ item 2: ingredient picker

test('parseQuickAmount: sizes, pao, cups, katori and ½', () => {
  assert.deepEqual(parseQuickAmount('3 medium potatoes'), {
    amount: { unit: null, qty: 3, size: 'medium' },
    query: 'potatoes',
  });
  assert.deepEqual(parseQuickAmount('1 large onion').amount, { unit: null, qty: 1, size: 'large' });
  assert.deepEqual(parseQuickAmount('2 big tomatoes').amount, {
    unit: null,
    qty: 2,
    size: 'large',
  });
  assert.deepEqual(parseQuickAmount('medium onion'), {
    amount: { unit: null, qty: 1, size: 'medium' },
    query: 'onion',
  });
  assert.deepEqual(parseQuickAmount('5 eggs'), { amount: { unit: null, qty: 5 }, query: 'eggs' });
  assert.deepEqual(parseQuickAmount('1 pao chicken').amount, { unit: 'g', qty: 250 });
  assert.deepEqual(parseQuickAmount('½ kg rice').amount, { unit: 'g', qty: 500 });
  assert.deepEqual(parseQuickAmount('1½ cups dahi'), {
    amount: { unit: 'cup', qty: 1.5 },
    query: 'dahi',
  });
  assert.deepEqual(parseQuickAmount('2 katori daal').amount, { unit: 'katori', qty: 2 });
  assert.deepEqual(parseQuickAmount('2 gulab jamun'), {
    amount: { unit: null, qty: 2 },
    query: 'gulab jamun',
  });
  assert.equal(parseQuickAmount('g rice').amount, null, 'a unit needs a number');
  assert.equal(parseQuickAmount('cup dahi').amount, null);
});

test('quickPortion: a size word picks that serving, else the default', () => {
  const potato = food('p', 'Potato', {
    group: 'vegetable',
    servings: [
      { id: 'small', label: '1 small potato', grams: 170 },
      { id: 'medium', label: '1 medium potato', grams: 213, default: true },
      { id: 'large', label: '1 large potato', grams: 369 },
    ],
  });
  const egg = food('e', 'Egg', {
    group: 'egg',
    servings: [
      { id: 'egg-l', label: '1 large egg', grams: 50, default: true },
      { id: 'egg-m', label: '1 medium egg', grams: 44 },
    ],
  });
  assert.deepEqual(quickPortion(potato, { unit: null, qty: 3, size: 'large' }), {
    servingId: 'large',
    qty: 3,
  });
  assert.deepEqual(quickPortion(egg, { unit: null, qty: 2, size: 'medium' }), {
    servingId: 'egg-m',
    qty: 2,
  });
  assert.deepEqual(quickPortion(egg, { unit: null, qty: 2, size: 'small' }), {
    servingId: 'egg-l',
    qty: 2,
  });
});

test('amountText: whole counts read in the plural; units and fractions do not', () => {
  const medium = { id: 'medium', label: '1 medium potato', grams: 213 };
  const egg = { id: 'large', label: '1 large egg', grams: 50 };
  assert.equal(amountText(medium, 3), '3 medium potatoes');
  assert.equal(amountText(egg, 5), '5 large eggs');
  assert.equal(amountText(egg, 1), '1 large egg');
  assert.equal(amountText({ id: 'g', label: 'g', grams: 1 }, 250), '250 g');
  assert.doesNotMatch(amountText({ id: 'tbsp', label: '1 tbsp', grams: 13.5 }, 2), /tbsps/);
});

test('ingredientRank: raw and dry first, plain foods next, cooked dishes last', () => {
  assert.equal(ingredientRank({ group: 'dry-staple', state: 'dry, uncooked, as sold' }), 0);
  assert.equal(ingredientRank({ group: 'egg', state: 'raw, shell removed' }), 0);
  assert.equal(ingredientRank({ group: 'dairy', state: 'plain, whole milk' }), 1);
  assert.equal(ingredientRank({ group: 'egg', state: 'hard-boiled, shell removed' }), 2);
  assert.equal(ingredientRank({ group: 'daal-legume', state: 'cooked stew as served' }), 2);
  assert.equal(
    ingredientRank({ group: 'daal-legume', state: 'cooked, as served (dry, bhuna)' }),
    2,
  );
  assert.equal(ingredientRank({ group: 'vegetable', state: 'raw, dressed with olive oil' }), 1);
  assert.equal(ingredientRank({ group: 'lunchbox', state: 'raw' }), 2);
  const order = rankIngredients([
    { id: 'stew', group: 'daal-legume', state: 'cooked stew' },
    { id: 'dahi', group: 'dairy', state: 'plain' },
    { id: 'dry', group: 'dry-staple', state: 'dry' },
    { id: 'dry2', group: 'dry-staple', state: 'dry, raw' },
  ]).map((f) => f.id);
  assert.deepEqual(order, ['dry', 'dry2', 'dahi', 'stew']);
});

test('real data: the recipe picker offers raw ingredients first (Bilal #3)', () => {
  const store = makeStore({ now: new Date(2026, 9, 18, 18) });
  const picker = (text) => {
    const { amount, query } = parseQuickAmount(text);
    const found = store.search(query, { limit: 30 });
    const ok = rankIngredients(
      found.hits.map((h) => h.food).filter((f) => !f.userRecipe && f.halal?.status !== 'not-halal'),
    );
    return { first: ok[0], portion: ok[0] ? quickPortion(ok[0], amount) : null };
  };
  const lentils = picker('250 g lentils');
  assert.equal(lentils.first.group, 'dry-staple', lentils.first.id);
  assert.deepEqual(lentils.portion, { servingId: 'g', qty: 250 });
  assert.equal(picker('5 eggs').first.id, 'intl-egg-raw');
  assert.equal(picker('5 eggs').portion.qty, 5);
  assert.equal(picker('3 medium potatoes').first.id, 'intl-potato-raw');
  assert.deepEqual(picker('3 medium potatoes').portion, { servingId: 'medium', qty: 3 });
  assert.equal(picker('1 medium onion').first.id, 'intl-onion');
  assert.match(picker('1 kg chicken').first.id, /raw/);
});

// ------------------------------------------------------------------ item 5: pork, alcohol, shellfish

test('excludedTopic: pork, alcohol and shellfish words; whole words, plurals, typing', () => {
  const topic = (q) => excludedTopic(q)?.topic ?? null;
  for (const q of ['chorizo', 'Jamón serrano', 'bacon', 'cerdo', 'pork ribs', 'fuet', 'xoriço']) {
    assert.equal(topic(q), 'pork', q);
  }
  for (const q of ['cerveza', 'una caña', 'wine', 'vino tinto', 'gin tonic', 'beers']) {
    assert.equal(topic(q), 'alcohol', q);
  }
  for (const q of ['gambas', 'prawns', 'jhinga', 'calamares', 'mejillones', 'pulpo', 'crab']) {
    assert.equal(topic(q), 'shellfish', q);
  }
  for (const q of ['ginger', 'chicken', 'ensaimada', 'daal', 'gulab jamun', 'hamburger']) {
    assert.equal(topic(q), null, q);
  }
  assert.deepEqual(excludedTopic('chori'), { topic: 'pork', whole: false });
  assert.deepEqual(excludedTopic('chorizo'), { topic: 'pork', whole: true });
});

test('searchNoteText: one calm line, never for a typing prefix that has hits', () => {
  const pork = 'Katori has no pork or alcohol foods. Everything here is pork-free.';
  assert.equal(searchNoteText('chorizo', { hits: 0 }), pork);
  assert.equal(searchNoteText('jamon', { hits: 2 }), pork, 'jamon still says so above gulab jamun');
  assert.equal(searchNoteText('cerveza', { hits: 0 }), pork);
  assert.match(searchNoteText('bacon', { hits: 0, halalOnly: false }), /lard/);
  assert.equal(searchNoteText('peppe', { hits: 3 }), null, '"pepper" is not pepperoni');
  assert.equal(searchNoteText('chori', { hits: 0 }), pork);
  assert.equal(searchNoteText('gambas', { hits: 1 }), null, 'seafood found: the results say it');
  assert.match(searchNoteText('crab', { hits: 0, hasShellfish: true }), /try “prawns”/);
  assert.match(searchNoteText('crab', { hits: 0, hasShellfish: () => false }), /no prawns/);
  assert.equal(searchNoteText('daal', { hits: 0 }), null);
});

test('real data: chorizo and cerveza find nothing; gambas and calamares find seafood', () => {
  const store = makeStore({ now: new Date(2026, 9, 19, 13) });
  assert.equal(store.search('chorizo').hits.length, 0);
  assert.equal(store.search('cerveza').hits.length, 0);
  for (const q of ['gambas', 'prawns', 'calamares', 'pulpo', 'mejillones']) {
    const hits = store.search(q).hits;
    assert.ok(
      hits.some((h) => h.food.tags?.some((t) => /^seafood-(prawn|other)$/.test(t))),
      `${q}: ${hits.map((h) => h.food.id).join(', ')}`,
    );
  }
});

// ------------------------------------------------------------------ item 4: shopping as you buy

const shopFoods = [
  food('egg', 'Egg, raw', {
    group: 'egg',
    servings: [{ id: 'large', label: '1 large egg', grams: 50, default: true }],
    pack: { grams: 600, label: '12 eggs' },
  }),
  food('onion', 'Onion', {
    group: 'vegetable',
    servings: [
      { id: 'medium', label: '1 medium onion', grams: 110, default: true },
      { id: 'tbsp', label: '1 tablespoon chopped', grams: 10 },
    ],
  }),
  food('potato', 'Potato', {
    group: 'vegetable',
    servings: [{ id: 'medium', label: '1 medium potato', grams: 200, default: true }],
  }),
  food('lentils', 'Lentils, jarred', {
    group: 'daal-legume',
    servings: [{ id: '100g', label: '100 g', grams: 100, default: true }],
    pack: { grams: 400, label: '400 g jar' },
  }),
  food('oil', 'Olive oil', {
    group: 'fat-oil',
    servings: [{ id: 'tbsp', label: '1 tablespoon', grams: 13.5, default: true }],
  }),
  food('butter', 'Butter', {
    group: 'fat-oil',
    servings: [{ id: 'pat', label: '1 pat', grams: 5, default: true }],
  }),
  food('chicken', 'Chicken thigh, raw', {
    group: 'meat-fish',
    servings: [{ id: '100g', label: '100 g', grams: 100, default: true }],
  }),
  food('rice', 'Basmati rice, dry', {
    group: 'dry-staple',
    servings: [{ id: '100g', label: '100 g', grams: 100, default: true }],
  }),
];
const SHOP_INDEX = new Map(shopFoods.map((f) => [f.id, f]));

test('pluralLabel and buyAmount: packs (with the count they use), counts, else grams', () => {
  assert.equal(pluralLabel('medium potato'), 'medium potatoes');
  assert.equal(pluralLabel('large egg'), 'large eggs');
  assert.equal(pluralLabel('clove of garlic'), 'cloves of garlic');
  assert.equal(pluralLabel('small bunch (9 sprigs)'), 'small bunches');
  assert.deepEqual(buyAmount(SHOP_INDEX.get('egg'), 350), {
    kind: 'pack',
    packs: 1,
    label: '12 eggs',
    grams: 350,
    uses: { qty: 7, label: 'large eggs' },
  });
  assert.equal(buyAmount(SHOP_INDEX.get('egg'), 650).packs, 2);
  assert.equal(buyAmount(SHOP_INDEX.get('lentils'), 400).packs, 1, 'exactly one jar');
  assert.deepEqual(buyAmount(SHOP_INDEX.get('onion'), 330), {
    kind: 'count',
    qty: 3,
    label: 'medium onions',
    grams: 330,
  });
  assert.equal(buyAmount(SHOP_INDEX.get('onion'), 334).qty, 3, '3.04 onions is 3');
  assert.equal(buyAmount(SHOP_INDEX.get('onion'), 360).qty, 4);
  assert.equal(buyAmount(SHOP_INDEX.get('onion'), 20).qty, 1);
  assert.deepEqual(buyAmount(SHOP_INDEX.get('chicken'), 720), { kind: 'grams', grams: 720 });
  const bunch = food('dhania', 'Coriander', {
    group: 'vegetable',
    servings: [{ id: 'small', label: '1 small bunch (9 sprigs)', grams: 20, default: true }],
  });
  assert.equal(buyAmount(bunch, 6).label, 'small bunch', 'no "(9 sprigs) (6 g)" in the text');
  assert.equal(buyAmount(bunch, 50).label, 'small bunches');
  assert.deepEqual(buyAmount(undefined, 5), { kind: 'grams', grams: 5 });
});

test('shoppingForShop: merged across batches, butcher first, staples in "Check you have"', () => {
  const tortilla = {
    foodId: 'lib-tortilla',
    boxes: 2,
    ingredients: [
      { foodId: 'egg', grams: 250 },
      { foodId: 'potato', grams: 400 },
      { foodId: 'onion', grams: 110 },
      { foodId: 'oil', grams: 30 },
      { name: 'Salt', grams: 3, section: 'supermarket' },
    ],
  };
  const pot = {
    foodId: 'lib-pot',
    boxes: 4,
    ingredients: [
      { foodId: 'chicken', grams: 800 },
      { foodId: 'onion', grams: 220 },
      { foodId: 'lentils', grams: 400 },
      { foodId: 'butter', grams: 20 },
      { name: 'Cumin', grams: 5, section: 'supermarket' },
      { name: 'Salt', grams: 5, section: 'supermarket' },
    ],
  };
  const raw = shoppingList(
    [
      { recipe: tortilla, boxes: 2 },
      { recipe: pot, boxes: 8 },
    ],
    SHOP_INDEX,
    RULES,
  );
  const shop = shoppingForShop(raw, SHOP_INDEX, RULES);
  assert.deepEqual(
    shop.sections.map((s) => s.id),
    ['butcher', 'supermarket', CUPBOARD_SECTION.id],
  );
  assert.equal(shop.sections[2].label, 'Check you have');
  const where = (name) => shop.sections.find((s) => s.items.some((i) => i.name === name))?.id;
  assert.equal(where('Chicken thigh, raw'), 'butcher');
  assert.equal(where('Olive oil'), 'cupboard');
  assert.equal(where('Salt'), 'cupboard');
  assert.equal(where('Cumin'), 'cupboard');
  assert.equal(where('Butter'), 'supermarket', 'butter is bought fresh');
  const items = shop.sections.flatMap((s) => s.items);
  assert.equal(items.filter((i) => i.name === 'Onion').length, 1, 'onion once');
  const onion = items.find((i) => i.name === 'Onion');
  assert.equal(onion.grams, 110 + 440);
  assert.deepEqual(onion.buy, { kind: 'count', qty: 5, label: 'medium onions', grams: 550 });
  assert.equal(items.find((i) => i.name === 'Salt').grams, 3 + 10);
  assert.equal(items.find((i) => i.name === 'Lentils, jarred').buy.packs, 2);
  // grams are unchanged from shoppingList: nothing lost or doubled
  const total = (l) => l.sections.flatMap((s) => s.items).reduce((t, i) => t + i.grams, 0);
  assert.equal(total(shop), total(raw));
  // the text: packs, counts and grams, the grams always last
  assert.equal(
    itemText(items.find((i) => i.name === 'Egg, raw')),
    'Egg, raw: 1 pack of 12 eggs (uses 5 large eggs, 250 g)',
  );
  assert.equal(itemText(onion), 'Onion: 5 medium onions (550 g)');
  assert.equal(
    itemText(items.find((i) => i.name === 'Lentils, jarred')),
    'Lentils, jarred: 2 × 400 g jar (uses 800 g)',
  );
  assert.equal(
    itemText(items.find((i) => i.name === 'Chicken thigh, raw')),
    'Chicken thigh, raw: 1.6 kg',
  );
  const text = listText('Week', shop);
  assert.match(text, /^Week\n\nHalal butcher\n- Chicken/);
  assert.match(text, /\n\nCheck you have\n- Olive oil: 30 g/);
  assert.throws(() => shoppingForShop(null, SHOP_INDEX), TypeError);
});

test('store.weekShopping: this week’s batches in one list, each food once; old batches left out', () => {
  const clock = { now: new Date(2026, 9, 18, 18) };
  const store = makeStore(clock);
  assert.deepEqual(store.weekShopping(), { batches: [], weekdayJobs: [], ready: [], list: null });
  clock.now = new Date(2026, 9, 10, 18);
  store.cookBatch({ recipeId: 'pk-chicken-tikka-rice-box', boxes: 4 }); // 8 days before: left out
  clock.now = new Date(2026, 9, 18, 18);
  store.cookBatch({ recipeId: 'pk-chicken-tikka-rice-box', boxes: 4 });
  store.cookBatch({ recipeId: 'intl-salmon-brown-rice-bowl-box', boxes: 2 });
  store.cookBatch({
    recipeId: 'es-queso-batido-parfait-jar',
    boxes: 3,
    cookedOn: '2026-10-19', // planned for tomorrow: in
  });
  const week = store.weekShopping();
  assert.equal(week.batches.length, 3);
  assert.ok(week.batches.every((b) => b.listed));
  const items = week.list.sections.flatMap((s) => s.items);
  const keys = items.map((i) => i.key);
  assert.equal(new Set(keys).size, keys.length, 'each food once');
  // the same food from two batches is merged: cucumber is in the tikka raita and the salmon bowl
  const cucumber = items.filter((i) => i.foodId === 'intl-cucumber');
  assert.equal(cucumber.length, 1);
  const one = (id, boxes) =>
    store
      .shopping(id, boxes)
      .sections.flatMap((s) => s.items)
      .find((i) => i.foodId === 'intl-cucumber')?.grams ?? 0;
  assert.ok(
    Math.abs(
      cucumber[0].grams -
        one('pk-chicken-tikka-rice-box', 4) -
        one('intl-salmon-brown-rice-bowl-box', 2),
    ) < 1e-9,
  );
  assert.equal(week.list.sections[0].id, 'butcher');
  assert.equal(week.list.sections.at(-1).id, 'cupboard');
  // eggs come in packs (Javier's `pack`)
  const egg = items.find((i) => i.buy.kind === 'pack');
  assert.ok(egg, 'at least one food is bought in packs');
});

// ------------------------------------------------------------------ item 3: batch wording

test('store.boxCounts: "3 to eat · 1 eaten" once every box is placed', () => {
  const clock = { now: new Date(2026, 10, 1, 18) };
  const store = makeStore(clock);
  const id = store.cookBatch({ recipeId: 'pk-chicken-tikka-rice-box', boxes: 4 });
  assert.deepEqual(store.boxCounts(id), {
    available: 4,
    placed: 0,
    toEat: 4,
    eaten: 0,
    discarded: 0,
  });
  store.fillDays({
    batchId: id,
    dates: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'],
    slot: 'lunch',
  });
  assert.equal(store.boxesLeft(id), 0);
  assert.equal(store.boxCounts(id).toEat, 4);
  const entry = store.day('2026-11-02').entries[0];
  store.setEntryStatus('2026-11-02', entry.id, 'eaten');
  assert.deepEqual(store.boxCounts(id), {
    available: 0,
    placed: 3,
    toEat: 3,
    eaten: 1,
    discarded: 0,
  });
});

test('frozenDueText: calm words for a box still frozen on (or after) its day', () => {
  const frozen = { storage: 'freezer', movedToFridgeOn: null };
  assert.equal(frozenDueText(frozen, '2026-11-04', '2026-11-03'), null, 'its day is ahead');
  assert.match(
    frozenDueText(frozen, '2026-11-03', '2026-11-03'),
    /^Still frozen, and it’s for today/,
  );
  assert.match(frozenDueText(frozen, '2026-11-02', '2026-11-03'), /planned for yesterday/);
  assert.equal(frozenDueText({ storage: 'fridge' }, '2026-11-03', '2026-11-03'), null);
  assert.equal(
    frozenDueText(
      { storage: 'freezer', movedToFridgeOn: '2026-11-02' },
      '2026-11-03',
      '2026-11-03',
    ),
    null,
  );
});

test('shortPrepName drops "(lunch box)", "(breakfast jar)" and "(freezer dinner portion)"', () => {
  assert.equal(
    shortPrepName('Chicken tikka rice bowl with raita (lunch box)'),
    'Chicken tikka rice bowl with raita',
  );
  assert.equal(shortPrepName('Overnight oats (breakfast jar)'), 'Overnight oats');
  assert.equal(
    shortPrepName('Daal palak and roti (freezer dinner portion)'),
    'Daal palak and roti',
  );
  assert.equal(shortPrepName('Roti (chapati)'), 'Roti (chapati)');
});

// ------------------------------------------------------------------ the family pot (Nasreen)

test('a family pot in katori: cooked weight from the katori, logging opens on a katori', () => {
  const clock = { now: new Date(2026, 9, 18, 13) };
  const store = makeStore(clock);
  const id = store.saveRecipe({
    name: 'Chicken salan pot',
    ingredients: [
      { foodId: 'intl-chicken-thigh-raw', servingId: 'g', qty: 1000 },
      { foodId: 'intl-onion', servingId: 'medium', qty: 2 },
      { foodId: 'intl-cooking-oil', servingId: 'tbsp', qty: 4 },
    ],
    boxes: 1,
    potKatori: 8,
    cookedWeightG: 8 * 200,
  });
  assert.equal(store.recipe(id).potKatori, 8);
  const f = store.food(id);
  assert.equal(f.servings.find((s) => s.default).id, 'katori');
  assert.equal(f.servings.find((s) => s.id === 'box').label, '1 whole pot');
  assert.equal(store.portionFor(id).servingId, 'katori');
  // one katori is one eighth of the pot
  const total = store.recipeTotals(store.recipe(id)).total.kcal;
  const katori = (f.per100g.kcal * 200) / 100;
  assert.ok(Math.abs(katori - total / 8) < 1e-9);
  // own recipes first in search, above the library's salan
  assert.equal(store.search('salan').hits[0].food.id, id);
  // a recipe in boxes keeps the box default and drops potKatori when it is not a number
  const boxes = store.saveRecipe({
    name: 'Tikka bowls',
    ingredients: [{ foodId: 'intl-chicken-thigh-raw', servingId: 'g', qty: 800 }],
    boxes: 4,
    potKatori: null,
  });
  assert.equal(store.recipe(boxes).potKatori, undefined);
  assert.equal(store.food(boxes).servings.find((s) => s.default).id, 'box');
});

test('foodFromRecipe: potKatori makes the katori the default; without it nothing changes', () => {
  const index = new Map(FOODS.map((f) => [f.id, f]));
  const recipe = {
    id: 'my-recipe-x',
    name: 'Pot',
    ingredients: [{ foodId: 'intl-chicken-thigh-raw', servingId: 'g', qty: 500 }],
    boxes: 1,
    cookedWeightG: 1200,
  };
  const plain = foodFromRecipe(recipe, index, RULES);
  assert.equal(plain.servings.find((s) => s.default).id, 'box');
  assert.equal(plain.servings[0].label, '1 whole recipe');
  const pot = foodFromRecipe({ ...recipe, potKatori: 6 }, index, RULES);
  assert.deepEqual(
    pot.servings.filter((s) => s.default).map((s) => s.id),
    ['katori'],
  );
  assert.deepEqual(pot.per100g, plain.per100g, 'numbers are the same; only the default moves');
});

// ------------------------------------------------------------------ helpers

function makeStore(clock) {
  let n = 0;
  return createStore({
    persistence: null,
    rules: RULES,
    foods: FOODS,
    library: LIBRARY,
    now: () => clock.now,
    makeId: () => `id${(n += 1)}`,
    timeZone: 'Europe/Madrid',
    timers: { set: () => 0, clear: () => {} },
  });
}
