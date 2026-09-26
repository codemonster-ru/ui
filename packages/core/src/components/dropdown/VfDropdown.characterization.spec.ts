// Characterization of the historical VfDropdown at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The first migrated overlay: a trigger wrapper the component owns, and a
// `role=menu` panel it creates on open, teleports out of its own root, positions
// with floater.js, animates in and out, and destroys on close. Everything a
// port could get wrong is a quirk of *how* the reference does that, so the
// quirks are the contract pinned here - measured, not assumed from what a
// dropdown usually does:
//
//   - the trigger opens on ArrowDown, Enter and Space only. ArrowUp, Home, End
//     and Escape on a closed trigger do nothing and are not prevented;
//   - the menu's arrow keys walk every `[role="menuitem"]` in the panel,
//     disabled or not. Focusing a disabled <button> is a no-op, so a disabled
//     button blocks the walk where it stands; a disabled VfMenuItem link keeps
//     tabindex=-1, is focusable, and is walked onto;
//   - from focus that is inside the menu but on no item, ArrowUp lands on the
//     *second to last* item: the index arithmetic starts from -1;
//   - a keyboard open whose first item cannot take focus leaves focus on the
//     trigger, and every further ArrowDown there re-opens: update:open and
//     openChange are emitted again for a menu that is already open;
//   - Tab is not handled anywhere: focus leaves and the menu stays open;
//   - a click anywhere inside the panel - an item, the arrow, the padding -
//     closes it when closeOnSelect is true, and focuses the trigger;
//   - an outside click is a document `click` (not pointerdown), closes, and
//     moves focus back to the trigger - away from whatever was clicked;
//   - nothing makes two dropdowns mutually exclusive. A pointer open closes an
//     open neighbour only because the neighbour sees an outside click, and the
//     neighbour then focuses *its own* trigger. Keyboard opens leave both open;
//   - Escape is the shared LIFO escape stack: one document keydown listener,
//     only the most recently opened dropdown closes, and a prevented Escape is
//     ignored;
//   - floater.js is called with the trigger and the panel, `placement`, the
//     middleware offset(10), flip over the two placements of the same side,
//     shift() and arrow(<arrow span>), strategy 'fixed', and autoUpdate on the
//     trigger alone. A top placement adds `--top` to the panel and swaps the
//     arrow modifier; the last placement and position survive a close and are
//     what the next open renders first;
//   - the transition is `vf-floating-transition` with appear and an explicit
//     duration of the theme's normal motion (320 ms) both ways: the leaving
//     panel stays in the DOM for that long, and every open creates a new node.
//
// Real-browser facts jsdom cannot show - Chrome swallowing a click on a
// disabled button, focus falling to <body> when one is pressed, the geometry
// floater.js computes - are measured by the three-way parity catalog
// (contracts/dropdown/cases.json) and recorded in the M28 appendix.
import { mount, flushPromises } from '@vue/test-utils';
import { renderToString, type SSRContext } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, nextTick, ref, type Component } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import VfDropdown from './VfDropdown.vue';
import { VfMenu, VfMenuItem } from '@/components/menu';
import { useFocusTrap } from '@/composables/useFocusTrap';

type FloaterModule = typeof import('@codemonster-ru/floater.js');
type ComputeArguments = Parameters<FloaterModule['computePosition']>;

// A transparent recorder around the real floater.js. By default every call is
// forwarded, so the component runs exactly as it does in a page; a test that
// needs a specific geometry installs `fake` and receives the same inputs.
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

// Instant enter and leave: the panel is rendered and removed in the same tick,
// with no wrapper element of the stub's own. Transition timing is pinned with
// the real component in its own section.
const InstantTransition = defineComponent({
  inheritAttrs: false,
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.(),
});

const ITEMS = [
  '<button type="button" role="menuitem">Alpha</button>',
  '<button type="button" role="menuitem">Beta</button>',
  '<button type="button" role="menuitem">Gamma</button>',
].join('');

interface MountOptions {
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  realTransition?: boolean;
  host?: HTMLElement;
}

function mountDropdown({ props = {}, attrs = {}, slots = {}, realTransition = false, host }: MountOptions = {}) {
  const attachTo = host ?? document.body.appendChild(document.createElement('div'));

  return mount(VfDropdown, {
    props,
    attrs,
    slots: { trigger: '<span class="label">Actions</span>', default: ITEMS, ...slots } as never,
    attachTo,
    global: { stubs: { transition: realTransition ? false : InstantTransition } },
  });
}

type Wrapper = ReturnType<typeof mountDropdown>;

const triggerOf = (wrapper: Wrapper) => wrapper.get('.vf-dropdown__trigger').element as HTMLElement;
const menuOf = (wrapper: Wrapper) => document.getElementById(triggerOf(wrapper).getAttribute('aria-controls') ?? '');
const itemsOf = (wrapper: Wrapper) => [...(menuOf(wrapper)?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
const labelOf = (element: Element | null) => (element?.textContent ?? '').trim();
const last = <T>(list: readonly T[]) => list[list.length - 1];
/** The open/close emits of one wrapper, in the order they happened. */
const emitted = (wrapper: Wrapper) => {
  const events = wrapper.emitted() as Record<string, unknown[][]>;
  return (events['update:open'] ?? []).flatMap((call, index) => [
    ['update:open', call[0]],
    ['openChange', events.openChange?.[index]?.[0]],
  ]);
};

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

async function openByKey(wrapper: Wrapper, name = 'ArrowDown') {
  triggerOf(wrapper).focus();
  key(triggerOf(wrapper), name);
  await flushPromises();
}

/**
 * Two dropdowns in one application, which is how a consumer renders them.
 *
 * Two separate `mount` calls are two Vue applications, and Vue's useId counts
 * per application: both would generate `vf-dropdown-menu-v-0`. That collision is
 * pinned on its own below; every multi-instance claim is made inside one app.
 */
function mountPair(first: Record<string, unknown> = {}, second: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup: () => () =>
      h('div', [
        h(
          VfDropdown,
          { class: 'first', ...first },
          { trigger: () => h('span', 'First'), default: () => h('div', { innerHTML: ITEMS }) },
        ),
        h(
          VfDropdown,
          { class: 'second', ...second },
          { trigger: () => h('span', 'Second'), default: () => h('div', { innerHTML: ITEMS }) },
        ),
      ]),
  });
  const wrapper = mount(Host, {
    attachTo: document.body.appendChild(document.createElement('div')),
    global: { stubs: { transition: InstantTransition } },
  });
  const part = (name: 'first' | 'second') => {
    const trigger = () => wrapper.get(`.${name} > .vf-dropdown__trigger`).element as HTMLElement;
    return {
      trigger,
      menu: () => document.getElementById(trigger().getAttribute('aria-controls') ?? ''),
      async openByKey() {
        trigger().focus();
        key(trigger(), 'ArrowDown');
        await flushPromises();
      },
    };
  };
  return { wrapper, first: part('first'), second: part('second') };
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

describe('VfDropdown characterization: closed structure', () => {
  it('renders one root holding one trigger wrapper, and nothing else, while closed', () => {
    const wrapper = mountDropdown();
    const root = wrapper.element as HTMLElement;

    expect(root.tagName).toBe('DIV');
    expect(root.className).toBe('vf-dropdown');
    expect([...root.children].map((child) => child.className)).toEqual(['vf-dropdown__trigger']);
    expect(document.querySelector('.vf-dropdown__menu')).toBeNull();
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it('writes exactly the historical trigger attributes, in no role of its own', () => {
    const trigger = triggerOf(mountDropdown());

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
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('tabindex')).toBe('0');
    expect(trigger.hasAttribute('role')).toBe(false);
    expect(trigger.hasAttribute('aria-disabled')).toBe(false);
  });

  it('points aria-controls at the future menu id while closed: the reference is dangling', () => {
    const trigger = triggerOf(mountDropdown());
    const controls = trigger.getAttribute('aria-controls') ?? '';

    expect(controls).toMatch(/^vf-dropdown-menu-v-\d+$/);
    expect(document.getElementById(controls)).toBeNull();
  });

  it('generates the trigger id and the menu id from two prefixes, the menu first', () => {
    const trigger = triggerOf(mountDropdown());
    const menuSuffix = Number(last((trigger.getAttribute('aria-controls') ?? '').split('-')));
    const triggerSuffix = Number(last(trigger.id.split('-')));

    expect(trigger.id).toMatch(/^vf-dropdown-trigger-v-\d+$/);
    expect(triggerSuffix).toBe(menuSuffix + 1);
  });

  it('keeps the same menu id across closed and open: the future id is the real one', async () => {
    const wrapper = mountDropdown();
    const controls = triggerOf(wrapper).getAttribute('aria-controls');

    await openByClick(wrapper);

    expect(menuOf(wrapper)?.id).toBe(controls);
    expect(triggerOf(wrapper).getAttribute('aria-controls')).toBe(controls);
  });

  it('renders the trigger slot inside the wrapper, verbatim', () => {
    const wrapper = mountDropdown({ slots: { trigger: '<button type="button" class="consumer">More</button>' } });

    expect(triggerOf(wrapper).innerHTML).toBe('<button type="button" class="consumer">More</button>');
  });

  it('renders an empty trigger wrapper when the trigger slot is empty', () => {
    const wrapper = mount(VfDropdown, { attachTo: document.body.appendChild(document.createElement('div')) });

    expect(triggerOf(wrapper as Wrapper).innerHTML).toBe('');
    expect(triggerOf(wrapper as Wrapper).getAttribute('tabindex')).toBe('0');
  });

  it('exposes open, toggle and disabled to the trigger slot', async () => {
    const seen: unknown[] = [];
    const wrapper = mountDropdown({
      slots: {
        trigger: (scope: { open: boolean; toggle: () => void; disabled: boolean }) => {
          seen.push({ open: scope.open, disabled: scope.disabled, toggle: typeof scope.toggle });
          return h('button', { type: 'button', onClick: (event: Event) => event.stopPropagation() }, 'T');
        },
      },
    });

    expect(last(seen)).toEqual({ open: false, disabled: false, toggle: 'function' });

    await openByClick(wrapper);
    expect(last(seen)).toEqual({ open: true, disabled: false, toggle: 'function' });
  });

  it('renders the historical markup on the server: the trigger and the teleport placeholders', async () => {
    const context: SSRContext = {};
    const html = await renderToString(
      createSSRApp({ render: () => h(VfDropdown, null, { trigger: () => 'Actions', default: () => 'Menu' }) }),
      context,
    );

    expect(html).toMatch(
      /^<div class="vf-dropdown"><div id="vf-dropdown-trigger-v-\d+" class="vf-dropdown__trigger" aria-controls="vf-dropdown-menu-v-\d+" aria-expanded="false" aria-haspopup="menu" tabindex="0"><!--\[-->Actions<!--\]--><\/div><!--teleport start--><!--teleport end--><\/div>$/,
    );
    expect(context.teleports?.body).toBe(
      '<!--teleport start anchor--><!--[--><!--v-if--><!--]--><!--teleport anchor-->',
    );
  });

  it('renders an open dropdown on the server into the teleport buffer, unpositioned', async () => {
    const context: SSRContext = {};
    const html = await renderToString(
      createSSRApp({
        render: () => h(VfDropdown, { defaultOpen: true }, { trigger: () => 'Actions', default: () => 'Menu' }),
      }),
      context,
    );

    expect(html).toContain('aria-expanded="true"');
    expect(context.teleports?.body).toMatch(
      /^<!--teleport start anchor--><!--\[--><div id="vf-dropdown-menu-v-\d+" class="vf-dropdown__menu vf-dropdown__menu--default" style="left:0px;top:0px;" aria-labelledby="vf-dropdown-trigger-v-\d+" role="menu"><span class="vf-dropdown__arrow vf-dropdown__arrow--bottom" style="left:0px;top:0px;" aria-hidden="true"><\/span><!--\[-->Menu<!--\]--><\/div><!--\]--><!--teleport anchor-->$/,
    );
  });
});

// ------------------------------------------------------------------- attrs

describe('VfDropdown characterization: attrs', () => {
  it('forwards id, data-*, aria-label and style to the root, not to the trigger', () => {
    const wrapper = mountDropdown({
      attrs: { id: 'consumer', 'data-testid': 'dd', 'aria-label': 'Menu', style: 'margin-top: 4px;' },
    });
    const root = wrapper.element as HTMLElement;

    expect(root.id).toBe('consumer');
    expect(root.getAttribute('data-testid')).toBe('dd');
    expect(root.getAttribute('aria-label')).toBe('Menu');
    expect(root.getAttribute('style')).toBe('margin-top: 4px;');
    expect(triggerOf(wrapper).id).toMatch(/^vf-dropdown-trigger-v-\d+$/);
    expect(triggerOf(wrapper).hasAttribute('aria-label')).toBe(false);
  });

  it('merges a consumer class after vf-dropdown on the root, and nowhere else', async () => {
    const wrapper = mountDropdown({ attrs: { class: 'consumer extra' }, props: { defaultOpen: true } });
    await flushPromises();

    expect(wrapper.element.className).toBe('vf-dropdown consumer extra');
    expect(triggerOf(wrapper).className).toBe('vf-dropdown__trigger');
    expect(menuOf(wrapper)?.classList.contains('consumer')).toBe(false);
  });

  it('lets a consumer role and tabindex land on the root, leaving the trigger untouched', () => {
    const wrapper = mountDropdown({ attrs: { role: 'group', tabindex: '-1' } });

    expect(wrapper.element.getAttribute('role')).toBe('group');
    expect(wrapper.element.getAttribute('tabindex')).toBe('-1');
    expect(triggerOf(wrapper).getAttribute('tabindex')).toBe('0');
  });
});

// ------------------------------------------------------------- open structure

describe('VfDropdown characterization: open structure', () => {
  it('teleports the open menu to the end of <body>, outside the component root', async () => {
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();
    const menu = menuOf(wrapper)!;

    expect(menu.parentElement).toBe(document.body);
    expect(wrapper.element.contains(menu)).toBe(false);
    expect([...wrapper.element.children].map((child) => child.className)).toEqual(['vf-dropdown__trigger']);
  });

  it('writes exactly the historical menu attributes: id, classes, inline position, labelledby and role', async () => {
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();
    const menu = menuOf(wrapper)!;

    expect([...menu.attributes].map((attribute) => attribute.name).sort()).toEqual([
      'aria-labelledby',
      'class',
      'id',
      'role',
      'style',
    ]);
    expect(menu.getAttribute('role')).toBe('menu');
    expect(menu.getAttribute('aria-labelledby')).toBe(triggerOf(wrapper).id);
    expect(menu.className).toBe('vf-dropdown__menu vf-dropdown__menu--default');
    expect(menu.hasAttribute('tabindex')).toBe(false);
    expect(menu.hasAttribute('aria-orientation')).toBe(false);
  });

  it('opens with aria-expanded="true" and a resolvable aria-controls', async () => {
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();

    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('true');
    expect(menuOf(wrapper)).not.toBeNull();
  });

  it('puts an aria-hidden arrow span first in the menu, before the default slot', async () => {
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();
    const menu = menuOf(wrapper)!;
    const arrow = menu.firstElementChild as HTMLElement;

    expect(arrow.tagName).toBe('SPAN');
    expect(arrow.className).toBe('vf-dropdown__arrow vf-dropdown__arrow--bottom');
    expect(arrow.getAttribute('aria-hidden')).toBe('true');
    expect(arrow.childNodes).toHaveLength(0);
    expect([...menu.children].slice(1).map(labelOf)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('renders only the arrow in an open menu with an empty default slot', async () => {
    const wrapper = mountDropdown({ props: { defaultOpen: true }, slots: { default: '' } });
    await flushPromises();

    expect([...menuOf(wrapper)!.children].map((child) => child.className)).toEqual([
      'vf-dropdown__arrow vf-dropdown__arrow--bottom',
    ]);
  });

  it.each([
    ['pills', 'vf-dropdown__menu vf-dropdown__menu--pills'],
    ['bogus', 'vf-dropdown__menu vf-dropdown__menu--bogus'],
  ])('writes variant %s into a modifier without validating it', async (variant, expected) => {
    const wrapper = mountDropdown({ props: { defaultOpen: true, variant } });
    await flushPromises();

    expect(menuOf(wrapper)!.className).toBe(expected);
  });

  it('exposes close and open to the default slot', async () => {
    const wrapper = mountDropdown({
      props: { defaultOpen: true },
      slots: {
        default: (scope: { close: () => void; open: boolean }) =>
          h(
            'button',
            {
              type: 'button',
              class: 'closer',
              onClick: (event: Event) => {
                event.stopPropagation();
                scope.close();
              },
            },
            String(scope.open),
          ),
      },
    });
    await flushPromises();

    expect(labelOf(document.querySelector('.closer'))).toBe('true');
    click(document.querySelector('.closer')!);
    await flushPromises();
    expect(menuOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('renders consumer VfMenu and VfMenuItem as they are, nested menu role included', async () => {
    const wrapper = mountDropdown({
      props: { defaultOpen: true },
      slots: {
        default: () =>
          h(VfMenu, null, () => [h(VfMenuItem, { label: 'Edit' }), h(VfMenuItem, { label: 'Delete', tone: 'danger' })]),
      },
    });
    await flushPromises();
    const menu = menuOf(wrapper)!;

    expect(menu.querySelector(':scope > .vf-menu')?.getAttribute('role')).toBe('menu');
    expect(itemsOf(wrapper).map(labelOf)).toEqual(['Edit', 'Delete']);
  });
});

// ------------------------------------------------------------------ teleport

describe('VfDropdown characterization: teleport destination', () => {
  it('teleports into a selector target when teleportTo is a string', async () => {
    const target = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'overlay-root' }));
    const wrapper = mountDropdown({ props: { defaultOpen: true, teleportTo: '#overlay-root' } });
    await flushPromises();

    expect(menuOf(wrapper)!.parentElement).toBe(target);
  });

  it('teleports into an element when teleportTo is an HTMLElement', async () => {
    const target = document.body.appendChild(document.createElement('section'));
    const wrapper = mountDropdown({ props: { defaultOpen: true, teleportTo: target } });
    await flushPromises();

    expect(menuOf(wrapper)!.parentElement).toBe(target);
  });

  it.each([
    ['disableTeleport', { disableTeleport: true }],
    ['teleportTo=false', { teleportTo: false }],
    ['teleportTo=null', { teleportTo: null }],
  ])('renders the menu in place, after the trigger, with %s', async (_label, props) => {
    const wrapper = mountDropdown({ props: { defaultOpen: true, ...props } });
    await flushPromises();
    const menu = menuOf(wrapper)!;

    expect(menu.parentElement).toBe(wrapper.element);
    expect([...wrapper.element.children].map((child) => child.className)).toEqual([
      'vf-dropdown__trigger',
      'vf-dropdown__menu vf-dropdown__menu--default',
    ]);
  });

  it('lets disableTeleport win over a selector target', async () => {
    const target = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'overlay-root' }));
    const wrapper = mountDropdown({ props: { defaultOpen: true, teleportTo: '#overlay-root', disableTeleport: true } });
    await flushPromises();

    expect(target.children).toHaveLength(0);
    expect(menuOf(wrapper)!.parentElement).toBe(wrapper.element);
  });

  it('places teleported menus in body in mount order, whatever order they open in', async () => {
    const { first, second } = mountPair();

    await second.openByKey();
    await first.openByKey();

    const menus = [...document.body.querySelectorAll(':scope > .vf-dropdown__menu')];
    expect(menus).toEqual([first.menu(), second.menu()]);
  });
});

// ------------------------------------------------------------------ disabled

describe('VfDropdown characterization: disabled', () => {
  it('writes aria-disabled="true", tabindex="-1" and aria-expanded="false"', () => {
    const trigger = triggerOf(mountDropdown({ props: { disabled: true } }));

    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('tabindex')).toBe('-1');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders no menu even when open or defaultOpen is true', async () => {
    const controlled = mountDropdown({ props: { disabled: true, open: true } });
    const uncontrolled = mountDropdown({ props: { disabled: true, defaultOpen: true } });
    await flushPromises();

    expect(menuOf(controlled)).toBeNull();
    expect(menuOf(uncontrolled)).toBeNull();
  });

  it('closes an initially open disabled dropdown at setup, emitting both events once', async () => {
    const emits = recordEmits();
    mountDropdown({ props: { disabled: true, defaultOpen: true, ...emits.props } });
    await flushPromises();

    expect(emits.log).toEqual([
      ['update:open', false],
      ['openChange', false],
    ]);
  });

  it('ignores click and every opening key without preventing them', async () => {
    const wrapper = mountDropdown({ props: { disabled: true } });
    click(triggerOf(wrapper));
    const prevented = ['ArrowDown', 'Enter', ' '].map((name) => key(triggerOf(wrapper), name).defaultPrevented);
    await flushPromises();

    expect(prevented).toEqual([false, false, false]);
    expect(menuOf(wrapper)).toBeNull();
    expect(emitted(wrapper)).toEqual([]);
  });

  it('closes an open dropdown when disabled turns on, and stays closed when it turns off', async () => {
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();
    expect(menuOf(wrapper)).not.toBeNull();

    await wrapper.setProps({ disabled: true });
    await flushPromises();
    expect(menuOf(wrapper)).toBeNull();
    expect(emitted(wrapper)).toEqual([
      ['update:open', false],
      ['openChange', false],
    ]);

    await wrapper.setProps({ disabled: false });
    await flushPromises();
    expect(menuOf(wrapper)).toBeNull();
    expect(triggerOf(wrapper).getAttribute('tabindex')).toBe('0');
  });
});

// ---------------------------------------------------------------- controlled

describe('VfDropdown characterization: controlled', () => {
  it('follows the open prop and does not write its own state back', async () => {
    const wrapper = mountDropdown({ props: { open: true } });
    await flushPromises();
    expect(menuOf(wrapper)).not.toBeNull();

    click(triggerOf(wrapper));
    await flushPromises();

    expect(menuOf(wrapper)).not.toBeNull();
    expect(emitted(wrapper)).toEqual([
      ['update:open', false],
      ['openChange', false],
    ]);
  });

  it('closes with v-model write-back', async () => {
    const Host = defineComponent({
      setup() {
        const open = ref(true);
        return () =>
          h(
            VfDropdown,
            { open: open.value, 'onUpdate:open': (value: boolean) => (open.value = value) },
            { trigger: () => h('span', 'T'), default: () => h('button', { type: 'button', role: 'menuitem' }, 'Item') },
          );
      },
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    await flushPromises();

    click(document.querySelector('[role="menuitem"]')!);
    await flushPromises();
    expect(document.querySelector('.vf-dropdown__menu')).toBeNull();
  });

  it('emits nothing when the open prop changes from outside', async () => {
    const wrapper = mountDropdown({ props: { open: false } });
    await wrapper.setProps({ open: true });
    await flushPromises();

    expect(menuOf(wrapper)).not.toBeNull();
    expect(emitted(wrapper)).toEqual([]);
  });
});

// ------------------------------------------------------------------- pointer

describe('VfDropdown characterization: pointer', () => {
  it('opens on a trigger click, leaves focus where it was, and emits update:open then openChange', async () => {
    const emits = recordEmits();
    const wrapper = mountDropdown({ props: emits.props });
    const outside = document.body.appendChild(document.createElement('button'));
    outside.focus();

    await openByClick(wrapper);

    expect(menuOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(outside);
    expect(emits.log).toEqual([
      ['update:open', true],
      ['openChange', true],
    ]);
  });

  it('closes on a second trigger click and focuses the trigger', async () => {
    const wrapper = mountDropdown();
    await openByClick(wrapper);
    await openByClick(wrapper);

    expect(menuOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles from a click on a consumer control nested in the trigger', async () => {
    const wrapper = mountDropdown({ slots: { trigger: '<button type="button" class="consumer">More</button>' } });

    click(wrapper.get('.consumer').element);
    await flushPromises();

    expect(menuOf(wrapper)).not.toBeNull();
  });

  it.each([
    ['an item', (menu: HTMLElement) => menu.querySelector('[role="menuitem"]')!],
    ['the arrow', (menu: HTMLElement) => menu.querySelector('.vf-dropdown__arrow')!],
    ['the panel itself', (menu: HTMLElement) => menu],
    ['a non-item child', (menu: HTMLElement) => menu.querySelector('.note')!],
  ])('closes on a click on %s inside the menu, and focuses the trigger', async (_label, pick) => {
    const wrapper = mountDropdown({ slots: { default: `${ITEMS}<p class="note">Note</p>` } });
    await openByClick(wrapper);

    click(pick(menuOf(wrapper)!));
    await flushPromises();

    expect(menuOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('keeps the menu open on an inside click with closeOnSelect=false', async () => {
    const wrapper = mountDropdown({ props: { closeOnSelect: false } });
    await openByClick(wrapper);

    click(itemsOf(wrapper)[0]);
    await flushPromises();

    expect(menuOf(wrapper)).not.toBeNull();
    expect(emitted(wrapper)).toEqual([
      ['update:open', true],
      ['openChange', true],
    ]);
  });

  it('closes on an outside document click and moves focus to the trigger, away from what was clicked', async () => {
    const wrapper = mountDropdown();
    const outside = document.body.appendChild(document.createElement('input'));
    await openByClick(wrapper);
    outside.focus();

    click(outside);
    await flushPromises();

    expect(menuOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('does not close on an outside pointerdown or mousedown: the outside event is click', async () => {
    const wrapper = mountDropdown();
    const outside = document.body.appendChild(document.createElement('div'));
    await openByClick(wrapper);

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flushPromises();

    expect(menuOf(wrapper)).not.toBeNull();
  });

  it('does not close on an outside click that never reaches the document', async () => {
    const wrapper = mountDropdown();
    const outside = document.body.appendChild(document.createElement('div'));
    outside.addEventListener('click', (event) => event.stopPropagation());
    await openByClick(wrapper);

    click(outside);
    await flushPromises();

    expect(menuOf(wrapper)).not.toBeNull();
  });
});

// ------------------------------------------------------- keyboard on trigger

describe('VfDropdown characterization: trigger keyboard', () => {
  it.each(['ArrowDown', 'Enter', ' '])('opens on %s, prevents it and focuses the first item', async (name) => {
    const wrapper = mountDropdown();
    triggerOf(wrapper).focus();
    const event = key(triggerOf(wrapper), name);
    await flushPromises();

    expect(event.defaultPrevented).toBe(true);
    expect(menuOf(wrapper)).not.toBeNull();
    expect(labelOf(document.activeElement)).toBe('Alpha');
  });

  it.each(['ArrowUp', 'Home', 'End', 'Escape', 'Tab', 'ArrowRight', 'a'])(
    'does not open on %s and does not prevent it',
    async (name) => {
      const wrapper = mountDropdown();
      triggerOf(wrapper).focus();
      const event = key(triggerOf(wrapper), name);
      await flushPromises();

      expect(event.defaultPrevented).toBe(false);
      expect(menuOf(wrapper)).toBeNull();
      expect(document.activeElement).toBe(triggerOf(wrapper));
    },
  );

  it('handles opening keys that bubble from a consumer control inside the trigger', async () => {
    const wrapper = mountDropdown({ slots: { trigger: '<button type="button" class="consumer">More</button>' } });
    const consumer = wrapper.get('.consumer').element as HTMLElement;
    consumer.focus();

    const event = key(consumer, 'Enter');
    await flushPromises();

    expect(event.defaultPrevented).toBe(true);
    expect(labelOf(document.activeElement)).toBe('Alpha');
  });

  it('re-emits both events on every opening key while already open, and refocuses the first item', async () => {
    const emits = recordEmits();
    const wrapper = mountDropdown({ props: emits.props });
    await openByKey(wrapper);
    triggerOf(wrapper).focus();
    key(triggerOf(wrapper), 'ArrowDown');
    await flushPromises();

    expect(emits.log).toEqual([
      ['update:open', true],
      ['openChange', true],
      ['update:open', true],
      ['openChange', true],
    ]);
    expect(labelOf(document.activeElement)).toBe('Alpha');
  });

  it('leaves focus on the trigger when the first item is a disabled button', async () => {
    const wrapper = mountDropdown({
      slots: {
        default:
          '<button type="button" role="menuitem" disabled>Off</button><button type="button" role="menuitem">On</button>',
      },
    });
    await openByKey(wrapper);

    expect(menuOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('opens with nothing focused when the menu has no item', async () => {
    const wrapper = mountDropdown({ slots: { default: '<p>Empty</p>' } });
    await openByKey(wrapper);

    expect(menuOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });
});

// ---------------------------------------------------------- keyboard in menu

describe('VfDropdown characterization: menu keyboard', () => {
  async function openAndFocus(wrapper: Wrapper, index: number) {
    await openByKey(wrapper);
    itemsOf(wrapper)[index].focus();
  }

  it.each([
    ['ArrowDown', 0, 'Beta'],
    ['ArrowDown', 2, 'Alpha'],
    ['ArrowUp', 1, 'Alpha'],
    ['ArrowUp', 0, 'Gamma'],
    ['Home', 2, 'Alpha'],
    ['End', 0, 'Gamma'],
  ])('%s from item %i focuses %s and is prevented', async (name, from, expected) => {
    const wrapper = mountDropdown();
    await openAndFocus(wrapper, from);

    const event = key(document.activeElement!, name);

    expect(event.defaultPrevented).toBe(true);
    expect(labelOf(document.activeElement)).toBe(expected);
  });

  it.each(['Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'PageDown', 'a'])(
    'leaves %s to the browser inside the menu',
    async (name) => {
      const wrapper = mountDropdown();
      await openAndFocus(wrapper, 1);

      const event = key(document.activeElement!, name);
      await flushPromises();

      expect(event.defaultPrevented).toBe(false);
      expect(labelOf(document.activeElement)).toBe('Beta');
      expect(menuOf(wrapper)).not.toBeNull();
    },
  );

  it('starts from -1 when focus is inside the menu but on no item: ArrowDown goes first, ArrowUp second to last', async () => {
    const wrapper = mountDropdown({ slots: { default: `<input class="search">${ITEMS}` } });
    await openByKey(wrapper);
    const search = menuOf(wrapper)!.querySelector<HTMLElement>('.search')!;

    search.focus();
    key(search, 'ArrowDown');
    expect(labelOf(document.activeElement)).toBe('Alpha');

    search.focus();
    key(search, 'ArrowUp');
    expect(labelOf(document.activeElement)).toBe('Beta');
  });

  it('walks disabled items too: a disabled button cannot take focus and blocks the walk where it stands', async () => {
    const wrapper = mountDropdown({
      slots: {
        default:
          '<button type="button" role="menuitem">One</button>' +
          '<button type="button" role="menuitem" disabled>Two</button>' +
          '<button type="button" role="menuitem">Three</button>',
      },
    });
    await openAndFocus(wrapper, 0);

    key(document.activeElement!, 'ArrowDown');
    expect(labelOf(document.activeElement)).toBe('One');
    key(document.activeElement!, 'ArrowDown');
    expect(labelOf(document.activeElement)).toBe('One');

    itemsOf(wrapper)[2].focus();
    key(document.activeElement!, 'ArrowUp');
    expect(labelOf(document.activeElement)).toBe('Three');
  });

  it('walks onto a disabled VfMenuItem link, which keeps tabindex=-1 and takes focus', async () => {
    const wrapper = mountDropdown({
      slots: {
        default: () =>
          h(VfMenu, null, () => [
            h(VfMenuItem, { label: 'First' }),
            h(VfMenuItem, { label: 'Linked', href: '/x', disabled: true }),
            h(VfMenuItem, { label: 'Last' }),
          ]),
      },
    });
    await openAndFocus(wrapper, 0);

    key(document.activeElement!, 'ArrowDown');
    expect(labelOf(document.activeElement)).toBe('Linked');
    key(document.activeElement!, 'ArrowDown');
    expect(labelOf(document.activeElement)).toBe('Last');
  });

  it('counts only role="menuitem", at any depth', async () => {
    const wrapper = mountDropdown({
      slots: {
        default:
          '<div><button type="button" role="menuitem">Deep</button></div>' +
          '<button type="button" role="menuitemcheckbox">Check</button>' +
          '<button type="button">Plain</button>' +
          '<button type="button" role="menuitem">Flat</button>',
      },
    });
    await openAndFocus(wrapper, 0);

    expect(itemsOf(wrapper).map(labelOf)).toEqual(['Deep', 'Flat']);
    key(document.activeElement!, 'ArrowDown');
    expect(labelOf(document.activeElement)).toBe('Flat');
  });

  it('does not close on Tab: the menu stays open wherever focus goes', async () => {
    const wrapper = mountDropdown();
    await openAndFocus(wrapper, 0);
    key(document.activeElement!, 'Tab');
    document.body.appendChild(document.createElement('button')).focus();
    await flushPromises();

    expect(menuOf(wrapper)).not.toBeNull();
    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('true');
  });

  it('closes when Enter or Space activates a focused item, through the click it synthesises', async () => {
    const wrapper = mountDropdown();
    await openAndFocus(wrapper, 1);

    (document.activeElement as HTMLElement).click();
    await flushPromises();

    expect(menuOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });
});

// ------------------------------------------------------------------- Escape

describe('VfDropdown characterization: Escape', () => {
  it('closes on a document Escape from anywhere, prevents it and focuses the trigger', async () => {
    const emits = recordEmits();
    const wrapper = mountDropdown({ props: emits.props });
    await openByClick(wrapper);
    const elsewhere = document.body.appendChild(document.createElement('input'));
    elsewhere.focus();

    const event = key(elsewhere, 'Escape');
    await flushPromises();

    expect(event.defaultPrevented).toBe(true);
    expect(menuOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
    expect(emits.log.slice(-2)).toEqual([
      ['update:open', false],
      ['openChange', false],
    ]);
  });

  it('handles Escape on keydown only', async () => {
    const wrapper = mountDropdown();
    await openByClick(wrapper);

    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', bubbles: true, cancelable: true }));
    await flushPromises();

    expect(menuOf(wrapper)).not.toBeNull();
  });

  it('does not prevent Escape while closed', () => {
    mountDropdown();

    expect(key(document.body, 'Escape').defaultPrevented).toBe(false);
  });

  it('ignores an Escape something else already prevented', async () => {
    const wrapper = mountDropdown();
    await openByClick(wrapper);
    const guard = (event: KeyboardEvent) => event.preventDefault();
    window.addEventListener('keydown', guard, { capture: true });

    key(document.body, 'Escape');
    await flushPromises();
    window.removeEventListener('keydown', guard, { capture: true });

    expect(menuOf(wrapper)).not.toBeNull();
  });

  it('closes only the most recently opened dropdown, one per Escape: a LIFO stack', async () => {
    const { first, second } = mountPair();
    await first.openByKey();
    await second.openByKey();

    key(document.activeElement!, 'Escape');
    await flushPromises();
    expect(first.menu()).not.toBeNull();
    expect(second.menu()).toBeNull();
    expect(document.activeElement).toBe(second.trigger());

    key(document.activeElement!, 'Escape');
    await flushPromises();
    expect(first.menu()).toBeNull();
    expect(document.activeElement).toBe(first.trigger());
  });

  it('orders the stack by opening, not by mount: the later-mounted dropdown opened first closes last', async () => {
    const { first, second } = mountPair();
    await second.openByKey();
    await first.openByKey();

    key(document.body, 'Escape');
    await flushPromises();
    expect(first.menu()).toBeNull();
    expect(second.menu()).not.toBeNull();
  });

  it('moves a reopened dropdown back to the top of the stack', async () => {
    const { first, second } = mountPair();
    await first.openByKey();
    await second.openByKey();
    key(document.body, 'Escape');
    await flushPromises();
    await second.openByKey();

    key(document.body, 'Escape');
    await flushPromises();
    expect(second.menu()).toBeNull();
    expect(first.menu()).not.toBeNull();
  });
});

// ----------------------------------------------------------- multiple instances

describe('VfDropdown characterization: multiple instances', () => {
  it('gives every instance of one app its own trigger and menu ids, wired to each other and to nothing else', async () => {
    const { first, second } = mountPair({ defaultOpen: true }, { defaultOpen: true });
    await flushPromises();
    const ids = [first, second].flatMap((part) => [part.trigger().id, part.menu()!.id]);

    expect(new Set(ids).size).toBe(4);
    for (const part of [first, second]) {
      expect(part.menu()!.getAttribute('aria-labelledby')).toBe(part.trigger().id);
    }
  });

  it('generates the same ids in two separate applications: useId counts per app', () => {
    const one = mountDropdown();
    const two = mountDropdown();

    expect(triggerOf(one).id).toBe(triggerOf(two).id);
    expect(triggerOf(one).getAttribute('aria-controls')).toBe(triggerOf(two).getAttribute('aria-controls'));
  });

  it('keeps two keyboard-opened dropdowns open at once: there is no mutual exclusion', async () => {
    const { first, second } = mountPair();
    await first.openByKey();
    await second.openByKey();

    expect(first.menu()).not.toBeNull();
    expect(second.menu()).not.toBeNull();
    expect(labelOf(document.activeElement)).toBe('Alpha');
    expect(second.menu()!.contains(document.activeElement)).toBe(true);
  });

  it('closes an open neighbour on a pointer open only as an outside click, and that neighbour focuses its own trigger', async () => {
    const { wrapper, first, second } = mountPair();
    click(first.trigger());
    await flushPromises();

    click(second.trigger());
    await flushPromises();

    expect(first.menu()).toBeNull();
    expect(second.menu()).not.toBeNull();
    expect(document.activeElement).toBe(first.trigger());
    const [firstDropdown, secondDropdown] = wrapper.findAllComponents(VfDropdown);
    expect(firstDropdown.emitted('openChange')).toEqual([[true], [false]]);
    expect(secondDropdown.emitted('openChange')).toEqual([[true]]);
  });

  it('closes both open neighbours on an outside click, each focusing its own trigger in mount order', async () => {
    const { first, second } = mountPair();
    await first.openByKey();
    await second.openByKey();

    click(document.body.appendChild(document.createElement('div')));
    await flushPromises();

    expect(first.menu()).toBeNull();
    expect(second.menu()).toBeNull();
    // Both listeners run; the later-mounted one focuses last.
    expect(document.activeElement).toBe(second.trigger());
  });
});

// ------------------------------------------------------------------ floating

describe('VfDropdown characterization: floating', () => {
  const position = (x: number, y: number, placement: string, arrow?: Record<string, number>) => () => ({
    x,
    y,
    placement,
    middlewareData: arrow ? { arrow } : {},
  });

  it('positions the menu against the trigger with the historical middleware and a fixed strategy', async () => {
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();
    const call = last(floating.calls)!;
    const middleware = call.options.middleware as { name: string; params?: Record<string, unknown> }[];

    expect(call.reference).toBe(triggerOf(wrapper));
    expect(call.floating).toBe(menuOf(wrapper));
    expect(call.options.placement).toBe('bottom-start');
    expect(call.options.strategy).toBe('fixed');
    expect(middleware.map((entry) => entry.name)).toEqual(['offset', 'flip', 'shift', 'arrow']);
    expect(middleware[0].params).toEqual({ value: 10 });
    expect(middleware[1].params).toEqual({ placements: ['bottom-start', 'top-start'] });
    expect(middleware[2].params).toBeUndefined();
    expect(middleware[3].params).toEqual({ arrow: menuOf(wrapper)!.querySelector('.vf-dropdown__arrow') });
  });

  it('flips between the two end placements for bottom-end', async () => {
    mountDropdown({ props: { defaultOpen: true, placement: 'bottom-end' } });
    await flushPromises();
    const call = last(floating.calls)!;
    const middleware = call.options.middleware as { name: string; params?: Record<string, unknown> }[];

    expect(call.options.placement).toBe('bottom-end');
    expect(middleware[1].params).toEqual({ placements: ['bottom-end', 'top-end'] });
  });

  it('treats any placement other than bottom-end as the start pair', async () => {
    mountDropdown({ props: { defaultOpen: true, placement: 'top-start' } });
    await flushPromises();
    const middleware = last(floating.calls)!.options.middleware as { params?: Record<string, unknown> }[];

    expect(last(floating.calls)!.options.placement).toBe('top-start');
    expect(middleware[1].params).toEqual({ placements: ['bottom-start', 'top-start'] });
  });

  it('writes the computed x and y into left and top, unrounded', async () => {
    floating.fake = position(12.5, 84.8589, 'bottom-start');
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();

    expect(menuOf(wrapper)!.getAttribute('style')).toBe('left: 12.5px; top: 84.8589px;');
  });

  it('writes the arrow offset relative to the menu from the arrow middleware data', async () => {
    floating.fake = position(10, 20, 'bottom-start', { x: 38.5, y: 15.5, baseX: 10, baseY: 20 });
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();

    expect(menuOf(wrapper)!.querySelector('.vf-dropdown__arrow')!.getAttribute('style')).toBe(
      'left: 28.5px; top: -4.5px;',
    );
  });

  it('writes a zero arrow offset when the arrow data lacks a base', async () => {
    floating.fake = position(10, 20, 'bottom-start', { x: 38 });
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();

    expect(menuOf(wrapper)!.querySelector('.vf-dropdown__arrow')!.getAttribute('style')).toBe('left: 0px; top: 0px;');
  });

  it('adds --top to the menu and swaps the arrow modifier when the computed placement is on top', async () => {
    floating.fake = position(10, 20, 'top-start');
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await flushPromises();

    expect(menuOf(wrapper)!.className).toBe('vf-dropdown__menu vf-dropdown__menu--default vf-dropdown__menu--top');
    expect(menuOf(wrapper)!.querySelector('.vf-dropdown__arrow')!.className).toBe(
      'vf-dropdown__arrow vf-dropdown__arrow--top',
    );
  });

  it('renders the last placement and position first on the next open, before recomputing', async () => {
    floating.fake = position(33, 44, 'top-end');
    const wrapper = mountDropdown();
    await openByClick(wrapper);
    await openByClick(wrapper);

    floating.fake = () => new Promise(() => {});
    click(triggerOf(wrapper));
    await nextTick();
    await nextTick();

    expect(menuOf(wrapper)!.className).toContain('vf-dropdown__menu--top');
    expect(menuOf(wrapper)!.getAttribute('style')).toBe('left: 33px; top: 44px;');
  });

  it('starts at left 0 and top 0 before the first computation', async () => {
    floating.fake = () => new Promise(() => {});
    const wrapper = mountDropdown({ props: { defaultOpen: true } });
    await nextTick();

    expect(menuOf(wrapper)!.getAttribute('style')).toBe('left: 0px; top: 0px;');
  });

  it('keeps the menu positioned with autoUpdate on the trigger alone, and stops on close', async () => {
    const wrapper = mountDropdown();
    await openByClick(wrapper);

    expect(floating.autoUpdates).toHaveLength(1);
    expect(floating.autoUpdates[0].reference).toBe(triggerOf(wrapper));
    expect(floating.autoUpdates[0].argumentCount).toBe(2);
    expect(floating.cleanups).toBe(0);

    await openByClick(wrapper);
    expect(floating.cleanups).toBe(1);
  });

  it('computes nothing while closed', async () => {
    mountDropdown();
    await flushPromises();

    expect(floating.calls).toHaveLength(0);
    expect(floating.autoUpdates).toHaveLength(0);
  });
});

// ---------------------------------------------------------------- transition

describe('VfDropdown characterization: transition', () => {
  const classes = (element: Element | null) => (element ? [...element.classList] : null);

  it('enters with vf-floating-transition classes: from and active, then active and to, then none after 320 ms', async () => {
    vi.useFakeTimers();
    const wrapper = mountDropdown({ realTransition: true });

    click(triggerOf(wrapper));
    await nextTick();
    const menu = menuOf(wrapper)!;
    expect(classes(menu)).toEqual([
      'vf-dropdown__menu',
      'vf-dropdown__menu--default',
      'vf-floating-transition-enter-from',
      'vf-floating-transition-enter-active',
    ]);

    await vi.advanceTimersByTimeAsync(40);
    expect(classes(menu)).toEqual([
      'vf-dropdown__menu',
      'vf-dropdown__menu--default',
      'vf-floating-transition-enter-active',
      'vf-floating-transition-enter-to',
    ]);

    // Still entering at 300 ms: the duration is the normal motion, not the fast one.
    await vi.advanceTimersByTimeAsync(260);
    expect(classes(menu)).toContain('vf-floating-transition-enter-active');

    await vi.advanceTimersByTimeAsync(70);
    expect(classes(menu)).toEqual(['vf-dropdown__menu', 'vf-dropdown__menu--default']);
  });

  it('leaves the menu in the DOM for 320 ms after the leave begins, then removes it', async () => {
    vi.useFakeTimers();
    const wrapper = mountDropdown({ realTransition: true });
    click(triggerOf(wrapper));
    await vi.advanceTimersByTimeAsync(400);
    const menu = menuOf(wrapper)!;

    click(triggerOf(wrapper));
    await nextTick();
    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('false');
    expect(menu.isConnected).toBe(true);
    expect(classes(menu)).toEqual([
      'vf-dropdown__menu',
      'vf-dropdown__menu--default',
      'vf-floating-transition-leave-from',
      'vf-floating-transition-leave-active',
    ]);

    await vi.advanceTimersByTimeAsync(40);
    expect(classes(menu)).toEqual([
      'vf-dropdown__menu',
      'vf-dropdown__menu--default',
      'vf-floating-transition-leave-active',
      'vf-floating-transition-leave-to',
    ]);
    expect(menu.isConnected).toBe(true);

    // The duration timer starts on the frame after the leave began, so the
    // panel is still there 320 ms after the click and gone shortly after.
    await vi.advanceTimersByTimeAsync(280);
    expect(menu.isConnected).toBe(true);

    await vi.advanceTimersByTimeAsync(80);
    expect(menu.isConnected).toBe(false);
    expect(menuOf(wrapper)).toBeNull();
  });

  it('runs the enter on the initial render of an open dropdown: appear', async () => {
    vi.useFakeTimers();
    const wrapper = mountDropdown({ realTransition: true, props: { defaultOpen: true } });
    await nextTick();

    expect(classes(menuOf(wrapper))).toContain('vf-floating-transition-enter-from');
  });

  it('creates a new menu node on every open', async () => {
    const wrapper = mountDropdown();
    await openByClick(wrapper);
    const firstNode = menuOf(wrapper);
    await openByClick(wrapper);
    await openByClick(wrapper);

    expect(menuOf(wrapper)).not.toBeNull();
    expect(menuOf(wrapper)).not.toBe(firstNode);
  });
});

// ------------------------------------------------------------ modal branch

describe('VfDropdown characterization: focus-scope branch', () => {
  // The branch matters only inside an active modal focus trap - a dialog, a
  // drawer - where it makes the teleported menu part of the trap's scope. A
  // branch counts only when it was activated after the trap, so the dropdown
  // is opened after the trap is up, as a user opens one inside a dialog.
  // Without the branch the menu item is outside the scope, the trigger is the
  // scope's last element, and the trap takes both probes over.
  async function mountInTrap(defaultOpen = false) {
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
          h(
            VfDropdown,
            { defaultOpen },
            { trigger: () => 'T', default: () => h('button', { type: 'button', role: 'menuitem' }, 'Inside') },
          ),
        ]),
    };
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    await flushPromises();
    if (!defaultOpen) {
      click(document.querySelector('.vf-dropdown__trigger')!);
      await flushPromises();
    }
    return {
      trigger: document.querySelector<HTMLElement>('.vf-dropdown__trigger')!,
      menuItem: document.querySelector<HTMLElement>('body > .vf-dropdown__menu [role="menuitem"]')!,
    };
  }

  it('puts the open menu after the trigger in a trap scope: Tab from the trigger is left to the browser', async () => {
    const { trigger } = await mountInTrap();
    trigger.focus();

    expect(key(trigger, 'Tab').defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps the teleported menu inside the trap scope: Shift+Tab from its item is left to the browser', async () => {
    const { menuItem } = await mountInTrap();
    menuItem.focus();

    expect(key(menuItem, 'Tab', { shiftKey: true }).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(menuItem);
  });

  it('wraps Tab from the menu item, the last element of the scope, to the first', async () => {
    const { menuItem } = await mountInTrap();
    menuItem.focus();

    expect(key(menuItem, 'Tab').defaultPrevented).toBe(true);
    expect(labelOf(document.activeElement)).toBe('First');
  });

  it('does not join a trap that activated after it: a dropdown mounted open inside a trap is outside its scope', async () => {
    // The child's onMounted runs before the parent's, so the branch is
    // registered before the trap and filtered out as older than it.
    const { trigger } = await mountInTrap(true);
    trigger.focus();

    expect(key(trigger, 'Tab').defaultPrevented).toBe(true);
    expect(labelOf(document.activeElement)).toBe('First');
  });
});
