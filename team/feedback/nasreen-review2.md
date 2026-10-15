# Nasreen Akhtar: Review 2 (Sprint 2 build)

*2026-10-15 · 400 px phone, Madrid time, light theme, first-time user. Screenshots and scripts: `team/feedback/screens/nasreen-r2/` (the numbers below are the file prefixes). I did not change any app code.*

## What was easy

- **Setting my chai once.** One box with big buttons: "A little milk / Half milk / Mostly milk / All milk", then "Cow, whole / Buffalo", sugar 0 to 3, and "Small cup 150 ml / Cup 200 ml / Mug 250 ml". The line at the bottom says "One cup: 183 kcal, 5.9 g protein (155 g milk + 2 tsp sugar)." I never typed a number (`31`, `32`). After saving, "My chai (2 tsp sugar)" is the first thing in Recent, and one tap on + logs it (`39`, `41`, `43`).
- **Saved meals.** I made lunch (salan and roti), tapped ⋯, then "Save Lunch as a meal…", gave it a name and tapped "Save meal". A dark box said "Saved "Salan roti"." The next day the add sheet showed "READY TO ADD / Salan roti / Saved meal · 2 foods". One tap on + put both foods in, with "Added Salan roti" and an Undo (`52`, `53`, `55`, `57`). The next day it also says "Planned", which is fair.
- **The pot portion picker.** For my own pot it offers "box 300 g", "whole pot 1200 g", "small katori", "katori", "large katori" and "tablespoon". "Whole pot" is a real button (`24`). The next day my katori is in Recent as "1 katori (about 200 g)". Two actions: Add, then + (`98`).
- **The batch card.** "Chicken salan pot · Cooked today · 4 boxes · 4 of 4 left", then Box 1 to 4. A tap on "Fri 16" with Lunch selected put a box there and said "Added a box to Lunch, tomorrow." (`61`, `62`). The Day view showed "Tick as eaten" and "Box 1 · use by Sun, 18 Oct" (`63`).
- **The ingredient search takes the amount first.** "3 onions" gave "3 medium onion (330 g)". "4 tbsp oil" gave "4 tablespoon (54 g)". "1 kg chicken" gave 1000 g (`12`, `16`).
- **Review 1 fixes I could see.** "Estimate means a good guess from your answers. You can change it." is there. "null" is gone. "naan" no longer gives Banana. "882 kcal over" is calm, with no red. Chawal now has a plate and a half plate (`94`). "Check" opens a plain sentence ("Feta made with rennet (cuajo)… Swap: queso de Burgos 0%…") (`72`).
- There is no sideways scroll on Day, Week, Prep, Profile or Data at 400 px.

## What confused me (exact words)

**Prep tab, with no help (scenario 4)**
- **"Your batches" / "No batches yet. Cook one from your recipes or the library below."** Nobody says what a batch is. I guessed "a lot of food". "boxes" is easier. It is my tiffin, but the page never says that one box is one meal for one person.
- **"Cook once, eat all week: boxes, jars or portions for breakfast, lunch or dinner."** Boxes, jars and portions: are they three things? The cook dialog then says "How many jars" for oats and "How many boxes" for lunch, which helps, but the first page doesn't.
- **"Library" has two buttons, "Cook" and "Make".** I had to open one to find out that Make means no cooking.
- **My chai and Saved meals sit on the Prep tab**, under "Your recipes". I would never look for my chai under "Meal prep". The Saved meals text is also only a sentence: "On the Day view, open a meal's ⋯ menu to save it as a meal."
- **The Fridge / Freezer switches** show a dark "Fridge" on Boxes 1 to 3 and a dark "Freezer" on Box 4. I wasn't sure whether dark means chosen or not (`61`). "Frozen, no use-by yet" is a worry: is it safe to eat?
- **"Keeps 3 days in the fridge, so the first 3 go in the fridge and the rest in the freezer."** Kind, but the app decided this and I didn't ask.

**Cooking the family pot (scenario 1)**
- **A pot is not "boxes".** New recipe says "Boxes or portions it makes 4". I make one pot and the family eats katoris. The picker then opens on "box 300 g", not katori. The recipe row says "1 of 4 boxes: 574 kcal · 50 g protein" (`20`).
- **"Cooked pot (g)": "Weigh the whole pot after cooking (without the pot) for the best numbers. Empty means the ingredients' weight."** I have no scale. I typed 1200 because you told me "about 1.2 kg". Left empty, I would have got 1959 g (the raw weight) and a different katori. "Without the pot" is also confusing.
- **The same word gives different numbers.** My pot's "katori" is 200 g and 382 kcal. The app's own "Chicken salan (home-made)" is 172 g and 213 kcal (`92`, `97`). Both say katori. Nothing says why one is almost double. I'd stop trusting both. The cause is that I typed 4 tbsp of oil, 1 kg of chicken and no water. A home cook adds water, and the screen never asks.
- **My recipe is 7th in the list**, below restaurant salans, when I type "salan" (`23`). My own pot should come first. It also has no "Home-made" or "My recipe" tag.
- **"Thora sa a taste, ¼" shows up while I'm adding raw chicken to a recipe** (`13`). Nobody tastes raw chicken.
- **"1 cup dahi" gives "Nothing found for "cup dahi". Try another spelling."** ("1 cup" is how I would say it.) The portion chips for raw chicken say "4 oz raw". I don't know ounces. Pao (¼ kg) is what I know, and it is hiding as "¼ kg raw".
- Typing "1 kg chicken" puts "Chicken thigh, roasted (no skin)" first and raw thigh further down. A pot of raw chicken counted as roasted would be wrong.
- Ingredient search also offers ready dishes (Chicken karahi, Chicken salan) as ingredients.
- After each ingredient the only sign is a small grey line, "Added 1000 g Chicken thigh, raw (boneless, skinless). 1 added so far." The same line is still how the main add sheet confirms (`56`). The dark toast with Undo on the Day view is better. It only shows after I close the sheet.

**Chai and meal names**
- **"Merienda".** With Madrid time my first Day screen says "Breakfast / café, Lunch, Merienda, Dinner, Snacks" (`02`). I had to go to Profile, then "Pakistani meal times", to get "Nashta" and "Shaam ki chai" (`37`, `38`). Nothing on the first screen tells me this is possible.
- The saved-chai card reads "183 kcal · 5.9 g protein a cup. First in your chai searches." The sentence is broken. I picked "Cup 200 ml" but it logs "1 cup (213 ml)" and "213 g".
- "chai" still puts "Pizza, cheese (pizza chain, regular crust)" 9th (`80-search-chai`).

**Setup and small things**
- **"Which seafood do you eat? All seafood / Fish and prawns / Fish only"** and "Anything else is marked "check". Depends on your school of thought." Fine for me, but I set "Fish only" and nothing I could see changed. "prawns", "shrimp", "jhinga" and "crab" all say "Nothing found" (`77`, `78`). So what does the setting do?
- Still on the form: "Keep my weight" is already selected, and "Active: … shop or ward work … for example the gym 4 days." (`04`).
- "Source and details" still reads "Citation / Method / Confidence Estimate (C) estimate / Checked Wednesday 14 October" (`93`).
- "2 biscuit". "edible part" is still on most katori chips and rows (`92`). The katori pictures are still tiny.
- Saved meal row: "Salan roti · Saved meal · 2 foods" with no kcal.
- The Day view has five "Nothing yet" rows and "Copy yesterday" at the bottom.

## What made me feel stupid or rushed

- Building one pot took 22 actions (see below) and I still wasn't sure the number was right.
- Five ingredient searches, each with "tap +, then a second screen, then Add to recipe". Three taps per onion.
- A pot recipe that talks about weighing and boxes, when I measure by katori and andaza.
- Search "chai" with a pizza in it, and "aadhi roti" and "dairh" with "Nothing found" (`80`).

## My checks

| # | Result | Screenshots | Notes |
|---|--------|-------------|-------|
| Scenario 1: family salan pot, log my katori | **Pass, with a worry** | `09`–`27`, `97`, `98` | The pot, "whole pot" and katori buttons work. Next day is 2 actions. But the default is "box", it asks for a scale weight, and the kcal differs from the library salan (382 vs 213) with no explanation. |
| Scenario 2: Set my chai, log at Shaam ki chai | **Pass** | `31`–`43` | Clear and quick. Meal names need Profile first. |
| Scenario 3: save lunch, add tomorrow | **Pass** | `50`–`57` | 4 actions to save, 3 or 4 to add back. |
| Scenario 4: Prep tab with no help | **Half** | `08`, `60`, `61`, `64`–`67` | "boxes" is understood once I see a card. "batch" is never explained and the first screen doesn't teach it. |
| N4 (tasting, retest) | **Pass** | `80-search-tasting`, `81`–`83` | Typing "tasting", "leftover", "bacha hua" or "thora sa" now says: "A taste or leftovers? Search the food itself (for example daal), open it and tap "Thora sa" for a taste (¼ of a serving), or ½ for a small leftover bowl." In the daal picker "Thora sa" gave "¼ katori = 50 g · 63 kcal". Quick add still wants kcal ("Type the kcal as a number, for example 650"). |
| N5 (big day, retest) | **Pass** | `90`, `91` | "882 kcal over" and "+10 g above target ✓", with no red. Still no kind line. |
| A8 (rice plate, retest) | **Pass** | `94` | "plate, assumed 2 katori" and "½ plate, assumed 1 katori", with plate pictures. |

### Review 1 items I marked hard, retested

| Review 1 problem | Now |
|---|---|
| "null" under search results | **Fixed** (no "null" or "undefined" in any search) |
| "Estimate" unexplained | **Fixed** ("Estimate means a good guess…") |
| "We slowed your weight-loss pace…" | **Fixed** ("Your target keeps weight loss to a safe pace of about 0.4 kg a week.") |
| "Keep my weight" preselected | **Not fixed** |
| "ward work" / "the gym 4 days" | **Not fixed** |
| Katori wording ("edible part"), tiny bowl pictures | **Not fixed**, though plate and cup pictures were added |
| "Source and details" for engineers | **Not fixed** |
| Small grey "Added…" line after + | **Not fixed** in the add sheet (a dark toast with Undo now appears on the Day view and the Prep tab) |
| Tasting / leftovers | **Fixed in part**: the "Thora sa" chip and a help line. Quick add still needs kcal. |
| Pizza for "chai", "aadhi" and "dairh" searches | **Pizza not fixed. "aadhi roti" and "dairh" still "Nothing found".** |
| "Naan" gave Banana | **Fixed** |
| Add food button covers last row | **Fixed** (the Day view scrolls clear) |
| Nothing kind on a big day | **Not fixed** |
| "Eaten so far: 2852 of 1370" and decimals | **Better** (whole numbers when big, "882 kcal over"). Decimals under 10 g remain ("5.8 / 159 g"). |

## Action counts

Counting every tap, typed field and screen change from the Day view. Not counting the screenshots.

| Task | Actions |
|---|---|
| Build "Chicken salan pot" (Prep, New recipe, name, Add ingredients, 5 ingredients × 3 (type, +, Add to recipe), Done, type 1200, Save recipe) | **22** |
| Log my first katori from the pot (Day, Add, type "salan pot", tap row, tap katori, Add to Lunch, Done) | **7** (29 in all) |
| Log the pot the next day, from Recent | **2** |
| Set my chai (Prep, Set my chai, Buffalo, 2 tsp, Cup 200 ml, Save my chai) | **6** |
| Log it at Shaam ki chai (Day, Add, +) | **3** (9 in all) |
| Switch to Pakistani meal names first (Profile, Pakistani meal times, Day) | **3** |
| Log my chai again | **2** |
| Save lunch as a meal (⋯, Save Lunch as a meal…, rename, Save meal) | **4** |
| Add it back tomorrow (next-day arrow, Add, +, Done) | **4** |
| Cook the pot as a batch of 4 boxes (Cook, Cook 4 boxes) | **2** |
| Place one box on a day | **1** |

## Would I keep using it?

**Yes.** My daily use, the part I would do twice a day, is faster than Review 1: my chai is two taps, my lunch is one tap the next day, and "Thora sa" lets me count a taste without a kcal number. Plates and plain words help too. I would stop trusting it if my own pot said 382 kcal per katori and the app's salan said 213. I would also give up on the first day if I had to build the pot with 22 taps, weigh it without a scale, and then see "boxes". The pot is the reason my family would use it. It is the one thing I want to be easy, and it is the least easy. If the pot were one screen ("How many katori does your pot make?") I'd say yes without hesitation.

## Priya's suggested refinements

Section 4 (the design refinements):

| # | Suggestion | Verdict | One line |
|---|---|---|---|
| 1 | Prep screens in the same system as Day | **Helps me** | Prep now looks like the rest of the app, with big Cook buttons and a clear "4 of 4 left". |
| 2 | Macro strip: carbs, fat, fibre bars under the big number | **Doesn't matter** | I only watch "kcal left". The bars are in the grey panel now, and "g left" would be a second number to read. |
| 3 | Icons plus labels in the tab bar | **Helps me** | The tab bar is just words now. A katori, a calendar and a box would help me find Prep, as long as the words stay. |
| 4 | One add entry point: drop the floating "Add food", add a "Search foods" field | **Helps me** | I use the slot "Add" buttons and never touch the big one. Two ways to do one thing makes me wonder which is right. A search box at the top is how I use WhatsApp. |
| 5 | Shorter names; chips read "katori / 160 g", with "edible part" moved into details | **Helps me** | This is my top change. "katori, edible part" and "1 katori (medium, 200 ml), edible part" still say different things. |
| 6 | A tick on the row after +, bars that animate | **Helps me** | I still only get a small grey line in the sheet. A green tick on the row would tell me it worked. |
| 7 | Tabular numbers, darker faint text | **Doesn't matter** (numbers), **helps me** (darker text) | I don't notice the number alignment, but the pale grey lines under foods are hard to read in sun. |
| 8 | A friendly empty day card ("Nothing logged yet. Copy yesterday / Copy a day / Search") | **Helps me** | Five rows saying "Nothing yet" feel empty. One card with "Copy yesterday" on top is where I'd go. |
| 9 | A small katori mark and one warm illustration | **Doesn't matter** | Pleasant, but it doesn't change what I do. It would not confuse me. |

Section 5 (the Prep screens):

| # | Suggestion | Verdict | One line |
|---|---|---|---|
| 1 | Halal chip on the batch card and cook dialog | **Doesn't matter** | It is there now and I'm halal anyway. The "Check" chip with its plain sentence is the useful part. |
| 2 | Shorter box rows: "Lunch · Mon 19 Oct" / "Eat by…" | **Helps me** | Box rows are two lines now, and it takes a scroll to see all four. One line each would fit. |
| 3 | Calm, consistent date words | **Doesn't matter** | "Lunch, tomorrow" reads fine. I just want the same style everywhere. |
| 4 | "Fill Mon–Thu" on one line | **Helps me** | It is one line at 400 px already: "Fill Mon–Thu · 19–22 Oct". I like it. |
| 5 | "Cooked on: Today, Sun 18 Oct" with a "Change" link | **Would confuse me** | I like the three buttons I have now ("Yesterday / Today / Tomorrow"). A link that opens a date field is one more tap and a US-style date. |
| 6 | Meal chips instead of the drop-down | **Helps me** | Already done in the batch card ("Nashta / Lunch / Shaam ki chai…"). I tapped it and it was easy. The add sheet still has a drop-down "Meal". |

## Top 5 changes, ranked

1. **Make the family pot one simple screen.** Ask "How many katori does your pot make?" instead of "Cooked pot (g)" and boxes. Open the picker on katori, not "box". Ask "did you add water?". Say why my 200 g katori (382 kcal) differs from the library salan (172 g, 213 kcal), or use one katori size. Put my own recipes first in search, with a "My recipe" tag.
2. **Teach "batch" and "boxes" in one plain line on the Prep tab**, for example "A batch is food you cook once and split into boxes. Each box is one meal." Explain "Cook" and "Make" (or use one word), and move "My chai" and "Saved meals" out of "Meal prep" or give each its own heading in the Day menu.
3. **First screen in my words.** Offer Pakistani meal names when someone sets up (not "Merienda"). Fix the form: preselect nothing or "Lose weight", and replace "ward work" and "the gym 4 days" with "housework, no exercise". Make "Source and details" readable ("Where this number comes from: a home recipe, so it's a guess").
4. **Confirm every add clearly.** Show a green "Added" with a tick on the row, and keep the "Added…" toast with Undo. Don't leave a small grey line in the sheet. Also show kcal on a saved meal row ("Salan roti · 312 kcal").
5. **Clean the search, and make seafood do something.** No pizza for "chai". Let "aadhi", "dairh", "1 cup dahi", "pao" and "jhinga/prawns" work, or say what is missing. Show the seafood setting working (or hide it until there are prawns). Drop "edible part" and "oz" from my chips. Make the katori drawings bigger. Say "2 biscuits", and add one kind line on a big day ("Shaadi day. Tomorrow starts fresh.").
