// Recipe sheets: aloo paratha, sarson ka saag, chicken korma (home and shadi/restaurant), egg bhurji
// (khageena), aloo palak, ras malai, Rooh Afza with milk.
import { M, ASSUMED as A } from '../measures.mjs';
import { C } from '../conventions.mjs';

const EDIBLE = 0.75;
const kormaSources = [
  { ref: 'TfT-chicken-korma', url: 'https://www.teaforturmeric.com/authentic-chicken-korma/', used: '⅓ cup oil + 2 tbsp ghee; 2 large onions fried golden and crushed; 2 lb bone-in skinless chicken; 2 small tomatoes (optional); ¾ cup yogurt; whole spices; 8–10 garlic; 1" ginger; spices; 2⅛ tsp salt; green chillies; 2–3 tbsp cream; kewra; 10–12 almonds; covered 15 min, then ½–¾ cup boiling water.' },
  { ref: 'F&S-chicken-korma', url: 'https://www.flourandspiceblog.com/chicken-korma-simplified/', used: '1.5–2 lb bone-in chicken; 1 cup pre-fried onions; 1 tbsp each ginger and garlic; ½ cup yogurt; spices; ½ cup water simmered 25 min, then "until you see the oil separate".' },
  { ref: 'Shan-korma-pack', url: 'https://www.shanfoods.com/product/recipe-mixes/curry/korma/', used: 'Meat on bones 1 kg; onions 300 g fried light golden and crushed; yogurt 300 g; ginger julienne 2–3 tbsp; oil/ghee 1 cup / 175 ml; ½–1 cup water.' },
];
// Per kg bone-in chicken: fat TfT (72.7 + 25.6) / 0.907 = 108 g, Shan 161 g; onion TfT 331, Shan 300;
// yogurt TfT 203, F&S 154, Shan 300; water TfT 163, F&S 149, Shan 178.
const korma = (fat) => [
  ['chicken-meat', 1000, 'bone-in skinless; edible 0.75', { edible: EDIBLE }],
  ...fat,
  ['onion', 300, 'Shan 300 g; TfT 2 large'],
  ['yogurt', 203, 'TfT ¾ cup per 907 g'],
  ['tomato', 50, 'TfT 2 small, optional'],
  ['garlic', 27, ''],
  ['ginger', 20, 'paste + julienne'],
  ['green-chilli', 3 * A.hariMirch, ''],
  ['cream', 20, 'TfT 2–3 tbsp'],
  ['almonds', 12, 'TfT 10–12 almonds'],
  ['coriander-powder', 2 * M.tspCoriander, ''],
  ['chilli-powder', 1.5 * M.tspChilli, ''],
  ['cumin', 2 * M.tspCumin, ''],
  ['garam-masala', 3, 'whole spices, mace, nutmeg'],
  ['salt', 12, ''],
  ['water', 165, 'TfT ½–¾ cup, F&S ½ cup, Shan ½–1 cup per kg'],
];
const kormaCooking = {
  method: 'steps',
  steps: [
    { ing: 'onion', frac: C.onionCrisp, why: 'onions fried golden and crushed (birista; C.onionCrisp)' },
    { ing: 'chicken-meat', frac: C.chickenJuice / 2, why: 'covered braise, then cooked "until the oil separates": half of the stewing loss evaporates (assumption)' },
    { ing: 'water', frac: C.simmerCovered30 + 0.3, why: 'water simmered 25 min, then reduced until the oil separates (assumption)' },
  ],
};

export default [
  {
    id: 'aloo-paratha-home',
    dish: 'Aloo paratha (potato-stuffed), home, desi ghee',
    sources: [
      { ref: 'FoodFusion-saag-aloo-paratha', url: 'https://foodfusion.com/recipe/sarson-ka-saag-te-aloo-paratha/', used: 'Aloo paratha: 100 g dough ball per paratha; filling 4–5 medium boiled potatoes, 2 tbsp oil, 1 small onion, spices, coriander; fried in "ghee 1 tbs or as required"; makes 7–8.' },
      { ref: 'TfT-roti-dough', url: 'https://www.teaforturmeric.com/roti-chapati/', used: 'Atta dough ratio: 1 cup water per 2 cups atta (≈ 1 g water per g atta) → a 100 g dough ball ≈ 50 g atta.' },
      { ref: 'CoFID-mooli-paratha', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid', used: 'CoFID 2021 11-912 "Mooli paratha, homemade" (Leeds analysis, 5 samples; stuffed paratha): water 46.7 g/100 g — used for the cooked moisture.' },
    ],
    fatBasis: 'Food Fusion: 1 tbsp ghee (12.8 g) per paratha on the tawa, plus 2 tbsp oil in the filling for 7–8 parathas (≈ 3.6 g each).',
    ingredients: [
      ['atta', 50, '½ of a 100 g dough ball'],
      ['water', 50, 'dough water'],
      ['potato', Math.round((4.5 * M.potatoMedium) / 7.5), '4–5 medium potatoes per 7–8 parathas (USDA medium 213 g)'],
      ['onion', Math.round(M.onionSmall / 7.5), '1 small onion per batch'],
      ['oil-cooking', +((2 * M.tbspOil) / 7.5).toFixed(1), '2 tbsp per batch'],
      ['ghee-desi', M.tbspGhee, '1 tbsp per paratha'],
      ['coriander', 2, ''],
      ['coriander-powder', 0.7, 'crushed coriander seed'],
      ['chilli-powder', 0.3, ''],
      ['cumin', 0.3, ''],
      ['salt', 1.4, '1 tsp per batch + dough'],
    ],
    addedFat: ['oil-cooking', 'ghee-desi'],
    cooking: { method: 'moisture', water: 46.7, basis: 'Cooked to the water of the analysed stuffed paratha CoFID 2021 11-912 (46.7 g/100 g).' },
  },
  {
    id: 'sarson-ka-saag',
    dish: 'Sarson ka saag (mustard greens), home',
    sources: [
      { ref: 'FoodFusion-sarson-ka-saag', url: 'https://foodfusion.com/recipe/sarson-ka-saag-te-aloo-paratha/', used: '650 g mustard leaves, 350 g spinach, 150 g bathua, 50 g methi; 1 tsp salt; 6–7 garlic; 2" ginger; 5–6 green chillies; 2 cups water; covered 2 h on low; ½ cup maize flour + ½ cup hot water 10–12 min; tarka ¼ cup oil, 2 tbsp onion, garlic, red chillies, cumin.' },
      { ref: 'TfT-sarson-ka-saag', url: 'https://www.teaforturmeric.com/easy-sarson-ka-saag/', used: '2 bunches mustard greens, 1 bunch spinach, green chillies, 4–5 garlic, turmeric, 1¼ tsp salt, 2 cups water then 1 cup more; ¼ cup corn flour; 1½ tbsp kasuri methi; tarka ¼ cup oil + 3 tbsp ghee, 1 small onion, 2 tbsp ginger; a pat of butter to serve.' },
    ],
    fatBasis: 'Tarka: Food Fusion ¼ cup oil (54.5 g) per 1.2 kg greens; TfT ¼ cup oil + 3 tbsp ghee (≈ 93 g) per ~3 bunches. Standard 54.5 g oil + 20 g ghee per 1.2 kg greens; the makhan (butter) served on top is not included.',
    ingredients: [
      ['mustard-greens', 650, 'Food Fusion'],
      ['spinach', 500, 'Food Fusion 350 g spinach + 150 g bathua (as spinach)'],
      ['fenugreek-leaves', 50, 'Food Fusion 1 bunch methi'],
      ['maize-flour', 60, '½ cup makai ka atta (FF); TfT ¼ cup corn flour'],
      ['oil-cooking', M.cupOil / 4, '¼ cup tarka (both)'],
      ['ghee-desi', 20, 'TfT adds 3 tbsp ghee; half used'],
      ['onion', 40, 'tarka onion'],
      ['garlic', 30, ''],
      ['ginger', 25, ''],
      ['green-chilli', 30, ''],
      ['salt', 7, ''],
      ['water', M.cupWater * 2.5, '2 cups + ½ cup (FF); TfT 2 + 1 cups'],
    ],
    addedFat: ['oil-cooking', 'ghee-desi'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'water', frac: 0.5, why: 'greens cooked covered on low for 2 h, then 10–12 min with the maize flour: half the added water evaporates (assumption)' },
        { ing: ['mustard-greens', 'spinach', 'fenugreek-leaves'], frac: 0.16, why: 'greens lose water on long cooking: Bognár 2002 spinach stewed yield 0.84 (n = 25) → 16% of weight' },
      ],
    },
  },
  {
    id: 'chicken-korma-home',
    dish: 'Chicken korma, home style',
    sources: kormaSources,
    fatBasis: 'Per kg bone-in chicken: TfT 108 g (oil + ghee); Shan pack 161 g. Home standard 120 g (90 g oil + 30 g ghee).',
    ingredients: korma([['oil-cooking', 90, ''], ['ghee-desi', 30, '']]),
    addedFat: ['oil-cooking', 'ghee-desi'],
    cooking: kormaCooking,
  },
  {
    id: 'chicken-korma-restaurant',
    dish: 'Chicken korma, shadi / restaurant style',
    sources: kormaSources,
    fatBasis: 'Shadi/restaurant korma: 220 g per kg bone-in chicken (150 g palm-type oil + 70 g ghee) — the Shan pack (161 g) is the floor; caterers finish with a ghee layer.',
    ingredients: korma([['oil-palm', 150, ''], ['ghee-desi', 70, '']]),
    addedFat: ['oil-palm', 'ghee-desi'],
    cooking: kormaCooking,
  },
  {
    id: 'egg-bhurji',
    dish: 'Anda bhurji / khageena (spiced scrambled eggs)',
    sources: [
      { ref: 'TfT-egg-bhurji', url: 'https://www.teaforturmeric.com/egg-bhurji/', used: '4 large eggs; 3 tbsp oil; 1 large onion; 3 garlic; ½ green chilli; spices; ½ small tomato; cilantro; ¾ tsp kosher salt.' },
      { ref: 'F&S-khageena', url: 'https://www.flourandspiceblog.com/khageena/', used: '4 eggs; ¼ cup minced onion; 3–4 green chillies; salt; chilli powder; "oil for cooking".' },
    ],
    fatBasis: 'TfT 3 tbsp oil (41 g) per 4 eggs; F&S "oil for cooking" (taken as 1 tbsp). Standard 27 g per 4 eggs (mean).',
    ingredients: [
      ['egg', 4 * M.eggLarge, '4 large eggs'],
      ['oil-cooking', 27, ''],
      ['onion', 95, 'TfT 1 large (150 g); F&S ¼ cup (40 g)'],
      ['tomato', 25, 'TfT ½ small'],
      ['green-chilli', 12, ''],
      ['garlic', 5, ''],
      ['coriander', 3, ''],
      ['chilli-powder', 0.6, ''],
      ['turmeric', 0.75, ''],
      ['salt', 2.5, ''],
    ],
    addedFat: ['oil-cooking'],
    cooking: { method: 'yield', factor: C.eggScrambled, basis: 'Bognár 2002 "Scrambled eggs" (with ingredients) weight yield 0.91.' },
  },
  {
    id: 'aloo-palak-home',
    dish: 'Aloo palak (spinach and potato), home',
    sources: [
      { ref: 'TfT-aloo-palak', url: 'https://www.teaforturmeric.com/easy-spinach-potato-curry-aloo-palak/', used: '1 lb spinach; 1 large potato; ¼ cup oil + 1 tbsp ghee (optional); cumin; 1 medium onion; 1–2 green chillies; 3–4 garlic; ½" ginger; 1 medium-large tomato; spices; ¾–1 tsp salt; lemon. Spinach stir-fried ~10 min "until it loses its moisture".' },
      { ref: 'F&S-aloo-palak', url: 'https://www.flourandspiceblog.com/aloo-palak-pakistani-recipe/', used: '2–3 potatoes (275 g); 11 oz (312 g) spinach; 2 green chillies; ½ onion; 1 tomato; cumin; dried red chillies; ½ tsp garlic; ¾ tsp salt; spices; kasuri methi; lemon (oil not quantified).' },
    ],
    fatBasis: 'TfT ¼ cup oil (54.5 g) for ~820 g spinach + potato; ghee optional and left out. F&S gives no amount.',
    ingredients: [
      ['spinach', 454, 'TfT 1 lb; F&S 312 g'],
      ['potato', 320, 'TfT 1 large (369 g); F&S 275 g'],
      ['oil-cooking', M.cupOil / 4, ''],
      ['onion', 85, 'TfT 1 medium; F&S ½'],
      ['tomato', 140, 'TfT 1 medium-large; F&S 1'],
      ['garlic', 10, ''],
      ['ginger', 5, ''],
      ['green-chilli', 2 * A.hariMirch, ''],
      ['coriander-powder', M.tspCoriander, ''],
      ['cumin', 1.5 * M.tspCumin, ''],
      ['turmeric', 0.3 * M.tspTurmeric, ''],
      ['chilli-powder', 0.5 * M.tspChilli, ''],
      ['salt', 5.5, ''],
      ['lemon-juice', 5, ''],
    ],
    addedFat: ['oil-cooking'],
    cooking: { method: 'moisture', water: 77.7, basis: 'Final water set to CoFID 2021 15-787 "Curry, spinach and potato, masala, homemade" (77.7 g/100 g).' },
  },
  {
    id: 'ras-malai',
    dish: 'Ras malai (milk-powder dumplings in sweetened reduced milk)',
    sources: [
      { ref: 'TfT-ras-malai', url: 'https://www.teaforturmeric.com/easy-ras-malai-recipe/', used: 'Milk: 4½ cups whole milk + 12-oz can evaporated milk + ¼ cup + 1 tbsp sugar, cardamom, gently simmered. Balls: 1 cup whole milk powder, 2 tsp flour, 1 tsp baking powder, 2 tsp ghee + 2 tsp oil, 1 small egg; 5–7 g balls. 8 servings.' },
      { ref: 'F&S-rasmalai', url: 'https://www.flourandspiceblog.com/rasmalai-recipe-easy-soft-milk-powder-recipe/', used: 'Milk: 3–3.5 cups whole milk, ⅓ cup (70 g) sugar, salt, cardamom, 1 tbsp pistachios, gentle simmer. Balls: 1 cup (100 g) full-fat milk powder, ¾ tsp baking powder, 1½ tsp flour, 2 tsp oil, 1 large egg (56 g); 10–12 balls. 4 servings.' },
    ],
    fatBasis: 'No cooking fat beyond 2 tsp oil/ghee in the dough (≈ 9 g per 100 g milk powder).',
    ingredients: [
      ['milk-whole', 900, 'per 100 g milk powder: F&S 3.25 cups (793 g); TfT 4.5 cups (1098 g) per 128 g'],
      ['evaporated-milk', 150, 'TfT 12-oz can per 128 g powder (half weight; F&S none)'],
      ['sugar', 65, 'F&S 70 g; TfT 63 g'],
      ['milk-powder', 100, 'balls'],
      ['maida', 4, ''],
      ['oil-cooking', 9, '2 tsp'],
      ['egg', 45, 'F&S 1 large (56 g); TfT 1 small'],
      ['pistachio', 8, ''],
      ['cardamom', 1, ''],
    ],
    addedFat: ['oil-cooking'],
    cooking: { method: 'steps', steps: [{ ing: ['milk-whole', 'evaporated-milk'], frac: 0.2, why: 'milk kept at a gentle simmer while the balls cook (~20–30 min): 20% of its water evaporates (assumption)' }] },
  },
  {
    id: 'rooh-afza-milk',
    dish: 'Rooh Afza with milk (doodh sharbat)',
    sources: [
      { ref: 'Hamdard-label-OFF', url: 'https://world.openfoodfacts.org/product/8964000122075/hamdard-rooh-afza', used: 'Label per 100 ml: 307 kcal, 77 g sugars.' },
      { ref: 'FatSecret-RoohAfza-serving', url: 'https://mobile.fatsecret.com/calories-nutrition/hamdard/rooh-afza', used: '2 tbsp (30 ml) serving = 90 kcal.' },
    ],
    fatBasis: 'No added fat; milk fat only.',
    ingredients: [
      ['rooh-afza-syrup', 30, '2 tbsp syrup', { density: 1.3 }],
      ['milk-whole', 220 * 1.03, '220 ml chilled whole milk'],
    ],
    addedFat: [],
    cooking: { method: 'none', basis: 'One 250 ml glass.' },
  },
];
