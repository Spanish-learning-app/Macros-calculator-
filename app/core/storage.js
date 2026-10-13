// Persistence of the UserData document, migration, export and import. Pure: the storage backend
// is injected ({ getItem, setItem, removeItem } such as window.localStorage, or null).
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.7. Step 0 stub: signatures are final.

/** @typedef {import('./types.js').UserData} UserData */

const todo = (name) => {
  throw new Error(`not implemented: storage.${name}`);
};

export const STORAGE_KEY = 'mmc.v1';
export const SCHEMA_VERSION = 1;
export const EXPORT_KIND = 'katori-backup';

/**
 * A fresh document: profile null, no days, recipes [] and batches [] (reserved for Sprint 2),
 * settings.dayStartMinutes 240 (04:00; team/DECISIONS.md; validateUserData accepts 0..300).
 * With `rules`: settings.slotPreset = rules.mealSlotPresetDefault.byTimeZone[timeZone] ??
 * .fallback (Madrid, Ceuta, Canary -> 'spain'); settings.halalOnly =
 * rules.vocab.halalRules.halalOnlyFilterDefault; settings.seafood = rules.vocab.halalRules
 * .seafoodDefault. Without `rules`: 'default', true, 'all'.
 * @param {{ timeZone?: string|null, rules?: object|null }} [options] timeZone from
 *   Intl.DateTimeFormat().resolvedOptions().timeZone, passed in by the UI
 * @returns {UserData}
 */
export function defaultData({ timeZone = null, rules = null } = {}) {
  return todo('defaultData');
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
  return todo('createPersistence');
}

/**
 * Upgrade any older document to SCHEMA_VERSION, filling missing fields with defaults.
 * Throws Error with .code 'FUTURE_VERSION' or 'INVALID'.
 * @param {unknown} raw parsed JSON @returns {UserData}
 */
export function migrate(raw) {
  return todo('migrate');
}

/** @param {unknown} data @returns {string[]} problems; [] = valid UserData. */
export function validateUserData(data) {
  return todo('validateUserData');
}

/**
 * @param {UserData} data @param {string} exportedAt e.g. dates.localDateTime(now)
 * @returns {string} JSON of { kind: EXPORT_KIND, schemaVersion, exportedAt, data }
 */
export function serializeExport(data, exportedAt) {
  return todo('serializeExport');
}

/**
 * Also accepts a bare UserData document. Error codes: 'EMPTY', 'NOT_JSON', 'NOT_KATORI',
 * 'FUTURE_VERSION', 'INVALID'.
 * @param {string} text
 * @returns {{ ok: true, data: UserData, summary: { days: number, entries: number,
 *   customFoods: number, firstDate: string|null, lastDate: string|null } }
 *   | { ok: false, error: string }}
 */
export function parseImport(text) {
  return todo('parseImport');
}

/**
 * 'replace' -> incoming. 'merge' -> days unioned; same date: entries unioned by id (incoming wins);
 * profile/settings/targets kept from current unless current.profile is null; customFoods unioned
 * by id (incoming wins); recents: max count, latest lastUsed.
 * @param {UserData} current @param {UserData} incoming @param {'replace'|'merge'} mode
 * @returns {UserData}
 */
export function mergeImport(current, incoming, mode) {
  return todo('mergeImport');
}
