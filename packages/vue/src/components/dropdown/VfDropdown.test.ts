import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { expect, it } from 'vitest';

import CmButton from '../button/CmButton.vue';
import VfDropdown from './VfDropdown.vue';

it('preserves the authored button and does not toggle twice when its click calls the slot action', async () => {
  const wrapper = mount(VfDropdown, {
    attachTo: document.body,
    props: { items: [{ id: 'settings', label: 'Settings' }] },
    slots: {
      trigger: ({ toggle }: { toggle: () => void }) =>
        h(CmButton, { class: 'custom-trigger', onClick: () => toggle() }, () => 'Actions'),
    },
  });
  try {
    const trigger = wrapper.get<HTMLButtonElement>('button.custom-trigger');
    const panelId = trigger.attributes('aria-controls');
    expect(panelId).toBeTruthy();
    expect(wrapper.findAll('button.custom-trigger').length).toBe(1);
    expect(wrapper.find('button button').exists()).toBe(false);
    await trigger.trigger('click');
    await nextTick();
    const menu = document.getElementById(panelId!);
    expect(menu?.parentElement).toBe(document.body);
    expect(menu?.hidden).toBe(false);
    expect(wrapper.emitted('openChange')).toEqual([[true]]);
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('Settings');
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(menu?.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger.element);
    expect(wrapper.emitted('openChange')).toEqual([[true], [false]]);
    await trigger.trigger('click');
    menu?.querySelector<HTMLButtonElement>('[role=menuitem]')?.click();
    await nextTick();
    expect(menu?.hidden).toBe(true);
  } finally {
    wrapper.unmount();
  }
});
