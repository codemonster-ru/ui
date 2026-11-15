import { CmRuntime, createCmCheckboxController } from '@codemonster-ru/ui-runtime';
import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';

import CmCheckbox from './CmCheckbox.vue';
import VfCheckbox from './VfCheckbox.vue';

it('renders the historical mixed state and emits checked booleans through the native checkbox', async () => {
  const events: [string, boolean][] = [];
  const wrapper = mount(VfCheckbox, {
    props: {
      indeterminate: true,
      required: true,
      label: 'Fallback',
      'onUpdate:modelValue': (value: boolean) => events.push(['update', value]),
      onChange: (value: boolean) => events.push(['change', value]),
    },
    attrs: { name: 'subscriptions', value: 'yes', class: 'consumer', style: 'opacity: 0.8' },
    slots: { default: 'Select all' },
  });
  const input = wrapper.get('input');
  expect(input.element.checked).toBe(false);
  expect(input.element.indeterminate).toBe(true);
  expect(input.attributes()).toMatchObject({ 'aria-checked': 'mixed', name: 'subscriptions', value: 'yes' });
  expect(input.element.validity.valueMissing).toBe(true);
  expect(wrapper.classes()).toEqual(['cm-checkbox', 'cm-checkbox--md', 'consumer']);
  expect(wrapper.attributes('style')).toContain('opacity: 0.8');
  expect(wrapper.get('.cm-checkbox__content').text()).toBe('Select all');

  await input.setValue(true);
  expect(events).toEqual([
    ['update', true],
    ['change', true],
  ]);
  await wrapper.setProps({ modelValue: true, indeterminate: false, disabled: true });
  expect(input.attributes('aria-checked')).toBe('true');
  expect(input.element.disabled).toBe(true);
  input.element.click();
  expect(events).toHaveLength(2);
});

it('keeps the indeterminate property when Vue takes over an enhanced SSR checkbox', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const view = { render: () => h(CmCheckbox, { label: 'Select all', indeterminate: true }) };
  const runtime = new CmRuntime().register('checkbox', createCmCheckboxController);
  const app = createSSRApp(view);

  try {
    container.innerHTML = await renderToString(createSSRApp(view));
    const input = container.querySelector('input')!;
    runtime.start(container);
    expect(input.indeterminate).toBe(true);
    app.mount(container);
    await nextTick();
    expect(input.indeterminate).toBe(true);
  } finally {
    app.unmount();
    runtime.stop();
    container.remove();
  }
});
