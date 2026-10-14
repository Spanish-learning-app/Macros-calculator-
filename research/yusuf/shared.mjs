// Shared pieces of the Sprint 2 prep sheets (breakfast and dinner). Owner: Yusuf Benali.

// Wholemeal roti from the weekly roti stock: Zainab Rauf's home roti (research/zainab/recipes/pk-roti.md,
// TfT dough ratio, 34.4% cooked water). 1 roti = 29.4 g atta + 20.6 g water → 40 g cooked (FNDDS
// 2707713 "medium 7-inch" roti = 40 g). `count` = rotis in the whole batch.
export function rotiComponent(count, { label = `Wholemeal roti (${count} for the batch)`, size = 40 } = {}) {
  const atta = Math.round(((count * size) / 0.799 / 1.705) * 10) / 10;
  return {
    id: 'roti', label, storage: 'cooked-flatbread', yield: 'roti', yieldAll: true, eat: 'hot',
    lines: [
      ['atta', atta, `wholemeal atta, ${Math.round((atta / count) * 10) / 10} g per roti`],
      ['water', Math.round(atta * 0.7 * 10) / 10, 'dough water (0.7 g per g atta; Zainab\'s standard roti)'],
      ['salt', Math.round(atta * 0.005 * 10) / 10, 'a pinch'],
    ],
  };
}

export const ROTI_REFS = [
  { title: 'Tea for Turmeric, Roti / chapati', url: 'https://www.teaforturmeric.com/roti-chapati/', used: '2 cups atta, ¼–½ tsp salt, 1 cup water, rolled 8–9 inch, cooked on a dry tawa', read: "via Zainab Rauf's roti sheet research/zainab/recipes/pk-roti.md (read 2026-10-13/14)" },
];

export const ROTI_METHOD = 'Roti stock: knead the atta, salt and water to a soft dough, rest 20 min, divide into balls (about 50 g dough each), roll thin and cook on a dry tawa 30–40 s a side, pressing the edges so it puffs. Stack in a cloth; once cool, freeze in fours between sheets of baking paper.';
