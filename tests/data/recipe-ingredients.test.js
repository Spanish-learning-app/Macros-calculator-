// Ingredient coverage for the Sprint 2 recipe flows (CUSTOMER A10 and A16): a user can only build
// "Mi tortilla", the lentejas pot and "Tikka bowls" from foods that exist. Each missing ingredient
// is a TODO naming the owner (it stays green, and turns into a pass when the Lab adds the record).
// recipes-mealprep.js ingredient foodIds must also be FOODS ids (gate M2), so raw ingredients the
// Lab sheets use (raw chicken thigh, dry basmati) need records too. Owner: Kenji.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS } from '../../app/data/index.js';

const text = (f) => `${f.id} ${f.name} ${f.state}`.toLowerCase();
const state = (f) => f.state.toLowerCase();
const isDryRice = (f) =>
  /rice|chawal/.test(text(f)) &&
  f.group !== 'lunchbox' &&
  /dry|uncooked|raw|as sold/.test(state(f)) &&
  !/boiled|cooked/.test(state(f).split(',')[0]);

/** [what, predicate, who]. Each row is one ingredient from the customer's A10 / A16 lists. */
export const NEEDED = [
  ['A10 raw egg', (f) => f.id === 'intl-egg-raw', 'Ayesha'],
  ['A10 raw potato', (f) => f.id === 'intl-potato-raw', 'Ayesha'],
  ['A10 raw onion', (f) => f.id === 'intl-onion' && /raw/.test(state(f)), 'Ayesha'],
  ['A10 olive oil', (f) => f.id === 'med-olive-oil', 'Ayesha'],
  ['A10 dry brown lentils', (f) => /lentejas/.test(f.id) && /dry|raw/.test(state(f)), 'Ayesha'],
  ['A10 carrot', (f) => /carrot/.test(text(f)), 'Ayesha'],
  ['A10 halal beef sausage', (f) => /sausage/.test(f.id) && /beef/.test(f.id), 'Ayesha'],
  [
    'A16 boneless chicken thigh, raw',
    (f) => /chicken/.test(text(f)) && /thigh/.test(text(f)) && /raw/.test(state(f)),
    'Ayesha / Yusuf',
  ],
  ['A16 dahi', (f) => f.id === 'intl-dahi', 'Ayesha'],
  ['A16 cooking oil', (f) => f.id === 'intl-cooking-oil', 'Ayesha'],
  ['A16 dry basmati rice', isDryRice, 'Ayesha / Yusuf'],
  ['A16 cucumber', (f) => f.id === 'intl-cucumber', 'Ayesha'],
  [
    'A16 / A18 library box "Chicken tikka rice bowl"',
    (f) => f.id === 'pk-chicken-tikka-rice-box',
    'Yusuf',
  ],
  ['A18 library box "Chicken chana chaat"', (f) => f.id === 'pk-chicken-chana-chaat-box', 'Yusuf'],
];

for (const [what, predicate, who] of NEEDED) {
  const hits = FOODS.filter(predicate);
  test(
    `recipe ingredient coverage: ${what}`,
    { todo: hits.length ? undefined : `missing in FOODS (${who})` },
    () => {
      assert.ok(hits.length > 0, `no food record for ${what}`);
    },
  );
}
