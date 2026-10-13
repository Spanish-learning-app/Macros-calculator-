// Record specs: Pakistani home cooking → app/data/foods-pk-home.js (built by research/zainab/build.mjs).
import { PK, PKV, PKVG, MEAL, D, boneIn, SP, uniq } from './common.mjs';

const BONE_STATE = 'cooked, as served with masala/gravy, edible portion (bones removed)';

export default [
  {
    id: 'pk-chicken-karahi-home',
    recipe: 'chicken-karahi-home',
    name: 'Chicken karahi (home-made)',
    nameUr: 'چکن کڑاہی',
    nameRoman: 'chicken karahi',
    aliases: uniq(SP.karahi, ['chicken karahi', 'chicken karai', 'chicken kadai', 'chicken karhai', 'murgh karahi', 'murg karahi', 'ghar ki karahi', 'karahi chicken', 'کڑاہی']),
    group: 'curry-meat',
    style: 'home',
    family: 'chicken-karahi',
    state: BONE_STATE,
    servings: ({ katoriSet, res }) => katoriSet(boneIn(D.curry, res), { suffix: ', edible part' }),
    tags: PK,
    slots: MEAL,
    crossCheck: [
      { src: 'cofid', code: '19-322', note: 'UK takeaway chicken curries (korma, tikka masala, dhansak, jalfrezi, dopiaza), meat and sauce; no karahi analysed anywhere we found.' },
      { src: 'fndds', code: '2706437' },
    ],
    assumptions: [
      'Bone: karahi-cut skinless pieces taken as 75% edible (CoFID weighed-with-bone factors for casseroled chicken). Katori grams count only the edible part: density 1.00 g/ml (FNDDS chicken curry 1 cup = 240 g) × (1 − bone share on the plate).',
      'Fat: 100 g per kg bone-in chicken (80 g oil + 20 g desi ghee), from the median of three home recipes.',
      'Yield from a water balance (tomato reduced, onion browned, chicken juices dried off in the bhuna).',
    ],
    source: { confidence: 'C', notes: 'Home karahi: oil and yield assumed from recipes (no published karahi analysis).' },
  },
];
