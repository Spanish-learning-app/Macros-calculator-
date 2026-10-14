#!/usr/bin/env node
// Builds Javier's four data files from cited lookups:
//   app/data/foods-basics.js, app/data/foods-intl.js, app/data/foods-es-med.js, app/data/foods-pk-packaged.js
//   node research/javier/build.mjs && node research/check-foods.mjs app/data/foods-basics.js …
// Nutrient numbers are never typed here for table foods: they are read from the USDA / BEDCA / CoFID caches
// through research/javier/lib.mjs. Label values (Open Food Facts, read 2026-10-13) are typed as printed on
// the label and cited with the barcode. Composite dishes come from research/javier/recipes.mjs.
// Owner: Javier Morales (Nutrition Lab).

import fs from 'node:fs';
import path from 'node:path';
import { usda, bedca, cofid, toPer100g, r1, ROOT } from './lib.mjs';
import { computeAll } from './recipes.mjs';
import { stampReview } from '../review/reviewed.mjs';

const DATE = '2026-10-13';
const REV = 'javier';
const RECIPE = new Map(computeAll().map(({ rec, res }) => [rec.id, { rec, res }]));

// ---------------------------------------------------------------- source helpers
function src(citation, method, confidence, notes) {
  const s = { citation, method, confidence, reviewer: REV, date: DATE };
  if (notes) s.notes = notes;
  return s;
}
function carbNote(u) {
  return u.fiber > 0
    ? `USDA carbs by difference ${u.carbsDiff} − fibre ${u.fiber} = ${r1(u.carbs)} g available.`
    : `USDA carbs by difference ${u.carbsDiff} g (no fibre), used as available carbs.`;
}
/** Direct USDA record: per100g + source. */
function fromUsda(id, confidence = 'A', extraNotes = '', { zeroFiber = false } = {}) {
  const u = usda(id);
  const p = toPer100g(u);
  if (zeroFiber) p.fiber = 0;
  const notes = [carbNote(u), zeroFiber && !u.fiberReported ? 'Fibre not reported by USDA; 0 for this animal food.' : '', extraNotes].filter(Boolean).join(' ');
  return { per100g: p, source: src(u.src, 'direct', confidence, notes) };
}
function fromBedca(id, confidence = 'A', extraNotes = '') {
  const b = bedca(id);
  const p = toPer100g(b);
  const notes = [`BEDCA energy ${(b.kcal * 4.184).toFixed(1)} kJ ÷ 4.184; BEDCA carbohydrate is available carbohydrate. Data: BEDCA (AESAN), www.bedca.net.`, extraNotes].filter(Boolean).join(' ');
  return { per100g: p, source: src(`${b.src}`, 'direct', confidence, notes) };
}
function fromCofid(code, confidence = 'B', extraNotes = '') {
  const c = cofid(code);
  const p = toPer100g(c);
  const notes = [`CoFID carbohydrate is available carbohydrate; fibre = ${c.fiberKind} fibre.`, extraNotes].filter(Boolean).join(' ');
  return { per100g: p, source: src(`${c.src} ${c.description}`, 'direct', confidence, notes) };
}
function fromRecipe(id) {
  const { rec, res } = RECIPE.get(id);
  return {
    per100g: res.per100g,
    addedFatPer100g: res.addedFatPer100g,
    source: src(`Recipe R-${id} (research/recipes/${id}.md)`, 'recipe', rec.confidence, `Standard recipe from ${rec.references.length} references; cooked weight ${r1(res.cookedG)} g for ${rec.makes}; ${rec.confidenceWhy}`),
    res,
  };
}
/** Pakistani labels print total carbohydrate (Rio's label sums to 100.7 g with fibre counted separately), so
 *  available carbs = label carbs − label fibre; kcal kept as printed. */
function pkLabel(v) {
  return { ...v, carbs: r1(v.carbs - v.fiber) };
}
const PK_CARB_NOTE = 'Label carbohydrate treated as total carbohydrate (the Peek Freans Rio label only sums to 100 g that way), so available carbs = label carbs − label fibre; kcal as printed.';
/** Label values per 100 ml converted to per 100 g with a density (g/ml). */
function perMlToPerG(v, density) {
  const out = {};
  for (const [k, x] of Object.entries(v)) out[k] = k === 'kcal' ? Math.round(x / density) : r1(x / density);
  return out;
}

// ---------------------------------------------------------------- serving helpers
const KATORI = [
  ['katori-small', '1 small katori (155 ml)', 155, 'چھوٹی کٹوری'],
  ['katori', '1 katori (medium, 200 ml)', 200, 'کٹوری'],
  ['katori-large', '1 large katori (360 ml)', 360, 'بڑی کٹوری'],
  ['tbsp', '1 tablespoon (chamach)', 15, 'بڑا چمچ'],
];
function katori(density, defaultId = 'katori') {
  return KATORI.map(([id, label, ml, labelUr]) => {
    const s = { id, label, labelUr, grams: r1(ml * density) };
    if (id === defaultId) s.default = true;
    return s;
  });
}
const sv = (id, label, grams, isDefault = false, labelUr) => {
  const s = { id, label };
  if (labelUr) s.labelUr = labelUr;
  s.grams = grams;
  if (isDefault) s.default = true;
  return s;
};
const HALAL = { status: 'halal' };
const check = (reason) => ({ status: 'check', reason });
// Ayesha's review (research/review/javier-sprint1.md, cross-cutting request 1): plain meat stays 'halal' but says why.
const HALAL_MEAT = { status: 'halal', reason: 'Assumes halal meat (from a halal butcher in Spain).' };
// Ayesha, fix wave 2026-10-14: records added by the Lab lead carry her name and date directly.
const byAyesha = (source) => ({ ...source, reviewer: 'ayesha', date: '2026-10-14' });

// ================================================================= foods-basics.js
const basics = [
  // ---------------------------------------------------------------- fruit
  {
    id: 'intl-banana', name: 'Banana', nameUr: 'کیلا', nameRoman: 'kela',
    aliases: ['kela', 'kelay', 'kele', 'kayla', 'banana', 'bananas', 'plátano', 'platano', 'plàtan', 'banano'],
    group: 'fruit', state: 'raw, peeled (edible part)',
    ...fromUsda(173944, 'A', 'Servings: USDA SR 173944 portions (edible part).'),
    servings: [sv('small', '1 small banana', 101), sv('medium', '1 medium banana', 118, true, '1 کیلا'), sv('large', '1 large banana', 136)],
    tags: ['international', 'vegetarian', 'vegan', 'gym'], slots: ['breakfast', 'snacks', 'evening'], halal: HALAL,
  },
  {
    id: 'intl-apple', name: 'Apple (with skin)', nameUr: 'سیب', nameRoman: 'seb',
    aliases: ['seb', 'saib', 'saeb', 'sev', 'apple', 'apples', 'manzana', 'poma'],
    group: 'fruit', state: 'raw, with skin, cored',
    ...fromUsda(171688, 'A', 'Servings: USDA SR 171688 portions.'),
    servings: [sv('small', '1 small apple', 149), sv('medium', '1 medium apple', 182, true, '1 سیب'), sv('large', '1 large apple', 223)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['evening', 'snacks', 'breakfast'], halal: HALAL,
  },
  {
    id: 'intl-dates', name: 'Dates (khajoor, semi-dry)', nameUr: 'کھجور', nameRoman: 'khajoor',
    aliases: ['khajoor', 'khajur', 'kajoor', 'khajoorain', 'khajoorein', 'dates', 'date', 'dátiles', 'datiles', 'dàtils', 'aseel'],
    group: 'fruit-dried', state: 'semi-dry dates, pitted (edible part)',
    ...fromUsda(171726, 'B', 'Analogue match: Deglet Noor is a semi-dry date like Pakistani Aseel. Serving: USDA 1 pitted date = 7.1 g; a published Aseel fruit averages 6.89 g (PMC6610949, table 2); UCM dátil seco sin hueso = 8 g.'),
    servings: [sv('date', '1 date (khajoor)', 7.1, true, '1 کھجور'), sv('date-large', '1 large date', 8)],
    tags: ['international', 'pakistani', 'vegetarian', 'vegan', 'iftar'], slots: ['evening', 'snacks', 'breakfast'], halal: HALAL,
  },
  {
    id: 'intl-dates-medjool', name: 'Dates, Medjool', nameUr: 'مجول کھجور', nameRoman: 'medjool khajoor',
    aliases: ['medjool', 'medjool dates', 'khajoor', 'khajur', 'dátiles medjool', 'ajwa'],
    group: 'fruit-dried', state: 'soft dates, pitted (edible part)',
    ...fromUsda(168191, 'A', 'Serving: USDA 1 pitted Medjool date = 24 g.'),
    servings: [sv('date', '1 Medjool date', 24, true)],
    tags: ['international', 'vegetarian', 'vegan', 'iftar'], slots: ['evening', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-mango', name: 'Mango', nameUr: 'آم', nameRoman: 'aam',
    aliases: ['aam', 'am', 'mango', 'mangoes', 'chaunsa', 'sindhri', 'langra', 'mango fruit', 'mango (fruta)'],
    group: 'fruit', state: 'raw, peeled, stone removed',
    ...fromUsda(169910, 'A', 'Servings: USDA 1 cup pieces = 165 g (0.697 g/ml) → katori 200 ml = 139.5 g; 1 fruit without refuse = 336 g.'),
    servings: [sv('katori', '1 katori of mango pieces (200 ml)', 139.5, true, 'کٹوری'), sv('whole', '1 mango (edible part)', 336)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['evening', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-kinnow', name: 'Kinnow (mandarin)', nameUr: 'کینو', nameRoman: 'kinnow',
    aliases: ['kinnow', 'kinno', 'keenu', 'kino', 'mandarin', 'tangerine', 'mandarina', 'mandarina (fruta)'],
    group: 'fruit', state: 'raw, peeled segments',
    ...fromUsda(169105, 'B', 'Analogue: kinnow is a mandarin hybrid; USDA tangerine (mandarin) values. Servings: USDA portions.'),
    servings: [sv('small', '1 small kinnow', 76), sv('medium', '1 medium kinnow', 88, true, '1 کینو'), sv('large', '1 large kinnow', 120)],
    tags: ['international', 'pakistani', 'vegetarian', 'vegan'], slots: ['evening', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-guava', name: 'Guava', nameUr: 'امرود', nameRoman: 'amrood',
    aliases: ['amrood', 'amrud', 'amrod', 'guava', 'guayaba'],
    group: 'fruit', state: 'raw, whole fruit without refuse',
    ...fromUsda(173044, 'A', 'Servings: USDA 1 fruit without refuse = 55 g (Pakistani guavas are often larger; use 2 or a katori); USDA 1 cup = 165 g (0.697 g/ml) → katori 200 ml = 139.5 g.'),
    servings: [sv('fruit', '1 guava', 55, true, '1 امرود'), sv('katori', '1 katori of guava pieces (200 ml)', 139.5)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['evening', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-orange', name: 'Orange (malta)', nameUr: 'مالٹا', nameRoman: 'malta',
    aliases: ['malta', 'maalta', 'orange', 'oranges', 'naranja', 'taronja', 'santra'],
    group: 'fruit', state: 'raw, peeled',
    ...fromUsda(169097, 'A', 'Servings: USDA portions.'),
    servings: [sv('fruit', '1 orange', 131, true, '1 مالٹا'), sv('large', '1 large orange', 184)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['breakfast', 'evening', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-watermelon', name: 'Watermelon', nameUr: 'تربوز', nameRoman: 'tarbooz',
    aliases: ['tarbooz', 'tarbuz', 'tarbooz', 'watermelon', 'sandía', 'sandia', 'síndria'],
    group: 'fruit', state: 'raw, flesh without rind',
    ...fromUsda(167765, 'A', 'Servings: USDA 1 cup diced = 152 g (0.642 g/ml) → katori 200 ml = 128.5 g; 1 wedge (1/16 melon) = 286 g.'),
    servings: [sv('katori', '1 katori of watermelon pieces (200 ml)', 128.5, true, 'کٹوری'), sv('wedge', '1 wedge', 286)],
    tags: ['international', 'vegetarian', 'vegan', 'iftar'], slots: ['evening', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-grapes', name: 'Grapes', nameUr: 'انگور', nameRoman: 'angoor',
    aliases: ['angoor', 'angur', 'grapes', 'grape', 'uvas', 'raïm'],
    group: 'fruit', state: 'raw',
    ...fromUsda(174683, 'A', 'Servings: USDA 10 grapes = 49 g; 1 cup = 151 g (0.638 g/ml) → katori 200 ml = 127.6 g.'),
    servings: [sv('ten', '10 grapes', 49), sv('katori', '1 katori of grapes (200 ml)', 127.6, true, 'کٹوری')],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['evening', 'snacks'], halal: HALAL,
  },
  // ---------------------------------------------------------------- vegetables
  {
    id: 'intl-cucumber', name: 'Cucumber (with peel)', nameUr: 'کھیرا', nameRoman: 'kheera',
    aliases: ['kheera', 'khira', 'kheeray', 'cucumber', 'pepino', 'cogombre'],
    group: 'vegetable', state: 'raw, with peel',
    ...fromUsda(168409, 'A', 'Servings: UCM (Carbajal Azcona 2015) pepino mediano = 125 g; USDA ½ cup slices = 52 g.'),
    servings: [sv('medium', '1 medium cucumber', 125, true, '1 کھیرا'), sv('half-cup', '½ cup slices', 52)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-tomato', name: 'Tomato', nameUr: 'ٹماٹر', nameRoman: 'tamatar',
    aliases: ['tamatar', 'tamater', 'timatar', 'tomato', 'tomatoes', 'tomate', 'tomàquet'],
    group: 'vegetable', state: 'raw, ripe',
    ...fromUsda(170457, 'A', 'Servings: USDA portions.'),
    servings: [sv('small', '1 small tomato', 91), sv('medium', '1 medium tomato', 123, true, '1 ٹماٹر'), sv('large', '1 large tomato', 182)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-onion', name: 'Onion', nameUr: 'پیاز', nameRoman: 'pyaz',
    aliases: ['pyaz', 'piyaz', 'payaz', 'pyaaz', 'onion', 'onions', 'cebolla', 'ceba'],
    group: 'vegetable', state: 'raw',
    ...fromUsda(170000, 'A', 'Servings: USDA portions.'),
    servings: [sv('small', '1 small onion', 70), sv('medium', '1 medium onion', 110, true, '1 پیاز'), sv('chopped-tbsp', '1 tablespoon chopped onion', 10)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-carrot', name: 'Carrot', nameUr: 'گاجر', nameRoman: 'gajar',
    aliases: ['gajar', 'gajjar', 'carrot', 'carrots', 'zanahoria', 'pastanaga'],
    group: 'vegetable', state: 'raw',
    ...fromUsda(170393, 'A', 'Servings: USDA portions.'),
    servings: [sv('small', '1 small carrot', 50), sv('medium', '1 medium carrot', 61, true, '1 گاجر'), sv('large', '1 large carrot', 72)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-potato-boiled', name: 'Potato, boiled (peeled)', nameUr: 'ابلے ہوئے آلو', nameRoman: 'ubla aloo',
    aliases: ['aloo', 'alu', 'aaloo', 'ubla aloo', 'boiled potato', 'potato', 'patata hervida', 'patata', 'patata bullida'],
    group: 'vegetable', state: 'boiled without skin, no salt',
    ...fromUsda(170440, 'A', 'Servings: USDA portions.'),
    servings: [sv('small', '1 small potato', 125), sv('medium', '1 medium potato', 167, true, '1 آلو'), sv('half-cup', '½ cup pieces', 78)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-potato-raw', name: 'Potato, raw (with skin)', nameUr: 'کچے آلو', nameRoman: 'kacha aloo',
    aliases: ['aloo', 'alu', 'raw potato', 'potato', 'patata cruda', 'patata', 'papa'],
    group: 'vegetable', state: 'raw, flesh and skin',
    ...fromUsda(170026, 'A', 'For cooking from scratch (Sprint 2 recipes). Servings: USDA portions.'),
    servings: [sv('small', '1 small potato', 170), sv('medium', '1 medium potato', 213, true, '1 آلو'), sv('large', '1 large potato', 369)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-lettuce', name: 'Lettuce (romaine)', nameUr: 'سلاد پتہ', nameRoman: 'salad patta',
    aliases: ['lettuce', 'salad patta', 'salaad patta', 'romaine', 'lechuga', 'enciam'],
    group: 'vegetable', state: 'raw leaves',
    ...fromUsda(169247, 'A', 'Servings: USDA portions.'),
    servings: [sv('cup-shredded', '1 cup shredded', 47, true), sv('leaf', '1 large leaf', 28)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  (() => {
    const r = fromRecipe('intl-salad-kachumber');
    return {
      id: 'intl-salad-kachumber', name: 'Salad, kachumber (kheera, tamatar, pyaz)', nameUr: 'کچومر سلاد', nameRoman: 'kachumber salad',
      aliases: ['salad', 'salaad', 'kachumber', 'kachumar', 'kachoomar', 'kachumber salad', 'kheera tamatar salad', 'cucumber tomato salad', 'ensalada de pepino y tomate'],
      group: 'vegetable', state: 'raw, chopped, with lemon juice and salt, no oil',
      per100g: r.per100g, addedFatPer100g: r.addedFatPer100g,
      servings: katori(r.res.density.gPerMl),
      tags: ['pakistani', 'vegetarian', 'vegan', 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
      source: { ...r.source, notes: `${r.source.notes} Katori servings use ${r.res.density.gPerMl.toFixed(3)} g/ml (${r.res.density.note}).` },
    };
  })(),
  // ---------------------------------------------------------------- eggs and dairy
  {
    id: 'intl-egg-boiled', name: 'Egg, boiled', nameUr: 'ابلا ہوا انڈا', nameRoman: 'ubla anda',
    aliases: ['boiled egg', 'ubla anda', 'ubla hua anda', 'ubly anday', 'anda', 'anday', 'ande', 'aanda', 'egg', 'eggs', 'hard boiled egg', 'huevo duro', 'huevo cocido', 'ou dur'],
    group: 'egg', state: 'hard-boiled, shell removed',
    ...fromUsda(173424, 'A', 'Serving: RULES.referenceWeightsG egg-boiled 50 g (USDA large egg).'),
    servings: [sv('egg', '1 egg', 50, true, '1 انڈا')],
    tags: ['international', 'vegetarian', 'contains-egg', 'gym', 'meal-prep', 'eat-cold'], slots: ['breakfast', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-egg-fried', name: 'Egg, fried in oil', nameUr: 'فرائی انڈا', nameRoman: 'anda fry',
    aliases: ['fried egg', 'anda fry', 'fry anda', 'anday fry', 'anda', 'anday', 'ande', 'aanda', 'egg', 'eggs', 'huevo frito', 'ou ferrat'],
    group: 'egg', state: 'fried in vegetable oil, oil absorbed included',
    ...fromUsda(2707158, 'B', 'FNDDS values are calculated (egg plus absorbed oil). Serving: RULES.referenceWeightsG egg-fried 55 g (FNDDS 2707158 "1 egg").'),
    servings: [sv('egg', '1 fried egg', 55, true, '1 انڈا')],
    tags: ['international', 'vegetarian', 'contains-egg'], slots: ['breakfast'], halal: HALAL,
  },
  {
    id: 'intl-egg-raw', name: 'Egg, whole, raw', nameUr: 'کچا انڈا', nameRoman: 'kacha anda',
    aliases: ['egg', 'eggs', 'anda', 'anday', 'ande', 'kacha anda', 'raw egg', 'huevo', 'huevos', 'ou'],
    group: 'egg', state: 'raw, shell removed (for cooking from scratch)',
    ...fromUsda(171287, 'A', 'Servings: USDA large egg 50 g, medium 44 g (edible part).'),
    servings: [sv('large', '1 large egg', 50, true, '1 انڈا'), sv('medium', '1 medium egg', 44)],
    tags: ['international', 'vegetarian', 'contains-egg'], slots: ['breakfast', 'lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-milk-whole', name: 'Milk, full-cream (cow)', nameUr: 'دودھ', nameRoman: 'doodh',
    aliases: ['doodh', 'dudh', 'dood', 'doodh glass', 'milk', 'whole milk', 'full cream milk', 'leche', 'leche entera', 'llet', 'llet sencera'],
    group: 'dairy', state: 'fluid, 3.25 % fat',
    ...fromUsda(171265, 'A', 'Servings: RULES glass 250 ml and cup 200 ml × 1.03 g/ml (USDA 1 cup = 244 g).'),
    servings: [sv('glass', '1 glass (250 ml)', 257.5, true, '1 گلاس'), sv('cup', '1 cup (200 ml)', 206, false, '1 کپ')],
    tags: ['international', 'pakistani', 'vegetarian'], slots: ['breakfast', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-milk-buffalo', name: 'Milk, buffalo (khula doodh)', nameUr: 'بھینس کا دودھ', nameRoman: 'bhains ka doodh',
    aliases: ['bhains ka doodh', 'bhens ka dudh', 'khula doodh', 'gawala doodh', 'buffalo milk', 'doodh', 'dudh', 'leche de búfala'],
    group: 'dairy', state: 'fluid, whole',
    ...fromUsda(171280, 'A', 'Loose milk in Pakistan is often buffalo or mixed milk. Servings: RULES glass/cup × 1.03 g/ml (USDA 1 cup = 244 g).'),
    servings: [sv('glass', '1 glass (250 ml)', 257.5, true, '1 گلاس'), sv('cup', '1 cup (200 ml)', 206, false, '1 کپ')],
    tags: ['pakistani', 'vegetarian'], slots: ['breakfast', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-dahi', name: 'Dahi (plain yogurt, full-fat)', nameUr: 'دہی', nameRoman: 'dahi',
    aliases: ['dahi', 'dahee', 'dehi', 'dai', 'yogurt', 'yoghurt', 'curd', 'plain yogurt', 'yogur', 'yogur natural', 'iogurt', 'iogurt natural'],
    group: 'dairy', state: 'plain, whole milk',
    ...fromUsda(171284, 'A', 'Buffalo-milk dahi is richer. Katori servings × 1.03 g/ml (RULES yogurt; USDA 1 cup = 245 g). Spanish tub 120 g: Danone Yogur natural label (OFF 8410500001360, read 2026-10-13: 60 kcal, P 3.3, C 4.3, F 3.3 per 100 g, agrees with USDA).'),
    servings: [...katori(1.03), sv('tub', '1 tub (yogur natural, 120 g)', 120)],
    tags: ['pakistani', 'international', 'vegetarian', 'meal-prep'], slots: ['breakfast', 'lunch', 'dinner'], halal: HALAL,
  },
  (() => {
    const r = fromRecipe('intl-raita');
    return {
      id: 'intl-raita', name: 'Raita (kheera, cucumber)', nameUr: 'رائتہ', nameRoman: 'raita',
      aliases: ['raita', 'raitha', 'rayta', 'kheera raita', 'cucumber raita', 'yogurt sauce', 'salsa de yogur'],
      group: 'side-dip', state: 'dahi with grated cucumber, cumin, mint and salt',
      per100g: r.per100g, addedFatPer100g: r.addedFatPer100g,
      servings: katori(r.res.density.gPerMl),
      tags: ['pakistani', 'vegetarian', 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
      source: r.source,
    };
  })(),
  // ---------------------------------------------------------------- meat and fish
  {
    id: 'intl-chicken-breast-roasted', name: 'Chicken breast, roasted (no skin)', nameUr: 'مرغی کا سینہ، روسٹ', nameRoman: 'murghi ka seena',
    aliases: ['chicken breast', 'grilled chicken', 'boneless chicken', 'chikan', 'murgh', 'murg', 'pechuga de pollo', 'pit de pollastre'],
    group: 'meat-fish', state: 'cooked (roasted), meat only, no skin, no bone',
    ...fromUsda(171477, 'A', 'Serving: FNDDS 2705956 chicken breast, skin not eaten, 1 medium breast = 120 g.', { zeroFiber: true }),
    servings: [sv('piece', '1 breast (cooked)', 120, true), sv('100g', '100 g', 100)],
    tags: ['international', 'gym', 'meal-prep'], slots: ['lunch', 'dinner'], halal: HALAL_MEAT,
  },
  {
    id: 'intl-chicken-breast-raw', name: 'Chicken breast, raw (boneless, skinless)', nameUr: 'کچا مرغی کا سینہ', nameRoman: 'kacha chicken breast',
    aliases: ['raw chicken breast', 'chicken breast', 'boneless chicken', 'murgh', 'pechuga de pollo cruda', 'pit de pollastre'],
    group: 'meat-fish', state: 'raw, boneless, skinless (weigh before cooking)',
    ...fromUsda(2646170, 'A', 'Serving: USDA SR 171077 4 oz = 113 g.', { zeroFiber: true }),
    servings: [sv('100g', '100 g raw', 100, true), sv('4oz', '4 oz raw', 113)],
    tags: ['international', 'gym'], slots: ['lunch', 'dinner'], halal: HALAL_MEAT,
  },
  {
    id: 'intl-chicken-thigh-roasted', name: 'Chicken thigh, roasted (no skin)', nameUr: 'مرغی کی ران', nameRoman: 'murghi ki raan',
    aliases: ['chicken thigh', 'chicken leg', 'leg piece', 'raan', 'murgh', 'muslo de pollo', 'cuixa de pollastre'],
    group: 'meat-fish', state: 'cooked (roasted), meat only, no skin, no bone',
    ...fromUsda(172388, 'A', 'Serving: USDA 1 thigh without skin = 116 g (cooked, edible).', { zeroFiber: true }),
    servings: [sv('thigh', '1 thigh (cooked, boneless)', 116, true), sv('100g', '100 g', 100)],
    tags: ['international', 'meal-prep'], slots: ['lunch', 'dinner'], halal: HALAL_MEAT,
  },
  {
    id: 'intl-beef-mince-cooked', name: 'Beef mince, cooked (qeema, 85 % lean)', nameUr: 'قیمہ', nameRoman: 'qeema',
    aliases: ['qeema', 'keema', 'kheema', 'qima', 'beef mince', 'ground beef', 'mince', 'carne picada', 'carn picada'],
    group: 'meat-fish', state: 'pan-browned, fat drained, no added oil',
    ...fromUsda(174034, 'A', 'Plain mince only (for cooked qeema dishes use the Pakistani records). Serving: USDA 3 oz = 85 g.', { zeroFiber: true }),
    servings: [sv('3oz', '3 oz (85 g)', 85, true), sv('100g', '100 g', 100)],
    tags: ['international', 'gym', 'meal-prep'], slots: ['lunch', 'dinner'], halal: HALAL_MEAT,
  },
  {
    id: 'intl-beef-mince-raw', name: 'Beef mince, raw (85 % lean)', nameUr: 'کچا قیمہ', nameRoman: 'kacha qeema',
    aliases: ['raw qeema', 'qeema', 'keema', 'beef mince', 'ground beef', 'carne picada cruda'],
    group: 'meat-fish', state: 'raw (weigh before cooking)',
    ...fromUsda(171796, 'A', '', { zeroFiber: true }),
    servings: [sv('100g', '100 g raw', 100, true), sv('250g', '¼ kg raw', 250)],
    tags: ['international'], slots: ['lunch', 'dinner'], halal: HALAL_MEAT,
  },
  {
    id: 'intl-mutton-roasted', name: 'Mutton (goat), roasted, lean', nameUr: 'بکرے کا گوشت', nameRoman: 'bakray ka gosht',
    aliases: ['mutton', 'bakra', 'bakray ka gosht', 'gosht', 'ghosht', 'goat meat', 'cabrito', 'carne de cabra'],
    group: 'meat-fish', state: 'cooked (roasted), meat only, no bone',
    ...fromUsda(175304, 'A', 'Plain meat; for salan and karahi use the Pakistani dish records. Serving: USDA 3 oz = 85 g.', { zeroFiber: true }),
    servings: [sv('3oz', '3 oz (85 g)', 85, true), sv('100g', '100 g', 100)],
    tags: ['international'], slots: ['lunch', 'dinner'], halal: HALAL_MEAT,
  },
  {
    id: 'intl-fish-rohu', name: 'Fish, rohu or carp, cooked (dry heat)', nameUr: 'روہو مچھلی', nameRoman: 'rohu machhli',
    aliases: ['rohu', 'machhli', 'machli', 'macchi', 'fish', 'carp', 'pescado', 'carpa', 'peix'],
    group: 'meat-fish', state: 'baked or grilled, edible flesh, no bones',
    ...fromUsda(174185, 'B', 'Analogue: rohu (Labeo rohita) is a carp; USDA common carp values. Servings: USDA 1 fillet = 170 g, 3 oz = 85 g.', { zeroFiber: true }),
    servings: [sv('3oz', '1 piece (85 g)', 85, true), sv('fillet', '1 fillet', 170)],
    tags: ['international', 'pakistani', 'seafood-fish'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-tuna-canned-water', name: 'Tuna, canned in water (drained)', nameUr: 'ٹونا مچھلی', nameRoman: 'tuna',
    aliases: ['tuna', 'canned tuna', 'tuna in water', 'atún al natural', 'atun', 'tonyina'],
    group: 'meat-fish', state: 'light tuna, canned in water, drained solids',
    ...fromUsda(334194, 'A', 'Serving: USDA 1 can drained solids = 107 g.', { zeroFiber: true }),
    servings: [sv('can', '1 can (drained)', 107, true), sv('100g', '100 g', 100)],
    tags: ['international', 'gym', 'seafood-fish', 'eat-cold', 'meal-prep'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-tuna-canned-oil', name: 'Tuna, canned in oil (drained)', nameUr: 'تیل میں ٹونا', nameRoman: 'tuna',
    aliases: ['tuna in oil', 'tuna', 'canned tuna', 'atún en aceite', 'atun en aceite', 'tonyina en oli'],
    group: 'meat-fish', state: 'light tuna, canned in oil, drained solids',
    ...fromUsda(173708, 'A', 'Servings: USDA 3 oz = 85 g, 1 can = 171 g.', { zeroFiber: true }),
    servings: [sv('3oz', '3 oz (85 g)', 85, true), sv('can', '1 can (drained)', 171)],
    tags: ['international', 'seafood-fish', 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  (() => {
    const u = usda(173862);
    return {
      id: 'intl-beef-sausage-halal', name: 'Beef sausage, halal (frankfurter type)', nameUr: 'بیف ساسیج', nameRoman: 'beef sausage',
      aliases: ['halal beef sausage', 'beef sausage', 'halal sausage', 'beef frankfurter', 'salchicha de ternera', 'salchicha halal', 'salsitxa de vedella'],
      group: 'meat-fish', state: 'pre-cooked beef frankfurter, as sold (heated)',
      per100g: { ...toPer100g(u), fiber: 0 },
      servings: [sv('large', '1 sausage (large)', 45, true), sv('small', '1 sausage (small)', 25)],
      tags: ['international'], slots: ['breakfast', 'lunch', 'dinner'], halal: HALAL_MEAT,
      source: src(`Analogue of ${u.src} (Frankfurter, beef, unheated: same product type as halal beef sausages sold in Pakistan and Spain)`, 'analogue', 'B', `${carbNote(u)} Used in place of chorizo in es-lentejas. Servings: UCM (Carbajal Azcona 2015) salchichas tipo Frankfurt grande 45 g, pequeña 25 g.`),
    };
  })(),
  // ---------------------------------------------------------------- fats and add-ons
  {
    id: 'intl-cooking-oil', name: 'Cooking oil (vegetable)', nameUr: 'کوکنگ آئل', nameRoman: 'tel',
    aliases: ['tel', 'oil', 'cooking oil', 'vegetable oil', 'canola oil', 'soybean oil', 'sunflower oil', 'aceite', 'aceite de girasol', 'oli'],
    group: 'fat-oil', state: 'liquid oil (soybean; canola and sunflower are the same per gram)',
    ...fromUsda(171411, 'A', 'Servings: RULES.referenceWeightsG oil-tsp 4.5 g, oil-tbsp 13.6 g (USDA 171411).'),
    servings: [sv('tsp', '1 teaspoon', 4.5, true, 'چھوٹا چمچ'), sv('tbsp', '1 tablespoon', 13.6, false, 'بڑا چمچ')],
    tags: ['international', 'pakistani', 'vegetarian', 'vegan'], slots: ['breakfast', 'lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-desi-ghee', name: 'Desi ghee (clarified butter)', nameUr: 'دیسی گھی', nameRoman: 'desi ghee',
    aliases: ['desi ghee', 'ghee', 'ghi', 'asli ghee', 'clarified butter', 'mantequilla clarificada', 'ghee (mantequilla)'],
    group: 'fat-oil', state: 'pure ghee from milk fat',
    ...fromUsda(171314, 'A', 'Servings: RULES density oil and ghee 0.91 g/ml → tsp 4.5 g, tbsp 13.6 g.'),
    servings: [sv('tsp', '1 teaspoon', 4.5, true, 'چھوٹا چمچ'), sv('tbsp', '1 tablespoon', 13.6, false, 'بڑا چمچ')],
    tags: ['pakistani', 'vegetarian'], slots: ['breakfast', 'lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-butter', name: 'Butter (salted)', nameUr: 'مکھن', nameRoman: 'makhan',
    aliases: ['makhan', 'makkhan', 'butter', 'mantequilla', 'mantega'],
    group: 'fat-oil', state: 'salted butter',
    ...fromUsda(173410, 'A', 'Servings: USDA 1 pat = 5 g; 1 tbsp = 14.2 g.'),
    servings: [sv('pat', '1 pat (for one toast)', 5, true), sv('tbsp', '1 tablespoon', 14.2, false, 'بڑا چمچ')],
    tags: ['international', 'vegetarian'], slots: ['breakfast'], halal: HALAL,
  },
  {
    id: 'intl-sugar', name: 'Sugar (white)', nameUr: 'چینی', nameRoman: 'cheeni',
    aliases: ['cheeni', 'chini', 'sugar', 'shakar', 'azúcar', 'azucar', 'sucre'],
    group: 'sugar-sweetener', state: 'granulated',
    ...fromUsda(169655, 'A', 'Servings: RULES sugar-tsp 4.2 g (USDA 169655); tbsp = 3 tsp = 12.6 g.'),
    servings: [sv('tsp', '1 teaspoon', 4.2, true, 'چھوٹا چمچ'), sv('tbsp', '1 tablespoon', 12.6, false, 'بڑا چمچ')],
    tags: ['international', 'pakistani', 'vegetarian', 'vegan'], slots: ['breakfast', 'evening'], halal: HALAL,
  },
  {
    id: 'intl-honey', name: 'Honey', nameUr: 'شہد', nameRoman: 'shehad',
    aliases: ['shehad', 'shahad', 'shehd', 'honey', 'miel', 'mel'],
    group: 'sugar-sweetener', state: 'as sold',
    ...fromUsda(169640, 'A', 'Servings: USDA 1 tbsp = 21 g; tsp = 7 g (⅓ tbsp).'),
    servings: [sv('tsp', '1 teaspoon', 7, true, 'چھوٹا چمچ'), sv('tbsp', '1 tablespoon', 21, false, 'بڑا چمچ')],
    tags: ['international', 'vegetarian'], slots: ['breakfast'], halal: HALAL,
  },
  {
    id: 'intl-ketchup', name: 'Ketchup (tomato)', nameUr: 'کیچپ', nameRoman: 'ketchup',
    aliases: ['ketchup', 'catsup', 'tomato ketchup', 'tomato sauce', 'kechup', 'kétchup'],
    group: 'condiment', state: 'as sold',
    ...fromCofid('17-709', 'A', 'Analysed: 10 samples, 5 brands. USDA SR 168556 (101 kcal, specific Atwater factors) fails the 4/4/9/2 energy check by 11 %, so CoFID is used. Servings: USDA 168556 1 tbsp = 17 g (UCM also 17 g); 1 sachet = 9 g.'),
    servings: [sv('tbsp', '1 tablespoon', 17, true, 'بڑا چمچ'), sv('sachet', '1 sachet', 9)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-mayonnaise', name: 'Mayonnaise', nameUr: 'میونیز', nameRoman: 'mayonez',
    aliases: ['mayo', 'mayonnaise', 'mayonez', 'mayones', 'mayonesa', 'maionesa'],
    group: 'condiment', state: 'regular, as sold',
    ...fromUsda(171009, 'A', 'Servings: USDA 1 tbsp = 13.8 g; 1 packet = 10 g.'),
    servings: [sv('tbsp', '1 tablespoon', 13.8, true, 'بڑا چمچ'), sv('sachet', '1 sachet', 10)],
    tags: ['international', 'vegetarian', 'contains-egg'], slots: ['lunch', 'dinner', 'snacks'], halal: HALAL,
  },
  {
    id: 'pk-achaar-mixed', name: 'Achaar, mixed pickle in oil', nameUr: 'اچار', nameRoman: 'achaar',
    aliases: ['achaar', 'achar', 'aachar', 'pickle', 'mixed pickle', 'aam ka achaar', 'national achaar', 'encurtido indio'],
    group: 'condiment', state: 'as sold, pieces with some oil',
    per100g: pkLabel({ kcal: 233, protein: 1.2, carbs: 9.5, fat: 22.4, fiber: 2.3, sugars: 4.9, satFat: 1.7, sodium: 1447 }),
    servings: [sv('tsp', '1 teaspoon', 5, false, 'چھوٹا چمچ'), sv('tbsp', '1 tablespoon', 15, true, 'بڑا چمچ')],
    tags: ['pakistani', 'vegetarian', 'vegan', 'packaged'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: src('Label: National Mix Pickle, 400 g jar, read 2026-10-13', 'label', 'B', 'Open Food Facts 0620514009728 (last modified 2026-03-08), per 100 g as printed. Spoon weights: 1 g/ml (USDA SR 168561 pickle relish, 1 tbsp = 15 g).' + ' ' + PK_CARB_NOTE),
  },
];

// ================================================================= foods-intl.js
const FAST_FOOD_HALAL = check('Halal at Pakistani chains; in Spain most burger and pizza chains do not use halal meat. Ask.');
const intl = [
  {
    id: 'intl-whey-protein', name: 'Whey protein powder (1 scoop)', nameUr: 'وے پروٹین', nameRoman: 'whey protein',
    aliases: ['whey', 'protein shake', 'protein powder', 'whey protein', 'protein', 'gold standard', 'proteína', 'batido de proteínas', 'scoop'],
    group: 'protein-supplement', state: 'powder, as sold (mix with water or milk separately)',
    per100g: { kcal: 374, protein: 76, carbs: 5.3, fat: 4.6, fiber: 2.3, sugars: 3.2, satFat: 1.7, sodium: 149 },
    servings: [sv('scoop', '1 scoop', 31, true)],
    tags: ['international', 'vegetarian', 'gym', 'packaged'], slots: ['snacks', 'breakfast'],
    halal: check('Imported supplement; halal certification differs by brand and flavour. Check the tub.'),
    source: src('Label: Optimum Nutrition Gold Standard 100% Whey (Double Rich Chocolate), EU label, read 2026-10-13', 'label', 'B', 'Open Food Facts 5060469987712 (last modified 2026-03-25): per 100 g 374 kcal, P 76, C 5.3, F 4.6, fibre 2.3; serving 1 scoop = 31 g. EU label: carbohydrate excludes fibre. US vanilla label (OFF 0748927052404): 31 g scoop = 110 kcal, 24 g protein, consistent.'),
  },
  {
    id: 'intl-oats-dry', name: 'Oats, rolled (dry)', nameUr: 'جئی', nameRoman: 'oats',
    aliases: ['oats', 'oatmeal', 'jai', 'jaee', 'daliya oats', 'porridge oats', 'avena', 'copos de avena', 'civada'],
    group: 'dry-staple', state: 'dry, as sold',
    ...fromUsda(173904, 'A', 'Servings: USDA 1 cup = 81 g → ½ cup = 40.5 g; ⅓ cup = 27 g.'),
    servings: [sv('half-cup', '½ cup dry', 40.5, true), sv('third-cup', '⅓ cup dry', 27)],
    tags: ['international', 'vegetarian', 'vegan', 'gym'], slots: ['breakfast'], halal: HALAL,
  },
  {
    id: 'intl-oats-porridge', name: 'Oats porridge, cooked with water', nameUr: 'دلیہ', nameRoman: 'oats daliya',
    aliases: ['porridge', 'oats porridge', 'oatmeal', 'daliya', 'dalia', 'oats', 'gachas de avena', 'porridge de avena'],
    group: 'grain-cooked', state: 'cooked with water, no salt or sugar',
    ...fromUsda(173905, 'A', 'Katori servings use 0.989 g/ml (USDA 173905: 1 cup = 234 g).'),
    servings: katori(234 / 236.6),
    tags: ['international', 'vegetarian', 'vegan', 'gym'], slots: ['breakfast'], halal: HALAL,
  },
  {
    // Ayesha fix wave 2026-10-14: renamed "(0%)", "dahi" alias removed (dahi is intl-dahi), pot label.
    id: 'intl-greek-yogurt', name: 'Greek yogurt, plain, nonfat (0%)',
    aliases: ['greek yogurt', 'greek yoghurt', 'greek yogurt 0%', 'nonfat greek yogurt', 'fat free greek yogurt', 'strained yogurt', 'yogur griego 0%', 'yogur griego desnatado', 'iogurt grec 0%'],
    group: 'dairy', state: 'plain, nonfat, strained',
    ...fromUsda(330137, 'A', 'Serving: USDA Foundation 330137 1 container = 156 g; katori × 1.03 g/ml. Full-fat versions: intl-greek-yogurt-whole (strained) and es-yogur-griego (Spanish style).', { zeroFiber: true }),
    servings: [sv('container', '1 pot (156 g)', 156, true), sv('katori-small', '1 small katori (155 ml)', 159.7)],
    tags: ['international', 'vegetarian', 'gym'], slots: ['breakfast', 'snacks'], halal: HALAL,
  },
  (() => {
    // Meeting 003 item 5 (Ayesha, fix wave 2026-10-14): plain full-fat strained Greek yogurt with pot servings.
    const u = fromUsda(2259794, 'A', 'Servings: FNDDS 2705422 "Yogurt, Greek, whole milk, plain": 1 5.3 oz container = 150 g, 1 6 oz container = 170 g, 1 cup = 245 g (1.03 g/ml for the katori).', { zeroFiber: true });
    return {
      id: 'intl-greek-yogurt-whole', name: 'Greek yogurt, plain, whole milk (full-fat)',
      aliases: ['greek yogurt', 'greek yoghurt', 'full fat greek yogurt', 'whole milk greek yogurt', 'greek yogurt full fat', 'strained yogurt', 'hung curd', 'lataka dahi', 'tanga dahi', 'yogur griego natural', 'iogurt grec'],
      group: 'dairy', state: 'plain, whole milk, strained (as sold)',
      per100g: u.per100g,
      servings: [sv('pot', '1 pot (150 g)', 150, true), sv('pot-large', '1 large pot (170 g)', 170), sv('katori-small', '1 small katori (155 ml)', 159.7), sv('tbsp', '1 tablespoon', 15.5)],
      tags: ['international', 'vegetarian', 'gym'], slots: ['breakfast', 'snacks', 'evening'], halal: HALAL,
      source: byAyesha(u.source),
    };
  })(),
  {
    // Meeting 003 item 5 (Ayesha, fix wave 2026-10-14). No skyr in USDA, CoFID or BEDCA, so the maker's specification.
    id: 'intl-skyr', name: 'Skyr, plain (0% fat)',
    aliases: ['skyr', 'skyr natural', 'plain skyr', 'skyr natur', 'icelandic yogurt', 'icelandic style yogurt', 'yogur skyr', 'yogur proteico', 'yogur alto en proteinas', 'yogur alto en proteínas', 'iogurt skyr', 'protein yogurt'],
    group: 'dairy', state: 'plain, 0% fat, strained (as sold)',
    per100g: { kcal: 63, protein: 10.6, carbs: 4.0, fat: 0.2, fiber: 0, sugars: 4.0, satFat: 0.1, sodium: 56 },
    servings: [sv('pot', '1 pot (150 g)', 150, true), sv('katori-small', '1 small katori (155 ml)', 159.7), sv('tbsp', '1 tablespoon', 15.5)],
    tags: ['international', 'vegetarian', 'gym'], slots: ['breakfast', 'snacks', 'evening'], halal: HALAL,
    source: byAyesha(src('Label: Arla Skyr 0% Fat Natural Yogurt (Arla Foods UK product specification, EAN 5000181039580), 1 kg, read 2026-10-14', 'label', 'B',
      'Per 100 g as printed: 63.2 kcal (275 kJ), fat 0.2 g (saturates 0.1), carbohydrate 4 g (sugars 4), protein 10.6 g, salt 0.14 g (sodium = salt ÷ 2.5 = 56 mg); EU label carbohydrate is available carbohydrate; fibre 0 (milk only). Ingredients: skyr yogurt (milk). Retail Arla Skyr natural 150 g pot (Fitatu listing: 65 kcal, P 11.0, C 4.0, F 0.2) agrees within 4%. Serving: Arla Skyr Natur 150 g pot (Lebensmittel Zeitung product listing, Arla Foods Deutschland, 6 × 150 g); katori and tbsp × 1.03 g/ml (RULES yogurt). Other plain skyrs (Isey, Siggi\'s, supermarket own brands) are 57–66 kcal and 10–11 g protein per 100 g; flavoured skyr has added sugar, so log it as a flavoured yogurt.')),
  },
  {
    id: 'intl-peanut-butter', name: 'Peanut butter (smooth)', nameUr: 'پینٹ بٹر', nameRoman: 'peanut butter',
    aliases: ['peanut butter', 'pb', 'mungphali makhan', 'crema de cacahuete', 'mantequilla de cacahuete', 'crema de cacauet'],
    group: 'nuts-seeds', state: 'smooth, with salt',
    ...fromUsda(324860, 'A', 'Serving: USDA 2 tbsp = 32 g → 1 tbsp = 16 g.'),
    servings: [sv('tbsp', '1 tablespoon', 16, true, 'بڑا چمچ'), sv('two-tbsp', '2 tablespoons', 32)],
    tags: ['international', 'vegetarian', 'vegan', 'gym'], slots: ['breakfast', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-almonds', name: 'Almonds', nameUr: 'بادام', nameRoman: 'badam',
    aliases: ['badam', 'baadam', 'badaam', 'almonds', 'almond', 'almendras', 'ametlles'],
    group: 'nuts-seeds', state: 'raw, shelled',
    ...fromUsda(170567, 'A', 'Servings: USDA 1 almond = 1.2 g; 1 oz (23 kernels) = 28.35 g.'),
    servings: [sv('ten', '10 almonds', 12, true), sv('handful', '1 handful (23 almonds, 1 oz)', 28.35)],
    tags: ['international', 'vegetarian', 'vegan', 'gym'], slots: ['snacks', 'breakfast'], halal: HALAL,
  },
  {
    id: 'intl-walnuts', name: 'Walnuts', nameUr: 'اخروٹ', nameRoman: 'akhrot',
    aliases: ['akhrot', 'akhrote', 'walnuts', 'walnut', 'nueces', 'nous'],
    group: 'nuts-seeds', state: 'shelled',
    ...fromUsda(170187, 'A', 'Servings: USDA 1 oz (14 halves) = 28.35 g → 4 halves = 8.1 g.'),
    servings: [sv('handful', '1 handful (14 halves, 1 oz)', 28.35, true), sv('four-halves', '4 halves', 8.1)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['snacks'], halal: HALAL,
  },
  {
    id: 'intl-cashews', name: 'Cashews', nameUr: 'کاجو', nameRoman: 'kaju',
    aliases: ['kaju', 'kajoo', 'cashew', 'cashews', 'anacardos', 'anacards'],
    group: 'nuts-seeds', state: 'raw',
    ...fromUsda(170162, 'A', 'Serving: USDA 1 oz = 28.35 g.'),
    servings: [sv('handful', '1 handful (1 oz)', 28.35, true)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['snacks'], halal: HALAL,
  },
  {
    id: 'intl-pistachios', name: 'Pistachios', nameUr: 'پستہ', nameRoman: 'pista',
    aliases: ['pista', 'pistay', 'pistachio', 'pistachios', 'pistachos', 'festucs'],
    group: 'nuts-seeds', state: 'dry roasted, shelled, no salt',
    ...fromUsda(170185, 'A', 'Servings: USDA 1 kernel = 0.7 g; 1 oz (49 kernels) = 28.35 g.'),
    servings: [sv('handful', '1 handful (49 kernels, 1 oz)', 28.35, true), sv('ten', '10 pistachios', 7)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['snacks'], halal: HALAL,
  },
  {
    id: 'intl-peanuts', name: 'Peanuts, roasted', nameUr: 'مونگ پھلی', nameRoman: 'mungphali',
    aliases: ['mungphali', 'moongphali', 'moong phali', 'peanuts', 'peanut', 'cacahuetes', 'maní', 'cacauets'],
    group: 'nuts-seeds', state: 'dry-roasted, shelled',
    ...fromUsda(173806, 'A', 'Servings: USDA 1 oz = 28.35 g; 1 peanut = 1 g.'),
    servings: [sv('handful', '1 handful (1 oz)', 28.35, true)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['snacks', 'evening'], halal: HALAL,
  },
  {
    id: 'intl-pasta-cooked', name: 'Pasta, plain, cooked', nameUr: 'پاستا', nameRoman: 'pasta',
    aliases: ['pasta', 'spaghetti', 'macaroni', 'penne', 'boiled pasta', 'macarrones', 'espaguetis', 'pasta cocida'],
    group: 'grain-cooked', state: 'boiled, no salt or sauce',
    ...fromUsda(169737, 'A', 'Katori servings use 0.524 g/ml (USDA 169737: 1 cup spaghetti, not packed = 124 g).'),
    servings: katori(124 / 236.6),
    tags: ['international', 'vegetarian', 'vegan', 'gym'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-pizza-cheese', name: 'Pizza, cheese (pizza chain, regular crust)', nameUr: 'پیزا', nameRoman: 'pizza',
    aliases: ['pizza', 'cheese pizza', 'margherita', 'pizza slice', 'pizza de queso', 'pizza margarita'],
    group: 'fastfood', state: 'as served, 14-inch regular crust',
    ...fromUsda(173292, 'A', 'Chicken-tikka pizzas carry more protein and fat. Serving: USDA 1 slice = 107 g; UCM pizza ración = 160 g.'),
    servings: [sv('slice', '1 slice (of a 14-inch pizza)', 107, true), sv('ration', '1 ración (UCM)', 160)],
    tags: ['international', 'vegetarian'], slots: ['lunch', 'dinner'], halal: check('Pizza chains in Spain rarely use halal-certified cheese or toppings; Pakistani chains are halal. Ask.'),
  },
  {
    id: 'intl-burger-beef', name: 'Beef burger (fast food, with condiments)', nameUr: 'برگر', nameRoman: 'burger',
    aliases: ['burger', 'beef burger', 'hamburger', 'burgur', 'hamburguesa', 'hamburguesa de ternera'],
    group: 'fastfood', state: 'as served, single regular patty with condiments',
    ...fromUsda(170694, 'A', 'Serving: USDA 1 sandwich = 97 g; Pakistani gourmet burgers are larger (log 2).'),
    servings: [sv('burger', '1 burger', 97, true)],
    tags: ['international'], slots: ['lunch', 'dinner'], halal: FAST_FOOD_HALAL,
  },
  {
    id: 'intl-burger-zinger', name: 'Fried chicken burger (zinger type)', nameUr: 'زنگر برگر', nameRoman: 'zinger burger',
    aliases: ['zinger', 'zinger burger', 'chicken burger', 'crispy chicken burger', 'fried chicken sandwich', 'hamburguesa de pollo', 'burger de pollo crujiente'],
    group: 'fastfood', state: 'as served, breaded fried chicken fillet in a bun',
    ...fromUsda(2707003, 'B', 'FNDDS "Chicken fillet sandwich, fried, from fast food" as the zinger analogue. Servings: FNDDS 1 regular sandwich = 140 g, 1 large = 280 g.'),
    servings: [sv('regular', '1 burger (regular)', 140, true), sv('large', '1 burger (large)', 280)],
    tags: ['international', 'fried'], slots: ['lunch', 'dinner'], halal: FAST_FOOD_HALAL,
  },
  {
    id: 'intl-fries', name: 'French fries (fast food)', nameUr: 'فرائز', nameRoman: 'fries',
    aliases: ['fries', 'french fries', 'chips', 'finger chips', 'aloo fries', 'patatas fritas', 'patates fregides'],
    group: 'snack-fried', state: 'deep-fried in vegetable oil, as served',
    ...fromUsda(170698, 'A', 'Servings: USDA small 71 g, medium 117 g, large 154 g.'),
    servings: [sv('small', '1 small portion', 71), sv('medium', '1 medium portion', 117, true), sv('large', '1 large portion', 154)],
    tags: ['international', 'vegetarian', 'vegan', 'fried'], slots: ['lunch', 'dinner', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-chicken-nuggets', name: 'Chicken nuggets (fast food)', nameUr: 'چکن نگٹس', nameRoman: 'chicken nuggets',
    aliases: ['nuggets', 'chicken nuggets', 'nugget', 'naggets', 'nuggets de pollo'],
    group: 'snack-fried', state: 'breaded and fried, as served',
    ...fromUsda(2706093, 'B', 'FNDDS calculated values. Serving: FNDDS 1 nugget = 16 g.'),
    servings: [sv('nugget', '1 nugget', 16, true), sv('six', '6 nuggets', 96)],
    tags: ['international', 'fried'], slots: ['lunch', 'dinner', 'snacks'], halal: FAST_FOOD_HALAL,
  },
  {
    id: 'intl-chicken-sandwich', name: 'Chicken mayo sandwich (white bread)', nameUr: 'چکن سینڈوچ', nameRoman: 'chicken sandwich',
    aliases: ['sandwich', 'chicken sandwich', 'club sandwich', 'chicken mayo sandwich', 'sandwitch', 'sándwich de pollo', 'sandvitx de pollastre'],
    group: 'fastfood', state: 'chicken salad (chicken with mayonnaise) on white bread',
    ...fromUsda(2706990, 'B', 'FNDDS "Chicken salad sandwich on white" as the analogue for the bakery chicken-mayo sandwich. Servings: FNDDS 2706990 portions "1 regular" = 180 g, "1 large" = 270 g.'),
    servings: [sv('sandwich', '1 sandwich (regular)', 180, true), sv('large', '1 large sandwich', 270)],
    tags: ['international'], slots: ['lunch', 'snacks'], halal: check('Halal when the chicken is halal (usual in Pakistan; ask in Spain).'),
  },
  {
    id: 'intl-cornflakes', name: 'Corn flakes (dry)', nameUr: 'کارن فلیکس', nameRoman: 'cornflakes',
    aliases: ['cornflakes', 'corn flakes', 'cereal', 'kellogs', 'kelloggs', 'copos de maíz', 'cereales'],
    group: 'dry-staple', state: 'dry, as sold (add milk separately)',
    ...fromUsda(2708453, 'B', 'FNDDS calculated values. Serving: FNDDS 1 cup = 30 g.'),
    servings: [sv('us-cup', '1 cup (30 g)', 30, true)],
    tags: ['international', 'vegetarian', 'vegan'], slots: ['breakfast'], halal: HALAL,
  },
  {
    id: 'intl-bread-white', name: 'White bread, sliced (double roti)', nameUr: 'ڈبل روٹی', nameRoman: 'double roti',
    aliases: ['double roti', 'dabal roti', 'bread', 'white bread', 'bread slice', 'toast', 'sliced bread', 'pan de molde', 'pa de motlle'],
    group: 'bread', state: 'commercial sliced white bread, untoasted',
    ...fromUsda(325871, 'A', 'Serving: USDA Foundation 325871 1 slice = 27.3 g.'),
    servings: [sv('slice', '1 slice', 27.3, true, '1 سلائس')],
    tags: ['international', 'pakistani', 'vegetarian', 'vegan'], slots: ['breakfast', 'snacks'], halal: HALAL,
  },
  (() => {
    const r = fromRecipe('med-chicken-shawarma');
    return {
      id: 'med-chicken-shawarma', name: 'Chicken shawarma roll', nameUr: 'چکن شوارما', nameRoman: 'shawarma',
      aliases: ['shawarma', 'shwarma', 'shawarma roll', 'chicken shawarma', 'kebab roll', 'döner', 'kebab de pollo', 'durum de pollo'],
      group: 'fastfood', state: 'as served: pita, grilled chicken, garlic-mayo sauce, salad and pickles',
      per100g: r.per100g, addedFatPer100g: r.addedFatPer100g,
      servings: [sv('roll', '1 shawarma', r1(r.res.cookedG / 10), true)],
      tags: ['middle-eastern', 'pakistani'], slots: ['lunch', 'dinner', 'snacks'],
      halal: check('Halal when the chicken is from a halal butcher (usual in Pakistan; ask at kebab shops in Spain).'),
      source: r.source,
    };
  })(),
];

// ================================================================= foods-es-med.js
function recipeRecord(id, fields) {
  const r = fromRecipe(id);
  const { servings, sourceNotes, ...rest } = fields;
  return {
    id,
    ...rest,
    per100g: r.per100g,
    addedFatPer100g: r.addedFatPer100g,
    servings: typeof servings === 'function' ? servings(r.res) : servings,
    halal: fields.halal ?? HALAL,
    source: sourceNotes ? { ...r.source, notes: `${r.source.notes} ${sourceNotes}` } : r.source,
  };
}
const BAKERY_CHECK = check('Bakery and packaged pastries may contain lard (manteca de cerdo) or E471 of animal origin; check the label or ask the bakery.');

const esmed = [
  recipeRecord('es-tortilla-de-patatas', {
    name: 'Tortilla de patatas (Spanish omelette)',
    aliases: ['tortilla', 'tortilla de patatas', 'tortilla de patata', 'tortilla española', 'spanish omelette', 'spanish omelet', 'potato omelette', 'truita de patates'],
    group: 'egg', state: 'cooked, as served (eggs, potato and onion fried in olive oil, oil drained)',
    servings: (res) => [sv('ration', '1 portion (¼ tortilla)', r1(res.cookedG / 4), true), sv('pincho', '1 slice (pincho, ⅛ tortilla)', r1(res.cookedG / 8)), sv('whole', '1 whole tortilla (5 eggs, 3 potatoes)', r1(res.cookedG))],
    tags: ['spanish', 'vegetarian', 'contains-egg', 'meal-prep', 'eat-cold'], slots: ['lunch', 'dinner', 'breakfast'],
    sourceNotes: 'Whole tortilla = the full standard recipe (5 eggs, 500 g potatoes as bought ≈ 3 medium, 1 onion); log a share with ½ or ¼.',
  }),
  recipeRecord('es-lentejas', {
    name: 'Lentejas (Spanish lentil stew, halal)',
    aliases: ['lentejas', 'lentils', 'lentil stew', 'lentejas estofadas', 'lentejas guisadas', 'llenties', 'spanish lentils', 'lentil soup'],
    group: 'daal-legume', state: 'cooked stew as served, with vegetables, olive oil and halal beef sausage (no chorizo)',
    servings: (res) => katori(res.density.gPerMl),
    tags: ['spanish', 'meal-prep'], slots: ['lunch', 'dinner'],
    halal: { status: 'halal', reason: 'Our recipe uses halal beef sausage. Lentejas in Spanish bars and menús usually contain chorizo (pork).' },
  }),
  recipeRecord('es-garbanzos-con-espinacas', {
    name: 'Garbanzos con espinacas (chickpea and spinach stew)',
    aliases: ['garbanzos', 'potaje', 'potaje de garbanzos', 'garbanzos con espinacas', 'chickpea stew', 'chickpeas and spinach', 'cigrons amb espinacs'],
    group: 'daal-legume', state: 'cooked stew as served, with spinach, vegetables, olive oil and boiled egg',
    servings: (res) => katori(res.density.gPerMl),
    tags: ['spanish', 'vegetarian', 'contains-egg', 'meal-prep'], slots: ['lunch', 'dinner'],
  }),
  recipeRecord('es-paella-de-pollo', {
    name: 'Paella de pollo (chicken paella, home-made)',
    aliases: ['paella', 'paella de pollo', 'chicken paella', 'paella valenciana', 'arroz con pollo', 'paella de pollastre'],
    group: 'rice-dish', state: 'cooked, as served (rice, chicken, green beans, garrofó, olive oil)',
    servings: (res) => [...katori(res.density.gPerMl), sv('ration', '1 ración (¼ paella)', r1(res.cookedG / 4))],
    tags: ['spanish'], slots: ['lunch', 'dinner'],
    halal: check('Halal when you cook it with halal chicken. Restaurant chicken in Spain is rarely halal.'),
    sourceNotes: 'Ración = ¼ of a 400 g-rice paella (UCM: arroz 90–100 g raw per person).',
  }),
  recipeRecord('es-gazpacho', {
    name: 'Gazpacho (cold tomato soup)',
    aliases: ['gazpacho', 'gaspacho', 'gazpacho andaluz', 'cold tomato soup', 'sopa fría de tomate'],
    group: 'soup', state: 'raw, blended and chilled, with olive oil, bread and vinegar',
    servings: (res) => [...katori(res.density.gPerMl), sv('glass', '1 glass (250 ml)', r1(250 * res.density.gPerMl))],
    tags: ['spanish', 'vegetarian', 'vegan', 'eat-cold'], slots: ['lunch', 'dinner'],
  }),
  recipeRecord('es-pan-con-tomate', {
    name: 'Pan con tomate (pa amb tomàquet)',
    aliases: ['pan con tomate', 'pa amb tomàquet', 'pa amb tomaquet', 'pan tumaca', 'pa amb tomata', 'tostada', 'tostada con tomate', 'bread with tomato', 'tomato toast'],
    group: 'bread', state: 'toasted country bread rubbed with ripe tomato, with olive oil and salt',
    servings: (res) => [sv('slice', '1 slice (pan de payés)', r1(res.cookedG / 4), true), sv('slice-small', '1 small slice (barra)', r1(res.cookedG / 8))],
    tags: ['catalan', 'spanish', 'vegetarian', 'vegan'], slots: ['breakfast', 'dinner'],
    sourceNotes: 'Small slice = half the pan de payés slice (UCM: rebanada 30 g vs payés 60 g).',
  }),
  recipeRecord('es-tostada-con-aceite', {
    name: 'Tostada con aceite (toast with olive oil)',
    aliases: ['tostada con aceite', 'tostada', 'torrada amb oli', 'pa amb oli', 'toast with olive oil', 'olive oil toast', 'tostada de aceite'],
    group: 'bread-fried', state: 'toasted white bread (barra) with olive oil and salt',
    servings: (res) => [sv('tostada', '1 tostada (2 slices of barra)', r1(res.cookedG), true), sv('slice', '1 slice', r1(res.cookedG / 2))],
    tags: ['spanish', 'catalan', 'vegetarian', 'vegan'], slots: ['breakfast'],
  }),
  recipeRecord('es-pisto', {
    name: 'Pisto (Spanish vegetable stew)',
    aliases: ['pisto', 'pisto manchego', 'samfaina', 'ratatouille', 'spanish ratatouille', 'mixed vegetables'],
    group: 'curry-veg', state: 'stewed in olive oil, as served',
    servings: (res) => katori(res.density.gPerMl),
    tags: ['spanish', 'vegetarian', 'vegan', 'meal-prep'], slots: ['lunch', 'dinner'],
  }),
  recipeRecord('es-croquetas-de-pollo', {
    name: 'Croquetas de pollo (chicken croquettes)',
    aliases: ['croquetas', 'croqueta', 'croquetas de pollo', 'chicken croquettes', 'croquetes de pollastre', 'croquettes'],
    group: 'snack-fried', state: 'breaded and fried, as served',
    servings: [{ id: 'croqueta', label: '1 croqueta', grams: 25, default: true }],
    tags: ['spanish', 'contains-egg', 'fried'], slots: ['lunch', 'dinner', 'snacks'],
    halal: check('Bar and frozen croquetas in Spain may use non-halal chicken or ham stock; home-made with halal chicken is halal.'),
    sourceNotes: 'Serving: UCM croqueta 20–30 g.',
  }),
  recipeRecord('es-ensalada-mixta', {
    name: 'Ensalada mixta (mixed salad with tuna and egg)',
    aliases: ['ensalada mixta', 'ensalada', 'mixed salad', 'tuna salad', 'amanida', 'amanida variada', 'salad'],
    group: 'side-dip', state: 'raw, dressed with olive oil and vinegar',
    servings: (res) => katori(res.density.gPerMl),
    tags: ['spanish', 'contains-egg', 'seafood-fish', 'eat-cold'], slots: ['lunch', 'dinner'],
  }),
  {
    id: 'med-olive-oil', name: 'Olive oil', nameUr: 'زیتون کا تیل', nameRoman: 'zaitoon ka tel',
    aliases: ['olive oil', 'zaitoon', 'zaitoon ka tel', 'zaitun', 'aceite', 'aceite de oliva', 'aceite de oliva virgen extra', 'aove', 'oli', "oli d'oliva", 'extra virgin olive oil'],
    group: 'fat-oil', state: 'oil, as sold',
    ...fromBedca(2543, 'A', 'Servings: USDA SR 171413 olive oil 1 tsp = 4.5 g, 1 tbsp = 13.5 g.'),
    servings: [sv('tsp', '1 teaspoon', 4.5, true, 'چھوٹا چمچ'), sv('tbsp', '1 tablespoon', 13.5, false, 'بڑا چمچ')],
    tags: ['mediterranean', 'spanish', 'vegetarian', 'vegan'], slots: ['breakfast', 'lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'med-hummus', name: 'Hummus', nameUr: 'حمص', nameRoman: 'hummus',
    aliases: ['hummus', 'houmous', 'humus', 'hommos', 'chickpea dip', 'hummus de garbanzos'],
    group: 'side-dip', state: 'chickpea and tahini spread, as sold',
    ...fromCofid('13-556', 'B', 'Spanish supermarket labels agree (Carrefour Hummus clásico 294 kcal, YGriega 300 kcal per 100 g, OFF read 2026-10-13); USDA SR 174289 is leaner (237 kcal). Katori servings × 1.04 g/ml (USDA 174289: 1 cup = 246 g); tbsp 15 g (USDA).'),
    servings: katori(246 / 236.6, 'tbsp'),
    tags: ['middle-eastern', 'mediterranean', 'vegetarian', 'vegan', 'eat-cold'], slots: ['lunch', 'dinner', 'snacks'], halal: HALAL,
  },
  {
    id: 'med-falafel', name: 'Falafel (fried)',
    aliases: ['falafel', 'felafel', 'chickpea balls', 'falàfel', 'faláfel'],
    group: 'snack-fried', state: 'deep-fried chickpea balls, home-made',
    ...fromCofid('15-795', 'C', 'Values differ widely between sources (USDA SR 172455 home-prepared 333 kcal without fibre; FNDDS 2707408 514 kcal). Serving: USDA 1 patty = 17 g.'),
    servings: [sv('piece', '1 falafel', 17, true)],
    tags: ['middle-eastern', 'vegetarian', 'vegan', 'fried'], slots: ['lunch', 'dinner', 'snacks'], halal: HALAL,
  },
  {
    id: 'es-lentejas-pardinas-secas', name: 'Lentils, brown (lenteja pardina), dry',
    aliases: ['lentejas secas', 'lenteja pardina', 'dry lentils', 'brown lentils', 'lentils raw', 'llenties seques'],
    group: 'dry-staple', state: 'dry, raw (for cooking from scratch)',
    ...fromBedca(1065, 'A', 'Serving: UCM legumbres 80–90 g raw per ración.'),
    servings: [sv('ration', '1 ración (85 g dry)', 85, true), sv('100g', '100 g dry', 100)],
    tags: ['spanish', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  // ---------------------------------------------------------------- Barcelona breakfast and café
  {
    id: 'es-pan-barra', name: 'Pan de barra (Spanish white bread, baguette type)',
    aliases: ['barra', 'pan', 'pan de barra', 'baguette', 'barra de pan', 'pa', 'barra de pa', 'pan blanco', 'bread', 'bocata bread'],
    group: 'bread', state: 'white bread, as sold',
    ...fromBedca(2160, 'A', 'Servings: UCM (Carbajal Azcona 2015) panecillo/barrita 80 g, rebanada 30 g, rebanada grande 40 g, rebanada de pan payés 60 g.'),
    servings: [sv('barrita', '1 barrita / panecillo', 80, true), sv('slice', '1 slice', 30), sv('slice-large', '1 large slice', 40), sv('slice-payes', '1 slice of pan de payés', 60)],
    tags: ['spanish', 'catalan', 'vegetarian', 'vegan'], slots: ['breakfast', 'lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'es-pan-integral', name: 'Pan integral (wholemeal bread)',
    aliases: ['pan integral', 'pan de molde integral', 'wholemeal bread', 'brown bread', 'whole wheat bread', 'pa integral', 'atta bread'],
    group: 'bread', state: 'wholemeal bread, as sold',
    ...fromBedca(2163, 'B', 'BEDCA "Pan integral" used for sliced wholemeal bread (close match). Slice: Mercadona Pan de molde 100% integral label serving 30 g (OFF 8480000093691, read 2026-10-13); UCM pan de molde rebanada mediana 20 g, grande 40 g.'),
    servings: [sv('slice', '1 slice (pan de molde)', 30, true), sv('slice-small', '1 thin slice', 20), sv('slice-large', '1 large slice', 40)],
    tags: ['spanish', 'vegetarian', 'vegan'], slots: ['breakfast', 'snacks'],
    halal: check('Sliced bread can contain E471/E472e emulsifiers of unstated origin; check the label.'),
  },
  {
    id: 'es-croissant', name: 'Croissant (butter)',
    aliases: ['croissant', 'cruasán', 'cruasan', 'croissant de mantequilla', 'croissant de mantega', 'curasán'],
    group: 'biscuit-bakery', state: 'as sold',
    ...fromBedca(2669, 'B', 'Servings: USDA SR 174987 croissant small 42 g, medium 57 g; UCM cruasán mini 20 g, grande 90 g.'),
    servings: [sv('mini', '1 mini croissant', 20), sv('small', '1 small croissant', 42), sv('medium', '1 croissant (medium)', 57, true), sv('large', '1 large croissant', 90)],
    tags: ['spanish', 'catalan', 'vegetarian', 'contains-egg'], slots: ['breakfast', 'evening'], halal: BAKERY_CHECK,
  },
  {
    id: 'es-napolitana-chocolate', name: 'Napolitana de chocolate (chocolate croissant)',
    aliases: ['napolitana', 'napolitana de chocolate', 'croissant de chocolate', 'pain au chocolat', 'chocolate croissant', 'napolitana de xocolata'],
    group: 'biscuit-bakery', state: 'as sold',
    ...fromBedca(1062, 'B', 'Serving: Carrefour Napolitanas con chocolate label, 1 piece = 82 g (OFF 3245414455917, read 2026-10-13: 434 kcal per 100 g); UCM bollería unidad mediana 80 g.'),
    servings: [sv('piece', '1 napolitana', 82, true)],
    tags: ['spanish', 'catalan', 'vegetarian'], slots: ['breakfast', 'evening'], halal: BAKERY_CHECK,
  },
  {
    id: 'es-magdalena', name: 'Magdalena (Spanish muffin)',
    aliases: ['magdalena', 'magdalenas', 'madeleine', 'spanish muffin', 'cupcake', 'magdalena valenciana'],
    group: 'biscuit-bakery', state: 'as sold',
    ...fromBedca(2678, 'B', 'Servings: Mercadona Magdalenas label serving 34.4 g (OFF 8402001018824, read 2026-10-13; made with sunflower oil); UCM magdalena pequeña 27 g, grande 42 g.'),
    servings: [sv('piece', '1 magdalena', 34.4, true), sv('small', '1 small magdalena', 27), sv('large', '1 large magdalena', 42)],
    tags: ['spanish', 'vegetarian', 'contains-egg'], slots: ['breakfast', 'evening'], halal: BAKERY_CHECK,
  },
  {
    id: 'es-ensaimada', name: 'Ensaïmada (Mallorcan pastry)',
    aliases: ['ensaïmada', 'ensaimada', 'ensaimada de mallorca', 'saïm pastry'],
    group: 'biscuit-bakery', state: 'as sold',
    ...fromBedca(2671, 'B', 'Serving: UCM ensaimada unidad grande 90 g.'),
    servings: [sv('piece', '1 ensaïmada', 90, true)],
    tags: ['spanish', 'catalan', 'vegetarian', 'contains-egg'],
    halal: { status: 'not-halal', reason: 'The standard recipe is made with pork lard (saïm).' },
  },
  {
    id: 'es-cafe-con-leche', name: 'Café con leche (coffee with milk)',
    aliases: ['café con leche', 'cafe con leche', 'cafè amb llet', 'coffee with milk', 'white coffee', 'coffee', 'latte'],
    group: 'drink-tea-coffee', state: 'as served, no sugar',
    ...fromBedca(681, 'B', 'BEDCA composite (about half milk). Servings: UCM leche taza 250 g; RULES cup 200 ml × 1.03 g/ml = 206 g. Add sugar separately.'),
    servings: [sv('taza', '1 cup (taza, 250 ml)', 250, true), sv('cup', '1 small cup (200 ml)', 206)],
    tags: ['spanish', 'vegetarian'], slots: ['breakfast', 'evening'], halal: HALAL,
  },
  recipeRecord('es-cortado', {
    name: 'Cortado (espresso with a little milk)',
    aliases: ['cortado', 'tallat', 'café cortado', 'cafe cortado', 'espresso with milk', 'coffee'],
    group: 'drink-tea-coffee', state: 'as served, no sugar',
    servings: (res) => [sv('cup', '1 cortado', r1(res.cookedG), true)],
    tags: ['spanish', 'catalan', 'vegetarian'], slots: ['breakfast', 'lunch', 'evening'],
  }),
  {
    id: 'es-cafe-solo', name: 'Café solo (espresso)',
    aliases: ['café solo', 'cafe solo', 'espresso', 'expreso', 'cafè sol', 'black coffee', 'coffee'],
    group: 'drink-tea-coffee', state: 'as served, no sugar',
    ...fromUsda(171891, 'A', 'Serving: UCM café, infusión, taza pequeña = 50 g.'),
    servings: [sv('small-cup', '1 café solo (small cup)', 50, true)],
    tags: ['spanish', 'vegetarian', 'vegan'], slots: ['breakfast', 'lunch', 'evening'], halal: HALAL,
  },
  recipeRecord('es-cola-cao-con-leche', {
    name: 'Cola Cao with milk',
    aliases: ['cola cao', 'colacao', 'cola cao con leche', 'chocolate milk', 'cacao con leche', 'leche con cacao', 'chocolate doodh'],
    group: 'drink-milk', state: '14 g powder in 200 ml semi-skimmed milk (label preparation)',
    servings: (res) => [sv('glass', '1 glass (14 g + 200 ml milk)', r1(res.cookedG), true)],
    tags: ['spanish', 'vegetarian', 'packaged'], slots: ['breakfast', 'evening'],
  }),
  {
    id: 'es-zumo-naranja-natural', name: 'Zumo de naranja natural (fresh orange juice)',
    aliases: ['zumo de naranja', 'zumo de naranja natural', 'suc de taronja', 'orange juice', 'fresh orange juice', 'malta juice', 'orange juice fresh'],
    group: 'drink-other', state: 'freshly squeezed, no added sugar',
    ...fromUsda(169098, 'A', 'Cross-check BEDCA 2468 Zumo de naranja 41 kcal. Servings: UCM zumos vaso 200 g; glass 250 ml × 1.048 g/ml (USDA 169098: 1 fl oz = 31 g) = 262 g.'),
    servings: [sv('vaso', '1 glass (vaso, 200 g)', 200, true), sv('glass', '1 large glass (250 ml)', 262)],
    tags: ['spanish', 'vegetarian', 'vegan'], slots: ['breakfast'], halal: HALAL,
  },
  (() => {
    // Javier review cross-cutting request 2 + Meeting 003 item 5 (Ayesha, fix wave 2026-10-14): Spanish
    // "yogur griego" is a cream-enriched full-fat yogurt (about 10% fat), not a strained high-protein one.
    const b = fromBedca(2520, 'A', 'Spanish-style yogur griego (milk and cream, about 10% fat, 6 g protein); for strained Greek yogurt see intl-greek-yogurt-whole, for 0% see intl-greek-yogurt. Serving: UCM (Carbajal Azcona 2015) yogur unidad = 125 g; katori × 1.03 g/ml (RULES yogurt).');
    return {
      id: 'es-yogur-griego', name: 'Yogur griego (Spanish style, full-fat)',
      aliases: ['yogur griego', 'yogur griego natural', 'griego', 'iogurt grec', 'iogurt grec natural', 'spanish greek yogurt', 'greek style yogurt', 'greek yogurt'],
      group: 'dairy', state: 'plain, unsweetened, full-fat (milk and cream), as sold',
      per100g: b.per100g,
      servings: [sv('pot', '1 pot (125 g)', 125, true), sv('katori-small', '1 small katori (155 ml)', 159.7), sv('tbsp', '1 tablespoon', 15.5)],
      tags: ['spanish', 'vegetarian'], slots: ['breakfast', 'evening', 'snacks'], halal: HALAL,
      source: byAyesha(b.source),
    };
  })(),
  recipeRecord('es-bocadillo-de-tortilla', {
    name: 'Bocadillo de tortilla (tortilla sandwich)',
    aliases: ['bocadillo de tortilla', 'bocata de tortilla', 'entrepà de truita', 'tortilla sandwich', 'bocadillo', 'bocata'],
    group: 'fastfood', state: 'barrita filled with tortilla de patatas, as served',
    servings: (res) => [sv('bocadillo', '1 bocadillo', r1(res.cookedG), true)],
    tags: ['spanish', 'catalan', 'vegetarian', 'contains-egg', 'eat-cold'], slots: ['breakfast', 'lunch'],
  }),
  recipeRecord('es-bocadillo-de-atun', {
    name: 'Bocadillo de atún (tuna sandwich)',
    aliases: ['bocadillo de atún', 'bocadillo de atun', 'bocata de atún', 'entrepà de tonyina', 'tuna sandwich', 'bocadillo', 'bocata'],
    group: 'fastfood', state: 'barrita with tuna in olive oil and tomato, as served',
    servings: (res) => [sv('bocadillo', '1 bocadillo', r1(res.cookedG), true)],
    tags: ['spanish', 'catalan', 'seafood-fish', 'eat-cold'], slots: ['breakfast', 'lunch'],
  }),
];

// ================================================================= foods-pk-packaged.js
const COLA_DENSITY = 30.7 / 29.5735; // USDA SR 174852 cola: 1 fl oz = 30.7 g
const ROOH_AFZA_DENSITY = 103.5 / 77; // Hamdard IN label 103.5 g carbs per 100 ml ÷ PK label 77 g per 100 g
const pk = [
  {
    id: 'pk-marie-biscuit', name: 'Marie biscuit (tea biscuit)', nameUr: 'میری بسکٹ', nameRoman: 'marie biscuit',
    aliases: ['biscuit', 'biscuits', 'biskut', 'marie', 'mari', 'marie biscuit', 'tea biscuit', 'chai biscuit', 'peek freans marie', 'galleta maría', 'galletas maria'],
    group: 'biscuit-bakery', state: 'as sold',
    per100g: pkLabel({ kcal: 452, protein: 6, carbs: 80, fat: 12, fiber: 1.8, sugars: 20, satFat: 5.8, sodium: 369 }),
    servings: [sv('biscuit', '1 biscuit', 7, true, '1 بسکٹ')],
    tags: ['pakistani', 'vegetarian', 'packaged'], slots: ['evening', 'snacks'], halal: HALAL,
    source: src('Label: Peek Freans Marie Biscuits (EBM Pakistan), read 2026-10-13', 'label', 'B', 'Open Food Facts 8964002526710 (last modified 2026-04-30), per 100 g as printed; a second EBM Marie listing (8964002756094) has the same macros. Serving: USDA FNDDS 2707971 Marie biscuit, 1 cookie = 7 g (UCM galleta tipo María 6 g). Cross-check FNDDS 2707971: 406 kcal.' + ' ' + PK_CARB_NOTE),
  },
  {
    id: 'pk-sooper-biscuit', name: 'Sooper biscuit (Peek Freans)', nameUr: 'سوپر بسکٹ', nameRoman: 'sooper',
    aliases: ['sooper', 'super biscuit', 'sooper biscuit', 'peek freans sooper', 'biscuit', 'biscuits', 'egg and butter biscuit'],
    group: 'biscuit-bakery', state: 'as sold',
    per100g: pkLabel({ kcal: 529, protein: 5.5, carbs: 66, fat: 27, fiber: 1.3, sugars: 22.5, satFat: 12.9, sodium: 429 }),
    servings: [sv('biscuit', '1 biscuit', 8.4, true, '1 بسکٹ'), sv('pack', '1 pack (11 biscuits)', 92)],
    tags: ['pakistani', 'vegetarian', 'contains-egg', 'packaged'], slots: ['evening', 'snacks'], halal: HALAL,
    source: src('Label: Peek Freans Sooper, 92 g pack (11 biscuits), read 2026-10-13', 'label', 'B', 'Open Food Facts 8964002758999 (last modified 2025-06-06). 1 biscuit = 92 g ÷ 11 = 8.4 g.' + ' ' + PK_CARB_NOTE),
  },
  {
    id: 'pk-gluco-biscuit', name: 'Gluco biscuit (Peek Freans)', nameUr: 'گلوکو بسکٹ', nameRoman: 'gluco',
    aliases: ['gluco', 'glucose biscuit', 'gluco biscuit', 'peek freans gluco', 'biscuit', 'biscuits'],
    group: 'biscuit-bakery', state: 'as sold',
    per100g: pkLabel({ kcal: 488, protein: 6.1, carbs: 71.8, fat: 19.6, fiber: 1.8, sugars: 22.1, satFat: 9.2, sodium: 160 }),
    servings: [sv('biscuit', '1 biscuit', 7.4, true, '1 بسکٹ')],
    tags: ['pakistani', 'vegetarian', 'packaged'], slots: ['evening', 'snacks'], halal: HALAL,
    source: src('Label: Peek Freans Gluco, read 2026-10-13', 'label', 'B', 'Open Food Facts 8964002513482 (last modified 2024-07-24). Biscuit weight from the label serving in OFF 8964002755974: 2 biscuits = 72 kcal → 72 ÷ 488 × 100 = 14.75 g → 7.4 g each.' + ' ' + PK_CARB_NOTE),
  },
  {
    id: 'pk-rio-biscuit', name: 'Rio biscuit (cream sandwich, Peek Freans)', nameUr: 'ریو بسکٹ', nameRoman: 'rio',
    aliases: ['rio', 'rio biscuit', 'cream biscuit', 'sandwich biscuit', 'peek freans rio', 'biscuit', 'biscuits'],
    group: 'biscuit-bakery', state: 'as sold',
    per100g: pkLabel({ kcal: 493, protein: 5.4, carbs: 72.5, fat: 20.1, fiber: 2.7, sugars: 32.8, satFat: 11.8, sodium: 362 }),
    servings: [sv('biscuit', '1 biscuit', 7, true, '1 بسکٹ')],
    tags: ['pakistani', 'vegetarian', 'packaged'], slots: ['evening', 'snacks'], halal: HALAL,
    source: src('Label: Peek Freans Rio, read 2026-10-13', 'label', 'B', 'Open Food Facts 8964002526192 (last modified 2026-08-24): label serving 1 biscuit = 7 g.' + ' ' + PK_CARB_NOTE),
  },
  {
    id: 'pk-rusk', name: 'Rusk (tea rusk, papay)', nameUr: 'رس', nameRoman: 'rusk',
    aliases: ['rusk', 'rusks', 'papay', 'paapay', 'papey', 'rus', 'tea rusk', 'toast rusk', 'biscote', 'zwieback'],
    group: 'biscuit-bakery', state: 'as sold',
    ...(() => {
      const u = usda(2707705);
      return { per100g: toPer100g(u), source: src(`Analogue of ${u.src} (Zwieback toast: the same twice-baked sweet bread as Pakistani tea rusk)`, 'analogue', 'B', `${carbNote(u)} No Pakistani rusk label was found on Open Food Facts. Cross-check: Parle Rusk label (OFF 8901719101625, read 2026-10-13) 434 kcal, P 7.6, C 80.4, F 9.1 per 100 g. Serving: FNDDS 2707705 "1 rusk" = 10 g.`) };
    })(),
    servings: [sv('rusk', '1 rusk', 10, true, '1 رس')],
    tags: ['pakistani', 'vegetarian', 'packaged'], slots: ['evening', 'snacks', 'breakfast'], halal: HALAL,
  },
  {
    id: 'pk-nimko-mix', name: 'Nimko mix (namkeen)', nameUr: 'نمکو', nameRoman: 'nimko',
    aliases: ['nimko', 'nimco', 'namkeen', 'nimkoo', 'dalmoth', 'mix nimko', 'bombay mix', 'chivda'],
    group: 'snack-packaged', state: 'fried gram-flour, lentil and peanut mix, as sold',
    per100g: pkLabel({ kcal: 497, protein: 18.2, carbs: 48, fat: 25.8, fiber: 4.3 }),
    servings: [sv('pack', '1 small pack (55 g)', 55, true), sv('label-serving', '1 label serving (10 g)', 10)],
    tags: ['pakistani', 'vegetarian', 'vegan', 'packaged', 'fried'], slots: ['evening', 'snacks'], halal: HALAL,
    source: src('Label: Salva Nimko Mix (Family Food Products), 55 g pack, read 2026-10-13', 'label', 'B', 'Open Food Facts 8964002429165 (last modified 2025-11-01): 496.71 kcal, P 18.22, C 48.02, F 25.75 per 100 g; no fibre on this label, so fibre 4.3 g is taken from the Delight Punjabi Mix Nimco label (OFF 0321545480813). Cross-check UK Bombay mix labels: Cofresh 507 kcal, Tesco 526 kcal.' + ' ' + PK_CARB_NOTE),
  },
  {
    id: 'pk-uht-milk-full-cream', name: "UHT milk, full-cream (Olper's / Milk Pak type)", nameUr: 'ڈبے کا دودھ', nameRoman: 'doodh pack',
    aliases: ["olper's", 'olpers', 'milk pak', 'milkpak', 'nurpur', 'packet milk', 'doodh pack', 'dabbay ka doodh', 'tetra pack milk', 'uht milk', 'doodh', 'dudh', 'milk'],
    group: 'dairy', state: 'UHT full-cream milk, as sold',
    per100g: perMlToPerG({ kcal: 64, protein: 2.7, carbs: 5.4, fat: 3.5, fiber: 0, sugars: 5.4, satFat: 2.3 }, 1.03),
    servings: [sv('glass', '1 glass (250 ml)', 257.5, true, '1 گلاس'), sv('cup', '1 cup (200 ml)', 206, false, '1 کپ')],
    tags: ['pakistani', 'vegetarian', 'packaged'], slots: ['breakfast', 'snacks'], halal: HALAL,
    source: src("Label: Olper's Full Cream Milk (Engro Foods), 1.5 l, read 2026-10-13", 'label', 'B', "Open Food Facts 8964000346549 / 8964000346334: per 100 ml 267 kJ (64 kcal), P 2.7, C 5.4, F 3.5, sat 2.3; converted to per 100 g with 1.03 g/ml (RULES water-like; label lists 100 ml = 103 g). Nestlé Milk Pak (OFF 8961008219561: 62.8 kcal, P 2.72, C 5.2, F 3.52 per 100 ml) and Nurpur (8961101373108) agree within 4 %."),
  },
  {
    id: 'pk-cola-regular', name: 'Cola, regular (soft drink)', nameUr: 'کولڈ ڈرنک', nameRoman: 'cold drink',
    aliases: ['cold drink', 'coke', 'pepsi', 'cola', 'soft drink', 'coca cola', 'coca-cola', 'next cola', 'gourmet cola', 'botal', 'refresco de cola', 'cocacola'],
    group: 'drink-other', state: 'regular (sugar-sweetened), as sold',
    per100g: perMlToPerG({ kcal: 44, protein: 0, carbs: 10.9, fat: 0, fiber: 0, sugars: 10.9 }, COLA_DENSITY),
    servings: [sv('bottle-345', '1 bottle (345 ml)', r1(345 * COLA_DENSITY), true, '1 بوتل'), sv('can', '1 can (330 ml)', r1(330 * COLA_DENSITY)), sv('glass', '1 glass (250 ml)', r1(250 * COLA_DENSITY), false, '1 گلاس'), sv('bottle-500', '1 bottle (500 ml)', r1(500 * COLA_DENSITY))],
    tags: ['pakistani', 'international', 'vegetarian', 'vegan', 'packaged'], slots: ['lunch', 'dinner', 'snacks'], halal: HALAL,
    source: src('Label: Coca-Cola Original Taste, 1.5 l, read 2026-10-13', 'label', 'B', `Open Food Facts 5449000051981 (sold in Pakistan among other countries): per 100 ml 44 kcal, carbs and sugars 10.9 g. Per 100 g with ${COLA_DENSITY.toFixed(3)} g/ml (USDA SR 174852 cola: 1 fl oz = 30.7 g). Pakistani colas agree: Cola Next 43 kcal / 10.7 g (OFF 8964001179030), Gourmet Cola 41.2 kcal / 10.3 g (OFF 0046876380001). Some Pakistani Pepsi listings show reduced sugar (5.35–7 g per 100 ml, OFF 0012000801754, 0012000004070), so this record may overstate those.`),
  },
  {
    id: 'pk-juice-mango', name: 'Mango juice (pack, Nestlé Fruita Vitals Chaunsa)', nameUr: 'آم کا جوس', nameRoman: 'mango juice',
    aliases: ['mango juice', 'aam ka juice', 'juice', 'fruita vitals', 'nestle juice', 'shezan', 'mango drink', 'jus', 'zumo de mango'],
    group: 'drink-other', state: 'as sold',
    per100g: perMlToPerG({ kcal: 44, protein: 0.05, carbs: 11, fat: 0.05, fiber: 0, sugars: 11, satFat: 0.05 }, 1.03),
    servings: [sv('pack', '1 pack (200 ml)', 206, true, '1 ڈبہ'), sv('glass', '1 glass (250 ml)', 257.5, false, '1 گلاس')],
    tags: ['pakistani', 'vegetarian', 'vegan', 'packaged'], slots: ['breakfast', 'snacks', 'evening'], halal: HALAL,
    source: src('Label: Nestlé Fruita Vitals Chaunsa Mango Juice, 200 ml, read 2026-10-13', 'label', 'B', 'Open Food Facts 8961008223513 (last modified 2026-04-27): per 100 ml 44 kcal, C 11, sugars 11, P 0.05, F 0.05; no fibre declared (0). Per 100 g with 1.03 g/ml (RULES water-like).'),
  },
  {
    id: 'pk-juice-apple', name: 'Apple juice (pack, Frooto)', nameUr: 'سیب کا جوس', nameRoman: 'apple juice',
    aliases: ['apple juice', 'seb ka juice', 'juice', 'frooto', 'apple drink', 'zumo de manzana'],
    group: 'drink-other', state: 'as sold',
    per100g: perMlToPerG({ kcal: 40, protein: 0, carbs: 10, fat: 0, fiber: 0, sugars: 9 }, 1.03),
    servings: [sv('pack', '1 box (250 ml)', 257.5, true, '1 ڈبہ')],
    tags: ['pakistani', 'vegetarian', 'vegan', 'packaged'], slots: ['breakfast', 'snacks', 'evening'], halal: HALAL,
    source: src('Label: Frooto Apple Juice, 250 ml box, read 2026-10-13', 'label', 'B', 'Open Food Facts 8966000006621 (last modified 2024-04-17): per 100 ml 40 kcal, C 10, sugars 9, P 0.01, F 0; no fibre declared (0). Per 100 g with 1.03 g/ml (RULES water-like).'),
  },
  {
    id: 'pk-rooh-afza-syrup', name: 'Rooh Afza syrup (concentrate)', nameUr: 'روح افزا', nameRoman: 'rooh afza',
    aliases: ['rooh afza', 'roohafza', 'ruh afza', 'rooh afza syrup', 'sharbat', 'sherbet', 'hamdard', 'jam-e-shirin'],
    group: 'sugar-sweetener', state: 'undiluted syrup, as sold (for the made drink see the sharbat record)',
    per100g: { kcal: 300, protein: 0.1, carbs: 77, fat: 0, fiber: 0, sugars: 77 },
    servings: [sv('tbsp', '1 tablespoon (15 ml)', r1(15 * ROOH_AFZA_DENSITY), true, 'بڑا چمچ'), sv('tsp', '1 teaspoon (5 ml)', r1(5 * ROOH_AFZA_DENSITY), false, 'چھوٹا چمچ')],
    tags: ['pakistani', 'vegetarian', 'vegan', 'packaged', 'iftar'], slots: ['evening', 'snacks'], halal: HALAL,
    source: src('Label: Hamdard Rooh Afza (Pakistan), read 2026-10-13', 'label', 'B', `Open Food Facts 8964000122051 (Hamdard Pakistan, per 100 g: 300 kcal, P 0.1, C 77, sugars 77) and 8964000122075 (307 kcal, C 77). Density ${ROOH_AFZA_DENSITY.toFixed(3)} g/ml = Hamdard India label 103.5 g carbs per 100 ml (OFF 8901453000024) ÷ 77 g per 100 g. A glass of sharbat uses about 2 tablespoons (US label serving 30 ml, OFF 8964000122037).`),
  },
];

// ================================================================= Sprint 2 add-on: market and ready-to-eat foods
// Brief: team/briefs/s2-market-preps.md (less cooking: food bought in Barcelona and eaten as is or assembled in
// ≤ 15 min), plus the market staples Yusuf's recipes named without a foodId. Mercadona products were read on
// 2026-10-14 with research/javier/market.mjs: the online shop (warehouse bcn1) gives the EAN and ingredients
// (halal check); per-100 g values come from the Open Food Facts entry for that EAN (typed from the printed label).
const D2 = '2026-10-14';
const src2 = (citation, method, confidence, notes) => ({ ...src(citation, method, confidence, notes), date: D2 });
/** Mercadona label record source (B). */
const merc = (product, id, ean, pack, notes) =>
  src2(`Label: Mercadona ${product}, ${pack}, read ${D2}`, 'label', 'B', `Mercadona online shop product ${id} (tienda.mercadona.es/product/${id}, EAN ${ean}); per-100 g values from Open Food Facts ${ean}. ${notes}`);
const u2 = (id, conf = 'A', notes = '', opts) => {
  const x = fromUsda(id, conf, notes, opts);
  return { per100g: x.per100g, source: { ...x.source, date: D2 } };
};
/** Same food, close analogue: USDA values, method 'analogue'. */
const uAnalogue = (id, why, conf = 'B', notes = '') => {
  const x = u2(id, conf, notes);
  return { per100g: x.per100g, source: { ...x.source, citation: `Analogue of ${x.source.citation} (${why})`, method: 'analogue' } };
};
const IFCT = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, 'research', 'zainab', 'ifct-table1.json'), 'utf8')).map((f) => [f.code, f]));
function fromIfct(code, notes) {
  const f = IFCT.get(code);
  return {
    per100g: toPer100g({ kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, sugars: f.sugars }),
    source: src2(`IFCT 2017 ${code}`, 'direct', 'A', `IFCT 2017 Table 1 "${f.name}" (via research/zainab/ifct-table1.json); IFCT carbohydrate is available carbohydrate. ${notes}`),
  };
}
const salt2na = (salt) => Math.round(salt * 400);
const VEG = ['international', 'vegetarian', 'vegan'];
const CUAJO = check('Made with rennet (cuajo) of unstated origin; some people avoid animal rennet. Labels that say "cuajo microbiano" avoid the question.');
const E471 = (what) => check(`${what} contains the emulsifier E-471 (mono- and diglycerides), which can be made from animal fat; the label does not say vegetable origin.`);

const marketBasics = [
  // ---------------------------------------------------------------- fruit (fruit shop, market, Mercadona)
  {
    id: 'intl-pear', name: 'Pear', nameUr: 'ناشپاتی', nameRoman: 'nashpati',
    aliases: ['pear', 'pears', 'nashpati', 'nashpaati', 'naspati', 'pera', 'peras', 'pera conferencia', 'pera limonera', 'pera ercolina'],
    group: 'fruit', state: 'raw, with skin, cored',
    ...u2(169118, 'A', 'Servings: USDA SR 169118 portions.'),
    servings: [sv('small', '1 small pear', 148), sv('medium', '1 medium pear', 178, true, '1 ناشپاتی'), sv('large', '1 large pear', 230)],
    tags: [...VEG, 'eat-cold'], slots: ['evening', 'snacks', 'breakfast'], halal: HALAL,
  },
  {
    id: 'intl-kiwi', name: 'Kiwi (green)', nameUr: 'کیوی', nameRoman: 'kiwi',
    aliases: ['kiwi', 'kiwis', 'kiwifruit', 'kiwi verde', 'kivi', 'quivi'],
    group: 'fruit', state: 'raw, peeled',
    ...u2(168153, 'A', 'Serving: USDA SR 168153, 1 fruit (2 in dia) = 69 g edible.'),
    servings: [sv('fruit', '1 kiwi', 69, true), sv('two', '2 kiwis', 138)],
    tags: [...VEG, 'eat-cold'], slots: ['breakfast', 'evening', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-persimmon', name: 'Persimmon (caqui)', nameUr: 'جاپانی پھل', nameRoman: 'japani phal',
    aliases: ['persimmon', 'caqui', 'kaki', 'caquis', 'sharon fruit', 'persimon', 'japani phal', 'japani fruit', 'amlok'],
    group: 'fruit', state: 'raw, edible part (Japanese / Rojo Brillante type, Valencia season Oct–Dec)',
    ...u2(169941, 'A', 'Serving: USDA SR 169941, 1 fruit (2½ in dia) = 168 g.'),
    servings: [sv('fruit', '1 caqui', 168, true, '1 جاپانی پھل')],
    tags: [...VEG, 'eat-cold'], slots: ['evening', 'snacks', 'breakfast'], halal: HALAL,
  },
  {
    id: 'intl-pomegranate', name: 'Pomegranate (arils)', nameUr: 'انار', nameRoman: 'anar',
    aliases: ['pomegranate', 'anar', 'anaar', 'anar daane', 'granada', 'granadas', 'magrana', 'pomegranate seeds', 'granada desgranada'],
    group: 'fruit', state: 'raw arils (seeds and juice sacs), edible part',
    ...u2(169134, 'A', 'Servings: USDA SR 169134, ½ cup arils = 87 g; 1 pomegranate (4 in dia) = 282 g edible.'),
    servings: [sv('half-cup', '½ cup of arils', 87, true), sv('fruit', '1 pomegranate (arils of)', 282, false, '1 انار')],
    tags: [...VEG, 'eat-cold'], slots: ['breakfast', 'evening', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-blueberries', name: 'Blueberries', nameRoman: 'blueberries',
    aliases: ['blueberries', 'blueberry', 'arándanos', 'arandanos', 'nabius', 'berries'],
    group: 'fruit', state: 'raw, as sold (punnet)',
    ...u2(171711, 'A', 'Servings: USDA SR 171711, 50 berries = 68 g; Mercadona "Arándanos" vaso = 225 g (product 5501, read 2026-10-14).'),
    servings: [sv('handful', '1 handful (50 berries)', 68, true), sv('tub', '1 tub (225 g)', 225)],
    tags: [...VEG, 'eat-cold'], slots: ['breakfast', 'evening', 'snacks'], halal: HALAL,
  },
  {
    id: 'intl-melon', name: 'Melon (piel de sapo / honeydew)',
    aliases: ['melon', 'melón', 'melon piel de sapo', 'piel de sapo', 'meló', 'honeydew'],
    group: 'fruit', state: 'raw, flesh only',
    ...uAnalogue(169911, 'piel de sapo is a green-fleshed inodorus melon like honeydew', 'B', 'Servings: USDA SR 169911, 1 wedge (⅛ of a 6–7 in melon) = 160 g; 1 cup diced = 170 g.'),
    servings: [sv('wedge', '1 wedge (⅛ melon)', 160, true), sv('diced', '1 cup diced', 170)],
    tags: [...VEG, 'eat-cold'], slots: ['evening', 'snacks', 'lunch'], halal: HALAL,
  },
  {
    id: 'intl-pineapple', name: 'Pineapple (fresh, also ready-cut tub)', nameRoman: 'ananas',
    aliases: ['pineapple', 'piña', 'pina', 'pinya', 'ananas', 'ananás', 'piña natural', 'piña a rodajas', 'cut pineapple', 'fruit cup'],
    group: 'fruit', state: 'raw, peeled and cored (fresh or Mercadona "Piña natural a rodajas", ingredient: piña)',
    ...u2(169124, 'A', 'Servings: USDA SR 169124, 1 cup chunks = 165 g; 1 slice (3½ in dia × ¾ in) = 84 g. Mercadona ready-cut tub (product 3024, 600 g) lists pineapple only.'),
    servings: [sv('chunks', '1 cup of chunks', 165, true), sv('slice', '1 slice', 84)],
    tags: [...VEG, 'eat-cold'], slots: ['evening', 'snacks', 'breakfast'], halal: HALAL,
  },
  {
    id: 'intl-figs', name: 'Figs (fresh)', nameUr: 'انجیر', nameRoman: 'anjeer',
    aliases: ['figs', 'fig', 'anjeer', 'anjir', 'higos', 'higo', 'figues', 'figa'],
    group: 'fruit', state: 'raw, whole (skin eaten)',
    ...u2(173021, 'A', 'Servings: USDA SR 173021, 1 medium (2¼ in) = 50 g; 1 large = 64 g.'),
    servings: [sv('medium', '1 fig (medium)', 50, true, '1 انجیر'), sv('large', '1 large fig', 64)],
    tags: [...VEG, 'eat-cold'], slots: ['evening', 'snacks', 'breakfast'], halal: HALAL,
  },
  {
    id: 'intl-avocado', name: 'Avocado', nameRoman: 'avocado',
    aliases: ['avocado', 'aguacate', 'aguacates', 'alvocat', 'butter fruit', 'avo'],
    group: 'fruit', state: 'raw, flesh only (no skin or stone)',
    ...u2(171705, 'A', 'Servings: USDA SR 171705, 1 avocado (no skin or seed) = 201 g; half = 100.5 g.'),
    servings: [sv('half', '½ avocado', 100.5, true), sv('avocado', '1 avocado', 201)],
    tags: [...VEG, 'eat-cold'], slots: ['breakfast', 'lunch', 'dinner'], halal: HALAL,
  },
  // ---------------------------------------------------------------- bagged leaves and market vegetables
  {
    id: 'intl-spinach-raw', name: 'Spinach, raw (bagged baby spinach)', nameUr: 'پالک', nameRoman: 'palak',
    aliases: ['spinach', 'baby spinach', 'palak', 'paalak', 'espinacas', 'espinacas baby', 'espinaca', 'espinacs', 'bagged spinach'],
    group: 'vegetable', state: 'raw leaves, washed, as sold in the bag',
    ...u2(168462, 'A', 'Servings: USDA SR 168462, 1 cup = 30 g; Mercadona "Espinacas baby lavadas" bag = 100 g (product 69984).'),
    servings: [sv('handful', '1 cup (handful)', 30), sv('bowl', '1 salad bowl (2 cups)', 60, true), sv('bag', '1 bag (100 g)', 100)],
    tags: [...VEG, 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-rocket', name: 'Rocket (rúcula), raw',
    aliases: ['rocket', 'arugula', 'rúcula', 'rucula', 'ruca', 'oruga', 'rocket leaves'],
    group: 'vegetable', state: 'raw leaves, washed, as sold in the bag',
    ...u2(169387, 'A', 'Servings: USDA SR 169387, ½ cup = 10 g; Mercadona "Rúcula lavada" bag = 50 g (product 69753).'),
    servings: [sv('handful', '1 handful (1 cup)', 20, true), sv('bag', '1 bag (50 g)', 50)],
    tags: [...VEG, 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-salad-leaves-mixed', name: 'Salad leaves, mixed (bagged)',
    aliases: ['mixed leaves', 'salad leaves', 'bagged salad', 'ensalada mezcla', 'mezcla de lechugas', 'brotes tiernos', 'canónigos', 'canonigos', 'ensalada 4 estaciones', 'mezclum', 'enciam', 'lechuga', 'salad'],
    group: 'vegetable', state: 'raw mixed leaves (lettuces, lamb\'s lettuce, chard), washed, undressed',
    ...uAnalogue(169249, 'bagged mixes are mostly leaf lettuces', 'B', 'Servings: USDA SR 169249, 1 cup shredded = 36 g; Mercadona "Ensalada mezcla 4 estaciones lavada" = 250 g bag (product 69706).'),
    servings: [sv('bowl', '1 salad bowl (2 cups)', 72, true), sv('handful', '1 cup (handful)', 36), sv('bag', '1 bag (250 g)', 250)],
    tags: [...VEG, 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-pepper-red', name: 'Red pepper (bell pepper), raw', nameUr: 'لال شملہ مرچ', nameRoman: 'lal shimla mirch',
    aliases: ['red pepper', 'red bell pepper', 'red capsicum', 'pimiento rojo', 'pimiento', 'pebrot vermell', 'shimla mirch', 'lal shimla mirch', 'capsicum'],
    group: 'vegetable', state: 'raw, seeds removed',
    ...u2(170108, 'A', 'Servings: USDA SR 170108, 1 medium = 119 g; 1 cup chopped = 149 g; 10 strips ≈ 27 g (green pepper portions).'),
    servings: [sv('medium', '1 pepper (medium)', 119, true), sv('half', '½ pepper', 59.5), sv('chopped', '1 cup chopped', 149)],
    tags: [...VEG, 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-pepper-green', name: 'Green pepper (bell pepper), raw', nameUr: 'شملہ مرچ', nameRoman: 'shimla mirch',
    aliases: ['green pepper', 'green bell pepper', 'capsicum', 'shimla mirch', 'simla mirch', 'pimiento verde', 'pimiento italiano', 'pebrot verd'],
    group: 'vegetable', state: 'raw, seeds removed',
    ...u2(170427, 'A', 'Servings: USDA SR 170427, 1 medium = 119 g; 1 cup chopped = 149 g.'),
    servings: [sv('medium', '1 pepper (medium)', 119, true), sv('half', '½ pepper', 59.5), sv('chopped', '1 cup chopped', 149)],
    tags: [...VEG, 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-courgette', name: 'Courgette (zucchini), raw',
    aliases: ['courgette', 'zucchini', 'calabacín', 'calabacin', 'carbassó', 'carbasso', 'calabacín verde'],
    group: 'vegetable', state: 'raw, with skin',
    ...u2(169291, 'A', 'Servings: USDA SR 169291, 1 medium = 196 g; 1 cup chopped = 124 g.'),
    servings: [sv('medium', '1 courgette (medium)', 196, true), sv('chopped', '1 cup chopped', 124)],
    tags: [...VEG], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-peas-frozen', name: 'Peas, frozen (uncooked)', nameUr: 'مٹر', nameRoman: 'matar',
    aliases: ['peas', 'green peas', 'frozen peas', 'matar', 'mattar', 'mutter', 'guisantes', 'guisante', 'pèsols', 'pesols'],
    group: 'vegetable', state: 'frozen, as sold (weigh before cooking)',
    ...u2(170016, 'A', 'Servings: USDA SR 170016, 1 cup = 134 g. Mercadona "Guisante fino ultracongelado" (product 61215).'),
    servings: [sv('half-cup', '½ cup', 67, true), sv('portion', '1 cup', 134)],
    tags: [...VEG], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-green-beans-frozen', name: 'Green beans, frozen (uncooked)', nameUr: 'پھلیاں', nameRoman: 'phaliyan',
    aliases: ['green beans', 'frozen green beans', 'french beans', 'phali', 'phaliyan', 'judías verdes', 'judias verdes', 'judía verde', 'mongetes tendres', 'bajoques'],
    group: 'vegetable', state: 'frozen, as sold (weigh before cooking)',
    ...u2(169962, 'A', 'Servings: USDA SR 169962, 1 cup = 121 g. Mercadona "Judía verde redonda ultracongelada" (product 61282).'),
    servings: [sv('portion', '1 cup', 121, true), sv('half-cup', '½ cup', 60.5)],
    tags: [...VEG], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  // ---------------------------------------------------------------- dairy and eggs
  {
    id: 'intl-milk-semi-skimmed', name: 'Milk, semi-skimmed (UHT)', nameUr: 'دودھ', nameRoman: 'doodh (semi skimmed)',
    aliases: ['semi skimmed milk', 'semi-skimmed milk', 'leche semidesnatada', 'semidesnatada', 'llet semidesnatada', 'low fat milk', 'doodh', 'milk'],
    group: 'dairy', state: 'UHT semi-skimmed cow milk (1.6 % fat), as sold',
    per100g: { ...perMlToPerG({ kcal: 49, protein: 3.2, carbs: 4.7, fat: 1.6, sugars: 4.7 }, 1.03), fiber: 0, sodium: 38 },
    servings: [sv('glass', '1 glass (250 ml)', 257.5, true, '1 گلاس'), sv('cup', '1 cup (200 ml)', 206, false, '1 کپ')],
    tags: ['international', 'spanish', 'vegetarian', 'packaged', 'gym'], slots: ['breakfast', 'evening'], halal: HALAL,
    source: merc('Leche semidesnatada Hacendado', 10382, '8402001002106', '1 l brik', 'Label per 100 ml: 49 kcal, P 3.2, C 4.7 (sugars 4.7), F 1.6, salt 0.0975 g; ÷ 1.03 g/ml (RULES water-like) for per 100 g. Ingredient: semi-skimmed cow milk only.'),
  },
  {
    id: 'intl-egg-whites-liquid', name: 'Egg whites, liquid pasteurised (carton)',
    aliases: ['egg whites', 'liquid egg whites', 'claras de huevo', 'claras', 'claras líquidas', 'clares d\'ou', 'egg white carton', 'anday ki safedi', 'safedi'],
    group: 'egg', state: 'pasteurised liquid egg white, as sold (cook before eating)',
    per100g: { kcal: 42, protein: 11, carbs: 0.5, fat: 0.5, fiber: 0, sugars: 0.5, satFat: 0.1, sodium: salt2na(0.44) },
    servings: [sv('portion', '100 ml (about 3 egg whites)', 103, true), sv('white', '1 egg white\'s worth (2 tbsp)', 33), sv('tbsp', '1 tablespoon', 15.5)],
    tags: ['international', 'spanish', 'vegetarian', 'contains-egg', 'packaged', 'gym'], slots: ['breakfast', 'dinner'], halal: HALAL,
    source: merc('Claras de huevo líquidas pasteurizadas (Huevos Güilén)', 31312, '8411384100941', '1 l bottle', 'Label per 100 g: 42 kcal, P 11, C 0.5, F 0.5, sat 0.1, salt 0.44 g. Ingredients: pasteurised hen egg white, E-202. Serving: USDA SR 172183, 1 large egg white = 33 g; 100 ml × 1.03 g/ml.'),
  },
  {
    id: 'es-queso-fresco-batido', name: 'Queso fresco batido 0 % (whipped fresh cheese)',
    aliases: ['queso fresco batido', 'queso batido', 'formatge fresc batut', 'quark', 'fresh cheese', 'high protein cheese', 'batido 0'],
    group: 'dairy', state: 'skimmed whipped fresh cheese (0 % fat), as sold',
    per100g: { kcal: 46, protein: 8, carbs: 3.5, fat: 0.5, fiber: 0, sugars: 3.5, satFat: 0.1, sodium: salt2na(0.1) },
    servings: [sv('serving', '1 label serving (100 g)', 100, true), sv('large', '1 large bowl (200 g)', 200), sv('tbsp', '1 tablespoon', 15.5)],
    tags: ['spanish', 'vegetarian', 'packaged', 'gym', 'eat-cold'], slots: ['breakfast', 'evening', 'snacks'], halal: HALAL,
    source: merc('Queso fresco batido desnatado 0% MG Hacendado', 51071, '8480000510716', '500 g tub', 'Label per 100 g: 46 kcal, P 8, C 3.5 (sugars 3.5), F 0.5, sat 0.1, salt 0.1 g. Ingredients: skimmed pasteurised cow milk, lactic cultures (no rennet, no gelatine). Label serving 100 g; tbsp at 1.03 g/ml.'),
  },
  {
    id: 'es-queso-burgos-0', name: 'Queso fresco de Burgos 0 % (fresh cheese, single tub)',
    aliases: ['queso de burgos', 'queso burgos', 'burgos 0', 'queso fresco', 'formatge de burgos', 'formatge fresc', 'fresh cheese', 'paneer style cheese'],
    group: 'dairy', state: 'skimmed fresh cheese, drained, as sold',
    per100g: { kcal: 67, protein: 12, carbs: 3.9, fat: 0.4, fiber: 0, sugars: 3.9, satFat: 0.1, sodium: salt2na(0.91) },
    servings: [sv('tub', '1 single tub (62.5 g)', 62.5, true), sv('two-tubs', '2 single tubs', 125)],
    tags: ['spanish', 'vegetarian', 'packaged', 'gym', 'eat-cold'], slots: ['breakfast', 'evening', 'dinner'], halal: HALAL,
    source: merc('Queso fresco Burgos desnatado 0% MG Hacendado', 52409, '8480000524096', '250 g (4 × 62.5 g)', 'Label per 100 g: 67 kcal, P 12, C 3.9 (sugars 3.9), F 0.4, sat 0.1, salt 0.91 g; fibre not declared (0). Ingredients: skimmed pasteurised milk, salt, flavouring, rennet (cuajo microbiano: not animal).'),
  },
  {
    id: 'intl-feta', name: 'Feta cheese (sheep and goat, cubes)',
    aliases: ['feta', 'feta cheese', 'queso feta', 'feta en dados', 'formatge feta'],
    group: 'dairy', state: 'drained cubes in brine, as eaten',
    per100g: { kcal: 274, protein: 16, carbs: 1, fat: 23.2, fiber: 0, sugars: 0, satFat: 16.4, sodium: salt2na(2.2) },
    servings: [sv('portion', '1 label portion (30 g)', 30, true), sv('salad', '1 salad portion (50 g)', 50)],
    tags: ['mediterranean', 'vegetarian', 'packaged', 'eat-cold'], slots: ['lunch', 'dinner'], halal: CUAJO,
    source: merc('Queso feta mezcla Hacendado en dados', 51197, '8480000511973', '370 g tub (150 g drained)', 'Label per 100 g: 1147 kJ (274 kcal; OFF shows 277), P 16, C 1, F 23.2, sat 16.4, salt 2.2 g. Ingredients: pasteurised sheep and goat milk, salt, lactic cultures, rennet (cuajo, origin not stated). Label portion 30 g; salad portion 50 g = one-third of the drained tub.'),
  },
  {
    id: 'es-yogur-proteinas-natural', name: 'Protein yogurt, plain 0 % (Mercadona +Proteínas)',
    aliases: ['protein yogurt', '+proteinas', 'mas proteinas', 'yogur proteinas', 'yogur +proteínas', 'postre lácteo proteínas', 'yogur proteico', 'iogurt proteïnes', 'protein dahi'],
    group: 'dairy', state: 'skimmed fermented milk, plain, as sold',
    per100g: { kcal: 52, protein: 10, carbs: 3.1, fat: 0.5, fiber: 0, sugars: 3.1, satFat: 0.1 },
    servings: [sv('pot', '1 portion (120 g)', 120, true), sv('tbsp', '1 tablespoon', 15.5)],
    tags: ['spanish', 'vegetarian', 'packaged', 'gym', 'eat-cold'], slots: ['breakfast', 'evening', 'snacks'], halal: HALAL,
    source: merc('Postre lácteo natural +Proteínas 10 g 0% MG', 21256, '8480000212566', '500 g tub', 'Label per 100 g: 52 kcal, P 10, C 3.1 (sugars 3.1), F 0.5, sat 0.1 g. Ingredients: skimmed pasteurised milk, lactic cultures (no gelatine). Label portion 120 g. Same product as Yusuf\'s ingredient "protein-yogurt".'),
  },
  // ---------------------------------------------------------------- canned fish
  {
    id: 'intl-salmon-canned', name: 'Salmon, canned (al natural)',
    aliases: ['canned salmon', 'tinned salmon', 'salmon', 'salmón al natural', 'salmon en lata', 'salmó', 'salmon can'],
    group: 'meat-fish', state: 'canned in its own juice, as sold (small can)',
    per100g: { kcal: 143, protein: 17, carbs: 1.8, fat: 7.5, fiber: 0, sugars: 0.5, satFat: 1.4, sodium: salt2na(1.2) },
    servings: [sv('can', '1 can (80 g)', 80, true)],
    tags: ['international', 'packaged', 'gym', 'seafood-fish', 'eat-cold', 'meal-prep'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Salmón al natural Hacendado', 18817, '8480000188175', 'pack of 3 × 80 g', 'Label per 100 g: 597 kJ (143 kcal), P 17, C 1.8 (sugars 0.5), F 7.5, sat 1.4, salt 1.2 g. Can = 80 g (pack label 3 × 80 g).'),
  },
  {
    id: 'intl-sardines-olive-oil', name: 'Sardines in olive oil, canned',
    aliases: ['sardines', 'sardine', 'sardinas', 'sardinas en aceite', 'sardinillas', 'sardines en oli', 'canned sardines'],
    group: 'meat-fish', state: 'canned in olive oil, drained, as eaten',
    per100g: { kcal: 289, protein: 20, carbs: 0.7, fat: 23, fiber: 0, sugars: 0.5, satFat: 4.2, sodium: salt2na(0.78) },
    servings: [sv('can', '1 can, drained (84 g)', 84, true)],
    tags: ['spanish', 'packaged', 'gym', 'seafood-fish', 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Sardinas en aceite de oliva Hacendado', 18225, '8480000182258', 'pack of 2 × 117 g (84 g drained)', 'Label per 100 g: 289 kcal, P 20, C 0.7 (sugars 0.5), F 23, sat 4.2, salt 0.78 g. Ingredients: sardine 72 %, olive oil 27 %, salt. Cross-check USDA SR 175139 (drained, with bone) 208 kcal, F 11.5: the label keeps more oil, so this record is on the high side if you drain well.'),
  },
  {
    id: 'intl-mackerel-olive-oil', name: 'Mackerel fillets in olive oil, canned (caballa)',
    aliases: ['mackerel', 'caballa', 'caballa en aceite', 'filetes de caballa', 'verat', 'canned mackerel', 'melva'],
    group: 'meat-fish', state: 'canned in olive oil, drained, as eaten',
    per100g: { kcal: 305, protein: 18, carbs: 0.6, fat: 26, fiber: 0, sugars: 0.5, satFat: 4.1, sodium: salt2na(0.89) },
    servings: [sv('can', '1 can, drained (85 g)', 85, true)],
    tags: ['spanish', 'packaged', 'gym', 'seafood-fish', 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Filetes de caballa del sur en aceite de oliva Hacendado', 13628, '8402001031076', 'pack of 2 × 120 g', 'Label per 100 g: 1278 kJ (305 kcal; OFF\'s 202 kcal field is a typing error: 4×18 + 9×26 = 306), P 18, C 0.6, F 26, sat 4.1, salt 0.89 g. Ingredients: mackerel 71 %, olive oil 28 %, salt. Label portion 85 g.'),
  },
];
// Mercadona boiled-egg pack, mandarins/clementines and skyr already have records: aliases only (no new ids).
for (const [id, extra] of [
  ['intl-egg-boiled', ['huevos cocidos', 'boiled egg pack', 'huevos cocidos pelados', 'ous durs']],
  ['intl-kinnow', ['clementina', 'clementinas', 'clementine', 'mandarines', 'mandarinas']],
]) {
  const r = basics.find((x) => x.id === id);
  r.aliases = [...new Set([...r.aliases, ...extra])];
}
basics.push(...marketBasics);

const marketIntl = [
  // ---------------------------------------------------------------- ready grains, bread and dry staples
  {
    id: 'intl-rice-cup-basmati', name: 'Basmati rice, microwave cup (ready cooked)', nameRoman: 'chawal cup',
    aliases: ['rice cup', 'microwave rice', 'vasito de arroz', 'arroz cocido basmati', 'sabroz', 'arroz basmati cocido', 'chawal', 'ready rice'],
    group: 'grain-cooked', state: 'cooked basmati with a little sunflower oil and salt, as sold (heat 40–60 s)',
    per100g: { kcal: 164, protein: 3.9, carbs: 31, fat: 2.2, fiber: 1.6, sugars: 0, satFat: 0.3, sodium: salt2na(0.875) },
    servings: [sv('pot', '1 cup (125 g)', 125, true), ...katori(0.67).map(({ default: _d, ...s }) => s)],
    tags: ['international', 'vegetarian', 'vegan', 'packaged', 'meal-prep'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Arroz cocido basmati Sabroz', 22280, '8410184040730', '2 × 125 g cups', 'Label per 100 g: 164 kcal, P 3.9, C 31 (sugars 0), F 2.2, sat 0.3, fibre 1.6, salt 0.875 g. Ingredients: cooked basmati 98 %, sunflower oil, salt, sunflower lecithin. Katori servings × 0.67 g/ml (RULES plain cooked rice).'),
  },
  {
    id: 'intl-rice-cup-brown', name: 'Brown rice, microwave cup (ready cooked)', nameRoman: 'brown chawal cup',
    aliases: ['brown rice cup', 'microwave brown rice', 'arroz integral cocido', 'vasito arroz integral', 'sabroz integral', 'brown rice', 'ready rice'],
    group: 'grain-cooked', state: 'cooked brown rice with a little sunflower oil and salt, as sold (heat 40–60 s)',
    per100g: { kcal: 164, protein: 3.8, carbs: 31, fat: 2.2, fiber: 2.8, sugars: 0.5, satFat: 0.4, sodium: salt2na(0.295) },
    servings: [sv('pot', '1 cup (125 g)', 125, true), ...katori(0.67).map(({ default: _d, ...s }) => s)],
    tags: ['international', 'vegetarian', 'vegan', 'packaged', 'meal-prep'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Arroz cocido integral Sabroz', 22281, '8410184040747', '2 × 125 g cups', 'Label per 100 g: 164 kcal, P 3.8, C 31 (sugars 0.5), F 2.2, sat 0.4, fibre 2.8, salt 0.295 g. Ingredients: cooked brown rice 98 %, sunflower oil, salt, sunflower lecithin. Label portion 1 cup (125 g); katori × 0.67 g/ml.'),
  },
  {
    id: 'intl-rice-basmati-dry', name: 'Basmati rice, dry', nameUr: 'باسمتی چاول', nameRoman: 'basmati chawal (kachay)',
    aliases: ['basmati', 'basmati rice', 'dry rice', 'raw rice', 'chawal', 'chaawal', 'kachay chawal', 'arroz basmati', 'arròs basmati'],
    group: 'dry-staple', state: 'dry, uncooked, as sold',
    per100g: { kcal: 355, protein: 9, carbs: 78, fat: 0.6, fiber: 0, sugars: 0.5, satFat: 0.2, sodium: 0 },
    servings: [sv('portion', '1 portion dry (70 g, label serving)', 70, true), sv('100g', '100 g dry', 100)],
    tags: ['international', 'pakistani', 'vegetarian', 'vegan', 'packaged'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Arroz basmati aromático Hacendado', 5002, '8480000050021', '1 kg', 'Label per 100 g: 355 kcal, P 9, C 78 (sugars 0.5), F 0.6, sat 0.2, fibre 0 g as printed. Label serving 70 g dry. Ingredient: rice.'),
  },
  {
    id: 'intl-rice-brown-dry', name: 'Brown rice, long grain, dry', nameRoman: 'brown chawal (kachay)',
    aliases: ['brown rice', 'dry brown rice', 'arroz integral', 'arroz integral largo', 'arròs integral'],
    group: 'dry-staple', state: 'dry, uncooked, as sold',
    per100g: { kcal: 350, protein: 7.6, carbs: 72, fat: 2.8, fiber: 3.3, sugars: 0.5, satFat: 0.7, sodium: 4 },
    servings: [sv('portion', '1 portion dry (70 g)', 70, true), sv('100g', '100 g dry', 100)],
    tags: ['international', 'vegetarian', 'vegan', 'packaged'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Arroz integral largo Hacendado', 5184, '8480000051844', '1 kg', 'Label per 100 g: 350 kcal, P 7.6, C 72 (sugars 0.5), F 2.8, sat 0.7, fibre 3.3, salt 0.01 g. Portion 70 g dry as on the basmati label.'),
  },
  {
    id: 'intl-pasta-wholewheat-dry', name: 'Wholewheat pasta, dry (penne)',
    aliases: ['wholewheat pasta', 'whole wheat pasta', 'brown pasta', 'pasta integral', 'macarrones integrales', 'macarrón integral', 'espaguetis integrales', 'pasta integral seca'],
    group: 'dry-staple', state: 'dry, uncooked, as sold',
    per100g: { kcal: 345, protein: 13.5, carbs: 62, fat: 2.4, fiber: 10, sugars: 3.7, satFat: 0.5, sodium: 4 },
    servings: [sv('portion', '1 portion dry (80 g)', 80, true), sv('100g', '100 g dry', 100)],
    tags: ['international', 'vegetarian', 'vegan', 'packaged', 'gym'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Macarrón rayado integral Hacendado', 35777, '8402001010194', '500 g', 'Label per 100 g: 345 kcal, P 13.5, C 62 (sugars 3.7), F 2.4, sat 0.5, fibre 10, salt 0.01 g. Ingredient: wholewheat durum semolina. Gram servings.'),
  },
  {
    id: 'intl-chia-seeds', name: 'Chia seeds',
    aliases: ['chia', 'chia seeds', 'semillas de chía', 'semillas de chia', 'llavors de chía'],
    group: 'nuts-seeds', state: 'dry seeds, as sold',
    per100g: { kcal: 464, protein: 22, carbs: 2.6, fat: 34, fiber: 30, sugars: 0.4, satFat: 4, sodium: 4 },
    servings: [sv('15g', '15 g', 15, true), sv('10g', '10 g', 10)],
    tags: ['international', 'vegetarian', 'vegan', 'packaged', 'gym'], slots: ['breakfast', 'snacks'], halal: HALAL,
    source: merc('Semillas de chía Hacendado', 5464, '8402001034695', '150 g', 'Label per 100 g: 464 kcal, P 22, C 2.6 (sugars 0.4), F 34, sat 4, fibre 30, salt 0.01 g. Gram servings (USDA SR 170554 gives only 1 oz = 28.35 g).'),
  },
  {
    id: 'intl-bread-wholemeal-sliced', name: 'Wholemeal sliced bread (pan de molde 100 % integral)',
    aliases: ['wholemeal bread', 'brown bread', 'whole wheat bread', 'pan de molde integral', 'pan integral de molde', 'pa de motlle integral', 'brown double roti', 'atta bread'],
    group: 'bread', state: 'as sold (sliced loaf)',
    per100g: { kcal: 248, protein: 8.6, carbs: 41.4, fat: 3.8, fiber: 7.6, sugars: 2.4, satFat: 0.7, sodium: salt2na(1.19) },
    servings: [sv('slice', '1 slice', 29, true), sv('two-slices', '2 slices', 58)],
    tags: ['international', 'spanish', 'vegetarian', 'packaged'], slots: ['breakfast', 'lunch'], halal: E471('The loaf'),
    source: merc('Pan de molde 100% integral Hacendado', 82328, '8402001024184', '460 g', 'Label per 29 g slice converted to per 100 g by OFF: 248 kcal, P 8.6, C 41.4 (sugars 2.4), F 3.8, sat 0.7, fibre 7.6, salt 1.19 g. Ingredients include E-471 and wine vinegar (vinagre).'),
  },
  {
    id: 'intl-tortilla-wrap-wholewheat', name: 'Wholewheat tortilla wrap',
    aliases: ['wrap', 'wraps', 'tortilla wrap', 'wholewheat wrap', 'tortillas de trigo integrales', 'tortilla integral', 'fajita wrap', 'roti wrap'],
    group: 'bread', state: 'as sold (heat 20 s in a pan or microwave)',
    per100g: { kcal: 270, protein: 9.3, carbs: 41, fat: 5.8, fiber: 8.5, sugars: 2.1, satFat: 1.9, sodium: salt2na(1.5) },
    servings: [sv('wrap', '1 wrap (36 g)', 36, true), sv('two-wraps', '2 wraps', 72)],
    tags: ['international', 'vegetarian', 'packaged'], slots: ['lunch', 'dinner'], halal: E471('The wrap'),
    source: merc('Tortillas de trigo integrales Hacendado', 80942, '8480000809421', '360 g (10 wraps)', 'Label per 100 g: 1132 kJ (270 kcal), P 9.3, C 41 (sugars 2.1), F 5.8, sat 1.9, fibre 8.5, salt 1.5 g. Label serving 1 wrap = 36 g. Ingredients include E-471.'),
  },
  {
    id: 'intl-atta-wholemeal', name: 'Wholemeal flour (atta)', nameUr: 'آٹا', nameRoman: 'atta',
    aliases: ['atta', 'aata', 'chakki atta', 'wholemeal flour', 'whole wheat flour', 'harina integral', 'harina integral de trigo', 'farina integral', 'gandum ka atta'],
    group: 'dry-staple', state: 'dry flour, as sold',
    ...fromIfct('A019', 'Mercadona "Harina integral de trigo Hacendado" (product 29134, EAN 8402001018176, OFF read 2026-10-14) agrees: 328 kcal, P 12, C 60, F 2, fibre 11 per 100 g.'),
    servings: [sv('100g', '100 g', 100, true), sv('50g', '50 g', 50)],
    tags: ['pakistani', 'international', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-chana-dal-dry', name: 'Chana dal, dry (split Bengal gram)', nameUr: 'چنے کی دال', nameRoman: 'chanay ki daal',
    aliases: ['chana dal', 'chana daal', 'chanay ki daal', 'chane ki dal', 'split chickpeas', 'bengal gram dal', 'chana dal dry'],
    group: 'dry-staple', state: 'dry, uncooked, as sold (desi shop)',
    ...fromIfct('B001', 'Bought at the Pakistani or Indian shop (Raval); not stocked by Mercadona.'),
    servings: [sv('portion', '1 portion dry (50 g)', 50, true), sv('100g', '100 g dry', 100)],
    tags: ['pakistani', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'intl-masoor-dal-dry', name: 'Masoor dal, dry (split red lentils)', nameUr: 'مسور کی دال', nameRoman: 'masoor ki daal',
    aliases: ['masoor dal', 'masoor daal', 'masur dal', 'red lentils', 'split red lentils', 'lentejas rojas', 'lentejas peladas', 'masoor dry'],
    group: 'dry-staple', state: 'dry, uncooked, as sold',
    ...fromIfct('B013', 'IFCT "Lentil dal" is the split, husked lentil (masoor dal). Desi shop; some Lidl and Carrefour stores sell lentejas rojas.'),
    servings: [sv('portion', '1 portion dry (50 g)', 50, true), sv('100g', '100 g dry', 100)],
    tags: ['pakistani', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
];
intl.push(...marketIntl);

const marketEsMed = [
  // ---------------------------------------------------------------- jarred legumes, chilled soups and dips
  {
    id: 'es-garbanzos-cocidos', name: 'Chickpeas, jarred (cooked), drained', nameUr: 'کابلی چنے', nameRoman: 'kabuli chanay',
    aliases: ['chickpeas', 'jarred chickpeas', 'canned chickpeas', 'garbanzos cocidos', 'garbanzo cocido', 'garbanzos de bote', 'cigrons', 'cigrons cuits', 'chana', 'chanay', 'kabuli chana', 'safaid chanay'],
    group: 'daal-legume', state: 'cooked, drained and rinsed (from a jar or can)',
    ...u2(173801, 'A', 'Katori servings × 0.642 g/ml (USDA 173801: 1 cup drained = 152 g). Jar serving: Hacendado 570 g jar ≈ 400 g drained (Yusuf, research/yusuf/ingredients.mjs). Cross-check: the Hacendado label (OFF 8480000260291: 90 kcal, P 5.5, C 9.5, F 2.2, fibre 4.7 per 100 g) appears to be per net contents including the liquid, so drained USDA values are used. Ingredients: chickpeas, water, salt, E-223, E-385.'),
    servings: [...katori(152 / 236.6), sv('half-jar', '½ jar, drained (200 g)', 200), sv('jar', '1 jar, drained (400 g)', 400)],
    tags: ['spanish', 'vegetarian', 'vegan', 'packaged', 'eat-cold', 'meal-prep', 'gym'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'es-lentejas-cocidas', name: 'Lentils, jarred (cooked), drained',
    aliases: ['jarred lentils', 'canned lentils', 'cooked lentils', 'lentejas cocidas', 'lenteja cocida', 'lentejas de bote', 'llenties cuites', 'lentils'],
    group: 'daal-legume', state: 'cooked, drained (from a jar)',
    per100g: { kcal: 89, protein: 8.2, carbs: 10.7, fat: 0.4, fiber: 4.9, sugars: 0.5, satFat: 0.1, sodium: salt2na(1) },
    source: merc('Lenteja cocida Hacendado', 26030, '8480000260307', '570 g jar', 'Label per 100 g: 374 kJ (89 kcal), P 8.2, C 10.7 (sugars 0.5), F 0.4, sat 0.1, salt 1 g; fibre not on OFF: 4.9 g = label energy left after 4P + 4C + 9F, at 2 kcal/g (EU factor). Protein is 91 % of USDA boiled lentils (SR 172421: 116 kcal, P 9.0, fibre 7.9), so the label reads as drained lentils that hold more water. USDA 172421 itself fails our 4/4/9/2 energy gate (specific Atwater factors). Katori servings × 0.837 g/ml (USDA 172421: 1 cup = 198 g). Ingredients: lentils, water, salt, E-385, ascorbic acid.'),
    servings: [...katori(198 / 236.6), sv('half-jar', '½ jar, drained (200 g)', 200)],
    tags: ['spanish', 'vegetarian', 'vegan', 'packaged', 'eat-cold', 'meal-prep', 'gym'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'es-gazpacho-envasado', name: 'Gazpacho, supermarket carton (Hacendado tradicional)',
    aliases: ['gazpacho hacendado', 'gazpacho de brick', 'gazpacho envasado', 'gazpacho mercadona', 'gaspatxo', 'gazpacho', 'cold tomato soup'],
    group: 'soup', state: 'chilled, as sold',
    per100g: { kcal: 40, protein: 0.9, carbs: 3.4, fat: 2.6, fiber: 1, sugars: 3.3, satFat: 0.4, sodium: salt2na(0.8) },
    servings: [sv('brick', '1 small carton (330 ml)', 340, true), sv('glass', '1 glass (250 ml)', 257.5), ...katori(1.03).map(({ default: _d, ...s }) => s)],
    tags: ['spanish', 'vegetarian', 'vegan', 'packaged', 'eat-cold'], slots: ['lunch', 'dinner', 'evening'], halal: HALAL,
    source: merc('Gazpacho tradicional Hacendado', 39934, '8402001019401', 'pack of 3 × 330 ml', 'Label per 100 g: 40 kcal, P 0.9, C 3.4 (sugars 3.3), F 2.6, sat 0.4, fibre 1, salt 0.8 g. Ingredients: fresh vegetables 92 % (tomato, pepper, cucumber), water, extra virgin olive oil 2.2 %, wine vinegar, salt, garlic (no bread). 1.03 g/ml (RULES water-like).'),
  },
  {
    id: 'es-salmorejo-envasado', name: 'Salmorejo, supermarket carton (Hacendado)',
    aliases: ['salmorejo', 'salmorejo hacendado', 'salmorejo cordobés', 'salmorejo de brick', 'cold tomato cream'],
    group: 'soup', state: 'chilled, as sold, without toppings',
    per100g: { kcal: 85, protein: 1.1, carbs: 5.1, fat: 6.4, fiber: 1.3, sugars: 2.7, satFat: 0.9 },
    servings: [sv('glass', '1 glass (250 ml)', 257.5, true), ...katori(1.03).map(({ default: _d, ...s }) => s)],
    tags: ['spanish', 'vegetarian', 'vegan', 'packaged', 'eat-cold'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Salmorejo al estilo cordobés Hacendado', 39902, '8480000399021', '1 l carton', 'Label per 100 g: 85 kcal, P 1.1, C 5.1 (sugars 2.7), F 6.4, sat 0.9, fibre 1.3 g (OFF salt value 0.002 g is implausible: sodium left out). Ingredients: tomato, water, extra virgin olive oil 6 %, breadcrumbs, pepper, salt, sherry vinegar, garlic. Topped with boiled egg it stays halal; bars often add jamón, which this record excludes. 1.03 g/ml (RULES water-like).'),
  },
  {
    id: 'med-guacamole', name: 'Guacamole (supermarket tub)',
    aliases: ['guacamole', 'guac', 'guacamole hacendado', 'avocado dip', 'aguacate dip'],
    group: 'side-dip', state: 'chilled, as sold',
    ...u2(2709307, 'B', 'FNDDS "Guacamole, NFS" used because the Hacendado (Montosa) label on OFF 8436008521063 does not add up (203 kcal vs 929 kJ, fibre 10.7 g for 95 % avocado); that label suggests about 205–220 kcal, so this record may read low. Servings: FNDDS 1 individual container = 70 g, 1 tbsp = 15 g (1.0 g/ml for katori). Ingredients (Mercadona 3852): avocado 95 %, dehydrated onion and garlic, salt, jalapeño, sugar, citric and ascorbic acid, E-301, E-331, E-202, coriander.'),
    servings: [sv('pot', '1 snack pot (70 g)', 70, true), ...katori(1.0).map(({ default: _d, ...s }) => s)],
    tags: ['mediterranean', 'international', 'vegetarian', 'vegan', 'packaged', 'eat-cold'], slots: ['lunch', 'dinner', 'snacks'], halal: HALAL,
  },
  // ---------------------------------------------------------------- bread, picos, pitta
  {
    id: 'es-picos-integrales', name: 'Picos integrales (wholemeal breadsticks)',
    aliases: ['picos', 'picos integrales', 'picos de pan', 'mini breadsticks', 'regañás', 'rosquilletas', 'breadsticks', 'picos 100% integral'],
    group: 'bread', state: 'baked crunchy mini breadsticks, as sold',
    per100g: { kcal: 379, protein: 14, carbs: 60.9, fat: 6.4, fiber: 11, sugars: 3.1, satFat: 0.8, sodium: salt2na(2.1) },
    servings: [sv('30g', '30 g (a small handful)', 30, true), sv('15g', '15 g', 15)],
    tags: ['spanish', 'vegetarian', 'vegan', 'packaged'], slots: ['lunch', 'evening', 'snacks'], halal: HALAL,
    source: merc('Picos 100% integral de trigo Hacendado', 86215, '8480000862150', '250 g', 'Label per 100 g: 379 kcal, P 14, C 60.9 (sugars 3.1), F 6.4, sat 0.8, fibre 11, salt 2.1 g. Ingredients: wholemeal wheat flour 87 %, high-oleic sunflower oil, yeast, salt, ascorbic acid (no lard). Gram servings (no unit weight published).'),
  },
  {
    id: 'med-pita-bread', name: 'Pitta bread (white)', nameRoman: 'pita',
    aliases: ['pitta', 'pita', 'pita bread', 'pan de pita', 'pa de pita', 'khubz', 'arabic bread', 'mission pita'],
    group: 'bread', state: 'as sold (toast or warm)',
    per100g: { kcal: 254, protein: 9.3, carbs: 50.8, fat: 1, fiber: 2.6, sugars: 3.9, satFat: 0.2, sodium: salt2na(0.7) },
    servings: [sv('pita', '1 pitta (60 g)', 60, true)],
    tags: ['middle-eastern', 'mediterranean', 'vegetarian', 'vegan', 'packaged'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Pan de pita Mission', 14378, '5036034406834', '300 g (5 × 60 g)', 'Label per 100 g: 254 kcal, P 9.3, C 50.8 (sugars 3.9), F 1, sat 0.2, fibre 2.6, salt 0.7 g. Ingredients: fortified wheat flour, water, yeast, salt, gluten, rapeseed oil, calcium propionate (no E-471, no lard). 1 pitta = 60 g (label).'),
  },
  // ---------------------------------------------------------------- dry staples and cupboard
  {
    id: 'med-couscous-dry', name: 'Couscous, dry (medium)',
    aliases: ['couscous', 'cous cous', 'cuscús', 'cuscus', 'kuskus', 'dry couscous'],
    group: 'dry-staple', state: 'dry, as sold (pour over boiling water, 5 min)',
    per100g: { kcal: 346, protein: 12, carbs: 69, fat: 1.6, fiber: 3.9, sugars: 2.5, satFat: 0.4 },
    servings: [sv('portion', '1 portion dry (50 g, label serving)', 50, true), sv('75g', '75 g dry', 75)],
    tags: ['mediterranean', 'middle-eastern', 'vegetarian', 'vegan', 'packaged'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Cous cous mediano Hacendado (Bia SpA)', 9395, '8011033012108', '1 kg box', 'Label per 100 g: 346 kcal, P 12, C 69 (sugars 2.5), F 1.6, sat 0.4, fibre 3.9 g. Ingredients: durum wheat semolina, water. Label serving 50 g dry.'),
  },
  {
    id: 'med-bulgur-dry', name: 'Bulgur wheat, dry',
    aliases: ['bulgur', 'bulghur', 'burghul', 'bulgur wheat', 'trigo bulgur', 'dalia', 'daliya'],
    group: 'dry-staple', state: 'dry, as sold (Lidl, Turkish or desi shops; not stocked by Mercadona)',
    ...u2(2710820, 'A', 'Gram servings.'),
    servings: [sv('portion', '1 portion dry (50 g)', 50, true), sv('75g', '75 g dry', 75)],
    tags: ['mediterranean', 'middle-eastern', 'vegetarian', 'vegan'], slots: ['lunch', 'dinner'], halal: HALAL,
  },
  {
    id: 'es-tomate-triturado', name: 'Crushed tomato (tomate triturado, jar)',
    aliases: ['crushed tomato', 'crushed tomatoes', 'tomate triturado', 'tomàquet triturat', 'passata', 'tinned tomatoes', 'tamatar puree'],
    group: 'vegetable', state: 'canned/jarred crushed tomato, as sold',
    per100g: { kcal: 21, protein: 1, carbs: 3.5, fat: 0.1, fiber: 1.9, sugars: 3.5, satFat: 0, sodium: salt2na(0.5) },
    servings: [sv('100g', '100 g', 100, true), sv('jar-small', '1 small jar (400 g)', 400)],
    tags: ['spanish', 'vegetarian', 'vegan', 'packaged'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Tomate triturado Hacendado', 16043, '8402001001543', '800 g jar', 'Label per 100 g: 21 kcal, P 1, C 3.5 (sugars 3.5), F 0.1, sat 0, salt 0.5 g; fibre not on the label: 1.9 g from USDA SR 170501 (crushed canned tomatoes). Ingredients: tomato, salt, sugar, citric acid. Small jar 400 g = Mercadona product 16044.'),
  },
  {
    id: 'es-pan-rallado', name: 'Breadcrumbs (pan rallado)',
    aliases: ['breadcrumbs', 'bread crumbs', 'pan rallado', 'pa ratllat', 'panko', 'crumbs'],
    group: 'dry-staple', state: 'dry, as sold',
    per100g: { kcal: 369, protein: 9.6, carbs: 78.1, fat: 1.3, fiber: 4.5, sugars: 3.4, satFat: 0.3, sodium: salt2na(1) },
    servings: [sv('tbsp', '1 tablespoon', 6.8, true), sv('30g', '30 g', 30)],
    tags: ['spanish', 'vegetarian', 'vegan', 'packaged'], slots: ['lunch', 'dinner'], halal: HALAL,
    source: merc('Pan rallado Hacendado', 82219, '8480000822192', '750 g', 'Label per 100 g: 369 kcal, P 9.58, C 78.12 (sugars 3.4), F 1.26, sat 0.3, salt 1 g; fibre not on the label: 4.5 g from USDA SR 174928 (dry breadcrumbs). Ingredients: wheat flour, water, salt, yeast (no lard). tbsp = USDA 174928 1 cup 108 g ÷ 16.'),
  },
];
esmed.push(...marketEsMed);
// Existing med-hummus already matches Spanish supermarket tubs (CoFID 13-556): alias for the Hacendado tub.
{
  const h = esmed.find((x) => x.id === 'med-hummus');
  h.aliases = [...new Set([...h.aliases, 'hummus hacendado', 'hummus mercadona', 'hummus tub'])];
}

// ---------------------------------------------------------------- write files
const KEY_ORDER = ['id', 'name', 'nameUr', 'nameRoman', 'aliases', 'group', 'state', 'style', 'family', 'per100g', 'addedFatPer100g', 'servings', 'tags', 'slots', 'halal', 'source'];
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function lit(v) {
  if (Array.isArray(v)) return `[${v.map(lit).join(', ')}]`;
  if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${/^[A-Za-z_]\w*$/.test(k) ? k : q(k)}: ${lit(x)}`).join(', ')} }`;
  if (typeof v === 'string') return q(v);
  return String(v);
}
function recordJs(r) {
  const lines = ['  {'];
  for (const k of KEY_ORDER) {
    if (r[k] === undefined) continue;
    if (k === 'servings') {
      lines.push('    servings: [');
      for (const s of r.servings) lines.push(`      ${lit(s)},`);
      lines.push('    ],');
    } else lines.push(`    ${k}: ${lit(r[k])},`);
  }
  const extra = Object.keys(r).filter((k) => !KEY_ORDER.includes(k) && k !== 'res');
  if (extra.length) throw new Error(`${r.id}: unknown keys ${extra}`);
  lines.push('  },');
  return lines.join('\n');
}
function writeFile(file, header, records) {
  const body = `${header}\n// Generated by research/javier/build.mjs from cited lookups (do not hand-edit numbers; edit the build script and rerun).\n\nexport default [\n${records.map(stampReview).map(recordJs).join('\n')}\n];\n`;
  fs.writeFileSync(path.join(ROOT, 'app', 'data', file), body);
  console.log(`${file}: ${records.length} records`);
}
const H = (what) => `// ${what}\n// Owner: Javier Morales (Nutrition Lab). Reviewed by Dr. Ayesha Siddiqui.\n// Record format: docs/NUTRITION.md. Values per 100 g as eaten.`;
writeFile('foods-basics.js', H('Fruit, vegetables, dairy, eggs, meat, fish, fats and add-ons.'), basics);
writeFile('foods-intl.js', H('International and gym foods.'), intl);
writeFile('foods-es-med.js', H('Spanish and Mediterranean, including Barcelona breakfast and café staples.'), esmed);
writeFile('foods-pk-packaged.js', H('Pakistani packaged foods (from dated labels).'), pk);
