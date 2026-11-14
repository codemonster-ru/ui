/** @param {HTMLElement} root */
export function mountCoreRecipes(root) {
  const dialog = root.querySelector('#recipe-confirm');
  if (!dialog) return;
  root.querySelector('[commandfor="recipe-confirm"]').addEventListener('click', () => {
    dialog.returnValue = '';
  });
  dialog.addEventListener('close', () => {
    root.querySelector('#recipe-confirm-result').textContent =
      dialog.returnValue === 'delete' ? 'Example user deleted.' : 'Deletion cancelled.';
  });
}

/** @param {HTMLElement} root
 * @param {import('@codemonster-ru/ui-runtime').CmRuntime} runtime
 */
export function mountCoreMatrices(root, runtime) {
  runtime.start(root);
  for (const matrix of root.querySelectorAll('[data-core-matrix]')) {
    matrix.addEventListener('submit', (event) => event.preventDefault());
    matrix.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('a[href^="/"]')) event.preventDefault();
      const open = event.target.closest('[data-matrix-open]');
      const dialog = open?.closest('.core-example')?.querySelector('dialog[data-cm-controller]');
      if (dialog) dialog.dispatchEvent(new CustomEvent(`cm:${dialog.dataset.cmController}-open-request`));
    });
  }
}
