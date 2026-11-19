function mountSnippetTabs(reference, runtime) {
  const snippets = reference.querySelector('[data-reference-snippets]');
  const tabList = snippets?.querySelector('[role="tablist"]');
  if (!tabList) return;
  const tabs = [...tabList.querySelectorAll('[data-cm-tab-value]')];
  for (const tab of tabs) {
    const panel = snippets.querySelector(`[data-reference-source="${tab.dataset.cmTabValue}"]`);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
  }
  tabList.hidden = false;
  const initial = tabs.find((tab) => `#${tab.getAttribute('aria-controls')}` === location.hash);
  snippets.setAttribute('data-cm-controller', 'tabs');
  snippets.setAttribute('data-cm-tabs-value', initial?.dataset.cmTabValue ?? snippets.dataset.referenceSnippets);
  runtime.start(snippets);
}

export function mountComponentReference(root, runtime) {
  const reference = root.querySelector('[data-component-reference]');
  if (!reference) return;
  mountSnippetTabs(reference, runtime);

  // Vue mounts the reference asynchronously, after the browser's first fragment lookup.
  const target = document.getElementById(location.hash.slice(1));
  if (target && reference.contains(target)) {
    const disclosure = target.closest('details');
    if (disclosure) disclosure.open = true;
    target.scrollIntoView({ block: 'start' });
    if (target.matches('[tabindex="-1"]')) target.focus({ preventScroll: true });
  }

  for (const button of reference.querySelectorAll('[data-reference-copy]')) {
    button.hidden = false;
    const source = button.closest('.reference-source');
    const status = source.querySelector('[role="status"]');
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(source.querySelector('code').textContent);
        status.textContent = 'Copied.';
      } catch {
        status.textContent = 'Select the code to copy it.';
      }
    });
  }
}

export function fitShowcaseFrame(demo) {
  const frame = window.frameElement;
  if (!frame || frame.matches('.showcase-frame--tall, .reference-frame--tall')) return;

  if (frame.matches('.reference-frame--floating, .reference-frame--modal')) {
    const popup = 'dialog, [role="dialog"], [role="listbox"], [role="menu"], [role="tooltip"]';
    const syncOverlaySpace = () => {
      // Portaled and visibly exiting panels can outlive the example's own layout.
      const visible = Array.from(document.body.querySelectorAll(popup)).some(
        (element) => element.getClientRects().length > 0,
      );
      frame.toggleAttribute('data-reference-expanded', visible);
    };
    syncOverlaySpace();
    new MutationObserver(syncOverlaySpace).observe(document.body, {
      attributeFilter: ['hidden', 'open'],
      childList: true,
      subtree: true,
    });
    for (const event of ['transitionend', 'transitioncancel']) {
      document.body.addEventListener(event, syncOverlaySpace);
    }
  }

  new ResizeObserver(() => {
    requestAnimationFrame(() => {
      const border = frame.clientHeight === 0 ? 0 : frame.offsetHeight - frame.clientHeight;
      const blockSize = `${Math.ceil(demo.getBoundingClientRect().height) + border}px`;
      if (frame.style.blockSize !== blockSize) frame.style.blockSize = blockSize;
    });
  }).observe(demo);
}
