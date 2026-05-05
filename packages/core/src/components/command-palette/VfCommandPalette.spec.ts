import { h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import VfCommandPalette from './VfCommandPalette.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('VfCommandPalette', () => {
  it('shows idle text before query is entered', async () => {
    mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
      },
    });

    await nextTick();

    expect(document.body.textContent).toContain('Start typing to search');
    expect(document.body.textContent).not.toContain('Nothing found');
  });

  it('renders open state and autofocuses input', async () => {
    mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Search Docs',
      },
    });

    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]');
    const input = document.body.querySelector<HTMLInputElement>(
      '.vf-command-palette__input input, input.vf-command-palette__input',
    );

    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(input).not.toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('emits query updates on input', async () => {
    const wrapper = mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
      },
    });

    await nextTick();

    const input = document.body.querySelector<HTMLInputElement>(
      '.vf-command-palette__input input, input.vf-command-palette__input',
    );
    expect(input).not.toBeNull();

    input?.dispatchEvent(new Event('input', { bubbles: true }));
    if (input) {
      input.value = 'drawer';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['drawer']);
    expect(wrapper.emitted('queryChange')?.slice(-1)[0]).toEqual(['drawer']);
  });

  it('supports keyboard selection and emits select', async () => {
    const wrapper = mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
        items: [{ label: 'VfDrawer' }, { label: 'VfDialog' }],
      },
    });

    await nextTick();

    const input = document.body.querySelector<HTMLInputElement>(
      '.vf-command-palette__input input, input.vf-command-palette__input',
    );
    expect(input).not.toBeNull();

    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(wrapper.emitted('select')?.[0]).toEqual([{ label: 'VfDrawer' }]);
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('emits submit when pressing enter without active item', async () => {
    const wrapper = mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
      },
    });

    await nextTick();

    const input = document.body.querySelector<HTMLInputElement>(
      '.vf-command-palette__input input, input.vf-command-palette__input',
    );
    expect(input).not.toBeNull();

    if (input) {
      input.value = 'search term';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }

    expect(wrapper.emitted('submit')?.slice(-1)[0]).toEqual(['search term']);
  });

  it('emits close request on overlay click', async () => {
    const wrapper = mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
      },
    });

    await nextTick();

    document.body
      .querySelector('.vf-command-palette__overlay')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('shows empty text only when query is present and results are empty', async () => {
    const wrapper = mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
      },
    });

    await nextTick();

    const input = document.body.querySelector<HTMLInputElement>(
      '.vf-command-palette__input input, input.vf-command-palette__input',
    );
    expect(input).not.toBeNull();

    if (input) {
      input.value = 'nonexistent';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await nextTick();

    expect(document.body.textContent).toContain('Nothing found');
    expect(document.body.textContent).not.toContain('Start typing to search');

    wrapper.unmount();
  });

  it('highlights matched query fragments in default item renderer', async () => {
    mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
        items: [{ label: 'VfDrawer' }],
      },
    });

    await nextTick();

    const input = document.body.querySelector<HTMLInputElement>(
      '.vf-command-palette__input input, input.vf-command-palette__input',
    );
    expect(input).not.toBeNull();

    if (input) {
      input.value = 'draw';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await nextTick();

    const match = document.body.querySelector('.vf-command-palette__item-match');
    expect(match).not.toBeNull();
    expect(match?.textContent?.toLowerCase()).toBe('draw');
  });

  it('renders docs-style default item fields', async () => {
    mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
        items: [
          {
            section: 'Components / Overlay',
            title: 'VfCommandPalette',
            snippet: 'Keyboard-first search overlay for docs',
            type: 'Component',
          },
        ],
      },
    });

    await nextTick();

    expect(document.body.querySelector('.vf-command-palette__item-breadcrumb')?.textContent).toContain(
      'Components / Overlay',
    );
    expect(document.body.querySelector('.vf-command-palette__item-title')?.textContent).toContain('VfCommandPalette');
    expect(document.body.querySelector('.vf-command-palette__item-snippet')?.textContent).toContain(
      'Keyboard-first search overlay for docs',
    );
    expect(document.body.querySelector('.vf-command-palette__item-leading-icon')).not.toBeNull();
  });

  it('renders custom body slot when provided', async () => {
    mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
        items: [{ label: 'Custom item' }],
      },
      slots: {
        default: ({ items, query }: { items: unknown[]; query: string }) =>
          h('div', { 'data-test': 'custom-body' }, `${query}::${items.length}`),
      },
    });

    await nextTick();

    expect(document.body.querySelector('[data-test="custom-body"]')).not.toBeNull();
    expect(document.body.textContent).toContain('::1');
    expect(document.body.querySelector('.vf-command-palette__list')).toBeNull();
  });

  it('renders default footer keyboard hints', async () => {
    mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
      },
    });

    await nextTick();

    const hints = document.body.querySelector('.vf-command-palette__hints');
    expect(hints).not.toBeNull();
    expect(document.body.textContent).toContain('Navigate');
    expect(document.body.textContent).toContain('Select');
    expect(document.body.textContent).toContain('Close');
  });

  it('hides default footer hints when disabled', async () => {
    mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
        showDefaultFooterHints: false,
      },
    });

    await nextTick();

    expect(document.body.querySelector('.vf-command-palette__footer')).toBeNull();
    expect(document.body.querySelector('.vf-command-palette__hints')).toBeNull();
  });
});
