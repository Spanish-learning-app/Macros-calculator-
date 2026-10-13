# Sprint 1 assignment: Kenji Tanaka, QA / Test Engineer

**From:** Lena (Lead Software Engineer) · **Date:** 2026-10-13 · **Starts:** now (Step 0 has landed)

## Read first

0. `team/meetings/002-boss-update.md` and the **Meeting 002 additions** at the end of this brief.
1. `team/briefs/_common.md`, `team/briefs/kenji.md`, `team/PLAYBOOK.md` §3, and your journal
   `team/journals/kenji.md`. If the journal has entries, continue from where it stops.
2. `docs/ARCHITECTURE.md`. This is your specification: §4 types, §5 core contracts, §6 data
   contract, §7.2 routes and §10 testing.
3. `docs/NUTRITION.md` and `app/data/rules.js` (Ayesha): target vectors and data-gate rules.
4. `docs/CUSTOMER.md` (Bilal): §2 test conventions (actions, starting states, test clock (Europe/Madrid since meeting 002),
   P1) and §4 acceptance tests A1–A15. The Sprint 1 tests are A1–A9 except A10 and A11, plus
   A12–A15.

**Write tests from these documents before reading any implementation.** That independence is the
point of your role.

## You own

`tests/unit/qa/**`, `tests/data/**`, `tests/e2e/**`, `tests/fixtures/**` and
`playwright.config.js`. Lena created the starters (the fixtures, the smoke spec and the config);
they are yours now. Do not edit `app/**`, `tests/contract/**` (Lena's), `tests/unit/dev/**`
(Hamza's) or the configs in the root. Ask Lena.

## Rules

- **`npm run check` must stay green for everyone.**
  - A QA unit test against a function that is still a stub (it throws
    `Error('not implemented: …')`) must be marked `todo`. Use a small helper in
    `tests/unit/qa/_helpers.js` that probes the function. Node counts failing `todo` tests but
    does not fail the run.
  - When Hamza implements the function, your tests become real without any edit from you.
  - E2E specs for features that are not built yet use `test.fixme`.
- **Fixtures:** `tests/fixtures/index.js` exports `{ RULES, FOODS }`. RULES is the real
  `app/data/rules.js`. FOODS is 16 fixture records, ids ending in `-fx`, that pass every Lab gate
  (`node research/check-foods.mjs tests/fixtures/foods.js`: 16/16). Keep fixture ids stable. Add
  records if you need them; every record must still pass the gate.
- **Playwright:**
  - Run `npm run setup` once; it links the preinstalled 1.56.1. **Never** run
    `playwright install`.
  - Import from `playwright/test`.
  - The projects are `phone`, `phone-dark`, `small` (360 px) and `desktop`.
  - The clock is `timezoneId: 'Europe/Madrid'` (meeting 002). Use `page.clock` to set the time each
    test needs.
- **E2E data:** until the real foods land, serve the fixtures in place of the app's data module:
  `page.route('**/data/index.js', r => r.fulfill({ contentType: 'text/javascript', body: 'export const RULES = ' + JSON.stringify(RULES) + '; export const FOODS = ' + JSON.stringify(FOODS) + ';' }))`.
  Once the real data has landed, run the D0–D4 flows against it too.
- **Selectors:** prefer roles and accessible names. Use the `data-testid` list Priya publishes in
  her journal.
- **Bugs:** report each one to its owner in your final report (Hamza: core; Priya: views; Lena:
  shell, store, router; Ayesha: data), with the failing test name and the steps. Never fix their
  code.
- **Journal** after each suite.

## Tasks, in order

1. **Take over the starters.**
   - Read `playwright.config.js`, `tests/e2e/smoke.spec.js` and `tests/fixtures/*`.
   - Run `npm run check` and `npm run test:e2e`. Both must pass (8/8 E2E today).
2. **QA unit tests for the core** (`tests/unit/qa/<module>.test.js`), written from §5 and its
   examples. Work in Hamza's order: units, dates, foods, days, search, targets, storage.
   - Property-style checks where they help:
     - no input is ever mutated (deep-freeze inputs)
     - `sumNutrients` is order-independent
     - `addDays(addDays(d, n), -n) === d` across years and DST, in all three time zones
     - `normalize` is idempotent
     - a boost never crosses a tier
   - **Targets:** NUTRITION.md §2.7 vectors A–K.
     - Rounded outputs exactly; unrounded ones to ±0.01.
     - `warnings` as a set, with `'estimate'` first when `ok`.
     - Also test every health flag and derived flag effect from the §2.5 tables, and prefs
       clamping.
   - **Storage:** throwing, `null` and quota-exceeded backends; corrupt and future documents; a
     round trip from export to import; every `parseImport` error code; both merge modes.
3. **Router tests** (`tests/unit/qa/router.test.js`): `parseRoute` and `formatRoute` for every route
   in §7.2, round trips, and bad hashes → `notfound`. This is Lena's code, and you test it.
4. **Data gate** (`tests/data/foods.test.js`). Implement Ayesha's checks yourself from RULES and
   `docs/NUTRITION.md` §3 and §8 (ARCHITECTURE §10.3), independently of Hamza's `validateFood`.
   Ayesha's own tool, `node research/check-foods.mjs`, implements the same gates. Where the two
   disagree, one of them has a bug: report it to Ayesha and Lena. Run them on:
   - `FOODS` from `app/data/index.js` (skip until that file exists)
   - each `app/data/foods-*.js`
   - the fixtures

   Checks:
   - HARD fields, and unique ids across all files
   - energy within `max(stated × 10%, 10 kcal)` of 4P + 4C + 9F + 2·fibre
   - P + C + F + fibre ≤ 100
   - `fiberZero` groups
   - group kcal range and serving gram ranges
   - `tagRules`
   - banned words with their allowed qualifiers
   - citation, method and grade from the vocabularies
   - exactly one default serving

   Print every failure with the food id and file. Also call `validateFood` (as `todo` until it is
   implemented).
5. **Performance test:** `searchFoods` on 2,000 synthetic foods takes under 16 ms per query (median
   of 50 queries).
6. **E2E, Sprint 1 acceptance** (`tests/e2e/a01-*.spec.js` … `a15-*.spec.js`). Script A1–A9 (not
   A10 or A11) and A12–A15 as `docs/CUSTOMER.md` defines them.
   - Count actions with a helper and assert each budget.
   - Use `test.fixme` until the feature lands.
   - Global checks on every spec: no requests to other origins; no
     `window.alert`/`confirm`/`prompt` (stub them and assert they are never called); no
     horizontal scroll; no console errors.
   - A13 step 5 uses an init script that makes every `localStorage` method throw.
7. **Timed flows:** D0 (A4) and D1 + copy (A5) as end-to-end timings on `phone`. Record the action
   counts and seconds in your journal for the review meeting.

## Cross-testing

You test Hamza's core, Priya's views and Lena's shell, store and router. Lena reviews your suites
by planting bugs (3 per core module); each planted bug must turn a test red.

## Final report (to Lena)

Report:

- the suites you wrote, with counts: pass / todo / fixme / fail
- every bug found, by owner
- the A-test status table
- the data-gate results for the Lab's files
- risks

Do not commit.

## Meeting 002 additions (binding; folded in by Lena)

`team/meetings/002-boss-update.md`: the Boss lives in Barcelona. `docs/CUSTOMER.md` is being
updated by Bilal (Madrid clock, A16–A19, a PhD weekday test day); re-read it before scripting.

- **Clocks:**
  - Europe/Madrid is primary: `playwright.config.js` uses `timezoneId: 'Europe/Madrid'`, and
    `npm test` runs Madrid, Karachi and Los Angeles.
  - Add Karachi and LA E2E specs where a date or slot depends on the zone
    (`test.use({ timezoneId })`).
- **DST, 25 Oct 2026** (Madrid 03:00 → 02:00):
  - Unit tests for `addDays`, `diffDays`, `weekDates`, `todayISO` and `minutesOfDay` around it.
  - One E2E with `page.clock`: log food at 02:30 on 25 Oct and again after the change. Both land
    on 25 Oct, and the week view for that week shows 7 days.
- **Logical day** (Manager decision, `team/DECISIONS.md`): the logging day starts at 04:00
  (`settings.dayStartMinutes = 240`, adjustable 0–300).
  - Food logged at 00:30 or 03:59 lands on the previous date, on both presets. At 04:00 it lands on
    the new date.
  - With the setting at 0, food lands on the calendar date.
  - "Move to another day" is one tap and can be undone.
- **Halal:**
  - QA unit tests: `validateFood` checks the `halal` field. `searchFoods` puts `not-halal` foods in
    `hidden` when `halalOnly` is on, and keeps `check` foods in `hits`.
  - E2E: the filter is on by default; there is a "1 hidden: not halal" line with its reason; the
    chip shows on `check` foods; a not-halal food never appears in recents.
- **Search:** `normalize` folds accents and deletes the Catalan middle dot. Café food is found by
  its Catalan, Spanish and English name (A19 is Sprint 1).
- **Data gate:** follow `docs/NUTRITION.md` §8, now G1–G22, which `research/check-foods.mjs`
  implements. New gates:
  - the `halal` field (G21)
  - no halal tags
  - at most one seafood tag
  - `not-halal` only for allowed groups, with a reason that mentions lard
  - no slot hints on not-halal foods
  - lunch-box `box` serving kcal within `boxServing.kcal`
- **Fixtures:** there are now 16, all passing the Lab gate (`es-ensaimada-fx` is the not-halal
  case, `pk-chicken-tikka-rice-box-fx` the lunch box).
- **Acceptance:** A19 and A20 (the Madrid clock change) are Sprint 1; script them. A16–A18 are
  Sprint 2 (`test.fixme` stubs that document the budgets).
- **Two spec conflicts are open.** Lena has raised both with Omar. Until they are resolved:
  - **A20 (2) and (3) against the 04:00 day start.** CUSTOMER.md expects the two 02:30 entries on
    25 Oct, but with `dayStartMinutes = 240` they belong to 24 Oct. Script A20 twice:
    - with `dayStartMinutes = 0`, asserting CUSTOMER.md's calendar-date expectations;
    - with the default 240, asserting that both 02:30 entries land on 24 Oct.
    Keep whichever Omar confirms.
  - **A8 step 2 ("plate × 0.5" of plain rice) against NUTRITION.md §5.4** (rice has no plate
    serving until a source is found). Script step 2 with the katori serving × 0.5 and mark the
    plate variant `test.fixme`.
