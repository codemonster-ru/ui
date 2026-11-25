import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { h, type Component } from 'vue';
import { describe, expect, it } from 'vitest';

import CmAsideArea from '../areas/CmAsideArea.vue';
import CmContentArea from '../areas/CmContentArea.vue';
import CmFooterArea from '../areas/CmFooterArea.vue';
import CmHeaderArea from '../areas/CmHeaderArea.vue';
import CmSidebarArea from '../areas/CmSidebarArea.vue';
import CmAuthLayout from './CmAuthLayout.vue';
import CmErrorLayout from './CmErrorLayout.vue';

describe('static page layouts', () => {
  it('renders a server-ready authentication landmark with optional regional slots', async () => {
    const html = await renderToString(
      h(
        CmAuthLayout,
        { title: 'Sign in', 'aria-label': 'Account' },
        {
          brand: () => h('a', { href: '/' }, 'Acme'),
          default: () => h('form', { action: '/sessions', method: 'post' }),
          footer: () => h('a', { href: '/help' }, 'Get help'),
        },
      ),
    );

    expect(html).toMatch(/^<main[^>]+aria-label="Account"/u);
    const markup = document.createElement('template');
    markup.innerHTML = html;
    expect(markup.content.querySelector('h1')?.textContent).toBe('Sign in');
    expect(html).toContain('<form action="/sessions" method="post"></form>');
    expect(html).toContain('<footer class="cm-auth-layout__footer">');
    expect(html).not.toContain('cm-auth-layout__description');
  });

  it('supports authentication slot overrides and a plain section without viewport centering', () => {
    const wrapper = mount(CmAuthLayout, {
      props: {
        as: 'section',
        title: 'Prop title',
        description: 'Prop description',
        fillViewport: false,
        centered: false,
        surface: false,
      },
      slots: {
        brand: 'Acme',
        title: 'Create account',
        description: 'Start your workspace.',
        default: 'Registration form',
        footer: () => h('a', { href: '/sign-in' }, 'Already have an account?'),
      },
    });

    expect((wrapper.element as HTMLElement).tagName).toBe('SECTION');
    expect(wrapper.classes()).not.toContain('cm-page-layout--fill-viewport');
    expect(wrapper.classes()).not.toContain('cm-page-layout--centered');
    expect(wrapper.get('.cm-auth-layout__panel').classes()).not.toContain('cm-page-layout__panel--surface');
    expect(wrapper.get('.cm-auth-layout__brand').text()).toBe('Acme');
    expect(wrapper.get('h1').text()).toBe('Create account');
    expect(wrapper.get('.cm-auth-layout__description').text()).toBe('Start your workspace.');
    expect(wrapper.get('.cm-auth-layout__body').text()).toBe('Registration form');
    expect(wrapper.get('footer a').attributes('href')).toBe('/sign-in');
  });

  it('omits optional authentication regions and uses the default layout modifiers', () => {
    const wrapper = mount(CmAuthLayout, { slots: { default: 'Sign-in form' } });

    expect(wrapper.classes()).toContain('cm-page-layout--fill-viewport');
    expect(wrapper.classes()).toContain('cm-page-layout--centered');
    expect(wrapper.get('.cm-auth-layout__panel').classes()).toContain('cm-page-layout__panel--surface');
    expect(wrapper.find('header, footer').exists()).toBe(false);
    expect(wrapper.get('.cm-auth-layout__body').text()).toBe('Sign-in form');
  });

  it('renders a numeric zero in the error code, prefers slots, and supports an unstyled section', () => {
    const wrapper = mount(CmErrorLayout, {
      props: { code: 0, title: 'Prop title', centered: false, fillViewport: false, surface: false },
      slots: { title: 'Slot title', actions: () => h('a', { href: '/' }, 'Home') },
    });

    expect(wrapper.html()).toMatch(/^<section class="cm-error-layout">/u);
    expect(wrapper.get('.cm-error-layout__code').text()).toBe('0');
    expect(wrapper.get('h1').text()).toBe('Slot title');
    expect(wrapper.get('a').attributes('href')).toBe('/');
    expect(wrapper.get('.cm-error-layout__panel').classes()).not.toContain('cm-page-layout__panel--surface');
  });
});

describe('layout regions', () => {
  const cases: Array<{ component: Component; element: string; className: string; modifier?: string }> = [
    {
      component: CmHeaderArea as Component,
      element: 'HEADER',
      className: 'cm-header-area',
      modifier: 'cm-header-area--sticky',
    },
    { component: CmSidebarArea as Component, element: 'ASIDE', className: 'cm-sidebar-area' },
    {
      component: CmContentArea as Component,
      element: 'MAIN',
      className: 'cm-content-area',
      modifier: 'cm-content-area--padded',
    },
    { component: CmAsideArea as Component, element: 'ASIDE', className: 'cm-aside-area' },
    { component: CmFooterArea as Component, element: 'FOOTER', className: 'cm-footer-area' },
  ];

  it.each(cases)(
    'exposes the native $className landmark and children',
    ({ component, element, className, modifier }) => {
      const wrapper = mount(component, { attrs: { 'data-consumer': 'yes' }, slots: { default: 'Region content' } });
      expect((wrapper.element as HTMLElement).tagName).toBe(element);
      expect(wrapper.classes()).toContain(className);
      if (modifier) expect(wrapper.classes()).toContain(modifier);
      expect(wrapper.attributes('data-consumer')).toBe('yes');
      expect(wrapper.text()).toBe('Region content');
    },
  );

  it('changes the semantic tag and allows a plain side region', () => {
    const wrapper = mount(CmSidebarArea, { props: { as: 'nav', appearance: 'plain' }, slots: { default: 'Links' } });
    expect(wrapper.html()).toMatch(/^<nav[^>]+cm-layout-area--plain/u);
    expect(wrapper.get('.cm-sidebar-area__inner').text()).toBe('Links');
  });
});
