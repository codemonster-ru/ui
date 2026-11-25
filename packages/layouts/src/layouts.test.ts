import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { Fragment, createCommentVNode, h, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import CmAdminLayout from './admin-layout/CmAdminLayout.vue';
import type { CmAdminLayoutMobileSidebarScope, CmAdminLayoutScope } from './admin-layout/admin-layout.types';
import CmAdminShell from './admin-shell/CmAdminShell.vue';
import CmAppShell from './app-shell/CmAppShell.vue';
import type { CmAppShellExposed, CmAppShellScope } from './app-shell/app-shell.types';
import CmDocumentLayout from './document-layout/CmDocumentLayout.vue';
import CmSetupLayout from './setup-layout/CmSetupLayout.vue';

describe('Vue layouts', () => {
  it('lets scoped AppShell slots and exposed controls share uncontrolled sidebar state', async () => {
    const wrapper = mount(CmAppShell, {
      props: { as: 'article', defaultSidebarCollapsed: true },
      slots: {
        default: ({ expandSidebar }: CmAppShellScope) => h('button', { onClick: expandSidebar }, 'Expand'),
        sidebar: ({ isSidebarCollapsed }: CmAppShellScope) => (isSidebarCollapsed ? 'Compact' : 'Expanded'),
        'content-subheader': 'Tools',
      },
    });

    expect((wrapper.element as HTMLElement).tagName).toBe('ARTICLE');
    expect(wrapper.get('aside').text()).toBe('Compact');
    expect(wrapper.get('.cm-app-shell__content-subheader').text()).toBe('Tools');
    await wrapper.get('button').trigger('click');
    expect(wrapper.get('aside').text()).toBe('Expanded');
    expect(wrapper.emitted('update:sidebarCollapsed')).toEqual([[false]]);

    (wrapper.vm as CmAppShellExposed).collapseSidebar();
    await nextTick();
    expect(wrapper.attributes('data-cm-sidebar-collapsed')).toBe('true');
    expect(wrapper.emitted('sidebarCollapsedChange')).toEqual([[false], [true]]);
  });

  it('lets the bound AppShell prop control state even when the parent rejects a change', async () => {
    const wrapper = mount(CmAppShell, { props: { sidebarCollapsed: false } });
    (wrapper.vm as CmAppShellExposed).collapseSidebar();
    await nextTick();
    expect(wrapper.emitted('update:sidebarCollapsed')).toEqual([[true]]);
    expect(wrapper.attributes('data-cm-sidebar-collapsed')).toBe('false');
    await wrapper.setProps({ sidebarCollapsed: true });
    expect(wrapper.attributes('data-cm-sidebar-collapsed')).toBe('true');
  });

  it('publishes a stable ID, mobile toggle attributes, and scoped commands through AdminLayout', async () => {
    const wrapper = mount(CmAdminLayout, {
      attachTo: document.body,
      props: { defaultSidebarCollapsed: true },
      slots: {
        aside: ({ isSidebarCompact }: CmAdminLayoutScope) => h('button', isSidebarCompact ? 'Compact' : 'Expanded'),
        'mobile-brand': 'Acme',
        'mobile-toggle': ({ mobileToggleAttrs, toggleMobileSidebar }: CmAdminLayoutMobileSidebarScope) =>
          h('div', [
            h('button', 'Unrelated'),
            h('button', { ...mobileToggleAttrs, onClick: toggleMobileSidebar }, 'Menu'),
          ]),
      },
    });

    try {
      const aside = wrapper.get('aside');
      const toggle = wrapper.get('.cm-admin-layout__mobile-toggle button[aria-controls]');
      expect(aside.attributes('id')).toMatch(/^cm-admin-layout-sidebar-/);
      expect(toggle.attributes('aria-controls')).toBe(aside.attributes('id'));
      expect(aside.text()).toBe('Compact');
      await aside.trigger('mouseenter');
      expect(aside.text()).toBe('Expanded');
      await aside.trigger('mouseleave');
      expect(aside.text()).toBe('Compact');
      await toggle.trigger('click');
      expect(toggle.attributes('aria-expanded')).toBe('true');
      expect(toggle.attributes('aria-label')).toBe('Close navigation');

      const button = aside.get('button');
      (button.element as HTMLButtonElement).focus();
      await button.trigger('keydown', { key: 'Escape' });
      expect(toggle.attributes('aria-expanded')).toBe('false');
      expect(wrapper.attributes('data-cm-sidebar-collapsed')).toBe('true');
      expect(document.activeElement).toBe(toggle.element);
      expect(wrapper.emitted('update:mobileSidebarOpen')).toEqual([[true], [false]]);
    } finally {
      wrapper.unmount();
    }
  });

  it('renders DocumentLayout as content by default with SSR-safe sticky offsets', async () => {
    const html = await renderToString(
      h(
        CmDocumentLayout,
        { as: 'article', stickyHeader: true },
        {
          header: () => 'Guide',
          subheader: () => 'Navigation',
          sidebar: () => 'Hidden sidebar',
          'content-subheader': () => 'Topics',
          default: () => 'Body',
        },
      ),
    );
    expect(html).toContain('<article');
    expect(html).toContain('--cm-sticky-header-offset:var(--cm-layout-header-height)');
    expect(html).toContain('--cm-sticky-subheader-offset:var(--cm-layout-subheader-height)');
    expect(html).toContain('Topics');
    expect(html).not.toContain('Hidden sidebar');
  });

  it('accepts the historical AdminShell header-actions slot', () => {
    const wrapper = mount(CmAdminShell, { props: { fillViewport: false }, slots: { 'header-actions': 'Save' } });
    expect(wrapper.get('.cm-admin-shell__header-actions').text()).toBe('Save');
    expect(wrapper.classes()).toContain('cm-admin-shell--fit-content');
  });

  it('emits the original SetupLayout key event and only cancels when a consumer handles it', () => {
    const onNext = vi.fn();
    const wrapper = mount(CmSetupLayout, {
      props: { onNext },
      slots: { default: () => [h('input'), h('textarea')] },
    });
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    wrapper.get('input').element.dispatchEvent(enter);
    expect(onNext).toHaveBeenCalledExactlyOnceWith(enter);
    expect(enter.defaultPrevented).toBe(true);

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    wrapper.get('input').element.dispatchEvent(escape);
    expect(wrapper.emitted('back')).toEqual([[escape]]);
    expect(escape.defaultPrevented).toBe(false);

    const multiLineEnter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    wrapper.get('textarea').element.dispatchEvent(multiLineEnter);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(multiLineEnter.defaultPrevented).toBe(false);
    expect(wrapper.classes()).toContain('cm-setup-layout--aside-left');
  });

  it('renders SetupLayout regions only when their slots have content', async () => {
    const showAside = ref(false);
    const wrapper = mount(CmSetupLayout, {
      props: { title: 'Database' },
      slots: {
        aside: () => h(Fragment, [' ', showAside.value ? h('nav', 'Installation steps') : createCommentVNode()]),
        actions: () => [],
      },
    });

    expect(wrapper.get('h1').text()).toBe('Database');
    expect(wrapper.find('.cm-setup-layout__actions').exists()).toBe(false);
    expect(wrapper.find('aside').exists()).toBe(false);
    showAside.value = true;
    await nextTick();
    expect(wrapper.get('aside').text()).toBe('Installation steps');
    showAside.value = false;
    await nextTick();
    expect(wrapper.find('aside').exists()).toBe(false);
  });
});
