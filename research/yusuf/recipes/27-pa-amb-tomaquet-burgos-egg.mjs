// R-MP-27 · Pa amb tomàquet with queso de Burgos 0% and two boiled eggs (breakfast). Batch: 3 portions.
export default {
  n: 27,
  slot: 'breakfast',
  serving: 'portion',
  boxes: 3,
  effort: 'assemble',
  minutes: 12,
  prepWait: 15, // the eggs boil 10 min and cool 5 (R3-B: start to finish includes them)
  waitNote: 'the eggs boil 10 min and cool 5 first (up to 3 days ahead: they keep 3 days in their shells)',
  cuisine: 'spanish',
  shortName: 'Pa amb tomàquet, eggs',
  id: 'es-pa-amb-tomaquet-burgos-ous-portion',
  name: 'Pa amb tomàquet with queso de Burgos, boiled eggs and an orange (breakfast portion)',
  names: {
    en: 'Pa amb tomàquet with queso de Burgos, boiled eggs and an orange',
    es: 'Pan con tomate, queso de Burgos, huevos duros y una naranja',
    ca: 'Pa amb tomàquet amb formatge de Burgos, ous durs i una taronja',
  },
  aliases: ['pa amb tomaquet', 'pan con tomate', 'pan tumaca', 'pan con tomate y huevo', 'pa amb tomaquet i ou', 'esmorzar catala', 'tostada con tomate y queso fresco', 'queso de burgos'],
  pitch: 'The Barcelona breakfast: toasted barra rubbed with tomato and olive oil, with fresh cheese, two boiled eggs and an orange.',
  eat: 'either',
  tags: ['catalan', 'spanish', 'meal-prep', 'contains-egg', 'vegetarian'],
  references: [
    { title: 'Cooklang recipes, Pa amb tomàquet', url: 'https://recipes.cooklang.org/recipes/6945', used: 'crusty bread toasted, rubbed with garlic and the cut side of ripe tomato, salt, olive oil', read: 'search-engine page extract, 2026-10-14' },
    { title: "Tara's Multicultural Table, Pa amb tomàquet (Catalan bread with tomato)", url: 'https://tarasmulticulturaltable.com/pa-amb-tomaquet-catalan-bread-with-tomato/', used: 'tomato grated on the large holes of a box grater, spread on toasted bread with salt and olive oil; served with cheese, omelettes and other sides', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Mallorca.com, Pa amb oli', url: 'https://www.mallorca.com/ca/revista/mallorca-comida-bebida/pa-amb-oli-el-berenar-mes-sincer-de-mallorca', used: 'ripe tomato rubbed on lightly toasted bread, olive oil, with cheese or fish on the side', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'eggs', label: 'Hard-boiled eggs (2 per portion)', storage: 'egg-dish', yield: 'none', eat: 'cold',
      lines: [['egg-boiled', 300, '6 large eggs boiled 10 min up to 3 days ahead, kept in their shells']],
    },
    {
      id: 'cheese', label: 'Queso de Burgos 0% (1 tub)', storage: 'proposed:sealed-pack', yield: 'none', eat: 'cold',
      lines: [['burgos-0', 187.5, '3 of the 4 single 62.5 g tubs']],
    },
    {
      id: 'toast', label: 'Toasted barra with tomato and olive oil (made in the morning)', storage: 'proposed:bread', yield: 'none', eat: 'hot',
      lines: [
        ['pan-barra', 240, '80 g per portion (a third of a barra), toasted'],
        ['tomato', 180, '60 g ripe tomato per portion, grated or rubbed on'],
        ['oil-olive', 15, '5 g (1 tsp) per portion, weighed'],
        ['salt', 1, 'a pinch'],
      ],
    },
    {
      id: 'fruit', label: 'Orange', storage: 'proposed:whole-fruit', yield: 'none', eat: 'cold',
      lines: [['orange', 393, '1 orange (131 g edible) per portion']],
    },
  ],
  method: {
    equipment: ['Pot for 6 eggs', 'Toaster, grill or dry frying pan', 'Box grater and a small bowl', 'Bread knife'],
    prep: ['Up to 3 days before the first breakfast: put 6 eggs in the pot, cover with cold water, bring to the boil and cook 10 minutes at a gentle bubble. Cool them 5 minutes in cold water and keep them in their shells in the fridge (3 days).'],
    steps: [
      { text: 'No cooking: only the bread is toasted and the eggs are boiled. In the morning cut 80 g of barra (a third of a barra) and split it lengthways.', heat: 'none' },
      { text: 'Toast it in the toaster or a dry pan until golden and crisp at the edges, about 2–3 minutes.', heat: 'medium', minutes: 3, check: true },
      { text: 'Cut a ripe tomato (60 g, ½ medium) in half and grate the cut side into the bowl; throw away the skin. Or rub the cut tomato straight onto the toast.', heat: 'none' },
      { text: 'Spread the tomato on the toast. Add a pinch of salt and 1 tsp olive oil (5 g).', heat: 'none' },
      { text: 'Open a Burgos tub (62.5 g) and slice it over the toast or eat it on the side. Peel 2 boiled eggs.', heat: 'none', pack: true },
      { text: 'Finish with an orange.', heat: 'none' },
    ],
    doneWhen: 'The toast is crisp at the edges and the tomato soaks in a little.',
    boxUp: 'Only the eggs are made ahead, in their shells. {{split}} The Burgos tubs stay sealed in the fridge until their date. Buy the barra every other day, or freeze it in 80 g pieces and toast from frozen.',
    reheat: 'Nothing is reheated: the toast is made fresh; eggs and cheese are eaten cold.',
    tips: ['Halal: a bakery barra of flour, water, salt and yeast. A supermarket barra may list E-472e without its origin.'],
  },
  keepsNote: 'Burgos tubs to the pack date; bread bought every other day',
  storagePlan: 'Only the eggs are made ahead. {{split}} The Burgos tubs stay sealed in the fridge until the date on the pack. Buy the barra every other day or freeze it in 80 g pieces and toast from frozen.',
  reheat: 'The toast is made in the morning (2–3 min in a toaster). Eggs and cheese are eaten cold.',
  crossCheck: null,
  changes: [
    'Cheese and two eggs added to the classic pa amb tomàquet so the plate reaches 25 g protein; no cured meats (the usual companions in bars are pork).',
    'An orange instead of juice: it brings the fibre to the breakfast target.',
  ],
  confidence: 'B',
  confidenceWhy: 'An assembly of weighed foods: BEDCA (barra), USDA SR Legacy (boiled egg, tomato, orange, olive oil) and a dated label (Burgos 0%). Only the toasting is "cooking" and it changes the bread weight a little (not counted: toast is weighed as bread).',
  halal: { status: 'halal', reason: 'Bakery bread of flour, water, salt and yeast; Burgos with microbial rennet (label 2026-10-14); eggs, tomato, olive oil and fruit. Mercadona\'s own barras list E-472e of unstated origin: buy at a forn or check.' },
};
