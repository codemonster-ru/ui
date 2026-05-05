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
      (section.element as HTMLElement).getBoundingClientRect = () =>
        ({
          top,
          bottom: top + 80,
          left: 0,
          right: 0,
          width: 0,
          height: 80,
          x: 0,
          y: top,
          toJSON: () => ({}),
        }) as DOMRect;
    }

    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.activeId).toBe('section-1');

    (sections[0]!.element as HTMLElement).getBoundingClientRect = () =>
      ({
        top: -120,
        bottom: -40,
        left: 0,
        right: 0,
        width: 0,
        height: 80,
        x: 0,
        y: -120,
        toJSON: () => ({}),
      }) as DOMRect;

    (sections[1]!.element as HTMLElement).getBoundingClientRect = () =>
      ({
        top: 24,
        bottom: 104,
        left: 0,
        right: 0,
        width: 0,
        height: 80,
        x: 0,
        y: 24,
        toJSON: () => ({}),
      }) as DOMRect;

    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.activeId).toBe('section-2');
  });
});
