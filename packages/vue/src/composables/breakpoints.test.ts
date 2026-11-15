import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, h, nextTick, reactive, shallowRef } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { useBreakpoint, useBreakpoints, useBreakpointValue, type UseBreakpointOptions } from './breakpoints';

function mediaFixture(width: number) {
  const current = new Map<string, (EventTarget & { matches: boolean })[]>();
  const matches = (query: string) => {
    const threshold = Number(/([\d.]+)px/.exec(query)?.[1]);
    return query.startsWith('(min-width') ? width >= threshold : width <= threshold;
  };
  const matchMedia = vi.fn((query: string) => {
    const target = Object.assign(new EventTarget(), { matches: matches(query) });
    const existing = current.get(query) ?? [];
    current.set(query, [...existing, target]);
    return target;
  });
  return {
    current,
    matchMedia,
    resize: (nextWidth: number) => {
      width = nextWidth;
      for (const [query, targets] of current) {
        for (const target of targets) {
          target.matches = matches(query);
          target.dispatchEvent(new Event('change'));
        }
      }
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

it('renders base values and every unanswered breakpoint on the server', async () => {
  const matchMedia = vi.fn();
  vi.stubGlobal('matchMedia', matchMedia);
  const app = createSSRApp({
    setup() {
      const one = useBreakpoint('xs');
      const all = useBreakpoints();
      const value = useBreakpointValue({ base: 'base', xs: 'xs' });
      return () => h('output', `${one.value}:${value.value}:${Object.values(all.value).join(',')}`);
    },
  });
  expect(await renderToString(app)).toBe('<output>false:base:false,false,false,false,false,false</output>');
  expect(matchMedia).not.toHaveBeenCalled();
});

it('replaces a query on reactive direction and width changes and removes its listener before unmount', async () => {
  const { current, matchMedia, resize } = mediaFixture(768);
  vi.stubGlobal('matchMedia', matchMedia);
  const width = shallowRef<'md' | number>('md');
  const options = reactive<UseBreakpointOptions>({ direction: 'min' });
  const wrapper = mount({
    setup() {
      const value = useBreakpoint(() => width.value, options);
      return () => h('output', String(value.value));
    },
  });
  await nextTick();
  expect(wrapper.text()).toBe('true');
  expect(matchMedia).toHaveBeenLastCalledWith('(min-width: 768px)');
  const initial = current.get('(min-width: 768px)')?.[0];
  if (!initial) throw new Error('No initial media query registered');
  const unlisten = vi.spyOn(initial, 'removeEventListener');

  options.direction = 'max';
  await nextTick();
  expect(unlisten).toHaveBeenCalledWith('change', expect.any(Function));
  expect(matchMedia).toHaveBeenLastCalledWith('(max-width: 767.98px)');
  expect(wrapper.text()).toBe('false');
  resize(767.98);
  await nextTick();
  expect(wrapper.text()).toBe('true');

  width.value = 700;
  await nextTick();
  expect(matchMedia).toHaveBeenLastCalledWith('(max-width: 699.98px)');
  expect(wrapper.text()).toBe('false');
  const active = current.get('(max-width: 699.98px)')?.[0];
  if (!active) throw new Error('No numeric media query registered');
  const dispose = vi.spyOn(active, 'removeEventListener');
  wrapper.unmount();
  expect(dispose).toHaveBeenCalledWith('change', expect.any(Function));
});

it('chooses the highest present override in registry order as the viewport and values change', async () => {
  const { matchMedia, resize } = mediaFixture(1024);
  vi.stubGlobal('matchMedia', matchMedia);
  const values = shallowRef({ xl: 'wide', base: 'base', md: 'medium', sm: 'small' });
  const wrapper = mount({
    setup() {
      const all = useBreakpoints();
      const value = useBreakpointValue(values);
      return () =>
        h(
          'output',
          [value.value, ...Object.keys(all.value).filter((key) => all.value[key as keyof typeof all.value])].join(':'),
        );
    },
  });
  await nextTick();
  expect(wrapper.text()).toBe('medium:xs:sm:md:lg');

  resize(1536);
  await nextTick();
  expect(wrapper.text()).toBe('wide:xs:sm:md:lg:xl:2xl');
  values.value = { ...values.value, xl: 'expanded' };
  await nextTick();
  expect(wrapper.text()).toBe('expanded:xs:sm:md:lg:xl:2xl');

  resize(390);
  await nextTick();
  expect(wrapper.text()).toBe('base');
  wrapper.unmount();
});

it('reads the viewport where the component mounts and stays false without matchMedia', async () => {
  const outer = vi.fn();
  vi.stubGlobal('matchMedia', outer);
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const view = frame.contentWindow;
  if (!view) throw new Error('No iframe viewport');
  const { matchMedia } = mediaFixture(1024);
  Object.defineProperty(view, 'matchMedia', { value: matchMedia, configurable: true });
  const component = {
    setup() {
      const matches = useBreakpoint('lg');
      return () => h('output', String(matches.value));
    },
  };
  const inner = mount(component, { attachTo: view.document.body });
  await nextTick();
  expect(inner.text()).toBe('true');
  expect(outer).not.toHaveBeenCalled();
  expect(matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  inner.unmount();
  frame.remove();

  vi.stubGlobal('matchMedia', undefined);
  const fallback = mount(component);
  await nextTick();
  expect(fallback.text()).toBe('false');
  fallback.unmount();
});
