// The Lab's kam-tel rule as Zainab's pipeline applies it. Source of truth: RULES.kamTel in
// app/data/rules.js (Ayesha, rules 1.7.0, NUTRITION.md §6.1, gate G25):
//   - every added-fat line (oil, ghee; bhunai and tarka) × addedFatFraction;
//   - ingredients, water and yield as the home sheet; cooked weight falls by the oil removed;
//   - the tarka stays small: at most tarkaMaxGPer100gServed g per 100 g served;
//   - added fat never below minAddedFatPer100g (enough oil to bhuno the masala).
import RULES from '../../app/data/rules.js';

const R = RULES.kamTel;
if (!R) throw new Error('RULES.kamTel missing (rules.js 1.7.0)');
export const KAM_TEL = {
  ...R,
  source: `RULES.kamTel, rules ${RULES.version}, NUTRITION.md §6.1`,
  label: `× ${R.addedFatFraction}`,
  text: `every added-fat line (oil and ghee, bhunai and tarka) × ${R.addedFatFraction}; same ingredients, water and yield; tarka at most ${R.tarkaMaxGPer100gServed} g per 100 g served; added fat at least ${R.minAddedFatPer100g} g per 100 g`,
  keepFor: () => R.addedFatFraction,
};
