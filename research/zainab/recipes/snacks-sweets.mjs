// Recipe sheets: samosa (aloo), kulfi, fruit chaat.
import { M, ASSUMED as A } from '../measures.mjs';

// FNDDS 2708730 "Samosa" recipe (input_food.csv): 100 g vegetable oil absorbed per 746 g of the other
// ingredients (300 g flour, 300 g mashed potato, 30 g butter, 80 g yogurt, 30 g peas, 6 g salt)
// = 13.4 g frying oil per 100 g of non-oil raw ingredients; its water is 42.69 g/100 g.
const FNDDS_SAMOSA_OIL = 100 / 746;

const samosaNonOil = { maida: 375, water: 185, potato: 700, peas: 90, onion: 40 };
const nonOilTotal = Object.values(samosaNonOil).reduce((a, b) => a + b, 0) + 30; // + spices, chillies, salt ≈ 30 g

export default [
  {
    id: 'samosa-aloo',
    dish: 'Aloo samosa (potato and peas), deep-fried',
    sources: [
      { ref: 'FoodFusion-punjabi-samosa', url: 'https://www.foodfusion.com/recipe/authentic-punjabi-samosa/', used: 'Dough: 3 cups maida, ¼ cup + 1 tsp ghee, ¾ cup water, 1½ tsp salt, ajwain, cumin. Filling: 650 g boiled potatoes, ½ cup peas, ½ cup onion, 2 tbsp oil, ½ tbsp ginger-garlic, 2–3 green chillies, 2 tsp crushed chilli, 1 tsp salt, black pepper, coriander. Makes 18 samosas (75 g dough portion each); fried at 150 °C until golden.' },
      { ref: 'FoodFusion-aloo-samosa', url: 'https://foodfusion.com/recipe/aloo-samosa-recipe/', used: 'Dough: 2 cups maida, 3 tbsp ghee, ½ cup water, ½ tsp salt, ½ tsp ajwain. Filling: ½ kg boiled potatoes, 1 cup peas (optional), ½ cup coriander, 1 tbsp green chilli, spices, 1–2 tbsp oil, 1½ tsp cumin. Deep-fried on medium-low.' },
      { ref: 'FNDDS-samosa', url: 'https://fdc.nal.usda.gov/ (FDC 2708730, input_food.csv)', used: 'Frying-oil uptake and cooked water: 100 g oil per 746 g other ingredients; water 42.69 g/100 g. Portions: small 25 g, regular/large 100 g.' },
    ],
    fatBasis: 'Dough ghee per 100 g maida: 14.5 (Punjabi samosa) and 15.4 g (aloo samosa) → 55 g ghee for 375 g maida; filling oil 28 g; frying oil taken up at the FNDDS samosa recipe ratio, 13.4 g per 100 g of the other raw ingredients.',
    ingredients: [
      ['maida', samosaNonOil.maida, '3 cups (Punjabi samosa, 18 pieces)'],
      ['water', samosaNonOil.water, '¾ cup + 1–2 tbsp'],
      ['ghee-desi', 55, '¼ cup + 1 tsp'],
      ['potato', samosaNonOil.potato, '650 g (Punjabi) / 500 g per 2 cups maida (aloo samosa → 750 g per 3 cups)'],
      ['peas-green', samosaNonOil.peas, '½ cup (72 g) / 1 cup optional'],
      ['onion', samosaNonOil.onion, '½ cup (Punjabi) / none'],
      ['oil-cooking', 28, '2 tbsp in the filling'],
      ['green-chilli', 3 * A.hariMirch, ''],
      ['coriander', 8, ''],
      ['chilli-powder', 2 * M.tspChilli, ''],
      ['cumin', 1.5 * M.tspCumin, ''],
      ['coriander-powder', M.tspCoriander, ''],
      ['ajwain', 1, ''],
      ['salt', 2.5 * M.tspSalt, '1½ tsp dough + 1 tsp filling'],
      ['oil-palm', +(nonOilTotal * FNDDS_SAMOSA_OIL).toFixed(0), 'frying oil absorbed (FNDDS samosa ratio); street frying oil is palm-based'],
    ],
    addedFat: ['ghee-desi', 'oil-cooking', 'oil-palm'],
    cooking: { method: 'moisture', water: 42.7, basis: 'Fried samosa at the FNDDS 2708730 "Samosa" water, 42.69 g/100 g.' },
    pieces: 18,
  },
  {
    id: 'kulfi-malai',
    dish: 'Kulfi (malai kulfi, milk reduced by half)',
    sources: [
      { ref: 'F&S-malai-kulfi', url: 'https://www.flourandspiceblog.com/kulfi-my-favorite-desi-treat/', used: '1 litre whole milk; 250 ml condensed milk; 1¼ cups cream; ¼ tsp salt; 6–8 pistachios; 6–8 almonds; 6 cardamom; simmered 45–60 min — "must reduce by half"; serves 5. (The ⅓ cup sugar is for an optional caramel-nut topping, not counted.)' },
      { ref: 'F&S-pista-kulfi', url: 'https://www.flourandspiceblog.com/easy-pista-kulfi-recipe/', used: 'No-cook kulfi: 3 slices bread, 50 g pistachios, 300 ml condensed milk, 350 ml evaporated milk, 250 ml cream; makes 8 kulfis (cross-check of richness and of kulfi size).' },
      { ref: 'CoFID-kulfi', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid', used: 'CoFID 2021 12-606 "Kulfi, homemade" (recipe): 457 kcal, fat 42.4 g/100 g — a cream-based UK recipe, much richer than a milk-reduction kulfi.' },
    ],
    fatBasis: 'No cooking fat; fat from milk and cream.',
    ingredients: [
      ['milk-whole', 1000 * 1.03, '1 litre (1.03 g/ml)'],
      ['condensed-milk', 250 * (M.cupCondensed / 237), '250 ml (USDA 306 g/cup)'],
      ['cream', 1.25 * M.cupCream, '1¼ cups heavy cream'],
      ['pistachio', 7 * 0.7, '6–8 pistachios (~0.7 g each, assumption)'],
      ['almonds', 7 * M.almond, '6–8 almonds (USDA 1.2 g each)'],
      ['cardamom', 1.5, ''],
      ['salt', 1.5, '¼ tsp'],
    ],
    addedFat: [],
    cooking: { method: 'yield', factor: 0.5, basis: 'F&S: the mixture "must reduce by half" (taken by weight).' },
  },
  {
    id: 'fruit-chaat',
    dish: 'Fruit chaat (Pakistani, with chaat masala and sugar)',
    sources: [
      { ref: 'TfT-fruit-chaat', url: 'https://www.teaforturmeric.com/fruit-chaat-with-chaat-masala/', used: '1 small apple, 1 small pear, 1 small mandarin, 1 small mango, ½ cup blueberries, ½ cup grapes, 2 tbsp pomegranate, 1 banana, 1½–2 tsp chaat masala, ¼ cup orange juice, 1 tsp sugar.' },
      { ref: 'Hamariweb-fruit-chaat', url: 'https://hamariweb.com/recipes/fruit_chaat_recipe_rid9951.aspx', used: '4–6 bananas; 1 cup guava; apple, pomegranate, orange optional; 4 tbsp lemon juice; 1 cup sweet lime; ½ cup sugar syrup; chaat masala; salt (search summary).' },
    ],
    fatBasis: 'No added fat.',
    ingredients: [
      ['banana', 300, 'TfT 1 banana (118 g); Hamariweb 4–6 bananas → mid ≈ 300 g'],
      ['apple', 150, '1 small apple (USDA 149 g)'],
      ['guava', 150, 'Hamariweb 1 cup (USDA 165 g)'],
      ['kinnow', 150, 'TfT mandarin + orange juice; Hamariweb sweet lime'],
      ['sugar', 25, 'TfT 1 tsp (4.2 g); Hamariweb ½ cup sugar syrup (~60 g sugar if 1:1) → 25 g'],
      ['lemon-juice', 30, 'Hamariweb 4 tbsp (60 g); TfT none'],
      ['salt', 3, 'chaat masala (mostly salt; spices negligible)'],
    ],
    addedFat: [],
    cooking: { method: 'none', basis: 'Raw fruit mixed; no cooking.' },
  },
];
