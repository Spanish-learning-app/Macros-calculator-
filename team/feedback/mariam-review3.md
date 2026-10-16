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
