# Bilal: Review 2 (hands-on, Sprint 2 build)

*2026-10-15 · Chromium, Europe/Madrid, 400×860, plus 360 and 1280 for the Prep screens, light and dark. Seconds come from my script with a thumb-speed pause per tap, so a real person is about 2× slower. Same method as Review 1. Screenshots and `t_*.mjs` scripts are in `team/feedback/screens/bilal-r2/`. I read the screenshots myself. The A17/A18 clock is Sunday 1 Nov 2026 (after the clock change, UTC+1). Yusuf's no-cook preps were in the build: 39 library recipes, 15 of them no-cook.*

Short version: meal prep is the real thing. I cooked a tikka batch, filled Mon–Thu in one tap, and the app told me on Monday night to take box 2 out of the freezer. No other tracker does that. The weak spot has moved. The meal-prep library now crowds my everyday search, and the recipe ingredient picker trips on plurals. The seafood setting has no food to act on.

## 1. Pass / fail

| Test | Result | Actions / seconds | Evidence |
|---|---|---|---|
| A10 tortilla and lentejas | **PASS** | Recipe: 16 actions, 13.9 s (budget ≤25). Log ½ at Dinner: 6 actions with Done. Re-log from recents: 2 actions (open Dinner, "+"), 2.1 s with Done (budget ≤2 and ≤10 s). Lentejas: 18 actions, 17.5 s. | Recipe total 1251 kcal; my sum of the four ingredients is 358 + 492 + 44 + 358 = 1252. The ½ entry is 626 kcal / 23 g protein, exactly half. Recents remember the ½. Lentejas (3 boxes): pot 1716 kcal, 1 box = 270 g = 572 kcal = exactly ⅓. The editor says where the numbers come from. `a10-Mi_tortilla-editor`, `a10-picker-half`, `a10-lentejas-picker` |
| A16 batch into boxes | **PASS** | (1) 2 actions, 1.8 s (budget ≤4). (2) 16 actions, 16.2 s (≤25). 4→5 boxes: 1 action. | (1) Per box 708 kcal · 47.7 g protein · 69 C · 25 F · 8.4 fibre, visible with no extra tap. It matches the #49 "1 box" record exactly (0%). (2) My recipe: 682 kcal / 47 g per box at 4, 546 kcal / 37 g at 5 (2728 ÷ 5), with no re-entry. Halal line is the worst ingredient: a croissant turns it into "Check: Croissant (butter)…" with the lard reason. (3) "ensaimada" gives no row and says "Not halal, so it cannot go in a recipe" with the lard reason. Pork, bacon, jamón, chorizo and lard offer no not-halal food. `a16-01-cook-dialog`, `a16-04-own-5boxes`, `a16-05-ensaimada-blocked`, `a16-06-recipe-halal-check` |
| A17 boxes into Lunch | **PASS** | Four day-taps: 4 actions, 2.2 s (budget ≤6 and ≤15 s). "Fill Mon–Thu": 1 action. Friday + Undo: 2. Tick: 1. | Four planned Lunch entries of "1 box" on 2–5 Nov, "0 of 4 left". The fifth box (Fri) gives an inline "No boxes left in this batch. Added to Lunch, Fri, 6 Nov anyway; Undo takes it back." and no pop-up. Undo removed it (Friday chip clear, no entry). Monday 14:00 tick = 1 action, and the box row reads "Eaten". `a17-card-filled`, `a17-02-fifth-friday`, `a17-04-ticked` |
| A18 fridge, freezer, use-by, shopping | **PASS** | Move to fridge: 1 action. Shopping list opens in 1 action (budget ≤2), copy in 1. | (1) Box 1 fridge, boxes 2–4 freezer, any box changeable. (2) Sun 21:00: box 1 "Use by tomorrow", boxes 2–4 "Frozen, no use-by yet". (3) Mon 12:00 Day view: "Box 1 · last day". (4) Mon 22:00 a **"Tonight: take box 2 … out of the freezer"** card appears on Prep and on the Day view. "Move to fridge" = 1 action, and box 2 then reads "Use by tomorrow" (Tuesday). (5) Tue 09:00 box 1 reads "Past use-by, best not to eat" (calm, no red, no pop-up) and box 2 is "Last day". (6) Chana chaat (cooked Sun 8 Nov): use-by Tue 10 Nov, each box says "No freezer", and the dialog says "Doesn't freeze well". (7) Shopping at 4 boxes: chicken 720 g under HALAL BUTCHER, 17 other lines under SUPERMARKET. At 8 boxes everything doubles (chicken 1.44 kg). The copied text is clean, plain-text bullets. `a18-02-sun-2100`, `a18-tue-0900-card`, `a18-08-chaat-dialog`, `a18-11-shopping-8` |
| **Retest A8 half plate** | **PASS** | Daal mash 1½ katori: 4 actions. Rice ½ plate: tap row, plate chip, ½ = 2 extra actions (budget ≤2). | Rice now has "plate, assumed 2 katori" (268 g). ½ plate = 134 g / 157 kcal. 0.33 plate = 88 g / 103 kcal. 0, empty, -1 and "abc" are refused inline, no pop-up. The honest "assumed" label is good. Daal mash 1½ katori is now 234 g / 393 kcal (it was 300 g / 504). `a8r2-02-rice-picker`, `a8r2-03-rice-half-plate` |
| **Retest A14 skyr** | **PASS** (one nit) | Skyr found in 1 search, logged in 2 actions. Source from the picker: 1 action. | "skyr" → Skyr, plain (0% fat), 1 pot (150 g) · 95 kcal · 16 g protein, from an Arla label (B). "yogur proteico" and "yogur skyr" find it. Greek yogurt and "yogur griego" have pot servings. All 49 coverage foods are in the top 5. All 272 foods pass my Atwater check (0 outside ±10%), and every food has a citation, a confidence and a halal status. The source panel now shows a plain citation and no file paths. **Nit:** from a search row the source is still 2 taps (open the picker, then Source). `a14r2-skyr-results`, `a14r2-skyr-source` |
| **Retest A19 slot labels** | **PASS** (with a note) | Steps 2–3: 12 actions, 9.4 s (budget ≤12 and ≤30 s). | Labels are Breakfast / café, Lunch, Merienda, Dinner, Snacks. That is what Meeting 003 decided. It is not my CUSTOMER.md table ("Lunch box", "Merienda / chai"), and I accept the meeting wording. All four entries land in Breakfast, the 11:30 cortado too. Croissant "Check" chip opens its reason in 1 tap. Ensaïmada gives a hidden-note with the lard reason, and "Show hidden" is 1 action. **"null" text is gone.** `a19r2-02-day`, `a19r2-03-croissant-reason` |

**7 of 7 pass.** For my other Review 1 fixes: chai with no history now ranks home doodh patti (111 kcal) first at 13:00 and 17:00. Roghni naan (290) is now heavier than naan (285). Home daal is lighter (mash 262, was 336). "truita" no longer returns mango juice. The Add-food button no longer covers the last slot (`r2-day-360-light-bottom`). Still open from Review 1: "salad" ranks the tuna salad first, "biscuit" ranks Gluco above Marie, "kela" still returns gulab jamun at #2, and desi omelette is still 146 kcal per egg.

### Also tested (not in my A-list)

| Feature | Result | Evidence |
|---|---|---|
| **Set my chai once** | **Works** | Set milk, cup and sugar: 5 actions, 3 s. I picked Buffalo, 1½ tsp and a 200 ml cup, and the preview said 175 kcal / 5.9 g protein. Then "chai" puts "My chai (1½ tsp sugar)" first. At 17:00 it is the first row in the Merienda sheet with no typing. Four cups = 700 kcal (4 × 175), 2 actions per cup. The cup row reads "211 ml" while the setting says 200 ml. `chai-02-set-17`, `chai-05-search-17` |
| **Saved meals** | **Works** | Lunch ⋯ → "Save Lunch as a meal…" → name → Save: 4 actions, 3.5 s. It then sits at the top of every add sheet as "READY TO ADD". One tap adds all 3 foods: Dinner total 2 × 711 = 1422 kcal, correct. The row shows only "Saved meal · 3 foods" with no kcal or protein (fix 3). `saved-04-dinner-sheet` |
| **Cook / No-cook filter** | **Works** | 1 action per filter. All 39, Cook 24, No-cook 15 (≤15 min, the button says "Make"). `filter-nocook` |
| **Seafood setting** | **Cannot be tested on this data** | The Profile has All seafood / Fish and prawns / Fish only (1 action). But the library has no prawn, squid, octopus or mussel food at all: "prawn", "gambas", "calamares", "pulpo" and "mussels" return nothing, so nothing changes in any of the three modes. A setting with nothing behind it. |
| **A whole week in 9 actions** | **Works** | Oats (3 jars), tikka (4 boxes) and karahi dinner (4 portions): cook + Fill Mon–Thu each, 9 actions, 6.8 s, 12 planned meals. Monday is 1743 kcal / 123 g protein planned, leaving 467 kcal and 38 g protein for chai, a whey scoop and a snack. `week-02-monday`, `week-04-week-tab` |
| **Phone, dark, thumbs (Prep)** | **Pass, one nit** | No horizontal scroll at 360, 400 or 1280. No low-contrast text. Dark mode is fine (`r2-prep-400-dark-batch`). The Fridge / Freezer buttons are 59×38 and 66×38, under 44 px high. |

## 2. Meal prep from a lifter's view

**Does the per-box protein make sense?** Yes. The library's 19 lunch boxes average 42 g protein per box, in a 37–50 g range. My target is 161 g on 2210 kcal, which is 7.3 g per 100 kcal. The chicken boxes beat it: chana chaat 8.6, Moroccan couscous 8.2, hummus pasta 8.0. Tikka at 6.8 sits a bit under, and the Spanish no-cook plates (salmorejo 5.3, chana masala 5.1, picoteo 5.8) are carb-heavy. The 3 meals in my test week gave 123 g with room for a whey scoop. I could plan to 160 g without a calculator.

**Why I trust it.** The per-box number is exactly the sum of the pot divided by the boxes. When I changed 4 boxes to 5, 47 g became 37 g with no re-entry. The honest "weigh the cooked pot" field is optional. The recipe says it is an estimate and where the numbers come from.

**Would I use it weekly? Yes, with three asks.**
1. **"0 of 4 left" misleads once everything is placed.** After I ticked Monday it still said "0 of 4 left" while three boxes were uneaten. It is counting boxes with no day. I want "3 to eat, 1 eaten".
2. **One shopping list for all my batches.** Today it is per batch. Sunday shopping for oats, tikka and karahi means three lists and three copies.
3. **A frozen box planned for today should say so.** Tuesday morning, box 2 still reads "Frozen" if I forgot Monday night's tap. Say "still frozen, lunch is today".

Small things: the batch gives one default box count (3 for oats, 4 for tikka), so "Fill Mon–Thu" with 3 jars only fills Mon–Wed. The "Check" chip on the lentil, tuna and feta box has no reason in the list. A single-box recipe like my tortilla costs 3 taps on "−" because the default is 4.

## 3. Design study opinion

My verdict is **refine**. I agree with Priya's Option B. I checked each of her nine against the build.

| # | Priya's refinement | My call | Why, in one line |
|---|---|---|---|
| 1 | Finish the Prep screens | **Agree (mostly done)** | Halal chip, one-line box rows, "Yesterday / Today / Tomorrow" for cook date and a chip row for the meal all landed, and Prep now looks like the Day view. Left: Fridge / Freezer buttons are 38 px high. |
| 2 | Macro strip under the big number | **Change** | Carbs, fat and fibre moved to the top, but as a big panel (about 200 px) and the Tonight card pushes Lunch under the fold. Make it three thin bars in the sticky bar and fold the "Estimate" text into one tap. |
| 3 | Icons plus labels in the tab bar | **Agree (low priority)** | Still text-only. It is cheap and looks finished, but I never look at the tab bar once I know it. |
| 4 | One add entry, drop the floating "Add food" | **Disagree** | The floating button is my fastest way in (2 actions for any food, with no slot picked) and the overlap bug is fixed. Keep it. Don't add a search field above the fold either. |
| 5 | Shorter names and portion labels | **Agree, strongly** | The preps have names like "Chicken karahi with 2 wholemeal roti (freezer dinner portion)". Give them a short name and put the detail in the grey line. |
| 6 | Feedback and motion on add | **Agree (already done)** | The "+" turns into a dark tick and the line says "1 added so far". That is what I wanted. |
| 7 | Tabular numbers and contrast | **Agree (half done)** | Tabular digits are in. Captions are still 4.9:1 in light. Darken them a bit, but keep the warm feel. |
| 8 | One friendly empty day | **Change** | An empty day matters on day 1 only. Make the five "Nothing yet" rows compact, and put Copy yesterday / Prep boxes near the top only when the day is empty. |
| 9 | A small identity (katori mark) | **Agree, last** | Nice, but it comes after items 2 and 5. |

**Her questions for me.**
- **(a) The calmest, most readable screen.** MacroFactor's diary: the day is one list under a small budget header, with no red and no coach cards. Cronometer's Dashboard summary is readable too, but its Nutrients page is a wall of numbers. Our Day view is closer to MacroFactor's. It loses its calm when the top block is taller than the slots.
- **(b) Macro strip: "left" or "eaten / target"?** "Left", in grams, for protein, carbs and fat. That is how I decide dinner. Fibre can be "eaten / target". Tapping the strip opens eaten and target.
- **(c) What annoyed me on HealthifyMe's home screen.** Coach and plan cards, Premium pop-ups and "Snap" prompts sit between me and my food log. You scroll past a plan carousel and tracker tiles to reach Breakfast. Search lists branded foods in "serving", not katori.

**What to copy and what not to.**
- **MyFitnessPal.** Copy: meal buckets and copy-from-yesterday (we have both), quick-add by kcal (we have it). Don't copy: the community database (14 versions of "roti"), the paywalled barcode, ads over buttons, or hiding the diary in a redesign.
- **MacroFactor.** Copy: the weight trend with an adaptive target (Sprint 3), logging part of a recipe, and counting actions as a design metric. Don't copy: its "weigh in every day" nag. Our optional cooked-pot weight is the better way.
- **Cronometer.** Copy: the source and confidence panel (we have it, in a friendlier shell), and sodium and iron totals one tap deep. Don't copy: nutrient pages as the default, or the dated list UI.

## 4. Score: 8.5 / 10 (up from 7.5)

**Why it went up by 1.0.** All 7 of my tests pass. The two big Review 1 bugs ("null" and the chai default) are gone. Skyr, the rice plate and the Spanish labels are in. Meal prep works end to end: the tick, the Move to fridge nudge, the shopping list. **Why not higher.** My everyday search is worse for being shared with the prep library. The ingredient picker is rough. A setting and a screen have nothing behind them. The top of the Day view is too tall. There is still no weight log.

### Top 5 changes, ranked

1. **Keep the prep library out of my everyday food search.** Searching "roti" at Lunch now returns a breakfast wrap and a "daal palak ... freezer dinner portion" above the real rotis. "pan con tomate" returns a whole breakfast plate first. Rank single foods first, tag preps as "Prep", and use short names (Priya's #5). This is the thing I hit most.
2. **Shrink the top of the Day view.** Put carbs, fat and fibre as three thin "g left" bars in the sticky bar, collapse the "Estimate" note and keep the Tonight card to one line. At 400×860 Lunch is under the fold on a prep day.
3. **Fix the recipe ingredient picker.** "potatoes" finds only the meatball dish. "3 medium potatoes" and "1 medium onion" find nothing, and those are my A10 words. "5 eggs" offers boiled egg before raw, and "250 g lentils" offers the cooked lentejas stew (253 kcal) before dry lentils (773 kcal), a 3× trap. Show raw ingredients first, accept plurals and "medium", and let a recipe start at 1 box.
4. **Say what is left in a batch, and give one shopping list.** "3 to eat, 1 eaten" instead of "0 of 4 left". One combined list for all active batches. Warn on the day if a box is still frozen. Show kcal and protein on the saved-meal row.
5. **Give the seafood setting something to act on.** Add prawn karahi, gambas al ajillo, calamares and pulpo (tagged prawn or other), or hide the setting until they exist. A choice that changes nothing is worse than none.

**Also, smaller:** Fridge / Freezer buttons to 44 px. "salad" and "biscuit" ranking from Review 1. Desi omelette at 146 kcal per egg is still heavy. The chai row says 211 ml for a 200 ml cup. A stale "Undo takes it back" note can stay on the batch card after the 4-tap path plus Undo (it cleared in my Fill path).

**Design verdict: refine.** Keep the structure: slots, one big "left", the floating Add, katori portions. Fix the height of the Day view top block and the long names. Don't remove the floating Add food button.
