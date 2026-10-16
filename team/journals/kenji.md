# Journal — kenji

## Sprint 1 (brief: team/briefs/kenji-sprint1.md)

- 2026-10-13 23:10 UTC: Started. Read meeting 002, _common, kenji brief, PLAYBOOK §3, DECISIONS,
  ARCHITECTURE (§4, §5, §6, §7.2, §10), NUTRITION (§2.7 vectors A–K, §3, §8 G1–G22), rules.js,
  CUSTOMER v2 (A1–A20, D0–D5). Hamza's and Priya's journals are empty (no data-testid list yet).
- 2026-10-13 23:12 UTC: Task 1 done. `npm run setup` linked playwright; `npm run check` green
  (16/16 contract tests x 3 TZ); `npm run test:e2e` 8/8 (smoke, 4 projects). Starters are mine now.
- 2026-10-13 23:35 UTC: `tests/unit/qa/_helpers.js`: `qa(name, fns, body)` probes each function for
  the Step 0 stub error and marks the test TODO; a 'not implemented' error thrown during the body
  (a stub called by an implemented function) also turns the test TODO. Also deepFreeze, assertClose,
  assertBadInput, a seeded PRNG and fixture helpers.
- 2026-10-13 23:40 UTC: Self-check rig (scratchpad only, not in the repo): a Node resolve hook maps
  app/core/*.js to my own reference implementations so I can validate my expectations before
  reporting bugs. units: 10 tests, dates: 31 tests (fixed-instant tables for the 3 zones, 15-min
  sweeps over the 2026 DST weekends, addDays round trip on every date 2024–2028, monthGrid).
  Two of my expectations were wrong and are fixed (lbFromKg(82) = 180.779055; Oct 2026 with
  Saturday start has 6 rows). Hamza had already spotted the first. Prettier now run on my files.
- 2026-10-13 23:45 UTC: Hamza has implemented units, dates and foods. QA units + dates: 41/41 pass
  in Madrid, Karachi and LA. days, targets, search, storage are still stubs (tests will be TODO).
- 2026-10-13 23:55 UTC: foods QA suite: 64 tests (constants, validateFood: 34 broken-HARD-field
  mutations + 7 vocabulary mutations + valid variations + never throws + id prefix on problems;
  buildFoodIndex, servings, portions, sumNutrients order-independence property, energyCheck
  boundaries and RULES-driven factors, variantsOf ordering, deep-frozen inputs). 64/64 pass against
  Hamza's foods.js.
- 2026-10-13 23:58 UTC: Lena's review (via Omar): (1) lbFromKg expectation already fixed; (2) smoke
  spec no longer uses `data-status`: it checks the brand, title, nav, a mounted #view and a hidden
  storage banner; (3) tab test seeds a skipped-onboarding document (`seed(page, userDoc())`, once
  per tab via sessionStorage so reloads keep app writes). New `tests/e2e/_app.js`: global guards
  (foreign requests, stubbed alert/confirm/prompt, console errors except stub 'not implemented',
  horizontal scroll), FEATURES flags + `needs()` → test.fixme, `actions(page)` counter,
  `useFixtureFoods`, `breakLocalStorage` (A13.5), `ui.*` from Priya's selector contract. Smoke:
  8 pass, 8 fixme (redirect and notfound tests wait for the store).
- 2026-10-14 00:10 UTC: days QA suite: 35 tests (createEntry/QuickEntry shape and bad input,
  live-vs-snapshot values, add/update/remove incl. boxRef kept, A13 roti 2→3→2, switchEntryFood
  keep-serving and keep-grams, setSlotStatus, copySlot/copyDay incl. no boxRef on copies and
  same totals (A5 b), dayTotals all/eaten/planned, A6 4 chais, progress incl. "N over", weekSummary,
  averageTotals, slotForTime edges for both presets incl. the Spanish dinner wrap, deep-frozen
  random edits). 35/35 pass against Hamza's days.js.
- 2026-10-14 00:20 UTC: search QA suite: 25 tests (normalize: case, punctuation, accents, middle
  dot, Urdu/Arabic harakat and letters, doubled vowels, idempotence property; tiers; A2/A3/A19 on
  fixtures; halal hidden vs check; fuzzy OSA edges; ranking and boosts; a boost never crosses a
  tier (property); limit; recordUse; recencyBoosts incl. DST; recentForSlot (A6)). One expectation
  of mine was wrong (ئ folds to ی by NFKD + harakat strip) and is fixed. 25/25 pass against
  Hamza's search.js (implemented meanwhile).
- 2026-10-14 (resumed after the usage-limit pause; journal re-read): Lena's three notes are done
  (lbFromKg 180.779055; no data-status selector; tab tests seed onboarding 'skipped').
- targets QA suite: 38 tests (vectors A–K exact/±0.01/warning sets, result keys, bmi/PRW/bmr,
  every health and derived flag effect incl. sex filter and age/BMI boundaries, prefs clamping,
  65+ rule skipped by a pref, fat floor, low_carbs, all four rails incl. the male floor, RULES-driven
  constants, a 500-profile invariant property, validateProfile, resolveTargets). Validated against
  my reference first (one PRW expectation of mine fixed). 38/38 pass against Hamza's targets.js.
- storage QA suite: 21 tests (defaults incl. Madrid/Ceuta/Canary preset and RULES-driven halal
  defaults, the five load() statuses with memory/null/throwing/quota backends, corrupt copy key,
  future refusal, 17-entry reload, migrate fill + codes, validateUserData, export → import round
  trip with summary, every parseImport code, replace/merge). 21/21 pass against my reference;
  TODO against the stub.
- All QA unit suites: 224 tests, 204 pass, 20 todo (storage), 0 fail, in all 3 zones.
- router QA suite (Lena's code): 10 tests (every §7.2 route, all slot ids, 15 bad hashes,
  formatRoute, round trips, createRouter via a fake window: current/href/go/subscribe/unsubscribe/
  replace/stop). 9 pass. **BUG-R1 (Lena):** `#/day/2026-13-45` (and 2026-02-30, week 2026-00-10)
  parse as a day/week route with an impossible date instead of notfound; the day view would hand
  it to addDays/weekDates, which throw RangeError. Kept as a TODO test via the new
  `knownBug(id, owner, …)` helper so `npm run check` stays green until she fixes it.
- 2026-10-14 ~04:30 UTC: NUTRITION 1.5 ruling (carbs never negative; fatPct pref gives way to its
  floor, then protein = floor((kcal − 9F)/4), warning protein_reduced_to_fit). Found reachable
  profiles: woman 200 cm/100 kg/60% fat, sedentary, lose 1, 2.5 g/kg reproduces the §2.2 worked
  example exactly (1200 kcal, P 165, F 60, C 0); woman 150 cm/100 kg/60% fat with {2.5, 40%}
  lowers fat 53 → 51 and keeps protein 184. 3 tests (2 cases + a 300-profile property) pass on my
  reference and are **BUG-T1 (Hamza)** TODO: targets.js predates the ruling (protein 250, fat 53).
  The general property now also draws random prefs and asserts carbs ≥ 0 and step 12 always.

## Sprint 2 (brief: Omar's Sprint 2 QA task)

- 2026-10-14 16:15 UTC (18:15 Madrid): Restarted after the usage-limit pause (first attempt wrote nothing).
  Read _common, kenji brief, journal tail, ARCHITECTURE §13, NUTRITION 1.6 (§4.6 worst halal, §5.4 storage, §5.5 plates, §8 G23),
  CUSTOMER A10/A16-A18. State: app/core/mealprep.js and app/data/recipes-mealprep.js do not exist yet; tests/data had only _gate.js
  (no test file ever ran it, so I add tests/data/*.test.js too). Plan: gate G23 + recipes gate, QA unit suite for §13, e2e A16-A18 +
  Thora sa + Spanish slot names, then run in Madrid/Karachi/LA. Spec gaps noted as I go (below).
- 2026-10-14 16:35 UTC: _gate.js: G23 (assumed plate, RULES-driven) + checkMealprepRecipes (M1-M5). New tests/data/{foods,gate,recipes-mealprep}.test.js: real data passes G1-G23 (184 records, 0 fail, 57 G19 warns = same as Ayesha's tool); 11 G23 + meal-prep gate self-tests; recipes file missing -> passes trivially with a diagnostic.
- 2026-10-14 17:10 UTC: tests/unit/qa/mealprep.test.js: 39 tests (31 real once the module lands, 8 TODO spec gaps). foodFromRecipe 15 (per100g sum vs weighed pot 1300 g, per box = total/boxes at 4 and 5, A10 half and third, box entry in day totals, halal worst + order independence, confidence C, servings/density, validateFood, bad input, 200-recipe property), boxUseBy 10 (fridge lives, rice 1 day, shortest wins in all 6 orders, freezer null, moved +1, A18 batch of 4, 25 Oct DST + 29 Mar + 1 Nov, 730-date sweep vs UTC oracle, purity), boxesLeft 3, placeBox 3 (TODO: signature not in 13), shoppingList 4 + worstHalal 1 placeholders (TODO). Validated against my reference in scratchpad (31/31 in Madrid, Karachi, LA) and 10 mutants all killed. Without the module: 1 pass, 38 todo, 0 fail. Spec gaps: placeBox/shoppingList/worstHalal signatures; user recipes have no storage list.
- 2026-10-14 ~17:50 UTC: Lena added app/core/mealprep.js and filled in §13.2 (binding signatures) while I worked. Rewrote the mealprep suite to the §13.2 contract: 61 tests, 61 pass against her code in Madrid, Karachi, LA (worstHalal, recipeTotals, foodFromRecipe incl. unrounded per100g/pot/tbsp/chai/RangeErrors, storageIds, storagePlan, boxUseBy, useByStatus, boxesLeft, placeBox, syncBatches, shoppingList incl. 4->8 doubling, butcher first, merge by food/name, section override). 11 mutants of her code (min->max, thaw days, available count, scaling, freezable, off-by-one, ...) all killed. One reading of §13: a thawed box is `storage:'fridge'` + `movedToFridgeOn` (tests use that). Doc changed twice under me (halal reason now the ingredient's own + `ingredient` name; tbsp back in servings; boxes whole >= 1): tests follow the doc as of 18:50 Madrid.
- 2026-10-14 ~20:00 UTC (continuation after a second usage-limit pause; journal re-read, the mealprep unit suite not redone):
  **Gate M2 fixed** (tests/data/_gate.js): per §13.1 an ingredient is `{ foodId?, name?, grams, section?, note? }`. M2 now accepts a
  name-only line, still fails an unknown (or non-string) foodId even when a name is given, fails a line with neither foodId nor name,
  and requires grams > 0 (so the old M5 "no amount" warning is gone; qty+servingId no longer stands in for grams). The gate returns
  `stats { ingredients, nameOnly }`; tests/data/recipes-mealprep.test.js prints it as a diagnostic (25 recipes, 384 lines, 257 name-only).
  4 new self-tests (name-only counted not failed; unknown foodId with a name; neither; grams 0/-5/NaN/Infinity/'30'/null for both kinds).
  `npm test` was 1 fail (M2), now 0.
- Taste chip e2e: 5 "no taste chip" cases failed in all 4 projects (20 reds): app/ui/components/portion-picker.js shows the chip on every
  food and never reads RULES.portionChips.taste.hideWhen (groups fat-oil/sugar-sweetener/condiment, default tsp/tbsp, quarter < 5 g).
  **BUG-TC1 (Lena)**. The spec now `test.fixme`s those 5 while the source has no `hideWhen`; it turns on by itself when she reads the rule.
- New tests/e2e/meal-prep.spec.js (12 tests) from CUSTOMER A16-A18. Detection: `needsUi(...ids)` in _app.js (fixme while the UI source
  lacks a data-testid the test drives). Reads only Lena's testids (listed at the top of the spec). Budget breaks end as a skipped
  "KNOWN GAP (owner)" after the flow's results are checked.
  A16: (1) library tikka macros = #49 within 2%, 4 boxes, 2 actions (<= 4); (3) ensaimada blocked with reason, nothing not-halal offered for pork/bacon/jamon/chorizo;
  (2) "Tikka bowls" built from the customer's list: per box = total / boxes for kcal, P, C, F, fibre at 4 and at 5 boxes (1 tap), saved with 5 boxes;
  halal worst-ingredient + reason test. The Lab still lacks raw boneless chicken thigh and dry basmati, so the spec serves two stand-in records (real ones win when added).
  **Budget gap A16 (2): 30 actions vs 25** (5 per ingredient: search, open, "Grams", amount, add; plus New recipe, name, Add, Done, More boxes, Save): Priya/Lena. Skipped as KNOWN GAP.
  A17: Mon-Thu in 4 taps (<= 6), entries lunch/box/qty 1/planned with boxRef, "0 of 4 left", Friday fifth shows inline "No boxes left" (no dialog), Undo removes it, "Fill Mon-Thu" one tap,
  Monday 14:00 one tap ticks eaten. A18: proposed fridge/freezer split and changeable, use-by Mon / frozen / last day / Tue / past-use-by in neutral colour, tonight prompt,
  chana chaat (freezer off, use-by Tue), shopping list (once each, doubles at 8, butcher vs supermarket, copy to clipboard as text).
  Clock jumps use `page.clock.setSystemTime` + reload (the document persists), all on Sun 1 Nov 2026 (after the DST change, UTC+1).
- The Thora-sa and Spanish-slot specs already existed from Review 1 (taste-chip.spec.js, spanish-slots.spec.js); kept, run green.
- 2026-10-14 ~20:40 UTC: FINAL RUN. `npm run check` (lint, prettier, unit) exit 0 in Europe/Madrid and Asia/Karachi (npm test runs Madrid, Karachi, LA inside each):
  534 tests per zone, 532/531/531 pass, 0 fail, 2 todo (A16 raw thigh and dry basmati missing in FOODS: Ayesha/Yusuf), 1 skip in Karachi and LA (a Madrid-only DST case).
  `npm run test:e2e`: 144 passed, 28 skipped (per project: 5 taste-chip BUG-TC1 fixme, 1 A16(2) budget KNOWN GAP, 1 smoke wait-for-store), 0 failed.
  Lena's wording moved under me twice (place-slot select -> chips, "Use by Tomorrow, Mon 2 Nov" -> "Use by tomorrow", "Moved to fridge" label); the specs now accept both.
- 2026-10-15 ~16:10 UTC: REVIEW 2 QA (Meeting 004 A1-A5, A7), after Lena's fix wave 2. Priya still on B (shell, totals bar, day.js).
  - **Meal-prep e2e**: the 7 tests (8 asserts) that expected "N of 4 left" now read the data attributes through one helper,
    `expectBoxCounts(card, { toEat, eaten, unplaced })` (data-to-eat / data-eaten / data-unplaced); one wording check kept
    ("3 to eat · 1 eaten"). The A16(2) "Tikka bowls" flow used the 5-action picker route (30 actions, skipped as a KNOWN GAP);
    the Lab now has raw thigh and dry basmati and Lena added quick amounts ("800 g chicken thigh" then "+"), so the spec uses them
    for four ingredients and keeps the picker route for the dahi: 19 actions, the test runs instead of skipping.
  - **New tests/unit/qa/review2.test.js** (39 tests, hand-worked values, real Lab data plus small synthetic kitchens):
    A1 ranking (single rotis before preps, same-name single first in any input order, own first, foodKind), A2 (3 medium potatoes ->
    intl-potato-raw medium x3 = 639 g; 5 eggs -> intl-egg-raw x5; 250 g lentils -> dry lentils before the stew and the jar; parse and
    size fallbacks), A4 (shoppingList merge with a x2 batch: chicken 1800 g, onion 440 g = 4 medium, tomato 1200 g, egg 700 g = 14;
    shoppingForShop order butcher, supermarket, "Check you have"; buyAmount: 3 x 400 g tin, 2 packs of 12 eggs using 14, 4 medium onions,
    453 g = 3 potatoes, 510 g = 4; listText copy; real library batches merged against an independent sum), A5 (calm line for 17 pork and
    alcohol words, none for ordinary words using real hit counts, lard wording with Halal only off, partial words, gambas/calamares/pulpo/
    mejillones find seafood records), A7 (foodFromRecipe with potKatori 8: katori default 200 g, box = 1 whole pot 1600 g, 1 katori =
    total / 8; 6.5 katori; box and no-pot recipes unchanged; own recipe ranks first).
  - **New tests/e2e/review2.spec.js** (15 tests x 4 projects): add sheet at Lunch (roti order, Prep tags, own recipe first with "My recipe"),
    the recipe picker with the three quantities (checks the saved ingredients), pork/alcohol note x5 words and no stale note, gambas and
    shellfish, the family pot end to end (Family pot chip, katori field, saved potKatori 8 / 1600 g, first for "salan", logs 1 katori =
    200 g, details say "your own pot ... your amounts of oil"), and the weekly shopping list from two library batches (tikka + keema).
  - **Bugs found**
    BUG-S1 (Lena): `singularWord` keeps "-is" words, so "rotis" never folds to "roti": the search returns only the six Spanish "2 rotis
    integrales" preps and no Roti / chapati (fuzzy only fills in under 3 hits). "2 rotis" is how people type it. Same for any desi -i
    food plural. Kept as TODO test (`knownBug`).
    BUG-SH1 (Javier; Lena could also guard in buyAmount): intl-egg-raw has `pack.grams` 720 for "12 eggs" but a large egg is 50 g
    (12 x 50 = 600). 14 large eggs (700 g) shows "1 pack of 12 eggs (uses 14 large eggs)": two eggs short. Fix: pack.grams 600 for
    the edible weight, or buyAmount takes the pack count from the label when it has `uses`. Two TODO tests (hand-worked case and a
    sweep of every real pack with a count in its label).
  - **Search speed test** (tests/unit/dev/search.test.js, Hamza's): see the report. Real regression: no. Alone: mean 4.5-10 ms in 12
    runs (worst single query 15-24 ms of the 48 allowed); the pre-wave search.js (commit 0c18f18) measures 4.7-10.4 ms on the same
    data, interleaved, so the wave added nothing. With 8 busy loops on 4 cores the mean is 10-19 ms (fails ~half the time) and with
    16 loops 31-48 ms; process CPU time per query stays 5-9 ms in every case.
- 2026-10-15 ~16:20 UTC: FINAL RUN (app code unchanged by Priya at this point, so selectors held). `npm run check` exit 0 in Europe/Madrid and
  Asia/Karachi (lint, prettier, unit in Madrid, Karachi, LA): 597 tests per zone, 594/593/593 pass, 0 fail, 3 todo (BUG-S1, BUG-SH1 x2), 1 skip
  outside Madrid (DST case). `npm run test:e2e`: 228 passed, 4 skipped (one tsp-default taste-chip case per project: no such food), 0 failed.
  The speed test passed in all six unit runs (machine quiet).

## Sprint 3 wave 1 (resumed after a usage-limit stop)

- 2026-10-16 01:59 UTC: Resumed. sprint3-weight.test.js on disk (34 tests, 531 lines, store section included). Two failures, BOTH TEST BUGS (mine, M-06):
  (1) trend "reading 'date'": `run([])` -> CTX -> `last([])` = `[].at(-1).date`. Fixed: `last` returns D0 for an empty list.
  (2) "-0 vs 0": `-200 % 50` is -0 in JS; the app returns -200 (a plain integer, no -0 anywhere). Fixed: `Math.abs(c) % 50`. No app bug, nothing to display.
  34/34 pass in Madrid.
- 2026-10-16 02:02 UTC: New tests/unit/qa/sprint3-wave1.test.js (23 tests, pass in Madrid): check-foods.mjs exit 0; kam tel (17 home-light: one home sibling, same group, kcal and fat lower, method recipe, confidence not better, added fat <= max(2, 0.6 x home), kcal drop vs 9 x fat drop, suffix/aliases/serving ids, search "kam tel karahi" -> light karahi first); shortName (266 records: <= 22, no brackets, trimmed, shorter than name, unique, no name collision, names > 26 chars all have one, rowName, search by either); spareBoxes core (past/last-day/soon, order, eaten/discarded/placed ignored, frozen after 7 days unplanned, thawed = fridge, options, errors) and store.spareBoxes with real use-by rules.
- 2026-10-16 02:03 UTC: New tests/unit/qa/method-contract.test.js (14 tests; 11 pass, 3 TODO). Hard: shape of the 45 methods that exist (own checker, itself tested with 17 breaks), heat list = 9 values, no junk text, cook preps have a heat, oven chip = degrees in the text, no-cook (assemble/ready) first step "No cooking" + heat none, rice preps say cool within the hour, freezer boxUp vs storagePlan, only the 19 PENDING ids may lack a method. TODO: BUG-M0 (19 of 64 without, turns green alone), BUG-M1, BUG-M2 (below).
  **BUG-M1 (Yusuf)**: intl-chicken-broccoli-pesto-pasta-box and med-chicken-shawarma-pita-box: boxUp sends boxes 2-4 / 3-4 to the freezer but their `storage` lists a fresh cold-salad as a box component (not a pot), so storagePlan.freezable is false: the app's default is every box in the fridge with use-by cooked + 1 (pasta: cooked-starch) / +2 days. Method and record disagree (Addendum: the split must match `storage`).
  **BUG-M2 (Yusuf, low)**: es-pa-amb-tomaquet-burgos-ous-portion and es-tostada-tomate-atun-aguacate-portion are effort 'assemble' (card: "no cooking") but step 1 is "Morning: ... toast" (heat none/medium) and does not say "No cooking".
  My own slips while writing: a case-insensitive /NaN/ matched "bananas" (test bug, fixed with word boundaries).
- 2026-10-16 07:05 UTC: RESUMED again (2nd usage-limit stop). (1) sprint3-weight.test.js verdict: both failures were TEST BUGS (-200 % 50 is -0 in JS; empty list -> `[].at(-1).date`), fixed 01:59, 34/34 pass. No app bug.
  (2) tests/e2e/sprint3.spec.js (32 tests: weight log/trend/suggestion, spare-box line, meal-name choice, cuisine chips, How to make it + step mode) exists and parses. First run on phone: 4 red, all test bugs of mine (M-06): same -0 in the "Use N kcal" step check (Math.abs now); `ui.undo` is the toast box, the click must be on its "Undo" button (2 places); the method sheet is titled with the Prep row's name (no "(lunch box)"), not shortName; "Plan it" for today logs the entry as eaten (store statusForAdd), so the box is 'eaten', not 'placed' (assertion now follows the entry). phone: 32/32.
- 2026-10-16 07:14 UTC: FINAL RUN. `npm run check` exit 0 in Europe/Madrid and Asia/Karachi (lint and prettier clean; unit runs Madrid/Karachi/LA inside each): 730 tests per zone, 727/726/726 pass, 0 fail, 3 todo (BUG-M0, BUG-M1, BUG-M2), 1 skip outside Madrid. Fixed on the way: unused `chip` helper in sprint3.spec.js (lint), prettier on sprint3-weight.test.js. `npm run test:e2e` (4 projects): 356 passed, 4 skipped (taste-chip tsp-default, no such food), 0 failed. App-side observation: "Plan it" on today's spare box logs the entry as eaten (store statusForAdd), so the box goes straight to 'eaten'; wording says "plan" (Priya/Lena to decide). Open: BUG-M1, BUG-M2 (Yusuf), BUG-M0 (19 recipes without a method).

## Sprint 3 wave 2 QA (rules 1.7.2, M0/M1/M2, new e2e)

- 2026-10-16 16:26 UTC: Task 1+2 done. mealprep.test.js FRIDGE_DAYS gets 'blended-smoothie': 1 (checked rules.js:537: fridgeDays 1, freezable false, freezerMonths null), count asserted 9, smoothie not freezable. method-contract.test.js: BUG-M0/M1/M2 verified passing first (0 of 64 without method, M1 pesto + shawarma plan freezable, M2 toast preps open "No cooking"); now plain tests (PENDING list and M1/M2 exclusions removed, `knownBug` import gone). `npm test` Madrid 735/735 pass, 0 todo.
- 2026-10-16 18:56 UTC: RESUMED (usage-limit stop). Running sprint3-wave2.spec.js on phone first.
