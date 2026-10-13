// Shared bits for Zainab's record specs.
// Halal is a field, not a tag (rules.js 1.1.0): build.mjs sets halal: { status: 'halal' } unless the
// spec gives one. All of Zainab's records are Pakistani dishes with halal meat or no meat.
export const PK = ['pakistani'];
export const PKV = ['pakistani', 'vegetarian'];
export const PKVG = ['pakistani', 'vegetarian', 'vegan'];
export const MEAL = ['lunch', 'dinner'];

// Densities (g/ml) for katori servings, NUTRITION.md §5.3 / RULES.densityGPerMl, or the food's own
// FNDDS portion weight where stated.
export const D = {
  curry: 1.0, // RULES 'daal' — FNDDS 2707427 Dal / 2706437 Chicken curry, 1 cup = 240 g
  daal: 1.0, // RULES 'daal'
  rice: 0.67, // RULES 'rice-cooked' — FNDDS 2708408, 1 cup = 158 g
  biryani: 0.83, // RULES 'biryani' — FNDDS 2706538, 1 cup = 196 g
  drySabzi: 0.7, // FNDDS 2709946 Okra, cooked, 1 cup = 165 g; 2709899 Cauliflower, cooked, 1 cup = 160 g (237 ml)
  chickpeas: 0.78, // FNDDS 2707415 Chickpeas, from dried, fat added, 1 cup = 185 g
  milk: 1.03, // RULES 'water-like'
  yogurt: 1.03, // RULES 'yogurt'
  pudding: 1.1, // FNDDS 2705685 Pudding, rice, 1 cup = 260 g
};

// Edible density for bone-in curries: the katori holds bones too, which are not eaten.
export const boneIn = (density, res) => +(density * (1 - (res?.boneShareServed || 0))).toFixed(3);

// WhatsApp-style spellings (NUTRITION.md §4.6) to splice into alias lists.
export const SP = {
  salan: ['salan', 'saalan', 'salaan', 'curry', 'shorba'],
  daal: ['daal', 'dal', 'dhal', 'dhaal', 'daal'],
  chawal: ['chawal', 'chaawal', 'chawl', 'rice'],
  roti: ['roti', 'rotti', 'rooti', 'chapati', 'chapatti', 'phulka'],
  chai: ['chai', 'chaye', 'chae', 'chay', 'cha', 'chaai', 'tea'],
  anda: ['anda', 'anday', 'ande', 'aanda', 'egg'],
  aloo: ['aloo', 'alu', 'aaloo', 'potato'],
  gosht: ['gosht', 'ghosht', 'meat'],
  murgh: ['murgh', 'murg', 'chicken', 'chikan'],
  karahi: ['karahi', 'karai', 'kadai', 'kadhai', 'karhai', 'kadahi', 'karahee'],
  qeema: ['qeema', 'keema', 'kheema', 'qima', 'mince'],
  paratha: ['paratha', 'parontha', 'prantha', 'parata', 'parotha'],
  biryani: ['biryani', 'biryaani', 'bryani', 'biriyani', 'biriani'],
};
export const uniq = (...lists) => [...new Set(lists.flat().map((s) => s.toLowerCase()))];
