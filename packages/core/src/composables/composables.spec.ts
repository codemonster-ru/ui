/* eslint-disable vue/one-component-per-file */
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { offset } from '@codemonster-ru/floater.js';
import { useClickOutside } from './useClickOutside';
import { useDisclosure } from './useDisclosure';
import { useEscapeKey } from './useEscapeKey';
import { useFloating } from './useFloating';
import { useId } from './useId';
import { useTableOfContents } from './useTableOfContents';

const TableOfContentsProbe = defineComponent({
  setup() {
    const { activeId } = useTableOfContents({
      items: [
        { id: 'section-1', label: 'Section 1' },
        { id: 'section-2', label: 'Section 2' },
        { id: 'section-3', label: 'Section 3' },
      ],
      offset: 96,
    });

    return { activeId };
  },
  render() {
    return h('div', [
      h('section', { id: 'section-1' }, 'One'),
      h('section', { id: 'section-2' }, 'Two'),
      h('section', { id: 'section-3' }, 'Three'),
    ]);
  },
});

const ReactiveTableOfContentsProbe = defineComponent({
  setup() {
    const items = ref<{ id: string; label: string }[]>([]);
    const renderHeadings = ref(true);
    const offsetValue = ref(0);
    const { activeId } = useTableOfContents({
      items,
      offset: offsetValue,
    });

    function setItems(nextItems: { id: string; label: string }[]) {
      items.value = nextItems;
    }

    function setOffset(nextOffset: number) {
      offsetValue.value = nextOffset;
    }

    function setRenderHeadings(nextRenderHeadings: boolean) {
      renderHeadings.value = nextRenderHeadings;
    }

    return { activeId, items, renderHeadings, setItems, setOffset, setRenderHeadings };
  },
  render() {
    return h(
      'div',
      this.renderHeadings
        ? this.items.map((item) => h('section', { id: item.id }, item.label))
        : undefined,
    );
  },
});

function rectWithTop(top: number): DOMRect {
  return {
    top,
    bottom: top + 80,
    left: 0,
    right: 0,
    width: 0,
    height: 80,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function animationFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function tableOfContentsScheduledUpdate(): Promise<void> {
  await animationFrame();
  await animationFrame();
}

describe('interaction composables', () => {
  it('manages uncontrolled and controlled disclosure state', async () => {
    const onOpenChange = vi.fn();

    const uncontrolled = useDisclosure({
      defaultOpen: true,
      onOpenChange,
    });

    expect(uncontrolled.isOpen.value).toBe(true);

    uncontrolled.close();
    expect(uncontrolled.isOpen.value).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);

    const controlledValue = ref(false);
    const controlled = useDisclosure({
      open: controlledValue,
      onOpenChange,
    });

    controlled.open();
    expect(controlled.isOpen.value).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    controlledValue.value = true;
    expect(controlled.isOpen.value).toBe(true);
  });

  it('generates stable ids and respects provided ids', () => {
    const generated = useId({ prefix: 'dialog' });
    const provided = useId({ prefix: 'dialog', providedId: 'custom-id' });

    expect(generated.value).toMatch(/^dialog-\d+$/);
    expect(generated.value).toBe(generated.value);
    expect(provided.value).toBe('custom-id');
  });

  it('fires click outside only for clicks outside the target', async () => {
    const onOutside = vi.fn();

    const wrapper = mount(
      defineComponent({
        setup() {
          const target = ref<HTMLElement | null>(null);
          useClickOutside(target, onOutside, { event: 'mousedown' });

          return { target };
        },
        render() {
          return h('div', [
            h('div', { ref: 'target', 'data-test': 'inside' }, 'inside'),
            h('button', { 'data-test': 'outside' }, 'outside'),
          ]);
        },
      }),
      {
        attachTo: document.body,
      },
    );

    const inside = wrapper.get('[data-test="inside"]').element;
    const outside = wrapper.get('[data-test="outside"]').element;

    inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    expect(onOutside).not.toHaveBeenCalled();

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('fires escape handler only for Escape key presses', async () => {
    const onEscape = vi.fn();

    mount(
      defineComponent({
        setup() {
          useEscapeKey(onEscape);
          return () => h('div');
        },
      }),
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onEscape).not.toHaveBeenCalled();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('computes floating styles when enabled', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const reference = ref<HTMLElement | null>(null);
          const floating = ref<HTMLElement | null>(null);
          const result = useFloating(reference, floating, {
            enabled: true,
            placement: 'bottom',
            middleware: [offset(8)],
          });

          return {
            reference,
            floating,
            styles: result.styles,
            placement: result.placement,
          };
        },
        render() {
          return h('div', [
            h('button', { ref: 'reference' }, 'ref'),
            h('div', { ref: 'floating', style: 'position: absolute;' }, 'float'),
          ]);
        },
      }),
      {
        attachTo: document.body,
      },
    );

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.vm.styles.left).toContain('px');
    expect(wrapper.vm.styles.top).toContain('px');
    expect(wrapper.vm.placement).toBeTypeOf('string');
  });

  it('tracks the active heading for table of contents items', async () => {
    const wrapper = mount(TableOfContentsProbe, {
      attachTo: document.body,
    });

    const sections = wrapper.findAll('section');
    const positions = [40, 120, 420];

    for (const [index, section] of sections.entries()) {
      const top = positions[index] ?? 0;
      (section.element as HTMLElement).getBoundingClientRect = () => rectWithTop(top);
    }

    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.activeId).toBe('section-1');

    (sections[0]!.element as HTMLElement).getBoundingClientRect = () =>
      rectWithTop(-120);

    (sections[1]!.element as HTMLElement).getBoundingClientRect = () =>
      rectWithTop(24);

    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.activeId).toBe('section-2');
  });

  it('recomputes the active heading after items and offset change without scroll', async () => {
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this.id === 'section-1') {
        return rectWithTop(-120);
      }

      if (this.id === 'section-2') {
        return rectWithTop(24);
      }

      return originalGetBoundingClientRect.call(this);
    };

    try {
      const wrapper = mount(ReactiveTableOfContentsProbe, {
        attachTo: document.body,
      });

      await wrapper.vm.$nextTick();
      expect(wrapper.vm.activeId).toBeUndefined();

      wrapper.vm.setItems([
        { id: 'section-1', label: 'Section 1' },
        { id: 'section-2', label: 'Section 2' },
      ]);
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await animationFrame();

      expect(wrapper.vm.activeId).toBe('section-1');

      wrapper.vm.setOffset(96);
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await animationFrame();

      expect(wrapper.vm.activeId).toBe('section-2');
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });

  it('observes delayed heading elements after scheduled active heading updates miss them', async () => {
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this.id === 'delayed-section') {
        return rectWithTop(24);
      }

      return originalGetBoundingClientRect.call(this);
    };

    try {
      const wrapper = mount(ReactiveTableOfContentsProbe, {
        attachTo: document.body,
      });

      wrapper.vm.setRenderHeadings(false);
      wrapper.vm.setItems([{ id: 'delayed-section', label: 'Delayed section' }]);
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await tableOfContentsScheduledUpdate();

      expect(wrapper.vm.activeId).toBeUndefined();

      wrapper.vm.setRenderHeadings(true);
      await wrapper.vm.$nextTick();
      await Promise.resolve();

      expect(wrapper.vm.activeId).toBe('delayed-section');
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });
});
