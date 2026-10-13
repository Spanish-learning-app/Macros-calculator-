# Sprint 1 assignment: Hamza Qureshi, Core Logic Engineer

**From:** Lena (Lead Software Engineer) · **Date:** 2026-10-13 · **Starts:** now (Step 0 has landed)

## Read first

1. `team/briefs/_common.md`, `team/briefs/hamza.md`, `team/PLAYBOOK.md` §3, and your journal
   `team/journals/hamza.md`. If the journal has entries, continue from where it stops.
2. `docs/ARCHITECTURE.md`. §4 (data model) and §5 (your contracts) are binding.
3. `app/core/*.js`. These are the stubs. Signatures and JSDoc are final; you replace the bodies.
4. `docs/NUTRITION.md` and `app/data/rules.js` (Ayesha). Every number in `targets.js` comes from
   them.
5. `docs/CUSTOMER.md` §4: A2, A3 (search), A5, A6, A8, A12 and A13 depend on your code.

## You own

`app/core/units.js`, `dates.js`, `foods.js`, `days.js`, `targets.js`, `search.js`, `storage.js`, and
`tests/unit/dev/**`. Do not edit `app/core/types.js`, `docs/ARCHITECTURE.md`, or the
`tests/contract/` tests; ask Lena. Everything else belongs to someone else.

## Rules

- **Implement the contracts exactly.** No new exports and no changed parameters.
  `tests/contract/exports.test.js` fails on any drift. If a contract looks wrong, stop and tell Lena
  in your journal and final report; do not work around it.
- **Keep the core pure.** No DOM, no `localStorage`, no `Date.now()`, no `new Date()` with no
  arguments, and no `Math.random`. ESLint enforces all of these. Never mutate an argument.
- **Numbers:** sum unrounded and round only where the contract says (`units.round`, and targets per
  NUTRITION.md).
- **Write tests first** in `tests/unit/dev/<module>.test.js`. Use `tests/fixtures/index.js`
  (`RULES` is the real rules; `FOODS` is 12 fixture records). Never use `app/data/foods-*.js` in
  unit tests.
- **Independent testing:** Kenji writes his own tests in `tests/unit/qa/` from the spec, and his
  tests count. Do not read or edit his tests to make yours pass. If his test and the spec disagree,
  raise it with Lena.
- **Gate:** `npm run check` must pass before each hand-off. It runs lint, format and tests in
  Asia/Karachi and Europe/Madrid.
- **Journal** a timestamped bullet after each module.

## Tasks, in order

Hand off each module as soon as it is done, so Priya and Kenji can use it. A hand-off means:
`npm run check` passes, a journal entry, and a line in your final report.

1. **`units.js`.** Do this first, because Priya needs `round` and `formatQty` for display.
   - Done when: every export works as in §5.1. Your tests cover `round(1.005, 2) === 1.01`,
     `round(2155, -1) === 2160`, `round(2.5) === 3`, `round(-2.5) === -2`, `ftInFromCm(182.88)`
     → `{ ft: 6, inches: 0 }`, `formatQty` for 0.25/0.5/0.75/1.5/2/0.33, and `RangeError` cases.
2. **`dates.js`.**
   - Done when: every export works as in §5.2. Tests cover month and leap-year boundaries
     (2028-02-29), `isISODate('2026-02-30') === false`, `weekDates` for `weekStartsOn` 0, 1 and 6,
     `monthGrid` row counts (4–6), and a DST week in Europe/Madrid (last Sunday of March and of
     October). They must pass in both time zones.
3. **`foods.js`.**
   - Done when: every export works as in §5.3.
   - `validateFood(food, RULES)` returns `[]` for all 12 fixtures (ids end in `-fx`), and a clear message for each
     broken HARD field: missing id, two defaults, serving id `'g'`, negative nutrient, unknown
     group or tag.
   - `energyCheck` uses `max(stated × pct / 100, kcal)`.
   - `variantsOf` on the karahi fixture returns [home, restaurant].
4. **`days.js`.**
   - Done when: every export works as in §5.4, with no mutation. Freeze inputs in your tests with
     `Object.freeze` deep.
   - `copyDay` and `copySlot` give fresh ids and the requested status.
   - `switchEntryFood` from home to restaurant karahi keeps `katori × 1.5`. Switching to a food
     without that serving keeps the grams.
   - `dayTotals` with `include` set to `eaten`, `planned` and `all`.
   - `slotForTime` uses `RULES.mealSlots.default`. Windows wrap, and 23:59, 00:00 and 03:59 map
     correctly.
5. **`search.js`.**
   - Done when: every export works as in §5.6.
   - Test with the fixtures: `roti`, `chapati`, `phulka`, `Roti`, ` roti ` (with spaces) put
     `pk-roti-home-fx` first.
   - `dal`, `daal`, `dhal` and `دال` find the daal. `karhai` finds both karahis (Damerau swap).
   - `anday` finds the egg. `chawal` and `chaawal` find the rice. `tortilla` finds the tortilla.
   - A boost never lifts a food above a higher tier.
   - `recentForSlot` includes foods used in other slots (A6).
   - `searchFoods` on 2,000 synthetic foods takes under 16 ms per query. Measure it in your test.
6. **`targets.js`.**
   - Done when: every export works as in §5.5, following `docs/NUTRITION.md` §2.2 steps 1–12 in
     order.
   - All binding vectors A–K in NUTRITION.md §2.7 match:
     - rounded outputs exactly
     - unrounded ones to ±0.01
     - warnings as a set, with `'estimate'` first when `ok`
   - C is the half-up tie test (carbs 232.5 → 233). E is the kcal floor. G is the kidney cap. H
     is the pregnant goal lock. I is a minor (`ok: false`). K is prefs
     `{ proteinGPerKg: 2.2, fatPct: 25 }`.
   - Each health flag and derived flag also has a test for its effect.
   - Every constant comes from `RULES`; there are no nutrition numbers in your code.
7. **`storage.js`.**
   - Done when: every export works as in §5.7, tested with an in-memory backend.
   - Tested cases: empty; a backend whose methods throw; the backend is `null`; corrupt JSON (the
     raw text is kept under `mmc.v1.corrupt.<stamp>`); a future `schemaVersion` (`save` refuses);
     quota (`setItem` throws `QuotaExceededError`).
   - `serializeExport` → `parseImport` round-trips to a deep-equal document.
   - `mergeImport` handles replace and merge, with incoming winning on the same entry id.
   - `parseImport` returns every error code.
8. **Coverage.** `npm run test:coverage` reaches at least 90% of lines in `app/core`.

## Cross-testing duty

Once Priya's Day view and add sheet are in the integrated build, do a hands-on review at 360 px
and 412 px (Playwright screenshots are fine). Report the issues to Priya in your final report,
with steps and screenshots. Do not edit her files.

## Final report (to Lena)

Report:

- which modules are done, and the `npm run check` result
- coverage %
- any contract questions
- anything you need from Ayesha (NUTRITION.md ambiguities)
- risks

Do not commit.
