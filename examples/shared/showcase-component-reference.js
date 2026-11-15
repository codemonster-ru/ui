export function mountComponentReference(root) {
  const reference = root.querySelector('[data-component-reference]');
  if (!reference) return;

  const search = reference.querySelector('#reference-query');
  if (search) {
    const groups = [...reference.querySelectorAll('[data-reference-group]')];
    const count = reference.querySelector('[data-reference-count]');
    reference.querySelector('[data-reference-search]').hidden = false;

    const filter = () => {
      const terms = search.value.trim().toLowerCase().split(/\s+/u);
      let matches = 0;
      for (const group of groups) {
        const items = [...group.querySelectorAll('[data-reference-item]')];
        for (const item of items) {
          const text = item.dataset.referenceTerms.toLowerCase();
          item.hidden = !terms.every((term) => text.includes(term));
        }
        const visible = items.filter((item) => !item.hidden).length;
        group.hidden = visible === 0;
        matches += visible;
      }
      const message = matches === 1 ? '1 component' : `${matches} components`;
      count.textContent = matches ? message : 'No matching components.';
    };
    search.addEventListener('input', filter);
    filter();
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
