// Recipe sheets: mutton karahi, aloo gosht, keema, nihari, haleem, seekh kebab, chicken tikka,
// shami kebab, chapli kebab.
import { M, ASSUMED as A } from '../measures.mjs';
import { C } from '../conventions.mjs';

// Mutton (goat) curry cut: edible 0.75 — CoFID lamb "weighed with bone" factors: best-end neck
// cutlets 0.73, leg chops 0.84, chump chops 0.87 (raw/grilled, lean and fat); curry cuts include neck
// and ribs, so the low end is used (assumption).
const MUTTON_EDIBLE = 0.75;
// Skinless chicken leg quarter: edible 0.63 — CoFID 18-293/18-294 leg quarter raw meat+skin 193 vs
// 133 kcal "weighed with bone" (0.689 edible, of which 23% skin) → meat 0.53, bone 0.31 → skin removed:
// 0.53 / (0.53 + 0.31) = 0.63.
const LEG_EDIBLE = 0.63;

// Ground beef 80/20 grilled: FDC 174036 raw (P 17.17, F 20, water 61.87) → 171797 broiled patty
// (P 25.75, F 17.78): yield 0.667; fat kept 17.78 × 0.667 / 20 = 0.593, so 41% of the meat fat drips
// off (8.1 g per 100 g raw) and 25.2 g water per 100 g raw leaves (0.41 of the meat's water).
const MINCE_GRILL = { yield: 17.17 / 25.75, fatKept: (17.78 * (17.17 / 25.75)) / 20 };
const minceDrip = (g) => -Math.round(g * 0.2 * (1 - MINCE_GRILL.fatKept));
const minceWaterFrac = (100 * (1 - MINCE_GRILL.yield) - 20 * (1 - MINCE_GRILL.fatKept)) / 61.87;

export default [
  {
    id: 'mutton-karahi-restaurant',
    dish: 'Mutton (goat) karahi, restaurant style',
    sources: [
      { ref: 'TfT-mutton-karahi', url: 'https://www.teaforturmeric.com/mutton-karahi-goat-lamb-karahi/', used: '1.5 lb bone-in goat/lamb boiled in 1.5 cups water with garlic, ginger, ½ small onion until the water evaporates; ⅓–½ cup oil; 5 medium Roma tomatoes; 4–5 garlic; ½" ginger; spices; 3 tbsp yogurt; 1–2 tbsp butter; green chillies; julienned ginger.' },
      { ref: 'F&S-karahi-gosht', url: 'https://www.flourandspiceblog.com/karahi-gosht-masalaydaar-beef-mutton-curry/', used: '1.5 lb bone-in meat; ⅓ cup oil; 1 tbsp each ginger and garlic paste; 5 tomatoes; 3 tbsp yogurt; spices; water dried out at the end.' },
      { ref: 'MasalaTV-highway', url: 'https://masala.tv/highway-karahi-recipe/', used: 'Restaurant/highway fat load: 1 cup oil per 500 g meat, half removed before the tomatoes.' },
    ],
    fatBasis: 'Home references: TfT ⅓–½ cup oil (91 g) + 1–2 tbsp butter (≈ 17 g fat) per 680 g → 159 g/kg; F&S ⅓ cup (73 g) per 680 g → 107 g/kg. Restaurant standard as for chicken karahi: 200 g per kg bone-in meat (140 g palm-type oil + 60 g ghee); highway karahi keeps ≈ 218 g/kg.',
    ingredients: [
      ['goat', 1000, 'bone-in curry-cut mutton; edible 0.75', { edible: MUTTON_EDIBLE }],
      ['oil-palm', 140, ''],
      ['ghee-desi', 60, ''],
      ['tomato', 600, 'TfT 5 medium Roma (≈ 310 g) per 680 g → 456 g/kg; F&S 5 tomatoes (≈ 615 g) per 680 g → 904 g/kg → 600 g'],
      ['yogurt', 65, '3 tbsp per 680 g'],
      ['garlic', 25, ''],
      ['ginger', 20, 'paste + julienne'],
      ['onion', 35, 'TfT ½ small in the boil'],
      ['green-chilli', 5 * A.hariMirch, ''],
      ['coriander-powder', 2 * M.tspCoriander, ''],
      ['cumin', 1.5 * M.tspCumin, ''],
      ['chilli-powder', 1.5 * M.tspChilli, ''],
      ['black-pepper', 2 * M.tspPepper, ''],
      ['salt', 10, ''],
      ['coriander', 4, ''],
      ['water', 520, 'TfT 1.5 cups per 680 g to boil the meat, cooked off'],
    ],
    addedFat: ['oil-palm', 'ghee-desi'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'water', frac: 1, why: 'boiling water evaporated before the bhuna (TfT "until most of the water has evaporated")' },
        { ing: 'goat', frac: C.goatJuice, why: 'meat juices dried off (C.goatJuice, USDA goat raw → roasted)' },
        { ing: 'tomato', frac: C.tomatoBhuna, why: 'tomatoes mashed down until glossy and the oil separates' },
      ],
    },
  },
  ...['home', 'restaurant'].map((style) => ({
    id: `aloo-gosht-${style}`,
    dish: `Aloo gosht (beef or mutton with potatoes), ${style} style`,
    sources: [
      { ref: 'TfT-aloo-gosht', url: 'https://www.teaforturmeric.com/mutton-and-potato-curry-aloo-gosht/', used: '1–1.2 lb bone-in goat/lamb; ¼ cup oil + 1 tbsp ghee; 1 medium onion; 2 small tomatoes; 6–7 garlic; 1" ginger; spices; 1 tbsp yogurt; 2 small potatoes; 1–1¼ cups water simmered 1.5 h then fried dry (bhunai), then 2–2¼ cups water for the shorba, 23–25 min covered.' },
      { ref: 'F&S-aloo-gosht', url: 'https://www.flourandspiceblog.com/aalu-gosht/', used: '1 lb boneless beef (or 1.5 lb bone-in); ⅓ cup oil; 2 medium onions; 1 tbsp each garlic, ginger; spices; 2 tomatoes; 2 potatoes; 2.5 cups water simmered 45–55 min, then potatoes 15 min; consistency to taste.' },
    ],
    fatBasis: style === 'home'
      ? 'Per kg boneless-equivalent beef: TfT ¼ cup oil + 1 tbsp ghee (67 g) per ~0.45 kg edible meat → 150 g/kg; F&S ⅓ cup (73 g) per 454 g → 160 g/kg. Home standard 150 g/kg (120 g oil + 30 g ghee).'
      : 'Restaurant/dhaba standard 260 g per kg meat (200 g palm-type oil + 60 g ghee): home load × 1.7, to sit inside the Lab\'s 12–20% restaurant salan range.',
    ingredients: [
      ['beef-stew', 1000, 'boneless beef (F&S); bone-in goat in TfT'],
      ...(style === 'home' ? [['oil-cooking', 120, ''], ['ghee-desi', 30, '']] : [['oil-palm', 200, ''], ['ghee-desi', 60, '']]),
      ['potato', 600, 'TfT 2 small (340 g) per ~0.5 kg; F&S 2 potatoes per 454 g'],
      ['onion', 330, 'TfT 1 medium, F&S 2 medium per ~450 g meat'],
      ['tomato', 300, 'TfT 2 small, F&S 2'],
      ['garlic', 30, ''],
      ['ginger', 25, ''],
      ['yogurt', 30, 'TfT 1 tbsp'],
      ['coriander-powder', 3 * M.tspCoriander, ''],
      ['chilli-powder', 2 * M.tspChilli, ''],
      ['turmeric', M.tspTurmeric, ''],
      ['garam-masala', 2, ''],
      ['salt', 14, ''],
      ['coriander', 5, ''],
      ['water', 560, 'first cooking water (TfT 1–1¼ cups; F&S 2.5 cups) per 450 g → per kg'],
      ['water', 1000, 'shorba water (TfT 2–2¼ cups per ~450 g)'],
    ],
    addedFat: style === 'home' ? ['oil-cooking', 'ghee-desi'] : ['oil-palm', 'ghee-desi'],
    cooking: {
      method: 'steps',
      steps: [
        { grams: 560, why: 'first cooking water cooked off in the bhunai (TfT)' },
        { ing: 'beef-stew', frac: C.beefJuice, why: 'beef juices cooked off in the bhunai (C.beefJuice, USDA chuck braised yield 0.67)' },
        { ing: 'onion', frac: C.onionBrown, why: 'onions browned (F&S "bronze edges")' },
        { ing: 'tomato', frac: C.tomatoBhuna, why: 'tomatoes cooked to a paste' },
        { grams: 1000 * (C.simmerCovered30 * (25 / 30)), why: 'shorba water, covered 23–25 min (C.simmerCovered30)' },
      ],
    },
  })),
  {
    id: 'keema-home',
    dish: 'Keema (beef mince) with peas/potatoes, home style',
    sources: [
      { ref: 'TfT-aloo-keema', url: 'https://www.teaforturmeric.com/aloo-keema/', used: '1 lb ground beef; ⅓ cup oil; 1 large onion browned 8–10 min; 5–6 garlic; 1" ginger; 1 large tomato; spices; 2 tbsp yogurt; 1 medium-large potato; ¼ cup water; "until … the oil starts to separate".' },
      { ref: 'TfT-keema-matar', url: 'https://www.teaforturmeric.com/keema-matar/', used: '1 lb ground beef; 3 tbsp oil; 1 medium onion; 5–6 garlic; 1" ginger; 1 medium tomato; 1 tbsp yogurt; 1 cup peas; ½ cup water; covered 15 min, then dried until the oil separates.' },
      { ref: 'F&S-aaloo-qeema', url: 'https://www.flourandspiceblog.com/aaloo-qeema-ground-beef-and-potatoes/', used: '1 lb lean ground beef; ¼–⅓ cup oil; 1 small onion; 1½ tbsp each ginger and garlic; 3 tomatoes; 1 large potato (~1 cup); 1 cup water; consistency to taste.' },
    ],
    fatBasis: 'Oil per lb mince: TfT aloo keema ⅓ cup (73 g), TfT keema matar 3 tbsp (41 g), F&S ¼–⅓ cup (64 g) → median 64 g per 454 g → 140 g per kg mince.',
    ingredients: [
      ['beef-mince-80', 500, 'half of the mince as 80/20 (TfT: lean or full-fat both work)'],
      ['beef-mince-90', 500, 'half as 90/10 (F&S lean)'],
      ['oil-cooking', 140, ''],
      ['onion', 240, 'TfT 1 large (150) / 1 medium (110), F&S 1 small (70) per lb'],
      ['tomato', 330, 'TfT 1 large (182), 1 medium (123); F&S 3 (≈ 369) per lb'],
      ['potato', 200, 'aloo keema: 1 potato (≈ 200 g) per lb; keema matar: none'],
      ['peas-green', 160, 'keema matar: 1 cup (145 g) per lb; aloo keema: none'],
      ['garlic', 25, ''],
      ['ginger', 20, ''],
      ['yogurt', 40, '1–2 tbsp per lb'],
      ['coriander-powder', 3 * M.tspCoriander, ''],
      ['chilli-powder', 2 * M.tspChilli, ''],
      ['turmeric', M.tspTurmeric, ''],
      ['cumin', 2 * M.tspCumin, ''],
      ['garam-masala', 1.5, ''],
      ['salt', 14, ''],
      ['coriander', 8, ''],
      ['green-chilli', 4 * A.hariMirch, ''],
      ['water', 330, 'TfT ¼–½ cup, F&S 1 cup per lb'],
    ],
    addedFat: ['oil-cooking'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'onion', frac: C.onionBrown, why: 'onions golden brown 8–10 min' },
        { ing: ['beef-mince-80', 'beef-mince-90'], frac: C.beefJuice * 0.7, why: 'mince "until the moisture dries up", then covered; 70% of the braising loss (assumption: mince is not braised as long)' },
        { ing: 'tomato', frac: C.tomatoBhuna, why: 'tomato cooked until the oil separates' },
        { grams: 330 * C.dryOff, why: 'added water dried until the oil separates (C.dryOff)' },
      ],
    },
  },
  ...['home', 'restaurant'].map((style) => ({
    id: `nihari-${style}`,
    dish: `Beef nihari, ${style} style`,
    sources: [
      { ref: 'TfT-nihari', url: 'https://www.teaforturmeric.com/easy-slow-cooker-nihari-beef-stew/', used: '1 lb boneless beef shank; ⅓ cup oil + 1 tbsp ghee; 1 large onion; 5–6 garlic; ¾" ginger; nihari masala; 1¼ tsp salt; ¼ cup atta to thicken; 9 cups water stovetop or 3½ cups slow cooker.' },
      { ref: 'Shan-nihari-pack', url: 'https://www.shanfoods.com/product/recipe-mixes/curry/nihari/', used: 'Meat 1 kg + 2 kg knuckle and marrow bones (marrow added to the gravy); onion 1 medium; flour 100 g in 2 cups water; oil 1 cup / 175 ml; 18 cups water, 6 h for beef; "remove excessive oil before serving, if desired".' },
      { ref: 'F&S-nihari', url: 'https://www.flourandspiceblog.com/nihari/', used: '2 lb beef chunks + 1–2 lb bones; ginger, garlic, chilli, coriander; ghee/oil "for cooking" (no amount); 1 large onion.' },
    ],
    fatBasis: style === 'home'
      ? 'Per kg beef: TfT ⅓ cup oil + 1 tbsp ghee (85 g per 454 g) → 188 g; Shan 1 cup (161 g) plus bone marrow. Home standard 170 g per kg (120 g oil + 50 g ghee), marrow not counted.'
      : 'Restaurant nihari is served with a layer of tari (fat) and marrow: standard 320 g per kg beef (220 g palm-type oil + 100 g ghee), about double the home load; Shan\'s note to skim "excessive oil" shows how much is in the pot.',
    ingredients: [
      ['beef-shank', 1000, 'boneless shank (TfT; nalli gosht)'],
      ...(style === 'home' ? [['oil-cooking', 120, ''], ['ghee-desi', 50, '']] : [['oil-palm', 220, ''], ['ghee-desi', 100, 'ghee + marrow fat (tari)']]),
      ['onion', 200, 'TfT 1 large per lb; Shan 1 medium per kg'],
      ['atta', 80, 'TfT ¼ cup (30 g) per lb → 66 g/kg; Shan 100 g flour per kg'],
      ['garlic', 30, ''],
      ['ginger', 20, 'paste + julienne garnish'],
      ['chilli-powder', 4 * M.tspChilli, 'nihari masala'],
      ['coriander-powder', 2 * M.tspCoriander, ''],
      ['garam-masala', 5, 'nihari masala (fennel, whole spices)'],
      ['salt', 14, ''],
      ['water', 1200, 'gravy water per kg beef (assumption: TfT slow cooker 3½ cups per lb ≈ 1830 g/kg is thinner; Shan cooks 18 cups down for 6 h)'],
      ['lemon-juice', 10, 'garnish'],
    ],
    addedFat: style === 'home' ? ['oil-cooking', 'ghee-desi'] : ['oil-palm', 'ghee-desi'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'onion', frac: C.onionBrown, why: 'onion fried golden (tarka)' },
        { ing: 'water', frac: 0.1, why: 'covered low simmer for hours (assumption)' },
      ],
    },
  })),
  ...['home', 'restaurant'].map((style) => ({
    id: `haleem-${style}`,
    dish: `Beef haleem, ${style} style`,
    sources: [
      { ref: 'TfT-haleem-IP', url: 'https://www.teaforturmeric.com/easy-pakistani-haleem-recipe-instant-pot/', used: '1 lb beef stew meat; ¼ cup each chana and maash dal; 2 tbsp each masoor, moong, basmati, barley; ¼ cup oats; ¼ cup oil + 2 tbsp ghee; tarka ½ onion in 2–3 tbsp ghee/oil; 1 large onion; 6 garlic; 1" ginger; 1–2 tomatoes; 2 tbsp yogurt; 3 cups water.' },
      { ref: 'TfT-haleem-slow', url: 'https://www.teaforturmeric.com/easier-slow-cooker-haleem-pakistani-beef-and-lentil-stew-gluten-free/', used: 'Same pulses/rice per lb beef; ¼ cup oil + 2 tbsp ghee; tarka 2 tbsp ghee + 2 tbsp oil; 2 cups stock.' },
      { ref: 'Shan-haleem-masala-pack', url: 'https://www.shanfoods.com/product/recipe-mixes/haleem/haleem-masala/', used: 'Meat 400 g boneless + 500 g bones; oil/ghee 1–2 cups; garlic paste; 1 onion; cracked wheat 200 g; chana daal 100 g; 15 cups water, 4–6 h, ground coarsely, 1 h more.' },
    ],
    fatBasis: style === 'home'
      ? 'TfT: ¼ cup oil + 2 tbsp ghee + 2–3 tbsp tarka (≈ 112 g fat) per 454 g beef → home standard 112 g per 454 g.'
      : 'Shan pack: 1–2 cups oil/ghee (161–322 g) per 400 g meat; restaurant standard 1 cup per 400 g → 183 g per 454 g beef (130 g palm-type oil + 53 g ghee).',
    ingredients: [
      ['beef-stew', 454, '1 lb (TfT)'],
      ['wheat-whole', 100, 'Shan cracked wheat 200 g per 400 g meat; TfT none (rice/oats/barley instead) → 100 g'],
      ['chana-dal', 60, 'TfT ¼ cup (48 g); Shan 100 g per 400 g'],
      ['urad-dal', 30, 'TfT ¼ cup maash'],
      ['masoor-dal', 20, ''],
      ['moong-dal', 20, ''],
      ['barley', 20, 'TfT 2 tbsp'],
      ['rice-basmati-raw', 20, 'TfT 2 tbsp'],
      ...(style === 'home' ? [['oil-cooking', 70, ''], ['ghee-desi', 42, '']] : [['oil-palm', 130, ''], ['ghee-desi', 53, '']]),
      ['onion', 185, 'TfT 1 large + ½ small (tarka)'],
      ['tomato', 120, ''],
      ['garlic', 18, ''],
      ['ginger', 15, ''],
      ['yogurt', 30, '2 tbsp'],
      ['chilli-powder', 2 * M.tspChilli, 'haleem masala'],
      ['turmeric', 0.75 * M.tspTurmeric, ''],
      ['garam-masala', 4, ''],
      ['salt', 14, ''],
      ['water', 1100, 'TfT 3 cups + 2 cups stock-equivalent; Shan 15 cups boiled down for hours'],
      ['lemon-juice', 10, 'garnish'],
    ],
    addedFat: style === 'home' ? ['oil-cooking', 'ghee-desi'] : ['oil-palm', 'ghee-desi'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'onion', frac: C.onionBrown, why: 'onions browned (base and tarka)' },
        { ing: 'tomato', frac: C.tomatoBhuna, why: 'masala cooked down' },
        { ing: 'water', frac: 0.15, why: 'long covered cook and final 20–30 min simmer to a thick, spoonable porridge (assumption)' },
      ],
    },
  })),
  {
    id: 'seekh-kebab',
    dish: 'Seekh kebab (beef), grilled',
    sources: [
      { ref: 'TfT-seekh', url: 'https://www.teaforturmeric.com/baked-pakistani-seekh-kabob/', used: '1 lb ground beef (20% fat); ½ small-medium onion; 4 green chillies; ¼ cup cilantro; 2 tbsp mint; 1 tbsp garlic; ¾ tbsp ginger; spices; 1¼ tsp kosher salt; seared in a little oil, then baked/broiled. 10 kababs from ~¼ cup each.' },
      { ref: 'Shan-tikka-seekh-pack', url: 'https://www.shanfoods.com/product/recipe-mixes/bbq/tikka-seekh-kabab/', used: 'Minced meat with fats 1 kg; garlic paste 2 tbsp; onion 1 small (squeezed); green chillies 1–2 tbsp; egg white 1; melted butter 2–3 tbsp; grilled over coals.' },
    ],
    fatBasis: 'Butter in the mix: Shan 2–3 tbsp per kg (≈ 35 g); TfT none, just a film of oil to sear → 18 g butter per kg. Most of the fat is the mince\'s own: 80/20 beef, of which 41% drips off on the grill (USDA broiled patty).',
    ingredients: [
      ['beef-mince-80', 1000, '80/20 (TfT "20% fat – not lean"; Shan "with fats")'],
      ['beef-tallow', minceDrip(1000), 'fat that drips off on the grill: 41% of the mince fat (FDC 174036 → 171797)'],
      ['butter', 18, 'Shan 35 g/kg; TfT 0'],
      ['onion', 85, 'TfT ½ small-medium per lb (≈ 99 g/kg); Shan 1 small (70 g)'],
      ['green-chilli', 30, ''],
      ['garlic', 17, ''],
      ['ginger', 13, ''],
      ['coriander', 9, ''],
      ['mint', 4, ''],
      ['egg', 17, '½ egg white per kg (Shan 1 white per kg ≈ 33 g; TfT none)'],
      ['coriander-powder', 4 * M.tspCoriander, 'TfT 2 tsp seeds per lb'],
      ['cumin', 4 * M.tspCumin, ''],
      ['black-pepper', 2 * M.tspPepper, ''],
      ['garam-masala', 2, ''],
      ['salt', 12, ''],
    ],
    addedFat: ['butter'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: ['beef-mince-80', 'onion', 'green-chilli', 'garlic', 'ginger', 'coriander', 'mint', 'egg'], frac: +minceWaterFrac.toFixed(3), why: 'grilled like a broiled 80/20 patty: 25.2 g water lost per 100 g raw (FDC 174036 → 171797, yield 0.667 with the fat drip)' },
      ],
    },
  },
  {
    id: 'chicken-tikka',
    dish: 'Chicken tikka (leg quarter, grilled), restaurant / BBQ',
    sources: [
      { ref: 'Shan-chicken-tikka-pack', url: 'https://www.shanfoods.com/product/recipe-mixes/bbq/chicken-tikka/', used: 'Skinless chicken 1½ kg (8–10 portions, slit); lemon juice 8–10 tbsp; oil/melted butter 6 tbsp (2 in the marinade, the rest to baste); grilled over coal or gas.' },
      { ref: 'TfT-tandoori-chicken', url: 'https://www.teaforturmeric.com/tandoori-chicken/', used: '5 skinless leg quarters (~2.5 lb); ⅓ cup Greek yogurt; 2 tbsp oil + 2 tbsp butter; 2 tbsp lemon; 6–8 garlic; 1" ginger; 1 tbsp tomato paste; spices; 2½ tsp kosher salt; baked then broiled.' },
    ],
    fatBasis: 'Oil/butter per kg bone-in chicken: Shan 6 tbsp (≈ 82 g) per 1.5 kg → 55 g; TfT 2 tbsp oil + 2 tbsp butter (≈ 50 g fat) per 1.13 kg → 44 g. Standard 25 g oil + 30 g butter per kg.',
    ingredients: [
      ['chicken-leg-meat', 1000, 'skinless leg quarters; edible 0.63 (CoFID 18-293/18-294)', { edible: LEG_EDIBLE }],
      ['oil-cooking', 25, 'marinade'],
      ['butter', 30, 'basting'],
      ['yogurt', 60, 'TfT ⅓ cup per 1.13 kg (Shan none)'],
      ['lemon-juice', 60, 'Shan 8–10 tbsp per 1.5 kg; TfT 2 tbsp'],
      ['garlic', 15, ''],
      ['ginger', 12, ''],
      ['tomato-paste', 14, 'TfT 1 tbsp'],
      ['chilli-powder', 5 * M.tspChilli, 'tikka masala'],
      ['coriander-powder', 2 * M.tspCoriander, ''],
      ['cumin', 2 * M.tspCumin, ''],
      ['garam-masala', 2, ''],
      ['salt', 12, ''],
    ],
    addedFat: ['oil-cooking', 'butter'],
    cooking: { method: 'steps', steps: [{ ing: ['chicken-leg-meat', 'yogurt', 'lemon-juice'], frac: 0.27, why: 'grilled leg meat: FDC 173619 raw (P 19.16) → 172380 roasted (P 24.22), yield 0.791 → 20.9 g water per 100 g lost = 0.27 of its water; marinade taken as drying with it' }] },
  },
  {
    id: 'shami-kebab',
    dish: 'Shami kebab (beef and chana daal), shallow-fried',
    sources: [
      { ref: 'TfT-shami', url: 'https://www.teaforturmeric.com/shami-kebab/', used: '1.5 lb ground beef; 1 cup chana dal; 4½ cups water (stovetop) cooked off; 1 medium-large onion + 1 small onion; 8–10 garlic; 1½" ginger; spices; green chillies, cilantro, mint; 1 small egg in the mix + 1–2 eggs to dip; shallow-fried in oil "as needed". 20 patties (¼ cup each).' },
      { ref: 'F&S-shami', url: 'https://www.flourandspiceblog.com/shami-kabab/', used: '900 g beef/mutton stewing cubes; 200 g chana daal; 2.5" ginger; 8 garlic; ½ cup + ½ medium onion; 2.5–3 cups water simmered 50–60 min then dried; 15–20 g each cilantro and mint; 6 green chillies; 22 kababs.' },
      { ref: 'Shan-shami-pack', url: 'https://www.shanfoods.com/product/recipe-mixes/fried/shami-kabab/', used: 'Boneless meat 1 kg; chana daal 200 g; onions 250 g; garlic paste 2 tbsp; ginger paste 1 tbsp; eggs 1–2; 500 ml oil to shallow-fry; ~20 patties.' },
    ],
    fatBasis: 'Shallow-frying oil taken up: 6 g per 100 g of patty (Bognár 2002 retention tables: pan-fried breaded meat dishes, fat uptake 5–6 g per 100 g food ingredients) — the references give only "oil as needed" / 500 ml in the pan.',
    ingredients: [
      ['beef-stew', 1000, 'boneless beef (F&S, Shan); TfT uses mince'],
      ['chana-dal', 220, 'TfT 282, F&S 222, Shan 200 g per kg meat'],
      ['onion', 200, 'TfT 294, F&S 122, Shan 250 g/kg'],
      ['garlic', 25, ''],
      ['ginger', 25, ''],
      ['green-chilli', 30, ''],
      ['coriander', 18, ''],
      ['mint', 12, ''],
      ['egg', 100, 'binding + dipping (TfT 1 small + 1–2; Shan 1–2)'],
      ['chilli-powder', 2 * M.tspChilli, 'chilli flakes'],
      ['cumin', 2 * M.tspCumin, ''],
      ['coriander-powder', 2 * M.tspCoriander, ''],
      ['black-pepper', 2 * M.tspPepper, ''],
      ['garam-masala', 3, ''],
      ['salt', 15, ''],
      ['water', 220 * ((100 - 9.18) / (100 - 67.3)) - 220, 'water held by the cooked chana dal (CoFID 13-077, 67.3%); the rest of the cooking water is dried off'],
      ['oil-cooking', 90, 'shallow-fry uptake ≈ 6 g per 100 g patty (Bognár)'],
    ],
    addedFat: ['oil-cooking'],
    cooking: {
      method: 'steps',
      steps: [
        { ing: 'beef-stew', frac: C.beefJuice, why: 'meat cooked until tender and dried (C.beefJuice)' },
        { ing: 'onion', frac: C.onionSoft, why: 'onion boiled with the meat then dried' },
      ],
    },
    pieces: 20,
  },
  {
    id: 'chapli-kebab',
    dish: 'Chapli kebab (beef), fried',
    sources: [
      { ref: 'TfT-chapli', url: 'https://www.teaforturmeric.com/chapli-kabab/', used: '1 lb ground beef (20% fat); 3 tbsp corn flour or besan; ½ medium-large onion; 2 scallions; green chillies; 3–4 garlic; ½–¾" ginger; ¼ cup cilantro; anardana 1.5–2 tbsp; 3 tbsp coriander seeds, 1 tbsp cumin, ajwain; chilli flakes; 1½ tsp kosher salt; 1 egg; 1 small Roma tomato, deseeded; fried in "enough oil to generously cover the bottom". 10 kababs of ~90 g.' },
      { ref: 'F&S-chicken-chapli', url: 'https://www.flourandspiceblog.com/chicken-chapli-kabab/', used: 'Chicken version (same binders and spice: corn flour, egg, tomato, onion, coriander seed, anardana); used for the binder ratio.' },
    ],
    fatBasis: 'Frying fat taken up ≈ 6 g per 100 g raw patty (Bognár pan-fried); 43% of the mince fat renders out into the pan (USDA 80/20 pan-broiled patty: FDC 174036 → 171798).',
    ingredients: [
      ['beef-mince-80', 1000, '80/20 (TfT)'],
      ['beef-tallow', -Math.round(1000 * 0.2 * (1 - (15.94 * (17.17 / 24.04)) / 20)), 'mince fat rendered into the pan (pan-broiled patty: fat kept 0.569)'],
      ['cornflour', 53, '3 tbsp per lb'],
      ['onion', 140, '½ medium-large + 2 scallions per lb'],
      ['tomato', 110, '1 small Roma per lb, deseeded'],
      ['egg', 110, '1 egg per lb'],
      ['green-chilli', 25, ''],
      ['garlic', 22, ''],
      ['ginger', 12, ''],
      ['coriander', 9, ''],
      ['coriander-powder', 33, '3 tbsp coriander seeds per lb (5 g/tbsp)'],
      ['cumin', 13, '1 tbsp per lb'],
      ['chilli-powder', 5, ''],
      ['salt', 10, ''],
      ['oil-palm', 90, 'frying fat taken up (≈ 6 g per 100 g raw patty)'],
    ],
    addedFat: ['oil-palm'],
    cooking: {
      method: 'steps',
      steps: [{ ing: ['beef-mince-80', 'onion', 'tomato', 'egg', 'green-chilli', 'garlic', 'ginger', 'coriander'], frac: +((100 * (1 - 17.17 / 24.04) - 20 * (1 - (15.94 * (17.17 / 24.04)) / 20)) / 61.87).toFixed(3), why: 'fried thin like a pan-broiled 80/20 patty (FDC 174036 → 171798: yield 0.714 incl. fat loss)' }],
    },
  },
];
