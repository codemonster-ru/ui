import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { expect, it } from 'vitest';
import VfDataTableColumnChooser from './VfDataTableColumnChooser.vue';

it('keeps the authored trigger, controlled checkbox values, and focus in sync', async () => {
  const outside = document.createElement('button');
  document.body.append(outside);
  const wrapper = mount(VfDataTableColumnChooser, {
    attachTo: document.body,
    props: {
      columns: [{ key: 'name' }, { key: 'status' }],
      modelValue: ['status'],
      requiredColumnKeys: ['name'],
    },
    slots: {
      trigger: ({ visibleColumnKeys }: { visibleColumnKeys: string[] }) =>
        h('button', { 'data-trigger': '' }, visibleColumnKeys.join(', ')),
    },
  });

  try {
    const trigger = wrapper.get<HTMLButtonElement>('button[data-trigger]');
    expect(trigger.text()).toBe('name, status');
    expect(wrapper.find('button button').exists()).toBe(false);
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    const panelId = trigger.attributes('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    expect(panel?.parentElement).toBe(document.body);
    const option = panel?.querySelector<HTMLInputElement>('[data-cm-column-chooser-key=status]');
    expect(document.activeElement).toBe(panel?.querySelector('[data-cm-column-chooser-all]'));
    option?.click();
    expect(wrapper.emitted('update:modelValue')).toEqual([[['name']]]);
    expect(option?.checked).toBe(true);
    await wrapper.setProps({ modelValue: ['name'] });
    expect(option?.checked).toBe(false);
    expect(trigger.text()).toBe('name');
    outside.focus();
    outside.click();
    await nextTick();
    expect(panel?.hidden).toBe(true);
    expect(document.activeElement).toBe(outside);
    await wrapper.setProps({ modelValue: undefined });
    expect(trigger.text()).toBe('name, status');
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    option?.click();
    expect(wrapper.emitted('update:modelValue')).toEqual([[['name']], [['name']]]);
    expect(option?.checked).toBe(true);
  } finally {
    wrapper.unmount();
    outside.remove();
  }
});
