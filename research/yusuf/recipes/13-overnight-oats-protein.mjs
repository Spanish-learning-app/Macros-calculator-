// R-MP-13 · Overnight oats with protein yogurt, chia and walnuts (breakfast jar). Standard batch: 3 jars
// (overnight oats keep 3 days and do not freeze: make on Sunday night for Monday to Wednesday).
export default {
  n: 13,
  slot: 'breakfast',
  serving: 'jar',
  boxes: 3,
  id: 'intl-overnight-oats-protein-jar',
  name: 'Overnight oats with protein yogurt, chia and walnuts (breakfast jar)',
  names: {
    en: 'Overnight oats with protein yogurt, chia and walnuts',
    es: 'Avena remojada con yogur proteico, chía y nueces',
    ca: 'Civada remullada amb iogurt proteic, xia i nous',
  },
  aliases: ['overnight oats', 'protein oats', 'oats jar', 'avena nocturna', 'overnight oats skyr', 'civada de nit', 'protein overnight oats', 'oats meal prep'],
  pitch: 'Five minutes on Sunday night, three breakfasts ready; eat cold from the jar.',
  eat: 'cold',
  tags: ['international', 'meal-prep', 'eat-cold', 'vegetarian'],
  references: [
    { title: 'Bake and Bacon, Quick & creamy high protein overnight oats', url: 'https://www.bakeandbacon.com/high-protein-overnight-oats-3-ways/', used: '½ cup (40.5 g) rolled oats, ½ tbsp chia, ½ cup (122 g) milk, ¼ cup (50 g) non-fat Greek yogurt, 1 scoop protein powder per jar', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Joy to the Food, Amped-up protein overnight oats', url: 'https://joytothefood.com/amped-up-protein-overnight-oats/', used: '½ cup rolled oats, 1 tbsp chia, 1¼ tbsp hemp seeds, ⅓ cup Greek yogurt, 1 cup milk (⅔ cup for a thicker jar)', read: 'search-engine page extract, 2026-10-14' },
    { title: 'My Everyday Table, High-protein overnight oats', url: 'https://myeverydaytable.com/high-protein-overnight-oats/', used: '½ cup oats and 2 tbsp chia per serving with Greek yogurt or skyr', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'jar', label: 'Oats, protein yogurt, milk, chia and walnuts', storage: 'overnight-oats', yield: 'none', eat: 'cold',
      lines: [
        ['oats', 150, '50 g per jar (about ½ cup)'],
        ['protein-yogurt', 450, '150 g per jar (+Proteínas natural pots; skyr works the same)'],
        ['milk-semi', 360, '120 g (about ½ cup) per jar'],
        ['chia', 30, '10 g (1 tbsp) per jar'],
        ['walnuts', 24, '8 g per jar, chopped, on top'],
        ['cinnamon', 3, 'ground'],
      ],
    },
    {
      id: 'banana', label: 'Banana, sliced in the morning', storage: 'proposed:whole-fruit', yield: 'none', eat: 'cold',
      lines: [['banana', 180, '60 g per jar (about ½ banana)']],
    },
  ],
  method: [
    'In each of 3 jars (400–500 ml with a lid) put 50 g oats, 10 g chia and a pinch of cinnamon; add 150 g protein yogurt and 120 g milk and stir well, scraping the bottom.',
    'Top with the chopped walnuts, close and refrigerate. Leave at least 6 hours (overnight); stir once more before the first jar if it set unevenly.',
    'In the morning slice half a banana on top. Eat cold.',
  ],
  keeps: '3 days in the fridge; do not freeze',
  storagePlan: 'All 3 jars go in the fridge on Sunday night for Monday, Tuesday and Wednesday (fridge life 3 days). For Thursday and Friday, make 2 more jars on Wednesday night. Uncooked oats soaked in milk and yogurt do not freeze well.',
  reheat: 'No reheating: eat cold, straight from the jar. If you like it warm, microwave 1 min without the lid, stirring halfway.',
  crossCheck: null,
  changes: [
    'The references reach 30–35 g protein with a scoop of protein powder. Whey powder is not always halal-certified (rennet in the cheese process), so this jar uses 150 g of a high-protein yogurt (10 g protein per 100 g, milk and cultures only) instead and reaches the target without powder.',
    'Banana kept separate and added in the morning so it does not go brown in the jar.',
  ],
  confidence: 'B',
  confidenceWhy: 'Nothing is cooked: the jar is the sum of weighed ingredients from a dated label (milk, protein yogurt) and USDA SR Legacy values (oats, chia, walnuts, banana). No cooking yield is needed.',
  halal: { status: 'halal', reason: 'Dairy, oats, seeds, nuts and fruit only; milk and yogurt labels checked (no gelatine), 2026-10-13/14.' },
};
