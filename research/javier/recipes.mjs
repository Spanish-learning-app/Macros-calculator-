#!/usr/bin/env node
// Standard-recipe calculations (EuroFIR method, docs/NUTRITION.md §6) for Javier's composite records.
//   node research/javier/recipes.mjs          # prints a summary table and (re)writes research/recipes/<id>.md
// Imported by research/javier/build.mjs, which turns each result into a food record.
// Ingredient values come from research/javier/lib.mjs (USDA, BEDCA, CoFID caches); carbs are
// available carbohydrate. Macros are retained 100%; cooked weight = Σ(raw edible g × cooking factor)
// + free broth; per 100 g = totals ÷ cooked weight × 100; kcal = round(4P + 4C + 9F + 2·fibre).
// Owner: Javier Morales (Nutrition Lab).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { usda, bedca, r1, r0, ROOT } from './lib.mjs';

const TODAY = '2026-10-13';

// ---------------------------------------------------------------- cited factors (all derived from lookups)
// Cooking factor = cooked weight / raw weight, from USDA SR raw→cooked protein ratios (protein retained 100%).
const ratio = (raw, cooked) => usda(raw).protein / usda(cooked).protein;
export const FACTORS = {
  lentils: { f: ratio(172420, 172421), note: 'USDA SR 172420 lentils raw (P 24.63) → 172421 boiled (P 9.02)' },
  chickpeas: { f: ratio(173756, 173757), note: 'USDA SR 173756 chickpeas raw (P 20.47) → 173757 boiled (P 8.86)' },
  rice: { f: ratio(169760, 168930), note: 'USDA SR 169760 medium-grain rice raw (P 6.61) → 168930 cooked (P 2.38)' },
  chickenThighStewed: { f: ratio(173627, 172389), note: 'USDA SR 173627 thigh meat raw (P 19.66) → 172389 stewed (P 25.0)' },
  chickenThighRoasted: { f: ratio(173627, 172388), note: 'USDA SR 173627 thigh meat raw (P 19.66) → 172388 roasted (P 24.76)' },
  spinach: { f: ratio(168462, 168463), note: 'USDA SR 168462 spinach raw (P 2.86) → 168463 boiled (P 2.97)' },
  greenBeans: { f: ratio(169961, 169141), note: 'USDA SR 169961 snap beans raw (P 1.83) → 169141 boiled (P 1.89)' },
  limaBeans: { f: ratio(169955, 169318), note: 'USDA SR 169955 baby lima beans frozen (P 7.59) → 169318 boiled (P 6.65)' },
};
// Pan-fried potato: FNDDS 2709474 "Potato, home fries, from fresh" has 17.16 g available carbs and 11.52 g fat per
// 100 g; raw potato (SR 170026) has 15.39 g. So 100 g home fries come from 111.5 g raw potato, whose own weight
// after frying is 100 − 11.52 = 88.48 g → factor 0.794; fat uptake 10.3 g per 100 g raw (UCM table: 10 g).
{
  const hf = usda(2709474);
  const raw = usda(170026);
  const rawPer100 = (hf.carbs / raw.carbs) * 100;
  FACTORS.potatoPanFried = {
    f: (100 - hf.fat) / rawPer100,
    note: `FNDDS 2709474 home fries (C ${hf.carbs.toFixed(2)}, F ${hf.fat}) vs SR 170026 raw potato (C ${raw.carbs.toFixed(2)})`,
  };
}
// Toasting bread: dry matter conserved, BEDCA 2160 pan de barra (water 34.6 g) → BEDCA 2165 pan tostado (23.7 g).
FACTORS.toast = {
  f: (100 - bedca(2160).water) / (100 - bedca(2165).water),
  note: 'dry matter conserved: BEDCA 2160 pan de barra (water 34.6 %) → BEDCA 2165 pan blanco tostado (water 23.7 %)',
};
// Edible portions (BEDCA): potato 0.81, tomato 0.95, sweet pepper 0.83, green beans 0.92, olives 0.78.
const EDIBLE = {
  potato: bedca(2403).edible,
  tomato: bedca(2421).edible,
  pepper: bedca(2409).edible,
  greenBeans: bedca(2198).edible,
  olive: bedca(2214).edible,
};
// Densities from USDA cup weights (1 US cup = 236.6 ml), for the chopped-salad katori servings.
const CUP_ML = 236.6;

// ---------------------------------------------------------------- recipes
// ing: { name, src: () => nutrient profile, g, how, cooked?: factor (default 1), cookedNote?, addedFat?: true,
//        cupG?: grams per US cup (for density) }
export const RECIPES = [
  {
    id: 'es-tortilla-de-patatas',
    title: 'Tortilla de patatas (Spanish potato omelette, with onion)',
    makes: 'one 5-egg tortilla (4 raciones)',
    references: [
      ['Que.es, "Cómo hacer una tortilla de patatas de 10" (2021-05-05): 5 huevos, 500 g patatas, 1 cebolla, AOVE; 4 personas', 'https://www.que.es/2021/05/05/tortilla-patatas-maxima-puntuacion/'],
      ['Spain.info (Turespaña), receta tortilla de patata: 4 patatas medianas, 4-5 huevos, 1 cebolla, ¼ l aceite de oliva (drained, a little reused); 4 personas', 'https://www.spain.info/es/receta/tortilla-patata/'],
      ['EcuRed, "Tortilla española": 500 g patatas sin pelar, 5 huevos, 1 cebolla mediana', 'https://www.ecured.cu/Tortilla_espa%C3%B1ola'],
      ['Carbajal Azcona Á., UCM "Pesos de medidas caseras y raciones habituales" (2015): aceite para una ración de tortilla de patatas = 13 g; patata mediana 170 g; cebolla mediana 150 g', 'https://www.ucm.es/data/cont/docs/458-2015-10-22-pesos-medidas-caseras-raciones-2015.pdf'],
    ],
    ingredients: [
      { name: 'Egg, whole, raw', src: () => usda(171287), g: 250, how: '5 large eggs × 50 g edible (USDA 171287 portion "1 large" = 50 g)' },
      { name: 'Potato, raw, peeled', src: () => bedca(2403), g: 500 * EDIBLE.potato, how: '500 g as bought (≈ 3 medium, UCM 170 g each) × BEDCA edible portion 0.81', cooked: FACTORS.potatoPanFried.f, cookedNote: FACTORS.potatoPanFried.note },
      { name: 'Onion, raw', src: () => usda(170000), g: 150, how: '1 medium onion (UCM 150 g)', cooked: FACTORS.potatoPanFried.f, cookedNote: 'same pan-frying factor as the potato (assumption)' },
      { name: 'Olive oil retained', src: () => bedca(2543), g: 52, how: 'UCM: 13 g oil per ración × 4 raciones; cross-check: FNDDS home-fries fat uptake 10.3 g/100 g raw potato → 42 g, plus oil to set the tortilla', addedFat: true },
    ],
    yieldNote: 'Eggs: no weight loss assumed (tortilla jugosa, set briefly). Potato and onion: pan-frying factor 0.794 derived from FNDDS 2709474 vs SR 170026. Frying oil that is drained off is excluded; only the UCM ración amount is counted.',
    crossChecks: [
      ['Label: Mercadona Tortilla de patatas con cebolla (OFF 8480000808950, read 2026-10-13)', 193],
      ['Label: Lidl Chef Select Tortilla de patata con cebolla (OFF 20657284, read 2026-10-13)', 158],
      ['CoFID 2021 12-957 Omelette, Spanish, homemade', 112],
    ],
    crossNote: 'CoFID 12-957 is a British recipe with green pepper and much less oil (7.6 g fat), so it sits 41 % lower; the two Spanish supermarket labels (158 and 193 kcal) bracket our value.',
    confidence: 'C',
    confidenceWhy: 'oil is a published household measure, but the egg and onion yields are assumed and home tortillas vary a lot in oil.',
  },
  {
    id: 'es-lentejas',
    title: 'Lentejas estofadas (Spanish lentil stew, halal beef sausage instead of chorizo)',
    makes: '4 servings',
    references: [
      ['Infobae España, "Receta de lentejas con chorizo y verduras" (2024-11-06): 300 g lentejas pardinas, 2 chorizos, 1 cebolla, 2 ajos, 2 pimientos, 2 zanahorias, 2 tomates, 1 patata, 3 cda aceite de oliva, 1,5 l agua; 4 porciones', 'https://www.infobae.com/espana/2024/11/06/receta-de-lentejas-con-chorizo-y-verduras-un-plato-nutritivo-perfecto-para-otono-e-invierno/'],
      ['Directo al Paladar, "Lentejas con chorizo": 350 g lentejas pardina, 1 zanahoria, ½ cebolla, 1 tomate, 1 patata, 25 ml AOVE, chorizo fresco, 2 ajos; 4 personas', 'https://www.directoalpaladar.com/2008/04/21-lentejas-con-chorizo-receta'],
      ['Moncloa.com, "Lentejas guisadas" (2024-02-11): 150 g de chorizo (the pork is replaced here by the same weight of halal beef sausage)', 'https://www.moncloa.com/2024/02/11/lentejas-guisadas-la-receta-2432330/'],
    ],
    ingredients: [
      { name: 'Lentils (lenteja pardina), dried, raw', src: () => bedca(1065), g: 300, how: 'Infobae 300 g (Directo al Paladar 350 g)', cooked: FACTORS.lentils.f, cookedNote: FACTORS.lentils.note },
      { name: 'Carrot, raw', src: () => usda(170393), g: 80, how: '1 medium (UCM 80 g)' },
      { name: 'Potato, raw, peeled', src: () => bedca(2403), g: 170 * EDIBLE.potato, how: '1 medium (UCM 170 g) × edible 0.81' },
      { name: 'Onion, raw', src: () => usda(170000), g: 150, how: '1 medium (UCM 150 g)' },
      { name: 'Tomato, raw', src: () => bedca(2421), g: 150 * EDIBLE.tomato, how: '1 medium (UCM 150 g) × edible 0.95' },
      { name: 'Garlic, raw', src: () => usda(169230), g: 10, how: '2 cloves (UCM 5 g each)' },
      { name: 'Olive oil', src: () => bedca(2543), g: 27, how: '2 tablespoons (USDA 171413: 13.5 g each); refs use 25 ml to 3 cda', addedFat: true },
      { name: 'Beef sausage, halal, frankfurter type (analogue: USDA SR 173862 Frankfurter, beef, unheated)', src: () => usda(173862), g: 150, how: 'one 150 g pack, replacing the chorizo (Moncloa 150 g chorizo)' },
    ],
    broth: { g: 1500 - 300 * (FACTORS.lentils.f - 1) - 0.4 * 1500, note: 'water balance: 1500 ml water (Infobae) − water absorbed by the lentils (300 g × (2.73 − 1)) − 40 % evaporation over ~1 h of simmering (assumption) = free broth' },
    yieldNote: 'Vegetables and the pre-cooked sausage are taken at raw weight (boiled vegetables keep their weight: USDA green beans raw→boiled factor 0.97). The 40 % evaporation is an assumption.',
    density: { gPerMl: 1.0, note: 'RULES.densityGPerMl "daal" (FNDDS dal, 1 cup = 240 g): lentejas are a brothy legume stew' },
    crossChecks: [
      ['Label: Lentejas estofadas (OFF 8437018021017, read 2026-10-13)', 94],
      ['Label: Lentejas estofadas con chorizo (OFF 1191912200237, read 2026-10-13)', 128],
      ['USDA FDC FNDDS 2707424 Lentils, from dried, fat added (no broth)', 166],
    ],
    crossNote: 'FNDDS 2707424 is drained lentils with fat and no broth, so it is denser than a brothy stew; the two Spanish ready-meal labels (94 and 128 kcal) bracket our value.',
    confidence: 'C',
    confidenceWhy: 'evaporation and broth share are assumed; the sausage is a named analogue.',
  },
  {
    id: 'es-garbanzos-con-espinacas',
    title: 'Potaje de garbanzos con espinacas (chickpea and spinach stew)',
    makes: '4 servings',
    references: [
      ['Spain.info (Turespaña), "Potaje de garbanzos y espinacas a la madrileña": ½ kg garbanzos, ¼ kg espinacas, 150 g zanahorias, 2 cebollas, 1 tomate, 2 huevos duros, 1 dl aceite; 6 personas', 'https://www.spain.info/es/receta/potaje-garbanzos-espinacas-la-madrilena/'],
      ['Consumer.es (Fundación Eroski), "Potaje de garbanzos y espinacas": 250 g garbanzos, 200 g espinacas, 50 g zanahoria, 50 g cebolla, 100 ml aceite de oliva; 4 raciones', 'https://www.consumer.es/alimentacion/potaje-de-garbanzos-y-espinacas.html'],
      ['¡Hola! Cocina, "Potaje de garbanzos" (2024-10-07): 400 g garbanzos cocidos, 250 g espinacas, 1 cebolla, 3 ajos, 2 huevos cocidos; 4 comensales (bacalao and wine omitted here)', 'https://www.hola.com/cocina/recetas/20241007722153/potaje-de-garbanzos/'],
    ],
    ingredients: [
      { name: 'Chickpeas, dried, raw', src: () => bedca(1020), g: 300, how: 'between Consumer 250 g and spain.info 333 g per 4', cooked: FACTORS.chickpeas.f, cookedNote: FACTORS.chickpeas.note },
      { name: 'Spinach, raw', src: () => usda(168462), g: 225, how: 'between Consumer 200 g and Hola 250 g', cooked: FACTORS.spinach.f, cookedNote: FACTORS.spinach.note },
      { name: 'Carrot, raw', src: () => usda(170393), g: 80, how: '1 medium (UCM 80 g)' },
      { name: 'Onion, raw', src: () => usda(170000), g: 150, how: '1 medium (UCM 150 g)' },
      { name: 'Tomato, raw', src: () => bedca(2421), g: 150 * EDIBLE.tomato, how: '1 medium (UCM 150 g) × edible 0.95' },
      { name: 'Garlic, raw', src: () => usda(169230), g: 5, how: '1 clove (UCM 5 g)' },
      { name: 'Olive oil', src: () => bedca(2543), g: 54, how: '4 tablespoons (13.5 g); spain.info 1 dl per 6 = 61 g per 4', addedFat: true },
      { name: 'Egg, hard-boiled', src: () => usda(173424), g: 100, how: '2 eggs × 50 g (RULES reference weight egg-boiled)' },
    ],
    broth: { g: 1500 - 300 * (FACTORS.chickpeas.f - 1) - 0.4 * 1500, note: 'water balance: 1500 ml water − water absorbed by the chickpeas (300 g × (2.31 − 1)) − 40 % evaporation (assumption) = free broth' },
    yieldNote: 'Vegetables at raw weight (boiled), spinach with its USDA boiled factor. 40 % evaporation assumed.',
    density: { gPerMl: 1.0, note: 'RULES.densityGPerMl "daal" (FNDDS dal, 1 cup = 240 g)' },
    crossChecks: [
      ['Label: Carrefour Garbanzos con espinacas (OFF 8431876292268, read 2026-10-13)', 81],
      ['Label: Nestlé Vegetal garbanzos con espinacas (OFF 7613034665706, read 2026-10-13)', 69],
      ['USDA FDC FNDDS 2707415 Chickpeas, from dried, fat added (no broth)', 211],
    ],
    crossNote: 'The Nestlé Vegetal ready meal (69 kcal) uses less oil and more water; FNDDS 2707415 is drained chickpeas with fat and no broth. Carrefour (81 kcal) is within 21 %.',
    confidence: 'C',
    confidenceWhy: 'evaporation and broth share are assumed.',
  },
  {
    id: 'es-paella-de-pollo',
    title: 'Paella de pollo (Valencian-style chicken paella, no rabbit or pork)',
    makes: '4 servings',
    references: [
      ['Ajuntament de Xeraco, "Llibret Receptes" (2025): paella valenciana 400 g arroz bomba, 1 kg pollo troceado, 200 g judías verdes, 100 g garrofó, 100 g tomate, 6 cucharadas de aceite de oliva', 'https://www.xeraco.eu/wp-content/uploads/2025/01/Llibret-Xeraco-Receptes.pdf'],
      ['Directo al Paladar, "Receta de paella alicantina con pollo": 2 personas, 250 g pollo, 100 g judía verde plana, 1 tomate, 200 g arroz bomba, 40 g AOVE, ~750 ml agua (pork omitted here)', 'https://www.directoalpaladar.com/recetas-de-arroces/receta-de-paella-alicantina'],
    ],
    ingredients: [
      { name: 'Rice, white, medium-grain (bomba type), raw', src: () => usda(169760), g: 400, how: 'Xeraco 400 g; Directo al Paladar 200 g per 2', cooked: FACTORS.rice.f, cookedNote: FACTORS.rice.note },
      { name: 'Chicken thigh, meat and skin, raw (edible part)', src: () => usda(172385), g: 400, how: 'edible part of 0.5–1 kg chicken pieces with bone (assumption: 400 g)', cooked: FACTORS.chickenThighStewed.f, cookedNote: FACTORS.chickenThighStewed.note },
      { name: 'Green beans (flat), raw', src: () => usda(169961), g: 200 * EDIBLE.greenBeans, how: 'Xeraco 200 g × BEDCA edible 0.92', cooked: FACTORS.greenBeans.f, cookedNote: FACTORS.greenBeans.note },
      { name: 'Garrofó (large lima beans; analogue USDA SR 169955 baby lima beans, frozen)', src: () => usda(169955), g: 100, how: 'Xeraco 100 g', cooked: FACTORS.limaBeans.f, cookedNote: FACTORS.limaBeans.note },
      { name: 'Tomato, grated', src: () => bedca(2421), g: 100 * EDIBLE.tomato, how: 'Xeraco 100 g × edible 0.95', cooked: 0.5, cookedNote: 'reduced in the sofrito (assumption: half its weight)' },
      { name: 'Olive oil', src: () => bedca(2543), g: 80, how: 'Xeraco 6 cda (81 g); Directo al Paladar 40 g per 2', addedFat: true },
    ],
    yieldNote: 'Paella is cooked until the water is absorbed or evaporated: cooked weight = rice at its boiled-rice factor + chicken at its stewed factor + vegetables at their boiled factors + oil. Free cooking water is assumed fully absorbed or evaporated.',
    density: { gPerMl: 0.83, note: 'RULES.densityGPerMl "biryani" (rice dish, FNDDS 1 cup = 196 g)' },
    crossChecks: [
      ['BEDCA 2597 Paella', 172],
      ['Label: Carretilla Paella de verduras y pollo (OFF 8410416005070, read 2026-10-13)', 177],
      ['USDA FDC FNDDS 2706723 Paella, NFS (includes seafood and salami)', 169],
    ],
    confidence: 'C',
    confidenceWhy: 'edible chicken weight and sofrito reduction are assumed.',
  },
  {
    id: 'es-gazpacho',
    title: 'Gazpacho andaluz (cold tomato soup)',
    makes: '4 servings',
    references: [
      ['Público, "Receta de gazpacho andaluz": 1 kg tomate pera, 1 pimiento verde italiano, ½ pepino, 50 ml aceite, 30 ml vinagre; 4 personas', 'https://www.publico.es/culturas/recetas/receta-gazpacho-andaluz.html'],
      ['MDZ Online, "Prepara gazpacho andaluz en solo 8 pasos": 1 kg tomates, 1 pepino, pimientos, 1 cebolla pequeña, 2 ajos, 50 ml AOVE, 25 ml vinagre, ~100 g pan', 'https://www.mdzol.com/tendencias/prepara-gazpacho-andaluz-solo-8-pasos-una-receta-rapida-y-sabrosa-n1125497'],
      ['El Corte Inglés, "Gazpacho andaluz tradicional": ~1,2 kg tomates, 100 g pan duro, 250 ml aceite, 250 ml agua fría, 50 ml vinagre', 'https://www.elcorteingles.es/aptc/gazpacho-andaluz-tradicional/'],
    ],
    ingredients: [
      { name: 'Tomato, ripe, raw', src: () => bedca(2421), g: 1000 * EDIBLE.tomato, how: '1 kg as bought × edible 0.95' },
      { name: 'Green pepper, raw', src: () => usda(170427), g: 180 * EDIBLE.pepper, how: '1 medium (UCM 180 g) × BEDCA edible 0.83' },
      { name: 'Cucumber, raw', src: () => usda(168409), g: 125, how: '1 medium (UCM 125 g)' },
      { name: 'Garlic, raw', src: () => usda(169230), g: 5, how: '1 clove (UCM 5 g)' },
      { name: 'White bread (pan de barra), stale', src: () => bedca(2160), g: 50, how: 'between Público (none) and MDZ/El Corte Inglés (100 g)' },
      { name: 'Olive oil', src: () => bedca(2543), g: 45.5, how: '50 ml (Público, MDZ) × 0.91 g/ml (RULES density oil)', addedFat: true },
      { name: 'Vinegar', src: () => usda(173469), g: 30, how: '30 ml (Público)' },
      { name: 'Water', src: () => ({ src: 'water', protein: 0, carbs: 0, fat: 0, fiber: 0, satFat: 0, sugars: 0 }), g: 250, how: '250 ml (El Corte Inglés; MDZ variant)' },
    ],
    yieldNote: 'Raw, blended and chilled: no cooking, so cooked weight = sum of ingredients (straining losses ignored).',
    density: { gPerMl: 1.03, note: 'RULES.densityGPerMl "water-like" (thin, blended soup)' },
    crossChecks: [
      ['CoFID 2021 17-795 Soup, gazpacho, homemade', 46],
      ['BEDCA 2614 Gazpacho', 34],
      ['USDA FDC FNDDS 2710106 Soup, gazpacho', 26],
    ],
    crossNote: 'BEDCA 2614 (2.8 g fat, 1.6 g carbs) and FNDDS 2710106 (0.6 g fat, with tomato juice) are thinner, low-oil versions; our oil (50 ml per kg of tomato) follows both Spanish references and CoFID 17-795 agrees within 7 %.',
    confidence: 'B',
    confidenceWhy: 'no cooking (yield 1.0), quantities straight from the references; oil varies between cooks.',
  },
  {
    id: 'es-pan-con-tomate',
    title: 'Pan con tomate / pa amb tomàquet (toasted bread rubbed with tomato and olive oil)',
    makes: '4 slices of pan de payés',
    references: [
      ['Directo al Paladar, "Cómo hacer el auténtico pan con tomate o pa amb tomàquet": 4 rebanadas de pan de hogaza, 2 tomates muy maduros, AOVE, ajo, sal; 4 personas', 'https://www.directoalpaladar.com/recetas-de-panes/como-hacer-autentico-pan-tomate-pa-amb-tomaquet-desayuno-estrella-cocina-catalana'],
      ['Cooklang recipes #6945 "Pa amb tomaquet": 4 rebanadas de pan rústico, 2 tomates grandes, 2 + 1 cucharadas de aceite de oliva, sal, 1 ajo', 'https://recipes.cooklang.org/recipes/6945'],
      ['Carbajal Azcona Á., UCM (2015): rebanada de pan payés = 60 g; tomate mediano = 150 g', 'https://www.ucm.es/data/cont/docs/458-2015-10-22-pesos-medidas-caseras-raciones-2015.pdf'],
    ],
    ingredients: [
      { name: 'White bread (pan de payés; BEDCA pan de barra)', src: () => bedca(2160), g: 240, how: '4 slices × 60 g (UCM rebanada de pan payés)', cooked: FACTORS.toast.f, cookedNote: FACTORS.toast.note },
      { name: 'Tomato pulp rubbed on', src: () => bedca(2421), g: 150, how: '2 medium tomatoes (UCM 300 g); about half the pulp ends up on the bread, skin discarded (assumption)' },
      { name: 'Olive oil', src: () => bedca(2543), g: 40.5, how: '3 tablespoons (Cooklang) × 13.5 g', addedFat: true },
    ],
    yieldNote: 'Bread loses water when toasted (dry matter conserved, BEDCA moisture); tomato and oil sit on the slice.',
    crossChecks: [['BEDCA 2476 Bocadillo (generic bread-based snack)', 224]],
    confidence: 'C',
    confidenceWhy: 'the share of tomato that stays on the bread is assumed; oil varies a lot.',
  },
  {
    id: 'es-pisto',
    title: 'Pisto manchego (Spanish stewed peppers, courgette, onion and tomato)',
    makes: '4 servings',
    references: [
      ['Real Academia de Gastronomía, "Pisto manchego": 6 personas, ~500 g pimientos verdes, 500 g calabacín, 500 g cebolla, 400 g tomate, 1 ajo, AOVE', 'https://realacademiadegastronomia.com/recetas/pisto-manchego/'],
      ['Directo al Paladar, "Pisto de verduras: nueve recetas" (pisto manchego clásico): 4 personas, 4 tomates, 250 g cebolla, 200 g pimiento verde, 200 g pimiento rojo, 2 ajos, 300 g calabacín', 'https://www.directoalpaladar.com/recetas-de-legumbres-y-verduras/siete-recetas-pisto-diferentes-para-celebrar-fin-semana'],
      ['Carbajal Azcona Á., UCM (2015): aceite para una ración de verdura rehogada = 10 g, para un sofrito por ración = 5 g', 'https://www.ucm.es/data/cont/docs/458-2015-10-22-pesos-medidas-caseras-raciones-2015.pdf'],
    ],
    ingredients: [
      { name: 'Tomato, raw', src: () => bedca(2421), g: 600 * EDIBLE.tomato, how: '4 medium (UCM 150 g) × edible 0.95', cooked: 0.7 },
      { name: 'Onion, raw', src: () => usda(170000), g: 250, how: 'Directo al Paladar 250 g', cooked: 0.7 },
      { name: 'Green pepper, raw', src: () => usda(170427), g: 200 * EDIBLE.pepper, how: '200 g × edible 0.83', cooked: 0.7 },
      { name: 'Red pepper, raw', src: () => usda(170108), g: 200 * EDIBLE.pepper, how: '200 g × edible 0.83', cooked: 0.7 },
      { name: 'Courgette (zucchini), raw', src: () => usda(169291), g: 300, how: 'Directo al Paladar 300 g', cooked: 0.7 },
      { name: 'Garlic, raw', src: () => usda(169230), g: 10, how: '2 cloves (UCM 5 g)', cooked: 0.7 },
      { name: 'Olive oil', src: () => bedca(2543), g: 60, how: 'UCM: 10 g (verdura rehogada) + 5 g (sofrito) per ración × 4', addedFat: true },
    ],
    yieldNote: 'Vegetables slowly stewed down: weight factor 0.70 assumed for all vegetables (water evaporates; no published yield found for pisto).',
    density: { gPerMl: 1.0, note: 'RULES.densityGPerMl "daal and thin curries" (stewed vegetables in their juice)' },
    crossChecks: [
      ['CoFID 2021 15-659 Ratatouille, homemade', 82],
      ['USDA FDC FNDDS 2710028 Ratatouille', 67],
    ],
    confidence: 'C',
    confidenceWhy: 'stewing yield assumed.',
  },
  {
    id: 'es-croquetas-de-pollo',
    title: 'Croquetas de pollo (chicken béchamel croquettes, fried)',
    makes: 'about 39 croquetas of 25 g',
    references: [
      ['Directo al Paladar, "Croquetas de pollo caseras": 6 personas, bechamel de 50 g mantequilla, 50 g harina, poco más de ½ l de leche entera; 1 pechuga asada; 2 huevos y pan rallado; AOVE para freír', 'https://www.directoalpaladar.com/recetas-de-aperitivos/croquetas-pollo-mejor-receta-para-disfrutar-clasico-nuestra-gastronomia'],
      ['Ara.cat, "Les veritables croquetes de pollastre rostit" (Oriol): 75 g mantequilla, 75 g harina, ½ l de leche; rinde 30–40 croquetas (cognac and wine of the roast omitted)', 'https://es.ara.cat/comer/verdaderas-croquetas-pollo-asado-receta-cocinero-oriol_1_5256365.html'],
      ['Carbajal Azcona Á., UCM (2015): croqueta 20–30 g; aceite para freír una croqueta = 3 g', 'https://www.ucm.es/data/cont/docs/458-2015-10-22-pesos-medidas-caseras-raciones-2015.pdf'],
    ],
    ingredients: [
      { name: 'Butter', src: () => usda(173410), g: 50, how: 'Directo al Paladar 50 g', cooked: 0.85 },
      { name: 'Wheat flour, white', src: () => usda(168894), g: 50, how: 'Directo al Paladar 50 g', cooked: 0.85 },
      { name: 'Milk, whole', src: () => usda(171265), g: 515, how: '500 ml × 1.03 g/ml', cooked: 0.85 },
      { name: 'Chicken breast, roasted', src: () => usda(171477), g: 172, how: '1 breast (USDA 171477: ½ breast = 86 g cooked)', cooked: 0.85 },
      { name: 'Egg for coating (adhering)', src: () => usda(171287), g: 78, how: '2 g per croqueta × 39 (assumption)' },
      { name: 'Breadcrumbs (adhering)', src: () => usda(174928), g: 117, how: '3 g per croqueta × 39 (assumption)' },
      { name: 'Olive oil absorbed in frying', src: () => bedca(2543), g: 117, how: 'UCM 3 g per croqueta × 39', addedFat: true },
    ],
    yieldNote: 'Béchamel and chicken reduced to a firm dough: 15 % water loss assumed (factor 0.85 on the filling). 669 g filling ÷ 17 g per croqueta ≈ 39 croquetas of 25 g (UCM 20–30 g) including coating and absorbed oil.',
    crossChecks: [
      ['USDA FDC FNDDS 2706545 Chicken or turkey cake, patty, or croquette', 262],
      ['BEDCA 2268 Croquetas de pollo', 154],
    ],
    crossNote: 'BEDCA 2268 lists only 5.3 g fat, which is low for a fried croqueta; FNDDS 2706545 (fried chicken croquette) agrees within 6 %.',
    confidence: 'C',
    confidenceWhy: 'filling reduction, coating pick-up and frying oil are assumptions (UCM oil figure is a household estimate).',
  },
  {
    id: 'es-ensalada-mixta',
    title: 'Ensalada mixta (Spanish mixed salad with tuna, egg and olives, dressed)',
    makes: '2 servings',
    references: [
      ['Directo al Paladar, "Receta de ensalada mixta": 2 personas, 1 bolsa de mezclum, 1 huevo duro, maíz, espárragos, 1 lata de atún, 1 zanahoria, 1 cebolleta, aceitunas; vinagreta 3 partes de aceite por 1 de vinagre', 'https://www.directoalpaladar.com/recetas-de-ensaladas/receta-de-ensalada-mixta-con-cebolleta-morada'],
      ['The Fiery Vegetarian, "Spanish mixed salad (ensalada mixta)": 4 servings, 1 lettuce, 2 tomatoes, 1 large carrot, ½ onion, ½ cup corn, a handful of green olives, 4 tbsp olive oil, 2 tbsp vinegar', 'https://www.thefieryvegetarian.com/wprm_print/spanish-mixed-salad-ensalada-mixta'],
      ['Carbajal Azcona Á., UCM (2015): aceite para una ración de ensalada = 10 g; vinagre cucharada sopera = 7 g; aceituna = 4 g', 'https://www.ucm.es/data/cont/docs/458-2015-10-22-pesos-medidas-caseras-raciones-2015.pdf'],
    ],
    ingredients: [
      { name: 'Lettuce (romaine)', src: () => usda(169247), g: 150, how: 'one 150 g bag (El Corte Inglés, Florette ensalada mixta 150 g)', cupG: 47 },
      { name: 'Tomato, raw', src: () => bedca(2421), g: 150 * EDIBLE.tomato, how: '1 medium (UCM 150 g) × edible 0.95', cupG: 180 },
      { name: 'Onion, raw', src: () => usda(170000), g: 38, how: '¼ medium onion (UCM 150 g)', cupG: 160 },
      { name: 'Carrot, raw, grated', src: () => usda(170393), g: 80, how: '1 medium (UCM 80 g)', cupG: 110 },
      { name: 'Tuna in olive oil, drained', src: () => bedca(2130), g: 65, how: '1 small can (Calvo label serving 65 g)', cupG: 146 },
      { name: 'Egg, hard-boiled', src: () => usda(173424), g: 50, how: '1 egg (RULES egg-boiled 50 g)', cupG: 136 },
      { name: 'Green olives, pitted', src: () => usda(169096), g: 8 * 4 * EDIBLE.olive, how: '8 olives × 4 g (UCM) × edible 0.78', cupG: 135 },
      { name: 'Sweet corn, canned, drained', src: () => usda(169214), g: 41, how: 'The Fiery Vegetarian ½ cup per 4 (USDA 1 cup = 164 g) → 41 g per 2', cupG: 164 },
      { name: 'Olive oil (dressing)', src: () => bedca(2543), g: 20, how: 'UCM 10 g per ración × 2', addedFat: true, cupG: 216 },
      { name: 'Vinegar', src: () => usda(173469), g: 7, how: '1 tablespoon (UCM 7 g)', cupG: 239 },
    ],
    yieldNote: 'Raw assembled salad: cooked weight = sum of ingredients.',
    densityFromCups: true,
    crossChecks: [['BEDCA 2389 Ensalada (undressed, no tuna or egg)', 19]],
    crossNote: 'BEDCA 2389 is plain undressed salad (no oil, tuna, egg or olives), so it is not a like-for-like reference; it is listed only to show the vegetables alone.',
    confidence: 'B',
    confidenceWhy: 'no cooking; amounts from the references and UCM household measures.',
  },
  {
    id: 'intl-salad-kachumber',
    title: 'Kachumber salad (kheera, tamatar, pyaz with lemon; no oil)',
    makes: 'about 4 katoris',
    references: [
      ['Feast with Safiya, "Kachumber Salad (Cucumber Tomato Salad)": 1 large cucumber, 1 large tomato, ½ red onion, 1 green chilli, 2 tbsp cilantro, juice of ½ lemon', 'https://feastwithsafiya.com/wprm_print/10151'],
      ["Hebbar's Kitchen, \"Kachumber salad\": ½ cup cucumber, ½ tomato, 2 tbsp onion, 1 tbsp lemon juice", 'https://hebbarskitchen.com/kachumber-salad-recipe-cucumber-salad/'],
    ],
    ingredients: [
      { name: 'Cucumber, with peel, raw', src: () => usda(168409), g: 301, how: '1 large cucumber (USDA 168409: 1 cucumber 8¼" = 301 g)', cupG: 104 },
      { name: 'Tomato, raw', src: () => usda(170457), g: 182, how: '1 large tomato (USDA 170457: 182 g)', cupG: 180 },
      { name: 'Onion, raw', src: () => usda(170000), g: 55, how: '½ medium onion (USDA 170000: medium 110 g)', cupG: 160 },
      { name: 'Green chilli, raw', src: () => usda(170497), g: 10, how: '1 small hari mirch (assumption 10 g; USDA "1 pepper" is 45 g)', cupG: 150 },
      { name: 'Lemon juice', src: () => usda(167747), g: 24, how: 'juice of ½ lemon (USDA 167747: 1 lemon yields 48 g)', cupG: 244 },
    ],
    yieldNote: 'Raw salad: cooked weight = sum of ingredients.',
    densityFromCups: true,
    crossChecks: [['BEDCA 2389 Ensalada', 19]],
    confidence: 'B',
    confidenceWhy: 'no cooking and no oil; vegetables straight from USDA.',
  },
  {
    id: 'intl-raita',
    title: 'Raita, kheera (dahi with grated cucumber, cumin and mint)',
    makes: 'about 2½ katoris',
    references: [
      ['Saveur, "Kheera ka Raita": 1 medium cucumber, 1½ cups plain full-fat yogurt, ½ cup mint, 1 tsp cumin seeds', 'https://www.saveur.com/article/recipes/kheera-ka-raita-cucumber-tomato-yogurt/'],
      ['The Big Sweet Tooth, "Pakistani Mint Cumin Raita": 1 cup yogurt, ¾ tsp cumin, 5–6 mint leaves, 1 green chilli', 'https://www.thebigsweettooth.com/2017/04/pakistani-mint-cumin-raita.html'],
      ['Whisk Affair, "Cucumber Raita (Kheere ka Raita)": ⅔ cup yogurt, 1 cucumber grated', 'https://www.whiskaffair.com/cucumber-raita-recipe/'],
    ],
    ingredients: [
      { name: 'Yogurt (dahi), plain, whole milk', src: () => usda(171284), g: 367.5, how: '1½ cups × 245 g (USDA 171284 1 cup = 245 g)' },
      { name: 'Cucumber, with peel, raw, grated', src: () => usda(168409), g: 150, how: '1 medium cucumber (half of USDA\'s 301 g 8¼" cucumber; assumption)' },
    ],
    yieldNote: 'No cooking. Mint, cumin and salt are under 1 % of the weight and are left out of the calculation.',
    density: { gPerMl: 1.03, note: 'RULES.densityGPerMl "yogurt" (dahi and raita)' },
    crossChecks: [['CoFID 2021 17-832 Raita, homemade', 57]],
    confidence: 'B',
    confidenceWhy: 'no cooking; agrees with CoFID within 15 %.',
  },
  {
    id: 'med-chicken-shawarma',
    title: 'Chicken shawarma roll (pita, chicken, garlic-mayo sauce, salad)',
    makes: '10 rolls',
    references: [
      ['Unilever Food Solutions Pakistan, "Arabic shawarma with garlic mayonnaise" (R0080983): 1 kg boneless chicken thighs, 10 pita, 200 g garlic mayonnaise, 100 g cabbage, 80 g red onion, 100 g pickled cucumber, 45 ml olive oil, 30 g garlic', 'https://www.unileverfoodsolutions.pk/en/recipe/arabic-shawarma-with-garlic-mayonnaise-R0080983.html'],
      ['Masala TV, Chef Gulzar, "Chicken Shawarma": 500 g boneless chicken for 4, ½ cup yogurt, 2–3 tbsp olive oil, salad and pickles', 'https://masala.tv/chicken-shawarma-recipe/'],
    ],
    ingredients: [
      { name: 'Chicken thigh, boneless, skinless, raw', src: () => usda(173627), g: 1000, how: 'Unilever 1 kg (Masala TV 500 g per 4)', cooked: FACTORS.chickenThighRoasted.f, cookedNote: FACTORS.chickenThighRoasted.note },
      { name: 'Olive oil (marinade)', src: () => bedca(2543), g: 41, how: '45 ml × 0.91 g/ml', addedFat: true },
      { name: 'Garlic, raw', src: () => usda(169230), g: 30, how: 'Unilever 30 g' },
      { name: 'Pita bread, white', src: () => usda(174915), g: 600, how: '10 large pita × 60 g (USDA 174915 "1 pita, large")' },
      { name: 'Garlic-mayo sauce (analogue: USDA SR 171009 mayonnaise)', src: () => usda(171009), g: 200, how: 'Unilever 200 g garlic mayonnaise' },
      { name: 'Cabbage, raw', src: () => usda(169975), g: 100, how: 'Unilever 100 g' },
      { name: 'Onion, raw', src: () => usda(170000), g: 80, how: 'Unilever 80 g red onion' },
      { name: 'Pickled cucumber', src: () => usda(168558), g: 100, how: 'Unilever 100 g' },
    ],
    yieldNote: 'Chicken roasted/grilled: USDA thigh raw→roasted factor; marinade oil assumed retained. Other components uncooked.',
    crossChecks: [
      ['CoFID 2021 19-526 Doner kebab in pitta bread with salad', 248],
      ['USDA FDC FNDDS 2706962 Gyro sandwich', 184],
    ],
    crossNote: 'FNDDS 2706962 gyro uses a yogurt sauce and more vegetables; CoFID 19-526 doner in pitta with salad agrees within 5 %.',
    confidence: 'C',
    confidenceWhy: 'street/restaurant item; sauce amount varies a lot between shops.',
  },
  {
    id: 'es-cortado',
    title: 'Cortado (espresso with a little whole milk)',
    makes: '1 cup',
    references: [
      ['Nespresso, "Cortado" recipe: 40 ml café corto + 10–20 ml leche caliente + espuma', 'https://www.nespresso.com/recipes/co/es/28802COR-cortado.html'],
      ['Homegrounds (es), "Receta de café cortado": 60 ml espresso + 60 ml leche vaporizada (1:1)', 'https://www.homegrounds.co/es/cortado-recipe/'],
    ],
    ingredients: [
      { name: 'Espresso', src: () => usda(171891), g: 40, how: '40 ml (Nespresso) × 1.0 g/ml (USDA 171891: 1 fl oz = 29.6 g)' },
      { name: 'Milk, whole', src: () => usda(171265), g: 31, how: '30 ml × 1.03 g/ml (between Nespresso 10–20 ml + foam and Homegrounds 1:1)' },
    ],
    yieldNote: 'No cooking.',
    crossChecks: [['BEDCA 681 Café, con leche (more milk)', 38]],
    confidence: 'B',
    confidenceWhy: 'two-ingredient drink; the milk share varies by café.',
  },
  {
    id: 'es-cola-cao-con-leche',
    title: 'Cola Cao with semi-skimmed milk (label preparation)',
    makes: '1 glass',
    references: [
      ['Label: Cola Cao Original (Idilia Foods), preparation "2 cucharadas (14 g) en 200 ml de leche semidesnatada", via El Corte Inglés product page', 'https://www.elcorteingles.es/supermercado/0110120646400190-colacao-original-bote-760-g'],
      ['Label: Cola Cao Original 470 g (OFF 8410014441836, read 2026-10-13): per 100 g powder 376 kcal, P 6.8, C 78, F 2.4, fibre 7.8', 'https://world.openfoodfacts.org/product/8410014441836'],
    ],
    ingredients: [
      { name: 'Cola Cao Original powder (label)', src: () => ({ src: 'Label: Cola Cao Original 470 g', protein: 6.8, carbs: 78, fat: 2.4, fiber: 7.8, sugars: 70, satFat: 1.5 }), g: 14, how: '2 cucharadas = 14 g (label)' },
      { name: 'Milk, semi-skimmed', src: () => bedca(916), g: 206, how: '200 ml × 1.03 g/ml' },
    ],
    yieldNote: 'No cooking.',
    crossChecks: [['BEDCA 2648 Cacao en polvo azucarado (powder only, 389 kcal) + milk', null]],
    confidence: 'B',
    confidenceWhy: 'label powder plus BEDCA milk at the label ratio.',
  },
  {
    id: 'es-tostada-con-aceite',
    title: 'Tostada con aceite (toasted bread with olive oil)',
    makes: '1 tostada (2 slices of barra)',
    references: [
      ['Innerbuddies, "Spanish breakfast toast with olive oil": 4 rebanadas de pan, 2 cucharadas de aceite de oliva', 'https://www.innerbuddies.com/es/pages/recipe/spanish-breakfast-toast-with-olive-oil'],
      ['Vitónica, "El desayuno perfecto": 2 rebanadas de pan, 2 cucharadas de aceite de oliva, 1 tomate', 'https://www.vitonica.com/recetas-saludables/el-desayuno-perfecto-receta-saludable'],
      ['Carbajal Azcona Á., UCM (2015): rebanada de pan = 30 g', 'https://www.ucm.es/data/cont/docs/458-2015-10-22-pesos-medidas-caseras-raciones-2015.pdf'],
    ],
    ingredients: [
      { name: 'White bread (pan de barra)', src: () => bedca(2160), g: 60, how: '2 slices × 30 g (UCM)', cooked: FACTORS.toast.f, cookedNote: FACTORS.toast.note },
      { name: 'Olive oil', src: () => bedca(2543), g: 20, how: '10 g per slice: between Innerbuddies (6.75 g) and Vitónica (13.5 g)', addedFat: true },
    ],
    yieldNote: 'Bread loses water when toasted (BEDCA moisture); oil soaks in.',
    crossChecks: [['BEDCA 2165 Pan blanco, tostado (no oil)', 304]],
    crossNote: 'Shipped in group `bread-fried` (260–480 kcal per 100 g, RULES v1.4.0): at 456 kcal it is above plain toast (BEDCA 2165) because of the oil.',
    confidence: 'C',
    confidenceWhy: 'oil per slice varies a lot.',
  },
  {
    id: 'es-bocadillo-de-tortilla',
    title: 'Bocadillo de tortilla (barrita filled with tortilla de patatas)',
    makes: '1 bocadillo',
    references: [
      ['Carbajal Azcona Á., UCM (2015): panecillo/barrita = 80 g', 'https://www.ucm.es/data/cont/docs/458-2015-10-22-pesos-medidas-caseras-raciones-2015.pdf'],
      ['Recipe R-es-tortilla-de-patatas (research/recipes/es-tortilla-de-patatas.md): ⅛ of the tortilla as the filling', 'research/recipes/es-tortilla-de-patatas.md'],
    ],
    ingredients: [
      { name: 'White bread (barrita)', src: () => bedca(2160), g: 80, how: '1 panecillo/barrita (UCM 80 g)' },
      { name: 'Tortilla de patatas (this Lab recipe)', src: () => computed('es-tortilla-de-patatas'), g: null, how: '⅛ tortilla (one pincho)', fromRecipe: { id: 'es-tortilla-de-patatas', fraction: 1 / 8 } },
    ],
    yieldNote: 'Assembled, no cooking.',
    crossChecks: [['BEDCA 2476 Bocadillo (generic)', 224]],
    confidence: 'C',
    confidenceWhy: 'filling size varies between bars; the tortilla itself is an estimate.',
  },
  {
    id: 'es-bocadillo-de-atun',
    title: 'Bocadillo de atún (barrita with tuna in olive oil and tomato)',
    makes: '1 bocadillo',
    references: [
      ['Carbajal Azcona Á., UCM (2015): panecillo/barrita = 80 g; tomate rodaja = 20 g; aceite cucharada de postre = 5 g', 'https://www.ucm.es/data/cont/docs/458-2015-10-22-pesos-medidas-caseras-raciones-2015.pdf'],
      ['Label: Calvo Atún claro en aceite de oliva, 6 × 65 g (OFF 8410090051226, read 2026-10-13): serving 65 g', 'https://world.openfoodfacts.org/product/8410090051226'],
    ],
    ingredients: [
      { name: 'White bread (barrita)', src: () => bedca(2160), g: 80, how: '1 panecillo/barrita (UCM 80 g)' },
      { name: 'Tuna in olive oil, drained', src: () => bedca(2130), g: 65, how: '1 small can (Calvo label 65 g)' },
      { name: 'Tomato slices', src: () => bedca(2421), g: 40, how: '2 slices (UCM rodaja 20 g)' },
      { name: 'Olive oil drizzle', src: () => bedca(2543), g: 5, how: '1 dessert spoon (UCM 5 g)', addedFat: true },
    ],
    yieldNote: 'Assembled, no cooking.',
    crossChecks: [['BEDCA 2476 Bocadillo (generic)', 224]],
    confidence: 'C',
    confidenceWhy: 'filling size varies between bars.',
  },
];

// ---------------------------------------------------------------- engine
const results = new Map();
function computed(id) {
  const r = compute(RECIPES.find((x) => x.id === id));
  return { src: `Recipe R-${id}`, ...r.per100Raw };
}

export function compute(rec) {
  if (results.has(rec.id)) return results.get(rec.id);
  const rows = [];
  const tot = { protein: 0, carbs: 0, fat: 0, fiber: 0, satFat: 0, sugars: 0 };
  let satOk = true;
  let sugOk = true;
  let raw = 0;
  let cooked = 0;
  let addedFat = 0;
  let volume = 0;
  for (const ing of rec.ingredients) {
    let g = ing.g;
    if (ing.fromRecipe) {
      const sub = compute(RECIPES.find((x) => x.id === ing.fromRecipe.id));
      g = sub.cookedG * ing.fromRecipe.fraction;
      addedFat += sub.addedFatG * ing.fromRecipe.fraction;
    }
    const s = ing.src();
    const k = g / 100;
    const row = {
      name: ing.name,
      src: s.src,
      g,
      how: ing.how,
      factor: ing.cooked ?? 1,
      factorNote: ing.cookedNote,
      protein: s.protein * k,
      carbs: s.carbs * k,
      fat: s.fat * k,
      fiber: s.fiber * k,
    };
    row.kcal = 4 * row.protein + 4 * row.carbs + 9 * row.fat + 2 * row.fiber;
    rows.push(row);
    for (const key of ['protein', 'carbs', 'fat', 'fiber']) tot[key] += row[key];
    if (s.satFat == null) satOk = false;
    else tot.satFat += s.satFat * k;
    if (s.sugars == null) sugOk = false;
    else tot.sugars += s.sugars * k;
    raw += g;
    cooked += g * row.factor;
    if (ing.addedFat) addedFat += g;
    if (ing.cupG) volume += (g / ing.cupG) * CUP_ML;
  }
  if (rec.broth) cooked += rec.broth.g;
  const per = (x) => (x / cooked) * 100;
  const per100Raw = {
    protein: per(tot.protein),
    carbs: per(tot.carbs),
    fat: per(tot.fat),
    fiber: per(tot.fiber),
    satFat: satOk ? per(tot.satFat) : null,
    sugars: sugOk ? per(tot.sugars) : null,
  };
  const per100g = {
    kcal: r0(4 * per100Raw.protein + 4 * per100Raw.carbs + 9 * per100Raw.fat + 2 * per100Raw.fiber),
    protein: r1(per100Raw.protein),
    carbs: r1(per100Raw.carbs),
    fat: r1(per100Raw.fat),
    fiber: r1(per100Raw.fiber),
  };
  if (per100Raw.sugars != null) per100g.sugars = Math.min(r1(per100Raw.sugars), r1(per100g.carbs + 0.5));
  if (per100Raw.satFat != null) per100g.satFat = Math.min(r1(per100Raw.satFat), per100g.fat);
  const density = rec.densityFromCups
    ? { gPerMl: raw / volume, note: `from USDA cup weights of each chopped ingredient (${raw.toFixed(0)} g fill ${volume.toFixed(0)} ml)` }
    : rec.density ?? null;
  const out = {
    id: rec.id,
    rows,
    rawG: raw,
    cookedG: cooked,
    addedFatG: addedFat,
    addedFatPer100g: r1(per(addedFat)),
    per100Raw,
    per100g,
    density,
  };
  results.set(rec.id, out);
  return out;
}

const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

export function recipeMarkdown(rec, res) {
  const L = [];
  L.push(`# ${rec.title}`, '', `Record id: \`${rec.id}\` · Makes: ${rec.makes} · Researcher: javier · Date: ${TODAY}`, '');
  L.push('Calculated with `node research/javier/recipes.mjs` (EuroFIR standard-recipe method, docs/NUTRITION.md §6).', '');
  L.push('## References', '');
  rec.references.forEach(([t, u], i) => L.push(`${i + 1}. ${t}. ${u}`));
  L.push('', '## Standard recipe (raw edible grams)', '');
  L.push('| Ingredient | Raw g | Source | Cooking factor | Protein | Carbs | Fat | Fibre | kcal |', '|---|---|---|---|---|---|---|---|---|');
  for (const r of res.rows)
    L.push(`| ${r.name} (${r.how}) | ${f1(r.g)} | ${r.src} | ${r.factor.toFixed(3)}${r.factorNote ? ` (${r.factorNote})` : ''} | ${f1(r.protein)} | ${f1(r.carbs)} | ${f1(r.fat)} | ${f1(r.fiber)} | ${Math.round(r.kcal)} |`);
  const T = res.rows.reduce((a, r) => ({ p: a.p + r.protein, c: a.c + r.carbs, f: a.f + r.fat, fi: a.fi + r.fiber, k: a.k + r.kcal }), { p: 0, c: 0, f: 0, fi: 0, k: 0 });
  L.push(`| **Total** | **${f1(res.rawG)}** | | | **${f1(T.p)}** | **${f1(T.c)}** | **${f1(T.f)}** | **${f1(T.fi)}** | **${Math.round(T.k)}** |`, '');
  L.push('## Added fat', '', `${f1(res.addedFatG)} g of oil or butter-type fat in the dish → **${res.addedFatPer100g} g per 100 g as served**. All added fat is assumed eaten.`, '');
  L.push('## Yield', '');
  if (rec.broth) L.push(`Free broth: ${f1(rec.broth.g)} g (${rec.broth.note}).`, '');
  L.push(`${rec.yieldNote}`, '', `Raw total ${f1(res.rawG)} g → cooked weight **${f1(res.cookedG)} g** (yield ${(res.cookedG / res.rawG).toFixed(3)}).`, '');
  const p = res.per100g;
  L.push('## Per 100 g as served', '', `kcal **${p.kcal}**, protein ${p.protein} g, available carbs ${p.carbs} g, fat ${p.fat} g, fibre ${p.fiber} g${p.satFat != null ? `, saturated fat ${p.satFat} g` : ''}${p.sugars != null ? `, sugars ${p.sugars} g` : ''}.`, '');
  const atw = 4 * p.protein + 4 * p.carbs + 9 * p.fat + 2 * p.fiber;
  L.push('## Energy check', '', `4P + 4C + 9F + 2·fibre = ${atw.toFixed(1)} kcal vs stated ${p.kcal} kcal (kcal is computed this way, so it passes by construction).`, '');
  if (res.density) L.push('## Density for household servings', '', `${res.density.gPerMl.toFixed(3)} g/ml — ${res.density.note}.`, '');
  L.push('## Cross-check', '', '| Reference | kcal/100 g | Ours vs reference |', '|---|---|---|');
  for (const [label, kcal] of rec.crossChecks) {
    const d = kcal ? `${(((p.kcal - kcal) / kcal) * 100).toFixed(0)} %` : 'n/a';
    L.push(`| ${label} | ${kcal ?? 'n/a'} | ${d} |`);
  }
  const big = rec.crossChecks.filter(([, k]) => k && Math.abs(p.kcal - k) / k > 0.25);
  L.push('');
  if (big.length) L.push(`Differences above 25 %: ${big.map(([l]) => l).join('; ')}. See notes below.`, '');
  if (rec.crossNote) L.push(rec.crossNote, '');
  L.push('## Assumptions and confidence', '', `Confidence **${rec.confidence}**: ${rec.confidenceWhy}`, '');
  L.push('Carbohydrate is available carbohydrate (USDA by-difference minus fibre; BEDCA and CoFID as reported). Macros 100 % retained. No pork and no alcohol: chorizo, rabbit, pork, bacalao and wine in the reference recipes are omitted or replaced as stated.', '');
  return L.join('\n');
}

export function computeAll() {
  return RECIPES.map((rec) => ({ rec, res: compute(rec) }));
}

// CLI: print table, write recipe files.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.join(ROOT, 'research', 'recipes');
  fs.mkdirSync(dir, { recursive: true });
  console.log('Cooking factors:');
  for (const [k, v] of Object.entries(FACTORS)) console.log(`  ${k}: ${v.f.toFixed(3)}  (${v.note})`);
  console.log('\nid\traw g\tcooked g\tkcal\tP\tC\tF\tfib\taddedFat/100g\tdensity\tcross-checks');
  for (const { rec, res } of computeAll()) {
    const p = res.per100g;
    const cc = rec.crossChecks.filter(([, k]) => k).map(([, k]) => `${k}(${(((p.kcal - k) / k) * 100).toFixed(0)}%)`).join(' ');
    console.log(`${rec.id}\t${res.rawG.toFixed(0)}\t${res.cookedG.toFixed(0)}\t${p.kcal}\t${p.protein}\t${p.carbs}\t${p.fat}\t${p.fiber}\t${res.addedFatPer100g}\t${res.density ? res.density.gPerMl.toFixed(3) : '-'}\t${cc}`);
    fs.writeFileSync(path.join(dir, `${rec.id}.md`), recipeMarkdown(rec, res) + '\n');
  }
}
