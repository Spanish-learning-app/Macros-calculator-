// Persistence of the UserData document, migration, export and import. Pure: the storage backend
// is injected ({ getItem, setItem, removeItem } such as window.localStorage, or null).
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §4.5 and §5.7.

import { isISODate } from './dates.js';
import { NUTRIENT_KEYS } from './foods.js';
import { ENTRY_SLOT_IDS } from './days.js';
import { weightLogProblems, mergeWeightLogs, weightEntries } from './weight.js';
import { ramadanModeProblems, cleanRamadanMode } from './ramadan.js';
import { nudgeSettingsProblems } from './nudges.js';
import { MY_METHOD_MAX } from './mealprep.js';

/** @typedef {import('./types.js').UserData} UserData */

export const STORAGE_KEY = 'mmc.v1';
export const SCHEMA_VERSION = 1;
export const EXPORT_KIND = 'katori-backup';

const SLOT_PRESETS = ['default', 'spain'];
/** A day records the preset it was logged with (Sprint 3, Ramadan mode); optional, additive. */
const DAY_PRESETS = ['default', 'spain', 'ramadan'];
const SEAFOOD = ['all', 'fish-prawns', 'fish-only'];
const ONBOARDING = ['pending', 'done', 'skipped'];
const WEIGHT_UNITS = ['kg', 'lb'];
const HEIGHT_UNITS = ['cm', 'ftin'];
const WEEK_STARTS = [0, 1, 6];
const THEMES = ['system', 'light', 'dark'];
const STATUSES = ['planned', 'eaten'];
/** team/DECISIONS.md: the logging day starts between 00:00 and 05:00. */
const DAY_START_MAX = 300;
const DEFAULT_DAY_START = 240;
const QUOTA_NAMES = new Set(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED']);
const QUOTA_CODES = new Set([22, 1014]);

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const show = (v) => (typeof v === 'string' ? `'${v}'` : (JSON.stringify(v) ?? String(v)));
const messageOf = (error) => String(error?.message ?? error);

function codedError(code, message, problems) {
  const error = new Error(message);
  error.code = code;
  if (problems) error.problems = problems;
  return error;
}

/**
 * A fresh document: profile null, no days, recipes [] and batches [] (reserved for Sprint 2),
 * settings.dayStartMinutes 240 (04:00; team/DECISIONS.md; validateUserData accepts 0..300),
 * settings.onboarding 'pending' ('pending'|'done'|'skipped').
 * With `rules`: settings.slotPreset = rules.mealSlotPresetDefault.byTimeZone[timeZone] ??
 * .fallback (Madrid, Ceuta, Canary -> 'spain'); settings.halalOnly =
 * rules.vocab.halalRules.halalOnlyFilterDefault; settings.seafood = rules.vocab.halalRules
 * .seafoodDefault. Without `rules`: 'default', true, 'all'.
 * @param {{ timeZone?: string|null, rules?: object|null }} [options] timeZone from
 *   Intl.DateTimeFormat().resolvedOptions().timeZone, passed in by the UI
 * @returns {UserData}
 */
export function defaultData({ timeZone = null, rules = null } = {}) {
  let slotPreset = 'default';
  let halalOnly = true;
  let seafood = 'all';
  if (isObject(rules)) {
    const presets = rules.mealSlotPresetDefault;
    const byZone = presets?.byTimeZone ?? {};
    const zoned = typeof timeZone === 'string' && Object.hasOwn(byZone, timeZone);
    slotPreset = (zoned ? byZone[timeZone] : presets?.fallback) ?? slotPreset;
    const halalRules = rules.vocab?.halalRules ?? {};
    halalOnly = halalRules.halalOnlyFilterDefault ?? halalOnly;
    seafood = halalRules.seafoodDefault ?? seafood;
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: null,
    targetPrefs: { proteinGPerKg: null, fatPct: null },
    targetOverrides: {},
    settings: {
      slotPreset,
      slotLabels: {},
      halalOnly,
      seafood,
      dayStartMinutes: DEFAULT_DAY_START,
      onboarding: 'pending',
      units: { weight: 'kg', height: 'cm' },
      weekStartsOn: 1,
      theme: 'system',
      hideCalories: false,
    },
    days: {},
    customFoods: [],
    recents: {},
    recipes: [],
    batches: [],
  };
}

function settingsProblems(s) {
  if (!isObject(s)) return ['settings must be an object'];
  const p = [];
  const oneOf = (key, list) => {
    if (!list.includes(s[key])) p.push(`settings.${key} must be one of ${list.join(', ')}`);
  };
  oneOf('slotPreset', SLOT_PRESETS);
  if (
    !isObject(s.slotLabels) ||
    !Object.entries(s.slotLabels).every(
      ([k, v]) => ENTRY_SLOT_IDS.includes(k) && typeof v === 'string',
    )
  ) {
    p.push('settings.slotLabels must map slot ids to strings');
  }
  if (typeof s.halalOnly !== 'boolean') p.push('settings.halalOnly must be true or false');
  oneOf('seafood', SEAFOOD);
  const m = s.dayStartMinutes;
  if (!(Number.isInteger(m) && m >= 0 && m <= DAY_START_MAX)) {
    p.push(`settings.dayStartMinutes must be an integer 0..${DAY_START_MAX}, got ${show(m)}`);
  }
  oneOf('onboarding', ONBOARDING);
  if (
    !isObject(s.units) ||
    !WEIGHT_UNITS.includes(s.units.weight) ||
    !HEIGHT_UNITS.includes(s.units.height)
  ) {
    p.push("settings.units must be { weight: 'kg'|'lb', height: 'cm'|'ftin' }");
  }
  oneOf('weekStartsOn', WEEK_STARTS);
  oneOf('theme', THEMES);
  if (typeof s.hideCalories !== 'boolean') p.push('settings.hideCalories must be true or false');
  // Sprint 3 (DECISIONS 2026-10-15): optional; absent = Ramadan mode off, tips on their default.
  p.push(...ramadanModeProblems(s.ramadanMode), ...nudgeSettingsProblems(s.nudges));
  return p;
}

function entryProblems(e, where, seen) {
  if (!isObject(e)) return [`${where} must be an object`];
  const p = [];
  if (typeof e.id !== 'string' || e.id === '') p.push(`${where}.id must be a non-empty string`);
  else if (seen.has(e.id)) p.push(`${where}: duplicate entry id ${show(e.id)}`);
  else seen.add(e.id);
  if (!ENTRY_SLOT_IDS.includes(e.slot)) p.push(`${where}.slot ${show(e.slot)} is not a slot id`);
  if (e.foodId !== null && (typeof e.foodId !== 'string' || e.foodId === '')) {
    p.push(`${where}.foodId must be a string or null`);
  }
  if (e.servingId !== null && (typeof e.servingId !== 'string' || e.servingId === '')) {
    p.push(`${where}.servingId must be a string or null`);
  }
  if (e.foodId === null && e.servingId !== null) {
    p.push(`${where}.servingId must be null for a quick add`);
  }
  if (!(isNumber(e.qty) && e.qty > 0)) p.push(`${where}.qty must be a number > 0`);
  if (!STATUSES.includes(e.status)) p.push(`${where}.status must be 'planned' or 'eaten'`);
  const s = e.snapshot;
  const snapshotOk =
    isObject(s) &&
    typeof s.name === 'string' &&
    (s.grams === null || (isNumber(s.grams) && s.grams >= 0)) &&
    NUTRIENT_KEYS.every((k) => isNumber(s[k]) && s[k] >= 0);
  if (!snapshotOk)
    p.push(`${where}.snapshot must be { name, grams|null, kcal, protein, carbs, fat, fiber }`);
  return p;
}

function daysProblems(days) {
  if (!isObject(days)) return ['days must be an object keyed by date'];
  const p = [];
  for (const [date, day] of Object.entries(days)) {
    const where = `days[${date}]`;
    if (!isISODate(date)) p.push(`${where}: '${date}' is not a real date`);
    if (!isObject(day) || !Array.isArray(day.entries)) {
      p.push(`${where} must be { date, entries: [] }`);
      continue;
    }
    if (day.date !== date) p.push(`${where}.date must be '${date}'`);
    if (day.slotPreset !== undefined && !DAY_PRESETS.includes(day.slotPreset)) {
      p.push(`${where}.slotPreset must be one of ${DAY_PRESETS.join(', ')}`);
    }
    const seen = new Set();
    day.entries.forEach((e, i) => p.push(...entryProblems(e, `${where}.entries[${i}]`, seen)));
  }
  return p;
}

function recentsProblems(recents) {
  if (!isObject(recents)) return ['recents must be an object'];
  const p = [];
  for (const [id, r] of Object.entries(recents)) {
    const ok =
      isObject(r) &&
      typeof r.servingId === 'string' &&
      isNumber(r.qty) &&
      r.qty > 0 &&
      Number.isInteger(r.count) &&
      r.count >= 0 &&
      isISODate(r.lastUsed) &&
      (r.slots === undefined ||
        (isObject(r.slots) && Object.values(r.slots).every((n) => isNumber(n) && n >= 0)));
    if (!ok) p.push(`recents[${id}] must be { servingId, qty, count, lastUsed, slots }`);
  }
  return p;
}

/** @param {unknown} data @returns {string[]} problems; [] = valid UserData. */
export function validateUserData(data) {
  try {
    if (!isObject(data)) return ['the document must be an object'];
    const p = [];
    if (data.schemaVersion !== SCHEMA_VERSION) {
      p.push(`schemaVersion must be ${SCHEMA_VERSION}, got ${show(data.schemaVersion)}`);
    }
    if (data.profile !== null && !isObject(data.profile))
      p.push('profile must be an object or null');
    const prefs = data.targetPrefs;
    if (
      !isObject(prefs) ||
      ![prefs.proteinGPerKg, prefs.fatPct].every((v) => v == null || isNumber(v))
    ) {
      p.push('targetPrefs must be { proteinGPerKg?: number|null, fatPct?: number|null }');
    }
    const overrides = data.targetOverrides;
    if (
      !isObject(overrides) ||
      !Object.entries(overrides).every(
        ([k, v]) => NUTRIENT_KEYS.includes(k) && (v == null || (isNumber(v) && v >= 0)),
      )
    ) {
      p.push('targetOverrides must map nutrient keys to numbers >= 0 or null');
    }
    p.push(...settingsProblems(data.settings));
    p.push(...daysProblems(data.days));
    // Structural only: a custom food is checked with foods.validateFood where it is created or
    // used. One imperfect food must never make the whole document load as 'corrupt'.
    if (!Array.isArray(data.customFoods)) p.push('customFoods must be an array');
    else {
      const ids = new Set();
      data.customFoods.forEach((food, i) => {
        if (!isObject(food) || typeof food.id !== 'string' || food.id === '') {
          p.push(`customFoods[${i}] must be a food object with a string id`);
        } else if (ids.has(food.id))
          p.push(`customFoods[${i}]: duplicate food id ${show(food.id)}`);
        else ids.add(food.id);
      });
    }
    p.push(...recentsProblems(data.recents));
    if (!Array.isArray(data.recipes)) p.push('recipes must be an array');
    if (!Array.isArray(data.batches)) p.push('batches must be an array');
    if (data.savedMeals !== undefined && !Array.isArray(data.savedMeals)) {
      p.push('savedMeals must be an array');
    }
    // Sprint 3 (§14): optional; absent means no weights logged.
    p.push(...weightLogProblems(data.weightLog));
    return p;
  } catch (error) {
    return [`the document could not be validated (${messageOf(error)})`];
  }
}

/**
 * Upgrade any older document to SCHEMA_VERSION, filling missing fields with defaults.
 * Throws Error with .code 'FUTURE_VERSION' or 'INVALID'.
 * @param {unknown} raw parsed JSON @returns {UserData}
 */
export function migrate(raw) {
  if (!isObject(raw)) throw codedError('INVALID', 'the document is not an object');
  const version = raw.schemaVersion;
  if (!Number.isInteger(version) || version < 1) {
    throw codedError('INVALID', `schemaVersion ${show(version)} is not a version`);
  }
  if (version > SCHEMA_VERSION) {
    throw codedError('FUTURE_VERSION', `schemaVersion ${version} is newer than ${SCHEMA_VERSION}`);
  }
  let source;
  try {
    source = structuredClone(raw);
  } catch (error) {
    throw codedError('INVALID', `the document is not plain data (${messageOf(error)})`);
  }
  // Version 1 is the only version: fill fields added during Sprint 1 (meeting 002, onboarding).
  const base = defaultData();
  const data = { ...base, ...source, schemaVersion: SCHEMA_VERSION };
  if (source.settings === undefined || isObject(source.settings)) {
    const given = source.settings ?? {};
    data.settings = {
      ...base.settings,
      ...given,
      units: { ...base.settings.units, ...(isObject(given.units) ? given.units : {}) },
    };
    // ARCHITECTURE §7.3: a missing onboarding state is 'done' with a profile, else 'pending'.
    if (given.onboarding === undefined) {
      data.settings.onboarding = isObject(data.profile) ? 'done' : 'pending';
    }
  }
  // Sprint 3 (§15): a broken Ramadan or tips setting falls back to its default, never 'corrupt'.
  if (isObject(data.settings)) {
    const settings = { ...data.settings };
    const ramadan = cleanRamadanMode(settings.ramadanMode);
    if (ramadan === null) delete settings.ramadanMode;
    else if (ramadan !== undefined) settings.ramadanMode = ramadan;
    if (nudgeSettingsProblems(settings.nudges).length) delete settings.nudges;
    data.settings = settings;
  }
  // Sprint 3 (§14): one bad weight must never make the whole document 'corrupt'; keep the good ones.
  if (Object.hasOwn(source, 'weightLog') && weightLogProblems(source.weightLog).length > 0) {
    const kept = weightEntries(source.weightLog).filter((e) => e.kg > 0);
    if (kept.length) data.weightLog = Object.fromEntries(kept.map((e) => [e.date, { kg: e.kg }]));
    else delete data.weightLog;
  }
  // s3-method (§13.1): "My method" is optional text on a recipe; anything else is dropped, never 'corrupt'.
  if (Array.isArray(data.recipes) && data.recipes.some(badMethod)) {
    data.recipes = data.recipes.map((r) => {
      if (!badMethod(r)) return r;
      const { method, ...rest } = r;
      return typeof method === 'string' && method.trim()
        ? { ...rest, method: method.trim().slice(0, MY_METHOD_MAX) }
        : rest;
    });
  }
  const problems = validateUserData(data);
  if (problems.length > 0) {
    throw codedError('INVALID', `the document is not valid: ${problems[0]}`, problems);
  }
  return data;
}

/** A recipe whose `method` is present but not clean text of at most MY_METHOD_MAX characters. */
function badMethod(recipe) {
  if (!isObject(recipe) || !Object.hasOwn(recipe, 'method')) return false;
  const m = recipe.method;
  return typeof m !== 'string' || !m.trim() || m !== m.trim() || m.length > MY_METHOD_MAX;
}

function isQuotaError(error) {
  return QUOTA_NAMES.has(error?.name) || QUOTA_CODES.has(error?.code);
}

/**
 * Never throws. load() status:
 *   'ok' (parsed + migrated), 'empty' (no key), 'unavailable' (backend null or throws),
 *   'corrupt' (unparseable/invalid; raw copied to `${STORAGE_KEY}.corrupt.${stamp()}`, defaults
 *   returned), 'future' (schemaVersion > SCHEMA_VERSION; defaults returned, save() refuses).
 * save() -> { ok: true } | { ok: false, error: 'unavailable'|'quota'|'future'|string }.
 * @param {{ getItem(k: string): string|null, setItem(k: string, v: string): void,
 *   removeItem(k: string): void }|null} backend
 * @param {{ stamp?: () => string }} [options]
 * @returns {{ load(): { data: UserData, status: string, error?: string },
 *   save(data: UserData): { ok: boolean, error?: string } }}
 */
export function createPersistence(backend, { stamp = () => 'unknown' } = {}) {
  let future = false;
  const usable = () =>
    backend != null &&
    typeof backend.getItem === 'function' &&
    typeof backend.setItem === 'function';

  const safeStamp = () => {
    try {
      const s = stamp();
      return typeof s === 'string' && s !== '' ? s : 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const keepCorrupt = (raw) => {
    try {
      backend.setItem(`${STORAGE_KEY}.corrupt.${safeStamp()}`, raw);
    } catch {
      // Nowhere to keep it: the original stays under STORAGE_KEY until the next save.
    }
  };

  const result = (status, error) => ({
    data: defaultData(),
    status,
    ...(error ? { error } : {}),
  });

  function load() {
    try {
      if (!usable()) return result('unavailable', 'no storage backend');
      let raw;
      try {
        raw = backend.getItem(STORAGE_KEY);
      } catch (error) {
        return result('unavailable', messageOf(error));
      }
      future = false;
      if (raw == null) return result('empty');
      const text = String(raw);
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        keepCorrupt(text);
        return result('corrupt', `not JSON: ${messageOf(error)}`);
      }
      try {
        return { data: migrate(parsed), status: 'ok' };
      } catch (error) {
        if (error?.code === 'FUTURE_VERSION') {
          future = true;
          return result('future', messageOf(error));
        }
        keepCorrupt(text);
        return result('corrupt', messageOf(error));
      }
    } catch (error) {
      return result('unavailable', messageOf(error));
    }
  }

  function save(data) {
    try {
      if (future) return { ok: false, error: 'future' };
      if (!usable()) return { ok: false, error: 'unavailable' };
      if (!isObject(data)) return { ok: false, error: 'invalid: the document must be an object' };
      let text;
      try {
        text = JSON.stringify(data);
      } catch (error) {
        return { ok: false, error: `invalid: ${messageOf(error)}` };
      }
      try {
        backend.setItem(STORAGE_KEY, text);
      } catch (error) {
        return { ok: false, error: isQuotaError(error) ? 'quota' : 'unavailable' };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  }

  return { load, save };
}

/**
 * @param {UserData} data @param {string} exportedAt e.g. dates.localDateTime(now)
 * @returns {string} JSON of { kind: EXPORT_KIND, schemaVersion, exportedAt, data }
 */
export function serializeExport(data, exportedAt) {
  if (!isObject(data)) throw new TypeError('data must be a UserData document');
  if (typeof exportedAt !== 'string') throw new TypeError('exportedAt must be a string');
  return JSON.stringify({ kind: EXPORT_KIND, schemaVersion: SCHEMA_VERSION, exportedAt, data });
}

function looksLikeUserData(value) {
  return (
    isObject(value) &&
    Object.hasOwn(value, 'schemaVersion') &&
    ['settings', 'days', 'profile'].some((key) => Object.hasOwn(value, key))
  );
}

function summarize(data) {
  const logged = Object.keys(data.days)
    .filter((date) => data.days[date].entries.length > 0)
    .sort();
  return {
    days: logged.length,
    entries: logged.reduce((n, date) => n + data.days[date].entries.length, 0),
    customFoods: data.customFoods.length,
    firstDate: logged[0] ?? null,
    lastDate: logged.at(-1) ?? null,
  };
}

/**
 * Also accepts a bare UserData document. Error codes: 'EMPTY', 'NOT_JSON', 'NOT_KATORI',
 * 'FUTURE_VERSION', 'INVALID'. summary.days counts the days that have entries.
 * @param {string} text
 * @returns {{ ok: true, data: UserData, summary: { days: number, entries: number,
 *   customFoods: number, firstDate: string|null, lastDate: string|null } }
 *   | { ok: false, error: string }}
 */
export function parseImport(text) {
  if (typeof text !== 'string' || text.trim() === '') return { ok: false, error: 'EMPTY' };
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'NOT_JSON' };
  }
  let doc;
  if (isObject(parsed) && parsed.kind === EXPORT_KIND) {
    if (Number.isInteger(parsed.schemaVersion) && parsed.schemaVersion > SCHEMA_VERSION) {
      return { ok: false, error: 'FUTURE_VERSION' };
    }
    doc = parsed.data;
  } else if (looksLikeUserData(parsed) && !Object.hasOwn(parsed, 'kind')) {
    doc = parsed;
  } else {
    return { ok: false, error: 'NOT_KATORI' };
  }
  let data;
  try {
    data = migrate(doc);
  } catch (error) {
    return { ok: false, error: error?.code === 'FUTURE_VERSION' ? 'FUTURE_VERSION' : 'INVALID' };
  }
  return { ok: true, data, summary: summarize(data) };
}

/** Union of two lists by `id`: current order, incoming replacing in place, then new incoming items. */
function unionById(current = [], incoming = []) {
  const byId = new Map(incoming.filter((x) => x?.id != null).map((x) => [x.id, x]));
  const seen = new Set();
  const out = current.map((x) => {
    if (x?.id == null) return x;
    seen.add(x.id);
    return byId.get(x.id) ?? x;
  });
  for (const x of incoming) if (x?.id == null || !seen.has(x.id)) out.push(x);
  return out;
}

function mergeRecent(a, b) {
  if (!a) return b;
  if (!b) return a;
  const later = (b.lastUsed ?? '') >= (a.lastUsed ?? '') ? b : a; // a tie goes to incoming (b)
  const slots = { ...(a.slots ?? {}) };
  for (const [slot, n] of Object.entries(b.slots ?? {}))
    slots[slot] = Math.max(slots[slot] ?? 0, n);
  return { ...later, count: Math.max(a.count ?? 0, b.count ?? 0), lastUsed: later.lastUsed, slots };
}

/**
 * 'replace' -> incoming. 'merge' -> days unioned; same date: entries unioned by id (incoming wins);
 * profile/settings/targets kept from current unless current.profile is null; customFoods unioned
 * by id (incoming wins); recents: max count, latest lastUsed; weightLog unioned by date (incoming
 * wins).
 * @param {UserData} current @param {UserData} incoming @param {'replace'|'merge'} mode
 * @returns {UserData}
 */
export function mergeImport(current, incoming, mode) {
  if (mode !== 'replace' && mode !== 'merge') {
    throw new RangeError(`mode must be 'replace' or 'merge', got ${show(mode)}`);
  }
  if (!isObject(incoming)) throw new TypeError('incoming must be a UserData document');
  if (mode === 'replace') return incoming;
  if (!isObject(current)) throw new TypeError('current must be a UserData document');

  const days = { ...(current.days ?? {}) };
  for (const [date, inDay] of Object.entries(incoming.days ?? {})) {
    const curDay = days[date];
    days[date] = curDay
      ? { ...curDay, ...inDay, date, entries: unionById(curDay.entries, inDay.entries) }
      : inDay;
  }

  const recents = { ...(current.recents ?? {}) };
  for (const [id, r] of Object.entries(incoming.recents ?? {})) {
    recents[id] = mergeRecent(recents[id], r);
  }

  const owner = current.profile === null ? incoming : current;
  return {
    ...current,
    schemaVersion: SCHEMA_VERSION,
    profile: owner.profile,
    settings: owner.settings,
    targetPrefs: owner.targetPrefs,
    targetOverrides: owner.targetOverrides,
    days,
    customFoods: unionById(current.customFoods, incoming.customFoods),
    recents,
    recipes: unionById(current.recipes, incoming.recipes),
    batches: unionById(current.batches, incoming.batches),
    // Sprint 2 (§13.1): optional; absent means none.
    ...(current.savedMeals || incoming.savedMeals
      ? { savedMeals: unionById(current.savedMeals, incoming.savedMeals) }
      : {}),
    // Sprint 3 (§14): optional; one weight per date, the incoming one wins a shared date.
    ...(current.weightLog || incoming.weightLog
      ? { weightLog: mergeWeightLogs(current.weightLog, incoming.weightLog) }
      : {}),
  };
}
