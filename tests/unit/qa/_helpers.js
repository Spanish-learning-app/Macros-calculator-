// QA test helpers. Owner: Kenji. Not a test file (no `.test.js`), so `npm test` does not run it.
//
// `qa(name, fns, body)` is how every QA unit test is declared. Until Hamza implements a function,
// its Step 0 stub throws Error('not implemented: …'). A test that exercises a stub is marked TODO:
// node:test still runs it and prints the failure, but the run stays green. When the function is
// implemented the same test becomes a real test, with no edit here. Two layers:
//   1. a probe: each function in `fns` is called once with placeholder arguments; a
//      'not implemented' error marks the test TODO up front ("stub: toGrams");
//   2. a guard: a 'not implemented' error thrown while the body runs (for example from a stub
//      that an implemented function calls) turns the test TODO instead of failing it.
// Any other error is a real failure.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../../fixtures/index.js';

export { RULES, FOODS };

const NOT_IMPLEMENTED = /^not implemented\b/i;

/** @param {unknown} error @returns {boolean} */
export function isNotImplemented(error) {
  return error instanceof Error && NOT_IMPLEMENTED.test(error.message);
}

const PROBE_ARGS = [{}, {}, {}, {}, {}, {}];

/** True while `fn` is a Step 0 stub. Core functions are pure, so a probe call is harmless. */
export function isStub(fn) {
  for (const args of [[], PROBE_ARGS]) {
    try {
      fn(...args);
    } catch (error) {
      if (isNotImplemented(error)) return true;
    }
  }
  return false;
}

/**
 * Declares a QA test.
 * @param {string} name
 * @param {Function[]} fns the functions under test (probed for stubs)
 * @param {(t: import('node:test').TestContext) => unknown} body
 * @param {object} [options] extra node:test options
 */
export function qa(name, fns, body, options = {}) {
  const stubs = fns.filter(isStub).map((fn) => fn.name);
  const todo = stubs.length ? `stub: ${stubs.join(', ')}` : options.todo;
  return test(name, { ...options, todo }, async (t) => {
    try {
      await body(t);
    } catch (error) {
      if (isNotImplemented(error)) {
        t.todo(`depends on a stub: ${error.message}`);
        return;
      }
      throw error;
    }
  });
}

/**
 * A test for a bug already reported to its owner in finished code. It stays TODO (shown, but not
 * failing `npm run check`) until the owner fixes it; then it passes and the marker is removed.
 * @param {string} id e.g. 'BUG-R1' @param {string} owner e.g. 'Lena'
 */
export function knownBug(id, owner, name, fns, body) {
  return qa(`${id} (${owner}): ${name}`, fns, body, { todo: `${id} reported to ${owner}` });
}

/** Recursively freezes plain objects and arrays (inputs to pure functions must not change). */
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

/** A deep-frozen deep copy. */
export const frozen = (value) => deepFreeze(structuredClone(value));

/**
 * Asserts that `fn` throws one of `classes`. A 'not implemented' error is re-thrown so that the
 * `qa` guard can mark the test TODO instead of reporting a wrong error class.
 */
export function assertThrowsKind(fn, classes, message = '') {
  const list = Array.isArray(classes) ? classes : [classes];
  try {
    fn();
  } catch (error) {
    if (isNotImplemented(error)) throw error;
    assert.ok(
      list.some((C) => error instanceof C),
      `${message} expected ${list.map((C) => C.name).join(' or ')}, got ${error?.constructor?.name}: ${error?.message}`,
    );
    return error;
  }
  assert.fail(`${message} expected ${list.map((C) => C.name).join(' or ')}, nothing was thrown`);
}

/** Bad input: RangeError (bad numbers or enums) or TypeError (wrong shapes), ARCHITECTURE §5. */
export const assertBadInput = (fn, message) =>
  assertThrowsKind(fn, [RangeError, TypeError], message);

/** |actual − expected| ≤ eps. */
export function assertClose(actual, expected, eps = 1e-9, message = '') {
  assert.equal(typeof actual, 'number', `${message} expected a number, got ${typeof actual}`);
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${message} expected ${expected} ± ${eps}, got ${actual}`,
  );
}

export const NUTRIENT_KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fiber'];

/** Exactly the five nutrient keys, each within eps of `expected`. */
export function assertNutrients(actual, expected, eps = 1e-9, message = '') {
  assert.deepEqual(Object.keys(actual).sort(), [...NUTRIENT_KEYS].sort(), `${message} keys`);
  for (const k of NUTRIENT_KEYS) assertClose(actual[k], expected[k], eps, `${message} ${k}`);
}

export const ZERO = Object.freeze({ kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

/** Fixture food by id (a deep-frozen copy). */
export function fx(id) {
  const food = FOODS.find((f) => f.id === id);
  if (!food) throw new Error(`no fixture ${id}`);
  return frozen(food);
}

/** A Map id → food built without the code under test, so day tests do not depend on foods.js. */
export function indexOf(foods = FOODS) {
  return new Map(foods.map((f) => [f.id, frozen(f)]));
}

/** Per100g × grams / 100 for the five keys: the oracle for portion maths. */
export function expectedFor(food, grams) {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, (food.per100g[k] * grams) / 100]));
}

/** Sequential ids: 'id-1', 'id-2', … */
export function idMaker(prefix = 'id') {
  let n = 0;
  const make = () => `${prefix}-${++n}`;
  make.count = () => n;
  return make;
}

/** The time zone this run uses (`npm test` runs Madrid, Karachi and Los Angeles). */
export const TZ = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Seeded PRNG (mulberry32) for property-style checks; deterministic across runs. */
export function rng(seed = 42) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle with a seeded PRNG (returns a new array). */
export function shuffled(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
