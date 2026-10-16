# Katori nutrition contract

**Owner:** Dr. Ayesha Siddiqui, Lead Nutritionist (Nutrition Lab)
**Status:** Sprint 3, version 1.7.2 (2026-10-16).
- Version 1.7.2 (night shift 2026-10-16): plain-words wording for the user: the `moderate` activity description (§2.3), the source methods and confidence grades (§4.4; the researchers' meaning moves to a `rule` field that is never shown); the halal shopping guide for Barcelona as app data, `RULES.halalGuide` (§4.8, STATUS O8). Later the same night: rules self-check R4, meal-prep ingredient links (§8); no rules.js change.
- Version 1.7.1 (Sprint 3 variety add-on): alcohol as an ingredient. A product whose label lists wine, mirin, sake, beer or spirits is `not-halal` with the reason naming it; fermentation traces (brewed soy sauce) stay `check`; wine vinegar stays `halal` (§4.6, gate G21). Glycerine (E-422) of unstated origin joins the label `check` list.
- Version 1.7.0 (Meeting 005, Sprint 3 wave 1): Ramadan mode for Barcelona (§12), protein tips (§13), weight trend (§14), kam tel `home-light` variants (§6.1, gate G25), the optional `shortName` field (§3, gate G24), and `serve`/`pack` rules moved into `RULES.vocab.fieldRules`.
- Version 1.6.1 (Sprint 2 market add-on): label rule for `check` (rennet and E-471/E-472 of unstated origin, §4.6).
- Version 1.6 (Meeting 003 fix wave): the Spanish slot labels; the "thora sa" taste chip rule (§5.6); assumed plate servings and gate G23 (§5.5); notified naan and roti weights are dough weights (§5.2); dry daal density (§5.3).
- Version 1.5: the carbs-below-zero ruling; `bread-fried` minimum lowered to 200; `drink-milk` minimum lowered to 25.
- Version 1.4: meal prep for any meal (the `lunchbox` group, extra storage rows).
- Version 1.3 added the serving rules (household measures and whole-dish servings) and widens `bread-fried` to 480. Version 1.2 added skip defaults (§2.1a). Version 1.1 added the Meeting 002 changes: the halal field, seafood tags, not-halal
rules, the Spain slot preset, meal-prep storage and the `lunchbox` group.

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

### 2.1a When onboarding is skipped (`RULES.skipDefaults`, test A1)

If `sex`, `ageYears`, `heightCm` or `weightKg` is missing, for example because the user tapped
**Skip**, the app does **not** call `computeTargets`. It shows reference values instead:

| kcal | protein | carbs | fat | fibre |
|---|---|---|---|---|
| 2000 | 50 g | 260 g | 70 g | 25 g |

Sugars 90 g and saturated fat 20 g appear as label-style references.

**Source:** the EU food-label reference intakes for an average adult (Regulation (EU) 1169/2011,
Annex XIII). Fibre is the EFSA adequate intake.

**Why these values rather than no targets:**
- Users like Nasreen need one number to start with, and "left today" needs something to count down
  from.
- The Boss sees these values printed on every pack in Spain, so they are familiar and honest.
- We did not derive values from our own formula, because without a weight that would mean inventing
  a person and presenting it as personal.

**Labelling:**
- A **"Reference"** chip, not "Estimate".
- The line: *"Reference values for an average adult (2,000 kcal), as on EU food labels. Not personal
  to you."*
- A **"Set up my targets (1 minute)"** button.
- No health-flag logic runs on reference values.
- The four values are independent references, so 4P + 4C + 9F does not have to equal the kcal.

**Switching to personal targets:**
- As soon as all four of sex, age, height and weight are known, personal targets replace the
  reference, and they are labelled "estimate" as usual.
- Anything else missing takes `skipDefaults.defaultsWhenMissing`: activity `light`, goal `maintain`,
  no weight training, no health flags.
- A user aged under 18 gets the `minor` flag (no targets) at that point.

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
    room  = kcal − 4·protein − 9·fat
    if room < 0:                                    (RULING 2026-10-14: carbs never go negative)
      1. if fat > floor (a fatPct pref):
           fat = max(floor, fat − ceil(−room / 9))   (lower fat, never below its floor)
           room = kcal − 4·protein − 9·fat
      2. if room is still < 0:
           protein = floor((kcal − 9·fat) / 4)       (lower protein to the most that fits)
           add 'protein_reduced_to_fit'
    carbs = round((kcal − 4·protein − 9·fat) / 4)              (now ≥ 0)
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

**Ruling: carbs below zero (2026-10-14, for Hamza)**

A high protein preference plus the fat floor can leave no energy for carbs at a low kcal target.
Neither the fat floor (a health minimum) nor the kcal target (already railed) moves, so protein gives
way. Fat comes down first, to its floor only, if a fat preference raised it. Then protein drops to
the most that fits. The app keeps the calculation rather than refusing it. It shows the
`protein_reduced_to_fit` warning, and Profile shows the effective g/kg so the user can choose again.

With real profiles this is rare, because the rails keep kcal high enough. Feasibility needs roughly
kcal ≥ 15.4 × PRW at the extreme preferences. The rule still matters for edge cases and for any later
feature that sets kcal by hand. Kenji: test the function with these inputs directly.

**Worked example** (arithmetic only, not a reachable profile):
- kcal 1,200, PRW 100 kg, prefs `{ proteinGPerKg: 2.5 }`.
- Protein 250 g and fat floor max(26.7, 60) = 60 g leave room = 1200 − 1000 − 540 = −340.
- Fat is already at its floor, so protein = floor((1200 − 540) / 4) = 165 g.
- Carbs = 0, so 4P + 4C + 9F = 1,200 kcal exactly.
- Warnings: `protein_reduced_to_fit` and `low_carbs`.

### 2.3 Activity levels (`RULES.activityLevels`)

| id | Factor | Label | Description (shown to the user) |
|---|---|---|---|
| `sedentary` | 1.2 | Mostly sitting | Desk job, studying or driving. Little walking and no exercise. |
| `light` | 1.375 | Lightly active | Housework or walking every day, or exercise 1 to 3 days a week. |
| `moderate` | 1.55 | Active | On your feet most of the day, for example busy housework with children or work in a shop, even with no exercise. Or exercise 3 to 5 days a week. |
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

Every file `app/data/foods-*.js` (nine files, including `foods-mealprep.js`) is `export default [ …records ]`. `app/data/index.js` exports
`RULES` and `FOODS` (one flat array).

| Field | Status | Meaning and rules |
|---|---|---|
| `id` | HARD | Permanent and unique across all files. Kebab-case, with prefix `pk-` (Pakistani dishes and Pakistani packaged foods), `es-` (Spanish), `med-` (Mediterranean and Middle Eastern), or `intl-` (everything else, including basic foods). A style variant has its own id, e.g. `pk-chicken-karahi-home` and `pk-chicken-karahi-dhaba`. **Never rename a shipped id.** |
| `name` | HARD | English display name, short and plain, e.g. "Chicken karahi (home-made)". |
| `shortName` | SOFT (optional) | What a narrow row shows instead of `name` (search and details keep the full name). Rules (`RULES.vocab.fieldRules.shortName`, gate G24): (1) at most **22 characters**; (2) plain words, with no brackets `( ) [ ] { }`; (3) no leading, trailing or double spaces; (4) shorter than `name`. Add one when `name` is longer than about 22 characters. Examples: "Kam tel chicken karahi", "Chicken tikka rice box". Meeting 005 e. |
| `nameUr` | Lab-required for `pk-` | Urdu script, e.g. `چکن کڑاہی`. |
| `nameRoman` | Lab-required for `pk-` | Roman Urdu as people type it, e.g. `chicken karahi`. |
| `aliases` | HARD (may be `[]`) | Other spellings and names. **Include WhatsApp-style Roman Urdu** (see §4.7), Spanish names for Spanish foods, and English synonyms. |
| `group` | HARD | One id from `RULES.vocab.groups`. Drives the kcal range, the fibre-zero rule and serving sanity. |
| `state` | HARD (Lab) | Exactly what the numbers describe, e.g. "cooked, as served with gravy, edible portion (bones removed)", "raw", "dry, as sold", "as served with milk and 1 tsp sugar per cup". |
| `style` | SOFT | One of `home`, `home-light`, `restaurant`, `dhaba` or `street`. Use only when the dish has style variants. A `home-light` record needs a `home` record in the same family (§6.1, G25). |
| `family` | SOFT | Kebab-case id shared by all style variants of one dish, e.g. `chicken-karahi`. Required when `style` is set. |
| `per100g` | HARD | `{ kcal, protein, carbs, fat, fiber }`, all numbers ≥ 0, plus optional `sugars`, `satFat` (g) and `sodium` (mg). Values are per 100 g **as eaten** (cooked, oil included, edible part only). kcal is a whole number; the others have at most 1 decimal. |
| `addedFatPer100g` | Lab-required when `source.method` is `recipe` | Grams of cooking oil or ghee in 100 g as served. Must be ≤ `per100g.fat`. |
| `servings` | HARD | At least one serving. Each is `{ id, label, labelUr?, grams, default? }`. Rules: `id` is kebab-case and unique within the food, and never `g` (reserved for raw grams); `label` names **one** unit, e.g. "1 roti (medium)" or "1 katori (medium)"; `grams` is the edible weight of one unit; **exactly one** serving has `default: true`. |
| `pack` | SOFT (optional) | `{ grams, label }`: one shop pack of this food, for the weekly shopping list only (Meeting 004, decision A item 4). `grams` > 0 on the same basis as `per100g` (drained weight for tinned fish and jarred pulses, edible weight for eggs); `label` is a non-empty string the list can show, e.g. `'400 g jar'` or `'12 eggs'`. It has no effect on nutrition. Gate G10 checks `grams` and `label` (`RULES.vocab.fieldRules.pack`). Confirmed for Sprint 3. |
| `serve` | SOFT (optional) | `'cold'`, `'hot'` or `'either'`: how a no-cook meal-prep record (group `lunchbox`, recipe `effort: 'assemble'`) is eaten, so its row can say Cold or Microwave (Meeting 004, decision C; Mariam Review 2 #7). No effect on nutrition. Gate G10 checks the value (`RULES.vocab.fieldRules.serve`); on a record outside group `lunchbox` it warns (G20). Confirmed for Sprint 3. |
| `tags` | HARD | Ids from `RULES.vocab.tags`. At least one cuisine tag; `vegan` requires `vegetarian`; at most one seafood tag. Halal is **not** a tag any more. |
| `halal` | HARD | `{ status, reason? }`. `status` is `'halal'`, `'check'` or `'not-halal'`. `reason` is one plain, factual line, **required unless status is `halal`**. See §4.6. |
| `slots` | SOFT | Meal-slot hints: ids from `RULES.mealSlots.default` (or `.ramadan`), e.g. `['breakfast']` for paratha. Used to rank search results. |
| `source.citation` | HARD | See §7.3. |
| `source.method` | HARD (Lab) | `direct`, `recipe`, `label` or `analogue`. |
| `source.confidence` | HARD (Lab) | `A`, `B` or `C` (§4.4). `A` is allowed only with `direct`. |
| `source.reviewer` | HARD (Lab) | Id of the person who last checked the numbers against the source: the researcher at hand-off, then `ayesha` after review. |
| `source.date` | HARD (Lab) | `YYYY-MM-DD` of entry or last check. For `label`, the date the label was read. |
| `source.notes` | SOFT | Free text, e.g. assumptions or conversions ("USDA carbs by difference minus fibre"). |

**No pork meat and no alcohol, ever** (Meeting 002 amends kickoff decision 7).
- The data gate rejects the banned words in `RULES.vocab.banned`. "Chicken sausage", "beef
  pepperoni" and "vinagre" are allowed.
- **Lard words** (lard, manteca, saïm) are allowed only on records whose `halal.status` is
  `not-halal`. "Manteca de cacao" (cocoa butter) is fine.

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
  tags: ['international', 'gym'],
  halal: { status: 'halal' },
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
  tags: ['pakistani'], slots: ['lunch', 'dinner'], halal: { status: 'halal' },
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
| `bread-fried` | paratha, aloo/mooli/gobhi paratha (stuffed), puri, bhatura, tostada con aceite | 200–480 | | 20–250 | |
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
| `drink-milk` | milk and yogurt drinks: sweet and salted lassi, chaas, milkshake, doodh soda | 25–220 | | 100–600 | |
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
| `lunchbox` | **meal-prep portions for any meal**: lunch boxes, breakfast jars and preps, freezer dinners | 80–350 | | 50–800 | |

**Meal-prep group (G22).** The Boss widened meal prep to every meal. The group keeps the id
`lunchbox`, because engineering's `foods.BOX` and `foodFromRecipe` use it, but it now covers any
slot. One record is one prepared portion.

The rules:
- `slots` is required, and `slots[0]` is the **primary slot**.
- The **default** serving has the id `box`, `jar` or `portion` (labels "1 box", "1 jar",
  "1 portion").
- That serving's energy must fall in the gate band for the primary slot:

| Primary slot | Gate band (kcal) | Design target: kcal / protein / fibre (`RULES.mealPrep.targetsBySlot`) |
|---|---|---|
| breakfast | 250–650 | 300–550 / 25–40 g / ≥ 5 g |
| lunch | 450–850 | 550–750 / 35–50 g / ≥ 8 g |
| dinner | 400–900 | 500–800 / 30–50 g / ≥ 8 g |
| evening, snacks | 100–400 | 150–300 / 15–30 g / ≥ 3 g |

These bands apply to Lab records. They do not apply to recipes users build themselves.

**Exceptions to the serving-gram range:**
- **Household-measure servings** (`katori-small`, `katori`, `katori-large`, `cup`, `mug`, `glass`,
  `tbsp`, `tsp`) are fixed volumes. The density check G11 covers them instead.
- **Whole-dish servings** have the id `whole` or `whole-<word>`, e.g. a whole tortilla (742 g), a
  whole pizza or a whole handi. They are exempt from the group maximum (the minimum still applies)
  and are never the default. They are capped at 3,000 g and 4,000 kcal
  (`RULES.vocab.servingRules.wholeDish`). Users log a share with the ½ and ¼ buttons.

If a real food falls outside its group's range, **do not force it**. Tell Ayesha. The range is
changed in `rules.js` after review; records never carry exceptions.

### 4.2 Tags

| Kind | Tags |
|---|---|
| Cuisine (at least one) | `pakistani`, `desi-chinese`, `spanish`, `catalan`, `mediterranean`, `middle-eastern`, `western`, `international` |
| Diet | `vegetarian`, `vegan`, `contains-egg` |
| Seafood (at most one) | `seafood-fish`, `seafood-prawn`, `seafood-other` (squid, octopus, mussels, clams, crab, lobster) |
| Other | `packaged`, `gym`, `fried`, `iftar`, `meal-prep`, `eat-cold` |

**Seafood tags:**
- Every fish or seafood food carries exactly one seafood tag.
- A mixed dish takes the most restrictive one: other > prawn > fish. For example, paella de marisco
  is `seafood-other`.

### 4.3 Styles

| id | Label | Roman Urdu |
|---|---|---|
| `home` | Home-made | Ghar ka |
| `home-light` | Kam tel (less oil) | Kam tel |
| `restaurant` | Restaurant | Restaurant |
| `dhaba` | Dhaba | Dhaba |
| `street` | Street stall | Thela |

The order of this table is the order the app lists variants in (`STYLES` in `app/core/foods.js` must match). `home-light` is explained in §6.1.

### 4.4 Source methods and confidence grades

**Methods:**

| Method | Meaning (`rule`, for researchers) | Shown to the user after "Worked out by" (`label`) |
|---|---|---|
| `direct` | A table entry for the same food in the same state | looking it up in a national food table, for this same food |
| `recipe` | Standard recipe calculation (§6) | adding up a typical recipe: its ingredients, oil and cooked weight |
| `label` | A dated product label | reading the packet label |
| `analogue` | A named close food | using a very similar food (named in the source) |

**Confidence grades:**

| Grade | Meaning (`rule`, for researchers) | Allowed methods | Shown to the user (`label`: `description`) |
|---|---|---|---|
| A | Direct analytical match | `direct` only | **Very sure:** A lab measured this same food. The numbers should be very close. |
| B | Close analogue, label, or recipe with a published yield for that dish and consistent references | any | **Fairly sure:** From the packet label, a very similar food, or a recipe whose cooked weight is known. Close enough to count on. |
| C | Recipe with assumed oil or yield, or a dish that varies a lot between cooks | any | **Estimate:** Worked out from a typical recipe. Cooking varies, mostly in the oil, so yours may have more or less. Plus the "estimate" badge. |

The user sees only `label` and `description` (food details "How sure", About page "How sure we are
about each food"). The grading rule a researcher applies is the `rule` field and this table; it is
never shown, because Nasreen (Review 2) read "Direct match to an analysed table entry" as jargon.

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

**Spain slots** (`RULES.mealSlots.spain`, Meeting 002; labels from Meeting 003). Same ids, Spanish clock and
Spanish meal names (Urdu labels: ناشتہ / کافی, دوپہر کا کھانا, میرینڈا (شام کا ناشتہ), رات کا کھانا, اسنیکس):

| id | Label | Share | Auto-pick hours |
|---|---|---|---|
| `breakfast` | Breakfast / café | 20% | 05:00–12:30 (includes the mid-morning café) |
| `lunch` | Lunch | 35% | 12:30–16:30 (lunch box) |
| `evening` | Merienda | 10% | 16:30–20:00 |
| `dinner` | Dinner | 30% | 20:00–24:00 |
| `snacks` | Snacks | 5% | 00:00–05:00 (after midnight; Meeting 003) |

**Which preset a new user gets** (`RULES.mealSlotPresetDefault`):
- It is chosen by the device time zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
- `Europe/Madrid`, `Africa/Ceuta` and `Atlantic/Canary` get `spain`; everything else gets `default`.
- The user can switch preset or rename slots in Profile.

**Ramadan slots** (`RULES.mealSlots.ramadan`, rules 1.7.0): `sehri` 35%, `iftar` 45% (iftar and the
meal after maghrib), `after_taraweeh` 15%, `snacks` 5%. The hours, the day boundary and the reminders are in §12.

How the hours are stored and used:
- In `rules.js`, hours are `[startMinute, endMinute)` since local midnight, so the windows tile the
  whole day.
- They only choose the default slot for a new entry. Shares guide suggestions and templates and are
  never enforced.

### 4.6 Halal status (`record.halal`, `RULES.vocab.halalStatuses` and `halalRules`)

| status | Use when | Example `reason` |
|---|---|---|
| `halal` | Plant foods, dairy, eggs, fish. Meat **only** from a halal butcher or with halal certification. | (optional) |
| `check` | Possible lard (pastries), gelatine, often cooked with wine, restaurant meat in Spain, imported product without a halal seal | "Cheap pastries may use lard (manteca). Ask the bakery." |
| `check` (labels) | A packaged food whose label lists an ingredient that can be animal-derived and does not say its origin: rennet (*cuajo*) in cheese, emulsifiers E-471 / E-472 in bread and wraps, glycerine (*glicerina*, E-422) in tortillas and wraps, gelatine | "Made with rennet (cuajo) of unstated origin …" / "contains the emulsifier E-471 …". "Cuajo microbiano" or "E-471 de origen vegetal" on the label → `halal`. |
| `check` (fermentation) | A trace of alcohol from fermentation that the label does not state as an ingredient: brewed soy sauce | "Brewed soy sauce can contain a trace of alcohol from fermentation …" |
| `not-halal` | **Only** non-meat foods whose standard recipe contains lard, **or** whose label or standard recipe lists an alcoholic ingredient (wine, mirin, sake, beer, spirits, cooking wine) | "Traditionally made with pork lard (saïm)." / "The label lists red wine (vino tinto) as an ingredient." |

**Alcohol as an ingredient (rules 1.7.1, `halalRules.alcoholIngredient`):**
- **Listed ingredient → `not-halal`.** If the label (or the standard recipe) lists wine, mirin,
  sake, beer or a spirit, the food is `not-halal` and the reason names that ingredient, the same
  way lard is handled. Cooking does not change the status. Example: Hacendado teriyaki (red wine).
- **Fermentation trace → `check`.** Brewed soy sauce can carry a trace of alcohol from
  fermentation that is not an added ingredient. It stays `check` with that reason; a soy sauce or
  tamari with a halal seal is `halal`.
- **Vinegar → `halal`.** Wine vinegar, *vinagre de vino* and alcohol vinegar are vinegar, not
  alcohol. A reason that mentions "wine vinegar" is never read as a listed alcohol.
- **Restaurant dishes** that are *sometimes* cooked with wine stay `check` ("often cooked with
  wine"). Only a listed or standard-recipe ingredient makes a food `not-halal`.
- Alcoholic **drinks** still never ship (§3, `banned`), and alcohol words stay out of names and
  aliases (G17). The rule above covers foods that contain alcohol, not drinks.
- **Recipes and preps** take the worst status (below), so a prep that uses a `not-halal` sauce is
  `not-halal` and is never suggested. Use the halal swap in the recipe instead.

**Rules:**
- `reason` is required for `check` and `not-halal`. Write it as a fact, never a ruling.
- `not-halal` is never allowed in the groups `meat-fish`, `curry-meat`, `grill-kebab` or
  `lunchbox`, and its reason must name the lard or the alcoholic ingredient. Pork meat products
  never ship.
- `not-halal` foods are never suggested and never appear in templates or recipe pickers. "Halal
  only" (on by default) hides them, and search says that one item is hidden and why.
- A recipe or box takes the **worst** status of its ingredients: not-halal > check > halal.
- **Cross-contact** (shared slicers, grills, fryers) is not tagged per food. One line on the About
  screen covers it (`halalRules.crossContactNote`).
- **Seafood:** records keep `halal` status. The user's seafood choice (All / Fish and prawns / Fish
  only; the question comes in Sprint 2, default All) turns foods outside it into a `check` chip with
  "Depends on your school of thought." No rulings, no red.

### 4.7 Spelling aliases (researchers)

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

### 4.8 Halal shopping guide for Barcelona (`RULES.halalGuide`, rules 1.7.2, STATUS O8)

**Where it shows:** the About page, as its own card after the "Halal:" paragraph (Priya renders it;
see my journal 2026-10-16). The text is data in `rules.js`, not in the UI code, so the Lab can correct
it without touching `app/ui`. Shape: `{ title, intro, sections: [{ id, title, items: [string] }],
note }`; check-foods **R3** checks it.

**Sections:** (1) what Katori's `check` means ("read the label or ask"), (2) words to look for on a
Spanish label, (3) how to ask, in Spanish with English, (4) halal butchers and desi groceries in
Barcelona. Tone: facts about words and ingredients, never a ruling; differences between schools are
named (E-120, prawns) and left to the user. No shop is named or recommended.

**Facts and sources:**

| Item | What the guide says | Source |
|---|---|---|
| Ingredient list and additives | Spanish labels list every ingredient; additives appear by category plus name or E-number; the origin (plant or animal) of an additive is not required | Regulation (EU) 1169/2011 on food information to consumers, Art. 9 and 18, Annex VII Part C |
| Manteca, sebo | *Manteca*: animal fat, above all pork (lard); *sebo*: hard animal fat (suet, tallow) | Real Academia Española, *Diccionario de la lengua española* (DLE), "manteca", "sebo" |
| Llard, saïm (Catalan) | Pork lard; ensaïmada is made with saïm | Institut d'Estudis Catalans, DIEC2 "llard", "saïm"; Lab §4.6 (ensaïmada record) |
| Gelatina, E-441 | Gelatine can come from pig skin, ruminant hides and bones, poultry or fish. It is a food ingredient, not an additive, in today's EU list, so a few older or imported labels still use the old number E-441 | Regulation (EC) 853/2004 Annex III Section XIV (raw materials for gelatine); Regulation (EC) 1333/2008 Annex II (gelatine not listed) |
| E-120 | Cochineal, carminic acid, carmines: colour from the insect *Dactylopius coccus* | Regulation (EU) 231/2012 (specifications), E 120 |
| E-471, E-472a–f | Mono- and diglycerides of fatty acids and their esters, made from edible fats and oils, which may be plant or animal | Regulation (EU) 231/2012, E 471, E 472a–f; Lab §4.6 `check` (labels) |
| E-422 | Glycerol, plant or animal | Regulation (EU) 231/2012, E 422; Lab §4.6 |
| Cuajo | Animal rennet comes from calf stomachs; microbial and plant coagulants exist; a plain "cuajo" does not say which | Lab §4.6 `check` (labels); Spanish cheese labels reviewed in s2-market (OFF cache) |
| Alcohol, mirin, sake, soy sauce, wine vinegar | As §4.6 (alcohol as an ingredient → `not-halal`; fermentation trace → `check`; vinegar → `halal`) | Lab rule §4.6 (rules 1.7.1) |
| Halal seal in Spain | The Garantía Halal trademark of the Junta Islámica, managed by the Instituto Halal (Córdoba), is the best-known Spanish seal; other certifiers exist | Consumer (Fundación Eroski), "Las leyes de la alimentación halal", consumer.es; Instituto Halal, institutohalal.com |
| Raval | The Raval (Ciutat Vella) is the centre of Barcelona's Pakistani community, with its mosques (oratorios) and shops | Moreras J. "¿Ravalistán? Islam y configuración comunitaria entre los paquistaníes en Barcelona". *Revista CIDOB d'Afers Internacionals* 68 (2005) |

Butchers and groceries are described in general terms only: we have no source that lets us vouch for
one shop over another.

---

## 5. Servings and household measures

Every serving needs grams from a **published source**. Our Customer Panel members are personas and
never supply measurements. Cite the serving source in `source.notes` when it differs from the
nutrient source. The one exception is the **assumed plate** (§5.5): a Lab assumption stated in
katoris and labelled "assumed".

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
  UI's "Thora sa" (¼) and ½ chips (§5.6), it covers tasting and leftovers. We do **not** define a
  separate named "taste" serving.

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

**Notified bazaar weights are dough weights.** District price notifications in Pakistan fix "naan
120 g" and "tandoori roti 100 g" (Islamabad and Hyderabad, April 2024). These are the weights of the
dough ball (*paira*), not of the baked bread: Karachi's notification fixes "a tandoori naan prepared
from 120 grams of paira" and "a tandoori roti … made from 110 grams paira" (ARY News, 14 Jan 2020).
So the served piece is the dough weight × the recipe's baked yield (plain naan 120 g → 98 g; tandoori
roti 100 g → 83 g; roghni naan 120 g → 89 g). Fixed in the Meeting 003 fix wave, when roghni naan
came out lighter than plain naan.

### 5.3 Densities (`RULES.densityGPerMl`), used for ml → g

| Food type | g/ml | Source |
|---|---|---|
| Chai, milk, juice, lassi, thin daal | 1.03 | SR Legacy milk |
| Daal and thin curries | 1.00 | FNDDS dal, 1 cup = 240 g |
| Dahi and raita | 1.03 | FNDDS yogurt |
| Plain cooked rice | 0.67 | FNDDS rice, 1 cup = 158 g |
| Biryani and pulao | 0.83 | FNDDS biryani, 1 cup = 196 g |
| Dry (bhuna) daal with no free liquid, e.g. daal mash | 0.78 | FNDDS 2707424 lentils from dried, fat added, 1 cup = 185 g |
| Oil and ghee | 0.91 | SR Legacy |
| Sugar | 0.84 | SR Legacy |

Use the food's own density when its source gives one.

### 5.4 Meal-prep storage (`RULES.mealPrep`, Sprint 2 feature)

| Component (`storage[].id`) | Fridge (≤ 5 °C) | Freezer | Source |
|---|---|---|---|
| `cooked-starch`: rice, pasta, couscous, bulgur | **1 day** | 1 month | NHS and UK FSA (*Bacillus cereus*) |
| `cooked-meat`: chicken, meat, keema, kebabs | **3 days** | 3 months | USDA FSIS (3–4 days; lower bound used) |
| `egg-dish`: tortilla, egg dishes | 3 days | do not freeze | USDA FSIS |
| `cold-salad`: tuna or chickpea salad, raita, cut salad, yogurt sauces | 2 days | do not freeze | Lab rule |
| `cooked-curry`: daal, sabzi, cooked vegetable or legume dishes | 3 days | 3 months | USDA FSIS leftovers (3–4 days) |
| `egg-muffin`: baked egg muffins and egg bites | 3 days | 2 months | USDA FSIS cold-storage chart (quiche or egg casserole) |
| `overnight-oats`: overnight oats, chia pudding (uncooked, soaked in milk or yogurt) | 3 days | do not freeze | Lab rule |
| `cooked-flatbread`: cooked parathas and rotis | 2 days | 2 months | Lab rule (quality); reheat on the tawa |
| `blended-smoothie`: smoothies with milk or yogurt made ahead in a jar (rules 1.7.2) | **1 day** | do not freeze | Colorado State University *Eating Smart Being Active*, "Fruit Smoothie" (WSU Extension reprint, 2024): "Refrigerate leftovers within 2 hours. Drink within 2 days." Lab uses 1 day for quality (oats thicken, banana browns). Not `overnight-oats` (3 days): blended fruit is a different food. |

**Use-by**
- Use-by = cooked date + the **shortest** `fridgeDays` among the box's components.
- A frozen box has no use-by. When it is moved to the fridge, use-by = the date moved + 1 day
  (`thawedFridgeDays`).
- On the use-by date the app shows "last day"; after it, "past use-by, best not to eat". Calm, no
  red.

**Handling**
- Chill within 60 min.
- Reheat once, to 75 °C right through.
- Discard after 2 h unchilled, or 1 h above 32 °C.
- In a Sunday rice batch, box 1 goes in the fridge and boxes 2–4 in the freezer.

Yusuf and Zainab record each prep's components and their storage ids in the recipe sheets
(`research/yusuf/`). The use-by rule is the same for boxes, jars and portions.

### 5.5 Open (no published source found yet)

- **Karchi (serving ladle).** It is not defined. A researcher may add a `karchi` serving to a
  specific dish only with a published source.
- **"Plate" of rice or biryani.** The Pakistan guidelines' "1 plate = 100 g" is a menu-planning
  convention, not a served plate, so we do **not** use it. No published served-plate weight has been
  found (search again 2026-10-14). Until one is, a plate is a **labelled Lab assumption**
  (`RULES.vocab.servingRules.assumedPlate`, gate G23):
  - Serving ids `plate` and `half-plate` only.
  - The label says "assumed" and gives the plate in katoris, e.g. "1 plate (home), assumed 2 katori".
  - The grams are a multiple of ½ of the food's own `katori` serving (±2%).
  - A home plate of plain chawal = **2 medium katori** (2 × 134 g = 268 g); ½ plate = 1 katori.
    Daal chawal uses the same plate: 2 katori rice + 1 katori daal = 468 g.
  - Zainab keeps looking for a published plate weight (Sprint 2). A sourced weight replaces the
    assumption and drops "assumed" from the label.

### 5.6 Portion chips and "thora sa" (`RULES.portionChips`, Meeting 003)

The UI offers quick quantity chips on every food. Each is a quantity of the food's **default
serving**, stored as `{ servingId: <default id>, qty }`; it is never a separate serving. The
**"Thora sa (a taste)"** chip is `qty 0.25` of the default serving, for tasting while cooking and
leftovers ("bacha hua"). This is acceptable nutritionally: a quarter of a katori of salan (≈ 50 g),
a quarter roti or a quarter cup of chai is a fair "taste", and logging it beats skipping it.

**Do not show the taste chip** (`portionChips.taste.hideWhen`) when:
1. the food's group is `fat-oil`, `sugar-sweetener` or `condiment`: these are add-ons already logged
   in spoons, and a quarter teaspoon of oil or sugar is not a useful entry;
2. the default serving is `tsp` or `tbsp`: it is already a taste-sized measure (hummus, peanut butter);
3. a quarter of the default serving weighs **under 5 g** (one biscuit, one date, a nugget-sized
   piece): use ½ or type grams.

Other rules:
- The chip shows its grams like the other chips, e.g. "Thora sa · ¼ katori · 50 g".
- It never becomes a default, a template item or a suggestion.
- Search words that open the help for it: `portionChips.taste.searchWords` (taste, tasting, thora
  sa, chakhna, bacha hua, leftover).
- For a big plate default (daal chawal, 468 g) the chip still means ¼ plate (117 g). That is "a little",
  not a lick of the spoon; the tablespoon serving covers the smallest tastes on katori-served dishes.

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
   | Daal | 4–8% (dry daal mash up to 8%) | 8–12% |
   | Biryani | 4–6% | 7–10% |

   State the value chosen and why. Assume all added fat is eaten unless a source says otherwise.
   (Until the Sprint 1 review the daal row said ~3% / 6–8%. Every published Pakistani daal recipe
   we read uses ¼–⅓ cup oil per cup of dry dal, and the UK Punjabi survey dals in CoFID carry
   3.6–8.3 g fat per 100 g, so the old home figure was too low.)

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
   **Sprint 3:** "kam tel" (light-oil) home variants, style `home-light`: see §6.1.
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


### 6.1 Kam tel (`home-light`) variants (`RULES.kamTel`, gate G25)

Many families cook the same dish with less oil ("kam tel"). A kam tel record is the home record's recipe
sheet with less added fat; nothing else changes.

1. **Start from the home sheet.** Use the same ingredients, water, yield method and references as the
   family's `home` record (`research/recipes/<home id>.md`).
2. **Halve the added fat.** Light added fat = **0.5 × the home sheet's added fat** in grams (all of it:
   the bhunai oil and any tarka or baghar).
3. **Keep the tarka small.** A tarka is at most **1 g of oil per 100 g served** (about 2 tsp for a 1 kg pot
   of daal), counted inside the halved total.
4. **Keep a floor.** Added fat is never below **2 g per 100 g served**: the masala still has to be bhuno'd.
   If halving would go under the floor, use the floor. If the home record has under 4 g, a light variant
   is not worth making.
5. **Cooked weight.** Light cooked weight = home cooked weight − the oil removed. Oil does not evaporate;
   the water and yield are the same as home.
6. **Per 100 g.** Recompute exactly as §6 step 7. Because the pot weighs a little less, the per-100 g
   added fat comes out at about 0.51–0.55 of the home value, and protein per 100 g rises slightly.
7. **Record fields.**
   - Same `family`, `group`, `tags`, `halal`, `slots` and servings (same ids and density) as the home record.
   - `style: 'home-light'`, name suffix " (kam tel)", aliases include "kam tel", "less oil", "light".
   - `source.method: 'recipe'`, with confidence no better than the home record's.
   - Citation: `Recipe: <home name> home sheet (research/recipes/<home id>.md), added fat <x> g → <y> g (×0.5, NUTRITION.md §6.1)`.
   - A short recipe file `research/recipes/<light id>.md` holds the changed oil line, the totals, the cooked
     weight, the per-100 g result and the energy check.
8. **Gate G25 (fail):**
   - exactly one `home` record in the same family, and only one `home-light`;
   - the same group as that home record;
   - **fewer kcal and less fat per 100 g** than the home record;
   - method `recipe`, and confidence not better than home;
   - `addedFatPer100g` at most max(2, 0.6 × home).
   It warns when the kcal drop is under 5% or the serving ids differ from the home record's.

Why half: the home ranges in §6 step 4 (salan or karahi 6–10%, daal 4–8%, biryani 4–6%) halve to 3–5%,
2–4% and 2–3%. These are amounts a home cook can still bhuno with in a non-stick pan. Halving is a Lab
convention, not a measured value, so a kam tel record keeps the home record's confidence (usually C,
"estimate"). Both the Pakistan Dietary Guidelines for Better Nutrition (Government of Pakistan and FAO,
2018) and the WHO healthy-diet fact sheet (2020) advise using less cooking oil and ghee.

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

- `node research/usda.mjs search <words>` and `get <fdcId>`, covering SR Legacy, Foundation and
  FNDDS. The FNDDS indexing bug was fixed on 2026-10-13.
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
> **Halal:** every food shows halal, check or not halal, with the reason. Cafés and restaurants may
> share slicers, grills or fryers with pork; Katori does not track this per food, so ask if it matters
> to you.
>
> *(Then the card "Halal shopping in Barcelona", rendered from `RULES.halalGuide`, §4.8.)*
>
> Katori is not medical advice. If you are pregnant or breastfeeding, under 18, have kidney
> disease, diabetes on medication, or an eating disorder, please ask a doctor or dietitian.

---

## 8. Data gates (`node research/check-foods.mjs [file…]`), G1–G25

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
| G10 | **Servings:** non-empty; ids kebab-case, unique and not `g`; labels non-empty; grams > 0 and within the group's `servingGrams` (household measures are exempt; whole-dish servings are exempt from the max, capped at 3,000 g and 4,000 kcal, and never default); exactly one default; kcal per serving ≤ 1,500; optional `pack` is `{ grams > 0, label }` | fail |
| G11 | **Household ids:** a serving using a `RULES.householdMeasures` id has grams/ml between 0.3 and 1.5 | fail |
| G12 | **Katori groups:** `katori-small`, `katori`, `katori-large` and `tbsp` are present, with one consistent density (±3%) | fail |
| G13 | **Tags:** all in the vocabulary; ≥ 1 cuisine; at most one seafood tag; no old `halal` / `halal-check` tags; vegan → vegetarian | fail |
| G14 | **Slots and style:** slots are valid slot ids; style is in the vocabulary; style requires family; family is kebab-case | fail |
| G15 | **Source:** citation non-empty; method and confidence valid; confidence A only with `direct`; reviewer non-empty; date is `YYYY-MM-DD` | fail |
| G16 | **Recipe records:** `addedFatPer100g` is present, ≥ 0 and ≤ fat + 0.1; restaurant, dhaba and street styles are confidence C | fail |
| G17 | **No pork meat or alcohol:** no banned words in name, nameRoman or aliases; lard words only when `halal.status` is `not-halal` | fail |
| G18 | **Family:** members of a family share a group | warn |
| G19 | **Review:** reviewer is not `ayesha` yet | warn (counted) |
| G20 | **Unknown field:** the record has a key not in §3 | warn |
| G21 | **Halal:** `halal { status, reason }` present; status valid; reason required unless `halal`; `not-halal` only outside meat groups and with a reason naming the lard or the alcoholic ingredient; a `halal` or `check` reason that says an alcoholic ingredient is listed ("the label lists red wine", "made with mirin"; not hedged, negated or vinegar) fails, because it must be `not-halal` (rules 1.7.1) | fail |
| G22 | **Meal prep:** `lunchbox` records have `slots` (primary slot first) and a default `box`, `jar` or `portion` serving whose kcal fits the primary slot's band | fail |
| G23 | **Assumed plate:** a `plate` or `half-plate` serving's label contains "assumed", and its grams are a multiple of ½ katori (±2%) when the food has a `katori` serving | fail |
| G24 | **Short name:** optional `shortName` is a non-empty string of at most 22 characters, with no brackets and no extra spaces, and is shorter than `name` | fail |
| G25 | **Kam tel:** a `home-light` record has exactly one `home` record in its family (and is the only `home-light`), the same group, fewer kcal and less fat per 100 g, method `recipe`, confidence no better than home, and `addedFatPer100g` ≤ max(2, 0.6 × home) (§6.1). Warns when the kcal drop is under 5% or the serving ids differ | fail |

**Rules self-checks** (also run by check-foods, rules 1.7.0):
- **R1:** every protein-tip food (`RULES.proteinNudges.suggestions`) exists, has the named serving, is not `not-halal`, and its stated protein (±0.6 g) and kcal (±1) match FOODS.
- **R2:** each Ramadan timetable has consecutive dates, `HH:MM` times, and fajr before maghrib.
- **R3:** `RULES.halalGuide` has a title, intro and note, and sections with a unique `id`, a `title` and non-empty string `items` (§4.8).
- **R4** (2026-10-16, MISTAKES M-09/M-16): meal-prep ingredient links in `app/data/recipes-mealprep.js`. Every `foodId` resolves; the prep's halal status is no better than its worst linked ingredient (§4.6); every seafood tag of a linked ingredient is on the prep; and the prep's default serving is within ±10% kcal of (sum of the linked lines) ÷ `boxes`. A line linked to a different product (full-fat cheese for light, a `check` soy sauce in a `halal` prep) fails here instead of shipping. Name-only lines (spices, olives) are not counted; every prep was within ±7% when the check was added.

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

## 10. Planned (per Meeting 002)

- **Sprint 2:**
  - meal prep on whole-pot recipes (§6 method, storage per §5.4);
  - Yusuf's library: 12 lunch boxes (shipping in Sprint 1 as `lunchbox` records), plus 5–6
    breakfast preps and 6–8 freezer dinners (desi curries welcome, with Zainab);
  - the seafood question;
  - "set my chai once".
- **Sprint 3:** Ramadan mode (§12), protein tips (§13), weight trend (§14) and kam tel variants (§6.1)
  are specified in rules 1.7.0. The final data audit is still to come.
- **Open:** a published weight for the "plate" (replaces the assumed plate, §5.5); karchi if a source exists.

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

---

## 12. Ramadan mode in Barcelona (`RULES.mealSlots.ramadan`, `RULES.ramadan`; rules 1.7.0)

The user switches Ramadan mode on and off in Profile. It changes the slots, the day boundary and two
reminders. **It never changes the kcal or macro targets**, and Katori gives no religious rulings: it does
not say who fasts, what breaks a fast, or when Ramadan starts.

### 12.1 Slots

| id | Label | Share | Fallback hours | Hours when today's maghrib (M) is known |
|---|---|---|---|---|
| `sehri` | Sehri | 35% | 04:00–17:30 | day start → M − 30 min (food logged during the fasting day was eaten at sehri) |
| `iftar` | Iftar | 45% | 17:30–21:00 | M − 30 min → M + 150 min (iftar and the meal after maghrib) |
| `after_taraweeh` | After taraweeh | 15% | 21:00–01:00 | M + 150 min → 01:00 |
| `snacks` | Snacks | 5% | 01:00–04:00 | 01:00 → day start |

1. The fallback hours are set for Barcelona in Ramadan 2027 (maghrib 18:13–18:53). They tile 24 hours.
2. With a known maghrib, the app uses `slotsFromMaghrib` (`iftarStartOffsetMin: -30`,
   `afterTaraweehStartOffsetMin: 150`, `afterTaraweehEndMinutes: 60`). Example for 8 Feb 2027 (M 18:16):
   iftar 17:46–20:46, after taraweeh 20:46–01:00, snacks 01:00–04:00, sehri 04:00–17:46.
3. M + 150 min is about when taraweeh ends in Barcelona: isha is at 19:42–20:20 in this period, and
   taraweeh takes about an hour after it.
4. The old `dinner` slot is folded into `iftar`. Sehri is usually one meal and iftar is usually two, so
   iftar carries the largest share.

### 12.2 Day boundary (DECISIONS 2026-10-13, the 04:00 rule)

1. Outside Ramadan the logging day starts at `settings.dayStartMinutes` (04:00).
2. In Ramadan mode it starts at
   **max(01:00, min(settings.dayStartMinutes, fajr − 120 min))** (`RULES.ramadan.dayStart`).
3. As a result, sehri (eaten in the 2 hours before fajr) always lands on the new fasting day, and
   after-taraweeh food (before 01:00) stays on the day it follows. This is the property the decision asks for.
4. Barcelona 2027: the boundary is 04:00 until 25 Feb. It then moves a minute or two earlier each day,
   reaching 03:42 on 9 Mar (fajr 05:42).
5. Without fajr times (the table does not cover the date and the user has typed none), the boundary is
   the plain 04:00 rule.

### 12.3 Fajr and maghrib times (`RULES.ramadan.timetables.barcelona2027`)

1. **Source.** Computed with adhan-js 4.4.3 (Batoul Apps), Muslim World League method (fajr when the sun is
   18° below the horizon; maghrib at sunset), for Barcelona at 41.3874 N, 2.1686 E. Times are CET (UTC+1);
   Spain's summer time starts on 28 Mar 2027, after Ramadan.
2. **Cross-check.** The ihadis.com Barcelona Ramadan calendar gives 8 Feb 2027 as sehri 06:22 and
   iftar 18:16, which matches the table exactly.
3. **Dates.** Ramadan 2027 is expected to run from a first fast on 8 Feb to a last fast on 9 Mar (Wego,
   "Ramadan 2027 in Spain"). The Comisión Islámica de España sets the final dates by moon sighting. The
   table covers 6 Feb to 11 Mar (34 days), so it holds either way. **The user picks the start date.**
4. **The table, every 7 days** (rules.js has every day):

   | Date | Fajr | Maghrib |
   |---|---|---|
   | 8 Feb | 06:22 | 18:16 |
   | 15 Feb | 06:14 | 18:25 |
   | 22 Feb | 06:05 | 18:33 |
   | 1 Mar | 05:55 | 18:42 |
   | 8 Mar | 05:44 | 18:50 |

5. **User edits** (`RULES.ramadan.userEdit`).
   - The user can set a fixed offset from −30 to +30 minutes for fajr and for maghrib, to match their
     mosque's timetable. Mosques in Spain use different fajr angles.
   - The user can also type the times for a single day.
   - Outside the table (another city or year), the user types the times. A typed time carries over to
     the next days until it is changed.
6. The app says next to the times: "Times are for planning. Use your mosque's timetable if it differs;
   you can change them here."

### 12.4 Protein at sehri (`RULES.ramadan.sehriProtein`)

1. **Sehri protein goal** = min(30 g, max(20 g, round(0.4 × PRW)), round(40% × daily protein target)).
2. **Why 0.4 g/kg:** about 0.4 g/kg per meal spreads protein well (Schoenfeld & Aragon, *JISSN* 2018;
   15:10). With two main meals a day, sehri carries a big share, and protein also helps keep hunger away
   through the fast. `minProteinGAtSehri: 30` stays in rules.js as the cap.
3. **Examples:**
   - PRW 75 kg, target 120 g → 30 g.
   - PRW 55 kg, target 66 g → min(30, 22, 26) = 22 g.
4. **How it shows:** while sehri is the current slot and the sehri protein logged so far is under the
   goal, the sehri slot header shows "Sehri so far: {eaten} g protein. Ideas that add some:" followed by up
   to 3 foods from `proteinNudges.suggestions.sehri` (§13.3).
5. This line is the day's protein tip: it counts toward the one-a-day limit and follows the same off
   switch.
6. It never shows when targets are null or when the `kidney_disease` flag is on.

### 12.5 Fluids reminder (`RULES.ramadan.fluids`)

1. Text: "Between iftar and sehri, about 6 to 8 glasses of water keep you going through the fast."
2. It shows once in the iftar slot and once in the after-taraweeh slot of each Ramadan day. It is
   dismissible for the day, and nothing is tracked.
3. **Source:** EFSA (2010), *Scientific Opinion on Dietary Reference Values for water*, EFSA Journal 8(3):1459.
   It sets an adequate intake of total water of 2.0 L a day for women and 2.5 L for men, of which about
   80% comes from drinks. That is 1.6–2.0 L, or 6–8 glasses of 250 ml, all of which have to fit between
   iftar and sehri.

### 12.6 Health notes (`RULES.ramadan.flagNotes`)

1. When Ramadan mode is switched on, and at the top of each Ramadan day, the app shows the note for each
   active flag. These notes are calm and plain, with no red.
2. **`diabetes_hypo_risk`** (insulin or sulfonylureas): "You told us you take insulin or sulfonylurea
   tablets. Fasting with these medicines can cause low blood sugar. Please plan Ramadan with your doctor
   before it starts. Diabetes and Ramadan guidelines (IDF-DAR 2021) advise ending the fast if your sugar
   falls below 3.9 mmol/L (70 mg/dL), or if you feel shaky, sweaty or confused."
   - Source: International Diabetes Federation and DAR International Alliance, *Diabetes and Ramadan:
     Practical Guidelines 2021*.
   - The threshold is medical advice from that guideline, not a religious ruling.
3. `pregnant`, `breastfeeding` and `kidney_disease` each get a one-line "talk to your doctor before
   Ramadan" note (the text is in rules.js).
4. Every note ends with the line `text.notRulings`: "Katori does not give religious rulings. Ask your imam
   about fasting, and your doctor about your health."

### 12.7 What the app builds (Lena, wave 2)

1. The Ramadan switch and start date.
2. The slot preset `ramadan`, with windows from maghrib (§12.1).
3. The day-start formula (§12.2).
4. The times screen: the table, the offset, per-day typing.
5. The sehri protein line, the fluids line and the flag notes.
6. Ramadan mode turns off weight-trend suggestions (§14.4).

---

## 13. Protein tips (`RULES.proteinNudges`; rules 1.7.0)

The Boss's example day is low in protein. Many desi days are: protein comes late, at dinner. A tip
**informs, never judges**, shows **at most once a day**, can be **turned off**, and **never shows when
the user is on track**.

### 13.1 When a tip shows

All of these must hold:
1. Tips are on (`enabledByDefault: true`; off by default when the `eating_disorder` flag is set, though
   the user may turn them on). They never show when targets are null or when the `kidney_disease` flag is
   on (protein is capped).
2. The day shown is today, and the user has not pressed "Not today" today.
3. No tip has shown today yet (`maxPerDay: 1`).
4. At least 1 entry is logged today (`minEntriesToday`). A day with nothing logged is not a low-protein day.
5. A checkpoint is due: the clock is past the end of the checkpoint's `afterSlot` window and before the end
   of its `suggestFor` window. The app checks when the Day view opens and after each entry.
6. Protein logged today so far is **under `minPctOfTarget`** of the protein target, **and** the gap
   (minPctOfTarget × target − eaten) is at least **15 g** (`minGapG`).

| Preset | Checkpoint (after) | Due from | Threshold | Ideas for |
|---|---|---|---|---|
| `spain` | lunch | 16:30 | 40% | Merienda |
| `spain` | merienda (`evening`) | 20:00 | 50% | Dinner |
| `default` | lunch | 15:30 | 40% | Shaam ki chai |
| `default` | `evening` | 18:30 | 50% | Dinner |
| `ramadan` | iftar | M + 150 min | 55% | After taraweeh |

**Why these thresholds:** by the end of lunch the slot shares (§4.5) put 55% of the day's food behind
the user (Spain: 20 + 35; default: 25 + 30), and 65% by the end of the evening slot. The thresholds are
about ¾ of that (40% and 50%), so a normal day with a light lunch passes. Ramadan: sehri + iftar = 80%,
and the threshold is 55%.

**Example:** a target of 120 g, Spain preset, at 16:45.
- Eaten 35 g: 40% is 48 g, and the gap is 13 g, under 15 g, so no tip.
- Eaten 30 g: the gap is 18 g, so the merienda tip shows.

The tip disappears as soon as the user is back over the threshold.

### 13.2 What a tip says (`text`)

- Title: "Protein today: {eaten} g of {target} g"
- Body: "Some ideas for {slot}, if you want more protein:" ({slot} = the slot label in the active preset)
- Each idea: "{name} · {serving} · {protein} g protein", with an **Add** button that logs that serving.
- Actions: "Not today" (hides tips for the day) and "Turn off protein tips" (the Profile switch
  "Protein tips (at most one a day)").
- Help: "A tip shows at most once a day, when the protein you have logged so far is under {pct}% of your
  target after {afterSlot}. Days on track never show one."
- The text never uses these words (`bannedWords`): only, low, should, must, bad, behind, fail,
  not enough, missed, too, warning. There are no colours that mean "bad".

### 13.3 What a tip suggests (`suggestions`)

1. The tip shows **3** ideas.
2. Foods the user logged in the last 14 days come first, in list order, then the rest of the list.
3. A food with halal status `check` appears only if the user shows `check` foods. Seafood follows the
   user's seafood setting. `not-halal` foods are never listed (check-foods R1).
4. Protein and kcal are for the serving × qty shown. The app recomputes them from FOODS; R1 keeps rules.js
   in step with FOODS.

| Slot | Ideas (protein, kcal) |
|---|---|
| Merienda / shaam ki chai (`evening`) | Skyr pot 16 g (95) · Mercadona +Proteínas yogurt 12 g (62) · 2 boiled eggs 13 g (155) · 1 shami kebab 12 g (135) · Chana chaat with protein dahi box 22 g (258) · Queso fresco batido 100 g 8 g (46) · Glass of semi-skimmed milk 8 g (124) · Handful of peanuts 7 g (166) |
| Dinner | Chicken tikka leg piece 29 g (300) · Chicken karahi (home) katori 27 g (317) · Roast chicken breast 37 g (198) · Calamar a la plancha ración 25 g (122) · Tin of tuna in water 20 g (96) · 2 seekh kebabs 16 g (189) · Katori of jarred lentils 14 g (149) · Greek yogurt 0% pot 16 g (95) |
| After taraweeh | Glass of milk 8 g (124) · Skyr 16 g (95) · Protein yogurt 12 g (62) · 2 boiled eggs 13 g (155) · Greek yogurt 0% 16 g (95) · 2 tbsp peanut butter 7 g (191) |
| Sehri | 2 boiled eggs 13 g (155) · Desi omelette (2 eggs) 14 g (293) · Anda bhurji (2 eggs) 14 g (294) · Greek yogurt 0% 16 g (95) · Skyr 16 g (95) · Katori of dahi 7 g (126) · Glass of milk 8 g (124) · Chicken and egg roti wrap 31 g (367) · Protein overnight oats jar 29 g (479) · Queso fresco batido 8 g (46) |

All ids are shipped records (see rules.js). Every item is halal; the tuna and calamar carry seafood tags.
Roasted chana (bhuna chana, about 20 g protein per 100 g) would suit merienda well but has no record
yet: it is requested from Zainab.

### 13.4 What the app builds (Lena, wave 2)

1. The checkpoint logic (§13.1) in core.
2. The tip card on today's Day view, with Add, Not today and Turn off.
3. The Profile switch.
4. Settings `proteinTips: boolean` and `proteinTipHiddenOn: date`.
5. The sehri line (§12.4) uses the same card.

---

## 14. Weight trend (`RULES.weightTrend`; rules 1.7.0)

Daily weight moves by a kilo or more with water, salt and glycogen, so single weigh-ins mislead. The app
shows a smoothed trend and a weekly rate, and it may **suggest** a target change. **It never applies a
change by itself.**

### 14.1 Smoothing

1. **Method:** an exponential moving average over calendar days (the "trend" of J. Walker, *The Hacker's
   Diet*, 2005, which uses 10% smoothing).
2. **Parameter:** `alphaPerDay = 0.1`.
3. **Irregular days:** a reading d days after the previous one gets weight 1 − 0.9^d. For example, a 1-day
   gap gives 10%, a 7-day gap 52%, and a 30-day gap 96%, so after a long gap the trend effectively
   restarts.
4. **Seed:** the first entry.
5. **Display:** the trend line and the trend value show from **5 entries spanning at least 7 days**
   (`display`), with the trend to 0.1 kg. Before that, the app shows `text.tooFew`.

### 14.2 Weekly rate

1. The rate is the least-squares slope of the raw readings in the **last 28 days**, × 7, in kg a week,
   shown to 0.1 kg.
2. It shows from **6 entries spanning at least 14 days** in that window (`rate`).
3. Text: "Trend: {rate} kg a week over the last {weeks} weeks."

### 14.3 When to suggest a target change

1. **All of these must hold:**
   - the rate window has at least **10 entries spanning 21 days**;
   - the rate differs from the goal's pace (lose −r, maintain 0, gain +r) by **more than 0.25 kg a week**;
   - there has been no target or goal change, and no accepted suggestion, in the last **28 days**;
   - no dismissal in the last **14 days**.
2. **Size:** change = −(rate − pace) × 7,700 / 7 kcal a day, rounded to 50 kcal and capped at ±200 kcal.
3. **Example:** goal −0.5 kg a week, trend −0.1. The difference is +0.4, which gives −440, capped to
   **−200 kcal a day**.
4. **Inside the rails** (§2.2, `RULES.rails`). The new target must still respect:
   - when losing, the deficit caps (25% of TDEE, 1,000 kcal, 1% of body weight a week) and the floor
     (1,200 kcal for women, 1,500 for men);
   - when gaining, the surplus cap (20% of TDEE).

   If the rails leave no room in the suggested direction, there is no suggestion.
5. **Fast loss:** if the trend is losing more than **1% of body weight a week**, the app suggests eating
   more even when that is within 0.25 kg a week of the goal.
6. **Text:** "Your trend is {rate} kg a week and your goal pace is {goal} kg a week. To match your goal, your
   daily target could be {newKcal} kcal ({change} kcal)."
   - Buttons: "Use {newKcal} kcal" and "Not now".
   - Accepting stores a kcal override (`resolveTargets`). Protein stays the same; Lena decides how fat and
     carbs follow.

### 14.4 Never suggest

1. In Ramadan mode.
2. With the `pregnant`, `breastfeeding` or `eating_disorder` flags.
3. When targets are null.

### 14.5 What the app builds (Lena, wave 1)

1. `app/core/weight.js` already reads these keys.
2. Still to add:
   - the `display` minimums;
   - `suggest.minEntries`, the cooldown and the snooze;
   - the never-list (§14.4);
   - a ceiling for gain in the rails (today only `floorKcal` is passed);
   - the fast-loss rule (§14.3.5).
3. Tip shown with the log: "Weigh at the same time each day, ideally in the morning before eating or
   drinking."
