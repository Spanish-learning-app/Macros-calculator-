// Halal shopping guide (STATUS O8): RULES.halalGuide (Ayesha, rules 1.7.2) as one <details> per
// section, closed by default. Shown on the About page and, from a "Check" food's details, in a
// dialog that opens at "What Check means". Owner: Priya. Text goes in as text nodes only.
import { h } from '../dom.js';
import { openDialog } from './dialog.js';

// Words a shopper reads on a Spanish (or Catalan) label. They get lang="es"/"ca" so a screen
// reader says them in Spanish, and italics so they stand out from the English around them.
const ES_TERMS = [
  'manteca de cerdo',
  'manteca de cacao',
  'manteca de cacahuete',
  'manteca',
  'mantequilla',
  'polvorones',
  'mantecados',
  'ensaïmadas',
  'grasa de cerdo',
  'gelatina porcina',
  'gelatina',
  'de cerdo',
  'cerdo',
  'porcino',
  'panceta',
  'tocino',
  'jamón',
  'chorizo',
  'lomo',
  'sobrasada',
  'sebo',
  'gominolas',
  'cochinilla',
  'carmín',
  'ácido carmínico',
  'mono- y diglicéridos de ácidos grasos',
  'glicerina',
  'cuajo animal',
  'cuajo microbiano',
  'cuajo vegetal',
  'cuajo',
  'vinagre de vino',
  'vino blanco',
  'vino',
  'jerez',
  'coñac',
  'licor',
  'ron',
  'cerveza',
  'salsa de soja',
  'carnicería halal',
  'Garantía Halal',
  'Junta Islámica',
  'Instituto Halal',
];
const CA_TERMS = ['llard', 'saïm', 'Ciutat Vella'];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const byLength = (a, b) => b.length - a.length;
const TERM_RE = new RegExp(
  `“[^”]+”|(?<!\\p{L})(${[...ES_TERMS, ...CA_TERMS].sort(byLength).map(escape).join('|')})(?!\\p{L})`,
  'giu',
);
const CA_SET = new Set(CA_TERMS.map((t) => t.toLowerCase()));

/**
 * One guide line as nodes: quoted phrases (“¿Lleva manteca de cerdo?”) and label words get a
 * lang attribute; the English stays plain. @param {string} text @returns {(string|Node)[]}
 */
export function guideText(text) {
  const out = [];
  let last = 0;
  for (const m of String(text).matchAll(TERM_RE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[0].startsWith('“')) out.push(h('span', { lang: 'es', class: 'guide-es' }, m[0]));
    else {
      const lang = CA_SET.has(m[0].toLowerCase()) ? 'ca' : 'es';
      out.push(h('i', { lang, class: 'guide-term' }, m[0]));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// "“¿Lleva manteca de cerdo?”: Does it have pork lard?" → the phrase to say, then its English.
const PHRASE = /^(“[^”]+”):\s*(.+)$/;

function item(text) {
  const phrase = String(text).match(PHRASE);
  if (phrase) {
    return h(
      'li',
      { class: 'guide-ask' },
      h('span', { lang: 'es', class: 'guide-phrase' }, phrase[1]),
      h('span', { class: 'guide-en' }, phrase[2]),
    );
  }
  return h('li', null, guideText(text));
}

/**
 * The guide's sections. @param {object} guide RULES.halalGuide
 * @param {{ open?: string|null, idPrefix?: string }} [options] `open`: a section id to show open
 * @returns {HTMLElement[]}
 */
export function halalGuideSections(guide, { open = null, idPrefix = 'halal-' } = {}) {
  return (guide?.sections ?? []).map((section) =>
    h(
      'details',
      {
        class: 'guide-section',
        id: idPrefix ? `${idPrefix}${section.id}` : null,
        open: section.id === open,
        'data-testid': 'halal-guide-section',
        'data-section': section.id,
      },
      h('summary', null, section.title),
      h(
        'ul',
        { class: 'guide-items' },
        (section.items ?? []).map((text) => item(text)),
      ),
    ),
  );
}

/** The guide's intro and closing note, kept with the sections. */
export function halalGuideBody(guide, options) {
  return [
    guide.intro ? h('p', { class: 'guide-intro' }, guide.intro) : null,
    h('div', { class: 'guide-list' }, halalGuideSections(guide, options)),
    guide.note ? h('p', { class: 'field-help guide-note' }, guide.note) : null,
  ];
}

/**
 * The guide in a dialog over a food's details, opened at "What Check means".
 * @param {object} rules RULES
 */
export function openHalalGuide(rules) {
  const guide = rules?.halalGuide;
  if (!guide) return null;
  return openDialog({
    title: guide.title,
    content: h(
      'div',
      { class: 'halal-guide' },
      halalGuideBody(guide, { open: 'katori-check', idPrefix: null }),
    ),
    testid: 'halal-guide-dialog',
    className: 'dlg--details',
  });
}
