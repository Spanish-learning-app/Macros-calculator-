// R-MP-36 · Picoteo box: hummus, queso de Burgos, boiled eggs, crudités and wholemeal picos (dinner or lunch). Batch: 2.
export default {
  n: 36,
  slot: 'dinner',
  serving: 'portion',
  boxes: 2,
  effort: 'assemble',
  minutes: 10,
  cuisine: 'spanish',
  shortName: 'Picoteo plate',
  id: 'es-picoteo-hummus-burgos-portion',
  name: 'Picoteo plate: hummus, queso de Burgos, boiled eggs, crudités and picos (dinner portion)',
  names: {
    en: 'Picoteo plate: hummus, queso de Burgos, boiled eggs, crudités and picos',
    es: 'Picoteo: hummus, queso de Burgos, huevos duros, crudités y picos integrales',
    ca: 'Pica-pica: hummus, formatge de Burgos, ous durs, crudités i picos integrals',
  },
  aliases: ['picoteo', 'pica pica', 'snack plate', 'adult lunchable', 'mezze plate', 'protein snack box', 'hummus plate', 'tabla de picoteo'],
  pitch: 'The Spanish "picoteo" dinner for tired evenings: dip, cheese, eggs and crunchy vegetables, nothing to cook.',
  eat: 'cold',
  tags: ['spanish', 'mediterranean', 'meal-prep', 'eat-cold', 'contains-egg', 'vegetarian'],
  references: [
    { title: 'The Forked Spoon, Protein snack pack (lunch meal prep)', url: 'https://theforkedspoon.com/protein-snack-pack-lunch-meal-prep/', used: 'hummus, nuts, cheese, cherry tomatoes, sugar snap peas, cucumber and hard-boiled eggs; 5 packs, sealed and refrigerated', read: 'search-engine page extract, 2026-10-14' },
    { title: 'This Healthy Table, Adult lunchables', url: 'https://thishealthytable.com/blog/adult-lunchables/', used: 'boxes of dip, cheese, eggs, vegetables and crackers assembled ahead', read: 'search-engine page extract, 2026-10-14' },
  ],
  components: [
    {
      id: 'crudites', label: 'Crudités and hummus', storage: 'cold-salad', yield: 'none', eat: 'cold',
      lines: [
        ['hummus', 140, '70 g per portion'],
        ['carrot', 160, 'sticks'],
        ['pepper-red', 140, 'strips'],
        ['cucumber', 160, 'sticks'],
        ['tomato-cherry', 120, ''],
      ],
    },
    {
      id: 'eggs', label: 'Hard-boiled eggs (2 per portion)', storage: 'egg-dish', yield: 'none', eat: 'cold',
      lines: [['egg-boiled', 200, '4 eggs from the Sunday batch']],
    },
    {
      id: 'cheese', label: 'Queso de Burgos 0% (2 tubs)', storage: 'proposed:sealed-pack', yield: 'none', eat: 'cold',
      lines: [
        ['burgos-0', 250, '2 tubs of 62.5 g per portion'],
        ['oil-olive', 6, 'a drizzle with oregano (3 g per portion)'],
        ['oregano', 1, ''],
      ],
    },
    {
      id: 'picos', label: 'Wholemeal picos', storage: 'proposed:bread', yield: 'none', eat: 'cold',
      lines: [['picos', 60, '30 g per portion']],
    },
  ],
  method: [
    'Cut the carrot, pepper and cucumber into sticks; split between 2 boxes with the tomatoes and a 70 g pot of hummus each.',
    'Add 2 peeled boiled eggs per box (Sunday batch) and 2 sealed Burgos tubs.',
    'To eat: tip the Burgos onto a plate with a drizzle of olive oil and oregano; dip the vegetables and picos in the hummus.',
  ],
  keeps: '2 days in the fridge (cut vegetables, opened hummus)',
  storagePlan: 'Cut vegetables keep 2 days: make 2 boxes at a time. Picos stay in their bag; Burgos tubs stay sealed.',
  reheat: 'Not reheated: everything is eaten cold.',
  crossCheck: null,
  changes: [
    'No deli meat or cheddar (the references\' choices): eggs and queso de Burgos 0% carry the protein; nuts left out to keep the portion at about 600 kcal.',
    'Wholemeal picos in place of crackers (no lard; label 2026-10-14).',
  ],
  confidence: 'B',
  confidenceWhy: 'No cooking (eggs from the Sunday batch). Dated labels (hummus, Burgos, picos) and USDA SR Legacy values (egg, vegetables).',
  halal: { status: 'halal', reason: 'Hummus (additives de origen vegetal), Burgos with microbial rennet, eggs, vegetables and picos without lard.' },
};
