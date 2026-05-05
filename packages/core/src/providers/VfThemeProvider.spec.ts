import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
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
});
