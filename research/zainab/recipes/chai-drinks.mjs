// Recipe sheets: chai (doodh patti, dhaba, Kashmiri) and desi cold drinks (Rooh Afza).
// Chai is defined by what is in one served cup (NUTRITION.md cup = 200 ml, ICMR-NIN 2024), so no
// evaporation guess is needed: the pot's reduction only sets how much milk ends up in the cup.
import { M } from '../measures.mjs';

const MILK_D = 1.03; // g/ml, FDC 171265 whole milk 1 cup = 244 g (237 ml)
const CUP = 200; // ml served
const chaiSources = [
  { ref: 'F&S-doodh-patti', url: 'https://www.flourandspiceblog.com/how-to-make-doodh-patti/', used: '½ tbsp tea leaves; 2 cups milk "(or half water, half milk)"; cardamom; sugar to taste; simmered "at least 5 minutes … reduced by at least a third".' },
  { ref: 'TfT-pakistani-chai', url: 'https://www.teaforturmeric.com/authentic-pakistani-chai/', used: '1¼ cups water + 1 cup whole milk + 1½ tsp loose tea for 2 servings; sweetener to taste (a lighter, water-forward chai).' },
  { ref: 'MasalaTV-doodh-patti', url: 'https://www.masala.tv/doodh-patti-chai/', used: 'Milk 2 cups, sugar 2 tbsp, tea leaves 1 tsp, boiled on low 5–7 min until thick (search summary; page not reachable from our proxy).' },
  { ref: 'FoodFusion-chai-5-ways', url: 'https://foodfusion.com/recipe/chai-5-ways/', used: '"Tandoori chai": 2 cups fresh milk, 1 tbsp tea leaves, 2½ tbsp sugar or to taste (search summary).' },
];

// Doodh patti, home: F&S's half-milk version reduced by a third → 0.5 / (2/3) = 75% milk in the cup.
const doodhPatti = (tsp) => ({
  id: `doodh-patti-${tsp}tsp`,
  dish: `Doodh patti chai, home, ${tsp} tsp sugar per cup`,
  sources: chaiSources.slice(0, 2),
  fatBasis: 'No added fat; fat is from whole milk.',
  ingredients: [
    ['milk-whole', CUP * 0.75 * MILK_D, '150 ml whole milk per 200 ml cup (75%: F&S half-milk doodh patti reduced by a third; F&S all-milk version would be richer)'],
    ['tea-brewed', CUP * 0.25, '50 ml brewed tea (patti boiled in water)'],
    ...(tsp ? [['sugar', tsp * M.tspSugar, `${tsp} level tsp (FDC 169655, 4.2 g)`]] : []),
  ],
  addedFat: [],
  cooking: { method: 'none', basis: 'Composition of one served cup; the reduction in the pot is already reflected in the 75% milk share.' },
});

// Dhaba chai: all milk, reduced by a third (F&S: "at least a third"; Masala TV: "until thick") →
// 300 ml milk per 200 ml served. Sugar: Masala TV 2 tbsp per 2 cups milk (= 3 tsp per 237 ml milk);
// Food Fusion tandoori chai 2½ tbsp per 2 cups (3.75 tsp). Regular dhaba cup: 3 tsp; "extra sugar": 4 tsp.
const dhaba = (tsp, id, label) => ({
  id,
  dish: label,
  sources: chaiSources,
  fatBasis: 'No added fat; fat is from whole milk (dhabas often use loose buffalo milk, which has about twice the fat — not modelled, see notes).',
  ingredients: [
    ['milk-whole', 300 * MILK_D, '300 ml milk boiled down to a 200 ml cup (reduced by a third, F&S)'],
    ['sugar', tsp * M.tspSugar, `${tsp} level tsp`],
  ],
  addedFat: [],
  cooking: { method: 'cooked', grams: CUP * MILK_D + tsp * M.tspSugar, basis: 'Served cup: 200 ml at milk density (1.03 g/ml) plus the sugar; the water boiled off is 300 − 200 ml of milk water.' },
});

export default [
  doodhPatti(0),
  doodhPatti(1),
  doodhPatti(2),
  dhaba(3, 'dhaba-chai', 'Dhaba chai (karak, all milk, 3 tsp sugar per cup)'),
  dhaba(4, 'dhaba-chai-extra-sugar', 'Dhaba chai, extra sugar (4 tsp per cup)'),
  {
    id: 'kashmiri-chai',
    dish: 'Kashmiri chai (pink tea), sweet, with nuts',
    sources: [
      { ref: 'F&S-kashmiri-chai', url: 'https://www.flourandspiceblog.com/karachi-style-kashmiri-chai-pink-tea/', used: 'Kahwa from 6 tbsp Kashmiri tea, 1 tsp soda, salt, cardamom in 8 cups water simmered to half and aerated; per cup: ⅓ cup kahwa + ⅔ cup milk + a splash of water, topped with a scant spoon of crushed pistachios/almonds.' },
      { ref: 'TfT-kashmiri-chai', url: 'https://www.teaforturmeric.com/20-minute-kashmiri-chai-pink-tea/', used: '2 mugs (2.5 cups): tea boiled in 1 cup water + 1 cup ice water; 1 cup whole milk + ½ cup half-and-half; ¼ tsp salt; 2–2.5 tbsp sugar; ½–1 tbsp almonds + ½ tbsp pistachios.' },
    ],
    fatBasis: 'No added fat; dairy fat from milk (TfT also uses half-and-half, not modelled) and nuts.',
    ingredients: [
      ['milk-whole', CUP * (2 / 3) * MILK_D, '⅔ of the cup milk (F&S)'],
      ['tea-brewed', CUP / 3, '⅓ cup kahwa (tea concentrate)'],
      ['sugar', 2 * M.tspSugar, 'TfT 2–2.5 tbsp per 2.5 cups ≈ 2.3 tsp per 200 ml → 2 tsp'],
      ['pistachio', 1.5, 'TfT ½ tbsp pistachios + ½–1 tbsp almonds per 2.5 cups ≈ 3 g nuts per cup'],
      ['almonds', 1.5, ''],
      ['salt', 0.5, 'pinch (TfT ¼ tsp per 2.5 cups)'],
    ],
    addedFat: [],
    cooking: { method: 'none', basis: 'Composition of one served cup.' },
  },
  {
    id: 'rooh-afza-water',
    dish: 'Rooh Afza sharbat (with water)',
    sources: [
      { ref: 'Hamdard-label-OFF', url: 'https://world.openfoodfacts.org/product/8964000122075/hamdard-rooh-afza', used: 'Hamdard Rooh Afza (Pakistan) label per 100 ml: 307 kcal, carbohydrate 77 g, sugars 77 g, fat 0, protein 0.' },
      { ref: 'FatSecret-RoohAfza-serving', url: 'https://mobile.fatsecret.com/calories-nutrition/hamdard/rooh-afza', used: 'Label-style serving: 2 tbsp (30 ml) = 90 kcal, 23 g sugar (search summary) — the usual amount for one glass.' },
    ],
    fatBasis: 'No fat.',
    ingredients: [
      ['rooh-afza-syrup', 30, '2 tbsp (30 ml) syrup per glass', { density: 1.3 }],
      ['water', 220, 'chilled water to fill a 250 ml glass'],
    ],
    addedFat: [],
    cooking: { method: 'none', basis: 'One 250 ml glass: 30 ml syrup + 220 ml water (syrup density taken as 1.3 g/ml for the weight; nutrients use the label per 100 ml).' },
  },
];
