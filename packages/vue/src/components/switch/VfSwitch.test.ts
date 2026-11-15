import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import CmSwitch from './CmSwitch.vue';
import VfSwitch from './VfSwitch.vue';

it('forwards the native checkbox and slots and reports the historical boolean events in order', async () => {
  const events: [string, boolean][] = [];
  const wrapper = mount(VfSwitch, {
    props: {
      label: 'Fallback',
      'onUpdate:modelValue': (checked: boolean) => events.push(['update', checked]),
      onChange: (checked: boolean) => events.push(['change', checked]),
    },
    attrs: { id: 'setting', name: 'prefs', value: 'yes', class: 'custom', style: 'opacity: 0.8' },
    slots: { default: 'Enable reminders', thumb: ({ checked }: { checked: boolean }) => (checked ? 'On' : 'Off') },
  });

  const input = wrapper.get('input');
  expect(wrapper.classes()).toEqual(['cm-switch', 'cm-switch--md', 'custom']);
  expect(wrapper.attributes('style')).toContain('opacity: 0.8');
  expect(input.attributes()).toMatchObject({ id: 'setting', name: 'prefs', role: 'switch', value: 'yes' });
  expect(input.element.checked).toBe(false);
  expect(wrapper.get('.cm-switch__content').text()).toBe('Enable reminders');
  expect(wrapper.get('.cm-switch__thumb').text()).toBe('Off');

  await input.setValue(true);
  expect(events).toEqual([
    ['update', true],
    ['change', true],
  ]);
  await wrapper.setProps({ modelValue: true });
  expect(input.attributes('aria-checked')).toBe('true');
  expect(wrapper.get('.cm-switch__thumb').text()).toBe('On');
  expect(wrapper.get('.cm-switch__control').attributes('aria-hidden')).toBe('true');
});

it('honors the label, static style and disabled state without changing the canonical inverse variant', async () => {
  const props = { label: 'Scheduler', invalid: true, static: true, thumbContrast: 'inverse' as const };
  const historical = mount(VfSwitch, { props });
  expect(historical.get('.cm-switch__content').text()).toBe('Scheduler');
  expect(historical.get('input').attributes('aria-invalid')).toBe('true');
  expect(historical.classes()).toContain('cm-switch--static');
  expect(historical.classes()).toContain('cm-switch--thumb-contrast-inverse');

  await historical.setProps({ disabled: true });
  const input = historical.get('input').element;
  expect(input.disabled).toBe(true);
  expect(historical.classes()).not.toContain('cm-switch--thumb-contrast-inverse');
  input.click();
  expect(historical.emitted('change')).toBeUndefined();

  const canonical = mount(CmSwitch, { props: { ...props, disabled: true } });
  expect(canonical.classes()).toContain('cm-switch--thumb-contrast-inverse');
});
