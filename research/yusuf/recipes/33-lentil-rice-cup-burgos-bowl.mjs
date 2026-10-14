// R-MP-33 · Lentil and brown-rice bowl with queso de Burgos and tomato salad (lunch box). Batch: 2 boxes.
export default {
  n: 33,
  serving: 'box',
  boxes: 2,
  effort: 'assemble',
  minutes: 10,
  id: 'med-lentil-rice-burgos-bowl-box',
  name: 'Lentil and brown-rice bowl with queso de Burgos and tomato salad (lunch box)',
  names: {
    en: 'Lentil and brown-rice bowl with queso de Burgos and tomato salad',
    es: 'Bol de lentejas y arroz integral con queso de Burgos y ensalada de tomate',
    ca: "Bol de llenties i arròs integral amb formatge de Burgos i amanida de tomàquet",
    roman: 'daal chawal bowl',
  },
  aliases: ['mujaddara bowl', 'lentil rice bowl', 'lentejas con arroz', 'daal chawal salad', 'mjadara', 'bol de lentejas', 'lentil and rice salad'],
  pitch: 'A no-cook mujaddara: cumin-lemon lentils over a brown-rice cup, with cool fresh cheese and tomato on the side.',
  eat: 'either',
  tags: ['middle-eastern', 'mediterranean', 'meal-prep', 'eat-cold', 'vegetarian'],
  references: [
    { title: 'Gulf News, Ramadan recipe: Mjdara msfaieh salad', url: 'https://gulfnews.com/uae/ramadan-recipe-mjdara-msfaieh-salad-1.2032433', used: 'lentil-and-rice base served with diced cucumber, tomato and lettuce in lemon and olive oil, with mint and parsley', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Saveur, Mujaddara (rice with lentils, frizzled onions and lemony yogurt sauce)', url: 'https://www.saveur.com/recipes/mujaddara-recipe', used: 'lentils and rice with cumin, topped with a lemony yogurt sauce', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'lentils', label: 'Cumin-lemon lentils with tomato, cucumber and rocket', storage: 'cold-salad', yield: 'none', eat: 'either',
      lines: [
        ['lentils-jar', 400, '1 jar, drained and rinsed (200 g per box)'],
        ['tomato', 200, 'diced'],
        ['cucumber', 120, 'diced'],
        ['rocket', 40, 'packed on top'],
        ['onion-red', 30, 'finely chopped'],
        ['oil-olive', 20, '10 g per box'],
        ['lemon-juice', 30, ''],
        ['cumin', 2, 'ground'],
        ['mint', 4, 'chopped (or parsley)'],
      ],
    },
    {
      id: 'cheese', label: 'Queso de Burgos 0% (2 tubs)', storage: 'proposed:sealed-pack', yield: 'none', eat: 'cold',
      lines: [['burgos-0', 250, '4 tubs of 62.5 g (2 per box)']],
    },
    {
      id: 'rice', label: 'Brown rice microwave cup (sealed)', storage: 'proposed:sealed-pack', yield: 'none', eat: 'hot',
      lines: [['rice-cup-brown', 250, '1 cup (125 g) per box']],
    },
  ],
  method: [
    'Drain and rinse the lentils. Mix with tomato, cucumber, onion, mint, olive oil, lemon and cumin; put half in each box with the rocket on top.',
    'Add 2 sealed Burgos tubs and 1 sealed rice cup to each box.',
    'At lunch: microwave the rice cup 40 s, tip it in, crumble the Burgos over and mix. Good cold too.',
  ],
  keeps: '2 days in the fridge; do not freeze',
  storagePlan: 'The dressed lentils keep 2 days; the Burgos tubs and rice cups stay sealed to their pack dates. Make 2 boxes at a time.',
  reheat: 'Only the sealed rice cup is microwaved (40 s). The cheese stays cold.',
  crossCheck: null,
  changes: [
    'No-cook version of mujaddara: jarred lentils and a brown-rice cup instead of cooking both; no fried onions (that alone saves about 15 g oil per box).',
    'Two tubs of queso de Burgos 0% (24 g protein per 125 g) instead of a yogurt sauce, so the box reaches 35 g protein without meat.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking: dated labels (lentils, rice cup, Burgos) and USDA SR Legacy vegetables.',
  halal: { status: 'halal', reason: 'Lentils, rice, vegetables and queso de Burgos with microbial rennet (label 2026-10-14).' },
};
