// R-MP-37 · Protein hummus pot (hummus whipped with queso fresco batido) with veg sticks and picos (snack). Batch: 2.
export default {
  n: 37,
  slot: 'snacks',
  serving: 'box',
  boxes: 2,
  effort: 'assemble',
  minutes: 8,
  cuisine: 'middle-eastern',
  shortName: 'Hummus and veg sticks',
  id: 'med-protein-hummus-veg-sticks-box',
  name: 'Protein hummus with veg sticks and picos (snack box)',
  names: {
    en: 'Protein hummus with veg sticks and picos',
    es: 'Hummus proteico con queso batido, crudités y picos',
    ca: 'Hummus proteic amb formatge batut, crudités i picos',
  },
  aliases: ['protein hummus', 'hummus snack', 'hummus with veggies', 'crudites', 'hummus and carrots', 'hummus con queso batido', 'veg sticks', 'merienda hummus'],
  pitch: 'Hummus whipped with queso fresco batido doubles the protein; carrot, cucumber and pepper sticks to dip.',
  eat: 'cold',
  tags: ['mediterranean', 'meal-prep', 'eat-cold', 'vegetarian'],
  references: [
    { title: 'Real Life Nutritionist, High-protein hummus', url: 'https://reallifenutritionist.com/wprm_print/high-protein-hummus', used: 'chickpeas blended with cottage cheese, tahini, lemon and garlic; 28 g protein per batch; 5 minutes', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Hungry Healthy Happy, High-protein cottage cheese hummus', url: 'https://hungryhealthyhappy.com/high-protein-cottage-cheese-hummus/', used: 'cottage cheese blended into hummus; served with carrots, cucumbers and peppers', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'dip', label: 'Hummus whipped with queso fresco batido', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['hummus', 80, '40 g per box'],
        ['queso-batido', 260, '130 g per box'],
        ['lemon-juice', 10, ''],
        ['paprika', 1, 'on top'],
      ],
    },
    {
      id: 'veg', label: 'Veg sticks', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['carrot', 120, 'sticks'],
        ['cucumber', 60, 'sticks (half a cucumber)'],
        ['pepper-red', 100, 'strips'],
      ],
    },
    {
      id: 'picos', label: 'Wholemeal picos', storage: 'proposed:bread', yield: 'none', eat: 'cold',
      lines: [['picos', 20, '10 g per box']],
    },
  ],
  method: [
    'Whisk the hummus, queso fresco batido and lemon until smooth; split into 2 pots and dust with paprika.',
    'Cut the vegetables into sticks and pack them next to the pots; picos in a bag.',
  ],
  keeps: '2 days in the fridge',
  storagePlan: 'Make 2 boxes at a time (cut vegetables and the dip keep 2 days).',
  reheat: 'Not reheated.',
  crossCheck: null,
  changes: [
    'Mercadona queso fresco batido 0% (no rennet) in place of cottage cheese, stirred into ready hummus instead of blending chickpeas: no food processor.',
    'Cucumber 60 → 30 g a box and queso batido 120 → 130 g (15 Oct): the first version came to 78 kcal per 100 g, under the Lab floor of 80 for a prep record (check G9). Now 84 kcal per 100 g, 274 kcal and 15.6 g protein a box.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking: dated labels (hummus, queso batido, picos) and USDA SR Legacy vegetables.',
  halal: { status: 'halal', reason: 'Hummus (additives de origen vegetal), queso batido (milk and cultures, no rennet), vegetables and picos without lard.' },
};
