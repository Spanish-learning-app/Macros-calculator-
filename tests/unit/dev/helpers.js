// Shared helpers for the author tests in tests/unit/dev. Owner: Hamza.
import assert from 'node:assert/strict';
import { FOODS } from '../../fixtures/index.js';

/** Deep-freezes plain objects and arrays in place and returns the value. */
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

/** A fresh deep copy of a fixture food by id (so tests can freeze or edit it freely). */
export function fixture(id) {
  const food = FOODS.find((f) => f.id === id);
  if (!food) throw new Error(`no fixture ${id}`);
  return structuredClone(food);
}

/** A deep-frozen copy of every fixture. */
export function frozenFoods() {
  return deepFreeze(structuredClone(FOODS));
}

export function close(actual, expected, eps = 1e-9, msg = '') {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${msg} ${actual} is not within ${eps} of ${expected}`.trim(),
  );
}

export function closeNutrients(actual, expected, eps = 1e-9) {
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort());
  for (const k of Object.keys(expected)) close(actual[k], expected[k], eps, k);
}
