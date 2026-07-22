import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import VfTabs from './VfTabs.vue';

const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'settings', label: 'Settings' },
  { value: 'billing', label: 'Billing', disabled: true },
];

describe('VfTabs', () => {
  it('renders active tab and panel content from uncontrolled state', async () => {
    const wrapper = mount(VfTabs, {
      attachTo: document.body,
      props: {
        items,
        defaultValue: 'settings',
      },
      slots: {
        panel: ({ activeValue }: { activeValue: string }) => h('div', `panel:${activeValue}`),
      },
    });

    const activeTab = wrapper.get('[role="tab"][aria-selected="true"]');
    const panel = wrapper.get('[role="tabpanel"]');

    expect(activeTab.text()).toBe('Settings');
    expect(panel.text()).toBe('panel:settings');
    expect(panel.attributes('aria-labelledby')).toBe(activeTab.attributes('id'));

    await wrapper.findAll('[role="tab"]')[0].trigger('click');
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('panel:overview');
  });

  it('supports arrow navigation across enabled tabs', async () => {
    const wrapper = mount(VfTabs, {
      attachTo: document.body,
      props: {
        items,
        defaultValue: 'overview',
      },
      slots: {
        panel: ({ activeValue }: { activeValue: string }) => h('div', activeValue),
      },
    });

    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[0].trigger('keydown', { key: 'ArrowRight' });
    await nextTick();

    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Settings');
    expect(document.activeElement?.textContent).toBe('Settings');

    await tabs[1].trigger('keydown', { key: 'ArrowRight' });
    await nextTick();

    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Overview');
  });

  it('mirrors horizontal tab navigation in rtl', async () => {
    const wrapper = mount(VfTabs, {
      attrs: { dir: 'rtl' },
      props: { items, defaultValue: 'overview' },
    });

    await wrapper.findAll('[role="tab"]')[0].trigger('keydown', { key: 'ArrowLeft' });
    await nextTick();
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Settings');
  });

  it('supports controlled mode through v-model updates', async () => {
    const wrapper = mount(
      defineComponent({
        components: { VfTabs },
        setup() {
          const value = ref('overview');

          return () =>
            h(
              VfTabs,
              {
                items,
                modelValue: value.value,
                'onUpdate:modelValue': (nextValue: string) => {
                  value.value = nextValue;
                },
              },
              {
                panel: ({ activeValue }: { activeValue: string }) => h('div', `active:${activeValue}`),
              },
            );
        },
      }),
      {
        attachTo: document.body,
      },
    );

    await wrapper.findAll('[role="tab"]')[1].trigger('click');
    await nextTick();

    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Settings');
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('active:settings');
  });

  it('does not render panel when panel slot is not provided', () => {
    const wrapper = mount(VfTabs, {
      attachTo: document.body,
      props: {
        items,
        defaultValue: 'overview',
      },
    });

    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false);
    expect(wrapper.get('[role="tab"]').attributes('aria-controls')).toBeUndefined();
  });

  it('supports stable ids for externally rendered panels', () => {
    const wrapper = mount(VfTabs, {
      props: {
        items: [
          {
            value: 'preview',
            label: 'Preview',
            tabId: 'playground-preview-tab',
            panelId: 'playground-preview-panel',
          },
        ],
      },
    });

    const tab = wrapper.get('[role="tab"]');
    expect(tab.attributes('id')).toBe('playground-preview-tab');
    expect(tab.attributes('aria-controls')).toBe('playground-preview-panel');
  });

  it('renders a moving indicator for the active tab', async () => {
    const wrapper = mount(VfTabs, {
      attachTo: document.body,
      props: {
        items,
        defaultValue: 'overview',
      },
      slots: {
        panel: ({ activeValue }: { activeValue: string }) => h('div', activeValue),
      },
    });

    await nextTick();

    const indicator = wrapper.get('.vf-tabs__indicator');
    expect(indicator.attributes('aria-hidden')).toBe('true');

    await wrapper.findAll('[role="tab"]')[1].trigger('click');
    await nextTick();

    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Settings');
    expect(wrapper.find('.vf-tabs__indicator').element).toBeTruthy();
  });

  it('supports custom tab label content via tab slot', async () => {
    const wrapper = mount(VfTabs, {
      attachTo: document.body,
      props: {
        items,
        defaultValue: 'overview',
      },
      slots: {
        tab: ({ item, isActive }: { item: { value: string; label: string }; isActive: boolean }) =>
          h('span', `${item.label}${isActive ? ' (active)' : ''}`),
      },
    });

    const tabButtons = wrapper.findAll('[role="tab"]');
    expect(tabButtons[0].text()).toBe('Overview (active)');
    expect(tabButtons[1].text()).toBe('Settings');

    await tabButtons[1].trigger('click');
    await nextTick();

    expect(wrapper.findAll('[role="tab"]')[1].text()).toBe('Settings (active)');
  });

  it('does not set variant data attribute', () => {
    const wrapper = mount(VfTabs, {
      attachTo: document.body,
      props: {
        items,
        defaultValue: 'overview',
      },
    });

    expect(wrapper.get('.vf-tabs').attributes('data-variant')).toBeUndefined();
  });

  it('shows scroll buttons when tab list is horizontally overflowed', async () => {
    const wrapper = mount(VfTabs, {
      attachTo: document.body,
      props: {
        items: [...items, { value: 'docs', label: 'Docs' }, { value: 'release', label: 'Release Notes' }],
        defaultValue: 'overview',
      },
    });

    const list = wrapper.get('.vf-tabs__list-scroller').element as HTMLElement;

    Object.defineProperty(list, 'clientWidth', {
      configurable: true,
      value: 120,
    });
    Object.defineProperty(list, 'scrollWidth', {
      configurable: true,
      value: 480,
    });
    Object.defineProperty(list, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 0,
    });

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(wrapper.find('.vf-tabs__scroll-button--right').exists()).toBe(true);
    expect(wrapper.get('.vf-tabs__scroll-button--left').classes('vf-tabs__scroll-button--hidden')).toBe(true);

    list.scrollLeft = 40;
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(wrapper.get('.vf-tabs__scroll-button--left').classes('vf-tabs__scroll-button--hidden')).toBe(false);
  });

  it('disables smooth scrolling when reduced motion is requested', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    const wrapper = mount(VfTabs, {
      props: {
        items: [...items, { value: 'docs', label: 'Docs' }],
      },
    });
    const list = wrapper.get('.vf-tabs__list-scroller').element as HTMLElement;
    const scrollTo = vi.fn();
    Object.defineProperties(list, {
      clientWidth: { configurable: true, value: 120 },
      scrollWidth: { configurable: true, value: 480 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
      scrollTo: { configurable: true, value: scrollTo },
    });

    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    await wrapper.get('.vf-tabs__scroll-button--right').trigger('click');

    expect(scrollTo).toHaveBeenCalledWith({ left: 120, behavior: 'auto' });
  });

  it('mirrors horizontal overflow controls in rtl', async () => {
    const wrapper = mount(VfTabs, {
      attrs: { dir: 'rtl' },
      props: {
        items: [...items, { value: 'docs', label: 'Docs' }],
      },
    });
    const list = wrapper.get('.vf-tabs__list-scroller').element as HTMLElement;
    list.style.direction = 'rtl';
    Object.defineProperties(list, {
      clientWidth: { configurable: true, value: 120 },
      scrollWidth: { configurable: true, value: 480 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(wrapper.get('.vf-tabs__scroll-button--left').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('.vf-tabs__scroll-button--right').attributes('disabled')).toBeDefined();

    list.scrollLeft = -40;
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(wrapper.get('.vf-tabs__scroll-button--right').attributes('disabled')).toBeUndefined();
  });
});
