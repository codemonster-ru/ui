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
    expect(panel?.hasAttribute('data-cm-floating-arrow')).toBe(false);
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
    expect(panel?.hasAttribute('data-cm-floating-arrow')).toBe(true);
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

it('releases focus on controlled close and keeps the portal positioned until the latest exit finishes', async () => {
  const wrapper = mount(CmPopover, {
    attachTo: document.body,
    props: { id: 'help', label: 'Help', open: true, teleportTo: 'body' },
    slots: { default: () => h('button', 'Apply') },
  });
  try {
    await nextTick();
    const panel = document.querySelector<HTMLElement>('#help-panel')!;
    const action = panel.querySelector('button')!;
    let cancelFirstExit!: () => void;
    let finishSecondExit!: () => void;
    const first = new Promise<void>((_resolve, reject) => {
      cancelFirstExit = () => reject(new Error('Exit canceled by reopening'));
    });
    const second = new Promise<void>((resolve) => {
      finishSecondExit = resolve;
    });
    let finished = first;
    let painted = true;
    panel.getAnimations = () => [{ transitionProperty: 'display', finished }] as unknown as CSSTransition[];
    panel.getClientRects = () => (painted ? [{}] : []) as unknown as DOMRectList;
    action.focus();

    await wrapper.setProps({ open: false });
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).not.toBe(action);
    expect(panel.parentElement).toBe(document.body);
    expect(panel.hasAttribute('data-cm-popover-portaled')).toBe(true);

    await wrapper.setProps({ open: true });
    expect(panel.hidden).toBe(false);
    finished = second;
    await wrapper.setProps({ open: false });
    cancelFirstExit();
    await first.catch(() => {});
    expect(panel.parentElement).toBe(document.body);

    painted = false;
    finishSecondExit();
    await second;
    await nextTick();
    expect(wrapper.get('#help-panel').element).toBe(panel);
    expect(panel.hasAttribute('data-cm-popover-portaled')).toBe(false);
  } finally {
    wrapper.unmount();
  }
});
