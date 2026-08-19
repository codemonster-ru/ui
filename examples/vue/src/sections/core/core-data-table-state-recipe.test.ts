// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- Each test mounts the same route-local recipe in isolation. */

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreDataTableStateRecipe from './CoreDataTableStateRecipe.vue';

describe('CoreDataTableStateRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('renders the frozen loading mask over five native rows', async () => {
    const app = createApp(CoreDataTableStateRecipe, { variant: 'loading' });
    app.mount(host);
    await nextTick();

    expect(host.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(host.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(host.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe('Loading...');
    expect(host.querySelector('.cm-progress-spinner')).not.toBeNull();
    app.unmount();
  });

  it('renders four three-column skeleton rows with hidden placeholders', async () => {
    const app = createApp(CoreDataTableStateRecipe, { variant: 'skeleton' });
    app.mount(host);
    await nextTick();

    expect([...host.querySelectorAll('th')].map(({ textContent }) => textContent?.trim())).toEqual([
      'Member',
      'Status',
      'Tasks',
    ]);
    expect(host.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(host.querySelectorAll('.cm-skeleton')).toHaveLength(12);
    expect([...host.querySelectorAll('.cm-skeleton')].every((node) => node.getAttribute('aria-hidden') === 'true')).toBe(
      true,
    );
    app.unmount();
  });

  it('owns controlled rich error and retry behavior', async () => {
    const error = ref(true);
    const app = createApp(
      defineComponent(
        () => () =>
          h(CoreDataTableStateRecipe, {
            variant: 'error',
            error: error.value,
            onRetry: () => (error.value = false),
          }),
      ),
    );
    app.mount(host);
    await nextTick();

    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Could not load team members.');
    host.querySelector<HTMLButtonElement>('button')?.click();
    await nextTick();
    expect(error.value).toBe(false);
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(host.querySelectorAll('tbody tr')).toHaveLength(3);
    app.unmount();
  });

  it('keeps route ownership and native table semantics', async () => {
    const app = createApp(CoreDataTableStateRecipe, { variant: 'error' });
    app.mount(host);
    await nextTick();

    expect(host.querySelectorAll('table')).toHaveLength(1);
    expect([...host.querySelectorAll('th')].every((cell) => cell.scope === 'col')).toBe(true);
    expect(host.querySelector('td')?.colSpan).toBe(3);
    expect(host.innerHTML).not.toContain('vf-data-table');
    app.unmount();
  });
});
