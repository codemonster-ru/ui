export function connectConfirmDialog(document, archiveDraft) {
  const opener = document.querySelector('#archive-draft');
  const dialog = document.querySelector('#confirm-archive');
  const cancel = dialog.querySelector('#cancel-archive');
  const confirm = dialog.querySelector('#approve-archive');
  const close = dialog.querySelector('[data-cm-dialog-close]');
  const error = dialog.querySelector('#archive-error');
  const status = document.querySelector('#archive-status');
  let busy = false;
  let confirmed = false;

  function request(action) {
    dialog.dispatchEvent(new document.defaultView.CustomEvent(`cm:dialog-${action}-request`));
  }

  function setBusy(value) {
    busy = value;
    dialog.setAttribute('data-cm-dialog-dismissible', String(!value));
    dialog.setAttribute('aria-busy', String(value));
    for (const button of [cancel, confirm, close]) button.disabled = value;
    confirm.querySelector('.cm-button__label').textContent = value ? 'Archiving…' : 'Archive';
  }

  opener.addEventListener('click', () => request('open'));
  cancel.addEventListener('click', () => {
    if (!busy) request('close');
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && !busy) request('close');
  });
  dialog.addEventListener('cm:dialog-open-change', (event) => {
    if (event.detail.open) {
      confirmed = false;
      status.textContent = '';
      error.hidden = true;
    } else if (!confirmed) {
      status.textContent = 'Archive canceled.';
    }
  });
  confirm.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    error.hidden = true;
    try {
      await archiveDraft();
      confirmed = true;
      request('close');
      status.textContent = 'Draft archived.';
    } catch {
      error.hidden = false;
    } finally {
      setBusy(false);
      if (dialog.open) confirm.focus();
    }
  });
}
