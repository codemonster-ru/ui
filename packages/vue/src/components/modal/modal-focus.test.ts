import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { expect, it, vi } from 'vitest';

import CmDialog from '../dialog/CmDialog.vue';
import CmDrawer from '../drawer/CmDrawer.vue';

it('focuses and traps only available Dialog controls', async () => {
  const wrapper = mount(CmDialog, {
    attachTo: document.body,
    props: { id: 'focus', title: 'Focus', open: true, closable: false },
    slots: {
      default: `
        <button autofocus disabled>Disabled</button>
        <div hidden><button autofocus>Hidden</button></div>
        <div inert><button data-autofocus>Inert</button></div>
        <input type="hidden">
        <button id="first">First</button>
        <fieldset disabled><button>Disabled by fieldset</button></fieldset>
        <button id="last">Last</button>
        <button tabindex="-1">Programmatic only</button>
        <div aria-hidden="true"><button>Hidden from assistive technology</button></div>
      `,
    },
  });

  try {
    await nextTick();
    const first = wrapper.get('#first');
    const last = wrapper.get('#last');
    expect(document.activeElement).toBe(first.element);
    await first.trigger('keydown', { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last.element);
    await last.trigger('keydown', { key: 'Tab' });
    expect(document.activeElement).toBe(first.element);
  } finally {
    wrapper.unmount();
  }
});

it('synchronizes a native close with v-model and ignores a delayed close after reopening', async () => {
  const opener = document.createElement('button');
  document.body.append(opener);
  const wrapper = mount(CmDialog, {
    attachTo: document.body,
    props: { id: 'close', title: 'Close', open: false },
  });

  try {
    opener.focus();
    await wrapper.setProps({ open: true });
    const dialog = wrapper.get('dialog');
    // In a browser, close() and form method="dialog" clear open before dispatching close.
    dialog.element.open = false;
    await dialog.trigger('close');
    expect(dialog.attributes('data-cm-dialog-state')).toBe('closed');
    expect(dialog.classes()).not.toContain('cm-dialog--open');
    expect(document.activeElement).toBe(opener);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);

    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    await dialog.trigger('close');
    expect(dialog.element.open).toBe(true);
    await wrapper.get('[data-cm-dialog-close]').trigger('click');
    await dialog.trigger('close');
    expect(wrapper.emitted('update:open')).toEqual([[false], [false]]);
    expect(wrapper.emitted('openChange')).toEqual([[false], [false]]);
  } finally {
    wrapper.unmount();
    opener.remove();
  }
});

it('releases a default-open dialog without an opener or a tab trap after native close', async () => {
  const wrapper = mount(CmDialog, {
    attachTo: document.body,
    props: { id: 'native', title: 'Initially open', defaultOpen: true },
  });

  try {
    await nextTick();
    const dialog = wrapper.get('dialog');
    const close = wrapper.get('[data-cm-dialog-close]').element;
    expect(document.activeElement).toBe(close);
    dialog.element.open = false;
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    close.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
    await dialog.trigger('close');
    expect(dialog.element.contains(document.activeElement)).toBe(false);
  } finally {
    wrapper.unmount();
  }
});

it.each([CmDialog, CmDrawer])(
  'restores the invoking focus when an open %s unmounts without emitting',
  async (Modal) => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const changed = vi.fn();
    const wrapper = mount(Modal, {
      attachTo: document.body,
      props: { id: 'unmount', title: 'Open modal', open: true, onOpenChange: changed, 'onUpdate:open': changed },
      slots: { default: '<button autofocus>Inside</button>' },
    });

    try {
      await nextTick();
      const dialog = wrapper.get('dialog').element;
      expect(document.activeElement).toBe(dialog.querySelector('[autofocus]'));
      const close = vi.fn(() => {
        dialog.open = false;
        dialog.dispatchEvent(new Event('close'));
      });
      dialog.close = close;
      wrapper.unmount();

      expect(close).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(opener);
      expect(changed).not.toHaveBeenCalled();
    } finally {
      if (wrapper.exists()) wrapper.unmount();
      opener.remove();
    }
  },
);

it('preserves focus that moved to an outside control before the modal unmounted', async () => {
  const opener = document.createElement('button');
  const outside = document.createElement('button');
  document.body.append(opener, outside);
  opener.focus();
  const wrapper = mount(CmDialog, {
    attachTo: document.body,
    props: { id: 'next-action', title: 'Continue', open: true },
  });

  try {
    await nextTick();
    outside.focus();
    wrapper.unmount();
    expect(document.activeElement).toBe(outside);
  } finally {
    if (wrapper.exists()) wrapper.unmount();
    opener.remove();
    outside.remove();
  }
});
