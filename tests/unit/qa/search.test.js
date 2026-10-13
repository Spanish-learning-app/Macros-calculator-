// QA tests for app/core/search.js, written from docs/ARCHITECTURE.md §5.6, meeting 002 (accents,
// the Catalan middle dot, the halal filter) and A2, A3, A6, A14 and A19 in docs/CUSTOMER.md.
// Search runs on the fixture foods; real-data rankings are checked by the E2E specs.
// Owner: Kenji.
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
import { qa, FOODS, frozen, deepFreeze, assertClose, rng } from './_helpers.js';

const ids = (hits) => hits.map((h) => h.food.id);
const index = () => buildSearchIndex(frozen(FOODS));
const ROTI = 'pk-roti-home-fx';
const DAAL = 'pk-daal-masoor-home-fx';
const EGG = 'intl-egg-boiled-fx';
const K_HOME = 'pk-chicken-karahi-home-fx';
const K_REST = 'pk-chicken-karahi-restaurant-fx';
const RICE = 'pk-rice-plain-fx';
const BOX = 'pk-chicken-tikka-rice-box-fx';
const ENSAIMADA = 'es-ensaimada-fx';
const WHEY = 'intl-whey-protein-fx';

// ------------------------------------------------------------------ constants
qa('TIERS and BOOST_WEIGHT (§5.6)', [], () => {
  assert.deepEqual(
    { ...TIERS },
    { exact: 100, prefix: 80, wordPrefix: 60, substring: 40, fuzzy: 20 },
  );
  assert.equal(BOOST_WEIGHT, 19);
  assert.ok(Object.isFrozen(TIERS));
  const scores = Object.values(TIERS).sort((a, b) => b - a);
  for (let i = 1; i < scores.length; i++) {
    assert.ok(scores[i - 1] - scores[i] > BOOST_WEIGHT, 'a full boost never reaches the next tier');
  }
});

// ------------------------------------------------------------------ normalize
qa('normalize: case, whitespace and punctuation', [normalize], () => {
  assert.equal(normalize('Roti'), 'roti');
  assert.equal(normalize('  roti  '), 'roti');
  assert.equal(normalize('ROTI'), 'roti');
  assert.equal(normalize('tandoori   roti'), 'tanduri roti');
  assert.equal(normalize('doodh-patti'), 'dudh patti');
  assert.equal(normalize('Chicken karahi (home)'), 'chicken karahi home');
  assert.equal(normalize('Chicken breast, roasted'), 'chicken breast roasted');
  assert.equal(normalize("oli d'oliva"), 'oli d oliva');
  assert.equal(normalize('7up'), '7up');
  assert.equal(normalize(''), '');
  assert.equal(normalize('   '), '');
  assert.equal(normalize('\t roti\n'), 'roti');
});

qa('normalize: accents fold (meeting 002: Catalan, Spanish)', [normalize], () => {
  assert.equal(normalize('ensaïmada'), 'ensaimada');
  assert.equal(normalize('Ensaïmada'), 'ensaimada');
  assert.equal(normalize('pa amb tomàquet'), 'pa amb tomaquet');
  assert.equal(normalize('café con leche'), 'cafe con leche');
  assert.equal(normalize('Cafè amb llet'), 'cafe amb llet');
  assert.equal(normalize('Plátano'), 'platano');
  assert.equal(normalize('plàtan'), 'platan');
  assert.equal(normalize('Año'), 'ano');
  assert.equal(normalize('Barça'), 'barca');
  assert.equal(normalize('cruasán'), 'cruasan');
  assert.equal(normalize('truita de patates'), 'truita de patates');
  assert.equal(normalize('jamón'), 'jamon');
  assert.equal(normalize('über'), 'uber');
  assert.equal(normalize('crème brûlée'), 'creme bruli');
  assert.equal(normalize('café'), 'cafe', 'combining acute (already decomposed)');
});

qa('normalize: the Catalan middle dot is deleted, not turned into a space', [normalize], () => {
  assert.equal(normalize('col·liflor'), 'colliflor');
  assert.equal(normalize('col‧liflor'), 'colliflor', 'U+2027 hyphenation point');
  assert.equal(normalize('paral·lel'), 'parallel');
  assert.equal(normalize('·'), '');
});

qa('normalize: Urdu and Arabic script (harakat stripped, letters unified)', [normalize], () => {
  assert.equal(normalize('دَال'), 'دال', 'fatha stripped');
  assert.equal(normalize('دِال'), 'دال', 'kasra stripped');
  assert.equal(normalize('دُودھ'), 'دودھ', 'damma stripped');
  assert.equal(normalize('چاي'), 'چای', 'Arabic yeh → Farsi yeh');
  assert.equal(normalize('كباب'), 'کباب', 'Arabic kaf → keheh');
  assert.equal(normalize('حلوة'), 'حلوہ', 'teh marbuta → heh goal');
  assert.equal(normalize('رحمٰن'), 'رحمن', 'superscript alef U+0670 stripped');
  assert.equal(normalize('مسور کی دال'), 'مسور کی دال', 'plain Urdu unchanged');
  assert.equal(normalize('آلو'), normalize('الو'), 'alef madda folds by NFKD');
  assert.equal(normalize('دال، چاول'), 'دال چاول', 'Arabic comma is punctuation');
});

qa('normalize: Latin doubled vowels aa→a, ee→i, oo→u', [normalize], () => {
  assert.equal(normalize('daal'), 'dal');
  assert.equal(normalize('chaawal'), 'chawal');
  assert.equal(normalize('paani'), 'pani');
  assert.equal(normalize('kheer'), 'khir');
  assert.equal(normalize('cheeni'), 'chini');
  assert.equal(normalize('aloo'), 'alu');
  assert.equal(normalize('doodh'), 'dudh');
  assert.equal(normalize('Rooh Afza'), 'ruh afza');
  assert.equal(normalize('daal'), normalize('dal'));
  assert.equal(normalize('kheer'), normalize('khir'));
});

qa('property: normalize is idempotent', [normalize], () => {
  const corpus = [
    ...FOODS.flatMap((f) => [f.name, f.nameRoman, f.nameUr, ...f.aliases].filter(Boolean)),
    'chaaai',
    'daaal',
    'aaa',
    'eee',
    'eeee',
    'ooo',
    'oooo',
    'aaaa bbb',
    'Ensaïmada  de   Mallorca!!',
    'col·liflor, col‧liflor',
    'دَالٰ',
    '  ··  ',
    'café—con—leche',
    'KHEER (with) aaloo',
  ];
  for (const text of corpus) {
    const once = normalize(text);
    assert.equal(normalize(once), once, `normalize("${text}") = "${once}" is not stable`);
    assert.equal(once, once.trim(), 'trimmed');
    assert.ok(!/\s{2}/.test(once), 'whitespace collapsed');
    assert.equal(once, once.toLowerCase(), 'lowercase');
  }
});

// ------------------------------------------------------------------ searchFoods: tiers
function hitFor(result, id) {
  return result.hits.find((h) => h.food.id === id) ?? result.hidden.find((h) => h.food.id === id);
}

qa(
  'searchFoods returns { hits, hidden } with { food, score, tier, matched } hits',
  [buildSearchIndex, searchFoods],
  () => {
    const r = searchFoods(index(), 'roti');
    assert.ok(Array.isArray(r.hits) && Array.isArray(r.hidden));
    const h = r.hits[0];
    assert.deepEqual(Object.keys(h).sort(), ['food', 'matched', 'score', 'tier']);
    assert.equal(h.food.id, ROTI);
    assert.equal(h.tier, 'exact');
    assert.equal(h.score, 100);
    assert.equal(h.matched, 'roti', 'the original string that matched');
  },
);

qa(
  'A2: roti, chapati, phulka, Roti and " roti " put the roti first',
  [buildSearchIndex, searchFoods],
  () => {
    const idx = index();
    for (const q of ['roti', 'chapati', 'phulka', 'Roti', ' roti ', 'chapatti', 'ROTI']) {
      const r = searchFoods(idx, q);
      assert.equal(r.hits[0]?.food.id, ROTI, `"${q}"`);
      assert.equal(r.hits[0].tier, 'exact', `"${q}" is an exact alias`);
    }
  },
);

qa(
  'tiers: exact 100, prefix 80, wordPrefix 60, substring 40, fuzzy 20',
  [buildSearchIndex, searchFoods],
  () => {
    const idx = index();
    const cases = [
      ['roti', ROTI, 'exact'],
      ['chapa', ROTI, 'prefix'],
      ['ghar', ROTI, 'prefix'],
      ['ki roti', ROTI, 'wordPrefix'],
      ['wheat', ROTI, 'wordPrefix'],
      ['apati', ROTI, 'substring'],
      ['dhal', DAAL, 'fuzzy'],
      ['karhai', K_HOME, 'fuzzy'],
      ['karhai', K_REST, 'fuzzy'],
      ['دال', DAAL, 'wordPrefix'],
    ];
    for (const [q, id, tier] of cases) {
      const h = hitFor(searchFoods(idx, q), id);
      assert.ok(h, `"${q}" finds ${id}`);
      assert.equal(h.tier, tier, `"${q}" → ${id}`);
      assert.equal(h.score, TIERS[tier], `"${q}" score without boost`);
    }
  },
);

qa(
  'A3 (fixtures): dal, daal, dhal, دال, anda, anday, egg, chawal, rice, kela, tortilla',
  [buildSearchIndex, searchFoods],
  () => {
    const idx = index();
    const top3 = (q) => ids(searchFoods(idx, q).hits).slice(0, 3);
    for (const q of ['dal', 'daal', 'dhal', 'دال']) assert.ok(top3(q).includes(DAAL), q);
    for (const q of ['anda', 'anday', 'ande', 'egg']) assert.equal(top3(q)[0], EGG, q);
    for (const q of ['chawal', 'chaawal', 'rice']) assert.equal(top3(q)[0], RICE, q);
    assert.equal(top3('kela')[0], 'intl-banana-fx');
    assert.equal(top3('tortilla')[0], 'es-tortilla-de-patatas-fx');
    assert.equal(top3('chai')[0], 'pk-chai-doodh-patti-home-fx');
    assert.equal(top3('doodh patti')[0], 'pk-chai-doodh-patti-home-fx');
  },
);

qa(
  'A19 (fixtures): Catalan, Spanish and English names, with or without accents',
  [buildSearchIndex, searchFoods],
  () => {
    const idx = index();
    const first = (q) => searchFoods(idx, q).hits[0]?.food.id;
    for (const q of ['pa amb tomàquet', 'pa amb tomaquet', 'pan con tomate', 'bread with tomato']) {
      assert.equal(first(q), 'es-pa-amb-tomaquet-fx', q);
    }
    for (const q of [
      'cafè amb llet',
      'cafe amb llet',
      'café con leche',
      'cafe con leche',
      'latte',
    ]) {
      assert.equal(first(q), 'es-cafe-con-leche-fx', q);
    }
    for (const q of ['plátano', 'platano', 'PLÁTANO']) assert.equal(first(q), 'intl-banana-fx', q);
  },
);

qa(
  'halal filter: not-halal matches go to hidden; check stays in hits (meeting 002)',
  [buildSearchIndex, searchFoods],
  () => {
    const idx = index();
    for (const q of ['ensaïmada', 'ensaimada', 'Ensaimada']) {
      const on = searchFoods(idx, q);
      assert.ok(!ids(on.hits).includes(ENSAIMADA), `"${q}": not in hits by default`);
      assert.deepEqual(ids(on.hidden), [ENSAIMADA], `"${q}": one hidden item`);
      assert.equal(on.hidden[0].tier, 'exact');
      assert.equal(on.hidden[0].food.halal.status, 'not-halal');
      const explicit = searchFoods(idx, q, { halalOnly: true });
      assert.deepEqual(ids(explicit.hidden), [ENSAIMADA]);
      const off = searchFoods(idx, q, { halalOnly: false });
      assert.equal(off.hits[0].food.id, ENSAIMADA, `"${q}": shown with the filter off`);
      assert.deepEqual(off.hidden, []);
    }
    const whey = searchFoods(idx, 'whey');
    assert.equal(whey.hits[0].food.id, WHEY, "'check' foods stay in hits");
    assert.deepEqual(whey.hidden, []);
  },
);

qa('blank or unmatched queries give no hits', [buildSearchIndex, searchFoods], () => {
  const idx = index();
  for (const q of ['', '   ', '\n', '·', '!!', 'xyzzy', 'qqqqqqqq']) {
    const r = searchFoods(idx, q);
    assert.deepEqual(r.hits, [], `"${q}"`);
    assert.deepEqual(r.hidden, [], `"${q}" hidden`);
  }
});

qa(
  'fuzzy: distance 1 per query word of 4+ letters; shorter words must word-prefix',
  [buildSearchIndex, searchFoods],
  () => {
    const idx = index();
    const found = (q, id) => Boolean(hitFor(searchFoods(idx, q, { halalOnly: false }), id));
    assert.ok(found('karhai', K_HOME), 'adjacent swap');
    assert.ok(found('karahii', K_HOME), 'one insertion');
    assert.ok(found('karai', K_HOME), 'one deletion (alias karahi)');
    assert.ok(found('kerahi', K_HOME), 'one substitution');
    assert.ok(!found('krhai', K_HOME), 'two edits: no match');
    assert.ok(found('dhal', DAAL), 'dhal → dal');
    assert.ok(!found('dl', DAAL), 'a short word must word-prefix');
    assert.ok(found('masor', DAAL), 'masoor → masur, one edit from masor');
    assert.ok(found('ensaymada', ENSAIMADA), 'y for i');
    assert.ok(found('chicken karhai', K_HOME), 'every word must match: exact + fuzzy');
    assert.ok(!found('chicken krhai', K_HOME), 'one word too far → no match');
  },
);

// ------------------------------------------------------------------ ranking and boosts
qa('ranking: score, then shorter matched, then name', [buildSearchIndex, searchFoods], () => {
  const idx = index();
  const r = searchFoods(idx, 'karahi');
  assert.deepEqual(ids(r.hits).slice(0, 2), [K_HOME, K_REST], 'same score and match → by name');
  for (let i = 1; i < r.hits.length; i++) {
    const [a, b] = [r.hits[i - 1], r.hits[i]];
    assert.ok(a.score >= b.score, 'score desc');
    if (a.score === b.score && a.matched.length !== b.matched.length) {
      assert.ok(a.matched.length < b.matched.length, 'shorter matched first');
    }
  }
});

qa('boosts: score = tier + 19 × clamp(boost, 0, 1)', [buildSearchIndex, searchFoods], () => {
  const idx = index();
  const score = (q, id, boosts) => hitFor(searchFoods(idx, q, { boosts }), id).score;
  assert.equal(score('karahi', K_REST, { [K_REST]: 1 }), 119);
  assert.equal(score('karahi', K_REST, { [K_REST]: 5 }), 119, 'clamped to 1');
  assert.equal(score('karahi', K_REST, { [K_REST]: -2 }), 100, 'clamped to 0');
  assertClose(score('karahi', K_REST, { [K_REST]: 0.5 }), 109.5);
  assertClose(score('dhal', DAAL, { [DAAL]: 0.25 }), 24.75);
  const boosted = searchFoods(idx, 'karahi', { boosts: { [K_REST]: 0.1 } });
  assert.deepEqual(ids(boosted.hits).slice(0, 2), [K_REST, K_HOME], 'a boost reorders a tier');
});

qa('a full boost never lifts a food above a better tier', [buildSearchIndex, searchFoods], () => {
  const idx = index();
  const r = searchFoods(idx, 'rice', { boosts: { [BOX]: 1 } });
  assert.equal(r.hits[0].food.id, RICE, 'exact 100 beats wordPrefix 60 + 19');
  const box = hitFor(r, BOX);
  assert.ok(box && box.score <= TIERS.prefix + BOOST_WEIGHT);
});

qa(
  'property: random boosts never cross a tier, hits stay sorted',
  [buildSearchIndex, searchFoods],
  () => {
    const idx = index();
    const random = rng(11);
    const queries = [
      'ch',
      'k',
      'rice',
      'karahi',
      'egg',
      'roti',
      'dal',
      'a',
      'tikka',
      'pa',
      'ca',
      'e',
    ];
    const rank = (tier) => Object.keys(TIERS).indexOf(tier);
    for (let i = 0; i < 60; i++) {
      const boosts = Object.fromEntries(FOODS.map((f) => [f.id, random() * 3 - 1]));
      const q = queries[i % queries.length];
      const { hits } = searchFoods(idx, q, { boosts: deepFreeze(boosts), halalOnly: false });
      for (const h of hits) {
        const extra = h.score - TIERS[h.tier];
        assert.ok(
          extra >= 0 && extra <= BOOST_WEIGHT + 1e-9,
          `"${q}" ${h.food.id}: boost ${extra}`,
        );
      }
      for (let j = 1; j < hits.length; j++) {
        assert.ok(hits[j - 1].score >= hits[j].score, `"${q}": sorted by score`);
        assert.ok(rank(hits[j - 1].tier) <= rank(hits[j].tier), `"${q}": tier order kept`);
      }
    }
  },
);

qa('limit applies to hits; hidden keeps rank order', [buildSearchIndex, searchFoods], () => {
  const idx = index();
  const all = searchFoods(idx, 'ch', { halalOnly: false });
  assert.ok(all.hits.length >= 4, 'enough hits to test the limit');
  const two = searchFoods(idx, 'ch', { limit: 2, halalOnly: false });
  assert.deepEqual(ids(two.hits), ids(all.hits).slice(0, 2));
  const def = searchFoods(idx, 'a', { halalOnly: false });
  assert.ok(def.hits.length <= 20, 'default limit 20');
});

qa(
  'searchFoods and buildSearchIndex do not mutate the foods',
  [buildSearchIndex, searchFoods],
  () => {
    const foods = frozen(FOODS);
    const idx = buildSearchIndex(foods);
    searchFoods(idx, 'karahi', { boosts: deepFreeze({ [K_REST]: 1 }) });
    assert.deepEqual(foods, FOODS);
  },
);

// ------------------------------------------------------------------ recents
qa(
  'recordUse: a first use, then a second in another slot (the one-tap "+" portion)',
  [recordUse],
  () => {
    const r1 = recordUse(deepFreeze({}), {
      foodId: 'chai',
      servingId: 'cup',
      qty: 1,
      slot: 'breakfast',
      date: '2026-10-12',
    });
    assert.deepEqual(r1, {
      chai: { servingId: 'cup', qty: 1, count: 1, lastUsed: '2026-10-12', slots: { breakfast: 1 } },
    });
    const r2 = recordUse(deepFreeze(r1), {
      foodId: 'chai',
      servingId: 'mug',
      qty: 2,
      slot: 'evening',
      date: '2026-10-13',
    });
    assert.deepEqual(r2.chai, {
      servingId: 'mug',
      qty: 2,
      count: 2,
      lastUsed: '2026-10-13',
      slots: { breakfast: 1, evening: 1 },
    });
    const r3 = recordUse(deepFreeze(r2), {
      foodId: 'roti',
      servingId: 'medium',
      qty: 2,
      slot: 'dinner',
      date: '2026-10-13',
    });
    assert.deepEqual(r3.chai, r2.chai, 'other foods untouched');
    assert.equal(r3.roti.count, 1);
    assert.equal(r1.chai.count, 1, 'input unchanged');
  },
);

qa('recencyBoosts: 0.5·min(1, count/10) + 0.5·max(0, 1 − daysSince/30)', [recencyBoosts], () => {
  const recents = deepFreeze({
    a: { servingId: 's', qty: 1, count: 10, lastUsed: '2026-10-13', slots: {} },
    b: { servingId: 's', qty: 1, count: 5, lastUsed: '2026-09-28', slots: {} },
    c: { servingId: 's', qty: 1, count: 25, lastUsed: '2026-08-01', slots: {} },
    d: { servingId: 's', qty: 1, count: 1, lastUsed: '2026-10-13', slots: {} },
    e: { servingId: 's', qty: 1, count: 3, lastUsed: '2026-10-11', slots: {} },
  });
  const b = recencyBoosts(recents, '2026-10-13');
  assert.deepEqual(Object.keys(b).sort(), ['a', 'b', 'c', 'd', 'e']);
  assertClose(b.a, 1);
  assertClose(b.b, 0.25 + 0.25, 1e-9, '15 days ago');
  assertClose(b.c, 0.5, 1e-9, 'old but frequent');
  assertClose(b.d, 0.05 + 0.5);
  assertClose(b.e, 0.15 + 0.5 * (1 - 2 / 30));
  const dst = recencyBoosts(recents, '2026-10-26');
  assertClose(dst.a, 0.5 + 0.5 * (1 - 13 / 30), 1e-9, 'whole days across the clock change');
  for (const v of Object.values(dst)) assert.ok(v >= 0 && v <= 1);
});

qa('recentForSlot (A6): every recent food, those used in the slot first', [recentForSlot], () => {
  const r = (count, lastUsed, slots) => ({ servingId: 's', qty: 1, count, lastUsed, slots });
  const recents = deepFreeze({
    chai: r(6, '2026-10-12', { breakfast: 6 }),
    roti: r(9, '2026-10-12', { lunch: 4, dinner: 5 }),
    biscuit: r(2, '2026-10-11', { evening: 2 }),
    apple: r(2, '2026-10-12', { evening: 1, snacks: 1 }),
    whey: r(3, '2026-10-10', { snacks: 3 }),
  });
  const evening = recentForSlot(recents, 'evening');
  assert.deepEqual(evening, ['biscuit', 'apple', 'roti', 'chai', 'whey']);
  assert.ok(evening.includes('chai'), 'chai logged at Nashta still shows at Shaam ki chai');
  assert.deepEqual(recentForSlot(recents, 'breakfast'), [
    'chai',
    'roti',
    'whey',
    'apple',
    'biscuit',
  ]);
  assert.deepEqual(recentForSlot(recents, 'dinner', { limit: 2 }), ['roti', 'chai']);
  assert.deepEqual(recentForSlot({}, 'lunch'), []);
});

qa('recentForSlot: default limit 12; ties broken by lastUsed then id', [recentForSlot], () => {
  const many = Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `f${String(i).padStart(2, '0')}`,
      { servingId: 's', qty: 1, count: 1, lastUsed: '2026-10-13', slots: {} },
    ]),
  );
  const list = recentForSlot(deepFreeze(many), 'lunch');
  assert.equal(list.length, 12);
  assert.deepEqual(list, Object.keys(many).sort().slice(0, 12), 'equal → by id');
  const tie = deepFreeze({
    old: { servingId: 's', qty: 1, count: 2, lastUsed: '2026-10-01', slots: {} },
    newer: { servingId: 's', qty: 1, count: 2, lastUsed: '2026-10-12', slots: {} },
  });
  assert.deepEqual(recentForSlot(tie, 'lunch'), ['newer', 'old']);
});
