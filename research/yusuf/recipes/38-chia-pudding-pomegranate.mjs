// R-MP-38 · Protein chia pudding with pomegranate (snack or merienda jar). Batch: 3 jars.
export default {
  n: 38,
  slot: 'snacks',
  serving: 'jar',
  boxes: 3,
  effort: 'assemble',
  minutes: 8,
  cuisine: 'international',
  shortName: 'Chia pudding jar',
  id: 'intl-protein-chia-pudding-pomegranate-jar',
  name: 'Protein chia pudding with pomegranate (snack jar)',
  names: {
    en: 'Protein chia pudding with pomegranate',
    es: 'Pudin de chía con yogur proteico y granada',
    ca: 'Púding de xia amb iogurt proteic i magrana',
  },
  aliases: ['chia pudding', 'protein chia pudding', 'pudin de chia', 'chia jar', 'chia seed pudding', 'merienda chia', 'chia con yogur'],
  pitch: 'Stir, wait overnight, done: chia set in protein yogurt and milk, pomegranate on top.',
  eat: 'cold',
  tags: ['international', 'meal-prep', 'eat-cold', 'vegetarian'],
  references: [
    { title: 'Daisy Beet, Chia seed pudding with Greek yogurt (high protein)', url: 'https://daisybeet.com/high-protein-greek-yogurt-chia-seed-pudding/', used: 'milk, Greek yogurt, maple syrup, vanilla and chia whisked and set 4 h or overnight; about 23 g protein and 13 g fibre per serving', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Country Life Foods, High-protein chia seed pudding with Greek yogurt', url: 'https://countrylifefoods.com/blogs/nuts-seeds/high-protein-chia-seed-pudding-with-greek-yogurt-guide', used: 'per serving 2 tbsp chia, ½ cup Greek yogurt, ½ cup milk, 1 tsp honey', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'pudding', label: 'Chia set in protein yogurt and milk', storage: 'overnight-oats', yield: 'none', eat: 'cold',
      lines: [
        ['chia', 45, '15 g per jar'],
        ['protein-yogurt', 450, '150 g per jar'],
        ['milk-semi', 180, '60 g per jar'],
        ['cinnamon', 1, 'or vanilla'],
      ],
    },
    {
      id: 'fruit', label: 'Pomegranate arils (added in the morning)', storage: 'proposed:whole-fruit', yield: 'none', eat: 'cold',
      lines: [['pomegranate', 150, '50 g per jar']],
    },
  ],
  method: [
    'Whisk the protein yogurt, milk and cinnamon in a jug; stir in the chia; wait 5 minutes and stir again so it does not clump.',
    'Pour into 3 jars and refrigerate at least 4 hours.',
    'Top with pomegranate arils just before eating.',
  ],
  keeps: '3 days in the fridge; do not freeze',
  storagePlan: 'Like overnight oats: 3 jars keep 3 days. Keep the opened pomegranate arils in a closed box (up to 3 days).',
  reheat: 'Not reheated.',
  crossCheck: null,
  changes: [
    'No sweetener: a high-protein yogurt (milk and cultures only) replaces Greek yogurt + maple syrup, and the pomegranate sweetens it.',
    'Portion set at 15 g chia so a jar stays a snack (about 220 kcal) rather than a meal.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking: dated labels (protein yogurt, milk) and USDA SR Legacy values (chia, pomegranate).',
  halal: { status: 'halal', reason: 'Milk, protein yogurt (no gelatine), chia and fruit only.' },
};
