// R-MP-14 · Desi egg muffins (3) with a wholemeal roti (breakfast portion). Standard batch: 12 muffins +
// 4 roti = 4 portions.
import { rotiComponent, rotiSteps, ROTI_REFS } from '../shared.mjs';

// R3-B: dough first, curry in the fridge on a timer, one action per roti step, roti cooled before bagging.
const R = rotiSteps({ count: 4, atta: 117, water: 82, cups: 'about 1 cup', waterCups: 'about ⅓ cup' });

export default {
  n: 14,
  effort: 'cook',
  minutes: 35,
  slot: 'breakfast',
  serving: 'portion',
  boxes: 4,
  cuisine: 'international',
  shortName: 'Egg muffins and roti',
  id: 'intl-egg-muffins-roti-portion',
  name: 'Desi egg muffins with spinach, peppers and peas, with a roti (breakfast portion)',
  names: {
    en: 'Desi egg muffins (3) with spinach, peppers and peas, and a wholemeal roti',
    es: 'Muffins de huevo con espinacas, pimiento y guisantes, con un roti integral',
    ca: "Muffins d'ou amb espinacs, pebrot i pèsols, amb un roti integral",
  },
  aliases: ['egg muffins', 'egg bites', 'egg cups', 'muffins de huevo', 'anda muffin', 'egg muffin meal prep', 'magdalenas de huevo'],
  pitch: 'Masala egg muffins from the freezer, 1 min in the microwave, with a warm roti.',
  eat: 'hot',
  tags: ['international', 'meal-prep', 'contains-egg', 'vegetarian'],
  references: [
    { title: 'American Diabetes Association Food Hub, Easy egg muffins', url: 'https://prod-foodhub.diabetes.org/recipes/easy-egg-muffins', used: '6 whole eggs + 4 egg whites, 1 cup thawed spinach, ¼ cup Greek yogurt, 12 muffins, 350 °F 20–25 min', read: 'page read 2026-10-14' },
    { title: 'Boston Medical Center, Egg muffins', url: 'https://www.bmc.org/recipes/egg-muffins', used: '6 large eggs, ¾ cup chopped vegetables (pepper, onion, tomato), herbs, ¼ tsp salt; 8 muffins; 350 °F 15–20 min', read: 'page read 2026-10-14' },
    ...ROTI_REFS,
  ],
  components: [
    {
      id: 'muffins', label: 'Egg muffins (12)', storage: 'egg-muffin', yield: 'eggSet', eat: 'hot',
      lines: [
        ['egg', 400, '8 large eggs'],
        ['egg-white', 400, 'liquid egg whites (about 390 ml)'],
        ['spinach', 120, 'baby spinach, chopped'],
        ['pepper-red', 160, 'diced small'],
        ['peas', 120, 'frozen, straight in'],
        ['onion-red', 80, 'finely chopped'],
        ['green-chilli', 10, 'finely chopped (2)'],
        ['coriander', 8, 'chopped'],
        ['cumin', 2, 'ground'],
        ['chilli-powder', 2, ''],
        ['turmeric', 1, ''],
        ['black-pepper', 1, ''],
        ['salt', 4, ''],
        ['oil-sunflower', 8, 'to brush the 12-hole tin'],
      ],
    },
    rotiComponent(4),
  ],
  method: {
    equipment: ['12-hole muffin tin (or 12 silicone muffin moulds)', 'Pastry brush or kitchen paper', 'Jug or bowl and a whisk or fork', 'Wire rack', 'Big mixing bowl', 'Rolling pin (belan) and a clean worktop for rolling', 'Tawa or a dry non-stick frying pan (26–28 cm)', 'Clean tea towel', 'Baking paper', 'Freezer bags and 1–2 boxes for the fridge'],
    prep: [
      'Chop the baby spinach (120 g). Dice {{n:pepper-red}} small (5 mm). Chop the red onion fine (80 g, ½ medium), 2 green chillies (10 g) and a small handful of coriander (8 g).',
      'Take the frozen peas (120 g, about 1 cup) out of the bag; they go in frozen.',
    ],
    steps: [
      ...R.dough,
      { text: 'Heat the oven to 180 °C. Brush the 12 holes of the tin with 2 tsp oil (8 g), right up the sides.', heat: 'oven-180', minutes: 10 },
      { text: 'Divide the spinach, pepper, peas, onion, chilli and coriander between the 12 holes.', heat: 'none' },
      { text: 'In the jug whisk 8 eggs, 390 ml liquid egg whites (400 g), 1 tsp ground cumin (2 g), ¾ tsp red chilli powder (2 g), a heaped ¼ tsp haldi (turmeric powder, 1 g), ½ tsp black pepper (1 g) and a heaped ½ tsp salt (4 g) until no streaks of white are left.', heat: 'none', minutes: 2 },
      { text: 'Pour the egg over the vegetables until each hole is about ¾ full (they rise).', heat: 'none' },
      { text: 'Bake until puffed and set in the middle.', heat: 'oven-180', minutes: 22 },
      { text: 'Check: push a knife into the middle of one muffin. It comes out clean, with no runny egg, and the tops are puffed and firm. Wet? 3–4 minutes more.', heat: 'none', check: true },
      { text: 'Leave them 10 minutes in the tin, run a knife around each one and lift them onto the rack to cool while you make the roti.', heat: 'none', minutes: 10, wait: true },
      ...R.cook,
      { text: 'Pack 4 portions: 3 cooled muffins and 1 roti each, baking paper between the roti.', heat: 'none', pack: true },
    ],
    doneWhen: 'Muffins: puffed and firm on top; a knife pushed into the middle comes out clean, with no runny egg. Roti: light brown spots on both sides, no pale or doughy patches, soft when folded.',
    boxUp: 'Cool and put away within 1 hour. Each portion is 3 muffins and 1 roti. {{split}} To freeze, lay the muffins flat on a tray for 1 hour first, then bag them with their roti.',
    reheat: 'Muffins from the fridge: microwave 30–40 seconds; from frozen: 60–90 seconds, turning once, until hot all through. Roti: 20–30 seconds a side on a hot dry pan (from frozen, 30–40 seconds a side), or 15 seconds in the microwave under a damp paper towel.',
    tips: [
      'Liquid egg whites are "claras de huevo pasteurizadas" in a carton at Mercadona, in the egg aisle.',
      'Muffins sticking to the tin? Use silicone moulds or paper cases next time rather than more oil.',
      'They sink a little as they cool. That is normal.',
      'Too spicy? Leave out the green chillies.',
      'Short on time? Buy fresh or frozen wholemeal roti (chapati) at the Pakistani grocery near the halal butcher and warm each on a dry pan 30 seconds a side. Shop roti are often bigger and some have oil in them, so the numbers in the app change a little.',
      'Atta is wholemeal chapati flour ("chakki atta"), sold in 5 kg bags at the Pakistani grocery. Mercadona\'s harina integral de trigo also works; the roti come out a little firmer.',
    ],
  },
  storagePlan: '{{split}} Egg muffins keep 3 days in the fridge and 2 months frozen (USDA FSIS, egg casseroles); roti 2 days in the fridge, 2 months frozen.',
  reheat: 'Muffins from the fridge: microwave 30–40 s; from frozen: 60–90 s, turning once, until hot right through. Roti: 20–30 s a side on a hot tawa or dry pan, or 15 s in the microwave under a damp paper towel.',
  crossCheck: null,
  extraChecks: [{ zainab: 'roti-home', comps: ['roti'], note: "Same dough and yield as Zainab's home roti, so the roti part should match." }],
  changes: [
    'Half the whole eggs of a 12-muffin batch are swapped for liquid egg whites (as the ADA recipe does with 4 whites): 3 muffins then give about 27 g protein without going over 300 kcal.',
    'The references use cheese; it is left out (protein comes from egg white instead, and it avoids the animal-rennet question). Peas and a wholemeal roti lift fibre to the breakfast target of 5 g.',
  ],
  confidence: 'C',
  confidenceWhy: 'The muffin yield uses Bognár\'s scrambled-egg factor for a baked egg mixture (no published yield for egg muffins).',
  halal: { status: 'halal', reason: 'Eggs, vegetables and wholemeal flour only; egg-white label checked, 2026-10-13.' },
};
