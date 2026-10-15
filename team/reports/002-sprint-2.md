# Report to the Boss #2 — Sprint 2 complete: halal meal prep

**From:** Omar Farooq (Manager) · **Date:** 2026-10-15

## Short version

The new version is live at the same link: https://claude.ai/artifact/GusJdyjFkPK4yftNRPzFrY

Sprint 2 adds:
- **Meal prep for every meal:** cook once on Sunday, split into boxes, and put a box into any meal in one tap.
- **A no-cook tier** built from Mercadona food.
- **A weekly shopping list** in real packs.
- **The design refresh** you suggested.

Three testers scored it 8–8.5/10, up from 7–7.5 at Review 1. All 597 unit tests and 228 browser tests pass.

## What's new in the app

**Prep tab** (new):
- **Library:** 40 preps (lunch boxes, breakfasts, freezer dinners), filtered by **Cook** or **No-cook (15 min or less)**, with the time on each card.
- **Cook a batch:** each box goes in the fridge or the freezer, and rice boxes after the first are frozen by default.
- **Fill Mon–Thu:** fills the week's lunches in 1 tap. Ticking a box as eaten is 1 tap.
- **Use-by notes:** calm "last day" and "past use-by" notes, a **Move to fridge** reminder the night before, and a note if a box is still frozen on its day.
- **Weekly shopping list:** halal butcher first, then supermarket in Mercadona packs ("1 × 400 g jar", "12 eggs"), then "Check you have" for spices and oil. One tap copies it as text.

**Your own recipes:**
- Type amounts the way you say them ("800 g chicken thigh", "3 medium potatoes"), then say how many boxes, or how many katori your pot makes.
- Your recipes come first in search.

**"Set my chai once":** your chai comes first whenever you search "chai".

**Saved meals:** save a meal, and add it back in 2 taps.

**Seafood question:** All / Fish and prawns / Fish only. Anything outside your choice shows "check, depends on your school of thought". It never gives a ruling.

**Search fixes:**
- "roti" shows real rotis before meal preps.
- Pork and alcohol searches say "Katori has no pork or alcohol foods" instead of "Nothing found".

**Design refresh (your idea).** Priya studied MyFitnessPal, MacroFactor, Cronometer, Lose It!, Yazio, Lifesum and HealthifyMe. The team decided to **refine, not redesign**, and kept the one-screen day with meal slots, which none of the leaders do as well for a Madrid schedule. New:
- carbs, fat and fibre as "g left" bars at the top
- tab icons
- a tick and "Added" after each add
- a small katori logo
- the Day view opens at the current meal, so your lunch box is on screen at 13:30

## Meal-prep food

| Tier | What | Examples |
|---|---|---|
| Cook (24) | 12 lunch boxes, 6 breakfasts, 7 freezer dinners | Chicken tikka rice box, pollo al ajillo, overnight oats, egg muffins, chicken karahi, keema matar, aloo gosht, daal palak (for home) |
| No-cook (16) | 8–15 minutes, little or no cooking | Queso batido parfait, pa amb tomàquet with Burgos and eggs, salmon and brown-rice bowl, tuna-egg pita, lentil salad with Burgos, salmorejo with egg and tuna, microwave chana masala, chia pudding |
| Ready to eat | Market food, no prep | Seasonal fruit, skyr and protein yogurt, queso fresco batido, boiled-egg packs, canned salmon, sardines and mackerel, gazpacho, hummus, jarred chickpeas and lentils, microwave rice cups |

**Two plans in the meal-prep guide** (`docs/MEALPREP.md`):
- **Low-cook week:** one 65-minute Sunday cook covers Monday to Friday. About 2,080 kcal and 132 g protein a day, and 76 € at the till.
- **Budget week:** about 2,000 kcal and 124 g protein a day for 55 € (about 6.80 € of food a day).

Both are all halal, with Mercadona and halal-butcher prices read on 14 October.

**The food database** now has **282 foods**, each with a source. New since Sprint 1:
- 48 Mercadona market foods
- raw meats
- 9 seafood foods (gambas, calamares, pulpo, mejillones…)
- pack sizes for the shopping list

**Halal honesty:**
- Labels that list rennet or the emulsifiers E-471/E-472 without saying their origin are marked "check". That covers feta and some sliced bread and wraps.
- The feta salad box has a one-tap halal swap (Burgos 0%).

## What the testers said (Review 2)

- **Bilal (lifter, 7 years of tracking): 8.5/10.**
  - All 7 tests pass: library box in 2 taps, Fill Mon–Thu in 1, Move to fridge in 1.
  - "I'd use it weekly." Lunch boxes average 42 g protein.
- **Mariam (halal PhD student in Barcelona): 8/10.**
  - The Sunday cook and the queue-friendly lunches work.
  - She asked for one weekly Mercadona list in packs. Done.
- **Nasreen (beginner home cook): would keep using it.**
  - She asked for a simpler family pot ("how many katori does your pot make?"). Done.

## What's next (Sprint 3)

- Protein nudges, Ramadan mode, and a weight trend with no daily nagging.
- Kam-tel (less oil) versions of home dishes.
- The low-cook week as one-tap saved meals in the app.
- A spare-box warning on the Day view.
- Short food names, and Pakistani meal names as a first-run choice.
- An accessibility, speed and final data check, including Ayesha's review of the 118 newest foods.
- Then a last test round and the delivery report.

## How the team works now

- The team works 18:00–10:00 Barcelona time, so your days are free.
- Last night it ran out of Claude's weekly usage allowance. Your reset today let it finish the sprint 3 days early.
- To make the allowance last, at most three team members work at once.
