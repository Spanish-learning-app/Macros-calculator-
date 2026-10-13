# Kickoff memo: Nutrition Lab (Dr. Ayesha Siddiqui, Lead Nutritionist)

This memo is the proposed **nutrition contract for Sprint 1**. Once adopted, I will turn it into
`docs/NUTRITION.md`. Numbers marked *prov.* are provisional starting values that the Lab will verify
during the sprint.

## 1. Nutrients tracked in v1

**Required on every food, with daily targets:**
- energy (kcal)
- protein
- carbohydrate
- fat
- fibre

"Carbohydrate" means **available carbs, with fibre excluded**, which is how IFCT, CoFID and BEDCA report
it. USDA figures include fibre, so we subtract it and record the conversion.

**Other nutrients:**

| Nutrient | In v1? | How it is used | Why |
|---|---|---|---|
| Total sugars | Optional field | Shown, no target | Sugar in chai is a major hidden source |
| Saturated fat | Optional field | Shown against a reference of under 10% of energy (WHO) | Desi cooking uses a lot of ghee |
| Sodium | Field kept | Not shown | Restaurant salt varies by about ±100%, so any number would be false precision |
| Water | No | Not tracked | — |

## 2. Target calculation

**BMR**
- Default: Mifflin-St Jeor.
  - Men: `10·kg + 6.25·cm − 5·age + 5`
  - Women: `10·kg + 6.25·cm − 5·age − 161`
- If body-fat % is entered (accepted range 5–60%): Katch-McArdle, `370 + 21.6·kg·(1 − BF/100)`.
- Ages 18–80 only.

**TDEE** = BMR × activity factor. Exercise calories are never added back on top. If unsure, pick Light.

| Level | Factor | Plain language |
|---|---|---|
| Sedentary | 1.2 | Desk or home work, little walking |
| Light | 1.375 | Daily walking, or exercise 1–3 days a week |
| Moderate | 1.55 | Exercise 3–5 days a week (for example, gym 4 days), or on your feet most of the day |
| Very active | 1.725 | Hard training 6–7 days a week, or a physical job |
| Extra active | 1.9 | Physical job plus training, or training twice a day |

**Goal.** We use 7,700 kcal per kg of body weight, so 1 kg per week equals 1,100 kcal per day.

| Goal | Rate options (default **bold**) |
|---|---|
| Lose | 0.25 / **0.5** / 0.75 / 1.0 kg per week |
| Maintain | none |
| Gain | **0.25** / 0.5 kg per week |

**Safety rails**, applied in this order:
1. The deficit is at most 25% of TDEE and at most 1,000 kcal.
2. Weight loss is at most 1% of body weight per week.
3. A surplus is at most 20% of TDEE.
4. The final target never goes below **1,200 kcal for women or 1,500 kcal for men**.

If a rail changes the user's choice, the app shows the effective rate and why.

**Protein**

The protein reference weight (PRW) is:
- the actual weight, when BMI is 25 or below
- `W25 + 0.4·(kg − W25)` when BMI is above 25, where `W25 = 25·height_m²`

Protein per kg of PRW:

| | Lose | Maintain | Gain |
|---|---|---|---|
| No weight training | 1.2 | 1.0 (1.2 if aged 65+) | 1.2 |
| Weight training at least twice a week | 2.0 | 1.6 | 1.8 |

Users can override this anywhere from 0.8 to 2.5 g/kg (sources: Morton 2018, ISSN 2017).

**Fat:** 30% of calories by default, adjustable from 20% to 40%. It never goes below whichever is higher:
20% of calories or 0.6 g/kg PRW.

**Carbs:** whatever energy is left, `(kcal − 4P − 9F)/4`. If that comes to under 100 g, show a note but
keep the number. Protein is never cut to make room.

**Fibre:** 14 g per 1,000 kcal, and at least 25 g.

**Rounding.** Halves round up, as in JavaScript's `Math.round`.
1. Do all the maths unrounded, including the rails.
2. Round kcal to the nearest 10.
3. Round protein and fat to the nearest gram.
4. Work out carbs from those rounded figures.
5. Check that 4P + 4C + 9F is within 5 kcal of the target.

**Food values** are stored per 100 g, with kcal as whole numbers and macros to 0.1 g. Daily totals add the
unrounded values.

**When the app should say "talk to a professional"**

| Situation | What the app does |
|---|---|
| Under 18 | No targets; logging only |
| Pregnant or breastfeeding | Goal locked to "maintain"; note that needs are higher and should be set by their clinician |
| Current or past eating disorder | No weight-loss goal; option to hide calorie numbers |
| Kidney disease | Protein capped at 0.8 g/kg |
| Diabetes treated with insulin or sulfonylureas | Note on low blood sugar risk when eating at a deficit or fasting in Ramadan |
| BMI under 18.5 | No weight-loss goal |

Every target is labelled as an estimate (±10%). Adapting the target from the user's weight trend is a
candidate for v2.

**QA test cases**

| | Profile A | Profile B |
|---|---|---|
| Person | Man, 30, 175 cm, 80 kg, Moderate, lifts weights | Woman, 35, 160 cm, 85 kg, Sedentary, no weights |
| Goal | Lose 0.5 kg/week | Lose 0.75 kg/week |
| BMR / TDEE | 1,748.75 / 2,710.56 | 1,514 / 1,816.8 |
| Deficit | 550 | 825 requested, **capped at 454.2** (about 0.41 kg/week) |
| Calorie target | **2,160** | **1,360** |
| BMI / PRW | 26.12 / 77.94 | 33.20 / 72.4 |
| Protein / fat / carbs / fibre (g) | **156 / 72 / 222 / 30** | **87 / 45 / 152 / 25** (fibre at the 25 g minimum) |

**Profile C** is Profile A with 18% body fat entered: lean mass 65.6 kg, BMR 1,786.96, TDEE 2,769.79,
calorie target **2,220**.

## 3. What each food record must contain (Lena designs the data structure)

- **Names:**
  - `name_en`
  - `name_ur` in Urdu script (مسور کی دال)
  - `name_roman` (masoor ki daal)
  - search aliases
- **State:** a required phrase saying exactly what was measured, for example "cooked, as served with gravy,
  edible portion only (no bones)", "raw" or "dry".
- **Per 100 g:**
  - required: kcal, protein, carbs, fat, fibre
  - optional: sugars, saturated fat, sodium
- **Servings:** at least one household serving, with its gram weight.
- **Cooking style:** home, restaurant, dhaba or street.
  - Each style is a separate record with its own values, linked by a shared `family` id. We do not
    multiply one record to get another.
  - Mixed dishes state how much added fat they assume (`added_fat_g_per_100g`).
  - Users can also log add-ons: extra oil or ghee, and sugar.
- **Tags:**
  - cuisine
  - vegetarian, vegan or contains egg
  - halal (`halal` or `check`); v1 has no pork or alcohol items
  - usual meal slot
- **Source:** source code (e.g. `IFCT2017 A019` or `FDC 168874`), method, reviewer and date.
- **Confidence:**
  - **A**: exact match in an analysed table.
  - **B**: close match, product label, or recipe with a known cooked yield.
  - **C**: recipe estimate with assumed oil and yield. The app labels these "estimate".

**Standard household measures (*prov.*)**

| Measure | Weight |
|---|---|
| Roti (home) | small 30 g, **medium 40 g**, large 55 g |
| Tandoori roti | 100 g |
| Naan | 110 g |
| Paratha | 90 g |
| Katori | 150 g |
| Plate | 250 g at home, 350 g at a restaurant |
| Chai cup | 150 ml |
| Glass | 250 ml |
| Tablespoon | 14 g oil, 12 g sugar |
| Teaspoon | 4.5 g oil, 4 g sugar |

## 4. Data sources and method

| Source | What we use it for | Notes |
|---|---|---|
| IFCT 2017 (India) | Raw desi ingredients: atta, rice, pulses, vegetables | Lab-analysed values. PDF reachable today. |
| USDA FoodData Central | Meat, dairy, oils, fruit, international foods, gym foods | Demo API key is rate-limited; we need a free API key or the bulk download. |
| CoFID 2021 (UK) | Cross-checking cooked dishes and cooking yields | Open Government Licence |
| BEDCA (Spain) | Spanish and Mediterranean foods | Attribution required |
| Pakistan FCT 2001 | Cross-checks only | Paper-only and dated |
| Product labels | Packaged foods | Confidence B; label date recorded |

**Mixed dishes** (biryani, karahi, nihari, haleem, daal, salan) are calculated with the EuroFIR recipe method:
1. Write a standard recipe in raw grams, based on at least two published Pakistani recipes, with the oil
   or ghee in grams.
2. Add up the ingredients' nutrients using IFCT and USDA values.
3. Adjust for cooking yield, using USDA yield tables or a measured cooked weight.
4. Express the result per 100 g as served.

**Added fat, as a share of served weight (*prov.*)**

| Dish | Home | Restaurant |
|---|---|---|
| Salan and karahi | 6–10% | 12–20% |
| Daal | about 3% | 6–8% |
| Biryani | 4–6% | 7–10% |

**Checks every record must pass**
- **Energy:** stated kcal within 10% (or 10 kcal) of `4P + 4C + 9F + 2·fibre`.
- **Totals:** protein + carbs + fat + fibre add up to no more than 100 g per 100 g.
- **Fibre:** zero fibre for meat, fish, eggs, dairy and oil.
- **Energy range:** kcal per 100 g within the expected range for its group.

  | Group | kcal per 100 g |
  |---|---|
  | Oil | 860–900 |
  | Roti and naan | 220–360 |
  | Paratha | 280–400 |
  | Plain rice | 110–160 |
  | Biryani | 150–250 |
  | Curry and daal | 70–260 |
  | Chai and milk | 30–110 |
  | Vegetables | 10–90 |
  | Fruit | 15–120 |
- **Servings:** realistic serving energy, e.g. one roti at 80–150 kcal.
- **Mixed dishes:** compared with an independent reference; any gap over 25% is investigated.
- **My review:** I check every mixed dish, plus a random 20% of single foods, against their source.

## 5. Coverage: 150 must-haves in Sprint 1, about 410 foods in v1

| Group | v1 total | Must-haves |
|---|---|---|
| Pakistani home cooking | 70 | Daals (masoor, mash, chana, moong), chicken salan, aloo gosht, keema, aloo matar, bhindi, cholay, kadhi, anda curry |
| Restaurant and street food | 50 | Chicken and mutton karahi, biryani, pulao, nihari, haleem, seekh kebab, tikka, shami kebab, samosa, pakora, halwa puri |
| Breads and rice | 30 | Roti (S/M/L), tandoori roti, naan, paratha, aloo paratha, puri, plain rice |
| Drinks | 25 | Doodh patti and dhaba chai (0, 1 or 2 tsp sugar), lassi, milk, Rooh Afza, cola |
| Fruit and vegetables | 45 | Banana, apple, mango, kinnow, guava, dates, salad |
| Dairy and eggs | 25 | Dahi, raita, desi ghee, eggs (boiled, fried, omelette) |
| Meat and fish | 30 | Chicken breast, mince, rohu, canned tuna |
| Spanish and Mediterranean | 35 | Tortilla de patatas, lentejas, paella, gazpacho, hummus, olive oil |
| International and gym | 50 | Whey, oats, Greek yogurt, peanut butter, pasta, pizza, burger |
| Sweets and snacks | 30 | Tea biscuits, rusk, nimko, kheer, gulab jamun, jalebi |
| Fats and add-ons | 20 | Oil and ghee, sugar, ketchup, chutney, achaar |

## 6. Meal structure

**Meal slots.** The share of the day guides suggestions only. The hours decide which slot a new entry
goes into.

| Slot | Share of day | Hours |
|---|---|---|
| Nashta | 25% | 06:00–10:00 |
| Lunch | 30% | 12:00–15:00 |
| Evening chai | 10% | 16:00–18:00 |
| Dinner | 30% | 19:00–23:00 |
| Snacks | 5% | any time |

**Ramadan mode**
- Slots: Sehri 35%, Iftar 25%, Dinner 30%, Snacks 10%.
- Aims for at least 30 g protein at sehri.
- Adds a reminder to drink fluids.

**Sample day templates.** Values are *prov.* (±10%), so QA should not test against them.

| Slot | 1,800 kcal cut (protein ~141 g) | 2,550 kcal maintain (protein ~140 g) | 3,045 kcal gain (protein ~170 g) |
|---|---|---|---|
| Nashta | 2-egg omelette, roti, chai without sugar (380) | Anda paratha with 2 eggs, chai (620) | Paratha, 3-egg omelette, chai (660) |
| Lunch | Chicken salan, roti, salad, raita (480) | Daal chawal, shami kebab, salad (695) | Chicken biryani 350 g, raita, salad (740) |
| Evening chai | Chai, 30 g roasted chana (190) | Chai, 2 biscuits (195) | Chai, 2 biscuits (195) |
| Dinner | Chicken tikka 150 g, daal, roti, salad (570) | Home karahi 300 g, 2 roti, salad (760) | Home karahi 300 g, 2 roti, salad (760) |
| Snacks | Whey in water, kinnow (180) | Whey in milk (280) | Whey in milk with banana; dahi with almonds (690) |

**Finding:** the Boss's example day comes to roughly **1,850–2,000 kcal but only about 85 g of protein**.
The app should suggest desi protein foods: eggs, dahi, chicken, chana.

## 7. Hiring request: two researchers

1. **Pakistani cuisine researcher**
   - **Profile:** a nutritionist who reads Urdu and knows home, restaurant and dhaba cooking across
     Punjab, Sindh and KP.
   - **Brief:**
     - Write standard recipes for about 120 mixed dishes, in home and restaurant versions, and turn them
       into per-100 g values.
     - Check real weights for roti, katori, plate and cup.
     - Add Urdu-script and Roman Urdu names.
   - **Why:** about 60% of the records, and almost all of the uncertain ones, are here.
2. **International and packaged foods researcher**
   - **Profile:** someone who reads Spanish.
   - **Brief:**
     - Pull records from USDA, BEDCA and CoFID, with carbohydrate made consistent.
     - Cover Spanish and Mediterranean dishes, gym staples, and Pakistani packaged foods from their labels.
   - **Why:** about 40% of the records. The work is high-volume but low-risk, and handing it off frees me
     to review the mixed dishes.

I will keep the formulas, `docs/NUTRITION.md`, the templates and the final review of every record. I will
decide at the sprint review whether we need a second Pakistani cuisine researcher.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Mixed dishes vary a lot (oil can differ by ±50%) | Separate home and restaurant records, stated fat assumptions, oil add-ons, confidence labels |
| Portion sizes are vague (how big is a roti or a plate?) | Every serving has a gram weight; S/M/L options; Bilal weighs his own |
| Regional versions differ (Lahori vs Karachi biryani) | Separate records only when energy differs by more than 15% |
| Sources are old or incomplete | Build dishes from ingredients and cross-check against other sources |
| Formulas can be off for an individual | Targets labelled as estimates; safety rails; health flags |

**Requests from the other leads**
- **Omar:** approve the two hires and the approach to source licensing.
- **Lena:** build a data validator from the checks in section 4, and turn profiles A, B and C into unit tests.
- **Bilal:** this week, weigh 5 of your rotis, your katori and your chai cup.
