// Katori app state: the persisted UserData document, derived selectors and actions.
// Owner: Lena. Contract: docs/ARCHITECTURE.md §7.3.
// No DOM access: persistence, clock, ids and timers are injected, so it runs in Node tests.
// Every action builds a new document with the pure core functions and then notifies subscribers.
import { todayISO, minutesOfDay, weekDates, localDateTime } from '../core/dates.js';
import { buildFoodIndex, defaultServing, findServing, variantsOf } from '../core/foods.js';
import {
  SLOT_IDS,
  DEFAULT_SLOT_LABELS,
  emptyDay,
  createEntry,
  createQuickEntry,
  addEntry,
  updateEntry,
  removeEntry,
  switchEntryFood,
  setSlotStatus,
  copySlot,
  copyDay,
  dayTotals,
  progress,
  weekSummary,
  averageTotals,
  slotForTime,
} from '../core/days.js';
import { computeTargets, resolveTargets } from '../core/targets.js';
import {
  buildSearchIndex,
  searchFoods,
  recordUse,
  recencyBoosts,
  recentForSlot,
} from '../core/search.js';
import { defaultData, serializeExport, parseImport, mergeImport } from '../core/storage.js';

/** Settings a document may lack (older or partial data); merged under data.settings on read. */
const SETTINGS_FALLBACK = Object.freeze({
  slotPreset: 'default',
  slotLabels: {},
  halalOnly: true,
  seafood: 'all',
  dayStartMinutes: 240, // team/DECISIONS.md: the logging day starts at 04:00
  units: { weight: 'kg', height: 'cm' },
  weekStartsOn: 1,
  theme: 'system',
  hideCalories: false,
});

/**
 * @param {object} options
 * @param {{ load(): { data: object, status: string }, save(data: object): { ok: boolean, error?: string } } | null} options.persistence
 *   from core/storage.createPersistence; null = memory only
 * @param {object} options.rules RULES from app/data/index.js
 * @param {object[]} [options.foods] FOODS from app/data/index.js
 * @param {'ok'|'missing'} [options.foodsStatus]
 * @param {() => Date} [options.now]
 * @param {() => string} options.makeId unique ids for entries
 * @param {string|null} [options.timeZone] device time zone, for the default slot preset
 * @param {number} [options.debounceMs] save delay; flush() saves at once
 * @param {{ set: Function, clear: Function }} [options.timers] injectable for tests
 */
export function createStore({
  persistence,
  rules,
  foods = [],
  foodsStatus = 'ok',
  now = () => new Date(),
  makeId,
  timeZone = null,
  debounceMs = 300,
  timers = { set: (fn, ms) => setTimeout(fn, ms), clear: (t) => clearTimeout(t) },
}) {
  if (typeof makeId !== 'function') throw new TypeError('createStore: makeId is required');

  // ------------------------------------------------------------------ state
  const loaded = loadSafely(persistence);
  const fresh = () => defaultData({ timeZone, rules });
  let state = Object.freeze({
    data: loaded.status === 'ok' ? loaded.data : fresh(),
    storageStatus: loaded.status,
    saveError: null,
    undo: null,
    foodsStatus,
  });
  let undoSnapshot = null;
  const listeners = new Set();

  function setState(patch) {
    state = Object.freeze({ ...state, ...patch });
    for (const fn of [...listeners]) {
      try {
        fn(state);
      } catch (error) {
        console.error('Katori: a store listener failed.', error);
      }
    }
  }

  /** Replace the document. Undoable actions pass a label; every other change ends the undo window. */
  function commit(nextData, undoLabel = null) {
    undoSnapshot = undoLabel ? state.data : null;
    setState({ data: nextData, undo: undoLabel ? { label: undoLabel } : null });
    scheduleSave();
  }

  // ------------------------------------------------------------------ persistence
  let timer = null;
  let dirty = false;

  function scheduleSave() {
    dirty = true;
    if (timer !== null) timers.clear(timer);
    timer = timers.set(flush, debounceMs);
  }

  function flush() {
    if (timer !== null) {
      timers.clear(timer);
      timer = null;
    }
    if (!dirty) return;
    dirty = false;
    if (!persistence) return;
    let result;
    try {
      result = persistence.save(state.data);
    } catch (error) {
      result = { ok: false, error: String(error?.message ?? error) };
    }
    if (result.ok) {
      if (state.saveError !== null || state.storageStatus === 'empty') {
        setState({
          saveError: null,
          storageStatus: state.storageStatus === 'empty' ? 'ok' : state.storageStatus,
        });
      }
    } else {
      setState({
        saveError: result.error ?? 'unknown',
        storageStatus: result.error === 'unavailable' ? 'unavailable' : state.storageStatus,
      });
    }
  }

  // ------------------------------------------------------------------ memoized derivations
  const indexOf = memoLast((customFoods) => buildIndexSafely(foods, customFoods));
  const searchIndexOf = memoLast((index) => buildSearchIndex([...index.values()]));
  const slotHintsOf = memoLast((index, slot) => {
    const ids = [];
    for (const food of index.values()) if (food.slots?.includes(slot)) ids.push(food.id);
    return ids;
  });
  const targetResultOf = memoLast((profile, prefs) => {
    const personal = personalProfile(profile, rules);
    if (!personal) return null; // NUTRITION.md §2.1a: reference values, computeTargets not called
    try {
      return computeTargets(personal, rules, prefs ?? {});
    } catch (error) {
      console.error('Katori: targets could not be computed for this profile.', error);
      return null;
    }
  });
  const targetsOf = memoLast((result, profile, overrides) => {
    if (result) return result.ok ? resolveTargets(result, overrides ?? {}) : null;
    if (personalProfile(profile, rules)) return null; // computeTargets failed: show none
    const reference = rules?.skipDefaults?.targets;
    if (!reference) return null;
    const out = { ...reference };
    for (const [key, value] of Object.entries(overrides ?? {})) if (value != null) out[key] = value;
    return out;
  });

  const data = () => state.data;
  const index = () => indexOf(data().customFoods ?? []);
  const settings = () => ({ ...SETTINGS_FALLBACK, ...(data().settings ?? {}) });
  const preset = () => {
    const p = settings().slotPreset;
    return rules?.mealSlots?.[p] ? p : 'default';
  };

  // ------------------------------------------------------------------ selectors
  const today = () => todayISO(now(), settings().dayStartMinutes);
  const day = (date) => data().days?.[date] ?? emptyDay(date);
  const food = (id) => index().get(id);

  function slotLabel(slot) {
    const own = settings().slotLabels?.[slot];
    if (own) return own;
    const fromRules = rules?.mealSlots?.[preset()]?.find((s) => s.id === slot)?.label;
    return fromRules ?? DEFAULT_SLOT_LABELS[slot] ?? slot;
  }

  function targetResult() {
    return targetResultOf(data().profile, data().targetPrefs);
  }

  function targets() {
    return targetsOf(targetResult(), data().profile, data().targetOverrides);
  }

  /** 'personal' (computed), 'reference' (RULES.skipDefaults; NUTRITION.md §2.1a) or 'none'. */
  function targetKind() {
    const result = targetResult();
    if (result) return result.ok ? 'personal' : 'none';
    return targets() ? 'reference' : 'none';
  }

  function totals(date) {
    const d = day(date);
    const idx = index();
    return {
      eaten: dayTotals(d, idx, { include: 'eaten' }),
      planned: dayTotals(d, idx, { include: 'planned' }),
      all: dayTotals(d, idx, { include: 'all' }),
    };
  }

  /** The "+" portion: the last-used serving and quantity, or the default serving × 1. */
  function portionFor(foodId) {
    const f = requireFood(foodId);
    const recent = data().recents?.[foodId];
    if (recent && findServing(f, recent.servingId)) {
      return { servingId: recent.servingId, qty: recent.qty };
    }
    return { servingId: defaultServing(f).id, qty: 1 };
  }

  function onboardingState() {
    return settings().onboarding ?? (data().profile ? 'done' : 'pending');
  }

  function hideCaloriesOffered() {
    const flagIds = [...(rules?.healthFlags ?? []), ...(rules?.derivedFlags ?? [])]
      .filter((f) => f.effect?.offerHideCalories)
      .map((f) => f.id);
    const active = new Set([
      ...(data().profile?.healthFlags ?? []),
      ...(targetResult()?.warnings ?? []),
    ]);
    return flagIds.some((id) => active.has(id));
  }

  // ------------------------------------------------------------------ helpers for actions
  function requireFood(foodId) {
    const f = index().get(foodId);
    if (!f) throw new Error(`Unknown food: ${foodId}`);
    return f;
  }

  function requireEntry(date, entryId) {
    const entry = day(date).entries.find((e) => e.id === entryId);
    if (!entry) throw new Error(`No entry ${entryId} on ${date}`);
    return entry;
  }

  /** Planned for a future date, eaten otherwise (A12). */
  const statusForAdd = (date) => (date > today() ? 'planned' : 'eaten');
  /** Copies: eaten into the past, planned into today or the future (the user ticks as they eat). */
  const statusForCopy = (date) => (date < today() ? 'eaten' : 'planned');

  function withDays(changes) {
    const days = { ...(data().days ?? {}) };
    for (const [date, d] of Object.entries(changes)) {
      if (d.entries.length === 0) delete days[date];
      else days[date] = d;
    }
    return { ...data(), days };
  }

  // ------------------------------------------------------------------ public API
  return {
    // state
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    flush,

    // selectors
    today,
    defaultSlot: () => slotForTime(minutesOfDay(now()), rules, preset()),
    clockDate: () => todayISO(now(), 0), // the wall-clock date; differs from today() after midnight
    settings,
    slots: () => SLOT_IDS.map((id) => ({ id, label: slotLabel(id) })),
    slotLabel,
    onboardingState,
    needsOnboarding: () => onboardingState() === 'pending',
    targetResult,
    targets,
    targetKind,
    /** Texts for the targets badge: 'Estimate' (personal) or RULES.skipDefaults chip/label/prompt. */
    targetInfo() {
      const kind = targetKind();
      const skip = rules?.skipDefaults ?? {};
      if (kind === 'reference') {
        return { kind, chip: skip.chip, label: skip.label, prompt: skip.prompt };
      }
      return { kind, chip: kind === 'personal' ? 'Estimate' : null, label: null, prompt: null };
    },
    hideCaloriesOffered,
    day,
    loggedDates: () => Object.keys(data().days ?? {}).sort(),
    totals,
    left: (date) => progress(totals(date).eaten.total, targets() ?? {}),
    week(date) {
      const dates = weekDates(date, settings().weekStartsOn);
      const rows = weekSummary(data().days ?? {}, dates, index(), targets());
      return { dates, rows, average: averageTotals(rows) };
    },
    food,
    variants: (foodId) => variantsOf(requireFood(foodId), index()),
    portionFor,
    search(query, { slot = null, limit = 20 } = {}) {
      const idx = index();
      // Recency is the user's own signal and lifts a food within its tier. The slot's meal hints
      // only break ties, after style, so a hint never puts dhaba chai above home chai (Review 1).
      return searchFoods(searchIndexOf(idx), query, {
        limit,
        boosts: recencyBoosts(data().recents ?? {}, today()),
        hints: slot ? slotHintsOf(idx, slot) : [],
        halalOnly: settings().halalOnly,
      });
    },
    recents(slot, { limit = 12 } = {}) {
      const out = [];
      for (const id of recentForSlot(data().recents ?? {}, slot, { limit: limit * 2 })) {
        const f = food(id);
        if (!f || f.halal?.status === 'not-halal') continue; // never suggested (meeting 002)
        out.push({ food: f, ...portionFor(id) });
        if (out.length === limit) break;
      }
      return out;
    },
    exportText: () => serializeExport(data(), localDateTime(now())),
    previewImport: (text) => parseImport(text),

    // actions: profile, targets, settings
    completeOnboarding(profile, prefs = null) {
      commit({
        ...data(),
        profile,
        targetPrefs: prefs ?? data().targetPrefs ?? {},
        settings: { ...(data().settings ?? {}), onboarding: 'done' },
      });
    },
    skipOnboarding() {
      // A1 + NUTRITION.md §2.1a: no profile, reference targets from RULES.skipDefaults.
      commit({
        ...data(),
        profile: null,
        settings: { ...(data().settings ?? {}), onboarding: 'skipped' },
      });
    },
    setProfile(profile) {
      commit({
        ...data(),
        profile,
        settings: { ...(data().settings ?? {}), onboarding: 'done' },
      });
    },
    setTargetPrefs(prefs) {
      commit({ ...data(), targetPrefs: { ...(data().targetPrefs ?? {}), ...prefs } });
    },
    setTargetOverride(key, value) {
      const overrides = { ...(data().targetOverrides ?? {}) };
      if (value === null || value === undefined) delete overrides[key];
      else overrides[key] = value;
      commit({ ...data(), targetOverrides: overrides });
    },
    updateSettings(patch) {
      commit({ ...data(), settings: { ...(data().settings ?? {}), ...patch } });
    },

    // actions: entries
    addFood({ date, slot, foodId, servingId = null, qty = null, status = null }) {
      const f = requireFood(foodId);
      const portion = servingId ? { servingId, qty: qty ?? 1 } : portionFor(foodId);
      if (!servingId && qty !== null) portion.qty = qty;
      const entry = createEntry({
        id: makeId(),
        slot,
        food: f,
        servingId: portion.servingId,
        qty: portion.qty,
        status: status ?? statusForAdd(date),
      });
      const next = withDays({ [date]: addEntry(day(date), entry) });
      next.recents = recordUse(data().recents ?? {}, {
        foodId,
        servingId: entry.servingId,
        qty: entry.qty,
        slot,
        date,
      });
      commit(next);
      return entry.id;
    },
    quickAdd({ date, slot, name, nutrients, status = null }) {
      const entry = createQuickEntry({
        id: makeId(),
        slot,
        name,
        nutrients,
        status: status ?? statusForAdd(date),
      });
      commit(withDays({ [date]: addEntry(day(date), entry) }));
      return entry.id;
    },
    updateEntry(date, entryId, patch) {
      requireEntry(date, entryId);
      commit(withDays({ [date]: updateEntry(day(date), entryId, patch, index()) }));
    },
    setEntryStatus(date, entryId, status) {
      requireEntry(date, entryId);
      commit(withDays({ [date]: updateEntry(day(date), entryId, { status }, index()) }));
    },
    switchVariant(date, entryId, foodId) {
      const entry = requireEntry(date, entryId);
      const switched = switchEntryFood(entry, requireFood(foodId), index());
      const d = day(date);
      commit(
        withDays({
          [date]: { ...d, entries: d.entries.map((e) => (e.id === entryId ? switched : e)) },
        }),
      );
    },
    removeEntry(date, entryId) {
      const entry = requireEntry(date, entryId);
      commit(
        withDays({ [date]: removeEntry(day(date), entryId) }),
        `Deleted ${entry.snapshot.name}`,
      );
    },
    moveEntry(date, entryId, toDate) {
      const entry = requireEntry(date, entryId);
      if (toDate === date) return;
      commit(
        withDays({
          [date]: removeEntry(day(date), entryId),
          [toDate]: addEntry(day(toDate), entry),
        }),
        `Moved ${entry.snapshot.name} to ${toDate}`,
      );
    },
    setSlotStatus(date, slot, status) {
      commit(withDays({ [date]: setSlotStatus(day(date), slot, status) }));
    },
    copySlot({ fromDate, fromSlot, toDate, toSlot, status = null }) {
      const copied = copySlot(day(fromDate), fromSlot, day(toDate), toSlot, makeId, {
        status: status ?? statusForCopy(toDate),
      });
      commit(withDays({ [toDate]: copied }), `Copied ${slotLabel(fromSlot)}`);
    },
    copyDay({ fromDate, toDate, status = null }) {
      const copied = copyDay(day(fromDate), day(toDate), makeId, {
        status: status ?? statusForCopy(toDate),
      });
      commit(withDays({ [toDate]: copied }), `Copied ${fromDate}`);
    },

    // actions: undo, import, reset
    undo() {
      if (!undoSnapshot) return false;
      const previous = undoSnapshot;
      undoSnapshot = null;
      setState({ data: previous, undo: null });
      scheduleSave();
      return true;
    },
    dismissUndo() {
      undoSnapshot = null;
      if (state.undo) setState({ undo: null });
    },
    importText(text, mode = 'replace') {
      const parsed = parseImport(text);
      if (!parsed.ok) return parsed;
      commit(
        mergeImport(data(), parsed.data, mode),
        mode === 'merge' ? 'Merged backup' : 'Imported backup',
      );
      return { ok: true, summary: parsed.summary };
    },
    resetData() {
      commit(fresh(), 'Reset all data');
    },
  };
}

/**
 * The profile computeTargets gets, or null while any RULES.skipDefaults.requiredForPersonal field
 * (sex, age, height, weight) is missing. Missing optional fields take defaultsWhenMissing.
 */
function personalProfile(profile, rules) {
  if (!profile) return null;
  const skip = rules?.skipDefaults ?? {};
  const required = skip.requiredForPersonal ?? ['sex', 'ageYears', 'heightCm', 'weightKg'];
  if (required.some((key) => profile[key] === undefined || profile[key] === null)) return null;
  const filled = { ...profile };
  for (const [key, value] of Object.entries(skip.defaultsWhenMissing ?? {})) {
    if (filled[key] === undefined || filled[key] === null) filled[key] = value;
  }
  return filled;
}

/** Never throws: a persistence failure means "memory only". */
function loadSafely(persistence) {
  if (!persistence) return { data: null, status: 'unavailable' };
  try {
    return persistence.load();
  } catch (error) {
    console.error('Katori: loading saved data failed.', error);
    return { data: null, status: 'unavailable' };
  }
}

/** A duplicate id between the Lab's foods and user foods must not take the app down. */
function buildIndexSafely(foods, customFoods) {
  try {
    return buildFoodIndex(foods, customFoods);
  } catch (error) {
    console.error('Katori: food index problem; user foods ignored.', error);
    return buildFoodIndex(foods);
  }
}

/** Caches the last result per argument identity (a store selector is called many times per render). */
function memoLast(fn) {
  let lastArgs = null;
  let lastValue;
  return (...args) => {
    if (lastArgs && args.length === lastArgs.length && args.every((a, i) => a === lastArgs[i])) {
      return lastValue;
    }
    lastValue = fn(...args);
    lastArgs = args;
    return lastValue;
  };
}
