import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VfMenu from './VfMenu.vue';
import VfMenuItem from './VfMenuItem.vue';

describe('VfMenu', () => {
  it('renders a menu with actionable items', async () => {
    const wrapper = mount(VfMenu, {
      global: {
        stubs: { VfMenuItem: true },
      },
      slots: {
        default:
          '<button role="menuitem">Edit</button><button class="vf-menu__item--danger" role="menuitem">Delete</button>',
      },
    });

    expect(wrapper.attributes('role')).toBe('menu');
    expect(wrapper.findAll('[role="menuitem"]')).toHaveLength(2);
    expect(wrapper.find('.vf-menu__item--danger').text()).toBe('Delete');
  });

  it('renders links and emits select for enabled items', async () => {
    const wrapper = mount(VfMenuItem, {
      props: {
        label: 'Open page',
        href: '#page',
      },
    });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('#page');

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toHaveLength(1);
  });

  it('does not activate disabled links', async () => {
    const wrapper = mount(VfMenuItem, {
      props: {
        label: 'Delete',
        href: '/delete',
        disabled: true,
      },
    });

    expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.attributes('tabindex')).toBe('-1');

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toBeUndefined();
  });
});
