import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommentVNode, defineComponent, nextTick, ref } from 'vue';
import { VfThemeProvider, useTheme } from '@codemonster-ru/vueforge-core';
import {
  VueForgeLayouts,
  VfAppShell,
  VfAsideArea,
  VfAuthLayout,
  VfContainer,
  VfDocumentLayout,
  VfErrorLayout,
  VfHeaderArea,
  VfSetupLayout,
  VfSidebarArea,
  applyLayoutsThemeConfig,
  createLayoutsPreset,
  defaultLayoutsPreset,
  resolveLayoutsThemeConfig,
  vfBreakpoints,
  useBreakpoint,
  useBreakpointValue,
  useBreakpoints,
} from '../src';

const packageRoot = resolve(__dirname, '..');

afterEach(() => {
  document.body.innerHTML = '';
  document.getElementById('vf-layouts-test-theme')?.remove();
  document.getElementById('vf-layouts-theme-preset')?.remove();
  document.getElementById('vf-theme-preset')?.remove();
  document.documentElement.removeAttribute('style');
});

describe('package exports', () => {
  it('declares css subpath exports for component and token entries', () => {
    const packageJson = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };

    expect(packageJson.exports['./styles.css']).toBeUndefined();
    expect(packageJson.exports['./base.css']).toBe('./dist/base.css');
    expect(packageJson.exports['./app-shell.css']).toBe('./dist/app-shell.css');
    expect(packageJson.exports['./auth-layout.css']).toBe('./dist/auth-layout.css');
    expect(packageJson.exports['./container.css']).toBe('./dist/container.css');
    expect(packageJson.exports['./tokens.css']).toBe('./dist/tokens.css');
    expect(packageJson.exports['./theme.css']).toBe('./dist/theme.css');
  });

  it('keeps generated layout tokens aligned with component css variables', () => {
    const tokensCss = readFileSync(resolve(packageRoot, '.generated/theme/layout-tokens.css'), 'utf8');

    expect(tokensCss).toContain('--vf-layout-shell-sidebar-width: 18rem;');
    expect(tokensCss).toContain('--vf-layout-viewport-height: 100vh;');
    expect(tokensCss).not.toContain('--vf-shell-sidebar-width:');
  });

  it('exports the public layout API', () => {
    expect(VueForgeLayouts).toBeTruthy();
    expect(VfAppShell).toBeTruthy();
    expect(VfDocumentLayout).toBeTruthy();
    expect(VfAuthLayout).toBeTruthy();
    expect(VfErrorLayout).toBeTruthy();
    expect(VfSetupLayout).toBeTruthy();
    expect(VfHeaderArea).toBeTruthy();
    expect(createLayoutsPreset).toBeTypeOf('function');
    expect(useBreakpoints).toBeTypeOf('function');
    expect(useBreakpointValue).toBeTypeOf('function');
  });
});

describe('container', () => {
  it('supports bounded size variants', () => {
    const wrapper = mount(VfContainer, {
      props: {
        size: '2xl',
      },
      slots: {
        default: () => 'Container',
      },
    });

    expect(wrapper.classes()).toContain('vf-container');
    expect(wrapper.classes()).toContain('vf-container--2xl');
  });

  it('supports fluid layout', () => {
    const wrapper = mount(VfContainer, {
      props: {
        fluid: true,
      },
      slots: {
        default: () => 'Container',
      },
    });

    expect(wrapper.classes()).toContain('vf-container--fluid');
  });
});

describe('setup layout', () => {
  it('renders installer structure with optional aside and actions', () => {
    const wrapper = mount(VfSetupLayout, {
      props: {
        title: 'Install Annabel',
        description: 'Configure the CMS environment.',
        asidePosition: 'right',
      },
      slots: {
        default: () => 'Setup form',
        aside: () => 'Requirements',
        toolbar: () => 'Theme',
        actions: () => 'Continue',
      },
    });

    expect(wrapper.classes()).toContain('vf-setup-layout');
    expect(wrapper.classes()).toContain('vf-setup-layout--aside-right');
    expect(wrapper.find('.vf-setup-layout__title').text()).toBe('Install Annabel');
    expect(wrapper.find('.vf-setup-layout__description').text()).toBe('Configure the CMS environment.');
    expect(wrapper.find('.vf-setup-layout__main .vf-setup-layout__header').exists()).toBe(false);
    expect(wrapper.find('.vf-setup-layout__aside').text()).toBe('Requirements');
    expect(wrapper.find('.vf-setup-layout__toolbar').text()).toBe('Theme');
    expect(wrapper.find('.vf-setup-layout__actions').text()).toBe('Continue');
  });

  it('does not reserve an aside row for an empty conditional aside slot', () => {
    const wrapper = mount(VfSetupLayout, {
      props: {
        title: 'Install Annabel',
      },
      slots: {
        default: () => 'Setup form',
        aside: () => [createCommentVNode('v-if', true)],
        actions: () => 'Continue',
      },
    });

    expect(wrapper.classes()).not.toContain('vf-setup-layout--with-aside');
    expect(wrapper.find('.vf-setup-layout__aside').exists()).toBe(false);
    expect(wrapper.find('.vf-setup-layout__actions').text()).toBe('Continue');
  });

  it('updates aside layout when a conditional aside slot becomes empty', async () => {
    const showAside = ref(true);
    const wrapper = mount(VfSetupLayout, {
      props: {
        title: 'Install Annabel',
      },
      slots: {
        default: () => 'Setup form',
        aside: () => (showAside.value ? 'Requirements' : [createCommentVNode('v-if', true)]),
        actions: () => 'Continue',
      },
    });

    expect(wrapper.classes()).toContain('vf-setup-layout--with-aside');
    expect(wrapper.find('.vf-setup-layout__aside').exists()).toBe(true);

    showAside.value = false;
    await nextTick();

    expect(wrapper.classes()).not.toContain('vf-setup-layout--with-aside');
    expect(wrapper.find('.vf-setup-layout__aside').exists()).toBe(false);
  });

  it('pins actions to the panel bottom only when aside layout is inactive', () => {
    const setupLayoutCss = readFileSync(resolve(packageRoot, 'src/style-entries/setup-layout.css'), 'utf8');

    expect(setupLayoutCss).toContain('.vf-setup-layout:not(.vf-setup-layout--with-aside) .vf-setup-layout__main');
    expect(setupLayoutCss).toContain('align-self: stretch;');
    expect(setupLayoutCss).toContain('.vf-setup-layout:not(.vf-setup-layout--with-aside) .vf-setup-layout__actions');
    expect(setupLayoutCss).toContain('margin-block-start: auto;');
  });
});

describe('layout theme runtime', () => {
  it('creates a layout preset', () => {
    const preset = createLayoutsPreset({
      name: 'docs',
      tokens: {
        ...defaultLayoutsPreset.tokens,
        shellSidebarWidth: 'var(--vf-breakpoint-xs)',
      },
    });

    expect(preset.name).toBe('docs');
    expect(preset.tokens.shellSidebarWidth).toBe('var(--vf-breakpoint-xs)');
  });

  it('applies layout tokens as css variables', () => {
    const style = applyLayoutsThemeConfig(
      resolveLayoutsThemeConfig({
        preset: {
          name: 'docs',
          tokens: defaultLayoutsPreset.tokens,
        },
        light: {
          shellSidebarWidth: 'var(--vf-breakpoint-xs)',
          headerBackground: 'var(--vf-color-surface)',
        },
        dark: {
          shellSidebarWidth: 'calc(var(--vf-breakpoint-xs) * 0.9)',
          headerBackground: 'var(--vf-color-surface)',
        },
        options: {
          styleId: 'vf-layouts-test-theme',
        },
      }),
    );

    expect(style.id).toBe('vf-layouts-test-theme');
    expect(style.textContent).toContain('--vf-layout-shell-sidebar-width: var(--vf-breakpoint-xs);');
    expect(style.textContent).toContain('--vf-layout-shell-sidebar-width: calc(var(--vf-breakpoint-xs) * 0.9);');
    expect(style.textContent).toContain('--vf-layout-header-background: var(--vf-color-surface);');
    expect(style.textContent).toContain(
      '--vf-layout-content-subheader-background: var(--vf-layout-header-background);',
    );
    expect(style.textContent).toContain('--vf-layout-content-subheader-border: var(--vf-layout-header-border);');
    expect(style.textContent).toContain('--vf-layout-viewport-height: 100vh;');
    expect(style.textContent).toContain('--vf-layout-document-layout-edge-notch-width: 7px;');
    expect(style.textContent).toContain('--vf-layout-app-shell-header-sticky-z-index: 20;');
    expect(style.textContent).toContain('--vf-layout-auth-layout-panel-width: 28rem;');
    expect(style.textContent).toContain(
      '--vf-layout-auth-layout-padding-block: var(--vf-layout-content-padding-block);',
    );
    expect(style.textContent).toContain(
      '--vf-layout-auth-layout-panel-padding-compact: var(--vf-layout-space-layout-roomy);',
    );
    expect(style.textContent).toContain('--vf-layout-auth-layout-description-color: var(--vf-color-muted);');
    expect(style.textContent).toContain('--vf-layout-error-layout-code-font-size: clamp(2.25rem, 8vw, 5.5rem);');
    expect(style.textContent).toContain('--vf-layout-error-layout-description-color: var(--vf-color-muted);');
    expect(style.textContent).toContain(
      '--vf-layout-setup-layout-padding-block: var(--vf-layout-content-padding-block);',
    );
    expect(style.textContent).toContain('--vf-layout-setup-layout-container-width: var(--vf-breakpoint-lg);');
    expect(style.textContent).toContain('--vf-layout-setup-layout-aside-width: 16rem;');
    expect(style.textContent).toContain(
      '--vf-layout-setup-layout-panel-padding: var(--vf-layout-auth-layout-panel-padding);',
    );
    expect(style.textContent).toContain('--vf-layout-setup-layout-main-gap: var(--vf-layout-space-layout-roomy);');
    expect(style.textContent).toContain('--vf-layout-setup-layout-header-gap: 0.5rem;');
    expect(style.textContent).toContain(
      '--vf-layout-setup-layout-title-line-height: var(--vf-heading-h-4-line-height);',
    );
    expect(style.textContent).toContain('--vf-layout-setup-layout-description-color: var(--vf-color-muted);');
    expect(style.textContent).toContain('--vf-layout-setup-layout-description-line-height: 1.5;');
    expect(style.textContent).toContain('--vf-layout-setup-layout-divider-width: 1px;');
    expect(style.textContent).toContain(
      '--vf-layout-setup-layout-divider-color: color-mix(in srgb, var(--vf-color-border) 70%, transparent);',
    );
  });

  it('applies theme config through the layouts plugin', () => {
    const Probe = defineComponent({
      template: `<div>probe</div>`,
    });

    mount(Probe, {
      global: {
        plugins: [
          [
            VueForgeLayouts,
            {
              theme: {
                preset: defaultLayoutsPreset,
                extend: {
                  shellSidebarWidth: '21rem',
                },
              },
            },
          ],
        ],
      },
    });

    const style = document.getElementById('vf-layouts-theme-preset');

    expect(style).not.toBeNull();
    expect(style?.textContent).toContain('--vf-layout-shell-sidebar-width: 21rem;');
  });

  it('applies both core and layout theme config through the layouts plugin', () => {
    const Probe = defineComponent({
      template: `<div>probe</div>`,
    });

    mount(Probe, {
      global: {
        plugins: [
          [
            VueForgeLayouts,
            {
              theme: {
                core: {
                  extend: {
                    colorPrimary: 'color-mix(in srgb, var(--vf-color-info) 80%, var(--vf-color-text))',
                  },
                },
                layouts: {
                  extend: {
                    shellSidebarWidth: 'var(--vf-breakpoint-xs)',
                  },
                },
              },
            },
          ],
        ],
      },
    });

    const coreStyle = document.getElementById('vf-theme-preset');
    const layoutsStyle = document.getElementById('vf-layouts-theme-preset');

    expect(coreStyle).not.toBeNull();
    expect(layoutsStyle).not.toBeNull();
    expect(document.querySelectorAll('#vf-theme-preset')).toHaveLength(1);
    expect(document.querySelectorAll('#vf-layouts-theme-preset')).toHaveLength(1);
    expect(coreStyle?.textContent).toContain(
      '--vf-color-primary: color-mix(in srgb, var(--vf-color-info) 80%, var(--vf-color-text));',
    );
    expect(coreStyle?.textContent).not.toContain('--vf-layout-shell-sidebar-width:');
    expect(layoutsStyle?.textContent).toContain('--vf-layout-shell-sidebar-width: var(--vf-breakpoint-xs);');
    expect(layoutsStyle?.textContent).not.toContain('--vf-color-primary:');
  });

  it('forwards theme mode defaults to VfThemeProvider through the layouts plugin', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const ThemeProbeContent = defineComponent({
      setup() {
        const { theme, resolvedTheme } = useTheme();

        return {
          theme,
          resolvedTheme,
        };
      },
      template: `
        <div data-test="theme">{{ theme }}</div>
        <div data-test="resolved">{{ resolvedTheme }}</div>
      `,
    });

    const Probe = defineComponent({
      components: {
        VfThemeProvider,
        ThemeProbeContent,
      },
      template: `
        <VfThemeProvider>
          <ThemeProbeContent />
        </VfThemeProvider>
      `,
    });

    const wrapper = mount(Probe, {
      global: {
        plugins: [
          [
            VueForgeLayouts,
            {
              defaultTheme: 'dark',
              themeStorageKey: 'vf-layouts-theme',
              themeAttribute: 'data-test-theme',
            },
          ],
        ],
      },
    });

    await nextTick();

    expect(wrapper.get('[data-test="theme"]').text()).toBe('dark');
    expect(wrapper.get('[data-test="resolved"]').text()).toBe('dark');
    expect(document.documentElement.getAttribute('data-test-theme')).toBe('dark');
  });
});

describe('shell behavior', () => {
  it('supports controlled sidebar collapsed state', async () => {
    const wrapper = mount(VfAppShell, {
      props: {
        sidebarCollapsed: true,
      },
      slots: {
        default: () => 'Shell',
      },
    });

    expect(wrapper.classes()).toContain('vf-app-shell--sidebar-collapsed');

    await wrapper.setProps({
      sidebarCollapsed: false,
    });

    expect(wrapper.classes()).not.toContain('vf-app-shell--sidebar-collapsed');
  });

  it('supports shell-level sticky header control', () => {
    const wrapper = mount(VfAppShell, {
      props: {
        stickyHeader: false,
      },
      slots: {
        default: () => 'Shell',
      },
    });

    expect(wrapper.classes()).toContain('vf-app-shell--header-static');
  });

  it('supports fill viewport control for app shell', () => {
    const wrapper = mount(VfAppShell, {
      props: {
        fillViewport: true,
      },
      slots: {
        default: () => 'Shell',
      },
    });

    expect(wrapper.classes()).toContain('vf-app-shell--fill-viewport');
  });

  it('supports sticky sidebar and aside control', () => {
    const wrapper = mount(VfAppShell, {
      props: {
        stickySidebar: true,
        stickyAside: true,
      },
      slots: {
        default: () => 'Shell',
      },
    });

    expect(wrapper.classes()).toContain('vf-app-shell--sidebar-sticky');
    expect(wrapper.classes()).toContain('vf-app-shell--aside-sticky');
  });

  it('supports structured slots mode for app shell', () => {
    const wrapper = mount(VfAppShell, {
      props: {
        layout: 'sidebar-content-aside',
      },
      slots: {
        header: () => 'Header',
        subheader: () => 'Subheader',
        'content-subheader': () => 'Content subheader',
        sidebar: () => 'Sidebar',
        default: () => 'Content',
        aside: () => 'Aside',
        footer: () => 'Footer',
      },
    });

    expect(wrapper.find('.vf-header-area').exists()).toBe(true);
    expect(wrapper.find('.vf-subheader-area').exists()).toBe(true);
    expect(wrapper.find('.vf-content-subheader-area').exists()).toBe(true);
    expect(wrapper.find('.vf-sidebar-area').exists()).toBe(true);
    expect(wrapper.find('.vf-content-area').exists()).toBe(true);
    expect(wrapper.find('.vf-aside-area').exists()).toBe(true);
    expect(wrapper.find('.vf-footer-area').exists()).toBe(true);
  });

  it('updates sidebar and aside slot presence when parent toggles layout', async () => {
    const Host = defineComponent({
      components: { VfAppShell },
      data() {
        return {
          layout: 'content' as 'content' | 'sidebar-content' | 'sidebar-content-aside',
        };
      },
      template: `
        <VfAppShell :layout="layout">
          <template v-if="layout !== 'content'" #sidebar>Sidebar</template>
          <template v-if="layout === 'sidebar-content-aside'" #aside>Aside</template>
          <template #default>Content</template>
        </VfAppShell>
      `,
    });

    const wrapper = mount(Host);

    expect(wrapper.find('.vf-sidebar-area').exists()).toBe(false);
    expect(wrapper.find('.vf-aside-area').exists()).toBe(false);

    wrapper.vm.layout = 'sidebar-content';
    await nextTick();

    expect(wrapper.find('.vf-sidebar-area').exists()).toBe(true);
    expect(wrapper.find('.vf-aside-area').exists()).toBe(false);

    wrapper.vm.layout = 'sidebar-content-aside';
    await nextTick();

    expect(wrapper.find('.vf-sidebar-area').exists()).toBe(true);
    expect(wrapper.find('.vf-aside-area').exists()).toBe(true);
  });

  it('allows hiding app shell subheaders with props', () => {
    const wrapper = mount(VfAppShell, {
      props: {
        showSubheader: false,
        showContentSubheader: false,
      },
      slots: {
        header: () => 'Header',
        subheader: () => 'Subheader',
        'content-subheader': () => 'Content subheader',
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.vf-subheader-area').exists()).toBe(false);
    expect(wrapper.find('.vf-content-subheader-area').exists()).toBe(false);
  });
});

describe('document layout', () => {
  it('wraps the document layout in a shared container boundary', () => {
    const wrapper = mount(VfDocumentLayout, {
      slots: {
        header: () => 'Header',
        default: () => 'Content',
        footer: () => 'Footer',
      },
    });

    expect(wrapper.find('.vf-document-layout').exists()).toBe(true);
    expect(wrapper.find('.vf-document-layout__container').exists()).toBe(true);
    expect(wrapper.findAll('.vf-container')).toHaveLength(1);
  });

  it('supports sidebar and aside column layouts', () => {
    const wrapper = mount(VfDocumentLayout, {
      props: {
        layout: 'sidebar-content-aside',
      },
      slots: {
        header: () => 'Header',
        sidebar: () => 'Sidebar',
        default: () => 'Content',
        aside: () => 'Aside',
        footer: () => 'Footer',
      },
    });

    expect(wrapper.find('.vf-document-layout').classes()).toContain('vf-document-layout--sidebar-content-aside');
    expect(
      wrapper
        .find('.vf-document-layout__content-grid')
        .classes()
        .includes('vf-document-layout__content-grid--sidebar-content-aside'),
    ).toBe(true);
    expect(wrapper.find('.vf-document-layout__sidebar').exists()).toBe(true);
    expect(wrapper.find('.vf-document-layout__aside').exists()).toBe(true);
  });

  it('updates sidebar and aside slot presence when parent toggles layout', async () => {
    const Host = defineComponent({
      components: { VfDocumentLayout },
      data() {
        return {
          layout: 'content' as 'content' | 'sidebar-content' | 'sidebar-content-aside',
        };
      },
      template: `
        <VfDocumentLayout :layout="layout">
          <template v-if="layout !== 'content'" #sidebar>Sidebar</template>
          <template v-if="layout === 'sidebar-content-aside'" #aside>Aside</template>
          <template #default>Content</template>
        </VfDocumentLayout>
      `,
    });

    const wrapper = mount(Host);

    expect(wrapper.find('.vf-document-layout__sidebar').exists()).toBe(false);
    expect(wrapper.find('.vf-document-layout__aside').exists()).toBe(false);

    wrapper.vm.layout = 'sidebar-content';
    await nextTick();

    expect(wrapper.find('.vf-document-layout__sidebar').exists()).toBe(true);
    expect(wrapper.find('.vf-document-layout__aside').exists()).toBe(false);

    wrapper.vm.layout = 'sidebar-content-aside';
    await nextTick();

    expect(wrapper.find('.vf-document-layout__sidebar').exists()).toBe(true);
    expect(wrapper.find('.vf-document-layout__aside').exists()).toBe(true);
  });

  it('supports sticky header control for document layout', () => {
    const wrapper = mount(VfDocumentLayout, {
      props: {
        stickyHeader: true,
      },
      slots: {
        header: () => 'Header',
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.vf-document-layout').classes()).toContain('vf-document-layout--header-sticky');
  });

  it('renders optional subheader slot in document layout', () => {
    const wrapper = mount(VfDocumentLayout, {
      props: {
        showSubheader: true,
      },
      slots: {
        header: () => 'Header',
        subheader: () => 'Subheader',
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.vf-document-layout__subheader').exists()).toBe(true);
  });

  it('allows hiding document layout subheader with showSubheader', () => {
    const wrapper = mount(VfDocumentLayout, {
      props: {
        showSubheader: false,
      },
      slots: {
        header: () => 'Header',
        subheader: () => 'Subheader',
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.vf-document-layout__subheader').exists()).toBe(false);
  });

  it('renders optional content subheader slot in document layout', () => {
    const wrapper = mount(VfDocumentLayout, {
      props: {
        showContentSubheader: true,
      },
      slots: {
        header: () => 'Header',
        'content-subheader': () => 'Content subheader',
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.vf-document-layout__content-subheader').exists()).toBe(true);
  });

  it('allows hiding document layout content subheader with showContentSubheader', () => {
    const wrapper = mount(VfDocumentLayout, {
      props: {
        showContentSubheader: false,
      },
      slots: {
        header: () => 'Header',
        'content-subheader': () => 'Content subheader',
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.vf-document-layout__content-subheader').exists()).toBe(false);
  });

  it('supports fill viewport control for document layout', () => {
    const wrapper = mount(VfDocumentLayout, {
      props: {
        fillViewport: true,
      },
      slots: {
        default: () => 'Content',
      },
    });

    expect(wrapper.find('.vf-document-layout').classes()).toContain('vf-document-layout--fill-viewport');
  });

  it('supports optional edge notches for document layout', () => {
    const wrapper = mount(VfDocumentLayout, {
      props: {
        edgeNotches: true,
      },
      slots: {
        header: () => 'Header',
        default: () => 'Content',
        footer: () => 'Footer',
      },
    });

    expect(wrapper.find('.vf-document-layout').classes()).toContain('vf-document-layout--edge-notches');
    expect(wrapper.find('.vf-document-layout__header').exists()).toBe(true);
    expect(wrapper.find('.vf-document-layout__footer').exists()).toBe(true);
  });

  it('supports sticky sidebar and aside control for document layout', () => {
    const wrapper = mount(VfDocumentLayout, {
      props: {
        layout: 'sidebar-content-aside',
        stickySidebar: true,
        stickyAside: true,
      },
      slots: {
        sidebar: () => 'Sidebar',
        default: () => 'Content',
        aside: () => 'Aside',
      },
    });

    expect(wrapper.find('.vf-document-layout').classes()).toContain('vf-document-layout--sidebar-sticky');
    expect(wrapper.find('.vf-document-layout').classes()).toContain('vf-document-layout--aside-sticky');
  });
});

describe('auth layout', () => {
  it('renders auth page structure from props', () => {
    const wrapper = mount(VfAuthLayout, {
      props: {
        title: 'Sign in',
        description: 'Use your account to continue.',
      },
      slots: {
        default: () => 'Form',
      },
    });

    expect(wrapper.element.tagName).toBe('MAIN');
    expect(wrapper.classes()).toContain('vf-auth-layout');
    expect(wrapper.classes()).toContain('vf-auth-layout--fill-viewport');
    expect(wrapper.classes()).toContain('vf-auth-layout--centered');
    expect(wrapper.find('.vf-auth-layout__panel').classes()).toContain('vf-auth-layout__panel--surface');
    expect(wrapper.find('.vf-auth-layout__title').text()).toBe('Sign in');
    expect(wrapper.find('.vf-auth-layout__description').text()).toBe('Use your account to continue.');
    expect(wrapper.find('.vf-auth-layout__body').text()).toBe('Form');
  });

  it('supports slot overrides and optional layout flags', () => {
    const wrapper = mount(VfAuthLayout, {
      props: {
        as: 'section',
        fillViewport: false,
        centered: false,
        surface: false,
      },
      slots: {
        brand: () => 'Brand',
        title: () => 'Create account',
        description: () => 'Start your workspace.',
        default: () => 'Registration form',
        footer: () => 'Already have an account?',
      },
    });

    expect(wrapper.element.tagName).toBe('SECTION');
    expect(wrapper.classes()).not.toContain('vf-auth-layout--fill-viewport');
    expect(wrapper.classes()).not.toContain('vf-auth-layout--centered');
    expect(wrapper.find('.vf-auth-layout__panel').classes()).not.toContain('vf-auth-layout__panel--surface');
    expect(wrapper.find('.vf-auth-layout__brand').text()).toBe('Brand');
    expect(wrapper.find('.vf-auth-layout__title').text()).toBe('Create account');
    expect(wrapper.find('.vf-auth-layout__description').text()).toBe('Start your workspace.');
    expect(wrapper.find('.vf-auth-layout__body').text()).toBe('Registration form');
    expect(wrapper.find('.vf-auth-layout__footer').text()).toBe('Already have an account?');
  });
});

describe('error layout', () => {
  it('renders semantic error copy from props', () => {
    const wrapper = mount(VfErrorLayout, {
      props: {
        code: '404',
        title: 'Page not found',
        description: 'The page you are looking for does not exist.',
      },
    });

    expect(wrapper.classes()).toContain('vf-error-layout');
    expect(wrapper.classes()).toContain('vf-error-layout--fill-viewport');
    expect(wrapper.classes()).toContain('vf-error-layout--centered');
    expect(wrapper.find('.vf-error-layout__code').text()).toBe('404');
    expect(wrapper.find('.vf-error-layout__title').text()).toBe('Page not found');
    expect(wrapper.find('.vf-error-layout__description').text()).toBe('The page you are looking for does not exist.');
    expect(wrapper.find('.vf-error-layout__panel').classes()).toContain('vf-error-layout__panel--surface');
  });

  it('supports slot overrides and optional layout flags', () => {
    const wrapper = mount(VfErrorLayout, {
      props: {
        fillViewport: false,
        centered: false,
        surface: false,
      },
      slots: {
        code: () => '500',
        title: () => 'Unexpected error',
        description: () => 'Try again later.',
        actions: () => 'Retry',
      },
    });

    expect(wrapper.classes()).not.toContain('vf-error-layout--fill-viewport');
    expect(wrapper.classes()).not.toContain('vf-error-layout--centered');
    expect(wrapper.find('.vf-error-layout__panel').classes()).not.toContain('vf-error-layout__panel--surface');
    expect(wrapper.find('.vf-error-layout__code').text()).toBe('500');
    expect(wrapper.find('.vf-error-layout__title').text()).toBe('Unexpected error');
    expect(wrapper.find('.vf-error-layout__description').text()).toBe('Try again later.');
    expect(wrapper.find('.vf-error-layout__actions').text()).toBe('Retry');
  });
});

describe('composables', () => {
  it('returns named breakpoint matches', async () => {
    const viewportWidth = 800;

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: (() => {
          const match = query.match(/min-width:\s*([0-9.]+)px/);
          if (!match) return false;
          return viewportWidth >= Number(match[1]);
        })(),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    const Probe = defineComponent({
      setup() {
        const breakpoints = useBreakpoints();
        return { breakpoints };
      },
      template: `
        <div>
          <span class="xs">{{ breakpoints.xs }}</span>
          <span class="sm">{{ breakpoints.sm }}</span>
          <span class="md">{{ breakpoints.md }}</span>
          <span class="lg">{{ breakpoints.lg }}</span>
        </div>
      `,
    });

    const wrapper = mount(Probe);
    await nextTick();

    expect(wrapper.get('.xs').text()).toBe('true');
    expect(wrapper.get('.sm').text()).toBe('true');
    expect(wrapper.get('.md').text()).toBe('true');
    expect(wrapper.get('.lg').text()).toBe('false');
  });

  it('resolves responsive values with fallback', async () => {
    const viewportWidth = 1024;

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: (() => {
          const match = query.match(/min-width:\s*([0-9.]+)px/);
          if (!match) return false;
          return viewportWidth >= Number(match[1]);
        })(),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    const Probe = defineComponent({
      setup() {
        const value = useBreakpointValue({
          base: 1,
          md: 2,
        });

        return { value };
      },
      template: `<div>{{ value }}</div>`,
    });

    const wrapper = mount(Probe);
    await nextTick();
    expect(wrapper.text()).toBe('2');
  });

  it('returns false when the named breakpoint does not match', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes(`${vfBreakpoints.lg}`),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    const Probe = defineComponent({
      setup() {
        const matches = useBreakpoint('md');
        return { matches };
      },
      template: `<div>{{ matches }}</div>`,
    });

    const wrapper = mount(Probe);
    expect(wrapper.text()).toBe('false');
  });
});

describe('area overrides', () => {
  it('lets the header opt out of sticky positioning', () => {
    const wrapper = mount(VfHeaderArea, {
      props: {
        sticky: false,
      },
      slots: {
        default: () => 'Header',
      },
    });

    expect(wrapper.classes()).not.toContain('vf-header-area--sticky');
  });

  it('supports plain sidebar appearance', () => {
    const wrapper = mount(VfSidebarArea, {
      props: {
        appearance: 'plain',
      },
      slots: {
        default: () => 'Sidebar',
      },
    });

    expect(wrapper.classes()).toContain('vf-sidebar-area--plain');
  });

  it('supports plain aside appearance', () => {
    const wrapper = mount(VfAsideArea, {
      props: {
        appearance: 'plain',
      },
      slots: {
        default: () => 'Aside',
      },
    });

    expect(wrapper.classes()).toContain('vf-aside-area--plain');
  });
});
