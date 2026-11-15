import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { expect, it } from 'vitest';
import VfAccordion from './VfAccordion.vue';

it('reports boolean requests in order and restores focus when the controlled panel closes', async () => {
  const events: string[] = [];
  const disclosure = mount(VfAccordion, {
    attachTo: document.body,
    props: {
      open: false,
      'onUpdate:open': (open) => events.push(`model:${open}`),
      onOpenChange: (open) => events.push(`change:${open}`),
    },
    slots: {
      trigger: ({ open }: { open: boolean }) => (open ? 'Hide details' : 'Show details'),
      default: ({ open }: { open: boolean }) => h('input', { 'aria-label': open ? 'Topic' : 'Closed' }),
    },
  });

  try {
    const trigger = disclosure.get<HTMLButtonElement>('button');
    const panel = disclosure.get('[role="region"]');
    expect(trigger.attributes('aria-controls')).toBe(panel.attributes('id'));
    expect(panel.attributes('aria-labelledby')).toBe(trigger.attributes('id'));
    await trigger.trigger('click');
    expect(events).toEqual(['model:true', 'change:true']);
    expect(trigger.text()).toBe('Show details');
    expect(disclosure.find('input').exists()).toBe(false);

    await disclosure.setProps({ open: true });
    expect(trigger.text()).toBe('Hide details');
    disclosure.get<HTMLInputElement>('input[aria-label="Topic"]').element.focus();
    await disclosure.setProps({ open: false });
    expect(document.activeElement).toBe(trigger.element);
    expect(panel.attributes('aria-hidden')).toBe('true');
    expect(disclosure.find('input').exists()).toBe(false);
    expect(events).toEqual(['model:true', 'change:true']);
  } finally {
    disclosure.unmount();
  }
});

it('preserves the uncontrolled initial state and native disabled behavior', async () => {
  const disclosure = mount(VfAccordion, { props: { defaultOpen: true, disabled: true, title: 'Shipping' } });

  try {
    const trigger = disclosure.get<HTMLButtonElement>('button');
    expect(trigger.text()).toBe('Shipping');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(trigger.element.disabled).toBe(true);
    await trigger.trigger('click');
    expect(disclosure.emitted('update:open')).toBeUndefined();
    await disclosure.setProps({ disabled: false });
    await trigger.trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(disclosure.emitted('update:open')).toEqual([[false]]);
  } finally {
    disclosure.unmount();
  }
});
