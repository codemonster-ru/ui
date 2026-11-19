import { mount } from '@vue/test-utils';
import { defineComponent, h, markRaw, nextTick, ref, type PropType } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import CmAccordion from './accordion/CmAccordion.vue';
import CmBreadcrumbs from './breadcrumbs/CmBreadcrumbs.vue';
import CmDropdown from './dropdown/CmDropdown.vue';
import CmLink from './link/CmLink.vue';
import CmMenu from './menu/CmMenu.vue';
import CmTabs from './tabs/CmTabs.vue';

const menuItems = [
  { id: 'edit', label: 'Edit' },
  { id: 'archive', label: 'Archive', disabled: true },
  { id: 'delete', label: 'Delete', tone: 'danger' as const },
];

describe('Vue navigation components', () => {
  it('secures blank-target links and merges presentation classes', () => {
    const wrapper = mount(CmLink, {
      attrs: { class: 'consumer', target: '_blank' },
      props: { href: 'https://example.com', tone: 'muted', underline: 'always' },
      slots: { default: 'Guide' },
    });
    expect(wrapper.attributes()).toMatchObject({ rel: 'noopener noreferrer', target: '_blank' });
    expect(wrapper.classes()).toEqual(['cm-link', 'cm-link--underline-always', 'cm-link--muted', 'consumer']);
  });

  it('renders a consumer link component with the router destination and link attributes', () => {
    const route = { name: 'projects' };
    const routerLink = defineComponent({
      props: { to: { type: Object as PropType<typeof route>, required: true } },
      setup(props, { slots }) {
        return () => h('a', { href: `/${props.to.name}` }, slots.default?.());
      },
    });
    const wrapper = mount(CmLink, {
      props: { to: route, component: markRaw(routerLink), target: '_blank', rel: 'nofollow noopener' },
      slots: { default: 'Projects' },
    });
    expect(wrapper.get('a').attributes()).toMatchObject({
      href: '/projects',
      rel: 'nofollow noopener',
      target: '_blank',
    });
    expect(wrapper.text()).toBe('Projects');
  });

  it('infers the current breadcrumb and preserves disabled non-navigation', () => {
    const wrapper = mount(CmBreadcrumbs, {
      props: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Archive', href: '/archive', disabled: true },
        ],
      },
    });
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Breadcrumb');
    expect(wrapper.findAll('a')).toHaveLength(1);
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Archive');
  });

  it('preserves caller-owned root IDs across navigation components', () => {
    const breadcrumbs = mount(CmBreadcrumbs, {
      attrs: { id: 'project-path' },
      props: { items: [{ label: 'Project', current: true }] },
    });
    const link = mount(CmLink, { attrs: { id: 'project-link' }, props: { href: '/project' } });
    const menu = mount(CmMenu, {
      attrs: { id: 'project-menu' },
      props: { items: [{ id: 'open', label: 'Open' }] },
    });

    expect(breadcrumbs.attributes('id')).toBe('project-path');
    expect(link.attributes('id')).toBe('project-link');
    expect(menu.attributes('id')).toBe('project-menu');
  });

  it('updates uncontrolled tabs and skips disabled items with keyboard', async () => {
    const wrapper = mount(CmTabs, {
      attachTo: document.body,
      props: {
        id: 'settings',
        items: [
          { value: 'general', label: 'General', content: 'General.' },
          { value: 'advanced', label: 'Advanced', content: 'Advanced.', disabled: true },
          { value: 'billing', label: 'Billing', content: 'Billing.' },
        ],
      },
    });
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]');
    tabs[0].element.focus();
    await tabs[0].trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[2].element);
    expect(tabs[2].attributes('aria-selected')).toBe('true');
    expect(wrapper.emitted('update:modelValue')).toEqual([['billing']]);
    wrapper.unmount();
  });

  it.each([
    [
      'Accordion',
      (attrs: { onKeydown?: (event: KeyboardEvent) => void }) =>
        h(CmAccordion, { id: 'help', items: [{ id: 'help', title: 'Help', content: 'Help' }], ...attrs }),
    ],
    ['Menu', (attrs: { onKeydown?: (event: KeyboardEvent) => void }) => h(CmMenu, { items: menuItems, ...attrs })],
    [
      'Tabs',
      (attrs: { onKeydown?: (event: KeyboardEvent) => void }) =>
        h(CmTabs, { items: [{ value: 'general', label: 'General' }], ...attrs }),
    ],
  ] as const)('updates the %s root listener after mounting', async (_, renderComponent) => {
    const listening = ref(false);
    const onKeydown = vi.fn();
    const wrapper = mount({ render: () => renderComponent(listening.value ? { onKeydown } : {}) });
    try {
      listening.value = true;
      await nextTick();
      await wrapper.trigger('keydown', { key: 'F2' });
      expect(onKeydown).toHaveBeenCalledOnce();

      listening.value = false;
      await nextTick();
      await wrapper.trigger('keydown', { key: 'F2' });
      expect(onKeydown).toHaveBeenCalledOnce();
    } finally {
      wrapper.unmount();
    }
  });

  it('forwards Tabs keydown to the root and respects a capture listener', async () => {
    const onKeydown = vi.fn();
    const wrapper = mount(CmTabs, {
      attachTo: document.body,
      attrs: {
        onKeydown,
        onKeydownCapture: (event: KeyboardEvent) => {
          if (event.shiftKey) event.preventDefault();
        },
      },
      props: {
        items: [
          { value: 'general', label: 'General' },
          { value: 'billing', label: 'Billing' },
        ],
      },
    });
    try {
      const [general, billing] = wrapper.findAll<HTMLButtonElement>('[role="tab"]');
      general.element.focus();
      await general.trigger('keydown', { key: 'ArrowRight', shiftKey: true });
      expect(document.activeElement).toBe(general.element);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();

      await general.trigger('keydown', { key: 'ArrowRight' });
      expect(document.activeElement).toBe(billing.element);
      expect(onKeydown).toHaveBeenCalledTimes(2);
    } finally {
      wrapper.unmount();
    }
  });

  it('forwards Menu keydown to the root before its own handling', async () => {
    const onKeydown = vi.fn((event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault();
    });
    const wrapper = mount(CmMenu, { attrs: { onKeydown }, props: { items: menuItems } });
    try {
      await wrapper.get('[role="menuitem"]').trigger('keydown', { key: 'Escape' });
      expect(onKeydown).toHaveBeenCalledOnce();
      expect(wrapper.emitted('closeRequest')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('moves menu focus and reports only enabled selection', async () => {
    const wrapper = mount(CmMenu, { attachTo: document.body, props: { items: menuItems } });
    const items = wrapper.findAll<HTMLElement>('[role="menuitem"]');
    items[0].element.focus();
    await items[0].trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[2].element);
    await items[1].trigger('click');
    await items[2].trigger('click');
    expect(wrapper.emitted('select')).toEqual([['delete']]);
    wrapper.unmount();
  });

  it('renders rich Menu items and secures blank-target links', () => {
    const wrapper = mount(CmMenu, {
      props: { items: [{ id: 'open-project', label: 'Open project', href: '/project', target: '_blank' }] },
      slots: { itemOpenProject: ({ item }) => `<strong>${item.label}</strong>` },
    });
    const link = wrapper.get('a');
    expect(link.attributes()).toMatchObject({ target: '_blank', rel: 'noopener noreferrer' });
    expect(link.get('.cm-menu__item-label').text()).toBe('<strong>Open project</strong>');
  });

  it('opens Dropdown from keyboard and closes after Menu selection', async () => {
    const wrapper = mount(CmDropdown, {
      attachTo: document.body,
      props: { id: 'actions', label: 'Actions', items: menuItems },
    });
    await wrapper.get('.cm-dropdown__trigger').trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.get('.cm-dropdown__trigger').attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('.cm-dropdown__menu').attributes('hidden')).toBeUndefined();
    expect(document.activeElement).toBe(wrapper.findAll<HTMLElement>('[role="menuitem"]')[0].element);
    await wrapper.findAll('[role="menuitem"]')[0].trigger('click');
    expect(wrapper.get('.cm-dropdown__menu').attributes('hidden')).toBe('');
    expect(wrapper.emitted('select')).toEqual([['edit']]);
    wrapper.unmount();
  });

  it('keeps trusted Dropdown trigger content inside the owned accessible button', () => {
    const wrapper = mount(CmDropdown, {
      props: { id: 'tools', label: 'Project tools', items: [{ id: 'refresh', label: 'Refresh' }] },
      slots: { trigger: '<span aria-hidden="true">•••</span>' },
    });
    expect(wrapper.get('.cm-dropdown__trigger').attributes('aria-label')).toBe('Project tools');
    expect(wrapper.get('.cm-dropdown__menu').attributes('role')).toBe('menu');
  });

  it('provides Dropdown slot state and close control with an owned trigger', async () => {
    const wrapper = mount(CmDropdown, {
      attachTo: document.body,
      props: { id: 'tools', label: 'Project tools', defaultOpen: true, closeOnSelect: false, variant: 'pills' },
      slots: {
        trigger: ({ open, toggle }) => h('span', { onClick: toggle }, open ? 'Hide' : 'Show'),
        default: ({ open, close }) => [
          h('button', { type: 'button', role: 'menuitem', tabindex: 0, 'data-cm-menu-value': 'refresh' }, 'Refresh'),
          h('button', { type: 'button', role: 'menuitem', tabindex: -1, disabled: true }, 'Unavailable'),
          h('button', { type: 'button', role: 'menuitem', tabindex: -1, onClick: close }, open ? 'Done' : 'Closed'),
        ],
      },
    });
    const trigger = wrapper.get('button.cm-dropdown__trigger');
    expect(wrapper.classes()).toContain('cm-dropdown--pills');
    expect(trigger.text()).toBe('Hide');
    await trigger.get('span').trigger('click');
    expect(trigger.text()).toBe('Show');
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    const [first, , last] = wrapper.findAll('[role="menuitem"]');
    expect(document.activeElement).toBe(first.element);
    await first.trigger('click');
    expect(wrapper.emitted('select')).toEqual([['refresh']]);
    expect(trigger.attributes('aria-expanded')).toBe('true');
    await first.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(last.element);
    await last.trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(last.text()).toBe('Closed');
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it('uses an uncontrolled Tabs default with rich owned content', () => {
    const wrapper = mount(CmTabs, {
      props: {
        id: 'workspace',
        defaultValue: 'details',
        items: [
          { value: 'overview', label: 'Overview', content: 'Overview.' },
          { value: 'details', label: 'Details', content: 'Details.' },
        ],
      },
      slots: { tabDetails: '<strong>Details</strong>', panelDetails: '<p>Rich details.</p>' },
    });
    expect(wrapper.get('[data-cm-tabs-value]').attributes('data-cm-tabs-value')).toBe('details');
    expect(wrapper.get('#workspace-tab-overview').attributes('aria-controls')).toBe('workspace-panel-overview');
    expect(wrapper.get('#workspace-panel-overview').attributes('hidden')).toBe('');
    expect(wrapper.get('#workspace-panel-details').html()).toContain('<p>Rich details.</p>');
  });
});
