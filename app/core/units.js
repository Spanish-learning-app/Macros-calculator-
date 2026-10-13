// Unit conversion and number formatting. Pure.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.1.

/** Grams per mass unit. Volume is never converted here (ml -> g is the Lab's job, per food). */
export const MASS_UNITS = Object.freeze({ g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 });

/** Centimetres per inch, as 254 / 100 so integer inputs stay exact. */
const CM_PER_INCH_X100 = 254;
const INCHES_PER_FOOT = 12;

/** Household fractions shown as glyphs by formatQty. */
const FRACTION_GLYPHS = new Map([
  [0.25, '¼'],
  [0.5, '½'],
  [0.75, '¾'],
]);

/** A bad number (including a non-number such as '5' or null) is a RangeError (§5). */
function checkNumber(value, name, { min = -Infinity } = {}) {
  if (!Number.isFinite(value))
    throw new RangeError(`${name} must be a finite number, got ${value}`);
  if (value < min) throw new RangeError(`${name} must be >= ${min}, got ${value}`);
  return value;
}

/** Multiply by 10^exp in decimal notation, so 1.005 shifted by 2 is exactly 100.5. */
function shiftDecimal(value, exp) {
  const [mantissa, e = '0'] = String(value).split('e');
  return Number(`${mantissa}e${Number(e) + exp}`);
}

/**
 * @param {number} amount finite, >= 0
 * @param {'g'|'kg'|'oz'|'lb'} unit
 * @returns {number} grams. RangeError on an unknown unit or a negative/non-finite amount.
 */
export function toGrams(amount, unit) {
  if (typeof unit !== 'string' || !Object.hasOwn(MASS_UNITS, unit)) {
    throw new RangeError(`unknown mass unit: ${String(unit)}`);
  }
  checkNumber(amount, 'amount', { min: 0 });
  return amount * MASS_UNITS[unit];
}

/** @param {number} lb @returns {number} kg (unrounded) */
export function kgFromLb(lb) {
  checkNumber(lb, 'lb', { min: 0 });
  return (lb * MASS_UNITS.lb) / MASS_UNITS.kg;
}

/** @param {number} kg @returns {number} lb (unrounded) */
export function lbFromKg(kg) {
  checkNumber(kg, 'kg', { min: 0 });
  return (kg * MASS_UNITS.kg) / MASS_UNITS.lb;
}

/** @param {number} ft @param {number} [inches=0] @returns {number} cm (unrounded) */
export function cmFromFtIn(ft, inches = 0) {
  checkNumber(ft, 'ft', { min: 0 });
  checkNumber(inches, 'inches', { min: 0 });
  return ((ft * INCHES_PER_FOOT + inches) * CM_PER_INCH_X100) / 100;
}

/**
 * @param {number} cm
 * @returns {{ ft: number, inches: number }} whole feet and whole inches (nearest inch, carried:
 *   182.88 cm -> { ft: 6, inches: 0 }, never { ft: 5, inches: 12 }).
 */
export function ftInFromCm(cm) {
  checkNumber(cm, 'cm', { min: 0 });
  const totalInches = round((cm * 100) / CM_PER_INCH_X100);
  return { ft: Math.floor(totalInches / INCHES_PER_FOOT), inches: totalInches % INCHES_PER_FOOT };
}

/**
 * Math.round semantics (halves go up: 2.5 -> 3, -2.5 -> -2), exact for decimal halves
 * (1.005, 2 -> 1.01). `decimals` may be negative: round(2155, -1) -> 2160.
 * @param {number} value @param {number} [decimals=0] @returns {number}
 */
export function round(value, decimals = 0) {
  checkNumber(value, 'value');
  if (!Number.isInteger(decimals)) throw new RangeError(`decimals must be an integer: ${decimals}`);
  const shifted = shiftDecimal(value, decimals);
  if (!Number.isFinite(shifted)) return value; // finer than a double can hold: nothing to round
  return shiftDecimal(Math.round(shifted), -decimals) + 0; // + 0 turns -0 into 0
}

/**
 * Household quantity for display: 0.25 -> '¼', 0.5 -> '½', 0.75 -> '¾', 1.5 -> '1½', 2 -> '2',
 * 0.33 -> '0.33', 1.25 -> '1¼'. Other values: up to 2 decimals, trailing zeros trimmed.
 * @param {number} qty > 0 @returns {string}
 */
export function formatQty(qty) {
  checkNumber(qty, 'qty');
  if (qty <= 0) throw new RangeError(`qty must be > 0, got ${qty}`);
  const shown = round(qty, 2);
  const whole = Math.floor(shown);
  const glyph = FRACTION_GLYPHS.get(round(shown - whole, 2));
  if (glyph) return whole === 0 ? glyph : `${whole}${glyph}`;
  return String(shown);
}
