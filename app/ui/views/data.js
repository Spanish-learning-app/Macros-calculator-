// Your data (route `data`). Owner: Priya.
// Export: a read-only textarea and a Copy button (downloads do nothing inside an Artifact).
// Import: paste or choose a file, then a summary, then Replace or Merge in a <dialog>; undoable.
// Reset: with Undo. Storage status in plain words. Nothing ever leaves the device.
import { h, mountChildren, setText, uid } from '../dom.js';
import { iconEl } from '../components/icons.js';
import { openDialog } from '../components/dialog.js';
import { createUndoToast } from '../components/toast.js';
import { fmtDateShort } from '../components/format.js';

const STATUS_TEXT = {
  ok: 'Saved on this device. Nothing is sent anywhere.',
  empty: 'Nothing saved yet. What you log is kept on this device only.',
  unavailable:
    'This browser is not letting Katori save. What you log now will be lost when you close it, so copy a backup below.',
  corrupt:
    'Saved data could not be read, so Katori started fresh. A copy of the old data was kept on this device.',
  future:
    'This data was saved by a newer version of Katori, so changes here are not saved. Open the newer version instead.',
};

const IMPORT_ERRORS = {
  EMPTY: 'Paste a backup first, or choose a backup file.',
  NOT_JSON:
    'This does not look like a Katori backup. Copy the whole text, from the first { to the last }.',
  NOT_KATORI: 'This text is not a Katori backup.',
  FUTURE_VERSION: 'This backup comes from a newer version of Katori. Use that version to open it.',
  INVALID: 'This backup is damaged and cannot be read.',
};

/**
 * @param {HTMLElement} container @param {{ store: object, router: object, rules: object }} ctx
 */
export function mount(container, ctx) {
  const { store, router } = ctx;
  const toast = createUndoToast({ store });
  const root = h('div', { class: 'view view-data' });
  mountChildren(container, root, toast.el);

  // ------------------------------------------------------------------ status
  const statusText = h('p', { 'data-testid': 'storage-status' });
  function renderStatus() {
    const state = store.getState();
    let key = state.storageStatus;
    if (state.saveError === 'quota') key = 'quota';
    setText(
      statusText,
      key === 'quota'
        ? 'This device is out of space for Katori. Copy a backup below so nothing is lost.'
        : (STATUS_TEXT[key] ?? STATUS_TEXT.ok),
    );
  }

  // ------------------------------------------------------------------ export
  const exportId = uid('export');
  const exportArea = h('textarea', {
    id: exportId,
    class: 'textarea',
    readonly: true,
    rows: 6,
    spellcheck: 'false',
    'data-testid': 'export-text',
  });
  const copyStatus = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  function exportValue() {
    try {
      return store.exportText();
    } catch (error) {
      console.error('Katori: export failed.', error);
      return '';
    }
  }
  async function copyExport() {
    exportArea.value = exportValue();
    let ok = false;
    try {
      await navigator.clipboard.writeText(exportArea.value);
      ok = true;
    } catch {
      exportArea.focus();
      exportArea.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
    }
    setText(
      copyStatus,
      ok
        ? 'Copied. Paste it into a note or a message to yourself to keep it safe.'
        : 'Could not copy by itself. The text is selected: copy it with your phone’s Copy.',
    );
  }

  // ------------------------------------------------------------------ import
  const importId = uid('import');
  const fileId = uid('file');
  const importArea = h('textarea', {
    id: importId,
    class: 'textarea',
    rows: 5,
    spellcheck: 'false',
    placeholder: 'Paste a Katori backup here',
    'data-testid': 'import-text',
  });
  const importError = h('p', { class: 'field-error', role: 'alert', hidden: true });
  const fileInput = h('input', {
    id: fileId,
    class: 'file-input',
    type: 'file',
    accept: '.json,.txt,application/json,text/plain',
    onchange: () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        importArea.value = String(reader.result ?? '');
        checkImport();
      };
      reader.onerror = () => showImportError('That file could not be read.');
      reader.readAsText(file);
    },
  });

  function showImportError(text) {
    importError.hidden = !text;
    setText(importError, text ?? '');
  }

  function checkImport() {
    const text = importArea.value;
    let preview;
    try {
      preview = store.previewImport(text);
    } catch (error) {
      console.error('Katori: import check failed.', error);
      preview = { ok: false, error: 'INVALID' };
    }
    if (!preview.ok) {
      showImportError(IMPORT_ERRORS[preview.error] ?? IMPORT_ERRORS.INVALID);
      return;
    }
    showImportError(null);
    const s = preview.summary;
    const range =
      s.firstDate && s.lastDate
        ? s.firstDate === s.lastDate
          ? ` on ${fmtDateShort(s.firstDate)}`
          : ` from ${fmtDateShort(s.firstDate)} to ${fmtDateShort(s.lastDate)}`
        : '';
    const apply = (mode) => {
      handle.close('done');
      const result = store.importText(text, mode);
      if (!result.ok) {
        showImportError(IMPORT_ERRORS[result.error] ?? IMPORT_ERRORS.INVALID);
        return;
      }
      importArea.value = '';
      render();
    };
    const handle = openDialog({
      title: 'Use this backup?',
      testid: 'import-dialog',
      content: [
        h(
          'p',
          { 'data-testid': 'import-summary' },
          `It has ${s.entries} ${s.entries === 1 ? 'food' : 'foods'} on ${s.days} ${s.days === 1 ? 'day' : 'days'}${range}.`,
        ),
        h(
          'p',
          { class: 'field-help' },
          'Replace: this backup takes the place of everything here. Merge: days from both are kept, and your profile and settings stay as they are. You can undo either for a few seconds.',
        ),
      ],
      actions: [
        h(
          'button',
          { type: 'button', class: 'btn btn-secondary', onclick: () => apply('merge') },
          'Merge',
        ),
        h(
          'button',
          { type: 'button', class: 'btn btn-primary', onclick: () => apply('replace') },
          'Replace',
        ),
      ],
    });
  }

  // ------------------------------------------------------------------ reset
  function confirmReset() {
    const handle = openDialog({
      title: 'Delete everything on this device?',
      testid: 'reset-dialog',
      content: h(
        'p',
        null,
        'Every day you logged, your profile and your settings will go. You can undo it for a few seconds afterwards. Copy a backup first if you might want them later.',
      ),
      actions: [
        h(
          'button',
          { type: 'button', class: 'btn btn-secondary', onclick: () => handle.close() },
          'Keep my data',
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-primary',
            onclick: () => {
              handle.close('done');
              store.resetData();
              render();
            },
          },
          'Delete everything',
        ),
      ],
    });
  }

  // ------------------------------------------------------------------ page
  function render() {
    renderStatus();
    exportArea.value = exportValue();
    mountChildren(
      root,
      h('h2', { class: 'view-title' }, 'Your data'),
      h(
        'div',
        { class: 'data-layout' },
        h(
          'section',
          { class: 'card', 'aria-labelledby': 'store-h' },
          h('h3', { class: 'card-title', id: 'store-h' }, 'Where it is kept'),
          statusText,
          h(
            'p',
            { class: 'field-help' },
            'There is no account and no cloud. To move to a new phone, copy a backup here and paste it there.',
          ),
        ),
        h(
          'section',
          { class: 'card', 'aria-labelledby': 'export-h' },
          h('h3', { class: 'card-title', id: 'export-h' }, 'Back up'),
          h(
            'label',
            { class: 'field-label', for: exportId },
            'Your backup (all your data as text)',
          ),
          exportArea,
          h(
            'div',
            { class: 'form-actions form-actions--row' },
            h(
              'button',
              { type: 'button', class: 'btn btn-primary', onclick: copyExport },
              iconEl('copy', 18),
              h('span', null, 'Copy'),
            ),
          ),
          copyStatus,
        ),
        h(
          'section',
          { class: 'card', 'aria-labelledby': 'import-h' },
          h('h3', { class: 'card-title', id: 'import-h' }, 'Restore'),
          h('label', { class: 'field-label', for: importId }, 'Paste a backup'),
          importArea,
          h(
            'div',
            { class: 'file-row' },
            h(
              'label',
              { class: 'btn btn-secondary file-label', for: fileId },
              'Choose a backup file',
            ),
            fileInput,
          ),
          importError,
          h(
            'div',
            { class: 'form-actions form-actions--row' },
            h(
              'button',
              { type: 'button', class: 'btn btn-primary', onclick: checkImport },
              'Check backup',
            ),
          ),
        ),
        h(
          'section',
          { class: 'card', 'aria-labelledby': 'reset-h' },
          h('h3', { class: 'card-title', id: 'reset-h' }, 'Start again'),
          h('p', { class: 'field-help' }, 'Removes everything Katori keeps on this device.'),
          h(
            'div',
            { class: 'form-actions form-actions--row' },
            h(
              'button',
              { type: 'button', class: 'btn btn-secondary', onclick: confirmReset },
              iconEl('trash', 18),
              h('span', null, 'Delete all my data'),
            ),
          ),
        ),
        h(
          'p',
          { class: 'data-about' },
          h(
            'a',
            { class: 'link-btn', href: router.href({ name: 'about', params: {} }) },
            'About the data: where the numbers come from',
          ),
        ),
      ),
    );
  }

  const unsubscribe = store.subscribe(() => renderStatus());

  return {
    update() {
      render();
    },
    unmount() {
      unsubscribe();
      toast.destroy();
      container.replaceChildren();
    },
  };
}
