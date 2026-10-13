// Lab cooking-loss conventions for the 'steps' yield method (fraction of an ingredient's WATER that
// evaporates in a step). One table for every sheet so home and restaurant versions, and different
// dishes, are treated alike. Each value names its basis; values marked (assumption) make the dish
// grade C at best.
export const C = {
  // Onion fried in oil 5–10 min loses 24% of its water: CoFID 2021 13-501 "Onions, fried in sunflower
  // oil" (water, fat, N analysed 2011) vs raw 13-499 — protein 1.0 → 1.2 g/100 g gives fried weight
  // 83 g per 100 g raw incl. 4.4 g fat taken up, so 21.4 g of 89.1 g water lost.
  onionSoft: 0.25,
  // Onion browned to golden/brown, 12–15 min (most salan bases): Bognár 2002 (BFE-R-02-03) table 17,
  // "Onion, brown, roasted" (fried in fat) weight yield 0.42 ± 0.03 (n = 3) vs "Onion, transparent"
  // 0.83. A yield of 0.42 even with some fat taken up means ≥ 65% of the onion's water is gone.
  onionBrown: 0.65,
  // Birista (onions deep-fried crisp, lifted out): beyond Bognár's "brown" stage (assumption).
  onionCrisp: 0.85,
  // Egg dishes, Bognár 2002 table 2: scrambled eggs 0.91, fried egg 0.87 (weight yields, with fat).
  eggScrambled: 0.91,
  eggFried: 0.87,
  // Tomato fried: CoFID 13-603 "Tomatoes, fried in corn oil" vs raw 13-517 — protein 0.5 → 0.8 gives
  // 62.5 g fried per 100 g incl. 4.8 g fat, i.e. 42 of 94.6 g water lost (45%).
  tomatoFry: 0.45,
  // Tomato cooked down to a paste until oil separates (bhunai): more than a fry (assumption).
  tomatoBhuna: 0.7,
  // Water released by meat while it cooks through, as a fraction of the meat's own water
  // (USDA weight loss from protein concentration, raw → cooked):
  chickenJuice: 0.29, // FDC 171052 raw P 21.39 → 171451 stewed P 27.29: yield 0.784, water 75.5%
  beefJuice: 0.45, // FDC 171206 raw P 21.75 → 171203 braised P 32.41: yield 0.671, water ~73%
  goatJuice: 0.32, // FDC 175303 raw P 20.6 → 175304 roasted P 27.1: yield 0.76, water ~75%
  // Free water (added water + juices) during simmering (assumptions):
  simmerCovered30: 0.1, // lid on, per 30 min
  simmerAjar30: 0.3, // lid ajar or off, per 30 min
  dryOff: 0.9, // "cook until the water has evaporated and the oil separates" (bhunai finish)
};
