export function revealShowcaseLink({ target }) {
  if (target instanceof HTMLAnchorElement) {
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

export function mountComponentCatalog(catalog) {
  const filter = catalog?.querySelector('[data-component-filter]');
  if (!filter) return;
  const input = filter.querySelector('input');
  const status = filter.querySelector('[role="status"]');
  const groups = [...catalog.querySelectorAll('.showcase-directory__groups > details')].map((details) => ({
    details,
    entries: [...details.querySelectorAll('li')].map((element) => ({
      element,
      name: 'cm' + componentSearchTerm(element.textContent),
    })),
  }));
  const total = groups.reduce((count, group) => count + group.entries.length, 0);
  let unfilteredDisclosure;

  input.addEventListener('input', () => {
    const query = componentSearchTerm(input.value);
    if (query) unfilteredDisclosure ??= groups.map(({ details }) => details.open);
    let count = 0;
    for (const [index, { details, entries }] of groups.entries()) {
      let matches = 0;
      for (const { element, name } of entries) {
        element.hidden = !name.includes(query);
        if (!element.hidden) matches++;
      }
      count += matches;
      details.hidden = matches === 0;
      if (query) details.open = matches > 0;
      else if (unfilteredDisclosure) details.open = unfilteredDisclosure[index];
    }
    status.textContent = count > 0 ? `${count} of ${total} components` : 'No matching components';
    if (!query) unfilteredDisclosure = undefined;
  });

  status.textContent = `${total} components`;
  filter.hidden = false;
}

function componentSearchTerm(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/gu, '');
}
