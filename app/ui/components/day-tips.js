// Protein tips and Ramadan lines on the Day view (Sprint 3 wave 2, Lena). NUTRITION.md §12, §13.
// Calm and plain: they inform, never judge; no red, no warning icons, no rulings.
import { h } from '../dom.js';
import { iconEl } from './icons.js';
import { fmtGrams, fmtKcal, servingOf } from './format.js';
import { amountText } from './ingredient-sheet.js';
import { rowName } from './food-bits.js';
import { timeText } from '../../core/ramadan.js';

const fill = (text, values) =>
  String(text ?? '').replace(/\{(\w+)\}/g, (m, key) => (key in values ? values[key] : m));

/**
 * The protein tip card (§13.2), or the sehri line (§12.4) with the same ideas and buttons.
 * @param {{ tip: object, rules: object, hideKcal?: boolean, onIdea: (idea: object) => void,
 *   onNotToday: () => void, onTurnOff: () => void }} props
 */
export function renderTipCard({ tip, rules, hideKcal = false, onIdea, onNotToday, onTurnOff }) {
  const text = rules?.proteinNudges?.text ?? {};
  const sehri = tip.kind === 'sehri';
  const heading = sehri
    ? fill(rules?.ramadan?.text?.sehriProtein, { eaten: fmtGrams(tip.eaten) })
    : fill(text.title, { eaten: fmtGrams(tip.eaten), target: fmtGrams(tip.target) });
  const body = sehri ? null : fill(text.body, { slot: tip.slotLabel });
  const help = sehri
    ? null
    : fill(text.help, { pct: tip.pct, afterSlot: tip.afterLabel ?? tip.afterSlot });

  return h(
    'section',
    {
      class: ['card', 'tip-card', sehri ? 'tip-card--sehri' : null],
      'data-testid': sehri ? 'sehri-tip' : 'protein-tip',
      'data-key': tip.key,
      'aria-label': sehri ? 'Sehri protein ideas' : 'Protein tip',
    },
    h('p', { class: 'tip-title' }, heading),
    body ? h('p', { class: 'tip-body' }, body) : null,
    tip.ideas.length
      ? h(
          'ul',
          { class: 'tip-ideas', role: 'list' },
          tip.ideas.map((idea) => {
            const serving = amountText(servingOf(idea.food, idea.servingId), idea.qty);
            const line = fill(text.item ?? '{name} · {serving} · {protein} g protein', {
              name: rowName(idea.food),
              serving,
              protein: fmtGrams(idea.protein),
            });
            return h(
              'li',
              null,
              h(
                'button',
                {
                  type: 'button',
                  class: 'tip-idea',
                  'data-testid': 'tip-idea',
                  'data-food-id': idea.food.id,
                  'aria-label': `${line}. Choose how much to add.`,
                  onclick: () => onIdea(idea),
                },
                h('span', { class: 'tip-idea-text' }, line),
                hideKcal
                  ? null
                  : h('span', { class: 'tip-idea-kcal' }, `${fmtKcal(idea.kcal)} kcal`),
                h(
                  'span',
                  { class: 'tip-idea-add', 'aria-hidden': 'true' },
                  iconEl('plus', 16),
                  text.add ?? 'Add',
                ),
              ),
            );
          }),
        )
      : null,
    h(
      'div',
      { class: 'tip-actions' },
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-quiet',
          'data-testid': 'tip-not-today',
          onclick: onNotToday,
        },
        text.notToday ?? 'Not today',
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-quiet',
          'data-testid': 'tip-turn-off',
          onclick: onTurnOff,
        },
        text.turnOff ?? 'Turn off protein tips',
      ),
    ),
    help
      ? h('details', { class: 'tip-help' }, h('summary', null, 'About tips'), h('p', null, help))
      : null,
  );
}

/**
 * The top of a Ramadan day: today's fajr and maghrib (where they come from), and the health notes of
 * the person's flags (§12.6), each set ending with the "no rulings" line.
 * @param {{ info: object, router: object }} props info = store.ramadan(date)
 */
export function renderRamadanBar({ info, router }) {
  const { fajr, maghrib, source } = info.times;
  const times =
    fajr !== null && maghrib !== null
      ? `Fajr ${timeText(fajr)} · Maghrib ${timeText(maghrib)}`
      : 'Times not set';
  const from =
    source.fajr === 'user' || source.maghrib === 'user'
      ? 'your times'
      : info.times.place
        ? `${info.times.place} table`
        : null;
  return h(
    'section',
    { class: 'card ramadan-bar', 'data-testid': 'ramadan-bar', 'aria-label': 'Ramadan mode' },
    h(
      'p',
      { class: 'ramadan-line' },
      h('strong', null, 'Ramadan mode'),
      h('span', null, `· ${times}`),
      from ? h('span', { class: 'muted' }, `(${from})`) : null,
      h(
        'a',
        {
          class: 'link-btn',
          'data-testid': 'ramadan-times-link',
          href: router.href({ name: 'profile', params: {} }),
        },
        'Change',
      ),
    ),
    info.notes.length
      ? h(
          'div',
          { class: 'ramadan-notes', 'data-testid': 'ramadan-notes' },
          info.notes.map((n) => h('p', { 'data-flag': n.id }, n.text)),
          info.notRulings ? h('p', { class: 'muted' }, info.notRulings) : null,
        )
      : null,
  );
}

/** §12.5: the fluids line in the iftar and after-taraweeh slots, hidden for the day on tap. */
export function renderFluidsLine({ text, slot, onHide }) {
  return h(
    'div',
    { class: 'fluids-line', 'data-testid': `fluids-${slot}` },
    iconEl('drop', 18),
    h('p', null, text),
    h(
      'button',
      {
        type: 'button',
        class: 'btn-icon fluids-hide',
        'aria-label': 'Hide this for today',
        'data-testid': 'fluids-hide',
        onclick: onHide,
      },
      iconEl('close', 18),
    ),
  );
}
