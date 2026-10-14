// R-MP-15 · Oat, yogurt and banana protein pancakes to freeze (breakfast portion of 4 pancakes).
// Standard batch: 16 pancakes = 4 portions.
export default {
  n: 15,
  effort: 'cook',
  minutes: 35,
  slot: 'breakfast',
  serving: 'portion',
  boxes: 4,
  id: 'intl-protein-pancakes-portion',
  name: 'Oat, protein yogurt and banana pancakes, 4 pancakes (breakfast portion)',
  names: {
    en: 'Oat, protein yogurt and banana pancakes (4)',
    es: 'Tortitas de avena, yogur proteico y plátano (4)',
    ca: 'Creps de civada, iogurt proteic i plàtan (4)',
  },
  aliases: ['protein pancakes', 'oat pancakes', 'banana pancakes', 'tortitas de avena', 'tortitas proteicas', 'pancakes de avena', 'freezer pancakes'],
  pitch: 'Blender batter, sixteen pancakes, toast them from frozen on weekday mornings.',
  eat: 'hot',
  tags: ['international', 'meal-prep', 'contains-egg', 'vegetarian'],
  references: [
    { title: 'Lauren Fit Foodie, Blender oatmeal pancakes', url: 'https://laurenfitfoodie.com/wprm_print/26611', used: '144 g rolled oats, 60 g milk, 60 g Greek yogurt, 220 g banana, 2 eggs, 2 tsp baking powder, cinnamon; about 10 pancakes', read: 'search-engine page extract, 2026-10-14' },
    { title: 'BBC Good Food Middle East, Protein pancakes with banana', url: 'https://www.bbcgoodfoodme.com/recipes/protein-pancakes-with-banana/', used: '3 eggs, 75 g porridge oats, 1 large banana, 2 tbsp protein powder, 2 tbsp milk, 1 tbsp baking powder; serves 2', read: 'search-engine page extract, 2026-10-14' },
    { title: 'Oatmeal with a Fork, Greek yogurt oat pancakes', url: 'https://www.oatmealwithafork.com/wprm_print/107206', used: '1¼ cups oats, ¾ cup Greek yogurt, 2 eggs, 1 large banana, ¼–⅓ cup milk; 12 pancakes', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'pancakes', label: 'Pancakes (16)', storage: 'egg-muffin', yield: 'pancakeWholemeal', eat: 'hot',
      lines: [
        ['oats', 200, 'blended to a flour'],
        ['protein-yogurt', 400, ''],
        ['egg', 400, '8 large eggs'],
        ['banana', 200, '2 small, ripe'],
        ['cinnamon', 4, ''],
        ['salt', 1, 'a pinch'],
        ['oil-sunflower', 16, 'to wipe the pan (1 g per pancake)'],
      ],
    },
  ],
  method: [
    'Blend the oats to a flour, add the yogurt, eggs, banana, cinnamon and salt and blend smooth. Rest 10 min to thicken (2 tsp baking powder makes them fluffier; optional, not counted).',
    'Wipe a non-stick pan with a little oil on medium heat. Pour about ¼ cup (65 g) of batter per pancake; cook 2 min until bubbles set, flip, 1–2 min more.',
    'Cool on a rack. Pack 4 pancakes per portion with baking paper between them; freeze flat.',
  ],
  keeps: '3 days fridge; 2 months frozen',
  storagePlan: 'One portion in the fridge, three in the freezer. Use the egg-muffin storage class (cooked egg batter: 3 days in the fridge, 2 months frozen).',
  reheat: 'From frozen: toaster 2 cycles, or microwave 60–80 s under a paper towel, until hot right through. Top with a few spoons of yogurt or fruit if you like (log the topping separately).',
  crossCheck: null,
  changes: [
    'Protein powder (BBC Good Food) replaced by a high-protein yogurt (10 g per 100 g) and more egg, so the portion reaches 29 g protein with no supplement.',
    'No honey or syrup in the batter; the banana sweetens it.',
  ],
  confidence: 'B',
  confidenceWhy: "The yield is Bognár's published pancake factor (whole meal flour, pan fried, n = 10); every ingredient is weighed; the oil is wiped, not poured.",
  halal: { status: 'halal', reason: 'Oats, eggs, yogurt and fruit only; yogurt label checked (no gelatine), 2026-10-13.' },
};
