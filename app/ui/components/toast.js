// Undo toast and short notices. Owner: Priya.
// A13: the Undo toast stays at least 5 s (here 8 s, paused while hovered or focused), with no
// confirm pop-up before a delete. Driven by store.getState().undo ({ label } | null).
import { h, setText } from '../dom.js';

const UNDO_MS = 8000;
const NOTICE_MS = 3000;

/**
 * @param {{ store: object }} props
 * @returns {{ el: HTMLElement, notify: (text: string) => void, destroy: () => void }}
 */
export function createUndoToast({ store }) {
  const text = h('span', { class: 'toast-text' });
  const button = h(
    'button',
    {
      type: 'button',
      class: 'toast-action',
      onclick: () => {
        clear();
        store.undo();
        hide();
      },
    },
    'Undo',
  );
  const box = h('div', { class: 'toast', 'data-testid': 'undo', hidden: true }, text, button);
  const el = h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' }, box);

  let timer = null;
  let remaining = 0;
  let startedAt = 0;
  let lastUndo = null;
  let mode = 'none'; // 'undo' | 'notice' | 'none'

  function clear() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }
  function start(ms) {
    clear();
    remaining = ms;
    startedAt = Date.now();
    timer = setTimeout(expire, ms);
  }
  function pause() {
    if (timer === null) return;
    clear();
    remaining = Math.max(1500, remaining - (Date.now() - startedAt));
  }
  function resume() {
    if (timer === null && !box.hidden) start(remaining);
  }
  function expire() {
    timer = null;
    if (mode === 'undo') store.dismissUndo?.();
    hide();
  }
  function hide() {
    box.hidden = true;
    mode = 'none';
  }
  function show(label, withUndo) {
    setText(text, label);
    button.hidden = !withUndo;
    box.hidden = false;
    mode = withUndo ? 'undo' : 'notice';
    start(withUndo ? UNDO_MS : NOTICE_MS);
  }

  box.addEventListener('pointerenter', pause);
  box.addEventListener('pointerleave', resume);
  box.addEventListener('focusin', pause);
  box.addEventListener('focusout', resume);

  const unsubscribe = store.subscribe((state) => {
    if (state.undo && state.undo !== lastUndo) show(state.undo.label, true);
    else if (!state.undo && mode === 'undo') hide();
    lastUndo = state.undo;
  });
  lastUndo = store.getState().undo;

  return {
    el,
    notify: (label) => show(label, false),
    destroy() {
      clear();
      unsubscribe();
      el.remove();
    },
  };
}
