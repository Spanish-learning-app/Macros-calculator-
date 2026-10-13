// Household-measure conversions used by the recipe sheets. All from USDA SR Legacy published
// portion weights (food_portion.csv), looked up with `node research/zainab/portions.mjs <fdcId>`
// on 2026-10-13, unless marked otherwise.
export const M = {
  tbspOil: 13.6, // FDC 171411 1 tbsp
  tspOil: 4.5, // FDC 171411 1 tsp
  cupOil: 218, // FDC 171411 1 cup → 0.92 g/ml
  mlOil: 0.92, // 218 g / 237 ml
  tspSugar: 4.2, // FDC 169655 1 tsp
  cupSugar: 200, // FDC 169655
  tspSalt: 6, // FDC 173468
  tbspSalt: 18, // FDC 173468
  tspTurmeric: 3, // FDC 172231
  tspChilli: 1.8, // FDC 170932 red or cayenne
  tspCoriander: 1.8, // FDC 170922
  tspCumin: 2.1, // FDC 170923 whole
  tspPepper: 2.3, // FDC 170931 ground
  tbspPepper: 6.9, // FDC 170931 ground
  clove: 3, // FDC 169230 garlic 1 clove
  tspGarlic: 2.8, // FDC 169230 (paste taken as chopped)
  tspGinger: 2, // FDC 169231
  onionMedium: 110, // FDC 170000
  onionLarge: 150, // FDC 170000
  onionSmall: 70, // FDC 170000
  cupOnion: 160, // FDC 170000 chopped
  tomatoMedium: 123, // FDC 170457
  tomatoSmall: 91, // FDC 170457
  tomatoLarge: 182, // FDC 170457
  tomatoPlum: 62, // FDC 170457 Italian/plum
  cupTomato: 180, // FDC 170457 chopped
  potatoMedium: 213, // FDC 170026
  potatoSmall: 170, // FDC 170026
  eggLarge: 50, // FDC 171287
  cupMilk: 244, // FDC 171265
  tbspMilk: 15, // FDC 171265
  cupYogurt: 245, // FDC 171284
  cupCream: 238, // FDC 170859
  tbspCream: 15, // FDC 170859
  cupCondensed: 306, // FDC 171275
  cupWater: 237, // FDC 173227 (brewed tea, = water)
  cupRice: 185, // FDC 168877 raw long-grain
  cupLentils: 192, // FDC 174284 red lentils raw
  cupAtta: 120, // FDC 168893 whole-grain wheat flour
  cupMaida: 125, // FDC 168894 all-purpose flour
  tbspGhee: 12.8, // FDC 173412 butter oil, anhydrous
  tspGhee: 4.3, // 1/3 of FDC 173412 tbsp
  tbspButter: 14.2, // FDC 173430
  cupBesan: 92, // FDC 174288
  cupSuji: 167, // FDC 168933
  cupRaisins: 145, // FDC 168165
  bananaMedium: 118, // FDC 173944
  almond: 1.2, // FDC 170567 1 almond
  cupAlmondSliced: 92, // FDC 170567
};
// Not in USDA portions (stated assumptions, negligible energy): hari mirch (Pakistani green chilli)
// 5 g each; "1 bunch" coriander 50 g used for ½ bunch = 25 g; 1 inch ginger 10 g (USDA: 5 slices of
// 1" dia = 11 g); Kashmiri chilli taken as red chilli powder.
export const ASSUMED = { hariMirch: 5, corianderBunch: 50, gingerInch: 10 };
