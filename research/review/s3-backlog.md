# Review: Sprint 3 backlog, night shift 2026-10-16 (G19 was 138)

**Reviewer:** Dr. Ayesha Siddiqui. **Date:** 2026-10-16. **Ledger:** `research/review/reviewed.mjs` (+111 ids today).

**Order (riskiest first):**
1. Yusuf's 24 new variety preps (#41–64): recipe composites, never reviewed.
2. The new base foods behind them, then every other non-recipe record still under its researcher.
3. Zainab's kam tel records: already passed on 2026-10-15 (s3-variety.md) and in the ledger; they
   leave G19 when Zainab rebuilds.

**Result:**
- **111 PASS stamped:** 18 preps, 91 base records, and pk-bhindi-home + pk-bhindi-light (ruling below).
- **6 FIX** (preps, held).
- **0 REJECT.**
- Open from before (not done tonight): med-falafel, pk-haleem-home, pk-haleem-restaurant, pk-kadhi-pakora and pk-ras-malai.

**G19:** `check-foods` still says 138, because stamps only reach `app/data` when each owner reruns
their build (I may not run builds tonight). It now prints the split: **127 already passed, waiting
for a rebuild; 11 not reviewed yet** (the 6 held preps and the 5 open Sprint 1 FIXes). After the
Javier, Zainab and Yusuf rebuilds, G19 = **11**.

## 1. Yusuf: 24 preps #41–64

**Method (same as s3-wave1):**
- I summed each prep's ingredient lines from FOODS by `foodId` and divided by `boxes`.
- I added Yusuf's own label values for lines that have no `foodId`: olives (USDA 169096), piquillo
  (USDA 168546), salmon medallions (OFF 8480000267498: 221 kcal, P 20, F 16; kJ 932 agrees), and
  mozzarella light (OFF 8480000512307: 153 kcal, P 17, F 9).
- I compared the result with the record's default serving.
- I checked that halal is the worst of the ingredients, that the seafood tags match, and that each
  meat is linked to the right cut and fat level (M-09).

| Prep | kcal Δ (record vs recompute) | Verdict |
|---|---|---|
| es-bocadillo-pollo-piquillo-box | +1% (with piquillo) | PASS |
| es-bocadillo-atun-huevo-box | +1% | PASS |
| med-chicken-shawarma-pita-box | +2% | PASS |
| intl-chicken-caesar-salad-box | +2% | PASS |
| intl-beef-bolognese-pasta-box | 0% (lean mince, right cut) | PASS |
| intl-chicken-broccoli-pesto-pasta-box | 0% | PASS |
| intl-tuna-tomato-pasta-box | +2% (with olives) | PASS |
| med-greek-chicken-pasta-salad-box | +2% (with olives) | PASS |
| intl-chicken-burrito-bowl-box | +1% | PASS |
| es-pollo-patatas-pimientos-horno-portion | −4% | PASS |
| med-salmon-patatas-judias-portion | −1% (with salmon label) | PASS (note a) |
| intl-chili-con-carne-rice-portion | 0% (lean mince) | PASS |
| med-shakshuka-garbanzos-portion | −1% | PASS |
| med-harira-beef-portion (C) | 0% (beef cubes, right cut) | PASS |
| es-crema-verduras-huevo-garbanzos-portion | −2% | PASS |
| es-tostada-tomate-atun-aguacate-portion | +1% | PASS |
| med-menemen-portion | −1% | PASS |
| intl-egg-bean-breakfast-tacos-portion | −2%; `check` from the corn tortilla (E-422), correct | PASS |
| intl-chicken-quinoa-peanut-salad-box | +2% | **FIX 1** (halal link) |
| intl-chicken-rice-noodle-stir-fry-box | −1% | **FIX 1** (halal link) |
| intl-caprese-snack-box | +1% with light mozzarella (−37% against the linked record) | **FIX 2** (M-09 link) |
| intl-chicken-spinach-pasta-bake-portion | +1% with light mozzarella (−13% against the linked record) | **FIX 2** |
| intl-egg-mozzarella-breakfast-roll-portion | 0% with light mozzarella (−9% against the linked record) | **FIX 2** |
| intl-banana-oat-smoothie-jar | +2% | **FIX 3** (storage) |

**FIX 1, Yusuf (with Javier).** In `research/yusuf/build.mjs`, the DB map sends `soy-sauce-halal` to
`intl-soy-sauce`, a `check` record. The two preps say `halal`, which breaks the worst-status rule
(§4.6). There are two ways to fix it:
- **(a) Preferred:** Javier adds `intl-soy-sauce-halal`. It uses the USDA 174277 values, status
  `halal`, and the reason "Assumes a soy sauce with a halal logo (Asian or Pakistani grocery)". This
  works the same way as the "Assumes halal meat" records. Yusuf then maps `soy-sauce-halal` to it.
- **(b)** Set both preps to `check` with the soy-sauce reason.

**FIX 2, Yusuf (with Javier).** The DB map sends `mozzarella-light` to `intl-mozzarella-fresh`, the
full-fat USDA 170845 at 299 kcal. The recipes are calculated with Hacendado light at 153 kcal. The
record numbers are right, but the ingredient link is the M-09 mistake: when the user taps the
ingredient, they see full-fat cheese, and any recompute from the links undercounts the light cheese
by about 2×. The fix:
- Javier adds `es-mozzarella-light`, from the OFF 8480000512307 label: 153 kcal, P 17, C 1, F 9,
  label/B, halal, with the coagulante microbiano reason from Yusuf's `labelCheck`. The pack is a
  125 g ball.
- Yusuf maps `mozzarella-light` to it and rebuilds.

**FIX 3, Yusuf.** In `61-banana-oat-smoothie-jar.mjs`, change the component storage from
`overnight-oats` (3 days) to `blended-smoothie` (1 day, rules 1.7.2). The app's use-by then agrees
with "drink within 24 hours".

**Notes:**
- a. Salmon medallions are a name-only line, so the numbers are right but the app has no record to
  show. Nice to have: Javier adds the Hacendado medallones record (OFF 8480000267498).
- b. Name-only olives and piquillo make the recompute from FOODS alone read up to +31% in fat. With
  Yusuf's label values the fat agrees within 7%. They could get records later.

## 2. Base foods: 91 records, all PASS (med-falafel stays FIX)

- **Scope:** every record still under its researcher that is not a recipe: Javier's basics, es-med,
  intl and pk-packaged, plus Zainab's puri, pakora, gulab jamun, sheer khurma and cold-drink cola.
  This is 100% of them, not a sample.
- **USDA (55):** per 100 g, kcal, protein and fat match `research/cache/usda/index.json` exactly, and
  available carbs (by difference − fibre) agree within 0.1 g.
- **Labels (25):** each matches its cached OFF page (the only 3 differences are explained here). Two OFF kcal fields are typos, and the records
  use the kJ figure, which is correct:
  - quinoa pouch: kJ 784 = 187 kcal;
  - corn tortilla: kJ 986.7 = 236 kcal.
- **pk-cola-regular:** 44 kcal per 100 ml ÷ 1.038 g/ml = 42 kcal per 100 g. Correct.
- **CoFID (4):** puri 366, pakora 293, gulab jamun 306 and sevyian 119 match CoFID KCALS, protein and
  fat exactly. CoFID CHO is in monosaccharide equivalents and the records store weight (÷ 1.05–1.1),
  as §1 requires.
- **IFCT (3):** atta A019 320, chana dal B001 329 and masoor dal B013 322 match exactly.
- **BEDCA (4):** olive oil, barra, integral and magdalena match kJ ÷ 4.184 exactly, and their carbs
  and fibre agree.
- **Servings, names and halal:** I read all of them. The `check` reasons are factual (pizza chain,
  nuggets, sliced bread E-471/472e, magdalena manteca, tortilla E-422).
- **Note c:** `pk-cola-regular` and `pk-cold-drink-cola` are the same food in two records, with
  different can sizes: 330 ml (Spain) and 250 ml (Pakistan). Both are labelled correctly. Javier and
  Zainab should keep one and move the other's servings into it.

## 3. pk-bhindi-home (Sprint 1 FIX): closed by ruling

- **Evidence:** every Pakistani recipe I found uses at least as much oil as our record:
  - Tea for Turmeric: ¼ cup per lb of okra.
  - Flour & Spice: a little under ¼ cup per lb.
  - Masala TV (Shireen Anwar), "Bhindi kalonji": ½ cup per 250 g, oil not drained
    (https://masala.tv/bhindi-kalonji-recipe/, read 2026-10-16).

  So 52 g per lb is the low end.
- **The analysed dish:** CoFID 15-627 is 6 UK household samples, and they were cooked lighter. The
  water is the same as ours (74.3%), so the whole gap is the oil.
- **What the user gets:** the kam tel bhindi (97 kcal, F 5.7) sits close to the analysed value, so
  users who cook with little oil have the right record.
- **Ruling:** the numbers stay, and confidence stays C. Zainab gets an exact note and source edit
  (my journal, 2026-10-16). Both records are stamped, and pk-bhindi-light no longer waits on its
  parent.

## 4. Checks

- `node research/check-foods.mjs`: 348/348 PASS, and the rules self-checks R1–R3 PASS.
- `npm test`: see my journal for tonight's entry.

## 5. Final backlog pass (2026-10-16 evening): 14 stamped, G19 → 0 after the rebuilds

**Result:** 14 PASS stamped in `reviewed.mjs`, 0 FIX, 0 REJECT. `check-foods` now says G19 14 =
**14 passed, waiting for the owners' rebuilds; 0 not reviewed.**

### 5.1 The 6 held preps, after Yusuf's relinks

Recomputed from the linked records in `app/data/recipes-mealprep.js` (sum of the lines ÷ boxes;
name-only spices not counted):

| Prep | Linked lines | kcal record vs links | Verdict |
|---|---|---|---|
| intl-chicken-quinoa-peanut-salad-box (#49) | intl-soy-sauce-halal 20 g | 655 vs 644 (+1.6 %) | PASS, halal = worst line |
| intl-chicken-rice-noodle-stir-fry-box (#51) | intl-soy-sauce-halal 60 g | 615 vs 620 (−0.8 %) | PASS, halal = worst line |
| intl-chicken-spinach-pasta-bake-portion (#57) | es-mozzarella-light 250 g | 549 vs 542 (+1.4 %) | PASS |
| intl-egg-mozzarella-breakfast-roll-portion (#60) | es-mozzarella-light 125 g | 519 vs 521 (−0.5 %) | PASS |
| intl-caprese-snack-box (#64) | es-mozzarella-light 200 g | 239 vs 237 (+1.1 %) | PASS |
| intl-banana-oat-smoothie-jar (#61) | storage `blended-smoothie`, boxUp "within 1 day" | 516 vs 506 (+2.1 %) | PASS |
| med-salmon-patatas-judias-portion (#53, already stamped) | intl-salmon-medallions 250 g | 611 vs 620 (−1.3 %) | stays PASS; seafood-fish tag present |

The soy preps' reasons say "with a halal-certified soy sauce, as the recipe says" and name the
`check` case. Correct.

### 5.2 Javier's new records and med-falafel

- **es-mozzarella-light:** matches OFF 8480000512307 (cached in research/cache/yusuf/off): 639 kJ =
  152.8 kcal, P 17, C 1, F 9, sat 6, salt 1.5 g (sodium 600 mg). The coagulante microbiano reason
  is right. PASS.
- **intl-soy-sauce-halal:** matches USDA SR 174277 exactly (53 kcal, P 8.14, F 0.57, carbs
  4.93 − fibre 0.8 = 4.1, sodium 5493). The "assumes a halal logo" reason follows the
  assumed-halal-meat pattern. PASS.
- **intl-salmon-medallions:** matches OFF 8480000267498: 932 kJ = 221 kcal, P 20, F 16, sat 2.3,
  salt 0.885 g (354 mg sodium); raw frozen basis is stated; seafood-fish tag. PASS.
- **med-falafel (Sprint 1 FIX): closed by ruling, numbers stay (183 kcal, C).** OFF was reachable
  today. I took 20 plain chickpea falafel labels sold in Spain and nearby markets (Lidl, Carrefour,
  Eroski, Aldi, La Sirena, YGriega, SoriaNatural, Garden Gourmet and others; OFF search "falafels",
  country Spain, read 2026-10-16). I left out the dry mixes, the packs with a sauce, and the
  sweet-potato, beetroot, spinach and corn versions.
  - Median 217.5 kcal per 100 g, middle half 198–222. Ours is −16 %, which is inside 25 %.
  - CoFID 15-795 (a recipe calculation, 60 % water) is home deep-fried. The packs are pre-fried, and
    one brand (Taifun, 338) is far above the rest.
  - USDA 172455 (333 kcal, 35 % water) and FNDDS 2707408 (514 kcal, 19 % water) are much drier
    products. They are not what a Barcelona shopper buys.
  - Confidence C already tells the user the number is an estimate. Javier gets a note edit (below).

### 5.3 Zainab's 4 Sprint 1 FIXes

I checked her new references against the cached PDF (research/cache/zainab-s3/khan2019.pdf,
Table 2 and Table 3) and the cached OFF JSON. All the typed values are exact.

- **pk-haleem-home:** 137 kcal vs Khan "Haleem" 128.34 (+7 %). Water 72.4 g vs 73 g agrees. Our
  available carbs plus fibre (11.6 g) is the fair comparison with the paper's carbs by difference
  (14.6 g). PASS.
- **pk-haleem-restaurant:** +27 % against the same household analysis. The "Why" is in the recipe
  file: the Shan-pack fat (10.3 vs 5.4 g fat) with water 69.9 g. This is the restaurant style, at
  confidence C, and the comparable home record sits within 10 %. PASS.
- **pk-kadhi-pakora:** 149 vs 177.49 (−16 %). PASS, but the explanation is wrong and needs a note
  fix (below). The water does **not** agree: ours is 75.3 g, Khan's is 71.5 g. Per gram of dry
  matter the fat is the same (ours 11.7 / 24.7 = 47 %, Khan 13.85 / 28.5 = 49 %). At Khan's water
  ours would be 172 kcal and 13.5 g fat, which is −3 %. So the Peshawar kadhi was simply thicker.
  Their oil was not higher.
- **pk-ras-malai:** 155 vs Haldiram's UK 152 kcal on the label (174 from its own kJ), so +2 % to
  −11 %. The Canadian tray (257) is explained in the recipe file: more ball and a heavier syrup per
  gram. The sugar (65 g per ~1 kg milk) sits between F&S 70 g and TfT 63 g. The `contains-egg` tag
  is right (an egg in the balls). PASS.

### 5.4 Cola duplicate: keep both ids, make them distinct

The app has no id alias and no hidden flag. Search only hides `not-halal` foods
(app/core/search.js). Saved entries store `foodId` and `servingId` (app/core/days.js), so:
- **no id is deleted;**
- **no serving id is removed** from either record. Labels and the default may change.

Nothing in app/, tests/, templates or plans references either id.

The split is by **where you buy it**:
- `pk-cola-regular` becomes the Spanish shop can.
- `pk-cold-drink-cola` stays the Pakistani "cold drink" bottle. This keeps Bilal's D2 ("cold drink",
  345 ml bottle) on Zainab's record.

The exact edits are in Ayesha's journal (2026-10-16 evening entry). Both owners rebuild.
Per-100 g values are unchanged on both records, so the stamps stay.

### 5.5 New gate: check-foods R4 (meal-prep links, M-09/M-16)

`node research/check-foods.mjs` now checks every recipe in `app/data/recipes-mealprep.js`:
- each `foodId` resolves;
- the prep's halal status is no better than its worst linked line;
- linked seafood tags are carried onto the prep;
- the default serving is within ±10 % kcal of the linked lines ÷ boxes.

I tested it on a scratch copy with the old links (full-fat mozzarella and the `check` soy sauce).
It fails 4 preps: the 2 soy preps on halal, the pasta bake at −13 % and the caprese at −37 %. The
egg roll (−9 %) is under the 10 % line. All 64 current preps pass, and the largest gap is +6.9 %.
NUTRITION.md §8 is updated.
