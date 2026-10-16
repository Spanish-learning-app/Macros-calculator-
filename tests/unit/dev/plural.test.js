// Author's tests for the serving-label plurals (STATUS O16, "2 biscuit"). Owner: Priya.
// portionText says listed count words in the plural for a count over 1; everything else stays as
// the Lab wrote it. Real-data sweep: no serving label turns into a broken English plural.
import test from 'node:test';
import assert from 'node:assert/strict';
import { portionText, pluralUnit } from '../../../app/ui/components/format.js';
import { FOODS } from '../../../app/data/index.js';

const s = (label, id = 'x') => ({ id, label, grams: 10 });

test('portionText: counts over 1 read in the plural', () => {
  assert.equal(portionText(s('1 biscuit'), 2), '2 biscuits');
  assert.equal(portionText(s('1 biscuit'), 1), '1 biscuit');
  assert.equal(portionText(s('1 medium roti (40 g)'), 3), '3 medium rotis');
  assert.equal(portionText(s('per egg'), 3), '3 eggs');
  assert.equal(portionText(s('1 cup (240 ml)'), 1.5), '1½ cups');
  assert.equal(portionText(s('1 medium potato'), 2), '2 medium potatoes');
  assert.equal(portionText(s('1 large leaf'), 2), '2 large leaves');
});

test('portionText: commas, "of" and two count words in a row', () => {
  assert.equal(portionText(s('1 roti, medium (40 g)'), 2), '2 rotis, medium');
  assert.equal(portionText(s('1 slice of pan de payés'), 2), '2 slices of pan de payés');
  assert.equal(portionText(s('1 tin, drained'), 2), '2 tins, drained');
  assert.equal(portionText(s('1 tablespoon chopped onion'), 2), '2 tablespoons chopped onion');
  assert.equal(portionText(s('1 bocadillo roll'), 2), '2 bocadillo rolls');
});

test('portionText: unlisted words, katori, grams and "×" labels stay as they are', () => {
  assert.equal(portionText(s('1 katori (150 ml)'), 2), '2 katori');
  assert.equal(portionText(s('1 small katori (155 ml)'), 2), '2 small katori');
  assert.equal(portionText(s('1 café solo'), 2), '2 café solo');
  assert.equal(portionText(s("1 egg white's worth"), 2), "2 egg white's worth");
  assert.equal(portionText(s('1 large glass / mug'), 2), '2 large glass / mug');
  assert.equal(portionText(s('½ plate'), 2), '2 × ½ plate');
  assert.equal(portionText({ id: 'g', label: 'g', grams: 1 }, 250), '250 g');
  assert.equal(pluralUnit('biscuit', 0.5), 'biscuit');
});

test('real data: no label turns into a doubled or broken plural', () => {
  const okOes = new Set(['potatoes', 'tomatoes', 'mangoes']);
  for (const food of FOODS) {
    for (const serving of food.servings) {
      const one = portionText(serving, 1).split(' ').slice(1);
      const two = portionText(serving, 2).split(' ').slice(1);
      const where = `${food.id} ${serving.id}: ${two.join(' ')}`;
      if (one[0] === '×' || two[0] === '×') continue; // "2 × ½ plate": nothing turns plural
      assert.equal(two.length, one.length, where);
      const changed = two.filter((w, i) => w !== one[i]);
      assert.ok(changed.length <= 1, where);
      for (const word of changed) {
        assert.doesNotMatch(word, /(eses|sss|yss|ys)$/u, where);
        if (/oes$/.test(word)) assert.ok(okOes.has(word), where);
      }
    }
  }
});
