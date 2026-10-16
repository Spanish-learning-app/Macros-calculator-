// R-MP-50 · Chicken burrito bowl with kidney beans, corn, brown rice cup, salsa and yogurt (lunch box). Batch: 4 boxes.
export default {
  n: 50,
  serving: 'box',
  boxes: 4,
  effort: 'cook',
  minutes: 20,
  cuisine: 'mexican',
  shortName: 'Chicken burrito bowl',
  id: 'intl-chicken-burrito-bowl-box',
  name: 'Chicken burrito bowl with beans, corn, rice and salsa (lunch box)',
  names: {
    en: 'Chicken burrito bowl with kidney beans, corn, brown rice and salsa',
    es: 'Burrito bowl de pollo con alubias rojas, maíz, arroz integral y salsa',
    ca: 'Burrito bowl de pollastre amb mongetes vermelles, blat de moro, arròs integral i salsa',
  },
  aliases: ['burrito bowl', 'chicken burrito bowl', 'mexican bowl', 'bowl mexicano', 'burrito', 'chipotle bowl', 'arroz con pollo mexicano', 'taco bowl'],
  pitch: 'Smoky cumin-paprika chicken with kidney beans and sweetcorn over a brown-rice cup, with pico de gallo and a cool yogurt pot. Microwave the hot half, keep the salsa cold.',
  eat: 'either',
  tags: ['international', 'meal-prep'],
  references: [
    { title: 'Weight Watchers, Chicken burrito bowl', url: 'https://www.weightwatchers.com/au/recipe/chicken-burrito-bowl/58d1a20996d1988e115d07bc', used: 'taco-spiced chicken breast with kidney beans and corn over lettuce and tomato; serves 4', read: 'search-engine result summary, 2026-10-15' },
    { title: 'Brookshire Brothers, Chicken burrito bowls', url: 'https://brookshirebrothers.com/blog-entry/chicken-burrito-bowls', used: 'meal-prep containers of chicken, corn, beans and rice; salsa and sour cream stored separately', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'chicken', label: 'Spiced chicken', storage: 'cooked-meat', yield: 'breastPanFried', eat: 'hot',
      lines: [
        ['chicken-breast', 520, 'strips'],
        ['oil-sunflower', 10, ''],
        ['cumin', 3, ''],
        ['paprika', 4, 'pimentón (de la Vera if you like smoky)'],
        ['chilli-powder', 2, ''],
        ['oregano', 2, ''],
        ['garlic', 6, '', 'onionSoft'],
        ['salt', 3, ''],
      ],
    },
    {
      id: 'beans', label: 'Kidney beans and sweetcorn', storage: 'cooked-curry', yield: 'none', eat: 'hot',
      lines: [
        ['kidney-beans', 400, '1 jar, drained and rinsed, warmed with the cumin'],
        ['sweetcorn', 210, '3 small tins, drained'],
        ['cumin', 2, ''],
        ['salt', 1, ''],
      ],
    },
    {
      id: 'rice', label: 'Brown rice cup (sealed, 1 per box)', storage: 'proposed:sealed-pack', yield: 'none', eat: 'hot',
      lines: [['rice-cup-brown', 500, '2 packs of 2 × 125 g cups']],
    },
    {
      id: 'salsa', label: 'Salsa, yogurt and lettuce (cold side)', storage: 'cold-salad', pot: true, yield: 'none', eat: 'cold',
      lines: [
        ['salsa-mexicana', 240, '60 g per box'],
        ['yogurt-greek-light', 160, 'instead of sour cream'],
        ['lettuce', 120, 'shredded'],
        ['lemon-juice', 10, 'or lime'],
      ],
    },
  ],
  method: [
    'Toss the chicken with oil, spices, garlic and salt; sear 6–8 min (75 °C inside).',
    'In the same pan warm the beans and corn with the cumin, 3 min.',
    'Box chicken, beans and corn with a sealed rice cup; salsa, yogurt and lettuce in a small box or pot.',
    'At lunch: microwave the rice cup (1 min) and the chicken and beans until steaming; top with the cold salsa, yogurt and lettuce.',
  ],
  keeps: 'Chicken and beans 3 days (box 4 frozen); salsa side 2 days',
  storagePlan: 'Boxes 1–3 in the fridge; box 4\'s chicken and beans in the freezer (3 months). Open the salsa jar on Sunday (it keeps 2 days opened): pot 2 boxes then and the rest on Tuesday night, or use the other half of the jar for the breakfast tacos.',
  reheat: 'Chicken, beans and rice cup until steaming hot (75 °C). The salsa and yogurt stay cold.',
  crossCheck: null,
  changes: [
    'Kidney beans instead of black beans: Mercadona sells black beans only dry (2026-10-15); the jarred red ones need no soaking.',
    'Greek yogurt instead of sour cream and cheese; sealed brown-rice cups for the lunch-box test.',
  ],
  confidence: 'B',
  confidenceWhy: 'Chicken from Bognár; USDA beans and corn; Lab records for the rice cup and salsa (labels read 2026-10-14/15).',
  halal: { status: 'halal', reason: 'Chicken from a halal butcher; salsa with wine vinegar only (vinegar, not wine; Javier 2026-10-15); beans, corn and rice cups with plain ingredients.' },
};
