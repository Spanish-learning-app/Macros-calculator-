// R-MP-31 · Tuna and egg pita pockets with hummus and salad (lunch box). Batch: 2 boxes.
export default {
  n: 31,
  serving: 'box',
  boxes: 2,
  effort: 'assemble',
  minutes: 12,
  prepWait: 15, // the eggs boil 10 min and cool 5 (R3-B: start to finish includes them)
  waitNote: 'if you have no boiled eggs, they boil 10 min and cool 5 first',
  cuisine: 'mediterranean',
  shortName: 'Tuna egg pita pockets',
  id: 'med-tuna-egg-pita-hummus-box',
  name: 'Tuna and egg pita pockets with hummus and salad (lunch box)',
  names: {
    en: 'Tuna and egg pita pockets with hummus and salad',
    es: 'Pan de pita relleno de atún, huevo, hummus y ensalada',
    ca: 'Pa de pita farcit de tonyina, ou, hummus i amanida',
  },
  aliases: ['tuna pita', 'pita de atun', 'pita pocket', 'tuna egg pita', 'pitta pocket', 'tunisian tuna sandwich', 'pita amb tonyina', 'hummus pita'],
  pitch: 'A Tunisian-style sandwich you build at lunch: hummus in the pita, then tuna, egg and crunchy salad from the box.',
  eat: 'cold',
  tags: ['mediterranean', 'meal-prep', 'eat-cold', 'contains-egg', 'seafood-fish'],
  references: [
    { title: 'Ocado blog, Stuffed pitta pockets', url: 'https://blog.ocado.com/food/stuffed-pitta-pockets/', used: 'pitta pockets filled to taste: houmous and falafel, or tuna and salad', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Ainsley Harriott, Tuna and egg salad pitta pocket with herby yoghurt dressing', url: 'https://www.ainsley-harriott.com/?p=2545', used: 'tuna with olives, lettuce, radish and sliced boiled egg in pitta', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Restaurant Business, Tunisian tuna sandwich', url: 'https://restaurantbusinessonline.com/recipedia/tunisian-tuna-sandwich', used: 'tuna, boiled egg, olives, peppers in bread (fricassé style)', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'filling', label: 'Tuna salad with peppers, cucumber and lettuce', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['tuna', 240, '4 cans atún claro al natural, drained (120 g per box)'],
        ['pepper-red', 100, 'diced'],
        ['cucumber', 100, 'diced'],
        ['lettuce', 60, 'shredded, packed on top'],
        ['onion-red', 20, 'finely chopped'],
        ['oil-olive', 10, '5 g per box'],
        ['lemon-juice', 20, ''],
        ['black-pepper', 1, ''],
      ],
    },
    {
      id: 'egg', label: 'Hard-boiled egg (1 per box)', storage: 'egg-dish', yield: 'none', eat: 'cold',
      lines: [['egg-boiled', 100, '2 eggs, boiled 10 min']],
    },
    {
      id: 'hummus', label: 'Hummus pot', storage: 'cold-salad', pot: true, yield: 'none', eat: 'cold',
      lines: [['hummus', 100, '50 g per box in a small pot']],
    },
    {
      id: 'pita', label: 'Pita bread (2 per box, in their bag)', storage: 'proposed:bread', yield: 'none', eat: 'cold',
      lines: [['pita', 240, '2 Mission pitas (60 g each) per box']],
    },
  ],
  method: {
    equipment: ['Pot for 2 eggs (if you have none boiled)', 'Can opener and sieve', 'Bowl', 'Chopping board and knife', '2 lunch boxes and 2 small lidded pots (about 75 ml)'],
    prep: [
      'Dice the red pepper (100 g) and cucumber (100 g) into 1 cm pieces. Chop the red onion (20 g) small. Shred the lettuce (60 g).',
      'If you have no eggs boiled in the last 3 days: boil 2 eggs 10 minutes, cool 5 minutes in cold water and peel them.',
    ],
    steps: [
      { text: 'No cooking: only the eggs are boiled (if you have none boiled in the last 3 days). Open and drain 4 cans of tuna (240 g) and put the tuna in the bowl.', heat: 'none' },
      { text: 'Add the pepper, cucumber, onion, 2 tsp olive oil (10 g), 1½ tbsp lemon juice (20 g) and black pepper (1 g). Mix.', heat: 'none' },
      { text: 'Put half the tuna salad in each box. Put the lettuce on top and 1 sliced egg.', heat: 'none', pack: true },
      { text: 'Spoon 50 g hummus (about 2½ tbsp) into each small pot. The pitas stay in their bag.', heat: 'none' },
      { text: 'At lunch: open each pita, spread the hummus inside, then fill with the tuna salad and egg. Building it at lunch keeps the bread dry.', heat: 'none' },
    ],
    boxUp: 'Straight into the fridge. {{split}} Tuna salad and hummus keep 2 days, eggs 3 days: make 2 boxes at a time. Pitas keep in their bag to the pack date (freeze them if not used in 3 days). Carry in an insulated bag with an ice pack.',
    reheat: 'Not reheated: eat cold within 2 hours of leaving the fridge (1 hour on a day above 32 °C).',
  },
  storagePlan: 'Tuna salad and hummus keep 2 days, eggs 3 days. {{split}} The pitas keep in their bag to the pack date (freeze if not used in 3 days). Make 2 boxes at a time.',
  reheat: 'Not reheated. Eat within 2 h of leaving the fridge (1 h above 32 °C).',
  crossCheck: null,
  changes: [
    'Hummus replaces the mayonnaise of the references (Ocado suggests it), so there is no label to check for E471.',
    'Two pitas and 120 g tuna per box to reach a full lunch with 35 g protein or more.',
    'Mission pita chosen because it has no E471 (label 2026-10-13); the Mercadona wheat wraps all list E471 of unstated origin.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking: dated labels (tuna, hummus, pita) and USDA SR Legacy values (egg, vegetables).',
  halal: { status: 'halal', reason: 'Tuna (tuna, water, salt), hummus with additives de origen vegetal, pita without E471, eggs and vegetables (labels read 2026-10-13/14).' },
};
