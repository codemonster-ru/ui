function mountCatalogFilters(reference) {
  const search = reference.querySelector('[data-reference-search]');
  if (!search) return;
  const query = search.querySelector('#reference-query');
  const category = search.querySelector('#reference-category');
  const clear = search.querySelector('[data-reference-clear]');
  const count = search.querySelector('[data-reference-count]');
  const groups = [...reference.querySelectorAll('[data-reference-group]')].map((group) => ({
    group,
    items: [...group.querySelectorAll('[data-reference-item]')].map((item) => ({
      item,
      searchable: item.dataset.referenceTerms.toLowerCase(),
    })),
  }));
  const parameters = new URLSearchParams(location.search);
  query.value = parameters.get('q') ?? '';
  category.value = parameters.get('category') ?? '';
  if (category.selectedIndex < 0) category.selectedIndex = 0;
  search.hidden = false;

  const filter = () => {
    const value = query.value.trim();
    const terms = value.toLowerCase().split(/\s+/u).filter(Boolean);
    let matches = 0;
    for (const { group, items } of groups) {
      for (const { item, searchable } of items) {
        item.hidden = !terms.every((term) => searchable.includes(term));
      }
      const visible = items.filter(({ item }) => !item.hidden).length;
      group.hidden = visible === 0 || Boolean(category.value && category.value !== group.id);
      if (!group.hidden) matches += visible;
    }
    count.textContent = matches ? `${matches} component${matches === 1 ? '' : 's'}` : 'No matching components.';
    clear.hidden = !query.value && !category.value;
  };

  function updateFilters() {
    filter();
    const url = new URL(location.href);
    for (const [key, value] of [
      ['q', query.value.trim()],
      ['category', category.value],
    ]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href !== location.href) history.replaceState(history.state, '', url);
  }

  query.addEventListener('input', updateFilters);
  category.addEventListener('change', updateFilters);
  clear.addEventListener('click', () => {
    query.value = '';
    category.value = '';
    updateFilters();
    query.focus();
  });
  filter();
}

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
  mountCatalogFilters(reference);
  mountSnippetTabs(reference, runtime);
  const contents = reference.querySelector('[data-reference-contents]');
  if (contents) contents.open = matchMedia('(min-width: 62rem)').matches;

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
