/* eslint-disable vue/one-component-per-file */
import { computed, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  toMaxWidthQuery,
  toMinWidthQuery,
  useBreakpoint,
  useBreakpointValue,
  useBreakpoints,
  useScrollLock,
  vfBreakpoints,
} from './index';

function stubMatchMedia(queryMap: Record<string, boolean>) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: queryMap[query] ?? false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe('foundation', () => {
  it('exports canonical breakpoint queries', () => {
    expect(vfBreakpoints.md).toBe(768);
    expect(toMinWidthQuery(vfBreakpoints.lg)).toBe('(min-width: 1024px)');
    expect(toMaxWidthQuery(vfBreakpoints.md)).toBe('(max-width: 767.98px)');
  });

  it('tracks a single breakpoint query', async () => {
    stubMatchMedia({
      '(min-width: 768px)': true,
    });

    const wrapper = mount(
      defineComponent({
        setup() {
          const isMd = useBreakpoint('md');

          return () => h('div', { 'data-test': 'value' }, String(isMd.value));
        },
      }),
    );

    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-test="value"]').text()).toBe('true');
  });

  it('returns all breakpoint matches and resolves responsive values', async () => {
    stubMatchMedia({
      '(min-width: 480px)': true,
      '(min-width: 640px)': true,
      '(min-width: 768px)': true,
      '(min-width: 1024px)': false,
      '(min-width: 1280px)': false,
      '(min-width: 1536px)': false,
    });

    const wrapper = mount(
      defineComponent({
        setup() {
          const matches = useBreakpoints();
          const value = useBreakpointValue({
            base: 'base',
            sm: 'sm',
            md: 'md',
            lg: 'lg',
          });

          return () =>
            h('div', [
              h('span', { 'data-test': 'md' }, String(matches.value.md)),
              h('span', { 'data-test': 'lg' }, String(matches.value.lg)),
              h('span', { 'data-test': 'value' }, value.value),
            ]);
        },
      }),
    );

    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-test="md"]').text()).toBe('true');
    expect(wrapper.get('[data-test="lg"]').text()).toBe('false');
    expect(wrapper.get('[data-test="value"]').text()).toBe('md');
  });

  it('locks and restores body scroll', async () => {
    document.body.style.overflow = 'auto';

    const wrapper = mount(
      defineComponent({
        setup() {
          const enabled = ref(true);
          useScrollLock(computed(() => enabled.value));

          return () =>
            h('button', {
              'data-test': 'toggle',
              onClick: () => {
                enabled.value = !enabled.value;
              },
            });
        },
      }),
    );

    await wrapper.vm.$nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    await wrapper.get('[data-test="toggle"]').trigger('click');
    expect(document.body.style.overflow).toBe('auto');
  });

  it('compensates body padding for scrollbar width while locked', async () => {
    const originalInnerWidth = window.innerWidth;
    const originalClientWidth = document.documentElement.clientWidth;

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 1180,
    });

    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '10px';

    const wrapper = mount(
      defineComponent({
        setup() {
          const enabled = ref(true);
          useScrollLock(computed(() => enabled.value));

          return () =>
            h('button', {
              'data-test': 'toggle',
              onClick: () => {
                enabled.value = !enabled.value;
              },
            });
        },
      }),
    );

    await wrapper.vm.$nextTick();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).toBe('30px');

    await wrapper.get('[data-test="toggle"]').trigger('click');
    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.paddingRight).toBe('10px');

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: originalClientWidth,
    });
  });
});
