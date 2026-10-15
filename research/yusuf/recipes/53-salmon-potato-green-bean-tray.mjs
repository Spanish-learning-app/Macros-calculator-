// R-MP-53 · Baked salmon with potatoes, green beans and a lemon yogurt pot (dinner portion). Batch: 2 portions.
export default {
  n: 53,
  slot: 'dinner',
  serving: 'portion',
  boxes: 2,
  effort: 'cook',
  minutes: 15,
  cuisine: 'mediterranean',
  shortName: 'Salmon tray bake',
  id: 'med-salmon-patatas-judias-portion',
  name: 'Baked salmon with potatoes and green beans (dinner portion)',
  names: {
    en: 'Baked salmon with potatoes, green beans and a lemon yogurt sauce',
    es: 'Salmón al horno con patatas, judías verdes y salsa de yogur al limón',
    ca: 'Salmó al forn amb patates, mongetes verdes i salsa de iogurt amb llimona',
  },
  aliases: ['salmon', 'baked salmon', 'salmon al horno', 'salmon con patatas', 'sheet pan salmon', 'salmo al forn', 'salmon tray bake', 'salmon dinner'],
  pitch: 'Lemony salmon medallions roasted on the same tray as paprika potatoes and green beans, with a cool lemon-yogurt sauce. Fifteen minutes of work.',
  eat: 'hot',
  tags: ['mediterranean', 'meal-prep', 'seafood-fish'],
  references: [
    { title: 'The Dizzy Cook, Sheet pan salmon and green beans with potatoes', url: 'https://thedizzycook.com/sheet-pan-salmon-and-green-beans-with-potatoes/', used: 'potatoes roasted first, then green beans and salmon on the same tray; 30-minute meal', read: 'search-engine result summary, 2026-10-15' },
    { title: 'Family Food on the Table, Sheet pan salmon and potatoes with green beans', url: 'https://www.familyfoodonthetable.com/wprm_print/sheet-pan-salmon-and-potatoes-with-green-beans', used: 'potatoes first, then beans and red onion, salmon last with lemon; about 200 °C', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'salmon', label: 'Baked salmon', storage: 'cooked-meat', yield: 'salmonBaked', eat: 'hot',
      lines: [
        ['salmon-fillet', 250, '4 frozen medallions, thawed (2 per portion)'],
        ['lemon-juice', 10, ''],
        ['oil-olive', 4, ''],
        ['salt', 1, ''],
      ],
    },
    {
      id: 'veg', label: 'Roast potatoes, green beans and onion', storage: 'cooked-curry', yield: 'none', eat: 'hot',
      lines: [
        ['potato', 400, 'in wedges', 'potatoPanFried'],
        ['green-beans', 300, 'frozen', 'greenBeansBoiled'],
        ['onion-red', 80, 'wedges', 'onionSoft'],
        ['oil-olive', 14, ''],
        ['garlic', 6, ''],
        ['paprika', 2, ''],
        ['salt', 2, ''],
      ],
    },
    {
      id: 'sauce', label: 'Lemon-yogurt pot', storage: 'cold-salad', pot: true, yield: 'none', eat: 'cold',
      lines: [
        ['yogurt-greek-light', 120, ''],
        ['lemon-juice', 6, ''],
        ['garlic', 2, 'grated'],
        ['parsley', 4, 'chopped'],
      ],
    },
  ],
  method: [
    'Oven at 210 °C. Toss the potatoes with half the oil, paprika and salt; roast 15 min.',
    'Add the green beans, onion, garlic and the rest of the oil; lay the salmon on top with lemon, oil and salt. Roast 12–15 min (salmon flakes, 63 °C inside).',
    'Stir the yogurt sauce. Cool and box 2 portions with a sauce pot each.',
  ],
  keeps: '3 days in the fridge; eat the salmon within 3 days, do not refreeze',
  storagePlan: 'Make on the day you need it plus one: portion 1 that night, portion 2 the next evening. The medallions thaw overnight in the fridge.',
  reheat: 'Microwave covered, 1½–2 min, until hot right through (75 °C); the yogurt pot stays cold.',
  crossCheck: null,
  changes: [
    'Frozen Hacendado salmon medallions (15.80 €/kg on 2026-10-15) instead of loins (23.80 €/kg): the same fish, cheaper.',
    'A yogurt sauce instead of the garlic butter or mayonnaise sauces of the references.',
  ],
  confidence: 'B',
  confidenceWhy: 'Salmon label (OFF, Hacendado medallions) with a USDA raw/baked water balance; Bognár potatoes and green beans.',
  halal: { status: 'halal', reason: 'Salmon (fish and salt); yogurt of milk and cultures.' },
};
