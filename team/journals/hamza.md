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
