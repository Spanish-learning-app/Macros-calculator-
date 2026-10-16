// R-MP-28 · Fruit chaat with protein yogurt and almonds (breakfast or merienda). Batch: 2 portions.
export default {
  n: 28,
  slot: 'breakfast',
  serving: 'portion',
  boxes: 2,
  effort: 'assemble',
  minutes: 12,
  cuisine: 'desi',
  shortName: 'Fruit chaat, dahi',
  id: 'pk-fruit-chaat-protein-dahi-portion',
  name: 'Fruit chaat with protein yogurt and almonds (breakfast portion)',
  names: {
    en: 'Fruit chaat with protein yogurt and almonds',
    es: 'Fruit chaat: macedonia especiada con yogur proteico y almendras',
    ca: 'Fruit chaat: macedònia espaiada amb iogurt proteic i ametlles',
    ur: 'فروٹ چاٹ دہی اور بادام کے ساتھ',
    roman: 'fruit chaat dahi badam',
  },
  aliases: ['fruit chaat', 'fruit chat', 'phal chaat', 'fruit chaat with yogurt', 'macedonia con yogur', 'fruit salad chaat masala', 'iftar fruit chaat', 'protein fruit chaat'],
  pitch: 'The iftar favourite as a breakfast: apple, banana, mandarin and pomegranate with chaat masala and lemon, on a thick protein yogurt.',
  eat: 'cold',
  tags: ['pakistani', 'meal-prep', 'eat-cold', 'vegetarian', 'iftar'],
  references: [
    { title: 'Tea for Turmeric, Pakistani fruit chaat', url: 'https://www.teaforturmeric.com/wprm_print/pakistani-fruit-chaat-with-essential-tips', used: 'apple, banana, mango, berries, grapes and pomegranate with chaat masala, orange juice and a little sugar; best eaten the same day', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Sumayya Usmani, Fruit chaat: sweet savoury fruit salad', url: 'https://sumayyausmani.com/blog-old/a-sweet-spicy-colourful-fruit-chaat-street-food-1', used: 'Karachi-style with apple, banana, guava, mandarin and pomegranate, chaat masala, lemon', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'chaat', label: 'Fruit chaat with chaat masala and lemon', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['apple', 180, 'diced, skin on (1 apple)'],
        ['mandarin', 176, '2 mandarins, segmented'],
        ['pomegranate', 100, 'arils (about a third of a fruit)'],
        ['lemon-juice', 20, 'keeps the apple from browning'],
        ['chaat-masala', 3, ''],
      ],
    },
    {
      id: 'yogurt', label: 'Protein yogurt and almonds', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['protein-yogurt', 480, '240 g per portion (two 120 g servings from the 500 g tub)'],
        ['almonds', 40, '20 g per portion (about 16 almonds), chopped, added in the morning'],
      ],
    },
    {
      id: 'banana', label: 'Banana, sliced in the morning', storage: 'proposed:whole-fruit', yield: 'none', eat: 'cold',
      lines: [['banana', 101, '½ small banana per portion']],
    },
  ],
  method: [
    'Dice the apple into the lemon juice straight away; add the mandarin segments and pomegranate arils; sprinkle the chaat masala and toss.',
    'Spoon 240 g protein yogurt into each of 2 boxes and top with half the fruit chaat. Close and refrigerate.',
    'In the morning add half a sliced banana and the chopped almonds. Eat cold.',
  ],
  keeps: '2 days in the fridge (cut fruit); do not freeze',
  storagePlan: 'Cut fruit keeps 2 days: make 2 portions at a time (Sunday night for Monday and Tuesday). Banana and almonds are added in the morning so they stay fresh and crunchy.',
  reheat: 'Not reheated: eat cold.',
  crossCheck: null,
  changes: [
    'No sugar and no orange juice: the fruit is sweet enough with chaat masala and lemon.',
    'Served on 240 g of a high-protein yogurt (milk and cultures only) and with almonds, so a fruit salad becomes a breakfast with 25 g protein.',
    'Banana added in the morning (it browns and softens in a stored chaat, as the references warn).',
    'Almonds 15 → 20 g a portion (15 Oct): the first version came to 77 kcal per 100 g, under the Lab floor of 80 for a prep record (check G9). The extra nuts bring it to 82 kcal per 100 g (451 kcal, 30.8 g protein a portion).',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking: weighed USDA SR Legacy fruit and almonds and a dated label (protein yogurt). Chaat masala is counted as USDA curry powder (3 g for the batch).',
  halal: { status: 'halal', reason: 'Fruit, nuts, spices and a protein yogurt of milk and cultures only (no gelatine; label read 2026-10-13/14).' },
};
