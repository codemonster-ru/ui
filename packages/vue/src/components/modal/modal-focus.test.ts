import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { expect, it } from 'vitest';

import CmDialog from '../dialog/CmDialog.vue';

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
