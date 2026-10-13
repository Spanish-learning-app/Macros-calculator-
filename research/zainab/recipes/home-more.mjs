// Recipe sheets: cholay (home) and halwa-puri chanay (street), kadhi pakora, anda curry.
import { M, ASSUMED as A } from '../measures.mjs';
import { C } from '../conventions.mjs';

// Cooked chickpeas are entered as boiled, drained chickpeas (FDC 173757; 1 cup = 164 g). A 15-oz can
// drains to about 1½ cups (≈ 246 g) — assumption used to convert "2 cans".
const CAN_DRAINED = 246;
const cholaySources = [
  { ref: 'TfT-chana-masala', url: 'https://www.teaforturmeric.com/chana-masala/', used: '¼ cup oil; cumin seeds; 1 medium onion golden 7–8 min; 5 garlic; 1" ginger; green chilli; 2 tsp coriander, 1 tsp cumin, paprika, turmeric, chilli; 2 medium tomatoes; 2 × 15-oz cans chickpeas; 1¼ tsp salt; garam masala; lemon; cilantro.' },
  { ref: 'F&S-aloo-chholay', url: 'https://www.flourandspiceblog.com/aaloo-chholaychana-or-potato-and-chickpea-curry/', used: '¼ cup oil; 2 cups cooked chickpeas; 1 cup potatoes (130–150 g); 1 onion; 2 tomatoes (120–140 g); ginger, garlic; 1½–2 tsp salt; spices; 1 cup hot water, covered simmer 15 min.' },
  { ref: 'F&S-puri-chole', url: 'https://www.flourandspiceblog.com/puri-chole-nashta-recipe/', used: 'Halwa-puri style chanay: 1 onion (100 g); 1 can (19 oz) chickpeas; teabag; kalonji, mustard, cumin, saunf; spices; 1½ cups hot water simmered 15 min, some chickpeas mashed, water to consistency (oil not listed in the card).' },
];
const cholay = (fat) => [
  ['chickpea-kabuli-boiled', 2 * CAN_DRAINED, 'TfT 2 cans drained; F&S 2 cups (328 g)'],
  ...fat,
  ['onion', 110, '1 medium (TfT, F&S)'],
  ['tomato', 190, 'TfT 2 medium (246 g); F&S 120–140 g'],
  ['potato', 70, 'F&S 130–150 g; TfT none'],
  ['garlic', 15, ''],
  ['ginger', 10, ''],
  ['green-chilli', 2 * A.hariMirch, ''],
  ['coriander-powder', 2 * M.tspCoriander, ''],
  ['cumin', 2 * M.tspCumin, ''],
  ['chilli-powder', M.tspChilli, ''],
  ['turmeric', M.tspTurmeric / 3, ''],
  ['salt', 9, ''],
  ['lemon-juice', 5, ''],
  ['coriander', 4, ''],
  ['water', 300, 'F&S 1 cup (aloo chholay) / 1½ cups (puri chole)'],
];
const cholayCooking = {
  method: 'steps',
  steps: [
    { ing: 'onion', frac: C.onionBrown, why: 'onion golden 7–8 min' },
    { ing: 'tomato', frac: C.tomatoBhuna, why: 'tomatoes cooked down with the spices' },
    { ing: 'water', frac: C.simmerCovered30 / 2, why: 'covered simmer 15 min (C.simmerCovered30, prorated)' },
  ],
};

export default [
  {
    id: 'cholay-home',
    dish: 'Cholay (chickpea curry), home style',
    sources: cholaySources.slice(0, 2),
    fatBasis: 'Both home references use ¼ cup oil (54.5 g) for about 330–490 g cooked chickpeas → 60 g for 492 g.',
    ingredients: cholay([['oil-cooking', 60, '']]),
    addedFat: ['oil-cooking'],
    cooking: cholayCooking,
  },
  {
    id: 'cholay-halwa-puri',
    dish: 'Chanay, halwa-puri shop style (street)',
    sources: cholaySources,
    fatBasis: 'Street/halwa-puri chanay: 110 g oil for 492 g cooked chickpeas (≈ 1.8× the home load, inside the Lab\'s 12–20% restaurant curry range); F&S\'s card lists no oil quantity.',
    ingredients: cholay([['oil-palm', 110, '']]),
    addedFat: ['oil-palm'],
    cooking: cholayCooking,
  },
  {
    id: 'kadhi-pakora-home',
    dish: 'Kadhi pakora, home style',
    sources: [
      { ref: 'TfT-kadhi', url: 'https://www.teaforturmeric.com/kadhi-pakora/', used: 'Kadhi: 1 cup yogurt, ½ cup besan, 4½ cups water; ¼ cup oil; ½ onion; 4 garlic; ¾" ginger; spices; 2 tsp salt; simmered 1½ h partially covered. Pakoras: ½ small onion, ½ small potato, chilli, methi, ½ cup + 2 tbsp besan, ¼–⅓ cup water, deep-fried. Tarka: 2 tbsp ghee, 8 dried chillies, cumin.' },
      { ref: 'F&S-karhi', url: 'https://www.flourandspiceblog.com/kadhi-pakora-or-karhi-recipe-pakistani/', used: 'Karhi: ½ cup besan, 1½ cups yogurt, 3 tbsp oil, 5 cups water, spices, 1.5 tsp salt; simmered 45 min. Pakoras: 1½ cups besan, onion, chillies, baking powder, ~¾ cup water, deep-fried. Tarka: ⅓ cup oil, curry leaves, cumin, red chillies.' },
      { ref: 'CoFID-pakora', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid', used: 'CoFID 2021 15-620 pakora (takeaway, analysed): water 43.2, fat 22.0 g/100 g — used to set the pakoras\' oil uptake (≈ 54 g oil per 98 g besan batter).' },
    ],
    fatBasis: 'Kadhi base oil: TfT 54.5 g, F&S 41 g → 48 g. Tarka: TfT 2 tbsp ghee (25.6 g), F&S ⅓ cup oil (73 g) → 49 g (25 g ghee + 24 g oil). Pakora frying oil taken up: 54 g, from the CoFID 15-620 composition (fried pakora at 43.2% water and 22% fat).',
    ingredients: [
      ['yogurt', 300, 'TfT 1 cup (245 g), F&S 1½ cups (368 g)'],
      ['besan', 46, '½ cup (both)'],
      ['water', 1125, 'TfT 4½ cups, F&S 5 cups'],
      ['oil-cooking', 48 + 24, 'base 48 g + tarka 24 g'],
      ['ghee-desi', 25, 'tarka'],
      ['onion', 55, '½ onion (base)'],
      ['garlic', 12, ''],
      ['ginger', 7, ''],
      ['coriander-powder', 0.75 * M.tspCoriander, ''],
      ['chilli-powder', M.tspChilli, ''],
      ['turmeric', 0.6 * M.tspTurmeric, ''],
      ['cumin', 1.5 * M.tspCumin, ''],
      ['salt', 12, ''],
      ['besan', 98, 'pakoras: TfT 57.5 g, F&S 138 g'],
      ['onion', 50, 'pakoras'],
      ['potato', 40, 'pakoras (TfT ½ small potato)'],
      ['water', 110, 'pakora batter water'],
      ['oil-palm', 54, 'pakora frying oil taken up (CoFID 15-620 composition)'],
    ],
    addedFat: ['oil-cooking', 'ghee-desi', 'oil-palm'],
    cooking: {
      method: 'steps',
      steps: [
        { grams: 1125 * 0.35, why: 'kadhi simmered 45–90 min partially covered until it thickens: 35% of the kadhi water (assumption; TfT notes the water "may vary depending on how much it thickens")' },
        { grams: 110 * 0.8, why: 'pakora batter water fried off: fried pakora at CoFID 15-620 water (43.2%) leaves ≈ 20% of the batter water' },
        { ing: 'onion', frac: C.onionBrown, why: 'base onion golden brown' },
      ],
    },
  },
  {
    id: 'anda-curry-home',
    dish: 'Anda curry (aloo anday ka salan), home style',
    sources: [
      { ref: 'F&S-anday-aloo', url: 'https://www.flourandspiceblog.com/anday-aalu-ka-salan-or-egg-curry/', used: '⅓ cup oil; 2 small-medium onions; 1 tbsp each ginger and garlic paste; 1½ tsp salt; 1½ tsp chilli; 1 tsp turmeric; 1 tomato; 2 medium potatoes; 2 cups hot water; curry leaves; 4–5 green chillies; ½ cup cilantro; ½ lemon; 6 boiled eggs (lightly fried).' },
      { ref: 'FatimaCooks-aloo-anday', url: 'https://fatimacooks.net/aloo-anday-ka-salan-aloo-anda-shorba-egg-and-potato-curry/', used: '⅓ cup (85 ml) oil; onion; garlic; tomatoes; cumin, coriander, chilli, turmeric; 2 potatoes; 4 eggs; ~1½ cups water simmered until the potatoes are tender (search summary).' },
    ],
    fatBasis: 'F&S ⅓ cup (73 g) per 6 eggs; Fatima Cooks 85 ml (78 g) per 4 eggs → 117 g per 6 eggs; standard 95 g per 6 eggs (mean).',
    ingredients: [
      ['egg-boiled', 6 * M.eggLarge, '6 boiled eggs (F&S); FC 4'],
      ['oil-cooking', 95, ''],
      ['onion', 180, '2 small-medium onions'],
      ['tomato', 150, 'F&S 1 tomato; FC tomatoes'],
      ['potato', 400, '2 medium potatoes (both)'],
      ['garlic', 15, ''],
      ['ginger', 15, ''],
      ['green-chilli', 4 * A.hariMirch, ''],
      ['chilli-powder', 1.5 * M.tspChilli, ''],
      ['turmeric', M.tspTurmeric, ''],
      ['coriander-powder', M.tspCoriander, ''],
      ['salt', 9, ''],
      ['coriander', 8, ''],
      ['lemon-juice', 15, ''],
      ['water', 474, 'F&S 2 cups; FC ~1½ cups'],
    ],
    addedFat: ['oil-cooking'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'onion', frac: C.onionBrown, why: 'onions browned' },
        { ing: 'tomato', frac: C.tomatoBhuna, why: 'masala cooked until the oil separates' },
        { ing: 'water', frac: C.simmerCovered30 * 0.7 + 0.1, why: 'simmered ~20 min covered until the potatoes are tender, then reduced "till the oil rises" (C.simmerCovered30 prorated + 0.1, assumption)' },
      ],
    },
  },
];
