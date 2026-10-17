// R-MP-18 · Halal breakfast wrap: spiced chicken, egg and peppers in a large wholemeal roti (breakfast
// portion). Standard batch: 4 wraps.
import { rotiComponent, rotiSteps, ROTI_REFS } from '../shared.mjs';

// R3-B: dough first, curry in the fridge on a timer, one action per roti step, roti cooled before bagging.
const R = rotiSteps({ count: 4, atta: 176, water: 123, cups: 'about 1½ cups', waterCups: 'about ½ cup', ballG: 75, size: 'as big as your pan (about 25 cm across, 2 mm thick)', pan: 'your biggest frying pan or tawa' });

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
  method: {
    equipment: ['Big mixing bowl', 'Rolling pin (belan) and a clean worktop', 'Your biggest dry non-stick frying pan (28 cm) or a large tawa', 'Clean tea towel', 'Grater', 'Bowl and fork for the eggs', 'Tray for cooling', 'Baking paper, foil and a freezer bag'],
    prep: [
      'Cut the chicken breast (280 g) into thin strips (1 cm).',
      'Cut {{n:pepper-red}} into strips. Slice {{n:onion-red}} thin.',
      'Peel and grate 2 garlic cloves (6 g) and a 2 cm piece of ginger (6 g) into a paste.',
    ],
    steps: [
      ...R.dough,
      { text: 'Chicken: in the frying pan, add a little under 1 tbsp oil (12 g) and heat 1 minute.', heat: 'high', minutes: 1 },
      { text: 'Add the chicken strips and stir-fry until white all through.', heat: 'high', minutes: 5 },
      { text: 'Add the pepper, onion, ginger-garlic paste and the powders: 1 tsp ground cumin (2 g), 1¼ tsp paprika (3 g), ¾ tsp red chilli powder (2 g) and ½ tsp salt (3 g). Stir-fry 3 minutes until the pepper softens. Turn off the heat and squeeze in 2 tsp lemon juice (10 g).', heat: 'medium-high', minutes: 3 },
            { text: 'Egg: whisk 4 eggs with 120 g liquid egg whites and a pinch of salt (1 g). Pour into the same pan (no extra oil) and stir slowly with the spatula until just set: soft, but no runny egg.', heat: 'medium', minutes: 2 },
      { text: 'Check: cut the thickest chicken strip. White all through, no pink. The egg is set, with no runny parts. Pink? 2 more minutes in the pan.', heat: 'none', check: true },
      { text: 'Spread the egg on the tray next to the chicken and let both cool while you make the roti (hot filling makes the wrap soggy).', heat: 'none' },
      ...R.cook,
      { text: 'Lay a roti flat. Put ¼ of the chicken and ¼ of the egg in a line across the lower third. Fold the sides in, then roll it up tightly from the bottom. Wrap in baking paper, then foil. Make all 4.', heat: 'none', minutes: 5, pack: true },
    ],
    doneWhen: 'Chicken: cut the thickest strip, white all through, no pink. Egg: set, with no runny parts. Roti: light brown spots on both sides, no pale or doughy patches, soft when folded.',
    boxUp: 'Cool and put away within 1 hour. {{split}}',
    reheat: 'From the fridge: dry pan 2 minutes a side, or microwave 60–75 seconds. From frozen: take off the foil (never microwave foil), wrap in a damp paper towel and microwave 2 minutes, turning once, until hot all through.',
    tips: [
      'Halal: chicken from the halal butcher. The big home roti replaces shop wraps, which list E471 without saying it is from plants.',
      'A 25 cm roti is hard to roll at first. If it tears, make 2 smaller roti per wrap from the same dough instead.',
      'Too spicy? Use ¼ tsp chilli powder.',
      'Ginger-garlic paste: peel the garlic and ginger and grate both on the smallest holes of a grater, or blend them with 1 tsp water. A jar of ready paste from the Pakistani grocery is fine (use the same grams).',
      'Atta is wholemeal chapati flour ("chakki atta"), sold in 5 kg bags at the Pakistani grocery. Mercadona\'s harina integral de trigo also works; the roti come out a little firmer.',
    ],
  },
  storagePlan: '{{split}} The egg follows the egg-muffin class (3 days, 2 months), the chicken cooked-meat (3 days, 3 months), the roti 2 days / 2 months: the wrap keeps 2 months frozen and 2 days in the fridge.',
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
