// Sample day templates built from desi food. PROVISIONAL (Sprint 1).
// Owner: Dr. Ayesha Siddiqui (Nutrition Lab). Source: kickoff memo §6 (team/meetings/001-kickoff/).
//
// Status: every item below references a PLANNED food id (`planned: true`) because the food files
// were still empty when this was written. At the data review Ayesha replaces planned ids with the
// shipped ids, recomputes totals from FOODS, and drops `planned`. Until then:
//   - `approx` values are the memo's hand estimates (±10%); QA must NOT test against them;
//   - the UI must not show a template whose items do not all resolve in FOODS.
//
// Item shape: { foodId, servingId, qty, label, approx: { kcal, protein }, planned? }
//   servingId 'g' means raw grams (qty = grams), as in docs/ARCHITECTURE.md.
// Slot ids are RULES.mealSlots.default ids.

export default {
  status: 'provisional',
  updated: '2026-10-13',
  templates: [
    {
      id: 'cut-1800',
      label: '1,800 kcal cut (desi)',
      goal: 'lose',
      approxTotals: { kcal: 1800, protein: 141 },
      slots: {
        breakfast: [
          { foodId: 'pk-omelette-desi', servingId: 'egg', qty: 2, label: 'Desi omelette, 2 eggs', approx: { kcal: 190, protein: 12.5 }, planned: true },
          { foodId: 'pk-roti-wheat-home', servingId: 'medium', qty: 1, label: '1 roti (medium)', approx: { kcal: 110, protein: 3.5 }, planned: true },
          { foodId: 'pk-chai-doodh-patti-no-sugar', servingId: 'cup', qty: 1, label: 'Doodh patti, no sugar', approx: { kcal: 80, protein: 4 }, planned: true },
        ],
        lunch: [
          { foodId: 'pk-chicken-salan-home', servingId: 'katori', qty: 1, label: 'Chicken salan, 1 katori', approx: { kcal: 280, protein: 25 }, planned: true },
          { foodId: 'pk-roti-wheat-home', servingId: 'medium', qty: 1, label: '1 roti (medium)', approx: { kcal: 110, protein: 3.5 }, planned: true },
          { foodId: 'pk-kachumber-salad', servingId: 'katori', qty: 1, label: 'Kachumber salad', approx: { kcal: 30, protein: 1 }, planned: true },
          { foodId: 'pk-raita', servingId: 'katori-small', qty: 0.65, label: 'Raita, about 100 g', approx: { kcal: 60, protein: 5 }, planned: true },
        ],
        evening: [
          { foodId: 'pk-chai-doodh-patti-no-sugar', servingId: 'cup', qty: 1, label: 'Doodh patti, no sugar', approx: { kcal: 80, protein: 4 }, planned: true },
          { foodId: 'pk-bhuna-chana', servingId: 'g', qty: 30, label: 'Bhuna chana, 30 g', approx: { kcal: 110, protein: 6 }, planned: true },
        ],
        dinner: [
          { foodId: 'pk-chicken-tikka-boneless', servingId: 'g', qty: 150, label: 'Chicken tikka (boneless), 150 g', approx: { kcal: 240, protein: 37 }, planned: true },
          { foodId: 'pk-daal-masoor-home', servingId: 'katori', qty: 1, label: 'Masoor daal, 1 katori', approx: { kcal: 190, protein: 10 }, planned: true },
          { foodId: 'pk-roti-wheat-home', servingId: 'medium', qty: 1, label: '1 roti (medium)', approx: { kcal: 110, protein: 3.5 }, planned: true },
          { foodId: 'pk-kachumber-salad', servingId: 'katori', qty: 1, label: 'Kachumber salad', approx: { kcal: 30, protein: 1 }, planned: true },
        ],
        snacks: [
          { foodId: 'intl-whey-protein', servingId: 'scoop', qty: 1, label: 'Whey, 1 scoop in water', approx: { kcal: 120, protein: 24 }, planned: true },
          { foodId: 'intl-kinnow', servingId: 'piece', qty: 1, label: '1 kinnow', approx: { kcal: 60, protein: 1 }, planned: true },
        ],
      },
    },
    {
      id: 'maintain-2550',
      label: '2,550 kcal maintain (desi)',
      goal: 'maintain',
      approxTotals: { kcal: 2550, protein: 139.5 },
      slots: {
        breakfast: [
          { foodId: 'pk-paratha-plain-home', servingId: 'piece', qty: 1, label: '1 plain paratha', approx: { kcal: 300, protein: 6 }, planned: true },
          { foodId: 'intl-egg-fried', servingId: 'egg', qty: 2, label: '2 fried eggs (anday)', approx: { kcal: 220, protein: 12.5 }, planned: true },
          { foodId: 'pk-chai-doodh-patti-1-tsp', servingId: 'cup', qty: 1, label: 'Doodh patti, 1 tsp sugar', approx: { kcal: 100, protein: 4 }, planned: true },
        ],
        lunch: [
          { foodId: 'pk-daal-masoor-home', servingId: 'katori', qty: 1, label: 'Masoor daal, 1 katori', approx: { kcal: 190, protein: 10 }, planned: true },
          { foodId: 'pk-rice-boiled', servingId: 'katori-large', qty: 1, label: 'Boiled rice, 1 large katori', approx: { kcal: 325, protein: 6.5 }, planned: true },
          { foodId: 'pk-shami-kebab', servingId: 'piece', qty: 1, label: '1 shami kebab', approx: { kcal: 150, protein: 9 }, planned: true },
          { foodId: 'pk-kachumber-salad', servingId: 'katori', qty: 1, label: 'Kachumber salad', approx: { kcal: 30, protein: 1 }, planned: true },
        ],
        evening: [
          { foodId: 'pk-chai-doodh-patti-1-tsp', servingId: 'cup', qty: 1, label: 'Doodh patti, 1 tsp sugar', approx: { kcal: 100, protein: 4 }, planned: true },
          { foodId: 'pk-biscuit-marie', servingId: 'piece', qty: 2, label: '2 tea biscuits', approx: { kcal: 95, protein: 1.5 }, planned: true },
        ],
        dinner: [
          { foodId: 'pk-chicken-karahi-home', servingId: 'katori', qty: 1.5, label: 'Chicken karahi (home), 1½ katori', approx: { kcal: 510, protein: 45 }, planned: true },
          { foodId: 'pk-roti-wheat-home', servingId: 'medium', qty: 2, label: '2 roti (medium)', approx: { kcal: 220, protein: 7 }, planned: true },
          { foodId: 'pk-kachumber-salad', servingId: 'katori', qty: 1, label: 'Kachumber salad', approx: { kcal: 30, protein: 1 }, planned: true },
        ],
        snacks: [
          { foodId: 'intl-whey-protein', servingId: 'scoop', qty: 1, label: 'Whey, 1 scoop', approx: { kcal: 120, protein: 24 }, planned: true },
          { foodId: 'pk-milk-full-cream', servingId: 'glass', qty: 1, label: 'Full-cream milk, 1 glass', approx: { kcal: 160, protein: 8 }, planned: true },
        ],
      },
    },
    {
      id: 'gain-3045',
      label: '3,045 kcal gain (desi)',
      goal: 'gain',
      approxTotals: { kcal: 3045, protein: 170.1 },
      slots: {
        breakfast: [
          { foodId: 'pk-paratha-plain-home', servingId: 'piece', qty: 1, label: '1 plain paratha', approx: { kcal: 300, protein: 6 }, planned: true },
          { foodId: 'pk-omelette-desi', servingId: 'egg', qty: 3, label: 'Desi omelette, 3 eggs', approx: { kcal: 260, protein: 19 }, planned: true },
          { foodId: 'pk-chai-doodh-patti-1-tsp', servingId: 'cup', qty: 1, label: 'Doodh patti, 1 tsp sugar', approx: { kcal: 100, protein: 4 }, planned: true },
        ],
        lunch: [
          { foodId: 'pk-chicken-biryani-home', servingId: 'g', qty: 350, label: 'Chicken biryani (home), 350 g', approx: { kcal: 600, protein: 30 }, planned: true },
          { foodId: 'pk-raita', servingId: 'katori-small', qty: 1, label: 'Raita, 1 small katori', approx: { kcal: 110, protein: 5 }, planned: true },
          { foodId: 'pk-kachumber-salad', servingId: 'katori', qty: 1, label: 'Kachumber salad', approx: { kcal: 30, protein: 1 }, planned: true },
        ],
        evening: [
          { foodId: 'pk-chai-doodh-patti-1-tsp', servingId: 'cup', qty: 1, label: 'Doodh patti, 1 tsp sugar', approx: { kcal: 100, protein: 4 }, planned: true },
          { foodId: 'pk-biscuit-marie', servingId: 'piece', qty: 2, label: '2 tea biscuits', approx: { kcal: 95, protein: 1.5 }, planned: true },
        ],
        dinner: [
          { foodId: 'pk-chicken-karahi-home', servingId: 'katori', qty: 1.5, label: 'Chicken karahi (home), 1½ katori', approx: { kcal: 510, protein: 45 }, planned: true },
          { foodId: 'pk-roti-wheat-home', servingId: 'medium', qty: 2, label: '2 roti (medium)', approx: { kcal: 220, protein: 7 }, planned: true },
          { foodId: 'pk-kachumber-salad', servingId: 'katori', qty: 1, label: 'Kachumber salad', approx: { kcal: 30, protein: 1 }, planned: true },
        ],
        snacks: [
          { foodId: 'intl-whey-protein', servingId: 'scoop', qty: 1, label: 'Whey, 1 scoop (after the gym)', approx: { kcal: 120, protein: 24 }, planned: true },
          { foodId: 'pk-milk-full-cream', servingId: 'glass', qty: 1, label: 'Full-cream milk, 1 glass', approx: { kcal: 160, protein: 8 }, planned: true },
          { foodId: 'intl-banana', servingId: 'piece', qty: 1, label: '1 banana (kela)', approx: { kcal: 105, protein: 1.3 }, planned: true },
          { foodId: 'pk-dahi-full-fat', servingId: 'g', qty: 200, label: 'Dahi, 200 g', approx: { kcal: 130, protein: 7 }, planned: true },
          { foodId: 'intl-almonds', servingId: 'g', qty: 30, label: 'Almonds, 30 g', approx: { kcal: 175, protein: 6.3 }, planned: true },
        ],
      },
    },
  ],
};
