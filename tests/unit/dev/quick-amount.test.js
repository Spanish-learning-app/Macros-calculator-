// Author's tests (Lena): quick amounts in the recipe ingredient search (A16 budget) and the
// "Thora sa" chip rule (BUG-TC1, RULES.portionChips.taste.hideWhen).
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickAmount, quickPortion } from '../../../app/ui/components/ingredient-sheet.js';
import { tasteChipHidden } from '../../../app/ui/components/portion-picker.js';
import { RULES } from '../../../app/data/index.js';

const food = (group, servings) => ({ id: 'x', name: 'x', group, servings });
const oil = food('fat-oil', [
  { id: 'tsp', label: '1 teaspoon', grams: 4.5, default: true },
  { id: 'tbsp', label: '1 tablespoon', grams: 13.5 },
]);
const cucumber = food('vegetable', [
  { id: 'medium', label: '1 medium cucumber', grams: 125, default: true },
]);

test('parseQuickAmount: grams, kg, spoons, plain counts, and plain searches', () => {
  assert.deepEqual(parseQuickAmount('800 g chicken thigh'), {
    amount: { unit: 'g', qty: 800 },
    query: 'chicken thigh',
  });
  assert.deepEqual(parseQuickAmount('800g chicken'), {
    amount: { unit: 'g', qty: 800 },
    query: 'chicken',
  });
  assert.deepEqual(parseQuickAmount('1,5 kg rice').amount, { unit: 'g', qty: 1500 });
  assert.deepEqual(parseQuickAmount('2 tbsp oil'), {
    amount: { unit: 'tbsp', qty: 2 },
    query: 'oil',
  });
  assert.deepEqual(parseQuickAmount('2 tablespoons oil').amount, { unit: 'tbsp', qty: 2 });
  assert.deepEqual(parseQuickAmount('2 cucumbers'), {
    amount: { unit: null, qty: 2 },
    query: 'cucumbers',
  });
  assert.deepEqual(parseQuickAmount('  chicken '), { amount: null, query: 'chicken' });
  assert.deepEqual(parseQuickAmount('7up'), { amount: null, query: '7up' });
  assert.equal(parseQuickAmount('0 g rice').amount, null);
});

test('quickPortion: grams, a serving the food has, a count of the default, else the default', () => {
  assert.deepEqual(quickPortion(oil, { unit: 'tbsp', qty: 2 }), { servingId: 'tbsp', qty: 2 });
  assert.deepEqual(quickPortion(oil, { unit: 'g', qty: 27 }), { servingId: 'g', qty: 27 });
  assert.deepEqual(quickPortion(cucumber, { unit: null, qty: 2 }), {
    servingId: 'medium',
    qty: 2,
  });
  assert.deepEqual(quickPortion(cucumber, { unit: 'tbsp', qty: 2 }), {
    servingId: 'medium',
    qty: 1,
  });
  assert.deepEqual(quickPortion(cucumber, null), { servingId: 'medium', qty: 1 });
});

test('tasteChipHidden follows RULES.portionChips.taste.hideWhen', () => {
  assert.equal(tasteChipHidden(oil, RULES), true); // group and tsp default
  assert.equal(tasteChipHidden(cucumber, RULES), false);
  const date = food('fruit', [{ id: 'piece', label: '1 date', grams: 8, default: true }]);
  assert.equal(tasteChipHidden(date, RULES), true); // ¼ is 2 g
  const tbspDefault = food('side-dip', [{ id: 'tbsp', label: '1 tbsp', grams: 30, default: true }]);
  assert.equal(tasteChipHidden(tbspDefault, RULES), true);
  assert.equal(tasteChipHidden(cucumber, null), false);
});
