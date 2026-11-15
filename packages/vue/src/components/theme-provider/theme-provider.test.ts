import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, defineComponent, h, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CmThemeSwitch from '../theme-switch/CmThemeSwitch.vue';
import VfThemeSwitch from '../theme-switch/VfThemeSwitch.vue';
import CmThemeProvider from './CmThemeProvider.vue';
import { useCmTheme } from './use-theme';

const Consumer = defineComponent({
  setup() {
    const { theme, resolvedTheme, toggleTheme } = useCmTheme();
    return () => h('button', { onClick: toggleTheme }, `${theme.value}:${resolvedTheme.value}`);
  },
});

function systemPreference() {
  let matches = false;
  const media = {
    get matches() {
      return matches;
    },
    addEventListener: vi.fn<(type: string, callback: () => void) => void>(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', () => media);
  return {
    media,
    setDark: (dark: boolean) => {
      matches = dark;
      media.addEventListener.mock.calls[0]?.[1]();
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-cm-theme');
  document.documentElement.removeAttribute('data-test-theme');
  document.cookie = 'cm-theme=; Path=/; Max-Age=0';
  localStorage.removeItem('test-theme');
});

describe('CmThemeProvider', () => {
  it('renders the supplied preference on the server without writing to the document', async () => {
    const app = createSSRApp({
      render: () => h(CmThemeProvider, { defaultTheme: 'dark' }, { default: () => h(Consumer) }),
    });
    expect(await renderToString(app)).toContain('dark:dark');
    expect(document.documentElement.hasAttribute('data-cm-theme')).toBe(false);
  });

  it('resolves system mode without changing the authored preference and removes the listener', async () => {
    const { media, setDark } = systemPreference();
    const wrapper = mount(CmThemeProvider, {
      props: { attribute: 'data-test-theme' },
      slots: { default: Consumer },
    });

    setDark(true);
    await nextTick();
    expect(wrapper.text()).toBe('system:dark');
    expect(document.documentElement.dataset.cmTheme).toBe('system');
    expect(document.documentElement.dataset.testTheme).toBe('dark');

    await wrapper.get('button').trigger('click');
    expect(wrapper.text()).toBe('light:light');
    expect(document.cookie).toContain('cm-theme=light');
    wrapper.unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', media.addEventListener.mock.calls[0]?.[1]);
  });

  it('shares the current preference with an uncontrolled theme switch', async () => {
    systemPreference();
    document.cookie = 'cm-theme=dark; Path=/';
    const wrapper = mount(CmThemeProvider, {
      slots: { default: () => [h(Consumer), h(CmThemeSwitch)] },
    });

    await nextTick();
    expect(wrapper.text()).toContain('dark:dark');
    expect(wrapper.get<HTMLInputElement>('input[value=dark]').element.checked).toBe(true);
    await wrapper.get('input[value=system]').setValue(true);
    expect(wrapper.text()).toContain('system:light');
    expect(document.cookie).toContain('cm-theme=system');
    wrapper.unmount();
  });

  it('handles stored and cross-tab preferences without restoring a removed key', async () => {
    systemPreference();
    localStorage.setItem('test-theme', 'dark');
    const wrapper = mount(CmThemeProvider, {
      props: { storageKey: 'test-theme', defaultTheme: 'light' },
      slots: { default: Consumer },
    });

    await nextTick();
    expect(wrapper.text()).toBe('dark:dark');
    localStorage.removeItem('test-theme');
    window.dispatchEvent(new StorageEvent('storage', { key: 'test-theme' }));
    await nextTick();
    expect(wrapper.text()).toBe('light:light');
    expect(localStorage.getItem('test-theme')).toBeNull();
    wrapper.unmount();
  });

  it('supports the historical button and static switch variants with a shared theme', async () => {
    systemPreference();
    const wrapper = mount(CmThemeProvider, {
      slots: {
        default: () => [
          h(VfThemeSwitch, { variant: 'button', label: 'Theme', buttonVariant: 'ghost' }),
          h(VfThemeSwitch, { static: true, thumbContrast: 'inverse' }),
        ],
      },
    });
    expect(wrapper.get('button').attributes('aria-label')).toBe('Switch to dark theme');
    expect(wrapper.get('button').classes()).toContain('cm-button--ghost');
    await wrapper.get('button').trigger('click');
    expect(wrapper.get('button').attributes('aria-label')).toBe('Switch to light theme');
    expect(wrapper.get('label').classes()).toContain('cm-switch--thumb-contrast-inverse');
    expect(wrapper.get('label').classes()).toContain('cm-switch--static');
    expect(wrapper.get('input').attributes('aria-checked')).toBe('true');
    await wrapper.get('input').setValue(false);
    expect(document.documentElement.dataset.cmTheme).toBe('light');
    wrapper.unmount();
  });
});
