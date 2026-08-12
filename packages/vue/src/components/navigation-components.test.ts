import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

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
});
