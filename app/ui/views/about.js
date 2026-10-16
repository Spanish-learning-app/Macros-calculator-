// About the data (route `about`). Owner: Priya. Credits every source the Lab uses (kickoff
// decision 9). The main text is docs/NUTRITION.md §7.4 "as written" (Ayesha); the grades and the
// reference-values source below it come from RULES, and so does the halal shopping guide (O8).
import { h, mountChildren } from '../dom.js';
import { halalGuideBody } from '../components/halal-guide.js';

const SOURCES = [
  [
    'U.S. Department of Agriculture, Agricultural Research Service. ',
    'FoodData Central',
    ' (SR Legacy, Foundation Foods, FNDDS). fdc.nal.usda.gov. Public domain.',
  ],
  [
    'Longvah T, Ananthan R, Bhaskarachary K, Venkaiah K. ',
    'Indian Food Composition Tables 2017',
    '. National Institute of Nutrition (ICMR), Hyderabad.',
  ],
  [
    'Public Health England. ',
    'McCance and Widdowson’s The Composition of Foods Integrated Dataset 2021',
    '. Contains public sector information licensed under the Open Government Licence v3.0.',
  ],
  [
    'Base de Datos Española de Composición de Alimentos (BEDCA), Agencia Española de Seguridad Alimentaria y Nutrición (AESAN). www.bedca.net.',
    '',
    '',
  ],
  [
    '',
    'Food Composition Table for Pakistan',
    ' (revised 2001). NWFP Agricultural University Peshawar, UNICEF and the Ministry of Planning and Development.',
  ],
  [
    'ICMR-National Institute of Nutrition. ',
    'Dietary Guidelines for Indians',
    ' (2024), household measures.',
  ],
  [
    'Food and Agriculture Organization and the Government of Pakistan. ',
    'Pakistan Dietary Guidelines for Better Nutrition',
    ' (2019), household measures.',
  ],
  ['Product labels, as printed on the date shown on each food.', '', ''],
];

/**
 * @param {HTMLElement} container @param {{ store: object, router: object, rules: object }} ctx
 */
export function mount(container, ctx) {
  const { rules } = ctx;
  const root = h('div', { class: 'view view-about' });
  mountChildren(container, root);

  function render() {
    const grades = rules?.vocab?.confidenceGrades ?? [];
    mountChildren(
      root,
      h(
        'article',
        { class: 'card about' },
        h('h2', { class: 'view-title' }, 'Where our numbers come from'),
        h(
          'p',
          null,
          'Every food in Katori shows its source. Numbers are per 100 g as eaten, and portions show their grams. Home and restaurant dishes are calculated from standard recipes and marked “estimate” where cooking varies a lot. Your targets are estimates too: watch your weight trend and adjust.',
        ),
        h(
          'ul',
          { class: 'about-sources' },
          SOURCES.map(([before, title, after]) =>
            h('li', null, before, title ? h('cite', null, title) : null, after),
          ),
        ),
        h(
          'p',
          null,
          h('strong', null, 'Halal: '),
          'every food shows halal, check or not halal, with the reason. Cafés and restaurants may share slicers, grills or fryers with pork; Katori does not track this per food, so ask if it matters to you.',
        ),
        h(
          'p',
          null,
          'Katori is not medical advice. If you are pregnant or breastfeeding, under 18, have kidney disease, diabetes on medication, or an eating disorder, please ask a doctor or dietitian.',
        ),
      ),
      // STATUS O8: Ayesha's halal shopping guide, after the first card (rules 1.7.2).
      rules?.halalGuide
        ? h(
            'section',
            {
              class: 'card halal-guide',
              'aria-labelledby': 'halal-guide-h',
              'data-testid': 'halal-guide',
            },
            h('h3', { class: 'card-title', id: 'halal-guide-h' }, rules.halalGuide.title),
            halalGuideBody(rules.halalGuide),
          )
        : null,
      grades.length
        ? h(
            'section',
            { class: 'card', 'aria-labelledby': 'grades-h' },
            h('h3', { class: 'card-title', id: 'grades-h' }, 'How sure we are about each food'),
            h(
              'dl',
              { class: 'details-dl about-grades' },
              grades.map((g) => [
                h('dt', null, `${g.id}: ${g.label}`),
                h(
                  'dd',
                  null,
                  g.description,
                  g.badge ? h('span', { class: 'badge-estimate' }, g.badge) : null,
                ),
              ]),
            ),
          )
        : null,
      rules?.skipDefaults?.source
        ? h(
            'section',
            { class: 'card', 'aria-labelledby': 'ref-h' },
            h('h3', { class: 'card-title', id: 'ref-h' }, 'Reference values (if you skip set-up)'),
            h('p', { class: 'field-help' }, rules.skipDefaults.source),
          )
        : null,
    );
  }

  return {
    update() {
      render();
    },
    unmount() {
      container.replaceChildren();
    },
  };
}
