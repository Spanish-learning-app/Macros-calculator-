// Record specs: Pakistani restaurant, dhaba and street food → app/data/foods-pk-restaurant.js.
import { PK, PKV, PKVG, MEAL, D, boneIn, SP, uniq } from './common.mjs';

const BONE_STATE = 'cooked, as served with masala/gravy, edible portion (bones removed)';

export default [
  {
    id: 'pk-chicken-karahi-restaurant',
    recipe: 'chicken-karahi-restaurant',
    name: 'Chicken karahi (restaurant)',
    nameUr: 'چکن کڑاہی (ریسٹورنٹ)',
    nameRoman: 'chicken karahi restaurant wali',
    aliases: uniq(SP.karahi, ['chicken karahi', 'chicken karai', 'chicken kadai', 'chicken karhai', 'murgh karahi', 'restaurant karahi', 'hotel karahi', 'half kg karahi', 'adha kilo karahi', 'karahi handi', 'lahori karahi', 'کڑاہی']),
    group: 'curry-meat',
    style: 'restaurant',
    family: 'chicken-karahi',
    state: BONE_STATE,
    servings: ({ katoriSet, res }) => [
      ...katoriSet(boneIn(D.curry, res), { suffix: ', edible part' }),
      // "½ kg karahi" = made from ½ kg bone-in chicken = half of the standard pot (1 kg chicken).
      { id: 'handi-half-kg-share-3', label: '1 share of a ½ kg karahi split 3 ways', labelUr: 'آدھا کلو کڑاہی کا تیسرا حصہ', grams: Math.round(res.cookedG / 2 / 3) },
      { id: 'handi-half-kg-share-2', label: '1 share of a ½ kg karahi split 2 ways', labelUr: 'آدھا کلو کڑاہی کا آدھا حصہ', grams: Math.round(res.cookedG / 2 / 2) },
    ],
    tags: PK,
    slots: ['dinner'],
    crossCheck: [{ src: 'cofid', code: '19-322', note: 'UK takeaway curries, meat and sauce.' }],
    assumptions: [
      'Same base recipe as the home karahi; restaurant fat load 200 g per kg bone-in chicken (140 g palm-olein-type oil + 60 g ghee) from MasalaTV dawat (175 ml), Shan white karahi pack (175 ml) and MasalaTV highway karahi (1 cup per ½ kg, half poured off).',
      '"½ kg karahi" on Pakistani menus is taken as the dish made from ½ kg bone-in chicken (assumption, common menu usage); a share = edible cooked weight ÷ diners. The whole ½ kg handi (≈ ' + 'see recipe file' + ') exceeds the curry-meat serving limit of 500 g, so only shares are offered until RULES allow it.',
    ],
    source: { confidence: 'C', notes: 'Restaurant style: always C (NUTRITION.md §4.4).' },
  },
];
