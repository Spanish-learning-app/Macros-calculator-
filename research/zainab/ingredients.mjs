// Ingredient registry for Zainab's standard-recipe calculations.
// Each entry names WHERE its numbers come from; no nutrient values are typed here except for
// product labels (src 'label'), which carry the label URL and the date read.
// Run `node research/zainab/fetch-ingredients.mjs` to resolve every entry into
// research/zainab/ingredients.json (per 100 g, carbs = available carbohydrate, fibre excluded).
//
// src: 'fdc'   → research/usda.mjs index (SR Legacy / Foundation), code = FDC id
//      'fndds' → research/zainab/fndds.mjs, code = FDC id
//      'ifct'  → IFCT 2017 Table 1 via research/zainab/ifct-table1.json, code = IFCT food code
//      'cofid' → CoFID 2021 via research/zainab/cofid.mjs, code = CoFID food code
//      'label' → product label; values given here with url + date
// edible: fraction of the purchased weight that is eaten (bones, peel). Recipes state raw grams
//         as purchased; the calculator applies `edible` and only the edible part enters the dish.

export default {
  // ---- fats ----
  'oil-cooking': { src: 'fdc', code: 171411, label: 'Cooking oil (soybean oil as proxy for Pakistani home cooking oil)' },
  'oil-palm': { src: 'fdc', code: 171015, label: 'Palm oil (proxy for restaurant/dhaba palm-olein cooking oil and banaspati)' },
  'ghee-desi': { src: 'fdc', code: 171314, label: 'Desi ghee (clarified butter)' },
  butter: { src: 'fdc', code: 173430, label: 'Butter, unsalted' },

  // ---- cereals ----
  atta: { src: 'ifct', code: 'A019', label: 'Wheat flour, atta (whole wheat)' },
  maida: { src: 'ifct', code: 'A018', label: 'Wheat flour, refined (maida)' },
  'rice-basmati-raw': { src: 'cofid', code: '11-857', label: 'Rice, white, basmati, raw' },
  'rice-raw-milled': { src: 'ifct', code: 'A015', label: 'Rice, raw, milled' },
  suji: { src: 'fdc', code: 168933, label: 'Semolina (suji)' },
  'wheat-whole': { src: 'ifct', code: 'A020', label: 'Wheat, whole (daliya for haleem)' },
  barley: { src: 'ifct', code: 'A004', label: 'Barley (jau)' },
  vermicelli: { src: 'fdc', code: 168927, label: 'Pasta, dry (proxy for wheat seviyan)' },
  cornflour: { src: 'fdc', code: 169698, label: 'Cornstarch (corn flour)' },

  // ---- pulses ----
  'masoor-dal': { src: 'ifct', code: 'B013', label: 'Lentil dal, split (masoor)' },
  'moong-dal': { src: 'ifct', code: 'B010', label: 'Green gram dal, split (moong)' },
  'urad-dal': { src: 'ifct', code: 'B003', label: 'Black gram dal, split (mash/urad)' },
  'chana-dal': { src: 'ifct', code: 'B001', label: 'Bengal gram dal, split (chana)' },
  'chickpea-kabuli-dry': { src: 'fdc', code: 173756, label: 'Chickpeas, kabuli, mature seeds, raw (safed chanay)' },
  besan: { src: 'fdc', code: 174288, label: 'Chickpea flour (besan)' },

  // ---- vegetables and herbs (IFCT 2017) ----
  onion: { src: 'ifct', code: 'G017', label: 'Onion, big' },
  tomato: { src: 'ifct', code: 'D076', label: 'Tomato, ripe, local' },
  potato: { src: 'ifct', code: 'F006', label: 'Potato, brown skin, big' },
  cauliflower: { src: 'ifct', code: 'D036', label: 'Cauliflower' },
  okra: { src: 'ifct', code: 'D056', label: 'Ladies finger (bhindi)' },
  'peas-green': { src: 'ifct', code: 'D061', label: 'Peas, fresh (matar)' },
  'green-chilli': { src: 'ifct', code: 'G008', label: 'Chillies, green, all varieties' },
  garlic: { src: 'ifct', code: 'G011', label: 'Garlic' },
  ginger: { src: 'ifct', code: 'G014', label: 'Ginger, fresh' },
  coriander: { src: 'ifct', code: 'G009', label: 'Coriander leaves (hara dhania)' },
  mint: { src: 'ifct', code: 'G016', label: 'Mint leaves (podina)' },
  carrot: { src: 'ifct', code: 'F003', label: 'Carrot, red (desi gajar)' },
  spinach: { src: 'ifct', code: 'C033', label: 'Spinach (palak)' },
  'mustard-greens': { src: 'ifct', code: 'C026', label: 'Mustard leaves (sarson)' },
  capsicum: { src: 'ifct', code: 'D033', label: 'Capsicum, green' },
  'bottle-gourd': { src: 'ifct', code: 'D007', label: 'Bottle gourd (lauki/ghiya)' },
  cucumber: { src: 'ifct', code: 'D043', label: 'Cucumber' },

  // ---- spices (IFCT 2017) ----
  'chilli-powder': { src: 'ifct', code: 'G022', label: 'Chillies, red, dry (lal mirch)' },
  turmeric: { src: 'ifct', code: 'G033', label: 'Turmeric powder (haldi)' },
  'coriander-powder': { src: 'ifct', code: 'G024', label: 'Coriander seeds (dhania powder)' },
  cumin: { src: 'ifct', code: 'G025', label: 'Cumin seeds (zeera)' },
  'black-pepper': { src: 'ifct', code: 'G031', label: 'Pepper, black' },
  'garam-masala': { src: 'ifct', code: 'G025', label: 'Garam masala (cumin seed used as proxy; ≤1% of any recipe)' },
  cardamom: { src: 'ifct', code: 'G020', label: 'Cardamom, green' },
  ajwain: { src: 'ifct', code: 'G029', label: 'Omum (ajwain)' },
  fenugreek: { src: 'ifct', code: 'G026', label: 'Fenugreek seeds (methi dana)' },

  // ---- dairy ----
  'milk-whole': { src: 'fdc', code: 171265, label: 'Milk, whole cow 3.25% (packaged full-cream)' },
  'milk-buffalo': { src: 'fdc', code: 171280, label: 'Milk, buffalo, fluid (loose doodh at dhabas)' },
  yogurt: { src: 'fdc', code: 171284, label: 'Yogurt (dahi), plain, whole milk' },
  khoya: { src: 'ifct', code: 'L004', label: 'Khoa (khoya)' },
  cream: { src: 'fdc', code: 170859, label: 'Cream, heavy (malai)' },
  'condensed-milk': { src: 'fdc', code: 171275, label: 'Milk, condensed, sweetened' },
  'milk-powder': { src: 'fdc', code: 170876, label: 'Milk powder, whole' },

  // ---- meat and eggs (raw) ----
  'chicken-meat': { src: 'fdc', code: 171052, label: 'Chicken, broiler, meat only, raw (skinless)' },
  'chicken-leg-meat': { src: 'fdc', code: 173619, label: 'Chicken, broiler, leg, meat only, raw' },
  'beef-mince-80': { src: 'fdc', code: 174036, label: 'Beef mince 80% lean / 20% fat, raw' },
  'beef-mince-90': { src: 'fdc', code: 174030, label: 'Beef mince 90% lean / 10% fat, raw' },
  'beef-stew': { src: 'fdc', code: 171206, label: 'Beef, chuck for stew, lean and fat, raw' },
  'beef-shank': { src: 'fdc', code: 169441, label: 'Beef, shank, lean, raw (nalli gosht)' },
  goat: { src: 'fdc', code: 175303, label: 'Goat meat, raw (mutton, bakra)' },
  egg: { src: 'fdc', code: 171287, label: 'Egg, whole, raw' },
  'egg-yolk': { src: 'fdc', code: 172184, label: 'Egg yolk, raw' },
  sesame: { src: 'ifct', code: 'H011', label: 'Sesame (til), white' },

  // ---- sugar, nuts, fruit, other ----
  sugar: { src: 'fdc', code: 169655, label: 'Sugar, granulated (cheeni)' },
  'tea-brewed': { src: 'fdc', code: 173227, label: 'Tea, black, brewed (patti boiled in water)' },
  salt: { src: 'fdc', code: 173468, label: 'Salt' },
  'lemon-juice': { src: 'fdc', code: 167747, label: 'Lemon juice' },
  almonds: { src: 'fdc', code: 170567, label: 'Almonds (badam)' },
  pistachio: { src: 'ifct', code: 'H018', label: 'Pistachio (pista)' },
  cashew: { src: 'ifct', code: 'H005', label: 'Cashew (kaju)' },
  'coconut-desiccated': { src: 'fdc', code: 170170, label: 'Coconut, desiccated, unsweetened' },
  raisins: { src: 'fdc', code: 168165, label: 'Raisins (kishmish)' },
  dates: { src: 'ifct', code: 'E017', label: 'Dates, dry (chuwaray/khajoor)' },
  banana: { src: 'fdc', code: 173944, label: 'Banana' },
  apple: { src: 'ifct', code: 'E001', label: 'Apple' },
  guava: { src: 'ifct', code: 'E028', label: 'Guava, white flesh' },
  kinnow: { src: 'fdc', code: 169105, label: 'Tangerine/mandarin (kinnow)' },
  water: { src: 'fixed', label: 'Water', values: { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugars: 0, satFat: 0, sodiumMg: 0, water: 100 } },
  cola: { src: 'fdc', code: 174852, label: 'Cola, regular' },

  // ---- product labels ----
  'rooh-afza-syrup': {
    src: 'label',
    label: 'Hamdard Rooh Afza syrup (Pakistan, GS1 896…)',
    url: 'https://world.openfoodfacts.org/product/8964000122075/hamdard-rooh-afza',
    date: '2026-10-13',
    note: 'Open Food Facts transcription of the Hamdard Pakistan label, per 100 ml: 307 kcal, carbohydrate 77 g, sugars 77 g, fat 0, protein 0, salt 0.06 g. Stored here per 100 ml; recipes give it in ml.',
    perMl: true,
    values: { kcal: 307, protein: 0, carbs: 77, fat: 0, fiber: 0, sugars: 77, satFat: 0, sodiumMg: 24, water: null },
  },
};
