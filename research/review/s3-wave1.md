# Review: Sprint 3 wave 1 backlog (riskiest first)

**Reviewer:** Dr. Ayesha Siddiqui. **Date:** 2026-10-15. **Ledger:** `research/review/reviewed.mjs` (24 ids stamped).

**Scope:**
- Javier's 9 seafood records (four of them with pack sizes).
- Yusuf's 15 newest preps (#26–40).
- An arithmetic check of Zainab's 17 kam tel records, not yet stamped because she is still writing tonight.

**Result:** 24 PASS, 0 FIX, 0 REJECT. There are 4 notes, listed below.

## Javier: 9 seafood records (all PASS)

| Id | Check | Verdict |
|---|---|---|
| intl-prawns-raw | USDA SR 175179: 85 kcal, P 20.1, F 0.51. Exact | PASS |
| intl-prawns-cooked | BEDCA 2337: 95.5 kcal, P 19.78, F 1.71. Exact | PASS |
| intl-squid-raw | BEDCA 807: 71.5 kcal, P 14.0, F 1.47. Exact. Pack 300 g cleaned tray | PASS |
| intl-mussels-cooked | BEDCA 824: 111.8 kcal, P 18.45. Exact. CoFID 16-390 (104) agrees; USDA 172 is the outlier | PASS |
| intl-clams-cooked | USDA SR 171975: 148 kcal, P 25.55, Na 1202. Exact. "20 small clams = 190 g" is USDA's portion | PASS |
| es-calamar-plancha | BEDCA 2320 calamar asado: 80.9 kcal, P 16.58. Exact. B is right for the asado → plancha analogue | PASS |
| es-mejillones-escabeche | Label 196 kcal, P 14, F 14. 4P + 4C + 9F = 198.8. BEDCA 2346 (167) agrees in fat. Wine *vinegar* is allowed by the rules. Pack basis is drained (69 g) | PASS |
| es-pulpo-cocido | OFF label: 100 kcal, P 22.7. It sits between BEDCA 2374 (69) and USDA 174249 (164). B, single label | PASS (note 1) |
| es-gambas-al-ajillo | Recipe sheet checked. Peeled meat 376 g (edible 0.47 of 800 g bought); oil 91 g, all counted as eaten (§6); prawn yield 0.838 from the protein ratio. FNDDS 2706465 garlic shrimp 281 vs 272 (−3%). C | PASS (note 2) |

## Yusuf: 15 preps #26–40 (all PASS)

**Method:** I summed each prep's ingredients from FOODS by `foodId`, divided by the batch count, and compared the result with the record's default serving.

| Prep | kcal Δ | Protein Δ | Halal / seafood |
|---|---|---|---|
| es-queso-batido-parfait-jar | −2% | +2% | halal |
| es-pa-amb-tomaquet-burgos-ous-portion | 0% | 0% | halal |
| pk-fruit-chaat-protein-dahi-portion | −6% | 0% | halal (note 3) |
| es-lentejas-atun-feta-salad-box | −3% | −2% | check (feta), fish |
| intl-salmon-brown-rice-bowl-box | 0% | 0% | halal, fish |
| med-tuna-egg-pita-hummus-box | −2% | −4% | halal, fish |
| med-cuscus-caballa-garbanzos-box | +1% | −1% | halal, fish |
| med-lentil-rice-burgos-bowl-box | −1% | 0% | halal |
| es-salmorejo-huevo-atun-portion | +1% | −3% | halal, fish |
| pk-microwave-chana-masala-portion | 0% | −1% | halal (C) |
| es-picoteo-hummus-burgos-portion | 0% | 0% | halal |
| med-protein-hummus-veg-sticks-box | −4% | +1% | halal |
| intl-protein-chia-pudding-pomegranate-jar | −2% | +3% | halal |
| pk-chana-chaat-dahi-snack-box | 0% | −1% | halal |
| es-lentejas-atun-burgos-salad-box | −3% | −3% | halal, fish |

- Halal status follows the ingredients: the only `check` ingredient is feta, and that prep is `check`.
- Seafood tags match the fish ingredients.
- `serve` is set on all 15.

## Zainab: 17 kam tel records (checked, stamp at wave end)

- Every record follows §6.1 exactly. Expected per 100 g = (home − removed oil) / (100 − removed oil),
  with removed oil = 0.5 × home added fat. Fat, protein and added fat all agree within 0.1 g.
- All pass G25: kcal is 11–29% below the home record, confidence is C as at home, and the group and
  family match.
- I will stamp them when she hands off, so that any late change is reviewed first.

## Notes and fixes by owner

1. **Javier:** es-pulpo-cocido cites the Alimar 250 g label, but `pack` is the Mercadona 300 g tray. Name
   the Mercadona product in the citation once its label is read, or say in the notes that the pack is a
   different brand. This does not affect nutrition.
2. **Javier:** es-gambas-al-ajillo counts all 91 g of oil as eaten (the §6 default). In bars much of it stays
   in the cazuela. Keep C; add one line to the state: "assumes the oil is mopped up with bread".
3. **Yusuf:** the fruit chaat is −6% only because I summed table kcal, which uses food-specific factors.
   The record's kcal is 4P + 4C + 9F + 2·fibre (§6 step 7), and the carbs match exactly. No change.
4. **Zainab:** pk-bhindi-light inherits pk-bhindi-home's open Sprint 1 FIX (oil vs CoFID, +93%). When the
   home record is fixed, rebuild the light record from it.
5. **Omar (apply the stamps):** run `node research/javier/build.mjs && node research/yusuf/build.mjs`.
   I tested this on a scratch copy: only the 24 reviewer and date lines change (foods-basics 5 lines,
   foods-es-med 4, foods-mealprep 15), and G19 falls from 135 to 111.
