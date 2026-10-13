// Recipe sheets: chicken biryani and chicken (yakhni) pulao — home and restaurant.
// Rice water: the rice ends up as cooked basmati. Water held = raw × (100 − 11.3)/(100 − 69.5) − raw,
// from CoFID 2021 11-857 (basmati raw, water 11.3) and 11-858 (boiled, water 69.5) — the protein ratio
// 8.1/2.8 = 2.89 gives the same yield. Any other cooking water leaves (drained or steamed off).
import { M, ASSUMED as A } from '../measures.mjs';
import { C } from '../conventions.mjs';

const riceWater = (raw) => Math.round(raw * ((100 - 11.3) / (100 - 69.5)) - raw);
const EDIBLE = 0.75; // curry-cut chicken, see chicken-karahi.mjs

const biryaniSources = [
  { ref: 'Shan-biryani-pack', url: 'https://www.shanfoods.com/product/recipe-mixes/rice/biryani/', used: 'Meat on bones 1 kg; basmati 750 g; onions 250 g; tomatoes 250 g; yogurt 200 g; cooking oil 1 cup / 175 ml; coriander ½ cup; mint ½ cup; chicken cooked in 2 cups water then fried "until oil begins to separate"; rice boiled ¾ in 3 L salted water, drained, layered, dum 5–10 min.' },
  { ref: 'Shan-bombay-biryani-pack', url: 'https://www.shanfoods.com/product/recipe-mixes/rice/bombay-biryani/', used: 'Karachi/Bombay style: meat on bones 1 kg; basmati 750 g; onions 300 g; tomatoes 300 g; potatoes 250 g; 2 tbsp each garlic and ginger paste; yogurt 200 g; oil 175 ml.' },
  { ref: 'TfT-biryani', url: 'https://www.teaforturmeric.com/chicken-biryani/', used: '1¼ lb bone-in skinless chicken; ½ cup yogurt; 1 tbsp oil marinade; 1¾ cups basmati; ¼ cup oil + 2 tbsp ghee for the masala, 1 tbsp oil on top; 2 medium onions golden 15–20 min; 6–8 garlic; 1" ginger; 1 small tomato; green chillies; 5 alu bukhara; mint, cilantro; ½ cup water, simmered 30 min then fried dry.' },
  { ref: 'F&S-biryani', url: 'https://www.flourandspiceblog.com/authentic-pakistani-chicken-biryani-simplified/', used: '2 lb bone-in chicken; 2.5 cups basmati; ¼ cup yogurt; 2 tbsp olive oil (marinade) + ¼ cup oil; 3 diced tomatoes; 2 potatoes; 1 tbsp each garlic, ginger, green chilli paste; ½ cup water; masala dried "until … the oil is above the masala".' },
];
// Per 750 g raw basmati (Shan scale). Other references scaled by their rice:
//  chicken (bone-in): TfT 1312, F&S 1469, Shan 1000 → 1000 g.  onion: TfT 509, Shan 250–300, F&S 0 → 250 g.
//  tomato: TfT 211, F&S 598, Shan 250–300 → 300 g.  yogurt: TfT 282, F&S 99, Shan 200 → 200 g.
//  fat: TfT 248 g, F&S 132 g, Shan 161 g per 750 g rice → home 150 g; restaurant see below.
const biryani = (fat, potato) => [
  ['rice-basmati-raw', 750, 'Shan 750 g (3½ cups)'],
  ['water', riceWater(750), 'water held by the cooked rice (CoFID 11-857 → 11-858)'],
  ['chicken-meat', 1000, 'meat on bones 1 kg (Shan); edible 0.75', { edible: EDIBLE }],
  ...fat,
  ['onion', 250, 'Shan 250 g'],
  ['tomato', 300, 'Shan 250–300 g'],
  ['yogurt', 200, 'Shan 1 cup / 200 g'],
  ...(potato ? [['potato', potato, 'Karachi style (Shan Bombay 250 g)']] : []),
  ['garlic', 17, '2 tbsp paste (Shan Bombay)'],
  ['ginger', 17, '2 tbsp paste'],
  ['green-chilli', 4 * A.hariMirch, ''],
  ['coriander', 8, '½ cup (USDA ½ cup ≈ 8 g)'],
  ['mint', 8, '½ cup'],
  ['lemon-juice', 15, 'lemon / alu bukhara for sourness'],
  ['chilli-powder', 3 * M.tspChilli, 'biryani masala (red chilli, coriander, cumin, whole spices)'],
  ['coriander-powder', 2 * M.tspCoriander, ''],
  ['cumin', 2 * M.tspCumin, ''],
  ['garam-masala', 3, 'whole spices'],
  ['salt', 14, 'masala salt; salt from the rice-boiling water is not counted (mostly drained)'],
  ['water', 474, 'Shan: chicken cooked in 2 cups water, then fried dry'],
];
const biryaniCooking = {
  method: 'steps',
  steps: [
    { ing: 'onion', frac: C.onionBrown, why: 'onions fried golden (C.onionBrown)' },
    { ing: 'tomato', frac: C.tomatoBhuna, why: 'tomatoes fried until oil separates (C.tomatoBhuna)' },
    { ing: 'chicken-meat', frac: C.chickenJuice, why: 'chicken juices fried off (C.chickenJuice)' },
    { grams: 474 * C.dryOff, why: 'the 2 cups of cooking water fried off "until oil separates" (C.dryOff 0.9)' },
  ],
};

const pulaoSources = [
  { ref: 'TfT-yakhni-pulao', url: 'https://www.teaforturmeric.com/chicken-pulao-yakhni-pulao/', used: '1¼ lb bone-in chicken boiled in 2¾ cups water for the yakhni (½ small onion and whole spices strained out); 1½ cups basmati cooked in the yakhni (absorption, dum 15 min); ¼ cup oil + 2 tbsp ghee; 1 medium onion browned; 4–5 garlic; ¾" ginger; 2 green chillies; 1 small tomato; 1½ tbsp yogurt; garam masala, mint, cilantro.' },
  { ref: 'F&S-yakhni-pulao', url: 'https://www.flourandspiceblog.com/yakhni-pulao-made-quicker-with-an-instant-pot/', used: '1 lb beef cubes; yakhni with ginger, garlic, whole spices in 3.5 cups water; 3 cups rice; 1 onion (≈ 1 cup); ginger and garlic paste; green chillies; oil "for cooking" (no amount); cooked until the water is dry.' },
  { ref: 'Shan-pulao-pack', url: 'https://www.shanfoods.com/product/recipe-mixes/rice/pulao-biryani/', used: 'Meat on bones 1 kg; basmati 750 g; garlic and ginger paste 1–2 tbsp each; onion fried golden and poured over; yogurt 200 g; oil 1 cup / 175 ml; meat cooked with 1 cup water (chicken), rice ¾-boiled and drained, dum.' },
];
// Per 500 g raw basmati: chicken TfT 1020, Shan 667 → 800 g; fat TfT 144 g, Shan 107 g → home 125 g.
const pulao = (fat) => [
  ['rice-basmati-raw', 500, ''],
  ['water', riceWater(500), 'water held by the cooked rice (CoFID 11-857 → 11-858)'],
  ['chicken-meat', 800, 'bone-in pieces (TfT 1020, Shan 667 per 500 g rice); edible 0.75', { edible: EDIBLE }],
  ...fat,
  ['onion', 110, '1 medium browned (TfT; F&S 1 cup)'],
  ['tomato', 45, 'TfT 1 small, optional'],
  ['yogurt', 60, 'TfT 1½ tbsp; Shan 200 g per 750 g rice'],
  ['garlic', 15, ''],
  ['ginger', 10, ''],
  ['green-chilli', 2 * A.hariMirch, ''],
  ['coriander', 4, ''],
  ['mint', 3, ''],
  ['cumin', 2 * M.tspCumin, 'whole spices'],
  ['coriander-powder', M.tspCoriander, ''],
  ['black-pepper', M.tspPepper, ''],
  ['garam-masala', 2, ''],
  ['salt', 10, ''],
];
const pulaoCooking = {
  method: 'steps',
  steps: [
    { ing: 'onion', frac: C.onionBrown, why: 'onion browned 10–12 min (C.onionBrown)' },
    { ing: 'chicken-meat', frac: C.chickenJuice, why: 'chicken juices go into the yakhni, which the rice absorbs or which steams off; only the rice water stays' },
  ],
};

export default [
  {
    id: 'chicken-biryani-home',
    dish: 'Chicken biryani, home style',
    sources: biryaniSources,
    fatBasis: 'Fat per 750 g raw rice: TfT 248 g, F&S 132 g, Shan pack 161 g (175 ml). Home standard 150 g cooking oil.',
    ingredients: biryani([['oil-cooking', 150, '']], 125),
    addedFat: ['oil-cooking'],
    cooking: biryaniCooking,
  },
  {
    id: 'chicken-biryani-restaurant',
    dish: 'Chicken biryani, restaurant style (Karachi, with potatoes)',
    sources: biryaniSources,
    fatBasis: 'Restaurant standard 300 g fat per 750 g rice (240 g palm-type oil + 60 g ghee on the dum): the Shan pack (161 g) is the floor; TfT\'s home recipe already reaches 248 g. This places restaurant biryani inside the Lab\'s 7–10% range.',
    ingredients: biryani([['oil-palm', 240, ''], ['ghee-desi', 60, 'ghee drizzled on the dum']], 250),
    addedFat: ['oil-palm', 'ghee-desi'],
    cooking: biryaniCooking,
  },
  {
    id: 'chicken-pulao-home',
    dish: 'Chicken yakhni pulao, home style',
    sources: pulaoSources,
    fatBasis: 'Fat per 500 g rice: TfT ¼ cup oil + 2 tbsp ghee (80 g per 278 g rice → 144 g); Shan 161 g per 750 g → 107 g. Home standard 125 g (90 g oil + 35 g ghee).',
    ingredients: pulao([['oil-cooking', 90, ''], ['ghee-desi', 35, '']]),
    addedFat: ['oil-cooking', 'ghee-desi'],
    cooking: pulaoCooking,
  },
  {
    id: 'chicken-pulao-restaurant',
    dish: 'Chicken pulao, restaurant style',
    sources: pulaoSources,
    fatBasis: 'Restaurant standard 190 g per 500 g rice (140 g palm-type oil + 50 g ghee), i.e. about 1.5× the home load, inside the Lab\'s 7–10% biryani/pulao restaurant range.',
    ingredients: pulao([['oil-palm', 140, ''], ['ghee-desi', 50, '']]),
    addedFat: ['oil-palm', 'ghee-desi'],
    cooking: pulaoCooking,
  },
];
