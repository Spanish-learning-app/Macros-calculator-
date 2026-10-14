# Journal — hamza

## Sprint 1 (brief: team/briefs/hamza-sprint1.md)

Timestamps are UTC.

- 2026-10-13 22:50 Started Sprint 1. Read the brief (incl. Meeting 002 additions), _common.md,
  hamza.md, PLAYBOOK §3, DECISIONS.md, ARCHITECTURE §4–§5, all core stubs, NUTRITION.md, rules.js,
  CUSTOMER.md §4 (A2, A3, A5, A6, A8, A12, A13, A19, A20). Journal was empty: fresh start.
  Baseline `npm run check` passes (16 contract tests). `tests/unit/` does not exist yet.
- Binding decisions I follow: logging day starts at 04:00 (`todayISO(now, 240)`; 00:00–03:59 is
  the previous date); A20: both 02:30s on 25 Oct 2026 belong to 24 Oct with dayStart 240.
- Plan (brief order): units → dates → foods → days → search → targets → storage → coverage.
  Tests go in `tests/unit/dev/<module>.test.js`. I will not read `tests/unit/qa/` until the end.
- 2026-10-13 23:00 **HAND-OFF: `core/units.js` DONE and tested. Priya can use `round` and
  `formatQty` now.** 14 tests in `tests/unit/dev/units.test.js` (round 1.005→1.01, 2155,-1→2160,
  2.5→3, -2.5→-2, never -0; ftInFromCm 182.88→{6,0}; formatQty ¼ ½ ¾ 1½ 1¼ 2 0.33; RangeError on
  unknown unit, negative/non-finite amount, qty ≤ 0, non-integer decimals; TypeError on a
  non-number). `npm run check` green in Madrid, Karachi and LA (30 tests).
  Notes for users: `round` is decimal-exact (it shifts the decimal string, not `x * 10^n`);
  `formatQty` rounds to 2 decimals first, so 0.501 shows '½'.
- 2026-10-13 23:10 **HAND-OFF: `core/dates.js` DONE and tested.** 13 tests in
  `tests/unit/dev/dates.test.js`: leap years (2028-02-29, 2100 not leap), month/year boundaries,
  `isISODate('2026-02-30') === false`, weekDates for 0/1/6, monthGrid 4/5/6 rows, every day of
  2026 once, A20 steps 4–5, and an Intl oracle over the Madrid (29 Mar, 25 Oct) and LA (1 Nov)
  DST weeks every 15 min. Per-zone expectations for both 02:30s on 25 Oct: in Madrid both give
  minutes 150 and `todayISO(…, 240) === '2026-10-24'` (DECISIONS.md A20). `npm run check` green
  in all three zones (43 tests). Day maths uses UTC day numbers; only todayISO/localDateTime/
  minutesOfDay read the local clock. Bad input: TypeError for a non-string/non-Date, RangeError
  for an unreal date, non-integer n, weekStartsOn ∉ {0,1,6}, dayStartMinutes ∉ 0..1439.
- 2026-10-13 23:25 Contract update received (Omar relaying Lena): `settings.onboarding`
  ('pending'|'done'|'skipped'), defaultData → 'pending', validateUserData accepts it. Verified in
  types.js, storage.js JSDoc and ARCHITECTURE §4.5/§7.3 (missing → 'done' if profile else
  'pending'; I will fill it that way in `migrate`). `tests/unit/dev/store.test.js` is Lena's
  (ARCHITECTURE §3 now says so): I run it, I don't edit it. NUTRITION 1.2 §2.1a (skip = reference
  targets) is the store's job; computeTargets is unchanged.
- 2026-10-13 23:25 units.js: a non-number where a number is expected now throws RangeError (not
  TypeError), following the letter of §5 ("RangeError on a non-finite amount"). Same rule in foods.
- 2026-10-13 23:30 **HAND-OFF: `core/foods.js` DONE and tested.** 15 tests in
  `tests/unit/dev/foods.test.js`: all 16 fixtures valid with and without RULES; one clear message
  per broken HARD field (missing id, two/zero defaults, serving id 'g', negative nutrient,
  unknown group/tag/style/slot/method/grade, halal missing/bad status/missing reason, old halal
  tags); never throws (null, arrays, throwing getters, Proxy); energyCheck uses
  max(stated × pct/100, kcal) from RULES and is float-clean (chai computed 71.4); variantsOf on
  karahi → [home, restaurant]; deep-frozen inputs throughout.
  Gate status: my files lint and format clean, and all my tests pass in all 3 zones. **`npm run
  check` is red for reasons outside my files:** (1) Prettier flags `app/ui/dev/fake-store.js`
  (Priya) and `tests/unit/qa/_helpers.js` (Kenji); (2) Kenji's QA test "kgFromLb and lbFromKg are
  unrounded inverses" expects 180.7783 ± 0.0001 for lbFromKg(82). The exact value with the
  contract's 1 lb = 453.59237 g is 180.779054991… (checked with exact fractions); 180.7783 lb is
  81.99966 kg. I believe the test's expected value is wrong, not the code. Raised for Lena; I did
  not open his test file.
- 2026-10-13 23:50 **HAND-OFF: `core/days.js` DONE and tested.** 23 tests in
  `tests/unit/dev/days.test.js` (inputs deep-frozen): createEntry/createQuickEntry; live values
  first, then snapshot (deleted food, renamed serving → live per100g at the snapshot's grams);
  updateEntry refreshes the snapshot and keeps `boxRef`; quick add/deleted food scale pro rata;
  switchEntryFood home→restaurant karahi keeps katori × 1.5 (654 kcal), roti→tortilla keeps 80 g
  as 'g'; copySlot/copyDay fresh ids, status, §4.3 fields only (no boxRef); dayTotals all/eaten/
  planned; progress null on missing/0 targets; weekSummary/averageTotals; slotForTime every
  minute of both presets, Spain 00:30→dinner, 01:30→snacks, 12:45→lunch, 17:00→evening, default
  03:59→snacks, 23:59→dinner, unknown preset RangeError; A20 at the core level (Madrid): both
  02:30s → 24 Oct, Snacks; 26th copies them unchanged.
  Choices to confirm with Lena: addEntry duplicate throws RangeError('duplicate entry id: x');
  updateEntry throws RangeError on a patch key outside qty/servingId/status/slot;
  weekSummary uses dayTotals 'all' (planned + eaten) because the contract names no option.
  Suite: 205 tests, 0 fail in all 3 zones (Kenji's lbFromKg test now passes; he must have
  corrected it). Lena's 15 store tests are still TODO: they wait on `storage.createPersistence`.
  `npm run check` is red only on Prettier in Priya's files (app/ui/components/format.js,
  icons.js, slot-section.js, totals-bar.js, app/ui/dev/fake-store.js). Lint is clean.
- 2026-10-14 00:20 **HAND-OFF: `core/search.js` DONE and tested.** 17 tests in
  `tests/unit/dev/search.test.js`: A2 (roti, chapati, phulka, Roti, ' roti ' → pk-roti-home-fx
  first); A3 (dal/daal/dhal/دال → daal; anday → egg; chawal/chaawal → rice; tortilla; karhai →
  both karahis by adjacent swap); tiers exact > prefix > wordPrefix > substring > fuzzy; sort by
  score, shorter `matched`, name; boost clamp [0,1] never crosses a tier; halalOnly puts
  es-ensaimada-fx in `hidden` and keeps whey ('check') in hits; A19 accent folding (ensaïmada,
  pa amb tomàquet, pan con tomate, café/cafè amb llet), col·liflor → colliflor; recordUse /
  recencyBoosts / recentForSlot (A6: chai from Nashta shows for Shaam ki chai); 2,000 synthetic
  foods < 16 ms per query (measured 3–7 ms in Node; index build ~50 ms). Fuzzy matcher checked
  against a brute-force OSA oracle: 349,920 pairs, 0 mismatches.
  **Spec question for Lena (Kenji's QA test disagrees):** NFKD splits ئ (U+0626) into ي + U+0654
  (hamza above). U+0654 is inside the harakat range the contract strips (U+064B–U+065F), so
  `normalize('چائی') === 'چایی'` by the letter of §5.6 (same for آ → ا). Kenji's test
  "normalize: Urdu and Arabic script" expects 'چائی' (hamza kept). Both sides of a search fold
  the same way, so matching works either way; my reading also matches decomposed input. I have not
  changed the code. Lena to rule; if hamza should be kept, the range becomes U+064B–U+0652 plus
  U+0655–U+065F, U+0670 (with NFC re-composition), a one-line change.
  **For the Lab (Ayesha):** the Urdu chai spellings چائے and چاۓ fold to چایے / چاے (3 letters, too
  short for fuzzy), so records need both Urdu spellings as aliases (NUTRITION §4.7).
  Gate: my files lint/format clean; suite 282 tests, 266 pass, 1 fail (the QA normalize test
  above), 15 todo (Lena's store tests: waiting on storage). `npm run check` also red on Priya's
  files (ESLint: app/ui/dev/harness.js:57 unused 'iso'; Prettier: 10 UI files) and Prettier on
  Kenji's tests/unit/qa/search.test.js. Not my files.
- 2026-10-14 00:45 **HAND-OFF: `core/targets.js` DONE and tested.** 27 tests in
  `tests/unit/dev/targets.test.js`: all binding vectors A–K (rounded exact, unrounded ±0.01,
  warnings as a set with 'estimate' first; C's carbs 232.5 → 233; E kcal floor; G kidney cap; H
  pregnant lock; I minor ok:false; K prefs 2.2 / 25 %), passed first run. One test per flag
  effect (pregnant/breastfeeding lock + appliesToSex, eating_disorder, kidney cap incl. prefs,
  diabetes and age_over_80 notes only, minor, underweight incl. BMI exactly 18.5), older-adult
  rule, pref clamping, fat floor, low carbs, surplus/1 %/1,000 kcal rails, a test that the
  constants come from RULES (changed RULES → changed output), validateProfile, resolveTargets.
  Choices to confirm: (1) for `ok: false` I return the computed `bmi` and set every later value
  (bmr, tdee, prw, energyDelta, rate, bmrFormula) to null; `effectiveGoal` = the chosen goal.
  (2) computeTargets throws only when it cannot compute (bad sex/activity/goal, non-positive
  numbers, missing rate for lose/gain); profileLimits and allowed rates are validateProfile's
  job. (3) Step 12 "assert": I throw only if the check fails while carbs > 0. When carbs are
  clamped at 0 (huge protein pref + fat floor on a low kcal) the check cannot hold; low_carbs
  fires. **Question for Ayesha:** what should happen there?
- 2026-10-14 00:45 Read new DECISIONS row: meal prep covers any meal (Sprint 2; Sprint 1
  unchanged). Sprint 2 note for Lena: `foods.BOX = 'box'` may need a jar/portion serving id.
- 2026-10-14 (after the usage-limit pause, ~23:15 UTC) Resumed from this journal. State: units,
  dates, foods, days, search, targets done; `tests/unit/dev/storage.test.js` written (test-first),
  `app/core/storage.js` still the stub. Omar: Kenji's search QA suite passes 25/25 against my
  search.js; Ayesha has my carbs-below-0 question. Until she rules, keep the clamp at 0 plus
  `low_carbs` (that is what targets.js does now). Next: storage.js incl. settings.onboarding, then
  full check + Lena's store tests + Kenji's QA suites in all 3 zones.
