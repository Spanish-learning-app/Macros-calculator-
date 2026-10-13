// Recipe sheets: daals (masoor, moong, mash, chana) — home, and chana daal restaurant/dhaba.
// Cup of split dal = 192 g (USDA FDC 174284 red lentils, 1 cup) for every split dal (assumption:
// split pulses pack alike). Salt: kosher salt in TfT recipes taken as table salt by volume × 0.5
// (Diamond Crystal kosher is about half as dense; assumption, sodium only).
import { M, ASSUMED as A } from '../measures.mjs';
import { C } from '../conventions.mjs';
const CUP = M.cupLentils;
// Water absorbed by a split dal boiled until soft and drained = cooked − dry, cooked weight from
// conserving dry matter: dry × (100 − w_dry) / (100 − w_cooked). w_cooked from CoFID 2021 boiled dahls.
const absorbed = (dryG, wDry, wCooked) => +(dryG * ((100 - wDry) / (100 - wCooked)) - dryG).toFixed(0);

const TfT_masoor = { ref: 'TfT-masoor', url: 'https://www.teaforturmeric.com/masoor-dal/', used: '1 cup masoor; 3¼ cups water (769 ml) + ~1 cup more after the tarka; ¼ cup oil; 1 tbsp ghee (optional); 1 small-medium onion; 4–5 garlic cloves; ½" ginger; 2 small tomatoes; 1 green chilli; 1 tsp cumin seeds; 1 tsp cumin, 1 tsp coriander, ¼–½ tsp chilli, ½ tsp turmeric; 1⅛ tsp salt; lemon; cilantro. Simmered 30 min lid ajar, then 5 min to consistency.' };
const FnS_masoor = { ref: 'F&S-masoor', url: 'https://www.flourandspiceblog.com/masoor-daal/', used: '1 cup masoor; 3–3.5 cups water; 1.5–2 tsp salt; 1 tsp chilli; ½ tsp turmeric; 2 + 3–4 garlic cloves; ⅓ cup onion; 2 tomatoes (optional); ½ cup cilantro; 3–4 green chillies; lemon; ¼ cup oil tarka with dried chillies and cumin.' };

export default [
  {
    id: 'masoor-daal-home',
    dish: 'Masoor daal, home style',
    sources: [TfT_masoor, FnS_masoor],
    fatBasis: 'Both references use ¼ cup oil (54.5 g, FDC 171411 1 cup = 218 g) per cup of dal; TfT\'s optional tbsp of ghee is left out. The result is above the ~3% starting value in NUTRITION.md §6 because both Pakistani references agree on ¼ cup.',
    ingredients: [
      ['masoor-dal', CUP, '1 cup (both refs)'],
      ['water', 900, 'TfT 769 + ~237 ml, F&S 3–3.5 cups → mean ~900 g'],
      ['oil-cooking', M.cupOil / 4, '¼ cup (both refs)'],
      ['onion', 70, 'TfT small-medium onion ~90 g; F&S ⅓ cup = 53 g'],
      ['tomato', 150, 'TfT 2 small = 182 g; F&S 2 tomatoes, optional'],
      ['garlic', 5 * M.clove, '~5 cloves'],
      ['ginger', 3, '½" piece'],
      ['green-chilli', 2 * A.hariMirch, '1–4 green chillies'],
      ['cumin', 2 * M.tspCumin, 'seeds in tarka + ground'],
      ['coriander-powder', M.tspCoriander, '1 tsp (TfT)'],
      ['chilli-powder', M.tspChilli * 0.75, '¼–1 tsp'],
      ['turmeric', M.tspTurmeric / 2, '½ tsp'],
      ['salt', 8, '1⅛ tsp table salt (TfT) to 1.5 tsp (F&S)'],
      ['lemon-juice', 5, '1 tsp'],
      ['coriander', 4, 'chopped cilantro'],
    ],
    addedFat: ['oil-cooking'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'water', frac: C.simmerAjar30 + C.simmerAjar30 / 6, why: 'simmer 30 min lid ajar + 5 min open to consistency (C.simmerAjar30 0.3 per 30 min)' },
        { ing: 'onion', frac: C.onionBrown, why: 'onion fried golden for the tarka (TfT ~7 min; C.onionBrown)' },
        { ing: 'tomato', frac: C.tomatoFry, why: 'tomatoes cooked soft in the tarka ~3 min (C.tomatoFry, CoFID 13-603)' },
      ],
    },
  },
  {
    id: 'moong-daal-home',
    dish: 'Moong daal, home style',
    sources: [
      { ref: 'TfT-moong', url: 'https://www.teaforturmeric.com/moong-dal-recipe/', used: '⅔ cup moong + ⅓ cup masoor; 3 cups stock + 2 cups water; 4 garlic; spices; 1¼ tsp kosher salt; 2 tbsp cream; tarka 2 tbsp oil + 2 tbsp ghee, cumin, dried chillies, green chilli, 2 garlic. "The water content will have reduced to about half of its original volume" after the 25–30 min simmer.' },
      { ref: 'F&S-moong', url: 'https://www.flourandspiceblog.com/moongdaal/', used: '¾ cup moong + ¼ cup masoor; 3 cups water; ¾–1 tsp chilli; ⅓ tsp turmeric; 1¼ tsp salt; ½ onion in the dal + ½ in the tarka; cilantro, green chillies, lemon; tarka 3 tbsp oil, 3 garlic, curry leaves, dried chillies, ½ tsp cumin.' },
    ],
    fatBasis: 'TfT 2 tbsp oil + 2 tbsp ghee (≈ 53 g) and F&S 3 tbsp oil (41 g) per cup of dal → standard 30 g oil + 15 g ghee (mean 47 g). TfT\'s cream (2 tbsp) is optional and left out.',
    ingredients: [
      ['moong-dal', CUP * (17 / 24), '⅔–¾ cup moong (TfT ⅔, F&S ¾)'],
      ['masoor-dal', CUP * (7 / 24), '¼–⅓ cup masoor (both mix it in)'],
      ['water', 950, 'TfT 5 cups (1185 g), F&S 3 cups (711 g) → mean'],
      ['oil-cooking', 30, 'tarka'],
      ['ghee-desi', 15, 'tarka (TfT uses ghee)'],
      ['onion', 55, 'F&S ½ onion (TfT none)'],
      ['garlic', 6 * M.clove, '4 + 2 cloves (TfT)'],
      ['green-chilli', 2 * A.hariMirch, ''],
      ['cumin', M.tspCumin, 'seeds + ground'],
      ['chilli-powder', M.tspChilli * 0.75, '½–1 tsp'],
      ['turmeric', M.tspTurmeric * 0.4, '⅓–½ tsp'],
      ['salt', 7, '1¼ tsp'],
      ['lemon-juice', 5, ''],
      ['coriander', 4, ''],
    ],
    addedFat: ['oil-cooking', 'ghee-desi'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'water', frac: 0.5, why: 'TfT states the water reduces to about half during the 25–30 min boil' },
        { ing: 'onion', frac: C.onionBrown, why: 'onion browned in the tarka (F&S "beautiful brown")' },
      ],
    },
  },
  {
    id: 'mash-daal-home',
    dish: 'Daal mash (urad), home style, dry (khushk)',
    sources: [
      { ref: 'TfT-maash', url: 'https://www.teaforturmeric.com/maash-ki-daal-urad-dal/', used: '1 cup urad dal soaked 30 min; 1 medium onion; 1 small-medium tomato; 5–6 garlic; ⅓ cup oil; cloves; 1½ tsp coriander, 1 tsp cumin, 1–1½ tsp Kashmiri chilli, ½ tsp turmeric, ½ tsp black pepper; 1¼ tsp kosher salt; green chilli, 1 tbsp ginger julienne, cilantro, lemon. Onion-tomato sautéed 10–12 min "until no moisture and the oil leaves the sides"; 1¾ cups water; "sauté until all the water has evaporated and the oil starts to leave the sides".' },
      { ref: 'FatimaCooks-maash', url: 'https://fatimacooks.net/mash-ki-daal-pakistani-urad-dal/', used: '1 cup (200 g) urad dal soaked 1 h; ⅓ cup oil; 1 medium onion (110 g); 2 small tomatoes (180 g); 1½ + 1 tbsp garlic; spices; ⅔ cup water with the boiled dal. 5 servings.' },
      { ref: 'MasalaTV-ShireenAnwar', url: 'https://www.masala.tv/masalaydaar-daal-mash-recipe/', used: 'Daal mash 1 pao (250 g) soaked 2 h, oil ¼ cup (via search summary; page not reachable from our proxy).' },
      { ref: 'F&S-maash', url: 'https://www.flourandspiceblog.com/ghar-ki-maash-ki-daal/', used: '1 cup maash boiled and drained; tarka of ½ onion and dried chillies in "a generous lug of oil" (no quantity).' },
    ],
    fatBasis: 'Oil per 200 g dry dal: TfT ⅓ cup per 192 g → 76 g; Fatima Cooks ⅓ cup (73 g); Masala TV ¼ cup per 250 g → 44 g. Median ~73 g → standard 70 g oil per 200 g dal. Daal mash is the oiliest home daal.',
    ingredients: [
      ['urad-dal', 200, '1 cup (Fatima Cooks 200 g; TfT 1 cup)'],
      ['water', absorbed(200, 9.16, 72.0), 'water held by the soaked, boiled dal: dry matter conserved to CoFID 13-059 boiled urad dahl (72.0% water); all other water is cooked off (TfT)'],
      ['oil-cooking', 70, 'see added fat'],
      ['onion', M.onionMedium, '1 medium (both)'],
      ['tomato', 140, 'TfT 1 small-medium; Fatima 180 g'],
      ['garlic', 6 * M.clove, '5–6 cloves'],
      ['ginger', 6, '1 tbsp julienne'],
      ['green-chilli', 2 * A.hariMirch, ''],
      ['coriander-powder', 1.5 * M.tspCoriander, '1½ tsp'],
      ['cumin', 1.5 * M.tspCumin, ''],
      ['chilli-powder', 1.5 * M.tspChilli, 'Kashmiri + red chilli'],
      ['turmeric', M.tspTurmeric / 2, ''],
      ['black-pepper', M.tspPepper / 2, ''],
      ['salt', 7, ''],
      ['coriander', 3, ''],
      ['lemon-juice', 2.5, ''],
    ],
    addedFat: ['oil-cooking'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'onion', frac: C.onionBrown, why: 'onion-tomato masala sautéed 10–12 min until dry and the oil separates' },
        { ing: 'tomato', frac: C.tomatoBhuna, why: 'tomato cooked to a paste (C.tomatoBhuna)' },
      ],
    },
  },
  {
    id: 'chana-daal-home',
    dish: 'Chana daal, home style',
    sources: [
      { ref: 'F&S-chana', url: 'https://www.flourandspiceblog.com/chana-daal-instant-pot/', used: '1 cup chana daal soaked; 4 cups water (stovetop); 1–2 tomatoes; 1 tsp salt; ¾ tsp chilli, ½ tsp coriander, ¼ tsp turmeric; ¼ cup cilantro; green chillies; lemon; tarka 3 tbsp oil, ½ onion, dried chillies, cumin.' },
      { ref: 'TfT-chana-IP', url: 'https://www.teaforturmeric.com/instant-pot-pakistani-chana-dal/', used: '¾ cup chana dal; 2 cups water; 1 small-medium tomato; 1 tsp kosher salt; spices; tarka 2 tbsp ghee + 1 tbsp oil, 1 small onion, 3 garlic, green chilli, ginger.' },
    ],
    fatBasis: 'F&S 3 tbsp oil (41 g) per cup; TfT 2 tbsp ghee + 1 tbsp oil (≈ 40 g) per ¾ cup → 53 g per cup. Standard 30 g oil + 17 g ghee (mean 47 g per 192 g dal).',
    ingredients: [
      ['chana-dal', CUP, '1 cup'],
      ['water', 790, 'F&S 4 cups (stovetop) / TfT 2 cups per ¾ cup (pressure) → mean per cup'],
      ['oil-cooking', 30, ''],
      ['ghee-desi', 17, ''],
      ['tomato', 120, '1–2 tomatoes / 1 small-medium'],
      ['onion', 60, '½ onion / 1 small'],
      ['garlic', 3 * M.clove, 'TfT'],
      ['ginger', 3, ''],
      ['green-chilli', 2 * A.hariMirch, ''],
      ['chilli-powder', 0.75 * M.tspChilli, ''],
      ['coriander-powder', 0.5 * M.tspCoriander, ''],
      ['turmeric', M.tspTurmeric / 4, ''],
      ['cumin', M.tspCumin, ''],
      ['salt', 6, '1 tsp'],
      ['coriander', 4, ''],
      ['lemon-juice', 3, ''],
    ],
    addedFat: ['oil-cooking', 'ghee-desi'],
    cooking: {
      method: 'moisture',
      water: 64.1,
      basis: 'Chana daal is served thick. Final water set to CoFID 2021 15-641 "Curry, chick pea dhal, homemade" (Punjabi dish, from UK dietary-survey records): 64.1 g/100 g.',
    },
  },
  {
    id: 'chana-daal-restaurant',
    dish: 'Chana daal fry, restaurant / dhaba style',
    sources: [
      { ref: 'TfT-chana-restaurant', url: 'https://www.teaforturmeric.com/chana-dal/', used: '"Chana Dal (Easy, Restaurant-Style)": 1 cup chana dal boiled 35 min in 8–9 cups salted water and drained; masala 2–3 tbsp oil, 1 small onion, 4–5 garlic, ¾" ginger, 1 tomato puréed, spices, 1 cup water simmered 8–10 min; tarka 4 tbsp oil + 2 tbsp butter/ghee, chillies, ginger, cilantro; "no longer watery but still moist".' },
      { ref: 'F&S-dhaba-dal-fry', url: 'https://www.flourandspiceblog.com/chanay-daal/', used: '"Dhaba Dal or Chana Dal Fry": 1 cup chana daal (cooked); 4 tbsp ghee + oil; ½ cup onion; 1.5 tbsp ginger; 1.5 tbsp garlic; 2 tomatoes; 1¼ tsp salt; spices; 2 tbsp lemon; 1.5 cups water, simmered 10 min.' },
    ],
    fatBasis: 'TfT restaurant-style: 2.5 tbsp oil (34 g) + 4 tbsp oil (54 g) + 2 tbsp ghee (26 g) = 114 g per cup; F&S dhaba fry: 4 tbsp ghee + oil (54 g). Standard 84 g (54 g palm-type oil + 30 g ghee), mean of the two. The resulting share of served weight is in the recipe file (above the 6–8% starting range because the TfT restaurant-style tarka is heavy).',
    ingredients: [
      ['chana-dal', CUP, '1 cup dry'],
      ['water', absorbed(CUP, 9.18, 67.3), 'held by the boiled, drained dal (CoFID 13-077 boiled split chick peas, 67.3% water)'],
      ['water', 296, 'TfT 1 cup / F&S 1.5 cups added to the masala'],
      ['oil-palm', 54, ''],
      ['ghee-desi', 30, ''],
      ['onion', 75, 'TfT 1 small; F&S ½ cup'],
      ['tomato', 150, 'TfT 1; F&S 2'],
      ['garlic', 14, '4–5 cloves / 1.5 tbsp'],
      ['ginger', 14, 'crushed + julienne'],
      ['green-chilli', 2 * A.hariMirch, ''],
      ['chilli-powder', M.tspChilli, ''],
      ['coriander-powder', 1.5 * M.tspCoriander, ''],
      ['turmeric', M.tspTurmeric / 3, ''],
      ['cumin', M.tspCumin, ''],
      ['salt', 8, ''],
      ['lemon-juice', 15, 'F&S 2 tbsp, TfT 1–2 tsp'],
      ['coriander', 6, ''],
    ],
    addedFat: ['oil-palm', 'ghee-desi'],
    cooking: {
      method: 'moisture',
      water: 64.1,
      basis: 'Served thick ("no longer watery but still moist", TfT). Same consistency as the home record: final water set to CoFID 2021 15-641 "Curry, chick pea dhal, homemade" (Punjabi), 64.1 g/100 g, so home and restaurant differ by fat, not by water.',
    },
  },
];
