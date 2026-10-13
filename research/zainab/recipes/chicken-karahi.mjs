// Recipe sheet: chicken karahi — home and restaurant standard recipes (one base, two fat loads).
import { M, ASSUMED as A } from '../measures.mjs';
import { C } from '../conventions.mjs';

// Bone: curry/karahi-cut skinless broiler pieces. Edible fraction 0.75, from CoFID 2021
// "weighed with bone" factors for casseroled chicken (breast 0.90, thighs 0.83, drumsticks 0.65,
// wing quarter 0.67; whole raw bird incl. back/neck 0.65) — a karahi cut is mostly breast,
// thigh and leg pieces, so 0.75 is taken as the mid value (assumption, grade C).
const EDIBLE = 0.75;
const CHICKEN_PURCHASED = 1000; // g bone-in skinless pieces per pot (scale of the sources)

const sources = [
  {
    ref: 'TfT',
    url: 'https://www.teaforturmeric.com/chicken-karahi/',
    used: '907 g skinless bone-in chicken; 2 tbsp ghee + 2–3 tbsp oil; 1 small onion ~150 g; 8 small tomatoes ~600 g; 8 garlic cloves; 3/4" ginger + 1–2 tbsp julienne; 2 tsp coriander, 1 tsp cumin, 1 tsp red chilli, 2 tsp kosher salt; 1/4 cup yogurt; 1 tsp black pepper; 1/2 tsp garam masala. No water; reduced on high until ghee/oil separates; oil not drained.',
  },
  {
    ref: 'SuperChef',
    url: 'https://superchef.pk/chicken-karahi-recipe-urdu',
    used: '500 g chicken; 4 tbsp oil; 250 g tomatoes; 1 tbsp garlic; 1 tbsp ginger; 4 green chillies; 1.5 tsp crushed red chilli; 1 tsp black pepper; cumin; finished with yogurt. No water.',
  },
  {
    ref: 'SBS/Jillani',
    url: 'https://www.sbs.com.au/food/recipe/chicken-karahi/vndjbwzjv',
    used: '1 whole chicken ~1 kg skin removed; 1/2 cup (150 ml) vegetable oil; 6 Roma tomatoes; 3 tsp garlic paste; 3 tsp ginger paste; 2 tsp salt; 2 tsp Kashmiri chilli; 1 tsp each coriander, cumin; 1.5 tbsp yogurt; 1 tsp black pepper; 1/2 tsp garam masala. Cooked 25–30 min, no water stated.',
  },
  {
    ref: 'MasalaTV-dawat',
    url: 'https://masala.tv/chicken-karahi-recipe-dawat/',
    used: 'Restaurant/dawat style: 1 kg chicken; 175 ml oil (½ cup for the paste + ½ cup for the tomatoes in the method); 6 tomatoes; 100 g yogurt; 1½ tbsp garlic paste; 2 tbsp ginger paste + 2 tbsp julienne; 6 green chillies; karahi masala packet; 2 cups water cooked down.',
  },
  {
    ref: 'MasalaTV-highway',
    url: 'https://masala.tv/highway-karahi-recipe/',
    used: 'Highway/dhaba style: 500 g chicken; 1 cup oil, half taken out before the tomatoes (≈ 109 g kept); 4 tomatoes; 2 tbsp ginger-garlic paste; 6 green chillies.',
  },
  {
    ref: 'Shan-white-karahi',
    url: 'https://www.shanfoods.com/product/recipe-mixes/stir-fried/chicken-white-karahi/',
    used: 'Pack recipe: 1 kg chicken; oil/ghee 1 cup / 175 ml; ½ cup yogurt (100 g). Used only as a restaurant fat-load data point.',
  },
];

// Shared base per 1000 g bone-in pieces (scaled to 1 kg):
//  tomatoes: TfT 600/0.907 = 662 g; SuperChef 500 g; SBS 6 plum × 62 g = 372 g → median 500 g.
//  onion: TfT only (165 g/kg); SBS, SuperChef none → 55 g (mean of the three).
//  yogurt: TfT 1/4 cup = 61 g → 68 g/kg; SBS 1.5 tbsp ≈ 22 g; SuperChef in method only → 40 g.
//  garlic: TfT 8 cloves = 24 g → 26 g/kg; SuperChef 1 tbsp ≈ 8.4 g → 17 g/kg; SBS 3 tsp = 8.4 g → 17 g.
//  ginger: paste + julienne ≈ 20 g; green chillies 4 × 5 g = 20 g; coriander leaves 8 g (SBS ½ cup = 8 g).
//  spices: chilli 2 tsp, coriander 2 tsp, cumin 1 tsp, black pepper 1 tsp, garam masala ½ tsp, salt 2 tsp.
const base = (fat) => [
  ['chicken-meat', CHICKEN_PURCHASED, 'bone-in skinless karahi-cut pieces; edible 0.75', { edible: EDIBLE }],
  ...fat,
  ['tomato', 500, 'median of TfT 662, SuperChef 500, SBS 372 g/kg'],
  ['onion', 55, 'mean of TfT 165, SBS 0, SuperChef 0 g/kg'],
  ['yogurt', 40, 'TfT 68, SBS 22 g/kg'],
  ['garlic', 20, 'TfT 26, SuperChef 17, SBS 17 g/kg'],
  ['ginger', 20, 'paste + julienne (2 × 1" pieces ≈ 20 g)'],
  ['green-chilli', 4 * A.hariMirch, '4 hari mirch'],
  ['coriander', 8, 'SBS ½ cup = 8 g'],
  ['chilli-powder', 2 * M.tspChilli, '2 tsp'],
  ['coriander-powder', 2 * M.tspCoriander, '2 tsp'],
  ['cumin', M.tspCumin, '1 tsp'],
  ['black-pepper', M.tspPepper, '1 tsp'],
  ['garam-masala', 1, '½ tsp'],
  ['salt', 2 * M.tspSalt, '2 tsp'],
];

// Cooking loss (water balance, NUTRITION.md §6 step 5, third option): no water is added. The
// pieces are covered ~20 min, then the pot is reduced on high "until the ghee/oil separates and the
// chicken looks glossy" (TfT; SBS cooks 25–30 min stirring). So: tomatoes cooked down to a paste,
// onion browned, and the juices the chicken releases are driven off in the final bhuna.
const cooking = {
  method: 'steps',
  steps: [
    { ing: 'tomato', frac: C.tomatoBhuna, why: 'tomatoes reduced to a paste until oil separates (C.tomatoBhuna 0.7)' },
    { ing: 'onion', frac: C.onionBrown, why: 'onion browned (C.onionBrown 0.5)' },
    { ing: 'chicken-meat', frac: C.chickenJuice, why: 'chicken juices (USDA stewed yield 0.784 → 29% of its water) reduced off in the bhuna' },
  ],
};

export default [
  {
    id: 'chicken-karahi-home',
    dish: 'Chicken karahi, home style',
    style: 'home',
    sources,
    fatBasis:
      'Fat per kg bone-in chicken in the home sources: TfT 2 tbsp ghee (27 g) + 2.5 tbsp oil (34 g) = 61 g for 907 g → 67 g/kg; SuperChef 4 tbsp (54 g) for 500 g → 109 g/kg; SBS 150 ml × 0.92 = 138 g/kg. Median 109 g/kg → standard 100 g/kg (80 g cooking oil + 20 g desi ghee, after TfT). Lands near the top of the home 6–10% range (see the recipe file).',
    ingredients: base([
      ['oil-cooking', 80, 'home cooking oil'],
      ['ghee-desi', 20, 'desi ghee (TfT uses ghee + oil)'],
    ]),
    addedFat: ['oil-cooking', 'ghee-desi'],
    cooking,
  },
  {
    id: 'chicken-karahi-restaurant',
    dish: 'Chicken karahi, restaurant style',
    style: 'restaurant',
    sources,
    fatBasis:
      'Restaurant fat loads per kg bone-in chicken: MasalaTV dawat 175 ml (161 g) as listed, 1 cup (218 g) in its method; Shan white karahi pack 175 ml (161 g); MasalaTV highway karahi 1 cup per 500 g with half poured off ≈ 218 g/kg kept. Standard 200 g/kg (140 g palm-olein-type cooking oil + 60 g desi ghee finish), inside the restaurant 12–20% range (see the recipe file).',
    ingredients: base([
      ['oil-palm', 140, 'restaurant cooking oil / banaspati proxy'],
      ['ghee-desi', 60, 'ghee finish'],
    ]),
    addedFat: ['oil-palm', 'ghee-desi'],
    cooking,
    servingNote:
      '"½ kg karahi" on Pakistani menus is the dish made from ½ kg of bone-in chicken: half this pot = (cooked edible weight)/2.',
  },
];
