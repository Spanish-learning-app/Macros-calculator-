# Meeting 002 — The Boss's update: Barcelona food and halal meal prep

**Date:** 2026-10-13 · **Chair:** Omar Farooq (Manager)
**Attendees:** Omar Farooq, Dr. Ayesha Siddiqui, Bilal Ahmed.
Lena Hoffmann sent apologies: she is finishing Step 0, which three engineers are waiting on. Omar
briefs her, and she can reopen any engineering decision at Review 1.
**Memos:** [Bilal](002-boss-update/memo-bilal.md) · [Ayesha](002-boss-update/memo-ayesha.md)

## What the Boss told us

The Boss lives in **Barcelona** and eats local food (bread, croissants, café breakfasts) as well as
Pakistani food. A **PhD** is starting, so the Boss wants **halal meal prep**: batch-cooked lunches
to carry to university. In their words: "I'm not gonna bring daal or something for lunch."

## Summary

This changes three things. **Time**: the Boss lives on Madrid time and a Spanish schedule.
**Food**: Catalan and Spanish bakery and café food joins the database, with honest halal flags,
because lard is common in Spanish pastry. **Feature**: meal prep becomes Sprint 2's headline,
because the PhD starts now and Ramadan is months away.

Bilal's lunch-box test: food you'd eat in front of colleagues. Tikka rice bowls, keema matar,
pulao, kebab wraps and tortilla pass. Daal, gravy salan and oily karahi fail. Ayesha's food-safety
rule: cooked rice keeps one day in the fridge, so in a Sunday batch, boxes 2–4 go in the freezer.

## Decisions

1. **Madrid time.** Europe/Madrid is the primary clock for every test, with Asia/Karachi and
   America/Los_Angeles as extra checks. Tests must cover the 25 October 2026 clock change.
2. **Spanish meal-times preset** (`RULES.mealSlots.spain`, same slot ids). Breakfast and café run
   until 12:30, lunch box 12:30–16:30, merienda/chai 16:30–20:00, dinner 20:00–01:00. It is the
   default when the device is on Madrid time, and the user can switch to the Pakistani preset or
   rename slots. **Sprint 1.**
3. **Barcelona food in Sprint 1.** Javier adds about 15 café and bakery staples (croissant,
   napolitana, pa amb tomàquet, café con leche, cortado, bocadillos with halal fillings and more).
   Search must find them by Catalan, Spanish or English name.
4. **Halal model** replaces the two halal tags: each record has `halal: { status, reason }`, where
   status is `halal`, `check` or `not-halal`. The reason is required unless the status is `halal`.
   A recipe takes the worst status among its ingredients. Cross-contact gets one line on the About
   screen, not a per-food tag. **Sprint 1** for the field, the chip on food rows and a
   **"Halal only" filter that is on by default.**
5. **A few `not-halal` foods are allowed** (non-meat items whose standard recipe has lard, such as
   ensaïmada) so that a search explains instead of showing nothing. Rules for them:
   - they always show their reason;
   - they are never suggested and never appear in templates or recipe pickers;
   - "Halal only" hides them, and the search tells the user one item is hidden and why.

   **Pork meat products stay out.** This amends kickoff decision 7.
6. **Seafood setting.** Tags `seafood-fish`, `seafood-prawn` and `seafood-other`, plus one
   onboarding question: "Which seafood do you eat? All / Fish and prawns / Fish only". The
   app shows `check` with "depends on your school of thought". It never gives rulings. Tags in
   Sprint 1; the question in **Sprint 2**.
7. **Meal prep is Sprint 2's headline feature.** It is built on whole-pot recipes:
   - Pick a library box or build a recipe, then say how many boxes.
   - Macros per box are shown in 1 action.
   - Drop a box into Lunch on chosen days in 1 action per day.
   - The boxes-left count and the halal status are always visible.
   - Each box is marked fridge or freezer. Use-by = the cooked date plus the shortest fridge life
     of anything in the box; a frozen box has no use-by until it is moved to the fridge.
   - The Day view shows "last day" and "past use-by, best not to eat", with no red.
   - A shopping list can be copied as text.
   - A cost per box is a nice-to-have, shown with the date of the prices.
8. **Halal lunch-box library: 12 recipes** (Ayesha's list), each 550–750 kcal with 35–50 g protein.
   Eight are hot or either, four are cold-only for days when the microwave queue is long. Meat comes
   from a halal butcher; everything else from Mercadona. **Sprint 1 bridge:** each box ships as an
   ordinary food record with a "1 box" serving in `app/data/foods-mealprep.js`, so it can be logged
   before the Sprint 2 batch feature exists.
9. **Sprint plan, re-prioritised.**
   - **Sprint 2:** whole-pot recipes, meal prep, the lunch-box library, saved meals, "set my chai
     once", and the seafood question.
   - **Sprint 3:** protein nudges, Ramadan mode, weight log, `home-light` (kam tel) variants, then
     accessibility, performance and the final data audit.

   Ramadan 2027 begins around February, so it can wait. The PhD can't.
10. **Acceptance tests.** Bilal adds A16 (recipe split into boxes), A17 (boxes into Lunch Mon–Thu,
    ≤ 6 actions, ≤ 15 s), A18 (shopping list and use-by) and A19 (a Barcelona café breakfast found
    by its Spanish, Catalan or English name, ≤ 12 actions). He also adds a PhD weekday test day.
    A18 is rewritten to Ayesha's rule: box 1 in the fridge, boxes 2–4 frozen.

## Hiring (approved by Omar)

| Requested by | Role | Hired | Why approved |
|---|---|---|---|
| Ayesha | Halal Meal-Prep & Catalan Cuisine Specialist (Barcelona, registered dietitian-nutritionist) | **Yusuf Benali** | The lunch-box library needs first-hand local sourcing: halal butchers, supermarket labels, bakery fats. Zainab and Javier are fully booked. |
| Bilal | Customer tester: halal-eating PhD student in Barcelona who meal-preps | **Mariam Iqbal** | Neither Bilal nor Nasreen lives the Boss's actual weekday. Mariam does. |

Headcount is now 12.

## Actions

| Owner | Action | When |
|---|---|---|
| Ayesha | Add the `spain` slot preset, `mealPrep.storage`, the `halal` field, seafood tags and a `lunchbox` group (if needed) to `rules.js`. Update `NUTRITION.md` and `check-foods.mjs`. Add `foods-mealprep.js` to `index.js`. | Now |
| Zainab, Javier | Switch every record to the `halal: { status, reason }` field once Ayesha's rules land | Now |
| Javier | About 15 Barcelona café and bakery records with lard flags | Sprint 1 |
| Yusuf | 12 lunch boxes: standard recipe sheets, shopping lists, storage, cost; records in `foods-mealprep.js`; cross-check Javier's café records | Now, through Sprint 2 |
| Bilal | Update `CUSTOMER.md`: Madrid clock, A16–A19, PhD weekday test day | Now |
| Mariam | "Before" interview: a PhD weekday in Barcelona | Now |
| Lena | Fold decisions 1, 2, 4 and 5 into the Sprint 1 engineering briefs. Design the recipe and batch model for Sprint 2. | With Step 0 |
