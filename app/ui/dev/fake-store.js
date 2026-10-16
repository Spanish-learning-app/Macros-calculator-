// FAKE STORE for Priya's harness only (never published). Same API as app/ui/store.js
// (docs/ARCHITECTURE.md §7.3, final), but self-contained, because most of app/core is still a
// Step 0 stub. The maths is deliberately simple; the real numbers come from Hamza's core through
// Lena's store. Do not import this from views.

const SLOT_IDS = ['breakfast', 'lunch', 'evening', 'dinner', 'snacks'];
const KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fiber'];
const zero = () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
const pad = (n) => String(n).padStart(2, '0');

function localISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
function dow(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[·‧]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/aa/g, 'a')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .trim();
}

/** A fresh document (mirrors core/storage.defaultData). */
export function fakeDefaultData({ timeZone = null, rules = null } = {}) {
  const byTz = rules?.mealSlotPresetDefault?.byTimeZone ?? {};
  return {
    schemaVersion: 1,
    profile: null,
    targetPrefs: {},
    targetOverrides: {},
    settings: {
      slotPreset: byTz[timeZone] ?? rules?.mealSlotPresetDefault?.fallback ?? 'default',
      slotLabels: {},
      halalOnly: rules?.vocab?.halalRules?.halalOnlyFilterDefault ?? true,
      seafood: 'all',
      dayStartMinutes: 240,
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

/**
 * @param {{ rules: object, foods: object[], now?: () => Date, makeId?: () => string,
 *   timeZone?: string|null, data?: object|null, storageStatus?: string }} options
 */
export function createFakeStore({
  rules,
  foods,
  now = () => new Date(),
  makeId = (() => {
    let n = 0;
    return () => `fx-${Date.now().toString(36)}-${(n += 1)}`;
  })(),
  timeZone = null,
  data = null,
  storageStatus = 'ok',
}) {
  const index = new Map(foods.map((f) => [f.id, f]));
  let state = Object.freeze({
    data: data ?? fakeDefaultData({ timeZone, rules }),
    storageStatus,
    saveError: storageStatus === 'unavailable' ? 'unavailable' : null,
    undo: null,
    foodsStatus: foods.length ? 'ok' : 'missing',
  });
  let undoSnapshot = null;
  const listeners = new Set();
  const d = () => state.data;

  function setState(patch) {
    state = Object.freeze({ ...state, ...patch });
    for (const fn of [...listeners]) fn(state);
  }
  function commit(next, undoLabel = null) {
    undoSnapshot = undoLabel ? state.data : null;
    setState({ data: next, undo: undoLabel ? { label: undoLabel } : null });
  }

  const settings = () => d().settings;
  const preset = () => (rules.mealSlots[settings().slotPreset] ? settings().slotPreset : 'default');
  const minutes = () => now().getHours() * 60 + now().getMinutes();
  function today() {
    const t = now();
    const start = settings().dayStartMinutes ?? 240;
    return minutes() < start ? addDays(localISO(t), -1) : localISO(t);
  }
  function slotForTime(min) {
    for (const s of rules.mealSlots[preset()]) {
      const [a, b] = s.hours;
      if (a <= b ? min >= a && min < b : min >= a || min < b) return s.id;
    }
    return 'snacks';
  }
  function slotLabel(slot) {
    return (
      settings().slotLabels?.[slot] ||
      rules.mealSlots[preset()].find((s) => s.id === slot)?.label ||
      slot
    );
  }

  // portions and totals
  const findServing = (food, id) =>
    id === 'g' ? { id: 'g', label: 'g', grams: 1 } : food.servings.find((s) => s.id === id);
  const defaultServing = (food) => food.servings.find((s) => s.default) ?? food.servings[0];
  function nutrientsFor(food, servingId, qty) {
    const grams = (findServing(food, servingId)?.grams ?? 0) * qty;
    const out = { grams };
    for (const k of KEYS) out[k] = (food.per100g[k] * grams) / 100;
    return out;
  }
  function entryNutrients(entry) {
    const food = entry.foodId ? index.get(entry.foodId) : null;
    if (food) return nutrientsFor(food, entry.servingId, entry.qty);
    const out = {};
    for (const k of KEYS) out[k] = (entry.snapshot[k] ?? 0) * (entry.foodId ? 1 : entry.qty);
    return out;
  }
  function snapshot(food, servingId, qty) {
    const n = nutrientsFor(food, servingId, qty);
    return { name: food.name, ...n };
  }
  const emptyDay = (date) => ({ date, entries: [] });
  const day = (date) => d().days[date] ?? emptyDay(date);
  function dayTotals(dy, include) {
    const bySlot = Object.fromEntries(SLOT_IDS.map((s) => [s, zero()]));
    const total = zero();
    for (const e of dy.entries) {
      if (include !== 'all' && e.status !== include) continue;
      const n = entryNutrients(e);
      for (const k of KEYS) {
        total[k] += n[k];
        bySlot[e.slot][k] += n[k];
      }
    }
    return { total, bySlot };
  }
  function progress(total, targets) {
    const out = {};
    for (const k of KEYS) {
      const target = targets?.[k] ?? null;
      out[k] = {
        value: total[k],
        target,
        pct: target ? (total[k] / target) * 100 : null,
        remaining: target ? target - total[k] : null,
      };
    }
    return out;
  }

  // targets (simplified: the real algorithm is NUTRITION.md §2.2 in core/targets.js)
  function personal(profile) {
    if (!profile) return null;
    const req = rules.skipDefaults?.requiredForPersonal ?? [
      'sex',
      'ageYears',
      'heightCm',
      'weightKg',
    ];
    if (req.some((k) => profile[k] == null)) return null;
    return { ...rules.skipDefaults?.defaultsWhenMissing, ...profile };
  }
  function targetResult() {
    const p = personal(d().profile);
    if (!p) return null;
    const warnings = ['estimate', ...(p.healthFlags ?? [])];
    if (p.ageYears < 18) {
      return {
        ok: false,
        kcal: null,
        protein: null,
        carbs: null,
        fat: null,
        fiber: null,
        warnings: ['minor', 'no_targets'],
        effectiveGoal: 'maintain',
      };
    }
    const m = rules.bmr.mifflinStJeor;
    const bmr =
      m.perKg * p.weightKg + m.perCm * p.heightCm + m.perYear * p.ageYears + m.constant[p.sex];
    const factor = rules.activityLevels.find((a) => a.id === p.activity)?.factor ?? 1.375;
    const tdee = bmr * factor;
    const dir = rules.goals.find((g) => g.id === p.goal)?.direction ?? 0;
    let delta = (dir * (p.rateKgPerWeek ?? 0) * rules.energy.kcalPerKgBodyWeight) / 7;
    delta = Math.max(delta, -tdee * 0.25);
    const kcal = Math.round((tdee + delta) / 10) * 10;
    const gPerKg =
      (d().targetPrefs?.proteinGPerKg ??
        rules.protein.gPerKgPrw[p.lifts ? 'lift' : 'noLift'][p.goal]) ||
      1;
    const protein = Math.round(gPerKg * p.weightKg);
    const fat = Math.round((kcal * ((d().targetPrefs?.fatPct ?? 30) / 100)) / 9);
    const carbs = Math.round((kcal - 4 * protein - 9 * fat) / 4);
    const fiber = Math.round(Math.max(rules.fiber.minG, (kcal / 1000) * rules.fiber.gPer1000Kcal));
    if (carbs < rules.carbs.noteBelowG) warnings.push('low_carbs');
    return {
      ok: true,
      kcal,
      protein,
      carbs,
      fat,
      fiber,
      bmr,
      tdee,
      warnings,
      effectiveGoal: p.goal,
    };
  }
  function targets() {
    const r = targetResult();
    const o = d().targetOverrides ?? {};
    let base = null;
    if (r)
      base = r.ok
        ? { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber }
        : null;
    else if (!personal(d().profile)) base = { ...rules.skipDefaults.targets };
    if (!base) return null;
    for (const [k, v] of Object.entries(o)) if (v != null) base[k] = v;
    return base;
  }
  function targetKind() {
    const r = targetResult();
    if (r) return r.ok ? 'personal' : 'none';
    return targets() ? 'reference' : 'none';
  }
  const onboardingState = () => settings().onboarding ?? (d().profile ? 'done' : 'pending');

  // search and recents
  const searchable = foods.map((f) => ({
    food: f,
    names: [f.name, f.nameRoman, f.nameUr, ...(f.aliases ?? [])].filter(Boolean),
  }));
  function search(query, { slot = null, limit = 20 } = {}) {
    const q = normalize(query);
    if (!q) return { hits: [], hidden: [] };
    const words = q.split(' ');
    const all = [];
    for (const { food, names } of searchable) {
      let best = 0;
      let matched = '';
      for (const name of names) {
        const n = normalize(name);
        const nw = n.split(' ');
        let s = 0;
        if (n === q) s = 100;
        else if (n.startsWith(q)) s = 80;
        else if (words.every((w) => nw.some((x) => x.startsWith(w)))) s = 60;
        else if (n.includes(q)) s = 40;
        if (s > best) {
          best = s;
          matched = name;
        }
      }
      if (!best) continue;
      const r = d().recents[food.id];
      const boost = (r ? 0.5 : 0) + (slot && food.slots?.includes(slot) ? 0.25 : 0);
      all.push({ food, score: best + 19 * Math.min(1, boost), tier: 'x', matched });
    }
    all.sort((a, b) => b.score - a.score || a.matched.length - b.matched.length);
    if (!settings().halalOnly) return { hits: all.slice(0, limit), hidden: [] };
    return {
      hits: all.filter((h) => h.food.halal?.status !== 'not-halal').slice(0, limit),
      hidden: all.filter((h) => h.food.halal?.status === 'not-halal'),
    };
  }
  function portionFor(foodId) {
    const f = index.get(foodId);
    const r = d().recents[foodId];
    if (r && findServing(f, r.servingId)) return { servingId: r.servingId, qty: r.qty };
    return { servingId: defaultServing(f).id, qty: 1 };
  }
  function recents(slot, { limit = 12 } = {}) {
    return Object.entries(d().recents)
      .sort(
        ([, a], [, b]) =>
          (b.slots[slot] ?? 0) - (a.slots[slot] ?? 0) ||
          b.count - a.count ||
          (b.lastUsed > a.lastUsed ? 1 : -1),
      )
      .map(([id]) => index.get(id))
      .filter((f) => f && f.halal?.status !== 'not-halal')
      .slice(0, limit)
      .map((food) => ({ food, ...portionFor(food.id) }));
  }
  function recordUse(foodId, servingId, qty, slot, date) {
    const r = d().recents[foodId] ?? { count: 0, slots: {} };
    return {
      ...d().recents,
      [foodId]: {
        servingId,
        qty,
        count: r.count + 1,
        lastUsed: date,
        slots: { ...r.slots, [slot]: (r.slots[slot] ?? 0) + 1 },
      },
    };
  }

  // helpers for actions
  function withDays(changes) {
    const days = { ...d().days };
    for (const [date, dy] of Object.entries(changes)) {
      if (dy.entries.length) days[date] = dy;
      else delete days[date];
    }
    return { ...d(), days };
  }
  const statusForAdd = (date) => (date > today() ? 'planned' : 'eaten');
  const statusForCopy = (date) => (date < today() ? 'eaten' : 'planned');
  const mapEntries = (date, fn) => ({ ...day(date), entries: day(date).entries.map(fn) });
  const copyEntry = (e, slot, status) => ({
    id: makeId(),
    slot,
    foodId: e.foodId,
    servingId: e.servingId,
    qty: e.qty,
    status,
    snapshot: e.snapshot,
  });

  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    flush() {},

    today,
    defaultSlot: () => slotForTime(minutes()),
    clockDate: () => localISO(now()),
    settings,
    slots: () => SLOT_IDS.map((id) => ({ id, label: slotLabel(id) })),
    slotLabel,
    onboardingState,
    needsOnboarding: () => onboardingState() === 'pending',
    targetResult,
    targets,
    targetKind,
    targetInfo() {
      const kind = targetKind();
      const s = rules.skipDefaults ?? {};
      if (kind === 'reference') return { kind, chip: s.chip, label: s.label, prompt: s.prompt };
      return { kind, chip: kind === 'personal' ? 'Estimate' : null, label: null, prompt: null };
    },
    hideCaloriesOffered: () => (d().profile?.healthFlags ?? []).includes('eating_disorder'),
    day,
    loggedDates: () => Object.keys(d().days).sort(),
    totals: (date) => ({
      eaten: dayTotals(day(date), 'eaten'),
      planned: dayTotals(day(date), 'planned'),
      all: dayTotals(day(date), 'all'),
    }),
    left: (date) => progress(dayTotals(day(date), 'eaten').total, targets()),
    week(date) {
      const ws = settings().weekStartsOn ?? 1;
      const start = addDays(date, -((dow(date) - ws + 7) % 7));
      const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      const t = targets();
      const rows = dates.map((dt) => {
        const total = dayTotals(day(dt), 'all').total;
        const pct = {};
        for (const k of KEYS) pct[k] = t?.[k] ? (total[k] / t[k]) * 100 : null;
        return { date: dt, total, entries: day(dt).entries.length, pct };
      });
      const logged = rows.filter((r) => r.entries > 0);
      const average = zero();
      for (const r of logged) for (const k of KEYS) average[k] += r.total[k] / logged.length;
      return { dates, rows, average };
    },
    food: (id) => index.get(id),
    // Sprint 2 read-only stand-ins (meal prep lives in the real store; the harness shows none).
    recipes: () => [],
    recipe: () => null,
    library: () => [],
    batches: () => [],
    boxesLeft: () => 0,
    boxCounts: () => ({ available: 0, placed: 0, toEat: 0, eaten: 0, discarded: 0 }),
    weekShopping: () => ({ batches: [], list: null }),
    boxInfo: () => null,
    prepNotices: () => ({ moveTonight: [] }),
    chai: () => null,
    savedMeals: () => [],
    // Sprint 3 read-only stand-ins (weight log, spare boxes, meal names).
    spareBoxes: () => [],
    // Sprint 3 wave 2 stand-ins: no tips, Ramadan mode off (read-only harness).
    dayPreset: () => d().settings?.slotPreset ?? 'default',
    proteinTip: () => null,
    tipsOn: () => true,
    markTipShown() {},
    tipNotToday() {},
    setTipsOn() {},
    ramadan: () => ({
      on: false,
      startDate: null,
      defaultStart: rules.ramadan?.timetables?.barcelona2027?.expectedFirstFast ?? null,
      range: null,
      isDay: false,
      typed: { fajr: null, maghrib: null },
      times: { fajr: null, maghrib: null, source: { fajr: null, maghrib: null }, place: null },
      dayStart: 240,
      notes: [],
      fluids: null,
      fluidsSlots: [],
      fluidsHidden: false,
      notRulings: rules.ramadan?.text?.notRulings ?? '',
      timesNote: '',
      edit: { offset: null, perDay: false },
      offsets: { fajr: 0, maghrib: 0 },
      days: [],
    }),
    setRamadanMode() {},
    setRamadanDay() {},
    hideFluidsToday() {},
    weights: () => [],
    weightOn: () => null,
    weightTrend: () => ({
      ready: false,
      points: [],
      latest: null,
      weeklyRateKg: null,
      spanDays: 0,
      suggestion: null,
    }),
    mealNameSets: () => [],
    mealNameSet: () => null,
    variants(foodId) {
      const f = index.get(foodId);
      if (!f.family) return [f];
      const order = ['home', 'home-light', 'restaurant', 'dhaba', 'street'];
      return foods
        .filter((x) => x.family === f.family)
        .sort((a, b) => order.indexOf(a.style) - order.indexOf(b.style));
    },
    portionFor,
    search,
    recents,
    exportText: () =>
      JSON.stringify(
        { kind: 'katori-backup', schemaVersion: 1, exportedAt: 'fake', data: d() },
        null,
        1,
      ),
    previewImport(text) {
      if (!String(text).trim()) return { ok: false, error: 'EMPTY' };
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, error: 'NOT_JSON' };
      }
      const doc = parsed.kind === 'katori-backup' ? parsed.data : parsed;
      if (!doc || typeof doc !== 'object' || !doc.days) return { ok: false, error: 'NOT_KATORI' };
      const dates = Object.keys(doc.days).sort();
      return {
        ok: true,
        data: doc,
        summary: {
          days: dates.length,
          entries: dates.reduce((n, dt) => n + doc.days[dt].entries.length, 0),
          customFoods: doc.customFoods?.length ?? 0,
          firstDate: dates[0] ?? null,
          lastDate: dates.at(-1) ?? null,
        },
      };
    },

    completeOnboarding(profile, prefs = null) {
      commit({
        ...d(),
        profile,
        targetPrefs: prefs ?? d().targetPrefs,
        settings: { ...settings(), onboarding: 'done' },
      });
    },
    skipOnboarding() {
      commit({ ...d(), profile: null, settings: { ...settings(), onboarding: 'skipped' } });
    },
    setProfile(profile) {
      commit({ ...d(), profile, settings: { ...settings(), onboarding: 'done' } });
    },
    setTargetPrefs(prefs) {
      commit({ ...d(), targetPrefs: { ...d().targetPrefs, ...prefs } });
    },
    setTargetOverride(key, value) {
      const o = { ...d().targetOverrides };
      if (value == null) delete o[key];
      else o[key] = value;
      commit({ ...d(), targetOverrides: o });
    },
    updateSettings(patch) {
      commit({ ...d(), settings: { ...settings(), ...patch } });
    },
    addFood({ date, slot, foodId, servingId = null, qty = null, status = null }) {
      const f = index.get(foodId);
      if (!f) throw new Error(`Unknown food: ${foodId}`);
      const p = servingId ? { servingId, qty: qty ?? 1 } : portionFor(foodId);
      if (!(p.qty > 0)) throw new RangeError('qty must be > 0');
      const entry = {
        id: makeId(),
        slot,
        foodId,
        servingId: p.servingId,
        qty: p.qty,
        status: status ?? statusForAdd(date),
        snapshot: snapshot(f, p.servingId, p.qty),
      };
      const next = withDays({ [date]: { ...day(date), entries: [...day(date).entries, entry] } });
      next.recents = recordUse(foodId, p.servingId, p.qty, slot, date);
      commit(next);
      return entry.id;
    },
    quickAdd({ date, slot, name, nutrients, status = null }) {
      const entry = {
        id: makeId(),
        slot,
        foodId: null,
        servingId: null,
        qty: 1,
        status: status ?? statusForAdd(date),
        snapshot: { name, grams: null, ...zero(), ...nutrients },
      };
      commit(withDays({ [date]: { ...day(date), entries: [...day(date).entries, entry] } }));
      return entry.id;
    },
    updateEntry(date, entryId, patch) {
      commit(
        withDays({
          [date]: mapEntries(date, (e) => {
            if (e.id !== entryId) return e;
            const next = { ...e, ...patch };
            const f = next.foodId ? index.get(next.foodId) : null;
            if (f) next.snapshot = snapshot(f, next.servingId, next.qty);
            return next;
          }),
        }),
      );
    },
    setEntryStatus(date, entryId, status) {
      commit(
        withDays({ [date]: mapEntries(date, (e) => (e.id === entryId ? { ...e, status } : e)) }),
      );
    },
    switchVariant(date, entryId, foodId) {
      const nf = index.get(foodId);
      commit(
        withDays({
          [date]: mapEntries(date, (e) => {
            if (e.id !== entryId) return e;
            const old = index.get(e.foodId);
            if (findServing(nf, e.servingId)) {
              return { ...e, foodId, snapshot: snapshot(nf, e.servingId, e.qty) };
            }
            const grams = findServing(old, e.servingId).grams * e.qty;
            return { ...e, foodId, servingId: 'g', qty: grams, snapshot: snapshot(nf, 'g', grams) };
          }),
        }),
      );
    },
    setSlotStatus(date, slot, status) {
      commit(
        withDays({ [date]: mapEntries(date, (e) => (e.slot === slot ? { ...e, status } : e)) }),
      );
    },
    removeEntry(date, entryId) {
      const e = day(date).entries.find((x) => x.id === entryId);
      commit(
        withDays({
          [date]: { ...day(date), entries: day(date).entries.filter((x) => x.id !== entryId) },
        }),
        `Deleted ${e.snapshot.name}`,
      );
    },
    moveEntry(date, entryId, toDate) {
      const e = day(date).entries.find((x) => x.id === entryId);
      if (toDate === date) return;
      commit(
        withDays({
          [date]: { ...day(date), entries: day(date).entries.filter((x) => x.id !== entryId) },
          [toDate]: { ...day(toDate), entries: [...day(toDate).entries, e] },
        }),
        `Moved ${e.snapshot.name} to ${toDate}`,
      );
    },
    copySlot({ fromDate, fromSlot, toDate, toSlot, status = null }) {
      const st = status ?? statusForCopy(toDate);
      const add = day(fromDate)
        .entries.filter((e) => e.slot === fromSlot)
        .map((e) => copyEntry(e, toSlot, st));
      commit(
        withDays({ [toDate]: { ...day(toDate), entries: [...day(toDate).entries, ...add] } }),
        `Copied ${slotLabel(fromSlot)}`,
      );
    },
    copyDay({ fromDate, toDate, status = null }) {
      const st = status ?? statusForCopy(toDate);
      const add = day(fromDate).entries.map((e) => copyEntry(e, e.slot, st));
      commit(
        withDays({ [toDate]: { ...day(toDate), entries: [...day(toDate).entries, ...add] } }),
        `Copied ${fromDate}`,
      );
    },
    undo() {
      if (!undoSnapshot) return false;
      const prev = undoSnapshot;
      undoSnapshot = null;
      setState({ data: prev, undo: null });
      return true;
    },
    dismissUndo() {
      undoSnapshot = null;
      if (state.undo) setState({ undo: null });
    },
    importText(text, mode = 'replace') {
      const p = this.previewImport(text);
      if (!p.ok) return p;
      const next = mode === 'merge' ? { ...d(), days: { ...d().days, ...p.data.days } } : p.data;
      commit(next, mode === 'merge' ? 'Merged backup' : 'Imported backup');
      return { ok: true, summary: p.summary };
    },
    resetData() {
      commit(fakeDefaultData({ timeZone, rules }), 'Reset all data');
    },
  };
}
