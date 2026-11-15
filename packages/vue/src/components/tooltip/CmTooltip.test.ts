import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';

import CmTooltip from './CmTooltip.vue';
import VfTooltip from './VfTooltip.vue';

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('Tooltip', () => {
  it('keeps the documented button, label and content fallbacks', () => {
    const wrapper = mount(CmTooltip, {
      props: { id: 'save', label: 'Save', content: 'Save changes', defaultVisible: true },
      slots: { trigger: () => h('span', { 'aria-hidden': true }, '✓') },
    });

    expect(wrapper.get('button').attributes('aria-label')).toBe('Save');
    expect(wrapper.get('button').attributes('aria-describedby')).toBe('save-tooltip');
    expect(wrapper.get('button').text()).toBe('✓');
    expect(wrapper.get('[role="tooltip"]').text()).toBe('Save changes');
    expect(wrapper.classes()).toContain('cm-tooltip--visible');
    wrapper.unmount();
  });

  it('keeps a trigger without help text or a content slot usable on its own', () => {
    const wrapper = mount(VfTooltip, {
      slots: { default: () => h('button', { 'aria-describedby': 'existing' }, 'Info') },
    });
    expect(wrapper.get('button').attributes('aria-describedby')).toBe('existing');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    expect(wrapper.attributes('data-cm-controller')).toBeUndefined();
    wrapper.unmount();
  });

  it('uses the authored element, keeps its description and honors a custom delay', async () => {
    vi.useFakeTimers();
    const wrapper = mount(CmTooltip, {
      attachTo: document.body,
      props: { delay: 'long', openDelay: 125 },
      slots: {
        default: () => h('a', { href: '#shortcuts', 'aria-describedby': 'existing' }, 'Help'),
        content: () => h('strong', 'Keyboard shortcuts'),
      },
    });

    const trigger = wrapper.get('a');
    const tooltip = wrapper.get('[role="tooltip"]');
    expect(wrapper.find('button').exists()).toBe(false);
    expect(trigger.attributes('aria-describedby')).toBe(`existing ${tooltip.attributes('id')}`);
    expect(trigger.attributes('href')).toBe('#shortcuts');

    trigger.element.focus();
    await wrapper.trigger('pointerenter');
    vi.advanceTimersByTime(124);
    expect(tooltip.element.hasAttribute('hidden')).toBe(true);
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(tooltip.element.hasAttribute('hidden')).toBe(false);

    await wrapper.trigger('pointerleave');
    expect(tooltip.element.hasAttribute('hidden')).toBe(false);
    await trigger.trigger('keydown', { key: 'Escape' });
    expect(tooltip.element.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it('cancels pending opening when both activation sources leave', async () => {
    vi.useFakeTimers();
    const wrapper = mount(CmTooltip, { props: { label: 'Info', text: 'Details', openDelay: 20 } });
    await wrapper.trigger('pointerenter');
    await wrapper.trigger('pointerleave');
    vi.advanceTimersByTime(20);
    await nextTick();
    expect(wrapper.get('[role="tooltip"]').element.hasAttribute('hidden')).toBe(true);
    wrapper.unmount();
  });

  it('keeps a portaled tooltip open when crossing to its content and dismisses it from outside focus', async () => {
    const wrapper = mount(CmTooltip, {
      attachTo: document.body,
      props: { id: 'details', label: 'Info', content: 'Details', delay: 'none', teleportTo: 'body' },
    });
    const outside = document.createElement('button');
    document.body.append(outside);

    try {
      outside.focus();
      await wrapper.trigger('pointerenter');
      const tooltip = document.getElementById('details-tooltip')!;
      expect(tooltip.parentElement).toBe(document.body);

      const root = wrapper.get<HTMLSpanElement>('.cm-tooltip').element;
      root.dispatchEvent(new MouseEvent('pointerleave', { relatedTarget: tooltip }));
      tooltip.dispatchEvent(new MouseEvent('pointerenter', { relatedTarget: root }));
      await nextTick();
      expect(tooltip.hidden).toBe(false);

      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      outside.dispatchEvent(escape);
      await nextTick();
      expect(tooltip.hidden).toBe(true);
      expect(escape.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(outside);
    } finally {
      wrapper.unmount();
      outside.remove();
    }
  });

  it('defaults the historical component to an 80 ms body portal and returns the panel on close', async () => {
    vi.useFakeTimers();
    const host = document.createElement('div');
    document.body.append(host);
    const wrapper = mount(VfTooltip, {
      attachTo: host,
      props: { text: 'Positioned help', placement: 'bottom' },
      slots: { default: () => h('button', { type: 'button' }, 'Help') },
    });

    const trigger = wrapper.get('button');
    trigger.element.focus();
    vi.advanceTimersByTime(79);
    expect(host.querySelector('[role="tooltip"]')?.hasAttribute('hidden')).toBe(true);
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(host.querySelector('[role="tooltip"]')).toBeNull();
    const description = trigger.attributes('aria-describedby');
    const tooltip = description ? document.getElementById(description) : null;
    expect(tooltip?.parentElement).toBe(document.body);
    expect(tooltip?.textContent?.trim()).toBe('Positioned help');
    expect(tooltip?.hasAttribute('data-cm-tooltip-floating')).toBe(true);

    trigger.element.blur();
    await nextTick();
    expect(host.querySelector('[role="tooltip"]')?.hasAttribute('hidden')).toBe(true);
    wrapper.unmount();
  });

  it('uses a custom target and honors disableTeleport for the current open panel', async () => {
    const target = document.createElement('aside');
    document.body.append(target);
    const wrapper = mount(VfTooltip, {
      attachTo: document.body,
      props: { text: 'Context', openDelay: 0, teleportTo: target },
      slots: { default: () => h('button', 'Info') },
    });
    wrapper.get('button').element.focus();
    await nextTick();
    expect(target.querySelector('[role="tooltip"]')).not.toBeNull();

    await wrapper.setProps({ disableTeleport: true });
    expect(target.querySelector('[role="tooltip"]')).toBeNull();
    expect(wrapper.get('[role="tooltip"]').element.hasAttribute('hidden')).toBe(false);
    wrapper.unmount();
  });
});
