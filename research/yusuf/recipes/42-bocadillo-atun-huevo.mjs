// R-MP-42 · Tuna, egg, tomato and avocado bocadillo (lunch box). Batch: 2 boxes. Sprint 3 variety.
export default {
  n: 42,
  serving: 'box',
  boxes: 2,
  effort: 'assemble',
  minutes: 10,
  cuisine: 'spanish',
  shortName: 'Tuna and egg bocadillo',
  id: 'es-bocadillo-atun-huevo-box',
  name: 'Tuna, egg, tomato and avocado bocadillo (lunch box)',
  names: {
    en: 'Tuna, egg, tomato and avocado bocadillo',
    es: 'Bocadillo de atún, huevo duro, tomate y aguacate',
    ca: 'Entrepà de tonyina, ou dur, tomàquet i alvocat',
  },
  aliases: ['bocadillo de atun', 'tuna sandwich', 'tuna bocadillo', 'bocata de atun', 'entrepa de tonyina', 'tuna egg sandwich', 'atun con huevo'],
  pitch: 'The classic bocadillo de atún with a boiled egg, tomato and a pot of mashed avocado instead of mayonnaise. Ten minutes, no cooking.',
  eat: 'cold',
  tags: ['spanish', 'meal-prep', 'eat-cold', 'contains-egg', 'seafood-fish'],
  references: [
    { title: 'Guía Infantil, Bocadillo de atún', url: 'https://www.guiainfantil.com/recetas/sandwiches-y-bocadillos/bocadillo-de-atun-merienda-sana-para-ninos/', used: 'bread with olive oil, tuna, thin tomato slices', read: 'search-engine result summary, 2026-10-15' },
    { title: 'Directo al Paladar, Mini de atún, huevo, tomate y espárragos', url: 'https://www.directoalpaladar.com/tapas-y-pinchos/mini-de-atun-huevo-tomate-y-esparragos-receta', used: '2 eggs, 2 tomatoes, lettuce, 2 small cans of tuna for 8 slices of bread', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'filling', label: 'Tuna with tomato, onion and lettuce', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['tuna', 240, '4 cans atún claro al natural, drained (120 g per box)'],
        ['tomato', 200, 'sliced, packed apart from the bread'],
        ['onion-red', 20, 'finely chopped'],
        ['lettuce', 60, ''],
        ['oil-olive', 6, '3 g per box'],
        ['black-pepper', 1, ''],
      ],
    },
    {
      id: 'avocado', label: 'Mashed avocado with lemon (small pot)', storage: 'cold-salad', pot: true, yield: 'none', eat: 'cold',
      lines: [
        ['avocado', 100, '½ avocado, mashed (50 g per box)'],
        ['lemon-juice', 6, 'keeps it green'],
        ['salt', 1, ''],
      ],
    },
    {
      id: 'egg', label: 'Hard-boiled egg (1 per box)', storage: 'egg-dish', yield: 'none', eat: 'cold',
      lines: [['egg-boiled', 100, '2 eggs, boiled 10 min']],
    },
    {
      id: 'bread', label: 'Bocadillo roll (1 per box, in its bag)', storage: 'proposed:bread', yield: 'none', eat: 'cold',
      lines: [['bocadillo-bread', 260, '2 Hacendado bocadillo rolls of 130 g']],
    },
  ],
  method: [
    'Boil 2 eggs 10 min (or take 2 from the Sunday batch); cool and peel.',
    'Drain the tuna; mix with onion, oil and pepper. Put half in each box with the tomato slices, lettuce and a sliced egg.',
    'Mash the avocado with lemon and salt; press into 2 small pots with no air on top.',
    'At lunch: split the roll, spread the avocado, add the tuna, egg, tomato and lettuce.',
  ],
  keeps: '2 days in the fridge; do not freeze',
  storagePlan: 'Tuna salad and avocado keep 2 days, eggs 3: make 2 boxes at a time. Rolls keep in their bag 2–3 days.',
  reheat: 'Not reheated. Eat within 2 h of leaving the fridge (1 h above 32 °C).',
  crossCheck: null,
  changes: [
    'Mashed avocado replaces the mayonnaise of the references: no E471 question and 3 g of fibre per box.',
    '120 g tuna (2 cans) and 1 egg per box for a full lunch with 35 g protein or more.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking: dated labels (tuna, bread), the Lab records for egg and avocado, USDA vegetables.',
  halal: { status: 'halal', reason: 'Tuna (tuna, water, salt), roll of flour, water, yeast and salt, eggs, avocado and vegetables (labels read 2026-10-13 and 2026-10-15).' },
};
