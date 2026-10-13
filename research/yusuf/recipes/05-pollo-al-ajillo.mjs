// R-MP-5 · Pollo al ajillo with lemon (no wine), brown rice with peas, green beans. 4 boxes. Raw edible grams.
export default {
  n: 5,
  id: 'es-pollo-ajillo-limon-rice-box',
  name: 'Pollo al ajillo with lemon, rice and green beans (lunch box)',
  names: {
    en: 'Garlic-lemon chicken (pollo al ajillo) with rice and green beans',
    es: 'Pollo al ajillo con limón, arroz integral con guisantes y judías verdes',
    ca: "Pollastre a l'allet amb llimona, arròs integral amb pèsols i mongeta tendra",
    roman: 'lehsan wala chicken chawal',
  },
  aliases: ['pollo al ajillo', 'pollo ajillo', "pollastre a l'allet", 'pollastre amb all', 'garlic chicken', 'garlic lemon chicken', 'chicken with garlic', 'lehsan chicken', 'lahsun murgh', 'pollo al ajillo con arroz', 'pollo al ajillo con limon'],
  pitch: 'Spain\'s garlic chicken with lemon and parsley instead of wine, over brown rice with peas and green beans.',
  eat: 'hot',
  tags: ['spanish', 'meal-prep'],
  references: [
    { title: 'Diez Minutos (Miguel Torres, MasterChef Celebrity), Pollo al ajillo', url: 'https://www.diezminutos.es/cocina/recetas/a71115551/miguel-torres-finalista-masterchef-celebrity-receta-pollo-ajillo/', used: '500 g chicken thigh/drumstick pieces, 6–8 garlic cloves, 1 bay leaf, 100 ml amontillado wine (replaced here by lemon juice and water), 100 ml chicken stock (replaced by water), olive oil; serves 2–3', read: 'fetched 2026-10-13' },
    { title: 'Diet Doctor (ES), Pollo al ajillo bajo en carbohidratos', url: 'https://www.dietdoctor.com/es/recetas/low-carb-pollo-al-ajillo', used: '900 g chicken thighs, 2 tbsp olive oil (+ 28 g to grease), 7 garlic cloves, juice of 1 lemon, 30 g parsley, no wine; serves 4', read: 'fetched 2026-10-13' },
    { title: '¡Hola! Cocina, Pollo al ajillo, receta tradicional', url: 'https://www.hola.com/cocina/recetas/20260224885542/como-hacer-pollo-al-ajillo-receta-tradicional/', used: 'chicken in pieces or boneless thighs, 4 garlic cloves, guindilla, ½ glass white wine + ½ glass water (wine replaced), rosemary', read: 'fetched 2026-10-13' },
  ],
  components: [
    {
      id: 'chicken', label: 'Pollo al ajillo with lemon', storage: 'cooked-meat', yield: 'thighBraised', eat: 'hot',
      lines: [
        ['chicken-thigh', 720, 'boneless, skinless, in 4 cm pieces'],
        ['salt', 6, ''],
        ['black-pepper', 2, ''],
        ['oil-olive', 30, 'extra virgin, about 2 tbsp'],
        ['garlic', 40, '12–14 cloves, sliced', 'onionSoft'],
        ['chilli-powder', 1, '1 dried guindilla (cayena), optional'],
        ['bay-leaf', 0.5, ''],
        ['lemon-juice', 60, 'in place of the wine (about 1¼ lemons) + 100 ml water that boils off', 'none'],
        ['parsley', 15, 'chopped', 'none'],
      ],
    },
    {
      id: 'rice', label: 'Brown rice with peas', storage: 'cooked-starch', yield: 'riceBrown', eat: 'hot',
      lines: [
        ['rice-brown', 240, 'arroz integral largo'],
        ['peas', 200, 'frozen, added for the last 5 min', 'peasStewed'],
        ['salt', 3, ''],
      ],
    },
    {
      id: 'beans', label: 'Green beans', storage: 'proposed:cooked-veg', yield: 'greenBeansBoiled', eat: 'hot',
      lines: [['green-beans', 600, 'frozen judía verde, boiled 8 min']],
    },
  ],
  method: [
    'Season the chicken with salt and pepper. Brown it in the olive oil in a wide pan over medium-high heat, 6–8 min; lift it out.',
    'Lower the heat; fry the sliced garlic, guindilla and bay leaf gently until pale gold (do not burn it).',
    'Return the chicken, add the lemon juice and 100 ml water, cover and cook 10 min, then uncover until the sauce is a glaze and the chicken reaches 75 °C inside. Stir in the parsley.',
    'Brown rice: simmer about 30 min in plenty of salted water (or by absorption, about 1 : 2 by volume), adding the frozen peas for the last 5 min; drain.',
    'Boil the green beans 8 min and drain well.',
    'Cool within 1 h. Each box: ¼ of the rice and peas, ¼ of the beans, ¼ of the chicken with its garlic glaze.',
  ],
  storagePlan: 'Box 1 in the fridge, boxes 2–4 in the freezer (rice 1 month, chicken 3 months). Move the next day\'s box to the fridge the night before.',
  reheat: 'Microwave with the lid ajar 3 min at full power, stir, 30–60 s more until steaming hot right through (75 °C). Reheat once only. A squeeze of fresh lemon after reheating lifts it.',
  crossCheck: { fdc: 2706438, note: 'FNDDS "Chicken curry with rice" as the nearest chicken-and-rice plate in FNDDS (no pollo al ajillo entry).' },
  changes: [
    'No wine: the 100 ml amontillado (Diez Minutos) or white wine (¡Hola!) is replaced by lemon juice and water, as Diet Doctor\'s version already does; no shop stock (Mercadona\'s caldo de pollo is not from halal chicken).',
    'Brown rice with 50 g peas per box and 150 g green beans per box: with white rice and 100 g beans the box gave about 4 g fibre.',
  ],
  confidence: 'C',
  confidenceWhy: 'Chicken yield is a USDA raw/braised water balance; the lemon-and-water glaze is assumed to reduce to the lemon juice weight.',
  halal: { status: 'halal', reason: 'Chicken from a halal butcher; lemon instead of wine; no shop stock.' },
};
