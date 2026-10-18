// Author's tests for the Review 1 fix wave (team/meetings/003-review-1.md). Owner: Lena.
// Core ranking and fuzzy rules on inline foods; the store's slot hints; the pure UI helpers (taste
// help, the sheet's "counts for" line, the human source text, wording); and real-data checks on
// app/data (chai, kela, naan, whey) so a Lab edit that breaks a tester's search shows up here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchIndex, searchFoods, TIERS } from '../../../app/core/search.js';
import { computeTargets } from '../../../app/core/targets.js';
import { createStore } from '../../../app/ui/store.js';
import { RULES as FIXTURE_RULES, FOODS as FIXTURE_FOODS } from '../../fixtures/index.js';
import { RULES, FOODS } from '../../../app/data/index.js';
import { isTasteQuery, TASTE_HELP, countsForText } from '../../../app/ui/components/add-sheet.js';
import { displayCitation, displayNotes } from '../../../app/ui/components/food-details.js';
import { paceNote, ESTIMATE_LINE, AT_LEAST_KEYS } from '../../../app/ui/components/format.js';
import { targetNotes } from '../../../app/ui/views/welcome.js';
import { TASTE_QTY } from '../../../app/ui/components/portion-picker.js';

const food = (id, name, extra = {}) => ({
  id,
  name,
  aliases: [],
  halal: { status: 'halal' },
  ...extra,
});
const ids = (result) => result.hits.map((h) => h.food.id);

// ------------------------------------------------------------------ ranking (item 2)

test('ties: everyday and home style rank before restaurant, dhaba and street', () => {
  const foods = [
    food('pk-a-street', 'Chai, a street', { aliases: ['chai'], style: 'street' }),
    food('pk-b-dhaba', 'Chai, b dhaba', { aliases: ['chai'], style: 'dhaba' }),
    food('pk-c-restaurant', 'Chai, c restaurant', { aliases: ['chai'], style: 'restaurant' }),
    food('pk-d-home', 'Chai, d home', { aliases: ['chai'], style: 'home' }),
    food('pk-e-plain', 'Chai, e (no style)', { aliases: ['chai'] }),
  ];
  const index = buildSearchIndex(foods);
  assert.deepEqual(ids(searchFoods(index, 'chai')), [
    'pk-d-home',
    'pk-e-plain',
    'pk-c-restaurant',
    'pk-b-dhaba',
    'pk-a-street',
  ]);
  // A slot hint only breaks ties after style: a hinted dhaba chai stays below home chai.
  assert.deepEqual(ids(searchFoods(index, 'chai', { hints: ['pk-b-dhaba'] })).slice(0, 3), [
    'pk-d-home',
    'pk-e-plain',
    'pk-c-restaurant',
  ]);
  // Hints still order foods of the same style.
  assert.deepEqual(
    ids(searchFoods(index, 'chai', { hints: new Set(['pk-e-plain']) })).slice(0, 2),
    ['pk-e-plain', 'pk-d-home'],
  );
  // The person's own history (a recency boost) still wins: they drink dhaba chai.
  assert.equal(ids(searchFoods(index, 'chai', { boosts: { 'pk-b-dhaba': 0.2 } }))[0], 'pk-b-dhaba');
  // A better tier always beats style.
  const tiers = buildSearchIndex([
    food('pk-x-home', 'Masala chai', { style: 'home' }),
    food('pk-y-dhaba', 'Chai', { style: 'dhaba' }),
  ]);
  assert.deepEqual(ids(searchFoods(tiers, 'chai')), ['pk-y-dhaba', 'pk-x-home']);
});

test('store.search: slot hints break ties after style, in every slot (fixtures)', () => {
  const extra = [
    food('pk-chai-dhaba-fx2', 'Chai, dhaba', {
      aliases: ['chai'],
      style: 'dhaba',
      group: 'drink-tea-coffee',
      per100g: { kcal: 100, protein: 4, carbs: 12, fat: 4, fiber: 0 },
      servings: [{ id: 'cup', label: '1 cup', grams: 200, default: true }],
      slots: ['lunch', 'evening', 'dinner', 'snacks', 'breakfast'],
    }),
  ];
  const store = createStore({
    persistence: null,
    rules: FIXTURE_RULES,
    foods: [...FIXTURE_FOODS, ...extra],
    now: () => new Date(2026, 9, 14, 13, 0),
    makeId: () => 'e1',
  });
  for (const slot of ['breakfast', 'lunch', 'evening', 'dinner', 'snacks']) {
    const order = ids(store.search('chai', { slot }));
    assert.ok(
      order.indexOf('pk-chai-doodh-patti-home-fx') < order.indexOf('pk-chai-dhaba-fx2'),
      `${slot}: ${order.join(', ')}`,
    );
  }
});

// ------------------------------------------------------------------ fuzzy (item 8)

test('fuzzy only fills in when exact, prefix, word and substring matches find fewer than 3', () => {
  const foods = [
    food('intl-banana', 'Banana', { aliases: ['kela'] }),
    food('pk-kebab', 'Shami kebab'),
    food('pk-kelo', 'Kelo'),
  ];
  // "kela" is the banana's exact alias, so it is not a typo: nothing fills in (Bilal R3).
  assert.deepEqual(ids(searchFoods(buildSearchIndex(foods), 'kela')), ['intl-banana']);
  // A typo ("kelu") with no exact match: fuzzy fills in while results are thin.
  assert.deepEqual(ids(searchFoods(buildSearchIndex(foods), 'kelu')), ['intl-banana', 'pk-kelo']);
  // With 3 better matches, no fuzzy hit is added.
  const many = [
    ...foods,
    food('intl-kela-chips', 'Kela chips'),
    food('intl-kela-shake', 'Kela shake'),
  ];
  const r = searchFoods(buildSearchIndex(many), 'kela');
  assert.equal(r.hits.length, 3);
  assert.ok(r.hits.every((h) => h.tier !== 'fuzzy'));
});

test('fuzzy needs a stronger match: same first letter, and 5+ letters inside a longer word', () => {
  const index = buildSearchIndex([
    food('pk-kebab', 'Shami kebab'),
    food('intl-cornflakes', 'Cornflakes', { aliases: ["Kellogg's corn flakes"] }),
    food('intl-pizza', 'Pizza (pizza chain)'),
    food('pk-karahi', 'Chicken karahi', { aliases: ['karahi'] }),
  ]);
  const found = (q) => ids(searchFoods(index, q));
  assert.deepEqual(found('kela'), [], '"keba", "kell" are prefixes: 4 letters is too short');
  assert.deepEqual(found('whey'), []);
  assert.deepEqual(found('rhain'), [], 'first letter differs from "chain"');
  assert.deepEqual(found('karhai'), ['pk-karahi'], 'adjacent swap still matches');
  assert.deepEqual(found('karha'), ['pk-karahi'], '5 letters inside "karahi"');
  assert.deepEqual(found('chiken'), ['pk-karahi']);
  const fuzzy = searchFoods(index, 'karhai').hits[0];
  assert.equal(fuzzy.score, TIERS.fuzzy);
});

test('a substring match needs 4+ letters: "naan" (nan) is not inside "banana"', () => {
  const index = buildSearchIndex([food('intl-banana', 'Banana'), food('pk-naan', 'Naan')]);
  assert.deepEqual(ids(searchFoods(index, 'naan')), ['pk-naan']);
  assert.equal(searchFoods(index, 'nana').hits[0].tier, 'substring', '4 letters: substring');
});

// ------------------------------------------------------------------ real data (items 2 and 8)

const realStore = (hour = 13) =>
  createStore({
    persistence: null,
    rules: RULES,
    foods: FOODS,
    now: () => new Date(2026, 9, 14, hour, 0),
    makeId: () => 'e1',
  });
const SLOTS = ['breakfast', 'lunch', 'evening', 'dinner', 'snacks'];

test('real data: "chai" puts home doodh patti above dhaba chai in every slot', () => {
  const store = realStore();
  for (const slot of SLOTS) {
    const order = ids(store.search('chai', { slot }));
    const home = order.findIndex((id) => store.food(id).style === 'home' || /home/.test(id));
    const dhaba = order.indexOf('pk-chai-dhaba');
    assert.ok(home !== -1 && home < dhaba, `${slot}: ${order.slice(0, 5).join(', ')}`);
  }
});

test('real data: "chai" ranks a home doodh patti first in every slot', () => {
  // Ranking reads `style`; a dhaba record without it would rank as everyday food.
  const unstyled = FOODS.filter((f) => /dhaba|restaurant/.test(f.id) && /^pk-chai/.test(f.id))
    .filter((f) => !f.style)
    .map((f) => f.id);
  assert.deepEqual(unstyled, []);
  const store = realStore();
  for (const slot of SLOTS) {
    const first = store.search('chai', { slot }).hits[0].food;
    assert.match(first.id, /^pk-chai-doodh-patti/, `${slot}: ${first.id}`);
  }
});

test('real data: tester junk is gone (kela, naan, whey, truita)', () => {
  const store = realStore();
  const top = (q) => ids(store.search(q, { slot: 'lunch' }));
  assert.equal(top('kela')[0], 'intl-banana');
  for (const junk of ['pk-shami-kebab', 'pk-seekh-kebab', 'intl-cornflakes']) {
    assert.ok(!top('kela').includes(junk), `kela: ${junk}`);
  }
  assert.ok(!top('naan').includes('intl-banana'), 'naan: no banana');
  assert.deepEqual(top('whey'), ['intl-whey-protein']);
  assert.ok(!top('truita').includes('pk-juice-mango'), 'truita: no mango juice');
});

// ------------------------------------------------------------------ taste chip and help (item 4)

test('taste help: taste, thora sa, bacha hua and leftover (and their stems) show it', () => {
  for (const q of [
    'taste',
    'Taste',
    'tasting',
    'thora sa',
    'thoda sa',
    'bacha hua',
    'leftover',
    'leftovers',
    'left',
  ]) {
    assert.equal(isTasteQuery(q), true, q);
  }
  for (const q of ['', 'ta', 'chai', 'roti', 'daal', 'banana', 'tea']) {
    assert.equal(isTasteQuery(q), false, q);
  }
  assert.match(TASTE_HELP, /Thora sa/);
  assert.match(TASTE_HELP, /¼/);
  assert.equal(TASTE_QTY, 0.25);
});

// ------------------------------------------------------------------ the sheet header (item 3)

test('the add sheet says which day the food counts for, also after midnight', () => {
  const at = (h, m) =>
    createStore({
      persistence: null,
      rules: RULES,
      foods: FOODS,
      now: () => new Date(2026, 9, 15, h, m),
      makeId: () => 'e1',
    });
  const late = at(0, 30); // 00:30 on Thu 15 Oct still counts for Wed 14 Oct (day starts 04:00)
  assert.equal(late.today(), '2026-10-14');
  assert.equal(late.clockDate(), '2026-10-15');
  assert.equal(
    countsForText('2026-10-14', late),
    'Counts for Wed 14 Oct: your day runs until 04:00',
  );
  assert.equal(countsForText('2026-10-13', late), 'Counts for Yesterday, Tue 13 Oct');
  const noon = at(13, 0);
  assert.equal(countsForText('2026-10-15', noon), 'Counts for Today, Thu 15 Oct');
  assert.equal(countsForText('2026-10-20', noon), 'Counts for Tue 20 Oct');
});

test('Spanish preset: Madrid labels, and 00:00–05:00 defaults to Snacks', () => {
  const store = (h) =>
    createStore({
      persistence: null,
      rules: RULES,
      foods: FOODS,
      now: () => new Date(2026, 9, 15, h, 30),
      makeId: () => 'e1',
      timeZone: 'Europe/Madrid',
    });
  assert.equal(store(9).settings().slotPreset, 'spain');
  assert.deepEqual(
    store(9)
      .slots()
      .map((s) => s.label),
    ['Breakfast / café', 'Lunch', 'Merienda', 'Dinner', 'Snacks'],
  );
  assert.equal(store(21).defaultSlot(), 'dinner');
  assert.equal(store(1).defaultSlot(), 'snacks');
  assert.equal(store(4).defaultSlot(), 'snacks');
  assert.equal(store(5).defaultSlot(), 'breakfast');
  assert.equal(store(0).defaultSlot(), 'snacks');
});

// ------------------------------------------------------------------ wording (item 6)

test('wording: Estimate is explained in one line; a capped pace is told without blame', () => {
  assert.match(ESTIMATE_LINE, /^Estimate means a good guess/);
  assert.ok(!ESTIMATE_LINE.includes('\n'));
  assert.equal(
    paceNote('deficit_capped', { effectiveRateKgPerWeek: -0.432 }),
    'Your target keeps weight loss to a safe pace of about 0.4 kg a week.',
  );
  assert.equal(
    paceNote('surplus_capped', { effectiveRateKgPerWeek: 0.21 }),
    'Your target keeps weight gain to a steady pace of about 0.2 kg a week.',
  );
  assert.equal(paceNote('kcal_floor', { effectiveRateKgPerWeek: -0.4 }), null);
  assert.equal(paceNote('deficit_capped', null), null);

  // A real capped profile: woman, 150 cm, 50 kg, sedentary, asks to lose 1 kg a week.
  const profile = {
    sex: 'female',
    ageYears: 30,
    heightCm: 150,
    weightKg: 50,
    activity: 'sedentary',
    goal: 'lose',
    rateKgPerWeek: 1,
    lifts: false,
    healthFlags: [],
  };
  const result = computeTargets(profile, RULES);
  assert.ok(result.warnings.includes('deficit_capped'));
  const notes = targetNotes(result, RULES);
  assert.ok(notes.some((n) => /^Your target keeps weight loss to a safe pace of about/.test(n)));
  assert.ok(!notes.some((n) => /slowed/i.test(n)), notes.join(' | '));
  assert.ok(!notes.includes(RULES.warnings.estimate), 'Estimate is said once, by ESTIMATE_LINE');
  assert.ok(AT_LEAST_KEYS.includes('protein'), 'protein above target is never "over"');
});

// ------------------------------------------------------------------ source panel (item 9)

test('source panel: the human citation only, no file paths, sections, ids or working figures', () => {
  assert.equal(
    displayCitation('Recipe R-pk-roti (research/zainab/recipes/pk-roti.md)'),
    'Standard recipe, calculated from food-table values for its ingredients',
  );
  assert.equal(
    displayCitation(
      'Recipe R-MP-1: Chicken tikka rice bowl with raita, standard batch of 4 boxes (research/yusuf/recipes/pk-chicken-tikka-rice-box.md)',
    ),
    'Recipe: Chicken tikka rice bowl with raita, standard batch of 4 boxes',
  );
  assert.equal(displayCitation('USDA FDC SR Legacy 171287'), 'USDA FDC SR Legacy 171287');
  assert.equal(displayCitation(''), 'Not given');
  assert.equal(
    displayNotes(
      'Restaurant style: always C (NUTRITION.md §4.4). Cooked yield 0.681; added fat 17.9 g/100 g. Cross-check: CoFID 2021 19-322 145 kcal (+80%).',
    ),
    '',
  );
  assert.equal(
    displayNotes('Oil varies widely between cooks; log extra oil as an add-on. Cooked yield 0.91.'),
    'Oil varies widely between cooks; log extra oil as an add-on.',
  );
  for (const f of FOODS) {
    const text = `${displayCitation(f.source.citation)} ${displayNotes(f.source.notes)}`;
    assert.ok(
      !/\.md\b|§|research\/|\bR-(?:pk|es|med|intl|MP)|cooked yield/i.test(text),
      `${f.id}: ${text}`,
    );
  }
});
