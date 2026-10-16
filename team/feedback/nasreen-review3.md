# Nasreen Akhtar: Review 3 (cooking as a beginner, "How to make it")

*2026-10-16 · fixed snapshot of the app on port 8791 · 400 × 860 phone, Madrid time, light and dark · I tapped and typed everything; I did not change any app code, tests or git.
Screenshots: `/tmp/claude-0/-home-user-Macros-calculator-/8f52dea3-769e-51a2-93b3-61c066c71d94/scratchpad/review3-shots/nasreen/` (file names in brackets below).
My test scripts are in `.../scratchpad/n3/`.*

## Score: 7 / 10

Review 1 and Review 2 had no number, so for comparison: I would have said about 6/10 for Review 2 ("yes, but the pot is hard"). The cooking pages are the best new thing I have seen in this app. I could cook from them. They are not yet safe or clear enough for a first-time cook in five places (below). Building my own pot got easier (17 taps with a method, against 22 without one in Review 2).

## What works

**Pakistani meal names at the start**
- The first screen now asks "What do you call your meals?" with two big cards. I tapped "Pakistani names" and everything followed: "Nashta · Lunch · Shaam ki chai · Dinner · Snacks" on Day, "Add to Nashta" in the add sheet, "Put a portion in: Nashta / Lunch / Shaam ki chai…" in Prep, and the library groups "NASHTA (14)", "LUNCH", "DINNER" (`01-welcome`, `03-chose-pakistani`, `05-day`).
- The picker shows my words: "roti, small / medium / large" with the Urdu script under it (روٹی, چھوٹی روٹی), "Thora sa · a taste, ¼", ½, 1, 1½, 2. "chawal", "daal" and "anda" find the right food (`71-roti-picker`). That was a Review 2 complaint ("Merienda") and it is fixed.
- The activity text no longer says "ward work" or "the gym 4 days". It now reads "…busy housework with children or work in a shop, even with no exercise". Fixed.

**"How to make it" (4 recipes read in full, every step)**
- The order is the one a person cooks in: Equipment, Before you start (cut sizes: "4 cm pieces", "5 mm", "thin matchsticks"), Steps, Done when, Box it up, Reheat, Tips. Each step is one action with a heat chip ("Medium heat", "High heat", "Oven 220 °C") and a time chip ("7 min") (`karahi-scroll-01`…`05`).
- The cues are in my words and checkable: "stir until the raw smell goes", "until golden", "the oil shows at the edges ("bhunna")", "like an earlobe" for dough, "no pink left". The tips are kind and practical: "Ask the butcher for 'carne picada magra de ternera'", "Too spicy? Pick out the slit chillies", "Add 2 tbsp water, scrape the bottom" if it sticks.
- The roti dough method is doable. It gives 235 g atta "about 2 cups", water "a little at a time, with your fingers", "slightly sticky ball", "knead 5 minutes: push away with the heel of your hand, fold, turn", "rest 20 minutes", "8 balls of about 50 g (golf-ball size)", "bubbles show, flip" and "stack in a clean tea towel so they stay soft". I could do it. (Problems are in the must-fix list.)
- Safety lines are there and plain: "put away within 1 hour", "Reheat once only", "steaming hot all through", "Wash your hands" after the raw chicken, "use oven gloves".
- Box up and Reheat both give minutes and the freezer step ("Move a frozen portion to the fridge the night before").

**Step by step mode (karahi, 17 steps, light and dark)**
- One step per screen, "Step 5 of 17" with a progress bar, text 22 px, the amounts inside the step ("1⅓ tsp salt (8 g), 2 tsp red chilli powder…"), the heat and time chips under it. Next is a wide button (237 × 44 px), Back is 119 × 44 px. I tapped Next and Back 20 times with no mistakes (`karahi-step-05`, `karahi-step-15`, `keema-dark-step-05`). The text is big enough to read from an arm's length with floury hands. Dark mode is just as readable.
- It starts with "Before you start" (cut list and equipment) and ends with a "Finish" screen (Done when, Box it up, Reheat). Back goes back one step. "Done" closes it.

**My own pot**
- "It makes: Boxes / 1 dish / Family pot". After tapping "Family pot" it asks "How many katori does your pot make? Count the katori (200 ml bowls) the pot fills, with its water and gravy. No scale needed." That is exactly what I asked for in Review 2. I typed 8 and the recipe row says "1 katori (pot of 8): 271 kcal · 24 g protein" (`42-family-pot-mode`, `52-recipe-filled`, `54-after-save`).
- In the Boxes mode the wording is clear: "One box is one meal for one person." and "Weight after cooking (g)… Only if you have a kitchen scale: weigh the cooked food, not the pan. No scale? Leave it empty and we use the weight of what you put in." (`40-new-recipe-top`).
- Ingredients now take 2 taps each (type, then +), and a tinted box confirms "Added 100 g raw Chicken thigh… 1 added so far." "1 kg chicken thigh" gives 1000 g, "3 onions" gives "3 medium onions (330 g)", "4 tbsp oil" gives "4 tablespoons (54 g)".
- My method: I typed 5 lines, some with "1." and "-" in front. They became 5 clean steps with no numbers or dashes, shown under "My method" on the recipe, in the Cook dialog, and in Step by step with the same big text (`61-my-method-light`, `62-my-step-light-2`). I did not have to learn anything.

**Weekly shopping list**
- Three groups: "Halal butcher", "Supermarket", "Check you have". Pack words: "1 × 800 g jar", "1 pack of 6 × 125 g pots", "1 × 1 kg bag", "4 thumb-size pieces" of ginger, "12 medium mushrooms". A line "Pakistani or Moroccan grocery (next to the halal butcher): Coriander seed, Garam masala". "Copy list" works (`31-week-shopping-top`, `34-desi-shopping`).

## Must-fix (a beginner goes wrong, loses trust, or it is a food-safety risk)

**1. The word "null" is printed in the recipe ingredient picker.**
- Steps: Prep, New recipe, Add ingredients, type "chicken thigh", tap the row's name (not the +).
- Expected: the "How much" chips (½, 1, 1½, 2), nothing else. In the Day add sheet the first chip is "Thora sa · a taste, ¼".
- Actual: "How much / null", then ½ 1 1½ 2 wrapped on two lines. It also appears when I type "1 kg chicken thigh" and open the row. It is the same word that made Review 1 feel broken. (`47-chicken-thigh`, `44-after-plus`)

**2. I can choose "Cook 5 portions" but the recipe still says 4.**
- Steps: Prep, Library, Chicken karahi with 2 wholemeal roti, Cook, tap "One more portion" (it says 5, the button says "Cook 5 portions"), then open How to make it.
- Expected: amounts for 5, or a clear line "These amounts are for 4. For 5, multiply everything by 1¼" (or the plus button is not offered).
- Actual: "Amounts are for 4 portions", "Cut the chicken breast (640 g)", "Pack 4 portions: ¼ of the curry…". Meanwhile the Shopping list for the same 5 portions says "Chicken breast: 800 g", "Wholemeal flour: 294 g". So I buy for 5 and cook for 4. I cook for five people, so this is the first thing I'd hit. The weekly plan has the same problem: "Chicken burrito bowl × 2 · half the 4-box recipe", so I must halve each amount in my head. (`23-cook-dialog-5`, `24-cook-dialog-5-method`, `37-batch-shopping-5`)

**3. The fridge and freezer answer is different on three screens, and "Done when" comes after the food is packed.**
- Karahi: the Cook dialog says "Keeps 2 days in the fridge, so the first 2 go in the fridge and the rest in the freezer" (`22-cook-dialog`). The method says "Portion 1 in the fridge (eat within 2 days)… Portions 2–4 in the freezer".
- Bolognese: the method says "Sauce: 2 portions in the fridge (3 days), 2 in the freezer". The Cook dialog says "Keeps 1 day in the fridge, so box 1 goes in the fridge and the rest in the freezer". The weekly plan says "1 portion in the fridge for Wednesday, 3 in the freezer".
- Keema and bolognese method text say "Box 1 in the fridge" but not how many days; only the dialog does.
- Expected: one answer, with a day limit, in every place.
- Also "Done when" (the "biggest piece is white all through, no pink" check) comes after step 17 "Pack 4 portions" in karahi, and after the last step in keema and bolognese. I would have bagged raw-centred chicken first. The tray bake does it right: step 6 says 'Check the biggest chicken piece (see "Done when")'. The same line is needed in the other three.

**4. Roti order and timing leave the curry out too long, and the roti are bagged warm.**
- Step 8 of the karahi says "Spread on the tray to cool while you make the roti". Then the roti steps add up to 3 + 5 + 20 + 2 + 12 = 42 minutes by the chips, and the "12 minutes for 8 roti" assumes 1½ minutes each. I am slower than that on a first try, because rolling thin is the hard part. The Box it up step says "put away within 1 hour". So the curry will be at or over an hour.
- Expected: make the dough first (so it rests while the curry cooks), or say "if the roti is taking long, put the curry in the fridge now".
- Step 16 says "Stack the cooked roti in a tea towel so they stay soft while they cool" and step 17 says "2 roti in a small bag". Nothing says "let them cool fully first". Warm roti in a bag go wet.
- Step 15 is one step with six actions (flip at bubbles, cook 30–40 s, press edges with a cloth, flip again for 10 s, roll the next one, count). With messy hands in step mode that is one screen for twelve minutes. Split it: first side, second side, puff, next roti.
- (`karahi-scroll-03`, `karahi-step-15`)

**5. The shopping list does not match the recipes and does not cover "the week".**
- Bolognese method: "Open 1½ tins of crushed tomato (800 g)". List: "Crushed tomato: 1 × 800 g jar (uses 800 g)". I buy a jar and the recipe tells me to open tins.
- Karahi and keema method say "ground coriander (dhania powder)" and "ground cumin" (karahi) and "zeera (whole cumin seeds)" (keema). The list says "Coriander seed: 8 g" and "Cumin: 5 g", with "Coriander seed" in the desi-grocery line. A beginner buys whole seeds and cannot make a powder. (`34-desi-shopping`)
- The title is "Shopping for the week". The low-cook plan has 10 batches and I used "Use this week", but the list says "For tray bake, burrito bowl, bolognese, parfait" only. Wednesday and Thursday jobs (tuna bocadillo, smoothie jars, chicken caesar, vegetable crema) are not in it. I would shop on Saturday and run out on Wednesday. (`30-use-week-1`, `35-what-you-make`, `31-week-shopping-top`)
- "Wholemeal flour (atta)" is under "Supermarket", but the method's own tip says atta comes from the Pakistani grocery. The grocery line only names chillies, coriander seed and garam masala, and "Green chillies" are on both lists.

## Should-fix

1. **Amounts for a cook with no scale.** The keema lists "Kitchen scale" as equipment. Penne "80 g for each box", frozen peas "400 g", "165 ml water" (roti), "⅔ tsp haldi" and "1⅓ tsp salt" (no spoon set has ⅓) have no cup, handful or "about" next to them. Atta ("about 2 cups"), basmati ("about 1⅓ cups"), yogurt ("½ cup") and the golf-ball dough are good, so the writers know how to do it. "A scant tbsp" is a word I had to think about.
2. **The time on each recipe row is not the time it takes.** Row says 20 min for the tray bake, but the step chips add up to 75 (oven 10, roast 20 + 20, cool 25). Karahi: row 60, chips 78. Keema: row 45, chips 100. Bolognese: row 30, chips about 80 for the sauce, plus 40 for the pasta night. If the row means hands-on time, say "20 min hands-on". As it is, I would plan the wrong evening.
3. **Tray bake.** "1 very large oven tray or 2 normal trays", but the steps only say "the tray". With two I don't know how to split or which shelf. It does not say fan oven or top-and-bottom heat, and "(75 °C)" needs a thermometer that is not in the equipment list. "Eat Monday to Wednesday" assumes I cook on Sunday.
4. **Small inconsistencies inside the methods.** Bolognese equipment says "large pot for 3 l of water", the step says "boil 2 l". The keema step 12 starts "Rice: drain it." (which rice? it was soaked eight steps back). Step 13 (rice) shows "Low heat · 15 min", but 5 of those minutes are "turn off the heat, rest". The weekly plan says the penne takes 8 min, the recipe says "about 10".
5. **Step mode.**
   - The small × in the top corner closes it, and tapping "Step by step" again goes back to "Before you start", not to step 9. With floury hands that is a bad tap.
   - The "10 min" and "20 min" chips are not timers.
   - The Finish screen has three headings (Done when, Box it up, Reheat) in one long scroll, so I have to scroll with messy hands at the very end.
   - The "Before you start" screen shows the equipment in small 16 px type, cut off at the bottom of the screen.
   - The code asks the phone to stay awake, but I could not check that in the test browser.
6. **"Merienda" is still in Prep with Pakistani names on.** "ready food for the merienda" (plan card) and three snack notes. It is small, but I chose Pakistani names on the first screen.
7. **My pot, Cook dialog.** After I save a pot of 8 katori and tap Cook, it says "How many boxes: 1 / 1 box: 271 kcal · 200 g per box". A box here is a katori. Put "How many katori" there too, or default to 8. The "1 dish" chip in the editor is never explained.
8. **Ingredient search for my own pot.** "2 tsp salt" put "Butter (salted)" in my recipe (toast: "Added 1 pat Butter (salted)"). "namak" gave Mutton karahi, "haldi" gave Chicken karahi (restaurant), "lal mirch" gave red bell pepper, "pani" gave persimmon. "garam masala", "zeera", "ginger garlic paste" and "1 glass pani" say "Nothing found" (the library recipes do list garam masala and cumin, so the record exists). Spices are almost no kcal, so a plain "spices: not counted" note would be enough, but a persimmon for "pani" looks silly. The toast reads "Added 3 medium onion Onion." (the word twice).
9. **Shopping list.** No tick boxes while I walk in the shop, and amounts I can't buy: "Walnuts: 24 g", "Lettuce: 60 g", "Red chilli powder: 1 g", "Garlic: 7 cloves" (I buy a head). The "What you need" list in the method is grams only (karahi: "Onion · 120 g", the step says "1 small onion", the shopping list says "2 medium onions").
10. **Still not fixed from Review 2:** "Keep my weight" is still the preselected goal on the first form.

## Nice-to-have

- A "scale it" box on the recipe ("Cooking for 5? Use ×1¼") instead of fixed amounts for 4.
- A small "set a timer" button on the time chips.
- Taller Next and Back buttons (about 56 px) and a bigger ×-safe gap for messy hands.
- A short picture or a one-line "what it looks like" for the three hard moments: the karahi "bhunna", the roti puffing, "like an earlobe".
- Put the roti dough steps first in the karahi dinner, since I make dough first at home.
- A check line after the last step: "Before you pack: cut the biggest piece, no pink?".
- Say "Ask for…" in Urdu or Spanish on the butcher line so I can read it to the man. (The butcher tip "carne picada magra de ternera" is already a good start.)

## Step-by-step: exact unclear steps

| Recipe | Step | What I would need |
|---|---|---|
| Chicken karahi + roti | Before you start | "Chop 1 small onion fine (120 g, 5 mm)": a count is there, good. Nothing on how many people this feeds. Amounts are for 4. |
| Chicken karahi + roti | 5 | "cook until the tomatoes collapse": what does collapse look like? Say "soft, falling apart, juicy". |
| Chicken karahi + roti | 8 → 9 | Start the dough before the curry, or say what to do if the roti takes more than an hour. |
| Chicken karahi + roti | 9 | "165 ml water" with no jug: a cup measure ("a little under ¾ cup"). |
| Chicken karahi + roti | 14 | "about 16 cm across (2 mm thick)": I have no ruler. A "side-plate size" or "saucer" would help. |
| Chicken karahi + roti | 15 | Six actions in one step; "1½ minutes each" is for a practised cook. |
| Chicken karahi + roti | 16 → 17 | "Let the roti cool fully before bagging." Missing. |
| Chicken karahi + roti | After 17 | "Done when" arrives after packing. |
| Keema matar with rice | Equipment | "Kitchen scale": I don't have one. Which amounts need it? |
| Keema matar with rice | 5 | "mince (600 g)": the butcher can weigh it, say so. |
| Keema matar with rice | 10 | "frozen peas (400 g)": how many bags or cups? |
| Keema matar with rice | 12 | "Rice: drain it." Say "Drain the soaked rice". |
| Keema matar with rice | 13 | Chip says "Low heat 15 min", text says 10 min low, 5 min off the heat. |
| Keema matar with rice | Box it up | "Box 1 in the fridge": for how many days? |
| Beef bolognese with penne | Before you start | "Open 1½ tins of crushed tomato (800 g)" against the list's "1 × 800 g jar". |
| Beef bolognese with penne | Step 1 | "scant 1 tbsp olive oil (12 g)": say "a little under 1 tablespoon". |
| Beef bolognese with penne | Last 2 steps | "80 g wholewheat penne for each box": a cup or handful. "Large pot for 3 l" vs "boil 2 l". |
| Beef bolognese with penne | Box it up | "2 portions in the fridge" against the Cook dialog's "box 1 fridge, rest freezer". |
| Chicken, potato, pepper and chickpea tray bake | Equipment / step 3 | "2 normal trays": how to split, which shelf, fan or not. |
| Chicken, potato, pepper and chickpea tray bake | Done when | "(75 °C)": I have no thermometer. The knife-and-colour cues are enough, so drop it or add the thermometer. |
| Chicken, potato, pepper and chickpea tray bake | Box it up | "eat Monday to Wednesday": only true if I cook on Sunday. |
| Ammi's chicken salan pot (my own) | n/a | Works as typed. Ingredients: no way to add haldi, zeera, garam masala, pani. |

## My checks

| # | Result | Notes |
|---|--------|-------|
| 1. Pakistani meal names at the start | **Pass** | Chosen on the first screen; Nashta, Shaam ki chai, Urdu script and "Thora sa" appear. "Merienda" still in 3 sentences on Prep. |
| 2. Four recipes read as a beginner (karahi + roti, keema matar + rice, beef bolognese penne, chicken tray bake) | **Pass with must-fixes 2–4** | Good order, chips and cues. Scaling, done-when timing, fridge conflicts, roti timing. |
| 2. Step-by-step mode (karahi, Next/Back all 17) | **Pass** | 22 px text, 237 × 44 px Next. Accidental × loses my place. |
| 3. My own pot with "My method" | **Pass with must-fix 1** | 17 taps. "null" in the ingredient picker; spices and "salt" are a mess. |
| 4. Weekly shopping list at Mercadona / butcher / desi shop | **Half** | Butcher and packs good; list does not match the recipe (tins, seeds), covers 4 of 10 batches, no desi shop section beyond one line. |
| 5. Confusing, wrong, overclaimed | See must-fix 1–5 and should-fix 2, 8. | |

## Top 5, ranked

1. **Scale the method to the number of portions I picked (or say clearly it is for 4).** Now "Cook 5 portions" with "640 g chicken" is a wrong dinner.
2. **One fridge and freezer answer everywhere, with days, and "Done when" before packing.** Karahi 1 vs 2, bolognese 2 vs 1.
3. **Fix the roti order and cooling lines.** Dough first; "cool fully before bagging"; split step 15.
4. **Make the shopping list match the recipe and the whole week.** Tins vs jar, ground vs whole spice, atta at the desi shop, the Wednesday–Friday jobs.
5. **Remove "null" from the recipe ingredient picker, and make the ingredient search for my pot sensible** (no butter for salt, no persimmon for pani).
