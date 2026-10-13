// Mirrors the app/data/index.js contract ({ RULES, FOODS }). RULES is the real app/data/rules.js
// (the rules are the specification); FOODS are the fixture records, so Lab data edits never break
// logic tests. E2E may serve a generated module with these values in place of ./data/index.js.
// Owner: Kenji (created by Lena in Step 0).
import rules from '../../app/data/rules.js';
import foods from './foods.js';

export const RULES = rules;
export const FOODS = foods;
