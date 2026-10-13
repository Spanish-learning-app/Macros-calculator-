# Meeting 001 — Kickoff

**Date:** 2026-10-13 · **Chair:** Omar Farooq (Manager)
**Attendees:** Omar Farooq, Lena Hoffmann, Dr. Ayesha Siddiqui, Bilal Ahmed
**Memos:** [Lena](001-kickoff/memo-lena.md) · [Ayesha](001-kickoff/memo-ayesha.md) · [Bilal](001-kickoff/memo-bilal.md)

## Summary

The three memos agree on almost everything that matters: a phone-first app with no login, no ads and
no build step; desi food done properly with a source on every number; household portions with the
grams always shown; and independent testing at every layer. The open points were scope (Bilal wants
recipes, saved meals and Ramadan mode in v1, Lena deferred them), a few naming mismatches between the
engineering and nutrition contracts, and hiring. All are settled below.

Ayesha's most useful finding: the Boss's own example day comes to roughly 1,850–2,000 kcal but only
about 85 g of protein. Helping the Boss hit protein with desi food is a core feature, not an extra.

## Decisions

1. **Name:** the app is called **Katori** (Bilal's pick). Tagline: *"Your daily meal & macro planner
   that knows desi food."* Every Pakistani kitchen thinks in katoris, and it is easy to say in any
   language.
2. **Stack:** Lena's plan as written: plain ES modules, modern CSS, no build step, no runtime
   dependencies, one versioned localStorage document (`mmc.v1`) with memory fallback, export and
   import by copy or paste and file input. Food data ships as ES modules.
3. **Sprint 1 scope (the first usable build).** Lena's v1 plus five items from Bilal's list that
   are cheap now and expensive later:
   - **Copy a whole day** ("copy yesterday"), as well as copying a slot (acceptance tests A5, A12).
   - **Home / restaurant / dhaba switch** in the portion picker for foods that share a `family`
     (A9).
   - **Fractional portions**: 0.5, 1.5 katori, half plate, with grams always shown (A8).
   - **Source in one tap** from any food (A9, A14).
   - **Protein and kcal left** always visible on the Day view without scrolling (A7).
4. **Sprint 2 scope (planned now, not "someday"):** whole-pot recipes with portion logging, saved
   meals, Ramadan mode (Sehri, Iftar, Dinner, After-taraweeh; food after midnight counts toward the
   fasting day), protein nudges with desi foods, weight log. Sprint 3 is polish, accessibility,
   performance and the final data audit.
5. **Meal slots.** Ids `breakfast`, `lunch`, `evening`, `dinner`, `snacks`. Default labels
   **Nashta, Lunch, Shaam ki chai, Dinner, Snacks**, editable. Slot shares and hours come from
   `rules.js` (Ayesha's table).
6. **Targets.** Ayesha's formulas, rails, health flags and rounding are the specification. Test
   vectors A, B and C in her memo are binding unit tests. The Profile type becomes:
   `{ sex, ageYears, heightCm, weightKg, bodyFatPct?, activity, goal, rateKgPerWeek, lifts, healthFlags[] }`
   with `activity` one of `sedentary | light | moderate | very_active | extra_active`
   (factors 1.2 / 1.375 / 1.55 / 1.725 / 1.9). Targets are always labelled as estimates.
7. **Food record.** Lena's camelCase shape, with these reconciliations (both leads agreed):
   - `name`, `nameUr` (Urdu script), `nameRoman`, `aliases[]` — HARD: `name`, `aliases`.
   - `group` — **HARD**, from the vocabulary in `rules.js`; drives the data gate's kcal range.
   - `state` — HARD for the Lab (what the numbers describe), shown in details.
   - `style` (`home | restaurant | dhaba | street`) and `family` — SOFT; drive the variant switch.
   - `per100g { kcal, protein, carbs, fat, fiber, sugars?, satFat?, sodium? }` — five required.
     `carbs` = available carbohydrate (fibre excluded). Sodium stored, not shown in v1.
   - `addedFatPer100g` — SOFT, required by the Lab for composite dishes.
   - `servings[{ id, label, labelUr?, grams, default }]` — HARD, exactly one default.
   - `tags[]` and `slots[]` (meal-slot hints) — vocabulary in `rules.js`.
   - `source { citation, method, confidence: 'A'|'B'|'C', reviewer, date, notes? }` — HARD
     citation. Confidence C shows an "estimate" badge.
   - Ids are permanent, kebab-case, prefixed `pk-`, `es-`, `med-` or `intl-`.
   - No pork and no alcohol in v1.
8. **Data module contract.** `app/data/rules.js` default-exports plain data (no functions).
   `app/data/index.js` exports `RULES` and `FOODS` (one flat array of every record). The Lab owns both.
   Engineering builds against `tests/fixtures/foods.js` until real data lands.
9. **Data sources and licences.** USDA FoodData Central (use the bulk CSV downloads; the DEMO_KEY is
   rate-limited), IFCT 2017, CoFID 2021, BEDCA with attribution, published recipe analyses and
   dated product labels. Research downloads go in `research/cache/` and are never committed. An
   "About the data" screen credits every source. BEDCA's commercial-use condition is noted for the
   Boss; the app is personal and non-commercial for now.
10. **Honesty rule for the Customer Panel.** Our testers are personas. They give perspective,
    expectations and hands-on usability findings. They never supply measurements (for example
    "I weighed my roti"). Household weights come from published sources, chosen by the Lab.
11. **Definition of done for Sprint 1:** `npm run check` and the end-to-end suite pass on all four
    Playwright projects; the Boss's sample day logs in 60 s or less, both by script and by Bilal;
    the app works with storage blocked; every shipped food passes the data gate; a preview is
    published.

## Hiring (approved by Omar)

| Requested by | Role | Hired | Why approved |
|---|---|---|---|
| Lena | Core Logic Engineer | **Hamza Qureshi** | Every number on screen passes through the core. It must be built test-first, alongside the UI. |
| Lena | UI Engineer (mobile-first) | **Priya Raman** | The Boss uses a phone. The 60-second logging flow is a full-time job. |
| Lena | QA / Test Engineer | **Kenji Tanaka** | Independent tests from the spec, the data gate, and end-to-end tests. Required by the playbook. |
| Ayesha | Pakistani Cuisine Food Researcher | **Zainab Rauf** | About 60% of the records and nearly all of the estimate risk. This is the Boss's daily food. |
| Ayesha | International & Packaged Foods Researcher | **Javier Morales** | About 40% of the records: Spanish and Mediterranean, gym staples, Pakistani packaged foods. |
| Bilal | Customer tester: beginner home cook | **Nasreen Akhtar** | Tests first-time use, katori portions and whole-pot cooking. At 1,600 kcal, data errors hurt her most. Starts with a short "before" interview now, and tests hands-on from Review 1. |

Headcount is reviewed at every review meeting.

## Actions

| Owner | Action | When |
|---|---|---|
| Lena | Step 0: `package.json`, configs, `docs/ARCHITECTURE.md` (with the reconciled contracts above), app shell, stub `app/core/*.js` | Now |
| Ayesha | `docs/NUTRITION.md` and `app/data/rules.js` first; then `app/data/index.js`, reviews, templates | Now |
| Zainab | Pakistani home, restaurant, street, breads and rice, drinks, sweets | Now |
| Javier | Spanish and Mediterranean, international and gym, fruit and veg, dairy, packaged foods | Now |
| Bilal | `docs/CUSTOMER.md`: the user stories, acceptance tests A1–A15 and the four test days, in a form QA can script | Now |
| Nasreen | "Before" interview, written to `team/feedback/nasreen-before.md` | Now |
| Hamza, Priya, Kenji | Start their tracks as soon as Lena's step 0 lands | After step 0 |
| Omar | Roster, dashboard, commits, call Review 1 when the build is ready | Ongoing |
