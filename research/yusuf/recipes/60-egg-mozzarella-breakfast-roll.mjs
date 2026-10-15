// R-MP-60 · Freezer egg, spinach and mozzarella breakfast rolls (breakfast portion). Batch: 4 portions.
export default {
  n: 60,
  slot: 'breakfast',
  serving: 'portion',
  boxes: 4,
  effort: 'cook',
  minutes: 20,
  cuisine: 'international',
  shortName: 'Egg mozzarella roll',
  id: 'intl-egg-mozzarella-breakfast-roll-portion',
  name: 'Freezer egg, spinach and mozzarella breakfast roll (breakfast portion)',
  names: {
    en: 'Freezer egg, spinach and mozzarella breakfast roll',
    es: 'Bocadillo de desayuno de huevo, espinacas y mozzarella (para congelar)',
    ca: 'Entrepà d\'esmorzar d\'ou, espinacs i mozzarella (per congelar)',
  },
  aliases: ['breakfast sandwich', 'egg sandwich', 'egg muffin sandwich', 'bocadillo de huevo', 'egg and cheese roll', 'freezer breakfast sandwich', 'entrepa d\'ou'],
  pitch: 'A tray of baked egg with spinach and red pepper, cut into squares and sandwiched with mozzarella in a roll, then frozen. Two minutes in the microwave in the morning.',
  eat: 'hot',
  tags: ['international', 'meal-prep', 'contains-egg', 'vegetarian'],
  references: [
    { title: 'Natasha\'s Kitchen, Freezer breakfast sandwiches', url: 'https://natashaskitchen.com/wprm_print/freezer-breakfast-sandwiches', used: 'eggs baked in one pan at about 175 °C, cut into squares, stacked with cheese in bread, wrapped and frozen', read: 'search-engine result summary, 2026-10-15' },
    { title: 'Simply Delicious, Make-ahead freezer breakfast sandwiches', url: 'https://simply-delicious-food.com/make-ahead-freezer-breakfast-sandwiches/', used: 'make-ahead egg and cheese sandwiches; reheat from frozen in the microwave', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'egg', label: 'Baked egg with spinach and pepper', storage: 'egg-muffin', yield: 'eggSet', eat: 'hot',
      lines: [
        ['egg', 300, '6 eggs'],
        ['egg-white', 200, 'liquid egg whites'],
        ['spinach', 60, 'chopped'],
        ['pepper-red', 80, 'diced'],
        ['salt', 1, ''],
        ['black-pepper', 1, ''],
      ],
    },
    {
      id: 'cheese', label: 'Mozzarella light', storage: 'egg-muffin', yield: 'none', eat: 'hot',
      lines: [['mozzarella-light', 125, '1 ball, sliced']],
    },
    {
      id: 'bread', label: 'Bocadillo roll (1 per portion)', storage: 'proposed:bread', yield: 'none', eat: 'hot',
      lines: [['bocadillo-bread', 520, '4 rolls of 130 g']],
    },
  ],
  method: [
    'Oven at 180 °C. Whisk eggs, whites, salt and pepper; stir in spinach and pepper. Pour into a lined 20 × 20 cm tin and bake 18–20 min until set.',
    'Cool, cut into 4 squares. Split the rolls; fill each with an egg square and a quarter of the mozzarella.',
    'Wrap each roll in baking paper and foil (or a bag) and freeze.',
  ],
  keeps: '3 days in the fridge, 2 months frozen',
  storagePlan: 'Freeze all 4, or keep 1–2 in the fridge (3 days). From frozen: no need to thaw.',
  reheat: 'Unwrap, wrap in a paper towel and microwave 1½–2 min (from frozen: on defrost 1 min first) until hot in the middle (75 °C).',
  crossCheck: null,
  changes: [
    'Mozzarella light with microbial coagulant instead of sliced cheese with rennet (Hacendado gouda and tierno slices list cuajo, read 2026-10-15).',
    'Egg whites with the whole eggs for 25 g protein or more without a second sandwich.',
    'A whole bocadillo roll, because English muffins are not sold at Mercadona Barcelona; it brings fibre to 5 g.',
  ],
  confidence: 'B',
  confidenceWhy: 'Egg yield from Bognár\'s scrambled-egg row (nearest); labels for whites, mozzarella and roll.',
  halal: { status: 'halal', reason: 'Eggs, mozzarella with microbial coagulant (Mercadona 51230, 2026-10-15) and a roll of flour, water, yeast and salt.' },
};
