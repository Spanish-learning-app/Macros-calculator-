// R-MP-58 · Vegetable crema with boiled eggs, chickpeas and bread (dinner portion, no cooking). Batch: 2 portions.
export default {
  n: 58,
  slot: 'dinner',
  serving: 'portion',
  boxes: 2,
  dinnerOnly: true, // cooked on the night or a soup: not a lunch box
  effort: 'assemble',
  minutes: 8,
  cuisine: 'spanish',
  shortName: 'Vegetable crema dinner',
  id: 'es-crema-verduras-huevo-garbanzos-portion',
  name: 'Vegetable crema with boiled eggs, chickpeas and bread (dinner portion)',
  names: {
    en: 'Vegetable crema with boiled eggs, chickpeas and bread',
    es: 'Crema de verduras con huevo duro, garbanzos y pan',
    ca: 'Crema de verdures amb ou dur, cigrons i pa',
  },
  aliases: ['crema de verduras', 'vegetable soup', 'soup dinner', 'crema con huevo', 'sopa de verduras', 'crema de verdures', 'puree de verduras'],
  pitch: 'Half a brik of crema de verduras heated with chickpeas, topped with chopped boiled egg and a drizzle of olive oil, with bread to dip. A warm dinner in 8 minutes.',
  eat: 'hot',
  tags: ['spanish', 'meal-prep', 'contains-egg', 'vegetarian'],
  references: [
    { title: 'Que.es, Crema de verduras con proteína: el huevo o queso que evita que parezca poca cena', url: 'https://www.que.es/2026/06/30/crema-verduras-proteina-huevo-queso-cena/', used: 'chopped boiled egg on a vegetable crema to make it a full dinner', read: 'search-engine result summary, 2026-10-15' },
    { title: 'Vitónica, Crema de calabacín y garbanzos', url: 'https://www.vitonica.com/recetas-saludables/crema-calabacin-garbanzos-receta-saludable-reconfortante-que-sienta-bien-a-toda-familia', used: 'vegetable crema with 400 g cooked chickpeas (its white wine left out)', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'soup', label: 'Crema de verduras with chickpeas', storage: 'cold-salad', yield: 'none', eat: 'hot',
      lines: [
        ['crema-verduras', 515, '1 brik of 500 ml (half per portion)'],
        ['chickpeas-jar', 400, '1 jar, rinsed, heated in the soup'],
        ['oil-olive', 10, 'extra virgin, to finish'],
        ['black-pepper', 1, ''],
      ],
    },
    {
      id: 'egg', label: 'Hard-boiled eggs (2 per portion)', storage: 'egg-dish', yield: 'none', eat: 'hot',
      lines: [['egg-boiled', 200, '4 eggs']],
    },
    {
      id: 'bread', label: 'Bread (½ bocadillo roll per portion)', storage: 'proposed:bread', yield: 'none', eat: 'hot',
      lines: [['bocadillo-bread', 130, '1 roll']],
    },
  ],
  method: {
    equipment: ['Small pot with a lid for 2 eggs', 'Medium pan, or a large microwave-safe bowl with a plate as a lid', 'Sieve', 'A soup bowl'],
    prep: [
      'Sunday: boil 4 eggs (10 minutes in bubbling water, then 5 minutes in cold water), peel them and keep them in the fridge (3 days).',
      'Drain and rinse the chickpeas (1 jar, 400 g).',
    ],
    steps: [
      { text: 'No cooking from raw: you only heat a ready-made soup. Pour half the brik of crema de verduras (about 250 ml, 258 g) into the pan or bowl.', heat: 'none' },
      { text: 'Add half the chickpeas (200 g).', heat: 'none' },
      { text: 'Heat until it boils: in a pan 4–5 minutes, stirring; in the microwave 3–4 minutes with a plate on top, stirring halfway.', heat: 'medium', minutes: 4 },
      { text: 'Pour into the soup bowl. Chop 2 boiled eggs and put them on top.', heat: 'none' },
      { text: 'Drizzle 1 tsp extra virgin olive oil (5 g) and grind over a little black pepper. Eat with ½ roll (65 g).', heat: 'none' },
    ],
    doneWhen: 'The soup bubbles at the edge and is steaming hot all through.',
    boxUp: 'Close the opened brik and put the rest of the chickpeas in a closed box: both go in the fridge and are used the next night (they keep 2 days once opened). Do not freeze the eggs.',
    reheat: 'The soup is heated fresh each night until it boils. The eggs go on after, cold or warmed by the soup.',
    tips: ['The crema has no stock, cream or butter (Hacendado 60308). Another brand may use chicken stock: check the label.'],
  },
  keeps: 'Unopened briks to their date; eggs 3 days',
  storagePlan: 'One brik and one jar of chickpeas make 2 dinners: once opened, both keep 2 days in the fridge, so eat the second portion the next night. Boil the eggs on Sunday (3 days).',
  reheat: 'Heat the soup until boiling hot; the eggs go on after.',
  crossCheck: null,
  changes: [
    'Crema de verduras Hacendado (no cream, butter or stock; label 2026-10-15). The calabaza crema has cream and butter, and Javier marks the calabacín one check (whey).',
    'Chickpeas and 2 eggs make a soup a full dinner: 30 g protein or more.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking beyond heating: Lab records (crema, egg, chickpeas from USDA) and the bread label.',
  halal: { status: 'halal', reason: 'Vegetable crema with no stock, cream or butter (Mercadona 60308, 2026-10-15); eggs, chickpeas, bread of flour, water, yeast and salt.' },
};
