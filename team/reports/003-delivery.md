# Report to the Boss #3 — Delivery: Katori is ready

**From:** Omar Farooq (Manager) · **Date:** 2026-10-18

## Short version

Katori is finished and live at the same link: https://claude.ai/artifact/GusJdyjFkPK4yftNRPzFrY

It is a daily meal and macro planner built for you: halal, Barcelona and Madrid meal times, desi and
Spanish food, and meal prep you can actually cook from the app. Three testers used it for a full week, and
every must-fix they found is fixed and re-checked.

| Tester | Final score |
|---|---|
| Mariam (halal PhD student in Barcelona, closest to you) | **9/10**, re-checked on the final build |
| Bilal (lifter, 7 years of tracking) | **8.7/10** |
| Nasreen (first-time cook) | **7/10**; her cooking issues are fixed since |

Tests: 760 unit tests and 612 browser tests, 0 failures.
Food data: 351 foods, every one with a source and reviewed by Ayesha.

## What you can do with it

**Every day**
- Log food in 1–2 taps. Search understands desi, Spanish and Urdu words ("kela", "roti", "thora sa").
- Targets come from your profile. You choose your goal; nothing is pre-picked for you.
- Every food shows its halal status. "Check" means read the label, and the app tells you what to look for.
- Protein tips, at most one a day, appear only when you're behind. You can turn them off.
- A weight log with a calm trend line. Target changes are only ever suggested, never automatic.
- Ramadan mode: sehri, iftar and after-taraweeh slots, the Barcelona timetable, ±30 min to match your
  mosque, or one day changed.

**Meal prep (the Prep tab)**
- **64 preps in many styles:** bocadillos, pastas, bowls, tray bakes, soups and breakfasts, as well as desi.
  At most about 1 in 4 lunches is desi, and never roti with salan.
- **"How to make it" on every prep**, for a beginner:
  - what equipment you need and how to cut each thing;
  - numbered steps, each with its heat and minutes;
  - how to tell it's done, how to box it up and how to reheat it;
  - a big-text step-by-step mode.
- **Honest times**, for example "Start the night before" for the tikka marinade.
- **Weekly plans:**
  - the low-cook week and a budget week under 60 €;
  - "Use this week" sets up Sunday's batches and fills Monday to Friday;
  - evening reminders such as "take box 2 out of the freezer" and "boil the penne";
  - one shopping list for the whole plan, in Mercadona packs, with where to buy desi items.
- Ready-to-eat picks, the cost per box with the price date, "Good cold" or "Microwave" labels, a halal
  swap on the feta box, and a "Keeping boxes safe" note.

**About:** a halal shopping guide for Barcelona (label words, E-numbers, how to ask in Spanish).

## What changed since Report #2

- Your three requests: real variety, beginner cooking methods, and less cooking (market food and ready picks).
- Review 3: the whole week with a plan now holds together. A batch cooked midweek fills the planned meal,
  the fridge/freezer split is right, the evening reminders are on screen, the shopping list covers the
  whole plan, and snacks go in Merienda.

## Honesty section

- **Mistakes.** The team made 17 logged mistakes. They are in `team/MISTAKES.md`, each with its root cause and the rule
  that now prevents it. The biggest was the cooking methods that never reached the app (M-01).
  - Since then, "done" means visible in the app.
  - An orphan check runs before every report. Tonight's check found 4 more small items, and they're
    now in the app.
- **Prices change weekly.** Every € figure in the app shows the date its prices were read. The budget week is
  58.97 € and the low-cook week 82.35 €. The low-cook week rose when Friday's dinner became a fresh
  chana masala instead of a freezer karahi you wouldn't have in week 1.
- **Known small gaps, left on purpose:**
  - Step-mode times are labels, not tappable timers.
  - Three preps have no cost because no shop prices boneless halal thigh or a bakery barra online.
  - The two colas (Spanish can, Pakistani bottle) are kept as two records so old logs still work.

## If you want more later

`team/STATUS.md` says where everything stands and how to resume. Ideas the panel liked but we didn't build:
- tappable step timers;
- photos on recipes;
- a vegetarian filter.
