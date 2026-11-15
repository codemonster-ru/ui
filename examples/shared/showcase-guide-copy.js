export function mountGuideCopy(root) {
  for (const button of root.querySelectorAll('[data-guide-copy]')) {
    const block = button.closest('figure');
    const code = block.querySelector('code');
    const status = block.querySelector('[data-guide-copy-status]');
    button.hidden = false;
    button.addEventListener('click', async () => {
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(code.textContent);
        status.textContent = 'Copied.';
      } catch {
        status.textContent = 'Select the code to copy it.';
      }
    });
  }
}
