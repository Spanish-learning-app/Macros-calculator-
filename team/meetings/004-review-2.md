# Meeting 004 — Review 2 (meal prep) and the design decision

**Date:** 2026-10-15, 02:45 Barcelona · **Chair:** Omar Farooq
**Attendees:** Omar. Held on written reports to save the night's budget:
- Customer Panel: Bilal Ahmed, Nasreen Akhtar, Mariam Iqbal (Review 2 reports)
- Priya Raman (design study)
- Lena Hoffmann and Kenji Tanaka (Sprint 2 engineering and QA reports)
- Dr. Ayesha Siddiqui, Yusuf Benali and Javier Morales (Nutrition Lab reports)

**Reports:** [Bilal](../feedback/bilal-review2.md) · [Nasreen](../feedback/nasreen-review2.md) ·
[Mariam](../feedback/mariam-review2.md) · [Design study](../../docs/DESIGN-STUDY.md)

## Scores

| Tester | Pass | Verdict | Review 1 |
|---|---|---|---|
| Bilal (long-time tracker, lifter) | 7/7 (A10, A16, A17, A18, plus retests A8, A14, A19) | **8.5/10** | 7.5 |
| Nasreen (first-time home cook) | chai, saved meals pass; family pot hard | "Yes, I'd keep using it" | same |
| Mariam (halal PhD, Barcelona) | 5 pass, 1 partial, 1 fail | **8/10** | 7 |

Tap counts:
- A16 cook a library box: 2 actions.
- A17 Fill Mon–Thu: 1 action.
- A18 move to fridge: 1 action.
- A10 tortilla recipe: 16 actions, 13.9 s.
- Three batches planned for 12 meals: 9 actions.

Engineering: 537 unit tests, 0 failures, in 3 time zones; e2e 164 pass, 8 skipped.
Data: 272/272 foods pass.

## What works

- **Meal prep as boxes.** Per-box protein is right for a lifter (lunch boxes average 42 g). The fridge/freezer split, use-by notes and "Move to fridge" are calm and clear. No market-leading app does this.
- **Less cooking.** The Cook / No-cook filter splits the library 24 / 15. Every no-cook lunch is good cold, which suits the 13:30 microwave queue. The feta "check" explains itself in one tap.
- **The rest of the build.** "Set my chai once" ranks first. Saved meals work. 4 of Mariam's 5 Review 1 fails are fixed.

## The design decision (the Boss's suggestion)

**Option B: refine, not redesign.** Every tester and Priya agree. Slots carry the Madrid day,
planned versus eaten and meal-prep placement. A timeline or a ring dashboard would lose those, and
would repeat MyFitnessPal's 2026 mistake.

The panel changed Priya's list in three places:
- **Keep the floating "Add food" button** (item 4 dropped). Bilal and Mariam both use it one-thumbed, and its overlap bug is fixed.
- **Keep the Yesterday / Today / Tomorrow cook-date buttons.** A "Change" link would confuse Nasreen.
- **The macro strip shows "g left"** (Bilal's answer to Priya's question).

## Decisions

### A. Sprint 2 fix wave (tonight, before the app is republished)

| # | Change | Raised by | Owner |
|---|---|---|---|
| 1 | **Keep preps out of the everyday search:** single foods rank before preps; preps carry a small "Prep" tag. "roti" must show rotis first. | Bilal #1 | Lena |
| 2 | **Recipe ingredient picker:** raw ingredients rank before cooked dishes ("250 g lentils" → dry lentils, not the stew); accept plurals, "medium/large/small" and counts ("3 medium potatoes", "5 eggs" → raw egg). | Bilal #3 | Lena |
| 3 | **Batch wording:** "3 to eat · 1 eaten" instead of "0 of 4 left" after placing; a box still frozen on its planned day says so. | Bilal #4, Mariam #5 | Lena |
| 4 | **One weekly shopping list** across all batches cooked this week, merged by food, in the halal butcher / supermarket sections. It shows **packs** when a food has a pack size ("2 × 400 g jar"), else household counts ("10 eggs"), else grams. Cupboard staples (spices, oil, salt) go in a separate "Check you have" group. | Mariam #1, Bilal #4 | Lena (app), Javier (pack sizes) |
| 5 | **No bare "Nothing found" for pork, alcohol or shellfish.** Pork, alcohol and their common words (chorizo, jamón, bacon, cerveza and so on) show one calm line: "Katori has no pork or alcohol foods. Everything here is pork-free." Shellfish finds the new seafood records. | Mariam #3, Nasreen #5 | Lena (app), Javier (records) |
| 6 | **Seafood records** so the seafood setting does something: prawns/gambas, squid/calamares, octopus/pulpo, mussels/mejillones, plus a cooked prawn dish if common. They are tagged `seafood-prawn` / `seafood-other`, and the app shows `check` with "depends on your school of thought" when they fall outside the setting. | Bilal #5, Nasreen | Javier |
| 7 | **Family pot, Nasreen's way:** the recipe builder can ask "How many katori does your pot make?" instead of a weight; logging from a recipe opens on katori; your own recipes rank first in search. The food details explain why a home pot can differ from the library dish ("your recipe uses your amounts of oil and meat"). | Nasreen #1 | Lena |
| 8 | **One line on Prep** explaining batch and box ("Cook once, split into boxes, put a box in any meal"), and "Cook" versus "Make". | Nasreen #2 | Lena |

### B. Design refinements (Priya, starting tonight, in parallel with the fix wave)

These are Priya's items 2, 3, 6, 7, 8 and 9, plus two asks from the panel:
- **2.** A macro strip with "g left" in the sticky totals bar, and a shorter top block so Lunch is above the fold at 400×860 (Bilal #2).
- **3.** Tab icons plus labels. Lena approves Priya editing `renderShell` in `app/main.js` for this.
- **6.** A tick on the row after "+".
- **7.** Tabular numbers, and `--text-faint` darkened to about 7:1.
- **8.** One friendly empty-day card.
- **9.** A small katori mark.
- **Panel ask:** the Day view opens scrolled to the current meal (Mariam #2).
- **Panel ask:** a clear tick or "Added" after each add (Nasreen #4).

**Item 5 (short names)** needs Lab data and moves to Sprint 3.

**Files:** Priya owns `totals-bar.js`, `icons.js`, `tokens.css`, `base.css`, `views.css` and the shell in
`main.js` for this wave. `add-sheet.js` and `day.js` are shared: Lena goes first on `add-sheet.js`, and
Priya goes first on `day.js`. Neither reformats the other's lines.

### C. Nutrition Lab

- **Javier:** item 6; `pack` sizes on market and staple records; the Mercadona barra E-472e records as `check` (Yusuf's finding).
- **Ayesha:** approves an optional `pack: { grams, label }` food field (shopping-list only, no nutrition effect) and adds it to `docs/NUTRITION.md` and `check-foods.mjs` with Javier.
- **Yusuf:** low-cook week v2. Swap Friday's mackerel couscous for the cold chickpea lunch, replace the third meatball dinner with a desi dinner, and add a cheaper variant (target ≤ 60 € at the till). Add a `serve: 'cold'|'hot'|'either'` note to every no-cook prep (Mariam #7), and make the feta swap a real alternative record.

### D. Sprint 3 (after the fix wave)

- Protein nudges.
- Ramadan mode.
- Weight log with a trend (Bilal: MacroFactor's best idea, without the daily nag).
- Kam-tel variants.
- The low-cook week and ready picks as one-tap saved meals (Mariam #4).
- A spare or old box warning on the Day view.
- Short names (Lab), and "Pakistani meal names by default" as a first-run choice (Nasreen #3, Mariam #6).
- Nasreen's form wording carry-overs.
- Accessibility, performance, and the final data audit.

## Actions

| Owner | Action | When |
|---|---|---|
| Lena | Fix wave A1–A5, A7, A8 (app side) | Tonight |
| Priya | Design refinements B | Tonight |
| Javier | C (seafood, packs, barra) | Tonight |
| Ayesha | `pack` field in rules/docs/check-foods | With Javier |
| Yusuf | Low-cook week v2, serve tags, feta swap | After a desk frees up |
| Kenji | Update e2e for the moved and new testids; independent tests for the merged shopping list and the search ranking | After Lena |
| Omar | Republish the app (preview v3) now and again after the fix wave; Report #2 to the Boss | Tonight / morning |
