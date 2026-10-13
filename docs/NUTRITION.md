# Katori nutrition contract

**Owner:** Dr. Ayesha Siddiqui, Lead Nutritionist (Nutrition Lab)
**Status:** Sprint 1, version 1.0 (2026-10-13)

This document and `app/data/rules.js` are the specification for:
- every nutrition number in the app,
- every rule that produces those numbers,
- every food record.

`rules.js` holds the constants. This file holds the meaning and the algorithm. If the two
disagree, that is a bug: tell Ayesha. Do not pick one.

| Who | Uses |
|---|---|
| Hamza (core) | §2 (targets) and §3 (record format) |
| Kenji (QA) | §2.7 test vectors, §3 and §8 data gates |
| Priya (UI) | §2.5 notes and warnings, §4 vocabularies and labels |
| Zainab and Javier (research) | §3 to §9 |

`research/check-foods.mjs` runs every gate in §8.

---

## 1. Nutrients

| Key | Unit | Required | Shown in v1 | Target |
|---|---|---|---|---|
| `kcal` | kcal | yes | yes | yes |
| `protein` | g | yes | yes | yes |
| `carbs` | g, **available** carbohydrate (fibre excluded) | yes | yes | yes |
| `fat` | g | yes | yes | yes |
| `fiber` | g, total dietary fibre | yes | yes | yes |
| `sugars` | g, total sugars | no | yes, if present | none |
| `satFat` | g, saturated fatty acids | no | yes, if present | reference: under 10% of energy (WHO) |
| `sodium` | **mg** | no | **no** (stored only) | none |

Water is not tracked.

**Converting carbohydrate:**
- USDA FoodData Central gives "carbohydrate, by difference", which includes fibre. Convert it as
  `carbs = by-difference − fibre`. `node research/usda.mjs` already reports `carbs` this way.
- IFCT 2017, CoFID and BEDCA already report available carbohydrate.

---

## 2. Daily targets

### 2.1 Inputs

**Profile** (ARCHITECTURE.md type `Profile`):
`{ sex, ageYears, heightCm, weightKg, bodyFatPct?, activity, goal, rateKgPerWeek, lifts, healthFlags[] }`

| Field | Values |
|---|---|
| `sex` | `'male'` or `'female'` |
| `activity` | an id from `RULES.activityLevels` |
| `goal` | an id from `RULES.goals` |
| `lifts` | resistance training at least twice a week |
| `healthFlags` | ids from `RULES.healthFlags` |

Valid ranges are in `RULES.profileLimits`. Ages 13–17 are accepted, but those users get no targets
(see §2.5).

**Prefs** (optional): `{ proteinGPerKg?, fatPct? }`. This is the user's own choice.
- `proteinGPerKg` is clamped to `RULES.protein.overrideGPerKgPrw`.
- `fatPct` is clamped to `RULES.fat.pctOfKcalRange`.

### 2.2 Algorithm

All arithmetic is unrounded until step 12. `R` stands for RULES. `round` means round half up
(`Math.round`).

```
 1. heightM = heightCm / 100;  bmi = weightKg / heightM²

 2. FLAGS
    active = the healthFlags ticked in the profile whose appliesToSex includes sex,
             plus the derivedFlags whose `when` matches:
               ageYearsBelow: ageYears <  n
               ageYearsAbove: ageYears >  n
               bmiBelow:      bmi      <  n
    If any active flag has effect.noTargets:
      return all nutrients, bmr and tdee = null; ok = false;
             warnings = [active ids…, 'no_targets'].

 3. EFFECTIVE GOAL
    If an active flag has effect.lockGoal:
      goal = lockGoal  (add 'goal_changed' if this differs from the chosen goal)
    else if the chosen goal is in any active flag's effect.disallowGoals:
      goal = 'maintain'  (add 'goal_changed')

 4. BMR
    If bodyFatPct is a number within R.profileLimits.bodyFatPct (Katch-McArdle):
      bmr = 370 + 21.6 · weightKg · (1 − bodyFatPct/100)        → bmrFormula 'katch'
    else (Mifflin-St Jeor):
      bmr = 10·weightKg + 6.25·heightCm − 5·ageYears + (male: +5 | female: −161)
                                                                → bmrFormula 'mifflin'

 5. TDEE
    tdee = bmr × R.activityLevels[activity].factor

 6. CHANGE
    perDay = R.energy.kcalPerKgBodyWeight / 7                   (= 1,100 kcal per kg per week)
    rate   = the goal is 'maintain' ? 0 : max(0, rateKgPerWeek)
    requested = rate × perDay

 7. RAILS (R.rails)
    lose:
      cap    = min( tdee × 25%,  1000,  weightKg × 1% × perDay )
      change = min(requested, cap)                              (add 'deficit_capped' if requested > cap)
      target = tdee − change
      floor  = min( R.rails.minKcalWhenLosing[sex], tdee )
      if target < floor:
        target = floor;  change = tdee − floor                  (add 'kcal_floor')
    gain:
      cap    = tdee × 20%
      change = min(requested, cap)                              (add 'surplus_capped' if requested > cap)
      target = tdee + change
    maintain:
      target = tdee

    energyDelta            = target − tdee                      (negative = deficit)
    effectiveRateKgPerWeek = energyDelta / perDay               (signed)

 8. KCAL
    kcal = round(target / 10) × 10

 9. PROTEIN REFERENCE WEIGHT (R.proteinReferenceWeight)
    W   = 25 · heightM²
    prw = (bmi ≤ 25) ? weightKg : W + 0.4 · (weightKg − W)

10. PROTEIN
    g = prefs.proteinGPerKg (clamped)  ??  R.protein.gPerKgPrw[lifts ? 'lift' : 'noLift'][goal]
    If no pref was given and ageYears ≥ 65:
      g = max(g, 1.2)
    If an active flag has effect.maxProteinGPerKgPrw and g is above it:
      g = that cap                                              (add 'protein_capped')
    protein = round(g × prw)

11. FAT, CARBS, FIBRE
    pct   = prefs.fatPct (clamped)  ??  30
    fat   = round(pct/100 × kcal / 9)
    floor = ceil( max(20% × kcal / 9,  0.6 × prw) )
    if fat < floor:
      fat = floor                                               (add 'fat_floor')
    carbs = max(0, round((kcal − 4·protein − 9·fat) / 4))
    if carbs < 100:
      add 'low_carbs'                                           (never clamped up)
    fiber = max(25, round(14 × kcal / 1000))

12. CHECK
    |4·protein + 4·carbs + 9·fat − kcal| ≤ 5                    (always true by construction; assert it)
```

**Return value** (ARCHITECTURE.md type `TargetResult`). The keys are:
- `ok`
- `kcal`, `protein`, `carbs`, `fat`, `fiber`
- `bmr`, `tdee`, `bmi`, `prw`
- `bmrFormula`, `effectiveGoal`, `energyDelta`, `effectiveRateKgPerWeek`
- the warnings list

`bmr`, `tdee`, `bmi`, `prw`, `energyDelta` and `effectiveRateKgPerWeek` are returned unrounded;
the UI rounds them for display.

**Warnings list:**
- It always starts with `'estimate'` when `ok` is true.
- It contains the codes added above, plus the id of every active health or derived flag.
- The order after `'estimate'` is not significant, so tests should compare it as a set.

### 2.3 Activity levels (`RULES.activityLevels`)

| id | Factor | Label | Description (shown to the user) |
|---|---|---|---|
| `sedentary` | 1.2 | Mostly sitting | Desk job, studying or driving. Little walking and no exercise. |
| `light` | 1.375 | Lightly active | Housework or walking every day, or exercise 1 to 3 days a week. |
| `moderate` | 1.55 | Active | On your feet most of the day (busy housework, shop or ward work), or exercise 3 to 5 days a week. |
| `very_active` | 1.725 | Very active | Hard training 6 to 7 days a week, or a physical job. |
| `extra_active` | 1.9 | Extremely active | A physical job plus daily training, or training twice a day. |

- The default when the user is unsure is `light`.
- Exercise calories are never added on top.
- Targets are always labelled as estimates.

### 2.4 Goals

| Goal | Rate options (kg per week) | Default rate |
|---|---|---|
| `lose` | 0.25, 0.5, 0.75, 1 | 0.5 |
| `maintain` | 0 | 0 |
| `gain` | 0.25, 0.5 | 0.25 |

The default goal is `maintain`.

### 2.5 Health flags ("talk to a professional")

**Flags the user ticks** (`RULES.healthFlags`):

| id | Shown for | Effect |
|---|---|---|
| `pregnant` | women | Goal locked to `maintain` |
| `breastfeeding` | women | Goal locked to `maintain` |
| `eating_disorder` | all | `lose` disallowed; UI offers "hide calorie numbers" |
| `kidney_disease` | all | Protein capped at 0.8 g/kg PRW |
| `diabetes_hypo_risk` | all | Note only (insulin or sulfonylureas; hypo risk with a deficit or Ramadan fasting) |

**Flags derived from the profile** (`RULES.derivedFlags`):

| id | When | Effect |
|---|---|---|
| `minor` | age under 18 | No targets (`ok: false`); logging only |
| `underweight` | BMI under 18.5 | `lose` disallowed |
| `age_over_80` | age over 80 | Note only |

Every flag has a `note` written for the user. Show it whenever the flag is active. Warning texts
are in `RULES.warnings`. The tone is calm: no red and no "you failed".

### 2.6 Rounding

- **Targets:**
  - kcal to the nearest 10;
  - protein, fat, carbs and fibre to the nearest 1 g;
  - the fat floor rounded **up**;
  - half up throughout.
- **Food values:** stored per 100 g, with kcal as a whole number and macros to 0.1 g.
- **Day totals:** summed at full precision and rounded only for display.

### 2.7 Test vectors (binding)

These were computed independently from `rules.js` with a reference script. Each row is a Profile:
`sex, age, heightCm, weightKg, [bodyFatPct], activity, goal, rate, lifts, flags`. Exact equality is
expected for the rounded outputs. Unrounded values are given to 2 decimals (±0.01).

| | Profile | bmr / tdee | Rail result | **kcal** | **P / F / C / fibre** | Warnings (set) |
|---|---|---|---|---|---|---|
| A | male, 30, 175, 80, moderate, lose 0.5, lifts | 1748.75 / 2710.56 | −550 | **2160** | **156 / 72 / 222 / 30** | estimate |
| B | female, 35, 160, 85, sedentary, lose 0.75, no lift | 1514.00 / 1816.80 | −454.20 (rate 0.413) | **1360** | **87 / 45 / 152 / 25** | estimate, deficit_capped |
| C | as A with bodyFatPct 18 | 1786.96 / 2769.79 (katch) | −550 | **2220** | **156 / 74 / 233 / 31** | estimate |
| D | male, 25, 180, 70, very_active, gain 0.5, lifts | 1705.00 / 2941.13 | +550 | **3490** | **126 / 116 / 486 / 49** | estimate |
| E | female, 60, 150, 50, sedentary, lose 0.5, no lift | 976.50 / 1171.80 | target = tdee (floor) | **1170** | **60 / 39 / 145 / 25** | estimate, deficit_capped, kcal_floor |
| F | male, 68, 170, 65, light, maintain, no lift | 1377.50 / 1894.06 | 0 | **1890** | **78 / 63 / 253 / 26** | estimate |
| G | male, 55, 172, 95, light, lose 1.0, lifts, [kidney_disease, diabetes_hypo_risk] | 1755.00 / 2413.13 | −603.28 | **1810** | **66 / 60 / 252 / 25** | estimate, kidney_disease, diabetes_hypo_risk, deficit_capped, protein_capped |
| H | female, 28, 163, 62, light, lose 0.5, no lift, [pregnant] | 1337.75 / 1839.41 | 0 (goal maintain) | **1840** | **62 / 61 / 261 / 26** | estimate, pregnant, goal_changed |
| I | female, 16, 158, 50, light, lose 0.5, no lift | null | — | **null** (`ok: false`) | null | minor, no_targets |
| J | female, 24, 165, 48, light, lose 0.5, no lift | 1230.25 / 1691.59 | 0 (goal maintain) | **1690** | **48 / 56 / 249 / 25** | estimate, underweight, goal_changed |
| K | as A with prefs `{ proteinGPerKg: 2.2, fatPct: 25 }` | as A | as A | **2160** | **171 / 60 / 234 / 30** | estimate |

Intermediate values:

| Vector | Values |
|---|---|
| A | BMI 26.12, PRW 77.94 |
| B | BMI 33.20, PRW 72.40 |
| C | Lean mass 65.6 kg. Carbs are 232.5, which rounds half up to 233. This is the tie test. |
| D | Surplus cap 588.23 > 550. Carbs are 485.5, which rounds to 486. |
| E | Requested 550; cap 292.95 gives a target of 878.85; floor = min(1200, 1171.80) = 1171.80 |
| F | Protein 1.2 g/kg, because of the age 65+ rule |
| G | BMI 32.11, PRW 82.38, protein 0.8 g/kg |

---

## 3. Food record format

Every file `app/data/foods-*.js` is `export default [ …records ]`. `app/data/index.js` exports
`RULES` and `FOODS` (one flat array).

| Field | Status | Meaning and rules |
|---|---|---|
| `id` | HARD | Permanent and unique across all files. Kebab-case, with prefix `pk-` (Pakistani dishes and Pakistani packaged foods), `es-` (Spanish), `med-` (Mediterranean and Middle Eastern), or `intl-` (everything else, including basic foods). A style variant has its own id, e.g. `pk-chicken-karahi-home` and `pk-chicken-karahi-dhaba`. **Never rename a shipped id.** |
| `name` | HARD | English display name, short and plain, e.g. "Chicken karahi (home-made)". |
| `nameUr` | Lab-required for `pk-` | Urdu script, e.g. `چکن کڑاہی`. |
| `nameRoman` | Lab-required for `pk-` | Roman Urdu as people type it, e.g. `chicken karahi`. |
| `aliases` | HARD (may be `[]`) | Other spellings and names. **Include WhatsApp-style Roman Urdu** (see §4.6), Spanish names for Spanish foods, and English synonyms. |
| `group` | HARD | One id from `RULES.vocab.groups`. Drives the kcal range, the fibre-zero rule and serving sanity. |
| `state` | HARD (Lab) | Exactly what the numbers describe, e.g. "cooked, as served with gravy, edible portion (bones removed)", "raw", "dry, as sold", "as served with milk and 1 tsp sugar per cup". |
| `style` | SOFT | One of `home`, `restaurant`, `dhaba` or `street`. Use only when the dish has style variants. |
| `family` | SOFT | Kebab-case id shared by all style variants of one dish, e.g. `chicken-karahi`. Required when `style` is set. |
| `per100g` | HARD | `{ kcal, protein, carbs, fat, fiber }`, all numbers ≥ 0, plus optional `sugars`, `satFat` (g) and `sodium` (mg). Values are per 100 g **as eaten** (cooked, oil included, edible part only). kcal is a whole number; the others have at most 1 decimal. |
| `addedFatPer100g` | Lab-required when `source.method` is `recipe` | Grams of cooking oil or ghee in 100 g as served. Must be ≤ `per100g.fat`. |
| `servings` | HARD | At least one serving. Each is `{ id, label, labelUr?, grams, default? }`. Rules: `id` is kebab-case and unique within the food, and never `g` (reserved for raw grams); `label` names **one** unit, e.g. "1 roti (medium)" or "1 katori (medium)"; `grams` is the edible weight of one unit; **exactly one** serving has `default: true`. |
| `tags` | HARD | Ids from `RULES.vocab.tags`. At least one cuisine tag and exactly one of `halal` or `halal-check`. `vegan` requires `vegetarian`. |
| `slots` | SOFT | Meal-slot hints: ids from `RULES.mealSlots.default` (or `.ramadan`), e.g. `['breakfast']` for paratha. Used to rank search results. |
| `source.citation` | HARD | See §7.3. |
| `source.method` | HARD (Lab) | `direct`, `recipe`, `label` or `analogue`. |
| `source.confidence` | HARD (Lab) | `A`, `B` or `C` (§4.4). `A` is allowed only with `direct`. |
| `source.reviewer` | HARD (Lab) | Id of the person who last checked the numbers against the source: the researcher at hand-off, then `ayesha` after review. |
| `source.date` | HARD (Lab) | `YYYY-MM-DD` of entry or last check. For `label`, the date the label was read. |
| `source.notes` | SOFT | Free text, e.g. assumptions or conversions ("USDA carbs by difference minus fibre"). |

**v1 has no pork and no alcohol.** The data gate rejects the banned words in `RULES.vocab.banned`.
"Chicken sausage", "beef pepperoni" and "vinegar" are allowed.

### Example (direct record)

```js
{
  id: 'intl-chicken-breast-roasted',
  name: 'Chicken breast, roasted (no skin)',
  nameUr: 'مرغی کا سینہ، روسٹ',
  nameRoman: 'murghi ka seena',
  aliases: ['chicken breast', 'grilled chicken', 'boneless chicken', 'chikan', 'pechuga de pollo'],
  group: 'meat-fish',
  state: 'cooked (roasted), meat only, no skin, no bone',
  per100g: { kcal: 165, protein: 31.0, carbs: 0, fat: 3.6, fiber: 0, satFat: 1.0, sodium: 74 },
  servings: [
    { id: 'piece', label: '1 breast (cooked)', grams: 120, default: true },
    { id: '100g', label: '100 g', grams: 100 },
  ],
  tags: ['international', 'halal', 'gym'],
  slots: ['lunch', 'dinner'],
  source: {
    citation: 'USDA FDC SR Legacy 171477',
    method: 'direct',
    confidence: 'A',
    reviewer: 'javier',
    date: '2026-10-13',
    notes: 'Serving: FNDDS chicken breast, 1 breast (skin not eaten) = 120 g.',
  },
}
```

### Example (composite record: field shape only, values are placeholders)

```js
{
  id: 'pk-chicken-karahi-home', name: 'Chicken karahi (home-made)', nameUr: 'چکن کڑاہی',
  nameRoman: 'chicken karahi', aliases: ['karahi', 'karai', 'kadai', 'kadhai', 'murgh karahi'],
  group: 'curry-meat', style: 'home', family: 'chicken-karahi',
  state: 'cooked, as served with gravy, edible portion (bones removed)',
  per100g: { kcal: …, protein: …, carbs: …, fat: …, fiber: … }, addedFatPer100g: …,
  servings: [ /* katori-small, katori (default), katori-large, tbsp — see §5 */ ],
  tags: ['pakistani', 'halal'], slots: ['lunch', 'dinner'],
  source: { citation: 'Recipe R-pk-chicken-karahi-home (research/recipes/pk-chicken-karahi-home.md)',
            method: 'recipe', confidence: 'C', reviewer: 'zainab', date: '2026-10-14' },
}
```

---

## 4. Vocabularies (all in `RULES.vocab`)

### 4.1 Food groups (`group`)

Each group has:
- a kcal per 100 g range;
- whether fibre must be zero;
- the allowed gram range for one serving;
- whether the dish is "katori-served".

| id | Examples | kcal/100 g | Fibre 0 | Serving g | Katori |
|---|---|---|---|---|---|
| `bread` | roti, tandoori roti, naan, sliced bread, pita | 180–380 | | 15–250 | |
| `bread-fried` | paratha, puri, bhatura | 260–450 | | 20–250 | |
| `grain-cooked` | boiled rice, plain pasta, porridge | 50–180 | | 30–500 | yes |
| `rice-dish` | biryani, pulao, khichdi, paella | 110–260 | | 30–600 | yes |
| `curry-meat` | salan, karahi, qorma, keema, nihari, haleem | 90–360 | | 30–500 | yes |
| `curry-veg` | sabzi, bhindi, aloo matar, saag | 40–250 | | 30–400 | yes |
| `daal-legume` | daal, cholay, lobia, rajma, lentejas | 60–250 | | 30–450 | yes |
| `grill-kebab` | seekh, tikka, chapli, shami, broast | 120–380 | | 15–400 | |
| `meat-fish` | plain meat, chicken, fish | 60–350 | yes | 15–400 | |
| `egg` | boiled, fried, omelette, tortilla | 40–260 | | 30–350 | |
| `dairy` | milk, dahi, paneer, cheese, cream | 30–420 | yes | 5–500 | |
| `fat-oil` | oil, desi ghee, butter | 500–900 | yes | 2–30 | |
| `fruit` | fresh fruit | 15–170 | | 5–600 | |
| `fruit-dried` | khajoor, raisins, dried apricot | 230–360 | | 3–100 | |
| `vegetable` | raw or plain vegetables, plain salad | 10–110 | | 5–400 | |
| `nuts-seeds` | nuts, peanut butter, bhuna chana | 350–720 | | 5–100 | |
| `side-dip` | raita, hummus, dressed salad | 20–350 | | 10–250 | yes |
| `condiment` | ketchup, mayo, achaar, chutney | 10–750 | | 2–60 | |
| `sugar-sweetener` | cheeni, gur, honey, jam, syrups | 240–400 | | 2–40 | |
| `drink-tea-coffee` | chai, tea, coffee | 0–160 | yes | 30–500 | |
| `drink-milk` | lassi, milkshake, doodh soda | 40–220 | | 100–600 | |
| `drink-other` | juice, soft drinks, sharbat | 0–90 | | 30–750 | |
| `sweet-dessert` | kheer, gulab jamun, jalebi, halwa | 90–500 | | 10–300 | |
| `biscuit-bakery` | biscuits, rusk, cake | 280–560 | | 5–150 | |
| `snack-fried` | samosa, pakora, fries, falafel | 150–420 | | 10–400 | |
| `snack-packaged` | crisps, nimko, crackers | 350–600 | | 5–150 | |
| `fastfood` | burgers, pizza, shawarma, rolls | 150–350 | | 50–600 | |
| `chaat` | fruit chaat, dahi bhalla, gol gappay | 60–260 | | 50–400 | |
| `soup` | yakhni, chicken corn soup, gazpacho | 10–150 | | 100–500 | yes |
| `pasta-dish` | bolognese, chow mein, macaroni | 90–260 | | 100–500 | |
| `dry-staple` | atta, besan, raw rice, dry daal, oats, cereal | 300–500 | | 5–200 | |
| `protein-supplement` | whey, protein bars | 300–430 | | 15–100 | |

If a real food falls outside its group's range, **do not force it**. Tell Ayesha. The range is
changed in `rules.js` after review; records never carry exceptions.

### 4.2 Tags

| Kind | Tags |
|---|---|
| Cuisine (at least one) | `pakistani`, `desi-chinese`, `spanish`, `mediterranean`, `middle-eastern`, `western`, `international` |
| Diet | `vegetarian`, `vegan`, `contains-egg` |
| Halal (exactly one) | `halal`, or `halal-check` (gelatine, imported or unclear products) |
| Other | `packaged`, `gym`, `fried`, `iftar` |

### 4.3 Styles

| id | Label | Roman Urdu |
|---|---|---|
| `home` | Home-made | Ghar ka |
| `restaurant` | Restaurant | Restaurant |
| `dhaba` | Dhaba | Dhaba |
| `street` | Street stall | Thela |

### 4.4 Source methods and confidence grades

**Methods:**

| Method | Meaning |
|---|---|
| `direct` | A table entry for the same food in the same state |
| `recipe` | Standard recipe calculation (§6) |
| `label` | A dated product label |
| `analogue` | A named close food |

**Confidence grades:**

| Grade | Meaning | Allowed methods | Shown to the user |
|---|---|---|---|
| A | Direct analytical match | `direct` only | — |
| B | Close analogue, label, or recipe with a published yield for that dish and consistent references | any | — |
| C | Recipe with assumed oil or yield, or a dish that varies a lot between cooks | any | "estimate" badge |

Restaurant, dhaba and street variants are always C.

### 4.5 Meal slots (`RULES.mealSlots`)

**Default slots:**

| id | Label | Share | Auto-pick hours |
|---|---|---|---|
| `breakfast` | Nashta | 25% | 04:00–11:00 |
| `lunch` | Lunch | 30% | 11:00–15:30 |
| `evening` | Shaam ki chai | 10% | 15:30–18:30 |
| `dinner` | Dinner | 30% | 18:30–24:00 |
| `snacks` | Snacks | 5% | 00:00–04:00 |

**Ramadan slots (Sprint 2):**

| id | Label | Share | Auto-pick hours |
|---|---|---|---|
| `sehri` | Sehri | 35% | 01:00–12:00 |
| `iftar` | Iftar | 25% | 12:00–19:30 |
| `dinner` | Dinner | 30% | 19:30–21:30 |
| `after_taraweeh` | After taraweeh | 10% | 21:30–01:00 |

How the hours are stored and used:
- In `rules.js`, hours are `[startMinute, endMinute)` since local midnight, so the windows tile the
  whole day.
- They only choose the default slot for a new entry. Shares guide suggestions and templates and are
  never enforced.
- `RULES.ramadan` sets ≥ 30 g protein at sehri and a fluids reminder.

### 4.6 Spelling aliases (researchers)

Search normalises case, diacritics and doubled vowels (ARCHITECTURE.md). Aliases must still cover
how people actually type, for example on WhatsApp.

| Food | Aliases to include |
|---|---|
| chai | chaye, chae, chay, cha, chaai |
| salan | saalan, salaan |
| anda | anday, ande, anda, aanda, egg |
| daal | dal, dhal, daal |
| roti | rotti, rooti, chapati, chapatti, phulka |
| chawal | chaawal, chawl, rice |
| paratha | parontha, prantha, parata |
| biryani | biryaani, bryani, biriyani |
| karahi | karai, kadai, kadhai |
| qeema | keema, kheema, qima |
| aloo | alu, aaloo |
| murgh | murg, chicken |
| gosht | gosht, ghosht |

Add the Urdu word **and** the English word. Spanish foods also get their Spanish name.

---

## 5. Servings and household measures

Every serving needs grams from a **published source**. Our Customer Panel members are personas and
never supply measurements. Cite the serving source in `source.notes` when it differs from the
nutrient source.

### 5.1 Standard household measures (`RULES.householdMeasures`)

When one of these is used as a serving, use the id shown and set grams = ml × the food's density
(§5.3).

| Serving id | Label | ml | Source |
|---|---|---|---|
| `katori-small` | Small katori | 155 | ICMR-NIN Dietary Guidelines for Indians 2024, Annexure I (standard katori C8) |
| `katori` | Katori (medium) | 200 | ICMR-NIN DGI 2024, Annexure I (C7; "1 cup/katori = 200 ml") |
| `katori-large` | Large katori | 360 | ICMR-NIN DGI 2024, Annexure I (C6) |
| `cup` | Cup (chai cup) | 200 | ICMR-NIN DGI 2024, Annexure I |
| `mug` | Mug or large cup | 250 | Pakistan Dietary Guidelines for Better Nutrition (MoPD&R and FAO, 2019): "1 cup = 250 ml" |
| `glass` | Glass | 250 | Pakistan Dietary Guidelines for Better Nutrition (2019): 8 glasses = 2 litres |
| `tbsp` | Tablespoon (bara chamach) | 15 | ICMR-NIN DGI 2024, Annexure I |
| `tsp` | Teaspoon (chhota chamach) | 5 | ICMR-NIN DGI 2024, Annexure I |

**Katori-served groups** (`katoriServed: true`) are curries, daal, vegetable dishes, plain rice and
grains, rice dishes, raita and dips, and soups.
- They must offer all four of `katori-small`, `katori`, `katori-large` and `tbsp`, using one density
  for the dish.
- The default is `katori`.
- `tbsp` (label "1 tablespoon (chamach)") covers the "taste while cooking" case. Together with the
  UI's ¼ and ½ buttons, it covers "thora sa". We do **not** define a separate named "taste" serving.

### 5.2 Reference weights (`RULES.referenceWeightsG`)

| Item | Grams | Source |
|---|---|---|
| Roti: small (6 in), medium (7 in), large (8 in) | 27 / 40 / 52 | USDA FNDDS 2707713 "Bread, chappatti or roti" |
| Paratha | 70 | FNDDS 2707715 |
| Puri | 36 | FNDDS 2707714 |
| Naan, whole 10 in | 177 | FNDDS 2707613 |
| Egg: boiled, fried | 50 / 55 | FNDDS egg portions |
| Sugar, 1 level tsp | 4.2 | SR Legacy 169655 |
| Oil: 1 tsp, 1 tbsp | 4.5 / 13.6 | SR Legacy 171411 |

A researcher may use a different weight for a specific food, such as a restaurant naan or a
Peshawari paratha, only with a cited source. If the source is weak, set confidence C.

### 5.3 Densities (`RULES.densityGPerMl`), used for ml → g

| Food type | g/ml | Source |
|---|---|---|
| Chai, milk, juice, lassi, thin daal | 1.03 | SR Legacy milk |
| Daal and thin curries | 1.00 | FNDDS dal, 1 cup = 240 g |
| Dahi and raita | 1.03 | FNDDS yogurt |
| Plain cooked rice | 0.67 | FNDDS rice, 1 cup = 158 g |
| Biryani and pulao | 0.83 | FNDDS biryani, 1 cup = 196 g |
| Oil and ghee | 0.91 | SR Legacy |
| Sugar | 0.84 | SR Legacy |

Use the food's own density when its source gives one.

### 5.4 Open (no published source found yet)

- **Karchi (serving ladle).** It is not defined. A researcher may add a `karchi` serving to a
  specific dish only with a published source.
- **"Plate" of rice or biryani.** The Pakistan guidelines' "1 plate = 100 g" is a menu-planning
  convention, not a served plate, so we do **not** use it. Until a source is found, rice uses the
  katori sizes and `cup`, and Zainab looks for a published plate weight.

---

## 6. Composite-dish method (biryani, karahi, nihari, haleem, daal, salan…)

We use the EuroFIR recipe calculation procedure (Reinivuo et al., *J Food Compos Anal* 2009). Each
composite has a recipe file `research/recipes/<record id>.md`, which is committed and reviewed.

1. **References.** Use at least 2 published Pakistani recipes (cookbook, or a reputable recipe site
   or TV chef). Cite them.
2. **Standard recipe.** List each ingredient in **raw edible grams**. For bone-in meat, use edible
   meat after removing the USDA refuse %.
3. **Ingredient values.** For each ingredient, give the IFCT 2017 code (desi raw ingredients) or the
   USDA SR Legacy or Foundation id, carbs converted per §1.
4. **Added fat.** Give oil or ghee in grams. Starting ranges, as a share of served weight:

   | Dish | Home | Restaurant, dhaba or street |
   |---|---|---|
   | Salan or karahi | 6–10% | 12–20% |
   | Daal | ~3% | 6–8% |
   | Biryani | 4–6% | 7–10% |

   State the value chosen and why. Assume all added fat is eaten unless a source says otherwise.
5. **Yield** (cooked weight ÷ raw weight). Use one of these, in order of preference:
   - a published yield for that dish or dish type (Bognár 2002, *Tables on weight yield of food and
     retention factors*; USDA Table of Cooking Yields for Meat and Poultry);
   - the FNDDS recipe for the same dish (`input_food.csv`);
   - a stated water balance.
6. **Retention.** Macros are 100% retained, except fat lost as drip in grilling (use USDA yields).
7. **Per 100 g as served** = ingredient totals ÷ cooked weight × 100, rounded to 0.1 g.
   kcal = round(4P + 4C + 9F + 2·fibre).
   `addedFatPer100g` = added fat ÷ cooked weight × 100.
8. **Cross-check.** Compare against at least one independent reference: an FNDDS or CoFID dish, or
   a published analysis. A kcal difference above 25% is investigated and written up in the recipe
   file.
9. **Variants.** Home, restaurant and dhaba are separate records with the same `family`. They differ
   in added fat, and in meat-to-gravy ratio where the references say so.
   **Sprint 2:** "kam tel" (light-oil) home variants for the top 10 dishes.
10. **Confidence.** Use C unless the yield is published for that dish and the references agree,
    which gives B.

**Recipe file template:**
- title and record id;
- references;
- ingredient table (raw g, source code, P/C/F/fibre/kcal);
- added fat;
- raw total;
- yield and its source;
- cooked weight;
- per-100 g result;
- energy check;
- cross-check;
- assumptions and confidence.

---

## 7. Sources

### 7.1 Which source for what (priority order)

| Food | Sources, in order |
|---|---|
| Raw desi ingredients (atta, rice, pulses, desi vegetables) | IFCT 2017, then USDA SR Legacy or Foundation, then Pakistan FCT 2001 (cross-check only) |
| Meat, dairy, eggs, oils, fruit, international foods | USDA Foundation, then SR Legacy, then CoFID 2021 |
| Spanish and Mediterranean foods | BEDCA, then CoFID, then USDA |
| Mixed dishes | Our standard recipe (§6), cross-checked with FNDDS, CoFID or published analyses |
| Packaged foods | The product label (dated), confidence B |
| Servings | §5 sources, FNDDS portions, or labels |

### 7.2 Tools

- `node research/usda.mjs search <words>` and `get <fdcId>`. Known issue: FNDDS rows are missing
  from its index (FNDDS uses nutrient *numbers* 208, 203, 204, 205, 291), and this has been reported
  to the owner. Until it is fixed, read FNDDS from `research/cache/usda/fndds/`.
- Downloads go in `research/cache/`, which is never committed.

### 7.3 Citation format (`source.citation`)

| Source | Format |
|---|---|
| USDA | `USDA FDC SR Legacy 171477` / `USDA FDC Foundation 2346393` / `USDA FDC FNDDS 2707713` |
| IFCT | `IFCT 2017 A019` (food code) |
| CoFID | `CoFID 2021 11-123` |
| BEDCA | `BEDCA <id> <Spanish name>` |
| Recipe | `Recipe R-<record id> (research/recipes/<record id>.md)` |
| Label | `Label: <brand> <product>, <pack size>, read <YYYY-MM-DD>` |
| Analogue | `Analogue of <source citation> (<why>)` |

### 7.4 "About the data" screen

Show this text as written:

> **Where our numbers come from**
> Every food in Katori shows its source. Numbers are per 100 g as eaten, and portions show their
> grams. Home and restaurant dishes are calculated from standard recipes and marked "estimate"
> where cooking varies a lot. Your targets are estimates too: watch your weight trend and adjust.
>
> - U.S. Department of Agriculture, Agricultural Research Service. *FoodData Central* (SR Legacy,
>   Foundation Foods, FNDDS). fdc.nal.usda.gov. Public domain.
> - Longvah T, Ananthan R, Bhaskarachary K, Venkaiah K. *Indian Food Composition Tables 2017*.
>   National Institute of Nutrition (ICMR), Hyderabad.
> - Public Health England. *McCance and Widdowson's The Composition of Foods Integrated Dataset
>   2021*. Contains public sector information licensed under the Open Government Licence v3.0.
> - Base de Datos Española de Composición de Alimentos (BEDCA), Agencia Española de Seguridad
>   Alimentaria y Nutrición (AESAN). www.bedca.net.
> - *Food Composition Table for Pakistan* (revised 2001). NWFP Agricultural University Peshawar,
>   UNICEF and the Ministry of Planning and Development.
> - ICMR-National Institute of Nutrition. *Dietary Guidelines for Indians* (2024), household measures.
> - Food and Agriculture Organization and the Government of Pakistan. *Pakistan Dietary Guidelines
>   for Better Nutrition* (2019), household measures.
> - Product labels, as printed on the date shown on each food.
>
> Katori is not medical advice. If you are pregnant or breastfeeding, under 18, have kidney
> disease, diabetes on medication, or an eating disorder, please ask a doctor or dietitian.

---

## 8. Data gates (`node research/check-foods.mjs [file…]`)

**Fail** blocks shipping. **Warn** is shown but does not block. The gates are:

| # | Gate | Level |
|---|---|---|
| G1 | `id` is kebab-case, has an allowed prefix, and is unique across **all** data files | fail |
| G2 | `name` is a non-empty string; `aliases` is an array of strings | fail |
| G3 | `pk-` records have `nameUr` (Arabic script) and `nameRoman` | fail |
| G4 | `group` is in `RULES.vocab.groups`; `state` is a non-empty string | fail |
| G5 | `per100g` has the five keys as finite numbers ≥ 0; kcal is an integer; others have ≤ 1 decimal; optional keys are numbers ≥ 0 | fail |
| G6 | **Energy:** \|kcal − (4P + 4C + 9F + 2·fibre)\| ≤ max(10% of kcal, 10 kcal) | fail |
| G7 | **Mass:** P + C + F + fibre ≤ 100.5 g; sugars ≤ carbs + 0.5; satFat ≤ fat | fail |
| G8 | **Fibre zero:** groups with `fiberZero` have fibre exactly 0 | fail |
| G9 | **Range:** kcal is within the group's `kcalPer100g` | fail |
| G10 | **Servings:** non-empty; ids kebab-case, unique and not `g`; labels non-empty; grams > 0 and within the group's `servingGrams` (except `tbsp` and `tsp`, which G11 checks); exactly one default; kcal per serving ≤ 1,500 | fail |
| G11 | **Household ids:** a serving using a `RULES.householdMeasures` id has grams/ml between 0.3 and 1.5 | fail |
| G12 | **Katori groups:** `katori-small`, `katori`, `katori-large` and `tbsp` are present, with one consistent density (±3%) | fail |
| G13 | **Tags:** all in the vocabulary; ≥ 1 cuisine; exactly one halal tag; vegan → vegetarian | fail |
| G14 | **Slots and style:** slots are valid slot ids; style is in the vocabulary; style requires family; family is kebab-case | fail |
| G15 | **Source:** citation non-empty; method and confidence valid; confidence A only with `direct`; reviewer non-empty; date is `YYYY-MM-DD` | fail |
| G16 | **Recipe records:** `addedFatPer100g` is present, ≥ 0 and ≤ fat + 0.1; restaurant, dhaba and street styles are confidence C | fail |
| G17 | **No pork or alcohol:** no banned words in name, nameRoman or aliases | fail |
| G18 | **Family:** members of a family share a group | warn |
| G19 | **Review:** reviewer is not `ayesha` yet | warn (counted) |
| G20 | **Unknown field:** the record has a key not in §3 | warn |

Kenji's official data gate (`tests/data/`) implements the same rules from this table.

---

## 9. Review process

1. **Researcher.** Writes the records and recipe files, runs `node research/check-foods.mjs <file>`
   until there are no failures, then hands off in their journal and report.
2. **Ayesha reviews:**
   - **every** composite (`method: recipe`) and every confidence-C record;
   - plus a random **20%** of the rest, chosen with a seeded shuffle and logged.

   Each review checks the numbers against the cited source, the serving weights, the names and
   aliases, and the energy check.
3. **After a pass,** `source.reviewer` becomes `ayesha` and the date is updated. If a sampled record
   fails, the whole file is re-reviewed.
4. **Kenji's data gate** runs in `npm run check`.

---

## 10. Planned for Sprint 2

- "Kam tel" home variants for the top 10 dishes, as a new style `home-light` (label "Ghar ka, kam
  tel"). This needs engineering's variant switch to accept a fifth style.
- Whole-pot recipes (portion logging), using the same §6 method.
- Ramadan mode: Ramadan slots; protein at sehri; diabetes note shown when fasting.
- A published weight for the "plate"; karchi if a source exists.

---

## 11. Sample day templates (`app/data/templates.js`, provisional)

There are three desi days built from the kickoff memo:
- 1,800 kcal cut (about 141 g protein)
- 2,550 kcal maintain (about 140 g protein)
- 3,045 kcal gain (about 170 g protein)

Each item is `{ foodId, servingId, qty, label, approx: { kcal, protein }, planned? }`, grouped by
default slot id.

| Rule | Detail |
|---|---|
| Planned ids | Items reference *planned* food ids until the Lab's review. Then Ayesha swaps in the shipped ids, recomputes totals from FOODS and removes `planned`. |
| Approx values | Hand estimates (±10%). They are not test data. |
| UI | Do not show a template unless every item resolves in FOODS. |

`app/data/index.js` does not export the templates (contract: RULES and FOODS only). Import them
directly when the feature arrives.
