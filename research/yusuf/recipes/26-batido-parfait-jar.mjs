// R-MP-26 · Queso fresco batido parfait jar with oats, chia, kiwi and walnuts (no-cook breakfast). Batch: 3 jars.
export default {
  n: 26,
  slot: 'breakfast',
  serving: 'jar',
  boxes: 3,
  effort: 'assemble',
  minutes: 10,
  id: 'es-queso-batido-parfait-jar',
  name: 'Queso fresco batido parfait with oats, chia, kiwi and walnuts (breakfast jar)',
  names: {
    en: 'Queso fresco batido parfait with oats, chia, kiwi and walnuts',
    es: 'Vasito de queso fresco batido con avena, chía, kiwi y nueces',
    ca: 'Got de formatge fresc batut amb civada, xia, kiwi i nous',
  },
  aliases: ['queso batido parfait', 'queso fresco batido con avena', 'parfait jar', 'protein parfait', 'formatge fresc batut', 'quark parfait', 'breakfast parfait', 'avena con queso batido'],
  pitch: 'The Mercadona classic of the gym crowd: whipped fresh cheese, oats and chia in a jar, kiwi on top in the morning.',
  eat: 'cold',
  tags: ['spanish', 'meal-prep', 'eat-cold', 'vegetarian'],
  references: [
    { title: 'Vitónica, Smoothie bowl de fresas, plátano y queso fresco con avena', url: 'https://www.vitonica.com/recetas-saludables/smoothie-bowl-fresas-platano-queso-fresco-avena-receta-saludable', used: '120 g queso fresco batido, 2 tbsp oats, 1 banana, 6 strawberries, 1 tsp peanut butter; toppings chia, nuts', read: 'search-engine page extract, 2026-10-14' },
    { title: 'El Imparcial, Cómo combinar el queso cottage en el desayuno', url: 'https://www.elimparcial.com/estilos/2026/06/09/como-combinar-el-queso-cottage-en-el-desayuno-para-sumar-proteina-y-sentirte-satisfecho-por-mas-tiempo/', used: '¾ cup fresh cheese, ½ banana or ½ cup berries, 2 tbsp oats, 1 tsp chia, cinnamon, chopped walnuts', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'jar', label: 'Queso batido, oats, chia and walnuts', storage: 'overnight-oats', yield: 'none', eat: 'cold',
      lines: [
        ['queso-batido', 660, '220 g per jar (one 500 g tub and a third of a second)'],
        ['oats', 120, '40 g per jar'],
        ['chia', 30, '10 g (1 tbsp) per jar'],
        ['walnuts', 24, '8 g per jar, chopped'],
        ['cinnamon', 3, 'ground'],
      ],
    },
    {
      id: 'fruit', label: 'Kiwi, sliced in the morning', storage: 'proposed:whole-fruit', yield: 'none', eat: 'cold',
      lines: [['kiwi', 207, '1 kiwi (69 g peeled) per jar']],
    },
  ],
  method: [
    'In each of 3 jars put 40 g oats, 10 g chia and a pinch of cinnamon; spoon in 220 g queso fresco batido and stir well.',
    'Top with the walnuts, close and refrigerate (at least 4 hours: the oats and chia soften in the cheese).',
    'In the morning peel and slice a kiwi on top. Eat cold.',
  ],
  keeps: '3 days in the fridge; do not freeze',
  storagePlan: 'Make 3 jars on Sunday night for Monday to Wednesday (3-day fridge life, like overnight oats). Kiwis wait in the fruit bowl.',
  reheat: 'No reheating: eat cold from the jar.',
  crossCheck: null,
  changes: [
    'Queso fresco batido raised from the references\' 120 g to 220 g and the banana swapped for a kiwi, so one jar reaches 25 g protein with less sugar.',
    'No protein powder and no honey: the sweetness is the kiwi and cinnamon (add 1 tsp honey if you like; about 21 kcal, not counted).',
  ],
  confidence: 'B',
  confidenceWhy: 'Nothing is cooked: the jar is the sum of weighed ingredients from a dated label (queso batido, Javier\'s record) and USDA SR Legacy values (oats, chia, walnuts, kiwi).',
  halal: { status: 'halal', reason: 'Dairy (no rennet, no gelatine: label read 2026-10-14), oats, seeds, nuts and fruit only.' },
};
