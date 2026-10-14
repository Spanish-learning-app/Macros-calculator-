// Record specs: breads and rice → app/data/foods-pk-breads-rice.js.
import { PK, PKV, PKVG, MEAL, D, SP, uniq } from './common.mjs';

const ROTI_W = { small: 27, medium: 40, large: 52 }; // RULES.referenceWeightsG (FNDDS 2707713)
const rotiServings = [
  { id: 'roti-small', label: '1 roti, small (6 in)', labelUr: 'چھوٹی روٹی', grams: ROTI_W.small },
  { id: 'roti', label: '1 roti, medium (7 in)', labelUr: 'روٹی', grams: ROTI_W.medium, default: true },
  { id: 'roti-large', label: '1 roti, large (8 in)', labelUr: 'بڑی روٹی', grams: ROTI_W.large },
];

export default [
  {
    id: 'pk-roti',
    recipe: 'roti-home',
    name: 'Roti / chapati (home, no ghee)',
    nameUr: 'روٹی',
    nameRoman: 'ghar ki roti',
    aliases: uniq(SP.roti, ['chapatti', 'chappati', 'phulka', 'phulkay', 'ghar ki roti', 'tawa roti', 'rotiyan', 'rotian', 'chapati roti', 'atta roti', 'whole wheat roti', 'روٹی', 'چپاتی', 'پھلکا']),
    group: 'bread',
    state: 'cooked on a tawa, no fat added',
    servings: rotiServings,
    tags: PKVG,
    slots: ['breakfast', 'lunch', 'dinner'],
    crossCheck: [
      { src: 'cofid', code: '11-459', note: 'UK chapatis made without fat (45.8% water, softer and moister).' },
      { src: 'fndds', code: '2707713', note: 'US recipe includes oil (9.2 g fat).' },
    ],
    assumptions: ['Atta from IFCT 2017 A019; cooked moisture 34.4% (Rasool et al. 2006, Pakistani chapattis 32.5–36.3%).', 'Serving weights: FNDDS 2707713 (small 6" 27 g, medium 7" 40 g, large 8" 52 g), as in RULES.referenceWeightsG.'],
    confidenceWhy: 'IFCT-analysed atta and a published chapatti moisture for Pakistani chapattis; FNDDS roti water (35.4%) agrees.',
    source: { confidence: 'B', notes: 'Weights: FNDDS 2707713 portions.' },
  },
  {
    id: 'pk-roti-ghee',
    recipe: 'roti-ghee-home',
    name: 'Roti with ghee (chupri roti)',
    nameUr: 'گھی والی روٹی',
    nameRoman: 'ghee wali roti',
    aliases: uniq(['ghee wali roti', 'chupri roti', 'chupri', 'chupdi roti', 'roti with ghee', 'makhan wali roti', 'ghee roti', 'buttered chapati', 'گھی والی روٹی']),
    group: 'bread',
    state: 'cooked on a tawa, brushed with 1 tsp desi ghee',
    servings: ({ res }) => [
      { id: 'roti', label: '1 roti, medium, with 1 tsp ghee', labelUr: 'گھی والی روٹی', grams: Math.round(res.cookedG), default: true },
    ],
    tags: PKV,
    slots: ['breakfast', 'lunch', 'dinner'],
    assumptions: ['1 tsp desi ghee per medium roti: assumption (TfT says "brush with butter", no amount). For more ghee, add ghee as an add-on.'],
    source: { confidence: 'C' },
  },
  {
    id: 'pk-tandoori-roti',
    recipe: 'tandoori-roti',
    name: 'Tandoori roti',
    nameUr: 'تندوری روٹی',
    nameRoman: 'tandoori roti',
    aliases: uniq(['tandoori roti', 'tandoori', 'tandoor roti', 'tandoor ki roti', 'tandori roti', 'tanduri roti', 'tandoori chapati', 'تندوری روٹی']),
    group: 'bread',
    state: 'baked in a tandoor, plain, as sold',
    servings: ({ res }) => {
      // The notified weight is the dough ball (paira), not the baked roti (Ayesha, fix wave 2026-10-14):
      // Karachi's notification fixes "a tandoori roti made from 110 grams paira" (ARY News, 14 Jan 2020).
      // Baked weight = 100 g dough × (baked ÷ raw dough).
      const g = Math.round(100 * res.yield);
      return [
        { id: 'piece', label: '1 tandoori roti (from a 100 g dough ball)', labelUr: 'ایک تندوری روٹی', grams: g, default: true },
        { id: 'half', label: '½ tandoori roti', labelUr: 'آدھی روٹی', grams: Math.round(g / 2) },
      ];
    },
    tags: PKVG,
    slots: ['lunch', 'dinner'],
    assumptions: ['Weight: district price notifications (Islamabad ICT and Hyderabad, April 2024; Gujranwala) fix tandoor roti at 100 g. This is the dough-ball (paira) weight: Karachi\'s notification states "made from 110 grams paira" (ARY News, 14 Jan 2020). Baked roti = 100 g × the recipe yield.', 'Moisture as chapatti (no tandoor-roti analysis found).'],
    source: { confidence: 'C', notes: 'Serving: ICT deputy commissioner notification, Apr 2024 (Daily Pakistan, 15 Apr 2024); Hyderabad district administration, Apr 2024 (Express Tribune). The notified 100 g is the dough ball (Karachi notification, ARY News 14 Jan 2020: "made from 110 grams paira"), so 1 roti = 100 g × baked yield (Ayesha, 2026-10-14).' },
  },
  {
    id: 'pk-naan',
    recipe: 'naan-plain',
    name: 'Naan (plain, tandoor)',
    nameUr: 'نان',
    nameRoman: 'naan',
    aliases: uniq(['naan', 'nan', 'plain naan', 'tandoori naan', 'khamiri naan', 'naan roti', 'نان']),
    group: 'bread',
    state: 'baked in a tandoor, plain (no butter on top), as sold',
    servings: ({ res }) => {
      // The notified 120 g is the dough ball (paira): Karachi's notification fixes "a tandoori naan prepared
      // from 120 grams of paira" (ARY News, 14 Jan 2020). Baked naan = 120 g × (baked ÷ raw dough), the same
      // rule as the roghni naan (Ayesha, fix wave 2026-10-14: it was 120 g baked, heavier than roghni).
      const g = Math.round(120 * res.yield);
      return [
        { id: 'piece', label: '1 naan (from a 120 g dough ball)', labelUr: 'ایک نان', grams: g, default: true },
        { id: 'half', label: '½ naan', labelUr: 'آدھا نان', grams: Math.round(g / 2) },
      ];
    },
    tags: PKV,
    slots: ['lunch', 'dinner'],
    crossCheck: [
      { src: 'cofid', code: '11-973', note: 'UK retail naan (12 samples).' },
      { src: 'fndds', code: '2707613' },
    ],
    assumptions: ['Weight: district price notifications (Islamabad, Hyderabad, Gujranwala 2024) fix naan at 120 g. That is the dough-ball (paira) weight: Karachi\'s notification says "a tandoori naan prepared from 120 grams of paira" (ARY News, 14 Jan 2020). Baked naan = 120 g × the recipe yield, as for the roghni naan.'],
    source: { confidence: 'C', notes: 'Serving: ICT notification, Apr 2024 (Daily Pakistan); Hyderabad, Apr 2024 (Express Tribune). The notified 120 g is the dough ball (Karachi notification, ARY News 14 Jan 2020: "prepared from 120 grams of paira"), so 1 naan = 120 g × baked yield (Ayesha, 2026-10-14).' },
  },
  {
    id: 'pk-roghni-naan',
    recipe: 'roghni-naan',
    name: 'Roghni naan',
    nameUr: 'روغنی نان',
    nameRoman: 'roghni naan',
    aliases: uniq(['roghni naan', 'roghni', 'roghini naan', 'roghani naan', 'rogni naan', 'sesame naan', 'til wala naan', 'روغنی نان']),
    group: 'bread',
    state: 'baked, enriched dough (milk, oil), egg-wash and sesame',
    servings: ({ res }) => {
      // Food Fusion: each naan from a 120 g dough ball; baked weight = 120 g × (cooked ÷ raw dough).
      const g = Math.round(120 * res.yield);
      return [
        { id: 'piece', label: '1 roghni naan (from a 120 g dough ball)', labelUr: 'ایک روغنی نان', grams: g, default: true },
        { id: 'half', label: '½ roghni naan', labelUr: 'آدھا نان', grams: Math.round(g / 2) },
      ];
    },
    tags: ['pakistani', 'vegetarian', 'contains-egg'],
    slots: ['lunch', 'dinner'],
    crossCheck: [{ src: 'cofid', code: '11-973', note: 'Plain UK retail naan, for scale.' }],
    assumptions: ['Piece weight from the Food Fusion 120 g dough ball × the recipe yield; restaurant roghni naans are often larger.'],
    source: { confidence: 'C' },
  },
  {
    id: 'pk-paratha-home',
    recipe: 'paratha-home',
    name: 'Paratha (home, plain)',
    nameUr: 'پراٹھا',
    nameRoman: 'ghar ka paratha',
    aliases: uniq(SP.paratha, ['plain paratha', 'sada paratha', 'ghar ka paratha', 'desi ghee paratha', 'paratha roti', 'tawa paratha', 'پراٹھا']),
    group: 'bread-fried',
    style: 'home',
    family: 'paratha',
    state: 'cooked on a tawa with desi ghee (light)',
    servings: [
      { id: 'piece', label: '1 paratha (70 g)', labelUr: 'ایک پراٹھا', grams: 70, default: true },
      { id: 'half', label: '½ paratha', labelUr: 'آدھا پراٹھا', grams: 35 },
    ],
    tags: PKV,
    slots: ['breakfast'],
    crossCheck: [
      { src: 'cofid', code: '11-1104' },
      { src: 'fndds', code: '2707715' },
    ],
    assumptions: ['10 g desi ghee per paratha of 40 g atta (between the quantified references; matches CoFID/FNDDS fat).', 'Weight 70 g: RULES.referenceWeightsG (FNDDS 2707715).'],
    source: { confidence: 'C', notes: 'Ghee varies a lot between cooks; heavier parathas: use the dhaba record or add ghee.' },
  },
  {
    id: 'pk-paratha-dhaba',
    recipe: 'paratha-dhaba',
    name: 'Paratha (dhaba / restaurant)',
    nameUr: 'پراٹھا (ڈھابہ)',
    nameRoman: 'dhaba paratha',
    aliases: uniq(SP.paratha, ['dhaba paratha', 'hotel paratha', 'lachha paratha', 'lacha paratha', 'restaurant paratha', 'ghee wala paratha', 'پراٹھا']),
    group: 'bread-fried',
    style: 'dhaba',
    family: 'paratha',
    state: 'cooked on a tawa, layered and fried in plenty of ghee',
    servings: [
      { id: 'piece', label: '1 paratha (70 g)', labelUr: 'ایک پراٹھا', grams: 70, default: true },
      { id: 'half', label: '½ paratha', labelUr: 'آدھا پراٹھا', grams: 35 },
    ],
    tags: PKV,
    slots: ['breakfast'],
    crossCheck: [{ src: 'cofid', code: '11-1104' }],
    assumptions: ['19 g ghee per paratha of 40 g atta (TfT lachha paratha load).', 'Weight 70 g (FNDDS); dhaba parathas are often bigger — log 1.5 if so.'],
    source: { confidence: 'C' },
  },
  {
    id: 'pk-anda-paratha',
    recipe: 'anda-paratha-home',
    name: 'Anda paratha (egg paratha, home)',
    nameUr: 'انڈا پراٹھا',
    nameRoman: 'anda paratha',
    aliases: uniq(['anda paratha', 'egg paratha', 'anday wala paratha', 'ande wala paratha', 'anda parontha', 'egg parata', 'anda prantha', 'انڈا پراٹھا']),
    group: 'bread-fried',
    state: 'paratha cooked with one egg (onion, chilli) on the tawa in desi ghee',
    servings: ({ res }) => [
      { id: 'piece', label: '1 anda paratha (1 egg)', labelUr: 'ایک انڈا پراٹھا', grams: Math.round(res.cookedG), default: true },
      { id: 'half', label: '½ anda paratha', labelUr: 'آدھا', grams: Math.round(res.cookedG / 2) },
    ],
    tags: ['pakistani', 'vegetarian', 'contains-egg'],
    slots: ['breakfast'],
    crossCheck: [{ src: 'cofid', code: '11-1104', note: 'Plain paratha, for scale.' }],
    assumptions: ['1 egg and 40 g atta per anda paratha (both references use 1 egg per paratha).', 'Ghee 14.3 g (home paratha 10 g + 1 tsp for the egg side): assumption.', 'Water 40 g/100 g: weighted paratha + egg layer (assumption).'],
    source: { confidence: 'C' },
  },
  {
    id: 'pk-aloo-paratha',
    recipe: 'aloo-paratha-home',
    name: 'Aloo paratha (home)',
    nameUr: 'آلو کا پراٹھا',
    nameRoman: 'aloo ka paratha',
    aliases: uniq(SP.paratha, ['aloo paratha', 'alu paratha', 'aloo ka paratha', 'potato paratha', 'aloo wala paratha', 'stuffed paratha', 'aloo parontha', 'آلو پراٹھا']),
    group: 'bread-fried',
    state: 'potato-stuffed, cooked on a tawa with desi ghee',
    servings: ({ res }) => [
      { id: 'piece', label: '1 aloo paratha (100 g dough ball)', labelUr: 'ایک آلو پراٹھا', grams: Math.round(res.cookedG), default: true },
      { id: 'half', label: '½ aloo paratha', labelUr: 'آدھا', grams: Math.round(res.cookedG / 2) },
    ],
    tags: PKV,
    slots: ['breakfast'],
    crossCheck: [{ src: 'cofid', code: '11-912', note: 'Analysed mooli (radish) paratha; its water sets ours. Why: the analysed mooli paratha was cooked almost dry (F 2.3 g); ours carries 1 tbsp ghee on the tawa (Food Fusion). FNDDS plain paratha is −24%, as expected for a wetter stuffed paratha. Explained (Ayesha, 2026-10-14).' }, { src: 'fndds', code: '2707715' }],
    assumptions: ['One paratha = 100 g dough ball (Food Fusion) + 1/7.5 of the filling + 1 tbsp ghee.'],
    source: { confidence: 'C' },
  },
  {
    id: 'pk-rice-plain',
    direct: { src: 'cofid', code: '11-858' },
    name: 'Rice, plain boiled (white basmati)',
    nameUr: 'سادہ چاول',
    nameRoman: 'saada chawal',
    aliases: uniq(SP.chawal, ['saada chawal', 'sada chawal', 'plain rice', 'boiled rice', 'ublay chawal', 'ubly chawal', 'white rice', 'basmati', 'basmati rice', 'steamed rice', 'چاول']),
    group: 'grain-cooked',
    state: 'boiled in unsalted water, drained',
    servings: ({ katoriSet }) => {
      const k = Math.round(200 * D.rice); // 1 medium katori (ICMR-NIN 200 ml) at 0.67 g/ml
      return [
        ...katoriSet(D.rice),
        { id: 'cup', label: '1 cup (200 ml)', labelUr: 'کپ', grams: k },
        // No published served-plate weight exists (NUTRITION.md §5.5). Lab assumption, labelled as such
        // (RULES.vocab.servingRules.assumedPlate): a home plate of chawal = 2 medium katori, as in pk-daal-chawal.
        { id: 'plate', label: '1 plate (home), assumed 2 katori', labelUr: 'ایک پلیٹ', grams: 2 * k },
        { id: 'half-plate', label: '½ plate, assumed 1 katori', labelUr: 'آدھی پلیٹ', grams: k },
      ];
    },
    tags: PKVG,
    slots: MEAL,
    source: { confidence: 'A', notes: 'CoFID 2021 11-858 "Rice, white, basmati, boiled in unsalted water" (11 samples); carbs converted from monosaccharide equivalents to weight (starch ÷ 1.10). Katori grams at 0.67 g/ml (FNDDS rice 1 cup = 158 g). Plate: no published served-plate weight (NUTRITION.md §5.5), so "1 plate (home)" is a labelled Lab assumption of 2 medium katori (268 g), the same plate as pk-daal-chawal.' },
  },
  {
    id: 'pk-daal-chawal',
    blend: {
      parts: [['pk-rice-plain', 268], ['pk-masoor-daal-home', 200]],
      note: 'Plate = 2 katori (medium, 200 ml) plain rice (2 × 134 g at 0.67 g/ml) + 1 katori masoor daal (200 g at 1.00 g/ml) = 468 g. The 2:1 katori split is the Lab\'s stated assumption; katori volumes from ICMR-NIN 2024 (RULES.householdMeasures).',
    },
    name: 'Daal chawal (home plate)',
    nameUr: 'دال چاول',
    nameRoman: 'daal chawal',
    aliases: uniq(['daal chawal', 'dal chawal', 'dhal chawal', 'daal chaawal', 'dal chaval', 'daal rice', 'dal rice', 'daal chawal plate', 'masoor daal chawal', 'دال چاول']),
    group: 'rice-dish',
    state: 'plain boiled basmati rice with home masoor daal, 2 : 1 by katori',
    servings: ({ katoriSet }) => [
      { id: 'plate', label: '1 plate (home), assumed 2 katori chawal + 1 katori daal', labelUr: 'ایک پلیٹ', grams: 468, default: true },
      { id: 'half-plate', label: '½ plate, assumed', labelUr: 'آدھی پلیٹ', grams: 234 },
      ...katoriSet(+(468 / 600).toFixed(3), { defaultId: null }),
    ],
    tags: PKVG,
    slots: ['lunch', 'dinner'],
    assumptions: ['A home lunch plate taken as 2 medium katoris of rice and 1 of daal (assumption for the Boss\'s "daal chawal"; NUTRITION.md has no published plate weight).', 'Katori servings use the mixed density (468 g per 600 ml = 0.78 g/ml).'],
    source: { confidence: 'C', notes: 'Built from pk-rice-plain (CoFID 11-858) and pk-masoor-daal-home (Recipe R-pk-masoor-daal-home).' },
  },
  {
    id: 'pk-puri',
    direct: { src: 'cofid', code: '11-911', method: 'direct' },
    name: 'Puri (deep-fried)',
    nameUr: 'پوری',
    nameRoman: 'puri',
    aliases: uniq(['puri', 'poori', 'pori', 'halwa puri wali puri', 'puri bread', 'pooris', 'پوری']),
    group: 'bread-fried',
    state: 'deep-fried, as served',
    servings: [
      { id: 'piece', label: '1 puri (12 cm, 36 g)', labelUr: 'ایک پوری', grams: 36, default: true },
    ],
    tags: PKVG,
    slots: ['breakfast'],
    source: { confidence: 'B', notes: 'CoFID 2021 11-911 "Puri, homemade" (Univ. of Leeds analysis of South Asian foods, 9 samples: 6 homemade, 3 café). UK-made; Pakistani halwa-puri puris are often maida-based and larger. Serving: FNDDS 2707714 (RULES.referenceWeightsG).' },
  },
];
