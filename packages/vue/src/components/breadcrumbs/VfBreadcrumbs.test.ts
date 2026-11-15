import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, markRaw, type PropType } from 'vue';

import { expectCmWarning } from '../../internal/expect-warning';
import CmBreadcrumbs from './CmBreadcrumbs.vue';
import VfBreadcrumbs from './VfBreadcrumbs.vue';
import type { VfBreadcrumbItem } from './breadcrumbs.types';

it('renders the historical decorative chevron while retaining the canonical slash', () => {
  const items = [{ label: 'Settings', href: '/settings' }, { label: 'Notifications' }];
  const historical = mount(VfBreadcrumbs, { props: { items }, attrs: { id: 'settings-trail' } });
  const separator = historical.get('.cm-breadcrumbs__separator');
  expect(historical.attributes()).toMatchObject({ id: 'settings-trail', 'aria-label': 'Breadcrumb' });
  expect(separator.attributes('aria-hidden')).toBe('true');
  expect(separator.get('svg').attributes()).toMatchObject({ focusable: 'false', 'aria-hidden': 'true' });
  expect(separator.get('polyline').attributes('points')).toBe('8.75 5.75 15 12 8.75 18.25');
  expect(historical.get('[aria-current="page"]').text()).toBe('Notifications');

  const canonical = mount(CmBreadcrumbs, { props: { items } });
  expect(canonical.get('.cm-breadcrumbs__separator').text()).toBe('/');
});

it('forwards routed links and each rendered item and index to an authored separator', () => {
  const route = { path: '/workspace' };
  const RouterLink = markRaw(
    defineComponent({
      props: { to: { type: Object as PropType<typeof route>, required: true } },
      setup:
        (props, { slots }) =>
        () =>
          h('a', { href: props.to.path }, slots.default?.()),
    }),
  );
  const items: VfBreadcrumbItem[] = [
    { label: 'Workspace', to: route, target: '_blank' },
    { label: 'Projects', href: '/projects', disabled: true },
    { label: 'Current workspace' },
  ];
  const separator = vi.fn(({ item, index }: { item: VfBreadcrumbItem; index: number }) => `${index}:${item.label}`);
  const wrapper = mount(VfBreadcrumbs, {
    props: { items, component: RouterLink, ariaLabel: 'Workspace path' },
    slots: { separator },
  });
  expect(wrapper.attributes('aria-label')).toBe('Workspace path');
  expect(wrapper.findAll('a')).toHaveLength(1);
  expect(wrapper.get('a').attributes()).toMatchObject({
    href: '/workspace',
    target: '_blank',
    rel: 'noopener noreferrer',
  });
  expect(separator.mock.calls).toEqual([[{ item: items[0], index: 0 }], [{ item: items[1], index: 1 }]]);
  expect(wrapper.findAll('.cm-breadcrumbs__separator').map((node) => node.text())).toEqual([
    '0:Workspace',
    '1:Projects',
  ]);
});

it('keeps one accessible current page when multiple items are marked', () => {
  const wrapper = expectCmWarning(/Breadcrumbs accept one current item/u, () =>
    mount(VfBreadcrumbs, {
      props: {
        items: [
          { label: 'Workspace', current: true },
          { label: 'Projects', href: '/projects', current: true },
        ],
      },
    }),
  );

  expect(wrapper.findAll('[aria-current="page"]')).toHaveLength(1);
  expect(wrapper.get('[aria-current="page"]').text()).toBe('Workspace');
  expect(wrapper.get('a').attributes('href')).toBe('/projects');
});
