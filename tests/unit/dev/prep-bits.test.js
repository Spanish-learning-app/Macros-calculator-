// Author's tests for the pure helpers in app/ui/components/prep-bits.js (owner: Lena).
// The effort fixture stands in for the Lab's assemble/ready preps until Yusuf and Javier ship them.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  effortOf,
  effortText,
  matchesEffort,
  dayText,
  useByText,
  plural,
  boxWord,
} from '../../../app/ui/components/prep-bits.js';

const LIBRARY_FIXTURE = Object.freeze([
  { foodId: 'tikka-box-fx', boxes: 4, storage: ['cooked-meat'], ingredients: [] },
  { foodId: 'keema-box-fx', boxes: 4, storage: [], ingredients: [], effort: 'cook', minutes: 45 },
  {
    foodId: 'salad-box-fx',
    boxes: 3,
    storage: [],
    ingredients: [],
    effort: 'assemble',
    minutes: 10,
  },
  { foodId: 'parfait-jar-fx', boxes: 4, storage: [], ingredients: [], effort: 'assemble' },
  { foodId: 'skyr-pot-fx', boxes: 1, storage: [], ingredients: [], effort: 'ready' },
]);

test('effortOf: absent or unknown effort means cook', () => {
  assert.deepEqual(LIBRARY_FIXTURE.map(effortOf), [
    'cook',
    'cook',
    'assemble',
    'assemble',
    'ready',
  ]);
  assert.equal(effortOf(null), 'cook');
  assert.equal(effortOf({ effort: 'microwave' }), 'cook');
});

test('matchesEffort: All · Cook · No-cook (assemble and ready)', () => {
  const ids = (f) => LIBRARY_FIXTURE.filter((r) => matchesEffort(r, f)).map((r) => r.foodId);
  assert.equal(ids('all').length, 5);
  assert.deepEqual(ids('cook'), ['tikka-box-fx', 'keema-box-fx']);
  assert.deepEqual(ids('no-cook'), ['salad-box-fx', 'parfait-jar-fx', 'skyr-pot-fx']);
});

test('effortText: the time on each card in plain words', () => {
  assert.deepEqual(LIBRARY_FIXTURE.map(effortText), [
    null,
    '45 min',
    '10 min, no cooking',
    'No cooking',
    'Ready to eat',
  ]);
});

test('dayText and useByText: Day view dates, lowercase relative words, calm wording', () => {
  const today = '2026-11-02';
  assert.equal(dayText('2026-11-02', today), 'today');
  assert.equal(dayText('2026-11-03', today), 'tomorrow');
  assert.equal(dayText('2026-11-01', today), 'yesterday');
  assert.match(dayText('2026-11-05', today), /Thu.*5 Nov/);
  assert.equal(useByText({ storage: 'freezer' }, null, null, today), 'Frozen, no use-by yet');
  assert.equal(
    useByText({ storage: 'fridge' }, '2026-11-02', 'last-day', today),
    'Last day (today)',
  );
  assert.equal(
    useByText({ storage: 'fridge' }, '2026-11-01', 'past', today),
    'Past use-by, best not to eat',
  );
  assert.equal(useByText({ storage: 'fridge' }, '2026-11-03', 'ok', today), 'Use by tomorrow');
});

test('plural and boxWord: box, jar or portion from the default serving', () => {
  assert.equal(plural(1, 'box'), '1 box');
  assert.equal(plural(4, 'box'), '4 boxes');
  assert.equal(plural(2, 'jar'), '2 jars');
  const jar = { servings: [{ id: 'jar', default: true }] };
  assert.equal(boxWord(jar, null), 'jar');
  assert.equal(boxWord({ servings: [{ id: 'g', default: true }] }, null), 'box');
});
