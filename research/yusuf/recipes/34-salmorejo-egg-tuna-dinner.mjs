// R-MP-34 · Salmorejo dinner: a bowl of salmorejo with boiled eggs and tuna, wholemeal picos and an orange. Batch: 2 portions.
export default {
  n: 34,
  slot: 'dinner',
  serving: 'portion',
  boxes: 2,
  effort: 'assemble',
  minutes: 8,
  cuisine: 'spanish',
  shortName: 'Salmorejo, egg, tuna',
  id: 'es-salmorejo-huevo-atun-portion',
  name: 'Salmorejo with boiled eggs and tuna, picos and an orange (dinner portion)',
  names: {
    en: 'Salmorejo with boiled eggs and tuna, picos and an orange',
    es: 'Salmorejo con huevo duro y atún, picos integrales y una naranja',
    ca: 'Salmorejo amb ou dur i tonyina, picos integrals i una taronja',
  },
  aliases: ['salmorejo', 'salmorejo con huevo', 'salmorejo con atun', 'cold tomato soup', 'salmorejo cordobes', 'gazpacho dinner', 'salmorejo amb ou'],
  pitch: 'A cold Córdoba-style dinner from a carton: salmorejo topped with chopped egg and tuna instead of the usual cured ham, picos to dip.',
  eat: 'cold',
  tags: ['spanish', 'meal-prep', 'eat-cold', 'contains-egg', 'seafood-fish'],
  references: [
    { title: 'Spain.info, Salmorejo', url: 'https://www.spain.info/es/receta/salmorejo/', used: '1 kg tomatoes, 200 g day-old bread, 100 g extra virgin olive oil, 1 garlic clove, 10 g salt; topped with chopped boiled egg (ham optional)', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Vorwerk Thermomix, Salmorejo con pipirrana y caballa', url: 'https://www.vorwerk.com/es/es/comunidad/noticias/inspiracion-thermomix/recetas/preparar-salmorejo-pipirrana-caballa-thermomix', used: 'salmorejo served with boiled egg and canned fish (mackerel) instead of ham', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'salmorejo', label: 'Salmorejo (from the carton, opened)', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [['salmorejo', 500, '250 g (about 245 ml) per portion; the 1 l brik covers 4']],
    },
    {
      id: 'topping', label: 'Boiled eggs and tuna', storage: 'egg-dish', yield: 'none', eat: 'cold',
      lines: [
        ['egg-boiled', 200, '2 eggs per portion, chopped'],
        ['tuna', 120, '1 can (60 g drained) per portion, kept sealed until dinner'],
        ['oil-olive', 6, 'a few drops on top (3 g per portion)'],
      ],
    },
    {
      id: 'picos', label: 'Wholemeal picos', storage: 'proposed:bread', yield: 'none', eat: 'cold',
      lines: [['picos', 60, '30 g per portion']],
    },
    {
      id: 'fruit', label: 'Orange', storage: 'proposed:whole-fruit', yield: 'none', eat: 'cold',
      lines: [['orange', 262, '1 orange (131 g edible) per portion']],
    },
  ],
  method: [
    'Use 2 eggs per portion from the Sunday boiled-egg batch; peel and chop.',
    'Pour 250 g very cold salmorejo into a bowl, top with the egg and the drained tuna and a few drops of olive oil.',
    'Eat with 30 g of picos; an orange for dessert.',
  ],
  keeps: 'opened brik 2 days; eggs 3 days; picos and orange in the cupboard',
  storagePlan: 'Nothing to batch except the eggs (Sunday). Once opened, the salmorejo brik is treated as a cold salad (2 days in the fridge, Lab rule), so it covers 2 dinners in a row; keep a second unopened brik in the cupboard.',
  reheat: 'Not reheated: salmorejo is eaten very cold.',
  crossCheck: null,
  changes: [
    'Tuna replaces the cured ham of the classic topping; with 2 eggs it brings the bowl to 30 g protein.',
    'Wholemeal picos and an orange added for fibre: salmorejo alone has 1.3 g per 100 g.',
    'Mercadona\'s salmorejo contains vinagre de Jerez (vinegar, allowed by the Lab: NUTRITION.md §3). If you avoid any wine vinegar, make it at home with lemon, or swap for gazpacho after reading its label.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking (eggs from the Sunday batch). Dated labels (salmorejo, tuna, picos) and USDA SR Legacy values (egg, orange).',
  halal: { status: 'halal', reason: 'Salmorejo of tomato, bread, olive oil, pepper, garlic, salt and vinegar; tuna, eggs, wholemeal picos (no lard) and fruit (labels read 2026-10-13/14).' },
};
