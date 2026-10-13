// Recipe sheets: home vegetable dishes (aloo gobi, bhindi) and the desi omelette.
import { M, ASSUMED as A } from '../measures.mjs';
import { C } from '../conventions.mjs';

export default [
  {
    id: 'aloo-gobi-home',
    dish: 'Aloo gobi (potato and cauliflower sabzi), home style',
    sources: [
      { ref: 'TfT-aloo-gobi', url: 'https://www.teaforturmeric.com/aloo-gobi/', used: '¼ cup oil; 1 tsp cumin seeds; 1 medium onion (golden, 6–7 min); 5 garlic; ¾–1" ginger; 2–3 small tomatoes; 2 tsp coriander, 1 tsp cumin, ½ tsp turmeric, ¼–½ tsp chilli, ¼ tsp black pepper; 1¼ tsp salt; 1 small head cauliflower; 2 small potatoes; green chilli; lemon; cilantro. Covered 25 min "until … all the moisture is gone".' },
      { ref: 'F&S-aloo-gobi', url: 'https://www.flourandspiceblog.com/aalu-gobi-spicy-potato-and-cauliflower-curry/', used: '¼ cup oil; cumin seeds; ½ cup onion; 3 cups diced potatoes; 2 cups cauliflower; 2–3 tomatoes cooked to a bhuna; 5–6 garlic; ½ tsp ginger; 1 tsp chilli, ⅓ tsp turmeric, ½ tsp coriander; ¾ tsp+ salt; 3 tbsp cilantro; 3 green chillies; lemon. Covered on low 20–25 min.' },
    ],
    fatBasis: 'Both references: ¼ cup oil (54.5 g) for about 600–700 g of vegetables.',
    ingredients: [
      ['potato', 395, 'TfT 2 small = 340 g (USDA small 170 g); F&S 3 cups diced = 450 g (USDA ½ cup diced = 75 g)'],
      ['cauliflower', 240, 'TfT 1 small head = 265 g (USDA); F&S 2 cups chopped = 214 g (USDA 107 g/cup)'],
      ['oil-cooking', M.cupOil / 4, '¼ cup (both)'],
      ['onion', 95, 'TfT 1 medium 110 g; F&S ½ cup = 80 g'],
      ['tomato', 250, 'TfT 2–3 small (228 g); F&S 2–3 (≈ 308 g)'],
      ['garlic', 16, '5–6 cloves'],
      ['ginger', 5, ''],
      ['green-chilli', 2 * A.hariMirch, ''],
      ['coriander-powder', 1.25 * M.tspCoriander, ''],
      ['cumin', 1.5 * M.tspCumin, 'seeds + ground'],
      ['turmeric', 0.4 * M.tspTurmeric, ''],
      ['chilli-powder', 0.7 * M.tspChilli, ''],
      ['salt', 6.5, ''],
      ['coriander', 5, ''],
      ['lemon-juice', 4, ''],
    ],
    addedFat: ['oil-cooking'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'onion', frac: C.onionSoft, why: 'onion fried golden 6–7 min (C.onionSoft, CoFID 13-501)' },
        { ing: 'tomato', frac: C.tomatoBhuna, why: 'tomatoes cooked to a bhuna until the oil rises (F&S)' },
        { ing: 'cauliflower', frac: 0.09, why: 'cauliflower stewed in its own moisture: Bognár 2002 "Cauliflower, stewed" yield 0.92 (n = 12) → 8% of weight ≈ 9% of its water' },
      ],
    },
  },
  {
    id: 'bhindi-home',
    dish: 'Bhindi (okra) sabzi, home style',
    sources: [
      { ref: 'TfT-bhindi', url: 'https://www.teaforturmeric.com/bhindi-okra-curry/', used: '¼ cup oil (plus more as needed); 1 lb okra stir-fried until crisp; 1 large onion golden ~10 min; 2–3 garlic; 1 tsp ginger; 2 medium tomatoes; 1 tsp salt; cumin seeds, 1 tsp coriander, 1 tsp cumin, ½ tsp turmeric, chilli; green chillies; cilantro; lemon. "This dry curry…"' },
      { ref: 'F&S-bhindi', url: 'https://www.flourandspiceblog.com/bhindi-ki-sabzi-or-spicy-pakistani-style-okra/', used: '1 lb okra; "a little less than ¼ cup" oil; dried red chillies; cumin seeds; chilli flakes; ¾–1 tsp salt; cooked uncovered 15–18 min.' },
    ],
    fatBasis: 'TfT ¼ cup (54.5 g) and F&S "a little less than ¼ cup" (taken as 3.5 tbsp = 48 g) per lb of okra → 52 g.',
    ingredients: [
      ['okra', 454, '1 lb (both)'],
      ['oil-cooking', 52, ''],
      ['onion', 75, 'TfT 1 large (150 g); F&S none'],
      ['tomato', 123, 'TfT 2 medium (246 g); F&S none'],
      ['garlic', 7.5, '2–3 cloves (TfT)'],
      ['ginger', M.tspGinger, '1 tsp'],
      ['green-chilli', A.hariMirch, ''],
      ['cumin', 2 * M.tspCumin, ''],
      ['coriander-powder', 0.5 * M.tspCoriander, ''],
      ['turmeric', 0.25 * M.tspTurmeric, ''],
      ['chilli-powder', 0.75 * M.tspChilli, ''],
      ['salt', 5.5, ''],
      ['lemon-juice', 2.5, ''],
    ],
    addedFat: ['oil-cooking'],
    cooking: {
      method: 'moisture',
      water: 74.3,
      basis: 'Dry sabzi. Final water set to the analysed CoFID 2021 15-627 "Curry, bhindi subji, homemade" (University of Leeds analysis of commonly eaten South Asian foods, 6 samples): 74.3 g/100 g.',
    },
  },
  {
    id: 'desi-omelette',
    dish: 'Desi omelette (anda omelette with pyaz, tamatar, hari mirch)',
    sources: [
      { ref: 'kfoods-lahori-omelette', url: 'https://kfoods.com/recipes/lahori-omelet_rid3467', used: '3 large eggs; 1 small onion; 1 green chilli; 1 tomato; 1 tsp milk; ¼ tsp red chilli; salt, pepper; onions fried in 1½ tbsp cooking oil, eggs in a "greased" pan.' },
      { ref: 'TfT-desi-omelet', url: 'https://www.teaforturmeric.com/desi-omelet-masala-omelet/', used: '3 large eggs; ½ small onion; ½ small Roma tomato; 1 green chilli; 3 tbsp cilantro; ¼ tsp chilli; 2 tbsp oil (vegetables sautéed, then lifted out) + 2 tbsp butter for the eggs.' },
      { ref: 'FoodFusion-butter-masala-omelette', url: 'https://foodfusion.com/recipe/butter-masala-omelette/', used: '3 whisked eggs; 2 medium onions; 3 medium tomatoes; 60 g butter + 1 tbsp oil (a richer, gravy-style omelette; fat data point only).' },
    ],
    fatBasis: 'Standard 1½ tbsp oil (20 g) per 3 eggs, as in the Lahori omelette (kfoods), the plainest desi version. TfT (2 tbsp oil + 2 tbsp butter) and Food Fusion (60 g butter + 1 tbsp oil) are richer; users who cook with more can add oil or ghee as an add-on.',
    ingredients: [
      ['egg', 3 * M.eggLarge, '3 large eggs (USDA large egg 50 g)'],
      ['oil-cooking', 1.5 * M.tbspOil, '1½ tbsp (kfoods)'],
      ['onion', 50, 'kfoods 1 small (70 g); TfT ½ small (35 g)'],
      ['tomato', 60, 'kfoods 1 tomato; TfT ½ small Roma (31 g)'],
      ['green-chilli', A.hariMirch, '1'],
      ['coriander', 3, ''],
      ['milk-whole', 5, '1 tsp milk (kfoods)'],
      ['chilli-powder', 0.25 * M.tspChilli, ''],
      ['salt', 1.5, ''],
    ],
    addedFat: ['oil-cooking'],
    cooking: { method: 'yield', factor: C.eggScrambled, basis: 'Bognár 2002 table 2, "Scrambled eggs" (with ingredients, pan-fried) weight yield 0.91 ± 0.04 (n = 6); fried egg 0.87.' },
  },
];
