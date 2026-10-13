// Recipe sheet: chicken salan (murghi ka salan, shorba-style chicken curry) — home and restaurant/dhaba.
import { M, ASSUMED as A } from '../measures.mjs';
import { C } from '../conventions.mjs';

const EDIBLE = 0.75; // curry-cut skinless pieces; see chicken-karahi.mjs (CoFID weighed-with-bone factors)
const sources = [
  { ref: 'TfT-salan', url: 'https://www.teaforturmeric.com/authentic-chicken-curry/', used: '2 lb (907 g) bone-in skinless chicken; ⅓ cup oil; 2 small onions browned 12–15 min; 2 small Roma tomatoes; 6–8 garlic; 1" ginger; whole and ground spices; 2¼ tsp kosher salt; 1¾–2 cups water; covered simmer 25 min, then 3–5 min open "until the oil rises to the top".' },
  { ref: 'F&S-salan', url: 'https://www.flourandspiceblog.com/chicken-curry/', used: '1.5–2 lb bone-in chicken; ⅓ cup oil; 3 onions (~350 g); 2 tomatoes (210–220 g); 1.5 tsp garlic paste, 1 tsp ginger paste; spices; 1¼ tsp salt; ½ cup water, then consistency adjusted.' },
  { ref: 'F&S-kalya', url: 'https://www.flourandspiceblog.com/murghi-ka-salan-chicken-curry-version-2/', used: '1 lb boneless chicken breast; ½ cup oil; 1 large or 2 medium onions; 1 heaped tbsp garlic; spices; 1.5–2 cups hot water, simmered 30 min, dried to a bhuna, then hot water to taste.' },
  { ref: 'Shan-chicken-masala', url: 'https://www.shanfoods.com/product/recipe-mixes/curry/chicken-masala/', used: 'Pack recipe: 1 kg chicken; oil/ghee 1 cup / 175 ml; 3 medium onions / 300 g; 1½ cups yogurt / 300 g; ½–2 cups water for gravy. Used as a restaurant fat-load data point.' },
];
// Per kg of bone-in chicken:
//  oil: TfT 72.7 g/0.907 kg = 80; F&S 72.7/0.794 = 92; F&S kalya 109 g per 454 g boneless (= 605 g
//       bone-in at 0.75) = 180 → home median 92 → standard 90 g/kg.
//  onion: TfT 154, F&S 441, kalya ~306 g/kg → 250 g. tomato: TfT 137, F&S 271, kalya 0 → 150 g.
//  water: TfT 444 g (1.875 cups) per 0.907 kg → 490 g/kg; the most explicit reference, used as is.
const base = (fat) => [
  ['chicken-meat', 1000, 'bone-in skinless curry-cut pieces; edible 0.75', { edible: EDIBLE }],
  ...fat,
  ['onion', 250, 'TfT 154, F&S 441, kalya 306 g/kg'],
  ['tomato', 150, 'TfT 137, F&S 271, kalya 0 g/kg'],
  ['garlic', 20, '6–8 cloves / 1 heaped tbsp'],
  ['ginger', 10, '1" piece'],
  ['green-chilli', 2 * A.hariMirch, ''],
  ['coriander-powder', 1.5 * M.tspCoriander, ''],
  ['chilli-powder', 1.25 * M.tspChilli, ''],
  ['turmeric', M.tspTurmeric / 2, ''],
  ['cumin', 1.5 * M.tspCumin, 'seeds + ground'],
  ['garam-masala', 1, ''],
  ['salt', 9, ''],
  ['coriander', 4, ''],
  ['water', 490, 'TfT 1¾–2 cups per 907 g chicken'],
];
const cooking = {
  method: 'steps',
  steps: [
    { ing: 'onion', frac: C.onionBrown, why: 'onions browned 12–15 min (C.onionBrown, Bognár brown onion)' },
    { ing: 'tomato', frac: C.tomatoFry, why: 'tomatoes sautéed 2–3 min until oil separates (C.tomatoFry)' },
    { ing: 'water', frac: C.simmerCovered30 * (25 / 30) + C.simmerAjar30 * (4 / 30), why: 'covered simmer 25 min + 4 min open (C.simmerCovered30, C.simmerAjar30, prorated)' },
  ],
};

export default [
  {
    id: 'chicken-salan-home',
    dish: 'Chicken salan, home style',
    sources: sources.slice(0, 3),
    fatBasis: 'Home references: TfT 80, F&S 92, F&S kalya 180 g oil per kg bone-in chicken → median 92 → standard 90 g cooking oil per kg.',
    ingredients: base([['oil-cooking', 90, 'median of the home references']]),
    addedFat: ['oil-cooking'],
    cooking,
  },
  {
    id: 'chicken-salan-restaurant',
    dish: 'Chicken salan, restaurant / dhaba style',
    sources,
    fatBasis: 'Restaurant/dhaba load 200 g per kg bone-in chicken (140 g palm-type oil + 60 g ghee). The published restaurant-type recipes give 161 g/kg (Shan chicken masala pack, 175 ml per kg) and 180 g/kg (F&S kalya); 200 g puts this thin-gravy dish at the lower bound of the Lab restaurant range for salan (12% of served weight), i.e. at most +20% over those recipes.',
    ingredients: base([
      ['oil-palm', 140, ''],
      ['ghee-desi', 60, ''],
    ]),
    addedFat: ['oil-palm', 'ghee-desi'],
    cooking,
  },
];
