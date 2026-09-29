// Characterization of the historical VfTooltip at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The third migrated overlay, and the first that is not a Popover with a
// different trigger. It owns no control, no disabled state, no emit and no
// keyboard handling; its whole behaviour is four listeners on the wrapper and
// one timer. Measured, not assumed:
//
//   - mouseenter and focusin both clear the timer and start a fresh one of
//     `openDelay` milliseconds (80 by default); only when it fires does the
//     tooltip open. mouseleave and focusout both clear the timer and close at
//     once. There is no hovered flag and no focused flag: the last event wins.
//     A mouseleave closes a tooltip whose trigger still has focus, a focusout
//     closes one that is still under the pointer, and focus moving between
//     two controls inside the wrapper closes it and schedules it again;
//   - `aria-describedby` on the trigger wrapper follows the open state alone.
//     Content decides only whether the tooltip element renders, by JavaScript
//     truthiness of `text` or the presence of a `content` slot - so an empty or
//     absent text opens a tooltip whose reference dangles, a whitespace-only
//     one and "0" render, and the slot wins over the text;
//   - Enter, Space, Escape and Tab mean nothing to it. It is not on the
//     escape stack useEscapeKey keeps for VfDropdown and VfPopover: an Escape
//     reaches a popover open beside or around an open tooltip;
//   - the tooltip is a teleported span[role=tooltip] with the arrow last, and
//     nothing in it points back at the trigger;
//   - unmounting cancels the timer and removes an open tooltip at once, with
//     no leave: the same thing that happens to a tooltip inside a VfPopover
//     whose content closes.
//
// Real-browser facts jsdom cannot show - the geometry floater.js computes,
// what Chrome exposes in its accessibility tree, the events a real pointer
// produces - are measured by the three-way parity catalog
// (contracts/tooltip/cases.json) and recorded in the M31 appendix.
import { flushPromises, mount } from '@vue/test-utils';
import { renderToString, type SSRContext } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, nextTick, ref, toRaw, transformVNodeArgs } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import VfTooltip from './VfTooltip.vue';
import VfPopover from '@/components/popover/VfPopover.vue';

type FloaterModule = typeof import('@codemonster-ru/floater.js');
type ComputeArguments = Parameters<FloaterModule['computePosition']>;

// A transparent recorder around the real floater.js, as in the popover suite.
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

const CONTROLS = '<button type="button" class="one">One</button><button type="button" class="two">Two</button>';

interface MountOptions {
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  realTransition?: boolean;
}

function mountTooltip({
  props = { text: 'Helpful hint' },
  attrs = {},
  slots = {},
  realTransition = false,
}: MountOptions = {}) {
  return mount(VfTooltip, {
    props,
    attrs,
    slots: { default: CONTROLS, ...slots } as never,
    attachTo: document.body.appendChild(document.createElement('div')),
    global: { stubs: { transition: realTransition ? false : InstantTransition } },
  });
}

type Wrapper = ReturnType<typeof mountTooltip>;

const rootOf = (wrapper: Wrapper) => wrapper.element as HTMLElement;
const triggerOf = (wrapper: Wrapper) => wrapper.get('.vf-tooltip__trigger').element as HTMLElement;
const controlOf = (wrapper: Wrapper, name: 'one' | 'two' = 'one') =>
  wrapper.get(`.${name}`).element as HTMLButtonElement;
const describedBy = (wrapper: Wrapper) => triggerOf(wrapper).getAttribute('aria-describedby');
const tooltipOf = (wrapper: Wrapper) => document.getElementById(describedBy(wrapper) ?? '');
const tooltips = () => [...document.querySelectorAll<HTMLElement>('.vf-tooltip__content')];
const last = <T>(list: readonly T[]) => list[list.length - 1];

// The four listeners live on the wrapper. mouseenter and mouseleave do not
// bubble, so they are dispatched where a browser dispatches them.
const enter = (wrapper: Wrapper) => rootOf(wrapper).dispatchEvent(new MouseEvent('mouseenter'));
const leave = (wrapper: Wrapper) => rootOf(wrapper).dispatchEvent(new MouseEvent('mouseleave'));

function key(target: Element | Document, name: string) {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/** Advances fake time and lets Vue render what the timer changed. */
async function after(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  await nextTick();
}

/** Opens a tooltip through the pointer path with the default delay. */
async function openByPointer(wrapper: Wrapper) {
  enter(wrapper);
  await after(80);
  await flushPromises();
}

/**
 * The tooltip's own open timers: every window.setTimeout of `delay` ms still
 * pending. vi.getTimerCount would count jsdom's timers too - focus() queues one.
 */
let openTimers: () => number = () => 0;

function trackOpenTimers(delay: number) {
  const live = new Set<unknown>();
  const set = window.setTimeout;
  const clear = window.clearTimeout;
  vi.spyOn(window, 'setTimeout').mockImplementation(((
    callback: (...args: unknown[]) => void,
    ms?: number,
    ...rest: unknown[]
  ) => {
    const id: unknown = set(
      (...args: unknown[]) => {
        live.delete(id);
        callback(...args);
      },
      ms,
      ...rest,
    );
    if (ms === delay) live.add(id);
    return id;
  }) as unknown as typeof window.setTimeout);
  // The component keeps its handle in a ref, which proxies an object handle.
  vi.spyOn(window, 'clearTimeout').mockImplementation(((id?: unknown) => {
    const raw = id !== null && typeof id === 'object' ? toRaw(id) : id;
    live.delete(raw);
    clear(raw as number);
  }) as typeof window.clearTimeout);
  return () => live.size;
}

beforeEach(() => {
  // Cleared before rather than after a test: the auto-unmount runs after each
  // test and needs the nodes it mounted.
  document.body.innerHTML = '';
  // Every computation lands on the requested placement at the origin unless a
  // test says otherwise: jsdom has no layout, so the real floater.js would
  // flip every top tooltip to the bottom.
  floating.fake = (_reference, _floating, options) => ({
    x: 0,
    y: 0,
    placement: (options as { placement: string }).placement,
    middlewareData: {},
  });
  floating.calls.length = 0;
  floating.autoUpdates.length = 0;
  floating.cleanups = 0;
  vi.useFakeTimers();
  openTimers = trackOpenTimers(80);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ---------------------------------------------------------------- public API

describe('VfTooltip characterization: public API', () => {
  it('declares exactly text, placement, openDelay, teleportTo and disableTeleport', () => {
    const props = (VfTooltip as unknown as { props: Record<string, { default?: unknown }> }).props;

    expect(Object.keys(props).sort()).toEqual(['disableTeleport', 'openDelay', 'placement', 'teleportTo', 'text']);
    expect(props.text.default).toBeUndefined();
    expect(props.placement.default).toBe('top');
    expect(props.openDelay.default).toBe(80);
    expect(props.teleportTo.default).toBeUndefined();
    expect(props.disableTeleport.default).toBe(false);
  });

  it('declares no emits and exposes nothing', () => {
    const component = VfTooltip as unknown as { emits?: unknown };
    const wrapper = mountTooltip();

    expect(component.emits).toBeUndefined();
    expect(Object.keys((wrapper.vm as unknown as { $: { exposed: unknown } }).$.exposed ?? {})).toEqual([]);
  });

  it('has no disabled contract: a disabled attribute lands on the root and the tooltip still opens', async () => {
    const wrapper = mountTooltip({ attrs: { disabled: '' } });
    await openByPointer(wrapper);

    expect(rootOf(wrapper).hasAttribute('disabled')).toBe(true);
    expect(tooltipOf(wrapper)?.textContent).toBe('Helpful hint');
  });

  it('forwards id, class, style and data-* to the root, never to the trigger or the tooltip', async () => {
    const wrapper = mountTooltip({
      attrs: {
        id: 'consumer',
        class: 'consumer-class',
        style: 'color: red;',
        'data-testid': 'tip',
        'aria-label': 'Help',
      },
    });
    await openByPointer(wrapper);

    expect(rootOf(wrapper).getAttribute('id')).toBe('consumer');
    expect(rootOf(wrapper).className).toBe('vf-tooltip consumer-class');
    expect(rootOf(wrapper).getAttribute('style')).toBe('color: red;');
    expect(rootOf(wrapper).getAttribute('data-testid')).toBe('tip');
    expect(rootOf(wrapper).getAttribute('aria-label')).toBe('Help');
    expect(triggerOf(wrapper).getAttributeNames().sort()).toEqual(['aria-describedby', 'class']);
    expect(tooltipOf(wrapper)!.getAttributeNames().sort()).toEqual(['class', 'id', 'role', 'style']);
  });

  it('renders the default slot inside the trigger wrapper, verbatim, and an empty wrapper for none', () => {
    const filled = mountTooltip();
    const empty = mount(VfTooltip, { props: { text: 'Hint' } });

    expect(triggerOf(filled).innerHTML).toBe(CONTROLS);
    expect(empty.get('.vf-tooltip__trigger').element.innerHTML).toBe('');
  });

  it('passes no slot props to either slot', async () => {
    const seen: unknown[] = [];
    const wrapper = mountTooltip({
      slots: {
        default: (props: unknown) => (seen.push(props), h('button', { type: 'button', class: 'one' }, 'One')),
        content: (props: unknown) => (seen.push(props), 'Body'),
      },
    });
    await openByPointer(wrapper);

    expect(seen.length).toBeGreaterThanOrEqual(2);
    for (const props of seen) expect(props).toEqual({});
  });
});

// --------------------------------------------------------- content truthiness

describe('VfTooltip characterization: content', () => {
  const openWith = async (props: Record<string, unknown>, slots: Record<string, unknown> = {}) => {
    const wrapper = mountTooltip({ props, slots });
    await openByPointer(wrapper);
    return wrapper;
  };

  it('renders the text prop as the tooltip body, before the arrow', async () => {
    const wrapper = await openWith({ text: 'Helpful hint' });
    const tooltip = tooltipOf(wrapper)!;

    expect(tooltip.textContent).toBe('Helpful hint');
    expect(tooltip.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(tooltip.lastElementChild?.classList.contains('vf-tooltip__arrow')).toBe(true);
  });

  it('with no text and no content slot opens with a dangling aria-describedby and renders nothing', async () => {
    const wrapper = await openWith({});

    expect(describedBy(wrapper)).toMatch(/^vf-tooltip-/);
    expect(tooltipOf(wrapper)).toBeNull();
    expect(tooltips()).toHaveLength(0);
  });

  it('treats an empty text exactly as no text: the reference dangles', async () => {
    const wrapper = await openWith({ text: '' });

    expect(describedBy(wrapper)).toMatch(/^vf-tooltip-/);
    expect(tooltipOf(wrapper)).toBeNull();
  });

  it('renders a whitespace-only text verbatim: it is truthy', async () => {
    const wrapper = await openWith({ text: '   ' });

    expect(tooltipOf(wrapper)).not.toBeNull();
    expect(tooltipOf(wrapper)!.textContent).toBe('   ');
  });

  it('renders the string "0": it is truthy', async () => {
    const wrapper = await openWith({ text: '0' });

    expect(tooltipOf(wrapper)!.textContent).toBe('0');
  });

  it('renders the content slot when there is no text', async () => {
    const wrapper = await openWith({}, { content: '<strong>Rich</strong> body' });

    expect(tooltipOf(wrapper)!.innerHTML).toMatch(/^<strong>Rich<\/strong> body<span class="vf-tooltip__arrow/);
  });

  it('lets the content slot win over the text', async () => {
    const wrapper = await openWith({ text: 'Ignored text' }, { content: 'Slot body' });

    expect(tooltipOf(wrapper)!.textContent).toBe('Slot body');
  });

  it('renders a tooltip holding only the arrow for a content slot that renders nothing', async () => {
    const wrapper = await openWith({}, { content: () => [] });

    expect(tooltipOf(wrapper)).not.toBeNull();
    expect(tooltipOf(wrapper)!.textContent).toBe('');
    expect(tooltipOf(wrapper)!.children).toHaveLength(1);
  });

  it('keeps the reference dangling while text is emptied under an open tooltip, and resolves it when text returns', async () => {
    const wrapper = await openWith({ text: 'Hint' });
    await wrapper.setProps({ text: '' });
    await flushPromises();

    expect(describedBy(wrapper)).not.toBeNull();
    expect(tooltipOf(wrapper)).toBeNull();

    await wrapper.setProps({ text: 'Back' });
    await flushPromises();
    expect(tooltipOf(wrapper)!.textContent).toBe('Back');
  });
});

// ------------------------------------------------------------ closed structure

describe('VfTooltip characterization: closed structure', () => {
  it('renders a span root holding a span trigger wrapper, and nothing else, while closed', () => {
    const wrapper = mountTooltip();

    expect(rootOf(wrapper).tagName).toBe('SPAN');
    expect(rootOf(wrapper).className).toBe('vf-tooltip');
    expect([...rootOf(wrapper).children].map((child) => child.className)).toEqual(['vf-tooltip__trigger']);
    expect(triggerOf(wrapper).tagName).toBe('SPAN');
    expect(tooltips()).toHaveLength(0);
  });

  it('writes no aria-describedby, no role and no tabindex on the trigger while closed', () => {
    const wrapper = mountTooltip();

    expect(triggerOf(wrapper).getAttributeNames()).toEqual(['class']);
  });

  it('writes nothing on the root beyond its class: it is not focusable and has no role', () => {
    const wrapper = mountTooltip();

    expect(rootOf(wrapper).getAttributeNames()).toEqual(['class']);
  });

  it('writes no aria-describedby while the open timer is pending', async () => {
    const wrapper = mountTooltip();
    enter(wrapper);
    await after(79);

    expect(describedBy(wrapper)).toBeNull();
    expect(tooltips()).toHaveLength(0);
  });

  // A mount with a stubbed transition leaves @vue/test-utils' vnode transform
  // installed, and the server render would see the stub. Every server test
  // renders the real component tree.
  const unstubbed = () => transformVNodeArgs();

  it('renders the historical closed markup on the server: no id, no reference, empty teleport buffer', async () => {
    unstubbed();
    const app = createSSRApp({
      render: () => h(VfTooltip, { text: 'Hint' }, { default: () => h('button', { type: 'button' }, 'Info') }),
    });
    const context: SSRContext = {};
    const html = await renderToString(app, context);

    expect(html).toBe(
      '<span class="vf-tooltip"><span class="vf-tooltip__trigger"><!--[--><button type="button">Info</button><!--]--></span><!--teleport start--><!--teleport end--></span>',
    );
    // The v-if placeholder is `<!---->` in a production build and names the
    // directive in this development one; either way it is the only thing
    // buffered.
    expect(Object.keys(context.teleports ?? {})).toEqual(['body']);
    expect(context.teleports!.body).toMatch(/^<!--teleport start anchor--><!--(v-if)?--><!--teleport anchor-->$/);
  });

  it('renders the in-place placeholder on the server when teleport is disabled', async () => {
    unstubbed();
    const app = createSSRApp({
      render: () => h(VfTooltip, { text: 'Hint', disableTeleport: true }, { default: () => 'Info' }),
    });
    const context: SSRContext = {};
    const html = await renderToString(app, context);

    expect(html).toMatch(
      /^<span class="vf-tooltip"><span class="vf-tooltip__trigger"><!--\[-->Info<!--\]--><\/span><!--teleport start--><!--(v-if)?--><!--teleport end--><\/span>$/,
    );
  });

  it('renders a server tooltip without content as closed as any other: open state never reaches the server', async () => {
    unstubbed();
    const app = createSSRApp({ render: () => h(VfTooltip, {}, { default: () => 'Info' }) });
    const html = await renderToString(app);

    expect(html).not.toContain('aria-describedby');
    expect(html).not.toContain('role="tooltip"');
    expect(html).not.toContain('vf-tooltip-');
  });
});

// ------------------------------------------------------------ open structure

describe('VfTooltip characterization: open structure', () => {
  it('teleports the open tooltip to the end of <body>, outside the component root', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    const tooltip = tooltipOf(wrapper)!;

    expect(tooltip.parentElement).toBe(document.body);
    expect(rootOf(wrapper).contains(tooltip)).toBe(false);
  });

  it('writes exactly the historical tooltip attributes: a span with its id, classes, role and inline position', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    const tooltip = tooltipOf(wrapper)!;

    expect(tooltip.tagName).toBe('SPAN');
    expect(tooltip.getAttribute('role')).toBe('tooltip');
    expect(tooltip.id).toBe(describedBy(wrapper));
    expect(tooltip.className).toBe('vf-tooltip__content vf-tooltip__content--top');
    expect(tooltip.getAttribute('style')).toMatch(/^left: [-\d.]+px; top: [-\d.]+px;$/);
    expect(tooltip.hasAttribute('tabindex')).toBe(false);
    expect(tooltip.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('puts aria-describedby on the trigger wrapper only - never on the root or a consumer control', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);

    expect(describedBy(wrapper)).toMatch(/^vf-tooltip-/);
    expect(rootOf(wrapper).hasAttribute('aria-describedby')).toBe(false);
    expect(controlOf(wrapper).hasAttribute('aria-describedby')).toBe(false);
    expect(document.querySelectorAll('[aria-describedby]')).toHaveLength(1);
  });

  it('has no reverse relationship: nothing in the tooltip names the trigger or the root', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    const tooltip = tooltipOf(wrapper)!;
    const attributes = [tooltip, ...tooltip.querySelectorAll('*')].flatMap((element) =>
      element.getAttributeNames().filter((name) => name.startsWith('aria-') && name !== 'aria-hidden'),
    );

    expect(attributes).toEqual([]);
    expect(triggerOf(wrapper).id).toBe('');
  });

  it('puts an aria-hidden arrow span last in the tooltip, after the body', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    const arrow = tooltipOf(wrapper)!.lastElementChild as HTMLElement;

    expect(arrow.tagName).toBe('SPAN');
    expect(arrow.className).toBe('vf-tooltip__arrow vf-tooltip__arrow--top');
    expect(arrow.getAttribute('aria-hidden')).toBe('true');
    expect(arrow.childNodes).toHaveLength(0);
  });

  it('generates the id at setup and keeps it: every open and the dangling reference use the same one', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    const first = describedBy(wrapper);
    leave(wrapper);
    await nextTick();
    await openByPointer(wrapper);

    expect(first).toMatch(/^vf-tooltip-v-?\w+$/);
    expect(describedBy(wrapper)).toBe(first);
  });

  it('gives two instances of one app two ids, each trigger naming its own tooltip', async () => {
    const Host = defineComponent({
      setup: () => () =>
        h('div', [
          h(VfTooltip, { class: 'a', text: 'Alpha' }, { default: () => h('button', { type: 'button' }, 'A') }),
          h(VfTooltip, { class: 'b', text: 'Beta' }, { default: () => h('button', { type: 'button' }, 'B') }),
        ]),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    const roots = ['a', 'b'].map((name) => document.querySelector<HTMLElement>(`.${name}`)!);
    for (const root of roots) root.dispatchEvent(new MouseEvent('mouseenter'));
    await after(80);
    const ids = roots.map((root) => root.querySelector('.vf-tooltip__trigger')!.getAttribute('aria-describedby'));

    expect(new Set(ids).size).toBe(2);
    expect(ids.map((id) => document.getElementById(id!)!.textContent)).toEqual(['Alpha', 'Beta']);
  });
});

// ------------------------------------------------------------ state machine

describe('VfTooltip characterization: pointer and focus open after the delay', () => {
  it('opens on mouseenter after the 80 ms default, not before', async () => {
    const wrapper = mountTooltip();
    enter(wrapper);
    await after(79);
    expect(describedBy(wrapper)).toBeNull();

    await after(1);
    expect(tooltipOf(wrapper)?.textContent).toBe('Helpful hint');
  });

  it('opens on focusin after the delay, from a real focus on a consumer control', async () => {
    const wrapper = mountTooltip();
    controlOf(wrapper).focus();
    await after(79);
    expect(describedBy(wrapper)).toBeNull();

    await after(1);
    expect(document.activeElement).toBe(controlOf(wrapper));
    expect(tooltipOf(wrapper)).not.toBeNull();
  });

  it('honours openDelay for both paths', async () => {
    const pointer = mountTooltip({ props: { text: 'Hint', openDelay: 400 } });
    enter(pointer);
    await after(399);
    expect(describedBy(pointer)).toBeNull();
    await after(1);
    expect(describedBy(pointer)).not.toBeNull();

    const focus = mountTooltip({ props: { text: 'Hint', openDelay: 400 } });
    controlOf(focus).focus();
    await after(399);
    expect(describedBy(focus)).toBeNull();
    await after(1);
    expect(describedBy(focus)).not.toBeNull();
  });

  it('opens on the next macrotask for openDelay 0, never synchronously', async () => {
    const wrapper = mountTooltip({ props: { text: 'Hint', openDelay: 0 } });
    enter(wrapper);
    await nextTick();
    expect(describedBy(wrapper)).toBeNull();

    await after(0);
    expect(describedBy(wrapper)).not.toBeNull();
  });

  it('does not open on a mouseenter or focusin dispatched on the trigger wrapper alone as a non-bubbling event', async () => {
    const wrapper = mountTooltip();
    triggerOf(wrapper).dispatchEvent(new MouseEvent('mouseenter'));
    await after(200);

    expect(describedBy(wrapper)).toBeNull();
  });

  it('does not open on click, pointerdown or mousedown alone', async () => {
    const wrapper = mountTooltip();
    for (const type of ['pointerdown', 'mousedown', 'click']) {
      controlOf(wrapper).dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
    }
    await after(200);

    expect(describedBy(wrapper)).toBeNull();
  });
});

describe('VfTooltip characterization: close is immediate', () => {
  it('closes on mouseleave at once and removes the tooltip', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    leave(wrapper);
    await nextTick();

    expect(describedBy(wrapper)).toBeNull();
    expect(tooltips()).toHaveLength(0);
  });

  it('closes on focusout at once', async () => {
    const wrapper = mountTooltip();
    controlOf(wrapper).focus();
    await after(80);
    controlOf(wrapper).blur();
    await nextTick();

    expect(describedBy(wrapper)).toBeNull();
  });

  it('cancels a pending open on mouseleave: nothing opens later', async () => {
    const wrapper = mountTooltip();
    enter(wrapper);
    await after(40);
    leave(wrapper);
    await after(500);

    expect(describedBy(wrapper)).toBeNull();
    expect(openTimers()).toBe(0);
  });

  it('cancels a pending open on focusout', async () => {
    const wrapper = mountTooltip();
    controlOf(wrapper).focus();
    await after(40);
    controlOf(wrapper).blur();
    await after(500);

    expect(describedBy(wrapper)).toBeNull();
  });

  it('closes on the focusout of removing the focused control', async () => {
    const wrapper = mountTooltip();
    controlOf(wrapper).focus();
    await after(80);
    controlOf(wrapper).dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await nextTick();

    expect(describedBy(wrapper)).toBeNull();
  });
});

describe('VfTooltip characterization: the last event wins, not hovered || focused', () => {
  it('closes on mouseleave while a control inside still has focus, and stays closed', async () => {
    const wrapper = mountTooltip();
    controlOf(wrapper).focus();
    enter(wrapper);
    await after(80);
    expect(describedBy(wrapper)).not.toBeNull();

    leave(wrapper);
    await after(500);
    expect(document.activeElement).toBe(controlOf(wrapper));
    expect(describedBy(wrapper)).toBeNull();
  });

  it('closes on focusout while the pointer is still inside, and stays closed', async () => {
    const wrapper = mountTooltip();
    enter(wrapper);
    controlOf(wrapper).focus();
    await after(80);
    expect(describedBy(wrapper)).not.toBeNull();

    controlOf(wrapper).blur();
    await after(500);
    expect(describedBy(wrapper)).toBeNull();
  });

  it('closes and reopens after the delay when focus moves between two controls inside', async () => {
    const wrapper = mountTooltip();
    controlOf(wrapper, 'one').focus();
    await after(80);
    const id = describedBy(wrapper);

    controlOf(wrapper, 'two').focus();
    await nextTick();
    expect(document.activeElement).toBe(controlOf(wrapper, 'two'));
    expect(describedBy(wrapper)).toBeNull();

    await after(79);
    expect(describedBy(wrapper)).toBeNull();
    await after(1);
    expect(describedBy(wrapper)).toBe(id);
  });

  it('restarts the timer on a mouseenter that arrives while a focus timer is pending', async () => {
    const wrapper = mountTooltip();
    controlOf(wrapper).focus();
    await after(50);
    enter(wrapper);
    await after(30);
    expect(describedBy(wrapper)).toBeNull();

    await after(49);
    expect(describedBy(wrapper)).toBeNull();
    await after(1);
    expect(describedBy(wrapper)).not.toBeNull();
  });

  it('restarts the timer on a focusin that arrives while a pointer timer is pending', async () => {
    const wrapper = mountTooltip({ props: { text: 'Hint', openDelay: 600 } });
    enter(wrapper);
    await after(300);
    controlOf(wrapper).focus();
    await after(599);
    expect(describedBy(wrapper)).toBeNull();

    await after(1);
    expect(describedBy(wrapper)).not.toBeNull();
  });

  it('keeps an open tooltip open on a mouseenter while focused, rescheduling a timer that changes nothing', async () => {
    const wrapper = mountTooltip();
    controlOf(wrapper).focus();
    await after(80);
    const tooltip = tooltipOf(wrapper);

    enter(wrapper);
    await nextTick();
    expect(openTimers()).toBe(1);
    expect(tooltipOf(wrapper)).toBe(tooltip);

    await after(80);
    expect(openTimers()).toBe(0);
    expect(tooltipOf(wrapper)).toBe(tooltip);
  });

  it('starts a fresh timer on re-entry after a leave', async () => {
    const wrapper = mountTooltip();
    enter(wrapper);
    await after(50);
    leave(wrapper);
    enter(wrapper);
    await after(79);
    expect(describedBy(wrapper)).toBeNull();

    await after(1);
    expect(describedBy(wrapper)).not.toBeNull();
  });

  it('never holds more than one timer, however many activations arrive', async () => {
    const wrapper = mountTooltip();
    enter(wrapper);
    controlOf(wrapper).focus();
    enter(wrapper);
    controlOf(wrapper, 'two').focus();
    enter(wrapper);

    expect(openTimers()).toBe(1);
  });

  it('leaves no timer behind after an enter, a focus and a leave in one task: the pointer click sequence', async () => {
    const wrapper = mountTooltip();
    enter(wrapper);
    controlOf(wrapper).focus();
    leave(wrapper);
    await after(500);

    expect(openTimers()).toBe(0);
    expect(document.activeElement).toBe(controlOf(wrapper));
    expect(describedBy(wrapper)).toBeNull();
  });
});

describe('VfTooltip characterization: keyboard', () => {
  for (const name of ['Enter', ' ', 'Escape', 'Tab']) {
    it(`does not handle ${JSON.stringify(name)}: an open tooltip stays open and the key is not prevented`, async () => {
      const wrapper = mountTooltip();
      controlOf(wrapper).focus();
      await after(80);
      const event = key(controlOf(wrapper), name);
      await after(200);

      expect(event.defaultPrevented).toBe(false);
      expect(describedBy(wrapper)).not.toBeNull();
    });

    it(`does not open on ${JSON.stringify(name)} alone`, async () => {
      const wrapper = mountTooltip();
      const event = key(controlOf(wrapper), name);
      await after(200);

      expect(event.defaultPrevented).toBe(false);
      expect(describedBy(wrapper)).toBeNull();
    });
  }

  it('does not handle a document Escape either', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    const event = key(document, 'Escape');
    await after(200);

    expect(event.defaultPrevented).toBe(false);
    expect(describedBy(wrapper)).not.toBeNull();
  });
});

// ------------------------------------------------------------ lifecycle

describe('VfTooltip characterization: unmount', () => {
  it('cancels a pending timer on unmount', async () => {
    const wrapper = mountTooltip();
    enter(wrapper);
    await after(20);
    wrapper.unmount();

    expect(openTimers()).toBe(0);
    await after(500);
    expect(tooltips()).toHaveLength(0);
  });

  it('removes an open tooltip at once on unmount, with no leave, and stops autoUpdate', async () => {
    const wrapper = mountTooltip({ realTransition: true });
    await openByPointer(wrapper);
    await after(400);
    expect(tooltips()).toHaveLength(1);
    const cleanupsBefore = floating.cleanups;

    wrapper.unmount();

    expect(tooltips()).toHaveLength(0);
    expect(floating.cleanups).toBeGreaterThan(cleanupsBefore);
  });
});

// ------------------------------------------------------------ teleport

describe('VfTooltip characterization: teleport destination', () => {
  it('renders in place, after the trigger inside the root, for disableTeleport, false and null', async () => {
    for (const props of [{ disableTeleport: true }, { teleportTo: false }, { teleportTo: null }]) {
      const wrapper = mountTooltip({ props: { text: 'Hint', ...props } });
      await openByPointer(wrapper);
      const tooltip = tooltipOf(wrapper)!;

      expect(tooltip.parentElement).toBe(rootOf(wrapper));
      expect(tooltip.previousElementSibling).toBe(triggerOf(wrapper));
      wrapper.unmount();
    }
  });

  it('teleports into a selector target when teleportTo is a string', async () => {
    const target = document.body.appendChild(document.createElement('div'));
    target.id = 'tooltip-target';
    const wrapper = mountTooltip({ props: { text: 'Hint', teleportTo: '#tooltip-target' } });
    await openByPointer(wrapper);

    expect(tooltipOf(wrapper)!.parentElement).toBe(target);
  });

  it('teleports into an element when teleportTo is an HTMLElement', async () => {
    const target = document.body.appendChild(document.createElement('section'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountTooltip({ props: { text: 'Hint', teleportTo: target } });
    await openByPointer(wrapper);
    warn.mockRestore();

    expect(tooltipOf(wrapper)!.parentElement).toBe(target);
  });

  it('means body for true and for undefined', async () => {
    for (const teleportTo of [true, undefined]) {
      const wrapper = mountTooltip({ props: { text: 'Hint', teleportTo } });
      await openByPointer(wrapper);

      expect(tooltipOf(wrapper)!.parentElement).toBe(document.body);
      wrapper.unmount();
    }
  });

  it('places teleported tooltips in body in mount order, whatever order they open in', async () => {
    const Host = defineComponent({
      setup: () => () =>
        h('div', [
          h(VfTooltip, { class: 'a', text: 'Alpha' }, { default: () => 'A' }),
          h(VfTooltip, { class: 'b', text: 'Beta' }, { default: () => 'B' }),
        ]),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    document.querySelector('.b')!.dispatchEvent(new MouseEvent('mouseenter'));
    await after(80);
    document.querySelector('.a')!.dispatchEvent(new MouseEvent('mouseenter'));
    await after(80);

    expect(tooltips().map((tooltip) => tooltip.textContent)).toEqual(['Alpha', 'Beta']);
  });
});

// ------------------------------------------------------------ floating

describe('VfTooltip characterization: floating', () => {
  const position = (x: number, y: number, placement: string, arrow?: Record<string, number>) => () => ({
    x,
    y,
    placement,
    middlewareData: arrow ? { arrow } : {},
  });

  it('positions the tooltip against the trigger wrapper with offset 10, the top/bottom flip, shift, arrow and a fixed strategy', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    const call = last(floating.calls)!;
    const middleware = call.options.middleware as { name: string; params?: Record<string, unknown> }[];

    expect(call.reference).toBe(triggerOf(wrapper));
    expect(call.floating).toBe(tooltipOf(wrapper));
    expect(call.options.placement).toBe('top');
    expect(call.options.strategy).toBe('fixed');
    expect(middleware.map((entry) => entry.name)).toEqual(['offset', 'flip', 'shift', 'arrow']);
    expect(middleware[0].params).toEqual({ value: 10 });
    expect(middleware[1].params).toEqual({ placements: ['top', 'bottom'] });
    expect(middleware[2].params).toBeUndefined();
    expect(middleware[3].params).toEqual({ arrow: tooltipOf(wrapper)!.querySelector('.vf-tooltip__arrow') });
  });

  it('passes the requested placement through and keeps the same flip list for bottom', async () => {
    const wrapper = mountTooltip({ props: { text: 'Hint', placement: 'bottom' } });
    await openByPointer(wrapper);
    const call = last(floating.calls)!;

    expect(call.options.placement).toBe('bottom');
    expect((call.options.middleware as { params?: unknown }[])[1].params).toEqual({ placements: ['top', 'bottom'] });
  });

  it('writes the computed x and y into left and top, unrounded', async () => {
    floating.fake = position(12.5, 84.8589, 'top');
    const wrapper = mountTooltip();
    await openByPointer(wrapper);

    expect(tooltipOf(wrapper)!.getAttribute('style')).toBe('left: 12.5px; top: 84.8589px;');
  });

  it('writes the arrow offset relative to the tooltip from the arrow middleware data', async () => {
    floating.fake = position(10, 20, 'top', { x: 38.5, y: 56.24, baseX: 10, baseY: 20 });
    const wrapper = mountTooltip();
    await openByPointer(wrapper);

    expect(tooltipOf(wrapper)!.querySelector('.vf-tooltip__arrow')!.getAttribute('style')).toBe(
      'left: 28.5px; top: 36.24px;',
    );
  });

  it('writes a zero arrow offset when the arrow data lacks a base', async () => {
    floating.fake = position(10, 20, 'top', { x: 38 });
    const wrapper = mountTooltip();
    await openByPointer(wrapper);

    expect(tooltipOf(wrapper)!.querySelector('.vf-tooltip__arrow')!.getAttribute('style')).toBe('left: 0px; top: 0px;');
  });

  it('gives the tooltip and the arrow --bottom when the computed placement is bottom: a flip from top', async () => {
    floating.fake = position(10, 20, 'bottom');
    const wrapper = mountTooltip();
    await openByPointer(wrapper);

    expect(tooltipOf(wrapper)!.className).toBe('vf-tooltip__content vf-tooltip__content--bottom');
    expect(tooltipOf(wrapper)!.querySelector('.vf-tooltip__arrow')!.className).toBe(
      'vf-tooltip__arrow vf-tooltip__arrow--bottom',
    );
  });

  it('gives neither modifier for a computed placement that is neither top nor bottom', async () => {
    floating.fake = position(10, 20, 'left');
    const wrapper = mountTooltip();
    await openByPointer(wrapper);

    expect(tooltipOf(wrapper)!.className).toBe('vf-tooltip__content');
    expect(tooltipOf(wrapper)!.querySelector('.vf-tooltip__arrow')!.className).toBe('vf-tooltip__arrow');
  });

  it('starts from the requested placement before the first computation', async () => {
    floating.fake = () => new Promise(() => {});
    const wrapper = mountTooltip({ props: { text: 'Hint', placement: 'bottom' } });
    enter(wrapper);
    await after(80);

    expect(tooltipOf(wrapper)!.className).toBe('vf-tooltip__content vf-tooltip__content--bottom');
    expect(tooltipOf(wrapper)!.getAttribute('style')).toBe('left: 0px; top: 0px;');
  });

  it('renders the last placement and position first on the next open, before recomputing', async () => {
    floating.fake = position(33, 44, 'bottom');
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    leave(wrapper);
    await nextTick();

    floating.fake = () => new Promise(() => {});
    enter(wrapper);
    await after(80);

    expect(tooltipOf(wrapper)!.className).toContain('vf-tooltip__content--bottom');
    expect(tooltipOf(wrapper)!.getAttribute('style')).toBe('left: 33px; top: 44px;');
  });

  it('keeps the tooltip positioned with autoUpdate on the trigger wrapper alone, and stops on close', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);

    expect(floating.autoUpdates).toHaveLength(1);
    expect(floating.autoUpdates[0].reference).toBe(triggerOf(wrapper));
    expect(floating.autoUpdates[0].argumentCount).toBe(2);
    expect(floating.cleanups).toBe(0);

    leave(wrapper);
    await flushPromises();
    expect(floating.cleanups).toBe(1);
  });

  it('computes nothing while closed or pending', async () => {
    const wrapper = mountTooltip();
    enter(wrapper);
    await after(40);
    await flushPromises();

    expect(floating.calls).toHaveLength(0);
    expect(floating.autoUpdates).toHaveLength(0);
  });

  it('computes nothing for an open tooltip without content: there is no element to place', async () => {
    const wrapper = mountTooltip({ props: {} });
    await openByPointer(wrapper);

    expect(describedBy(wrapper)).not.toBeNull();
    expect(floating.calls).toHaveLength(0);
  });
});

// ------------------------------------------------------------------ transition

describe('VfTooltip characterization: transition', () => {
  const classes = (element: Element | null) => (element ? [...element.classList] : null);

  it('opens after the delay and only then enters: from and active, then active and to, then none after 320 ms', async () => {
    const wrapper = mountTooltip({ realTransition: true });
    enter(wrapper);
    await after(79);
    expect(tooltips()).toHaveLength(0);

    await after(1);
    const tooltip = tooltipOf(wrapper)!;
    expect(classes(tooltip)).toEqual([
      'vf-tooltip__content',
      'vf-tooltip__content--top',
      'vf-floating-transition-enter-from',
      'vf-floating-transition-enter-active',
    ]);

    await after(40);
    expect(classes(tooltip)).toEqual([
      'vf-tooltip__content',
      'vf-tooltip__content--top',
      'vf-floating-transition-enter-active',
      'vf-floating-transition-enter-to',
    ]);

    await after(260);
    expect(classes(tooltip)).toContain('vf-floating-transition-enter-active');

    await after(70);
    expect(classes(tooltip)).toEqual(['vf-tooltip__content', 'vf-tooltip__content--top']);
  });

  it('removes aria-describedby at once on close and keeps the leaving tooltip for 320 ms, then removes it', async () => {
    const wrapper = mountTooltip({ realTransition: true });
    enter(wrapper);
    await after(500);
    const tooltip = tooltipOf(wrapper)!;

    leave(wrapper);
    await nextTick();
    expect(describedBy(wrapper)).toBeNull();
    expect(tooltip.isConnected).toBe(true);
    expect(classes(tooltip)).toEqual([
      'vf-tooltip__content',
      'vf-tooltip__content--top',
      'vf-floating-transition-leave-from',
      'vf-floating-transition-leave-active',
    ]);

    await after(40);
    expect(classes(tooltip)).toEqual([
      'vf-tooltip__content',
      'vf-tooltip__content--top',
      'vf-floating-transition-leave-active',
      'vf-floating-transition-leave-to',
    ]);

    await after(240);
    expect(tooltip.isConnected).toBe(true);
    await after(80);
    expect(tooltip.isConnected).toBe(false);
  });

  it('replaces a leaving tooltip at once with a new node when it reopens: never two nodes with one id', async () => {
    const wrapper = mountTooltip({ realTransition: true });
    enter(wrapper);
    await after(500);
    const first = tooltipOf(wrapper)!;

    leave(wrapper);
    await after(50);
    enter(wrapper);
    await after(80);

    expect(first.isConnected).toBe(false);
    expect(tooltips()).toHaveLength(1);
    expect(tooltipOf(wrapper)).not.toBe(first);
  });

  it('creates a new tooltip node on every open', async () => {
    const wrapper = mountTooltip();
    await openByPointer(wrapper);
    const first = tooltipOf(wrapper);
    leave(wrapper);
    await nextTick();
    await openByPointer(wrapper);

    expect(tooltipOf(wrapper)).not.toBeNull();
    expect(tooltipOf(wrapper)).not.toBe(first);
  });
});

// ------------------------------------------------ with VfPopover: no escape stack

describe('VfTooltip characterization: beside and inside VfPopover', () => {
  function mountWithPopover(inside: boolean) {
    const tooltip = () =>
      h(
        VfTooltip,
        { class: 'tip', text: 'Hint' },
        { default: () => h('button', { type: 'button', class: 'tip-control' }, 'Info') },
      );
    const Host = defineComponent({
      setup: () => () =>
        h('div', [
          h(
            VfPopover,
            { class: 'po' },
            { trigger: () => h('span', 'Details'), default: () => (inside ? [tooltip()] : [h('p', 'Body')]) },
          ),
          inside ? null : tooltip(),
        ]),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    const popoverTrigger = () => document.querySelector<HTMLElement>('.po > .vf-popover__trigger')!;
    const tipRoot = () => document.querySelector<HTMLElement>('.tip');
    const tipTrigger = () => tipRoot()?.querySelector<HTMLElement>('.vf-tooltip__trigger') ?? null;
    return {
      popoverTrigger,
      tipRoot,
      described: () => tipTrigger()?.getAttribute('aria-describedby') ?? null,
      async openPopover() {
        popoverTrigger().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await flushPromises();
      },
    };
  }

  it('lets an Escape pass to a popover opened before a hovered tooltip beside it: the tooltip is not on the stack', async () => {
    const page = mountWithPopover(false);
    await page.openPopover();
    page.tipRoot()!.dispatchEvent(new MouseEvent('mouseenter'));
    await after(80);
    expect(page.described()).not.toBeNull();

    const event = key(document, 'Escape');
    await flushPromises();

    expect(event.defaultPrevented).toBe(true);
    expect(page.popoverTrigger().getAttribute('aria-expanded')).toBe('false');
    expect(page.described()).not.toBeNull();
  });

  it('removes a tooltip open inside a popover at once when the popover closes, and cancels nothing it no longer owns', async () => {
    const page = mountWithPopover(true);
    await page.openPopover();
    page.tipRoot()!.dispatchEvent(new MouseEvent('mouseenter'));
    await after(80);
    expect(tooltips()).toHaveLength(1);

    key(document, 'Escape');
    await flushPromises();

    expect(page.popoverTrigger().getAttribute('aria-expanded')).toBe('false');
    expect(page.tipRoot()).toBeNull();
    expect(tooltips()).toHaveLength(0);
    await after(500);
    expect(openTimers()).toBe(0);
  });

  it('cancels a tooltip timer pending inside a popover when the popover closes', async () => {
    const page = mountWithPopover(true);
    await page.openPopover();
    page.tipRoot()!.dispatchEvent(new MouseEvent('mouseenter'));
    await after(20);
    key(document, 'Escape');
    await flushPromises();
    await after(500);

    expect(tooltips()).toHaveLength(0);
  });
});

// ------------------------------------------------ reactivity (Vue-only)

describe('VfTooltip characterization: reactive props, the Vue half', () => {
  it('reads openDelay when an activation starts the timer, not when the component mounts', async () => {
    const delay = ref(80);
    const Host = defineComponent({
      setup: () => () => h(VfTooltip, { class: 'r', text: 'Hint', openDelay: delay.value }, { default: () => 'R' }),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    delay.value = 300;
    await nextTick();
    document.querySelector('.r')!.dispatchEvent(new MouseEvent('mouseenter'));
    await after(299);
    expect(document.querySelector('.r .vf-tooltip__trigger')!.hasAttribute('aria-describedby')).toBe(false);

    await after(1);
    expect(document.querySelector('.r .vf-tooltip__trigger')!.hasAttribute('aria-describedby')).toBe(true);
  });
});
