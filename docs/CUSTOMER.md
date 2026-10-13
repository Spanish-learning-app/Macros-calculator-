# Katori: customer spec

This file has the user stories, acceptance tests A1–A20 and the test days D0–D5. Kenji scripts the
tests from it, and Priya, Hamza, Zainab, Javier, Yusuf, Nasreen and Mariam work from it too.

**Owner:** Bilal Ahmed (Customer Lead). **Version:** 2, 2026-10-13, Sprint 1. **Based on:** minutes
001 and 002, my memos, and Lena's and Ayesha's memos.

**Ground rules**
- **The Customer Panel supplies no measurements** (minutes, decision 10). Every gram weight in Katori
  comes from the Lab. Portions here are the words a user says. Recipe amounts in D4, A10 and A16 are
  what a user would type into the app. They are not nutrition data.
- If this file disagrees with `docs/NUTRITION.md` or `docs/ARCHITECTURE.md` on a number or a field
  name, those files win. Tell me and I will fix this one.
- "Sprint" means where the minutes put a feature: minutes 001 (decisions 3 and 4) as re-planned by
  minutes 002 (decision 9).

---

## 1. Coverage list (the Lab must ship every food here)

These are all the distinct foods in test days D0–D5, plus the few that A2, A3 and A19 search for.
The "I'd type" columns list my search words: every word in them should find that food (A2, A3, A14,
A19).

| # | Food | I'd type | Used in |
|---|------|----------|---------|
| 1 | Roti, home tawa, whole-wheat (S/M/L) | roti, chapati, chapatti, phulka | D0 D1 D3 D4 |
| 2 | Tandoori roti | tandoori roti, tandoori | A2 |
| 3 | Naan, plain | naan, nan | D2, A2 |
| 4 | Roghni naan | roghni naan, roghni | D2 |
| 5 | Anda paratha, home | anda paratha, egg paratha | D0 D2 |
| 6 | Paratha, plain, home | paratha, parontha | D3 |
| 7 | Daal chawal, home plate | daal chawal, dal chawal | D0 |
| 8 | Rice, plain boiled | chawal, chaawal, rice | D0 fallback, D5, A3, A8 |
| 9 | Masoor daal, home | masoor, daal, dal, dhal, دال | D0 fallback, D5, A3 |
| 10 | Daal mash (urad), home | daal mash, mash ki daal, urad | D1, A8 |
| 11 | Chicken salan, home | chicken salan, murgh salan, chicken curry | D1 D3 D5 |
| 12 | Aloo gobi, home | aloo gobi, gobi aloo | D1 |
| 13 | Chicken karahi, home | karahi, chicken karahi, karhai | D0, A9 |
| 14 | Chicken karahi, restaurant (and dhaba, if the Lab makes one) | same as #13 | D2, A9 |
| 15 | Omelette, desi (pyaz, tamatar, hari mirch) | omelette, omlet, anda | D1 |
| 16 | Egg, fried | fried egg, anda fry, anday | D3 |
| 17 | Egg, boiled | boiled egg, ubla anda | D4 |
| 18 | Dahi, plain full-fat | dahi, dahee, yogurt | D1 D2 D3 |
| 19 | Raita | raita | D2 |
| 20 | Milk, full-cream | doodh, milk, leche, llet | D3, A20 |
| 21 | Doodh patti chai, home, with **1 tsp** and **2 tsp** sugar | chai, doodh patti, tea | 1 tsp: D0 D5; 2 tsp: D1–D4 |
| 22 | Dhaba chai, extra sugar | dhaba chai | D2 |
| 23 | Rooh Afza with water | rooh afza, sharbat | D3 |
| 24 | Cola, regular, 345 ml bottle | cold drink, coke, pepsi, cola | D2 |
| 25 | Rusk | rusk, rusks, papay | D1 |
| 26 | Tea biscuit, Marie type | biscuit, biscuits, marie, galletas maria | D0 D4 D5 |
| 27 | Samosa, aloo | samosa, samosay | D2 D3 |
| 28 | Pakora, mixed veg (besan) | pakora, pakoray, pakoda | D3 |
| 29 | Kulfi | kulfi | D2 |
| 30 | Fruit chaat | fruit chaat | D3 |
| 31 | Apple | seb, apple, manzana, poma | D1 D5 |
| 32 | Banana | kela, banana, plátano, plàtan | D1 D5, A20 |
| 33 | Dates | khajoor, khajur, dates | D3 |
| 34 | Salad, kachumber (kheera, tamatar, pyaz) | salad, kachumber | D1 D4 D5 |
| 35 | Whey protein powder | whey, protein shake | D1 D3 |
| 36 | Olive oil | olive oil, zaitoon, aceite, oli d'oliva | D4 |
| 37 | Pan con tomate | pan con tomate, pa amb tomàquet, tomato bread | D4, A19 |
| 38 | Lentejas (Spanish lentil stew, no pork) | lentejas, lentils | D4, A3 |
| 39 | Tortilla de patatas | tortilla, tortilla de patatas, truita de patates, spanish omelette | D4, A3 |

**Barcelona café and meal-prep foods (Sprint 1; minutes 002, decisions 3 and 8).** Each must be found
by any of its three names, with or without accents. "Halal I expect" is my guess as a customer; the
Lab sets the real status and reason.

| # | Food | Catalan | Spanish | English | Halal I expect | Used in |
|---|------|---------|---------|---------|----------------|---------|
| 40 | Café con leche | cafè amb llet | café con leche | coffee with milk, latte | halal | D5, A19 |
| 41 | Cortado | tallat | cortado | cortado | halal | D5, A19 |
| 42 | Croissant, bakery | croissant | cruasán, croissant | croissant | check (may use lard) | D5, A19 |
| 43 | Napolitana de chocolate | napolitana de xocolata | napolitana de chocolate | chocolate croissant, pain au chocolat | check | A19 |
| 44 | Fresh orange juice | suc de taronja | zumo de naranja | orange juice | halal | A19 |
| 45 | Tortilla sandwich | entrepà de truita | bocadillo de tortilla | tortilla sandwich | halal | A19 |
| 46 | Ensaïmada | ensaïmada | ensaimada | ensaimada | not-halal (made with lard) | A19 |
| 47 | Toast with olive oil | torrada amb oli | tostada con aceite | toast with olive oil | halal | A19 |
| 48 | Skyr, plain | skyr | skyr, yogur proteico | skyr, protein yogurt | halal | D5 |
| 49 | Chicken tikka rice bowl, lunch box ("1 box" serving in `foods-mealprep.js`) | — | — | tikka bowl, chicken tikka rice bowl | halal (halal butcher meat) | D5, A16 |

**Sprint 2 recipe ingredients (A10):** raw egg, raw potato, raw onion, olive oil (#36), dry brown
lentils, carrot and halal beef sausage.

**Servings I need (the Lab decides the grams):**
- omelette: per egg
- restaurant karahi: "½ kg handi (whole dish)", so I can log my share
- tortilla: "whole tortilla" and a slice
- cola: 345 ml bottle
- roti: S/M/L
- everything else: katori, plate, piece, cup or glass, whichever fits

**Search must win these:**
- "tortilla" and "truita" put #39 first, above any Mexican wheat tortilla or trout ("truita" also
  means trout in Catalan).
- "chai" puts the home doodh patti first.
- "croissant" puts #42 above #43.

---

## 2. Conventions for the tests

- **Action:** one tap or click, one field filled (any amount of typing), or one key press. Scrolling
  is not an action. Scripts count actions; I count seconds.
- **Script run:** Kenji's Playwright suite on all four projects (phone, phone-dark, small at 360 px,
  desktop), unless a test says otherwise.
- **Person run:** me on the phone project, first attempt, no practice. I time from my first tap to
  the last entry showing.
- **Clock:** **Europe/Madrid is the primary clock for every test** (minutes 002, decision 1). Every
  time in this file is Madrid wall-clock time, and tests set it wherever a slot or date depends on it.
  - Asia/Karachi and America/Los_Angeles are extra checks: Kenji also runs A4, A5(b), A7, A12, A13,
    A19 and A20 in both.
  - A20 covers the 25 October 2026 clock change.
- **Starting states:**
  - *Fresh*: empty storage, first launch.
  - *Set up*: onboarding done with P1.
  - *Warm*: set up, with D1 logged the day before, so recents exist.
- **P1 (me):** male, 31, 178 cm, 82 kg, Moderate, lifts weights, losing at the default rate
  (0.5 kg/week), no health flags.
- **Slots and presets:** tests address slots by id; labels come from `RULES`.
  - The **Spanish preset** is the default on Madrid time (minutes 002, decision 2):

    | Slot id | Label | Hours |
    |---------|-------|-------|
    | `breakfast` | Breakfast / café | 05:00–12:30 |
    | `lunch` | Lunch box | 12:30–16:30 |
    | `evening` | Merienda / chai | 16:30–20:00 |
    | `dinner` | Dinner | 20:00–01:00 |
    | `snacks` | Snacks | 01:00–05:00 |

  - The **Pakistani preset** uses the same ids with the labels Nashta, Lunch, Shaam ki chai, Dinner
    and Snacks (hours in `docs/NUTRITION.md` §4.5).
  - D0, D5, A19 and A20 run on the Spanish preset, which is the Boss's real setting. D1–D4 are my
    Lahore days and run on the Pakistani preset, switched during setup (not counted in any budget).
  - Ramadan mode (Sehri, Iftar, Dinner, After-taraweeh) is Sprint 3.
- **Halal** (minutes 002, decisions 4 and 5): every food has a status (`halal`, `check` or
  `not-halal`) and a reason unless it is `halal`.
  - **"Halal only" is on by default** in every starting state, and every test runs with it on unless
    the test says otherwise.
  - A food row shows a halal chip only when the status is `check` or `not-halal`. The reason is at
    most 1 action away.
  - "Halal only" hides `not-halal` foods, never `check` ones.
  - A search whose only match is hidden must say so: one line naming the hidden food and its reason,
    with a 1-action way to show it. An empty list is a fail.
  - `not-halal` foods never appear in suggestions, templates or recipe ingredient pickers.
  - Katori ships no pork meat products.
- **"Script portion"** in the day tables means serving × quantity, using the Lab's serving for that
  food.

---

## 3. User stories

Personas:
- **Boss**: owner, lives in Barcelona, eats Pakistani, Spanish and café food, starting a PhD.
- **Bilal**: lifter, cutting, 7 years of tracking.
- **Nasreen**: beginner home cook, ~1,600 kcal, no scale, thinks in Urdu words.
- **Mariam**: halal-eating PhD student in Barcelona, meal-preps on Sundays, gym 3x a week, keeping
  her weight steady.

| ID | Sprint | As… | I want… | So that… | Tests |
|----|--------|-----|---------|----------|-------|
| US-01 | 1 | Nasreen | targets from a short profile on first open, with no account (Skip uses defaults) | I start in under a minute | A1 |
| US-02 | 1 | Boss | search to find foods by the names I use: Roman Urdu spellings and plurals, English, Urdu script, Spanish | I never scroll 40 junk entries | A2 A3 |
| US-03 | 1 | Nasreen | portions in roti, katori, plate, cup, glass, piece and chamach, with the grams always shown | I log without a scale | A8 |
| US-04 | 1 | Bilal | fractions: half a plate, 1.5 katori, a third of a handi | my real portion fits | A8 |
| US-05 | 1 | Boss | to log a normal Pakistani day in under a minute | logging doesn't become a chore | A4 A5 |
| US-06 | 1 | Bilal | recent foods with a one-tap "+" at my last portion | each of my 3–4 chais takes two taps | A6 |
| US-07 | 1 | Bilal | to copy a whole day ("copy yesterday") or one slot | a repeat weekday takes seconds | A5 A12 |
| US-08 | 1 | Bilal | protein left and kcal left always on screen | at 6 pm I know what dinner must do | A7 |
| US-09 | 1 | Boss | a home / restaurant / dhaba switch on dishes like karahi | eating out counts honestly | A9 |
| US-10 | 1 | Bilal | the source of any food in one tap, with estimates marked | I can trust the numbers | A9 A14 |
| US-11 | 1 | Boss | to plan a day ahead and tick meals off as I eat them | it works as a meal calendar | A12 |
| US-12 | 1 | Nasreen | to edit or delete with Undo and no scary pop-ups | mistakes cost nothing | A13 |
| US-13 | 1 | Boss | my data to stay on my phone, survive reloads, and back up by copy and paste | I never lose a month of logs | A13 |
| US-14 | 1 | Bilal | quick add (name + kcal) for a meal I can't find | a wedding dinner still counts | QA E2E |
| US-15 | 1 | Bilal | a week view with kcal and protein per day and the weekly average | I judge the week, not one shaadi | QA E2E |
| US-16 | 1 | Nasreen | phone-first, light and dark, no sideways scrolling, buttons big enough for a thumb | it feels easy on my Android | A15 |
| US-17 | 2 | Nasreen | a whole-pot recipe that I log as katoris or a share of the pot | my family salan is one entry | A10 |
| US-18 | 2 | Bilal | saved meals ("weekday lunch") | four foods take one tap | A5(c) |
| US-19 | 3 | Bilal | Ramadan mode: Sehri, Iftar, Dinner and After-taraweeh, with after-midnight food counting toward the fast | Ramadan logs make sense | A11 |
| US-20 | 3 | Boss | a desi protein nudge when I'm behind ("2 anday + 1 katori dahi") | I hit protein with ghar ka khana | spec in S3 |
| US-21 | 3 | Bilal | a weight log | I see whether the cut works | spec in S3 |
| US-22 | 2 | Bilal | to set my chai once (milk share, sugar spoons) | my 1.5-spoon chai is exact | A6 |
| US-23 | 3 | Nasreen | screen reader and large text to work | anyone in the family can use it | A15 (extended) |
| US-24 | 3 | Boss | the app to open fast on a mid-range Android and keep up with my typing | it's quicker than a notebook | spec in S3 |
| US-25 | 3 | Boss | every food re-audited before I get it | the numbers hold up | A14 (rerun) |
| US-26 | 1 | Boss | Spanish meal times by default on Madrid time, switchable to the Pakistani preset | my 11:30 cortado isn't "lunch" | A19 A20 |
| US-27 | 1 | Boss | a halal status with a reason on every food, "Halal only" on by default, and an explanation when a search hits a hidden food | I never have to wonder about the croissant | A19 A14 |
| US-28 | 1 | Mariam | café and bakery food found by its Catalan, Spanish or English name | the menu board and the app use the same words | A19 |
| US-29 | 2 | Boss | to pick a library lunch box or build a batch recipe, say "4 boxes" and see the macros per box | Sunday prep is one entry | A16 |
| US-30 | 2 | Mariam | to drop a box into Lunch on chosen days, one tap each, with boxes left always shown | I plan the week in seconds | A17 |
| US-31 | 2 | Boss | each box marked fridge or freezer, with a use-by from its shortest-lived part | I never eat a risky rice box | A18 |
| US-32 | 2 | Mariam | a shopping list that scales with the boxes, split between the halal butcher and the supermarket, and copies as text | one trip to the Raval, one to Mercadona | A18 |
| US-33 | 2 | Mariam | to answer the seafood question once | prawns are flagged by my own choice, never by a ruling | spec in S2 |
| US-34 | 3 | Nasreen | kam tel (home-light) versions of salan and daal | my lighter cooking counts | spec in S3 |

**Not scheduled (for later reviews):** training-day and rest-day targets, targets that adapt to my
weight trend, barcode scanning, sharing a day as text on WhatsApp, a full Urdu interface, cost per
box (a nice-to-have in minutes 002).

---

## 4. Acceptance tests

Each test lists its start state, steps, pass rule and budget.
- **Sprint 1:** A1–A9, A12–A15, A19, A20.
- **Sprint 2:** A10, A16–A18, A5(c).
- **Sprint 3:** A11.

### A1: First open to targets (Sprint 1, US-01)
- **Start:** Fresh, on the phone and small projects.
- **Steps:**
  1. Open the app.
  2. Fill in onboarding with P1.
  3. Finish.
  4. Separately, from a new Fresh state, tap Skip on the first screen.
- **Pass:**
  - No screen asks for an email, phone number, password or payment.
  - Nothing is advertised, and no request goes to another origin.
  - The Day view shows kcal, protein, carbs, fat and fibre targets equal to `computeTargets(P1)` from
    `docs/NUTRITION.md`. For reference, Ayesha's kickoff formulas give about 2,210 kcal and 161 g
    protein, but NUTRITION.md is binding, not my arithmetic.
  - The targets are labelled as estimates.
  - Skip reaches a working Day view with the Lab's defaults.
- **Budget:** script ≤ 15 actions (Skip ≤ 2); person ≤ 60 s.

### A2: Roti search (Sprint 1, US-02)
- **Start:** Set up. Open the add sheet on Nashta (1 action).
- **Steps:** Type each query, clearing the box in between: `roti`, `chapati`, `phulka`, `Roti`,
  ` roti ` (with spaces), `tandoori roti`, `naan`.
- **Pass:**
  - Results update as I type; there is no search button.
  - #1 is in the top 3 for each of the first five queries.
  - `tandoori roti` puts #2 first, and `naan` puts #3 first.
  - #1, #2 and #3 are three different records.
  - Every result row shows a default portion and its kcal.
- **Budget:** results show within 300 ms of the last keystroke.

### A3: Spellings, plurals, Urdu script, Spanish (Sprint 1, US-02)
- **Start:** as A2.
- **Steps:** Type each query below.
- **Pass:** The expected food is in the top 3 (or first, where the table says so).

| Query | Expected |
|-------|----------|
| `dal`, `daal`, `dhal`, `دال` | a daal (#9 or #10) |
| `daal mash` | #10 first |
| `anda`, `anday`, `egg` | an egg record (#15–17) |
| `chawal`, `chaawal`, `rice` | #8 |
| `chai` / `doodh patti` | #21 / #21 first |
| `samosay`, `pakoray` | #27, #28 |
| `karhai` | #13 or #14 |
| `kela`, `seb`, `khajoor` | #32, #31, #33 |
| `lentejas` / `tortilla` | #38 first / #39 first |

- **Budget:** same as A2.

### A4: The Boss's sample day in a minute (Sprint 1, US-05; Definition of Done)
- **Start:** Set up, no recents, phone. Clock at 21:30.
- **Steps:** Log D0 in table order, searching for every food. No copying.
- **Pass:**
  - 7 entries (or 8 with the fallback) with D0's slots and script portions.
  - The totals equal the sum of the entries.
- **Budget:**
  - Script: ≤ 32 actions (+4 with the fallback) and ≤ 60 s. My count for a plain
    search → pick → add flow is 31.
  - Person: ≤ 60 s.

### A5: My weekday, then copy yesterday (Sprint 1; part c is Sprint 2; US-05, US-07, US-18)
- **Start:** Set up, no recents, phone. Clock at 21:30 on day X.
- **Steps:**
  - (a) Log D1 by searching.
  - (b) Go to X+1 and copy day X into it.
  - (c, Sprint 2) Save D1's lunch as "weekday lunch", then log it on X+2.
- **Pass:**
  - (a) 17 entries with the right slots and portions.
  - (b) X+1 has the same 17 foods, servings, quantities and slots as X, and the same totals. X is
    unchanged. One Undo removes the whole copy.
  - (c) The 4 lunch entries appear in Lunch.
- **Budget:**
  - (a) Person ≤ 120 s. I said 90 s at kickoff, but I count about 70 actions for 17 foods, so
    120 s is the honest bar. Script ≤ 70 actions.
  - (b) ≤ 4 actions and ≤ 15 s.
  - (c) ≤ 3 actions and ≤ 10 s.

### A6: Chai in two taps (Sprint 1, US-06; exact sugar via US-22 in Sprint 2)
- **Start:** Warm, with chai #21 (2 tsp, 1 cup) logged yesterday at Nashta. Day view, clock at 17:00.
- **Steps:**
  1. Open the add sheet on Shaam ki chai.
  2. Without typing, tap "+" on the chai row.
- **Pass:**
  - Chai shows in this slot's recents even though it was logged in another slot.
  - The entry reads "1 cup", and the totals rise by exactly one cup.
  - Repeating this 4 times gives 4× the values.
- **Budget:** ≤ 2 actions from the Day view; person ≤ 3 s.

### A7: Protein and kcal left at 6 pm (Sprint 1, US-08)
- **Start:** Set up with P1. Clock at 18:00. D1 rows up to 17:00 (11 entries) logged as eaten.
- **Steps:**
  1. Open the Day view and touch nothing.
  2. Scroll down to Dinner.
- **Pass:**
  - Without scrolling, "kcal left" and "protein left" are fully visible on the phone and small
    projects.
  - Each equals target minus eaten (protein ±1 g, kcal ±5).
  - Both are still visible after scrolling to Dinner.
  - Over target, it reads "N over" in the same style, with no pop-up.
- **Budget:** 0 actions.

### A8: Half plate and one-and-a-half katori (Sprint 1, US-03, US-04)
- **Start:** Set up, with the Lunch add sheet open.
- **Steps:**
  1. Log #10 as katori × 1.5.
  2. Log #8 as plate × 0.5.
  3. Type `0.33` as a quantity.
  4. Try `0`, an empty box and `-1`.
- **Pass:**
  - Before adding, the picker shows live grams = quantity × that serving's grams, and kcal =
    grams × kcal per 100 g / 100 (display rounding only).
  - The entry row reads like "1.5 katori · N g".
  - Buttons step by 0.5, and typed decimals work.
  - 0, empty and negative values are refused inline, with no pop-up.
- **Budget:** a non-default quantity costs ≤ 2 extra actions.

### A9: Home vs restaurant, and the source (Sprint 1, US-09, US-10)
- **Start:** Set up. Dinner add sheet, search `karahi`.
- **Steps:**
  1. Open #13 at katori × 1.
  2. Switch to Restaurant (and Dhaba, if offered).
  3. Open the source, then close it.
  4. Add.
  5. Open the source again from the logged entry.
- **Pass:**
  - The switch appears only on foods whose `family` has more than one style.
  - Switching changes the record and the kcal preview at once, and keeps the serving and quantity.
  - Restaurant kcal per katori is higher than home.
  - The source shows the citation, method and confidence, with an "estimate" badge for C.
  - Closing the source returns to the same state.
  - The entry shows its style.
- **Budget:** the switch takes 1 action, and the source opens in 1 action.

### A10: Tortilla recipe, log half (Sprint 2, US-17)
- **Start:** Set up, Sprint 2 build.
- **Steps:**
  1. Create the recipe "Mi tortilla": 5 eggs, 3 medium potatoes, 1 medium onion, 3 tbsp olive
     oil, makes 1 tortilla.
  2. Log 0.5 at Dinner.
  3. The next day, log it again from recents.
  4. Repeat with the D4 lentejas pot, logging ⅓ of the pot.
- **Pass:**
  - The recipe total equals the sum of its ingredients as the app shows them.
  - The entry is exactly half (⅓ for lentejas) of that total.
  - The recipe shows where its numbers came from.
- **Budget:**
  - First recipe: ≤ 2 min (person) and ≤ 25 actions.
  - Re-logging: ≤ 2 actions and ≤ 10 s.
- **Open question for Ayesha:** how should a recipe count frying oil that is poured off? The 3 tbsp
  above is my guess at what stays in, as a user would enter it.

### A11: A Ramadan fasting day (Sprint 3, US-19)
- **Start:** Set up, Sprint 3 build. Ramadan mode switched on (≤ 3 actions from Profile). Date D.
- **Steps:**
  1. Log D3, with the clock set to each row's time (04:30, 18:05 and 20:30 on D; 00:15 on D+1).
  2. At 04:30 on D+1, log one Sehri item.
- **Pass:**
  - Day D shows Sehri, Iftar, Dinner and After-taraweeh.
  - At each time, the add sheet opens on the matching slot.
  - The 00:15 items land on D without me touching the date.
  - D's totals include all 14 entries.
  - The 04:30 item on D+1 lands on D+1.
  - Turning Ramadan mode off keeps every entry.
- **Budget:** no extra actions for dates.

### A12: Plan tomorrow, tick it off (Sprint 1, US-11, US-07)
- **Start:** Set up, with D1 logged on day X. Clock at 22:00 on X.
- **Steps:**
  1. Go to X+1.
  2. Plan Nashta (#1 × 1, #15 × 2 eggs), Lunch (copy X's Lunch slot) and Dinner (#11 katori × 1).
  3. Set the clock to 13:00 on X+1 and tick each Nashta and Lunch entry as eaten.
- **Pass:**
  - Entries on a future day default to planned.
  - Planned entries look different from eaten ones, with text or an icon as well as colour.
  - "Left" counts eaten entries only, and planned food shows as a separate figure.
  - Ticking turns an entry into eaten and updates "left".
- **Budget:** go to a day: 1 action. Copy a slot: ≤ 3 actions. Tick: 1 action per entry.

### A13: Mistakes and storage (Sprint 1, US-12, US-13)
- **Start:** Set up, with D1 logged.
- **Steps:**
  1. Delete the Dinner salad.
  2. Undo.
  3. Change Dinner roti from 2 to 3, then back.
  4. Reload.
  5. In a new context where every localStorage call throws, open the app and log 2 foods.
  6. In a normal context, export and copy the text. In a Fresh context, paste it into import and
     choose Replace.
- **Pass:**
  - (1) Delete has no confirm pop-up.
  - (2) Undo stays visible for at least 5 s and brings back the same food, portion, slot and status.
  - (3) The totals follow every edit.
  - (4) All 17 entries and the targets survive the reload.
  - (5) The app works, a "not saved" banner shows, and there is no crash or alert.
  - (6) After import, the entries and totals equal the original.
- **Budget:** delete ≤ 2 actions, Undo 1, a quantity edit ≤ 3.

### A14: Numbers I can trust (Sprint 1; rerun in the Sprint 3 audit; US-10, US-25)
- **Script:**
  - The data gate runs on every shipped food.
  - Each of the 49 coverage foods is found in the top 5 by the first word in its "I'd type" column
    (Catalan column for #40–#48, English for #49), with "Halal only" switched off for #46.
- **Person:** I open the source of #1, 5, 7, 10, 13, 14, 21, 27, 38, 39, 42 and 49.
- **Pass:**
  - Every food has a citation and a confidence of A, B or C.
  - C foods show "estimate" in search results and in the picker.
  - kcal per 100 g is within ±10% or ±10 kcal (whichever is larger) of 4P + 4C + 9F + 2·fibre.
  - Fibre shows in the Day totals and in the picker.
  - Every food has a halal status, and a reason unless the status is `halal`.
- **Budget:** a source opens in ≤ 1 action.

### A15: Phone, dark mode, thumbs (Sprint 1; full accessibility pass in Sprint 3; US-16, US-23)
- **Start:** Set up with D1 logged, on all four projects.
- **Steps:** Visit onboarding, Day, the add sheet, the portion picker, Week/Month, Profile and Data.
- **Pass:**
  - `scrollWidth ≤ innerWidth` on every view.
  - Every button, chip and link is at least 44 × 44 px.
  - Text meets AA contrast in both themes.
  - The longest coverage names ("Chicken karahi, restaurant", "Tortilla de patatas") are not cut
    off at 360 px.
  - Dark mode has no white flash.
  - Person: I log D0 one-handed without zooming.
- **Budget:** n/a.

### A16: Batch recipe into boxes (Sprint 2, US-29)
- **Start:** Set up, Sprint 2 build. Sunday 18:00.
- **Steps:**
  1. From the lunch-box library, pick "Chicken tikka rice bowl" and set 4 boxes.
  2. Build my own recipe, "Tikka bowls": 800 g boneless chicken thigh, 200 g dahi, 2 tbsp oil,
     320 g dry basmati, 2 cucumbers. Set 4 boxes, then change it to 5.
  3. In the ingredient picker, search `ensaimada`.
- **Pass:**
  - (1) The macros per box show without another action, and match the "1 box" values of #49 (the
    same recipe) within 2%.
  - (2) For kcal, protein, carbs, fat and fibre, per box = recipe total ÷ boxes. Changing 4 to 5
    updates the per-box figures with no re-entry.
  - A recipe's halal status is the worst status among its ingredients, shown with that ingredient's
    reason.
  - (3) No `not-halal` food can be picked as an ingredient.
- **Budget:**
  - (1) ≤ 4 actions.
  - (2) ≤ 25 actions and ≤ 2 min for a person.
  - Changing the box count ≤ 2 actions.

### A17: Boxes into Lunch, Monday to Thursday (Sprint 2, US-30)
- **Start:** A16 step 1 done (4 boxes). Sunday 20:00.
- **Steps:**
  1. From the batch, place one box in Lunch on Monday, Tuesday, Wednesday and Thursday.
  2. Place a fifth box on Friday, then Undo.
  3. On Monday at 14:00, tick Monday's box eaten.
- **Pass:**
  - Four planned Lunch entries of "1 box" each, on the right dates. The batch shows "0 of 4 left".
  - The fifth placement works but shows an inline "no boxes left" note (no pop-up), and Undo removes
    it.
  - Ticking makes Monday's box eaten and updates "left".
  - The batch shows the boxes left and the halal status without opening anything.
- **Budget:** step 1 ≤ 6 actions and ≤ 15 s. The tick takes 1 action.

### A18: Fridge, freezer, use-by and shopping list (Sprint 2, US-31, US-32)

Ayesha's rule (minutes 002, decision 7):
- Box 1 goes in the fridge and boxes 2–4 go in the freezer.
- Use-by = the cooked date + the shortest fridge life of anything in the box (`RULES.mealPrep.storage`).
- A frozen box has no use-by. "Move to fridge" gives it 1 day.

- **Start:** A17 step 1 done, but don't tick Monday. The batch was cooked on Sunday 1 Nov 2026, after
  the clock change.
- **Steps:**
  1. Look at the batch's storage.
  2. Sunday 21:00: check box 1.
  3. Monday 12:00: open the Day view.
  4. Monday 22:00: move box 2 to the fridge.
  5. Tuesday 09:00: open the Day view and the batch.
  6. Cook the cold library box "Chicken chana chaat" (4 boxes) on Sunday. Look at its storage
     options and use-by.
  7. Open the tikka batch's shopping list at 4 boxes, then at 8. Copy it.
- **Pass:**
  - (1) For a rice box, the app proposes box 1 in the fridge and boxes 2–4 in the freezer. Any box
    can be changed.
  - (2) Box 1's use-by is Monday, because rice keeps 1 day. Boxes 2–4 show "frozen" and no use-by.
  - (3) Monday's Lunch box shows "last day".
  - (4) Box 2 now shows a use-by of Tuesday.
  - (5) The batch shows box 1 as "past use-by, best not to eat", in neutral wording with no red and
    no pop-up. Tuesday's box shows "last day".
  - (6) The chana chaat use-by is Sunday + its shortest fridge life (Ayesha's table gives 2 days for
    the chaat salad, so Tuesday). The freezer option is off, or marked "doesn't freeze well".
  - (7) Each ingredient appears once, and the amounts double at 8 boxes. Meat is listed under the
    halal butcher and everything else under the supermarket. The list copies as plain text.
- **Budget:** moving a box ≤ 2 actions. The shopping list opens in ≤ 2 actions and copies in 1.

### A19: Barcelona café breakfast (Sprint 1, US-26, US-27, US-28)
- **Start:** Fresh, device on Europe/Madrid. Skip onboarding. A weekday, 09:00.
- **Steps:**
  1. Read the slot labels.
  2. Open the add sheet without choosing a slot. Log `cafe amb llet` (#40, cup × 1), `croissant`
     (#42, piece × 1) and `suc de taronja` (#44, glass × 1).
  3. At 11:30, open the add sheet without choosing a slot. Log `tallat` (#41, cup × 1).
  4. Search every Catalan, Spanish and English word for #37, #40–#45 and #47 (#46 is step 5).
  5. Search `ensaïmada`, then `ensaimada`, then show the hidden item.
- **Pass:**
  - (1) The Spanish preset is active with no setup.
  - (2, 3) All four entries land in `breakfast` by default, including the 11:30 cortado, on Madrid's
    date.
  - (4) Each word finds its food in the top 3, with or without accents.
  - The croissant row shows a `check` chip, and its reason opens in ≤ 1 action. Halal foods show no
    chip.
  - (5) Instead of an empty list, the results say one item is hidden by "Halal only", name it, and
    give its reason (made with pork lard). Showing it takes 1 action, and its row has a `not-halal`
    chip. Showing it doesn't switch "Halal only" off anywhere else.
- **Budget:** steps 2–3 ≤ 12 actions (minutes 002, decision 10); ≤ 30 s for a person. My count is 12
  only if search rows have a "+" that adds the default portion; without one it's 16. Priya, please
  confirm.

### A20: Across the Madrid clock change (Sprint 1, US-26; minutes 002, decision 1)

On Sunday 25 Oct 2026 at 03:00 CEST, Madrid clocks go back to 02:00 CET, so 02:00–03:00 happens
twice.

- **Start:** Set up, Spanish preset, Madrid clock.
- **Steps:**
  1. Saturday 24 Oct, 21:30 CEST: log D5's four dinner rows.
  2. Sunday 25 Oct: log 1 glass of milk (#20) at the first 02:30 (CEST, UTC+2) and 1 banana (#32)
     at the second (CET, UTC+1).
  3. Sunday 25 Oct, 12:00 CET: open the app.
  4. From 25 Oct, step back two days, then forward three.
  5. Open the week view for 25 Oct, then the next week.
  6. Monday 26 Oct, 09:00: copy yesterday into today, then reload.
  7. Repeat steps 3–5 in America/Los_Angeles around its own change on Sunday 1 Nov 2026, and in
     Asia/Karachi (no change) around 25 Oct.
- **Pass:**
  - (2) Both 02:30 entries land in Snacks on 25 Oct.
  - (3) The app opens on 25 Oct, and the 24th holds exactly the four dinner rows.
  - (4) The dates read 24, 23, then 24, 25, 26, with nothing skipped or repeated.
  - (5) The week of Monday 19 to Sunday 25 Oct has 7 days, and the next one starts on Monday 26.
  - (6) The 26th gets the 25th's two entries. After the reload, no entry has moved date and every
    day's totals are unchanged.
- **Budget:** n/a (script only).

---

## 5. Test days

Times set the clock (Madrid time) and the default slot, and food numbers refer to the coverage list.
D0–D4 use the Pakistani-preset slot labels, but tests work by slot id (Nashta = `breakfast`, Shaam ki
chai = `evening`). D0 and D5 run on the Spanish preset; D1–D4 run on the Pakistani preset.

### D0: The Boss's sample day (from docs/BRIEF.md)

The Boss gave no portions or times. These are mine, kept plain.

| Time | Slot | I type | Food | I say | Script portion |
|------|------|--------|------|-------|----------------|
| 08:00 | Nashta | anda paratha | #5 | 1 anda paratha | piece × 1 |
| 08:00 | Nashta | chai | #21 (1 tsp) | 1 cup chai | cup × 1 |
| 13:30 | Lunch | daal chawal | #7 | 1 plate daal chawal | plate × 1 |
| 17:00 | Shaam ki chai | chai | #21 (1 tsp) | 1 cup | cup × 1 |
| 17:00 | Shaam ki chai | biscuit | #26 | 2 biscuits | piece × 2 |
| 21:00 | Dinner | karahi | #13 | 1 katori chicken karahi | katori × 1 |
| 21:00 | Dinner | roti | #1 | 2 roti | roti (M) × 2 |

**Fallback**, if the Lab ships no daal chawal plate: Lunch becomes masoor daal (#9) katori × 1 and
plain rice (#8) plate × 1.

### D1: My weekday (office, gym at 7 pm)

| Time | Slot | I type | Food | I say | Script portion |
|------|------|--------|------|-------|----------------|
| 08:00 | Nashta | omelette | #15 | 3 anday ka omelette | egg × 3 |
| 08:00 | Nashta | roti | #1 | 1 roti | roti (M) × 1 |
| 08:00 | Nashta | chai | #21 (2 tsp) | 1 cup | cup × 1 |
| 11:30 | Snacks | chai | #21 (2 tsp) | 1 cup | cup × 1 |
| 11:30 | Snacks | rusk | #25 | 2 rusk | piece × 2 |
| 13:30 | Lunch | roti | #1 | 2 roti | roti (M) × 2 |
| 13:30 | Lunch | daal mash | #10 | 1 katori | katori × 1 |
| 13:30 | Lunch | salad | #34 | salad | katori × 1 |
| 13:30 | Lunch | dahi | #18 | half katori dahi | katori × 0.5 |
| 17:00 | Shaam ki chai | chai | #21 (2 tsp) | 1 cup | cup × 1 |
| 17:00 | Shaam ki chai | seb | #31 | 1 seb | piece × 1 |
| 18:30 | Snacks | whey | #35 | 1 scoop in water | scoop × 1 |
| 18:30 | Snacks | kela | #32 | 1 kela | piece × 1 |
| 21:15 | Dinner | roti | #1 | 2 roti | roti (M) × 2 |
| 21:15 | Dinner | chicken salan | #11 | 1 bari katori (3 boti) | katori × 1.5 |
| 21:15 | Dinner | aloo gobi | #12 | half katori | katori × 0.5 |
| 21:15 | Dinner | salad | #34 | salad | katori × 1 |

### D2: Saturday (out with friends)

| Time | Slot | I type | Food | I say | Script portion |
|------|------|--------|------|-------|----------------|
| 11:30 | Nashta (picked by hand) | anda paratha | #5 | 1 anda paratha | piece × 1 |
| 11:30 | Nashta | dahi | #18 | half katori | katori × 0.5 |
| 11:30 | Nashta | chai | #21 (2 tsp) | 1 cup | cup × 1 |
| 16:00 | Shaam ki chai | chai | #21 (2 tsp) | 1 cup | cup × 1 |
| 16:00 | Shaam ki chai | samosay | #27 | 2 samosay | piece × 2 |
| 21:30 | Dinner | karahi | #14 (restaurant) | my share of a half-kg karahi, three of us | katori × 1.5 (person run: "½ kg handi" × 0.33, if that serving exists) |
| 21:30 | Dinner | naan | #3 | 1 naan | piece × 1 |
| 21:30 | Dinner | roghni naan | #4 | 1 roghni naan | piece × 1 |
| 21:30 | Dinner | raita | #19 | half katori | katori × 0.5 |
| 21:30 | Dinner | cold drink | #24 | 1 regular, 345 ml | bottle × 1 |
| 23:45 | Snacks | dhaba chai | #22 | 1 cup, extra sugar | cup × 1 |
| 23:45 | Snacks | kulfi | #29 | 1 kulfi | piece × 1 |

At 11:30 I still call it nashta, so the slot picker has to let me choose.

### D3: A Ramadan day (A11 is Sprint 3)

Until Ramadan mode ships in Sprint 3, log Sehri in Nashta, Iftar in Shaam ki chai and
After-taraweeh in Snacks, all on the date of the sehri.

| Time | Slot (Ramadan mode / until then) | I type | Food | I say | Script portion |
|------|----------------|--------|------|-------|----------------|
| 04:30 | Sehri / Nashta | paratha | #6 | 1 paratha | piece × 1 |
| 04:30 | Sehri / Nashta | fried egg | #16 | 2 fried anday | piece × 2 |
| 04:30 | Sehri / Nashta | dahi | #18 | 1 katori | katori × 1 |
| 04:30 | Sehri / Nashta | chai | #21 (2 tsp) | 1 cup | cup × 1 |
| 18:05 | Iftar / Shaam ki chai | khajoor | #33 | 3 khajoor | piece × 3 |
| 18:05 | Iftar / Shaam ki chai | rooh afza | #23 | 1 glass | glass × 1 |
| 18:05 | Iftar / Shaam ki chai | fruit chaat | #30 | 1 katori | katori × 1 |
| 18:05 | Iftar / Shaam ki chai | pakoray | #28 | 4 pakoray | piece × 4 |
| 18:05 | Iftar / Shaam ki chai | samosa | #27 | 1 samosa | piece × 1 |
| 20:30 | Dinner | roti | #1 | 1 roti | roti (M) × 1 |
| 20:30 | Dinner | chicken salan | #11 | 1 katori | katori × 1 |
| 00:15 (next date) | After-taraweeh / Snacks | doodh | #20 | 1 glass | glass × 1 |
| 00:15 (next date) | After-taraweeh / Snacks | whey | #35 | 1 scoop in the doodh | scoop × 1 |
| 00:15 (next date) | After-taraweeh / Snacks | chai | #21 (2 tsp) | 1 cup | cup × 1 |

### D4: Mixed Spanish day (a Sunday when I cook)

| Time | Slot | I type | Food | I say | Script portion |
|------|------|--------|------|-------|----------------|
| 10:30 | Nashta | pan con tomate | #37 | 2 slices | slice × 2 |
| 10:30 | Nashta | ubla anda | #17 | 2 boiled anday | piece × 2 |
| 10:30 | Nashta | chai | #21 (2 tsp) | 1 cup | cup × 1 |
| 14:30 | Lunch | lentejas | #38 | 2 katori | katori × 2 |
| 14:30 | Lunch | roti | #1 | 1 roti (yes, with lentejas) | roti (M) × 1 |
| 18:00 | Shaam ki chai | chai | #21 (2 tsp) | 1 cup | cup × 1 |
| 18:00 | Shaam ki chai | marie | #26 | 3 Marie biscuits | piece × 3 |
| 21:30 | Dinner | tortilla | #39 | half my tortilla | whole × 0.5 |
| 21:30 | Dinner | salad | #34 | salad | katori × 1 |
| 21:30 | Dinner | olive oil | #36 | 1 tsp on the salad | tsp × 1 |

**Sprint 2 recipe inputs** (as typed, not nutrition data):
- **Lentejas pot:** 250 g dry brown lentils, 1 carrot, 1 potato, 1 onion, 2 tbsp olive oil, one
  150 g pack of halal beef sausage (chorizo is out). It feeds three of us, so I log ⅓ of the pot.
- **Tortilla:** as in A10.

### D5: PhD weekday in Barcelona (the Boss's real weekday)

Spanish preset, "Halal only" on, Madrid time. In Sprint 2 the lunch row becomes a box from the Sunday
batch (A17) instead of the Sprint 1 bridge record #49.

| Time | Slot | I type | Food | I say | Script portion |
|------|------|--------|------|-------|----------------|
| 08:45 | Breakfast / café | cafe amb llet | #40 | 1 café con leche | cup × 1 |
| 08:45 | Breakfast / café | croissant | #42 (`check` chip) | 1 croissant | piece × 1 |
| 11:15 | Breakfast / café | tallat | #41 | 1 cortado | cup × 1 |
| 13:45 | Lunch box (eaten in the library) | tikka bowl | #49 | chicken tikka rice bowl, 1 box | box × 1 |
| 13:45 | Lunch box | manzana | #31 | 1 apple | piece × 1 |
| 17:30 | Merienda / chai | chai | #21 (1 tsp) | 1 cup chai | cup × 1 |
| 17:30 | Merienda / chai | galletas maria | #26 | 3 Marie biscuits | piece × 3 |
| 21:30 | Dinner | chicken salan | #11 | 1 katori | katori × 1 |
| 21:30 | Dinner | daal | #9 | half katori masoor daal | katori × 0.5 |
| 21:30 | Dinner | chawal | #8 | half plate | plate × 0.5 |
| 21:30 | Dinner | salad | #34 | salad | katori × 1 |
| 23:30 | Snacks (picked by hand; 23:30 falls in Dinner hours) | skyr | #48 | 1 pot of skyr | pot × 1 |
| 23:30 | Snacks | plátano | #32 | 1 plátano | piece × 1 |

Daal is fine at a home dinner; the Boss only bans it from the lunch box.

---

## 6. Customer Panel runs

- **Review 1:**
  - I do person runs of A1–A9, A12–A15 and A19, plus D0–D5, at phone size and on desktop. Each run is
    timed, with screenshots.
  - Nasreen, as a first-time user, runs A1, A2/A3 in her own words, A4, A8 and D0.
  - Mariam, as a first-time user on the Madrid clock, runs A1 (Skip), A19, D5 and D0 in her own
    words.
  - Their timings are recorded but don't decide pass or fail; their findings do.
  - Reports go in `team/feedback/`.
- **Sprint 2 review:** A10, A16–A18 and A5(c). Nasreen does a whole-pot recipe of her own choosing,
  and Mariam runs a real Sunday batch through A16–A18.
- **Sprint 3 review:** A11 (Ramadan).
- **Requests that need an owner's answer** (I'll raise them at Review 1 if they're still open):
  - **Lena / Priya:**
    - Recents work across slots (A6).
    - Copying a whole day is undoable (A5b).
    - Planned food shows separately from "left" (A12).
    - A "+" on search rows, which A19's 12-action budget needs.
    - Which date food logged between 00:00 and 01:00 lands on, now that Spanish dinner runs to 01:00.
      My vote is the previous day, as with after-taraweeh, but it's open, so no test depends on it
      yet.
  - **Ayesha / the Lab:**
    - The serving labels in §1.
    - Frying oil in recipes (A10).
    - A daal chawal plate record (D0).
    - Halal statuses and reasons for #40–#49.
    - The fridge lives in `RULES.mealPrep.storage` (A18).
