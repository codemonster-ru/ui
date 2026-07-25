import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import VfNavMenu from './VfNavMenu.vue';
import type { VfNavMenuItem } from '@/types/components';

const items: VfNavMenuItem[] = [
  {
    value: 'getting-started',
    label: 'Getting Started',
    children: [
      { value: 'installation', label: 'Installation' },
      { value: 'quick-start', label: 'Quick Start' },
    ],
  },
  {
    value: 'components',
    label: 'Components',
    children: [
      { value: 'button', label: 'Button', href: '/button' },
      { value: 'tabs', label: 'Tabs', href: '/tabs' },
    ],
  },
];

const groupedItems: VfNavMenuItem[] = [
  {
    value: 'components',
    label: 'Components',
    children: [
      {
        value: 'navigation-group',
        kind: 'group',
        label: 'Navigation',
        children: [
          {
            value: 'tabs',
            label: 'Tabs',
            children: [{ value: 'overview-tab', label: 'Overview Tab' }],
          },
          {
            value: 'accordion',
            label: 'Accordion',
            children: [{ value: 'accordion-item', label: 'Accordion Item' }],
          },
        ],
      },
    ],
  },
];

describe('VfNavMenu', () => {
  it('expands active ancestry from default value', () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items,
        defaultValue: 'button',
      },
    });

    expect(wrapper.text()).toContain('Button');
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Button');
    expect(wrapper.findAll('.vf-nav-menu__list--nested')).toHaveLength(1);
    expect(wrapper.find('.vf-nav-menu').classes()).toContain('vf-nav-menu--default');
    expect(wrapper.find('.vf-nav-menu').classes()).toContain('vf-nav-menu--simple');
  });

  it('uses pills variant class when requested', () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items,
        variant: 'pills',
      },
    });

    expect(wrapper.find('.vf-nav-menu').classes()).toContain('vf-nav-menu--pills');
    expect(wrapper.find('.vf-nav-menu').classes()).not.toContain('vf-nav-menu--default');
  });

  it('uses sidebar variant for level-aware navigation states', () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items,
        defaultValue: 'quick-start',
        variant: 'sidebar',
      },
    });

    expect(wrapper.find('.vf-nav-menu').classes()).toContain('vf-nav-menu--sidebar');
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Quick Start');
    expect(wrapper.get('.vf-nav-menu__item--ancestor-active').text()).toContain('Getting Started');
    expect(wrapper.get('.vf-nav-menu__node--level-0').classes()).toContain('vf-nav-menu__node--expanded');
    expect(wrapper.get('.vf-nav-menu__node--ancestor-active').text()).toContain('Getting Started');
    expect(wrapper.get('.vf-nav-menu__node--active').text()).toBe('Quick Start');
  });

  it('provides a width-aware compact sidebar presentation', () => {
    const navMenuCss = readFileSync(resolve(process.cwd(), 'src/styles/entries/nav-menu.css'), 'utf8');
    const compactSidebarCss = navMenuCss.slice(navMenuCss.indexOf('.vf-nav-menu--sidebar-compact'));

    expect(navMenuCss).not.toContain('@container (max-width: var(--vf-nav-menu-sidebar-compact-breakpoint))');
    expect(navMenuCss).toMatch(
      /\.vf-nav-menu__compact-breakpoint-probe\s*\{[^}]*inline-size: var\(--vf-nav-menu-sidebar-compact-breakpoint\);/,
    );
    expect(compactSidebarCss).not.toContain('justify-content: center');
    expect(compactSidebarCss).not.toContain('padding-inline: 0');
    expect(compactSidebarCss).toMatch(
      /\.vf-nav-menu__item--top:not\(\.vf-nav-menu__item--icon-offset\)\s*\{[^}]*width: var\(--vf-nav-menu-sidebar-compact-item-width\);[^}]*max-width: 100%;[^}]*padding-inline: var\(--vf-nav-menu-sidebar-compact-item-padding-inline\);/,
    );
    expect(navMenuCss).toMatch(
      /\.vf-nav-menu--sidebar[\s\S]*?\.vf-nav-menu__label\s*\{[^}]*white-space: nowrap;[^}]*transition:/,
    );
    expect(navMenuCss).toMatch(
      /\.vf-nav-menu__item--top:not\(\.vf-nav-menu__item--icon-offset\)[\s\S]*?\.vf-nav-menu__label\s*\{[^}]*max-width: 0;[^}]*opacity: 0;/,
    );
    expect(navMenuCss).toMatch(
      /\.vf-nav-menu__node--level-0[\s\S]*?> \.vf-nav-menu__collapse\s*\{[^}]*grid-template-rows: 0fr;[^}]*opacity: 0;[^}]*visibility: hidden;/,
    );
  });

  it('switches the sidebar presentation when its measured width crosses the token breakpoint', async () => {
    let resizeCallback: ResizeObserverCallback = () => undefined;

    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }

      observe() {}

      unobserve() {}

      disconnect() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    const wrapper = mount(VfNavMenu, {
      props: {
        items,
        variant: 'sidebar',
      },
    });
    const nav = wrapper.get('.vf-nav-menu').element;
    const probe = wrapper.get('.vf-nav-menu__compact-breakpoint-probe').element;
    const rect = (width: number) => ({ width }) as DOMRect;

    vi.spyOn(nav, 'getBoundingClientRect').mockReturnValue(rect(76));
    vi.spyOn(probe, 'getBoundingClientRect').mockReturnValue(rect(128));
    resizeCallback([], {} as ResizeObserver);
    await nextTick();

    expect(wrapper.get('.vf-nav-menu').classes()).toContain('vf-nav-menu--sidebar-compact');

    vi.spyOn(nav, 'getBoundingClientRect').mockReturnValue(rect(240));
    resizeCallback([], {} as ResizeObserver);
    await nextTick();

    expect(wrapper.get('.vf-nav-menu').classes()).not.toContain('vf-nav-menu--sidebar-compact');
  });

  it('supports an explicitly controlled compact sidebar presentation', async () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items,
        variant: 'sidebar',
        compact: true,
      },
    });

    expect(wrapper.get('.vf-nav-menu').classes()).toContain('vf-nav-menu--sidebar-compact');

    await wrapper.setProps({ compact: false });

    expect(wrapper.get('.vf-nav-menu').classes()).not.toContain('vf-nav-menu--sidebar-compact');
  });

  it('limits sidebar ancestor pills to the top level', () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items: groupedItems,
        defaultValue: 'overview-tab',
        variant: 'sidebar',
      },
    });

    const ancestors = wrapper.findAll('.vf-nav-menu__item--ancestor-active');
    expect(ancestors).toHaveLength(2);
    expect(ancestors[0]?.classes()).toContain('vf-nav-menu__item--top');
    expect(ancestors[1]?.classes()).not.toContain('vf-nav-menu__item--top');
  });

  it('marks ancestor branches when a descendant is active', () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items,
        defaultValue: 'button',
      },
    });

    const ancestorBranch = wrapper
      .findAll('.vf-nav-menu__item--branch')
      .find((node) => node.text().includes('Components'));

    expect(ancestorBranch?.classes()).toContain('vf-nav-menu__item--ancestor-active');
    expect(ancestorBranch?.classes()).not.toContain('vf-nav-menu__item--active');
  });

  it('toggles branches and emits selection for leaf buttons', async () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items,
      },
    });

    const branch = wrapper.findAll('.vf-nav-menu__item--branch')[0];
    await branch.trigger('click');

    const installation = wrapper.findAll('button.vf-nav-menu__item').find((node) => node.text() === 'Installation');

    expect(installation).toBeTruthy();

    await installation!.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['installation']]);
    expect(wrapper.emitted('change')).toEqual([['installation']]);
  });

  it('supports router-style leaf items via to prop', async () => {
    const wrapper = mount(
      defineComponent({
        components: { VfNavMenu },
        setup() {
          const value = ref('overview');

          return () =>
            h(VfNavMenu, {
              items: [
                {
                  value: 'guides',
                  label: 'Guides',
                  children: [{ value: 'routing', label: 'Routing', to: '/routing' }],
                },
              ],
              modelValue: value.value,
              'onUpdate:modelValue': (nextValue: string) => {
                value.value = nextValue;
              },
            });
        },
      }),
      {
        global: {
          stubs: {
            RouterLink: {
              props: ['to'],
              template: '<a :data-to="to" :class="$attrs.class"><slot /></a>',
            },
          },
        },
      },
    );

    await wrapper.find('.vf-nav-menu__item--branch').trigger('click');
    await nextTick();

    const link = wrapper.get('[data-to="/routing"]');
    expect(link.text()).toBe('Routing');
  });

  it('renders groups as non-interactive section labels', async () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items: [
          {
            value: 'components',
            label: 'Components',
            children: [
              {
                value: 'forms',
                kind: 'group',
                label: 'Forms',
                children: [
                  { value: 'input', label: 'Input' },
                  { value: 'textarea', label: 'Textarea' },
                ],
              },
            ],
          },
        ],
      },
    });

    await wrapper.find('.vf-nav-menu__item--branch').trigger('click');
    await nextTick();

    expect(wrapper.find('.vf-nav-menu__group-label').text()).toBe('Forms');
    expect(wrapper.findAll('button.vf-nav-menu__item').some((node) => node.text() === 'Input')).toBe(true);
  });

  it('renders leading icons for branches and leaf items, but not for groups', async () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items: [
          {
            value: 'components',
            label: 'Components',
            leadingIcon: 'gear',
            children: [
              {
                value: 'forms',
                kind: 'group',
                label: 'Forms',
                leadingIcon: 'info',
                children: [{ value: 'input', label: 'Input', leadingIcon: 'warning' }],
              },
            ],
          },
        ],
      },
    });

    await wrapper.find('.vf-nav-menu__item--branch').trigger('click');
    await nextTick();

    expect(wrapper.findAll('.vf-nav-menu__leading-icon')).toHaveLength(2);
    expect(wrapper.find('.vf-nav-menu__group .vf-nav-menu__leading-icon').exists()).toBe(false);
  });

  it('shows an external-link indicator for leaf links opened in a new tab', async () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items: [
          {
            value: 'resources',
            label: 'Resources',
            children: [
              {
                value: 'storybook',
                label: 'Storybook',
                href: 'https://storybook.js.org',
                target: '_blank',
              },
              {
                value: 'components',
                label: 'Components',
                href: '/components',
              },
            ],
          },
        ],
      },
    });

    await wrapper.find('.vf-nav-menu__item--branch').trigger('click');
    await nextTick();

    const items = wrapper.findAll('.vf-nav-menu__item');

    expect(items[1].find('.vf-nav-menu__icon--external').exists()).toBe(true);
    expect(items[2].find('.vf-nav-menu__icon--external').exists()).toBe(false);
  });

  it('supports single expand mode for sibling branches on the same level', async () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items: groupedItems,
        expandMode: 'single',
      },
    });

    await wrapper.find('.vf-nav-menu__item--branch').trigger('click');
    await nextTick();

    const nestedBranches = wrapper.findAll('.vf-nav-menu__item--branch').filter((node) => node.text() !== 'Components');

    await nestedBranches[0]!.trigger('click');
    await nextTick();
    expect(wrapper.text()).toContain('Overview Tab');

    await nestedBranches[1]!.trigger('click');
    await nextTick();

    expect(wrapper.text()).not.toContain('Overview Tab');
    expect(wrapper.text()).toContain('Accordion Item');
  });

  it('does not mark grouped or icon-driven menus as simple', () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items: [
          {
            value: 'components',
            label: 'Components',
            leadingIcon: 'gear',
            children: [
              {
                value: 'forms',
                kind: 'group',
                label: 'Forms',
                children: [{ value: 'input', label: 'Input' }],
              },
            ],
          },
        ],
      },
    });

    expect(wrapper.find('.vf-nav-menu').classes()).not.toContain('vf-nav-menu--simple');
  });

  it('reserves icon column for iconless items in complex menus', async () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items: [
          {
            value: 'components',
            label: 'Components',
            leadingIcon: 'gear',
            children: [
              { value: 'with-icon', label: 'With Icon', leadingIcon: 'info' },
              { value: 'without-icon', label: 'Without Icon' },
            ],
          },
        ],
      },
    });

    await wrapper.find('.vf-nav-menu__item--branch').trigger('click');
    await nextTick();

    const items = wrapper.findAll('.vf-nav-menu__item');
    const withIcon = items.find((node) => node.text() === 'With Icon');
    const withoutIcon = items.find((node) => node.text() === 'Without Icon');

    expect(withIcon?.classes()).not.toContain('vf-nav-menu__item--icon-offset');
    expect(withoutIcon?.classes()).toContain('vf-nav-menu__item--icon-offset');
  });

  it('exposes disabled links without leaving them in the tab order', () => {
    const wrapper = mount(VfNavMenu, {
      props: {
        items: [{ value: 'disabled', label: 'Disabled', href: '/disabled', disabled: true }],
      },
    });

    const disabledLink = wrapper.get('[href="/disabled"]');
    expect(disabledLink.attributes('aria-disabled')).toBe('true');
    expect(disabledLink.attributes('tabindex')).toBe('-1');
  });
});
