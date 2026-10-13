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
