// Contract: the optional `method` on a library recipe (ARCHITECTURE §13.1, brief s3-method).
// Owner: Lena. While the Lab writes methods, recipes without one pass; every method that exists must
// have the exact shape the app reads. Kenji's data gate adds "every recipe has a method" when the Lab
// is done.
import test from 'node:test';
import assert from 'node:assert/strict';
import LIBRARY from '../../app/data/recipes-mealprep.js';
import { HEATS } from '../../app/ui/components/recipe-method.js';

const SPEC_HEATS = [
  'none',
  'low',
  'medium',
  'medium-high',
  'high',
  'oven-180',
  'oven-200',
  'oven-220',
  'microwave',
];

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const textList = (v) => Array.isArray(v) && v.every(isText);

/** Problems with one method, in words; [] = matches §13.1. */
export function methodProblems(method) {
  const p = [];
  if (!method || typeof method !== 'object' || Array.isArray(method)) {
    return ['method must be an object { equipment, prep, steps, boxUp, reheat }'];
  }
  if (!textList(method.equipment)) p.push('equipment must be a list of text');
  if (!textList(method.prep)) p.push('prep must be a list of text');
  if (!Array.isArray(method.steps) || method.steps.length === 0)
    p.push('steps must be a non-empty list');
  else {
    method.steps.forEach((s, i) => {
      if (!s || typeof s !== 'object' || !isText(s.text)) p.push(`steps[${i}].text must be text`);
      if (s?.heat !== undefined && !SPEC_HEATS.includes(s.heat)) {
        p.push(`steps[${i}].heat ${JSON.stringify(s.heat)} is not one of ${SPEC_HEATS.join(', ')}`);
      }
      if (s?.minutes !== undefined && !(Number.isFinite(s.minutes) && s.minutes > 0)) {
        p.push(`steps[${i}].minutes must be a number above 0`);
      }
    });
  }
  if (!isText(method.boxUp)) p.push('boxUp must be text');
  if (!isText(method.reheat)) p.push('reheat must be text');
  if (method.doneWhen !== undefined && !isText(method.doneWhen)) p.push('doneWhen must be text');
  if (method.tips !== undefined && !textList(method.tips)) p.push('tips must be a list of text');
  const known = new Set(['equipment', 'prep', 'steps', 'doneWhen', 'boxUp', 'reheat', 'tips']);
  for (const key of Object.keys(method)) if (!known.has(key)) p.push(`unknown key ${key}`);
  return p;
}

test('the app reads exactly the §13.1 heat values', () => {
  assert.deepEqual([...HEATS], SPEC_HEATS);
});

test('every library recipe method that exists has the §13.1 shape', () => {
  const bad = LIBRARY.filter((r) => r.method !== undefined)
    .map((r) => [r.foodId, methodProblems(r.method)])
    .filter(([, p]) => p.length)
    .map(([id, p]) => `${id}: ${p.join('; ')}`);
  assert.deepEqual(bad, []);
});

test('the shape check itself catches a bad heat, an empty step list and a missing reheat', () => {
  assert.deepEqual(
    methodProblems({
      equipment: ['Pan'],
      prep: [],
      steps: [{ text: 'Fry', heat: 'hot' }],
      boxUp: 'Cool.',
    }),
    [
      'steps[0].heat "hot" is not one of none, low, medium, medium-high, high, oven-180, oven-200, oven-220, microwave',
      'reheat must be text',
    ],
  );
  assert.deepEqual(methodProblems(['Fry the onion.']).length, 1);
  assert.deepEqual(
    methodProblems({ equipment: [], prep: [], steps: [], boxUp: 'x', reheat: 'y' }),
    ['steps must be a non-empty list'],
  );
});
