// Calm notes for searches the food list can never answer (Review 2, item A5). Owner: Lena.
// Pork and alcohol are not in Katori at all, so "chorizo" or "cerveza" gets one calm line instead
// of a bare "Nothing found". Shellfish words find the Lab's seafood records; while a word has no
// record, the line says so.
import { normalize, singularWord } from '../../core/search.js';

const PORK = [
  'pork',
  'pig',
  'ham',
  'bacon',
  'lard',
  'prosciutto',
  'pepperoni',
  'salami',
  'pancetta',
  'cerdo',
  'porc',
  'cochinillo',
  'jamon',
  'pernil',
  'beicon',
  'panceta',
  'chorizo',
  'xorico',
  'salchichon',
  'fuet',
  'sobrasada',
  'sobrassada',
  'morcilla',
  'butifarra',
  'botifarra',
  'lacon',
  'torrezno',
  'serrano',
  'iberico',
  'manteca de cerdo',
  'lomo embuchado',
  'suar',
  'sur ka gosht',
];
const ALCOHOL = [
  'alcohol',
  'beer',
  'lager',
  'wine',
  'cider',
  'whisky',
  'whiskey',
  'vodka',
  'gin',
  'rum',
  'brandy',
  'cognac',
  'champagne',
  'liqueur',
  'vermouth',
  'sake',
  'cerveza',
  'cervesa',
  'birra',
  'caña',
  'vino',
  'vi negre',
  'cava',
  'sangria',
  'tinto de verano',
  'sidra',
  'ron',
  'champan',
  'licor',
  'vermut',
  'sharab',
];
const SHELLFISH = [
  'shellfish',
  'seafood',
  'prawn',
  'shrimp',
  'jhinga',
  'jheenga',
  'chingri',
  'gamba',
  'gambon',
  'langostino',
  'camaron',
  'crab',
  'cangrejo',
  'lobster',
  'langosta',
  'bogavante',
  'squid',
  'calamar',
  'calamare',
  'calamari',
  'chipiron',
  'chipirone',
  'sepia',
  'octopus',
  'pulpo',
  'mussel',
  'mejillon',
  'mejillone',
  'musclo',
  'clam',
  'almeja',
  'oyster',
  'ostra',
  'scallop',
  'vieira',
  'berberecho',
  'navaja',
  'cigala',
  'marisco',
];

const prep = (list) => list.map((w) => normalize(w).split(' ').map(singularWord).join(' '));
const TOPICS = [
  ['pork', prep(PORK)],
  ['alcohol', prep(ALCOHOL)],
  ['shellfish', prep(SHELLFISH)],
];
const PREFIX_MIN = 5; // "chori" already means chorizo; "gin" never matches "ginger"

/**
 * { topic: 'pork'|'alcohol'|'shellfish', whole } when the query names one ("chorizo", "jamón
 * serrano", "una cerveza", "gambas"), else null. Whole words, plurals folded (whole: true); a
 * word of 5+ letters may also be the start of a longer one while typing ("chori", whole: false),
 * which the sheet shows only when nothing is found ("pepper" is not pepperoni).
 * @param {string} query @returns {{ topic: 'pork'|'alcohol'|'shellfish', whole: boolean }|null}
 */
export function excludedTopic(query) {
  const words = normalize(String(query ?? ''))
    .split(' ')
    .filter(Boolean)
    .map(singularWord);
  if (!words.length) return null;
  const text = ` ${words.join(' ')} `;
  for (const [topic, list] of TOPICS) {
    if (list.some((key) => text.includes(` ${key} `))) return { topic, whole: true };
  }
  const last = words[words.length - 1];
  if (last.length < PREFIX_MIN) return null;
  for (const [topic, list] of TOPICS) {
    if (list.some((key) => !key.includes(' ') && key.length > last.length && key.startsWith(last)))
      return { topic, whole: false };
  }
  return null;
}

/** The line for pork and alcohol; with "Halal only" off, lard-made foods can show, so it says so. */
export function excludedText(topic, { halalOnly = true } = {}) {
  if (topic !== 'pork' && topic !== 'alcohol') return null;
  return halalOnly
    ? 'Katori has no pork or alcohol foods. Everything here is pork-free.'
    : 'Katori has no pork or alcohol foods. A few bakery foods made with lard are marked “Not halal”.';
}

/** The line for a shellfish word with no food: the seafood the list does have, if any. */
export function shellfishText(query, foods) {
  const kinds = new Set();
  for (const f of foods ?? []) {
    for (const t of f?.tags ?? []) if (t === 'seafood-prawn' || t === 'seafood-other') kinds.add(t);
  }
  const q = String(query ?? '').trim();
  return kinds.size
    ? `No food for “${q}” yet. Katori has prawns and other seafood: try “prawns”, “squid” or “mussels”.`
    : `No food for “${q}” yet: Katori has no prawns or other shellfish foods so far.`;
}
