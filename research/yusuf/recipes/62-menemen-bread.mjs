// R-MP-62 · Menemen: Turkish eggs with peppers and tomato, with bread (breakfast portion). Batch: 2 portions.
export default {
  n: 62,
  eatNow: 1, // portion 1 is that morning's breakfast
  slot: 'breakfast',
  serving: 'portion',
  boxes: 2,
  effort: 'cook',
  minutes: 15,
  cuisine: 'middle-eastern',
  shortName: 'Menemen with bread',
  id: 'med-menemen-portion',
  name: 'Menemen: eggs with peppers and tomato, with bread (breakfast portion)',
  names: {
    en: 'Menemen: Turkish eggs with green peppers and tomato, with bread',
    es: 'Menemen: huevos a la turca con pimiento verde y tomate, con pan',
    ca: 'Menemen: ous a la turca amb pebrot verd i tomàquet, amb pa',
  },
  aliases: ['menemen', 'turkish eggs', 'huevos a la turca', 'shakshuka breakfast', 'eggs with tomato', 'huevos con tomate', 'ous amb tomaquet'],
  pitch: 'Soft eggs stirred into green peppers and tomato with a pinch of chilli, the Turkish breakfast, with bread to scoop. Cook two, reheat one tomorrow.',
  eat: 'hot',
  tags: ['middle-eastern', 'meal-prep', 'contains-egg', 'vegetarian'],
  references: [
    { title: 'The Mediterranean Dish, Menemen (Turkish scrambled eggs with tomatoes)', url: 'https://www.themediterraneandish.com/wprm_print/menemen-recipe-turkish-scrambled-eggs-with-tomatoes', used: 'peppers softened, tomatoes cooked down, eggs stirred in soft; served with crusty bread', read: 'search-engine result summary, 2026-10-15' },
    { title: 'Unicorns in the Kitchen, Menemen Turkish eggs and tomatoes', url: 'https://www.unicornsinthekitchen.com/wprm_print/menemen-turkish-eggs-and-tomatoes-recipe', used: 'onion optional; chilli flakes; leftovers keep 2 days in an airtight box', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'eggs', label: 'Menemen', storage: 'egg-dish', yield: 'none', eat: 'hot',
      lines: [
        ['oil-olive', 10, ''],
        ['onion', 80, 'chopped', 'onionSoft'],
        ['pepper-green', 200, 'diced', 'pepperStew'],
        ['tomato', 300, 'grated or chopped', 'vegStew'],
        ['egg', 300, '6 eggs', 'eggSet'],
        ['chilli-powder', 1, 'or pul biber'],
        ['salt', 2, ''],
      ],
    },
    {
      id: 'bread', label: 'Bread (½ bocadillo roll per portion)', storage: 'proposed:bread', yield: 'none', eat: 'hot',
      lines: [['bocadillo-bread', 130, '1 roll']],
    },
  ],
  method: {
    equipment: ['Frying pan (24–28 cm)', 'Bowl and fork for the eggs', 'Grater', 'Wooden spoon', '1 box for tomorrow'],
    prep: [
      'Chop {{n:onion}} into 5 mm pieces. Dice {{n:pepper-green}} into 1 cm pieces.',
      'Grate {{n:tomato}} on the big holes of the grater and throw away the skins (or chop them small).',
      'Crack 6 eggs into the bowl. Add a pinch of chilli powder or pul biber (1 g) and a heaped ¼ tsp salt (2 g). Beat with the fork.',
    ],
    steps: [
      { text: 'Heat 2 tsp olive oil (10 g) in the pan for 1 minute.', heat: 'medium', minutes: 1 },
      { text: 'Add the onion and peppers. Cook, stirring now and then, until soft.', heat: 'medium', minutes: 6 },
      { text: 'Add the tomato. Cook until most of the juice has gone and it looks like a thick sauce.', heat: 'medium', minutes: 5 },
      { text: 'Turn the heat down to low. Pour in the eggs.', heat: 'low' },
      { text: 'Stir slowly with the spoon, scraping the bottom, until the eggs are just set and creamy: no runny raw egg is left.', heat: 'low', minutes: 3, check: true },
      { text: 'Take the pan off the heat. Eat half now with ½ roll (65 g); put the other half in the box.', heat: 'none', pack: true },
    ],
    doneWhen: 'No runny raw egg is left: the eggs are soft, set curds.',
    boxUp: 'Cool the second portion for no more than 1 hour. {{split}}',
    reheat: 'Microwave 1 minute, stir, then 30 seconds more until steaming hot all through.',
  },
  storagePlan: 'Cook 2 portions at once. {{split}}',
  reheat: 'Microwave 1–1½ min, stirring once, until hot right through (75 °C).',
  crossCheck: null,
  changes: [
    'Three eggs per portion for 25 g protein; no cheese.',
    'Half a bocadillo roll (no emulsifier) instead of simit.',
  ],
  confidence: 'B',
  confidenceWhy: 'Bognár yields for onion, pepper, tomato and eggs; USDA and label values.',
  halal: { status: 'halal', reason: 'Eggs, vegetables and a roll of flour, water, yeast and salt.' },
};
