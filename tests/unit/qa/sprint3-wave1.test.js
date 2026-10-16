// QA suite for Sprint 3 wave 1 data and the Day view's spare-box line (Meeting 005), written from
// docs/NUTRITION.md (section 3 shortName, section 6.1 kam tel, gates G24 and G25) and the doc comment of
// core/mealprep.js spareBoxes, not from the code. Owner: Kenji.
//   kam tel (home-light)   shortName   spare boxes (core and store)
// The weight suite is sprint3-weight.test.js, the method contract is method-contract.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FOODS, RULES } from '../../../app/data/index.js';
import LIBRARY from '../../../app/data/recipes-mealprep.js';
import { buildSearchIndex, searchFoods } from '../../../app/core/search.js';
import { spareBoxes } from '../../../app/core/mealprep.js';
import { rowName } from '../../../app/ui/components/food-bits.js';
import { createStore } from '../../../app/ui/store.js';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const KT = RULES.kamTel;
const SN = RULES.vocab.fieldRules.shortName;
const len = (s) => [...s].length;
const byId = new Map(FOODS.map((f) => [f.id, f]));

// ------------------------------------------------------------------ the Lab's own checker

test('research/check-foods.mjs (G1-G25 and the rules self-checks) exits 0 on the shipped data', () => {
  const run = spawnSync(process.execPath, ['research/check-foods.mjs', '--quiet'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, `check-foods failed:\n${run.stdout.slice(-1500)}${run.stderr}`);
  assert.match(run.stdout, /Summary: \d+ records, \d+ pass, 0 fail/);
});

// ------------------------------------------------------------------ kam tel (gate G25, NUTRITION 6.1)

const LIGHT = FOODS.filter((f) => f.style === KT.style);
const homeOf = (light) =>
  FOODS.filter((f) => f.family === light.family && f.style === KT.pairsWithStyle);

test('kam tel: the rule says what NUTRITION 6.1 says (half the added fat)', () => {
  assert.equal(KT.style, 'home-light');
  assert.equal(KT.pairsWithStyle, 'home');
  assert.equal(KT.addedFatFraction, 0.5);
  assert.equal(KT.gate.maxAddedFatRatio, 0.6);
  assert.ok(
    RULES.vocab.styles.some((s) => (s.id ?? s) === 'home-light'),
    'home-light is a listed style',
  );
});

test('kam tel: the Lab ships at least the 17 variants it reported, each with a family', () => {
  assert.ok(LIGHT.length >= 17, `only ${LIGHT.length} home-light records`);
  for (const l of LIGHT) assert.equal(typeof l.family, 'string', `${l.id} has no family`);
});

test('kam tel G25: every home-light record has exactly one home sibling and is the only light one', () => {
  for (const l of LIGHT) {
    const homes = homeOf(l);
    assert.equal(homes.length, 1, `${l.id}: ${homes.length} home records in family ${l.family}`);
    const lights = LIGHT.filter((x) => x.family === l.family);
    assert.equal(lights.length, 1, `family ${l.family} has ${lights.length} home-light records`);
  }
});

test('kam tel G25: same group, fewer kcal and less fat, a recipe-derived record, no better confidence', () => {
  const order = KT.gate.confidenceOrder; // best first
  for (const l of LIGHT) {
    const h = homeOf(l)[0];
    assert.equal(l.group, h.group, `${l.id}: group`);
    assert.ok(
      l.per100g.kcal < h.per100g.kcal,
      `${l.id}: kcal ${l.per100g.kcal} vs ${h.per100g.kcal}`,
    );
    assert.ok(l.per100g.fat < h.per100g.fat, `${l.id}: fat ${l.per100g.fat} vs ${h.per100g.fat}`);
    assert.equal(l.source.method, 'recipe', `${l.id}: method`);
    assert.ok(
      order.indexOf(l.source.confidence) >= order.indexOf(h.source.confidence),
      `${l.id}: confidence ${l.source.confidence} is better than home ${h.source.confidence}`,
    );
  }
});

test('kam tel G25: added fat is at most max(2 g, 0.6 x the home record), and not under the 2 g floor', () => {
  for (const l of LIGHT) {
    const h = homeOf(l)[0];
    assert.equal(typeof l.addedFatPer100g, 'number', `${l.id}: addedFatPer100g`);
    assert.equal(typeof h.addedFatPer100g, 'number', `${h.id}: addedFatPer100g`);
    const cap = Math.max(KT.minAddedFatPer100g, h.addedFatPer100g * KT.gate.maxAddedFatRatio);
    assert.ok(
      l.addedFatPer100g <= cap + 0.05,
      `${l.id}: added fat ${l.addedFatPer100g} g is over ${cap.toFixed(2)} g (home ${h.addedFatPer100g})`,
    );
    assert.ok(l.addedFatPer100g >= KT.minAddedFatPer100g - 0.05, `${l.id}: under the floor`);
  }
});

test('kam tel: the kcal drop is explained by the fat drop (9 kcal a gram, a little less as the pot gets lighter)', () => {
  // Removing d g of fat per 100 g removes 9 d kcal; the cooked weight also falls, so the per-100 g drop is a
  // touch smaller. Worked: karahi fat 12.7 -> 8.2 is 4.5 g = 40.5 kcal against a recorded drop of 37.
  for (const l of LIGHT) {
    const h = homeOf(l)[0];
    const fromFat = (h.per100g.fat - l.per100g.fat) * 9;
    const drop = h.per100g.kcal - l.per100g.kcal;
    assert.ok(
      drop <= fromFat + 2,
      `${l.id}: kcal drops ${drop}, more than the fat explains (${fromFat.toFixed(1)})`,
    );
    assert.ok(
      drop >= fromFat * 0.5,
      `${l.id}: kcal drops only ${drop} for ${fromFat.toFixed(1)} kcal of fat`,
    );
  }
});

test('kam tel: name suffix, same serving ids as home, and the search finds it by "kam tel"', () => {
  const ids = (f) =>
    f.servings
      .map((s) => s.id)
      .sort()
      .join();
  for (const l of LIGHT) {
    assert.ok(l.name.endsWith(KT.nameSuffix), `${l.id}: name "${l.name}" lacks "${KT.nameSuffix}"`);
    assert.equal(ids(l), ids(homeOf(l)[0]), `${l.id}: serving ids differ from home`);
    for (const a of KT.aliases) assert.ok(l.aliases?.includes(a), `${l.id}: alias "${a}"`);
  }
  const index = buildSearchIndex(FOODS);
  const top = searchFoods(index, 'kam tel karahi').hits.map((h) => h.food.id);
  assert.equal(top[0], 'pk-chicken-karahi-light', `top hits: ${top.slice(0, 3)}`);
  const lessOil = new Set(searchFoods(index, 'less oil', { limit: 40 }).hits.map((h) => h.food.id));
  assert.ok(
    LIGHT.filter((l) => lessOil.has(l.id)).length >= 10,
    '"less oil" finds the kam tel records',
  );
  // And the home record is still found by the plain name, ahead of its light sibling.
  const plain = searchFoods(index, 'chicken karahi').hits.map((h) => h.food.id);
  assert.ok(plain.indexOf('pk-chicken-karahi-home') < plain.indexOf('pk-chicken-karahi-light'));
});

test('kam tel: eating the light version really logs fewer kcal for the same katori', () => {
  // 1 default katori of each, worked from the record: grams x kcal/100 g.
  for (const l of LIGHT) {
    const h = homeOf(l)[0];
    const sl = l.servings.find((s) => s.default) ?? l.servings[0];
    const sh = h.servings.find((s) => s.default) ?? h.servings[0];
    if (sl.id !== sh.id) continue;
    const kl = (sl.grams * l.per100g.kcal) / 100;
    const kh = (sh.grams * h.per100g.kcal) / 100;
    assert.ok(kl < kh, `${l.id}: ${kl.toFixed(0)} kcal vs home ${kh.toFixed(0)}`);
  }
});

// ------------------------------------------------------------------ shortName (gate G24, NUTRITION 3)

const SHORT = FOODS.filter((f) => f.shortName !== undefined);

test('shortName: the rule is 22 characters, no brackets, shorter than the name', () => {
  assert.equal(SN.maxChars, 22);
  assert.equal(SN.mustBeShorterThanName, true);
  for (const c of '()[]{}') assert.ok(SN.forbiddenChars.includes(c), `bracket ${c}`);
});

test('shortName G24: at most 22 characters, plain words, trimmed, shorter than the name', () => {
  assert.ok(SHORT.length >= 200, `${SHORT.length} short names`);
  for (const f of SHORT) {
    const s = f.shortName;
    assert.equal(typeof s, 'string', `${f.id}`);
    assert.ok(s.trim() !== '', `${f.id}: empty`);
    assert.equal(s, s.trim(), `${f.id}: spaces at the ends`);
    assert.ok(!/\s{2,}/.test(s), `${f.id}: double space`);
    assert.ok(len(s) <= 22, `${f.id}: "${s}" is ${len(s)} characters`);
    assert.ok(!/[()[\]{}]/.test(s), `${f.id}: "${s}" has a bracket`);
    assert.ok(len(s) < len(f.name), `${f.id}: "${s}" is not shorter than "${f.name}"`);
  }
});

test("shortName: unique among short names and never the same words as another food's name", () => {
  const seen = new Map();
  for (const f of SHORT) {
    const k = f.shortName.toLowerCase();
    assert.ok(
      !seen.has(k),
      `"${f.shortName}" is the short name of both ${seen.get(k)} and ${f.id}`,
    );
    seen.set(k, f.id);
  }
  for (const f of SHORT) {
    const other = FOODS.find(
      (x) => x.id !== f.id && x.name.toLowerCase() === f.shortName.toLowerCase(),
    );
    assert.equal(
      other,
      undefined,
      `${f.id}: short name "${f.shortName}" is the full name of ${other?.id}`,
    );
  }
});

test('shortName: every clearly long name has one (a narrow row would cut it off), and a kam tel one says so', () => {
  const longNames = FOODS.filter((f) => len(f.name) > 26 && !f.shortName).map((f) => f.id);
  assert.deepEqual(longNames, [], 'names over 26 characters without a shortName');
  for (const l of LIGHT) {
    if (l.shortName) assert.match(l.shortName, /^kam tel\b/i, `${l.id}: "${l.shortName}"`);
  }
});

test('shortName: rows show it (rowName), the full name stays for foods without one', () => {
  for (const f of SHORT.slice(0, 40)) assert.equal(rowName(f), f.shortName);
  assert.equal(rowName({ name: 'Plain rice' }), 'Plain rice');
  assert.equal(rowName({ name: 'Plain rice', shortName: '  ' }), 'Plain rice', 'blank is ignored');
  assert.equal(rowName(byId.get('pk-chicken-karahi-light')), 'Kam tel chicken karahi');
});

test('shortName: search finds a food by its full name and by its short name', () => {
  const index = buildSearchIndex(FOODS);
  for (const f of SHORT.filter((x) => len(x.name) > 22).slice(0, 25)) {
    for (const q of [f.name, f.shortName]) {
      const ids = searchFoods(index, q, { limit: 8 }).hits.map((h) => h.food.id);
      assert.ok(ids.includes(f.id), `"${q}" does not find ${f.id}; got ${ids.slice(0, 3)}`);
    }
  }
});

// ------------------------------------------------------------------ spare boxes: the core function

const box = (id, status, storage, extra = {}) => ({ id, status, storage, ...extra });
const batchOf = (id, cookedOn, boxes) => ({ id, cookedOn, boxes });
/** use-by from a table of box id -> date (null = none). */
const table = (map) => (batch, b) => map[b.id] ?? null;
const T = '2026-10-15'; // the "today" of these cases

test('spareBoxes: past use-by, last day, tomorrow; two days away is not spare', () => {
  const batches = [
    batchOf('b', '2026-10-10', [
      box('past', 'available', 'fridge'),
      box('today', 'available', 'fridge'),
      box('tomorrow', 'available', 'fridge'),
      box('later', 'available', 'fridge'),
    ]),
  ];
  const out = spareBoxes(
    batches,
    T,
    table({ past: '2026-10-13', today: '2026-10-15', tomorrow: '2026-10-16', later: '2026-10-17' }),
  );
  // Hand-worked: left = useBy - today = -2, 0, 1, 2 days. soonDays is 1, so "later" is quiet.
  assert.deepEqual(
    out.map((x) => [x.kind, x.boxId, x.number]),
    [
      ['past', 'past', 1],
      ['last-day', 'today', 2],
      ['soon', 'tomorrow', 3],
    ],
  );
});

test('spareBoxes: eaten, discarded and planned boxes are never spare; most urgent first, then earliest use-by', () => {
  const batches = [
    batchOf('x', '2026-10-01', [
      box('e', 'eaten', 'fridge'),
      box('d', 'discarded', 'fridge'),
      box('p', 'placed', 'fridge', { placed: { date: '2026-10-15', entryId: 'q' } }),
      box('a', 'available', 'fridge'),
    ]),
    batchOf('y', '2026-10-05', [box('b', 'available', 'fridge')]),
    batchOf('z', '2026-10-05', [box('c', 'available', 'fridge')]),
  ];
  const out = spareBoxes(
    batches,
    T,
    table({
      e: '2026-10-01',
      d: '2026-10-01',
      p: '2026-10-01',
      a: '2026-10-16',
      b: '2026-10-13',
      c: '2026-10-14',
    }),
  );
  assert.deepEqual(
    out.map((x) => x.boxId),
    ['b', 'c', 'a'],
    'two past (earlier first) then tomorrow',
  );
});

test('spareBoxes: a frozen batch counts only after a week with no day planned, one item with the box count', () => {
  const frozen = (id, cookedOn, extra = []) =>
    batchOf(id, cookedOn, [
      box(`${id}1`, 'available', 'freezer'),
      box(`${id}2`, 'available', 'freezer'),
      ...extra,
    ]);
  const batches = [
    frozen('old', '2026-10-01'), // 14 days: spare
    frozen('edge', '2026-10-08'), // exactly 7 days: spare (>= 7)
    frozen('young', '2026-10-09'), // 6 days: not yet
    frozen('planned', '2026-10-01', [
      box('pl', 'placed', 'freezer', { placed: { date: '2026-10-15', entryId: 'q' } }),
    ]), // a box is planned today or later: not spare
    frozen('past-plan', '2026-10-01', [
      box('pp', 'placed', 'fridge', { placed: { date: '2026-10-14', entryId: 'q' } }),
    ]), // the planned day was yesterday: nothing planned ahead
  ];
  const out = spareBoxes(batches, T, table({}));
  assert.deepEqual(out.map((x) => [x.kind, x.batchId, x.count]).sort(), [
    ['frozen', 'edge', 2],
    ['frozen', 'old', 2],
    ['frozen', 'past-plan', 2],
  ]);
  assert.ok(out.every((x) => x.useBy === null));
});

test('spareBoxes: a frozen batch with a fridge box left is judged by that box; moved-to-fridge boxes by their use-by', () => {
  const mixed = batchOf('m', '2026-10-01', [
    box('m1', 'available', 'freezer'),
    box('m2', 'available', 'fridge'),
  ]);
  assert.deepEqual(
    spareBoxes([mixed], T, table({ m2: '2026-10-20' })),
    [],
    'fridge box fine, so quiet',
  );
  const out = spareBoxes([mixed], T, table({ m2: '2026-10-15' }));
  assert.deepEqual(
    out.map((x) => [x.kind, x.boxId]),
    [['last-day', 'm2']],
  );
  const thawed = batchOf('t', '2026-10-01', [
    box('t1', 'available', 'freezer', { movedToFridgeOn: '2026-10-14' }),
  ]);
  assert.deepEqual(
    spareBoxes([thawed], T, table({ t1: '2026-10-15' })).map((x) => x.kind),
    ['last-day'],
    'a thawed box is a fridge box with a use-by, not a frozen one',
  );
});

test('spareBoxes: options, empty and bad input', () => {
  const b = [batchOf('b', '2026-10-13', [box('b1', 'available', 'fridge')])];
  assert.equal(spareBoxes(b, T, table({ b1: '2026-10-17' })).length, 0);
  assert.equal(spareBoxes(b, T, table({ b1: '2026-10-17' }), { soonDays: 2 })[0].kind, 'soon');
  assert.deepEqual(spareBoxes([], T, table({})), []);
  assert.deepEqual(spareBoxes(undefined, T, table({})), []);
  assert.throws(() => spareBoxes([], 'today', table({})), RangeError);
  assert.throws(() => spareBoxes([], T, null), TypeError);
  // The input is not changed.
  const frozenInput = structuredClone(b);
  spareBoxes(b, T, table({ b1: '2026-10-14' }));
  assert.deepEqual(b, frozenInput);
});

// ------------------------------------------------------------------ spare boxes: the store, with real use-by rules

/** A store at 'now' with the real foods and library. Box ids are `${batch}-${n}`. */
function kitchen(now) {
  let n = 0;
  const clock = { now };
  const store = createStore({
    persistence: null,
    rules: RULES,
    foods: FOODS,
    library: LIBRARY,
    now: () => clock.now,
    makeId: () => `k${++n}`,
    timeZone: 'Europe/Madrid',
    timers: { set: () => 0, clear: () => {} },
  });
  return { store, clock };
}
const noon = (y, m, d) => new Date(y, m - 1, d, 12, 0);

test('store.spareBoxes: a meat-and-rice library box (rice: 1 day in the fridge) goes spare the day after cooking', () => {
  // The rice component has the shortest fridge life (RULES.mealPrep.storage cooked-starch = 1 day), so
  // cooked on Mon 12 Oct the use-by is Tue 13 Oct. On Mon it is "soon", Tue "last-day", Wed "past".
  const rice = RULES.mealPrep.storage.find((s) => s.id === 'cooked-starch');
  assert.equal(rice.fridgeDays, 1);
  const recipe = LIBRARY.find((r) => r.storage.includes('cooked-starch') && r.storage.length === 2);
  assert.ok(recipe, 'a library recipe whose storage is meat + rice');
  const { store, clock } = kitchen(noon(2026, 10, 12));
  const id = store.cookBatch({ recipeId: recipe.foodId, boxes: 1, storage: ['fridge'] });
  const kinds = (d) => store.spareBoxes(d).map((s) => s.kind);
  assert.deepEqual(kinds('2026-10-12'), ['soon'], 'cooked today, good until tomorrow');
  assert.deepEqual(kinds('2026-10-13'), ['last-day']);
  assert.deepEqual(kinds('2026-10-14'), ['past']);
  clock.now = noon(2026, 10, 14);
  const item = store.spareBoxes()[0]; // no date = today
  assert.equal(item.kind, 'past');
  assert.equal(item.batchId, id);
  assert.equal(item.number, 1);
  assert.equal(item.recipeId, recipe.foodId);
  assert.equal(
    item.name,
    FOODS.find((f) => f.id === recipe.foodId).name,
    'the dish name rides along',
  );
});

test('store.spareBoxes: discarding a box takes it off the line', () => {
  const recipe = LIBRARY.find((r) => r.storage.includes('cooked-starch') && r.storage.length === 2);
  const { store } = kitchen(noon(2026, 10, 14));
  const id = store.cookBatch({
    recipeId: recipe.foodId,
    boxes: 2,
    storage: ['fridge', 'fridge'],
    cookedOn: '2026-10-12',
  });
  assert.equal(store.spareBoxes().length, 2);
  store.discardBox(id, `${id}-1`);
  assert.deepEqual(
    store.spareBoxes().map((s) => s.number),
    [2],
  );
  store.discardBox(id, `${id}-2`);
  assert.deepEqual(store.spareBoxes(), []);
});

test('store.spareBoxes: a freezer box has no use-by, so it is never "past"; it is spare only after a week unplanned', () => {
  const recipe = LIBRARY.find((r) => r.storage.includes('cooked-meat') && r.storage.length === 1);
  assert.ok(recipe, 'a library recipe that is only cooked meat');
  const { store } = kitchen(noon(2026, 10, 20));
  const boxes = Math.max(2, recipe.boxes);
  store.cookBatch({
    recipeId: recipe.foodId,
    boxes,
    storage: Array(boxes).fill('freezer'),
    cookedOn: '2026-10-18',
  });
  assert.deepEqual(store.spareBoxes(), [], 'cooked 2 days ago');
  const later = store.spareBoxes('2026-10-25'); // 7 days
  assert.deepEqual(
    later.map((s) => [s.kind, s.count]),
    [['frozen', boxes]],
  );
});
