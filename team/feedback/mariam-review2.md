# Mariam Iqbal: Review 2 (Sprint 2 build, with the "less cooking" library)

*Sun 18 to Fri 23 Oct 2026, Madrid clock, driven with Playwright at 400x860 dark (plus 1280 light for one look at Day and Prep). Scripts, screenshots and result JSON: `team/feedback/screens/mariam-r2/` (`s0` onboarding, `s1` Sunday, `s2` placing and Monday, `s3` Tuesday, `s4` Wednesday evening, `s5` Wednesday night and Thursday, `s6` no-cook filter and feta, `s7` Review 1 retest, `s8` chai and saved meals, `s9` profile and shopping lists, `s10` visuals). An action is one tap or one typed phrase. Seconds are script (machine) time; a person is slower, so read them as a floor, not as my own timings. I set up as before: woman, 29, 165 cm, 60 kg, Active, keep weight. This time I also ticked "weight training" and chose **Fish only** for seafood (I am Hanafi). I did not edit app code, data or tests.*

## My checks: 4 pass, 3 pass with a real gap, 1 fail

| # | Check | Result | Evidence |
|---|---|---|---|
| 1a | **Sunday: cook the batch, split into boxes** | **PASS** | Meatballs x4, parfait x3 and lentil bowl x2 each took **2 taps** (Cook, then "Cook 4 portions"). The app proposed meatballs 3 fridge + 1 freezer ("use by Wed"), parfait and lentil bowl all fridge with "No freezer" struck through, lentil "use by Tue" (`s1-1-cook-dialog-meatballs.png`, `s1-2-batch-meatballs.png`). I could change any box with one tap. The doc's plan says 2 fridge + 2 freezer for the meatballs; the app says 3 + 1 (cooked meat keeps 3 days). I had to flip box 3 myself to follow the plan, and I did not. See S3. |
| 1b | **Sunday: shopping list matches Mercadona?** | **FAIL** | 2 taps per list (Shopping list, Copy list), clipboard text is clean and the butcher comes first (`s1-shopping-lists.txt`). But it is **three separate lists, one per batch**, in grams of raw food, not products. "Egg, whole, raw: 50 g", "Walnuts: 24 g", "Kiwi: 207 g", "Brown rice, microwave cup: 250 g", "Garlic: 6 g". Onion and olive oil repeat across lists. Salt, pepper, paprika and bay leaf sit among what I buy. The Salmon box list says "Egg, boiled: 800 g" at 8 boxes, and nobody buys boiled eggs. The doc's own Mercadona table (whole packs, product names, prices, "1 pack of 12 (uses 7 eggs)") is exactly what I need, and the app does not have it. |
| 2a | **Mon to Fri: Fill Mon-Thu** | **PASS** | Lentil x2: Lunch chip + Fill = 2 taps, "Placed 2 boxes in Lunch, 19-20 Oct." Parfait x3: 2 taps, "19-21 Oct." Meatballs: 3 day taps (Mon, Tue, Thu); the app put the **frozen** portion on Thursday by itself, which is clever. Tuesday night salmon x2 + Fill = 4 taps in all, landed on Wed and Thu. But on a Wednesday night the same button reads "Fill Mon-Thu - 22-28 Oct" and would put my Friday breakfast on next Monday, so I tapped Thu and Fri instead (4 taps). |
| 2b | **No-cook breakfast, ready merienda, one full day** | **PASS, with a gap** | Mon 19 Oct (`s2-mon-*.png`): parfait tick 1 action; café con leche 4 (3 taps + 1 phrase); lunch tick 1 (+1 scroll); merienda of 2 protein yogurts, a kinnow and a banana **9** (6 taps + 3 phrases; each yogurt is its own row); dinner tick 1 (+1 scroll); picos + pear at 22:30 **6**. **About 24 actions over six moments**, never more than 4 at once except the merienda. Machine time about 7 s in all. The full day shows 2,180 kcal and 141 g protein, which is the doc's 2,086 plus my 95 kcal café. The ready items are not in the app as a plan: every merienda is typed by me. If I only tick the batch food, Tuesday ends at 1,593 kcal and 106 g (Week view), about 450 kcal short of the doc's day. |
| 2c | **Microwave queue test (13:30)** | **PARTIAL** | The Day view opens at the top. At 13:30 the big numbers, the macro panel and the finished breakfast fill the screen, and the lunch tick sits at **y 863 of 860**, just off screen under the Add food button (`s2-mon-2-open-1330.png`). So it is **scroll + tick = 2 actions**, one thumb, about 3 seconds in real life. It is possible in the queue. It would be 1 tap if the app opened at the meal I am in. |
| 3 | **Wed evening: Move to fridge, last day, past use-by** | **PASS** | Wed 19:30: an amber card "Tonight: take box 4 of Mandonguilles... out of the freezer for tomorrow's dinner" with a 44 px "Move to fridge" button, 1 tap, card gone, and Thursday's dinner then reads "Portion 4 - last day" (`s4-wed-2-evening-top.png`). Notes are calm: "Box 2 - last day" on Tuesday and Wednesday, "Last day (today)" in an amber chip, "Past use-by, best not to eat" in grey with a "Throw away" button (`s4-thu-4-meatballs-past-use-by.png`). No red, no pop-up. **Gap:** the spare fridge portion 3 is only flagged in the Prep tab. The Day view said nothing on Wed evening or Thu morning, so a spare box can expire without my seeing it. The "Tonight" card also repeats the 80-character dish name. |
| 4 | **No-cook filter, 10-minute lunch, halal clarity** | **PASS, with gaps** | One tap on "No-cook (<=15 min)" gives 15 preps with "10 min, no cooking" lines, and 5 lunches (`s6-2`, `s6-3`). My lab pick: the lentil + brown-rice + Burgos bowl (10 min, cold, no fish smell in the shared fridge). The feta box shows an amber **Check** chip. One tap opens "Feta made with rennet (cuajo) of unstated origin. Swap: queso de Burgos 0% (cuajo microbiano) makes it halal." in the list, in the cook dialog and again on the Day entry (`s6-6`, `s6-9`). That is very good. **Gaps:** halal preps show no chip in the list (only in the dialog), so "halal" is the absence of a flag. The swap is text only: I cannot make the box with Burgos. The rows do not say hot or cold or "needs microwave". And Pa amb tomàquet shows no caveat, though MEALPREP.md says Mercadona's barras list E-472e with no origin. |
| 5 | **Retest of Review 1 fails** | **4 of 5 fixed** | Details in the next section. |

### Retest of my Review 1 list

- **M5 gym day: PASS now.** The target is **96 g** (1.6 g/kg) because I ticked weight training in onboarding. End of day reads "+45 g above target" with a tick, not "over" (`s2-mon-7-end-of-day-top.png`). `skyr` finds "Skyr, plain (0% fat)" at rank 1 (95 kcal). Log took FAB, phrase, "+", Done = 3 taps + 1 phrase.
- **1. The "null" under results: fixed.** I checked 19 queries, none shows it.
- **2. Skyr and yogurt: fixed.** Also `yogur proteinas` finds the Mercadona +Proteínas pot at rank 1.
- **3. Protein wording and target: fixed.**
- **4. Spanish slot names: half fixed.** "Merienda" is on the Spain preset and "Rename meals" exists in Profile. Breakfast / café, Lunch and Dinner are still English, and onboarding does not ask me.
- **5. Late-night sheet: fixed.** At 00:30 the sheet opens on **Snacks** with "Counts for Fri, 23 Oct: your day runs until 04:00" (`s7-m3-0030-sheet.png`).
- **6. My usual: fixed.** "Set my chai once" took **4 taps** (Set my chai, Half milk, 200 ml, Save), then "chai" gives **My chai (1 tsp sugar)** at rank 1 and it is first in the Merienda list with an empty search (`s8-2`, `s8-3`). "Save Merienda as a meal" took 3 taps + 1 phrase and "Gym merienda - 3 foods" is then one "+" in the sheet (`s8-7`). Recents are now slot-aware at the top (yogurt, skyr, banana, kinnow for Merienda) but still spill into dinner boxes below.
- **7. Halal honesty: NOT done.** `chorizo`, `jamon serrano`, `gambas` and `calamares` still return a bare "Nothing found" with no hidden note (`s7-r1retest-results.json`, `x5-*.png`), and `jamon` returns Gulab jamun. Halal foods (Lentejas, bocadillo de tortilla, Marie biscuits) still have no chip and no reason (`s11-1`). Profile promises "Search always tells you when something is hidden, and why", which is not true for foods that are not in the data.
- **Croissant (M1): still good.** `cafe amb llet` and `cruasan` are rank 1, and the croissant has the Check chip. 4 taps + 2 phrases.

## The low-cook week as a real plan for my week

**Verdict: realistic and kind, but dear and a bit fishy.** I would run it with three edits.

- **Cooking load: believable.** One Sunday session (65 minutes by the doc), then 4 short builds of 8-15 minutes. In the app each build is 2 to 4 taps (cook, place), so the app is not what slows me.
- **Food amount: right for energy, high on protein.** It lands at 2,050-2,145 kcal and 131-139 g protein. My own target is 2,050 kcal and 96 g, so I would be about 40 g over on protein every day, and I would pay for it (6 Burgos tubs, 1.5 kg of protein pot, tuna). That is fine for a gym week. But the day only reaches the numbers if I add the 450 kcal of ready items, and nothing in the app does that for me (see 2b).
- **Money: about 80 EUR at the till is too much for me.** The doc says about 46 EUR of it is consumed this week and the rest stays in the cupboard, which is true and still a big first-week outlay for a PhD student. I would only do it every second week and restock the cupboard items slowly. I could not check live Mercadona prices from here. The prices are the doc's own.
- **Boring by Thursday: yes, a little.** Thursday is the repeat day: second salmon bowl, third meatball dinner, and the same picos and Burgos snack as Tuesday. Wednesday to Friday lunches are three fish lunches in a row (salmon, salmon, mackerel). Three days of fish in a shared lab fridge is a lot, and the doc itself says never to microwave it. I would swap Friday's couscous for the cold chickpea one and add one desi dinner (karahi from the freezer) in place of the third meatballs. The week has only one desi dinner (chana masala). That is not much for me, but the fruit chaat and Pa amb tomàquet are lovely.
- **Queue friendly: yes.** Every lunch in the plan is good cold, so I never need the 13:30 microwave. That is the best thing about it.
- **Halal and products:** the meat comes from a halal butcher and the rest is labelled "halal" by the Lab. I know and would find Hacendado jarred lentils and chickpeas, Burgos 0%, queso batido, tomate triturado, picos, kiwi, mandarinas and avena. I would double-check the microwave rice cups (the doc says "Sabroz", I would look for the cup next to the basmati), the canned salmon pack and the +Proteínas pot names in the shop. The bread note (E-472e in Mercadona barras) is only in the doc, not in the app.

## What works for a PhD week

- **The Sunday flow is 2 taps per batch.** The fridge/freezer split and use-by dates are proposed, clear, and I can change them.
- **Fill Mon-Thu, "Tick as eaten" and the use-by notes** do real work: one tap for a lunch box, "last day" in calm words, and the Wednesday "Tonight" card.
- **The no-cook filter and the 10-minute label** are what I need after a lab day. The "Check" chip on feta, with a one-tap reason and swap, is the best halal moment in the app.
- **Set my chai once, My chai at the top, and saved meals** give me back my own routine.
- **No sideways scroll** at 400 px on any of the five tabs, and the 1280 light page is tidy (`s10-*`). The protein target and "+45 g above target" wording now fit a gym week.

## What doesn't

- **The shopping list is not a Mercadona list** (see 1b). Three lists, grams, raw eggs, cupboard mixed in.
- **The lunch tick sits below the fold at 13:30.** I scroll in a queue.
- **Pork and shellfish searches are silently empty**, and halal foods show nothing. This is my biggest trust gap, and it is the same as in Review 1.
- **The low-cook week is not in the app.** Ready items cost 9 actions a day, and the plan's day totals are not visible anywhere I can tick.
- **Spare fridge portions and past-use-by are only on the Prep tab.**
- **Dish names are long.** "(freezer dinner portion)", "(breakfast jar)", "(lunch box)" repeat in every title, the Tonight card and the batch card, and the Prep tab needs about two screens per batch.
- **The Library is far down the Prep tab.** On an empty Prep tab I scroll past batches, recipes, chai and saved meals to reach it.
- **Small slips:** "Picos... 30 g - 30 g - 114 kcal" prints the grams twice; the chai card says "207 ml" for my 200 ml cup; Salmorejo and Fruit chaat default to 2 portions when the plan eats 1; "Fill Mon-Thu" is wrong after Monday.

## Halal trust

- **Trusted:** the Check chip with its reason (feta, croissant, napolitana), the hidden-with-reason ensaïmada, and "Halal only" on by default. The "Fish only" seafood setting is simple and reads well. I chose it, but nothing I searched touched it, since the app has no prawn or squid foods (`gambas` and `calamares` are empty), so I cannot see it working.
- **Distrusted:** (1) A silent empty search for pork and shellfish looks like "not in the database", not "hidden because not halal". (2) A halal food with no chip has no visible basis. (3) The bread caveat is in the doc and not on Pa amb tomàquet. (4) The feta swap does not change the recipe, so the box stays marked Check even after I buy Burgos.

## Priya's refinements: my view

Section 4 (Option B):

1. **Finish the Prep screens in the Day system: agree, and it mostly happened.** Halal chip, two-line box rows, our own date words, "Cooked" as Yesterday / Today / Tomorrow chips, and meal chips are all in.
2. **Macro strip under the big number: agree, done, and I like it.** I would make the panel shorter, because the "Estimate means a good guess" paragraph repeats every day and pushes lunch down.
3. **Icons plus labels in the tab bar: agree, not done.** Text tabs are fine for me, but five words in a row is dull.
4. **One add entry point: change.** Keep the floating Add food (it is my one-thumb button in the queue). Drop the per-slot "Add" instead, or make it smaller.
5. **Shorter names and portion labels: agree strongly, not done.** It is my fix 6 below.
6. **Feedback on "+": agree, done** (the "+" turns into a tick for a second).
7. **Tabular numbers and contrast: agree.** I could read everything in dark mode at 400 px.
8. **One friendly empty day: change.** Five "Nothing yet" cards are fine for me. A card that says "Copy yesterday / Cook a batch / Add food" would help more on Sunday, when I have no batches.
9. **A small katori mark: disagree for now.** Nice, but my list below is more urgent.

Section 5 (Lena's meal-prep screens): items 1 to 6 are **agree and done** (halal chip, shorter rows, calm dates, Fill label on one line, Cooked chips, meal chips). I would add one more: a **one-screen batch row** (name, "of 4 left", Use-by chips) that opens only when I tap it, instead of a full card each.

## Score: 8 / 10 (Review 1: 7)

The Review 1 blockers are gone: no "null", skyr, a protein target that fits the gym, a late-night sheet that makes sense, and my chai in 4 taps. Sprint 2 added the thing I actually need on Sunday: batches, boxes, fridge or freezer, use-by and a "Tonight" nudge, in two taps each. I take two points off for the shopping list that is not a shopping list, for the lunch tick that is off screen at 13:30, and for the halal gap that I flagged last time and that is still there.

## Top 7 changes, ranked

1. **One shopping list for the whole week.** Merge all batches, show Mercadona products and packs ("Huevos x12, uses 7", "Lentejas cocidas x1"), cupboard items in their own "you have these" block, eggs as raw eggs, butcher first, one Copy.
2. **Open the Day at the meal I am in.** At 13:30 put Lunch on screen (or pin one "Lunch box: tick" row above the numbers), so the queue is 1 tap.
3. **Finish halal honesty.** Never return a bare "Nothing found" for chorizo, jamón, gambas or calamares (show "hidden: pork" or "seafood: check"). Add a quiet "Halal" chip and one-tap reason on halal foods. Put the E-472e bread caveat on Pa amb tomàquet.
4. **Put the Low-cook week and the ready picks in the app.** One-tap saved meals ("Protein yogurt + banana + almonds") and an "Add this week's plan" so the ready items are 1 tap, not 9 actions.
5. **Warn on the Day view about spare and old boxes.** "Portion 3 is at its last day tonight: eat it or freeze it", and when the cook dialog proposes 3 fridge + 1 freezer, say that two is enough for a week if I only need two.
6. **Short names and Spanish meal names.** Drop "(freezer dinner portion)", "(lunch box)" and "(breakfast jar)" from titles. Offer Desayuno, Comida, Merienda, Cena in onboarding, not only in Profile. Fix the duplicated "30 g - 30 g".
7. **Say hot, cold or microwave on every no-cook row, and make the feta swap real.** A "Cold" or "Microwave" tag on each row, and a "Make with Burgos 0%" switch that turns the Check chip into a halal chip. Also make "Fill" work after Monday (next free days, not next Mon-Thu).
