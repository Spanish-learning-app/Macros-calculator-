// "How to make it" (Sprint 3, brief s3-method; Boss's note 2026-10-15). Owner: Lena.
// ARCHITECTURE §13.1: a library recipe may carry `method` (equipment, prep, steps with heat and
// minutes, doneWhen, boxUp, reheat, tips); a person's own recipe may carry `method` as free text
// ("My method"). Both show through methodOf(); a recipe without one shows nothing.
// Written for a beginner at the stove: one action per step, a heat chip and a time chip, and a
// step-by-step mode with big text and big Next/Back buttons for cooking with messy hands.
import { h, mountChildren, setText, uid } from '../dom.js';
import { iconEl } from './icons.js';
import { openDialog } from './dialog.js';

/** §13.1 heat values, in order from cold to hot. */
export const HEATS = Object.freeze([
  'none',
  'low',
  'medium',
  'medium-high',
  'high',
  'oven-180',
  'oven-200',
  'oven-220',
  'microwave',
]);

const HEAT_LABELS = Object.freeze({
  none: 'No heat',
  low: 'Low heat',
  medium: 'Medium heat',
  'medium-high': 'Medium-high heat',
  high: 'High heat',
  'oven-180': 'Oven 180 °C',
  'oven-200': 'Oven 200 °C',
  'oven-220': 'Oven 220 °C',
  microwave: 'Microwave',
});

/** The most characters a "My method" note keeps (a long recipe is about 2,000). */
export const MY_METHOD_MAX = 4000;

/** @param {unknown} heat @returns {string|null} the chip text, or null for no or an unknown heat */
export function heatLabel(heat) {
  return typeof heat === 'string' && Object.hasOwn(HEAT_LABELS, heat) ? HEAT_LABELS[heat] : null;
}

const FRACTIONS = new Map([
  [0.25, '¼'],
  [0.5, '½'],
  [0.75, '¾'],
]);

/**
 * "7 min", "2½ min", "1 h 30 min", "2 h". Null for anything that is not a time above 0.
 * @param {unknown} minutes
 */
export function minutesText(minutes) {
  const m = Number(minutes);
  if (typeof minutes !== 'number' || !Number.isFinite(m) || m <= 0) return null;
  if (m >= 60) {
    const total = Math.round(m);
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }
  const whole = Math.floor(m);
  const part = FRACTIONS.get(Math.round((m - whole) * 4) / 4);
  if (part) return `${whole || ''}${part} min`;
  return `${Math.round(m)} min`;
}

const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const texts = (v) => (Array.isArray(v) ? v.map(text).filter(Boolean) : []);

/** A step as data: a string or { text, heat?, minutes? }; unknown heat and bad minutes are dropped. */
function stepOf(raw) {
  if (typeof raw === 'string')
    return text(raw) ? { text: raw.trim(), heat: null, minutes: null } : null;
  if (!raw || typeof raw !== 'object' || !text(raw.text)) return null;
  return {
    text: raw.text.trim(),
    heat: heatLabel(raw.heat) ? raw.heat : null,
    minutes: minutesText(raw.minutes) ? raw.minutes : null,
  };
}

/** Lines of free text as steps: blank lines dropped, "1.", "2)", "-", "•" at the start removed. */
export function lineSteps(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d{1,2}\s*[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean);
}

/**
 * The recipe's method in one shape for the UI, or null when it has none (the section then hides).
 * - Library: `method` = { equipment, prep, steps, doneWhen?, boxUp, reheat, tips? } (§13.1). Any part may be
 *   missing while the Lab writes them; a method needs at least one step.
 * - Own recipe: `method` = free text ("My method").
 * - Tolerated: `method` as an array of strings (the sheets' old format).
 * @param {{ method?: unknown }|null|undefined} recipe
 * @returns {null | { kind: 'steps'|'text', equipment: string[], prep: string[],
 *   steps: { text: string, heat: string|null, minutes: number|null }[], doneWhen: string|null,
 *   boxUp: string|null, reheat: string|null, tips: string[], text: string|null }}
 */
export function methodOf(recipe) {
  const m = recipe?.method;
  const empty = {
    equipment: [],
    prep: [],
    doneWhen: null,
    boxUp: null,
    reheat: null,
    tips: [],
    text: null,
  };
  if (typeof m === 'string') {
    const lines = lineSteps(m);
    if (!lines.length) return null;
    return {
      ...empty,
      kind: 'text',
      text: m.trim(),
      steps: lines.map((t) => ({ text: t, heat: null, minutes: null })),
    };
  }
  if (Array.isArray(m)) {
    const steps = m.map(stepOf).filter(Boolean);
    return steps.length ? { ...empty, kind: 'steps', steps } : null;
  }
  if (!m || typeof m !== 'object') return null;
  const steps = (Array.isArray(m.steps) ? m.steps : []).map(stepOf).filter(Boolean);
  if (!steps.length) return null;
  return {
    kind: 'steps',
    equipment: texts(m.equipment),
    prep: texts(m.prep),
    steps,
    doneWhen: text(m.doneWhen),
    boxUp: text(m.boxUp),
    reheat: text(m.reheat),
    tips: texts(m.tips),
    text: null,
  };
}

/** "My method" as stored: trimmed text up to MY_METHOD_MAX characters, or null when blank. */
export function cleanMyMethod(value) {
  if (typeof value !== 'string') return null;
  const t = value.replace(/\r\n/g, '\n').trim();
  return t ? t.slice(0, MY_METHOD_MAX) : null;
}

// ------------------------------------------------------------------ DOM

/** The small chips under a step: heat (flame) and time (clock). */
export function stepChips(step, big = false) {
  const size = big ? 20 : 16;
  const heat = heatLabel(step.heat);
  const time = minutesText(step.minutes);
  if (!heat && !time) return null;
  return h(
    'span',
    { class: 'step-chips' },
    heat
      ? h(
          'span',
          {
            class: 'step-chip step-chip--heat',
            'data-heat': step.heat,
            'data-testid': 'step-heat',
          },
          step.heat === 'none' ? null : iconEl('flame', size),
          heat,
        )
      : null,
    time
      ? h(
          'span',
          { class: 'step-chip', 'data-testid': 'step-minutes' },
          iconEl('clock', size),
          time,
        )
      : null,
  );
}

function part(title, testid, body) {
  return h(
    'div',
    { class: 'method-part', 'data-testid': testid },
    h('h4', { class: 'method-h' }, title),
    body,
  );
}

const list = (items, cls = 'method-list') =>
  h(
    'ul',
    { class: cls, role: 'list' },
    items.map((t) => h('li', null, t)),
  );

/**
 * The "How to make it" block.
 * @param {ReturnType<typeof methodOf>} method
 * @param {{ heading?: boolean, onSteps?: () => void, note?: string|null }} [options]
 *   heading: show the "How to make it" title (off inside a <details> that has its own summary);
 *   onSteps: shows the "Step by step" button; note: a line under the title ("Amounts are for 4 boxes.").
 */
export function renderMethod(method, { heading = true, onSteps = null, note = null } = {}) {
  if (!method) return null;
  const own = method.kind === 'text';
  return h(
    'section',
    { class: 'method', 'data-testid': 'method', 'data-kind': method.kind },
    heading ? h('h3', { class: 'group-title' }, own ? 'My method' : 'How to make it') : null,
    note ? h('p', { class: 'muted method-note' }, note) : null,
    onSteps
      ? h(
          'button',
          {
            type: 'button',
            class: 'btn btn-secondary btn-block method-steps-open',
            'data-testid': 'method-steps-open',
            onclick: onSteps,
          },
          iconEl('next', 18),
          h('span', null, 'Step by step'),
        )
      : null,
    method.equipment.length ? part('Equipment', 'method-equipment', list(method.equipment)) : null,
    method.prep.length ? part('Before you start', 'method-prep', list(method.prep)) : null,
    own
      ? h(
          'div',
          { class: 'method-part method-own', 'data-testid': 'method-own' },
          lineSteps(method.text).map((line) => h('p', null, line)),
        )
      : part(
          'Steps',
          'method-steps',
          h(
            'ol',
            { class: 'method-step-list' },
            method.steps.map((s) =>
              h(
                'li',
                { class: 'method-step', 'data-testid': 'method-step' },
                h('span', { class: 'method-step-text' }, s.text),
                stepChips(s),
              ),
            ),
          ),
        ),
    method.doneWhen ? part('Done when', 'method-done', h('p', null, method.doneWhen)) : null,
    method.boxUp ? part('Box it up', 'method-boxup', h('p', null, method.boxUp)) : null,
    method.reheat ? part('Reheat', 'method-reheat', h('p', null, method.reheat)) : null,
    method.tips.length ? part('Tips', 'method-tips', list(method.tips)) : null,
  );
}

/**
 * The method in its own dialog: what you need, then the method. Used from a library row, a batch
 * card and an own recipe row.
 * @param {{ title: string, method: ReturnType<typeof methodOf>, ingredients?: string[],
 *   note?: string|null, action?: { label: string, onSelect: () => void } | null }} props
 */
export function openMethodDialog({ title, method, ingredients = [], note = null, action = null }) {
  if (!method) return null;
  const handle = openDialog({
    title,
    testid: 'method-dialog',
    className: 'dlg--sheet method-dialog',
    content: [
      ingredients.length
        ? h(
            'div',
            { class: 'method-part', 'data-testid': 'method-ingredients' },
            h('h3', { class: 'group-title' }, 'What you need'),
            note ? h('p', { class: 'muted method-note' }, note) : null,
            list(ingredients),
          )
        : null,
      renderMethod(method, {
        note: ingredients.length ? null : note,
        onSteps: () => openStepMode({ title, method }),
      }),
    ],
    actions: action
      ? h(
          'button',
          {
            type: 'button',
            class: 'btn btn-primary',
            'data-testid': 'method-action',
            onclick: () => {
              handle.close('action');
              action.onSelect();
            },
          },
          action.label,
        )
      : null,
  });
  return handle;
}

/**
 * Step-by-step mode: one screen at a time, big text, big Back and Next buttons, "Step x of n".
 * Screens: "Before you start" (when there is prep), each step, then "Finish" (done when, box it up,
 * reheat) when the method has any of them. Arrow keys move too; the screen is kept awake where the
 * browser allows it.
 * @param {{ title: string, method: ReturnType<typeof methodOf> }} props
 */
export function openStepMode({ title, method }) {
  if (!method?.steps.length) return null;
  const n = method.steps.length;
  const screens = [
    ...(method.prep.length ? [{ kind: 'prep' }] : []),
    ...method.steps.map((step, i) => ({ kind: 'step', step, i })),
    ...(method.doneWhen || method.boxUp || method.reheat ? [{ kind: 'finish' }] : []),
  ];
  let at = 0;
  const titleId = uid('steps');
  const count = h('p', {
    class: 'stepper-count',
    'data-testid': 'stepper-count',
    'aria-live': 'polite',
  });
  const bar = h('span', { class: 'stepper-bar-fill' });
  const body = h('div', { class: 'stepper-body', 'data-testid': 'stepper-text' });
  const back = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-secondary stepper-btn',
      'data-testid': 'stepper-back',
      onclick: () => go(-1),
    },
    iconEl('back', 22),
    h('span', null, 'Back'),
  );
  const nextLabel = h('span', null, 'Next');
  const next = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-primary stepper-btn stepper-next',
      'data-testid': 'stepper-next',
      onclick: () => go(1),
    },
    nextLabel,
    iconEl('next', 22),
  );

  const dialog = h(
    'dialog',
    {
      class: 'dlg stepper',
      'data-testid': 'method-stepper',
      'aria-labelledby': titleId,
    },
    h(
      'div',
      { class: 'dlg-panel stepper-panel' },
      h(
        'header',
        { class: 'dlg-head' },
        h('h2', { class: 'dlg-title stepper-title', id: titleId }, title),
        h(
          'button',
          {
            type: 'button',
            class: 'btn-icon',
            'aria-label': 'Close step by step',
            'data-testid': 'stepper-close',
            onclick: () => close(),
          },
          iconEl('close'),
        ),
      ),
      h(
        'div',
        { class: 'stepper-progress' },
        count,
        h('span', { class: 'stepper-bar', 'aria-hidden': 'true' }, bar),
      ),
      body,
      h('footer', { class: 'stepper-actions' }, back, next),
    ),
  );

  function render() {
    const s = screens[at];
    const last = at === screens.length - 1;
    back.disabled = at === 0;
    setText(nextLabel, last ? 'Done' : 'Next');
    const stepNo = s.kind === 'step' ? s.i + 1 : s.kind === 'prep' ? 0 : n;
    bar.style.width = `${Math.round(((s.kind === 'finish' ? n : stepNo) / n) * 100)}%`;
    if (s.kind === 'prep') {
      setText(count, 'Before you start');
      mountChildren(
        body,
        h(
          'ul',
          { class: 'stepper-list', role: 'list' },
          method.prep.map((t) => h('li', null, t)),
        ),
        method.equipment.length
          ? h(
              'p',
              { class: 'stepper-small' },
              h('strong', null, 'You need: '),
              method.equipment.join(', '),
            )
          : null,
      );
    } else if (s.kind === 'step') {
      setText(count, `Step ${s.i + 1} of ${n}`);
      mountChildren(body, h('p', { class: 'stepper-step' }, s.step.text), stepChips(s.step, true));
    } else {
      setText(count, 'Finish');
      mountChildren(
        body,
        method.doneWhen
          ? h(
              'div',
              { class: 'stepper-part' },
              h('h3', null, 'Done when'),
              h('p', null, method.doneWhen),
            )
          : null,
        method.boxUp
          ? h(
              'div',
              { class: 'stepper-part' },
              h('h3', null, 'Box it up'),
              h('p', null, method.boxUp),
            )
          : null,
        method.reheat
          ? h(
              'div',
              { class: 'stepper-part' },
              h('h3', null, 'Reheat'),
              h('p', null, method.reheat),
            )
          : null,
      );
    }
    dialog.dataset.step = String(at);
  }

  function go(dir) {
    if (dir > 0 && at === screens.length - 1) {
      close();
      return;
    }
    at = Math.min(screens.length - 1, Math.max(0, at + dir));
    render();
    (dir > 0 ? next : at === 0 ? next : back).focus();
  }

  // Keep the screen on while cooking, where the browser allows it (never required).
  let lock = null;
  try {
    navigator.wakeLock
      ?.request('screen')
      .then((l) => {
        lock = l;
        if (closed) lock.release().catch(() => {});
      })
      .catch(() => {});
  } catch {
    // no wake lock here
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    try {
      lock?.release().catch(() => {});
    } catch {
      // already released
    }
    if (dialog.open) dialog.close();
    dialog.remove();
  }
  dialog.addEventListener('close', () => close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') go(1);
    else if (event.key === 'ArrowLeft') go(-1);
    else return;
    event.preventDefault();
  });

  render();
  document.body.append(dialog);
  dialog.showModal();
  next.focus();
  return { dialog, close };
}
