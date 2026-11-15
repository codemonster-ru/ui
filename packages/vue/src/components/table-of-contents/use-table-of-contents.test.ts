import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { useTableOfContents, type UseTableOfContentsOptions } from './use-table-of-contents';

function addHeading(id: string, top: () => number): void {
  const heading = document.createElement('h2');
  heading.id = id;
  heading.dataset.tocTest = '';
  heading.getBoundingClientRect = () => ({ top: top() }) as DOMRect;
  document.body.append(heading);
}

function frames() {
  let nextId = 0;
  const pending = new Map<number, FrameRequestCallback>();
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = ++nextId;
    pending.set(id, callback);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    pending.delete(id);
  });
  return {
    pending,
    flush() {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) callback(0);
    },
  };
}

function tracker(options: UseTableOfContentsOptions) {
  return mount(
    defineComponent({
      setup: () => useTableOfContents(options),
      render(): ReturnType<typeof h> {
        return h('output', this.activeId ?? 'none');
      },
    }),
  );
}

afterEach(() => {
  document.querySelectorAll('[data-toc-test]').forEach((heading) => heading.remove());
  vi.restoreAllMocks();
});

it('starts without an active section during server rendering', async () => {
  addHeading('setup', () => 0);
  const app = createSSRApp({
    setup() {
      const { activeId, updateActiveId } = useTableOfContents({ items: [{ id: 'setup', label: 'Setup' }] });
      expect(updateActiveId()).toBe(false);
      return () => h('output', activeId.value ?? 'none');
    },
  });
  expect(await renderToString(app)).toBe('<output>none</output>');
});

it('chooses the first available heading and responds to a reactive offset, viewport changes and disabling', async () => {
  const frame = frames();
  const offset = ref(64);
  const disabled = ref(false);
  let firstTop = 100;
  let lastTop = 180;
  addHeading('intro', () => firstTop);
  addHeading('setup', () => lastTop);
  const wrapper = tracker({
    items: [
      { id: 'unmounted', label: 'Missing' },
      { id: 'intro', label: 'Intro' },
      { id: 'setup', label: 'Setup' },
    ],
    offset: () => offset.value,
    disabled,
  });

  frame.flush();
  await nextTick();
  expect(wrapper.text()).toBe('intro');

  offset.value = 180;
  await nextTick();
  frame.flush();
  await nextTick();
  expect(wrapper.text()).toBe('setup');

  lastTop = 190;
  window.dispatchEvent(new Event('resize'));
  await nextTick();
  expect(wrapper.text()).toBe('intro');

  firstTop = 50;
  lastTop = 90;
  window.dispatchEvent(new Event('scroll'));
  await nextTick();
  expect(wrapper.text()).toBe('setup');

  disabled.value = true;
  await nextTick();
  frame.flush();
  await nextTick();
  expect(wrapper.text()).toBe('none');
  expect(wrapper.vm.updateActiveId()).toBe(true);
  wrapper.unmount();
});

it('clears an old section, discovers a late heading and releases pending tracking on unmount', async () => {
  const frame = frames();
  const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
  const removeListener = vi.spyOn(window, 'removeEventListener');
  const items = ref([{ id: 'setup', label: 'Setup' }]);
  addHeading('setup', () => 0);
  const wrapper = tracker({ items });
  frame.flush();
  await nextTick();
  expect(wrapper.text()).toBe('setup');

  items.value = [{ id: 'examples', label: 'Examples' }];
  await nextTick();
  frame.flush();
  await nextTick();
  expect(wrapper.text()).toBe('none');
  addHeading('examples', () => 0);
  await vi.waitFor(() => expect(wrapper.text()).toBe('examples'));
  expect(disconnect).toHaveBeenCalledTimes(1);

  items.value = [{ id: 'future', label: 'Future' }];
  await nextTick();
  expect(frame.pending.size).toBe(1);
  wrapper.unmount();
  expect(frame.pending.size).toBe(0);
  for (const event of ['scroll', 'resize', 'hashchange']) {
    expect(removeListener).toHaveBeenCalledWith(event, expect.any(Function));
  }
});
