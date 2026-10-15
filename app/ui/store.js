// Katori app state: the persisted UserData document, derived selectors and actions.
// Owner: Lena. Contract: docs/ARCHITECTURE.md §7.3.
// No DOM access: persistence, clock, ids and timers are injected, so it runs in Node tests.
// Every action builds a new document with the pure core functions and then notifies subscribers.
import { todayISO, minutesOfDay, weekDates, localDateTime, addDays } from '../core/dates.js';
import { fmtDateShort } from './components/format.js';
import { buildFoodIndex, defaultServing, findServing, variantsOf } from '../core/foods.js';
import {
  RECIPE_PREFIX,
  foodFromRecipe,
  recipeTotals,
  worstHalal,
  storagePlan,
  boxUseBy,
  useByStatus,
  boxesLeft,
  placeBox,
  syncBatches,
  shoppingList,
  shoppingForShop,
  spareBoxes,
} from '../core/mealprep.js';
import {
  setWeight,
  removeWeight,
  weightEntries,
  weightTrend,
  suggestRails,
} from '../core/weight.js';
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

/** Slot presets whose names can be chosen on their own (Sprint 3, meeting 005). */
const MEAL_NAME_SETS = ['default', 'spain'];

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
 * @param {object[]} [options.library] Lab library recipes (app/data/recipes-mealprep.js, §13.1)
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
  library = [],
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
    // Box statuses follow the entries that point at them (§13.2 syncBatches).
    if (Array.isArray(nextData.batches) && nextData.batches.length) {
      const synced = syncBatches(nextData.batches, nextData.days ?? {});
      if (synced !== nextData.batches) nextData = { ...nextData, batches: synced };
    }
    undoSnapshot = undoLabel ? state.data : null;
    setState({ data: nextData, undo: undoLabel ? { label: undoLabel } : null });
    scheduleSave();
  }

  /** Goal, pace and kcal target of a document: what a target change means (§14.3 cooldown). */
  function targetKey(d) {
    const result = targetResultOf(d.profile, d.targetPrefs);
    const kcal = targetsOf(result, d.profile, d.targetOverrides)?.kcal ?? null;
    return [d.profile?.goal, d.profile?.rateKgPerWeek, kcal].join('|');
  }

  /** commit() that stamps settings.targetsChangedOn when the goal or the kcal target changed. */
  function commitTargets(nextData, undoLabel = null) {
    if (targetKey(nextData) !== targetKey(state.data)) {
      nextData = {
        ...nextData,
        settings: { ...(nextData.settings ?? {}), targetsChangedOn: today() },
      };
    }
    commit(nextData, undoLabel);
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
  // Food index = Lab foods (seafood setting applied) + user foods + foods derived from recipes.
  const seafoodFoodsOf = memoLast((seafood) => applySeafood(foods, seafood, rules));
  const baseIndexOf = memoLast((labFoods, customFoods) => buildIndexSafely(labFoods, customFoods));
  const indexOf = memoLast((base, recipes) => {
    if (!recipes.length) return base;
    const out = new Map(base);
    for (const recipe of recipes) {
      if (!recipe?.id || out.has(recipe.id)) continue;
      try {
        out.set(recipe.id, foodFromRecipe(recipe, base, rules));
      } catch (error) {
        console.warn(`Katori: recipe ${recipe.id} has no usable ingredients.`, error);
      }
    }
    return out;
  });
  const libraryById = new Map((Array.isArray(library) ? library : []).map((r) => [r.foodId, r]));
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
  const baseIndex = () =>
    baseIndexOf(seafoodFoodsOf(settings().seafood ?? 'all'), data().customFoods ?? []);
  const index = () => indexOf(baseIndex(), data().recipes ?? []);
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

  // ------------------------------------------------------------------ meal prep (§13)
  const recipesList = () => data().recipes ?? [];
  const batchesList = () => data().batches ?? [];
  const findRecipe = (id) => recipesList().find((r) => r.id === id) ?? null;
  const findBatch = (id) => batchesList().find((b) => b.id === id) ?? null;

  /** The recipe behind a batch: the user's, else the Lab's library recipe, else a bare stub. */
  function recipeFor(recipeId) {
    return (
      findRecipe(recipeId) ??
      libraryById.get(recipeId) ?? { foodId: recipeId, boxes: 4, storage: null, ingredients: [] }
    );
  }

  function requireBatch(batchId) {
    const b = findBatch(batchId);
    if (!b) throw new Error(`No batch ${batchId}`);
    return b;
  }

  function withBatch(next) {
    return batchesList().map((b) => (b.id === next.id ? next : b));
  }

  function useByOf(batch, box) {
    try {
      return boxUseBy(batch, box, recipeFor(batch.recipeId), index(), rules);
    } catch {
      return null;
    }
  }

  /** The box to use on `date`: a fridge box still good that day, else a frozen one, else any. */
  function pickBox(batch, date) {
    const free = batch.boxes.filter((b) => b.status === 'available');
    const rank = (box) => {
      if (box.storage === 'freezer') return [1, ''];
      const useBy = useByOf(batch, box);
      return useBy && useBy >= date ? [0, useBy] : [2, useBy ?? ''];
    };
    return (
      free
        .map((box, i) => ({ box, i, r: rank(box) }))
        .sort((a, b) => a.r[0] - b.r[0] || a.r[1].localeCompare(b.r[1]) || a.i - b.i)[0]?.box ??
      null
    );
  }

  /** Adds one box entry to `next` (a working copy of the document). */
  function placeInto(next, batchId, date, slot) {
    let batch = next.batches.find((b) => b.id === batchId);
    const f = requireFood(batch.recipeId);
    const box = pickBox(batch, date);
    const serving = findServing(f, 'box') ? 'box' : defaultServing(f).id;
    const entry = createEntry({
      id: makeId(),
      slot,
      food: f,
      servingId: serving,
      qty: 1,
      status: statusForAdd(date),
    });
    const current = next.days?.[date] ?? emptyDay(date);
    let warning = null;
    if (box) {
      entry.boxRef = { batchId, boxId: box.id };
      batch = placeBox(batch, box.id, { date, entryId: entry.id });
      next.batches = next.batches.map((b) => (b.id === batchId ? batch : b));
      const useBy = useByOf(batch, box);
      if (box.storage === 'fridge' && useBy && useBy < date) warning = 'past-use-by';
    }
    next.days = { ...next.days, [date]: addEntry(current, entry) };
    next.recents = recordUse(next.recents ?? {}, {
      foodId: f.id,
      servingId: serving,
      qty: 1,
      slot,
      date,
    });
    return { entryId: entry.id, boxId: box?.id ?? null, noneLeft: !box, warning };
  }

  function boxNumber(batch, boxId) {
    return batch.boxes.findIndex((b) => b.id === boxId) + 1;
  }

  const CHAI_FOODS = { sugar: 'intl-sugar' };

  // ------------------------------------------------------------------ public API
  const api = {
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
      const found = searchFoods(searchIndexOf(idx), query, {
        limit,
        boosts: recencyBoosts(data().recents ?? {}, today()),
        hints: slot ? slotHintsOf(idx, slot) : [],
        halalOnly: settings().halalOnly,
      });
      // "Set my chai once": the person's own chai leads its tier (Sprint 2).
      const chaiId = recipesList().find((r) => r.kind === 'chai')?.id;
      const at = chaiId ? found.hits.findIndex((h) => h.food.id === chaiId) : -1;
      if (at > 0 && found.hits[at].tier === found.hits[0].tier) {
        const hits = [...found.hits];
        hits.unshift(...hits.splice(at, 1));
        return { ...found, hits };
      }
      return found;
    },
    recents(slot, { limit = 12 } = {}) {
      const out = [];
      for (const id of recentForSlot(data().recents ?? {}, slot, { limit: limit * 2 })) {
        const f = food(id);
        if (!f || f.halal?.status === 'not-halal') continue; // never suggested (meeting 002)
        out.push({ food: f, ...portionFor(id) });
        if (out.length === limit) break;
      }
      // "Set my chai once": the person's chai comes first wherever chai belongs.
      const chaiId = recipesList().find((r) => r.kind === 'chai')?.id;
      const chai = chaiId ? food(chaiId) : null;
      if (chai) {
        const isChai = (f) => f.group === 'drink-tea-coffee' && f.aliases?.includes('chai');
        const rest = out.filter((r) => r.food.id !== chaiId);
        if (
          rest.length < out.length ||
          chai.slots?.includes(slot) ||
          rest.some((r) => isChai(r.food))
        ) {
          return [{ food: chai, ...portionFor(chaiId) }, ...rest].slice(0, limit);
        }
      }
      return out;
    },
    // meal prep: selectors (§13)
    recipes: () => recipesList().filter((r) => r.kind !== 'chai'),
    recipe: findRecipe,
    recipeTotals(recipe) {
      return recipeTotals(recipe, baseIndex());
    },
    /** Live preview of an unsaved recipe: { food|null, totals, halal } (A16 builder). */
    previewRecipe(recipe) {
      const base = baseIndex();
      const totals = recipeTotals(recipe, base);
      let f = null;
      try {
        f = foodFromRecipe({ ...recipe, id: recipe.id ?? `${RECIPE_PREFIX}preview` }, base, rules);
      } catch {
        f = null;
      }
      const halal = worstHalal(
        totals.lines.map((l) => base.get(l.foodId)),
        rules,
      );
      return { food: f, totals, halal };
    },
    /** Lab library boxes: [{ food, recipe|null, slot }] by first slot hint. */
    library() {
      const out = [];
      for (const f of baseIndex().values()) {
        if (f.group !== 'lunchbox' || f.userRecipe) continue;
        out.push({ food: f, recipe: libraryById.get(f.id) ?? null, slot: f.slots?.[0] ?? 'lunch' });
      }
      return out;
    },
    batches: () => batchesList(),
    batch: findBatch,
    batchName: (batch) => food(batch.recipeId)?.name ?? batch.name ?? 'Batch',
    planFor(recipeId, boxes) {
      return storagePlan(recipeFor(recipeId), boxes, index(), rules);
    },
    boxesLeft: (batchId) => boxesLeft(requireBatch(batchId)),
    /** Per box: { box, number, useBy, status } with status on `date` (default today). */
    boxRows(batchId, date = null) {
      const batch = requireBatch(batchId);
      const on = date ?? today();
      return batch.boxes.map((box, i) => {
        const useBy = useByOf(batch, box);
        const when = box.placed?.date ?? on;
        return {
          box,
          number: i + 1,
          useBy,
          status: useByStatus(useBy, box.status === 'available' ? on : when < on ? on : when),
          today: useByStatus(useBy, on),
        };
      });
    },
    /** For an entry placed from a batch: { batch, box, number, useBy, status } on that date. */
    boxInfo(entry, date) {
      if (!entry?.boxRef) return null;
      const batch = findBatch(entry.boxRef.batchId);
      const box = batch?.boxes.find((b) => b.id === entry.boxRef.boxId);
      if (!box) return null;
      const useBy = useByOf(batch, box);
      return {
        batch,
        box,
        number: boxNumber(batch, box.id),
        useBy,
        status: useByStatus(useBy, date),
      };
    },
    /** Day view notes: frozen boxes placed for the next day ("move to the fridge tonight"). */
    prepNotices(date) {
      const tomorrow = addDays(date, 1);
      const moveTonight = [];
      for (const batch of batchesList()) {
        batch.boxes.forEach((box, i) => {
          if (box.storage !== 'freezer' || box.status !== 'placed') return;
          if (box.placed?.date !== tomorrow) return;
          const entry = day(tomorrow).entries.find((e) => e.id === box.placed.entryId);
          moveTonight.push({
            batchId: batch.id,
            boxId: box.id,
            number: i + 1,
            name: food(batch.recipeId)?.name ?? batch.name ?? 'Box',
            slot: entry?.slot ?? null,
          });
        });
      }
      return { moveTonight };
    },
    /**
     * Shopping list for `boxes` of a batch's (or recipe's) recipe, as you buy it (shoppingForShop:
     * packs or counts, a "Check you have" section); null without ingredients.
     */
    shopping(recipeId, boxes) {
      const recipe = recipeFor(recipeId);
      if (!recipe.ingredients?.length) return null;
      return shoppingForShop(shoppingList([{ recipe, boxes }], index(), rules), index(), rules);
    },
    /**
     * One list for this week's batches (Review 2): every batch cooked in the last 7 days or
     * planned later, with all its boxes, merged by food. `batches` names what is in it; `list` is
     * null when none of them has ingredients.
     * @returns {{ batches: { id, name, boxes, listed: boolean }[], list: object|null }}
     */
    weekShopping() {
      const from = addDays(today(), -6);
      const batches = batchesList()
        .filter((b) => b.cookedOn >= from)
        .sort((a, b) => a.cookedOn.localeCompare(b.cookedOn));
      const plans = [];
      const named = batches.map((b) => {
        const recipe = recipeFor(b.recipeId);
        const listed = Boolean(recipe.ingredients?.length) && b.boxes.length > 0;
        if (listed) plans.push({ recipe, boxes: b.boxes.length });
        return {
          id: b.id,
          name: food(b.recipeId)?.name ?? b.name ?? 'Batch',
          boxes: b.boxes.length,
          listed,
        };
      });
      const list = plans.length
        ? shoppingForShop(shoppingList(plans, index(), rules), index(), rules)
        : null;
      return { batches: named, list };
    },
    /** Boxes of a batch by state (Review 2: "3 to eat · 1 eaten"). */
    boxCounts(batchId) {
      const batch = requireBatch(batchId);
      const n = (s) => batch.boxes.filter((b) => b.status === s).length;
      const available = n('available');
      const placed = n('placed');
      return {
        available,
        placed,
        toEat: available + placed,
        eaten: n('eaten'),
        discarded: n('discarded'),
      };
    },
    /**
     * Spare or old boxes for the Day view line (Sprint 3): core spareBoxes plus the dish name and
     * the batch's box word. Most urgent first.
     */
    spareBoxes(date = null) {
      const on = date ?? today();
      return spareBoxes(batchesList(), on, useByOf).map((item) => {
        const batch = findBatch(item.batchId);
        return {
          ...item,
          recipeId: batch.recipeId,
          name: food(batch.recipeId)?.name ?? batch.name ?? 'Box',
        };
      });
    },
    chai: () => recipesList().find((r) => r.kind === 'chai') ?? null,
    savedMeals: () => data().savedMeals ?? [],

    // weight log (Sprint 3, §14): { date, kg }[] oldest first; the trend reads RULES.weightTrend
    weights: () => weightEntries(data().weightLog),
    weightOn: (date) => data().weightLog?.[date]?.kg ?? null,
    /**
     * core weightTrend with the person's goal, target and rails (NUTRITION.md §14). A suggestion
     * is never applied: only acceptWeightSuggestion (the person's tap) changes the target.
     */
    weightTrend() {
      const result = targetResult();
      const personal = targetKind() === 'personal';
      const kcal = personal ? (targets()?.kcal ?? null) : null;
      const profile = data().profile ?? {};
      const entries = weightEntries(data().weightLog);
      const bodyKg = entries.at(-1)?.kg ?? profile.weightKg ?? null;
      const s = settings();
      return weightTrend(entries, rules, {
        goal: result?.effectiveGoal ?? 'maintain',
        rateKgPerWeek: Math.abs(result?.effectiveRateKgPerWeek ?? 0),
        kcal,
        ...suggestRails(rules, { tdee: result?.tdee ?? null, sex: profile.sex, bodyKg }),
        allowSuggest: personal && Boolean(result?.ok) && !hideCaloriesOffered(),
        flags: [...(profile.healthFlags ?? []), ...(result?.warnings ?? [])],
        ramadanMode: s.slotPreset === 'ramadan' || s.ramadanMode === true,
        today: today(),
        changedOn: s.targetsChangedOn ?? null,
        dismissedOn: s.weightSuggestDismissedOn ?? null,
      });
    },

    // meal names (Sprint 3): Pakistani or Spanish names, whatever the meal times
    /** [{ id: 'default'|'spain', labels: { [slot]: label } }] from RULES.mealSlots. */
    mealNameSets() {
      return MEAL_NAME_SETS.filter((id) => rules?.mealSlots?.[id]).map((id) => ({
        id,
        labels: Object.fromEntries(rules.mealSlots[id].map((x) => [x.id, x.label])),
      }));
    },
    /** The set the five shown names match, or null when the person renamed a meal. */
    mealNameSet() {
      const shown = SLOT_IDS.map((id) => slotLabel(id));
      return (
        api.mealNameSets().find((set) => SLOT_IDS.every((id, i) => set.labels[id] === shown[i]))
          ?.id ?? null
      );
    },
    exportText: () => serializeExport(data(), localDateTime(now())),
    previewImport: (text) => parseImport(text),

    // actions: profile, targets, settings
    completeOnboarding(profile, prefs = null) {
      // Not a target change for the cooldown: the trend needs 3 weeks of weigh-ins anyway.
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
      commitTargets({
        ...data(),
        profile,
        settings: { ...(data().settings ?? {}), onboarding: 'done' },
      });
    },
    setTargetPrefs(prefs) {
      commitTargets({ ...data(), targetPrefs: { ...(data().targetPrefs ?? {}), ...prefs } });
    },
    setTargetOverride(key, value) {
      const overrides = { ...(data().targetOverrides ?? {}) };
      if (value === null || value === undefined) delete overrides[key];
      else overrides[key] = value;
      commitTargets({ ...data(), targetOverrides: overrides });
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

    // actions: recipes and meal prep (§13)
    saveRecipe(recipe) {
      const id = recipe.id ?? `${RECIPE_PREFIX}${makeId()}`;
      const clean = {
        id,
        name: String(recipe.name ?? '').trim() || 'My recipe',
        createdAt: recipe.createdAt ?? today(),
        updatedAt: today(),
        ingredients: (recipe.ingredients ?? []).map(({ foodId, servingId, qty }) => ({
          foodId,
          servingId,
          qty,
        })),
        cookedWeightG:
          Number.isFinite(recipe.cookedWeightG) && recipe.cookedWeightG > 0
            ? recipe.cookedWeightG
            : null,
        boxes: Math.max(1, Math.round(recipe.boxes ?? 1)),
        // A family pot measured in katori (Review 2, Nasreen): boxes 1, cookedWeightG = katori × ml.
        ...(Number.isFinite(recipe.potKatori) && recipe.potKatori > 0
          ? { potKatori: recipe.potKatori }
          : {}),
        ...(recipe.kind ? { kind: recipe.kind } : {}),
        ...(recipe.chai ? { chai: { ...recipe.chai } } : {}),
        ...(Array.isArray(recipe.storage) && recipe.storage.length
          ? { storage: [...recipe.storage] }
          : {}),
      };
      const list = recipesList();
      const exists = list.some((r) => r.id === id);
      commit({
        ...data(),
        recipes: exists ? list.map((r) => (r.id === id ? clean : r)) : [...list, clean],
      });
      return id;
    },
    deleteRecipe(id) {
      const r = findRecipe(id);
      if (!r) return;
      commit({ ...data(), recipes: recipesList().filter((x) => x.id !== id) }, `Deleted ${r.name}`);
    },
    cookBatch({ recipeId, boxes, cookedOn = null, storage = null }) {
      const f = requireFood(recipeId);
      const n = Math.max(1, Math.round(boxes));
      const plan = storagePlan(recipeFor(recipeId), n, index(), rules);
      const id = makeId();
      const batch = {
        id,
        recipeId,
        name: f.name,
        cookedOn: cookedOn ?? today(),
        boxes: Array.from({ length: n }, (_, i) => ({
          id: `${id}-${i + 1}`,
          storage: boxStorage(storage?.[i], plan, i),
          movedToFridgeOn: null,
          placed: null,
          status: 'available',
        })),
      };
      commit({ ...data(), batches: [...batchesList(), batch] });
      return id;
    },
    setBoxStorage(batchId, boxId, storage) {
      const batch = requireBatch(batchId);
      const box = batch.boxes.find((b) => b.id === boxId);
      if (!box || box.storage === storage) return;
      const next = {
        ...batch,
        boxes: batch.boxes.map((b) =>
          b.id === boxId
            ? { ...b, storage, movedToFridgeOn: storage === 'fridge' ? today() : null }
            : b,
        ),
      };
      const n = boxNumber(batch, boxId);
      commit(
        { ...data(), batches: withBatch(next) },
        storage === 'fridge' ? `Box ${n} moved to the fridge` : `Box ${n} moved to the freezer`,
      );
    },
    discardBox(batchId, boxId) {
      const batch = requireBatch(batchId);
      const box = batch.boxes.find((b) => b.id === boxId);
      if (!box) return;
      let next = { ...data() };
      if (box.placed) {
        const d = day(box.placed.date);
        next = withDays({ [box.placed.date]: removeEntry(d, box.placed.entryId) });
      }
      next.batches = (next.batches ?? []).map((b) =>
        b.id === batchId
          ? {
              ...b,
              boxes: b.boxes.map((x) =>
                x.id === boxId ? { ...x, status: 'discarded', placed: null } : x,
              ),
            }
          : b,
      );
      commit(next, `Box ${boxNumber(batch, boxId)} thrown away`);
    },
    deleteBatch(batchId) {
      const batch = requireBatch(batchId);
      commit(
        { ...data(), batches: batchesList().filter((b) => b.id !== batchId) },
        `Removed the ${food(batch.recipeId)?.name ?? 'batch'} batch`,
      );
    },
    /** One box into `slot` on `date` (A17). With no box left it still adds a plain entry. */
    placeBox({ batchId, date, slot }) {
      requireBatch(batchId);
      const next = { ...data(), days: { ...(data().days ?? {}) }, batches: [...batchesList()] };
      const result = placeInto(next, batchId, date, slot);
      const f = food(requireBatch(batchId).recipeId);
      commit(next, `Added ${f?.name ?? 'a box'} to ${slotLabel(slot)}`);
      return result;
    },
    /** Boxes into `slot` on each date while boxes last ("Fill Mon–Thu"). @returns {number} placed */
    fillDays({ batchId, dates, slot }) {
      requireBatch(batchId);
      const next = { ...data(), days: { ...(data().days ?? {}) }, batches: [...batchesList()] };
      let placed = 0;
      for (const date of dates) {
        const b = next.batches.find((x) => x.id === batchId);
        if (boxesLeft(b) === 0) break;
        placeInto(next, batchId, date, slot);
        placed += 1;
      }
      if (placed) commit(next, `Placed ${placed} ${placed === 1 ? 'box' : 'boxes'}`);
      return placed;
    },

    // actions: "set my chai once"
    /**
     * @param {{ milkFoodId?: string, milkShare: number, sugarTsp: number, cupMl: number }} opts
     * @returns {string} the chai recipe id
     */
    saveChai({ milkFoodId = 'intl-milk-whole', milkShare, sugarTsp, cupMl }) {
      const base = baseIndex();
      const milk = base.get(milkFoodId);
      if (!milk) throw new Error(`Unknown milk ${milkFoodId}`);
      const cup = findServing(milk, 'cup');
      const density = cup ? cup.grams / 200 : 1.03; // the Lab's cup = 200 ml
      const milkG = Math.round(cupMl * milkShare * density);
      const ingredients = [{ foodId: milk.id, servingId: 'g', qty: milkG }];
      let sugarG = 0;
      if (sugarTsp > 0 && base.get(CHAI_FOODS.sugar)) {
        ingredients.push({ foodId: CHAI_FOODS.sugar, servingId: 'tsp', qty: sugarTsp });
        sugarG = base.get(CHAI_FOODS.sugar).servings.find((s) => s.id === 'tsp')?.grams * sugarTsp;
      }
      const sugarText =
        sugarTsp > 0 ? `${String(sugarTsp).replace('.5', '½')} tsp sugar` : 'no sugar';
      const old = recipesList().find((r) => r.kind === 'chai');
      return api.saveRecipe({
        id: old?.id,
        createdAt: old?.createdAt,
        kind: 'chai',
        name: `My chai (${sugarText})`,
        ingredients,
        // Water makes up the rest of the cup; tea leaves add nothing that counts.
        cookedWeightG: Math.round(cupMl * (1 - milkShare) + milkG + sugarG),
        boxes: 1,
        chai: { milkShare, sugarTsp, cupMl, milkFoodId },
      });
    },

    // actions: saved meals
    saveMeal({ date, slot, name }) {
      const items = day(date)
        .entries.filter((e) => e.slot === slot && e.foodId && food(e.foodId))
        .map((e) => ({ foodId: e.foodId, servingId: e.servingId, qty: e.qty }));
      if (!items.length) return null;
      const meal = {
        id: makeId(),
        name: String(name ?? '').trim() || slotLabel(slot),
        slot,
        createdAt: today(),
        items,
      };
      commit({ ...data(), savedMeals: [...(data().savedMeals ?? []), meal] });
      return meal.id;
    },
    addSavedMeal({ mealId, date, slot }) {
      const meal = (data().savedMeals ?? []).find((m) => m.id === mealId);
      if (!meal) throw new Error(`No saved meal ${mealId}`);
      let d = day(date);
      let recents = data().recents ?? {};
      let added = 0;
      for (const item of meal.items) {
        const f = food(item.foodId);
        if (!f || !findServing(f, item.servingId)) continue;
        const entry = createEntry({
          id: makeId(),
          slot,
          food: f,
          servingId: item.servingId,
          qty: item.qty,
          status: statusForAdd(date),
        });
        d = addEntry(d, entry);
        recents = recordUse(recents, { ...item, slot, date });
        added += 1;
      }
      if (!added) return 0;
      commit({ ...withDays({ [date]: d }), recents }, `Added ${meal.name}`);
      return added;
    },
    deleteSavedMeal(mealId) {
      const meal = (data().savedMeals ?? []).find((m) => m.id === mealId);
      if (!meal) return;
      commit(
        { ...data(), savedMeals: (data().savedMeals ?? []).filter((m) => m.id !== mealId) },
        `Deleted ${meal.name}`,
      );
    },

    /**
     * Meal names (Sprint 3): the preset's own names when they match the meal times (no renames
     * stored), else the set's five names as renames, so changing the times keeps them.
     */
    setMealNames(id) {
      const set = api.mealNameSets().find((x) => x.id === id);
      if (!set) throw new RangeError(`Unknown meal names ${id}`);
      const slotLabels = id === preset() ? {} : { ...set.labels };
      commit({ ...data(), settings: { ...(data().settings ?? {}), slotLabels } });
    },

    // actions: weight log (Sprint 3, §14)
    /** One weight per day: replaces that day's. RangeError outside RULES.profileLimits.weightKg. */
    setWeight(date, kg) {
      commit({ ...data(), weightLog: setWeight(data().weightLog, date, kg, rules) });
    },
    removeWeight(date) {
      if (!data().weightLog?.[date]) return;
      commit(
        { ...data(), weightLog: removeWeight(data().weightLog, date) },
        `Deleted the weight for ${fmtDateShort(date)}`,
      );
    },

    /**
     * The person tapped "Use {newKcal} kcal" (§14.3.6): a kcal override. Protein and fat stay as
     * they are; carbs take the difference (4 kcal a gram), so the macros still add up. Undo-able.
     * @returns {boolean} false when there is no suggestion
     */
    acceptWeightSuggestion() {
      const suggestion = api.weightTrend().suggestion;
      const current = targets();
      if (!suggestion || !current) return false;
      const carbFactor = rules?.energy?.factors?.carbs ?? 4;
      const carbs = Math.max(0, Math.round(current.carbs + suggestion.kcalPerDay / carbFactor));
      const overrides = { ...(data().targetOverrides ?? {}), kcal: suggestion.newKcal, carbs };
      commit(
        {
          ...data(),
          targetOverrides: overrides,
          settings: { ...(data().settings ?? {}), targetsChangedOn: today() },
        },
        `Daily target set to ${suggestion.newKcal} kcal`,
      );
      return true;
    },
    /** "Not now": no suggestion for RULES.weightTrend.suggest.snoozeDaysAfterDismiss days. */
    dismissWeightSuggestion() {
      commit({
        ...data(),
        settings: { ...(data().settings ?? {}), weightSuggestDismissedOn: today() },
      });
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
  return api;
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

/** A box's storage at cooking time: the user's choice, never the freezer for food that won't freeze. */
function boxStorage(choice, plan, i) {
  if (choice === 'freezer') return plan.freezable ? 'freezer' : 'fridge';
  if (choice === 'fridge') return 'fridge';
  return plan.storage[i];
}

/**
 * Seafood setting (meeting 002, decision 6): a food whose seafood tag is outside the user's choice
 * shows `check` with RULES' note. Never a ruling; records keep their own status otherwise.
 */
function applySeafood(foods, seafood, rules) {
  const halalRules = rules?.vocab?.halalRules;
  const choice = halalRules?.seafoodChoices?.find((c) => c.id === seafood);
  if (!choice || seafood === 'all') return foods;
  const allows = new Set(choice.allows ?? []);
  const note = halalRules.seafoodNote ?? 'Depends on your school of thought.';
  return foods.map((f) => {
    const tag = f.tags?.find((t) => t.startsWith('seafood-'));
    if (!tag || allows.has(tag) || f.halal?.status !== 'halal') return f;
    const label = rules?.vocab?.tags?.find((t) => t.id === tag)?.label ?? 'Seafood';
    return { ...f, halal: { status: 'check', reason: `${label}. ${note}` } };
  });
}
