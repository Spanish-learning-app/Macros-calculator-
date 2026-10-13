// Author tests for app/core/units.js (ARCHITECTURE §5.1). Owner: Hamza.
import test from 'node:test';
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

const close = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} is not within ${eps} of ${expected}`);

test('MASS_UNITS is frozen and exact', () => {
  assert.ok(Object.isFrozen(MASS_UNITS));
  assert.deepEqual({ ...MASS_UNITS }, { g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 });
});

test('toGrams converts every mass unit', () => {
  assert.equal(toGrams(250, 'g'), 250);
  assert.equal(toGrams(1.5, 'kg'), 1500);
  assert.equal(toGrams(1, 'oz'), 28.349523125);
  assert.equal(toGrams(1, 'lb'), 453.59237);
  assert.equal(toGrams(0, 'kg'), 0);
});

test('toGrams throws RangeError on unknown units and bad amounts', () => {
  for (const unit of ['ml', 'cup', 'G', '', 'toString', '__proto__', undefined]) {
    assert.throws(() => toGrams(1, unit), RangeError, `unit ${unit}`);
  }
  for (const amount of [-1, -0.001, NaN, Infinity, -Infinity]) {
    assert.throws(() => toGrams(amount, 'g'), RangeError, `amount ${amount}`);
  }
  assert.throws(() => toGrams('5', 'g'), RangeError);
  assert.throws(() => toGrams(null, 'g'), RangeError);
});

test('kgFromLb and lbFromKg are unrounded inverses', () => {
  assert.equal(kgFromLb(1), 0.45359237);
  assert.equal(kgFromLb(0), 0);
  close(kgFromLb(176), 79.83225712);
  close(lbFromKg(1), 2.2046226218487757);
  close(lbFromKg(80), 176.369809747902, 1e-9);
  for (const x of [0.5, 1, 62, 80.3, 150]) close(lbFromKg(kgFromLb(x)), x);
  assert.throws(() => kgFromLb(NaN), RangeError);
  assert.throws(() => lbFromKg(-1), RangeError);
});

test('cmFromFtIn: unrounded centimetres, inches default 0', () => {
  assert.equal(cmFromFtIn(6), 182.88);
  assert.equal(cmFromFtIn(6, 0), 182.88);
  assert.equal(cmFromFtIn(5, 9), 175.26);
  assert.equal(cmFromFtIn(0, 1), 2.54);
  close(cmFromFtIn(5, 7.5), 171.45);
  assert.throws(() => cmFromFtIn(-1), RangeError);
  assert.throws(() => cmFromFtIn(5, Infinity), RangeError);
});

test('ftInFromCm: whole inches, carried into feet', () => {
  assert.deepEqual(ftInFromCm(182.88), { ft: 6, inches: 0 });
  assert.deepEqual(ftInFromCm(175), { ft: 5, inches: 9 }); // 68.9 in
  assert.deepEqual(ftInFromCm(160), { ft: 5, inches: 3 }); // 62.99 in
  assert.deepEqual(ftInFromCm(182.5), { ft: 6, inches: 0 }); // 71.85 in rounds up and carries
  assert.deepEqual(ftInFromCm(181.6), { ft: 5, inches: 11 }); // 71.496 in
  assert.deepEqual(ftInFromCm(184.15), { ft: 6, inches: 1 }); // exactly 72.5 in: half up
  assert.deepEqual(ftInFromCm(0), { ft: 0, inches: 0 });
  for (const cm of [120, 150.3, 165, 199.9, 230]) {
    const { ft, inches } = ftInFromCm(cm);
    assert.ok(Number.isInteger(ft) && Number.isInteger(inches) && inches >= 0 && inches < 12);
    assert.ok(Math.abs(cmFromFtIn(ft, inches) - cm) <= 1.27 + 1e-9, `${cm} round trip`);
  }
  assert.throws(() => ftInFromCm(-5), RangeError);
  assert.throws(() => ftInFromCm(NaN), RangeError);
});

test('round: Math.round semantics, halves go up', () => {
  assert.equal(round(2.5), 3);
  assert.equal(round(-2.5), -2);
  assert.equal(round(3.5), 4);
  assert.equal(round(-3.5), -3);
  assert.equal(round(2.4999), 2);
  assert.equal(round(232.5), 233);
  assert.equal(round(485.5), 486);
});

test('round: exact for decimal halves', () => {
  assert.equal(round(1.005, 2), 1.01);
  assert.equal(round(1.255, 2), 1.26);
  assert.equal(round(2.675, 2), 2.68);
  assert.equal(round(8.345, 2), 8.35);
  assert.equal(round(1.45, 1), 1.5);
  assert.equal(round(-1.005, 2), -1);
  assert.equal(round(0.1 + 0.2, 2), 0.3);
  assert.equal(round(1.004, 2), 1);
  assert.equal(round(123.456, 1), 123.5);
});

test('round: negative decimals round to tens and hundreds', () => {
  assert.equal(round(2155, -1), 2160);
  assert.equal(round(2154.99, -1), 2150);
  assert.equal(round(2150, -2), 2200);
  assert.equal(round(-2155, -1), -2150);
  assert.equal(round(4, -1), 0);
});

test('round: never returns -0, handles tiny and huge numbers', () => {
  assert.ok(Object.is(round(-0.4), 0));
  assert.ok(Object.is(round(-0.004, 2), 0));
  assert.ok(Object.is(round(-0), 0));
  assert.equal(round(1.5e-7, 7), 2e-7);
  assert.equal(round(1e21), 1e21);
  assert.equal(round(1.5, 400), 1.5);
  assert.equal(round(1.5, -400), 0);
});

test('round: bad input', () => {
  assert.throws(() => round(NaN), RangeError);
  assert.throws(() => round(Infinity), RangeError);
  assert.throws(() => round(1, 1.5), RangeError);
  assert.throws(() => round(1, NaN), RangeError);
  assert.throws(() => round('1.5'), RangeError);
});

test('formatQty: household fractions', () => {
  assert.equal(formatQty(0.25), '¼');
  assert.equal(formatQty(0.5), '½');
  assert.equal(formatQty(0.75), '¾');
  assert.equal(formatQty(1.5), '1½');
  assert.equal(formatQty(1.25), '1¼');
  assert.equal(formatQty(2.75), '2¾');
  assert.equal(formatQty(2), '2');
  assert.equal(formatQty(1), '1');
});

test('formatQty: other values up to 2 decimals, trailing zeros trimmed', () => {
  assert.equal(formatQty(0.33), '0.33');
  assert.equal(formatQty(1 / 3), '0.33');
  assert.equal(formatQty(0.1), '0.1');
  assert.equal(formatQty(1.2), '1.2');
  assert.equal(formatQty(2.666), '2.67');
  assert.equal(formatQty(150), '150');
  assert.equal(formatQty(0.501), '½'); // shown at 2 decimals, so it reads as a half
});

test('formatQty: RangeError unless qty is finite and > 0', () => {
  for (const q of [0, -1, -0.5, NaN, Infinity]) {
    assert.throws(() => formatQty(q), RangeError, `qty ${q}`);
  }
  assert.throws(() => formatQty('1'), RangeError);
});
