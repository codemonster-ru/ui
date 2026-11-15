import { mount } from '@vue/test-utils';
import { h, toRaw } from 'vue';
import { expect, it } from 'vitest';

import VfCommandPalette from './VfCommandPalette.vue';

it('submits the initial query and selects a caller-owned object without refiltering its results', async () => {
  const item = { title: 'An unfiltered command', section: 'Settings', snippet: 'Use [a] literally' };
  const wrapper = mount(VfCommandPalette, {
    attachTo: document.body,
    props: {
      defaultOpen: true,
      defaultValue: '[a]',
      items: [item],
      closeOnSelect: false,
      closeOnEscape: false,
      teleportTo: false,
    },
  });

  try {
    const dialog = wrapper.get<HTMLDialogElement>('dialog');
    const input = wrapper.get<HTMLInputElement>('input');
    expect(wrapper.emitted('open')).toEqual([[]]);
    expect(input.element.value).toBe('[a]');
    expect(input.attributes('aria-activedescendant')).toBeUndefined();
    expect(wrapper.get('mark').text()).toBe('[a]');
    expect(wrapper.get('[role=option]').attributes('hidden')).toBeUndefined();
    expect(wrapper.get('kbd').text()).toBe('↑');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('submit')).toEqual([['[a]']]);
    await input.trigger('keydown', { key: 'ArrowDown' });
    await input.trigger('keydown', { key: 'Enter' });
    expect(toRaw(wrapper.emitted('select')?.[0]?.[0])).toBe(item);
    await input.trigger('keydown', { key: 'Escape' });
    expect(dialog.element.open).toBe(true);
    await wrapper.get('[data-cm-command-palette-close]').trigger('click');
    expect(wrapper.emitted('close')).toEqual([[]]);
  } finally {
    wrapper.unmount();
  }
});

it('does not publish a rejected model value and passes scoped results actions', async () => {
  const item = { label: 'A command' };
  const wrapper = mount(VfCommandPalette, {
    props: { modelValue: 'Held', defaultOpen: true, items: [item], teleportTo: false },
    slots: {
      default: (scope: { query: string; select: (value: unknown) => void }) =>
        h('button', { type: 'button', onClick: () => scope.select(item) }, scope.query),
    },
  });

  try {
    const input = wrapper.get<HTMLInputElement>('input');
    await input.setValue('Rejected');
    expect(wrapper.emitted('update:modelValue')).toEqual([['Rejected']]);
    expect(input.element.value).toBe('Held');
    expect(input.attributes('aria-controls')).toBeUndefined();
    await wrapper.get('.cm-command-palette__results button').trigger('click');
    expect(wrapper.emitted('select')).toEqual([[item]]);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  } finally {
    wrapper.unmount();
  }
});
