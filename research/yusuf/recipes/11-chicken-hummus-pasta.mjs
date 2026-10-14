// R-MP-11 · Chicken and hummus wholewheat pasta salad (cold). Standard batch: 4 boxes. Raw edible grams.
export default {
  n: 11,
  effort: 'cook',
  minutes: 30,
  id: 'med-chicken-hummus-pasta-salad-box',
  name: 'Chicken and hummus pasta salad (cold lunch box)',
  names: {
    en: 'Chicken and hummus wholewheat pasta salad',
    es: 'Ensalada de pasta integral con pollo y hummus',
    ca: 'Amanida de pasta integral amb pollastre i hummus',
    roman: 'chicken pasta salad',
  },
  aliases: ['hummus pasta salad', 'chicken pasta salad', 'pasta salad', 'ensalada de pasta', 'ensalada de pasta con pollo', 'amanida de pasta', 'hummus pasta', 'humus pasta', 'macarrones con pollo frios'],
  pitch: 'Wholewheat penne coated in hummus with paprika chicken, spinach, cherry tomatoes, cucumber and pepper.',
  eat: 'cold',
  tags: ['mediterranean', 'middle-eastern', 'meal-prep', 'eat-cold'],
  references: [
    { title: 'Taste of Home, Chicken and spinach pasta salad', url: 'https://www.tasteofhome.com/recipes/chicken-and-spinach-pasta-salad/', used: 'whole-wheat rotini, ½ cup hummus thinned as the dressing, 4 cups baby spinach, 1 cup cooked chicken breast, 2 cups cherry tomatoes', read: 'search-engine page extract' },
    { title: 'The BakerMama, Hummus pasta salad', url: 'https://thebakermama.com/recipes/hummus-pasta-salad/', used: 'hummus stirred into drained whole-wheat pasta with chicken, cherry tomatoes and cucumber; served warm or cold', read: 'search-engine page extract' },
    { title: 'DeLallo, Whole wheat pasta salad with chicken', url: 'https://www.delallo.com/recipe/whole-wheat-pasta-salad-with-chicken/', used: 'whole-wheat pasta salad with chicken (build reference)', read: 'search-engine result' },
  ],
  components: [
    {
      id: 'chicken', label: 'Paprika chicken', storage: 'cooked-meat', yield: 'breastPanFried', eat: 'cold',
      lines: [
        ['chicken-breast', 600, 'strips'],
        ['oil-olive', 10, ''],
        ['paprika', 3, 'pimentón dulce'],
        ['garlic', 6, 'grated', 'onionSoft'],
        ['salt', 3, ''],
        ['black-pepper', 1, ''],
      ],
    },
    {
      id: 'pasta', label: 'Wholewheat penne', storage: 'cooked-starch', yield: 'pastaWW', eat: 'cold',
      lines: [['pasta-wholewheat', 300, 'boiled al dente, rinsed cold']],
    },
    {
      id: 'dressing', label: 'Hummus-lemon dressing', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['hummus', 160, 'Hacendado receta clásica (⅔ of a 240 g tub)'],
        ['lemon-juice', 30, ''],
        ['water', 40, 'to thin'],
      ],
    },
    {
      id: 'veg', label: 'Salad vegetables', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['spinach', 100, 'baby leaves'],
        ['tomato-cherry', 320, 'halved'],
        ['cucumber', 200, 'diced'],
        ['pepper-red', 160, 'diced'],
      ],
    },
  ],
  method: [
    'Toss the chicken with paprika, garlic, salt and pepper; sear in the oil 6–8 min (75 °C inside). Cool and slice.',
    'Boil the penne al dente (about 11 min), rinse under cold water, drain well.',
    'Whisk the hummus with lemon juice and water.',
    'Toss pasta with the dressing, then fold in the vegetables and chicken. Each box gets a quarter.',
  ],
  keeps: 'Pasta frozen in portions; chicken 3 days; veg cut twice',
  storagePlan: 'Cooked pasta keeps 1 day in the fridge and the dressed vegetables 2 days, so: box 1 assembled on Sunday; pasta for boxes 2–4 frozen plain (1 month) and chicken frozen or chilled (3 days). Each evening move one pasta and one chicken portion to the fridge and toss with dressing and vegetables in the morning (2 minutes). Cut the vegetables on Sunday and again on Tuesday.',
  reheat: 'Not reheated. Eat within 2 h of leaving the fridge (1 h above 32 °C).',
  crossCheck: { fdc: 2708948, note: 'FNDDS "Macaroni or pasta salad with meat" (mayonnaise-based): our box uses hummus and more vegetables, so less fat per 100 g is expected.' },
  changes: [
    'Hummus kept at 40 g per box: it is the oiliest ingredient (25.5 g fat per 100 g on the label). Spinach, tomato, cucumber and pepper add bulk without much energy.',
  ],
  confidence: 'B',
  confidenceWhy: 'Pasta yield from the USDA whole-wheat dry/cooked pair, chicken from Bognár\'s pan-fried breast row, everything else raw; label values for pasta and hummus.',
  halal: { status: 'halal', reason: 'Chicken from a halal butcher; hummus label lists E270 "de origen vegetal" and no E471 (checked 2026-10-13).' },
};
