/* eslint-disable vue/one-component-per-file */
import { createSSRApp, defineComponent, h, nextTick } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { VueForgeCore, defaultThemePreset } from '@/index';
import { useTheme } from '@/composables/useTheme';
import VfThemeProvider from './VfThemeProvider.vue';

const ThemeConsumer = defineComponent({
  setup() {
    const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

    return {
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    };
  },
  template: `
    <div>
      <span data-test="theme">{{ theme }}</span>
      <span data-test="resolved">{{ resolvedTheme }}</span>
      <button data-test="set-dark" @click="setTheme('dark')">dark</button>
      <button data-test="toggle" @click="toggleTheme()">toggle</button>
    </div>
  `,
});

describe('VfThemeProvider', () => {
  it('keeps the first client render hydration-stable before applying stored browser state', async () => {
    const HydrationConsumer = defineComponent({
      setup() {
        const { theme, resolvedTheme } = useTheme();
        return () =>
          h('div', [
            h('span', { 'data-test': 'theme' }, theme.value),
            h('span', { 'data-test': 'resolved' }, resolvedTheme.value),
          ]);
      },
    });
    const Root = defineComponent({
      setup() {
        return () => h('div', [h(VfThemeProvider, null, { default: () => h(HydrationConsumer) })]);
      },
    });
    const html = await renderToString(createSSRApp(Root));
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    window.localStorage.setItem('vf-theme', 'dark');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const app = createSSRApp(Root);

    app.mount(container);
    await nextTick();

    expect(warning.mock.calls.flat().join(' ')).not.toContain('Hydration');
    expect(container.querySelector('[data-test="theme"]')?.textContent).toBe('dark');
    expect(container.querySelector('[data-test="resolved"]')?.textContent).toBe('dark');

    app.unmount();
    warning.mockRestore();
    container.remove();
  });

  it('falls back safely when storage and matchMedia are unavailable', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.stubGlobal('matchMedia', undefined);

    let wrapper: ReturnType<typeof mount> | undefined;
    expect(() => {
      wrapper = mount(VfThemeProvider, {
        props: { defaultTheme: 'light' },
        slots: { default: ThemeConsumer },
      });
    }).not.toThrow();

    expect(wrapper?.find('[data-test="resolved"]').text()).toBe('light');
    await expect(wrapper?.find('[data-test="set-dark"]').trigger('click')).resolves.toBeUndefined();

    wrapper?.unmount();
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it('provides the default system theme and persists changes', async () => {
    const wrapper = mount(VfThemeProvider, {
      slots: {
        default: ThemeConsumer,
      },
    });

    expect(wrapper.find('[data-test="theme"]').text()).toBe('system');
    expect(wrapper.find('[data-test="resolved"]').text()).toBe('light');
    expect(document.documentElement.getAttribute('data-vf-theme')).toBe('light');

    await wrapper.find('[data-test="set-dark"]').trigger('click');

    expect(wrapper.find('[data-test="theme"]').text()).toBe('dark');
    expect(wrapper.find('[data-test="resolved"]').text()).toBe('dark');
    expect(window.localStorage.getItem('vf-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-vf-theme')).toBe('dark');
  });

  it('preserves an initial mode declared through the compatible data-theme attribute', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');

    const wrapper = mount(VfThemeProvider, {
      slots: {
        default: ThemeConsumer,
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-test="theme"]').text()).toBe('dark');
    expect(wrapper.find('[data-test="resolved"]').text()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-vf-theme')).toBe('dark');
  });

  it('toggles between resolved light and dark themes', async () => {
    const wrapper = mount(VfThemeProvider, {
      props: {
        defaultTheme: 'light',
      },
      slots: {
        default: ThemeConsumer,
      },
    });

    await wrapper.find('[data-test="toggle"]').trigger('click');
    expect(wrapper.find('[data-test="theme"]').text()).toBe('dark');

    await wrapper.find('[data-test="toggle"]').trigger('click');
    expect(wrapper.find('[data-test="theme"]').text()).toBe('light');
  });

  it('uses plugin theme options for storage key and attribute', async () => {
    const wrapper = mount(VfThemeProvider, {
      global: {
        plugins: [
          [
            VueForgeCore,
            {
              theme: {
                preset: defaultThemePreset,
                options: {
                  attribute: 'data-demo-theme',
                  storageKey: 'vf-demo-theme',
                },
              },
            },
          ],
        ],
      },
      slots: {
        default: ThemeConsumer,
      },
    });

    await wrapper.find('[data-test="set-dark"]').trigger('click');

    expect(window.localStorage.getItem('vf-demo-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-demo-theme')).toBe('dark');
  });

  it('uses plugin theme-mode defaults when provider props are omitted', async () => {
    const wrapper = mount(VfThemeProvider, {
      global: {
        plugins: [
          [
            VueForgeCore,
            {
              defaultTheme: 'dark',
              themeStorageKey: 'vf-shell-theme',
              themeAttribute: 'data-shell-theme',
            },
          ],
        ],
      },
      slots: {
        default: ThemeConsumer,
      },
    });

    expect(wrapper.find('[data-test="theme"]').text()).toBe('dark');
    expect(wrapper.find('[data-test="resolved"]').text()).toBe('dark');
    expect(document.documentElement.getAttribute('data-shell-theme')).toBe('dark');

    await wrapper.find('[data-test="toggle"]').trigger('click');

    expect(window.localStorage.getItem('vf-shell-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-shell-theme')).toBe('light');
  });

  it('lets provider props override plugin theme-mode defaults', async () => {
    const wrapper = mount(VfThemeProvider, {
      props: {
        defaultTheme: 'light',
        storageKey: 'vf-local-theme',
        attribute: 'data-local-theme',
      },
      global: {
        plugins: [
          [
            VueForgeCore,
            {
              defaultTheme: 'dark',
              themeStorageKey: 'vf-plugin-theme',
              themeAttribute: 'data-plugin-theme',
            },
          ],
        ],
      },
      slots: {
        default: ThemeConsumer,
      },
    });

    expect(wrapper.find('[data-test="theme"]').text()).toBe('light');
    expect(document.documentElement.getAttribute('data-local-theme')).toBe('light');

    await wrapper.find('[data-test="set-dark"]').trigger('click');

    expect(window.localStorage.getItem('vf-local-theme')).toBe('dark');
    expect(window.localStorage.getItem('vf-plugin-theme')).toBeNull();
    expect(document.documentElement.getAttribute('data-local-theme')).toBe('dark');
  });

  it('writes the resolved mode to the configured theme root selector', () => {
    const themeRoot = document.createElement('div');
    themeRoot.id = 'theme-root';
    document.body.appendChild(themeRoot);

    const wrapper = mount(VfThemeProvider, {
      attachTo: themeRoot,
      global: {
        plugins: [
          [
            VueForgeCore,
            {
              defaultTheme: 'dark',
              theme: {
                preset: defaultThemePreset,
                options: {
                  rootSelector: '#theme-root',
                  attribute: 'data-engine-theme',
                },
              },
            },
          ],
        ],
      },
      slots: {
        default: ThemeConsumer,
      },
    });

    expect(themeRoot.getAttribute('data-engine-theme')).toBe('dark');
    expect(document.documentElement.hasAttribute('data-engine-theme')).toBe(false);

    wrapper.unmount();
    themeRoot.remove();
  });

  it('applies primitive and semantic overrides on the configured provider root', () => {
    const themeRoot = document.createElement('div');
    themeRoot.id = 'color-token-theme-root';
    document.body.appendChild(themeRoot);

    const wrapper = mount(VfThemeProvider, {
      attachTo: themeRoot,
      global: {
        plugins: [
          [
            VueForgeCore,
            {
              defaultTheme: 'dark',
              theme: {
                extend: {
                  palettePrimary500: '#123456',
                },
                dark: {
                  colorBackgroundCanvas: '#101820',
                },
                options: {
                  rootSelector: '#color-token-theme-root',
                  attribute: 'data-engine-theme',
                },
              },
            },
          ],
        ],
      },
      slots: {
        default: ThemeConsumer,
      },
    });

    expect(themeRoot.getAttribute('data-engine-theme')).toBe('dark');
    expect(themeRoot.getAttribute('data-theme')).toBe('dark');
    expect(themeRoot.getAttribute('data-vf-theme')).toBe('dark');
    expect(getComputedStyle(themeRoot).getPropertyValue('--vf-palette-primary-500')).toBe('#123456');
    expect(getComputedStyle(themeRoot).getPropertyValue('--vf-color-background-canvas')).toBe('#101820');
    expect(document.getElementById('vf-theme-preset')?.textContent).toContain(
      '--vf-color-interactive-primary-background:',
    );

    wrapper.unmount();
    themeRoot.remove();
  });

  it('mirrors a legacy attribute override without disconnecting the generated selector', () => {
    const themeRoot = document.createElement('div');
    themeRoot.id = 'theme-alias-root';
    document.body.appendChild(themeRoot);

    const wrapper = mount(VfThemeProvider, {
      attachTo: themeRoot,
      global: {
        plugins: [
          [
            VueForgeCore,
            {
              defaultTheme: 'dark',
              themeAttribute: 'data-shell-theme',
              theme: {
                preset: defaultThemePreset,
                options: {
                  rootSelector: '#theme-alias-root',
                  attribute: 'data-engine-theme',
                },
              },
            },
          ],
        ],
      },
      slots: {
        default: ThemeConsumer,
      },
    });

    expect(themeRoot.getAttribute('data-shell-theme')).toBe('dark');
    expect(themeRoot.getAttribute('data-engine-theme')).toBe('dark');

    wrapper.unmount();
    themeRoot.remove();
  });

  it('normalizes compatible attributes so provider state and CSS selectors cannot conflict', () => {
    const themeRoot = document.createElement('div');
    themeRoot.id = 'theme-conflict-root';
    themeRoot.setAttribute('data-theme', 'dark');
    themeRoot.setAttribute('data-vf-theme', 'light');
    document.body.appendChild(themeRoot);

    const wrapper = mount(VfThemeProvider, {
      attachTo: themeRoot,
      global: {
        plugins: [
          [
            VueForgeCore,
            {
              themeStorageKey: 'vf-conflict-theme',
              theme: {
                preset: defaultThemePreset,
                options: {
                  rootSelector: '#theme-conflict-root',
                },
              },
            },
          ],
        ],
      },
      slots: {
        default: ThemeConsumer,
      },
    });

    expect(wrapper.find('[data-test="resolved"]').text()).toBe('light');
    expect(themeRoot.getAttribute('data-theme')).toBe('light');
    expect(themeRoot.getAttribute('data-vf-theme')).toBe('light');

    wrapper.unmount();
    themeRoot.remove();
    window.localStorage.removeItem('vf-conflict-theme');
  });

  it('ignores an invalid legacy attribute value when the engine attribute is valid', async () => {
    const themeRoot = document.createElement('div');
    themeRoot.id = 'theme-initial-root';
    themeRoot.setAttribute('data-shell-theme', 'inherit');
    themeRoot.setAttribute('data-engine-theme', 'dark');
    document.body.appendChild(themeRoot);

    const wrapper = mount(VfThemeProvider, {
      attachTo: themeRoot,
      global: {
        plugins: [
          [
            VueForgeCore,
            {
              defaultTheme: 'light',
              themeAttribute: 'data-shell-theme',
              theme: {
                preset: defaultThemePreset,
                options: {
                  rootSelector: '#theme-initial-root',
                  attribute: 'data-engine-theme',
                },
              },
            },
          ],
        ],
      },
      slots: {
        default: ThemeConsumer,
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-test="theme"]').text()).toBe('dark');
    expect(themeRoot.getAttribute('data-shell-theme')).toBe('dark');
    expect(themeRoot.getAttribute('data-engine-theme')).toBe('dark');

    wrapper.unmount();
    themeRoot.remove();
  });

  it('falls back to the document root when the configured theme selector is invalid', () => {
    let wrapper: ReturnType<typeof mount> | undefined;

    expect(() => {
      wrapper = mount(VfThemeProvider, {
        global: {
          plugins: [
            [
              VueForgeCore,
              {
                defaultTheme: 'dark',
                theme: {
                  preset: defaultThemePreset,
                  options: {
                    rootSelector: '[invalid',
                  },
                },
              },
            ],
          ],
        },
        slots: {
          default: ThemeConsumer,
        },
      });
    }).not.toThrow();

    expect(wrapper?.find('[data-test="resolved"]').text()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-vf-theme')).toBe('dark');
    expect(document.getElementById('vf-theme-preset')?.textContent).not.toContain('[invalid');
    wrapper?.unmount();
  });
});
