// Recipe sheets: breads — roti (chapati/phulka), tandoori roti, naan, roghni naan, paratha (home and
// dhaba), anda paratha.
// Yield for breads: moisture of the baked bread from a published analysis (dry matter is conserved;
// only water leaves on the tawa or in the tandoor).
import { M, ASSUMED as A } from '../measures.mjs';

// Rasool G. et al. (2006) "Chemical and nutritional quality of wheat chapattis fortified with defatted
// oilseed flours", Pakistan Journal of Agricultural Sciences 43(3–4): mean moisture of chapattis from
// whole-wheat and enriched flours 32.47–36.34%. Midpoint 34.4%. FNDDS 2707713 roti: 35.4%.
const ROTI_WATER = 34.4;
const roti_sources = [
  { ref: 'TfT-roti', url: 'https://www.teaforturmeric.com/roti-chapati/', used: '2 cups atta, ¼–½ tsp salt, 1 cup water, rolled 8–9", cooked on a tawa; butter/ghee only optional on top. 5 rotis from 90–100 g dough each.' },
  { ref: 'Rasool-2006', url: 'https://tehqeeqat.cle.org.pk/urdu/articleDetails/33350', used: 'Pakistan J. Agri. Sci. 43(3–4), 2006: chapatti moisture 32.47–36.34% (whole-wheat and enriched flours). Used for the cooked moisture.' },
  { ref: 'FNDDS-roti', url: 'https://fdc.nal.usda.gov/ (FDC 2707713)', used: 'Bread, chappatti or roti: water 35.4 g/100 g; portions small 6" 27 g, medium 7" 40 g, large 8" 52 g.' },
];

export default [
  {
    id: 'roti-home',
    dish: 'Roti / chapati / phulka, home tawa, no ghee',
    sources: roti_sources,
    fatBasis: 'No added fat (ghar ki roti without ghee).',
    ingredients: [
      ['atta', 100, 'whole-wheat atta (IFCT A019)'],
      ['water', 70, 'dough water (TfT 1 cup per 2 cups atta ≈ 0.99 g/g; any surplus leaves on the tawa)'],
      ['salt', 0.5, 'TfT ¼ tsp per 2 cups'],
    ],
    addedFat: [],
    cooking: { method: 'moisture', water: ROTI_WATER, basis: 'Cooked roti at 34.4 g water/100 g: midpoint of Rasool et al. 2006 (Pakistani chapattis, 32.47–36.34%); FNDDS 2707713 roti 35.4%.' },
  },
  {
    id: 'roti-ghee-home',
    dish: 'Roti with ghee (chupri roti), home',
    sources: [roti_sources[0], roti_sources[1], { ref: 'TfT-roti-butter', url: 'https://www.teaforturmeric.com/roti-chapati/', used: '"Brush the top of the roti with butter for an extra treat" — no quantity. Standard here: 1 tsp desi ghee per medium roti (assumption).' }],
    fatBasis: '1 tsp desi ghee (4.3 g, FDC 173412) per medium roti made from 27 g atta (assumption; the reference gives no amount).',
    ingredients: [
      ['atta', 27, 'one medium roti: 40 g roti at 34.4% water ← 26.9 g atta'],
      ['water', 19, 'dough water'],
      ['ghee-desi', M.tspGhee, '1 tsp brushed on'],
    ],
    addedFat: ['ghee-desi'],
    cooking: { method: 'cooked', grams: 40 + M.tspGhee, basis: 'One medium roti (FNDDS 2707713, 40 g) plus the ghee brushed on.' },
  },
  {
    id: 'tandoori-roti',
    dish: 'Tandoori roti (tandoor, whole-wheat)',
    sources: [
      { ref: 'ICT-notification-2024', url: 'https://en.dailypakistan.com.pk/15-Apr-2024/after-punjab-naan-and-roti-prices-go-down-in-islamabad', used: 'Islamabad deputy commissioner notification (Apr 2024): "Tandori roti (100 grams)", naan 120 grams.' },
      { ref: 'Hyderabad-notification-2024', url: 'https://tribune.com.pk/story/2463733/hyderabad-administration-drives-down-roti-prices-to-rs18', used: 'Hyderabad district administration (Apr 2024): 100-gram tandoor roti, 120-gram naan.' },
      roti_sources[1],
    ],
    fatBasis: 'No added fat in the dough or on top (plain tandoor roti).',
    ingredients: [
      ['atta', 100, 'atta dough (tandoors in Punjab use atta; some mix in maida — not modelled)'],
      ['water', 65, 'dough water'],
      ['salt', 1.2, ''],
    ],
    addedFat: [],
    cooking: { method: 'moisture', water: ROTI_WATER, basis: 'No analysis of tandoor roti found; taken at the chapatti moisture (Rasool et al. 2006, midpoint 34.4%). A thicker tandoor roti may hold more water, which would lower kcal/100 g.' },
  },
  {
    id: 'naan-plain',
    dish: 'Naan, plain (tandoor)',
    sources: [
      { ref: 'FoodFusion-homemade-naan', url: 'https://foodfusion.com/recipe/homemade_naan/', used: '500 g maida; 1 tsp salt; 2 tsp baking powder; 2 tsp sugar; 1½ tsp baking soda; 3 tbsp yogurt; 2 tbsp oil; water as required; butter as required on top (not counted: tandoor naan is sold plain). 4–5 naans.' },
      { ref: 'FoodFusion-roghni-naan', url: 'https://foodfusion.com/recipe/roghni-naan/', used: 'Yeasted dough: 3 cups maida, 1 cup water, ½ cup milk, 4 tbsp oil, 1 tsp sugar, 2 tsp yeast, ½ tsp salt; 120 g dough balls.' },
      { ref: 'CoFID-naan', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid', used: 'CoFID 2021 11-973 "Bread, naan, retail" (12 samples): water 30.8 g/100 g — used for the baked moisture.' },
      { ref: 'ICT-notification-2024', url: 'https://en.dailypakistan.com.pk/15-Apr-2024/after-punjab-naan-and-roti-prices-go-down-in-islamabad', used: 'Notified naan weight 120 g (Islamabad, Apr 2024; also Hyderabad and Gujranwala).' },
    ],
    fatBasis: 'Food Fusion plain naan: 2 tbsp oil (27 g) per 500 g maida in the dough; no butter counted.',
    ingredients: [
      ['maida', 500, '500 g (Food Fusion)'],
      ['yogurt', 45, '3 tbsp'],
      ['oil-cooking', 2 * M.tbspOil, '2 tbsp'],
      ['sugar', 2 * M.tspSugar, '2 tsp'],
      ['salt', M.tspSalt, '1 tsp'],
      ['water', 280, 'lukewarm water "as required" for a soft dough (~56% of flour; leaves in baking)'],
    ],
    addedFat: ['oil-cooking'],
    cooking: { method: 'moisture', water: 30.8, basis: 'Baked naan at CoFID 2021 11-973 "Bread, naan, retail" water, 30.8 g/100 g (FNDDS 2707613: 29.2).' },
  },
  {
    id: 'roghni-naan',
    dish: 'Roghni naan (milk-and-oil dough, egg wash, sesame)',
    sources: [
      { ref: 'FoodFusion-roghni-naan', url: 'https://foodfusion.com/recipe/roghni-naan/', used: '1 cup lukewarm water; 1 tsp sugar; 2 tsp instant yeast; ½ cup milk; 4 tbsp oil; ½ tsp salt; ¼ tsp baking soda; 3 cups maida; brushed with 1 egg yolk + 1 tsp milk; black and white sesame. Each naan from a 120 g dough ball.' },
      { ref: 'FatimaCooks-naan', url: 'https://fatimacooks.net/easy-keema-naan-recipe-in-the-oven-tawa/', used: 'Enriched naan dough: 7 g yeast, 1 cup milk, oil, yogurt, salt, sugar, egg (search summary; quantities other than yeast and milk not read).' },
      { ref: 'CoFID-naan', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid', used: 'CoFID 2021 11-973 naan water 30.8 g/100 g.' },
    ],
    fatBasis: 'Food Fusion roghni naan: 4 tbsp oil (54 g) per 3 cups maida, plus the egg-yolk wash and sesame.',
    ingredients: [
      ['maida', 3 * M.cupMaida, '3 cups (USDA 125 g/cup)'],
      ['water', M.cupWater, '1 cup'],
      ['milk-whole', M.cupMilk / 2, '½ cup'],
      ['oil-cooking', 4 * M.tbspOil, '4 tbsp'],
      ['sugar', M.tspSugar, '1 tsp'],
      ['salt', 3, '½ tsp'],
      ['egg-yolk', 17, '1 yolk (USDA large egg yolk ≈ 17 g)'],
      ['milk-whole', 5, '1 tsp in the wash'],
      ['sesame', 8, 'sprinkled; "as required" (assumption 2 g per naan)'],
    ],
    addedFat: ['oil-cooking'],
    cooking: { method: 'moisture', water: 30.8, basis: 'Baked at the CoFID 11-973 naan moisture (30.8 g/100 g).' },
  },
  {
    id: 'paratha-home',
    dish: 'Paratha, plain, home (light desi ghee)',
    sources: [
      { ref: 'TfT-lachha-paratha', url: 'https://www.teaforturmeric.com/lachha-paratha/', used: '2 cups atta, 1 cup water, salt; 6 parathas; ~2 tsp butter spread inside + 1–2 tsp on each side on the tawa (≈ 5 tsp per paratha: a rich lachha paratha).' },
      { ref: 'FoodFusion-paratha-4-ways', url: 'https://www.foodfusion.com/recipe/paratha-4-ways-recipe-food-fusion/', used: '2 cups atta, 3–4 tbsp oil/ghee in the dough, egg, sugar, salt; "ghee as required" for layering and frying (no amount).' },
      { ref: 'CoFID-paratha', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid', used: 'CoFID 2021 11-1104 "Paratha, homemade" (recipe): water 30.6, fat 14.4 g/100 g. FNDDS 2707715 paratha: fat 13.2 g/100 g, 1 paratha = 70 g.' },
    ],
    fatBasis: 'Ghee per paratha (40 g atta, TfT 240 g → 6): TfT ≈ 5 tsp butter (19 g fat); Food Fusion ≥ 0.6 tbsp oil/ghee in the dough plus unquantified frying ghee. The two analysed/recipe composition references (CoFID 14.4 g, FNDDS 13.2 g fat per 100 g) correspond to ~10 g fat per 70 g paratha. Standard home "light ghee" paratha: 10 g desi ghee per 40 g atta. The dhaba record carries the TfT-level load.',
    ingredients: [
      ['atta', 40, 'one paratha (TfT 2 cups = 240 g → 6)'],
      ['water', 40, 'dough (TfT 1 cup per 2 cups atta)'],
      ['ghee-desi', 10, 'layered + tawa'],
      ['salt', 0.3, ''],
    ],
    addedFat: ['ghee-desi'],
    cooking: { method: 'moisture', water: 30.6, basis: 'Cooked paratha at CoFID 2021 11-1104 "Paratha, homemade" water, 30.6 g/100 g (FNDDS 2707715: 33.5).' },
  },
  {
    id: 'paratha-dhaba',
    dish: 'Paratha, dhaba / restaurant (heavy ghee)',
    sources: [
      { ref: 'TfT-lachha-paratha', url: 'https://www.teaforturmeric.com/lachha-paratha/', used: '≈ 2 tsp butter inside + 1–2 tsp per side ≈ 5 tsp butter (≈ 23.7 g butter, 19 g fat) per paratha of 40 g atta.' },
      { ref: 'FoodFusion-paratha-4-ways', url: 'https://www.foodfusion.com/recipe/paratha-4-ways-recipe-food-fusion/', used: '3–4 tbsp oil/ghee in the dough per 2 cups atta + ghee to layer and fry.' },
      { ref: 'CoFID-paratha', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid', used: 'CoFID 11-1104 water 30.6 g/100 g.' },
    ],
    fatBasis: 'Dhaba/restaurant parathas are layered and fried in more ghee: 19 g fat per 40 g atta, the TfT lachha load (≈ 5 tsp butter), taken as 19 g desi ghee.',
    ingredients: [
      ['atta', 40, ''],
      ['water', 40, ''],
      ['ghee-desi', 19, 'TfT-level load'],
      ['salt', 0.3, ''],
    ],
    addedFat: ['ghee-desi'],
    cooking: { method: 'moisture', water: 30.6, basis: 'As the home paratha (CoFID 11-1104 water 30.6 g/100 g).' },
  },
  {
    id: 'anda-paratha-home',
    dish: 'Anda paratha (egg paratha), home, desi ghee',
    sources: [
      { ref: 'MasalaTV-anda-paratha', url: 'https://www.masala.tv/anda-paratha-recipe/', used: 'Shireen Anwar: dough for 2 parathas; 2 eggs beaten with 1 chopped onion, 2 green chillies, 2 tbsp coriander, ½ tsp cumin, ½ tsp chilli, salt; half the egg spread on each paratha on the tawa; fried in ghee "as required" (search summary; page not reachable from our proxy).' },
      { ref: 'SuperChef-anda-paratha', url: 'https://superchef.pk/anda-paratha-recipe', used: 'Dough: 3 cups flour, 1 tbsp oil, salt, water → 4 parathas; egg mix 4 eggs, 1 medium onion, 1 large tomato, ¼ cup coriander, 2 green chillies, chilli flakes, pepper; oil for frying (no amount).' },
    ],
    fatBasis: 'Neither reference gives the frying ghee. Standard: the home paratha load (10 g desi ghee) plus 1 tsp (4.3 g) for cooking the egg side = 14.3 g desi ghee per anda paratha (assumption).',
    ingredients: [
      ['atta', 40, 'one paratha (as paratha-home; SuperChef uses ~90 g flour per paratha)'],
      ['water', 40, 'dough'],
      ['egg', M.eggLarge, '1 egg per paratha (both references)'],
      ['onion', 40, 'MTV 1 onion per 2 eggs (55 g); SuperChef 1 medium per 4 (27 g)'],
      ['tomato', 22, 'SuperChef 1 large per 4 eggs (45 g); MTV none'],
      ['green-chilli', A.hariMirch, ''],
      ['coriander', 3, ''],
      ['ghee-desi', 10 + M.tspGhee, 'see added fat'],
      ['chilli-powder', 0.25 * M.tspChilli, ''],
      ['salt', 1, ''],
    ],
    addedFat: ['ghee-desi'],
    cooking: { method: 'moisture', water: 40, basis: 'No analysis of anda paratha found. Water set to 40 g/100 g: the paratha part at CoFID 11-1104 (30.6) and the egg-and-onion layer at the Bognár scrambled-egg yield (0.91 → ~70 g water/100 g), weighted by their cooked masses (≈ 65 : 35). Assumption, grade C.' },
  },
];
