import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { expect, it } from 'vitest';

import CmDialog from './CmDialog.vue';

it('opens initially without emitting and can independently prevent Escape dismissal', async () => {
  const opener = document.createElement('button');
  document.body.append(opener);
  opener.focus();
  const wrapper = mount(CmDialog, {
    attachTo: document.body,
    props: { id: 'keyboard-help', defaultOpen: true, closeOnEscape: false, ariaLabel: 'Keyboard help' },
  });

  try {
    await nextTick();
    const root = wrapper.get('dialog');
    const close = wrapper.get('button');
    expect(root.element.open).toBe(true);
    expect(root.attributes('aria-label')).toBe('Keyboard help');
    expect(root.attributes('aria-labelledby')).toBeUndefined();
    expect(wrapper.find('h2').exists()).toBe(false);
    expect(document.activeElement).toBe(close.element);
    expect(wrapper.emitted('openChange')).toBeUndefined();

    await wrapper.setProps({ defaultOpen: false });
    await close.trigger('keydown', { key: 'Escape' });
    const cancel = new Event('cancel', { cancelable: true });
    expect(root.element.dispatchEvent(cancel)).toBe(false);
    expect(root.element.open).toBe(true);
    expect(wrapper.emitted('openChange')).toBeUndefined();

    await close.trigger('click');
    expect(root.element.open).toBe(false);
    expect(wrapper.emitted('openChange')).toEqual([[false]]);
    expect(document.activeElement).toBe(opener);
  } finally {
    wrapper.unmount();
    opener.remove();
  }
});

it('gives explicit open and accessible relationships precedence over initial defaults', async () => {
  const wrapper = mount(CmDialog, {
    props: { id: 'task', defaultOpen: true, open: false, title: 'Visible title', description: 'Description' },
    attrs: { 'aria-labelledby': 'explicit-name', 'aria-describedby': 'explicit-desc' },
    slots: { default: '<p id="explicit-name">Name</p><p id="explicit-desc">Details</p>' },
  });

  try {
    const root = wrapper.get('dialog');
    expect(root.element.open).toBe(false);
    expect(root.attributes('aria-labelledby')).toBe('explicit-name');
    expect(root.attributes('aria-describedby')).toBe('explicit-desc');
    expect(wrapper.get('h2').text()).toBe('Visible title');
    await wrapper.setProps({ open: true });
    expect(root.element.open).toBe(true);
  } finally {
    wrapper.unmount();
  }
});
