/* eslint-disable vue/one-component-per-file -- The harness renders a provider and its consumers together. */
import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, defineComponent, h, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VfThemeProvider, useTheme } from '../../index';
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
  document.documentElement.removeAttribute('data-vf-theme');
  document.cookie = 'cm-theme=; Path=/; Max-Age=0';
  localStorage.removeItem('test-theme');
  localStorage.removeItem('vf-theme');
});

describe('VfThemeProvider', () => {
  it('hydrates before restoring the legacy preference and shares state with modern consumers', async () => {
    systemPreference();
    const LegacyConsumer = defineComponent({
      setup() {
        const { theme, resolvedTheme } = useTheme();
        return () => h('output', `${theme.value}:${resolvedTheme.value}`);
      },
    });
    const root = defineComponent({
      render: () =>
        h(VfThemeProvider, { defaultTheme: 'light' }, { default: () => [h(LegacyConsumer), h(CmThemeSwitch)] }),
    });
    document.cookie = 'cm-theme=system; Path=/';
    localStorage.setItem('vf-theme', 'dark');
    const html = await renderToString(createSSRApp(root));
    expect(html).toContain('light:light');
    expect(document.documentElement.hasAttribute('data-vf-theme')).toBe(false);

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = createSSRApp(root);
    try {
      app.mount(container);
      await nextTick();
      expect(warn).not.toHaveBeenCalled();
      expect(container.querySelector('output')?.textContent).toBe('dark:dark');
      const light = container.querySelector<HTMLInputElement>('input[value="light"]');
      if (!light) throw new Error('Theme switch omitted its light mode');
      expect(light.checked).toBe(false);
      light.click();
      await nextTick();
      expect(container.querySelector('output')?.textContent).toBe('light:light');
      expect(localStorage.getItem('vf-theme')).toBe('light');
      expect(document.cookie).toContain('cm-theme=system');
    } finally {
      app.unmount();
      warn.mockRestore();
      container.remove();
    }
  });

  it('reads an authored legacy theme and reflects system changes to both resolved attributes', async () => {
    const { media, setDark } = systemPreference();
    document.documentElement.setAttribute('data-cm-theme', 'invalid');
    document.documentElement.setAttribute('data-vf-theme', 'dark');
    const wrapper = mount(VfThemeProvider, {
      props: { storageKey: 'test-theme', attribute: 'data-test-theme' },
      slots: { default: () => [h(Consumer), h(CmThemeSwitch)] },
    });
    await nextTick();
    expect(wrapper.get('button').text()).toBe('dark:dark');
    expect(document.documentElement.dataset.testTheme).toBe('dark');

    await wrapper.get('input[value=system]').setValue(true);
    expect(localStorage.getItem('test-theme')).toBe('system');
    expect(localStorage.getItem('vf-theme')).toBeNull();
    expect(document.documentElement.dataset.testTheme).toBe('light');

    setDark(true);
    await nextTick();
    expect(wrapper.get('button').text()).toBe('system:dark');
    expect(document.documentElement.dataset.cmTheme).toBe('system');
    expect(document.documentElement.dataset.vfTheme).toBe('dark');
    expect(document.documentElement.dataset.testTheme).toBe('dark');
    expect(localStorage.getItem('test-theme')).toBe('system');
    wrapper.unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', media.addEventListener.mock.calls[0]?.[1]);
  });

  it('keeps the controls usable when storage and media queries throw', async () => {
    const blocked = new Error('Unavailable');
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw blocked;
    });
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw blocked;
    });
    vi.stubGlobal('matchMedia', () => {
      throw blocked;
    });
    const wrapper = mount(VfThemeProvider, { slots: { default: Consumer } });
    try {
      expect(wrapper.text()).toBe('system:light');
      await wrapper.get('button').trigger('click');
      expect(wrapper.text()).toBe('dark:dark');
      expect(document.documentElement.dataset.vfTheme).toBe('dark');
    } finally {
      wrapper.unmount();
      read.mockRestore();
      write.mockRestore();
    }
  });
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
