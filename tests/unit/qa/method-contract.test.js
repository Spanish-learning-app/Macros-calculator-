// QA: the "How to make it" method contract on every library recipe (brief s3-method, ARCHITECTURE 13.1,
// the Addendum's sheet format). Written from those texts, not from the app code. Owner: Kenji.
//   shape (keys, types, heat list, minutes)   no-cook preps   food-safety lines vs the storage record
//   every recipe has one (a count that may only go down, then a hard rule)
// Lena's tests/contract/recipe-method.test.js checks the shape too; this file also checks what the
// words promise (M-01: what the Lab writes has to reach the Boss, and be right when it gets there).
import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS, RULES } from '../../../app/data/index.js';
import LIBRARY from '../../../app/data/recipes-mealprep.js';
import { buildFoodIndex } from '../../../app/core/foods.js';
import { storagePlan } from '../../../app/core/mealprep.js';

const HEATS = [
  'none',
  'low',
  'medium',
  'medium-high',
  'high',
  'oven-180',
  'oven-200',
  'oven-220',
  'microwave',
];
const METHOD_KEYS = ['equipment', 'prep', 'steps', 'doneWhen', 'boxUp', 'reheat', 'tips'];
const STEP_KEYS = ['text', 'heat', 'minutes'];
const FOOD_INDEX = buildFoodIndex(FOODS);

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const textList = (v) => Array.isArray(v) && v.every(isText);
const withMethod = LIBRARY.filter((r) => r.method !== undefined);
const isNoCook = (r) => r.effort === 'assemble' || r.effort === 'ready';

/** Problems with one method, in words. [] = it matches the contract. */
function problems(m) {
  const p = [];
  if (m === null || typeof m !== 'object' || Array.isArray(m)) return ['method is not an object'];
  for (const k of Object.keys(m)) if (!METHOD_KEYS.includes(k)) p.push(`unknown key "${k}"`);
  if (!textList(m.equipment) || m.equipment.length === 0)
    p.push('equipment: a non-empty list of text');
  if (!textList(m.prep)) p.push('prep: a list of text');
  if (!Array.isArray(m.steps) || m.steps.length === 0) p.push('steps: a non-empty list');
  else
    m.steps.forEach((s, i) => {
      if (s === null || typeof s !== 'object' || Array.isArray(s))
        return p.push(`step ${i + 1}: not an object`);
      for (const k of Object.keys(s))
        if (!STEP_KEYS.includes(k)) p.push(`step ${i + 1}: unknown key "${k}"`);
      if (!isText(s.text)) p.push(`step ${i + 1}: text`);
      if (s.heat !== undefined && !HEATS.includes(s.heat))
        p.push(`step ${i + 1}: heat "${s.heat}"`);
      if (
        s.minutes !== undefined &&
        !(typeof s.minutes === 'number' && Number.isFinite(s.minutes) && s.minutes > 0)
      )
        p.push(`step ${i + 1}: minutes ${JSON.stringify(s.minutes)}`);
    });
  if (!isText(m.boxUp)) p.push('boxUp: text');
  if (!isText(m.reheat)) p.push('reheat: text');
  if (m.doneWhen !== undefined && !isText(m.doneWhen)) p.push('doneWhen: text when present');
  if (m.tips !== undefined && !(textList(m.tips) && m.tips.length > 0))
    p.push('tips: a non-empty list of text when present');
  return p;
}

// ------------------------------------------------------------------ the checker checks itself

test('the shape check catches each kind of break (so a green run means something)', () => {
  const ok = {
    equipment: ['Pan'],
    prep: [],
    steps: [{ text: 'Fry.', heat: 'low', minutes: 2 }],
    boxUp: 'Cool.',
    reheat: 'Eat cold.',
  };
  assert.deepEqual(problems(ok), []);
  const bad = (change) => problems({ ...ok, ...change }).length;
  assert.equal(bad({ equipment: [] }), 1);
  assert.equal(bad({ equipment: 'Pan' }), 1);
  assert.equal(bad({ prep: undefined }), 1);
  assert.equal(bad({ steps: [] }), 1);
  assert.equal(bad({ steps: [{ heat: 'low' }] }), 1);
  assert.equal(bad({ steps: [{ text: 'x', heat: 'hot' }] }), 1);
  assert.equal(bad({ steps: [{ text: 'x', minutes: 0 }] }), 1);
  assert.equal(bad({ steps: [{ text: 'x', minutes: -3 }] }), 1);
  assert.equal(bad({ steps: [{ text: 'x', minutes: '5' }] }), 1);
  assert.equal(bad({ steps: [{ text: 'x', mins: 5 }] }), 1);
  assert.equal(bad({ boxUp: '' }), 1);
  assert.equal(bad({ reheat: undefined }), 1);
  assert.equal(bad({ doneWhen: 5 }), 1);
  assert.equal(bad({ tips: [] }), 1);
  assert.equal(bad({ extra: 1 }), 1);
  assert.equal(problems(['Fry the onion.']).length, 1, "the sheets' old string[] is not a method");
  assert.equal(problems(null).length, 1);
});

// ------------------------------------------------------------------ shape of every method that exists

test('method: the heat list is exactly the nine values of the contract', () => {
  assert.equal(HEATS.length, 9);
  const used = new Set(
    withMethod.flatMap((r) => r.method.steps.map((s) => s.heat).filter(Boolean)),
  );
  for (const h of used) assert.ok(HEATS.includes(h), `heat "${h}" is not in the contract`);
  assert.ok(
    used.has('none') && used.size >= 5,
    `only ${[...used]} used: a library with so few heats is suspicious`,
  );
});

test('method: every library recipe that has one matches the contract', () => {
  assert.ok(withMethod.length >= 45, `${withMethod.length} recipes have a method`);
  const bad = withMethod
    .map((r) => [r.foodId, problems(r.method)])
    .filter(([, p]) => p.length)
    .map(([id, p]) => `${id}: ${p.join('; ')}`);
  assert.deepEqual(bad, []);
});

test('method: each recipe is a food of the Lab, and no text carries a placeholder or a leftover marker', () => {
  for (const r of LIBRARY) assert.ok(FOOD_INDEX.get(r.foodId), `${r.foodId} is not a food`);
  for (const r of withMethod) {
    const all = JSON.stringify(r.method);
    assert.doesNotMatch(
      all,
      /\bundefined\b|\bNaN\b|\[object|\bTODO\b|\bTBD\b|\{\{|\}\}|lorem ipsum/,
      r.foodId,
    );
    for (const s of r.method.steps) {
      assert.equal(s.text, s.text.trim(), `${r.foodId}: spaces around a step`);
      assert.ok(
        s.text.length <= 400,
        `${r.foodId}: a ${s.text.length}-character step is more than one action`,
      );
      assert.ok(!(s.minutes > 240), `${r.foodId}: a step of ${s.minutes} minutes`);
    }
    assert.ok(
      r.method.steps.length >= 3 && r.method.steps.length <= 20,
      `${r.foodId}: ${r.method.steps.length} steps`,
    );
  }
});

test('method: a cooked prep says how hot at some step; a step with an oven heat names its time somewhere', () => {
  for (const r of withMethod.filter((x) => !isNoCook(x))) {
    assert.ok(
      r.method.steps.some((s) => s.heat && s.heat !== 'none'),
      `${r.foodId} is a cook prep and no step has a heat`,
    );
  }
  for (const r of withMethod) {
    const oven = r.method.steps.filter((s) => s.heat?.startsWith('oven'));
    if (oven.length)
      assert.ok(
        oven.some((s) => s.minutes > 0),
        `${r.foodId}: oven steps and no minutes at all`,
      );
    // The heat chip and the words agree on the oven temperature.
    for (const s of oven) {
      const deg = s.heat.slice(5);
      const said = s.text.match(/(\d{3}) ?°C/);
      if (said) assert.equal(said[1], deg, `${r.foodId}: chip ${s.heat}, text says ${said[1]} °C`);
    }
  }
});

// ------------------------------------------------------------------ no-cook preps

// BUG-M2 (Yusuf, fixed 2026-10-16): the two toast preps used to be "assemble" but opened with "Morning: ... toast".
// Now every assemble/ready prep opens with a "No cooking" step with heat none, with no exceptions.
const noCookProblem = (r) => {
  const first = r.method.steps[0];
  if (!/^No cooking\b/.test(first.text)) return `first step starts "${first.text.slice(0, 25)}"`;
  if (first.heat !== 'none') return `first step heat is ${first.heat}`;
  return null;
};

test('no-cook preps (effort assemble or ready): the first step says "No cooking" with heat none', () => {
  const noCook = withMethod.filter(isNoCook);
  assert.ok(noCook.length >= 15, `${noCook.length} no-cook preps with a method`);
  const bad = noCook.filter(noCookProblem);
  assert.deepEqual(
    bad.map((r) => `${r.foodId}: ${noCookProblem(r)}`),
    [],
  );
});

test('BUG-M2 stays fixed: the two toast preps open with "No cooking" and heat none', () => {
  const ids = ['es-pa-amb-tomaquet-burgos-ous-portion', 'es-tostada-tomate-atun-aguacate-portion'];
  const toast = withMethod.filter((r) => ids.includes(r.foodId));
  assert.equal(toast.length, 2);
  for (const r of toast) assert.equal(noCookProblem(r), null, r.foodId);
});

test('cook preps never open with "No cooking" (the words would lie)', () => {
  for (const r of withMethod.filter((x) => !isNoCook(x)))
    assert.doesNotMatch(r.method.steps[0].text, /^No cooking/, r.foodId);
});

// ------------------------------------------------------------------ food-safety lines against the record

const plan = (r) => storagePlan(r, r.boxes, FOOD_INDEX, RULES);
const storageIds = (r) => r.storage.map((s) => (typeof s === 'string' ? s : s.id));

test('rice and pasta preps tell you to cool fast (within the hour)', () => {
  const withStarch = withMethod.filter((r) =>
    r.storage.some((s) => (typeof s === 'string' ? s : !s.pot && s.id) === 'cooked-starch'),
  );
  assert.ok(withStarch.length >= 8, `${withStarch.length} rice preps`);
  for (const r of withStarch)
    assert.match(
      r.method.boxUp,
      /\b(hour|60 min|1 h)\b/i,
      `${r.foodId}: boxUp says nothing about cooling within the hour`,
    );
});

test('a plan with freezer boxes is explained in boxUp ("freezer")', () => {
  for (const r of withMethod) {
    if (plan(r).storage.includes('freezer'))
      assert.match(
        r.method.boxUp,
        /freez/i,
        `${r.foodId}: the app puts boxes in the freezer, boxUp is silent`,
      );
  }
});

// BUG-M1 (Yusuf, fixed 2026-10-16): boxUp that sends numbered boxes to the freezer must match a `storage`
// record that can freeze (a fresh cold-salad as a box component made the app keep every box in the fridge).
const M1 = ['intl-chicken-broccoli-pesto-pasta-box', 'med-chicken-shawarma-pita-box'];
const sendsToFreezer = (r) => /boxes? \d[^.]{0,40}\bfreezer/i.test(r.method.boxUp);

test('boxUp that sends numbered boxes to the freezer matches a freezable storage record', () => {
  let n = 0;
  for (const r of withMethod)
    if (sendsToFreezer(r)) {
      n++;
      assert.ok(
        plan(r).freezable,
        `${r.foodId}: boxUp freezes boxes but storage ${storageIds(r)} cannot freeze`,
      );
    }
  assert.ok(n >= 2, `${n} recipes send numbered boxes to the freezer`);
});

test('BUG-M1 stays fixed: pesto pasta and shawarma pita plan freezer boxes as boxUp says', () => {
  for (const id of M1) {
    const r = withMethod.find((x) => x.foodId === id);
    assert.ok(r, id);
    assert.ok(sendsToFreezer(r), `${id}: boxUp no longer mentions the freezer`);
    assert.ok(plan(r).freezable, `${id}: storage ${storageIds(r)} cannot freeze`);
    assert.ok(plan(r).storage.includes('freezer'), `${id}: plan ${plan(r).storage}`);
  }
});

// ------------------------------------------------------------------ every recipe has one

// BUG-M0 (Zainab and Yusuf, fixed 2026-10-16): all 64 library recipes have a method. A recipe, new or
// converted, that has none fails here with its id.
const missing = LIBRARY.filter((r) => r.method === undefined).map((r) => r.foodId);

test('method: every library recipe has a "How to make it" (BUG-M0 stays fixed)', () => {
  assert.ok(LIBRARY.length >= 64, `${LIBRARY.length} library recipes`);
  assert.deepEqual(missing, [], `no method for: ${missing.join(', ')}`);
});
