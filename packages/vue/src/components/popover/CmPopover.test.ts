import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { expect, it } from 'vitest';
import CmPopover from './CmPopover.vue';
import VfPopover from './VfPopover.vue';

it('focuses the authored target in a portal and exposes a scoped close action', async () => {
  const host = document.createElement('dialog');
  host.open = true;
  document.body.append(host);
  const wrapper = mount(CmPopover, {
    attachTo: host,
    props: {
      id: 'help',
      label: 'Help',
      teleportTo: 'body',
      focusOnOpen: true,
      closeOnEscape: false,
    },
    slots: {
      default: ({ close }: { close: () => void }) => [
        h('button', 'Reset'),
        h('button', { 'data-autofocus': '', onClick: close }, 'Apply'),
      ],
    },
  });
  try {
    const trigger = wrapper.get('#help-trigger');
    await trigger.trigger('click');
    await nextTick();
    const panel = host.querySelector<HTMLElement>('#help-panel');
    expect(panel?.parentElement).toBe(host);
    expect(document.activeElement?.textContent).toBe('Apply');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(panel?.hidden).toBe(false);
    panel?.querySelector<HTMLButtonElement>('[data-autofocus]')?.click();
    await nextTick();
    expect(panel?.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger.element);
  } finally {
    wrapper.unmount();
    host.remove();
  }
});

it('preserves the historical wrapper Escape default and returns focus to the authored button', async () => {
  const wrapper = mount(VfPopover, {
    attachTo: document.body,
    slots: {
      trigger: () => h('button', { class: 'custom-trigger' }, 'Details'),
      default: () => h('button', 'Apply'),
    },
  });
  try {
    const trigger = wrapper.get('button.custom-trigger');
    await trigger.trigger('click');
    await nextTick();
    const panelId = trigger.attributes('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    expect(panel?.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe('Apply');
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(panel?.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger.element);
  } finally {
    wrapper.unmount();
  }
});
