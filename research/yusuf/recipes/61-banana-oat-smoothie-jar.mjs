// R-MP-61 · Banana, oat and protein-yogurt smoothie jar with peanuts (breakfast jar, no cooking). Batch: 1 jar.
export default {
  n: 61,
  slot: 'breakfast',
  serving: 'jar',
  boxes: 1,
  effort: 'assemble',
  minutes: 5,
  cuisine: 'international',
  shortName: 'Banana oat smoothie',
  id: 'intl-banana-oat-smoothie-jar',
  name: 'Banana, oat and protein yogurt smoothie jar (breakfast jar)',
  names: {
    en: 'Banana, oat and protein yogurt smoothie jar',
    es: 'Batido de plátano, avena y yogur proteico en tarro',
    ca: 'Batut de plàtan, civada i iogurt proteic en pot',
  },
  aliases: ['smoothie', 'banana smoothie', 'batido', 'batido de platano', 'protein smoothie', 'oat smoothie', 'batut', 'breakfast shake'],
  pitch: 'Blend it the night before, drink it on the way out: protein yogurt, milk, oats, a banana and a few peanuts. No protein powder.',
  eat: 'cold',
  tags: ['international', 'meal-prep', 'eat-cold', 'vegetarian'],
  references: [
    { title: 'Well Plated, Greek yogurt smoothie', url: 'https://www.wellplated.com/greek-yogurt-smoothie/', used: 'banana, Greek yogurt, oats and peanut butter with milk; blend up to a day ahead and keep in a sealed jar', read: 'search-engine result summary, 2026-10-15' },
    { title: 'Grateful Grazer, High-protein strawberry banana smoothie with Greek yogurt', url: 'https://gratefulgrazer.com/wprm_print/high-protein-strawberry-banana-smoothie-with-greek-yogurt', used: 'leftover smoothie keeps refrigerated up to 24 hours; stir before drinking', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'smoothie', label: 'Smoothie', storage: 'overnight-oats', yield: 'none', eat: 'cold',
      lines: [
        ['protein-yogurt', 200, 'Mercadona +Proteínas natural'],
        ['milk-semi', 150, ''],
        ['oats', 40, ''],
        ['banana', 101, '1 small'],
        ['peanuts', 15, 'or 15 g almonds'],
      ],
    },
  ],
  method: [
    'Put everything in a jug and blend 1 minute (a stick blender is enough).',
    'Pour into a 500 ml jar with a lid, filled to the top (less air, less browning). Fridge.',
    'Shake and drink within 24 hours.',
  ],
  keeps: '24 hours in the fridge',
  storagePlan: 'Make it the night before, one jar at a time: the references keep a blended smoothie 1 day. The oats thicken it overnight; add a splash of milk if you like it thinner.',
  reheat: 'Not reheated.',
  crossCheck: null,
  changes: [
    'Protein yogurt instead of protein powder (whey brands are not all halal-certified).',
    'Whole peanuts blended in instead of peanut butter.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking: labels (yogurt, milk), USDA oats, banana and peanuts.',
  halal: { status: 'halal', reason: 'Protein yogurt of milk and cultures (no gelatine), milk, oats, banana, peanuts.' },
};
