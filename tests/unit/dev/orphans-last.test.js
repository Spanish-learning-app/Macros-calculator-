// Author's tests for the last orphan-check items (Priya): halalSwapNote, lightCooking,
// evening-job minutes, "Keeping boxes safe" (from RULES.mealPrep), and the picos "30 g · 30 g" slip.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  boxSafetyLines,
  jobMinutesText,
  lightCookingLine,
  halalSwapNoteOf,
} from '../../../app/ui/components/prep-bits.js';
import { entryLine } from '../../../app/ui/components/entry-row.js';
import RULES from '../../../app/data/rules.js';
import { FOODS } from '../../../app/data/index.js';
import RECIPES from '../../../app/data/recipes-mealprep.js';

test('boxSafetyLines reads every number from RULES.mealPrep', () => {
  const lines = boxSafetyLines(RULES);
  assert.equal(lines.length, 5);
  const mp = RULES.mealPrep;
  const text = lines.join(' ');
  assert.match(text, new RegExp(`${mp.fridgeMaxC} °C or colder`));
  assert.match(text, new RegExp(`${mp.reheat.minCoreTempC} °C`));
  assert.match(text, new RegExp(`${mp.unchilledMaxHours} hours`));
  // changing a rule changes the text
  const changed = boxSafetyLines({
    mealPrep: { ...mp, fridgeMaxC: 4, chillWithinMinutes: 90, reheat: { maxTimes: 2 } },
  }).join(' ');
  assert.match(changed, /4 °C or colder/);
  assert.match(changed, /within 90 minutes/);
  assert.match(changed, /up to 2 times/);
  assert.deepEqual(boxSafetyLines(null), []);
});

test('jobMinutesText says the time once', () => {
  assert.equal(jobMinutesText({ minutes: 13, text: 'Make the wrap.' }), '(≈ 13 min)');
  assert.equal(jobMinutesText({ minutes: 13, text: 'Make the wrap: 13 min hands-on.' }), null);
  assert.equal(jobMinutesText({ minutes: 10, text: 'boil for about 10 minutes' }), null);
  assert.equal(jobMinutesText({ text: 'x' }), null);
});

test('lightCookingLine and halalSwapNoteOf', () => {
  assert.equal(
    lightCookingLine({ lightCooking: 'the eggs are boiled' }),
    'Cooking: the eggs are boiled.',
  );
  assert.equal(lightCookingLine({}), null);
  assert.equal(halalSwapNoteOf({}, { halalSwapNote: ' why ' }), 'why');
  assert.equal(halalSwapNoteOf({}, {}), null);
  const feta = RECIPES.find((r) => r.halalSwap);
  assert.ok(feta && halalSwapNoteOf({}, feta), 'the feta recipe has a note to show');
});

test('an entry whose serving label already says its grams does not repeat them', () => {
  const picos = FOODS.find((f) => f.id === 'es-picos-integrales');
  const one = {
    id: 'e1',
    slot: 'lunch',
    servingId: '30g',
    qty: 1,
    foodId: picos.id,
    status: 'eaten',
    snapshot: { name: 'Picos', grams: 30, kcal: 114 },
  };
  assert.doesNotMatch(entryLine(one, picos), /30 g · 30 g/);
  assert.match(entryLine(one, picos), /^30 g · /);
  assert.match(entryLine({ ...one, qty: 2 }, picos), /^2 × 30 g · 60 g · /);
});
