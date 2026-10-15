// R-MP-44 · Chicken caesar salad with a yogurt-Dijon dressing, egg and picos croutons (lunch box). Batch: 2 boxes.
export default {
  n: 44,
  serving: 'box',
  boxes: 2,
  effort: 'cook',
  minutes: 20,
  cuisine: 'international',
  shortName: 'Chicken caesar salad',
  id: 'intl-chicken-caesar-salad-box',
  name: 'Chicken caesar salad with yogurt dressing, egg and picos (lunch box)',
  names: {
    en: 'Chicken caesar salad with a yogurt-Dijon dressing, egg and picos croutons',
    es: 'Ensalada césar de pollo con aliño de yogur y mostaza, huevo y picos',
    ca: 'Amanida cèsar de pollastre amb amaniment de iogurt i mostassa, ou i picos',
  },
  aliases: ['caesar salad', 'chicken caesar', 'ensalada cesar', 'ensalada cesar con pollo', 'amanida cesar', 'cesar salad', 'caesar box'],
  pitch: 'Crisp romaine, seared chicken, a boiled egg and crunchy wholemeal picos, with a creamy yogurt-Dijon dressing in its own pot: no anchovy, no Parmesan.',
  eat: 'cold',
  tags: ['international', 'meal-prep', 'eat-cold', 'contains-egg'],
  references: [
    { title: 'Dinners, Dishes and Desserts, Chicken caesar salad', url: 'https://dinnersdishesanddesserts.com/chicken-caesar-salad/', used: '½ cup Greek yogurt dressing with lemon, olive oil and Dijon; 8 cups romaine, 4 cups grilled chicken and croutons for 4', read: 'search-engine result summary, 2026-10-15' },
    { title: 'Haute and Healthy Living, Healthy chicken caesar salad', url: 'https://www.hauteandhealthyliving.com/healthy-chicken-caesar-salad/', used: 'yogurt instead of mayonnaise in the dressing', read: 'search-engine result summary, 2026-10-15' },
  ],
  components: [
    {
      id: 'chicken', label: 'Seared chicken', storage: 'cooked-meat', yield: 'breastPanFried', eat: 'cold',
      lines: [
        ['chicken-breast', 260, ''],
        ['oil-olive', 6, ''],
        ['garlic', 3, '', 'onionSoft'],
        ['salt', 2, ''],
        ['black-pepper', 1, ''],
      ],
    },
    {
      id: 'salad', label: 'Romaine and cherry tomatoes', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['lettuce', 400, '2 romaine hearts, cut'],
        ['tomato-cherry', 200, 'halved'],
      ],
    },
    {
      id: 'egg', label: 'Hard-boiled egg (1 per box)', storage: 'egg-dish', yield: 'none', eat: 'cold',
      lines: [['egg-boiled', 100, '2 eggs']],
    },
    {
      id: 'dressing', label: 'Yogurt-Dijon dressing pot', storage: 'cold-salad', pot: true, yield: 'none', eat: 'cold',
      lines: [
        ['yogurt-greek-light', 120, ''],
        ['mustard-dijon', 10, ''],
        ['lemon-juice', 16, ''],
        ['oil-olive', 18, ''],
        ['garlic', 2, 'grated'],
        ['black-pepper', 1, ''],
        ['salt', 1, ''],
      ],
    },
    {
      id: 'picos', label: 'Wholemeal picos (croutons)', storage: 'proposed:sealed-pack', yield: 'none', eat: 'cold',
      lines: [['picos', 80, '40 g per box, in a bag; break over at lunch']],
    },
  ],
  method: [
    'Season and sear the chicken 3–4 min a side (75 °C inside). Cool and slice.',
    'Wash, dry and cut the romaine; halve the tomatoes. Box with the chicken and a halved egg.',
    'Whisk the dressing; pour into 2 small pots.',
    'At lunch: dress, toss, break the picos over.',
  ],
  keeps: '2 days in the fridge; do not freeze',
  storagePlan: 'Make 2 boxes at a time (Sunday night and Tuesday night). Dry leaves well: a salad spinner or a clean towel keeps them crisp for 2 days.',
  reheat: 'Not reheated. Eat within 2 h of leaving the fridge (1 h above 32 °C).',
  crossCheck: null,
  changes: [
    'No Parmesan (animal rennet in Grana Padano and most Parmesan) and no anchovy or Worcestershire: Dijon and lemon give the bite. Shop caesar dressing is check (cheese powder, Javier 2026-10-15).',
    'Wholemeal picos instead of white croutons: no oven, and 4 g fibre per box.',
  ],
  confidence: 'B',
  confidenceWhy: 'Chicken from Bognár\'s pan-fried breast row; labels for yogurt and picos; USDA mustard and vegetables.',
  halal: { status: 'halal', reason: 'Chicken from a halal butcher; dressing of yogurt, Dijon (vinagre de alcohol, no wine, read 2026-10-15), lemon and olive oil; picos without lard.' },
};
