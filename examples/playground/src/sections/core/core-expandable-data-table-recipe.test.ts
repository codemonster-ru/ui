// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreExpandableDataTableRecipe from './CoreExpandableDataTableRecipe.vue';

describe('CoreExpandableDataTableRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  function mountRecipe(initialIds: readonly (string | number)[] = [2]) {
    const expandedIds = ref(initialIds);
    const app = createApp(
      defineComponent(
        () => () =>
          h(CoreExpandableDataTableRecipe, {
            expandedIds: expandedIds.value,
            'onUpdate:expandedIds': (ids: (string | number)[]) => (expandedIds.value = ids),
          }),
      ),
    );
    app.mount(host);

    return { app, expandedIds };
  }

  it('renders frozen native row and detail semantics from controlled expanded ids', async () => {
    const { app } = mountRecipe([2]);
    await nextTick();

    expect([...host.querySelectorAll('th')].map((cell) => cell.scope)).toEqual(['col', 'col', 'col', 'col']);
    expect(host.querySelectorAll('[data-core-expandable-row]')).toHaveLength(5);
    expect(host.querySelectorAll('.demo-application-expandable-table__details-row')).toHaveLength(1);
    const trigger = host.querySelector<HTMLButtonElement>('[data-core-expandable-row="2"] button')!;
    const details = host.querySelector<HTMLTableRowElement>('.demo-application-expandable-table__details-row')!;
    expect(trigger.type).toBe('button');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(details.id);
    expect(trigger.getAttribute('aria-label')).toBe('Collapse row 2');
    expect(details.querySelector('td')?.colSpan).toBe(4);
    expect([...details.querySelectorAll('dt')].map(({ textContent }) => textContent)).toEqual([
      'Email',
      'Last activity',
      'Note',
    ]);
    expect([...details.querySelectorAll('dd')].map(({ textContent }) => textContent)).toEqual([
      'bob@example.com',
      '25 minutes ago',
      'Preparing the next infrastructure release.',
    ]);
    app.unmount();
  });

  it('emits and renders controlled expansion without duplicate ids', async () => {
    const { app, expandedIds } = mountRecipe([2, 2]);
    await nextTick();
    const firstTrigger = host.querySelector<HTMLButtonElement>('[data-core-expandable-row="1"] button')!;
    const secondTrigger = host.querySelector<HTMLButtonElement>('[data-core-expandable-row="2"] button')!;

    firstTrigger.focus();
    firstTrigger.click();
    await nextTick();
    expect(expandedIds.value).toEqual([2, 1]);
    expect(document.activeElement).toBe(firstTrigger);
    expect(firstTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelectorAll('.demo-application-expandable-table__details-row')).toHaveLength(2);

    secondTrigger.click();
    await nextTick();
    expect(expandedIds.value).toEqual([1]);
    expect(secondTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector(`#${secondTrigger.getAttribute('aria-controls')}`)).toBeNull();
    app.unmount();
  });

  it('keeps activation on native buttons and visual direction truthful in LTR and RTL', async () => {
    const { app } = mountRecipe([]);
    await nextTick();

    const button = host.querySelector<HTMLButtonElement>('button')!;
    expect(button.tagName).toBe('BUTTON');
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.querySelector('svg path')?.getAttribute('d')).toBe('M5.75 8.75 12 15 18.25 8.75');

    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreExpandableDataTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('@keydown');
    expect(source).toContain("[aria-expanded='false'] :deep(svg)");
    expect(source).toContain("[aria-expanded='false']:dir(rtl)");
    app.unmount();
  });

  it('is route-owned and CM-only with paired-row stripe geometry', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreExpandableDataTableRecipe.vue'), 'utf8');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('vueforge-core');
    expect(source).toContain('<CmTable');
    expect(source).toContain('<CmIconButton');
    expect(source).toContain("index % 2 === 1 && 'demo-application-expandable-table__row--striped'");
    expect(source).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
  });
});
