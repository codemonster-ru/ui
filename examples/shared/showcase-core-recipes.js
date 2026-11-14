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
