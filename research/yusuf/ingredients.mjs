// Ingredient registry for the halal lunch-box library (Yusuf Benali, Nutrition Lab).
// Every entry names WHERE its numbers come from. No nutrient value is typed here: fetch.mjs resolves
// each entry from its source into research/yusuf/ingredients.json (per 100 g; carbs = available
// carbohydrate, fibre excluded), and calc.mjs reads that file.
//
// src: 'fdc'   → USDA FoodData Central via research/cache/usda/index.json (the research/usda.mjs index)
//      'off'   → Open Food Facts product (label values typed by OFF contributors), via research/yusuf/off.mjs.
//                Cross-checked against the Mercadona product page (ingredients) on the date given.
//                fiberFrom / zeroFiber: how a missing label fibre value is filled (stated per entry).
//      'ifct'  → IFCT 2017 Table 1, read from research/zainab/ifct-table1.json (Zainab's extract of Table 1)
//      'analogue' → another entry's values, with the reason
//      'db'    → a Lab food record in app/data (foodId), read at build time; used for the market foods Javier
//                Morales added on 2026-10-14 (labels read that day, USDA/BEDCA otherwise). Its citation is kept.
//
// buy: where the Boss buys it. shop 'mercadona' = product id at tienda.mercadona.es (warehouse bcn1,
//      Barcelona 08001), priced live by calc.mjs from the cached product list. shop 'butcher' = halal
//      butcher (carnicería halal); priced from the halal price table in prices.mjs. shop 'desi' = the
//      Pakistani/Moroccan grocery shelf at or next to the halal butcher (Raval). `perUnitG` = edible grams
//      of one purchase unit when the shop prices per piece. `snap: 'YYYY-MM-DD'` = priced from the dated
//      Mercadona snapshot (research/cache/yusuf/mercadona-snap/<date>/) instead of the Sprint 1 cache.
// halal: 'halal' unless a label check says otherwise; labelCheck says what was checked.

export default {
  // ---------------------------------------------------------------- meat (halal butcher)
  'chicken-thigh': { src: 'fdc', code: 2646171, label: 'Chicken thigh, boneless, skinless, raw (contramuslo deshuesado sin piel; USDA Foundation 2646171, the same food as the Lab record intl-chicken-thigh-raw; was SR Legacy 173627 until 2026-10-14, Ayesha\'s review)', buy: { shop: 'butcher', item: 'chicken-thigh-boneless' } },
  'chicken-breast': { src: 'fdc', code: 171077, label: 'Chicken breast, boneless, skinless, raw (pechuga)', buy: { shop: 'butcher', item: 'chicken-breast' } },
  'chicken-mince': { src: 'fdc', code: 171116, label: 'Chicken mince, raw (carne picada de pollo)', buy: { shop: 'butcher', item: 'chicken-mince' } },
  'beef-cubes': { src: 'fdc', code: 171206, label: 'Beef, boneless stewing cubes (chuck for stew, lean and fat, raw; carne sin hueso de ternera a tacos)', buy: { shop: 'butcher', item: 'beef-boneless' } },
  'beef-mince': { src: 'fdc', code: 174030, label: 'Lean beef mince, 90% lean / 10% fat, raw (carne picada de ternera magra)', buy: { shop: 'butcher', item: 'beef-mince' } },

  // ---------------------------------------------------------------- dairy, eggs
  'yogurt-whole': { src: 'off', code: '8480000223135', zeroFiber: 'plain yogurt: milk and cultures only, no fibre-containing ingredient', label: 'Yogur natural Hacendado (whole milk)', buy: { shop: 'mercadona', id: 22313 }, labelCheck: 'Mercadona 22313, 2026-10-13: leche entera, leche desnatada en polvo, fermentos. No gelatina.' },
  'yogurt-greek-light': { src: 'off', code: '8480000213587', zeroFiber: 'yogurt: milk, milk powder, milk proteins and cultures only', label: 'Yogur griego natural ligero Hacendado 2% MG', buy: { shop: 'mercadona', id: 21358 }, labelCheck: 'Mercadona 21358, 2026-10-13: leche parcialmente desnatada, leche en polvo, proteínas de la leche, fermentos. No gelatina.' },
  'protein-yogurt': { src: 'off', code: '8480000212566', label: 'Postre lácteo natural +Proteínas 10 g 0% MG (Mercadona skyr-style high-protein pot)', buy: { shop: 'mercadona', id: 21256 }, labelCheck: 'Mercadona 21256, 2026-10-13: leche desnatada pasteurizada, fermentos lácticos. No gelatina, no E471.' },
  'milk-semi': { src: 'off', code: '8402001002106', zeroFiber: 'milk: semi-skimmed cow milk only', label: 'Leche semidesnatada Hacendado (UHT, 1.55% fat)', buy: { shop: 'mercadona', id: 10382, densityGPerMl: 1.03 }, labelCheck: 'Mercadona 10382, 2026-10-14: leche semidesnatada de vaca (only ingredient).' },
  egg: { src: 'fdc', code: 171287, label: 'Egg, whole, raw (edible part; 1 egg = 50 g, USDA large)', buy: { shop: 'mercadona', id: 31504, perUnitG: 50, units: 12 } },
  'egg-white': { src: 'off', code: '8411384100941', label: 'Claras de huevo líquidas pasteurizadas (Mercadona, made by Huevos Güilén)', buy: { shop: 'mercadona', id: 31312, densityGPerMl: 1.03 }, labelCheck: 'Mercadona 31312, 2026-10-13: clara de huevo pasteurizada, conservante E202.' },

  // ---------------------------------------------------------------- grains, bread
  'rice-basmati': { src: 'fdc', code: 169756, label: 'White long-grain rice, raw (USDA; used for Hacendado basmati — label 355 kcal, P 9, C 78, F 0.6 per 100 g, read 2026-10-13)', buy: { shop: 'mercadona', id: 5002 } },
  'rice-brown': { src: 'fdc', code: 169703, label: 'Brown long-grain rice, raw (arroz integral largo)', buy: { shop: 'mercadona', id: 5184 } },
  couscous: { src: 'off', code: '8011033012108', label: 'Cous cous mediano Hacendado (made by Bia SpA), dry', buy: { shop: 'mercadona', id: 9395 }, labelCheck: 'Mercadona 9395, 2026-10-13: sémola de trigo duro, agua.' },
  bulgur: { src: 'fdc', code: 2710820, label: 'Bulgur, dry (USDA Foundation)', buy: { shop: 'desi', item: 'bulgur' } },
  oats: { src: 'fdc', code: 173904, label: 'Rolled oats, dry (copos de avena)', buy: { shop: 'mercadona', id: 86341 }, labelCheck: 'Mercadona 86341 Copos de avena Brüggen, 2026-10-14: single-ingredient oat flakes.' },
  atta: { src: 'ifct', code: 'A019', label: 'Wholemeal wheat flour, atta (harina integral de trigo; chakki atta from the desi shop works the same)', buy: { shop: 'mercadona', id: 29134 } },
  'pasta-wholewheat': { src: 'off', code: '8402001010194', label: 'Macarrón rayado integral Hacendado (wholewheat penne), dry', buy: { shop: 'mercadona', id: 35777 }, labelCheck: 'Mercadona 35777, 2026-10-13: sémola integral de trigo duro.' },
  pita: { src: 'off', code: '5036034406834', label: 'Pan de pita Mission (5 × 60 g)', buy: { shop: 'mercadona', id: 14378 }, labelCheck: 'Mercadona 14378, 2026-10-13: harina de trigo enriquecida, agua, levadura, sal, gluten, aceite de nabina, propionato cálcico. No E471, no manteca.' },
  breadcrumbs: { src: 'fdc', code: 174928, label: 'Breadcrumbs, dry, plain (USDA; Hacendado pan rallado label 369 kcal, P 9.6, C 78.1, F 1.3 per 100 g, no fibre declared)', buy: { shop: 'mercadona', id: 82219 }, labelCheck: 'Mercadona 82219, 2026-10-13: harina de trigo, agua, sal, levadura. No manteca.' },

  // ---------------------------------------------------------------- legumes
  'chickpeas-jar': { src: 'fdc', code: 173801, label: 'Chickpeas, canned/jarred, drained and rinsed (Hacendado garbanzo cocido, 570 g jar = 400 g drained)', buy: { shop: 'mercadona', id: 26029 }, labelCheck: 'Mercadona 26029, 2026-10-13: garbanzos, agua, sal, disulfito sódico (E223), E385.' },
  'chana-dal': { src: 'ifct', code: 'B001', label: 'Chana dal (Bengal gram dal), dry', buy: { shop: 'desi', item: 'chana-dal' } },
  'lentils-red': { src: 'fdc', code: 174284, label: 'Red lentils (masoor dal), dry', buy: { shop: 'desi', item: 'masoor-dal' } },
  hummus: { src: 'off', code: '8432089108018', label: 'Hummus de garbanzos Hacendado receta clásica (made by Simply Greek)', buy: { shop: 'mercadona', id: 80858 }, labelCheck: 'Mercadona 80858, 2026-10-13: garbanzos, aceite de girasol, agua, pasta de sésamo, limón, aceite de oliva, ajo, sal, E330 y E270 "de origen vegetal", E202. No E471, no gelatina.' },

  // ---------------------------------------------------------------- fish
  tuna: { src: 'off', code: '8480000180186', label: 'Atún claro al natural Hacendado, drained (6 × 60 g drained)', buy: { shop: 'mercadona', id: 18018 }, labelCheck: 'Mercadona 18018, 2026-10-13: atún claro, agua, sal.' },

  // ---------------------------------------------------------------- fats
  'oil-olive': { src: 'fdc', code: 171413, label: 'Olive oil', buy: { shop: 'mercadona', id: 4240, densityGPerMl: 0.91 } },
  'oil-sunflower': { src: 'fdc', code: 171025, label: 'Sunflower oil', buy: { shop: 'mercadona', id: 4040, densityGPerMl: 0.91 } },

  // ---------------------------------------------------------------- vegetables, fruit, herbs (Mercadona fresh)
  onion: { src: 'fdc', code: 170000, label: 'Onion, raw', buy: { shop: 'mercadona', id: 69089 } },
  'onion-red': { src: 'fdc', code: 790577, label: 'Red onion, raw (cebolla morada)', buy: { shop: 'mercadona', id: 69153 } },
  tomato: { src: 'fdc', code: 170457, label: 'Tomato, raw', buy: { shop: 'mercadona', id: 69971 } },
  'tomato-cherry': { src: 'fdc', code: 170457, label: 'Cherry tomatoes, raw (USDA tomato, red, ripe)', buy: { shop: 'mercadona', id: 69990 } },
  'tomato-crushed': { src: 'off', code: '8402001001543', fiberFrom: 170501, label: 'Tomate triturado Hacendado (fibre not on the label: USDA 170501 crushed canned tomatoes)', buy: { shop: 'mercadona', id: 16043 }, labelCheck: 'Mercadona 16043, 2026-10-13: tomate, sal, azúcar, ácido cítrico.' },
  garlic: { src: 'fdc', code: 169230, label: 'Garlic, raw (1 clove = 3 g, USDA)', buy: { shop: 'mercadona', id: 69297 } },
  ginger: { src: 'fdc', code: 169231, label: 'Ginger root, raw', buy: { shop: 'mercadona', id: 69289 } },
  'green-chilli': { src: 'fdc', code: 170497, label: 'Green chilli, raw', buy: { shop: 'desi', item: 'green-chilli' } },
  coriander: { src: 'fdc', code: 169997, label: 'Fresh coriander (cilantro) leaves', buy: { shop: 'mercadona', id: 69690 } },
  mint: { src: 'fdc', code: 173475, label: 'Fresh mint (hierbabuena = spearmint)', buy: { shop: 'mercadona', id: 68037 } },
  parsley: { src: 'fdc', code: 170416, label: 'Fresh parsley', buy: { shop: 'mercadona', id: 69701 } },
  cucumber: { src: 'fdc', code: 168409, label: 'Cucumber, with peel, raw', buy: { shop: 'mercadona', id: 69584 } },
  'lemon-juice': { src: 'fdc', code: 167747, label: 'Lemon juice (1 lemon yields 48 g, USDA)', buy: { shop: 'mercadona', id: 4903, densityGPerMl: 1.03 } },
  'green-beans': { src: 'fdc', code: 169962, label: 'Green beans, frozen, raw (judía verde ultracongelada)', buy: { shop: 'mercadona', id: 61282 } },
  peas: { src: 'fdc', code: 170016, label: 'Green peas, frozen, raw (guisante ultracongelado)', buy: { shop: 'mercadona', id: 61215 } },
  courgette: { src: 'fdc', code: 169291, label: 'Courgette (zucchini), with skin, raw', buy: { shop: 'mercadona', id: 69338 } },
  carrot: { src: 'fdc', code: 170393, label: 'Carrot, raw', buy: { shop: 'mercadona', id: 69586 } },
  'pepper-red': { src: 'fdc', code: 170108, label: 'Red bell pepper, raw', buy: { shop: 'mercadona', id: 69310 } },
  'pepper-green': { src: 'fdc', code: 170427, label: 'Green bell pepper, raw (pimiento verde)', buy: { shop: 'mercadona', id: 69320 } },
  spinach: { src: 'fdc', code: 168462, label: 'Baby spinach, raw', buy: { shop: 'mercadona', id: 69984 } },
  lettuce: { src: 'fdc', code: 169247, label: 'Romaine lettuce, raw', buy: { shop: 'mercadona', id: 69435 } },
  potato: { src: 'fdc', code: 170028, label: 'Potato, raw (USDA white, flesh and skin; used peeled)', buy: { shop: 'mercadona', id: 69166 } },
  banana: { src: 'fdc', code: 173944, label: 'Banana, raw, peeled (Plátano de Canarias; 1 small = 101 g edible, USDA)', buy: { shop: 'mercadona', id: 3819, perUnitG: 101, units: 1 } },
  'spinach-frozen': { src: 'fdc', code: 169287, label: 'Spinach, frozen, chopped (espinaca en porciones ultracongelada)', buy: { shop: 'mercadona', id: 61279 } },
  chia: { src: 'fdc', code: 170554, label: 'Chia seeds, dry', buy: { shop: 'mercadona', id: 5464 } },
  walnuts: { src: 'fdc', code: 170187, label: 'Walnuts, shelled (USDA; the OFF entry for Hacendado nuez shows 21 g protein, which looks mistyped)', buy: { shop: 'mercadona', id: 34024 } },

  // ---------------------------------------------------------------- market foods (no-cook preps, 2026-10-14)
  // Values from Javier Morales's records (src 'db'); prices from the 2026-10-14 Mercadona snapshot.
  'queso-batido': { src: 'db', foodId: 'es-queso-fresco-batido', label: 'Queso fresco batido desnatado 0% Hacendado (whipped fresh cheese)', buy: { shop: 'mercadona', id: 51071, snap: '2026-10-14' }, labelCheck: 'Mercadona 51071 (Javier, 2026-10-14): leche desnatada pasteurizada, fermentos lácticos. No cuajo, no gelatina.' },
  'burgos-0': { src: 'db', foodId: 'es-queso-burgos-0', label: 'Queso fresco de Burgos desnatado 0% Hacendado (4 × 62.5 g tubs)', buy: { shop: 'mercadona', id: 52409, snap: '2026-10-14' }, labelCheck: 'Mercadona 52409 (Javier, 2026-10-14): leche desnatada pasteurizada, sal, aroma, cuajo microbiano (not animal).' },
  feta: { src: 'db', foodId: 'intl-feta', label: 'Queso feta Hacendado en dados (370 g tub, 150 g drained)', buy: { shop: 'mercadona', id: 51197, snap: '2026-10-14' }, labelCheck: 'Mercadona 51197 (Javier, 2026-10-14): leche de oveja y cabra, sal, fermentos, cuajo (origin not stated) → halal check.' },
  'salmon-can': { src: 'db', foodId: 'intl-salmon-canned', label: 'Salmón al natural Hacendado (3 × 80 g cans)', buy: { shop: 'mercadona', id: 18817, snap: '2026-10-14', perUnitG: 80, units: 3 } },
  mackerel: { src: 'db', foodId: 'intl-mackerel-olive-oil', label: 'Filetes de caballa en aceite de oliva Hacendado (2 × 85 g drained)', buy: { shop: 'mercadona', id: 13628, snap: '2026-10-14', perUnitG: 85, units: 2 }, labelCheck: 'Mercadona 13628, 2026-10-14: caballa del sur (71%), aceite de oliva (28%), sal.' },
  'lentils-jar': { src: 'db', foodId: 'es-lentejas-cocidas', label: 'Lenteja cocida Hacendado (570 g jar = 400 g drained), drained and rinsed', buy: { shop: 'mercadona', id: 26030, snap: '2026-10-14' } },
  'rice-cup-brown': { src: 'db', foodId: 'intl-rice-cup-brown', label: 'Arroz cocido integral Sabroz (microwave cup, 2 × 125 g)', buy: { shop: 'mercadona', id: 22281, snap: '2026-10-14' } },
  'rice-cup-basmati': { src: 'db', foodId: 'intl-rice-cup-basmati', label: 'Arroz cocido basmati Sabroz (microwave cup, 2 × 125 g)', buy: { shop: 'mercadona', id: 22280, snap: '2026-10-14' } },
  salmorejo: { src: 'db', foodId: 'es-salmorejo-envasado', label: 'Salmorejo al estilo cordobés Hacendado (1 l brik)', buy: { shop: 'mercadona', id: 39902, snap: '2026-10-14', densityGPerMl: 1.03 }, labelCheck: 'Mercadona 39902 (Javier, 2026-10-14): tomate, agua, aceite de oliva virgen extra, pan rallado, pimiento, sal, vinagre de Jerez, ajo. No jamón. Vinegar is allowed by the Lab (NUTRITION.md §3).' },
  picos: { src: 'db', foodId: 'es-picos-integrales', label: 'Picos 100% integral Hacendado (wholemeal breadsticks)', buy: { shop: 'mercadona', id: 86215, snap: '2026-10-14' }, labelCheck: 'Mercadona 86215 (Javier, 2026-10-14): harina integral de trigo 87%, aceite de girasol alto oleico, levadura, sal, E300. No manteca.' },
  'pan-barra': { src: 'db', foodId: 'es-pan-barra', label: 'Barra de pan from a bakery (forn): flour, water, salt, yeast', buy: { shop: 'bakery', item: 'barra' }, labelCheck: 'Mercadona\'s own barras (83202.1, 17912.1) list emulgente E-472e with no origin (2026-10-14): buy at a forn and ask for a barra without mejorante, or treat it as check.' },
  'egg-boiled': { src: 'db', foodId: 'intl-egg-boiled', label: 'Egg, hard-boiled (1 large egg = 50 g edible)', buy: { shop: 'mercadona', id: 31504, snap: '2026-10-14', perUnitG: 50, units: 12 } },
  kiwi: { src: 'db', foodId: 'intl-kiwi', label: 'Kiwi verde (1 = 69 g edible)', buy: { shop: 'mercadona', id: 3820, snap: '2026-10-14' } },
  orange: { src: 'db', foodId: 'intl-orange', label: 'Naranja de mesa (1 = 131 g edible)', buy: { shop: 'mercadona', id: 3235, snap: '2026-10-14' } },
  mandarin: { src: 'db', foodId: 'intl-kinnow', label: 'Mandarina / clementina (1 = 88 g edible)', buy: { shop: 'mercadona', id: 3238, snap: '2026-10-14' } },
  apple: { src: 'db', foodId: 'intl-apple', label: 'Apple, with skin (manzana Golden)', buy: { shop: 'mercadona', id: 3028, snap: '2026-10-14' } },
  pear: { src: 'db', foodId: 'intl-pear', label: 'Pera Conferencia', buy: { shop: 'mercadona', id: 3119, snap: '2026-10-14' } },
  pomegranate: { src: 'db', foodId: 'intl-pomegranate', label: 'Granada, arils (1 fruit = 282 g arils)', buy: { shop: 'mercadona', id: 3915, snap: '2026-10-14', perUnitG: 282, units: 1 } },
  blueberries: { src: 'db', foodId: 'intl-blueberries', label: 'Arándanos (225 g tub)', buy: { shop: 'mercadona', id: 5501, snap: '2026-10-14' } },
  rocket: { src: 'db', foodId: 'intl-rocket', label: 'Rúcula lavada (50 g bag)', buy: { shop: 'mercadona', id: 69753, snap: '2026-10-14' } },
  'leaves-mixed': { src: 'db', foodId: 'intl-salad-leaves-mixed', label: 'Ensalada mezcla brotes tiernos (100 g bag)', buy: { shop: 'mercadona', id: 69757, snap: '2026-10-14' } },
  avocado: { src: 'db', foodId: 'intl-avocado', label: 'Aguacate, flesh (½ avocado = 100 g)', buy: { shop: 'mercadona', id: 3830, snap: '2026-10-14', perUnitG: 201, units: 1 } },
  // Low-cook week v2 and the budget week (2026-10-15): canned sardines, a cheap protein (Javier's record, pack 2 × 84 g drained).
  sardines: { src: 'db', foodId: 'intl-sardines-olive-oil', label: 'Sardinas en aceite de oliva Hacendado (2 × 84 g drained)', buy: { shop: 'mercadona', id: 18225, snap: '2026-10-14', perUnitG: 84, units: 2 }, labelCheck: 'Mercadona 18225 (Javier, 2026-10-14): sardina 72 %, aceite de oliva 27 %, sal.' },
  almonds: { src: 'db', foodId: 'intl-almonds', label: 'Almendra natural Hacendado (200 g)', buy: { shop: 'mercadona', id: 34865, snap: '2026-10-14' } },

  // ---------------------------------------------------------------- Sprint 3 variety preps (2026-10-15)
  // Sandwiches, pastas, bowls, tray bakes. Labels read on tienda.mercadona.es on 2026-10-15 (product pages, Barcelona
  // bcn1); prices from the 2026-10-15 snapshot. Nutrients from USDA or the label (Open Food Facts), as stated.
  'bocadillo-bread': { src: 'off', code: '8480000096647', label: 'Pan de bocadillo Hacendado (3 × 130 g rolls; flour, water, yeast, salt)', buy: { shop: 'mercadona', id: 9664, snap: '2026-10-15', perUnitG: 130, units: 3 }, labelCheck: 'Mercadona 9664 "3 Bocadillos" and 17649 "Bocadillo", 2026-10-15: harina de trigo, agua, levadura, sal. No E471/E472e (the plain barras 83202.1 and 83452 list E-472e of unstated origin).' },
  piquillo: { src: 'fdc', code: 168546, label: 'Pimientos del piquillo, jarred, drained (USDA 168546 sweet red peppers, canned, used for Hacendado piquillo extra; its OFF entry reads 0.29 kcal and is mistyped)', buy: { shop: 'mercadona', id: 16005, snap: '2026-10-15' }, labelCheck: 'Mercadona 16005, 2026-10-15: pimientos del piquillo, agua, azúcar, sal, ácido cítrico, cloruro cálcico.' },
  basil: { src: 'fdc', code: 172232, label: 'Fresh basil (albahaca, 20 g tray)', buy: { shop: 'mercadona', id: 69287, snap: '2026-10-15' } },
  'tomate-frito': { src: 'off', code: '8480000171085', fiberFrom: 170501, label: 'Tomate frito Hacendado (fibre not on the label: USDA 170501 crushed canned tomatoes)', buy: { shop: 'mercadona', id: 17108, snap: '2026-10-15' }, labelCheck: 'Mercadona 17108, 2026-10-15: tomate, aceite refinado de girasol, azúcar, almidón de maíz, sal, cebolla y ajo.' },
  'olives-green': { src: 'fdc', code: 169096, label: 'Green olives, pitted, drained (aceituna manzanilla sin hueso; USDA 169096)', buy: { shop: 'mercadona', id: 33114, snap: '2026-10-15' }, labelCheck: 'Mercadona 33114, 2026-10-15: agua, aceituna manzanilla, sal, ácido cítrico y láctico, ácido ascórbico, sorbato potásico. (The black olives page 52734 showed an anchovy-stuffed ingredient list that day: not used.)' },
  'mozzarella-light': { src: 'off', code: '8480000512307', zeroFiber: 'fresh cheese: milk, salt, citric acid and microbial coagulant only', label: 'Mozzarella fresca light Hacendado (125 g ball, drained)', buy: { shop: 'mercadona', id: 51230, snap: '2026-10-15' }, labelCheck: 'Mercadona 51230, 2026-10-15: leche pasteurizada de vaca, leche desnatada, sal, ácido cítrico, coagulante microbiano (not animal rennet). The full-fat 51050 and the slices 51126 also say coagulante microbiano.' },
  'quinoa-cooked': { src: 'fdc', code: 168917, label: 'Quinoa, cooked (Sabroz quinoa blanca y roja cocida, 2 × 125 g cups; USDA 168917, because the cup label on OFF, 147 kcal with 30 g carbs and 3.9 g fat, does not add up)', buy: { shop: 'mercadona', id: 22278, snap: '2026-10-15' }, labelCheck: 'Mercadona 22278, 2026-10-15: quinoa blanca y roja cocida, aceite de oliva virgen, sal, lecitina de girasol.' },
  'rice-noodles': { src: 'off', code: '8402001011924', label: 'Noodles de arroz Hacendado, dry (rice flour, tapioca starch, salt)', buy: { shop: 'mercadona', id: 35981, snap: '2026-10-15' }, labelCheck: 'Mercadona 35981, 2026-10-15: harina de arroz, almidón de tapioca, sal.' },
  'soy-sauce-halal': { src: 'fdc', code: 174277, label: 'Soy sauce with a halal certificate (shoyu; Asian or desi shop; USDA 174277)', buy: { shop: 'desi', item: 'soy-sauce-halal' }, labelCheck: 'Brewed soy sauce can carry alcohol from fermentation that the label does not list. Mercadona\'s Hacendado 17360 (2026-10-15) lists agua, sal, soja, trigo, azúcar, ácido láctico, goma guar, no alcohol, but no halal certificate: buy a bottle with a halal logo, or treat the dish as check.' },
  'kidney-beans': { src: 'fdc', code: 175243, label: 'Red kidney beans, jarred, drained and rinsed (Alubia roja cocida Hacendado, 570 g jar = 400 g drained; USDA 175243)', buy: { shop: 'mercadona', id: 26000, snap: '2026-10-15' }, labelCheck: 'Mercadona 26000, 2026-10-15: alubia roja, agua, sal, E385.' },
  sweetcorn: { src: 'fdc', code: 169214, label: 'Sweetcorn, canned, drained (Maíz dulce Hacendado 3 × 70 g drained; USDA 169214)', buy: { shop: 'mercadona', id: 16714, snap: '2026-10-15' }, labelCheck: 'Mercadona 16714, 2026-10-15: maíz dulce, agua y sal.' },
  'broccoli-frozen': { src: 'fdc', code: 169968, label: 'Broccoli, frozen (Brócoli Hacendado ultracongelado 1 kg; USDA 169968)', buy: { shop: 'mercadona', id: 61261, snap: '2026-10-15' }, labelCheck: 'Mercadona 61261, 2026-10-15: brócoli.' },
  mushrooms: { src: 'fdc', code: 169251, label: 'White mushrooms, raw (champiñones blancos, 300 g tray)', buy: { shop: 'mercadona', id: 26951, snap: '2026-10-15' } },
  'salmon-fillet': { src: 'off', code: '8480000267498', label: 'Salmon medallions, frozen, raw (Medallones de salmón Hacendado, 4 × 62.5 g; farmed Norwegian Salmo salar)', buy: { shop: 'mercadona', id: 26749, snap: '2026-10-15' }, labelCheck: 'Mercadona 26749, 2026-10-15: salmón 99,2 %, sal.' },
  'mustard-dijon': { src: 'fdc', code: 172234, label: 'Dijon mustard (Mostaza de Dijon Hacendado; USDA 172234 prepared mustard)', buy: { shop: 'mercadona', id: 17228, snap: '2026-10-15' }, labelCheck: 'Mercadona 17228, 2026-10-15: agua, semilla de mostaza, vinagre de alcohol, sal, ácido cítrico, metabisulfito potásico. No wine (vinegar is allowed by the Lab, NUTRITION.md §3).' },
  // Javier Morales's base foods (2026-10-15), used as the source where his record is the product we buy.
  'tortilla-corn': { src: 'db', foodId: 'intl-tortilla-corn', label: 'Tortillas de maíz Hacendado (8 × 26 g)', buy: { shop: 'mercadona', id: 86328, snap: '2026-10-15', perUnitG: 26, units: 8 }, labelCheck: 'Javier, 2026-10-15: corn flour, water, gums, salt, sunflower oil, preservatives; no E471 (the wheat tortillas 80859, 80942 and 80870 list E471 of unstated origin, read 2026-10-15). Glycerine E-422 of unstated origin: check (Ayesha, 2026-10-15); the halal swap is Mission pita.' },
  'salsa-mexicana': { src: 'db', foodId: 'es-salsa-mexicana', label: 'Salsa Mexicana Hacendado (300 g jar, pico de gallo type)', buy: { shop: 'mercadona', id: 16827, snap: '2026-10-15' }, labelCheck: 'Javier, 2026-10-15: wine vinegar only (vinegar, not wine); no alcohol or animal ingredients.' },
  'crema-verduras': { src: 'db', foodId: 'es-crema-verduras-brik', label: 'Crema de verduras Hacendado (500 ml brik = 515 g)', buy: { shop: 'mercadona', id: 60308, snap: '2026-10-15', densityGPerMl: 1.03 }, labelCheck: 'Mercadona 60308, 2026-10-15: agua, hortalizas 43 %, aceite de oliva, especia, almidón, sal. No cream, butter or stock. (Crema de calabaza 13499 has nata and mantequilla; Javier marks crema de calabacín check for whey rennet.)' },
  peanuts: { src: 'fdc', code: 173806, label: 'Peanuts, dry-roasted, no added salt (Cacahuete tostado 0 % sal Hacendado pelado, 200 g)', buy: { shop: 'mercadona', id: 13451, snap: '2026-10-15' } },

  // ---------------------------------------------------------------- spices and seasonings
  salt: { src: 'fdc', code: 173468, label: 'Salt', buy: { shop: 'mercadona', id: 19731 } },
  sugar: { src: 'fdc', code: 169655, label: 'Sugar', buy: { shop: 'mercadona', id: 19897 } },
  cumin: { src: 'fdc', code: 170923, label: 'Cumin (seeds or ground)', buy: { shop: 'mercadona', id: 34120 } },
  'coriander-seed': { src: 'fdc', code: 170922, label: 'Coriander seed (whole or ground)', buy: { shop: 'desi', item: 'coriander-seed' } },
  paprika: { src: 'fdc', code: 171329, label: 'Paprika (pimentón dulce)', buy: { shop: 'mercadona', id: 60573 } },
  turmeric: { src: 'fdc', code: 172231, label: 'Turmeric, ground', buy: { shop: 'mercadona', id: 34163 } },
  'chilli-powder': { src: 'fdc', code: 170932, label: 'Red chilli powder (USDA red or cayenne pepper)', buy: { shop: 'mercadona', id: 37417 } },
  'black-pepper': { src: 'fdc', code: 170931, label: 'Black pepper', buy: { shop: 'mercadona', id: 34171 } },
  cinnamon: { src: 'fdc', code: 171320, label: 'Cinnamon (stick or ground)', buy: { shop: 'mercadona', id: 34177 } },
  cloves: { src: 'fdc', code: 171321, label: 'Cloves', buy: { shop: 'mercadona', id: 34122 } },
  cardamom: { src: 'fdc', code: 170919, label: 'Cardamom (green)', buy: { shop: 'desi', item: 'cardamom' } },
  'bay-leaf': { src: 'fdc', code: 170917, label: 'Bay leaf', buy: { shop: 'mercadona', id: 47994 } },
  oregano: { src: 'fdc', code: 171328, label: 'Oregano, dried', buy: { shop: 'mercadona', id: 5598 } },
  'garam-masala': { src: 'analogue', of: 'curry-powder-usda', why: 'no table entry for garam masala; USDA curry powder is the closest ground-spice blend (both coriander/cumin based). Amounts are 1–2 g per box, under 5 kcal.', label: 'Garam masala (Shan, National or similar; halal-certified packs)', buy: { shop: 'desi', item: 'garam-masala' } },
  'chaat-masala': { src: 'analogue', of: 'curry-powder-usda', why: 'no table entry for chaat masala; USDA curry powder used for macros. Its black salt adds sodium that is not counted.', label: 'Chaat masala', buy: { shop: 'desi', item: 'chaat-masala' } },
  'ras-el-hanout': { src: 'analogue', of: 'curry-powder-usda', why: 'no table entry for ras el hanout; USDA curry powder is the closest ground-spice blend.', label: 'Ras el hanout', buy: { shop: 'desi', item: 'ras-el-hanout' } },
  'curry-powder-usda': { src: 'fdc', code: 170924, label: 'Curry powder (USDA; analogue for spice blends only)', buy: null },
};
