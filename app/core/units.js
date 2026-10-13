// Unit conversion and number formatting. Pure.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.1. Step 0 stub: signatures are final.

const todo = (name) => {
  throw new Error(`not implemented: units.${name}`);
};

/** Grams per mass unit. Volume is never converted here (ml -> g is the Lab's job, per food). */
export const MASS_UNITS = Object.freeze({ g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 });

/**
 * @param {number} amount finite, >= 0
 * @param {'g'|'kg'|'oz'|'lb'} unit
 * @returns {number} grams. RangeError on an unknown unit or a negative/non-finite amount.
 */
export function toGrams(amount, unit) {
  return todo('toGrams');
}

/** @param {number} lb @returns {number} kg (unrounded) */
export function kgFromLb(lb) {
  return todo('kgFromLb');
}

/** @param {number} kg @returns {number} lb (unrounded) */
export function lbFromKg(kg) {
  return todo('lbFromKg');
}

/** @param {number} ft @param {number} [inches=0] @returns {number} cm (unrounded) */
export function cmFromFtIn(ft, inches = 0) {
  return todo('cmFromFtIn');
}

/**
 * @param {number} cm
 * @returns {{ ft: number, inches: number }} whole feet and whole inches (nearest inch, carried:
 *   182.88 cm -> { ft: 6, inches: 0 }, never { ft: 5, inches: 12 }).
 */
export function ftInFromCm(cm) {
  return todo('ftInFromCm');
}

/**
 * Math.round semantics (halves go up: 2.5 -> 3, -2.5 -> -2), exact for decimal halves
 * (1.005, 2 -> 1.01). `decimals` may be negative: round(2155, -1) -> 2160.
 * @param {number} value @param {number} [decimals=0] @returns {number}
 */
export function round(value, decimals = 0) {
  return todo('round');
}

/**
 * Household quantity for display: 0.25 -> '¼', 0.5 -> '½', 0.75 -> '¾', 1.5 -> '1½', 2 -> '2',
 * 0.33 -> '0.33', 1.25 -> '1¼'. Other values: up to 2 decimals, trailing zeros trimmed.
 * @param {number} qty > 0 @returns {string}
 */
export function formatQty(qty) {
  return todo('formatQty');
}
