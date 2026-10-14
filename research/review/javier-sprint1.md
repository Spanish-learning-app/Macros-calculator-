# Nutrition Lab review: Javier Morales, Sprint 1

**Reviewer:** Dr. Ayesha Siddiqui · **Date:** 2026-10-14
**Scope:** `foods-basics.js` (43), `foods-intl.js` (20), `foods-es-med.js` (27), `foods-pk-packaged.js`
(11), for **101 records** in total. That is the 98 records delivered plus raita, hummus and tostada,
which were released after the rules v1.3–1.4 fixes.
**Gate status:** `node research/check-foods.mjs` passes all 101 records.

## Method

Per NUTRITION.md §9, I reviewed 42 records:
- **Every composite.** That is the 17 `method: recipe` records. I read each recipe sheet in
  `research/recipes/`, checked the ingredients against the citations, and checked the oil, the
  yield, the energy and the cross-checks.
- **Every flagged or analogue record:** 9 records, plus hummus as a released record.
- **A seeded 20% sample of the rest.**
  - Pool: the 74 direct and label records that are not flagged, sorted by id.
  - Shuffle: Fisher–Yates driven by mulberry32, seeded with the FNV-1a hash of `"javier-sprint1"`
    (4186115464).
  - The first 15 were taken.
  - The script was a scratch copy and was not committed. Re-running it on the same 74 ids gives the
    same 15.
- **Source checks.**
  - USDA records were checked with `node research/usda.mjs get <id>`, which includes FNDDS since the
    fix.
  - BEDCA records were checked against the cached XML in `research/cache/bedca/`.
  - CoFID records were checked against `research/cache/cofid/proximates.tsv`.
  - Labels were checked against the cached Open Food Facts JSON in `research/cache/off/`.

## Verdicts

**Counts:** 42 reviewed. **39 pass**, **3 fix** (es-paella-de-pollo, es-lentejas, med-falafel),
**0 reject**. The fixes are small, and **none blocks shipping**; the records can ship now and be
corrected in Javier's next build. There are also two cross-cutting requests at the end. They touch 7
plain-meat records and the Greek yogurt record.

### Composites (17)

| Record | Verdict | Notes |
|---|---|---|
| es-tortilla-de-patatas | **PASS** | 5 eggs, 405 g potato, 150 g onion and 52 g oil retained (UCM 13 g per ración); 742 g cooked. 158 kcal, bracketed by the Mercadona (193) and Lidl (158) labels. The CoFID UK omelette (112) is explained. The `whole` serving (742.4 g) is now present. |
| es-lentejas | **FIX** (minor) | The numbers pass: 101 kcal, between the two Spanish labels (94 and 128). Add a `halal.reason` (optional for halal): *"Our recipe uses halal beef sausage. Lentejas in Spanish bars and menús usually contain chorizo (pork)."* The Boss will search "lentejas" at a menú del día, so the record must not imply that restaurant lentejas are halal. |
| es-garbanzos-con-espinacas | PASS | The recipe and broth water balance are sound. 98 kcal against Carrefour's 81; the Nestlé label (69) is explained. |
| es-paella-de-pollo | **FIX** | The numbers are exact against BEDCA 2597 (172 kcal), so the values pass. The halal status should be **`check`** with reason *"Halal when you cook it with halal chicken. Restaurant chicken in Spain is rarely halal."* The Meeting 002 rule is that meat is `halal` only from a halal butcher, and paella is mostly eaten out. |
| es-gazpacho | PASS | 49 kcal, within 7% of CoFID homemade. BEDCA (34) is a leaner recipe. Vinegar is fine (vinagre is allowed). |
| es-pan-con-tomate | PASS | 4 × 60 g payés bread (UCM), toasting factor from BEDCA moisture, about 10 g oil per slice. 247 kcal. |
| es-pisto | PASS | 83 kcal, within 1% of CoFID ratatouille. Oil follows UCM household rations. |
| es-croquetas-de-pollo | PASS | 278 kcal, against FNDDS 262. The BEDCA 2268 value (154) is an outlier (probably not fried as eaten), and the note covers it. The `check` status and reason are right. |
| es-ensalada-mixta | PASS | The tuna and egg salad is well specified. `seafood-fish` is present. |
| es-cortado | PASS | 40 ml espresso + 31 g whole milk. |
| es-cola-cao-con-leche | PASS | Label powder (14 g) + 200 ml semi-skimmed milk (BEDCA 916). |
| es-bocadillo-de-tortilla | PASS | 80 g barrita + ⅛ tortilla (92.8 g). Within 12% of BEDCA's generic bocadillo. |
| es-bocadillo-de-atun | PASS | `seafood-fish` is present. 191 kcal. |
| es-tostada-con-aceite | PASS | Released into `bread-fried` (rules v1.3: 260–480, now 200–480). 2 × 30 g barra (UCM) + 20 g olive oil, which is between the references' 6.75 and 13.5 g per slice. 456 kcal/100 g is plausible for oil-dressed toast. C is correct. |
| intl-salad-kachumber | PASS | Plain USDA vegetables; 21 kcal. |
| intl-raita | PASS | Released. 49 kcal against CoFID raita 57 (−14%). The katori set uses one density (1.03). |
| med-chicken-shawarma | PASS (note) | 236 kcal against CoFID döner-in-pitta 248. The roll is 194.5 g (a Pakistani-style roll). **Sprint 2:** add a Barcelona kebab-shop *dürüm* serving with a cited weight; those are often 300–400 g. |

### Flagged, analogue and released (10)

| Record | Verdict | Notes |
|---|---|---|
| med-falafel | **FIX** | Javier is right that the sources disagree. CoFID 15-795 (183 kcal) is a homemade *recipe* at **60% water**. Shop falafel is fried drier: USDA SR 172455 gives 333 kcal at about 35% water, but has no fibre value, and FNDDS 2707408 (514) is an outlier. The Boss buys falafel in Barcelona, so 183 under-counts by about 40%. **Fix:** make the primary source a dated Spanish label for ready-made falafel (e.g. via OFF), keep CoFID and USDA as cross-checks, and stay at C. If no label has fibre, use USDA 172455 with fibre from the label or CoFID ratio and say so in the notes. |
| intl-beef-sausage-halal | PASS (note) | An analogue of USDA 173862 (beef frankfurter); the values match exactly. **Sprint 2:** check it against a halal sausage label sold in Barcelona. |
| pk-rusk | PASS (note) | Zwieback analogue (FNDDS 2707705); the values match exactly. This is a reasonable close analogue, so B. **Sprint 2:** find a Pakistani rusk label. If none turns up, downgrade to C. |
| pk-marie-biscuit | PASS | OFF 8964002526710 gives 452 kcal and carbs 80. The label energy equals 4·6 + 4·80 + 9·12, so the label carbohydrate includes fibre. Subtracting fibre (78.2) is correct. |
| pk-sooper-biscuit | PASS | OFF 8964002758999 matches (529 kcal; carbs 66 − 1.3). |
| pk-gluco-biscuit | PASS | OFF 8964002513482 matches (488 kcal; carbs 71.8 − 1.8). |
| pk-rio-biscuit | PASS | OFF 8964002526192 matches. The 100.7 g sum proves the label carbs include fibre. |
| intl-guava | PASS (note) | Matches USDA 173044 exactly. The serving "1 fruit" = 55 g is a US size, while Pakistani guavas are larger; the katori serving covers that. **Sprint 2:** find a published South Asian fruit weight. |
| intl-dates | PASS | Matches USDA 171726 (Deglet Noor) exactly. 7.1 g and 8 g per date agree with UCM (*dátil sin hueso* 8 g). Close enough for Pakistani semi-dry dates. |
| med-hummus | PASS | Released. Matches CoFID 13-556 exactly (307 kcal); Spanish labels (294–300) agree. The default serving is `tbsp`, which is sensible for a dip. |

### Seeded sample (15): all PASS

Every value matches its source to the stored rounding.

| Record | Source | Check |
|---|---|---|
| intl-bread-white | USDA Foundation 325871 | exact |
| intl-pistachios | USDA 170185 | exact |
| intl-oats-porridge | USDA 173905 | exact |
| intl-cucumber | USDA 168409 | exact |
| intl-chicken-sandwich | USDA FNDDS 2706990 | exact. The FNDDS item is "chicken salad sandwich", and the record name is fair. |
| intl-burger-beef | USDA 170694 | exact; `check` with reason is right |
| intl-butter | USDA 173410 | exact |
| es-croissant | BEDCA 2669 | exact (1698.9 kJ = 406 kcal) |
| intl-fries | USDA 170698 | exact |
| intl-kinnow | USDA 169105 (mandarin) | exact; B for the analogue is right |
| intl-onion | USDA 170000 | exact |
| intl-potato-boiled | USDA 170440 | exact |
| intl-mutton-roasted | USDA 175304 (goat) | exact. "Mutton" = goat in Pakistan, which is correct. |
| es-lentejas-pardinas-secas | BEDCA 1065 | exact |
| intl-potato-raw | USDA 170026 | exact |

## Cross-cutting requests (not blocking)

1. **Halal reason on plain meat.** The status stays `halal`. Add the optional reason *"Assumes halal
   meat (from a halal butcher in Spain)."* to these records:
   - intl-chicken-breast-roasted
   - intl-chicken-breast-raw
   - intl-chicken-thigh-roasted
   - intl-beef-mince-cooked
   - intl-beef-mince-raw
   - intl-mutton-roasted
   - intl-beef-sausage-halal

   This follows the Meeting 002 rule that meat is halal only from a halal butcher, and in Spain
   supermarket meat usually isn't.
2. **Greek yogurt in Spain.** `intl-greek-yogurt` is USDA *nonfat*, but Spanish *yogur griego* is
   full-fat (about 10% fat).
   - Rename the record to "Greek yogurt, plain, nonfat (0%)".
   - Add a Spanish full-fat record from BEDCA 2520 (Javier already looked it up), with a 125 g pot
     serving (UCM *yogur* 125 g).
   - Give both an alias that leads to the other.
3. Pakistani Pepsi possibly being reduced-sugar: no action in Sprint 1. "pepsi" stays an alias of
   the generic regular cola (B).

## Fix list for Javier (through Omar)

| # | Record | Change |
|---|---|---|
| 1 | es-paella-de-pollo | halal → `check` with the reason above |
| 2 | es-lentejas | add the halal reason (chorizo note) |
| 3 | med-falafel | re-source to a dated Spanish ready-falafel label; CoFID and USDA as cross-checks |
| 4 | 7 meat records (one batch) | add the "assumes halal meat" reason; this is cross-cutting request 1 |
| — | intl-greek-yogurt + new es-yogur-griego | cross-cutting request 2 |

**Recording the review.** Javier sets `source.reviewer: 'ayesha'` and today's date in his build for
the **39 passed** records. The rest of the 101 stay under his own name, which is normal: the 20%
sample stands for them. The 3 fixed records get `ayesha` after I re-check the changed values.
