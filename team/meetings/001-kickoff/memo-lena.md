# Kickoff memo: Engineering

**From:** Lena Hoffmann, Lead Software Engineer · **Meeting:** 001 Kickoff · **Date:** 2026-10-13
**To:** Omar (chair), Ayesha, Bilal

**Bottom line:** we build one static web app with no dependencies: plain ES modules, modern CSS, no
build step. Its pure core can be tested in Node with `node --test`. The same files run from `app/`
and publish as an Artifact. I request **3 engineers**: Core Logic, UI and QA.

## 1. Product shape for v1

The app is a single page with hash routes. On a phone it has a bottom tab bar. From 900 px wide it
shows a top nav and two columns, with the day on the left and the add panel on the right.

| View | Route | Purpose |
|---|---|---|
| Onboarding | `#/welcome` | Runs on first launch only. Asks for sex, age, height (cm or ft/in), weight, activity and goal, then computes targets. "Skip" uses the Lab's defaults. |
| Day | `#/day/YYYY-MM-DD` | Has a sticky totals bar showing kcal, protein, carbs, fat and fiber against targets, with the amount remaining. The meal slots are Nashta, Lunch, Shaam ki chai, Dinner and Snacks, with editable labels and a subtotal each. Each entry shows its portion ("2 roti") and its kcal and protein. Tap an entry to edit it, and delete it with an Undo toast. Each entry is **planned** or **eaten**, and one tap switches between the two. A "Copy slot from…" action copies a slot from yesterday or any other day. |
| Add food (sheet) | `#/day/<date>/add/<slot>` | The search box gets focus on open and matches names and aliases (roman-Urdu spellings, Urdu script, Spanish). With an empty query it lists recent and frequent foods for that slot. The "+" on a result adds the **last-used portion in one tap**. Tapping the row itself opens the portion picker: household serving chips, a quantity stepper in 0.5 steps, a grams field and a live macro preview. The sheet stays open so several foods can be added in a row. **Quick add** takes a name and kcal, with optional macros, for meals eaten out, and can save the result to My foods. |
| Week / month | `#/week/YYYY-MM-DD` | Shows 7 rows with kcal and protein bars against target, weekly averages and prev/next buttons. A month grid with a dot on each logged day lets the user jump to any date. |
| Profile | `#/profile` | Edits the profile. Shows the computed targets, each with a manual override. Also holds units, first day of the week, slot labels and theme. |
| Data | `#/data` | Export, import, reset and storage status. |

**The Boss's day in under 60 s:** the app remembers each food's last serving and quantity. Adding a
food takes one tap, the sheet takes several foods in a row, and a whole slot can be copied from another day.

**Deferred to v2:** recipe builder, saved meal templates, a Ramadan preset with sehri and iftar
slots (editable labels cover part of this in v1), weight log and adaptive TDEE, micronutrients
beyond fiber, a full Urdu UI, charts beyond the week bars, barcode and photo logging, meal
suggestions, sync across devices, water and exercise tracking.

## 2. Stack and architecture

- **No framework, no build step and no runtime dependencies.** The page loads one
  `<script type="module">` and uses modern CSS: custom properties, `color-scheme`,
  `prefers-color-scheme` and `<dialog>`. Fuzzy search, date helpers and progress bars each come to
  under 150 lines of our own code. That is less work than auditing a library and pinning it on a CDN.
  The app uses the system font stack, with no web fonts in v1. Anyone who proposes a library must
  justify it in `docs/ARCHITECTURE.md` and pin an exact version on cdnjs or jsdelivr.
- **Every path is relative** (`./core/days.js`, never `/core/…`). To publish, `app/index.html` is
  the page and every other file under `app/` goes into `files` at the same path. We always
  republish to **the same Artifact URL**, because localStorage belongs to that origin.
- **Food data ships as ES modules** (`export default [...]`), not as JSON fetched at runtime.
  The same files then work in the Artifact, from a static server and in Node tests, with no fetch
  and no dependence on browser support for JSON modules.
- **Pure core, thin UI.** `app/core/` has no DOM access, no globals, and no `Date.now()` or random
  calls inside it. The caller passes in the time and new ids. The UI renders from a single state
  object held by a small store (subscribe/dispatch).
- **Persistence.** All user data lives under one localStorage key, `mmc.v1`, as a versioned
  `UserData` document. Saves are debounced by 300 ms and flushed on `pagehide`. Every access is
  wrapped in try/catch.
  - **Storage unavailable:** the app keeps working in memory and shows a banner that stays up:
    "Not saved on this device. Export to keep your data."
  - **Corrupt data:** it is copied to `mmc.v1.corrupt.<ts>` and is never thrown away silently.
  - **Export:** the JSON appears in a read-only textarea with a Copy button. The download link is
    offered only where it works.
  - **Import:** the user pastes the JSON or picks a file with `<input type=file>`. The app
    validates it, shows a summary, and asks Replace or Merge in an in-app `<dialog>`, because
    `confirm()` does nothing in an Artifact.
- **Entries point to foods by id** (`foodId`, `servingId`, `qty`) and also keep a nutrient snapshot
  from when they were logged. Totals are computed from the **live** database, so corrections from
  the Lab reach old days too. The snapshot is used only when a food no longer exists, and it keeps
  exports self-contained.
- **Dates are local `YYYY-MM-DD` strings** everywhere. Using `toISOString()` for dates is banned,
  because Karachi is UTC+5 and the result can land on the wrong day.
- **Accessibility baseline:** semantic HTML, touch targets of at least 44 px, visible focus, AA
  contrast in light and dark mode, `aria-live` on the totals, and reduced motion respected.

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

The core contracts are below. Every function is pure, returns new objects and never mutates its
inputs. The full JSDoc typedefs will live in `docs/ARCHITECTURE.md`.

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
energyCheck(per100g, factors = { protein: 4, carbs: 4, fat: 9 }) → { computed, stated, deltaPct }

// core/days.js
addEntry(day, entry) → Day;  updateEntry(day, entryId, patch) → Day;  removeEntry(day, entryId) → Day
copySlot(fromDay, fromSlot, toDay, toSlot, makeId) → Day
dayTotals(day, foodIndex, { include = 'all' }) → { total: Nutrients, bySlot: {[slot]: Nutrients} }
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

```js
{
  id: 'pk-roti-wheat',             // HARD: unique, permanent, kebab-case, prefix pk-|es-|med-|intl-
  name: 'Roti (whole-wheat chapati)',  // HARD: English display name
  nameUrdu: 'روٹی',                // SOFT: Urdu script subtitle
  aliases: ['roti', 'chapati', 'chapatti', 'phulka'],  // HARD: string[] (may be []); roman-Urdu
                                   //   spellings, Urdu script, Spanish ('lentejas'), English
  per100g: { kcal: 300, protein: 10, carbs: 55, fat: 4, fiber: 5 },  // HARD: all five, ≥0, as consumed
  servings: [                      // HARD: ≥1; ids unique in food; exactly one default:true
    { id: 'md', label: '1 roti (medium, 40 g)', grams: 40, default: true },
    { id: 'lg', label: '1 large roti (60 g)', grams: 60 },
  ],
  tags: ['pakistani', 'bread', 'staple'],   // HARD: string[] from vocabulary in NUTRITION.md
  source: { label: 'USDA FDC <id>, adjusted for atta', url: '', notes: '' }, // HARD: label non-empty
  confidence: 'high',              // SOFT: 'high'|'medium'|'low' (shown as a badge)
  category: 'bread', updated: '2026-10-13',  // SOFT
}   // numbers are illustrative; the values belong to the Lab
```

Rules the code depends on:

- Nutrient values are per 100 g of the edible portion **as consumed**, so cooked and with the oil
  included.
- `carbs` means total carbohydrate, including fiber. Ayesha needs to confirm this.
- Every household serving is a **gram weight specific to that food**. The code never converts
  volume to mass; converting ml to g with the right density is the Lab's job.
- Ids never change once shipped. A correction keeps its id. A different dish gets a new id, for
  example home-cooked karahi and dhaba karahi.
- `rules.js` holds plain data only, with no functions.

## 4. Testing strategy

- **`npm run check`** runs `eslint .`, then `prettier --check .`, then
  `node --test tests/unit tests/data`. It must pass before any work reaches me.
- **Unit tests.** QA writes `tests/unit/qa/` from the specification and the authors write
  `tests/unit/dev/`. Both run against `tests/fixtures/foods.js` and never against the real data, so
  edits from the Lab cannot break the logic tests. The suite runs under `TZ=Asia/Karachi` and under
  `TZ=America/Los_Angeles`. The target is at least 90% line coverage of `app/core`
  (`--experimental-test-coverage`). The target calculations are tested against worked examples
  that Ayesha writes in `docs/NUTRITION.md`.
- **Data gate** (`tests/data/`). Every record in `app/data/` must pass `validateFood`, have a
  unique id, pass the Atwater energy check within the Lab's tolerance, and have sensible servings.
  A food that fails does not ship.
- **End-to-end tests** with the preinstalled Playwright 1.56.1. We never run `playwright install`.
  - **Setup:** specs import `playwright/test`, and `npm run setup` runs `npm link playwright`.
    I checked today: ESM specs cannot find the global install through NODE_PATH, but the link works.
  - **Server:** `http-server app -p 4173 -c-1`.
  - **Projects:** `phone` (Pixel 7), `phone-dark`, `small` (360 px) and `desktop` (1280×800).
  - **Required specs:**
    - onboarding
    - the **Boss's day**, scripted, with a budget on the number of actions and a 60 s assertion
    - alias search (daal/dal, chawal, lentejas)
    - edit, delete and undo
    - planned → eaten
    - week navigation
    - data survives a reload
    - **localStorage throwing** (set up by an init script): the banner shows and the app still works
    - an export → import round trip
  - **Checks on every view:** no horizontal scroll, no requests to other origins, and no calls to
    `alert`, `confirm` or `prompt`.
- **Lint.** `eslint.config.js` is a flat config with no plugin dependencies; I checked that it runs
  with the global ESLint 10. It turns on `no-alert` and `eqeqeq`, bans `toISOString` through
  `no-restricted-properties`, and bans `window`, `document` and `localStorage` inside
  `app/core/**`, so the linter enforces a pure core. Prettier uses a print width of 100 and single
  quotes.
- **Cross-testing.**

| Code | Author | Tested independently by |
|---|---|---|
| `app/core/**` | Core Eng | QA (unit tests from the spec) |
| Views, components, styles | UI Eng | QA (E2E); Core Eng (hands-on review at phone width) |
| Shell, store, router | Lena | UI Eng (E2E flows) and QA |
| QA test suites | QA | Lena (I plant 3 bugs per module, and the suite must catch them) |
| `app/data/**` | Nutrition Lab | QA (data gate) and Ayesha (review) |
| Whole product | everyone | Bilal's Customer Panel |

## 5. Hiring request: 3 engineers

**Core Logic Engineer.** This engineer owns `app/core/**` and `tests/unit/dev/**`. They implement
every contract in section 3: unit conversion, dates, food and nutrient math, day operations and
totals, targets built from Ayesha's rules and worked examples, search and ranking that copes with
roman-Urdu spelling variants, and storage, validation and migration. They work test-first. The role
is needed because correctness lives in the core: every number on screen passes through it, and it
has to be built in parallel with the UI and not after it.

**UI Engineer (frontend, mobile-first).** This engineer owns `app/ui/views/**`,
`app/ui/components/**`, `app/ui/dom.js` and `app/styles/**`. That covers the light and dark tokens,
the day view, the add-food sheet and portion picker, the week and month view, onboarding, the
profile and data screens, and the dialogs and toasts. They are responsible for making the 60-second
logging flow feel instant, for the accessibility baseline, and for no horizontal scroll at 360 px.
The role is needed because the Boss uses a phone first, so the quality of the interaction is the
product, and that is a full-time job separate from the logic.

**QA / Test Engineer.** This engineer owns `tests/unit/qa/**`, `tests/data/**`, `tests/e2e/**`,
`tests/fixtures/**` and `playwright.config.js`. They write unit tests from `ARCHITECTURE.md` and
`NUTRITION.md` before reading any implementation. They also build the data gate for submissions from
the Lab and the Playwright suite for all four projects. They report failures to the owner and never
fix other people's code. The role is needed because the playbook requires independent
cross-testing, and because nutrition numbers have to be defensible: an independent tester is how we
prove that the code says what the Lab says.

I am asking for three and no more for now. I will cover design QA and accessibility review myself,
and we can look again at the review meeting.

## 6. Sprint 1 plan and file ownership

**Step 0 (Lena, blocking, short).** I set up `package.json` with the scripts `setup`, `check`,
`test`, `test:e2e` and `serve`, plus the lint and format configs, `docs/ARCHITECTURE.md` with the
contracts above, the `index.html` and `main.js` shell, and stub `app/core/*.js` files that throw
`not implemented`. Ownership of the stubs passes to the Core Engineer when I hand them over. The
stubs let the QA tests start out failing instead of crashing.

**Then four tracks run in parallel.** No file has two owners.

| Track | Sequence |
|---|---|
| Core Eng | units → dates → foods → days → search → targets (stub rules until Ayesha delivers) → storage |
| UI Eng | tokens/base CSS → day view + add sheet + portion picker (on fixtures and a fake store) → week/month → onboarding/profile → data screen |
| QA | fixtures + harness → spec unit tests (failing at first) → data gate → E2E skeleton on 4 projects → the Boss's day scenario from Bilal's checklist in `docs/CUSTOMER.md` |
| Lena | `ui/store.js` and `ui/router.js` → integration → reviews and bug planting → Artifact publish dry run |
| Lab (Ayesha) | `rules.js` + worked examples first → the ~15 foods in the Boss's day by mid-sprint → the rest |

**Integration order.**
1. The core passes QA's tests.
2. The day and add flow works on fixtures.
3. The real data replaces the fixtures.
4. Persistence and export/import work.
5. The week and profile views work.
6. The full E2E suite passes, Bilal tests it hands-on, and we publish a preview Artifact.

**Exit criteria.**
- `check` and E2E pass on all four projects.
- The Boss's day is logged in 60 s or less at phone size, both scripted and by Bilal.
- The app works with storage blocked.
- Every shipped food passes the data gate.
- The preview Artifact is published.

**Ownership:** Lena owns `package.json`, the configs, `docs/ARCHITECTURE.md`, `app/index.html`,
`app/main.js`, `app/ui/store.js` and `app/ui/router.js`. The Core Engineer owns `app/core/**` and
`tests/unit/dev/**`. The UI Engineer owns the rest of `app/ui/**` and `app/styles/**`. QA owns the
rest of `tests/**` and `playwright.config.js`. The Lab owns `app/data/**`. Anyone who needs a
change outside their own files asks me.

## 7. Risks

| Risk | Handling |
|---|---|
| The Lab's data and the code drift apart | Omar settles the field list at this meeting. After that, `validateFood` and the data gate are the contract, and any schema change goes through me and Ayesha. |
| Logging is too slow to meet the 60 s target | The E2E test has a budget on actions and time. Recents, the one-tap "+", adding several foods in a row and copying a slot all serve this target, and Bilal times it by hand. |
| localStorage is empty, throws, or the Artifact URL changes | The app falls back to memory with a banner, offers export prominently and keeps corrupt data. We always republish to the same URL. |
| Dates land on the wrong day near midnight | Dates are local ISO strings, `toISOString` is banned by lint, and tests run in two time zones. |
| Rounding drift ("the rows don't add up") | We sum full precision and round only for display, and QA tests the tolerance. |
| Artifact limits break features (alert, download, fetch) | We use `<dialog>` and textarea export, and E2E fails on calls to other origins or on `alert`. |
| A large database slows search | The index is built once. A QA performance test requires each keystroke on 2,000 foods to finish in under 16 ms. |
| Hires overwrite each other's work | The ownership map, lint and my review of every hand-off. |
