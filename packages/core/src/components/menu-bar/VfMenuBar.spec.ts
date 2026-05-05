import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VfMenuBar from './VfMenuBar.vue';
import type { VfNavMenuItem } from '@/types/components';

const items: VfNavMenuItem[] = [
  {
    value: 'products',
    label: 'Products',
    children: [
      { value: 'tokens', label: 'Tokens' },
      {
        value: 'components',
        label: 'Components',
        children: [
          { value: 'forms', label: 'Forms' },
          { value: 'navigation', label: 'Navigation' },
        ],
      },
    ],
  },
  { value: 'pricing', label: 'Pricing' },
];

describe('VfMenuBar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens top-level branch and renders submenu items', async () => {
    const wrapper = mount(VfMenuBar, {
      props: {
        items,
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :data-to="to" :class="$attrs.class"><slot /></a>',
          },
        },
      },
    });

    await wrapper.get('.vf-menu-bar__item--branch').trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Tokens');
    expect(wrapper.text()).toContain('Components');
    expect(wrapper.find('.vf-menu-bar__submenu').exists()).toBe(true);
  });

  it('supports pills variant', () => {
    const wrapper = mount(VfMenuBar, {
      props: {
        items,
        variant: 'pills',
      },
    });

    expect(wrapper.find('.vf-menu-bar').classes()).toContain('vf-menu-bar--pills');
  });

  it('does not open top-level branches on hover before menu is activated', async () => {
    const wrapper = mount(VfMenuBar, {
      props: {
        items,
      },
    });

    await wrapper.get('.vf-menu-bar__item--branch').trigger('mouseenter');
    await nextTick();

    expect(wrapper.find('.vf-menu-bar__submenu').exists()).toBe(false);
  });

  it('opens nested branch and selects nested items', async () => {
    const wrapper = mount(VfMenuBar, {
      props: {
        items,
      },
    });

    await wrapper.get('.vf-menu-bar__item--branch').trigger('click');
    await nextTick();

    const nestedBranch = wrapper
      .findAll('.vf-menu-bar__item--branch')
      .find((node) => node.text().includes('Components'));

    expect(nestedBranch).toBeTruthy();

    await nestedBranch!.trigger('click');
    await nextTick();

    const nestedLeaf = wrapper.findAll('.vf-menu-bar__item').find((node) => node.text().includes('Forms'));

    expect(nestedLeaf).toBeTruthy();

    await nestedLeaf!.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['forms']);
    expect(wrapper.find('.vf-menu-bar__submenu').exists()).toBe(false);
  });

  it('closes open menus after pointer leaves the menu bar', async () => {
    vi.useFakeTimers();

    const wrapper = mount(VfMenuBar, {
      props: {
        items,
      },
    });

    await wrapper.get('.vf-menu-bar__item--branch').trigger('click');
    await nextTick();

    expect(wrapper.find('.vf-menu-bar__submenu').exists()).toBe(true);

    await wrapper.get('.vf-menu-bar').trigger('mouseleave');
    await vi.advanceTimersByTimeAsync(120);

    expect(wrapper.find('.vf-menu-bar__submenu').exists()).toBe(false);
  });

  it('keeps menus interactive when moving between nested branches', async () => {
    vi.useFakeTimers();

    const nestedItems: VfNavMenuItem[] = [
      {
        value: 'products',
        label: 'Products',
        children: [
          {
            value: 'components',
            label: 'Components',
            children: [{ value: 'forms', label: 'Forms' }],
          },
          {
            value: 'guides',
            label: 'Guides',
            children: [{ value: 'getting-started', label: 'Getting Started' }],
          },
        ],
      },
    ];

    const wrapper = mount(VfMenuBar, {
      props: {
        items: nestedItems,
      },
    });

    await wrapper.get('.vf-menu-bar__item--branch').trigger('click');
    await nextTick();

    const nestedBranches = wrapper.findAll('.vf-menu-bar__submenu .vf-menu-bar__node--branch');
    expect(nestedBranches).toHaveLength(2);

    await nestedBranches[0].trigger('mouseenter');
    await nextTick();
    expect(wrapper.text()).toContain('Forms');

    await wrapper.get('.vf-menu-bar').trigger('mouseleave');
    await wrapper.get('.vf-menu-bar').trigger('mouseenter');
    await nestedBranches[1].trigger('mouseenter');
    await nextTick();
    await vi.advanceTimersByTimeAsync(120);

    expect(wrapper.text()).toContain('Getting Started');
    expect(wrapper.text()).not.toContain('Forms');
  });

  it('switches top-level branches on hover after menu is opened', async () => {
    const topLevelItems: VfNavMenuItem[] = [
      {
        value: 'products',
        label: 'Products',
        children: [{ value: 'tokens', label: 'Tokens' }],
      },
      {
        value: 'guides',
        label: 'Guides',
        children: [{ value: 'getting-started', label: 'Getting Started' }],
      },
    ];

    const wrapper = mount(VfMenuBar, {
      props: {
        items: topLevelItems,
      },
    });

    const branches = wrapper.findAll('.vf-menu-bar__item--branch');
    const branchNodes = wrapper.findAll('.vf-menu-bar__node--branch');

    await branches[0].trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Tokens');

    await branchNodes[1].trigger('mouseenter');
    await nextTick();

    expect(wrapper.text()).toContain('Getting Started');
    expect(wrapper.text()).not.toContain('Tokens');
  });

  it('supports controlled mode', async () => {
    const wrapper = mount(
      defineComponent({
        components: { VfMenuBar },
        setup() {
          const value = ref('pricing');

          return () =>
            h(VfMenuBar, {
              items,
              modelValue: value.value,
              'onUpdate:modelValue': (next: string) => {
                value.value = next;
              },
            });
        },
      }),
    );

    expect(wrapper.find('.vf-menu-bar__item--active').text()).toContain('Pricing');
  });

  it('shows an external-link indicator for leaf links opened in a new tab', () => {
    const wrapper = mount(VfMenuBar, {
      props: {
        items: [
          {
            value: 'docs',
            label: 'Docs',
            href: 'https://example.com/docs',
            target: '_blank',
          },
          {
            value: 'pricing',
            label: 'Pricing',
            href: '/pricing',
          },
        ],
      },
    });

    expect(wrapper.findAll('.vf-menu-bar__item')[0]?.find('.vf-menu-bar__icon--external').exists()).toBe(true);
    expect(wrapper.findAll('.vf-menu-bar__item')[1]?.find('.vf-menu-bar__icon--external').exists()).toBe(false);
  });

  it('marks parent branches when a descendant is active', () => {
    const wrapper = mount(VfMenuBar, {
      props: {
        items,
        modelValue: 'forms',
      },
    });

    const ancestorBranch = wrapper
      .findAll('.vf-menu-bar__item--branch')
      .find((node) => node.text().includes('Products'));

    expect(ancestorBranch?.classes()).toContain('vf-menu-bar__item--ancestor-active');
    expect(ancestorBranch?.classes()).not.toContain('vf-menu-bar__item--active');
  });
});
