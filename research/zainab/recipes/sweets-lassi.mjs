// Recipe sheets: kheer, suji halwa, lassi (meethi and namkeen).
import { M } from '../measures.mjs';

export default [
  {
    id: 'kheer',
    dish: 'Kheer (chawal ki kheer, rice and milk pudding)',
    sources: [
      { ref: 'F&S-kheer', url: 'https://www.flourandspiceblog.com/chawal-ki-kheer-pakistani-rice-pudding/', used: '¼ cup rice soaked; 1 litre whole milk; 5–6 cardamom; 10 tbsp sugar; ¼–½ cup cream.' },
      { ref: 'TfT-kheer', url: 'https://www.teaforturmeric.com/instant-pot-kheer/', used: '⅓ cup + 1 tbsp basmati; 3 cups whole milk + 2 cups half-and-half; 10 cardamom; ¼ cup + 2 tbsp sugar; 3 tbsp condensed milk; 2–3 tbsp nuts.' },
    ],
    fatBasis: 'No cooking fat; fat from milk, cream and nuts.',
    ingredients: [
      ['milk-whole', 1030, '1 litre (F&S); TfT 3 cups milk + 2 cups half-and-half'],
      ['rice-basmati-raw', 55, 'F&S ¼ cup (46 g) per litre; TfT ⅓ cup + 1 tbsp (74 g) per 1.2 litres'],
      ['sugar', 110, 'F&S 10 tbsp (126 g) per litre; TfT ¼ cup + 2 tbsp (75 g) + 3 tbsp condensed milk per 1.2 litres'],
      ['cream', 60, 'F&S ¼–½ cup cream; TfT half-and-half'],
      ['almonds', 6, 'nuts 2–3 tbsp per batch (TfT)'],
      ['pistachio', 6, ''],
      ['cardamom', 1.5, ''],
    ],
    addedFat: [],
    cooking: { method: 'moisture', water: 70.2, basis: 'Milk cooked down with the rice to the water of CoFID 2021 12-608 "Pudding, rice, homemade, with whole milk" (70.2 g/100 g); FNDDS 2705685 rice pudding: 75.2 g.' },
  },
  {
    id: 'suji-halwa',
    dish: 'Suji (semolina) halwa, halwa-puri style',
    sources: [
      { ref: 'TfT-sooji-halwa', url: 'https://www.teaforturmeric.com/traditional-sooji-ka-halwa-semolina-halwa/', used: '½ cup butter or ghee; 1 cup fine semolina; 2½ cups water; ¾ cup sugar; cardamom; saffron; rose water; 1–2 tbsp slivered almonds.' },
      { ref: 'F&S-sooji-halwa', url: 'https://www.flourandspiceblog.com/speedy-sooji-ka-halwa-one-pot-recipe/', used: '2 tbsp ghee (30 g); 2 tbsp sooji (30 g); 4–5 tbsp sugar; pinch salt; ¾–1 cup hot water; cardamom.' },
      { ref: 'CoFID-halva', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid', used: 'CoFID 2021 17-799 "Halva, semolina, homemade" (recipe): water 33.9, fat 16.7 g/100 g — used for the final water.' },
    ],
    fatBasis: 'Ghee per cup (167 g) suji: TfT ½ cup (≈ 102 g); F&S 1 : 1 by weight (167 g) → mean ≈ 134 g desi ghee.',
    ingredients: [
      ['suji', M.cupSuji, '1 cup (USDA 167 g)'],
      ['ghee-desi', 134, 'see added fat'],
      ['sugar', 200, 'TfT ¾ cup (150 g); F&S 4–5 tbsp per 30 g suji (≈ 376 g per cup) → 200 g'],
      ['water', 600, 'TfT 2½ cups (593 g)'],
      ['almonds', 10, '1–2 tbsp slivered'],
      ['cardamom', 1.5, ''],
    ],
    addedFat: ['ghee-desi'],
    cooking: { method: 'moisture', water: 33.9, basis: 'Cooked until the ghee separates, to the water of CoFID 2021 17-799 "Halva, semolina, homemade" (33.9 g/100 g).' },
  },
  {
    id: 'lassi-sweet',
    dish: 'Lassi, meethi (sweet)',
    sources: [
      { ref: 'TfT-lassi', url: 'https://www.teaforturmeric.com/lassi/', used: '1½ cups whole-milk yogurt; ¾–1 cup whole milk; 4 tbsp + 2 tsp sugar; 3 tbsp cream; 4 large ice cubes → 2 lassis (4 cups).' },
      { ref: 'FoodFusion-lassi-4-ways', url: 'https://foodfusion.com/recipe/lassi-4-ways/', used: 'Plain sweet lassi: ½ cup dahi, ½ cup milk or water, 1 tbsp sugar (to taste), ice (search summary).' },
      { ref: 'CoFID-lassi', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid', used: 'CoFID 2021 12-373 "Lassi, sweetened" (5 samples, takeaway and retail): 65 kcal — a thinner, lower-fat lassi (cross-check).' },
    ],
    fatBasis: 'No added fat; dairy fat from yogurt, milk and cream.',
    ingredients: [
      ['yogurt', 300, 'per 300 g yogurt (TfT 368 g)'],
      ['milk-whole', 237, 'TfT 58 g and FF 100 g per 100 g yogurt → 79 g'],
      ['sugar', 39, 'TfT 16 g and FF 10 g per 100 g yogurt → 13 g'],
      ['cream', 18, 'TfT 12 g per 100 g yogurt; FF none → 6 g'],
      ['water', 135, 'ice (TfT 4 large cubes ≈ 33 g per 100 g yogurt; FF ice)'],
    ],
    addedFat: [],
    cooking: { method: 'none', basis: 'Blended; no cooking.' },
  },
  {
    id: 'lassi-salted',
    dish: 'Lassi, namkeen (salted)',
    sources: [
      { ref: 'Urdupoint-dahi-ki-lassi', url: 'https://www.urdupoint.com/cooking/urdu-recipe/dahi-ki-lassi-1406.html', used: '~½ kg yogurt, sugar or salt to taste, water, poured over ice (search summary).' },
      { ref: 'MasalaTV-dahi-ki-lassi', url: 'https://www.masala.tv/dahi-ki-lassi/', used: 'Yogurt, water, ice and salt (search summary).' },
    ],
    fatBasis: 'No added fat.',
    ingredients: [
      ['yogurt', 500, '½ kg yogurt (Urdupoint)'],
      ['water', 500, 'water + ice to an equal volume (assumption: neither source gives the amount)'],
      ['salt', 4, 'salt to taste (≈ ⅔ tsp per litre, assumption)'],
      ['cumin', 1, 'roasted zeera pinch'],
    ],
    addedFat: [],
    cooking: { method: 'none', basis: 'Blended; no cooking.' },
  },
];
