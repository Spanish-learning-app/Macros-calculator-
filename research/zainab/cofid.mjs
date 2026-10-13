#!/usr/bin/env node
// Search/get CoFID 2021 proximates (dumped by cofid-extract.py), with carbs converted to
// available carbohydrate BY WEIGHT (see cofid-extract.py docstring) and fibre = AOAC else NSP.
//   node research/zainab/cofid.mjs search chapati
//   node research/zainab/cofid.mjs get 11-xxx
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const list = JSON.parse(fs.readFileSync(path.join(here, '..', 'cache', 'cofid', 'proximates.json'), 'utf8'));
const n = (v) => (v == null || v === 'N' || v === '' ? null : v === 'Tr' ? 0 : Number(v));
export function conv(f) {
  const star = n(f.STAR), gl = n(f.GLUC), fr = n(f.FRUCT), ga = n(f.GALACT);
  const su = n(f.SUCR), ma = n(f.MALT), la = n(f.LACT), ol = n(f.OLIGO), cho = n(f.CHO);
  let carbs = null, carbsNote = '';
  if (star != null && [gl, fr, su, la].every((x) => x != null)) {
    carbs = star / 1.1 + (gl || 0) + (fr || 0) + (ga || 0) + ((su || 0) + (ma || 0) + (la || 0)) / 1.05 + (ol || 0) / 1.1;
    carbsNote = 'fractions';
  } else if (star != null && n(f.TOTSUG) != null) {
    carbs = star / 1.1 + n(f.TOTSUG) / 1.05;
    carbsNote = 'starch+totsug/1.05';
  } else if (cho != null) {
    carbs = cho / 1.08;
    carbsNote = 'CHO/1.08 (no fractions)';
  }
  const aoac = n(f.AOACFIB), nsp = n(f.ENGFIB);
  return {
    code: f.code, name: f.name, desc: f.desc, ref: f.ref,
    kcal: n(f.KCALS), protein: n(f.PROT), fat: n(f.FAT), choMonoEq: cho,
    carbs: carbs == null ? null : +carbs.toFixed(2), carbsNote,
    fiber: aoac ?? nsp, fiberBasis: aoac != null ? 'AOAC' : nsp != null ? 'NSP' : 'none',
    sugars: n(f.TOTSUG), water: n(f.WATER),
  };
}
const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'search') {
  const terms = args.join(' ').toLowerCase().split(/\s+/);
  for (const f of list.filter((x) => terms.every((t) => (x.name + ' ' + (x.desc || '')).toLowerCase().includes(t)))) {
    const c = conv(f);
    console.log(`${c.code}\t${c.kcal} kcal\tP${c.protein} C${c.carbs} F${c.fat} Fib${c.fiber}(${c.fiberBasis})\t${c.name} | ${c.desc ?? ''}`);
  }
} else if (cmd === 'get') {
  for (const id of args) {
    const f = list.find((x) => x.code === id);
    console.log(f ? JSON.stringify(conv(f)) : `{"code":"${id}","error":"not found"}`);
  }
}
