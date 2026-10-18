# Katori: Architecture and engineering contract

**Owner:** Lena Hoffmann (Lead Software Engineer). **Status:** Sprint 1, Step 0 (2026-10-13).
**Binding inputs:** `team/meetings/001-kickoff.md` and `team/meetings/002-boss-update.md`
(decisions), `docs/NUTRITION.md` and
`app/data/rules.js` (every nutrition rule and constant; Ayesha), `docs/CUSTOMER.md` (acceptance
tests A1–A15; Bilal).

This document is the contract between the engineers (Hamza: core, Priya: UI, Kenji: QA, Lena:
shell, store, router and integration) and the Nutrition Lab. The code stubs in `app/core/` carry
the same signatures as JSDoc. `tests/contract/` enforces the exported names, the arities and the
agreement between `rules.js` and the core. If this document and a stub disagree, ask Lena. Do not
pick one.

---

## 1. Principles

1. **Least code.** No framework, no build step and no runtime dependencies. Plain ES modules and
   modern CSS. A library needs a written case here and an exact pinned version on cdnjs or jsdelivr.
2. **Pure core, thin UI.** `app/core/` is pure: no DOM, no storage, no clock and no randomness
   (ESLint enforces this). Time (`now`) and ids (`makeId`) are passed in. Everything in the core
   runs in Node with `node --test`.
3. **Immutable data.** Core functions return new objects and never mutate their inputs. Undo works
   by keeping the previous object.
4. **Numbers are unrounded until display.** Sums use full precision. Rounding happens only in the
   view, or where `docs/NUTRITION.md` says (targets).
5. **Dates are local `YYYY-MM-DD` strings.** Never call `toISOString()` in `app/` (ESLint bans it).
6. **Nothing leaves the device.** No network requests other than our own static files.
7. **Independent testing.** Nobody is the only tester of their own code (§10.4).

## 2. Runtime constraints

The same files must run in two places:

- **From the repo**, with `npm run serve` (http-server on `app/`, port 4173).
- **As a claude.ai Artifact.**
  - Requests to other hosts fail.
  - External scripts may come only from cdnjs, jsdelivr or unpkg, at exact versions, and fonts only
    from Google Fonts. We currently use neither.
  - There are no service workers.
  - `alert`, `confirm` and `prompt` do nothing, and ESLint bans them. Use `<dialog>` and toasts.
  - `<a download>` does nothing. Export goes through a textarea, with a Copy button.
  - `localStorage` may be empty or may throw. Every access goes through `core/storage.js` with an
    injected backend.
- **Layout:** works at 360–400 px with no horizontal scroll, in light and dark mode, with 44 px
  touch targets.

## 3. Layout and ownership

```
app/
  index.html               Lena    shell page; relative URLs only
  main.js                  Lena    boot: data load, store, router, view mounting
  core/                    Hamza   PURE modules (§5); types.js (JSDoc only) is Lena's contract file
    types.js units.js dates.js foods.js days.js targets.js search.js storage.js
  ui/
    store.js               Lena    app state + actions + persistence wiring (§7.3)
    router.js              Lena    hash routes (§7.2)
    dom.js                 Priya   tiny DOM helper (§7.5)
    dev/                   Priya   harness page and fake store for building views (never published)
    components/*.js        Priya   totals bar, slot section, entry row, add sheet, portion picker,
                                   variant switch, food details/source, dialog, toast, banner
    views/*.js             Priya   welcome, day (also handles the add route), week, profile, data, about
  styles/                  Priya   tokens.css (theme tokens), base.css, more files as needed
  data/                    Lab     index.js, rules.js, foods-*.js (pure data; §6)
tests/
  contract/                Lena    exports.test.js, rules.test.js (this contract, enforced)
  unit/dev/                Hamza   the author's own tests (store.test.js and router.test.js: Lena)
  unit/qa/                 Kenji   tests written from this document and NUTRITION.md
  data/                    Kenji   the data gate (every record in app/data)
  e2e/                     Kenji   Playwright specs (A1–A15 scripted)
  fixtures/                Kenji   foods.js (16 fixture records), index.js ({ RULES, FOODS })
package.json, eslint.config.js, .prettierrc.json, .prettierignore     Lena
playwright.config.js                                                  Kenji
docs/ARCHITECTURE.md                                                  Lena
```

Only edit files you own. If you need a change elsewhere, ask the owner through Lena.

## 4. Data model

The JSDoc typedefs are in `app/core/types.js`; this section is the summary.

### 4.1 Nutrients

`Nutrients = { kcal, protein, carbs, fat, fiber }`. All values are grams except kcal. `carbs` means
**available** carbohydrate, with fibre excluded. Core functions return exactly these five keys.
The optional `sugars`, `satFat` and `sodium` (mg) live only in `food.per100g` and are shown in food
details. They are not summed in v1.

### 4.2 Food record (reconciled at the kickoff, decision 7)

| Field | Status | Type and rule |
|---|---|---|
| `id` | HARD | kebab-case, unique, **permanent**, prefix `pk-`, `es-`, `med-` or `intl-` (`my-` reserved for user foods) |
| `name` | HARD | English display name |
| `nameUr` | soft (Lab-required for `pk-`) | Urdu script; shown with `lang="ur" dir="rtl"` |
| `nameRoman` | soft (Lab-required for `pk-`) | Roman Urdu; searched |
| `aliases` | HARD | `string[]` (may be empty): spellings, plurals, Urdu script, Spanish, English |
| `group` | HARD | an id from `RULES.vocab.groups`; drives the data gate's kcal and serving ranges |
| `state` | HARD (Lab) | what the numbers describe ("cooked, as served with gravy"); shown in details |
| `style` | soft | `home`, `restaurant`, `dhaba` or `street` (`RULES.vocab.styles`) |
| `family` | soft (Lab-required when `style` is set) | shared id that links style variants of one dish; drives the variant switch |
| `per100g` | HARD | `{ kcal, protein, carbs, fat, fiber }` required, all ≥ 0; kcal whole, macros to 0.1 g; optional `sugars`, `satFat`, `sodium` |
| `addedFatPer100g` | soft (Lab-required when `source.method` is `recipe`) | grams of oil or ghee per 100 g as served, ≤ `per100g.fat` |
| `servings` | HARD | `[{ id, label, labelUr?, grams, default? }]`, ≥ 1, ids unique within the food, never `'g'`, exactly one `default: true`, grams > 0 |
| `tags` | HARD | ids from `RULES.vocab.tags` (cuisine incl. `catalan`, diet, seafood, `meal-prep`, `eat-cold`, …); `RULES.vocab.tagRules` apply. **No halal tags** any more. |
| `halal` | HARD (meeting 002) | `{ status: 'halal'\|'check'\|'not-halal', reason? }`; `reason` required unless `halal` (`RULES.vocab.halalStatuses`). `not-halal` is only for non-meat foods whose standard recipe has lard (`RULES.vocab.halalRules.notHalal`). |
| `slots` | soft | meal-slot hints: ids from `RULES.mealSlots.default` or `.ramadan`; used to rank search |
| `source` | HARD `citation` (Lab: method, confidence, reviewer, date too) | `{ citation, method, confidence: 'A'\|'B'\|'C', reviewer, date, notes? }`; A only with `direct`; C shows an "estimate" badge |

The full record rules (Lab-required fields included) are `docs/NUTRITION.md` §3. The code needs
only the HARD column; the data gate enforces all of §3 and §8.

Rules the code depends on:

- **Values** are per 100 g as eaten.
- **Volume:** the code never converts volume to mass. Every serving states its grams.
- **Variants:** each one is a full record. Variants in a family should share serving ids for the
  same vessel (`katori`, `plate`) so the variant switch keeps the portion.
- **v1 content:** no pork meat products and no alcohol (`RULES.vocab.banned`). A few `not-halal`
  non-meat foods (e.g. ensaïmada) exist so search can explain instead of showing nothing; they are
  never suggested (recents, templates, recipe pickers) and "Halal only" hides them.
- **Lunch boxes** (meeting 002, decision 8): group `lunchbox`, serving id `box` (`foods.BOX`), in
  `app/data/foods-mealprep.js`. They are ordinary foods in Sprint 1.

### 4.3 Entries and days

```js
Entry = { id, slot, foodId, servingId, qty, status, snapshot }
  slot      'breakfast'|'lunch'|'evening'|'dinner'|'snacks'
  foodId    string, or null for a quick add
  servingId a serving id, 'g' (qty is grams), or null for a quick add
  qty       finite and > 0; fractions allowed (0.5 plate, 1.5 katori, 0.33)
  status    'planned'|'eaten'
  snapshot  { name, grams|null, kcal, protein, carbs, fat, fiber }, taken when logged
Day = { date: 'YYYY-MM-DD', entries: Entry[] }   // entries in display order
```

- **Totals** use the live food database, so the Lab's corrections reach past days.
- **The snapshot** is used only when `foodId` is missing from the index (a deleted food, or a quick
  add). It also keeps exports self-contained.
- **Logical day** (Manager decision, `team/DECISIONS.md`): the logging day starts at **04:00**
  (`settings.dayStartMinutes = 240`, adjustable 00:00–05:00). An entry's date is
  `todayISO(now, settings.dayStartMinutes)`, so food eaten between midnight and 03:59 belongs to the
  previous day, on every preset. Any entry can be moved to another day in one tap. Ramadan mode
  (Sprint 3) gets its own boundary.
- **Sprint 2** adds one optional field, `boxRef: { batchId, boxId }`, for a box placed from a
  meal-prep batch (§13). Sprint 1 code must therefore keep unknown entry fields in `updateEntry` and
  `switchEntryFood`, while `copySlot` and `copyDay` copy only the §4.3 fields (a box cannot be in
  two places).

### 4.4 Profile and targets (kickoff decision 6)

```js
Profile = { sex: 'male'|'female', ageYears, heightCm, weightKg, bodyFatPct?,
            activity: 'sedentary'|'light'|'moderate'|'very_active'|'extra_active',
            goal: 'lose'|'maintain'|'gain', rateKgPerWeek, lifts: boolean, healthFlags: string[] }
TargetPrefs  = { proteinGPerKg?: number|null, fatPct?: number|null }   // NUTRITION.md §2.1
TargetResult = { ok, kcal, protein, carbs, fat, fiber, bmr, tdee, bmi, prw, bmrFormula,
                 effectiveGoal, energyDelta, effectiveRateKgPerWeek, warnings[] }   // §2.2
```

- `healthFlags` holds ids from `RULES.healthFlags`: `pregnant`, `breastfeeding`, `eating_disorder`,
  `kidney_disease` and `diabetes_hypo_risk` at Step 0.
- Derived flags (`minor`, `underweight`, `age_over_80`) are computed and never stored.
- `warnings` starts with `'estimate'` when `ok`, then holds the `RULES.warnings` codes that fired
  and the ids of active flags. Compare it as a set after `'estimate'`. The UI shows the RULES text
  (codes) or the flag's `note` (flag ids).
- "Offer to hide calories" is derived from the result: some active flag in `warnings` has
  `effect.offerHideCalories` (store selector `hideCaloriesOffered()`).
- Targets are always labelled as estimates.

### 4.5 UserData: the persisted document (`localStorage['mmc.v1']`)

```js
UserData = {
  schemaVersion: 1,
  profile: Profile | null,                 // null until onboarding is done or skipped
  targetPrefs: TargetPrefs,
  targetOverrides: Partial<Nutrients>,     // manual numbers; each wins for its key
  settings: {
    slotPreset: 'default'|'spain',         // RULES.mealSlotPresetDefault picks it from the time zone
    slotLabels: { [slot]: string },        // user renames; a missing key = the preset's label
    halalOnly: boolean,                    // default RULES.vocab.halalRules.halalOnlyFilterDefault (true)
    seafood: 'all'|'fish-prawns'|'fish-only',   // reserved; the question is Sprint 2
    dayStartMinutes: number,               // 240 (04:00) by default; 0..300 (team/DECISIONS.md)
    onboarding: 'pending'|'done'|'skipped',  // Skip = reference targets (NUTRITION.md §2.1a)
    units: { weight: 'kg'|'lb', height: 'cm'|'ftin' },
    weekStartsOn: 0|1|6, theme: 'system'|'light'|'dark', hideCalories: boolean,
  },
  days: { [date]: Day },                   // days with no entries may be absent
  customFoods: Food[],                     // empty in Sprint 1
  recents: { [foodId]: { servingId, qty, count, lastUsed, slots: { [slot]: count } } },
  recipes: [],                             // reserved for Sprint 2 (§13); always [] in Sprint 1
  batches: [],                             // reserved for Sprint 2 (§13); always [] in Sprint 1
}
```

A user who taps Skip at onboarding gets the Lab's defaults. The UI then stores a profile built
from `RULES.defaultGoal`, `RULES.defaultActivity` and the defaults in `docs/NUTRITION.md`.
Until NUTRITION.md defines that profile, the onboarding view asks Lena.

## 5. Core contracts (`app/core/`, owner Hamza)

These rules apply to every function:

- **Pure.** No mutation of arguments, no I/O, no clock and no randomness.
- **Options objects** default to `= {}`, so `Function.length` counts only the required parameters.
  `tests/contract/exports.test.js` checks this.
- **Bad input** throws `RangeError` (bad numbers or enums) or `TypeError` (wrong shapes), unless the
  function's doc says it never throws (validators, persistence).
- **Rounding** happens only where stated.

### 5.1 `units.js`

| Export | Contract |
|---|---|
| `MASS_UNITS` | frozen `{ g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 }` |
| `toGrams(amount, unit)` | mass units only; `RangeError` on an unknown unit or a negative or non-finite amount |
| `kgFromLb(lb)`, `lbFromKg(kg)` | unrounded |
| `cmFromFtIn(ft, inches = 0)` | unrounded cm |
| `ftInFromCm(cm)` | `{ ft, inches }` in whole inches, carried (182.88 → `{6, 0}`) |
| `round(value, decimals = 0)` | `Math.round` semantics (halves go up), exact for decimal halves (`round(1.005, 2) === 1.01`), negative decimals allowed (`round(2155, -1) === 2160`) |
| `formatQty(qty)` | `0.5 → '½'`, `1.5 → '1½'`, `0.25 → '¼'`, `0.75 → '¾'`, `2 → '2'`, `0.33 → '0.33'` |

### 5.2 `dates.js`

All values are local calendar dates. Do the day arithmetic on UTC midnights internally, so DST never
moves a day. Tests run in **Europe/Madrid (primary, where the Boss lives)**, Asia/Karachi and
America/Los_Angeles, and must cover **Sunday 25 October 2026**, when Madrid's clocks go back from
03:00 to 02:00 (a 25-hour day; 02:30 happens twice). LA changes on 1 November 2026.

| Export | Contract |
|---|---|
| `isISODate(v)` | true only for a real date (`2026-02-30` is false) |
| `todayISO(now, dayStartMinutes = 0)` | local *logical* date of `now`: the previous date while the local time is before `dayStartMinutes` |
| `localDateTime(now)` | local `'YYYY-MM-DDTHH:mm'` for export stamps |
| `minutesOfDay(now)` | 0–1439, local |
| `addDays(iso, n)`, `diffDays(from, to)` | whole days; `diffDays` is `to − from` |
| `dayOfWeek(iso)` | 0 is Sunday |
| `weekStart(iso, weekStartsOn = 1)`, `weekDates(iso, weekStartsOn = 1)` | week starts on Monday by default; 7 dates |
| `monthGrid(year, month, weekStartsOn = 1)` | 4–6 rows of 7; `null` outside the month |

### 5.3 `foods.js`

| Export | Contract |
|---|---|
| `NUTRIENT_KEYS`, `STYLES`, `GRAMS = 'g'`, `BOX = 'box'` | frozen constants |
| `HALAL_STATUSES` | `['halal', 'check', 'not-halal']`, best to worst; binding (meeting 002); must equal `RULES.vocab.halalStatuses` ids |
| `validateFood(food, rules = null)` | never throws; `string[]` of problems. Checks the HARD fields structurally (including `halal`), and with `rules` also vocabulary membership (`vocab.groups`, `vocab.tags`, `vocab.styles`, `mealSlots.default`, `vocab.sourceMethods`, `vocab.confidenceGrades`). Numeric plausibility is the data gate's job (§10). |
| `buildFoodIndex(...lists)` | `Map` id → food; throws on a duplicate id |
| `defaultServing(food)`, `findServing(food, id)` | `findServing(food, 'g')` → `{ id: 'g', label: 'g', grams: 1 }`; an unknown id gives `null` |
| `gramsForPortion(food, servingId, qty)` | `serving.grams × qty`; `RangeError` on an unknown serving or `qty <= 0` or a non-finite qty |
| `nutrientsForGrams(food, grams)`, `nutrientsForPortion(food, servingId, qty)` | `per100g[k] × grams / 100` for the five keys; unrounded |
| `sumNutrients(list)`, `scaleNutrients(n, f)` | key-wise; `[]` gives zeros |
| `energyCheck(per100g, rules)` | `computed = Σ RULES.energy.factors[k] × per100g[k]`; `ok` when `\|stated − computed\| ≤ max(stated × tolerance.pct / 100, tolerance.kcal)` |
| `variantsOf(food, index)` | same-`family` records, including `food`, ordered by `STYLES` then name; `[food]` when there is no family |

### 5.4 `days.js`

| Export | Contract |
|---|---|
| `SLOT_IDS`, `DEFAULT_SLOT_LABELS` | binding (kickoff decision 5); must equal `RULES.mealSlots.default` |
| `emptyDay(date)` | `{ date, entries: [] }` |
| `createEntry({ id, slot, food, servingId, qty, status = 'eaten' })` | builds the snapshot |
| `createQuickEntry({ id, slot, name, nutrients, status = 'eaten' })` | `foodId: null`, `servingId: null`, `qty: 1`; missing macros become 0 |
| `entryNutrients(entry, index)`, `entryGrams(entry, index)` | live values first, then the snapshot; grams are `null` for a quick add |
| `addEntry(day, entry)` | appends; throws on a duplicate id |
| `updateEntry(day, entryId, patch, index)` | patch may set `qty`, `servingId`, `status` or `slot`; refreshes the snapshot; an unknown id gives an unchanged copy |
| `removeEntry(day, entryId)` | returns the new day; undo means restoring the old Day object |
| `switchEntryFood(entry, newFood, index)` | keeps `servingId` and `qty` when the new food has that serving; otherwise keeps the grams (`servingId 'g'`) |
| `setSlotStatus(day, slot, status)` | ticks a whole meal (A12) |
| `copySlot(fromDay, fromSlot, toDay, toSlot, makeId, { status = 'planned' } = {})` | appends copies with fresh ids |
| `copyDay(fromDay, toDay, makeId, { status = 'planned' } = {})` | appends copies of every entry in the same slots (A5 b) |
| `dayTotals(day, index, { include = 'all' } = {})` | `include`: `'all'`, `'eaten'` or `'planned'`; `{ total, bySlot }` with every slot present |
| `progress(total, targets)` | per key `{ value, target, pct, remaining }`; `pct` and `remaining` are `null` when the target is missing or 0 |
| `weekSummary(daysByDate, dates, index, targets)` | one row per date `{ date, total, entries, pct }`; a missing day gives zeros |
| `averageTotals(rows)` | mean over rows with `entries > 0` |
| `slotForTime(minutes, rules, preset = 'default')` | uses `RULES.mealSlots[preset][].hours = [start, end)` in minutes, which may wrap; falls back to `'snacks'` |

### 5.5 `targets.js`

The algorithm (§2.2 steps 1–12), its rounding (§2.6) and its **binding test vectors A–K (§2.7)**
are exactly `docs/NUTRITION.md`. Every constant comes from RULES; the code holds no nutrition
numbers. Rounded outputs must match exactly, unrounded ones to ±0.01, and warnings as a set.
Examples: A = 2160 kcal, 156 / 72 / 222 / 30 g (P / F / C / fibre); C = 2220 kcal, 156 / 74 / 233 /
31 g (the half-up tie test); I (age 16) gives `ok: false` with warnings `minor` and `no_targets`;
K applies prefs `{ proteinGPerKg: 2.2, fatPct: 25 }`.

| Export | Contract |
|---|---|
| `ACTIVITY_LEVELS`, `GOALS` | binding enums; must equal the RULES ids |
| `bmi(kg, cm)`, `proteinReferenceWeight(kg, cm, rules)`, `bmr(profile, rules)` | unrounded building blocks; `bmr` returns `{ value, formula: 'mifflin'\|'katch' }` |
| `validateProfile(profile, rules)` | never throws; checks types, enums, `profileLimits`, `appliesToSex` and allowed rates |
| `computeTargets(profile, rules, prefs = {})` | `TargetResult` (§4.4); `ok: false` with null targets when a `noTargets` effect applies (minor) |
| `resolveTargets(computed, overrides)` | overrides win per key; `null` when `!computed.ok` |

### 5.6 `search.js`

| Export | Contract |
|---|---|
| `TIERS`, `BOOST_WEIGHT = 19` | `{ exact 100, prefix 80, wordPrefix 60, substring 40, fuzzy 20 }`; a boost never crosses a tier |
| `normalize(text)` | lowercase; NFKD with combining marks stripped, so accents fold (`ensaïmada`, `pa amb tomàquet`, `café con leche`, `ñ`, `ç`); the Catalan middle dot `·` deleted (`col·liflor` → `colliflor`); Arabic harakat stripped; ي→ی, ك→ک, ة→ہ; other punctuation becomes a space; Latin `aa→a`, `ee→i`, `oo→u`; whitespace collapsed and trimmed |
| `buildSearchIndex(foods)` | indexes `name`, `nameRoman`, `nameUr` and `aliases` |
| `searchFoods(index, query, { limit = 20, boosts = {}, halalOnly = true, hints = [] } = {})` | returns `{ hits, hidden }`. Best tier per food. Substring needs a query of 4+ characters. Fuzzy (Review 1, meeting 003 item 8) only fills in when the other tiers match fewer than 3 foods and none exactly (Bilal R3: "kela", "pulpo" are names, not typos); each query word of 4+ characters must share its first letter with a name word and be within Damerau-Levenshtein (OSA) distance 1 of it, or, from 5 characters, of its same-length prefix. `score = tier + 19 × clamp(boost)`. Sort by score, then shorter `matched`, then style (no style or `home` first, then `restaurant`, `dhaba`, `street`; item 2), then a food whose own name starts with the query (Bilal R3: "salad" lists Salad leaves before a dish with only a "salad" alias), then ids in `hints` first (the slot's meal hints), then name. With `halalOnly`, `not-halal` matches go to `hidden` (the UI says "1 hidden: not halal" and shows the reason); `check` stays in `hits`. A blank query gives no hits. |
| `recordUse(recents, { foodId, servingId, qty, slot, date })` | adds 1 to `count` and to `slots[slot]`; sets `lastUsed`; remembers the last serving and qty (the one-tap "+") |
| `recencyBoosts(recents, today)` | `0.5·min(1, count/10) + 0.5·max(0, 1 − daysSince/30)` |
| `recentForSlot(recents, slot, { limit = 12 } = {})` | **every** recent food; ones used in `slot` first (A6) |

Performance budget: `searchFoods` takes under 16 ms per call on 2,000 foods, and Kenji measures it.
Acceptance: A2, A3 and A19 in `docs/CUSTOMER.md` (roti, chapati, phulka, dal, dhal, دال, anday,
karhai, lentejas, and Barcelona café food by its Catalan, Spanish or English name).

### 5.7 `storage.js`

| Export | Contract |
|---|---|
| `STORAGE_KEY = 'mmc.v1'`, `SCHEMA_VERSION = 1`, `EXPORT_KIND = 'katori-backup'` | |
| `defaultData({ timeZone, rules } = {})` | a fresh `UserData`. With `rules`, `slotPreset` comes from `RULES.mealSlotPresetDefault` (Madrid, Ceuta and the Canaries → `spain`), `halalOnly` and `seafood` from `RULES.vocab.halalRules`. |
| `createPersistence(backend, { stamp } = {})` | never throws. `load()` gives `{ data, status }`, where status is one of the five below. `save(data)` gives `{ ok, error? }` and refuses when the status is `future`. |
| `migrate(raw)` | upgrades older versions and fills defaults; throws with `.code` `FUTURE_VERSION` or `INVALID` |
| `validateUserData(data)` | `string[]` |
| `serializeExport(data, exportedAt)` | JSON `{ kind, schemaVersion, exportedAt, data }` |
| `parseImport(text)` | also accepts a bare `UserData`; error codes are `EMPTY`, `NOT_JSON`, `NOT_KATORI`, `FUTURE_VERSION` and `INVALID`; on success, `summary` gives `{ days, entries, customFoods, firstDate, lastDate }` |
| `mergeImport(current, incoming, mode)` | `'replace'` takes the incoming data. `'merge'` unions days and, within a date, entries by id (incoming wins). It keeps the current profile and settings unless the current profile is `null`, unions custom foods, and for recents keeps the larger `count` and the later `lastUsed`. |

The five `load()` statuses:

- `ok`: the document loaded.
- `empty`: nothing has been saved yet.
- `unavailable`: there is no backend, or it throws.
- `corrupt`: the raw text is kept under `mmc.v1.corrupt.<stamp>` and defaults are returned.
- `future`: the document is from a newer version. Defaults are returned and saving is refused.

## 6. Data module contract (`app/data/`, owner: Nutrition Lab)

- `app/data/index.js` exports `RULES` (the default export of `rules.js`) and `FOODS` (one flat array
  of every record from every `foods-*.js`). Ayesha owns both files.
- **Pure data only:** no functions (ESLint enforces this) and no imports other than sibling data
  files.
- **Formatting:** `app/data/` is exempt from Prettier, so the Lab keeps one record per line. It is
  still linted.
- **Fields the code reads from RULES**, enforced by `tests/contract/rules.test.js`:
  - energy: `energy.factors`, `energy.tolerance`, `energy.kcalPerKgBodyWeight`
  - profile and BMR: `profileLimits.*`, `bmr.mifflinStJeor`, `bmr.katchMcArdle`
  - activity and goals: `activityLevels[]`, `defaultActivity`, `goals[]`, `defaultGoal`, `rails`
  - protein: `proteinReferenceWeight`, `protein.gPerKgPrw`, `protein.olderAdult`,
    `protein.overrideGPerKgPrw`
  - fat, carbs and fibre: `fat`, `carbs`, `fiber`, `rounding`
  - flags and warnings: `healthFlags[]`, `derivedFlags[]`, `warnings`
  - slots: `mealSlots.default[]`, `mealSlots.spain[]` (same ids), `mealSlotPresetDefault`
  - halal: `vocab.halalStatuses`, `vocab.halalRules` (filter default, not-halal rules, seafood)
  - vocabularies: `vocab.groups`, `vocab.tags`, `vocab.tagRules`, `vocab.banned`, `vocab.styles`,
    `vocab.sourceMethods`, `vocab.confidenceGrades`

  If a renamed field breaks the contract test, the Lab and Lena fix it together.
- **Enums that must agree with the core:** activity ids = `ACTIVITY_LEVELS`; goal ids = `GOALS`;
  `mealSlots.default` ids and labels = `SLOT_IDS` and `DEFAULT_SLOT_LABELS`; `mealSlots.spain` ids =
  `SLOT_IDS`; style ids = `STYLES`; `vocab.halalStatuses` ids = `HALAL_STATUSES`.
- **`mealPrep.*`** (storage lives, thawing, box targets) is read from Sprint 2 (§13).
- **Until real data lands:** the engineers build against `tests/fixtures/index.js`. It holds the
  real RULES and 16 fixture foods, which pass every gate and are never shipped.
- **When data is missing:** the app shows "Food data is not available yet" and keeps working.

## 7. UI architecture (`app/ui/`, `app/main.js`)

### 7.1 Boot (`main.js`, Lena)

1. Render the shell: header, view container and navigation.
2. Load `./data/index.js` with a dynamic `import()`. If it fails, show a banner and use empty data.
3. Create persistence with `createPersistence(safeLocalStorage)` and `load()` it. Show the banner
   for `unavailable`, `corrupt` and `future`. A fresh document is
   `defaultData({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, rules })`.
4. Create the store with `{ persistence, rules, foods, now: () => new Date(), makeId }`. `makeId`
   uses `crypto.randomUUID()` and falls back to a counter plus the time.
5. Start the router.
6. Mount the view for the current route. If there is no profile, go to `#/welcome`.

### 7.2 Routes (`ui/router.js`, Lena)

| Hash | Route | View |
|---|---|---|
| `#/` or `#/day` | `day`, `date: null` (today) | `views/day.js` |
| `#/day/2026-10-13` | `day` | `views/day.js` |
| `#/day/2026-10-13/add/lunch` | `add` | `views/day.js` with the add sheet open (Android Back closes it) |
| `#/week`, `#/week/2026-10-13` | `week` | `views/week.js` (week plus month grid) |
| `#/welcome` | `welcome` | `views/welcome.js` (onboarding) |
| `#/profile` | `profile` | `views/profile.js` |
| `#/data` | `data` | `views/data.js` (export, import, reset, storage status) |
| `#/about` | `about` | `views/about.js` ("About the data": credits every source, kickoff decision 9) |

`parseRoute(hash)` and `formatRoute(route)` are pure. `createRouter(window)` gives
`{ current, go, href, subscribe, start, stop }`. Food details (the source, A9 and A14) and the
dialogs are overlays, not routes.

### 7.3 Store (`ui/store.js`, Lena; landed 2026-10-13)

```js
createStore({ persistence, rules, foods, foodsStatus, now, makeId, timeZone, debounceMs, timers }) → store

// state
store.getState() → { data: UserData, storageStatus, saveError, undo: { label } | null, foodsStatus }
store.subscribe((state) => void) → unsubscribe          // called after every change
store.flush()                                           // save now (main.js: pagehide, hidden tab)

// selectors (cheap; derived data is memoized)
store.today() → 'YYYY-MM-DD'               // logical day: todayISO(now(), settings.dayStartMinutes)
store.defaultSlot() → SlotId               // slotForTime(minutesOfDay(now()), rules, preset)
store.clockDate() → 'YYYY-MM-DD'           // the wall-clock date: after midnight it differs from today()
store.settings() → Settings                // with fallbacks filled in
store.slots() → [{ id, label }]            // the five slots in order, with display labels
store.slotLabel(slot) → string             // settings.slotLabels[slot] ?? the preset's label
store.onboardingState() → 'pending'|'done'|'skipped'    store.needsOnboarding() → boolean
store.targetResult() → TargetResult | null // null while sex/age/height/weight are incomplete
store.targets() → Nutrients | null         // personal, or RULES.skipDefaults reference values
store.targetKind() → 'personal'|'reference'|'none'      // 'none' e.g. for a minor
store.targetInfo() → { kind, chip, label, prompt }      // 'Estimate', or the Reference chip, line, button
store.hideCaloriesOffered() → boolean      // an active flag has effect.offerHideCalories
store.day(date) → Day                      // emptyDay when absent
store.loggedDates() → string[]             // dates with entries (month grid dots)
store.totals(date) → { eaten, planned, all }   // each { total, bySlot }
store.left(date) → progress(eaten.total, targets)  // "left" = eaten only (A7, A12)
store.week(date) → { dates, rows, average }
store.food(id) → Food | undefined          store.variants(foodId) → Food[]
store.portionFor(foodId) → { servingId, qty }   // last-used portion, else default serving × 1
store.search(query, { slot, limit }) → { hits, hidden }   // recency boosts; slot hints as `hints`
      // (a tie-break after style, so a hint never puts dhaba chai above home chai); halalOnly
store.recents(slot, { limit }) → { food, servingId, qty }[]  // never a 'not-halal' food
store.exportText() → string                store.previewImport(text) → parseImport result

// actions (each one persists: saves are debounced 300 ms and flushed on pagehide)
store.completeOnboarding(profile, prefs?)  store.skipOnboarding()   // skip = reference targets
store.setProfile(profile)  store.setTargetPrefs(prefs)  store.setTargetOverride(key, value|null)
store.updateSettings(patch)                // slotPreset, slotLabels, halalOnly, dayStartMinutes, theme…
store.addFood({ date, slot, foodId, servingId?, qty?, status? }) → entryId
      // no servingId = the "+" portion (last-used, else default; team/DECISIONS.md); default status:
      // 'planned' for a future date, otherwise 'eaten' (A12); records the use for recents
store.quickAdd({ date, slot, name, nutrients, status? }) → entryId
store.updateEntry(date, entryId, patch)    store.setEntryStatus(date, entryId, status)
store.switchVariant(date, entryId, foodId)
store.setSlotStatus(date, slot, status)
store.removeEntry(date, entryId)           // undoable
store.moveEntry(date, entryId, toDate)     // undoable; one tap from the entry row (team/DECISIONS.md)
store.copySlot({ fromDate, fromSlot, toDate, toSlot, status? })   // undoable as one step
store.copyDay({ fromDate, toDate, status? })                      // undoable as one step (A5 b)
      // copies default to 'eaten' into a past date, 'planned' into today or the future
store.undo() → boolean    store.dismissUndo()
      // undo restores the document from just before the last undoable action; any other change
      // closes the undo window. The toast shows state.undo.label for at least 5 s (A13).
store.importText(text, mode) → { ok, summary?, error? }           // undoable
store.resetData()                          // undoable
```

- **Onboarding state** is stored as `settings.onboarding` (`'pending'`, `'done'` or `'skipped'`).
  When it is missing: `'done'` if there is a profile, otherwise `'pending'`.
- **Errors:** an unknown food or entry id throws `Error`. A bad quantity throws the core's
  `RangeError`. Views validate quantities first (A8 inline errors) and never let a throw reach the
  user.
- **Tests:** the author's tests are in `tests/unit/dev/store.test.js` (Lena). Kenji tests the store
  independently.

### 7.4 Views and components (Priya)

```js
// app/ui/views/<name>.js
export function mount(container, ctx) → { update(route), unmount() }
// ctx = { store, router, rules }
```

- A view subscribes to the store in `mount` and unsubscribes in `unmount`.
- `main.js` calls `update(route)` when the route changes but the view stays the same. For example,
  day → add opens the sheet.
- Components are plain functions: `render…(props) → Element`, or `create…(props)` returning
  `{ el, update(props), destroy() }` when they hold focus or state. The add-sheet search input must
  never be re-created while the user types.
- Sprint 1 must deliver:
  - **Day view:** the sticky "kcal left" and "protein left" stay visible without scrolling at
    360 px, eaten only, with planned shown separately (A7, A12).
  - **Day view controls:** a slot "tick all"; copy yesterday or another day (A5); copy a slot.
  - **Add sheet:** recents first, one-tap "+" with the last portion (A6), search as you type, each
    result showing its default portion and kcal (A2), and an "estimate" badge on confidence C
    (A14).
  - **Halal (meeting 002):** a chip on food rows for `check` and `not-halal`, with the reason one
    tap away; a "Halal only" toggle (on by default, also in Profile); when the filter hides
    matches, a line such as "1 hidden: not halal" that reveals the reason. Calm wording, no red.
  - **Portion picker:** serving chips, a qty stepper in 0.5 steps that accepts typed decimals,
    live grams and kcal, and inline errors for 0, an empty box or a negative number (A8). It also
    holds the variant switch (A9).
  - **Food details:** the source in one tap (A9, A14).
  - **Undo toast:** at least 5 s (A13).
  - **Storage banner.**
  - **Week and month view.**
  - **Onboarding:** with Skip (A1).
  - **Profile:** includes the meal-times preset (Pakistani or Spanish), slot renaming, and "My day
    starts at" (00:00–05:00, default 04:00).
  - **Entry row:** "Move to another day" in one tap (previous day, next day or a picked date).
  - **Data:** export textarea and Copy, import by paste or file, Replace or Merge.
  - **About the data.**

### 7.5 Rendering rules

- `ui/dom.js` provides `h(tag, attrs, ...children)`. **Never put data into `innerHTML`.** Food names
  and imported text use `textContent` only.
- Display rounding (view only):
  - kcal: whole numbers.
  - grams: whole numbers at 10 g or more; one decimal under 10 g, with a trailing `.0` trimmed.
  - Quantities: `formatQty`.
  - Entry rows read like `1½ katori · 300 g`.
- All UI text is English. Food names show `name`, with `nameUr` as a right-to-left subtitle.
- **Accessibility baseline** (A15; full pass in Sprint 3):
  - semantic elements and real `<button>` elements
  - 44 × 44 px targets
  - visible focus
  - AA contrast in both themes
  - `aria-live="polite"` on the totals
  - planned and eaten differ by text or icon as well as colour
  - reduced motion respected
- **Theming:** tokens live on `:root` in `styles/tokens.css`. Dark tokens go under
  `@media (prefers-color-scheme: dark) :root:not([data-theme='light'])` and again under
  `:root[data-theme='dark']`. `body` has an explicit background. There must be no white flash.

## 8. Performance budgets

- **First render:** under 1 s on a mid-range Android (Playwright phone project, no throttling, is
  the proxy).
- **Search:** under 16 ms per query on 2,000 foods; results within 300 ms of the last keystroke
  (A2).
- **Size:** app JS and CSS, excluding data, stay under 150 KB unminified.
- **Rendering:** no layout thrash in the add flow; update only the parts that change.

## 9. Code conventions

- ES2024 modules with relative imports ending in `.js`. Named exports only, except data modules
  (`export default`).
- Prettier (`.prettierrc.json`: width 100, single quotes, trailing commas). ESLint
  (`eslint.config.js`, flat config, no plugins):
  - `eqeqeq` (with `== null` allowed)
  - `no-alert`
  - `no-console` (warn and error allowed)
  - no `toISOString` in `app/`
  - purity rules in `app/core/`
  - no functions in `app/data/`
- JSDoc on every export. Names follow this document.
- Errors: throw `RangeError` or `TypeError` with a clear message. Never throw a string.

## 10. Testing and gates

### 10.1 Commands

| Command | What it runs |
|---|---|
| `npm run setup` | once per checkout: `npm link playwright`, which links the preinstalled 1.56.1 (**never** `playwright install`) |
| `npm run check` | `eslint .`, then `prettier --check .`, then `npm test`. **Must pass before every hand-off.** |
| `npm test` | `node --test tests/{contract,unit,data}/**/*.test.js`, run three times: `TZ=Europe/Madrid` (primary), `TZ=Asia/Karachi`, `TZ=America/Los_Angeles` |
| `npm run test:coverage` | line coverage of `app/core`, threshold 90% (joins `check` once the core is implemented) |
| `npm run test:e2e` | Playwright on `phone` (Pixel 7), `phone-dark`, `small` (360 px) and `desktop` (1280 × 800), against `http-server app` on port 4173, clock `Europe/Madrid` |
| `npm run serve` | the app at http://localhost:4173 |

### 10.2 Unit tests

- Fixtures come from `tests/fixtures/index.js` (real RULES plus 16 fixture foods), never from
  `app/data/foods-*.js`.
- Profiles A, B and C, and the NUTRITION.md vectors, are binding.

### 10.3 Data gate (`tests/data/`, Kenji; Ayesha's checks)

Every record in `FOODS` (and every fixture) must pass:

- `validateFood(food, RULES)` and a unique id
- `energyCheck(...).ok`
- protein + carbs + fat + fibre ≤ 100 g per 100 g
- `fiberZero` groups have fibre of exactly 0
- kcal per 100 g and every serving's grams within the group's `kcalPer100g` and `servingGrams`
- `tagRules`
- no banned words, unless an allowed qualifier is present
- the source has a citation, a method and a grade from the vocabularies

The gate reports every failure with the food id. A food that fails does not ship.

### 10.4 Cross-testing (playbook rule)

| Code | Author | Tested independently by |
|---|---|---|
| `app/core/**` | Hamza | Kenji (`tests/unit/qa`, from this document; he does not read the implementation first) |
| `app/ui/views`, `components`, `styles` | Priya | Kenji (E2E); Hamza (hands-on review at 360 px) |
| `main.js`, `ui/store.js`, `ui/router.js` | Lena | Kenji (unit and E2E) and Priya (E2E flows) |
| `tests/**` (QA suites) | Kenji | Lena (plants 3 bugs per core module; the suite must catch them) |
| `app/data/**` | Lab | Kenji (data gate) and Ayesha (review) |
| The whole product | all | Bilal's Customer Panel (A1–A15) |

Bugs go to the owner. Nobody fixes another person's file.

## 11. Publishing as an Artifact

- **Manifest:** `npm run publish:files` prints `{ page, files }` for the Artifact `files` map and
  fails if any relative import or `<link>`/`<script>` would not resolve once published.
- **Page:** `app/index.html`.
- **Files:** every other file under `app/`, at the same relative path, with no leading slash.
  `app/ui/dev/` (Priya's harness) is never published.
- **URL:** always republish to the same URL (`team/state.json → app.url`), because localStorage
  belongs to that origin. A new URL means the Boss's data stays behind at the old one.
- **Before publishing:**
  - `npm run check` and `npm run test:e2e` pass.
  - No request goes to another origin (the smoke test checks this).
  - The `<title>` is a 2–4 word name ("Katori Meal Planner").

## 12. Change control

- **Contract changes** go through Lena in one hand-off: §4 types, §5 signatures, §6 RULES fields and
  §7.3 store API. That hand-off updates this document, the stub or JSDoc, and
  `tests/contract/*.test.js`, and tells Kenji.
- **Food ids** are permanent once shipped.
- **Schema changes** to `UserData` bump `SCHEMA_VERSION` and come with a `migrate` step and a test.

## 13. Sprint 2 design: whole-pot recipes and meal prep (draft for Review 1)

Meeting 002 made meal prep Sprint 2's headline. Sprint 1 already reserves the room, so Sprint 2 needs
no schema bump unless these shapes change. Omar's suggestion (a box is an ordinary entry pointing at
a recipe-derived food, and a `batches` collection tracks the boxes) is adopted.

**Recipes** (`UserData.recipes`, user-made; ids `my-recipe-<uuid>`):

```js
Recipe = { id, name, createdAt, ingredients: [{ foodId, servingId, qty }],
           cookedWeightG: number|null,        // weighed pot; null = sum of ingredient grams
           boxes: number }                    // how many boxes the pot makes (≥ 1)
```

- `foodFromRecipe(recipe, foodIndex, rules) → Food`, a pure core function: per100g = Σ ingredient
  nutrients / cooked weight × 100; servings `box` (cooked weight / boxes, default), the katori set
  and `g`; `halal` = the worst status among the ingredients (`RULES.vocab.halalRules.worstFirst`);
  `source = { citation: 'Your recipe', method: 'recipe', confidence: 'C' }`; `group` `lunchbox`.
- The store builds the food index from `FOODS`, `customFoods` and the derived recipe foods
  (`buildFoodIndex(...lists)` already takes several lists). Every existing day function works
  unchanged: a box in Lunch is `{ foodId: recipe.id, servingId: 'box', qty: 1 }`.
- **Library boxes** (Yusuf's 12) keep their Sprint 1 food ids and Lab-reviewed numbers. Sprint 2 adds
  Lab data `app/data/recipes-mealprep.js`: `{ foodId, ingredients, boxes, storage }` for the
  shopping list and storage. Logging a library box always uses the Lab food, never a recomputation.

**Batches** (`UserData.batches`):

```js
Batch = { id, recipeId,                       // a user recipe id or a library box foodId
          cookedOn: 'YYYY-MM-DD',
          boxes: [{ id, storage: 'fridge'|'freezer', movedToFridgeOn: date|null,
                    placed: { date, entryId } | null, status: 'available'|'placed'|'eaten'|'discarded' }] }
```

- **Fridge or freezer per box** is the user's choice (Manager decision): the app warns, calmly and
  without red, when a box would sit in the fridge longer than its fridge life (rice: 1 day).
- **Use-by** (`RULES.mealPrep`): a fridge box gets cookedOn + min(fridgeDays of its components); a
  freezer box has none until moved, then movedToFridgeOn + `thawedFridgeDays`. Pure function
  `boxUseBy(batch, box, recipe, foodIndex, rules) → date|null`. The Day view says "last day" on the
  date and "past use-by, best not to eat" after it, calmly.
- **Placing a box** in Lunch on chosen days (1 action per day, A17) adds an entry with
  `boxRef: { batchId, boxId }` and sets the box to `placed`. Ticking the entry eaten sets the box
  to `eaten`; deleting the entry frees the box. Boxes left = boxes with `available`.
- **Shopping list:** ingredients × batches, merged by food, as copyable text (no downloads in an
  Artifact).
- **New core module** `app/core/mealprep.js` (Sprint 2: Lena). Pure, contract-tested like §5.
  Signatures below are binding from 2026-10-14 18:40 Madrid (Lena filled in the five §13 left open).

### 13.1 Shapes added in Sprint 2 (all additive and optional: no schema bump)

```js
Recipe   += { kind?: 'chai',                  // "Set my chai once": at most one; serving 'cup'
              storage?: string[]|null,          // RULES.mealPrep.storage ids the user chose; null = inferred
              updatedAt?: string,
              method?: string }                 // "My method" (s3-method, 2026-10-16): free text, one step
                                                // per line, trimmed, at most MY_METHOD_MAX (4000) characters
Batch    += { name?: string }                   // display name kept if the recipe is deleted
UserData += { savedMeals?: [{ id, name, slot, createdAt, items: [{ foodId, servingId, qty }] }] }  // optional; absent = none
settings.seafood                                // now asked (Profile and onboarding), default 'all'
```

**Library recipes** (`app/data/recipes-mealprep.js`, Nutrition Lab): `export default [LibraryRecipe]`.

```js
LibraryRecipe = { foodId,                       // the Lab food (group lunchbox) it describes
                  boxes,                        // standard batch, whole number >= 1
                  storage: (string | { id, pot?: true, later?: true, job?: string })[],
                                                // RULES.mealPrep.storage id per component;
                                                // pot: true = a side pot packed apart (raita), which
                                                // counts for the fridge life but does not stop freezing;
                                                // later: true (R3-A) = cooked the night before each box is
                                                // eaten (bolognese penne): not in the fridge life, not in
                                                // the freezing judgement; `job` is the Day's "Tonight" line
                                                // (else the method step that starts "The night before")
                  ingredients: [{ foodId?, name?, grams, section?: 'butcher'|'supermarket', note? }],
                  effort?: 'cook'|'assemble'|'ready', // absent = 'cook' (Boss's "less cooking", 14 Oct)
                  minutes?: number,              // hands-on minutes; assemble ≤ 15
                  method?: Method }              // "How to make it" (s3-method, 2026-10-16), below

Method = { equipment: string[],                 // "Large frying pan (28 cm) with a lid"
           prep: string[],                      // "Before you start": cut sizes, forms ("Dice the onion 1 cm")
           steps: [{ text: string,              // one action; order, amount and form in the words
                     heat?: Heat,               // the step's chip
                     minutes?: number }],       // > 0; the step's time chip
           doneWhen?: string,                   // a doneness cue a beginner can see
           boxUp: string,                       // cooling, fridge/freezer split (matches `storage`)
           reheat: string,                      // or "Eat cold"
           tips?: string[] }
Heat = 'none'|'low'|'medium'|'medium-high'|'high'|'oven-180'|'oven-200'|'oven-220'|'microwave'
```

**Lab additions to LibraryRecipe** (Nutrition Lab, Sprint 3, 2026-10-16; all optional and additive, no schema
bump; written by `research/yusuf/build.mjs` from the recipe sheets, so the sheets and the app never drift apart):

```js
LibraryRecipe += { pitch?: string,              // one sentence for the card: what it is and why (O4); 64/64
                   cost?: { perBoxEur: number,  // € per box, 2 decimals (the standard batch ÷ boxes)
                            totalEur: number,   // € for the standard batch (`boxes`)
                            priceDate: string,  // YYYY-MM-DD: the OLDEST price read among the priced lines
                                                // ("prices from 13 Oct"), never newer than the data
                            shop: string },     // e.g. "Mercadona Barcelona + halal butcher (Carne Halal Online)"
                                                // absent when a main line has no current price (3 sheets on
                                                // 2026-10-16: boneless halal thigh #1, #5; a forn barra #27)
                   references?: [{ title: string, url: string }],  // published recipes the sheet starts
                                                // from, 2–5 per prep (O9); https links, shown in Source
                   timeNote?: string,           // generated from totalMinutes (R3-B, M-17): "About 5 h 30 min start
                                                // to finish (35 min of it hands-on): …", plus "Later, <when>: N min
                                                // hands-on" for a part made per box; present when the wait matters
                   totalMinutes: number,        // start to finish (R3-B): prep + every step that is not done during
                                                // another, waits included: marinade, soak, chill, oven, eggs boiling.
                                                // `minutes` is hands-on. Both are generated from the method's steps.
                   keep: { fridgeDays, fridge, freezer,   // the ONE storage truth of the standard batch (R3-B): the
                           freezerMonths?,      // method's boxUp sentence is generated from it, and the build fails
                                                // when the app's storagePlan(recipe) disagrees on days or split
                           later?: [{ name, storage, fridgeDays, when, job }],  // a part cooked the night
                                                // before each box (bolognese penne); not in the box's life
                           fresh?: [{ name, storage, fridgeDays, again? }] },  // a side made again in rounds
                                                // (raita, dressed salad); `again` = when and how, one line
                   lightCooking?: string,       // assemble/ready preps that still heat: "the eggs are boiled", "a
                                                // ready-made soup is heated ..."; never shown as no cooking
                   cuisine?: 'desi'|'spanish'|'mediterranean'|'middle-eastern'|'italian'|'mexican'|'asian'|'international',
                   serve?: 'cold'|'hot'|'either',   // assemble preps only: how it is eaten (hot = microwave)
                   halalSwap?: string,          // foodId of the halal version of a prep that is not 'halal'
                                                // (STATUS O6; today #29 feta → #40 Burgos); the build checks it is
                                                // a halal prep of the same slot. The "Halal swap" button reads it.
                   halalSwapNote?: string }     // one line: why the swap (e.g. rennet origin not stated)
Ingredient.note                                 // where to buy, kept on every desi-shop line (halal butcher,
                                                // Pakistani grocer) even when the line has a foodId
```

Lab method rules on top of the Method contract (the build fails, and `tests/unit/qa/method-contract.test.js`
checks the same): every library recipe has a method object; a no-cook prep (`assemble` or `ready`) opens
with a step that starts "No cooking" with no heat, and names any light heat there ("No cooking: only the
bread is toasted."); a cook prep never opens with "No cooking"; a `boxUp` that freezes numbered boxes
belongs to a recipe whose `storage` can freeze (a fresh salad or tomatoes kept apart is `{ id, pot: true }`).
R3-B (Review 3) build checks: `boxUp` and the sheet's storage plan carry the generated split sentence and
no split or day count of their own, and `keep` must equal the app's `storagePlan`; a prep that heats food
checks doneness on its own step **before** the first packing step (the check step says what to look for,
never "see Done when"); a count with grams ("1 small onion (70 g)") must match the record's unit weight;
a step of more than 400 characters is split; roti batches make the dough first, put the curry in the
fridge on a 30-minute timer, and cool the roti before bagging (`research/yusuf/shared.mjs` rotiSteps);
shopping names say the form the method uses (ground coriander vs coriander seeds, the 800 g jar of
crushed tomato, atta at the Pakistani grocery, boiled-egg lines as the box of raw eggs).

**Weekly plans** (`app/data/plans-mealprep.js`, Nutrition Lab, STATUS O7; generated with the library by
`research/yusuf/build.mjs`; R3-B 2026-10-18 adds the fields marked +, all from the same numbers):

```js
export const PLANS = [{ id: 'low-cook-week'|'budget-week', name, pitch,   // pitch counted from the plan
  priceDate, shop,
  tillEur,                                       // whole packs at the till for the week
  eatenEur,                                      // + R3-B meaning: only the food eaten Monday-Friday out of
                                                 //   this week's till (pro-rata; no frozen boxes, no cupboard)
  frozenEur,                                     // + made this week, frozen for later weeks
  keptEur,                                       // + = tillEur - eatenEur - frozenEur: the rest of the packs and
                                                 //   jars, which stays in the cupboard and fridge (generated)
  sundayMinutes,                                 // = the Sunday batches' `minutes` added up (hands-on)
  weekdayMinutes,                                // = the weekday `evenings[].minutes` added up
  batches: [{ foodId, when, boxes, from?: 'freezer',  // when: "Sunday", "<Day> night", "<Day>" (that evening)
              minutes,                           // + the recipe's hands-on minutes (the library row's number)
              fridge, freezer,                   // + this plan's split: a box eaten within keep.fridgeDays of
                                                 //   the cook -> fridge, else freezer; boxes not eaten -> freezer
              eat: [{ day, weekday, slot, from: 'fridge'|'freezer' }],  // + which meal each box is
              note }],                           // generated from the above (no typed split or minutes)
  evenings: [{ day, weekday,                     // + 1 = Monday ... 5 = Friday, 7 = the Sunday before
               time: 'evening'|'night',          //   evening = for tonight's dinner; night = for tomorrow
               kind: 'make'|'move'|'later'|'fresh',  // make a weekday batch / a frozen box to the fridge /
                                                 //   the part made the night before (keep.later) / a fresh side
               text, recipeId, minutes? }],      //   minutes: hands-on (none for a move)
  days: [{ day, weekday,                         // 'Monday', 1 ... 'Friday', 5
           items: [{ slot, foodId, servingId, qty,
                     batch? }],                  // + index into batches for a meal made by a batch
           kcal, protein, fiber }] }]            // preview totals from the Lab records; the app computes its own
export const READY_PICKS = { breakfast|lunch|dinner|snacks: [{ name, note, items, kcal, protein, fiber,
                             lightCooking? }] }  // + a pick that boils eggs says so (never "no cooking")
```

**How the app uses a plan (R3-A, Mariam Review 3).** "Use this week" stamps each batch it cooks with
`plan: { id, monday }` (an extra batch field, kept by export/import; no schema bump). Fridge or freezer per
box comes from the day the box is eaten and the recipe's fridge life (`storagePlan(...).fridgeDays`): eaten
within it → fridge, later or not placed → freezer (if the food freezes); a batch's `fridge` count, if the Lab
adds one, caps the fridge boxes. Rows in slot `snacks` (and the `snacks` ready picks) go to `evening`
(Merienda / Shaam ki chai) when the day has that slot. A batch cooked later takes over the planned rows of
the same dish with no box behind them, from its cooking day for a week (never a second row in the meal);
`placeBox` into a meal that has such a row links it too. Optional Lab fields read when present:
`PLANS[].evenings = [{ weekday (7 = the Sunday before), time?, text, recipeId? }]` (shown as "Tonight"
lines in that plan's week, replacing the app's own lines for the same recipe) and `keep.later[].text`.
A recipe named in any of the plan week's `evenings` gets no derived "make"/"later" row on another evening
(the plan says when); a `kind: 'make'` job drops out once its box is made; a `kind: 'move'` job is not
shown when the app holds that batch (its own `moveTonight` row, with Move to fridge, says it once).
The plan card's till line reads `eatenEur` ("eaten Mon–Fri"), `frozenEur` ("goes to the freezer for
later weeks") and `keptEur` ("stays in your cupboard"), so the three add up to `tillEur`.

**Time** (Bilal R3, M-17). `timeNote` is shown in full at the top of a library recipe's sheet and in
its Cook dialog (`recipe-method.js` `timeNoteOf`, which falls back to `totalMinutes` vs `minutes`). The
library card shows `planAheadOf`: the first sentence's part after its colon ("Start the night before,
so the chicken marinates at least 4 hours.", stressed when it must start the day before) and the
"Later, …" sentence's when and what.

**Method** (M-01: the sheets had methods and the contract had no field, so they never reached the
app). Optional and additive: no schema bump. A recipe without a method shows no "How to make it"
at all. `tests/contract/recipe-method.test.js` checks every method that exists has exactly this
shape (heat values from the list, minutes > 0, the four required keys, no unknown keys); Kenji's
data gate adds "every library recipe has one" when the Lab is done. The UI reads both kinds through
`methodOf(recipe)` in `ui/components/recipe-method.js` (also tolerates the sheets' old
`string[]`): a library row and a batch card get a "How to make it" button (a sheet with "What you
need", the method and "Cook a batch"), the Cook / Make dialog a folded "How to make it", and both a
"Step by step" mode (one step per screen, big text, Back / Next, "Step x of n", arrow keys, screen
kept awake where allowed). The amounts in the steps are for the standard batch (`boxes`), which
the UI says. A person's `Recipe.method` is edited in the recipe editor ("My method (optional)"),
shown the same way, kept by export and import (whole recipe objects), and `migrate` drops a
non-text or blank one and trims the rest (never 'corrupt').

The Prep library filters on `effort` ("All · Cook · No-cook (≤15 min)", no-cook = `assemble` or
`ready`) and shows the time on each card ("45 min", "10 min, no cooking", "Ready to eat"); a
no-cook prep says "Make" instead of "Cook". Helpers: `effortOf`, `matchesEffort`, `effortText` in
`ui/components/prep-bits.js`. A "Ready to eat" picks row per slot is Sprint 3.

An ingredient needs `grams` and a `foodId` or a `name` (the app shows `name`, else the food's name).
`section` defaults to `butcher` for foods in groups `meat-fish`, `curry-meat`, `grill-kebab`, else
`supermarket`. Section labels come from `RULES.mealPrep.shopSections` (`[{ id, label }]`) when the
Lab adds it, else "Halal butcher" and "Supermarket".

### 13.2 `core/mealprep.js` contract

| Export | Contract |
|---|---|
| `RECIPE_PREFIX = 'my-recipe-'`, `BOX_STORAGES = ['fridge','freezer']`, `BOX_STATUSES = ['available','placed','eaten','discarded']` | frozen |
| `worstHalal(foods, rules = null)` | `{ status, reason, foodId }`: the worst `halal.status` among `foods` by `RULES.vocab.halalRules.worstFirst` (fallback `HALAL_STATUSES` reversed); `reason` is that food's reason (`null` for halal); `[]` gives `{ status: 'halal', reason: null, foodId: null }` |
| `recipeTotals(recipe, foodIndex)` | `{ lines: [{ foodId, servingId, qty, grams, nutrients }], total, rawGrams, cookedGrams, missing: string[] }`; unknown foods are skipped and listed in `missing`; `cookedGrams = cookedWeightG ?? rawGrams`; unrounded |
| `foodFromRecipe(recipe, foodIndex, rules)` | §13 above. `id = recipe.id`, `per100g = total / cookedGrams × 100` (five keys, unrounded), servings: `box` (default; "1 whole recipe" when `boxes` is 1), `pot` ("1 whole pot", only when `boxes > 1`), `katori-small`, `katori`, `katori-large`, `tbsp` (ml from `RULES.householdMeasures`, one density of 1 g per ml, labelled "about"); a `kind: 'chai'` recipe has the single serving `cup` instead. `halal` from `worstHalal`: `{ status, reason }` with the ingredient's own reason, plus `ingredient` (its name) for the UI; `group` `lunchbox` (chai: `drink-tea-coffee`); `tags` `['meal-prep']`; `source = { citation: 'Your recipe', method: 'recipe', confidence: 'C' }`. `RangeError` when `boxes` is not a whole number ≥ 1, no ingredient is known, or `cookedWeightG` is neither null nor > 0 |
| `storageIds(recipe, foodIndex, rules)` | `recipe.storage` when it is a non-empty array; else inferred from the ingredients' groups (rice and pasta → `cooked-starch`, meat → `cooked-meat`, egg → `egg-dish`, legumes and vegetables → `cooked-curry`, breads → `cooked-flatbread`, dips → `cold-salad`); `['cooked-curry']` when nothing matches |
| `storagePlan(recipe, boxes, foodIndex, rules)` | `{ fridgeDays, freezable, storage: ('fridge'\|'freezer')[] }`: the first `min(boxes, fridgeDays)` boxes in the fridge, the rest in the freezer; all fridge when a component that is not a side pot cannot be frozen (A18: rice → box 1 fridge, 2–4 freezer; chana chaat → all fridge) |
| `boxUseBy(batch, box, recipe, foodIndex, rules)` | §13 above: `movedToFridgeOn + thawedFridgeDays` when the box was moved (whatever `storage` says), else fridge = `cookedOn + min fridgeDays`, freezer = `null`. The store sets `storage: 'fridge'` and `movedToFridgeOn` together |
| `useByStatus(useBy, date)` | `null` (no use-by), `'ok'`, `'last-day'` (date = use-by) or `'past'` |
| `boxesLeft(batch)` | count of `available` boxes |
| `placeBox(batch, boxId, { date, entryId })` | new batch with that box `placed`; `RangeError` when the box is not `available` |
| `syncBatches(batches, days)` | the store runs it after every change: a box whose entry (found by `boxRef`, any date) is `eaten` becomes `eaten`, `planned` becomes `placed` (with the entry's current date), and a placed or eaten box with no entry is `available` again. `discarded` stays. Returns the same array when nothing changed |
| `shoppingList(plans, foodIndex, rules = null)` | `plans = [{ recipe, boxes }]` (user or library recipe); every ingredient scaled by `boxes / recipe.boxes` (a family pot: `boxes / recipe.potKatori`, its boxes being katori), merged by `foodId` (else by name); `{ sections: [{ id, label, items: [{ key, foodId, name, grams, count: { qty, label } \| null, note? }] }] }` with empty sections left out, `butcher` first; `note` (where to buy, O5) is the first ingredient line's `note` for that item, present only when one says |

The store (§7.3) adds: `recipes()`, `recipe(id)`, `recipeTotals(id)`, `saveRecipe(r)`, `deleteRecipe(id)`,
`library()`, `batches()`, `cookBatch({ recipeId, boxes, cookedOn?, storage? })`, `setBoxStorage(batchId,
boxId, storage)`, `discardBox`, `deleteBatch`, `placeBox({ batchId, date, slot, status? })` (returns `{ entryId,
boxId, noneLeft }`; with no box left it still adds a plain entry, A17; `status: 'planned'` plans the box
even for today, used by the Day view's "Plan it", otherwise today is eaten and later days planned), `fillDays`, `boxInfo(entry)`,
`prepNotices(date)` (`{ moveTonight, later, make, jobs }`: frozen boxes to move tonight; boxes placed
tomorrow whose recipe has a part cooked the night before, with its `job`; planned prep rows with no box,
tomorrow's and today's still to come; the used plan's own `evenings`), `shopping(batchId, boxes)`,
`weekShopping()` (`{ batches, weekdayJobs, ready, list }`: this week's batches plus, for a plan in use, its
weekday batches not cooked yet and its ready food), `planShopping(planId)` (`{ batches, ready, list }`: a
plan's whole week, without the batches that come from the freezer), `chai()`, `saveChai(opts)`, `savedMeals()`, `saveMeal`,
`addSavedMeal`, `deleteSavedMeal`. The food index also applies `settings.seafood`: a food whose
seafood tag is outside the choice shows `check` with `RULES.vocab.halalRules.seafoodNote`.

## 14. Sprint 3: weight log and trend (owner: Lena)

- **Data:** optional `UserData.weightLog = { [YYYY-MM-DD]: { kg } }` (absent = none; no schema bump).
  One entry per day by construction. `migrate` drops bad entries and never marks the document corrupt.
  Import merge is a union by date (incoming wins); replace takes the incoming log.
- **Settings it adds (optional):** `targetsChangedOn` (stamped by `setProfile`, `setTargetPrefs` and
  `setTargetOverride` when the goal, pace or kcal target changes; not by onboarding) and
  `weightSuggestDismissedOn` ("Not now").
- **Core `app/core/weight.js`:** `weightLimits`, `weightLogProblems`, `setWeight`, `removeWeight`,
  `weightEntries`, `mergeWeightLogs`, `trendRule`, `suggestRails(rules, { tdee, sex, bodyKg })`,
  `weightTrend(entries, rules, context)`. All numbers come from `RULES.weightTrend` (NUTRITION.md §14);
  without it there is a log and no trend.
- **Store:** `weights()`, `weightOn(date)`, `weightTrend()`, `setWeight(date, kg)`, `removeWeight(date)`
  (Undo), `acceptWeightSuggestion()` (the person's tap only: kcal and carbs overrides; protein and fat
  stay; Undo) and `dismissWeightSuggestion()`.
- **UI:** Profile's weight card (entry, list, chart, trend, rate, suggestion with "Use N kcal" / "Not
  now"); Week's weight section (chart, trend, rate; no suggestion).

## 15. Sprint 3: Ramadan mode (owner: Lena)

- **Data:** optional `settings.ramadanMode = { on, startDate, fajr?, maghrib?, fajrOffsetMin?,
  maghribOffsetMin?, days?, fluidsHiddenOn? }` (DECISIONS 2026-10-15; no schema bump). `fajr`/`maghrib`
  ('HH:MM') apply to every Ramadan day. STATUS O12 adds the edits `RULES.ramadan.userEdit` allows:
  `fajrOffsetMin`/`maghribOffsetMin` (whole minutes, clamped to `offsetMinRange`) move the built-in
  table's times, and `days = { 'YYYY-MM-DD': { fajr?, maghrib? } }` (only read when `perDayOverride`)
  changes one day. Order for a time: that day's own, then the every-day time, then table + offset.
  `migrate` uses `cleanRamadanMode`: a broken optional part is dropped, the mode is dropped only when
  `on` or `startDate` is broken; never 'corrupt'.
- **Core `app/core/ramadan.js`:** `parseTime`, `timeText`, `ramadanModeProblems`, `cleanRamadanMode`,
  `ramadanEditRules(rules)` → `{ offset: { min, max } | null, perDay }`, `ramadanOffset(mode, key, rules)`,
  `defaultStartDate`, `ramadanRange`, `isRamadanDay`, `ramadanTimes(date, mode, rules)` → `{ fajr,
  maghrib, source: { fajr, maghrib } ('day' | 'user' | 'table' | null), table, offset, place }`,
  `ramadanDayStart`, `loggingDate`, `ramadanSlots`, `sehriProteinGoal`, `ramadanFlagNotes`.
- **Store:** `ramadan(date?)` (adds `edit`, `offsets` and `days`: every Ramadan day with its times),
  `setRamadanMode(patch)` (offsets 0 or null clear), `setRamadanDay(date, { fajr?, maghrib? })` (null
  goes back to the usual time), `hideFluidsToday()`. A day's own maghrib moves that day's slot windows.
- **UI:** Profile's Ramadan card: switch, first day, the every-day fajr/maghrib, "Your mosque's times
  are a little different?" (two offset selects, shown while no every-day time is typed), and the folded
  "Day-by-day times" table (today marked, own times in the accent colour, a pencil per row opens a
  one-day editor with Save, "Use the usual times" and Cancel).
