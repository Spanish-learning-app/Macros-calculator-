// QA tests for app/core/units.js, written from docs/ARCHITECTURE.md §5.1 (not from the code).
// Owner: Kenji.
import assert from 'node:assert/strict';
import {
  MASS_UNITS,
  toGrams,
  kgFromLb,
  lbFromKg,
  cmFromFtIn,
  ftInFromCm,
  round,
  formatQty,
} from '../../../app/core/units.js';
import { qa, assertClose, assertThrowsKind } from './_helpers.js';

qa('MASS_UNITS is the frozen table of §5.1', [], () => {
  assert.deepEqual({ ...MASS_UNITS }, { g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 });
  assert.ok(Object.isFrozen(MASS_UNITS));
});

qa('toGrams converts every mass unit', [toGrams], () => {
  assert.equal(toGrams(250, 'g'), 250);
  assert.equal(toGrams(2, 'kg'), 2000);
  assert.equal(toGrams(1, 'lb'), 453.59237);
  assert.equal(toGrams(1, 'oz'), 28.349523125);
  assertClose(toGrams(0.5, 'kg'), 500);
  assertClose(toGrams(16, 'oz'), 453.59237, 1e-9, '16 oz = 1 lb');
  assert.equal(toGrams(0, 'kg'), 0, 'zero is allowed');
});

qa('toGrams refuses volume, unknown units and bad amounts with RangeError', [toGrams], () => {
  for (const unit of ['ml', 'cup', 'katori', 'G', '', 'stone']) {
    assertThrowsKind(() => toGrams(1, unit), RangeError, `unit ${unit}`);
  }
  for (const amount of [-1, -0.001, NaN, Infinity, -Infinity]) {
    assertThrowsKind(() => toGrams(amount, 'g'), RangeError, `amount ${amount}`);
  }
});

qa('kgFromLb and lbFromKg are unrounded inverses', [kgFromLb, lbFromKg], () => {
  assert.equal(kgFromLb(1), 0.45359237);
  assertClose(kgFromLb(180), 81.6466266);
  assertClose(lbFromKg(1), 1 / 0.45359237);
  assertClose(lbFromKg(82), 180.779055, 1e-6);
  for (const kg of [30, 55.5, 82, 140.25, 250]) assertClose(kgFromLb(lbFromKg(kg)), kg, 1e-9);
  assert.notEqual(lbFromKg(82), Math.round(lbFromKg(82)), 'not rounded');
});

qa('cmFromFtIn gives unrounded centimetres; inches default to 0', [cmFromFtIn], () => {
  assertClose(cmFromFtIn(6), 182.88);
  assertClose(cmFromFtIn(6, 0), 182.88);
  assertClose(cmFromFtIn(5, 10), 177.8);
  assertClose(cmFromFtIn(5, 10.5), 179.07);
  assertClose(cmFromFtIn(4, 11), 149.86);
  assert.equal(cmFromFtIn.length, 1, 'inches is optional');
});

qa('ftInFromCm gives whole feet and inches, carried', [ftInFromCm], () => {
  assert.deepEqual(ftInFromCm(182.88), { ft: 6, inches: 0 });
  assert.deepEqual(ftInFromCm(177.8), { ft: 5, inches: 10 });
  assert.deepEqual(ftInFromCm(178), { ft: 5, inches: 10 }, '70.08 in → 70');
  assert.deepEqual(ftInFromCm(160), { ft: 5, inches: 3 }, '62.99 in → 63');
  assert.deepEqual(ftInFromCm(152.4), { ft: 5, inches: 0 });
  // 71.6 in rounds to 72 = 6 ft 0 in, never 5 ft 12 in.
  assert.deepEqual(ftInFromCm(181.9), { ft: 6, inches: 0 }, 'carried, not 5 ft 12 in');
  for (let cm = 120; cm <= 230; cm += 0.5) {
    const { ft, inches } = ftInFromCm(cm);
    assert.ok(Number.isInteger(ft) && Number.isInteger(inches), `${cm}: whole numbers`);
    assert.ok(inches >= 0 && inches < 12, `${cm}: inches ${inches} in 0..11`);
    assert.equal(ft * 12 + inches, Math.round(cm / 2.54), `${cm}: nearest inch`);
  }
});

qa('round: Math.round semantics, exact for decimal halves', [round], () => {
  assert.equal(round(2.5), 3);
  assert.equal(round(0.5), 1);
  assert.equal(round(232.5), 233, 'NUTRITION vector C tie');
  assert.equal(round(485.5), 486, 'NUTRITION vector D tie');
  assert.equal(round(-2.5), -2, 'halves go up (towards +∞)');
  assert.equal(round(2.4999), 2);
  assert.equal(round(1.005, 2), 1.01, 'binary 1.00499… still rounds up');
  assert.equal(round(1.255, 2), 1.26);
  assert.equal(round(8.345, 2), 8.35);
  assert.equal(round(1.45, 1), 1.5);
  assert.equal(round(123.456, 1), 123.5);
  assert.equal(round(0.1 + 0.2, 1), 0.3);
  assert.equal(round(7, 2), 7);
  assert.equal(round(2155, -1), 2160);
  assert.equal(round(2154.9, -1), 2150);
  assert.equal(round(1250, -2), 1300);
  assert.equal(round.length, 1, 'decimals defaults to 0');
});

qa('formatQty: household fractions', [formatQty], () => {
  const cases = [
    [0.5, '½'],
    [1.5, '1½'],
    [0.25, '¼'],
    [0.75, '¾'],
    [2, '2'],
    [1, '1'],
    [0.33, '0.33'],
    [1.25, '1¼'],
    [2.5, '2½'],
    [3.75, '3¾'],
  ];
  for (const [qty, text] of cases) assert.equal(formatQty(qty), text, `formatQty(${qty})`);
});

qa('formatQty: other values have at most 2 decimals, trailing zeros trimmed', [formatQty], () => {
  assert.equal(formatQty(1.2), '1.2');
  assert.equal(formatQty(0.1), '0.1');
  assert.equal(formatQty(2.333333), '2.33');
  assert.equal(formatQty(1.1), '1.1');
  assert.equal(formatQty(150), '150');
});
