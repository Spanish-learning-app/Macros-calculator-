# Bilal: Review 3 (hands-on, Sprint 3 build: a lifter's week)

*2026-10-17 · Chromium, Europe/Madrid, 400×860 (plus 360 for overflow and tap sizes), light for the week and dark for a second pass. I tested the **fixed snapshot** (`.../scratchpad/review3b/app`, served on :8792), not the live repo. I set the clock per visit with `page.clock`. An action is one tap or one typed phrase, counted by my script with a thumb-speed pause per tap, so a real person is about 2× slower. Screenshots are in `/tmp/claude-0/-home-user-Macros-calculator-/8f52dea3-769e-51a2-93b3-61c066c71d94/scratchpad/review3-shots/bilal/` (called `shots/` below), scripts in `.../scratchpad/b3/`. This is the restart of Review 3 after the usage-limit stop. I did not edit `app/` or `tests/` and did not commit. I read Mariam's Review 3 first. Where I found the same thing I say **confirmed**; where it is only mine I say **new**.*

P1 as before: male, 31, 178 cm, 82 kg, Active, weights, losing 0.5 kg a week. Targets 2210 kcal and 161 g protein.

Short version: the week now holds together as a lifter's tool. The plan card's kcal and protein add up to the gram, the weight trend matches my own EMA and slope, the protein tip does exactly what it says, and almost everything I asked for in Review 2 is in. The weak spot moved from search to **booking**: the plans and batches do not always match the meals they put on my days. Merienda food lands in Snacks, a weekday batch I cook is not the planned meal, the bolognese is booked wrong, and the plan card says "eaten this week" for food that stays in the freezer.

## Score: 8.7 / 10 (Review 2: 8.5, Review 1: 7.5)

**Why up 0.2.** My top three Review 2 complaints are fixed: the prep library no longer crowds my search, the ingredient picker takes "5 eggs / 3 medium potatoes / 250 g lentils" with raw first, and "0 of 4 left" now reads "3 to eat · 1 eaten". Saved meals show kcal and protein. A frozen box planned for today says "Still frozen, and it's for today". There is a weight log with a trend and a rule-bound suggestion. The seafood setting has foods behind it. **Why not higher.** Four booking bugs (must-fix 1 to 4) would trip me in my first real week, and two numbers on the plan card are worded wrongly (must-fix 5, M-15 again).

## 1. Speed

| Measure (local server, no throttle unless said) | Result |
|---|---|
| Cold first load to welcome screen | 1.0 s first run, 0.22 s on the next two (browser cache). First paint 100–360 ms. |
| Welcome → Day | 0.09–0.12 s after the welcome shows |
| Prep tab open (library rendered) | 0.46 s first, 0.16–0.17 s after |
| Search, 25 queries typed at the add sheet | **22–76 ms each**, nothing over 80 ms (`t20`) |
| Fast 4G, CPU 4× slower | first screen 1.7–2.1 s, Day 2.0–2.4 s, Prep open 1.1 s |
| Slow 4G (1.6 Mbps, 150 ms), CPU 4× slower | **first screen 6.9–7.3 s**, Prep open 3.1 s. A repeat visit is 0.27 s. |
| Weight | 51 requests and 1.13 MB before the first tap (57 and 1.58 MB by the Prep tab). My test server sends no compression (`content-encoding: none` on all 102 responses). The 329 KB recipes file loads only when I open Prep. |

Fine for a phone on Wi-Fi or normal 4G. The 7 s on a bad connection is mostly 51 separate un-bundled module requests with no compression. Worth checking that the real host gzips. No console errors and no foreign requests in any run.

## 2. Weekly plans: do they add up? (Use a plan, spot-check days, Undo)

**Card against data.** I summed each plan day myself from `per100g × serving grams` for every item, not through app code.

| Plan | Card says | My sum (average of the 5 days) | Verdict |
|---|---|---|---|
| Low-cook week | 1897 kcal · 133 g protein | 1897 kcal · 133.1 g | **Matches.** Days 1873/137, 1909/135, 1842/128, 1980/121, 1882/144. Max difference 1 kcal and 0.1 g per day. |
| Budget week | 1927 kcal · 132 g protein; "127–141 g" | 1927 kcal · 132.5 g; days 140.8 to 127.6 | **Matches.** |
| "31 items planned" / "28 items" | 31 / 28 | 31 / 28 | Matches. |

**What the Day shows after "Use this week".** I opened Mon and checked all five Low-cook days in the app (`shots/07-day-*.png`). Day totals under "Planned, not eaten yet" were 1873/137, 1909/135, 1842/128, 1980/121 and 1882/144, the same as my hand sums. Mon by hand: 400 (parfait) + 590 (burrito) + 599 (tray bake) + 62 + 105 + 47 + 69 = 1872, app 1873 (rounding). Budget days: 1889/141, 1892/134, 1946/132, 2000/128, 1908/129, also equal to my sums.

**Ticking is correct.** Mon 12:30 tick of the tikka box: 2210 left becomes 1502 left (2210 − 708) and protein 161 becomes 113 (161 − 48). "Planned" never reduces "left" until I tick, which is how I want it.

**Use and Undo.** Prep tab, "Use this week": 2 actions (1 scroll). The toast says "Planned Low-cook week, Undo". One tap on Undo removed all 4 batches and all 31 items (Mon had 0 entries after; `t8`). A single "Use this week" put 4 batch cards on Prep (tray bake ×4, burrito ×2, bolognese ×4, parfait ×3).

**The money.** The card says "€75.64 at the till (€43.97 of it eaten this week)". See must-fix 5: the €43.97 is not what the sentence says. I cannot check Mercadona prices from here, and the app never shows a price list, so €75.64 and €58.97 are unverifiable in the app. "Under 60 €" is supported by the Lab's own number (58.97).

**Protein for a lifter.** The Low-cook week averages 133 g against my 161 g, and Thursday is 121 g. That leaves 28 to 40 g a day to find myself. The Day shows what is left, so I can do it (one whey scoop is 116 kcal, about 24 g). Budget is 127–141. The card says "133 g a day" but not that it is 28 short of a 161 g target. Fine, and honest.

## 3. Lunch boxes, Fill Mon–Thu, ticking, spare box, use-by

| Task | Actions / secs | Result |
|---|---|---|
| Add a lunch box (library tikka → cook, 4 boxes) | **2 actions, 1.6 s** | Dialog says "Keeps 1 day in the fridge, so box 1 goes in the fridge and the rest in the freezer". 1 box = 708 kcal · 48 g protein, same as Review 2 and the #49 record. |
| Fill Mon–Thu | **1 action** | Box 1 Mon … box 4 Thu. Box 1 "Use by tomorrow", boxes 2–4 "Frozen, no use-by yet". |
| Tick Monday | **1 action** | Card then reads "3 to eat · 1 eaten", Box 1 "Eaten". The Review 2 "0 of 4 left" is **fixed**. |
| Mon 22:00: "Tonight: take box 2 out of the freezer" → Move to fridge | **1 action** | Box 2 now "Use by tomorrow". |
| Tue 09:00 or 12:00, I forgot to move it | none | Entry says "Box 2 · Still frozen, and it's for today: defrost it in the microwave, then heat it right through." My Review 2 ask is **in**. |
| Spare box: Mon 12:00 "Box 1 … today is its last day. [Plan it]" | **2 actions** | A **Planned** Lunch entry of 708 kcal appears; totals show "Planned, not eaten yet: 708 kcal · 48 g". Plan it creates a planned entry, as it should. |
| Log a library box on the day (Add to Lunch → box row "+") | **2 actions (+1 for Done)** | The sheet has a "READY TO ADD" row "1 box · 4 left · meal prep". It logs as eaten (no Planned tag), "Box 1", 1502 kcal left. |
| 3 jars of oats, Fill Mon–Thu | 1 action | Places 3 jars on Mon–Wed ("Placed 3 jars in Breakfast / café, 19–21 Oct") but the button still says "Fill Mon–Thu · 19–22 Oct" (nit, same as Review 2). |

## 4. Protein: tips, saved meals, weight

**Tips (`t23`, `t24`).** Banana only at breakfast, then:
- 11:00 and 13:00: no tip. 16:45 and 17:30: "Protein today: 1.3 g of 161 g. Some ideas for Merienda …" with Skyr (16 g, 95 kcal), a protein yogurt (12 g, 62 kcal), 2 boiled eggs (13 g, 155 kcal). 20:30 and 22:30: none. So once a day, in the right window.
- "Not today": gone the same day, even after a reload; back the next day.
- "Turn off protein tips": gone for good, and Profile has a "Tips" switch that is off. I turned it on again and the tip came back.
- The tip's **Add is 2 taps**, not 1: the row opens the portion picker, then "Add to Merienda". The word "Add" on the row reads like a one-tap add.
- After I added the skyr the tip stayed, still offering skyr ("17 g of 161 g"). Drop the idea I just ate.
- **Hidden when a plan is on: see should-fix 1.**

**Saved meals.** Lunch ⋯ → "Save Lunch as a meal…" → name → Save = **4 actions**. In the Dinner sheet the row reads **"My lunch · 3 foods · 639 kcal · 40 g protein"** (Review 2 had no numbers: **fixed**). My items sum to 197 + 317 + 126 = 640, so 639 is right. One tap adds all three. After lunch and dinner, protein left is 121 then 80 (161 − 40, 161 − 80), kcal 1571 then 931.

**Weight log, trend, suggestion (`t26`).** I weighed in every day for 24 days through the screen (2 actions per weigh-in: type, Save). I entered 82.0 down to a noisy −0.1 kg a week. Then I calculated my own EMA (alpha 0.1) and least-squares slope and compared.

| Day | App says | My own number |
|---|---|---|
| 3, 5, 7 | "Latest 81.8 kg" and "Your trend line shows after 5 weigh-ins across a week" | agrees: 5 entries and 7 days are needed, the 7th day has 7 entries but only 6 days of span |
| 8 | "Trend 82.0 kg · latest 82.0 kg" | trend 81.99 |
| 14 | "Trend 81.9 kg · latest 82.0 kg", no rate | needs 6 entries and 14 days: day 14 has a span of 13 days, correct to hold back |
| 15 | "Trend: −0.1 kg a week over the last 2 weeks" | slope −0.14 |
| 21 | no suggestion | span 20 days, rule needs 21: correct |
| 22 | suggestion appears | span 21 days and 22 entries: correct |
| 24 | "Trend 81.8 kg · latest 81.9 kg", "−0.1 kg a week over the last 3 weeks" | trend 81.82, slope −0.12 |

The trend and rate numbers match my own to 0.1 kg. **Use 2110 kcal** is 1 tap and the Day then shows 2110 left, protein unchanged at 161. The chart (`shots/82-weight-suggestion.png`) is clean and calm.

**One wording problem (should-fix 3):** the suggestion says "To match your goal, your daily target could be 2110 kcal (−100 kcal)". My trend is −0.1 and the goal is −0.5, a gap of 0.4 kg a week, which is about 440 kcal a day. −100 kcal closes about a fifth of it. The rails (max 25% deficit from the formula TDEE, floor 2070) cap the change, which is fine, but the sentence should not say "to match your goal".

## 5. Methods: two preps against their ingredients and box count

I read the data and checked every number a cook would use.

**Chicken tikka rice bowl with raita (4 boxes).**
- Chicken 720 g, peppers 240 g (2), onion 200 g, rice 240 g, peas 240 g, lemon 30 g: each appears once with the same grams in the method.
- Yogurt 450 g = marinade 150 + two raita batches of 150 each. Cucumber 200 g = 2 × 100. Mint 8 g = 2 × 4. Oil 20 g = 10 + 10. Salt 13 g = 7 + 4 + 2 × 1. Cumin 7 g = 4 + 2 + 2 × ½. All add up.
- Four boxes: pack ¼ of rice and chicken; 2 raita pots on Sunday and 2 on Tuesday night. Box 1 fridge, 2–4 freezer matches what the app does.
- **Problem:** the library row says "40 min". The marinade needs 4 hours or overnight, and the Lab wrote a `timeNote` saying "Start the night before … on the day about 1 h 10 min, plus 30 min cooling". **`timeNote` is in 10 recipes and no screen shows it** (grep of `app/ui` and `app/core`: 0 hits). That is the M-01 orphan again. A first-time cook who starts at 10:00 on Sunday finds out at step 2.

**Halal beef bolognese with wholewheat penne (4 boxes).**
- Mince 500 g, mushrooms 200 g, pasta 320 g = 4 × 80 g: add up. Sauce "4 portions of about 350 g".
- **Fridge/freezer split disagrees three ways:** the method says "2 into boxes for the fridge, 2 into freezer bags"; the plan card says "1 portion in the fridge for Wednesday, 3 in the freezer"; the app books box 1 in the fridge (use by tomorrow) and 3 frozen. The method says the sauce keeps 3 days; the app says box 1 is "last day" tomorrow.
- **Tomato:** the method says "1½ tins of crushed tomato (800 g)", which makes each tin 533 g. Tins are 400 g. The shopping list says "1 × 800 g jar".
- **Carrot:** method "1 large carrot (120 g)", shopping list "2 medium carrots (120 g)".
- **Onion:** method "1 medium onion (150 g)"; the food record's medium onion is 110 g; the list says "4 medium onions (350 g)" (that is 87 g each, and the 350 g is the tray bake's red onion plus this 150 g).

**Other two I read.** Overnight oats (3 jars): oats 150 = 3 × 50, yogurt 450 = 3 × 150, milk 360 = 3 × 120, chia 30, walnuts 24, banana 180 = 3 × 60. All exact. Chana chaat snack (2 boxes): chickpeas 260 (⅔ of a 400 g drained jar), yogurt 240 = 2 × 120. Exact.

**Prose number check (M-15), recipes and plans.** Everything the app computes is right. The hand-typed claims that are not:

| Claim in the app | What the data says |
|---|---|
| "€43.97 of it eaten this week" (Low-cook), "€32.44" (Budget) | These include food that goes to the freezer and does not get eaten: **€9.30** in Low-cook (1 tray-bake portion and 3 bolognese boxes), €2.25 in Budget. The Low-cook figure also includes €1.93 of karahi bought a week earlier, so it is not "of it" at all. Closer to the truth: about €32.7 of the till is eaten this week. |
| "Sunday 75 min hands-on" on both plans | The library's own minutes for the Sunday batches add to **80** on both (20 + 20 + 30 + 10 and 35 + 20 + 25). "Weekday 43 min" on Low-cook adds to 48; Budget's 60 adds to 60. I cannot reproduce 75 and 43 from the data in the app. |
| "10 min, no cooking" (tuna, egg, tomato and avocado bocadillo) | Its step 2 boils eggs for 10 minutes (plus 5 to cool). The method itself says "Only the eggs are boiled". Confirmed (Mariam). |
| Prep intro: "'Make' needs no cooking" and "Ready to eat: No cooking: buy, open, eat" | Two ready picks say "eggs boiled on Sunday" and "from the Sunday batch". There is no egg batch anywhere. Confirmed (Mariam). |
| Low-cook pitch: "desi at dinner" | Dinners are tray bake ×3 (Spanish), crema, karahi. One of five is desi, and that one is "from the freezer, cooked on an earlier Sunday". Confirmed (Mariam). |
| "Shopping for the week" dialog | It lists 4 of the 10 batches (see must-fix 4). Confirmed. |

## 6. Tap counts against Review 2

| Task | Review 2 | Review 3 | Note |
|---|---|---|---|
| Add a lunch box (library → cook dialog → Cook) | 2 actions, 1.8 s | **2 actions, 1.6 s** | same |
| Fill Mon–Thu | 1 | **1** | same; label still says "Mon–Thu" for 3 jars |
| Move to fridge | 1 | **1** | same |
| Log a library box on the Day | not counted (A10: re-log from recents 2) | **2** (+ Done) | via the "READY TO ADD" row |
| Use a weekly plan | did not exist | **2** (Prep tab + "Use this week", with 1 scroll); Undo 1 | |
| Open step mode | did not exist | **2** from a batch card (How to make it, Step by step); from the library with no batch it is 2 plus about 3 screens of scrolling | |
| Spare box "Plan it" | did not exist | **2** | |
| Week in one go (3 cooks + 3 Fills) | 9 actions, 6.8 s | not re-run (the plan does it in 2) | |

## 7. What works (checked in the running app)

- **Plan numbers are honest** (section 2). I hand-checked all 10 days of both plans.
- **The Prep library is out of my search.** "roti" gives Roti, wrap, Roti with ghee, Naan, White bread. "karahi" gives five karahi foods, the prep row is last and tagged **Prep**. "pan con tomate" puts the single food first. "tikka" gives chicken tikka before the box. All 25 queries took 22–76 ms. This was my Review 2 top ask.
- **Recipe ingredient picker.** "5 eggs" gives 5 large eggs (250 g) raw first; "3 medium potatoes" gives raw potato 639 g; "1 medium onion" gives 110 g; "250 g lentils" gives dry pardina (773 kcal) before the cooked stew. My test recipe: 358 + 492 + 44 = 894 kcal, the app shows 894.
- **Seafood now has food behind it:** prawns raw and cooked, gambas al ajillo, pulpo cocido, mackerel and salmon plates.
- **Chai** still ranks the home 1 tsp first at 13:10 (111 kcal), not the dhaba one.
- **Dark mode and 360 px.** No horizontal overflow on Day, Week, Prep, Profile or Data at 400 dark or 360 light (`shots/95-*`, `96-*`). The Day at 13:30 opens on Lunch with its tick on screen. The macro strip is now three thin bars, my Review 2 design ask.
- **Review 2 smalls fixed:** "3 to eat · 1 eaten"; saved-meal numbers; "Still frozen, and it's for today"; one combined shopping list exists (but see must-fix 4).

## 8. Must-fix

**1. A weekday batch I cook is not linked to the meal the plan put on that day.**
- Steps: use Low-cook on Sun 18 Oct. Wed 21 Oct 21:00: Prep, "Make" Tuna, egg, tomato and avocado bocadillo, one box fewer (default is 2), Make = 3 actions. Open Thu 22 Oct 08:00 (`t30`).
- Expected: Thursday's planned Lunch becomes "Box 1 · use by Fri".
- Actual: Thursday still shows the plan's bocadillo with no box label (666 kcal, Planned). The batch card says "Box 1 · Not placed yet · Use by tomorrow". Plan it would book a second bocadillo. The same goes for the smoothie, caesar and crema. (**Confirmed**, Mariam must-fix 1.)
- Screenshot: `shots/111-thu-0800.png`.

**2. The bolognese is booked wrong from Sunday, and by Thursday the app says "Discard".**
- Steps: use Low-cook, look at the bolognese batch, then open Mon 19 to Thu 22.
- Expected: box 1 is for Wednesday; the rest is in the freezer for later weeks (the plan note).
- Actual: box 1 is "Not placed yet, Use by tomorrow" (because the cooked-pasta rule applies to a box that has no pasta in it until the night before), box 2 is on Wed and frozen, boxes 3–4 frozen. Mon 19 shows "Box 1 … today is its last day". On Thu 22 08:00 the Day says "Box 1 of Beef bolognese pasta is past its use-by. Best not to eat it. [Discard]". 1 portion of my Sunday sauce is thrown away by the app's rules though the method says it keeps 3 days. (**Confirmed**, Mariam must-fix 2; I re-checked Monday and added the Thursday discard.)
- Screenshots: `shots/112-mon-1200-spare.png` (Mon "last day"), `shots/111-thu-0800.png` (Thu "Discard").

**3. The "Tonight" nudge is above the screen after the Day's auto-scroll.**
- Steps: Low-cook used; Tue 20 Oct 20:30, open the Day.
- Expected: the one thing I must do tonight is visible.
- Actual: the Day scrolls to Dinner (scrollY 865) and the "Take box 2 … out of the freezer" card is at y = −513, off screen. It is in view on the Prep tab only. It also says nothing about boiling the penne. (**Confirmed**, Mariam must-fix 3.)
- Screenshot: `shots/110-tue-2030-day.png`.

**4. "Week's shopping" lists 4 of the 10 batches and nothing for the planned snacks.**
- Steps: use Low-cook, tap "Week's shopping".
- Expected: what I buy on Sunday for the week the card sold me ("€75.64 at the till").
- Actual: dialog title "Shopping for the week", text "For tray bake, burrito bowl, bolognese, parfait". Nothing for the bocadillo, smoothies, caesar, crema, karahi, or the yogurts, fruit and almonds on every day. I checked the sums that are there against the data: chicken 860 g, mince 500 g, potatoes 900 g, all exact. It is correct but incomplete. (**Confirmed**, Mariam must-fix 4.)
- Screenshot: `shots/08-week-shopping.png`.

**5. The plan card's money line overclaims (M-15 again).**
- Steps: Prep, open a weekly plan card.
- Expected: "of it eaten this week" is the part of the till I eat in the week.
- Actual: €43.97 (Low-cook) includes €9.30 of boxes that the plan itself puts in the freezer for next week, and €1.93 of karahi bought earlier. Budget's €32.44 includes €2.25 of frozen tray bake. The Lab's build treats "eaten" as the whole batch pro-rata; the card sentence says something else. Reword to "€X of food in this week's batches and ready items", or subtract the frozen part.
- Screenshot: `shots/04-plan-card-open.png`.

## 9. Should-fix

1. **Merienda stays empty; the plan's merienda lands in Snacks (00:00–05:00)** and the protein tip does not show once a plan is on. Steps: Low-cook used, banana at breakfast on Mon, open Mon at 16:45 and 17:30. Merienda says "Nothing yet" and Snacks holds yogurt, banana, kinnow and almonds. With no plan the tip appears at 16:45 ("1.3 g of 161 g"); with the plan it is **missing**, although the banana is the only thing eaten. **Confirmed** (Mariam must-fix 5 and 6). Screenshots: `shots/75-mon-1730.png`, `shots/74-plan-on-1645.png`. I put these in should-fix only because they cost me food placement, not numbers; fix them first in this list.
2. **The Week view calls planned food "logged".** Steps: use a plan, open Week for 19–25 Oct before eating anything. The bars show "kcal 1873 / 2210, protein 137 / 161 g", and the footer says "Average of 5 logged days: 1897 kcal · 133 g protein". It is all planned and none eaten. Mark planned days (hatching like the Day bar) and say "planned". New. Screenshot: `shots/96-dark-400-Week.png`.
3. **The weight suggestion says "To match your goal … 2110 kcal (−100 kcal)"** when −100 closes about a fifth of the gap. Say "a small step toward your goal" when the rails cap it. New.
4. **`timeNote` is written for 10 recipes and never shown** (section 5). Show it on the library row and the cook dialog ("Start the night before" for tikka). M-01.
5. **Method and shopping disagree** on bolognese tomato (1½ tins = 800 g vs a 800 g jar), carrot (1 large vs 2 medium) and onion (150 g vs a 110 g medium vs 87 g); also the fridge/freezer split of the sauce (2+2 vs 1+3). Pack and unit counts need the M-04 check. Partly Mariam's item 7.
6. **"Add" on a tip idea opens the portion picker** (2 taps). Either log one default portion on that tap or call it "Choose". New.
7. **Sunday "75 min" and weekday "43 min"** on the plan cards do not add up from the library minutes (80 and 48). Generate them from the data (M-15).
8. **"Make" cards default to 2 boxes when the plan says ×1** (3 actions instead of 2) and a new recipe still starts at 4 boxes. Still open from Review 2.
9. **Fridge and Freezer buttons are 59×38 and 66×38 px** at 360 and 400 (26 of them on one Prep screen). Review 2 asked for 44 px. Not done.
10. **Search ranking leftovers from Review 1:** "salad" puts the tuna salad first; "biscuit" puts Gluco above Marie; "kela" puts gulab jamun second; "pulpo" shows four pulao rows after the octopus. Fuzzy junk below the true hit. Also "1 pakora (12 g) (12 g)" in the ingredient picker.

## 10. Nice-to-have

- "Fill Mon–Thu · 19–22 Oct" should say "Mon–Wed" for 3 jars.
- Library near the top of Prep when I have no batches.
- Drop a tip idea I have already eaten from the tip.
- A one-line "add 28 g protein to reach 161" under a plan card for a lifter. The plan says 133 g and my target is 161 g.
- "Week" could show eaten and planned as two bars.

## 11. Compared with the apps I use

- **MacroFactor** (trend and suggestions): ours matches the maths I checked; it is quieter. MacroFactor adapts the target from intake and weight together. Ours is rail-capped (−100) and says it will "match your goal". Ours never nags and never changes a target alone. I prefer that, once the wording is fixed.
- **MyFitnessPal / Cronometer:** neither plans a week of boxes, tells me to take a box out of the freezer, or says "Still frozen, and it's for today". That is the reason to use this one. They still win on database size and barcodes.
- **HealthifyMe:** ours has no coach cards between me and the log. Keep it that way.

## 12. Top 5 changes, ranked

1. Link a cooked weekday batch to the meal the plan planned for that day, and fix the bolognese booking and its "Discard" on Thursday (must-fix 1 and 2).
2. One shopping list for the whole plan, including the ready snacks, and put the plan's merienda and the tip in Merienda (must-fix 4, should-fix 1).
3. Keep the "Tonight" card on screen after the auto-scroll, and add the penne and next-day cook nudges (must-fix 3).
4. Fix the plan card's money and minutes wording: "eaten this week", "75 min", "desi at dinner", "no cooking" (must-fix 5, should-fix 7). Generate them from data.
5. Show `timeNote` and make methods match shopping counts (should-fix 4 and 5).
