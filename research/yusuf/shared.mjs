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


// Roti steps for a batch with roti (R3-B, Nasreen Review 3 must-fix 4; Zainab's dough, unchanged amounts). The dough
// is made first and rests while the curry cooks; the cooked food goes in the fridge 30 minutes after the heat is off,
// roti finished or not (cooked food never sits out more than 1 hour); each roti step is one action; the roti cool
// fully before they are bagged. `atta`/`water` are the sheet's line amounts, `cups`/`waterCups` their cup measures.
export function rotiSteps({ count, atta, water, cups, waterCups, ballG = 50, size = 'the size of a side plate (about 16 cm across, 2 mm thick)', pan = 'the tawa or a dry non-stick frying pan', firstTry = 2.5 }) {
  const rest = Math.round((count - 1) * firstTry);
  return {
    dough: [
      { text: `Roti dough first, so it rests while you cook: in a big bowl mix ${atta} g atta (wholemeal chapati flour, ${cups}) with a pinch of salt (1 g). Pour in ${water} ml water (${waterCups}) a little at a time, mixing with your fingers, until it comes together in one soft, slightly sticky ball.`, heat: 'none', minutes: 3 },
      { text: 'Knead 5 minutes: push the dough away with the heel of your hand, fold it back, turn it, repeat. Wet your hand if it sticks. It is ready when it is smooth and soft, like an earlobe.', heat: 'none', minutes: 5 },
      { text: 'Cover the bowl with a damp cloth and leave the dough to rest while you cook (at least 20 minutes: a rested dough rolls thin without tearing).', heat: 'none' },
    ],
    // The cooked food cools while the roti are made, and goes in the fridge on a timer.
    cool: (what) => ({ text: `Spread the ${what} on the tray to cool and set a timer for 30 minutes. When it rings, put the tray in the fridge, even if the roti are not finished: cooked food never sits out more than 1 hour.`, heat: 'none' }),
    cook: [
      { text: `Divide the dough into ${count} equal balls of about ${ballG} g (golf-ball size${ballG > 60 ? ' or a little bigger' : ''}) and keep them under the cloth. Heat ${pan}, with no oil, for 2 minutes.`, heat: 'medium-high', minutes: 2 },
      { text: `Roll one ball: dip it in dry atta, flatten it with your palm and roll it into a thin circle ${size}. Give it a quarter turn every few rolls so it stays round, and dust with atta when it sticks.`, heat: 'none', minutes: 1 },
      { text: 'First side: lay the roti on the hot dry pan. When small bubbles show (20–30 seconds), flip it.', heat: 'medium-high', minutes: 0.5 },
      { text: 'Second side: cook 30–40 seconds, pressing the edges gently with a folded cloth so it puffs. Flip once more for 10 seconds, then lay it on a clean tea towel.', heat: 'medium-high', minutes: 1 },
      { text: `Roll and cook the other ${count - 1} the same way, rolling the next one while one cooks. On a first try each one takes 2–3 minutes, so allow about ${rest} minutes.`, heat: 'medium-high', minutes: rest },
      { text: 'Let the roti cool fully, spread out on the tea towel (about 10 minutes), before you bag them: bagged warm, they go soggy.', heat: 'none', minutes: 10, wait: true },
    ],
  };
}
