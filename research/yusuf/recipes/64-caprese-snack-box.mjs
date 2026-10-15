// R-MP-64 · Caprese snack box: mozzarella light, cherry tomatoes, basil and picos (snack box). Batch: 2 boxes.
export default {
  n: 64,
  slot: 'snacks',
  serving: 'box',
  boxes: 2,
  effort: 'assemble',
  minutes: 5,
  cuisine: 'italian',
  shortName: 'Caprese snack box',
  id: 'it-caprese-snack-box',
  name: 'Caprese snack box: mozzarella, cherry tomatoes, basil and picos (snack box)',
  names: {
    en: 'Caprese snack box: mozzarella light, cherry tomatoes, basil and picos',
    es: 'Caprese para picar: mozzarella light, tomates cherry, albahaca y picos',
    ca: 'Caprese per picar: mozzarella light, tomàquets cherry, alfàbrega i picos',
  },
  aliases: ['caprese', 'caprese salad', 'mozzarella snack', 'ensalada caprese', 'mozzarella tomate', 'merienda', 'caprese skewers'],
  pitch: 'Torn mozzarella light with cherry tomatoes and basil, and a few wholemeal picos for crunch: 20 g protein for the afternoon.',
  eat: 'cold',
  tags: ['international', 'meal-prep', 'eat-cold', 'vegetarian'],
  references: [
    { title: 'Diet Doctor, Caprese snack', url: 'https://www.dietdoctor.com/recipes/caprese-snack', used: '8 oz cherry tomatoes and 8 oz mini mozzarella, halved, with green pesto', read: 'search-engine result summary, 2026-10-15' },
    { title: 'Baked Bree, Caprese skewers', url: 'https://bakedbree.com/wprm_print/caprese-skewers', used: 'cherry tomatoes, mozzarella balls and basil leaves with olive oil, salt and pepper', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'caprese', label: 'Mozzarella, tomatoes and basil', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['mozzarella-light', 200, '1 ball and most of a second (100 g per box); the rest goes in a salad'],
        ['tomato-cherry', 300, 'halved'],
        ['basil', 6, 'a few leaves'],
        ['black-pepper', 1, ''],
      ],
    },
    {
      id: 'picos', label: 'Wholemeal picos', storage: 'proposed:sealed-pack', yield: 'none', eat: 'cold',
      lines: [['picos', 30, '15 g per box, in a bag']],
    },
  ],
  method: [
    'Drain and tear the mozzarella; halve the tomatoes. Box with basil and pepper.',
    'A bag of picos on the side. Keep cold.',
  ],
  keeps: '2 days in the fridge',
  storagePlan: 'Make 2 boxes at a time; an opened mozzarella ball keeps 2 days in water in the fridge.',
  reheat: 'Not reheated. Keep cold (insulated bag) if it leaves home.',
  crossCheck: null,
  changes: [
    'Mozzarella light (microbial coagulant) instead of full-fat: 100 g gives 17 g protein for 153 kcal.',
    'No olive oil and no pesto: the snack stays under 300 kcal; picos bring the fibre to 3 g.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking: mozzarella and picos labels, USDA tomato and basil.',
  halal: { status: 'halal', reason: 'Mozzarella with microbial coagulant (Mercadona 51230, 2026-10-15), tomatoes, basil, picos without lard.' },
};
