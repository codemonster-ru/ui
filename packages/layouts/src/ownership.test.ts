import { CmRuntime, createCmAppShellController } from '@codemonster-ru/ui-runtime';
import { cmFrameworkOwnership } from '@codemonster-ru/ui-runtime/core';
import { renderToString } from '@vue/server-renderer';
import { expect, it } from 'vitest';
import { createApp, createSSRApp, h, nextTick } from 'vue';

import { CmAdminLayout, CmAppShell, CmDocumentLayout, CmSetupLayout } from './index';

it.each(['running observer', 'runtime before hydration', 'runtime after hydration'] as const)(
  'keeps Vue layout ownership with a %s and enhances separate Vanilla markup',
  async (order) => {
    const host = document.createElement('div');
    host.innerHTML = '<div id="layout-island"></div><div id="vanilla" data-cm-controller="setup-layout"></div>';
    document.body.append(host);
    const island = host.querySelector<HTMLElement>('#layout-island')!;
    const vanilla = host.querySelector<HTMLElement>('#vanilla')!;
    const connections = new Set<Element>();
    const runtime = new CmRuntime();
    for (const name of ['admin-layout', 'app-shell', 'setup-layout', 'shell-metrics']) {
      runtime.register(name, (element) => {
        const inner = name === 'app-shell' ? createCmAppShellController(element) : undefined;
        return {
          connect() {
            connections.add(element);
            inner?.connect();
          },
          disconnect() {
            connections.delete(element);
            inner?.disconnect();
          },
        };
      });
    }

    const requested: boolean[] = [];
    const view = {
      render: () =>
        h('div', [
          h(
            CmAppShell,
            { sidebarCollapsed: false, onSidebarCollapsedChange: (value: boolean) => requested.push(value) },
            {
              header: () => h('button', { type: 'button', 'data-cm-sidebar-toggle': '' }, 'Toggle'),
              sidebar: () => 'Sidebar',
              default: () => 'App content',
            },
          ),
          h(CmAdminLayout, null, () => 'Admin content'),
          h(CmDocumentLayout, null, () => 'Document content'),
          h(CmSetupLayout, { as: 'section' }, () => 'Setup content'),
        ]),
    };
    const app = order === 'running observer' ? createApp(view) : createSSRApp(view);
    let dispose: (() => void) | undefined;

    try {
      if (order === 'running observer') dispose = runtime.observe(host);
      else {
        island.innerHTML = await renderToString(createSSRApp(view));
        expect(island.querySelector(`[${cmFrameworkOwnership.attribute}]`)).toBeNull();
      }
      if (order === 'runtime before hydration') {
        runtime.start(host);
        expect(connections.size).toBe(5);
      }
      app.mount(island);
      if (order === 'runtime after hydration') runtime.start(host);

      const shell = island.querySelector('.cm-app-shell')!;
      const toggle = shell.querySelector<HTMLButtonElement>('button')!;
      toggle.click();
      await nextTick();
      expect(requested).toEqual([true]);
      expect(shell.getAttribute('data-cm-sidebar-collapsed')).toBe('false');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(island.querySelectorAll(`[${cmFrameworkOwnership.attribute}]`)).toHaveLength(4);
      expect([...connections]).toEqual([vanilla]);
    } finally {
      app.unmount();
      dispose?.();
      runtime.stop();
      host.remove();
    }
  },
);
