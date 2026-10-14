// R-MP-30 · Salmon and brown-rice bowl with avocado, cucumber and egg (lunch box). Batch: 2 boxes.
export default {
  n: 30,
  serving: 'box',
  boxes: 2,
  effort: 'assemble',
  minutes: 12,
  id: 'intl-salmon-brown-rice-bowl-box',
  name: 'Salmon and brown-rice bowl with avocado, cucumber and egg (lunch box)',
  names: {
    en: 'Salmon and brown-rice bowl with avocado, cucumber and egg',
    es: 'Bol de salmón y arroz integral con aguacate, pepino y huevo',
    ca: "Bol de salmó i arròs integral amb alvocat, cogombre i ou",
  },
  aliases: ['salmon bowl', 'salmon rice bowl', 'poke bowl', 'bol de salmon', 'salmon poke', 'canned salmon bowl', 'bol de salmo', 'salmon and rice'],
  pitch: 'A poke-style bowl from the cupboard: canned salmon with lemon, a sealed brown-rice cup you microwave at uni, avocado and a boiled egg.',
  eat: 'either',
  tags: ['international', 'meal-prep', 'eat-cold', 'contains-egg', 'seafood-fish'],
  references: [
    { title: 'Skinnytaste, Spicy canned salmon rice bowl', url: 'https://www.skinnytaste.com/spicy-canned-salmon-rice-bowl/', used: 'canned salmon with light mayo and sriracha over brown rice, diced cucumber, scallions, nori; avocado and carrot suggested', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Laura Fuentes, Avocado salmon bowls', url: 'https://www.laurafuentes.com/avocado-salmon-bowls', used: 'rice, salmon, cucumber, avocado; components stored in separate containers, up to 2 days', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'salmon', label: 'Salmon, cucumber, carrot and avocado with lemon', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['salmon-can', 240, '3 cans (80 g each), drained, flaked; 120 g per box'],
        ['cucumber', 160, 'diced'],
        ['carrot', 120, 'grated'],
        ['avocado', 100, '½ avocado, diced (25 g per box)'],
        ['onion-red', 20, 'finely chopped'],
        ['lemon-juice', 30, 'also stops the avocado browning'],
        ['coriander', 6, 'chopped (or parsley)'],
        ['black-pepper', 1, ''],
      ],
    },
    {
      id: 'egg', label: 'Hard-boiled egg (1 per box)', storage: 'egg-dish', yield: 'none', eat: 'cold',
      lines: [['egg-boiled', 100, '2 eggs, boiled 10 min']],
    },
    {
      id: 'rice', label: 'Brown rice microwave cup (sealed)', storage: 'proposed:sealed-pack', yield: 'none', eat: 'hot',
      lines: [['rice-cup-brown', 250, '1 cup (125 g) per box, kept sealed']],
    },
  ],
  method: [
    'Boil 2 eggs 10 min, cool and peel (or use 2 from the Sunday batch).',
    'Drain and flake the salmon; mix with cucumber, carrot, avocado, onion, coriander, lemon and pepper.',
    'Each box: half the salmon salad, 1 halved egg, and 1 sealed rice cup on the side.',
    'At lunch: microwave the rice cup 40 s (pierce the film), tip it into the box, mix. Or eat the rice cold.',
  ],
  keeps: '2 days in the fridge; do not freeze',
  storagePlan: 'Salmon salad keeps 2 days, eggs 3 days; the rice cup stays sealed (cupboard-stable) until lunch, which avoids the 1-day rule for cooked rice. Make 2 boxes on Sunday or Tuesday night.',
  reheat: 'Only the sealed rice cup goes in the microwave (40 s at 800 W, pierced). The fish and egg are eaten cold.',
  crossCheck: null,
  changes: [
    'Mayonnaise and sriracha swapped for lemon and coriander (lighter, no label to check); soy sauce left out (brewed soy sauce can carry traces of alcohol).',
    'A boiled egg added and the salmon set at 120 g per box to reach 35 g protein.',
    'The rice is a sealed microwave cup kept apart, so the box can be made 2 days ahead.',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking: dated labels (salmon, rice cup) and USDA SR Legacy values (egg, avocado, vegetables). Canned salmon values vary between cans (bones and skin).',
  halal: { status: 'halal', reason: 'Fish, egg, rice and vegetables only; no soy sauce or mirin.' },
};
