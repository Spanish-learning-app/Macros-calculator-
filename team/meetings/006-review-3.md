# Meeting 006 — Review 3 (a full week, cooking from the app)

**Date:** 2026-10-17, 02:35 Barcelona · **Chair:** Omar Farooq
Held on written reports to save budget:
- [Mariam](../feedback/mariam-review3.md)
- [Nasreen](../feedback/nasreen-review3.md)
- [Bilal](../feedback/bilal-review3.md)

## Scores

| Tester | Review 3 | Review 2 | Focus |
|---|---|---|---|
| Mariam (halal PhD, Barcelona) | **8.5** | 8 | A full week with a weekly plan |
| Bilal (lifter, 7 years tracking) | **8.7** | 8.5 | Numbers, speed, tap counts |
| Nasreen (first-time cook) | **7** | about 6 | Cooking from "How to make it" |

## What works

- Plan numbers are exact: Bilal summed all 10 days by hand.
- The weight trend and the suggestion match Bilal's own maths.
- "How to make it" and step mode work. Nasreen found the methods well ordered, with cues she could check, and the roti doable.
- The halal guide, the halal swap and Ramadan mode work.
- Tap counts are at or below Review 2.

## What fails (one theme: the plan once the week is running)

1. A batch cooked midweek is not linked to the plan's planned meal, so the meal doubles. All three testers hit this.
2. The plan's fridge/freezer split and use-by are wrong (bolognese), and three screens give three answers.
3. The evening "move to fridge" card is off screen, and there are no evening-job prompts.
4. The week's shopping covers only the Sunday batches.
5. Planned merienda lands in Snacks, and the protein tip disappears once a plan is on.
6. The method does not scale to the portions cooked, and its counts don't match the shopping list.
7. Overclaims on the plan cards (M-15 again): "€ eaten this week", the minutes, "desi at dinner", "no cooking".
8. A `timeNote` orphan (M-17), the "null" bug in the ingredient picker, and Pakistani slot names missing in places.

## Decisions

- **Fix wave R3** (running now):
  - Lena takes the app side (items 1–6 and 8, plus Bilal's small items).
  - Yusuf takes the data side (one storage truth with a build check, "Done when" before packing, roti timing, honest total minutes, shopping names, evening jobs, generated card prose).
  - Ayesha takes the default goal.
- **Kenji** re-tests the testers' exact steps as e2e after the wave.
- **Then:** the final audit (orphan check, M-14 tap-through), the republish and Report #3. Delivery is Saturday night.
- **No Review 4.** Mariam re-checks her six must-fix items on the final build before the report.
