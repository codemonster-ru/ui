// Characterization of the historical VfPopover at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The second migrated overlay, and the first to share the page-wide escape
// stack with a different component. It looks like VfDropdown - an owned
// trigger wrapper, a panel teleported out of the root, floater.js, the same
// transition - and the differences are exactly where a port copied from the
// dropdown would go wrong. Measured, not assumed:
//
//   - the panel is `section[role=dialog][tabindex=-1]`, labelled by the
//     trigger, and the trigger announces `aria-haspopup="dialog"`. There is no
//     `disabled` and no `variant`;
//   - Enter and Space on the trigger *toggle*: an open popover closes. Only
//     ArrowDown opens without toggling, and it opens again - notifying again -
//     when the popover is already open. Every one of the three is prevented.
//     ArrowUp, Home, End, Tab and Escape on the trigger are not handled;
//   - every open that goes through the component - click, Enter, Space,
//     ArrowDown - moves focus into the panel after the render: to the first
//     element matching `[autofocus], [data-autofocus]` in document order, or
//     else to the panel itself. An initial `defaultOpen`, or a parent writing
//     `open`, moves nothing;
//   - every close the component initiates focuses the trigger: a second trigger
//     click, Enter or Space, Escape, an outside click and the `close` slot
//     function. A parent writing `open=false` moves nothing;
//   - a click inside the panel does nothing: there is no closeOnSelect;
//   - the outside event is a document `click`, gated by closeOnOutsideClick;
//   - Escape uses the shared LIFO stack of useEscapeKey - the same one every
//     VfDropdown is on. With closeOnEscape=false an open popover is still an
//     entry: when it is on top it takes the Escape, does nothing and prevents
//     nothing, and the entry below never sees it;
//   - closing a popover unmounts its content, and a VfDropdown inside goes with
//     it: its teleported menu leaves <body> and its escape entry leaves the
//     stack, whether or not the dropdown was open.
//
// Real-browser facts jsdom cannot show - focusability of the tabindex=-1
// panel, the geometry floater.js computes, what Chrome exposes in its
// accessibility tree - are measured by the three-way parity catalog
// (contracts/popover/cases.json) and recorded in the M30 appendix.
import { mount, flushPromises } from '@vue/test-utils';
import { renderToString, type SSRContext } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, nextTick, ref, type Component } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import VfPopover from './VfPopover.vue';
import VfDropdown from '@/components/dropdown/VfDropdown.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';

type FloaterModule = typeof import('@codemonster-ru/floater.js');
type ComputeArguments = Parameters<FloaterModule['computePosition']>;

// A transparent recorder around the real floater.js, as in the dropdown suite.
const floating = vi.hoisted(() => ({
  fake: null as null | ((...args: ComputeArguments) => unknown),
  calls: [] as { reference: Element; floating: HTMLElement; options: Record<string, unknown> }[],
  autoUpdates: [] as { reference: Element; argumentCount: number }[],
  cleanups: 0,
}));

vi.mock('@codemonster-ru/floater.js', async (importOriginal) => {
  const real = await importOriginal<FloaterModule>();

  return {
    ...real,
    computePosition: (...args: ComputeArguments) => {
      const [reference, floatingElement, options] = args;
      floating.calls.push({
        reference: reference as Element,
        floating: floatingElement,
        options: options as Record<string, unknown>,
      });
      return floating.fake ? Promise.resolve(floating.fake(...args)) : real.computePosition(...args);
    },
    autoUpdate: (...args: Parameters<FloaterModule['autoUpdate']>) => {
      floating.autoUpdates.push({ reference: args[0] as Element, argumentCount: args.length });
      const cleanup = real.autoUpdate(...args);
      return () => {
        floating.cleanups += 1;
        cleanup();
      };
    },
  };
});

// Instant enter and leave, with no wrapper element of the stub's own. The real
// transition is pinned in its own section.
const InstantTransition = defineComponent({
  inheritAttrs: false,
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.(),
});

const BODY = '<p class="body">Body</p><button type="button" class="inside">Inside</button>';

interface MountOptions {
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  realTransition?: boolean;
}

function mountPopover({ props = {}, attrs = {}, slots = {}, realTransition = false }: MountOptions = {}) {
  return mount(VfPopover, {
    props,
    attrs,
    slots: { trigger: '<span class="label">Details</span>', default: BODY, ...slots } as never,
    attachTo: document.body.appendChild(document.createElement('div')),
    global: { stubs: { transition: realTransition ? false : InstantTransition } },
  });
}

type Wrapper = ReturnType<typeof mountPopover>;

const triggerOf = (wrapper: Wrapper) => wrapper.get('.vf-popover__trigger').element as HTMLElement;
const contentOf = (wrapper: Wrapper) => document.getElementById(triggerOf(wrapper).getAttribute('aria-controls') ?? '');
const labelOf = (element: Element | null) => (element?.textContent ?? '').trim();
const last = <T>(list: readonly T[]) => list[list.length - 1];

/** Every open/close emit in the order it happened, across both event names. */
function recordEmits() {
  const log: [string, boolean][] = [];
  return {
    log,
    props: {
      'onUpdate:open': (value: boolean) => log.push(['update:open', value]),
      onOpenChange: (value: boolean) => log.push(['openChange', value]),
    },
  };
}

function key(target: Element | Document, name: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

function click(target: Element) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

async function openByClick(wrapper: Wrapper) {
  click(triggerOf(wrapper));
  await flushPromises();
}

/** A popover and a dropdown in one application, the dropdown inside the popover's content. */
function mountNested({
  popover = {},
  dropdown = {},
}: { popover?: Record<string, unknown>; dropdown?: Record<string, unknown> } = {}) {
  const Host = defineComponent({
    setup: () => () =>
      h(
        VfPopover,
        { class: 'outer', ...popover },
        {
          trigger: () => h('span', 'Outer'),
          default: () =>
            h(
              VfDropdown,
              { class: 'inner', ...dropdown },
              {
                trigger: () => h('span', 'Inner'),
                default: () => h('button', { type: 'button', role: 'menuitem', class: 'item' }, 'Item'),
              },
            ),
        },
      ),
  });
  mount(Host, {
    attachTo: document.body.appendChild(document.createElement('div')),
    global: { stubs: { transition: InstantTransition } },
  });
  const popoverTrigger = () => document.querySelector<HTMLElement>('.outer > .vf-popover__trigger')!;
  const dropdownTrigger = () => document.querySelector<HTMLElement>('.inner > .vf-dropdown__trigger');
  return {
    popoverTrigger,
    dropdownTrigger,
    content: () => document.getElementById(popoverTrigger().getAttribute('aria-controls') ?? ''),
    menu: () => document.querySelector<HTMLElement>('.vf-dropdown__menu'),
  };
}

/** A popover and a dropdown side by side in one application. */
function mountSiblings(popover: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup: () => () =>
      h('div', [
        h(
          VfDropdown,
          { class: 'dd' },
          { trigger: () => 'Menu', default: () => h('button', { role: 'menuitem' }, 'A') },
        ),
        h(VfPopover, { class: 'po', ...popover }, { trigger: () => 'Details', default: () => h('p', 'Body') }),
      ]),
  });
  mount(Host, {
    attachTo: document.body.appendChild(document.createElement('div')),
    global: { stubs: { transition: InstantTransition } },
  });
  const dropdownTrigger = () => document.querySelector<HTMLElement>('.dd > .vf-dropdown__trigger')!;
  const popoverTrigger = () => document.querySelector<HTMLElement>('.po > .vf-popover__trigger')!;
  return {
    dropdownTrigger,
    popoverTrigger,
    menu: () => document.getElementById(dropdownTrigger().getAttribute('aria-controls') ?? ''),
    content: () => document.getElementById(popoverTrigger().getAttribute('aria-controls') ?? ''),
  };
}

/** Two popovers in one application: useId counts per application. */
function mountPair(first: Record<string, unknown> = {}, second: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup: () => () =>
      h('div', [
        h(VfPopover, { class: 'first', ...first }, { trigger: () => 'First', default: () => h('p', 'One') }),
        h(VfPopover, { class: 'second', ...second }, { trigger: () => 'Second', default: () => h('p', 'Two') }),
      ]),
  });
  mount(Host, {
    attachTo: document.body.appendChild(document.createElement('div')),
    global: { stubs: { transition: InstantTransition } },
  });
  const part = (name: 'first' | 'second') => {
    const trigger = () => document.querySelector<HTMLElement>(`.${name} > .vf-popover__trigger`)!;
    return {
      trigger,
      content: () => document.getElementById(trigger().getAttribute('aria-controls') ?? ''),
      async openByKey() {
        trigger().focus();
        key(trigger(), 'ArrowDown');
        await flushPromises();
      },
    };
  };
  return { first: part('first'), second: part('second') };
}

beforeEach(() => {
  // Cleared before rather than after a test: the auto-unmount runs after each
  // test and needs the nodes it mounted.
  document.body.innerHTML = '';
  floating.fake = null;
  floating.calls.length = 0;
  floating.autoUpdates.length = 0;
  floating.cleanups = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

// ------------------------------------------------------------ closed structure

describe('VfPopover characterization: closed structure', () => {
  it('renders one root holding one trigger wrapper, and nothing else, while closed', () => {
    const wrapper = mountPopover();
    const root = wrapper.element as HTMLElement;

    expect(root.tagName).toBe('DIV');
    expect(root.className).toBe('vf-popover');
    expect([...root.children].map((child) => child.className)).toEqual(['vf-popover__trigger']);
    expect(document.querySelector('.vf-popover__content')).toBeNull();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('writes exactly the historical trigger attributes: a dialog popup, no role, no disabled state', () => {
    const trigger = triggerOf(mountPopover());

    expect(trigger.tagName).toBe('DIV');
    expect([...trigger.attributes].map((attribute) => attribute.name).sort()).toEqual([
      'aria-controls',
      'aria-expanded',
      'aria-haspopup',
      'class',
      'id',
      'tabindex',
    ]);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('tabindex')).toBe('0');
  });

  it('points aria-controls at the future content id while closed: the reference is dangling', () => {
    const trigger = triggerOf(mountPopover());
    const controls = trigger.getAttribute('aria-controls') ?? '';

    expect(controls).toMatch(/^vf-popover-content-v-\d+$/);
    expect(document.getElementById(controls)).toBeNull();
  });

  it('generates the content id and the trigger id from two prefixes, the content first', () => {
    const trigger = triggerOf(mountPopover());
    const contentSuffix = Number(last((trigger.getAttribute('aria-controls') ?? '').split('-')));

    expect(trigger.id).toMatch(/^vf-popover-trigger-v-\d+$/);
    expect(Number(last(trigger.id.split('-')))).toBe(contentSuffix + 1);
  });

  it('keeps the same content id across closed and open', async () => {
    const wrapper = mountPopover();
    const controls = triggerOf(wrapper).getAttribute('aria-controls');

    await openByClick(wrapper);

    expect(contentOf(wrapper)?.id).toBe(controls);
  });

  it('renders the trigger slot inside the wrapper, verbatim, and an empty wrapper for none', () => {
    const wrapper = mountPopover({ slots: { trigger: '<button type="button" class="consumer">More</button>' } });
    expect(triggerOf(wrapper).innerHTML).toBe('<button type="button" class="consumer">More</button>');

    const empty = mount(VfPopover, { attachTo: document.body.appendChild(document.createElement('div')) });
    expect(triggerOf(empty as Wrapper).innerHTML).toBe('');
    expect(triggerOf(empty as Wrapper).getAttribute('tabindex')).toBe('0');
  });

  it('exposes open and toggle to the trigger slot, and nothing else', async () => {
    const seen: Record<string, unknown>[] = [];
    const wrapper = mountPopover({
      slots: {
        trigger: (scope: Record<string, unknown>) => {
          seen.push({ ...scope });
          return h('span', 'T');
        },
      },
    });

    expect(Object.keys(last(seen)!).sort()).toEqual(['open', 'toggle']);
    expect(last(seen)!.open).toBe(false);

    await openByClick(wrapper);
    expect(last(seen)!.open).toBe(true);
  });

  it('renders the historical markup on the server: the trigger and the teleport placeholders', async () => {
    const context: SSRContext = {};
    const html = await renderToString(
      createSSRApp({ render: () => h(VfPopover, null, { trigger: () => 'Details', default: () => 'Body' }) }),
      context,
    );

    expect(html).toMatch(
      /^<div class="vf-popover"><div id="vf-popover-trigger-v-\d+" class="vf-popover__trigger" aria-controls="vf-popover-content-v-\d+" aria-expanded="false" aria-haspopup="dialog" tabindex="0"><!--\[-->Details<!--\]--><\/div><!--teleport start--><!--teleport end--><\/div>$/,
    );
    expect(context.teleports?.body).toBe(
      '<!--teleport start anchor--><!--[--><!--v-if--><!--]--><!--teleport anchor-->',
    );
  });

  it('renders an open popover on the server into the teleport buffer, unpositioned', async () => {
    const context: SSRContext = {};
    const html = await renderToString(
      createSSRApp({
        render: () => h(VfPopover, { defaultOpen: true }, { trigger: () => 'Details', default: () => 'Body' }),
      }),
      context,
    );

    expect(html).toContain('aria-expanded="true"');
    expect(context.teleports?.body).toMatch(
      /^<!--teleport start anchor--><!--\[--><section id="vf-popover-content-v-\d+" class="vf-popover__content" style="left:0px;top:0px;" aria-labelledby="vf-popover-trigger-v-\d+" role="dialog" tabindex="-1"><span class="vf-popover__arrow vf-popover__arrow--bottom" style="left:0px;top:0px;" aria-hidden="true"><\/span><!--\[-->Body<!--\]--><\/section><!--\]--><!--teleport anchor-->$/,
    );
  });

  it('renders an in-place open popover on the server inside the root, after the trigger', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(VfPopover, { defaultOpen: true, teleportTo: false }, { trigger: () => 'Details', default: () => 'Body' }),
      }),
    );

    expect(html).toMatch(
      /^<div class="vf-popover"><div id="vf-popover-trigger-v-\d+" class="vf-popover__trigger" aria-controls="vf-popover-content-v-\d+" aria-expanded="true" aria-haspopup="dialog" tabindex="0"><!--\[-->Details<!--\]--><\/div><!--teleport start--><!--\[--><section id="vf-popover-content-v-\d+" class="vf-popover__content" style="left:0px;top:0px;" aria-labelledby="vf-popover-trigger-v-\d+" role="dialog" tabindex="-1"><span class="vf-popover__arrow vf-popover__arrow--bottom" style="left:0px;top:0px;" aria-hidden="true"><\/span><!--\[-->Body<!--\]--><\/section><!--\]--><!--teleport end--><\/div>$/,
    );
  });
});

// ----------------------------------------------------------------------- attrs

describe('VfPopover characterization: attrs', () => {
  it('forwards id, data-*, aria-label and style to the root, not to the trigger', () => {
    const wrapper = mountPopover({
      attrs: { id: 'consumer', 'data-testid': 'po', 'aria-label': 'Popover', style: 'margin-top: 4px;' },
    });
    const root = wrapper.element as HTMLElement;

    expect(root.id).toBe('consumer');
    expect(root.getAttribute('data-testid')).toBe('po');
    expect(root.getAttribute('aria-label')).toBe('Popover');
    expect(root.getAttribute('style')).toBe('margin-top: 4px;');
    expect(triggerOf(wrapper).id).toMatch(/^vf-popover-trigger-v-\d+$/);
    expect(triggerOf(wrapper).hasAttribute('aria-label')).toBe(false);
  });

  it('merges a consumer class after vf-popover on the root, and nowhere else', async () => {
    const wrapper = mountPopover({ attrs: { class: 'consumer extra' }, props: { defaultOpen: true } });
    await flushPromises();

    expect(wrapper.element.className).toBe('vf-popover consumer extra');
    expect(triggerOf(wrapper).className).toBe('vf-popover__trigger');
    expect(contentOf(wrapper)!.className).toBe('vf-popover__content');
  });

  it('lets a consumer role and tabindex land on the root, leaving the trigger untouched', () => {
    const wrapper = mountPopover({ attrs: { role: 'group', tabindex: '-1' } });

    expect(wrapper.element.getAttribute('role')).toBe('group');
    expect(wrapper.element.getAttribute('tabindex')).toBe('-1');
    expect(triggerOf(wrapper).getAttribute('tabindex')).toBe('0');
  });

  it('has no disabled contract: a disabled attribute lands on the root and the trigger still opens', async () => {
    const wrapper = mountPopover({ attrs: { disabled: true } });

    expect(wrapper.element.hasAttribute('disabled')).toBe(true);
    await openByClick(wrapper);
    expect(contentOf(wrapper)).not.toBeNull();
  });
});

// -------------------------------------------------------------- open structure

describe('VfPopover characterization: open structure', () => {
  it('teleports the open content to the end of <body>, outside the component root', async () => {
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await flushPromises();
    const content = contentOf(wrapper)!;

    expect(content.parentElement).toBe(document.body);
    expect(wrapper.element.contains(content)).toBe(false);
  });

  it('writes exactly the historical content attributes: a focusable, labelled dialog section', async () => {
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await flushPromises();
    const content = contentOf(wrapper)!;

    expect(content.tagName).toBe('SECTION');
    expect([...content.attributes].map((attribute) => attribute.name).sort()).toEqual([
      'aria-labelledby',
      'class',
      'id',
      'role',
      'style',
      'tabindex',
    ]);
    expect(content.getAttribute('role')).toBe('dialog');
    expect(content.getAttribute('tabindex')).toBe('-1');
    expect(content.getAttribute('aria-labelledby')).toBe(triggerOf(wrapper).id);
    expect(content.hasAttribute('aria-modal')).toBe(false);
    expect(content.className).toBe('vf-popover__content');
  });

  it('opens with aria-expanded="true" and a resolvable aria-controls', async () => {
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await flushPromises();

    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('true');
    expect(contentOf(wrapper)).not.toBeNull();
  });

  it('puts an aria-hidden arrow span first in the content, before the default slot', async () => {
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await flushPromises();
    const content = contentOf(wrapper)!;
    const arrow = content.firstElementChild as HTMLElement;

    expect(arrow.tagName).toBe('SPAN');
    expect(arrow.className).toBe('vf-popover__arrow vf-popover__arrow--bottom');
    expect(arrow.getAttribute('aria-hidden')).toBe('true');
    expect(arrow.childNodes).toHaveLength(0);
    expect([...content.children].slice(1).map((child) => child.className)).toEqual(['body', 'inside']);
  });

  it('renders only the arrow in open content with an empty default slot', async () => {
    const wrapper = mountPopover({ props: { defaultOpen: true }, slots: { default: '' } });
    await flushPromises();

    expect([...contentOf(wrapper)!.children].map((child) => child.className)).toEqual([
      'vf-popover__arrow vf-popover__arrow--bottom',
    ]);
  });

  it('exposes open and close to the default slot, and close focuses the trigger', async () => {
    const seen: Record<string, unknown>[] = [];
    const emits = recordEmits();
    const wrapper = mountPopover({
      props: { defaultOpen: true, ...emits.props },
      slots: {
        default: (scope: { close: () => void; open: boolean }) => {
          seen.push({ ...scope });
          return h('button', { type: 'button', class: 'closer', onClick: () => scope.close() }, String(scope.open));
        },
      },
    });
    await flushPromises();

    expect(Object.keys(last(seen)!).sort()).toEqual(['close', 'open']);
    click(document.querySelector('.closer')!);
    await flushPromises();
    expect(contentOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
    expect(emits.log).toEqual([
      ['update:open', false],
      ['openChange', false],
    ]);
  });
});

// -------------------------------------------------------------------- teleport

describe('VfPopover characterization: teleport destination', () => {
  it('teleports into a selector target when teleportTo is a string', async () => {
    const target = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'overlay-root' }));
    const wrapper = mountPopover({ props: { defaultOpen: true, teleportTo: '#overlay-root' } });
    await flushPromises();

    expect(contentOf(wrapper)!.parentElement).toBe(target);
  });

  it('teleports into an element when teleportTo is an HTMLElement', async () => {
    const target = document.body.appendChild(document.createElement('aside'));
    const wrapper = mountPopover({ props: { defaultOpen: true, teleportTo: target } });
    await flushPromises();

    expect(contentOf(wrapper)!.parentElement).toBe(target);
  });

  it.each([
    ['teleportTo=false', { teleportTo: false }],
    ['teleportTo=null', { teleportTo: null }],
    ['disableTeleport', { disableTeleport: true }],
    ['disableTeleport over a selector', { disableTeleport: true, teleportTo: '#nowhere' }],
  ])('renders in place, inside the root after the trigger, for %s', async (_, props) => {
    const wrapper = mountPopover({ props: { defaultOpen: true, ...props } });
    await flushPromises();

    expect(contentOf(wrapper)!.parentElement).toBe(wrapper.element);
    expect([...wrapper.element.children].map((child) => child.className)).toEqual([
      'vf-popover__trigger',
      'vf-popover__content',
    ]);
  });

  it('places teleported contents in body in mount order, whatever order they open in', async () => {
    const { first, second } = mountPair();
    await second.openByKey();
    await first.openByKey();

    const order = [...document.body.querySelectorAll(':scope > .vf-popover__content')].map(labelOf);
    expect(order).toEqual(['One', 'Two']);
  });
});

// ----------------------------------------------------------------- controlled

describe('VfPopover characterization: controlled', () => {
  it('follows the open prop: a click emits the request and changes nothing until the parent writes it', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: { open: false, ...emits.props } });

    await openByClick(wrapper);

    expect(emits.log).toEqual([
      ['update:open', true],
      ['openChange', true],
    ]);
    expect(contentOf(wrapper)).toBeNull();
    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('false');
  });

  it('focuses the trigger on a refused close request, and keeps the content', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: { open: true, ...emits.props } });
    await flushPromises();

    await openByClick(wrapper);

    expect(emits.log).toEqual([
      ['update:open', false],
      ['openChange', false],
    ]);
    expect(contentOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('opens and closes with v-model write-back, moving focus as an uncontrolled popover does', async () => {
    const Host = defineComponent({
      setup() {
        const open = ref(false);
        return () =>
          h(
            VfPopover,
            { open: open.value, 'onUpdate:open': (value: boolean) => (open.value = value) },
            { trigger: () => 'T', default: () => h('p', 'Body') },
          );
      },
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    const trigger = document.querySelector<HTMLElement>('.vf-popover__trigger')!;

    click(trigger);
    await flushPromises();
    expect(document.activeElement).toBe(document.querySelector('.vf-popover__content'));

    click(trigger);
    await flushPromises();
    expect(document.querySelector('.vf-popover__content')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('emits nothing and moves no focus when the parent opens or closes it', async () => {
    const emits = recordEmits();
    const elsewhere = document.body.appendChild(document.createElement('input'));
    const wrapper = mountPopover({ props: { open: false, ...emits.props } });
    elsewhere.focus();

    await wrapper.setProps({ open: true });
    await flushPromises();
    expect(contentOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(elsewhere);

    await wrapper.setProps({ open: false });
    await flushPromises();
    expect(contentOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(elsewhere);
    expect(emits.log).toEqual([]);
  });

  it('lets a defined open win over defaultOpen', async () => {
    const wrapper = mountPopover({ props: { open: false, defaultOpen: true } });
    await flushPromises();

    expect(contentOf(wrapper)).toBeNull();
  });

  it('renders an initial defaultOpen without emitting and without moving focus', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: { defaultOpen: true, ...emits.props } });
    await flushPromises();

    expect(contentOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(document.body);
    expect(emits.log).toEqual([]);
  });
});

// --------------------------------------------------------------------- pointer

describe('VfPopover characterization: pointer', () => {
  it('opens on a trigger click, emits update:open then openChange, and focuses the content', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: emits.props });

    await openByClick(wrapper);

    expect(contentOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(contentOf(wrapper));
    expect(emits.log).toEqual([
      ['update:open', true],
      ['openChange', true],
    ]);
  });

  it('closes on a second trigger click and focuses the trigger', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: emits.props });
    await openByClick(wrapper);

    await openByClick(wrapper);

    expect(contentOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
    expect(emits.log.slice(-2)).toEqual([
      ['update:open', false],
      ['openChange', false],
    ]);
  });

  it('toggles from a click on a consumer control nested in the trigger', async () => {
    const wrapper = mountPopover({ slots: { trigger: '<button type="button" class="consumer">More</button>' } });

    click(wrapper.get('.consumer').element);
    await flushPromises();

    expect(contentOf(wrapper)).not.toBeNull();
  });

  it('keeps the content open on a click inside it, anywhere: there is no closeOnSelect', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: emits.props });
    await openByClick(wrapper);
    const content = contentOf(wrapper)!;

    for (const target of [content.querySelector('.inside')!, content.querySelector('.body')!, content]) {
      click(target);
      await flushPromises();
    }

    expect(contentOf(wrapper)).toBe(content);
    expect(emits.log).toHaveLength(2);
  });

  it('closes on an outside document click and moves focus to the trigger, away from what was clicked', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: emits.props });
    const outside = document.body.appendChild(document.createElement('button'));
    await openByClick(wrapper);

    outside.focus();
    click(outside);
    await flushPromises();

    expect(contentOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
    expect(emits.log.slice(-2)).toEqual([
      ['update:open', false],
      ['openChange', false],
    ]);
  });

  it('stays open on an outside click with closeOnOutsideClick=false, and focus stays where it went', async () => {
    const wrapper = mountPopover({ props: { closeOnOutsideClick: false } });
    const outside = document.body.appendChild(document.createElement('button'));
    await openByClick(wrapper);

    outside.focus();
    click(outside);
    await flushPromises();

    expect(contentOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('does not close on an outside pointerdown or mousedown: the outside event is click', async () => {
    const wrapper = mountPopover();
    await openByClick(wrapper);

    for (const type of ['pointerdown', 'mousedown']) {
      document.body.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
    }
    await flushPromises();

    expect(contentOf(wrapper)).not.toBeNull();
  });

  it('closes an open neighbour on a pointer open only as an outside click, under synthetic dispatch leaving focus in the opener', async () => {
    const { first, second } = mountPair();
    await first.openByKey();

    click(second.trigger());
    await flushPromises();

    expect(first.content()).toBeNull();
    expect(second.content()).not.toBeNull();
    // Under jsdom's synthetic dispatch no microtask runs between listeners, so
    // the opener's focus - queued behind its render - lands last. A real click
    // in Chrome runs microtasks between listeners: the opener focuses its panel
    // first and the neighbour's outside-click close then focuses the
    // neighbour's trigger. That is the measured browser contract, compared as
    // popover/interaction-pointer-switch.
    expect(document.activeElement).toBe(second.content());
  });
});

// -------------------------------------------------------------- trigger keyboard

describe('VfPopover characterization: trigger keyboard', () => {
  it.each(['Enter', ' ', 'ArrowDown'])('opens on %j, prevents it and focuses the content', async (name) => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: emits.props });
    triggerOf(wrapper).focus();

    const event = key(triggerOf(wrapper), name);
    await flushPromises();

    expect(event.defaultPrevented).toBe(true);
    expect(contentOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(contentOf(wrapper));
    expect(emits.log).toEqual([
      ['update:open', true],
      ['openChange', true],
    ]);
  });

  it.each(['Enter', ' '])(
    'closes an open popover on %j - a toggle - prevents it and focuses the trigger',
    async (name) => {
      const emits = recordEmits();
      const wrapper = mountPopover({ props: emits.props });
      await openByClick(wrapper);
      triggerOf(wrapper).focus();

      const event = key(triggerOf(wrapper), name);
      await flushPromises();

      expect(event.defaultPrevented).toBe(true);
      expect(contentOf(wrapper)).toBeNull();
      expect(document.activeElement).toBe(triggerOf(wrapper));
      expect(emits.log.slice(-2)).toEqual([
        ['update:open', false],
        ['openChange', false],
      ]);
    },
  );

  it('re-opens on ArrowDown while open: emits the pair again, keeps the content and refocuses it', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: emits.props });
    await openByClick(wrapper);
    const content = contentOf(wrapper);
    triggerOf(wrapper).focus();

    const event = key(triggerOf(wrapper), 'ArrowDown');
    await flushPromises();

    expect(event.defaultPrevented).toBe(true);
    expect(contentOf(wrapper)).toBe(content);
    expect(document.activeElement).toBe(content);
    expect(emits.log).toEqual([
      ['update:open', true],
      ['openChange', true],
      ['update:open', true],
      ['openChange', true],
    ]);
  });

  it.each(['ArrowUp', 'Home', 'End', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight'])(
    'ignores %s on a closed trigger and does not prevent it',
    async (name) => {
      const emits = recordEmits();
      const wrapper = mountPopover({ props: emits.props });
      triggerOf(wrapper).focus();

      const event = key(triggerOf(wrapper), name);
      await flushPromises();

      expect(event.defaultPrevented).toBe(false);
      expect(contentOf(wrapper)).toBeNull();
      expect(emits.log).toEqual([]);
    },
  );

  it.each(['ArrowUp', 'Home', 'End', 'Tab'])('ignores %s on the trigger of an open popover', async (name) => {
    const wrapper = mountPopover();
    await openByClick(wrapper);
    triggerOf(wrapper).focus();

    const event = key(triggerOf(wrapper), name);
    await flushPromises();

    expect(event.defaultPrevented).toBe(false);
    expect(contentOf(wrapper)).not.toBeNull();
  });

  it('handles keys that bubble from a consumer control inside the trigger', async () => {
    const wrapper = mountPopover({ slots: { trigger: '<button type="button" class="consumer">More</button>' } });
    const consumer = wrapper.get('.consumer').element as HTMLElement;
    consumer.focus();

    const event = key(consumer, 'Enter');
    await flushPromises();

    expect(event.defaultPrevented).toBe(true);
    expect(contentOf(wrapper)).not.toBeNull();
  });

  it('does not handle keys pressed inside the content, which is not inside the trigger', async () => {
    const wrapper = mountPopover();
    await openByClick(wrapper);
    const inside = contentOf(wrapper)!.querySelector<HTMLElement>('.inside')!;
    inside.focus();

    for (const name of ['Enter', ' ', 'ArrowDown', 'Tab']) {
      expect(key(inside, name).defaultPrevented, name).toBe(false);
    }
    await flushPromises();
    expect(contentOf(wrapper)).not.toBeNull();
  });

  it('does not handle keys inside in-place content either: the content is a sibling of the trigger', async () => {
    const wrapper = mountPopover({ props: { teleportTo: false } });
    await openByClick(wrapper);
    const inside = contentOf(wrapper)!.querySelector<HTMLElement>('.inside')!;

    expect(key(inside, 'Enter').defaultPrevented).toBe(false);
    await flushPromises();
    expect(contentOf(wrapper)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------- focus

describe('VfPopover characterization: focus on open', () => {
  it('focuses the first [autofocus] element', async () => {
    const wrapper = mountPopover({
      slots: { default: '<button type="button" class="a">A</button><input class="b" autofocus />' },
    });
    await openByClick(wrapper);

    expect((document.activeElement as HTMLElement).className).toBe('b');
  });

  it('focuses the first [data-autofocus] element', async () => {
    const wrapper = mountPopover({
      slots: {
        default: '<button type="button" class="a">A</button><button type="button" class="b" data-autofocus>B</button>',
      },
    });
    await openByClick(wrapper);

    expect((document.activeElement as HTMLElement).className).toBe('b');
  });

  it.each([
    ['autofocus first', '<input class="x" autofocus /><input class="y" data-autofocus />', 'x'],
    ['data-autofocus first', '<input class="x" data-autofocus /><input class="y" autofocus />', 'x'],
  ])('takes whichever form comes first in document order: %s', async (_, markup, expected) => {
    const wrapper = mountPopover({ slots: { default: markup } });
    await openByClick(wrapper);

    expect((document.activeElement as HTMLElement).className).toBe(expected);
  });

  it('focuses the content itself when nothing asks for focus, not the first focusable element', async () => {
    const wrapper = mountPopover();
    await openByClick(wrapper);

    expect(document.activeElement).toBe(contentOf(wrapper));
  });

  it('focuses the content itself when there is no focusable element at all', async () => {
    const wrapper = mountPopover({ slots: { default: '<p>Only text</p>' } });
    await openByClick(wrapper);

    expect(document.activeElement).toBe(contentOf(wrapper));
  });

  it('stops at an autofocus target that cannot take focus: focus stays where it was', async () => {
    const wrapper = mountPopover({ slots: { default: '<div class="target" data-autofocus>Text</div>' } });
    triggerOf(wrapper).focus();

    key(triggerOf(wrapper), 'Enter');
    await flushPromises();

    expect(contentOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('searches the whole content, at any depth', async () => {
    const wrapper = mountPopover({
      slots: { default: '<div><div><button class="deep" autofocus>D</button></div></div>' },
    });
    await openByClick(wrapper);

    expect((document.activeElement as HTMLElement).className).toBe('deep');
  });
});

// --------------------------------------------------------------------- Escape

describe('VfPopover characterization: Escape', () => {
  it('closes on a document Escape from anywhere, prevents it and focuses the trigger', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: emits.props });
    await openByClick(wrapper);
    const elsewhere = document.body.appendChild(document.createElement('input'));
    elsewhere.focus();

    const event = key(elsewhere, 'Escape');
    await flushPromises();

    expect(event.defaultPrevented).toBe(true);
    expect(contentOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
    expect(emits.log.slice(-2)).toEqual([
      ['update:open', false],
      ['openChange', false],
    ]);
  });

  it('with closeOnEscape=false stays open and does not prevent the Escape', async () => {
    const emits = recordEmits();
    const wrapper = mountPopover({ props: { closeOnEscape: false, ...emits.props } });
    await openByClick(wrapper);

    const event = key(contentOf(wrapper)!, 'Escape');
    await flushPromises();

    expect(event.defaultPrevented).toBe(false);
    expect(contentOf(wrapper)).not.toBeNull();
    expect(emits.log).toHaveLength(2);
  });

  it('handles Escape on keydown only, and not while closed', async () => {
    const wrapper = mountPopover();
    expect(key(document.body, 'Escape').defaultPrevented).toBe(false);

    await openByClick(wrapper);
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', bubbles: true, cancelable: true }));
    await flushPromises();
    expect(contentOf(wrapper)).not.toBeNull();
  });

  it('ignores an Escape something else already prevented', async () => {
    const wrapper = mountPopover();
    await openByClick(wrapper);
    const guard = (event: KeyboardEvent) => event.preventDefault();
    window.addEventListener('keydown', guard, { capture: true });

    key(document.body, 'Escape');
    await flushPromises();
    window.removeEventListener('keydown', guard, { capture: true });

    expect(contentOf(wrapper)).not.toBeNull();
  });

  it('closes only the most recently opened popover, one per Escape', async () => {
    const { first, second } = mountPair();
    await first.openByKey();
    await second.openByKey();

    key(document.body, 'Escape');
    await flushPromises();
    expect(first.content()).not.toBeNull();
    expect(second.content()).toBeNull();
    expect(document.activeElement).toBe(second.trigger());

    key(document.body, 'Escape');
    await flushPromises();
    expect(first.content()).toBeNull();
    expect(document.activeElement).toBe(first.trigger());
  });
});

// ------------------------------------------------ the stack shared with VfDropdown

describe('VfPopover characterization: one escape stack with VfDropdown', () => {
  it('closes a dropdown opened inside the popover first, then the popover: LIFO across the two components', async () => {
    const nested = mountNested();
    click(nested.popoverTrigger());
    await flushPromises();
    nested.dropdownTrigger()!.focus();
    key(nested.dropdownTrigger()!, 'ArrowDown');
    await flushPromises();
    expect(nested.menu()).not.toBeNull();

    expect(key(document.activeElement!, 'Escape').defaultPrevented).toBe(true);
    await flushPromises();
    expect(nested.menu()).toBeNull();
    expect(nested.content()).not.toBeNull();
    expect(document.activeElement).toBe(nested.dropdownTrigger());

    expect(key(document.activeElement!, 'Escape').defaultPrevented).toBe(true);
    await flushPromises();
    expect(nested.content()).toBeNull();
    expect(document.activeElement).toBe(nested.popoverTrigger());
  });

  it('orders siblings by opening: a popover opened after a dropdown closes first', async () => {
    const pair = mountSiblings();
    pair.dropdownTrigger().focus();
    key(pair.dropdownTrigger(), 'ArrowDown');
    await flushPromises();
    pair.popoverTrigger().focus();
    key(pair.popoverTrigger(), 'ArrowDown');
    await flushPromises();
    expect(pair.menu()).not.toBeNull();
    expect(pair.content()).not.toBeNull();

    key(document.body, 'Escape');
    await flushPromises();
    expect(pair.content()).toBeNull();
    expect(pair.menu()).not.toBeNull();

    key(document.body, 'Escape');
    await flushPromises();
    expect(pair.menu()).toBeNull();
  });

  it('orders siblings by opening the other way round too: a dropdown opened after a popover closes first', async () => {
    const pair = mountSiblings();
    pair.popoverTrigger().focus();
    key(pair.popoverTrigger(), 'ArrowDown');
    await flushPromises();
    pair.dropdownTrigger().focus();
    key(pair.dropdownTrigger(), 'ArrowDown');
    await flushPromises();

    key(document.body, 'Escape');
    await flushPromises();
    expect(pair.menu()).toBeNull();
    expect(pair.content()).not.toBeNull();
  });

  it('with closeOnEscape=false on top, swallows the Escape: nothing closes, nothing is prevented, the dropdown below stays open', async () => {
    const pair = mountSiblings({ closeOnEscape: false });
    pair.dropdownTrigger().focus();
    key(pair.dropdownTrigger(), 'ArrowDown');
    await flushPromises();
    pair.popoverTrigger().focus();
    key(pair.popoverTrigger(), 'ArrowDown');
    await flushPromises();

    const event = key(document.body, 'Escape');
    await flushPromises();

    expect(event.defaultPrevented).toBe(false);
    expect(pair.content()).not.toBeNull();
    expect(pair.menu()).not.toBeNull();
  });

  it('with closeOnEscape=false below, is simply not reached: the dropdown on top closes', async () => {
    const pair = mountSiblings({ closeOnEscape: false });
    pair.popoverTrigger().focus();
    key(pair.popoverTrigger(), 'ArrowDown');
    await flushPromises();
    pair.dropdownTrigger().focus();
    key(pair.dropdownTrigger(), 'ArrowDown');
    await flushPromises();

    expect(key(document.body, 'Escape').defaultPrevented).toBe(true);
    await flushPromises();
    expect(pair.menu()).toBeNull();
    expect(pair.content()).not.toBeNull();
  });
});

// ------------------------------------------------ nested teardown

describe('VfPopover characterization: closing unmounts a nested dropdown', () => {
  async function openBoth() {
    const nested = mountNested();
    click(nested.popoverTrigger());
    await flushPromises();
    nested.dropdownTrigger()!.focus();
    key(nested.dropdownTrigger()!, 'ArrowDown');
    await flushPromises();
    expect(nested.menu()).not.toBeNull();
    return nested;
  }

  it('takes the open dropdown menu out of <body> when Enter on the popover trigger closes it', async () => {
    const nested = await openBoth();
    nested.popoverTrigger().focus();

    // Enter is handled on keydown and prevented: no click is synthesised, so
    // the dropdown never sees an outside click. Only the unmount removes it.
    expect(key(nested.popoverTrigger(), 'Enter').defaultPrevented).toBe(true);
    await flushPromises();

    expect(nested.content()).toBeNull();
    expect(nested.dropdownTrigger()).toBeNull();
    expect(nested.menu()).toBeNull();
    expect(document.activeElement).toBe(nested.popoverTrigger());
  });

  it('takes the unmounted dropdown off the escape stack: the next Escape reaches nobody', async () => {
    const nested = await openBoth();
    nested.popoverTrigger().focus();
    key(nested.popoverTrigger(), 'Enter');
    await flushPromises();

    const event = key(document.body, 'Escape');
    await flushPromises();

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(nested.popoverTrigger());
  });

  it('leaves the stack to whatever was below: a sibling popover opened earlier takes the next Escape', async () => {
    const Host = defineComponent({
      setup: () => () =>
        h('div', [
          h(VfPopover, { class: 'earlier' }, { trigger: () => 'Earlier', default: () => h('p', 'E') }),
          h(
            VfPopover,
            { class: 'outer' },
            {
              trigger: () => 'Outer',
              default: () =>
                h(
                  VfDropdown,
                  { class: 'inner' },
                  { trigger: () => 'Inner', default: () => h('button', { role: 'menuitem' }, 'I') },
                ),
            },
          ),
        ]),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    const earlier = document.querySelector<HTMLElement>('.earlier > .vf-popover__trigger')!;
    const outer = document.querySelector<HTMLElement>('.outer > .vf-popover__trigger')!;
    earlier.focus();
    key(earlier, 'ArrowDown');
    await flushPromises();
    outer.focus();
    key(outer, 'ArrowDown');
    await flushPromises();
    const inner = document.querySelector<HTMLElement>('.inner > .vf-dropdown__trigger')!;
    inner.focus();
    key(inner, 'ArrowDown');
    await flushPromises();

    outer.focus();
    key(outer, 'Enter');
    await flushPromises();
    expect(document.querySelector('.vf-dropdown__menu')).toBeNull();

    expect(key(document.body, 'Escape').defaultPrevented).toBe(true);
    await flushPromises();
    expect(document.getElementById(earlier.getAttribute('aria-controls')!)).toBeNull();
    expect(document.activeElement).toBe(earlier);
  });

  it('closes the popover too when an item of the nested menu is clicked: the teleported menu is outside the content', async () => {
    const nested = await openBoth();

    click(nested.menu()!.querySelector('.item')!);
    await flushPromises();

    expect(nested.menu()).toBeNull();
    expect(nested.content()).toBeNull();
    expect(document.activeElement).toBe(nested.popoverTrigger());
  });

  it('removes the teleported nested menu and its escape entry at once, while the popover content is still leaving', async () => {
    // Vue unmounts the components inside a leaving element immediately and
    // keeps only the element itself for the animation. The dropdown's menu is
    // in <body>, outside that element, so it goes at the start of the leave;
    // the dropdown's trigger stays inside the leaving content, frozen at
    // aria-expanded="true", until the content is removed.
    vi.useFakeTimers();
    const Host = defineComponent({
      setup: () => () =>
        h(
          VfPopover,
          { class: 'outer' },
          {
            trigger: () => 'Outer',
            default: () =>
              h(
                VfDropdown,
                { class: 'inner' },
                { trigger: () => 'Inner', default: () => h('button', { role: 'menuitem' }, 'I') },
              ),
          },
        ),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: false } },
    });
    const outer = document.querySelector<HTMLElement>('.outer > .vf-popover__trigger')!;
    click(outer);
    await vi.advanceTimersByTimeAsync(400);
    const inner = document.querySelector<HTMLElement>('.inner > .vf-dropdown__trigger')!;
    key(inner, 'ArrowDown');
    await vi.advanceTimersByTimeAsync(400);
    const menu = document.querySelector('.vf-dropdown__menu')!;
    const content = document.querySelector('.vf-popover__content')!;

    outer.focus();
    key(outer, 'Enter');
    await vi.advanceTimersByTimeAsync(50);

    expect(menu.isConnected).toBe(false);
    expect(content.isConnected).toBe(true);
    expect(inner.isConnected).toBe(true);
    expect(inner.getAttribute('aria-expanded')).toBe('true');
    expect(key(document.body, 'Escape').defaultPrevented).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);
    expect(content.isConnected).toBe(false);
  });
});

// ------------------------------------------------------------ two instances

describe('VfPopover characterization: multiple instances', () => {
  it('gives every instance of one app its own trigger and content ids, wired to each other and to nothing else', async () => {
    const { first, second } = mountPair();
    await first.openByKey();
    await second.openByKey();

    expect(first.trigger().id).not.toBe(second.trigger().id);
    expect(first.content()!.getAttribute('aria-labelledby')).toBe(first.trigger().id);
    expect(second.content()!.getAttribute('aria-labelledby')).toBe(second.trigger().id);
    expect(labelOf(first.content())).toBe('One');
    expect(labelOf(second.content())).toBe('Two');
  });

  it('keeps two keyboard-opened popovers open at once: there is no mutual exclusion', async () => {
    const { first, second } = mountPair();
    await first.openByKey();
    await second.openByKey();

    expect(first.content()).not.toBeNull();
    expect(second.content()).not.toBeNull();
  });
});

// --------------------------------------------------------------------- floating

describe('VfPopover characterization: floating', () => {
  const position = (x: number, y: number, placement: string, arrow?: Record<string, number>) => () => ({
    x,
    y,
    placement,
    middlewareData: arrow ? { arrow } : {},
  });

  it('positions the content against the trigger with the historical middleware and a fixed strategy', async () => {
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await flushPromises();
    const call = last(floating.calls)!;
    const middleware = call.options.middleware as { name: string; params?: Record<string, unknown> }[];

    expect(call.reference).toBe(triggerOf(wrapper));
    expect(call.floating).toBe(contentOf(wrapper));
    expect(call.options.placement).toBe('bottom-start');
    expect(call.options.strategy).toBe('fixed');
    expect(middleware.map((entry) => entry.name)).toEqual(['offset', 'flip', 'shift', 'arrow']);
    expect(middleware[0].params).toEqual({ value: 10 });
    expect(middleware[1].params).toEqual({ placements: ['bottom-start', 'top-start'] });
    expect(middleware[2].params).toBeUndefined();
    expect(middleware[3].params).toEqual({ arrow: contentOf(wrapper)!.querySelector('.vf-popover__arrow') });
  });

  it('flips between the two end placements for bottom-end', async () => {
    mountPopover({ props: { defaultOpen: true, placement: 'bottom-end' } });
    await flushPromises();
    const call = last(floating.calls)!;
    const middleware = call.options.middleware as { params?: Record<string, unknown> }[];

    expect(call.options.placement).toBe('bottom-end');
    expect(middleware[1].params).toEqual({ placements: ['bottom-end', 'top-end'] });
  });

  it('treats any placement other than bottom-end as the start pair', async () => {
    mountPopover({ props: { defaultOpen: true, placement: 'top-start' } });
    await flushPromises();
    const middleware = last(floating.calls)!.options.middleware as { params?: Record<string, unknown> }[];

    expect(last(floating.calls)!.options.placement).toBe('top-start');
    expect(middleware[1].params).toEqual({ placements: ['bottom-start', 'top-start'] });
  });

  it('writes the computed x and y into left and top, unrounded', async () => {
    floating.fake = position(12.5, 84.8589, 'bottom-start');
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await flushPromises();

    expect(contentOf(wrapper)!.getAttribute('style')).toBe('left: 12.5px; top: 84.8589px;');
  });

  it('writes the arrow offset relative to the content from the arrow middleware data', async () => {
    floating.fake = position(10, 20, 'bottom-start', { x: 38.5, y: 15.5, baseX: 10, baseY: 20 });
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await flushPromises();

    expect(contentOf(wrapper)!.querySelector('.vf-popover__arrow')!.getAttribute('style')).toBe(
      'left: 28.5px; top: -4.5px;',
    );
  });

  it('writes a zero arrow offset when the arrow data lacks a base', async () => {
    floating.fake = position(10, 20, 'bottom-start', { x: 38 });
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await flushPromises();

    expect(contentOf(wrapper)!.querySelector('.vf-popover__arrow')!.getAttribute('style')).toBe('left: 0px; top: 0px;');
  });

  it('adds --top to the content and swaps the arrow modifier on top; there is no --bottom content modifier', async () => {
    floating.fake = position(10, 20, 'top-end');
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await flushPromises();

    expect(contentOf(wrapper)!.className).toBe('vf-popover__content vf-popover__content--top');
    expect(contentOf(wrapper)!.querySelector('.vf-popover__arrow')!.className).toBe(
      'vf-popover__arrow vf-popover__arrow--top',
    );
  });

  it('renders the last placement and position first on the next open, before recomputing', async () => {
    floating.fake = position(33, 44, 'top-end');
    const wrapper = mountPopover();
    await openByClick(wrapper);
    await openByClick(wrapper);

    floating.fake = () => new Promise(() => {});
    click(triggerOf(wrapper));
    await nextTick();
    await nextTick();

    expect(contentOf(wrapper)!.className).toContain('vf-popover__content--top');
    expect(contentOf(wrapper)!.getAttribute('style')).toBe('left: 33px; top: 44px;');
  });

  it('starts at left 0 and top 0 before the first computation', async () => {
    floating.fake = () => new Promise(() => {});
    const wrapper = mountPopover({ props: { defaultOpen: true } });
    await nextTick();

    expect(contentOf(wrapper)!.getAttribute('style')).toBe('left: 0px; top: 0px;');
  });

  it('keeps the content positioned with autoUpdate on the trigger alone, and stops on close', async () => {
    const wrapper = mountPopover();
    await openByClick(wrapper);

    expect(floating.autoUpdates).toHaveLength(1);
    expect(floating.autoUpdates[0].reference).toBe(triggerOf(wrapper));
    expect(floating.autoUpdates[0].argumentCount).toBe(2);
    expect(floating.cleanups).toBe(0);

    await openByClick(wrapper);
    expect(floating.cleanups).toBe(1);
  });

  it('computes nothing while closed', async () => {
    mountPopover();
    await flushPromises();

    expect(floating.calls).toHaveLength(0);
    expect(floating.autoUpdates).toHaveLength(0);
  });
});

// ------------------------------------------------------------------ transition

describe('VfPopover characterization: transition', () => {
  const classes = (element: Element | null) => (element ? [...element.classList] : null);

  it('enters with vf-floating-transition classes: from and active, then active and to, then none after 320 ms', async () => {
    vi.useFakeTimers();
    const wrapper = mountPopover({ realTransition: true });

    click(triggerOf(wrapper));
    await nextTick();
    const content = contentOf(wrapper)!;
    expect(classes(content)).toEqual([
      'vf-popover__content',
      'vf-floating-transition-enter-from',
      'vf-floating-transition-enter-active',
    ]);

    await vi.advanceTimersByTimeAsync(40);
    expect(classes(content)).toEqual([
      'vf-popover__content',
      'vf-floating-transition-enter-active',
      'vf-floating-transition-enter-to',
    ]);

    await vi.advanceTimersByTimeAsync(260);
    expect(classes(content)).toContain('vf-floating-transition-enter-active');

    await vi.advanceTimersByTimeAsync(70);
    expect(classes(content)).toEqual(['vf-popover__content']);
  });

  it('focuses the content while its enter is still running', async () => {
    vi.useFakeTimers();
    const wrapper = mountPopover({ realTransition: true });

    click(triggerOf(wrapper));
    await nextTick();
    await nextTick();

    expect(classes(contentOf(wrapper))).toContain('vf-floating-transition-enter-active');
    expect(document.activeElement).toBe(contentOf(wrapper));
  });

  it('leaves the content in the DOM for 320 ms after the leave begins, then removes it', async () => {
    vi.useFakeTimers();
    const wrapper = mountPopover({ realTransition: true });
    click(triggerOf(wrapper));
    await vi.advanceTimersByTimeAsync(400);
    const content = contentOf(wrapper)!;

    click(triggerOf(wrapper));
    await nextTick();
    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('false');
    expect(content.isConnected).toBe(true);
    expect(classes(content)).toEqual([
      'vf-popover__content',
      'vf-floating-transition-leave-from',
      'vf-floating-transition-leave-active',
    ]);

    await vi.advanceTimersByTimeAsync(40);
    expect(classes(content)).toEqual([
      'vf-popover__content',
      'vf-floating-transition-leave-active',
      'vf-floating-transition-leave-to',
    ]);

    await vi.advanceTimersByTimeAsync(280);
    expect(content.isConnected).toBe(true);

    await vi.advanceTimersByTimeAsync(80);
    expect(content.isConnected).toBe(false);
  });

  it('runs the enter on the initial render of an open popover: appear', async () => {
    vi.useFakeTimers();
    const wrapper = mountPopover({ realTransition: true, props: { defaultOpen: true } });
    await nextTick();

    expect(classes(contentOf(wrapper))).toContain('vf-floating-transition-enter-from');
  });

  it('creates a new content node on every open', async () => {
    const wrapper = mountPopover();
    await openByClick(wrapper);
    const firstNode = contentOf(wrapper);
    await openByClick(wrapper);
    await openByClick(wrapper);

    expect(contentOf(wrapper)).not.toBeNull();
    expect(contentOf(wrapper)).not.toBe(firstNode);
  });
});

// ------------------------------------------------------------ modal branch

describe('VfPopover characterization: focus-scope branch', () => {
  // As for the dropdown: the branch matters only inside an active modal focus
  // trap, where it makes the teleported content part of the trap's scope.
  async function mountInTrap() {
    const Trap = defineComponent({
      setup(_, { slots }) {
        const container = ref<HTMLElement | null>(null);
        useFocusTrap(container, { enabled: true });
        return () => h('div', { ref: container, class: 'trap' }, slots.default?.());
      },
    });
    const Host: Component = {
      render: () =>
        h(Trap, null, () => [
          h('button', { type: 'button', class: 'first' }, 'First'),
          h(VfPopover, null, {
            trigger: () => 'T',
            default: () => h('button', { type: 'button', class: 'inside' }, 'In'),
          }),
        ]),
    };
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    await flushPromises();
    click(document.querySelector('.vf-popover__trigger')!);
    await flushPromises();
    return document.querySelector<HTMLElement>('body > .vf-popover__content .inside')!;
  }

  it('keeps the teleported content inside the trap scope: Shift+Tab from its button is left to the browser', async () => {
    const inside = await mountInTrap();
    inside.focus();

    expect(key(inside, 'Tab', { shiftKey: true }).defaultPrevented).toBe(false);
  });

  it('wraps Tab from the content button, the last element of the scope, to the first', async () => {
    const inside = await mountInTrap();
    inside.focus();

    expect(key(inside, 'Tab').defaultPrevented).toBe(true);
    expect(labelOf(document.activeElement)).toBe('First');
  });
});
