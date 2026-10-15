// Author tests for app/core/search.js (ARCHITECTURE §5.6). Owner: Hamza.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TIERS,
  BOOST_WEIGHT,
  normalize,
  buildSearchIndex,
  searchFoods,
  recordUse,
  recencyBoosts,
  recentForSlot,
} from '../../../app/core/search.js';
import { deepFreeze, frozenFoods, close } from './helpers.js';

const FOODS = frozenFoods();
const INDEX = buildSearchIndex(FOODS);
const top = (query, options) => searchFoods(INDEX, query, options).hits.map((h) => h.food.id);
const first = (query, options) => top(query, options)[0];

test('TIERS and BOOST_WEIGHT: a boost never crosses a tier', () => {
  assert.ok(Object.isFrozen(TIERS));
  assert.deepEqual(
    { ...TIERS },
    { exact: 100, prefix: 80, wordPrefix: 60, substring: 40, fuzzy: 20 },
  );
  assert.equal(BOOST_WEIGHT, 19);
  const scores = Object.values(TIERS).sort((a, b) => a - b);
  for (let i = 1; i < scores.length; i += 1) assert.ok(scores[i - 1] + BOOST_WEIGHT < scores[i]);
});

test('normalize: case, accents, middle dot, punctuation, doubled vowels, spaces', () => {
  const cases = [
    ['Roti', 'roti'],
    ['  roti  ', 'roti'],
    ['ensaïmada', 'ensaimada'],
    ['Pa amb tomàquet', 'pa amb tomaquet'],
    ['Café con leche', 'cafe con leche'],
    ['cafè amb llet', 'cafe amb llet'],
    ['col·liflor', 'colliflor'],
    ['COL·LIFLOR', 'colliflor'],
    ['paŀlella', 'pallella'], // U+0140 decomposes to l + middle dot
    ['col‧liflor', 'colliflor'], // U+2027 hyphenation point
    ['año', 'ano'],
    ['açúcar', 'acucar'],
    ['Crème brûlée', 'creme brulee'.replace('ee', 'i')],
    ['daal', 'dal'],
    ['chaawal', 'chawal'],
    ['keema', 'kima'],
    ['doodh patti', 'dudh patti'],
    ['Chicken karahi (home)', 'chicken karahi home'],
    ['7-up / Pepsi', '7 up pepsi'],
    ["chai's", 'chai s'],
    ['a\t\nb', 'a b'],
    ['', ''],
    ['   ', ''],
  ];
  for (const [input, expected] of cases) assert.equal(normalize(input), expected, input);
});

test('normalize: Arabic script (Urdu)', () => {
  assert.equal(normalize('دال'), 'دال');
  assert.equal(normalize('دَال'), 'دال'); // fatha stripped
  assert.equal(normalize('مسور کی دال'), 'مسور کی دال');
  assert.equal(normalize('مسور كي دال'), 'مسور کی دال'); // Arabic kaf and yeh unified
  // Urdu comma and full stop become spaces. NFKD splits ئ into ي + hamza (U+0654, inside the
  // harakat range), so ئ folds to ی on both sides of a search.
  assert.equal(normalize('چائے، روٹی۔'), 'چایے روٹی');
  const chai = buildSearchIndex(deepFreeze([{ id: 'pk-c', name: 'Chai', nameUr: 'چائے' }]));
  assert.equal(searchFoods(chai, 'چائے').hits[0]?.tier, 'exact');
  assert.equal(normalize('ة'), 'ہ');
  assert.equal(normalize('ٰ' + 'ب'), 'ب'); // U+0670 superscript alef stripped
  assert.equal(normalize('رو\u200cٹی'), 'روٹی'); // ZWNJ removed, not a space
  // Doubled vowels are folded only in Latin text.
  assert.equal(normalize('aa اا'), 'a اا');
  assert.throws(() => normalize(null), TypeError);
});

test('A2: roti, chapati, phulka, Roti, " roti " put the home roti first', () => {
  for (const q of ['roti', 'chapati', 'phulka', 'Roti', ' roti ', 'chapatti', 'ROTI']) {
    assert.equal(first(q), 'pk-roti-home-fx', q);
  }
  const hit = searchFoods(INDEX, 'roti').hits[0];
  assert.equal(hit.tier, 'exact');
  assert.equal(hit.score, 100);
  assert.equal(hit.matched, 'roti');
});

test('A3: spellings, Urdu script and Spanish names', () => {
  for (const q of ['dal', 'daal', 'dhal', 'دال', 'masoor']) {
    assert.equal(first(q), 'pk-daal-masoor-home-fx', q);
  }
  assert.equal(searchFoods(INDEX, 'dhal').hits[0].tier, 'fuzzy');
  for (const q of ['anday', 'anda', 'egg', 'ande', 'huevo']) {
    assert.equal(first(q), 'intl-egg-boiled-fx', q);
  }
  for (const q of ['chawal', 'chaawal', 'rice']) assert.equal(first(q), 'pk-rice-plain-fx', q);
  assert.equal(first('tortilla'), 'es-tortilla-de-patatas-fx');
  assert.equal(first('chai'), 'pk-chai-doodh-patti-home-fx');
  assert.equal(first('doodh patti'), 'pk-chai-doodh-patti-home-fx');
  assert.equal(first('kela'), 'intl-banana-fx');
  assert.equal(first('platano'), 'intl-banana-fx');
});

test('karhai finds both karahis by an adjacent swap (Damerau)', () => {
  const { hits } = searchFoods(INDEX, 'karhai');
  const ids = hits.map((h) => h.food.id);
  assert.deepEqual(ids.slice(0, 2).sort(), [
    'pk-chicken-karahi-home-fx',
    'pk-chicken-karahi-restaurant-fx',
  ]);
  assert.ok(hits.slice(0, 2).every((h) => h.tier === 'fuzzy'));
  // Equal scores and lengths: sorted by name.
  assert.deepEqual(ids.slice(0, 2), [
    'pk-chicken-karahi-home-fx',
    'pk-chicken-karahi-restaurant-fx',
  ]);
  // Two typos is too many.
  assert.deepEqual(top('krhia'), []);
  // A typo inside a word prefix still matches from 5 letters ("karha" ~ "karah" of "karahi"),
  // but not at 4 (Review 1: "kela" ~ "keba" of "kebab" was junk).
  assert.ok(top('karha').includes('pk-chicken-karahi-home-fx'));
  assert.ok(!top('karh').includes('pk-chicken-karahi-home-fx'));
  // Short query words never go fuzzy: "dak" does not find "dal".
  assert.ok(!top('dak').includes('pk-daal-masoor-home-fx'));
});

test('tiers: exact, prefix, wordPrefix, substring, fuzzy', () => {
  const tierOf = (q, id) => searchFoods(INDEX, q).hits.find((h) => h.food.id === id)?.tier;
  assert.equal(tierOf('chicken karahi', 'pk-chicken-karahi-home-fx'), 'exact');
  assert.equal(tierOf('chicken kar', 'pk-chicken-karahi-home-fx'), 'prefix');
  assert.equal(tierOf('karahi chicken', 'pk-chicken-karahi-home-fx'), 'wordPrefix');
  assert.equal(tierOf('kara', 'pk-chicken-karahi-home-fx'), 'prefix'); // alias "karahi"
  assert.equal(tierOf('icken', 'pk-chicken-karahi-home-fx'), 'substring');
  assert.equal(tierOf('chiken', 'pk-chicken-karahi-home-fx'), 'fuzzy');
  const sub = searchFoods(INDEX, 'icken').hits[0];
  assert.equal(sub.score, TIERS.substring);
});

test('sorting: score, then shorter matched, then name', () => {
  // "karahi" is an exact alias of both karahis: same score and same matched length, so by name.
  const { hits } = searchFoods(INDEX, 'karahi');
  assert.deepEqual(
    hits.slice(0, 2).map((h) => [h.food.id, h.tier, h.matched]),
    [
      ['pk-chicken-karahi-home-fx', 'exact', 'karahi'],
      ['pk-chicken-karahi-restaurant-fx', 'exact', 'karahi'],
    ],
  );
  // Within a food, the shortest matching name is reported.
  const foods = deepFreeze([
    {
      id: 'intl-a',
      name: 'Apple pie with cream',
      aliases: ['apple pie'],
      halal: { status: 'halal' },
    },
    { id: 'intl-b', name: 'Apple', aliases: [], halal: { status: 'halal' } },
    { id: 'intl-c', name: 'Apple juice', aliases: [], halal: { status: 'halal' } },
  ]);
  const r = searchFoods(buildSearchIndex(foods), 'apple').hits;
  assert.deepEqual(
    r.map((h) => [h.food.id, h.tier, h.matched]),
    [
      ['intl-b', 'exact', 'Apple'],
      ['intl-a', 'prefix', 'apple pie'],
      ['intl-c', 'prefix', 'Apple juice'],
    ],
  );
});

test('boosts add up to 19 and never lift a food above a higher tier', () => {
  const foods = deepFreeze([
    { id: 'intl-x', name: 'Chai latte', aliases: [], halal: { status: 'halal' } },
    { id: 'intl-y', name: 'Masala chai', aliases: [], halal: { status: 'halal' } },
    { id: 'intl-z', name: 'Kashmirichai', aliases: [], halal: { status: 'halal' } },
  ]);
  const index = buildSearchIndex(foods);
  const run = (boosts) => searchFoods(index, 'chai', { boosts }).hits;
  assert.deepEqual(
    run({}).map((h) => [h.food.id, h.score]),
    [
      ['intl-x', 80],
      ['intl-y', 60],
      ['intl-z', 40],
    ],
  );
  const boosted = run({ 'intl-z': 1, 'intl-y': 5, 'intl-x': -3 });
  assert.deepEqual(
    boosted.map((h) => [h.food.id, h.score]),
    [
      ['intl-x', 80], // negative boost clamps to 0
      ['intl-y', 79], // boost clamps to 1: 60 + 19 stays under 80
      ['intl-z', 59], // 40 + 19 stays under 60
    ],
  );
  const half = run({ 'intl-z': 0.5 }).find((h) => h.food.id === 'intl-z');
  assert.equal(half.score, 40 + 9.5);
  // Within a tier, a boost reorders.
  const tie = deepFreeze([
    { id: 'intl-p', name: 'Paratha', aliases: [], halal: { status: 'halal' } },
    { id: 'intl-q', name: 'Paratha', aliases: [], halal: { status: 'halal' } },
  ]);
  const ti = buildSearchIndex(tie);
  assert.deepEqual(
    searchFoods(ti, 'paratha', { boosts: { 'intl-q': 0.1 } }).hits.map((h) => h.food.id),
    ['intl-q', 'intl-p'],
  );
  assert.equal(searchFoods(ti, 'paratha', { boosts: { 'intl-q': NaN } }).hits[0].score, 100);
});

test('halal filter (meeting 002): not-halal goes to hidden, check stays in hits', () => {
  for (const q of ['ensaimada', 'ensaïmada', 'Ensaïmada de Mallorca']) {
    const { hits, hidden } = searchFoods(INDEX, q);
    assert.ok(!hits.some((h) => h.food.id === 'es-ensaimada-fx'), q);
    assert.deepEqual(
      hidden.map((h) => h.food.id),
      ['es-ensaimada-fx'],
      q,
    );
    assert.equal(hidden[0].food.halal.reason, 'The standard recipe uses saïm (pork lard).');
  }
  const off = searchFoods(INDEX, 'ensaimada', { halalOnly: false });
  assert.equal(off.hits[0].food.id, 'es-ensaimada-fx');
  assert.deepEqual(off.hidden, []);
  const whey = searchFoods(INDEX, 'whey');
  assert.equal(whey.hits[0].food.id, 'intl-whey-protein-fx');
  assert.equal(whey.hits[0].food.halal.status, 'check');
  assert.deepEqual(whey.hidden, []);
});

test('A19: Barcelona café food by Catalan, Spanish or English name, with or without accents', () => {
  const expect = {
    'pa amb tomaquet': 'es-pa-amb-tomaquet-fx',
    'pa amb tomàquet': 'es-pa-amb-tomaquet-fx',
    'pan con tomate': 'es-pa-amb-tomaquet-fx',
    'pan tumaca': 'es-pa-amb-tomaquet-fx',
    'cafe con leche': 'es-cafe-con-leche-fx',
    'café con leche': 'es-cafe-con-leche-fx',
    'cafè amb llet': 'es-cafe-con-leche-fx',
    'cafe amb llet': 'es-cafe-con-leche-fx',
    'tortilla española': 'es-tortilla-de-patatas-fx',
    'spanish omelette': 'es-tortilla-de-patatas-fx',
  };
  for (const [q, id] of Object.entries(expect)) assert.equal(first(q), id, q);
  assert.equal(normalize('col·liflor'), 'colliflor');
});

test('blank query, limit, and the shape of a hit', () => {
  for (const q of ['', '   ', '...', '·'])
    assert.deepEqual(searchFoods(INDEX, q), { hits: [], hidden: [] });
  assert.deepEqual(searchFoods(INDEX, null), { hits: [], hidden: [] });
  assert.equal(searchFoods(INDEX, 'a', { limit: 3 }).hits.length, 3);
  assert.equal(searchFoods(INDEX, 'a', { limit: 0 }).hits.length, 0);
  assert.ok(searchFoods(INDEX, 'a').hits.length <= 20);
  const hit = searchFoods(INDEX, 'kela').hits[0];
  assert.deepEqual(Object.keys(hit).sort(), ['food', 'matched', 'score', 'tier']);
  assert.equal(
    hit.food,
    FOODS.find((f) => f.id === 'intl-banana-fx'),
  );
  assert.throws(() => searchFoods(INDEX, 'roti', { limit: -1 }), RangeError);
  assert.throws(() => searchFoods(INDEX, 'roti', { limit: 2.5 }), RangeError);
  assert.throws(() => searchFoods({}, 'roti'), TypeError);
  assert.throws(() => buildSearchIndex('roti'), TypeError);
});

test('buildSearchIndex indexes name, nameRoman, nameUr and aliases', () => {
  assert.equal(first('ghar ki roti'), 'pk-roti-home-fx'); // nameRoman
  assert.equal(first('گھر کی روٹی'), 'pk-roti-home-fx'); // nameUr
  assert.equal(first('Whey protein powder'), 'intl-whey-protein-fx'); // name
  assert.equal(first('protein shake'), 'intl-whey-protein-fx'); // alias
  // Foods without optional names are fine.
  const idx = buildSearchIndex(
    deepFreeze([{ id: 'intl-n', name: 'Nan', halal: { status: 'halal' } }]),
  );
  assert.equal(searchFoods(idx, 'nan').hits.length, 1);
});

test('recordUse: count, slots, last portion and lastUsed; never mutates', () => {
  const r0 = deepFreeze({});
  const r1 = recordUse(r0, {
    foodId: 'pk-chai',
    servingId: 'cup',
    qty: 1,
    slot: 'breakfast',
    date: '2026-10-12',
  });
  assert.deepEqual(r1, {
    'pk-chai': {
      servingId: 'cup',
      qty: 1,
      count: 1,
      lastUsed: '2026-10-12',
      slots: { breakfast: 1 },
    },
  });
  deepFreeze(r1);
  const r2 = recordUse(r1, {
    foodId: 'pk-chai',
    servingId: 'mug',
    qty: 2,
    slot: 'evening',
    date: '2026-10-13',
  });
  assert.deepEqual(r2['pk-chai'], {
    servingId: 'mug',
    qty: 2,
    count: 2,
    lastUsed: '2026-10-13',
    slots: { breakfast: 1, evening: 1 },
  });
  assert.equal(r1['pk-chai'].count, 1);
  const r3 = recordUse(r2, {
    foodId: 'x',
    servingId: 'g',
    qty: 50,
    slot: 'snacks',
    date: '2026-10-13',
  });
  assert.equal(Object.keys(r3).length, 2);
  assert.equal(r3['pk-chai'], r2['pk-chai']);
  const use = { foodId: 'x', servingId: 'g', qty: 50, slot: 'snacks', date: '2026-10-13' };
  assert.throws(() => recordUse({}, { ...use, qty: 0 }), RangeError);
  assert.throws(() => recordUse({}, { ...use, date: '2026-02-30' }), RangeError);
  assert.throws(() => recordUse({}, { ...use, slot: 'brunch' }), RangeError);
  assert.throws(() => recordUse({}, { ...use, foodId: '' }), TypeError);
  assert.deepEqual(Object.keys(recordUse(null, use)), ['x']);
});

test('recencyBoosts: 0.5·min(1, count/10) + 0.5·max(0, 1 − daysSince/30)', () => {
  const recents = deepFreeze({
    a: { servingId: 'cup', qty: 1, count: 5, lastUsed: '2026-10-13', slots: {} },
    b: { servingId: 'cup', qty: 1, count: 20, lastUsed: '2026-10-03', slots: {} },
    c: { servingId: 'cup', qty: 1, count: 1, lastUsed: '2026-08-01', slots: {} },
    d: { servingId: 'cup', qty: 1, count: 10, lastUsed: '2026-10-20', slots: {} }, // future date
    e: { servingId: 'cup', qty: 1, count: 3, lastUsed: 'junk', slots: {} },
  });
  const b = recencyBoosts(recents, '2026-10-13');
  close(b.a, 0.25 + 0.5);
  close(b.b, 0.5 + 0.5 * (1 - 10 / 30));
  close(b.c, 0.05);
  close(b.d, 1);
  close(b.e, 0.15);
  for (const v of Object.values(b)) assert.ok(v >= 0 && v <= 1);
  assert.deepEqual(recencyBoosts({}, '2026-10-13'), {});
  assert.throws(() => recencyBoosts(recents, '13/10/2026'), RangeError);
});

test('recentForSlot: every recent food, the ones used in this slot first (A6)', () => {
  const recents = deepFreeze({
    chai: { servingId: 'cup', qty: 1, count: 9, lastUsed: '2026-10-12', slots: { breakfast: 9 } },
    rusk: { servingId: 'piece', qty: 2, count: 3, lastUsed: '2026-10-10', slots: { evening: 3 } },
    roti: { servingId: 'medium', qty: 2, count: 7, lastUsed: '2026-10-12', slots: { lunch: 7 } },
    egg: { servingId: 'egg', qty: 2, count: 7, lastUsed: '2026-10-13', slots: { breakfast: 7 } },
    banana: { servingId: 'medium', qty: 1, count: 7, lastUsed: '2026-10-13', slots: {} },
  });
  // A chai logged only at Nashta still appears for Shaam ki chai.
  assert.deepEqual(recentForSlot(recents, 'evening'), ['rusk', 'chai', 'banana', 'egg', 'roti']);
  assert.deepEqual(recentForSlot(recents, 'breakfast'), ['chai', 'egg', 'banana', 'roti', 'rusk']);
  assert.deepEqual(recentForSlot(recents, 'evening', { limit: 2 }), ['rusk', 'chai']);
  assert.deepEqual(recentForSlot({}, 'lunch'), []);
  assert.deepEqual(recentForSlot(null, 'lunch'), []);
  const many = Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => [
      `f${String(i).padStart(2, '0')}`,
      { servingId: 'g', qty: 1, count: 1, lastUsed: '2026-10-01', slots: {} },
    ]),
  );
  assert.equal(recentForSlot(many, 'lunch').length, 12);
  assert.equal(recentForSlot(many, 'lunch')[0], 'f00');
  assert.throws(() => recentForSlot(recents, 'lunch', { limit: -1 }), RangeError);
});

/** Deterministic synthetic foods (a small LCG, so every run measures the same data). */
function syntheticFoods(n) {
  let seed = 42;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const syll = [
    'ka',
    'ra',
    'hi',
    'chi',
    'ken',
    'dal',
    'ro',
    'ti',
    'pa',
    'ne',
    'er',
    'sa',
    'mo',
    'sa',
    'bir',
    'ya',
    'ni',
    'qor',
    'ma',
    'lu',
  ];
  const word = () =>
    Array.from(
      { length: 2 + Math.floor(rand() * 3) },
      () => syll[Math.floor(rand() * syll.length)],
    ).join('');
  return Array.from({ length: n }, (_, i) => ({
    id: `intl-syn-${i}`,
    name: `${word()} ${word()} (${word()})`,
    nameRoman: `${word()} ${word()}`,
    nameUr: 'مسور کی دال',
    aliases: [word(), `${word()} ${word()}`, word(), word()],
    halal: { status: i % 50 === 0 ? 'not-halal' : 'halal', reason: 'x' },
  }));
}

test('performance: under 16 ms per query on 2,000 foods', () => {
  const index = buildSearchIndex(deepFreeze(syntheticFoods(2000)));
  const queries = [
    'roti',
    'karhai',
    'chicken karahi',
    'dal',
    'qormaa',
    'zzzzzz',
    'pane ka',
    'دال',
    'birya',
    'k',
  ];
  // Measured in process CPU time (user + system), not wall-clock time, so a busy machine
  // (other test runs, browsers) cannot fail it: Kenji's Review 2 finding, decided by Omar.
  // Median of 7 trials after 3 warm-up passes; the 16 ms budget is unchanged.
  const cpuMs = (fn) => {
    const start = process.cpuUsage();
    fn();
    const used = process.cpuUsage(start);
    return (used.user + used.system) / 1000;
  };
  for (let w = 0; w < 3; w += 1) for (const q of queries) searchFoods(index, q);
  const rounds = 5;
  const means = [];
  const worsts = [];
  for (let trial = 0; trial < 7; trial += 1) {
    let total = 0;
    let worst = 0;
    for (let r = 0; r < rounds; r += 1) {
      for (const q of queries) {
        const ms = cpuMs(() => searchFoods(index, q, { boosts: { 'intl-syn-7': 1 } }));
        total += ms;
        worst = Math.max(worst, ms);
      }
    }
    means.push(total / (rounds * queries.length));
    worsts.push(worst);
  }
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const mean = median(means);
  const worst = median(worsts);
  assert.ok(mean < 16, `median CPU ${mean.toFixed(2)} ms per query`);
  assert.ok(worst < 16 * 3, `median slowest query ${worst.toFixed(2)} ms CPU`);
});
