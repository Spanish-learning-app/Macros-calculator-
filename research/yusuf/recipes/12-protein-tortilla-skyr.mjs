// R-MP-12 · Protein tortilla de patatas (eggs + egg whites) with a high-protein yogurt pot. 4 boxes. Raw edible grams.
export default {
  n: 12,
  effort: 'cook',
  minutes: 40,
  id: 'es-tortilla-proteica-skyr-box',
  name: 'Protein tortilla wedge with skyr-style yogurt (cold lunch box)',
  names: {
    en: 'Protein potato tortilla wedge with high-protein yogurt, banana and walnuts',
    es: 'Tortilla de patatas proteica (con claras) con yogur alto en proteínas, plátano y nueces',
    ca: 'Truita de patates proteica (amb clares) amb iogurt ric en proteïnes, plàtan i nous',
    roman: 'aloo anda tortilla',
  },
  aliases: ['tortilla de patatas', 'tortilla espanola', 'tortilla española', 'spanish omelette', 'spanish tortilla', 'truita de patates', 'protein tortilla', 'tortilla con claras', 'skyr box', 'tortilla skyr', 'aloo omelette', 'anday aloo omelette'],
  pitch: 'A thick wedge of light tortilla de patatas made with whole eggs and egg whites, a skyr-style protein yogurt with walnuts, and a banana.',
  eat: 'cold',
  tags: ['spanish', 'meal-prep', 'eat-cold', 'contains-egg', 'vegetarian'],
  references: [
    { title: 'Spain.info (Turespaña), Tortilla de patata', url: 'https://www.spain.info/es/receta/tortilla-patata/', used: '4 medium potatoes, 4–5 eggs, 1 medium onion, ¼ l olive oil (for frying, mostly drained), salt; serves 4', read: 'search-engine page extract' },
    { title: 'EcuRed, Tortilla de patatas', url: 'https://www.ecured.cu/Tortilla', used: '500 g potatoes, 5 eggs, 1 medium onion, olive oil, salt', read: 'search-engine page extract' },
    { title: 'Vitónica, Tortilla de patatas fitness', url: 'https://www.vitonica.com/recetas-saludables/tortilla-de-patatas-fitness-receta-saludable', used: '4 medium potatoes, 1 onion, 6 egg whites, 10 ml extra virgin olive oil; potatoes cooked in the microwave; serves 4', read: 'search-engine page extract' },
  ],
  components: [
    {
      id: 'tortilla', label: 'Protein tortilla (¼ per box)', storage: 'egg-dish', yield: 'none', eat: 'cold',
      lines: [
        ['potato', 700, 'peeled, thin slices', 'potatoPanFried'],
        ['onion', 150, 'thinly sliced', 'onionSoft'],
        ['oil-olive', 30, 'about 2 tbsp: potatoes are steamed-then-sautéed, not deep-fried'],
        ['salt', 6, ''],
        ['egg', 300, '6 eggs', 'eggSet'],
        ['egg-white', 400, 'liquid pasteurised whites (about 400 ml)', 'eggSet'],
      ],
    },
    {
      id: 'yogurt', label: 'High-protein yogurt pot with walnuts', pot: 'yogurt', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['protein-yogurt', 600, 'Mercadona +Proteínas natural (150 g per pot)'],
        ['walnuts', 40, '10 g per pot, added in the morning'],
      ],
    },
    {
      id: 'fruit', label: 'Banana (1 per box)', storage: 'proposed:whole-fruit', yield: 'none', eat: 'cold',
      lines: [['banana', 404, '4 Plátanos de Canarias (101 g peeled each, USDA small)']],
    },
  ],
  method: [
    'Microwave or steam the potato slices until just tender (8–10 min), then sauté them with the onion in the oil in a 24–26 cm non-stick pan, 10 min, until soft and lightly golden. Season.',
    'Beat the eggs and whites with salt; stir in the potatoes and onion and rest 5 min.',
    'Cook in the oiled pan on low-medium heat 6–8 min, flip with a plate, cook 4–5 min more until set right through (no runny centre in a batch tortilla).',
    'Cool on a rack, cut into 4 wedges and wrap each wedge.',
    'Portion the yogurt into 4 pots; add the walnuts in the morning so they stay crunchy.',
  ],
  keeps: 'Tortilla 3 days, no freezing',
  storagePlan: 'Tortilla keeps 3 days in the fridge and should not be frozen, so this batch does not stretch to Thursday from a Sunday cook: cook it Sunday for Mon–Wed and eat the 4th wedge as a dinner or merienda, or cook it on a weekday evening for the next 3 lunches. Yogurt pots: 2 days once portioned (keep the tub closed until then). Banana and walnuts at room temperature.',
  reheat: 'Eaten cold (insulated bag and ice pack; within 2 h of leaving the fridge). Do not microwave the tortilla in the box: eggs are on the no-reheat list for boxes.',
  crossCheck: { fdc: 2707278, comps: ['tortilla'], note: 'FNDDS "Egg omelet or scrambled egg, with potatoes and/or onions, no added fat" for the tortilla part.' },
  extraChecks: [{ cofid: '12-957', comps: ['tortilla'], note: 'CoFID "Omelette, Spanish, homemade": made with whole eggs only, so less protein is expected.' }],
  changes: [
    'Ayesha\'s table has ¼ tortilla + 150 g skyr; that alone came to about 440 kcal and 5 g fibre, so each box also gets a banana and 10 g walnuts.',
    'Mercadona Barcelona lists no product called "skyr" today (2026-10-13). Its "+Proteínas natural" pots are the same idea (strained skimmed milk, 10 g protein per 100 g, no gelatine), so the recipe uses those; any plain skyr with a similar label works.',
  ],
  confidence: 'C',
  confidenceWhy: 'Potato and egg yields borrow Bognár\'s pan-fried potato and scrambled-egg rows; tortilla oil and set vary a lot between cooks.',
  halal: { status: 'halal', reason: 'Eggs, dairy and plants only; egg-white and yogurt labels checked (no gelatine), 2026-10-13.' },
};
