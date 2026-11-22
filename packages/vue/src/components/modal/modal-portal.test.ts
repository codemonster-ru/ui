import { mount, flushPromises } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { expect, it, vi } from 'vitest';
import VfCommandPalette from '../command-palette/VfCommandPalette.vue';
import CmConfirmDialog from '../confirm-dialog/CmConfirmDialog.vue';
import VfDialog from '../dialog/VfDialog.vue';
import VfDrawer from '../drawer/VfDrawer.vue';

it('places ConfirmDialog in authored targets or inline', async () => {
  const host = document.createElement('div');
  const target = document.createElement('div');
  target.id = 'confirm-dialog-host';
  document.body.append(host, target);
  const wrapper = mount(CmConfirmDialog, {
    attachTo: host,
    props: { open: true, teleportTo: '#confirm-dialog-host' },
  });
  try {
    await flushPromises();
    expect(target.querySelector('dialog')?.open).toBe(true);
    await wrapper.setProps({ teleportTo: target });
    expect(target.querySelector('dialog')?.open).toBe(true);
    for (const teleportTo of [false, null] as const) {
      await wrapper.setProps({ teleportTo });
      expect(host.querySelector('dialog')?.open).toBe(true);
    }
    await wrapper.setProps({ teleportTo: target, disableTeleport: true });
    expect(host.querySelector('dialog')?.open).toBe(true);
  } finally {
    wrapper.unmount();
    host.remove();
    target.remove();
  }
});

it.each([
  [VfDialog, 'dialog'],
  [VfDrawer, 'drawer'],
] as const)(
  'keeps an open historical modal and its focus when moving between authored targets (%s)',
  async (Modal, suffix) => {
    const host = document.createElement('div');
    const first = document.createElement('div');
    first.id = 'modal-host-first';
    const second = document.createElement('div');
    const opener = document.createElement('button');
    document.body.append(host, first, second, opener);
    opener.focus();

    const wrapper = mount(Modal, {
      attachTo: host,
      props: { id: 'example', title: 'Example', defaultOpen: true, teleportTo: '#modal-host-first' },
      slots: { default: '<button autofocus>Inside</button>' },
    });

    try {
      await flushPromises();
      const dialog = first.querySelector<HTMLDialogElement>(`#example-${suffix}`);
      expect(dialog?.open).toBe(true);
      const inside = dialog?.querySelector('button[autofocus]');
      expect(document.activeElement).toBe(inside);
      await wrapper.setProps({ teleportTo: second });
      expect(dialog?.parentElement).toBe(second);
      expect(document.activeElement).toBe(inside);
      await wrapper.setProps({ disableTeleport: true });
      expect(host.contains(dialog ?? null)).toBe(true);
      expect(document.activeElement).toBe(inside);
      await wrapper.setProps({ disableTeleport: false, teleportTo: '[invalid' });
      expect(host.contains(dialog ?? null)).toBe(true);

      inside?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(dialog?.open).toBe(false);
      expect(wrapper.emitted('update:open')).toEqual([[false]]);
      expect(document.activeElement).toBe(opener);
    } finally {
      wrapper.unmount();
      for (const node of [host, first, second, opener]) node.remove();
    }
  },
);

it.each([
  [VfDialog, 'dialog'],
  [VfCommandPalette, 'command-palette'],
] as const)(
  'leaves initially open %s markup inline during SSR and defaults to body after mount',
  async (Modal, suffix) => {
    const context: { teleports?: Record<string, string> } = {};
    const html = await renderToString(
      createSSRApp({ render: () => h(Modal, { id: 'initial', title: 'Initial', defaultOpen: true }) }),
      context,
    );
    expect(html).toMatch(new RegExp(`<dialog[^>]*id="initial-${suffix}"[^>]* open`, 'u'));
    expect(context.teleports?.body ?? '').not.toContain('<dialog');

    const wrapper = mount(Modal, { attachTo: document.body, props: { id: 'after', title: 'After' } });
    try {
      await flushPromises();
      expect(document.querySelector(`#after-${suffix}`)?.parentElement).toBe(document.body);
      await wrapper.setProps({ teleportTo: false });
      expect(document.querySelector(`#after-${suffix}`)?.parentElement).not.toBe(document.body);
    } finally {
      wrapper.unmount();
    }
  },
);

it('hydrates the server dialog in place before moving the same node to an authored target', async () => {
  const root = {
    render: () =>
      h(VfDialog, { id: 'hydrate', title: 'Hydrate', defaultOpen: true, teleportTo: '#hydrated-modal-target' }),
  };
  const host = document.createElement('div');
  const destination = document.createElement('div');
  destination.id = 'hydrated-modal-target';
  host.innerHTML = await renderToString(createSSRApp(root));
  const authored = host.querySelector('dialog');
  document.body.append(host, destination);
  const app = createSSRApp(root);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});

  try {
    app.mount(host);
    await flushPromises();
    expect(destination.querySelector('dialog')).toBe(authored);
    expect(authored?.open).toBe(true);
    expect(authored?.hasAttribute('data-cm-hydrated')).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    app.unmount();
    host.remove();
    destination.remove();
    warn.mockRestore();
    error.mockRestore();
  }
});

it('moves the legacy Drawer lock between authored elements and releases it on close', async () => {
  const first = document.createElement('div');
  const second = document.createElement('div');
  first.style.overflow = 'auto';
  second.style.overflow = 'scroll';
  document.body.append(first, second);
  const wrapper = mount(VfDrawer, {
    attachTo: document.body,
    props: { id: 'scoped-scroll', title: 'Summary', defaultOpen: true, scrollLockTarget: first },
  });
  try {
    await flushPromises();
    const drawer = document.querySelector<HTMLDialogElement>('#scoped-scroll-drawer');
    expect(drawer?.open).toBe(true);
    expect(drawer?.hasAttribute('scrolllocktarget')).toBe(false);
    expect(first.style.overflow).toBe('hidden');
    await wrapper.setProps({ scrollLockTarget: second });
    expect(first.style.overflow).toBe('auto');
    expect(second.style.overflow).toBe('hidden');
    await wrapper.setProps({ scrollLockTarget: false });
    expect(second.style.overflow).toBe('scroll');
    expect(drawer?.open).toBe(true);
    await wrapper.setProps({ scrollLockTarget: first });
    expect(first.style.overflow).toBe('hidden');
    drawer?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();
    expect(drawer?.open).toBe(false);
    expect(first.style.overflow).toBe('auto');
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  } finally {
    wrapper.unmount();
    first.remove();
    second.remove();
  }
});
