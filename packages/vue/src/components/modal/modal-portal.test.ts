import { mount, flushPromises } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { expect, it, vi } from 'vitest';
import VfDialog from '../dialog/VfDialog.vue';
import VfDrawer from '../drawer/VfDrawer.vue';

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

it('leaves initially open modal markup inline during SSR and defaults to body after mount', async () => {
  const context: { teleports?: Record<string, string> } = {};
  const html = await renderToString(
    createSSRApp({ render: () => h(VfDialog, { id: 'initial', title: 'Initial', defaultOpen: true }) }),
    context,
  );
  expect(html).toMatch(/<dialog[^>]*id="initial-dialog"[^>]* open/u);
  expect(context.teleports?.body ?? '').not.toContain('<dialog');

  const wrapper = mount(VfDialog, { attachTo: document.body, props: { id: 'after', title: 'After' } });
  try {
    await flushPromises();
    expect(document.querySelector('#after-dialog')?.parentElement).toBe(document.body);
    await wrapper.setProps({ teleportTo: false });
    expect(document.querySelector('#after-dialog')?.parentElement).not.toBe(document.body);
  } finally {
    wrapper.unmount();
  }
});

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
