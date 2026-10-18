# Mariam Iqbal: Review 3 (Sprint 3 build: a full week, cooking from the app)

*Sun 18 to Fri 23 Oct 2026 on the Madrid clock (plus Wed 10 to Thu 11 Feb 2027 for Ramadan), driven with Playwright at 400x860, light for the week and dark for a second pass. I tested a **fixed snapshot** served from the scratchpad (`.../scratchpad/review3/app`), not the live repo. The clock was set per visit with `page.clock.setFixedTime`. An action is one tap or one typed phrase. Screenshots (about 210) are in `/tmp/claude-0/-home-user-Macros-calculator-/8f52dea3-769e-51a2-93b3-61c066c71d94/scratchpad/review3-shots/` (called `shots/` below). Scripts are in `.../scratchpad/r3/`. I did not edit app code, data or tests, and I did not commit.*

I set up as before: woman, 29, 165 cm, 60 kg, Active, weight training ticked, keep weight, **Fish only**, Spanish meal names (the welcome screen had them preselected, I assume because of the Madrid time zone). Targets 2,050 kcal and 96 g protein. I used the **Low-cook week** and tried the **Budget week** on a second copy of my profile (both apply with one tap, both keep to their cards: Low-cook averages 1,897 kcal and 133 g a day, Budget 1,927 kcal and 132 g, the same as the card text).

## Score: 8.5 / 10 (Review 2: 8, Review 1: 7)

Three of my Review 2 complaints are gone: the shopping list is **one merged list with packs and where-to-buy lines**, the lunch tick is **on screen at 13:30**, and a pork search now says so. The app can also teach me to cook, which is new and mostly good. I take 1.5 points off because the weekly plan, the thing I would use every Sunday, **does not hold together once the week starts**: the shopping list only covers the Sunday batches, a weekday box I cook is not linked to the meal the plan put there, and the bolognese is booked wrong. All of these are fixable and none touches halal or the numbers.

## Counts for three core tasks (tap or phrase; scrolls in brackets)

| Task | Review 3 | Review 2 |
|---|---|---|
| Add a lunch box | **Tick it at 13:30: 1 tap** (the planned box sits on screen, scroll 0). Add one that is not planned: Add (Lunch), the box row, Done = **3 taps**. From Prep: Prep tab, then the day chip = 2 taps. "Plan it" on a spare box: 2 taps. | 2 taps to place, tick was off screen (2 actions with a scroll) |
| Use a weekly plan | Prep tab, "Use this week" = **2 taps (1 scroll)**. A toast gives Undo. It books 4 Sunday batches and 31 items in one go (`shots/08-plan-used-0.png`). | no plans |
| Open a method in step mode | With a batch on the Prep tab: Prep, "How to make it", "Step by step" = **3 taps** (`shots/11-step-00.png`). From the library with no batch: 3 taps **plus about 3 screens of scrolling** (the Library starts 2,578 px down, `shots/06-prep-full.png`). | no methods |

Other counts: onboarding 8 taps + 3 typed (same as Review 2); Week's shopping then Copy list 2 taps; weight log (Profile, type, Save) 3 actions; "What does Check mean?" 3 taps + 1 phrase (search, open the food, Source and details, the button); saved meal 3 taps + 1 phrase to save, then 1 tap to add; Ramadan on 1 tap, date and offsets 2 more, a day override 4.

## What works (checked in the running app)

- **Weekly plan in 2 taps.** Sunday's four batches appear with boxes already on Mon, Tue and Wed, and the weekday meals sit on the Day as "Planned". Budget week says "Under 60 €" and the data gives 58.97 €.
- **The Sunday shopping list is a real list.** Butcher first, packs ("1 pack of 2 x 125 g cups"), jars with drained weights, a "Check you have" block for oil and spices, one Copy, clean text (`shots/09-shop-0.png`). The karahi list adds "Pakistani or Moroccan grocery (next to the halal butcher): green chillies / coriander seed / garam masala".
- **13:30 queue test passes.** At 13:30 the Day opens with Lunch and its "Tick as eaten" on screen, and ticking the box is 1 tap (`shots/12-mon-1330-top.png`). Evening: it opens at the current meal.
- **How to make it is good for a beginner.** Equipment, "Before you start" (cut sizes in cm and mm), steps with heat chips (Medium-high, Oven 220 C), minutes, hygiene ("Wash your hands", "use oven gloves"), "Done when" with a 75 C check, Box it up, Reheat, and a halal tip on stock cubes. Step mode has a progress bar and Back and Next, and works in dark (`shots/dark-step-step-03.png`).
- **Halal.** Feta box: one tap on "Halal swap: Lentil Burgos salad" opens the Burgos recipe, 584 kcal against 590 (`shots/25-feta-swap-result.png`). "What does Check mean?" opens a Barcelona guide with Spanish label words, how to ask ("¿Lleva manteca de cerdo?") and the Raval butchers (`shots/23-check-guide.png`). `chorizo` and `jamon` now say "Katori has no pork or alcohol foods. Everything here is pork-free." (my Review 1 and 2 item 7 is fixed). `gambas` shows **Check** because I chose Fish only.
- **Spare box, saved meals, picks, weight.** "Plan it" is calm and says "last day". Saved meals land at the top of the Add sheet. A ready pick is 1 tap. The weight log takes Today or Yesterday.
- **Ramadan.** Turning it on shows the first fasting day with a date field (Mon 8 Feb 2027, 30 days to 9 Mar), a 30-day table, +/-30 min offsets and a pencil per day. I set the first day to 9 Feb, Maghrib "3 min later" and Thu 11 Feb Maghrib 18:30: the table marks "(your time)", and the Day shows "Fajr 06:19 · Maghrib 18:30" and Sehri, Iftar, After taraweeh, Snacks. The times look right for Barcelona by my own sums (Fajr 06:22 and Maghrib 18:16 on 8 Feb, Maghrib 18:51 on 9 Mar).
- No sideways scroll on any tab at 400 px, light or dark, and no console errors in the dark pass (the only run where I logged them).

## Cooking from the app: what confused me

I cooked the **chicken, potato, pepper and chickpea tray bake** and the **halal beef bolognese** only from "How to make it" (sheet, then step mode), and read the parfait, tuna bocadillo, caesar salad, crema, smoothie and karahi the same way. A beginner would stumble here:

1. **Tray bake step 7 says `Check the biggest chicken piece (see "Done when")`.** In step mode "Done when" is not on that screen. It only appears after the last step, on the Finish screen (`shots/traybake-step-07.png`, `shots/traybake-step-09.png`). The caesar has the same line in step 6. In step mode I must go Back or ahead to find the doneness, and nothing says what to do if the chicken is still pink (put it back 5 minutes).
2. **Oven 220 C: fan or not?** Spanish ovens often have "calor arriba y abajo" and "ventilador". Nothing says which. The chip is the same on all three oven steps.
3. **"Paprika" is not defined.** Mercadona has dulce, picante and ahumado. The ingredient list says only "Paprika, 6 g". The HelloFresh source it quotes uses smoked paprika.
4. **One very large tray or 2 normal trays.** With two trays, nothing says how to share the potatoes and chicken, or that I would need to swap the trays.
5. **Timers are chips, not timers.** "Oven 220 C · 20 min" is not tappable. A beginner juggling a 20-minute roast and "Meanwhile mix the chicken" has no reminder.
6. **The time on the card is only the hands-on time, and it is not labelled.** Library rows say tray bake "20 min", bolognese "30 min", karahi "60 min". The step timers add up to about 75 minutes for the tray bake (10 oven + 20 + 20 + 25 cooling), 79 for the bolognese (1+5+8+35+30, plus the penne), and 78 for the karahi with its roti. Peeling 900 g of potatoes and cutting everything takes me longer than the "Before you start" suggests.
7. **Bolognese: tomato.** Method: "Open 1 1/2 tins of crushed tomato (800 g)". Shopping list: "1 x 800 g jar". Also **onion and carrot**: method "1 medium onion (150 g)" and "1 large carrot (120 g)", list "Red onion: 4 medium onions (350 g)" and "Carrot: 2 medium carrots (120 g)". Karahi: method "1 small onion (120 g)", list "2 medium onions (120 g)". I would buy one onion too many each time and not know which tin or jar is meant.
8. **The bolognese penne is "the night before each lunch".** That step (8 of 9) is easy to skip when I am cooking sauce on Sunday afternoon, and the Day never reminds me on Tuesday night (see must-fix 3). The plan card says "boil the penne on Tuesday night (8 min)" while the step says "about 10 minutes".
9. **A 1-box batch shows the 2-box amounts.** The tuna bocadillo sheet says "Amounts are for 2 boxes" and the plan says "half the recipe", but step mode drops that line and still says "Open the 4 cans of tuna (240 g drained)", "Halve the avocado (you need 1/2)", "2 eggs", "2 lunch boxes" for my 1-box batch (`shots/32-bocadillo-method-sheet.png`). The Make dialog also defaults to **2** boxes while the plan says x 1, so I had to tap "One box fewer".
10. **The caesar steps are out of order.** "While the eggs cook, rub the chicken..." comes after the eggs are already done and cooling. It also lists "At lunch..." as a step to do now (fine in the sheet, odd in step mode).
11. **No heat chip on a chopping step** says "No heat", which reads like a warning. It is only the absence of heat.
12. **The crema's "no cooking"** needs eggs boiled on Sunday: "Sunday: boil 4 eggs (keep 3 days)", but the plan eats them on Thursday (day 4), and no Sunday step in the plan boils eggs.
13. **Reheat is clear.** "Microwave with the lid loose 2 1/2-3 minutes, stir, then 1 minute more until steaming hot" is the best line in the app for a lab microwave.

## Must-fix bugs

**1. A weekday batch I cook is not linked to the plan's planned meal: the day doubles and the app nags me.**
- Steps: use the Low-cook week. Wed 21 Oct 21:00: Prep, "Make" the Tuna, egg, tomato and avocado bocadillo, tap "One box fewer", "Make 1 box" (3 taps; the plan says x 1). Open Thu 22 Oct 08:00.
- Expected: Thursday's planned lunch becomes that box ("Box 1 · use by Fri"), or the planned row is replaced.
- Actual: Thursday lunch still shows the plan's unlinked "Tuna and egg bocadillo, Planned", and a card above says "Box 1 of Tuna and egg bocadillo is good until tomorrow. [Plan it]". Tapping Plan it puts a second bocadillo in Lunch: 1,332 kcal / 88 g in Lunch and 2,646 kcal / 165 g planned for the day. I had to open the row menu and Delete the plan's copy (2 taps) before ticking the real box.
- Screenshots: `shots/28-thu-0800.png`, `shots/31-bocadillo-batch.png`, `shots/33-thu-after-planit.png`.
- The same happens for every "short job" batch (smoothie, caesar, crema).

**2. The bolognese is booked wrong on Sunday and the app tells me to waste or double it.**
- Steps: "Use this week" on Low-cook, look at the bolognese batch card, then open Mon 19 Oct.
- Expected: the plan says "1 portion in the fridge for Wednesday, 3 in the freezer"; the method says sauce keeps 3 days in the fridge.
- Actual: Box 1 is **Fridge, "Not placed yet, Use by tomorrow"**, Box 2 is the **frozen** one placed on Wednesday, and Boxes 3 and 4 are frozen. On Monday the Day says "Box 1 of Beef bolognese pasta: today is its last day. [Plan it]", while Monday lunch is the burrito bowl and dinner the tray bake. The 1-day limit comes from cooked pasta, but the box has no pasta in it until I boil it the night before.
- Screenshots: `shots/57-bolognese-batch-card.png`, `shots/13-mon-top.png`. For my test I tapped Plan it into Dinner (2 taps): Monday then had two dinners, 1,208 kcal and a week total of 2,660 kcal, "+610 over" (`shots/53-week.png`).

**3. The Tuesday-night "move to fridge" card is hidden by the new auto-scroll, and it omits the penne.**
- Steps: Tue 20 Oct 20:30, open the Day.
- Expected: the one nudge I need tonight is on screen.
- Actual: the Day scrolls to Dinner (scrollY 626), and the amber card "Tonight: take box 2 of Halal beef bolognese out of the freezer for tomorrow's lunch" with its "Move to fridge" button sits at y -351, above the screen (`shots/27-tue-2030.png`). It says nothing about boiling the penne, which the box needs.
- Wed 21 Oct 20:30: nothing tells me to make Thursday's bocadillo and smoothie either (`shots/29-wed-2030.png`).

**4. "Week's shopping" is only the Sunday batches, not the week.**
- Steps: "Use this week" (Low-cook), then "Week's shopping".
- Expected: one list for what I buy on Sunday for the plan (the card says "EUR 75.64 at the till").
- Actual: the list is titled "Shopping for the week" but covers "tray bake, burrito bowl, bolognese, parfait" (4 of 10 batches). Nothing for the bocadillo (tuna, avocado, rolls, eggs), the smoothies, the caesar, the crema, or any planned snack: protein pots, Burgos tubs, apples, kinnow, almonds, pear. I would shop on Sunday and be short on Wednesday. There is no list on the plan card itself.
- Screenshot: `shots/09-shop-0.png`.

**5. The plan's merienda and the "ready" picks land in Snacks, not Merienda.**
- Steps: Mon 19 Oct 17:30, open the Day; then Prep, "Add 2 Burgos 0% tubs + 1 apple" under Snacks.
- Expected: at 17:30 the food is in the Merienda slot I named in the welcome screen.
- Actual: **Merienda says "Nothing yet"** while Snacks (00:00 to 05:00 on the Spanish clock) holds the planned yogurt, banana, kinnow and almonds, and my pick. Every day of both plans does this (`shots/18-mon-1730-day.png`, `shots/19-day-after-pick.png`).

**6. The protein tip never shows once a weekly plan is on.**
- Steps A: onboarding only, log a café con leche at 09:00 Fri, open the Day at 16:45. Steps B: Low-cook week with the same café, same time.
- Expected: both show the tip (4.3 g of 96 g and 40 % is due after lunch).
- Actual: A shows "Protein today: 4.3 g of 96 g", with Skyr, a protein yogurt or two eggs (`shots/40-tip-noplan-1645.png`). B shows nothing (`shots/39-fri-1645.png`). The code counts the plan's planned meals as eaten (`all.total.protein` in `store.js`), although the comment in `core/nudges.js` says planned is excluded.

## Should-fix

1. **Step mode:** "see Done when" must be on that step; add the "Amounts are for N" line; make the time chips tappable timers (or say "set a timer"); say fan or no fan; name the paprika (see Cooking above, items 1 to 5 and 9).
2. **Method and shopping counts must match** (bolognese tomato, onion, carrot; karahi onion), and the bolognese penne needs a Tuesday-night prompt.
3. **Time labels:** say "30 min hands-on · about 1 h 20 in all", and do not call a recipe "10 min, no cooking" when it boils eggs. The tuna bocadillo is labelled that way, its own step 1 says "Only the eggs are boiled", and the steps add up to 15 minutes of timers.
4. **"Make needs no cooking" and "No cooking: buy, open, eat" overclaim.** The Prep intro says Make needs no cooking. The Ready picks say it too, but "Two boiled eggs, a Burgos tub and a pear" says "eggs boiled on Sunday", and "2 boiled eggs" says "from the Sunday batch". No Sunday egg batch exists in the library or in either plan.
5. **The Low-cook card says "desi at dinner".** The week's dinners are the tray bake x 3 (Mon to Wed), vegetable crema (Thu) and **karahi "from the freezer, cooked on an earlier Sunday"** (Fri). In week 1 I have no freezer karahi, so the card needs one more Sunday batch or a "buy ready" swap, and the claim should go.
6. **Batches are "Cooked today" on Sunday morning** the moment I tap "Use this week", before I cook anything. A "To cook" state, or a first tap that says "I cooked it", would match the truth.
7. **"Copy list" gives no visible confirmation.** The text "Copied. Paste it into your notes or a chat." is only in a screen-reader region. The button label does not change (`shots/09-shop-copied.png`).
8. **Still open from my Review 2:** "Picos integrales 30 g · 30 g · 114 kcal" on the Day row (`shots/54-picos-row.png`); "Fill Mon-Thu · 22-28 Oct" on a Wednesday night; Make defaults to 2 boxes when the plan says 1.
9. **Search gaps for a Barcelona merienda:** `tortitas de arroz`, `palomitas`, `kefir` and `turron` return nothing. `tortitas` finds protein pancakes. `picos`, `hummus`, `hacendado`, `dátiles` and `galletas maría` work.
10. **Names:** plan and library show "Lunch" / "Merienda" but "Snacks" (00:00 to 05:00). Say "Late snack" or put the plan's ready items in Merienda.

## Nice-to-have

- Add a "Cold / Microwave" tag on the plan's Day rows (the library has it).
- Show Library near the top of Prep when I have no batches (3 screens of scroll now).
- The About guide says "Katori does not recommend particular shops", but the plans say "Mercadona Barcelona + halal butcher (Carne Halal Online)". My butcher is in the Raval and his prices are not the card's.
- A frozen portion with no day keeps nagging on 10 Feb 2027 ("Portion 4 ... is in the freezer with no day planned"), well past its 3-month freezer life.
- In the Ramadan editor the table uses 24-hour times and the pencil editor showed "06:19 AM / 06:23 PM" in my browser.
- Onboarding never says halal is on, or that it is the Barcelona table. A one-line "Halal only is on" on the targets screen would help trust.
- Variety: the Low-cook week has the same tray-bake dinner three nights and the same parfait three mornings. Fine for Sunday-prep life, dull by Wednesday.

## Anything wrong, overclaimed or not matching (my checks)

| Claim in the app | What I found |
|---|---|
| "Make needs no cooking" / "No cooking: buy, open, eat" | Boiled eggs and hot soup are in several "Make" preps and picks (should-fix 4). |
| "10 min, no cooking" on the tuna bocadillo | Boils eggs 10 min + 5 min cooling; the card time is hands-on only (should-fix 3). |
| Low-cook: "desi at dinner" | 1 of 5 dinners is desi, and it needs a karahi I do not have (should-fix 5). |
| Plan cards: "About 1,897 kcal · 133 g protein" and "1,927 / 132" | **True.** I summed each Day (Low-cook 1,873 / 1,909 / 1,842 / 1,980 / 1,882; Budget 1,889 / 1,892 / 1,946 / 2,000 / 1,908). Budget protein is 128 to 141, the card says 127 to 141. These are the Lab's numbers, not mine to test for price. |
| "Under 60 EUR" for the Budget week | The data says 58.97 EUR; I cannot check live Mercadona prices from here. |
| Bolognese "use by tomorrow" | Contradicts the method (sauce keeps 3 days) and the plan note (must-fix 2). |
| Crema eggs "keep 3 days" | Boiled Sunday, eaten Thursday (Cooking item 12). |
| Shopping list vs method counts | Tomato, onion, carrot differ (Cooking item 7). |
| Protein tip text "planned excluded" | Code counts planned (must-fix 6). |

## Halal trust (this week)

- **Trusted:** the Check chip with its reason, the feta swap, the Barcelona guide, the pork search note, Fish only making gambas Check.
- **Still open:** halal foods in the library show a "Halal" label only inside dialogs and batch cards, not on every row. The guide's "Halal means ... fish" and "Fish and eggs from any shop are fine" are plain statements, which I am happy with for my school.

## Top changes, ranked

1. Link every planned meal to the batch it needs (cooking a planned weekday batch should fill its row), and fix the bolognese fridge/freezer booking and its "last day" nag.
2. One shopping list for the whole plan (all 10 batches and the planned snacks), with Copy that says "Copied".
3. Put the plan's merienda and ready picks in Merienda, and make the protein tip count only eaten food.
4. Keep the "Tonight" cards in view after the auto-scroll, and add the "boil the penne" and "make tomorrow's lunch" nudges.
5. In step mode put "Done when" on its step, carry the "Amounts are for N" line, and add timers.
6. Make method counts, time labels and "no cooking" claims match what the steps do.

## Re-check on the fixed build (2026-10-18)

*Snapshot `.../scratchpad/review3c/app` on :8793, Playwright at 400x860, Europe/Madrid, light for the week and dark for a second pass (Day, Prep, shopping, step mode, Week, Profile, Data, welcome: no sideways scroll, no console errors). Same profile as before (woman, 29, 165 cm, 60 kg, Active, weight training, keep weight, Fish only, Spanish names). Clock set per visit; Sunday 18 to Friday 23 Oct. Scripts in `.../scratchpad/rc/`, screenshots (90) in `.../scratchpad/review3-shots/mariam-recheck/` (called `rc/` below). I did not edit app code, data or tests, and I did not commit.*

### Verdict

**Score: 9 / 10** (Review 3: 8.5). All six must-fix items are fixed in the running app. I keep one point back for small things that still do not add up (below), none of them a blocker for a Sunday-to-Friday week.

| # | Must-fix | Verdict | Evidence |
|---|---|---|---|
| 1 | Weekday batch not linked to the planned meal | **FIXED** | Wed 21:00: Prep, Make bocadillo, **Make 1 box = 2 taps** (the dialog now opens on **1 box** and says "Amounts are for 2 boxes. You are making 1 box: use 1/2 of each amount."). The batch card says "Box 1 · Lunch, tomorrow · Use by Fri" and a line "Made 1 box. It is in your plan: Lunch tomorrow." Thu 08:00 Lunch shows **one** "Tuna and egg bocadillo, Planned, Box 1 · use by tomorrow", 666 kcal; no "Plan it" card, no double (`rc/19-thu-0800.png`). I ticked it at 13:30 (1 row, 1 tap). Same for the crema (Dinner, today), the caesar (Fri lunch, "Box 1 · use by tomorrow") and the smoothie (Thu breakfast). |
| 2 | Bolognese booked wrong | **FIXED** | Prep card: Box 1 = Lunch Wed 21, use by Wed (fridge); Boxes 2 to 4 frozen, "Not placed yet" (1 fridge, 3 freezer, as the plan says). Mon 19 Day has **no** "last day, Plan it" card; Mon is burrito, merienda, tray bake and the total is 1,873 kcal, no double dinner (`rc/08-mon-0815.png`). Wed lunch reads "Box 1 · last day". The Tue night card is now the penne card (see 3). |
| 3 | Tuesday-night card hidden, no penne | **FIXED** | Tue 20:30: the Day opens with the amber card on screen at y 323 to 609 of 860 (`rc/12-tue-2030-view.png`). It says "Tonight: For Wednesday's lunch (halal beef bolognese...): boil 80 g wholewheat penne in 2 l of salted water for about 10 minutes, drain it, mix it with one portion of sauce, cool it 20-30 minutes and put the box in the fridge." (matches the method). Wed 20:30: two cards, bocadillo and smoothie for Thursday, both on screen at y 197 to 374 and 298 to 369, each with a "Make it" button that opens the Make dialog. Thu 21:00 has crema, caesar ("Cook it") and smoothie; Fri has chana masala. Dark pass the same (`rc/31-dark-wed-2030.png`). |
| 4 | Week's shopping only the Sunday batches | **FIXED** | One list, "Shopping for the week", in three parts: the 4 Sunday batches, "Your plan's weekday jobs: bocadillo, smoothie (2 jars), caesar, crema, chana masala", and "Ready food your plan puts on the days: yogurt, banana, kinnow, almonds, Burgos, apple, picos, pear". I can find tuna (120 g), tomato, avocado, a bag of 3 rolls, eggs, bananas, kiwi, apple, pear, picos, crema brik, the caesar lettuce and Dijon. Butcher first, packs, "Check you have" block, Copy list (`rc/07-shop-0.png`). 2 taps to open it. |
| 5 | Merienda lands in Snacks | **FIXED** | Mon 17:30: Merienda holds the planned yogurt, banana, kinnow and almonds with "Mark all Merienda eaten" (**1 tap for all 4**, it was 4); Snacks says "Nothing yet" (`rc/10-mon-1730.png`). Same Tue to Fri. |
| 6 | Protein tip silent with a plan on | **FIXED** | Fri 16:45 with the café at 09:00, Low-cook week on: "Protein today: 4.3 g of 96 g", "Some ideas for Merienda" (Skyr, boiled eggs, shami kebab) with Add buttons (`rc/22-tip-plan-1645.png`). Same tip with no plan (`rc/22-tip-noplan-1645.png`). Both show it. |

### The other things you asked me to replay

- **Plan card numbers.** "About 1914 kcal · 131 g protein a day": I summed the five Days (1,873 / 1,909 / 1,842 / 1,980 / 1,968 = 1,914 avg; protein 137 / 135 / 128 / 121 / 132 = 131). **True** (the old card said 1,897 / 133 because the days changed). The Week tab agrees: "Average of 5 planned days 1914 kcal · 131 g". Minutes: Sunday 81 = 25+25+25+6, evenings 85 = 10+13+7+13+20+7+15: **true**. "4 different lunches in 5 days, a desi dinner (Friday)" is true (burrito x2, bolognese, bocadillo, caesar; chana masala Friday): the old "karahi from a freezer I do not have" is gone.
- **Money wording.** "€82.35 at the till · €33.79 of it eaten Mon-Fri, €9.13 goes to the freezer for later weeks": the wording is much better, but **33.79 + 9.13 = 42.92, so about €39 of the €82 is not accounted for on the card**. The code comment says the rest "stays in the cupboard" (the rest of the packs and spices), the screen does not. I would add "the rest, about €39, is packs and staples left over". Budget: 29.39 + 2.24 vs 58.97, same gap.
- **Welcome screen and goal.** The welcome screen only asks the meal names (Spanish names preselected, as before). The **goal** is on the next screen ("What do you want?"): Lose / Keep / Gain, nothing preselected, and if I skip it a calm brown line says "Please choose what you want." The hint "Not sure? Keep my weight is a safe place to start. You can change it any time." is right for a first-timer. 8 taps + 3 typed, same as before.
- **How to make it, tray bake (batch card, 2 taps to step mode).** Step 7 now **contains** the check: "Check: cut the biggest chicken piece. White all through, no pink, juices clear... Pink or hard? Back in the oven for 5 minutes, then check again." So "Done when" no longer has to be found on the Finish screen (it is still there too). Also fixed: oven "220 C with top and bottom heat (calor arriba y abajo), or 200 C if you use the fan (ventilador)"; "sweet paprika (pimentón dulce)"; "1 very large tray or 2 normal trays" with how to split and "swap the shelves"; cut sizes. Hands-on 25 min, "About 1 h 40 min start to finish" (my sum of timers plus chopping is about the same): **honest**. Step 1 (heat the oven, 10 min) comes before the chopping on the Before screen, so I would chop first or at least be told to chop while it heats (small).
- **How to make it, chicken tikka (from the library, no batch).** The card says "35 min hands-on · 5 h 30 min in all. Start the night before, so the chicken marinates at least 4 hours." That is **honest** (M-17 is visible now). Step 1 is "Marinade (the night before, or at least 4 hours ahead)", step 2 "fridge for 4 hours or overnight", the doneness check is on step 10 before cooling, and the Finish screen says 75 C with a thermometer. Library to step mode: 2 taps after about 5,860 px of scrolling (the Library is still far down).
- **Bolognese and bocadillo method counts.** Bolognese: "Open 1 jar (800 g) of crushed tomato", onion 150 g, carrot 2 medium (120 g): they now match the shopping list. The bocadillo step mode now carries "Amounts are for 2 boxes. You are making 1 box: use 1/2 of each amount." on every screen (the step text still says "4 cans", "2 eggs", "2 small pots", so the banner has to be believed, but it is there).
- **Time labels.** Bocadillo "13 min, little cooking · 30 min in all"; crema and chana masala "little cooking"; the picks say "boil the eggs up to 3 days ahead (10 min, then 5 in cold water)". The "no cooking" overclaim is mostly gone.
- **Evening jobs.** All seven appear the right night (Tue penne; Wed bocadillo, smoothie; Thu crema, caesar, smoothie; Fri chana masala), each with minutes, and "Make it" or "Cook it" opens the right recipe with the right box count. The 20-minute caesar "Cook it" Thursday night is the heaviest. I made all the Wed and Thu jobs and every one landed in its planned row.
- **Copy list.** The button turns to "Copied" with a tick for about 3 seconds and the line "Copied. Paste it into your notes or a chat." sits at the bottom of the list (`rc/27-copied-bottom.png`). Should-fix 7 is fixed.

### New or still wrong (not must-fix)

1. **Wed smoothie default is 2 jars; the plan wants 1.** From the Wed "Make it" card the dialog opens on 2 jars ("Amounts are for 1 jar. You are making 2"), because Thursday and Friday both have a smoothie row. The plan makes Friday's on Thursday night. If I take the default, Jar 2 sits "Not placed yet", Thu 08:00 shows "Jar 2 of Banana oat smoothie: today is its last day. Plan it" and Fri says "Jar 2 ... is past its use-by. Best not to eat it. Discard". The bocadillo, crema and caesar defaults are right, the smoothie is not.
2. **Tikka "Before you start" mixes two days.** It lists cutting the chicken (night before) and "leave the rice to soak 20 minutes" on the same screen, before the marinade step. A beginner could soak the rice overnight. Put the rice soak where it is needed (step 6) or label the screen "The night before".
3. **Prep intro still says "Make is mostly putting it together (at most a few minutes, such as boiling eggs)"** but the cards say 13 min hands-on and 30 min in all, and boiling eggs is 10 + 5 minutes.
4. **Step-mode timers are still chips** ("20 min" is not tappable) and chopping steps still carry "No heat", which reads like a warning. Small, but I still have to use my phone's timer.
5. **Still open from before:** "Picos integrales 30 g · 30 g · 114 kcal" on the Day row; "Fill Mon-Thu · 22-28 Oct" on a Wednesday night; batches say "Cooked today" the moment I tap "Use this week" on Sunday morning, before I cook.
6. **Small number mismatch:** the plan card says "10 batches", the shopping list says "9 batches" (smoothie is one recipe made twice). True, but I counted.

### Halal and trust

Nothing new broke in what I opened: the tray bake sheet keeps its halal stock-cube tip, the plan shopping lists keep the halal butcher first, and the Low-cook week showed no Check chip on any Day row. I did not re-test the Budget week, the feta swap or Ramadan this round.

### Final score and what to do next

**9 / 10.** If I had one thing to ask for next: make the Make dialog default match the plan's box count for the smoothie, and add the "rest stays in your cupboard" line to the plan card money row.
