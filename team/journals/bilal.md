# Journal — bilal

- 2026-10-13 22:04 UTC: Read the common brief, my brief, BRIEF.md, ROSTER and PLAYBOOK. Journal was
  empty, so this is a fresh start. Kickoff was called by Omar and I owe a memo.
- 2026-10-13 ~22:10 UTC: Wrote `team/meetings/001-kickoff/memo-bilal.md`. It covers how I used
  MFP, Cronometer, MacroFactor and HealthifyMe; the top 10 must-haves, with chai in one tap, desi
  portions and home vs restaurant at the top; four days of test data (weekday, Saturday, Ramadan,
  mixed Spanish); acceptance tests A1–A15; a hiring request; and names.
- 2026-10-13 ~22:11 UTC: Hiring request to Omar: a home cook who has never tracked and has a lower
  kcal target. My favourite name is "Katori".
- 2026-10-13 ~22:12 UTC: Next for me: turn A1–A15 and the four test days into `docs/CUSTOMER.md`
  once the kickoff decisions are in. Ayesha needs to confirm my 2,300 kcal / 160 g target and the
  grams behind roti, katori and my chai. Nothing committed.
- 2026-10-13 22:20 UTC: (I corrected the three times above, which I had written ahead of
  the clock.) Sprint 1 has started. Read the minutes (001-kickoff.md), Lena's and Ayesha's memos and
  Nasreen's brief. The app is called Katori. Sprint 1 adds copy-day, the home/restaurant/dhaba
  switch, fractional portions, source in one tap and protein/kcal left. Recipes, saved meals,
  Ramadan, nudges and the weight log go to Sprint 2. Honesty rule: the panel supplies no
  measurements. Starting docs/CUSTOMER.md for Kenji.
- 2026-10-13 22:24 UTC: Wrote docs/CUSTOMER.md. It has a coverage list (39 foods with my
  search words and the serving labels I need; the Lab picks the grams), conventions (what counts as
  an action, starting states, profile P1), 25 user stories tagged by sprint (US-22 "my chai set
  once" is 2*, my proposal, because the minutes don't mention it), A1–A15 with steps, pass rules
  and budgets (A10 and A11 are Sprint 2), test days D0–D4 as tables, and the panel plan for Review 1.
- 2026-10-13 22:24 UTC: Changes from my memo. A5 first-time logging is now ≤ 120 s, not
  90: I counted about 70 actions for 17 foods. The A4 budget is ≤ 32 actions; my own count is 31.
  Chai in test data uses the 2 tsp record because I drink 1.5 tsp. No weighing anywhere (honesty
  rule). Under Ayesha's kickoff formulas my target is about 2,210 kcal and 161 g protein at
  0.5 kg/week, not MacroFactor's 2,300; NUTRITION.md is binding. Open asks: recents across slots,
  undo for copy-day and planned vs "left" (Lena/Priya); serving labels, frying oil in recipes and a
  daal chawal plate (Lab). Nothing committed.
- 2026-10-13 22:30 UTC: Meeting 002 (Boss update: Barcelona, PhD, halal meal prep). Wrote
  team/meetings/002-boss-update/memo-bilal.md (~800 words). It covers Sunday batch cooking (4 boxes,
  Mon–Thu), what passes the colleagues test, halal in Barcelona (butchers, lard on labels and in
  pastries, menú del día), meal-prep must-haves and budgets, A16–A19, and a request for a Barcelona
  PhD meal-prep tester. Found that the CUSTOMER.md clock (Asia/Karachi) is wrong for the Boss; it
  must be Europe/Madrid. CUSTOMER.md follow-up waits for Omar to set sprints. Nothing committed.
- 2026-10-13 22:46 UTC: Read minutes 002 and Mariam's brief (my hire, approved). Updated
  docs/CUSTOMER.md to v2: Madrid as the primary clock, Karachi and LA as extra checks, and a new A20
  for the 25 Oct 2026 clock change (LA's change on 1 Nov too). Conventions now cover the Spanish and
  Pakistani presets and the halal rules ("Halal only" on by default, chips for check/not-halal,
  hidden-item explanation). Coverage gets #40–#49 (café foods by Catalan, Spanish and English name,
  skyr, and the tikka box bridge record). New stories US-26–US-34; sprints re-tagged per decision 9:
  Ramadan, nudges and weight log to S3, "my chai once" confirmed for S2. Added A16–A18 (S2; A18
  follows Ayesha's fridge/freezer rule) and A19 (S1, Spanish preset), plus the D5 PhD weekday, and
  updated the panel plan with Mariam. Open: "+" on search rows (A19's budget needs it) and the date
  for 00:00–01:00 entries. Nothing committed.
- 2026-10-15: REVIEW 2 started (Sprint 2 build). Read briefs, Review 1, meeting 003, DESIGN-STUDY, A10/A16-A18. Serving app/ on :8772, scripts in team/feedback/screens/bilal-r2/. Nothing committed.
- 2026-10-15 (R2 progress): A10 PASS (tortilla recipe 16 actions/13.9 s, half at Dinner 6 actions incl. Done, re-log from recents 2 + Done; lentejas 3 boxes = 1 box is 1/3 pot, 572 kcal). A16 PASS (library 4 boxes = 2 actions, per-box 708 kcal/48 g = #49 exactly; own recipe 16 actions, 4->5 = 1 action). A17 PASS (4 day taps or Fill Mon-Thu 1 tap; Fri note + Undo; tick = 1). A18 PASS (fridge/freezer, last day, Tonight card, past use-by neutral, chaat no freezer, shopping list 4/8, copy 1). A8 half plate now PASS, A14 skyr PASS (272 foods Atwater ok), A19 labels now Breakfast / cafe, Lunch, Merienda (meeting wording). Nits found: plural "potatoes"/"3 medium potatoes" ingredient search fails; stale Fri note after Undo. Next: chai once, saved meals, seafood, filter, design study.
- 2026-10-15 (R2 done): Wrote team/feedback/bilal-review2.md. A10, A16, A17, A18 PASS; retests A8, A14, A19 PASS (7/7). Also tested chai once (5 actions), saved meals, Cook/No-cook filter (24/15), seafood setting (no seafood foods exist, so no effect), a 12-meal week in 9 actions. Score 8.5 (was 7.5). Top 5: keep preps out of everyday search; shrink Day top block; fix recipe ingredient picker (plurals, "medium", raw first); batch "left" wording + combined shopping list; seafood data. Design verdict: refine (disagree on dropping floating Add food). Note to self: data-testid=undo is the toast box, click its Undo button (my first A17 run mis-clicked). Screens/scripts in team/feedback/screens/bilal-r2/. Nothing committed.
