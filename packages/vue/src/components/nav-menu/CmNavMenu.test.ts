import { mount } from '@vue/test-utils';
import { defineComponent, h, type PropType } from 'vue';
import { describe, expect, it } from 'vitest';

import CmNavMenu from './CmNavMenu.vue';
import type { CmNavMenuItem } from './nav-menu.types';

const RouteLink = defineComponent({
  props: {
    to: { type: [String, Object] as PropType<string | { path: string; hash?: string }>, required: true },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'a',
        {
          href: typeof props.to === 'string' ? props.to : props.to.path + (props.to.hash ?? ''),
          onClick: (event: MouseEvent) => event.preventDefault(),
        },
        slots.default?.(),
      );
  },
});

const grid = { value: 'grid', label: 'Grid', to: { path: '/layouts/', hash: '#grid' } };
const items: CmNavMenuItem[] = [
  { value: 'overview', label: 'Overview', to: '/core/', href: '/fallback/' },
  {
    value: 'guides',
    label: 'Guides',
    children: [grid, { value: 'billing', label: 'Billing', to: '/billing/', disabled: true }],
  },
  { value: 'icons', label: 'Icons', href: '/icons/', target: '_blank' },
];

describe('CmNavMenu routes and selection', () => {
  it('renders registered routes as anchors and opens the default item path', async () => {
    const menu = mount(CmNavMenu, {
      props: { items, defaultValue: 'grid' },
      global: { components: { RouterLink: RouteLink } },
    });
    expect(menu.get('[data-cm-nav-menu-branch="guides"]').attributes('aria-expanded')).toBe('true');
    expect(menu.get('a[aria-current="page"]').attributes('href')).toBe('/layouts/#grid');
    expect(menu.get('[data-cm-nav-menu-value="billing"]').attributes()).toMatchObject({
      'aria-disabled': 'true',
      tabindex: '-1',
    });
    expect(menu.get('[data-cm-nav-menu-value="billing"]').attributes('href')).toBeUndefined();
    expect(menu.get('[data-cm-nav-menu-value="icons"]').attributes('rel')).toBe('noopener noreferrer');
    await menu.get('[data-cm-nav-menu-value="billing"]').trigger('click');
    expect(menu.emitted('select')).toBeUndefined();

    const overview = menu.get('[data-cm-nav-menu-value="overview"]');
    expect(overview.attributes('href')).toBe('/core/');
    await overview.trigger('click');
    expect(overview.attributes('aria-current')).toBe('page');
    expect(menu.emitted('update:value')).toEqual([['overview']]);
    expect(menu.emitted('update:modelValue')).toEqual([['overview']]);
    expect(menu.emitted('valueChange')).toEqual([['overview']]);
    expect(menu.emitted('change')).toEqual([['overview']]);
    expect(menu.emitted('select')).toEqual([[items[0]]]);
  });

  it('uses a custom link component with a controlled selection', async () => {
    const menu = mount(CmNavMenu, { props: { items, modelValue: null, linkComponent: RouteLink } });
    const branch = menu.get('[data-cm-nav-menu-branch="guides"]');
    expect(branch.attributes('aria-expanded')).toBe('false');
    const overview = menu.get('a[data-cm-nav-menu-value="overview"]');
    await overview.trigger('click');
    expect(menu.emitted('update:modelValue')).toEqual([['overview']]);
    expect(overview.attributes('aria-current')).toBeUndefined();

    await menu.setProps({ modelValue: 'grid' });
    expect(branch.attributes('aria-expanded')).toBe('true');
    expect(menu.get('a[aria-current="page"]').attributes('href')).toBe('/layouts/#grid');
    await menu.setProps({ value: 'overview' });
    expect(overview.attributes('aria-current')).toBe('page');
  });
});
