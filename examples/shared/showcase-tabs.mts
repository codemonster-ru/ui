export function renderShowcaseTabs(
  id: string,
  label: string,
  items: readonly { title: string; panel: string }[],
  active = 0,
) {
  return `<div class="cm-tabs" data-cm-controller="tabs"${active ? ` data-cm-tabs-value="item-${active}"` : ''}>
    <div class="cm-tabs__list" role="tablist" aria-label="${label}">${items
      .map(
        ({ title }, index) =>
          `<button class="cm-tabs__tab" id="${id}-tab-item-${index}" type="button" role="tab" aria-controls="${id}-panel-item-${index}" aria-selected="${index === active}" tabindex="${index === active ? '0' : '-1'}">${title}</button>`,
      )
      .join('')}</div>
    ${items.map(({ panel }, index) => `<div class="cm-tabs__panel" id="${id}-panel-item-${index}" role="tabpanel" aria-labelledby="${id}-tab-item-${index}" tabindex="0"${index === active ? '' : ' hidden'}>${panel}</div>`).join('')}
  </div>`;
}
