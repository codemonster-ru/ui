export function connectCodeBlock(root) {
  const code = root.querySelector('pre > code');
  const copy = root.querySelector('[data-code-copy]');
  const status = root.querySelector('[data-code-status]');
  let mounted = true;
  let pending = false;

  async function copyCode() {
    if (pending) return;

    pending = true;
    status.textContent = '';
    let message = 'Could not copy code. Select and copy it manually.';
    try {
      const clipboard = root.ownerDocument.defaultView?.navigator.clipboard;
      if (clipboard) {
        await clipboard.writeText(code.textContent);
        message = 'Code copied.';
      }
    } catch {
      // Keep the manual copy instruction when clipboard access fails.
    }

    pending = false;
    if (mounted) status.textContent = message;
  }

  copy.addEventListener('click', copyCode);
  copy.hidden = false;

  return () => {
    if (!mounted) return;

    mounted = false;
    copy.removeEventListener('click', copyCode);
    copy.hidden = true;
    status.textContent = '';
  };
}
