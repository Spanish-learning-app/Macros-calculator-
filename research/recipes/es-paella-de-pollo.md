# Paella de pollo (Valencian-style chicken paella, no rabbit or pork)

Record id: `es-paella-de-pollo` · Makes: 4 servings · Researcher: javier · Date: 2026-10-13

Calculated with `node research/javier/recipes.mjs` (EuroFIR standard-recipe method, docs/NUTRITION.md §6).

## References

1. Ajuntament de Xeraco, "Llibret Receptes" (2025): paella valenciana 400 g arroz bomba, 1 kg pollo troceado, 200 g judías verdes, 100 g garrofó, 100 g tomate, 6 cucharadas de aceite de oliva. https://www.xeraco.eu/wp-content/uploads/2025/01/Llibret-Xeraco-Receptes.pdf
2. Directo al Paladar, "Receta de paella alicantina con pollo": 2 personas, 250 g pollo, 100 g judía verde plana, 1 tomate, 200 g arroz bomba, 40 g AOVE, ~750 ml agua (pork omitted here). https://www.directoalpaladar.com/recetas-de-arroces/receta-de-paella-alicantina

## Standard recipe (raw edible grams)

| Ingredient | Raw g | Source | Cooking factor | Protein | Carbs | Fat | Fibre | kcal |
|---|---|---|---|---|---|---|---|---|
| Rice, white, medium-grain (bomba type), raw (Xeraco 400 g; Directo al Paladar 200 g per 2) | 400.0 | USDA FDC SR Legacy 169760 | 2.777 (USDA SR 169760 medium-grain rice raw (P 6.61) → 168930 cooked (P 2.38)) | 26.4 | 317.4 | 2.3 | 0.0 | 1396 |
| Chicken thigh, meat and skin, raw (edible part) (edible part of 0.5–1 kg chicken pieces with bone (assumption: 400 g)) | 400.0 | USDA FDC SR Legacy 172385 | 0.786 (USDA SR 173627 thigh meat raw (P 19.66) → 172389 stewed (P 25.0)) | 66.1 | 1.0 | 66.4 | 0.0 | 866 |
| Green beans (flat), raw (Xeraco 200 g × BEDCA edible 0.92) | 184.0 | USDA FDC SR Legacy 169961 | 0.968 (USDA SR 169961 snap beans raw (P 1.83) → 169141 boiled (P 1.89)) | 3.4 | 7.9 | 0.4 | 5.0 | 58 |
| Garrofó (large lima beans; analogue USDA SR 169955 baby lima beans, frozen) (Xeraco 100 g) | 100.0 | USDA FDC SR Legacy 169955 | 1.141 (USDA SR 169955 baby lima beans frozen (P 7.59) → 169318 boiled (P 6.65)) | 7.6 | 19.1 | 0.4 | 6.0 | 123 |
| Tomato, grated (Xeraco 100 g × edible 0.95) | 95.0 | BEDCA 2421 Tomate | 0.500 (reduced in the sofrito (assumption: half its weight)) | 0.9 | 3.3 | 0.1 | 1.0 | 20 |
| Olive oil (Xeraco 6 cda (81 g); Directo al Paladar 40 g per 2) | 80.0 | BEDCA 2543 Aceite de oliva | 1.000 | 0.0 | 0.0 | 79.9 | 0.0 | 719 |
| **Total** | **1259.0** | | | **104.3** | **348.7** | **149.6** | **12.0** | **3183** |

## Added fat

80.0 g of oil or butter-type fat in the dish → **4.3 g per 100 g as served**. All added fat is assumed eaten.

## Yield

Paella is cooked until the water is absorbed or evaporated: cooked weight = rice at its boiled-rice factor + chicken at its stewed factor + vegetables at their boiled factors + oil. Free cooking water is assumed fully absorbed or evaporated.

Raw total 1259.0 g → cooked weight **1845.3 g** (yield 1.466).

## Per 100 g as served

kcal **172**, protein 5.7 g, available carbs 18.9 g, fat 8.1 g, fibre 0.7 g.

## Energy check

4P + 4C + 9F + 2·fibre = 172.7 kcal vs stated 172 kcal (kcal is computed this way, so it passes by construction).

## Density for household servings

0.830 g/ml — RULES.densityGPerMl "biryani" (rice dish, FNDDS 1 cup = 196 g).

## Cross-check

| Reference | kcal/100 g | Ours vs reference |
|---|---|---|
| BEDCA 2597 Paella | 172 | 0 % |
| Label: Carretilla Paella de verduras y pollo (OFF 8410416005070, read 2026-10-13) | 177 | -3 % |
| USDA FDC FNDDS 2706723 Paella, NFS (includes seafood and salami) | 169 | 2 % |

## Assumptions and confidence

Confidence **C**: edible chicken weight and sofrito reduction are assumed.

Carbohydrate is available carbohydrate (USDA by-difference minus fibre; BEDCA and CoFID as reported). Macros 100 % retained. No pork and no alcohol: chorizo, rabbit, pork, bacalao and wine in the reference recipes are omitted or replaced as stated.

