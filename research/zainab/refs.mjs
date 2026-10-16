// Independent reference values typed from published sources that are not in the CoFID/FNDDS/USDA caches.
// Used by build.mjs lookup('ref', id) for records[].crossCheck. Values per 100 g as eaten/sold.
// Khan et al. 2019: carbohydrate is "by difference" (includes fibre), kcal is the paper's own Table 3
// (4P + 9F + 4C on the analysed values); fibre is not reported, so it is entered as 0.
const KHAN = 'Khan I, Yasmeen F, Ahmad J et al. 2019, Progress in Nutrition 21(2):421-429, doi:10.23751/pn.v21i2.6928 (Univ. of Agriculture Peshawar; 30 dishes cooked from averaged housewife recipes, AOAC proximate analysis in duplicate; cached research/cache/zainab-s3/khan2019.pdf)';
export const REFS = {
  'khan2019-haleem': { citation: 'Khan et al. 2019 Table 2/3 "Haleem"', name: 'Haleem, analysed (Khan 2019)', kcal: 128.34, protein: 5.38, carbs: 14.6, fat: 5.38, fiber: 0, water: 73 },
  'khan2019-kadhi': { citation: 'Khan et al. 2019 Table 2/3 "Yogurt curry with pakoras"', name: 'Yogurt curry with pakoras, analysed (Khan 2019)', kcal: 177.49, protein: 2.92, carbs: 10.29, fat: 13.85, fiber: 0, water: 71.5 },
  'off-5060601190123': { citation: 'Open Food Facts 5060601190123 (Haldiram\'s Kesar Rasmalai, UK label, 500 g)', name: 'Haldiram\'s Kesar Rasmalai, retail (UK label: 152 kcal, but its own kJ 728 = 174 kcal)', kcal: 152, protein: 5.48, carbs: 21, fat: 7.5, fiber: 0.1, sugars: 20 },
  'off-0182757000608': { citation: 'Open Food Facts 0182757000608 (rasmalai, Canadian retail label, 850 g)', name: 'Rasmalai, retail (Canadian label)', kcal: 257.14, protein: 7.14, carbs: 27.14, fat: 14.29, fiber: 0 },
};
