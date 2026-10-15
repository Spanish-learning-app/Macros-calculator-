// Recipe sheets: kam tel (less oil) home variants, style 'home-light' (Meeting 005, wave 1).
//
// Each light sheet is DERIVED from Zainab's own home sheet of the same dish: the same ingredients,
// the same references and the same cooking steps; only the added-fat lines (cooking oil, desi ghee)
// change, as the Lab's kam-tel rule says (RULES.kamTel, NUTRITION.md §6.1; research/zainab/kam-tel-rule.mjs). The pot loses the same water
// as the home pot (oil does not evaporate), so the light pot's cooked weight is the home cooked
// weight minus the oil taken out, and every nutrient is recomputed by calc.mjs from the ingredients.
import { compute } from '../calc-core.mjs';
import karahi from './chicken-karahi.mjs';
import salan from './chicken-salan.mjs';
import daals from './daals.mjs';
import sabzi from './sabzi-egg.mjs';
import meats from './meats.mjs';
import homeMore from './home-more.mjs';
import more from './more.mjs';
import rice from './rice-dishes.mjs';
import { KAM_TEL } from '../kam-tel-rule.mjs';

const FILES = { 'chicken-karahi.mjs': karahi, 'chicken-salan.mjs': salan, 'daals.mjs': daals, 'sabzi-egg.mjs': sabzi, 'meats.mjs': meats, 'home-more.mjs': homeMore, 'more.mjs': more, 'rice-dishes.mjs': rice };
const ALL = Object.fromEntries(Object.entries(FILES).flatMap(([f, list]) => list.map((s) => [s.id, { ...s, file: `research/zainab/recipes/${f}` }])));

// Home sheets that get a kam-tel variant. `why` says how families cook this dish lighter; `tarka`
// marks dishes finished with a tarka (baghar), whose size the rule caps.
export const LIGHT = {
  'chicken-karahi-home': { why: 'Lighter home karahi: the same bhuna with half the oil and ghee; a splash of water stops the masala catching.' },
  'chicken-salan-home': { why: 'Shorba salan: onions browned in half the oil, a splash of water when they catch.' },
  'aloo-gosht-home': { why: 'Aloo gosht: half the oil and ghee for the masala; the beef\'s own fat helps the bhuna.' },
  'keema-home': { why: 'Keema matar: TfT\'s own keema matar uses 3 tbsp oil per lb (≈ 90 g per kg mince), close to the kam-tel load (70 g per kg).' },
  'masoor-daal-home': { why: 'Masoor daal: onion and tomato softened in most of the (halved) oil, a small tarka on top.', tarka: true },
  'moong-daal-home': { why: 'Moong daal: half the oil and ghee; a small ghee tarka on top, the rest softens the onion.', tarka: true },
  'mash-daal-home': { why: 'Daal mash: the onion-tomato masala sautéed in half the oil.' },
  'chana-daal-home': { why: 'Chana daal: half the oil and ghee; a small ghee tarka on top, the rest softens the onion and tomato.', tarka: true },
  'bhindi-home': { why: 'Bhindi: okra stir-fried with half the oil (non-stick pan).' },
  'aloo-gobi-home': { why: 'Aloo gobi: half the oil, cooked covered in its own steam.' },
  'sarson-ka-saag': { why: 'Saag: half the oil and ghee; a small ghee tarka, the makhan on top still logged apart.', tarka: true },
  'chicken-korma-home': { why: 'Korma: half the oil and ghee; the yogurt-onion base stays.' },
  'chicken-biryani-home': { why: 'Home biryani: the chicken qorma layer cooked in half the oil.' },
  'chicken-pulao-home': { why: 'Yakhni pulao: onions browned and rice fried in half the oil and ghee.' },
  'anda-curry-home': { why: 'Anda curry: half the oil for the masala.' },
  'cholay-home': { why: 'Cholay: half the oil for the masala.' },
  'aloo-palak-home': { why: 'Aloo palak: half the oil, cooked covered.' },
};

const r1 = (x) => Math.round(x * 10) / 10;
const sum = (lines, ids) => lines.filter(([id]) => ids.includes(id)).reduce((s, [, q]) => s + q, 0);

function lightOf(home, { why, tarka }) {
  const homeRes = compute(home);
  const evaporated = r1(homeRes.rawG - homeRes.cookedG);
  const fatIds = home.addedFat || [];
  const homeFat = sum(home.ingredients, fatIds);
  let k = KAM_TEL.addedFatFraction;
  // floor: added fat per 100 g served never below minAddedFatPer100g
  const fatPer100 = (kk) => (100 * homeFat * kk) / (homeRes.cookedG - homeFat * (1 - kk));
  let floorNote = '';
  if (fatPer100(k) < KAM_TEL.minAddedFatPer100g) {
    while (fatPer100(k) < KAM_TEL.minAddedFatPer100g) k += 0.01;
    k = +k.toFixed(2);
    floorNote = ` Half the fat would fall under the ${KAM_TEL.minAddedFatPer100g} g per 100 g floor, so the fraction is raised to ${k}.`;
  }
  const lightFat = r1(homeFat * k);
  const cookedLight = r1(homeRes.cookedG - (homeFat - lightFat));
  // tarka: at most tarkaMaxGPer100gServed g per 100 g served, taken from ghee first (the desi tarka fat), then oil
  let tarkaLeft = tarka ? Math.floor(((cookedLight * KAM_TEL.tarkaMaxGPer100gServed) / 100) * 2) / 2 : 0;
  const order = [...fatIds].sort((a, b) => (b.startsWith('ghee') ? 1 : 0) - (a.startsWith('ghee') ? 1 : 0));
  const tarkaOf = {};
  for (const id of order) {
    const q = r1(sum(home.ingredients, [id]) * k);
    tarkaOf[id] = Math.min(q, tarkaLeft);
    tarkaLeft = r1(tarkaLeft - tarkaOf[id]);
  }
  const ingredients = [];
  for (const line of home.ingredients) {
    const [id, qty, note = '', opts] = line;
    if (!fatIds.includes(id)) { ingredients.push(line); continue; }
    const q = r1(qty * k);
    const t = Math.min(tarkaOf[id] || 0, q);
    tarkaOf[id] = r1((tarkaOf[id] || 0) - t);
    const base = `home ${qty} g × ${k}${note ? ` (home note: ${note})` : ''}`;
    if (t > 0) {
      if (q - t > 0) ingredients.push([id, r1(q - t), `kam tel, bhunai: ${base}, less the tarka`, ...(opts ? [opts] : [])]);
      ingredients.push([id, t, `kam tel, tarka on top (≤ ${KAM_TEL.tarkaMaxGPer100gServed} g per 100 g served)`, ...(opts ? [opts] : [])]);
    } else ingredients.push([id, q, `kam tel${tarka ? ', bhunai' : ''}: ${base}`, ...(opts ? [opts] : [])]);
  }
  const tarkaG = r1(ingredients.filter((l) => /tarka on top/.test(l[2])).reduce((acc, l) => acc + l[1], 0));
  return {
    id: `${home.id}-light`,
    dish: `${home.dish}, kam tel (less oil)`,
    style: 'home-light',
    derivedFrom: home.id,
    homeFatG: r1(homeFat),
    lightFatG: lightFat,
    fraction: k,
    sources: [
      ...(home.sources || []),
      { ref: `Sheet ${home.id}`, url: home.file, used: `Every ingredient, quantity and cooking step taken from Zainab's home sheet; only the added fat changed. ${why}` },
    ],
    fatBasis: `Derived from the home sheet \`${home.id}\`. Home added fat: ${r1(homeFat)} g per pot (${home.fatBasis ? home.fatBasis.replace(/\.$/, '') : 'see the home sheet'}). Kam-tel rule (${KAM_TEL.source}): ${KAM_TEL.text}. Here: ${r1(homeFat)} g × ${k} = ${lightFat} g per pot (${r1(homeFat - lightFat)} g less).${floorNote} ${tarka ? `Tarka: ${tarkaG} g on top (cap ${KAM_TEL.tarkaMaxGPer100gServed} g per 100 g × ${cookedLight} g served), the rest of the fat softens the onion and masala in the pot.` : 'No separate tarka in this dish: all the fat goes into the bhunai.'} ${why}`,
    ingredients,
    addedFat: fatIds,
    cooking: {
      method: 'evaporate',
      grams: evaporated,
      basis: `Same water loss as the home pot (${evaporated} g, from the home sheet's ${home.cooking.method === 'steps' ? 'cooking steps' : `\`${home.cooking.method}\` yield`}), as RULES.kamTel says: ingredients, water and yield as the home sheet, and oil does not evaporate, so the cooked weight falls only by the oil removed (home ${homeRes.cookedG} g → light ${cookedLight} g). Where less oil makes the masala catch, a splash of water is added and cooked off again, so the water balance is unchanged.`,
    },
  };
}

export default Object.entries(LIGHT)
  .map(([id, cfg]) => {
    const home = ALL[id];
    if (!home) throw new Error(`kam-tel: no home sheet ${id}`);
    return lightOf(home, cfg);
  });
