// Katori data module: the one place the app imports nutrition data from.
// Owner: Dr. Ayesha Siddiqui (Nutrition Lab). Contract (kickoff minutes, decision 8):
//   RULES = app/data/rules.js (plain data), FOODS = one flat array of every food record.
// Record format and gates: docs/NUTRITION.md §3 and §8 (`node research/check-foods.mjs`).
// The order of the files below is the order of FOODS; ids are unique across all of them.

import rules from './rules.js';
import pkHome from './foods-pk-home.js';
import pkRestaurant from './foods-pk-restaurant.js';
import pkBreadsRice from './foods-pk-breads-rice.js';
import pkDrinksSweets from './foods-pk-drinks-sweets.js';
import pkPackaged from './foods-pk-packaged.js';
import basics from './foods-basics.js';
import intl from './foods-intl.js';
import esMed from './foods-es-med.js';
import mealprep from './foods-mealprep.js';

export const RULES = rules;

export const FOODS = [
  ...pkHome,
  ...pkRestaurant,
  ...pkBreadsRice,
  ...pkDrinksSweets,
  ...pkPackaged,
  ...basics,
  ...intl,
  ...esMed,
  ...mealprep,
];
