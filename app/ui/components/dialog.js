// Modal dialogs and action sheets on the native <dialog> element (alert/confirm/prompt do nothing
// inside an Artifact). Owner: Priya. Escape and a tap on the backdrop close them; focus returns to
// the control that opened them (browser behaviour of showModal).
import { h, uid } from '../dom.js';
import { iconEl } from './icons.js';

/**
 * @param {{ title: string, content?: unknown, actions?: unknown, testid?: string,
 *   className?: string, onClose?: (returnValue: string) => void, closeLabel?: string,
 *   dismissible?: boolean }} options
 * @returns {{ dialog: HTMLDialogElement, body: HTMLElement, close: (value?: string) => void }}
 */
export function openDialog({
  title,
  content = null,
  actions = null,
  testid = null,
  className = '',
  onClose = null,
  closeLabel = 'Close',
  dismissible = true,
}) {
  const titleId = uid('dlg');
  const body = h('div', { class: 'dlg-body' }, content);
  const dialog = h(
    'dialog',
    {
      class: ['dlg', className],
      'aria-labelledby': titleId,
      'data-testid': testid,
    },
    h(
      'div',
      { class: 'dlg-panel' },
      h(
        'header',
        { class: 'dlg-head' },
        h('h2', { class: 'dlg-title', id: titleId }, title),
        dismissible
          ? h(
              'button',
              {
                type: 'button',
                class: 'btn-icon',
                'aria-label': closeLabel,
                onclick: () => close('dismiss'),
              },
              iconEl('close'),
            )
          : null,
      ),
      body,
      actions ? h('footer', { class: 'dlg-actions' }, actions) : null,
    ),
  );
  let closed = false;
  function close(value = 'dismiss') {
    if (closed) return;
    if (dialog.open) dialog.close(value);
    else finish(value);
  }
  function finish(value) {
    if (closed) return;
    closed = true;
    dialog.remove();
    onClose?.(value ?? dialog.returnValue);
  }
  dialog.addEventListener('close', () => finish(dialog.returnValue || 'dismiss'));
  dialog.addEventListener('cancel', (event) => {
    if (!dismissible) event.preventDefault();
  });
  dialog.addEventListener('click', (event) => {
    if (dismissible && event.target === dialog) close('dismiss');
  });
  document.body.append(dialog);
  dialog.showModal();
  return { dialog, body, close };
}

/**
 * A list of actions in a bottom sheet (phone) or a small centred panel (desktop).
 * @param {{ title: string, testid?: string, actions: { label: string, hint?: string,
 *   icon?: string, onSelect: () => void, testid?: string }[] }} options
 */
export function openActionSheet({ title, actions, testid = 'action-sheet' }) {
  const list = h(
    'ul',
    { class: 'sheet-actions', role: 'list' },
    actions.map((action) =>
      h(
        'li',
        null,
        h(
          'button',
          {
            type: 'button',
            class: 'sheet-action',
            'data-testid': action.testid,
            onclick: () => {
              handle.close('done');
              action.onSelect();
            },
          },
          action.icon ? iconEl(action.icon) : null,
          h(
            'span',
            { class: 'sheet-action-text' },
            h('span', null, action.label),
            action.hint ? h('span', { class: 'sheet-action-hint' }, action.hint) : null,
          ),
        ),
      ),
    ),
  );
  // `handle` is read only when an action is tapped, after it is assigned.
  const handle = openDialog({ title, content: list, testid, className: 'dlg--sheet' });
  return handle;
}
