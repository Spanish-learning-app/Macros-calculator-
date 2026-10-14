# Meeting 003 — Review 1 (first build)

**Date:** 2026-10-14 · **Chair:** Omar Farooq
**Attendees:** Omar, Bilal Ahmed, Nasreen Akhtar, Mariam Iqbal. Lena, Ayesha and Kenji contributed by
written reports.
**Reports:** [Bilal](../feedback/bilal-review1.md) · [Nasreen](../feedback/nasreen-review1.md) ·
[Mariam](../feedback/mariam-review1.md)

## Scores

| Tester | Pass | Verdict |
|---|---|---|
| Bilal (long-time tracker) | 12/15 acceptance tests | 7.5/10 |
| Nasreen (first-time home cook) | 4/5 own checks, A1–A4 pass | "Yes, I'd keep using it" |
| Mariam (halal PhD, Barcelona) | 4/5 own checks | 7/10 |

The Boss's day (D0) took **23 actions and 13.7 s** to log, against a target of 60 s. Bilal's 17-item
weekday took 57 actions and 35 s.

## What works

No sign-up. Desi spellings are found (chaye, saalan, anday). The ½ and 1½ chips mean nobody types
grams. A shaadi day showed no red. Halal "check" labels with reasons earned trust. The lunch box logs
in one tap and comes back from recents in 2–3. Café food is found in Catalan, Spanish and English.
Late food stays on the right day.

## Must fix before Sprint 2 (all three testers, or a correctness issue)

1. **"null" printed under every result list** (`add-sheet.js`, `replaceChildren(list, null)`).
2. **Chai default:** in Lunch and Shaam ki chai, "chai" ranks dhaba chai (239 kcal) above home chai
   (111), so "+" logs double the calories. Home doodh patti must rank first. Variants are a tap away.
3. **The Spanish preset still shows Pakistani slot names.** On Madrid time, show Breakfast / café,
   Lunch, Merienda, Dinner, Snacks. Food logged between 00:00 and 05:00 defaults to Snacks and the
   sheet header says which day it counts for.
4. **Tasting and leftovers:** add a "Thora sa (a taste)" portion chip (¼ of the default serving) to
   every food, and make "taste", "thora sa", "bacha hua" and "leftover" searchable help that
   explains it.
5. **Missing foods:** plain skyr and Greek yogurt, with pot servings. A plate serving for plain
   rice, with Ayesha's sourced or clearly labelled assumption.
6. **Wording:** explain "Estimate" in one line. Replace "We slowed your weight-loss pace to a safer
   rate" with a plain, non-blaming sentence. Protein never says "over" as if it were bad.
7. **Layout:** the floating "Add food" button covers slot buttons, menus and entry text.
8. **Fuzzy search junk** ("kela" returns kebab and corn flakes). Tighten fuzzy matching so it only
   fills in when exact, prefix and alias matches are thin.
9. **Source panel** shows internal file paths. Show the human citation only.
10. **Data sanity:** roghni naan (290) is lighter than plain naan (349). Desi omelette and home daal
    feel high. Ayesha rechecks all three against their sources.
11. **Known QA bugs:** BUG-R1 (an impossible date in the URL should show "not found") and BUG-T1
    (Ayesha's ruling: carbs never go negative, protein gives way).

## Decisions

- **Sprint 1 closes when items 1–11 are fixed and tested.** The preview is republished, and then
  Sprint 2 (recipes and meal prep) starts.
- **Fix wave plan:** two fresh agents, within the budget rule. Lena handles engineering items 1–4
  and 6–9 plus BUG-R1/T1, and has authority to edit any app code for this wave. Ayesha handles
  data items 4 (the chip rule), 5 and 10 plus her Sprint 1 record review, and has authority to
  edit Lab files for this wave.
- No new hires. The team is the right size. The budget is the constraint, not the people.
