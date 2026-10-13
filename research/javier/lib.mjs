// Shared lookup helpers for Javier's research scripts (Nutrition Lab).
// Every nutrient number used by build.mjs and recipes.mjs is read here from a cached source file:
//   USDA FDC (SR Legacy, Foundation, FNDDS)  research/cache/usda/index.json (built by research/usda.mjs)
//   BEDCA                                    research/cache/bedca/f_<id>.xml (fetched by research/javier/bedca.sh get <id>)
//   CoFID 2021                               research/cache/cofid/proximates.tsv (built by research/javier/cofid.py)
// Carbohydrate is always AVAILABLE carbohydrate: USDA "by difference" minus fibre; BEDCA and CoFID
// already report available carbohydrate.
// Owner: Javier Morales.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..', '..');
const CACHE = path.join(ROOT, 'research', 'cache');

let usdaList = null;
function usdaIndex() {
  if (!usdaList) {
    const list = JSON.parse(fs.readFileSync(path.join(CACHE, 'usda', 'index.json'), 'utf8'));
    usdaList = new Map(list.map((f) => [f.fdcId, f]));
  }
  return usdaList;
}

const DATASET_LABEL = { sr_legacy: 'SR Legacy', foundation: 'Foundation', fndds: 'FNDDS' };

/** USDA food per 100 g, carbs = available (by difference − fibre). */
export function usda(fdcId) {
  const f = usdaIndex().get(Number(fdcId));
  if (!f) throw new Error(`USDA ${fdcId} not in research/cache/usda/index.json`);
  const n = f.n;
  const kcal = n.kcal ?? n.kcalAtwaterSpecific ?? n.kcalAtwaterGeneral;
  const fiber = n.fiber ?? 0;
  if (n.protein == null || n.fat == null || n.carbsDiff == null || kcal == null)
    throw new Error(`USDA ${fdcId} lacks a core nutrient`);
  return {
    src: `USDA FDC ${DATASET_LABEL[f.dataset]} ${f.fdcId}`,
    description: f.description,
    kcal,
    protein: n.protein,
    carbs: Math.max(0, n.carbsDiff - fiber),
    carbsDiff: n.carbsDiff,
    fat: n.fat,
    fiber,
    fiberReported: n.fiber != null,
    sugars: n.sugars ?? n.sugarsNLEA ?? null,
    satFat: n.satFat ?? null,
    sodium: n.sodiumMg ?? null,
    water: n.water ?? null,
  };
}

/** BEDCA food per 100 g edible portion, from the cached XML (kJ converted at 4.184). */
export function bedca(id) {
  const file = path.join(CACHE, 'bedca', `f_${id}.xml`);
  if (!fs.existsSync(file)) throw new Error(`BEDCA ${id} not cached: run research/javier/bedca.sh get ${id}`);
  const xml = fs.readFileSync(file, 'utf8');
  const name = (xml.match(/<f_ori_name>([^<]*)<\/f_ori_name>/) || [])[1];
  const edible = Number((xml.match(/<edible_portion>([^<]*)<\/edible_portion>/) || [])[1]);
  const values = {};
  for (const m of xml.matchAll(/<foodvalue>([\s\S]*?)<\/foodvalue>/g)) {
    const block = m[1];
    const c = (block.match(/<c_ori_name>([^<]*)<\/c_ori_name>/) || [])[1]?.trim();
    const v = (block.match(/<best_location>([^<]*)<\/best_location>/) || [])[1]?.trim();
    if (c) values[c] = v === '' || v == null ? null : Number(v);
  }
  const get = (k) => values[k] ?? null;
  const kj = get('energía, total');
  return {
    src: `BEDCA ${id} ${name}`,
    description: name,
    edible,
    kcal: kj == null ? null : kj / 4.184,
    protein: get('proteina, total') ?? 0,
    carbs: get('carbohidratos') ?? 0, // null = "traza" in BEDCA → 0
    fat: get('grasa, total (lipidos totales)') ?? 0,
    fiber: get('fibra, dietetica total') ?? 0,
    sugars: get('azúcares, totales'),
    satFat: get('ácidos grasos saturados totales'),
    sodium: get('sodio'),
    water: get('agua (humedad)'),
  };
}

let cofidRows = null;
/** CoFID 2021 proximates (available carbohydrate; fibre = AOAC if present, else NSP). */
export function cofid(code) {
  if (!cofidRows) {
    cofidRows = new Map();
    for (const line of fs.readFileSync(path.join(CACHE, 'cofid', 'proximates.tsv'), 'utf8').split('\n')) {
      const f = line.split('\t');
      if (f.length > 10) cofidRows.set(f[0], f);
    }
  }
  const f = cofidRows.get(code);
  if (!f) throw new Error(`CoFID ${code} not found`);
  const num = (s) => (s === 'Tr' || s === 'N' || s === 'None' || s === '' ? 0 : Number(s));
  const aoac = f[7] && f[7] !== 'N' && f[7] !== 'None' ? Number(f[7]) : null;
  return {
    src: `CoFID 2021 ${code}`,
    description: f[1],
    kcal: num(f[2]),
    protein: num(f[3]),
    carbs: num(f[4]),
    fat: num(f[5]),
    fiber: aoac ?? num(f[6]),
    fiberKind: aoac != null ? 'AOAC' : 'NSP',
  };
}

export const r1 = (x) => Math.round(x * 10) / 10;
export const r0 = (x) => Math.round(x);
export const atwater = (p) => 4 * p.protein + 4 * p.carbs + 9 * p.fat + 2 * p.fiber;

/** Round a nutrient profile to record precision (kcal whole, macros 0.1 g, sodium whole mg). */
export function toPer100g(p, { kcal } = {}) {
  const out = {
    kcal: r0(kcal ?? p.kcal),
    protein: r1(p.protein),
    carbs: r1(p.carbs),
    fat: r1(p.fat),
    fiber: r1(p.fiber),
  };
  if (p.sugars != null) out.sugars = Math.min(r1(p.sugars), r1(out.carbs + 0.5));
  if (p.satFat != null) out.satFat = Math.min(r1(p.satFat), out.fat);
  if (p.sodium != null) out.sodium = r0(p.sodium);
  return out;
}
