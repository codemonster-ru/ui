import type { Directive } from 'vue';

export const vScrollableTable: Directive<HTMLElement, string> = {
  mounted(element, { value }) {
    const viewport = element.querySelector<HTMLElement>('.cm-table__scroll, .cm-data-table__scroll');
    if (!viewport) return;
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', value);
  },
};
