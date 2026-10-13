// Mirrors the app/data/index.js contract ({ RULES, FOODS }) with fixture data.
// E2E tests may serve this module in place of ./data/index.js (page.route). Owner: Kenji.
import rules from './rules.js';
import foods from './foods.js';

export const RULES = rules;
export const FOODS = foods;
