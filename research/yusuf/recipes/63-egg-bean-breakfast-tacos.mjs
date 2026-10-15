// R-MP-63 · Egg and bean breakfast tacos on corn tortillas with salsa (breakfast portion). Batch: 2 portions.
export default {
  n: 63,
  slot: 'breakfast',
  serving: 'portion',
  boxes: 2,
  effort: 'cook',
  minutes: 15,
  cuisine: 'mexican',
  shortName: 'Egg and bean tacos',
  id: 'mx-egg-bean-breakfast-tacos-portion',
  name: 'Egg and bean breakfast tacos with salsa (breakfast portion)',
  names: {
    en: 'Egg and kidney-bean breakfast tacos on corn tortillas with salsa',
    es: 'Tacos de desayuno de huevo y alubias rojas en tortilla de maíz con salsa',
    ca: 'Tacos d\'esmorzar d\'ou i mongetes vermelles en truita de blat de moro amb salsa',
  },
  aliases: ['breakfast tacos', 'huevos rancheros', 'tacos de huevo', 'egg tacos', 'breakfast burrito', 'tacos de desayuno', 'mexican breakfast'],
  pitch: 'Scrambled eggs with cumin and kidney beans in warm corn tortillas, topped with pico de gallo. The filling reheats in a minute; warm the tortillas in a dry pan.',
  eat: 'hot',
  tags: ['international', 'meal-prep', 'contains-egg', 'vegetarian'],
  references: [
    { title: 'Weight Watchers, Chicken burrito bowl (beans, corn and tortilla)', url: 'https://www.weightwatchers.com/au/recipe/chicken-burrito-bowl/58d1a20996d1988e115d07bc', used: 'kidney beans seasoned and served with tortilla pieces', read: 'search-engine result summary, 2026-10-15' },
    { title: 'The Mediterranean Dish, Menemen', url: 'https://www.themediterraneandish.com/wprm_print/menemen-recipe-turkish-scrambled-eggs-with-tomatoes', used: 'soft-scrambled eggs into a cooked vegetable base (the same egg method)', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'filling', label: 'Eggs scrambled with beans and cumin', storage: 'egg-dish', yield: 'none', eat: 'hot',
      lines: [
        ['oil-sunflower', 6, ''],
        ['kidney-beans', 200, '½ jar, drained and rinsed'],
        ['egg', 200, '4 eggs', 'eggSet'],
        ['egg-white', 100, '', 'eggSet'],
        ['cumin', 1, ''],
        ['salt', 1, ''],
      ],
    },
    {
      id: 'salsa', label: 'Salsa pot', storage: 'cold-salad', pot: true, yield: 'none', eat: 'cold',
      lines: [['salsa-mexicana', 120, '60 g per portion']],
    },
    {
      id: 'tortillas', label: 'Corn tortillas (3 per portion, in their pack)', storage: 'proposed:bread', yield: 'none', eat: 'hot',
      lines: [['tortilla-corn', 156, '6 tortillas of 26 g']],
    },
  ],
  method: [
    'Warm the beans with the cumin in the oil, 2 min, mashing a few.',
    'Pour in the beaten eggs and whites with the salt; stir over low heat until just set. Box in 2.',
    'In the morning: microwave the filling 1 min (75 °C), warm 3 tortillas 20 s a side in a dry pan, fill and top with salsa.',
  ],
  keeps: '3 days in the fridge (egg dish); salsa opened 2 days',
  storagePlan: 'Make 2 at a time. The other half jar of beans goes into the burrito bowls or a salad within 2 days.',
  reheat: 'Filling: microwave until hot right through (75 °C). Salsa stays cold.',
  crossCheck: null,
  changes: [
    'Corn tortillas have no E471 (Javier, 2026-10-15), unlike the Mercadona wheat tortillas, but list glycerine E-422 of unstated origin (Ayesha\'s review, 2026-10-15): check. Halal swap: 1½ Mission pitas per portion (no E471, no E-422) instead of the 3 tortillas.',
    'Egg whites and beans bring 3 small tacos to 30 g protein.',
  ],
  confidence: 'B',
  confidenceWhy: 'Egg yield from Bognár\'s scrambled-egg row; Lab records for tortillas and salsa, USDA beans.',
  halal: { status: 'check', reason: 'Corn tortillas list glycerine (E-422) of unstated origin, which can be animal fat (Ayesha, 2026-10-15). Halal swap: fill a Mission pita (no E471 or E-422) instead. Eggs, beans and the salsa (wine vinegar only) are halal.' },
};
