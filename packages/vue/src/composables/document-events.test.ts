/* eslint-disable vue/one-component-per-file -- The tests mount independent and nested views. */
import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, defineComponent, h, nextTick, shallowRef, Teleport } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { useClickOutside, useEscapeKey } from './document-events';

function mouse(target: EventTarget, type = 'pointerdown'): MouseEvent {
  const event = new MouseEvent(type, { bubbles: true, composed: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function key(target: EventTarget, key = 'Escape', type = 'keydown'): KeyboardEvent {
  const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => vi.restoreAllMocks());

it('reads current click targets and enabled state while preserving original native events', async () => {
  const button = shallowRef<HTMLElement | null>(null);
  const panel = shallowRef<HTMLElement | null>(null);
  const shown = shallowRef(true);
  const enabled = shallowRef(true);
  const outside = vi.fn(() => {
    enabled.value = false;
    mouse(document.body, 'mousedown');
  });
  const view = mount(
    defineComponent({
      setup() {
        useClickOutside([button, panel], outside, { enabled: () => enabled.value, event: 'mousedown' });
        return () =>
          h('main', [
            shown.value ? h('button', { ref: button }) : null,
            h(Teleport, { to: document.body }, shown.value ? [h('aside', { ref: panel })] : []),
          ]);
      },
    }),
    { attachTo: document.body },
  );
  mouse(button.value!, 'mousedown');
  mouse(panel.value!, 'mousedown');
  mouse(document.body);
  expect(outside).not.toHaveBeenCalled();
  const event = mouse(document.body, 'mousedown');
  expect(outside).toHaveBeenCalledExactlyOnceWith(event);
  expect(event.defaultPrevented).toBe(false);

  shown.value = false;
  enabled.value = true;
  await nextTick();
  mouse(document.body, 'mousedown');
  expect(outside).toHaveBeenCalledTimes(1);
  view.unmount();
  mouse(document.body, 'mousedown');
  expect(outside).toHaveBeenCalledTimes(1);
});

it('treats native clicks from an open shadow target as inside and removes the mounted listener', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const button = document.createElement('button');
  shadow.append(button);
  const target = shallowRef<HTMLElement | null>(button);
  const outside = vi.fn();
  const addListener = vi.spyOn(document, 'addEventListener');
  const removeListener = vi.spyOn(document, 'removeEventListener');
  const view = mount({
    setup() {
      useClickOutside(target, outside);
      return () => h('span');
    },
  });
  mouse(button);
  expect(outside).not.toHaveBeenCalled();
  target.value = host;
  mouse(button);
  expect(outside).not.toHaveBeenCalled();
  const outsideEvent = mouse(document.body);
  expect(outside).toHaveBeenCalledExactlyOnceWith(outsideEvent);
  view.unmount();
  const listener = addListener.mock.calls.find(([event]) => event === 'pointerdown')?.[1];
  expect(listener).toBeTypeOf('function');
  expect(removeListener).toHaveBeenCalledWith('pointerdown', listener);
  mouse(document.body);
  expect(outside).toHaveBeenCalledTimes(1);
  host.remove();
});

it('runs the latest enabled Escape handler once through nested and re-entrant updates', async () => {
  const showsChild = shallowRef(false);
  const childEnabled = shallowRef(true);
  const parentLevel = shallowRef(1);
  const captures: string[] = [];
  const addListener = vi.spyOn(document, 'addEventListener');
  const removeListener = vi.spyOn(document, 'removeEventListener');
  const child = defineComponent({
    setup() {
      useEscapeKey(
        (event) => {
          captures.push('child');
          event.preventDefault();
          childEnabled.value = false;
          key(document);
        },
        { enabled: childEnabled },
      );
      return () => h('section');
    },
  });
  const view = mount({
    setup() {
      useEscapeKey(() => captures.push('parent'), { enabled: () => parentLevel.value > 0 });
      useEscapeKey(() => captures.push('keyup'), { event: 'keyup' });
      return () => h('main', showsChild.value ? [h(child)] : []);
    },
  });

  const prevented = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
  prevented.preventDefault();
  document.dispatchEvent(prevented);
  key(document, 'Enter');
  expect(captures).toEqual([]);

  showsChild.value = true;
  await nextTick();
  parentLevel.value = 2;
  const escape = key(document);
  expect(captures).toEqual(['child', 'parent']);
  expect(escape.defaultPrevented).toBe(true);
  key(document, 'Escape', 'keyup');
  expect(captures).toEqual(['child', 'parent', 'keyup']);

  const listeners = addListener.mock.calls.filter(([event]) => event === 'keydown');
  expect(listeners).toHaveLength(1);
  view.unmount();
  expect(removeListener).toHaveBeenCalledWith('keydown', listeners[0]?.[1]);
  key(document);
  key(document, 'Escape', 'keyup');
  expect(captures).toEqual(['child', 'parent', 'keyup']);
});

it('uses separate native listeners for apps mounted in separate documents', () => {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const inner = frame.contentDocument!;
  const innerEscape = vi.fn();
  const outerEscape = vi.fn();
  const outside = vi.fn();
  const innerApp = mount(
    {
      setup() {
        const root = shallowRef<HTMLElement | null>(null);
        useEscapeKey(innerEscape);
        useClickOutside(root, outside);
        return () => h('button', { ref: root });
      },
    },
    { attachTo: inner.body },
  );
  const outerApp = mount({
    setup() {
      useEscapeKey(outerEscape);
      return () => h('button');
    },
  });
  key(inner);
  key(document);
  mouse(innerApp.get<HTMLButtonElement>('button').element);
  mouse(document.body);
  mouse(inner.body);
  expect(innerEscape).toHaveBeenCalledTimes(1);
  expect(outerEscape).toHaveBeenCalledTimes(1);
  expect(outside).toHaveBeenCalledTimes(1);
  innerApp.unmount();
  outerApp.unmount();
  frame.remove();
});

it('renders on the server without registering document listeners', async () => {
  const listen = vi.spyOn(document, 'addEventListener');
  const app = createSSRApp({
    setup() {
      useClickOutside(shallowRef(null), vi.fn());
      useEscapeKey(vi.fn());
      return () => h('p', 'Server output');
    },
  });

  expect(await renderToString(app)).toBe('<p>Server output</p>');
  expect(listen).not.toHaveBeenCalledWith('pointerdown', expect.any(Function));
  expect(listen).not.toHaveBeenCalledWith('keydown', expect.any(Function));
});
