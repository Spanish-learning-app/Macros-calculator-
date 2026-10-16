// R-MP-18 · Halal breakfast wrap: spiced chicken, egg and peppers in a large wholemeal roti (breakfast
// portion). Standard batch: 4 wraps.
import { rotiComponent, ROTI_REFS, ROTI_METHOD } from '../shared.mjs';

export default {
  n: 18,
  effort: 'cook',
  minutes: 45,
  slot: 'breakfast',
  serving: 'portion',
  boxes: 4,
  cuisine: 'desi',
  shortName: 'Chicken egg roti wrap',
  id: 'pk-chicken-egg-roti-wrap-portion',
  name: 'Halal breakfast wrap: spiced chicken, egg and peppers in a wholemeal roti (breakfast portion)',
  names: {
    en: 'Halal breakfast wrap: spiced chicken, egg and peppers in a wholemeal roti',
    es: 'Wrap de desayuno halal: pollo especiado, huevo y pimiento en roti integral',
    ca: 'Wrap d\'esmorzar halal: pollastre especiat, ou i pebrot en roti integral',
    ur: 'چکن انڈا روٹی رول',
    roman: 'chicken anda roti roll',
  },
  aliases: ['breakfast wrap', 'breakfast burrito', 'chicken egg wrap', 'halal breakfast burrito', 'wrap de pollo y huevo', 'chicken roll', 'roti wrap'],
  pitch: 'A freezer breakfast burrito made the desi way: a big roti instead of a shop wrap.',
  eat: 'hot',
  tags: ['pakistani', 'meal-prep', 'contains-egg'],
  references: [
    { title: 'The Toasty Kitchen, High-protein freezer breakfast burritos', url: 'https://thetoastykitchen.com/high-protein-freezer-breakfast-burritos/', used: '16 oz ground chicken (+16 oz sausage, left out), 6 large eggs, onion, bell pepper, olive oil, 12 × 8-inch tortillas; cool the eggs before wrapping', read: 'search-engine page extract, 2026-10-14' },
    { title: "Our Best Bites, Freezer breakfast burritos", url: 'https://ourbestbites.com/freezer-breakfast-burritos/', used: '12 eggs, 1 lb lean turkey sausage, 12 whole-wheat tortillas; ⅓ cup egg and ¼ cup meat mixture per burrito', read: 'search-engine page extract, 2026-10-14' },
    ...ROTI_REFS,
  ],
  components: [
    rotiComponent(4, { label: 'Large wholemeal roti (4, about 25 cm)', size: 60 }),
    {
      id: 'chicken', label: 'Spiced chicken with peppers and onion', storage: 'cooked-meat', yield: 'breastPanFried', eat: 'hot',
      lines: [
        ['chicken-breast', 280, 'thin strips'],
        ['pepper-red', 120, 'strips', 'pepperStew'],
        ['onion-red', 80, 'sliced', 'onionSoft'],
        ['garlic', 6, 'grated (2 cloves)'],
        ['ginger', 6, 'grated'],
        ['cumin', 2, 'ground'],
        ['paprika', 3, ''],
        ['chilli-powder', 2, ''],
        ['salt', 3, ''],
        ['lemon-juice', 10, ''],
        ['oil-sunflower', 12, ''],
      ],
    },
    {
      id: 'egg', label: 'Soft scrambled egg', storage: 'egg-muffin', yield: 'eggSet', eat: 'hot',
      lines: [
        ['egg', 200, '4 large eggs (1 per wrap)'],
        ['egg-white', 120, 'liquid egg whites'],
        ['salt', 1, ''],
      ],
    },
  ],
  method: [
    ROTI_METHOD.replace('about 50 g dough each', 'about 75 g dough each, rolled to 25 cm'),
    'Chicken: fry the strips in the oil on high heat 4–5 min until cooked through (75 °C); add pepper, onion, garlic, ginger, spices and salt for 3 min more; finish with lemon.',
    'Egg: in the same pan, softly scramble the eggs and whites with salt, 2 min (no extra oil). Cool the chicken and egg on a tray (wrapping hot egg makes the wrap soggy).',
    'Fill each roti with a quarter of the chicken and egg, fold in the sides and roll tightly. Wrap in baking paper, then foil; freeze.',
  ],
  keeps: '3 days fridge; 2 months frozen',
  storagePlan: 'One wrap in the fridge, three in the freezer; move one down the night before. The egg follows the egg-muffin class (3 days, 2 months), the chicken cooked-meat (3 days, 3 months), the roti 2 days / 2 months: the wrap keeps 2 months frozen and 2 days in the fridge.',
  reheat: 'From the fridge: dry pan 2 min a side, or microwave 60–75 s. From frozen: microwave (out of the foil, in a damp paper towel) 2 min, turning once, until hot right through (75 °C).',
  crossCheck: null,
  changes: [
    'All Mercadona wheat wraps list E471 without "de origen vegetal" (label check 2026-10-13), so the wrap is a home-made large wholemeal roti.',
    'Sausage and cheese from the references are left out; chicken breast and egg white carry the protein (about 30 g).',
  ],
  confidence: 'C',
  confidenceWhy: "Chicken yield from Bognár's pan-fried chicken escallop (applied to strips), egg from the scrambled-egg factor, roti from Zainab's moisture-based roti.",
  halal: { status: 'halal', reason: 'Chicken from a halal butcher; eggs, wholemeal flour and vegetables only (labels checked 2026-10-13).' },
};
