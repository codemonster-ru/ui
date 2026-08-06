import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VfPageHeader from './VfPageHeader.vue';

describe('VfPageHeader', () => {
  it('renders its heading, description, breadcrumbs, and actions', () => {
    const wrapper = mount(VfPageHeader, {
      props: {
        title: 'Users',
        description: 'Manage access to the application.',
        breadcrumbs: [
          { label: 'Administration', href: '/admin' },
          { label: 'Users', current: true },
        ],
        headingLevel: 2,
      },
      slots: {
        actions: '<button>New user</button>',
      },
    });

    expect(wrapper.get('h2').text()).toBe('Users');
    expect(wrapper.get('.vf-page-header__description').text()).toBe('Manage access to the application.');
    expect(wrapper.get('.vf-breadcrumbs').text()).toContain('Administration');
    expect(wrapper.get('.vf-page-header__actions').text()).toBe('New user');
    expect(wrapper.classes()).toEqual(['vf-page-header']);
  });

  it('supports slot-authored content', () => {
    const wrapper = mount(VfPageHeader, {
      slots: {
        title: 'Custom title',
        description: '<span>Custom description</span>',
        breadcrumbs: '<nav aria-label="Custom breadcrumbs">Path</nav>',
      },
    });

    expect(wrapper.get('h1').text()).toBe('Custom title');
    expect(wrapper.get('[aria-label="Custom breadcrumbs"]').text()).toBe('Path');
  });
});
