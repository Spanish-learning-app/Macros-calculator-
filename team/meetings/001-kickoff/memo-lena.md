# Kickoff memo: Engineering

**From:** Lena Hoffmann, Lead Software Engineer · **Meeting:** 001 Kickoff · **Date:** 2026-10-13

**Bottom line:** we build one static web app with no runtime dependencies and no build step, using
plain ES modules and modern CSS. Its pure core can be tested in Node with `node --test`. The same
files run from `app/` and publish as an Artifact. I am asking for **3 engineers**: Core Logic, UI
and QA.

## 1. Product shape for v1

The app is a single page with hash routes: a bottom tab bar on phones and two columns from 900 px.

| View | Route | Purpose |
|---|---|---|
| Onboarding | `#/welcome` | First launch only: sex, age, height (cm or ft/in), weight, activity and goal, which set the targets. Skip uses the Lab's defaults. |
| Day | `#/day/YYYY-MM-DD` | Sticky totals for kcal, protein, carbs, fat and fiber against targets. Slots (Nashta, Lunch, Shaam ki chai, Dinner, Snacks) have editable labels and subtotals. One tap marks an entry planned or eaten. Delete has Undo. A slot can be copied from another day. |
| Add food (sheet) | `#/day/<d>/add/<slot>` | Search covers names and aliases (roman Urdu, Urdu script, Spanish). With no query it shows the slot's recent foods. **"+" adds the last-used portion in one tap.** A row opens the portion picker: serving chips, quantity, grams and a live preview. The sheet stays open between foods. **Quick add** (name and kcal) is for meals eaten out. |
| Week / month | `#/week/YYYY-MM-DD` | Kcal and protein bars for 7 days, weekly averages, and a month grid for jumping to a date. |
| Profile | `#/profile` | Profile, targets with manual overrides, units, slot labels and theme. |
| Data | `#/data` | Export, import, reset and storage status. |

**Deferred to v2:** recipe builder, saved meals, a Ramadan preset (sehri/iftar), weight log and
adaptive TDEE, micronutrients beyond fiber, a full Urdu UI, richer charts, barcode and photo
logging, suggestions, sync, and water and exercise tracking.

## 2. Stack and architecture

- **No framework, no build step, no runtime dependencies.** Our own search, dates and bars are
  each under 150 lines, which is cheaper than auditing a library. We use system fonts. A library
  needs a written case in `docs/ARCHITECTURE.md` and an exact pinned version.
- **Paths are relative.** The Artifact page is `app/index.html`, and every other file under
  `app/` is published at the same path. We always republish to the same URL, because localStorage
  belongs to that origin.
- **Food data ships as ES modules** (`export default [...]`), so it loads the same way in the
  Artifact, from a static server and in Node, with no fetch.
- **Pure core, thin UI.** `app/core/` never touches the DOM or globals, and the caller passes in
  the time and ids. The UI renders from one store.
- **Persistence.** One localStorage key, `mmc.v1`, holds a versioned `UserData` document.
  - Writes are debounced by 300 ms, flushed on `pagehide`, and wrapped in try/catch.
  - Without storage, the app runs in memory and shows a "Not saved, export your data" banner.
  - Corrupt data is copied to `mmc.v1.corrupt.<ts>`, never deleted.
  - Export is a textarea with a Copy button. Import takes a paste or an `<input type=file>`, then
    asks Replace or Merge in a `<dialog>`, never `confirm()`.
- **Entries store `foodId`, `servingId`, `qty` and a snapshot.** Totals use the live database, so
  the Lab's corrections reach past days. The snapshot is the fallback for deleted foods.
- **Dates are local `YYYY-MM-DD` strings.** `toISOString()` is banned, because Karachi is UTC+5.
- **Accessibility:** 44 px targets, visible focus, AA contrast in both themes, `aria-live` totals.

## 3. Module layout and contracts

```
app/
  index.html  main.js                     # shell + boot (Lena)
  styles/   tokens.css  base.css          # UI Eng
  core/     units.js dates.js foods.js days.js targets.js search.js storage.js   # Core Eng, PURE
  ui/       store.js router.js            # Lena (integration)
            dom.js components/*.js views/*.js   # UI Eng
  data/     index.js rules.js foods-*.js  # Nutrition Lab (pure data modules)
tests/
  unit/qa/   unit/dev/   data/   e2e/   fixtures/foods.js
package.json  eslint.config.js  .prettierrc.json  playwright.config.js
docs/ARCHITECTURE.md
```

Every core function is pure and never mutates its inputs. The full JSDoc goes in
`docs/ARCHITECTURE.md`.

```js
// Nutrients = { kcal, protein, carbs, fat, fiber }    (grams, except kcal)
// Profile   = { sex:'male'|'female', ageYears, heightCm, weightKg,
//               activity:'sedentary'|'light'|'moderate'|'active'|'very_active',
//               goal:'lose'|'maintain'|'gain' }
// Entry     = { id, slot, foodId, servingId, qty, status:'planned'|'eaten',
//               snapshot:{ name, grams, ...Nutrients } }
// Day       = { date:'YYYY-MM-DD', entries: Entry[] }
// UserData  = { schemaVersion:1, profile, targetOverrides, settings, days:{[date]:Day},
//               customFoods: Food[], recents:{[foodId]:{ servingId, qty, count, lastUsed }} }

// core/units.js
toGrams(amount, unit) → number              // unit 'g'|'kg'|'oz'|'lb'; RangeError otherwise
cmFromFtIn(ft, inches) → number;  ftInFromCm(cm) → { ft, inches }
kgFromLb(lb) → number;  lbFromKg(kg) → number
round(value, decimals = 0) → number         // half away from zero; DISPLAY ONLY

// core/foods.js
validateFood(food) → string[]               // [] = valid; used by data tests and import
buildFoodIndex(...lists) → Map<id, Food>    // throws on duplicate id
gramsForPortion(food, servingId, qty) → number   // servingId 'g' means raw grams
nutrientsForGrams(food, grams) → Nutrients
nutrientsForPortion(food, servingId, qty) → Nutrients
sumNutrients(list) → Nutrients
energyCheck(per100g, rules.energy) → { computed, stated, deltaPct, ok }  // 4P+4C+9F+2·fibre

// core/days.js
addEntry(day, entry) → Day;  updateEntry(day, entryId, patch) → Day;  removeEntry(day, entryId) → Day
copySlot(fromDay, fromSlot, toDay, toSlot, makeId) → Day
dayTotals(day, foodIndex, { include = 'all' }) → { total, bySlot: {[slot]: Nutrients} }  // include 'all'|'eaten'
progress(total, targets) → {[key]: { value, target, pct, remaining }}
weekSummary(daysByDate, dates, foodIndex, targets) → Array<{ date, total, pct }>

// core/targets.js   (formula and constants: Ayesha, via app/data/rules.js)
computeTargets(profile, rules) → { ...Nutrients, bmr, tdee, warnings: string[] }
resolveTargets(computed, overrides) → Nutrients        // override wins per key

// core/dates.js
todayISO(now) → string;  addDays(iso, n) → string
weekDates(iso, weekStartsOn = 1) → string[7]
monthGrid(year, month1to12, weekStartsOn = 1) → (string|null)[][]

// core/search.js
normalize(text) → string    // lowercase, strip diacritics/harakat, collapse aa/ee/oo, trim
buildSearchIndex(foods) → SearchIndex
searchFoods(index, query, { limit = 20, boosts = {} }) → Array<{ food, score, matched }>
// rank: exact > prefix > word-prefix > substring > 1-edit fuzzy (words ≥4 chars);
// ties broken by boosts (recency/frequency), then name

// core/storage.js
STORAGE_KEY = 'mmc.v1';  SCHEMA_VERSION = 1
defaultData(rules) → UserData
createStore(backend) → { load() → { data, status:'ok'|'empty'|'unavailable'|'corrupt' },
                         save(data) → { ok, error } }   // backend {getItem,setItem,removeItem}|null; never throws
migrate(raw) → UserData                     // throws on a future schemaVersion
serializeExport(data, nowISO) → string
parseImport(text) → { ok:true, data, summary } | { ok:false, error }
mergeImport(current, incoming, mode:'replace'|'merge') → UserData
```

### Food record format I need from the Nutrition Lab

This record takes Ayesha's nutrition fields and writes them in camelCase. **HARD** means the code
or the data gate depends on the field. **SOFT** means the field is shown when present.

```js
{
  id: 'pk-roti-wheat-home',        // HARD: unique, permanent, kebab-case, prefix pk-|es-|med-|intl-
  name: 'Roti (whole-wheat chapati)',   // HARD: English display name (Ayesha: name_en)
  nameUr: 'روٹی', nameRoman: 'roti',   // SOFT: shown as subtitle; both are also searched
  aliases: ['chapati', 'chapatti', 'phulka'],  // HARD: string[] (may be []); spellings, Spanish, English
  family: 'roti',                  // SOFT: links home/restaurant/dhaba variants in the picker
  state: 'cooked, as served',      // SOFT: what the values describe (shown in details)
  style: 'home',                   // SOFT: 'home'|'restaurant'|'dhaba'|'street'
  per100g: { kcal: 300, protein: 10, carbs: 50, fat: 4, fiber: 8 },  // HARD: all five, ≥0
                                   //   optional: sugars, satFat, sodium; addedFatG for composites
  servings: [                      // HARD: ≥1; ids unique in food; exactly one default:true
    { id: 'md', label: '1 roti (medium)', labelUr: '1 روٹی', grams: 40, default: true },
  ],
  tags: ['pakistani', 'bread', 'vegetarian', 'halal'],  // HARD: string[] from NUTRITION.md vocabulary
  source: {                        // HARD: citation non-empty; the rest SOFT
    citation: 'Recipe R-<n>', method: 'recipe', confidence: 'B', reviewer: 'ayesha', date: '2026-10-13',
  },
}   // numbers are illustrative; the values belong to the Lab
```

The code relies on these rules:

- Values are per 100 g **as eaten**: cooked, oil included.
- `carbs` means **available** carbohydrate, with fibre excluded, as Ayesha set it. Code treats it
  as an opaque number.
- `energyCheck` uses `4P + 4C + 9F + 2·fibre`. A record passes if the result is within ±10% or
  ±10 kcal of the stated kcal, whichever is larger. The factors and the tolerance live in
  `rules.js`.
- Every serving has a gram weight for that food. The code never turns volume into mass; ml to g is
  the Lab's job.
- An id never changes once it ships. A variant, such as dhaba karahi, is a full record with its own
  id.
- `rules.js` holds plain data, with no functions.
- Confidence C appears as an "estimate" badge.

## 4. Testing strategy

- **`npm run check`** runs `eslint .`, `prettier --check .` and
  `node --test tests/unit tests/data`. It must pass before any hand-off.
- **Unit tests.** QA writes `tests/unit/qa/` from the spec, before reading the code. The authors
  write `tests/unit/dev/`.
  - Both use `tests/fixtures/foods.js`, so the Lab's edits cannot break them.
  - Both run under `TZ=Asia/Karachi` and `TZ=America/Los_Angeles`, with 90% line coverage of
    `app/core`.
  - Targets are checked against Ayesha's worked examples in `docs/NUTRITION.md`.
- **Data gate** (`tests/data/`). A food ships only if it passes `validateFood`, has a unique id,
  and passes Ayesha's automated checks (energy, mass, fibre and the kcal range for its group).
- **End-to-end tests** with the preinstalled Playwright 1.56.1, never `playwright install`.
  - `npm run setup` runs `npm link playwright`. I checked today that ESM specs need this link,
    because NODE_PATH does not work.
  - Projects: `phone` (Pixel 7), `phone-dark`, `small` (360 px) and `desktop`, against
    `http-server app`.
  - Specs: the Boss's day (action budget, 60 s limit), alias search, edit/undo, planned → eaten,
    week navigation, reload, localStorage throwing, export → import.
  - On every view: no horizontal scroll, no requests to other origins, no `alert`.
- **Lint.** A plugin-free `eslint.config.js` (checked with the global ESLint 10) enforces
  `no-alert` and `eqeqeq`, bans `toISOString`, and bans DOM globals in `app/core/**`. Prettier is
  set to width 100 and single quotes.
- **Cross-testing.** Nobody is the only tester of their own work.

| Code | Author | Tested independently by |
|---|---|---|
| `app/core/**` | Core Eng | QA (unit tests from the spec) |
| Views, components, styles | UI Eng | QA (E2E); Core Eng (hands-on at phone width) |
| Shell, store, router | Lena | UI Eng and QA (E2E) |
| QA suites | QA | Lena (I plant 3 bugs per module; the suite must catch them) |
| `app/data/**` | Nutrition Lab | QA (data gate) and Ayesha |
| Whole product | all | Bilal's Customer Panel |

## 5. Hiring request: 3 engineers

**Core Logic Engineer.** This engineer owns `app/core/**` and `tests/unit/dev/**`. They implement
every contract in section 3, test-first: units, dates, nutrient math, day totals, targets built from
Ayesha's rules, search that handles roman-Urdu spelling variants, and storage and migration. Every
number on screen passes through this code, and it has to be built alongside the UI, not after it.

**UI Engineer (mobile-first).** This engineer owns `app/ui/views/**`, `app/ui/components/**`,
`app/ui/dom.js` and `app/styles/**`. That covers the light and dark tokens, the day view, the add
sheet and portion picker, the week and month view, onboarding, the profile and data screens, and the
dialogs. They own how fast the 60-second logging flow feels, the accessibility baseline, and no
horizontal scroll at 360 px. The Boss uses a phone first, so this is a full-time role.

**QA / Test Engineer.** This engineer owns `tests/unit/qa/**`, `tests/data/**`, `tests/e2e/**`,
`tests/fixtures/**` and `playwright.config.js`. They write tests from the spec, not from the code,
and they build the data gate and the Playwright suite. They report bugs to the owner and never fix
other people's code. The playbook requires independent testing, and this is how we show that the
code says what the Lab says.

Three is enough for now. I cover design QA and accessibility, and we review headcount at the
review meeting.

## 6. Sprint 1 plan and file ownership

**Step 0 (Lena, blocks the rest).** I set up `package.json`, the configs, `docs/ARCHITECTURE.md`,
the shell and stub `app/core/*.js` files. The stubs then pass to the Core Engineer, so QA's tests
fail cleanly instead of crashing.

**Then the tracks run in parallel.** No file has two owners.

| Track | Sequence |
|---|---|
| Core Eng | units → dates → foods → days → search → targets (stub rules until Ayesha delivers) → storage |
| UI Eng | tokens/CSS → day view, add sheet and portion picker (on fixtures) → week/month → onboarding/profile → data screen |
| QA | fixtures → spec unit tests (failing at first) → data gate → E2E on 4 projects → the Boss's day from Bilal's `docs/CUSTOMER.md` |
| Lena | `ui/store.js` and `ui/router.js` → integration → reviews and planted bugs → test publish as an Artifact |
| Lab | `rules.js` and worked examples → the ~15 foods in the Boss's day by mid-sprint → the rest |

**Integration order:** core passes QA → add flow on fixtures → real data → persistence → week and
profile → full E2E → Bilal tests → preview published.

**Exit criteria:** all checks pass on all four projects; the Boss's day takes 60 s or less, scripted
and by Bilal; the app works with storage blocked; every food passes the data gate; the preview is
live.

**Ownership map:**

| Owner | Files |
|---|---|
| Lena | `package.json`, configs, `docs/ARCHITECTURE.md`, `app/index.html`, `app/main.js`, `app/ui/store.js`, `app/ui/router.js` |
| Core Eng | `app/core/**`, `tests/unit/dev/**` |
| UI Eng | rest of `app/ui/**`, `app/styles/**` |
| QA | rest of `tests/**`, `playwright.config.js` |
| Lab | `app/data/**` |

Changes outside your own files go through me.

## 7. Risks

| Risk | Handling |
|---|---|
| The Lab's schema and the code drift apart | Omar settles the fields today. Then `validateFood` and the data gate are the contract. |
| Logging is too slow for 60 s | E2E action and time budgets, one-tap recents, slot copy, and Bilal timing it by hand. |
| localStorage is empty, throws, or the URL changes | Memory fallback with a banner, easy export, kept corrupt data, same URL. |
| Dates near midnight land on the wrong day | Local ISO strings, `toISOString` banned by lint, tests in two time zones. |
| Rounding drift ("the rows don't add up") | Sum at full precision and round only for display. QA tests the tolerance. |
| Search slows as the database grows | Build the index once. A QA test requires under 16 ms per keystroke on 2,000 foods. |
| Hires overwrite each other's files | The ownership map, lint, and my review of every hand-off. |
