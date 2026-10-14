// R-MP-32 · Five-minute couscous with mackerel, chickpeas and peppers (lunch box, made the night before). Batch: 1 box.
export default {
  n: 32,
  serving: 'box',
  boxes: 1,
  effort: 'assemble',
  minutes: 10,
  id: 'med-cuscus-caballa-garbanzos-box',
  name: 'Couscous with mackerel, chickpeas and peppers (lunch box)',
  names: {
    en: 'Couscous with mackerel, chickpeas and peppers',
    es: 'Cuscús con caballa, garbanzos y pimiento',
    ca: 'Cuscús amb verat, cigrons i pebrot',
  },
  aliases: ['couscous salad', 'ensalada de cuscus', 'cuscus con caballa', 'mackerel couscous', 'couscous tuna', 'amanida de cuscus', 'caballa'],
  pitch: 'Kettle-only lunch: couscous soaks while you open a can of mackerel and a jar of chickpeas.',
  eat: 'either',
  tags: ['mediterranean', 'middle-eastern', 'meal-prep', 'eat-cold', 'seafood-fish'],
  references: [
    { title: 'El Comidista via Diari de Tarragona, Ensalada de cuscús', url: 'https://www.diaridetarragona.com/gastronomia/recetas/266470/ensalada-perfecta-te-salvara-ocasion-verano.html', used: '200 g couscous with 200 ml boiling water, salt and oil, covered 5 min; 100 g cooked chickpeas, red onion, olives, feta, mint, lemon; keep dressing apart in the tupper', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Público, Receta de ensalada de cuscús', url: 'https://www.publico.es/culturas/recetas/receta-ensalada-cuscus.html', used: 'couscous salad with raw vegetables, lemon and olive oil', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'couscous', label: 'Couscous (soaked)', storage: 'cooked-starch', yield: 'none', eat: 'either',
      lines: [
        ['couscous', 60, 'dry'],
        ['water', 84, 'boiling, from the kettle: 1.4 g per g couscous (the Sprint 1 ratio), all absorbed', 'absorbed'],
        ['lemon-juice', 15, ''],
        ['salt', 0.5, 'a pinch'],
      ],
    },
    {
      id: 'salad', label: 'Mackerel, chickpeas and vegetables', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['mackerel', 85, '1 can, drained (its own olive oil is enough dressing)'],
        ['chickpeas-jar', 130, 'drained, rinsed'],
        ['pepper-red', 60, 'diced'],
        ['cucumber', 60, 'diced'],
        ['tomato-cherry', 60, 'halved'],
        ['parsley', 5, 'chopped (or mint)'],
        ['cumin', 0.5, 'ground'],
      ],
    },
  ],
  method: [
    'Pour 84 g (84 ml) boiling water over 60 g couscous with the salt; cover 5 min, fluff with a fork, add the lemon and let it cool.',
    'Meanwhile drain and rinse the chickpeas, dice the vegetables, and break the mackerel into flakes.',
    'Mix everything in the box. Make it the night before and keep it in the fridge.',
  ],
  keeps: '1 day in the fridge (soaked couscous)',
  storagePlan: 'Soaked couscous follows the cooked-starch rule (1 day in the fridge), so this box is made the night before, one at a time. Opened chickpeas keep 2 more days in a closed box for the next salad.',
  reheat: 'Good cold. If you want it warm: 1½–2 min in the microwave until steaming hot right through, once only.',
  crossCheck: null,
  changes: [
    'Mackerel in olive oil replaces feta and the dressing oil of El Comidista\'s salad: it brings the protein and the fat in one can.',
    'One box at a time because soaked couscous keeps 1 day in the fridge (RULES.mealPrep.storage cooked-starch).',
  ],
  confidence: 'B',
  confidenceWhy: 'Only boiling water is used. Dated labels (couscous, mackerel), USDA SR Legacy chickpeas and vegetables; couscous water fully absorbed (stated water balance, as in Sprint 1).',
  halal: { status: 'halal', reason: 'Fish (mackerel, olive oil, salt), couscous (durum wheat, water), chickpeas and vegetables.' },
};
