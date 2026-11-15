import { autoUpdate, computePosition } from '@codemonster-ru/floater.js';
import { renderToString } from '@vue/server-renderer';
import { flushPromises, mount } from '@vue/test-utils';
import { createSSRApp, h, nextTick, shallowRef } from 'vue';
import { beforeEach, expect, it, vi } from 'vitest';
import { useFloating, type UseFloatingOptions } from './floating';

vi.mock('@codemonster-ru/floater.js', () => ({
  autoUpdate: vi.fn(),
  computePosition: vi.fn(),
}));

type Position = Awaited<ReturnType<typeof computePosition>>;
const position = vi.mocked(computePosition);
const observe = vi.mocked(autoUpdate);

function pendingPosition() {
  let resolve!: (value: Position) => void;
  const promise = new Promise<Position>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

function elements() {
  return {
    anchor: shallowRef<HTMLElement | null>(document.createElement('button')),
    panel: shallowRef<HTMLElement | null>(document.createElement('div')),
  };
}

function setup(options?: UseFloatingOptions) {
  const { anchor, panel } = elements();
  let result: ReturnType<typeof useFloating> | undefined;
  const wrapper = mount({
    setup() {
      result = useFloating(anchor, panel, options);
      return () => h('span');
    },
  });
  if (!result) throw new Error('The component did not set up its position');
  return { anchor, panel, result, wrapper };
}

beforeEach(() => {
  observe.mockReset();
  position.mockReset();
  observe.mockImplementation(() => vi.fn());
});

it('uses the initial placement and zero coordinates without measuring on the server', async () => {
  const { anchor, panel } = elements();
  const app = createSSRApp({
    setup() {
      const result = useFloating(anchor, panel, { placement: 'left-start' });
      void result.update();
      return () => h('div', { style: result.styles.value }, result.placement.value);
    },
  });

  expect(await renderToString(app)).toBe('<div style="left:0px;top:0px;">left-start</div>');
  expect(position).not.toHaveBeenCalled();
  expect(observe).not.toHaveBeenCalled();
});

it('reports measured coordinates and reacts to enabled, placement, middleware, and strategy', async () => {
  const enabled = shallowRef(false);
  const placement = shallowRef<'bottom-start' | 'top-end'>('bottom-start');
  const strategy = shallowRef<'absolute' | 'fixed'>('fixed');
  const middleware = shallowRef<Extract<UseFloatingOptions['middleware'], unknown[]>>();
  const stop = vi.fn();
  observe.mockReturnValue(stop);
  position.mockResolvedValue({ x: 20, y: 40, placement: 'bottom-end', middlewareData: {} });
  const { anchor, panel, result, wrapper } = setup({ enabled, placement: () => placement.value, strategy, middleware });

  expect(observe).not.toHaveBeenCalled();
  await result.update();
  expect(result.x.value).toBe(20);
  expect(result.y.value).toBe(40);
  expect(result.styles.value).toEqual({ left: '20px', top: '40px' });
  expect(result.placement.value).toBe('bottom-end');
  expect(position).toHaveBeenLastCalledWith(anchor.value, panel.value, {
    placement: 'bottom-start',
    middleware: undefined,
    strategy: 'fixed',
  });

  enabled.value = true;
  await nextTick();
  expect(observe).toHaveBeenLastCalledWith(anchor.value, expect.any(Function), panel.value);
  placement.value = 'top-end';
  strategy.value = 'absolute';
  middleware.value = [{ name: 'extra-gap', fn: ({ x, y, placement: side }) => ({ x, y: y + 4, placement: side }) }];
  const arrow = { x: -8, y: 12, placement: 'top-end' as const, arrowX: 4 };
  position.mockResolvedValue({ x: -8, y: 12, placement: 'top-end', middlewareData: { arrow } });
  await nextTick();
  await flushPromises();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(position).toHaveBeenLastCalledWith(anchor.value, panel.value, {
    placement: 'top-end',
    middleware: middleware.value,
    strategy: 'absolute',
  });
  expect(result.styles.value).toEqual({ left: '-8px', top: '12px' });
  expect(result.middlewareData.value).toEqual({ arrow });
  wrapper.unmount();
  expect(stop).toHaveBeenCalledTimes(2);
});

it('ignores old measurements after a changed panel, cleanup, or unmount', async () => {
  const first = pendingPosition();
  position.mockReturnValueOnce(first.promise);
  position.mockResolvedValue({ x: 7, y: 8, placement: 'bottom', middlewareData: {} });
  const stop = vi.fn();
  observe.mockReturnValue(stop);
  const { anchor, panel, result, wrapper } = setup();

  panel.value = document.createElement('section');
  await nextTick();
  await flushPromises();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(observe).toHaveBeenLastCalledWith(anchor.value, expect.any(Function), panel.value);
  first.resolve({ x: 99, y: 99, placement: 'bottom', middlewareData: {} });
  await flushPromises();
  expect(result.styles.value).toEqual({ left: '7px', top: '8px' });

  const pending = pendingPosition();
  position.mockReturnValueOnce(pending.promise);
  const finished = result.update();
  result.cleanup();
  const callsAfterCleanup = position.mock.calls.length;
  observe.mock.calls[1]?.[1]();
  expect(position).toHaveBeenCalledTimes(callsAfterCleanup);
  pending.resolve({ x: 100, y: 100, placement: 'bottom', middlewareData: {} });
  await finished;
  expect(stop).toHaveBeenCalledTimes(2);
  expect(result.styles.value).toEqual({ left: '7px', top: '8px' });

  const afterUnmount = pendingPosition();
  position.mockReturnValueOnce(afterUnmount.promise);
  const abandoned = result.update();
  wrapper.unmount();
  afterUnmount.resolve({ x: 101, y: 101, placement: 'bottom', middlewareData: {} });
  await abandoned;
  expect(result.styles.value).toEqual({ left: '7px', top: '8px' });
  const calls = position.mock.calls.length;
  await result.update();
  expect(position).toHaveBeenCalledTimes(calls);
});
