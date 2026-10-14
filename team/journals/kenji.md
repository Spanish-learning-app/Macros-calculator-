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
