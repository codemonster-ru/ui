import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref, type Ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toMaxWidthQuery, useBreakpoint, useBreakpointValue, useCssVarBreakpoints } from './breakpoints';

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('style');
});

function output<T>(get: () => Readonly<Ref<T>>, format: (value: T) => string = String) {
  return defineComponent({
    setup() {
      const value = get();
      return () => h('output', format(value.value));
    },
  });
}

describe('layout breakpoints', () => {
  it('updates when a media query changes and replaces a previous subscription when the prop changes', async () => {
    const media = new Map<string, EventTarget & { matches: boolean }>();
    const matchMedia = vi.fn((query: string) => {
      const result = Object.assign(new EventTarget(), { matches: query === toMaxWidthQuery(768) });
      media.set(query, result);
      return result;
    });
    vi.stubGlobal('matchMedia', matchMedia);
    const breakpoint = ref<'md' | 'lg'>('md');
    const element = output(() => useBreakpoint(breakpoint, { direction: 'max' }));
    const wrapper = mount(element);
    await nextTick();
    expect(matchMedia).toHaveBeenLastCalledWith('(max-width: 767.98px)');
    expect(wrapper.text()).toBe('true');
    breakpoint.value = 'lg';
    await nextTick();
    expect(matchMedia).toHaveBeenLastCalledWith('(max-width: 1023.98px)');
    expect(wrapper.text()).toBe('false');
    const previous = media.get(toMaxWidthQuery(768));
    previous?.dispatchEvent(new Event('change'));
    await nextTick();
    expect(wrapper.text()).toBe('false');

    const active = media.get(toMaxWidthQuery(1024));
    expect(active).toBeDefined();
    if (active) active.matches = true;
    active?.dispatchEvent(new Event('change'));
    await nextTick();
    expect(wrapper.text()).toBe('true');
    const cleanup = vi.spyOn(active!, 'removeEventListener');
    wrapper.unmount();
    expect(cleanup).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('renders a base breakpoint value on the server and chooses the largest active override once mounted', async () => {
    vi.stubGlobal('matchMedia', (query: string) =>
      Object.assign(new EventTarget(), { matches: /^\(min-width: (480|640|768)px\)$/u.test(query) }),
    );
    const component = output(() => useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 }));
    expect(await renderToString(h(component))).toBe('<output>1</output>');
    const wrapper = mount(component);
    await nextTick();
    expect(wrapper.text()).toBe('3');
    wrapper.unmount();
  });

  it('reads pixels and root-relative lengths from both the shared and historical CSS properties', async () => {
    const root = document.documentElement;
    root.style.setProperty('font-size', '20px');
    root.style.setProperty('--cm-breakpoint-md', '35rem');
    root.style.setProperty('--vf-breakpoint-lg', '900px');
    const component = output(useCssVarBreakpoints, (widths) => [widths.md, widths.lg].join('/'));
    const wrapper = mount(component);
    await nextTick();
    expect(wrapper.text()).toBe('700/900');
    wrapper.unmount();
  });
});
