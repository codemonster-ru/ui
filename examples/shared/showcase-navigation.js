const mobileNavigation = '(width < 56rem)';

function normalize(value) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function rank(entry, query, words) {
  if (entry.title === query) return entry.section ? 105 : 120;
  if (entry.aliases.includes(query)) return 110;
  let score = entry.title.startsWith(query) ? 45 : entry.title.includes(query) ? 30 : 0;
  for (const word of words) {
    if (entry.title.includes(word)) score += 8;
    else if (entry.terms.includes(word)) score += 4;
    else if (entry.description.includes(word)) score += 1;
    else return 0;
  }
  return score * (entry.section ? 0.8 : 1);
}

function showSearch(button, root, getIndex) {
  const dialog = document.createElement('dialog');
  dialog.className = 'showcase-search';
  dialog.setAttribute('aria-labelledby', 'showcase-search-title');
  dialog.innerHTML = `
    <div class="showcase-search__header">
      <h2 id="showcase-search-title">Search components and guides</h2>
      <form method="dialog"><button type="submit" class="showcase-header-button">Close</button></form>
    </div>
    <label for="showcase-site-query">Search this site</label>
    <input class="cm-input cm-input--md" id="showcase-site-query" type="search" placeholder="Try Date Picker, theming, or SSR" autocomplete="off" autofocus>
    <p class="showcase-search__status" role="status">Loading search…</p>
    <ul class="showcase-search__results"></ul>`;
  document.body.append(dialog);
  const input = dialog.querySelector('input');
  const results = dialog.querySelector('ul');
  const status = dialog.querySelector('[role="status"]');
  let index;

  function update() {
    if (!index) return;
    const query = normalize(input.value);
    const words = query.split(' ');
    const matches = query
      ? index
          .map((entry) => ({ entry, score: rank(entry, query, words) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
      : [];
    const shown = matches.slice(0, 12);
    status.textContent = !query
      ? 'Search by component name, guide title, or topic.'
      : !shown.length
        ? 'No matches. Try a shorter term or a different spelling.'
        : matches.length > shown.length
          ? `Showing the top ${shown.length} of ${matches.length} results`
          : `${shown.length} result${shown.length === 1 ? '' : 's'}`;
    results.replaceChildren(
      ...shown.map(({ entry: { item } }) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        const label = document.createElement('span');
        const heading = document.createElement('strong');
        label.className = 'showcase-search__label';
        link.href = new URL(item.path.slice(1), root).href;
        label.textContent = item.label;
        heading.textContent = item.title;
        link.append(label, heading);
        if (item.description) {
          const summary = document.createElement('span');
          summary.textContent = item.description;
          link.append(summary);
        }
        li.append(link);
        return li;
      }),
    );
  }

  input.addEventListener('input', update);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !event.isComposing) {
      event.preventDefault();
      dialog.close();
      return;
    }
    const first = results.querySelector('a');
    if (!first || (event.key !== 'ArrowDown' && event.key !== 'Enter')) return;
    event.preventDefault();
    if (event.key === 'Enter') first.click();
    else first.focus();
  });
  results.addEventListener('click', (event) => {
    if (event.target.closest('a') && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey)
      dialog.close();
  });
  dialog.addEventListener(
    'close',
    () => {
      const restore = dialog.contains(document.activeElement) || document.activeElement === document.body;
      dialog.remove();
      if (restore) button.focus();
    },
    { once: true },
  );
  dialog.showModal();
  getIndex().then(
    (entries) => {
      index = entries;
      update();
    },
    () => {
      status.textContent = 'Search is unavailable. Close and reopen search to retry.';
    },
  );
  return dialog;
}

export function mountShowcaseNavigation(header, base) {
  const root = new URL(base, document.baseURI);
  const toggle = header.querySelector('[data-showcase-menu-toggle]');
  const search = header.querySelector('[data-showcase-search-open]');
  const menu = header.querySelector('.showcase-navigation');
  const resources = header.querySelector('.showcase-resources');
  const breakpoint = window.matchMedia(mobileNavigation);
  const events = new AbortController();
  const options = { signal: events.signal };
  let searchIndex;
  let dialog;

  function loadIndex() {
    searchIndex ??= fetch(new URL('docs-content/search.json', root))
      .then((response) => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      })
      .then((items) =>
        items.map((item) => ({
          item,
          title: normalize(item.title),
          terms: normalize(item.terms ?? ''),
          aliases: (item.aliases ?? []).map(normalize),
          description: normalize(item.description ?? ''),
          section: item.path.includes('#'),
        })),
      )
      .catch((error) => {
        searchIndex = undefined;
        throw error;
      });
    return searchIndex;
  }

  function toggleMenu(open) {
    header.toggleAttribute('data-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    resources.open = open && !!resources.querySelector('[aria-current]');
  }

  toggle.addEventListener(
    'click',
    () => {
      const open = !header.hasAttribute('data-menu-open');
      toggleMenu(open);
      if (open) menu.querySelector('a').focus();
    },
    options,
  );
  search.addEventListener(
    'click',
    () => {
      toggleMenu(false);
      dialog = showSearch(search, root, loadIndex);
    },
    options,
  );
  menu.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return;
      if (resources.open && resources.contains(event.target)) {
        resources.open = false;
        resources.querySelector('summary').focus();
      } else if (header.hasAttribute('data-menu-open')) {
        toggleMenu(false);
        toggle.focus();
      }
    },
    options,
  );
  header.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && !menu.contains(event.target) && header.hasAttribute('data-menu-open')) {
        toggleMenu(false);
        toggle.focus();
      }
    },
    options,
  );
  document.addEventListener(
    'click',
    (event) => {
      if (!header.contains(event.target)) toggleMenu(false);
      else if (!resources.contains(event.target) && !toggle.contains(event.target)) resources.open = false;
    },
    options,
  );
  breakpoint.addEventListener('change', () => toggleMenu(false), options);
  window.addEventListener(
    'pagehide',
    () => {
      toggleMenu(false);
      dialog?.close();
    },
    options,
  );
  return () => {
    events.abort();
    dialog?.close();
  };
}
