// Contract between the Nutrition Lab's data modules and the code. Owner: Lena.
// Checks that app/data/rules.js has every field the core reads (docs/ARCHITECTURE.md §6) and that
// its enums agree with the binding constants in app/core. Values are Ayesha's and are not tested
// here (the target vectors and the data gate test those).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import RULES from '../../app/data/rules.js';
import { ACTIVITY_LEVELS, GOALS } from '../../app/core/targets.js';
import { SLOT_IDS, DEFAULT_SLOT_LABELS } from '../../app/core/days.js';
import { STYLES, NUTRIENT_KEYS } from '../../app/core/foods.js';

const READ_BY_CODE = [
  'energy.factors',
  'energy.tolerance.pct',
  'energy.tolerance.kcal',
  'energy.kcalPerKgBodyWeight',
  'profileLimits.ageYears',
  'profileLimits.heightCm',
  'profileLimits.weightKg',
  'profileLimits.bodyFatPct',
  'bmr.mifflinStJeor',
  'bmr.katchMcArdle',
  'activityLevels',
  'goals',
  'rails',
  'proteinReferenceWeight',
  'protein.gPerKgPrw',
  'protein.overrideGPerKgPrw',
  'fat',
  'carbs',
  'fiber',
  'rounding.kcalStep',
  'healthFlags',
  'derivedFlags',
  'warnings',
  'mealSlots.default',
  'vocab.groups',
  'vocab.tags',
  'vocab.tagRules',
  'vocab.styles',
  'vocab.sourceMethods',
  'vocab.confidenceGrades',
];

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const ids = (list) => list.map((x) => x.id);

test('RULES has every field the code reads', () => {
  const missing = READ_BY_CODE.filter((p) => get(RULES, p) === undefined);
  assert.deepEqual(missing, []);
});

test('RULES is plain data (JSON round-trip is lossless)', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(RULES)), RULES);
});

test('RULES enums agree with the binding core constants', () => {
  assert.deepEqual(ids(RULES.activityLevels), [...ACTIVITY_LEVELS]);
  assert.deepEqual(ids(RULES.goals), [...GOALS]);
  assert.deepEqual(ids(RULES.mealSlots.default), [...SLOT_IDS]);
  for (const slot of RULES.mealSlots.default) {
    assert.equal(slot.label, DEFAULT_SLOT_LABELS[slot.id], `label of ${slot.id}`);
  }
  assert.deepEqual(ids(RULES.vocab.styles), [...STYLES]);
  for (const key of NUTRIENT_KEYS.filter((k) => k !== 'kcal')) {
    assert.equal(typeof RULES.energy.factors[key], 'number', `energy factor for ${key}`);
  }
});

test('RULES.mealSlots.default hours cover the day without overlap', () => {
  const minutes = new Array(1440).fill(0);
  for (const { hours } of RULES.mealSlots.default) {
    if (hours == null) continue;
    const [start, end] = hours;
    assert.ok(start >= 0 && start < 1440 && end > 0 && end <= 1440, `hours ${hours} in range`);
    const length = (end - start + 1440) % 1440 || 1440; // wraps past midnight when start > end
    for (let i = 0; i < length; i += 1) minutes[(start + i) % 1440] += 1;
  }
  assert.ok(
    minutes.every((n) => n <= 1),
    'no minute belongs to two slots',
  );
});

const indexUrl = new URL('../../app/data/index.js', import.meta.url);
test(
  'app/data/index.js exports RULES and FOODS',
  { skip: existsSync(indexUrl) ? false : 'app/data/index.js not written yet (Ayesha)' },
  async () => {
    const mod = await import(indexUrl.href);
    assert.equal(mod.RULES, RULES);
    assert.ok(Array.isArray(mod.FOODS), 'FOODS is an array');
  },
);
