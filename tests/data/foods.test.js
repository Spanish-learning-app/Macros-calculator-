// Data gate over the real Lab data (app/data/index.js): every record passes G1–G23 as implemented
// in tests/data/_gate.js (from docs/NUTRITION.md §8, independent of research/check-foods.mjs and of
// core/foods.validateFood). A failing record fails this test with the gate and message. Owner: Kenji.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS, RULES } from '../../app/data/index.js';
import { checkRecord, checkFamilies } from './_gate.js';

test('data gate: no food id is used twice (G1, across all files)', () => {
  const seen = new Map();
  const dupes = [];
  for (const f of FOODS) {
    if (seen.has(f.id)) dupes.push(f.id);
    seen.set(f.id, true);
  }
  assert.deepEqual(dupes, []);
});

test(`data gate: all ${FOODS.length} food records pass G1–G23`, (t) => {
  const failures = [];
  const warnCounts = {};
  for (const food of FOODS) {
    const { fails, warns } = checkRecord(food, RULES);
    for (const x of fails) failures.push(`${food.id} ${x.gate}: ${x.message}`);
    for (const x of warns) warnCounts[x.gate] = (warnCounts[x.gate] ?? 0) + 1;
  }
  t.diagnostic(`warnings by gate: ${JSON.stringify(warnCounts)}`);
  assert.deepEqual(failures, []);
});

test('data gate: families share a group (G18 warns are reported, not failed)', (t) => {
  const warns = checkFamilies(FOODS);
  t.diagnostic(`${warns.length} G18 warning(s)`);
  for (const w of warns) t.diagnostic(`G18 ${w.id}: ${w.message}`);
  assert.ok(Array.isArray(warns));
});
