// Characterization of the historical VfTabs at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The third migrated component that owns interactive controls, and a different
// shape again from VfAccordion and VfStepper: N native buttons carrying an
// explicit interactive role (`tab`) inside a `tablist`, a roving tabindex,
// `aria-selected`, generated ids that form an aria-controls / aria-labelledby
// graph with 0 or 1 panel, two more native buttons the internal horizontal
// scroller owns, an indicator whose inline style is measured off the DOM, an
// overflow state read off the viewport, fades, a 140 ms scrolling timer and
// two requestAnimationFrame readiness steps. Each of those is pinned here on
// its own, so a port can be wrong in one and the harness can say which.
//
// Empirically established facts that are easy to "correct" and must not be:
//
//   - the state model is controlled-with-fallback on a *string*, exactly the
//     stepper's: `modelValue ?? internalValue ?? fallbackValue`, the fallback
//     being the first non-disabled item and the internal value seeded once
//     from `defaultValue ?? fallbackValue`. Controlled means
//     `modelValue !== undefined`; an empty string and an unknown string are
//     controlled values that select nothing; `null` is controlled for
//     emitting but falls through for rendering;
//   - activating an enabled tab - *the current one included* - writes the
//     internal value when uncontrolled and emits `update:modelValue` then
//     `change`, once each. There is no "already current" guard: re-clicking
//     the current tab emits the pair again. A disabled tab emits nothing;
//   - `aria-selected` and `tabindex` are both keyed to the active value:
//     `true`/`0` on every tab whose value equals it, `false`/`-1` elsewhere.
//     So an unknown or empty controlled value leaves *zero* tabs with
//     tabindex=0, and duplicate values leave *two* - the roving tabindex is
//     not an invariant, it is a projection of the value;
//   - a `defaultValue` naming a disabled tab is kept: the disabled tab is
//     selected, tabindex=0, its panel rendered. The items watch is not
//     immediate, so this survives mount; it is a later mutation of the items
//     that reseeds the fallback;
//   - ids are `${baseId}-tab-${value}` and `${baseId}-panel-${value}` with the
//     raw value embedded - spaces and all - unless the item overrides them
//     through `tabId` / `panelId`. `aria-controls` is written on every tab when
//     a panel slot exists, and on a tab with its own `panelId` even when none
//     does. Only the active tab's panel exists, so N-1 of those references are
//     dangling by design;
//   - the panel is one `div[role=tabpanel][tabindex=0]` under
//     `v-if="activeItem && slots.panel"`. Switching tabs keeps that element and
//     patches its id, its aria-labelledby and its slot content: the element is
//     recreated only across an absent state;
//   - there is no Enter, Space or Tab handler. ArrowRight/ArrowLeft *and*
//     ArrowDown/ArrowUp, Home and End are handled on keydown with
//     preventDefault, relative to the tab that received the key among the
//     enabled items, wrapping, and both activate and focus the target. The
//     vertical arrows are handled although the tablist is horizontal;
//   - keyboard direction comes from `closest('[dir]')` on the tab, then the
//     document element's `dir` when no ancestor has one, and never from the
//     computed style. The scroller's direction *does* fall back to computed
//     style. Neither reads the other;
//   - focus moves through the instance's own `tabRefs`, so two instances
//     sharing values keep their focus apart. Two separate `createApp` roots
//     share Vue's id counter and collide on ids - a fixture artifact recorded
//     here and kept out of the catalog;
//   - the indicator's inline style is `opacity`, `transform: translateX(…px)`
//     and `width`, computed from getBoundingClientRect of the viewport and the
//     active tab, the viewport's clientWidth and the offsetWidth of whichever
//     scroll button is currently shown, in the LTR frame even under RTL, with
//     fractional pixels kept. An active tab scrolled out of view yields
//     opacity 0 and width 0 but keeps its translateX. No active tab yields the
//     literal `translateX(0)`;
//   - the scroller reads `scrollWidth - clientWidth` against `scrollLeft`
//     (absolute of the negative value under RTL) with a `> 1` threshold, hides
//     each button with a class, aria-hidden, tabindex=-1 and disabled together,
//     renders each fade only while animated and scrollable that way, scrolls
//     by `max(120, round(clientWidth * 0.6))` smoothly unless reduced motion
//     is requested, and marks 140 ms of scrolling on the viewport's
//     scrollbar-width variable and the indicator's no-transition class;
//   - readiness is two frames: the scroller's controls-ready and the indicator's
//     ready class after the first requestAnimationFrame, controls-animated
//     after the second. Before the first, both scroll buttons are hidden
//     whatever the overflow.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createApp, createSSRApp, defineComponent, h, nextTick, reactive, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VfTabs from './VfTabs.vue';
import type { VfTabItem } from '@/types/components';

type TabsProps = InstanceType<typeof VfTabs>['$props'];

const ITEMS: VfTabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'settings', label: 'Settings' },
  { value: 'billing', label: 'Billing' },
];

function withDisabled(items: VfTabItem[], ...values: string[]): VfTabItem[] {
  return items.map((item) => (values.includes(item.value) ? { ...item, disabled: true } : { ...item }));
}

const panelSlot = ({ activeValue }: { activeValue: string }) => h('p', `panel:${activeValue}`);

function mountTabs({
  props = {},
  attrs = {},
  slots = {},
  attachTo,
}: {
  props?: Partial<TabsProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  attachTo?: Element;
} = {}) {
  return mount(VfTabs, {
    props: { items: ITEMS, ...props } as TabsProps,
    attrs,
    slots: slots as never,
    ...(attachTo ? { attachTo } : {}),
  });
}

type Wrapper = ReturnType<typeof mountTabs>;

const tabs = (wrapper: Wrapper) => wrapper.findAll('button.vf-tabs__tab');
const selectedValues = (wrapper: Wrapper) => tabs(wrapper).map((button) => button.attributes('aria-selected'));
const tabindexes = (wrapper: Wrapper) => tabs(wrapper).map((button) => button.attributes('tabindex'));
const panel = (wrapper: Wrapper) => wrapper.find('[role="tabpanel"]');
const indicator = (wrapper: Wrapper) => wrapper.get('.vf-tabs__indicator');
const viewport = (wrapper: Wrapper) => wrapper.get('.vf-tabs__list-scroller').element as HTMLElement;
const leftButton = (wrapper: Wrapper) => wrapper.get('.vf-tabs__scroll-button--left');
const rightButton = (wrapper: Wrapper) => wrapper.get('.vf-tabs__scroll-button--right');
const focusedText = () => document.activeElement?.textContent ?? null;

/** A real, cancelable keydown on a tab, returning whether the component prevented it. */
function keydown(target: { element: Element }, key: string): boolean {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.element.dispatchEvent(event);

  return event.defaultPrevented;
}

/** One ordered log of both emits, so their order is a fact and not two lists. */
function emitLog(): { log: string[]; attrs: Record<string, unknown> } {
  const log: string[] = [];
  return {
    log,
    attrs: {
      'onUpdate:modelValue': (value: string) => log.push(`update:${value}`),
      onChange: (value: string) => log.push(`change:${value}`),
    },
  };
}

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Pins the geometry jsdom does not compute: rects and sizes, per element. */
function pinRect(element: Element, rect: { left: number; width: number }) {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left: rect.left,
      width: rect.width,
      right: rect.left + rect.width,
      top: 0,
      bottom: 0,
      height: 0,
      x: rect.left,
      y: 0,
    }),
  });
}

function pinSize(element: Element, sizes: Record<string, number>) {
  for (const [name, value] of Object.entries(sizes)) {
    Object.defineProperty(element, name, { configurable: true, writable: true, value });
  }
}

/** Pins a three-tab list in a 360px viewport with the reference's Chrome widths. */
function pinDefaultGeometry(wrapper: Wrapper, { scrollLeft = 0, scrollWidth = 360 } = {}) {
  const list = viewport(wrapper);
  pinRect(list, { left: 24, width: 360 });
  pinSize(list, { clientWidth: 360, scrollWidth, scrollLeft });
  const widths = [93.359375, 85.671875, 68.921875];
  let left = 24 - scrollLeft;
  tabs(wrapper).forEach((button, index) => {
    pinRect(button.element, { left, width: widths[index] });
    left += widths[index] + 4;
  });
  pinSize(leftButton(wrapper).element, { offsetWidth: 28 });
  pinSize(rightButton(wrapper).element, { offsetWidth: 28 });
}

async function ssrTabs(props: Record<string, unknown>, slots?: Record<string, unknown>) {
  const app = createSSRApp({ render: () => h(VfTabs, { items: ITEMS, ...props }, slots as never) });

  return await renderToString(app);
}

afterEach(() => {
  vi.useRealTimers();
  document.documentElement.removeAttribute('dir');
});

// ------------------------------------------------------------------ structure

const HIDDEN_BUTTON = (side: 'left' | 'right') =>
  `<button class="vf-horizontal-scroller__control vf-horizontal-scroller__control--${side} vf-tabs__scroll-button vf-tabs__scroll-button--${side} vf-horizontal-scroller__control--hidden vf-tabs__scroll-button--hidden" type="button" aria-label="Scroll tabs ${side}" aria-hidden="true" tabindex="-1" disabled><span class="vf-icon" aria-hidden="true" size="var(--vf-horizontal-scroller-control-icon-size)"></span></button>`;

describe('VfTabs characterization: structure', () => {
  it('renders exactly the historical server markup: root, scroller, tablist, tabs, overlay and panel', async () => {
    expect(await ssrTabs({}, { panel: panelSlot })).toBe(
      '<div class="vf-tabs"><div class="vf-horizontal-scroller vf-tabs__list">' +
        HIDDEN_BUTTON('left') +
        '<div class="vf-horizontal-scroller__viewport vf-tabs__list-scroller" style="--vf-horizontal-scroller-scrollbar-width:none;"><!--[-->' +
        '<div role="tablist" aria-orientation="horizontal"><!--[-->' +
        '<button id="vf-tabs-v-0-tab-overview" aria-controls="vf-tabs-v-0-panel-overview" aria-selected="true" tabindex="0" class="vf-tabs__tab" role="tab" type="button"><!--[-->Overview<!--]--></button>' +
        '<button id="vf-tabs-v-0-tab-settings" aria-controls="vf-tabs-v-0-panel-settings" aria-selected="false" tabindex="-1" class="vf-tabs__tab" role="tab" type="button"><!--[-->Settings<!--]--></button>' +
        '<button id="vf-tabs-v-0-tab-billing" aria-controls="vf-tabs-v-0-panel-billing" aria-selected="false" tabindex="-1" class="vf-tabs__tab" role="tab" type="button"><!--[-->Billing<!--]--></button>' +
        '<!--]--></div><!--]--></div><!--v-if--><!--v-if-->' +
        HIDDEN_BUTTON('right') +
        '<!--[--><span aria-hidden="true" class="vf-tabs__baseline"></span>' +
        '<span aria-hidden="true" class="vf-tabs__indicator" style="opacity:0;transform:translateX(0);width:0;"></span><!--]-->' +
        '</div>' +
        '<div id="vf-tabs-v-0-panel-overview" aria-labelledby="vf-tabs-v-0-tab-overview" class="vf-tabs__panel" role="tabpanel" tabindex="0"><!--[--><p>panel:overview</p><!--]--></div>' +
        '</div>',
    );
  });

  it('renders no aria-controls and no panel when there is no panel slot', async () => {
    const html = await ssrTabs({});

    expect(html).not.toContain('aria-controls');
    expect(html).not.toContain('tabpanel');
    expect(html.endsWith('<!--]--></div><!--v-if--></div>')).toBe(true);
  });

  it('is a div holding the scroller and, with a panel slot, the panel - nothing else', () => {
    const wrapper = mountTabs({ slots: { panel: panelSlot } });

    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toEqual(['vf-tabs']);
    expect([...wrapper.element.children].map((child) => child.className)).toEqual([
      'vf-horizontal-scroller vf-tabs__list',
      'vf-tabs__panel',
    ]);
    expect([...mountTabs().element.children].map((child) => child.className)).toEqual([
      'vf-horizontal-scroller vf-tabs__list',
    ]);
  });

  it('lays the scroller out as left button, viewport, right button, baseline, indicator', () => {
    const wrapper = mountTabs();
    const scroller = wrapper.get('.vf-tabs__list').element;

    expect([...scroller.children].map((child) => `${child.tagName.toLowerCase()}.${child.classList[0]}`)).toEqual([
      'button.vf-horizontal-scroller__control',
      'div.vf-horizontal-scroller__viewport',
      'button.vf-horizontal-scroller__control',
      'span.vf-tabs__baseline',
      'span.vf-tabs__indicator',
    ]);
    expect(wrapper.get('.vf-tabs__baseline').attributes('aria-hidden')).toBe('true');
    expect(indicator(wrapper).attributes('aria-hidden')).toBe('true');
  });

  it('puts the tablist directly inside the viewport, and one tab button per item inside it', () => {
    const wrapper = mountTabs();
    const list = wrapper.get('[role="tablist"]');

    expect(list.element.parentElement).toBe(viewport(wrapper));
    expect(list.attributes()).toEqual({ role: 'tablist', 'aria-orientation': 'horizontal' });
    expect(
      [...list.element.children].every((child) => child.matches('button.vf-tabs__tab[role="tab"][type="button"]')),
    ).toBe(true);
    expect(tabs(wrapper)).toHaveLength(3);
    expect(tabs(wrapper).map((button) => button.text())).toEqual(['Overview', 'Settings', 'Billing']);
  });

  it('owns exactly two more native buttons, the scroll controls, with their labels and icons', () => {
    const wrapper = mountTabs();

    expect(wrapper.findAll('button')).toHaveLength(5);
    expect(leftButton(wrapper).attributes('aria-label')).toBe('Scroll tabs left');
    expect(rightButton(wrapper).attributes('aria-label')).toBe('Scroll tabs right');
    expect(leftButton(wrapper).attributes('type')).toBe('button');
    expect(rightButton(wrapper).attributes('type')).toBe('button');
    expect(leftButton(wrapper).get('.vf-icon').attributes('aria-hidden')).toBe('true');
    expect(leftButton(wrapper).get('.vf-icon').attributes('size')).toBe(
      'var(--vf-horizontal-scroller-control-icon-size)',
    );
  });

  it('renders an empty tablist, no panel and a hidden indicator for no items', () => {
    const wrapper = mountTabs({ props: { items: [] }, slots: { panel: panelSlot } });

    expect(wrapper.get('[role="tablist"]').element.children).toHaveLength(0);
    expect(panel(wrapper).exists()).toBe(false);
    expect(indicator(wrapper).attributes('style')).toBe('opacity: 0; transform: translateX(0); width: 0px;');
  });

  it('forwards attrs onto the root: class after the canonical class, style, id, data-* and dir', () => {
    const wrapper = mountTabs({
      attrs: {
        class: 'consumer',
        style: 'color: red',
        id: 'root',
        'data-testid': 't',
        dir: 'rtl',
        orientation: 'vertical',
      },
    });

    expect(wrapper.attributes()).toEqual({
      class: 'vf-tabs consumer',
      style: 'color: red;',
      id: 'root',
      'data-testid': 't',
      dir: 'rtl',
      // Not a prop: the reference has no orientation, so it lands as an attribute.
      orientation: 'vertical',
    });
    expect(wrapper.get('[role="tablist"]').attributes('dir')).toBeUndefined();
  });
});

// ----------------------------------------------------------- ids and relations

describe('VfTabs characterization: ids and relationships', () => {
  it('builds tab and panel ids from one useId base and the raw value', () => {
    const wrapper = mountTabs({ slots: { panel: panelSlot } });
    const ids = tabs(wrapper).map((button) => button.attributes('id'));
    const base = ids[0]!.replace(/-tab-overview$/, '');

    expect(base).toMatch(/^vf-tabs-v-\d+$/);
    expect(ids).toEqual([`${base}-tab-overview`, `${base}-tab-settings`, `${base}-tab-billing`]);
    expect(tabs(wrapper).map((button) => button.attributes('aria-controls'))).toEqual([
      `${base}-panel-overview`,
      `${base}-panel-settings`,
      `${base}-panel-billing`,
    ]);
    expect(panel(wrapper).attributes('id')).toBe(`${base}-panel-overview`);
    expect(panel(wrapper).attributes('aria-labelledby')).toBe(`${base}-tab-overview`);
  });

  it('embeds a value with spaces into the ids unchanged', () => {
    const wrapper = mountTabs({ props: { items: [{ value: 'a b', label: 'AB' }] }, slots: { panel: panelSlot } });

    expect(wrapper.get('[role="tab"]').attributes('id')).toMatch(/-tab-a b$/);
    expect(panel(wrapper).attributes('id')).toMatch(/-panel-a b$/);
  });

  it('honours tabId: the tab id and the panel aria-labelledby use it', () => {
    const wrapper = mountTabs({
      props: { items: [{ value: 'overview', label: 'Overview', tabId: 'custom-tab' }, ITEMS[1]] },
      slots: { panel: panelSlot },
    });

    expect(tabs(wrapper)[0].attributes('id')).toBe('custom-tab');
    expect(tabs(wrapper)[1].attributes('id')).toMatch(/-tab-settings$/);
    expect(panel(wrapper).attributes('aria-labelledby')).toBe('custom-tab');
    expect(tabs(wrapper)[0].attributes('aria-controls')).toMatch(/-panel-overview$/);
  });

  it('honours panelId: the tab aria-controls and the panel id use it', () => {
    const wrapper = mountTabs({
      props: { items: [{ value: 'overview', label: 'Overview', panelId: 'custom-panel' }, ITEMS[1]] },
      slots: { panel: panelSlot },
    });

    expect(tabs(wrapper)[0].attributes('aria-controls')).toBe('custom-panel');
    expect(panel(wrapper).attributes('id')).toBe('custom-panel');
    expect(tabs(wrapper)[1].attributes('aria-controls')).toMatch(/-panel-settings$/);
  });

  it('writes aria-controls for a panelId item even without a panel slot, and for no other', () => {
    const wrapper = mountTabs({
      props: { items: [{ value: 'overview', label: 'Overview', panelId: 'external' }, ITEMS[1]] },
    });

    expect(tabs(wrapper).map((button) => button.attributes('aria-controls'))).toEqual(['external', undefined]);
    expect(panel(wrapper).exists()).toBe(false);
  });

  it('leaves aria-controls dangling for every inactive tab: only the active panel exists', () => {
    const wrapper = mountTabs({ slots: { panel: panelSlot }, attachTo: document.body });

    for (const button of tabs(wrapper)) {
      const controls = button.attributes('aria-controls')!;
      expect(document.getElementById(controls) !== null).toBe(button.attributes('aria-selected') === 'true');
    }
  });

  it('gives duplicate values duplicate ids, two selected tabs, two tabindex=0 and one panel', () => {
    const wrapper = mountTabs({
      props: { items: [ITEMS[0], { value: 'overview', label: 'Again' }, ITEMS[1]] },
      slots: { panel: panelSlot },
    });

    const ids = tabs(wrapper).map((button) => button.attributes('id'));
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[0]);
    expect(selectedValues(wrapper)).toEqual(['true', 'true', 'false']);
    expect(tabindexes(wrapper)).toEqual(['0', '0', '-1']);
    expect(tabs(wrapper).map((button) => button.attributes('aria-controls'))).toEqual([
      ids[0]!.replace('-tab-', '-panel-'),
      ids[0]!.replace('-tab-', '-panel-'),
      ids[2]!.replace('-tab-', '-panel-'),
    ]);
    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(1);
    expect(panel(wrapper).text()).toBe('panel:overview');
  });

  it('collides on ids across two separate createApp roots, but not inside one app', () => {
    // Two mounts are two apps, and Vue's useId counter restarts per app.
    const first = mountTabs();
    const second = mountTabs();
    expect(tabs(first).map((button) => button.attributes('id'))).toEqual(
      tabs(second).map((button) => button.attributes('id')),
    );

    // One app rendering two instances gives each its own base. This is the
    // shape of the parity fixture and of any real page; the collision above
    // is a fixture artifact and is recorded, not reproduced elsewhere.
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({ render: () => [h(VfTabs, { items: ITEMS }), h(VfTabs, { items: ITEMS })] });
    app.mount(host);
    const ids = [...host.querySelectorAll('[role="tab"]')].map((button) => button.id);
    expect(new Set(ids).size).toBe(6);
    app.unmount();
    host.remove();
  });
});

// ------------------------------------------------------------------ selection

describe('VfTabs characterization: initial selection', () => {
  it('selects the first enabled item by default: aria-selected, tabindex and panel follow the value', () => {
    const wrapper = mountTabs({ slots: { panel: panelSlot } });

    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
    expect(tabindexes(wrapper)).toEqual(['0', '-1', '-1']);
    expect(panel(wrapper).text()).toBe('panel:overview');
  });

  it('skips a disabled first item for the fallback', () => {
    const wrapper = mountTabs({ props: { items: withDisabled(ITEMS, 'overview') }, slots: { panel: panelSlot } });

    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
    expect(tabindexes(wrapper)).toEqual(['-1', '0', '-1']);
    expect(tabs(wrapper)[0].attributes('disabled')).toBe('');
    expect(panel(wrapper).text()).toBe('panel:settings');
  });

  it('seeds from defaultValue', () => {
    const wrapper = mountTabs({ props: { defaultValue: 'billing' }, slots: { panel: panelSlot } });

    expect(selectedValues(wrapper)).toEqual(['false', 'false', 'true']);
    expect(tabindexes(wrapper)).toEqual(['-1', '-1', '0']);
    expect(panel(wrapper).text()).toBe('panel:billing');
  });

  it('lets modelValue win over defaultValue', () => {
    const wrapper = mountTabs({ props: { modelValue: 'settings', defaultValue: 'billing' } });

    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
  });

  it.each([
    ['an unknown', 'nope'],
    ['an empty-string', ''],
  ])(
    'renders %s controlled value as no selection: zero tabindex=0, no panel, hidden indicator',
    (_label, modelValue) => {
      const wrapper = mountTabs({ props: { modelValue, defaultValue: 'settings' }, slots: { panel: panelSlot } });

      expect(selectedValues(wrapper)).toEqual(['false', 'false', 'false']);
      expect(tabindexes(wrapper)).toEqual(['-1', '-1', '-1']);
      expect(panel(wrapper).exists()).toBe(false);
      expect(indicator(wrapper).attributes('style')).toBe('opacity: 0; transform: translateX(0); width: 0px;');
    },
  );

  it('lets a null modelValue fall through to the internal value', () => {
    const wrapper = mountTabs({
      props: { modelValue: null as unknown as string, defaultValue: 'settings' },
      slots: { panel: panelSlot },
    });

    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
    expect(panel(wrapper).text()).toBe('panel:settings');
  });

  it('keeps a disabled defaultValue selected: aria-selected, tabindex=0 and its panel', () => {
    const wrapper = mountTabs({
      props: { items: withDisabled(ITEMS, 'settings'), defaultValue: 'settings' },
      slots: { panel: panelSlot },
    });

    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
    expect(tabindexes(wrapper)).toEqual(['-1', '0', '-1']);
    expect(tabs(wrapper)[1].attributes('disabled')).toBe('');
    expect(panel(wrapper).text()).toBe('panel:settings');
  });

  it('selects nothing when every item is disabled', () => {
    const wrapper = mountTabs({
      props: { items: withDisabled(ITEMS, 'overview', 'settings', 'billing') },
      slots: { panel: panelSlot },
    });

    expect(selectedValues(wrapper)).toEqual(['false', 'false', 'false']);
    expect(tabindexes(wrapper)).toEqual(['-1', '-1', '-1']);
    expect(tabs(wrapper).map((button) => button.attributes('disabled'))).toEqual(['', '', '']);
    expect(panel(wrapper).exists()).toBe(false);
  });

  it('selects a single item and keeps it selected through its own navigation', async () => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ props: { items: [ITEMS[0]] }, attrs, attachTo: document.body });

    expect(selectedValues(wrapper)).toEqual(['true']);
    expect(keydown(tabs(wrapper)[0], 'ArrowRight')).toBe(true);
    await nextTick();
    expect(selectedValues(wrapper)).toEqual(['true']);
    expect(log).toEqual(['update:overview', 'change:overview']);
    expect(focusedText()).toBe('Overview');
  });

  it('writes disabled as the native attribute only, never aria-disabled', () => {
    const wrapper = mountTabs({ props: { items: withDisabled(ITEMS, 'billing') } });

    expect(tabs(wrapper)[2].attributes('disabled')).toBe('');
    expect(wrapper.findAll('[aria-disabled]')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------- slots

describe('VfTabs characterization: slots', () => {
  it('renders the label as the tab fallback and hands the tab slot item, isActive and index', async () => {
    const wrapper = mountTabs({
      slots: {
        tab: ({ item, isActive, index }: { item: VfTabItem; isActive: boolean; index: number }) =>
          h('b', `${index}:${item.label}:${isActive}`),
      },
      attachTo: document.body,
    });

    expect(tabs(wrapper).map((button) => button.element.innerHTML)).toEqual([
      '<b>0:Overview:true</b>',
      '<b>1:Settings:false</b>',
      '<b>2:Billing:false</b>',
    ]);
    await tabs(wrapper)[1].trigger('click');
    expect(tabs(wrapper).map((button) => button.element.innerHTML)).toEqual([
      '<b>0:Overview:false</b>',
      '<b>1:Settings:true</b>',
      '<b>2:Billing:false</b>',
    ]);
  });

  it('hands the panel slot the active value and re-renders it on a switch', async () => {
    const wrapper = mountTabs({ slots: { panel: panelSlot }, attachTo: document.body });

    expect(panel(wrapper).element.innerHTML).toBe('<p>panel:overview</p>');
    await tabs(wrapper)[2].trigger('click');
    expect(panel(wrapper).element.innerHTML).toBe('<p>panel:billing</p>');
  });

  it('renders the panel with role, id, aria-labelledby and tabindex=0, in that order', () => {
    const wrapper = mountTabs({ slots: { panel: panelSlot } });

    expect(panel(wrapper).element.outerHTML).toMatch(
      /^<div id="vf-tabs-v-\d+-panel-overview" aria-labelledby="vf-tabs-v-\d+-tab-overview" class="vf-tabs__panel" role="tabpanel" tabindex="0"><p>panel:overview<\/p><\/div>$/,
    );
  });

  it('renders no default slot content anywhere', () => {
    const wrapper = mountTabs({ slots: { default: () => h('i', 'stray') } });

    expect(wrapper.find('i').exists()).toBe(false);
  });
});

// ------------------------------------------------------------ panel lifecycle

describe('VfTabs characterization: panel lifecycle', () => {
  it('keeps the same panel element across a switch and patches its id, label and content', async () => {
    const wrapper = mountTabs({ slots: { panel: panelSlot }, attachTo: document.body });
    const element = panel(wrapper).element;

    await tabs(wrapper)[1].trigger('click');
    expect(panel(wrapper).element).toBe(element);
    expect(panel(wrapper).attributes('id')).toMatch(/-panel-settings$/);
    expect(panel(wrapper).attributes('aria-labelledby')).toBe(tabs(wrapper)[1].attributes('id'));
    expect(panel(wrapper).text()).toBe('panel:settings');
    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(1);
  });

  it('removes the panel when the controlled value stops matching, and renders a fresh one when it matches again', async () => {
    const wrapper = mountTabs({
      props: { modelValue: 'overview' },
      slots: { panel: panelSlot },
      attachTo: document.body,
    });
    const element = panel(wrapper).element;

    await wrapper.setProps({ modelValue: 'nope' });
    expect(panel(wrapper).exists()).toBe(false);
    expect(selectedValues(wrapper)).toEqual(['false', 'false', 'false']);

    await wrapper.setProps({ modelValue: 'billing' });
    expect(panel(wrapper).exists()).toBe(true);
    expect(panel(wrapper).element).not.toBe(element);
    expect(panel(wrapper).text()).toBe('panel:billing');
  });

  it('keeps every tab element across a switch', async () => {
    const wrapper = mountTabs({ attachTo: document.body });
    const elements = tabs(wrapper).map((button) => button.element);

    await tabs(wrapper)[2].trigger('click');
    expect(tabs(wrapper).map((button) => button.element)).toEqual(elements);
  });
});

// ----------------------------------------------------------------- activation

describe('VfTabs characterization: activation and events', () => {
  it('emits update:modelValue then change, once each, on a click of another tab', async () => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ attrs, slots: { panel: panelSlot }, attachTo: document.body });

    await tabs(wrapper)[1].trigger('click');
    expect(log).toEqual(['update:settings', 'change:settings']);
    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
    expect(tabindexes(wrapper)).toEqual(['-1', '0', '-1']);
    expect(panel(wrapper).text()).toBe('panel:settings');
  });

  it('emits the pair again on a click of the current tab', async () => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ attrs, attachTo: document.body });

    await tabs(wrapper)[0].trigger('click');
    await tabs(wrapper)[0].trigger('click');
    expect(log).toEqual(['update:overview', 'change:overview', 'update:overview', 'change:overview']);
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
  });

  it('emits nothing for a click on a disabled tab', async () => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ props: { items: withDisabled(ITEMS, 'settings') }, attrs, attachTo: document.body });

    await tabs(wrapper)[1].trigger('click');
    expect(log).toEqual([]);
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
  });

  it('emits the payload as the string value, with no other arguments', async () => {
    const wrapper = mountTabs({ attachTo: document.body });

    await tabs(wrapper)[2].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['billing']]);
    expect(wrapper.emitted('change')).toEqual([['billing']]);
  });

  it('does not write the state back when controlled: the parent decides, the pair is emitted anyway', async () => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({
      props: { modelValue: 'overview' },
      attrs,
      slots: { panel: panelSlot },
      attachTo: document.body,
    });

    await tabs(wrapper)[1].trigger('click');
    expect(log).toEqual(['update:settings', 'change:settings']);
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
    expect(tabindexes(wrapper)).toEqual(['0', '-1', '-1']);
    expect(panel(wrapper).text()).toBe('panel:overview');

    await tabs(wrapper)[1].trigger('click');
    expect(log).toEqual(['update:settings', 'change:settings', 'update:settings', 'change:settings']);
  });

  it('is controlled for emitting under a null modelValue: it emits and keeps the internal value', async () => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({
      props: { modelValue: null as unknown as string, defaultValue: 'settings' },
      attrs,
      attachTo: document.body,
    });

    await tabs(wrapper)[2].trigger('click');
    expect(log).toEqual(['update:billing', 'change:billing']);
    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
  });

  it('follows a v-model parent that writes the value back', async () => {
    const value = ref('overview');
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(
            VfTabs,
            { items: ITEMS, modelValue: value.value, 'onUpdate:modelValue': (next: string) => (value.value = next) },
            { panel: panelSlot },
          ),
      }),
      { attachTo: document.body },
    );

    await wrapper.findAll('[role="tab"]')[2].trigger('click');
    expect(value.value).toBe('billing');
    expect(wrapper.findAll('[role="tab"]').map((button) => button.attributes('aria-selected'))).toEqual([
      'false',
      'false',
      'true',
    ]);
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('panel:billing');
  });
});

// ------------------------------------------------------------------- keyboard

describe('VfTabs characterization: keyboard', () => {
  it.each([
    ['Enter', 'Enter'],
    ['Space', ' '],
    ['Tab', 'Tab'],
    ['PageDown', 'PageDown'],
    ['Escape', 'Escape'],
  ])('leaves %s to the browser: not prevented, no emit, no selection change', async (_label, key) => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ attrs, attachTo: document.body });
    (tabs(wrapper)[1].element as HTMLElement).focus();

    expect(keydown(tabs(wrapper)[1], key)).toBe(false);
    await nextTick();
    expect(log).toEqual([]);
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
    expect(focusedText()).toBe('Settings');
  });

  it.each([
    ['ArrowRight', 'Settings', 'settings'],
    ['ArrowDown', 'Settings', 'settings'],
    ['ArrowLeft', 'Billing', 'billing'],
    ['ArrowUp', 'Billing', 'billing'],
    ['End', 'Billing', 'billing'],
    ['Home', 'Overview', 'overview'],
  ])('handles %s from the first tab: prevented, activates %s and focuses it', async (key, label, value) => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ attrs, attachTo: document.body });

    expect(keydown(tabs(wrapper)[0], key)).toBe(true);
    await nextTick();
    expect(log).toEqual([`update:${value}`, `change:${value}`]);
    expect(wrapper.get('[aria-selected="true"]').text()).toBe(label);
    expect(focusedText()).toBe(label);
  });

  it('wraps forward from the last enabled tab and backward from the first', async () => {
    const wrapper = mountTabs({ attachTo: document.body });

    keydown(tabs(wrapper)[2], 'ArrowRight');
    await nextTick();
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Overview');
    expect(focusedText()).toBe('Overview');

    keydown(tabs(wrapper)[0], 'ArrowLeft');
    await nextTick();
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Billing');
    expect(focusedText()).toBe('Billing');
  });

  it('skips a disabled tab in both directions and for Home and End', async () => {
    const items = [...ITEMS, { value: 'docs', label: 'Docs' }];
    const wrapper = mountTabs({
      props: { items: withDisabled(items, 'overview', 'billing'), defaultValue: 'settings' },
      attachTo: document.body,
    });

    keydown(tabs(wrapper)[1], 'ArrowRight');
    await nextTick();
    expect(focusedText()).toBe('Docs');
    keydown(tabs(wrapper)[3], 'ArrowLeft');
    await nextTick();
    expect(focusedText()).toBe('Settings');
    keydown(tabs(wrapper)[1], 'End');
    await nextTick();
    expect(focusedText()).toBe('Docs');
    keydown(tabs(wrapper)[3], 'Home');
    await nextTick();
    expect(focusedText()).toBe('Settings');
    expect(wrapper.emitted('change')).toEqual([['docs'], ['settings'], ['docs'], ['settings']]);
  });

  it('ignores a key on a disabled tab: not prevented, no emit, no focus move', async () => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({
      props: { items: withDisabled(ITEMS, 'settings'), defaultValue: 'settings' },
      attrs,
      attachTo: document.body,
    });

    expect(keydown(tabs(wrapper)[1], 'ArrowRight')).toBe(false);
    expect(keydown(tabs(wrapper)[1], 'Home')).toBe(false);
    await nextTick();
    expect(log).toEqual([]);
    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
  });

  it('navigates from the tab that received the key, not from the selected one', async () => {
    const { log, attrs } = emitLog();
    // Controlled and refused: the selection stays on overview while focus
    // walks. The next key starts from the focused tab.
    const wrapper = mountTabs({
      props: { modelValue: 'overview' },
      attrs,
      slots: { panel: panelSlot },
      attachTo: document.body,
    });

    keydown(tabs(wrapper)[0], 'ArrowRight');
    await nextTick();
    expect(focusedText()).toBe('Settings');
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
    expect(tabindexes(wrapper)).toEqual(['0', '-1', '-1']);
    expect(panel(wrapper).text()).toBe('panel:overview');

    keydown(tabs(wrapper)[1], 'ArrowRight');
    await nextTick();
    expect(focusedText()).toBe('Billing');
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
    expect(log).toEqual(['update:settings', 'change:settings', 'update:billing', 'change:billing']);
  });

  it('navigates duplicate values by the first occurrence: focus lands on the first matching tab', async () => {
    const wrapper = mountTabs({
      props: { items: [ITEMS[0], { value: 'overview', label: 'Again' }, ITEMS[1]], defaultValue: 'settings' },
      attachTo: document.body,
    });

    keydown(tabs(wrapper)[2], 'ArrowRight');
    await nextTick();
    expect(focusedText()).toBe('Overview');
    expect(selectedValues(wrapper)).toEqual(['true', 'true', 'false']);
    expect(wrapper.emitted('change')).toEqual([['overview']]);
  });

  it('focuses without activating nothing: focus alone changes no state and emits nothing', async () => {
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ attrs, attachTo: document.body });

    (tabs(wrapper)[2].element as HTMLElement).focus();
    await nextTick();
    expect(log).toEqual([]);
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
  });
});

// ------------------------------------------------------------------------ RTL

describe('VfTabs characterization: direction', () => {
  it('reverses ArrowLeft and ArrowRight under an ancestor dir=rtl, and keeps ArrowDown/ArrowUp forward/backward', async () => {
    const wrapper = mountTabs({ attrs: { dir: 'rtl' }, attachTo: document.body });

    keydown(tabs(wrapper)[0], 'ArrowLeft');
    await nextTick();
    expect(focusedText()).toBe('Settings');
    keydown(tabs(wrapper)[1], 'ArrowRight');
    await nextTick();
    expect(focusedText()).toBe('Overview');
    keydown(tabs(wrapper)[0], 'ArrowDown');
    await nextTick();
    expect(focusedText()).toBe('Settings');
    keydown(tabs(wrapper)[1], 'ArrowUp');
    await nextTick();
    expect(focusedText()).toBe('Overview');
  });

  it('reads dir from the nearest ancestor, case-insensitively', async () => {
    const host = document.createElement('div');
    host.setAttribute('dir', 'RTL');
    document.body.append(host);
    const wrapper = mountTabs({ attachTo: host });

    keydown(tabs(wrapper)[0], 'ArrowLeft');
    await nextTick();
    expect(focusedText()).toBe('Settings');
    wrapper.unmount();
    host.remove();
  });

  it('reads the document element dir through closest(), and an ancestor dir=ltr shadows it', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const wrapper = mountTabs({ attachTo: document.body });
    keydown(tabs(wrapper)[0], 'ArrowLeft');
    await nextTick();
    expect(focusedText()).toBe('Settings');

    // An ancestor dir=ltr shadows the document's rtl.
    const host = document.createElement('div');
    host.setAttribute('dir', 'ltr');
    document.body.append(host);
    const shadowed = mountTabs({ attachTo: host });
    keydown(tabs(shadowed)[0], 'ArrowLeft');
    await nextTick();
    expect(shadowed.get('[aria-selected="true"]').text()).toBe('Billing');
    shadowed.unmount();
    host.remove();
  });

  it('falls back to the document element dir across a shadow boundary, where closest() finds no ancestor', async () => {
    // closest('[dir]') stops at a shadow root, so this is the one place the
    // explicit documentElement fallback is reachable: inside a shadow tree
    // the document's dir still decides the keyboard.
    document.documentElement.setAttribute('dir', 'rtl');
    const host = document.createElement('div');
    document.body.append(host);
    const mountPoint = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(mountPoint);
    const wrapper = mountTabs({ attachTo: mountPoint });

    expect(tabs(wrapper)[0].element.closest('[dir]')).toBeNull();
    keydown(tabs(wrapper)[0], 'ArrowLeft');
    await nextTick();
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Settings');
    wrapper.unmount();
    host.remove();
  });

  it('ignores the computed direction for the keyboard: a styled rtl without a dir attribute stays LTR', async () => {
    const host = document.createElement('div');
    host.style.direction = 'rtl';
    document.body.append(host);
    // jsdom does not inherit `direction` into the computed style of the
    // descendants, so the computed value is pinned as a browser would
    // resolve it: rtl for everything inside the host.
    const computed = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = computed(element, pseudo);
      if (host.contains(element)) {
        Object.defineProperty(style, 'direction', { configurable: true, value: 'rtl' });
      }
      return style;
    });
    const wrapper = mountTabs({ attachTo: host });

    keydown(tabs(wrapper)[0], 'ArrowRight');
    await nextTick();
    expect(focusedText()).toBe('Settings');
    wrapper.unmount();
    host.remove();
    vi.restoreAllMocks();
  });

  it('reads the scroller direction from the dir attribute or the computed style, and mirrors the scroll state', async () => {
    const wrapper = mountTabs({ attrs: { dir: 'rtl' }, attachTo: document.body });
    const list = viewport(wrapper);
    pinSize(list, { clientWidth: 120, scrollWidth: 480, scrollLeft: 0 });
    await frame();
    await frame();
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');

    expect(leftButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(true);
    list.scrollLeft = -40;
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    expect(leftButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    list.scrollLeft = -360;
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(leftButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(true);

    // Computed style alone, no dir attribute: the scroller still mirrors.
    const styled = mountTabs({ attachTo: document.body });
    const styledList = viewport(styled);
    styledList.style.direction = 'rtl';
    pinSize(styledList, { clientWidth: 120, scrollWidth: 480, scrollLeft: 0 });
    await frame();
    await frame();
    await styled.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(leftButton(styled).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    expect(rightButton(styled).classes('vf-tabs__scroll-button--hidden')).toBe(true);
    // ... while the keyboard, which never reads computed style, stays LTR.
    keydown(tabs(styled)[0], 'ArrowRight');
    await nextTick();
    expect(styled.get('[aria-selected="true"]').text()).toBe('Settings');
  });
});

// ------------------------------------------------------------------ siblings

describe('VfTabs characterization: sibling instances', () => {
  it('keeps state, focus and ids apart between two instances sharing values in one app', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const changes: string[] = [];
    const app = createApp({
      render: () => [
        h(VfTabs, { items: ITEMS, onChange: (value: string) => changes.push(`a:${value}`) }, { panel: panelSlot }),
        h(VfTabs, { items: ITEMS, onChange: (value: string) => changes.push(`b:${value}`) }, { panel: panelSlot }),
      ],
    });
    app.mount(host);
    const [first, second] = [...host.querySelectorAll('.vf-tabs')];
    const secondTabs = [...second.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    secondTabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    await nextTick();
    expect(second.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.textContent).toBe('Settings');
    expect([...first.querySelectorAll('[role="tab"]')].map((button) => button.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect([...second.querySelectorAll('[role="tab"]')].map((button) => button.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ]);
    expect(changes).toEqual(['b:settings']);
    expect(first.querySelector('[role="tabpanel"]')?.textContent).toBe('panel:overview');
    expect(second.querySelector('[role="tabpanel"]')?.textContent).toBe('panel:settings');
    expect(second.querySelector('[role="tabpanel"]')?.getAttribute('aria-labelledby')).toBe(secondTabs[1].id);
    expect(first.querySelector('[role="tabpanel"]')?.id).not.toBe(second.querySelector('[role="tabpanel"]')?.id);

    app.unmount();
    host.remove();
  });
});

// -------------------------------------------------------------- items watch

describe('VfTabs characterization: dynamic items', () => {
  it('reseeds the fallback and emits the pair when the active item is disabled', async () => {
    const props = reactive({ items: ITEMS.map((item) => ({ ...item })), defaultValue: 'settings' });
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ props, attrs, slots: { panel: panelSlot } });

    props.items[1].disabled = true;
    await nextTick();
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
    expect(panel(wrapper).text()).toBe('panel:overview');
    expect(log).toEqual(['update:overview', 'change:overview']);
  });

  it('reseeds the fallback and emits the pair when the active item is removed', async () => {
    const props = reactive({ items: ITEMS.map((item) => ({ ...item })), defaultValue: 'settings' });
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ props, attrs });

    props.items.splice(1, 1);
    await nextTick();
    expect(tabs(wrapper).map((button) => button.text())).toEqual(['Overview', 'Billing']);
    expect(selectedValues(wrapper)).toEqual(['true', 'false']);
    expect(log).toEqual(['update:overview', 'change:overview']);
  });

  it('keeps a now-disabled active item selected and emits nothing when no enabled item is left', async () => {
    const props = reactive({ items: withDisabled(ITEMS, 'settings', 'billing') });
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ props, attrs, slots: { panel: panelSlot } });

    props.items[0].disabled = true;
    await nextTick();
    // No fallback exists, so the value stays and the selection projects it
    // onto a disabled tab: selected, tabindex=0, panel rendered.
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
    expect(tabindexes(wrapper)).toEqual(['0', '-1', '-1']);
    expect(tabs(wrapper)[0].attributes('disabled')).toBe('');
    expect(panel(wrapper).text()).toBe('panel:overview');
    expect(log).toEqual([]);
  });

  it('is not immediate: a disabled defaultValue survives mount and is reseeded only on a later change', async () => {
    const props = reactive({ items: withDisabled(ITEMS, 'settings'), defaultValue: 'settings' });
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ props, attrs });

    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
    expect(log).toEqual([]);
    props.items[2].label = 'Invoices';
    await nextTick();
    expect(selectedValues(wrapper)).toEqual(['true', 'false', 'false']);
    expect(log).toEqual(['update:overview', 'change:overview']);
  });

  it('emits the pair but keeps the controlled value when the parent does not write back', async () => {
    const props = reactive({ items: ITEMS.map((item) => ({ ...item })), modelValue: 'settings' });
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ props, attrs });

    props.items[1].disabled = true;
    await nextTick();
    expect(log).toEqual(['update:overview', 'change:overview']);
    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
  });

  it('changes nothing when the items change but the active item stays enabled', async () => {
    const props = reactive({ items: ITEMS.map((item) => ({ ...item })), defaultValue: 'settings' });
    const { log, attrs } = emitLog();
    const wrapper = mountTabs({ props, attrs });

    props.items.reverse();
    await nextTick();
    expect(tabs(wrapper).map((button) => button.text())).toEqual(['Billing', 'Settings', 'Overview']);
    expect(selectedValues(wrapper)).toEqual(['false', 'true', 'false']);
    expect(log).toEqual([]);
  });
});

// ------------------------------------------------------------- indicator

describe('VfTabs characterization: indicator geometry', () => {
  it('starts hidden with the literal translateX(0), and measures on the tick after mount', async () => {
    const wrapper = mountTabs();

    // Before the mounted measurement: the seed value, with the literal `0`.
    expect(indicator(wrapper).attributes('style')).toBe('opacity: 0; transform: translateX(0); width: 0px;');
    await nextTick();
    // jsdom measures every rect as zero, so the mounted update lands on a
    // zero-width active tab: opacity 0 but the measured `0px` form.
    expect(indicator(wrapper).attributes('style')).toBe('opacity: 0; transform: translateX(0px); width: 0px;');
    // No active tab: the seed form again, and it stays.
    const unknown = mountTabs({ props: { modelValue: 'nope' } });
    await nextTick();
    expect(unknown.get('.vf-tabs__indicator').attributes('style')).toBe(
      'opacity: 0; transform: translateX(0); width: 0px;',
    );
  });

  it('places the indicator at the active tab: translateX(tab.left - list.left), width tab.width, fractional pixels kept', async () => {
    const wrapper = mountTabs({ props: { defaultValue: 'settings' }, attachTo: document.body });
    pinDefaultGeometry(wrapper);
    window.dispatchEvent(new Event('resize'));
    await nextTick();

    expect(indicator(wrapper).attributes('style')).toBe(
      'opacity: 1; transform: translateX(97.359375px); width: 85.671875px;',
    );

    await tabs(wrapper)[2].trigger('click');
    await nextTick();
    expect(indicator(wrapper).attributes('style')).toBe(
      'opacity: 1; transform: translateX(187.03125px); width: 68.921875px;',
    );
  });

  it('clips the indicator to the viewport minus the shown scroll buttons, and hides it at zero width', async () => {
    const wrapper = mountTabs({ props: { defaultValue: 'overview' }, attachTo: document.body });
    // Scrolled by 60px in a 480px-wide list: the left button shows, so the
    // visible start is its 28px, and the first tab spans [-60, 33.36].
    pinDefaultGeometry(wrapper, { scrollLeft: 60, scrollWidth: 480 });
    await frame();
    await frame();
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    await nextTick();

    expect(leftButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    expect(indicator(wrapper).attributes('style')).toBe('opacity: 1; transform: translateX(28px); width: 5.359375px;');

    // The active tab entirely out of view keeps translateX at the inset and
    // reports opacity 0 with width 0.
    pinDefaultGeometry(wrapper, { scrollLeft: 200, scrollWidth: 480 });
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    await nextTick();
    expect(indicator(wrapper).attributes('style')).toBe('opacity: 0; transform: translateX(28px); width: 0px;');
  });

  it('clips against the right button only while the list can scroll right', async () => {
    const wrapper = mountTabs({ props: { defaultValue: 'billing' }, attachTo: document.body });
    // The last tab spans [187.03, 255.95] in a 360px viewport. With overflow
    // to the right the visible end is 360 - 28 = 332: no clipping. Pin the
    // viewport narrower so the button bites: clientWidth 240 → end 212.
    pinDefaultGeometry(wrapper, { scrollWidth: 480 });
    pinSize(viewport(wrapper), { clientWidth: 240 });
    await frame();
    await frame();
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    await nextTick();

    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    expect(indicator(wrapper).attributes('style')).toBe(
      'opacity: 1; transform: translateX(187.03125px); width: 24.96875px;',
    );
  });

  it('computes in the LTR frame under RTL: translateX is the tab offset from the list left edge', async () => {
    const wrapper = mountTabs({ props: { defaultValue: 'settings' }, attrs: { dir: 'rtl' }, attachTo: document.body });
    pinDefaultGeometry(wrapper);
    // Under RTL the tabs sit at the right: pin the mirrored rects.
    pinRect(tabs(wrapper)[0].element, { left: 24 + 360 - 93.359375, width: 93.359375 });
    pinRect(tabs(wrapper)[1].element, { left: 24 + 360 - 93.359375 - 4 - 85.671875, width: 85.671875 });
    window.dispatchEvent(new Event('resize'));
    await nextTick();

    expect(indicator(wrapper).attributes('style')).toBe(
      'opacity: 1; transform: translateX(176.96875px); width: 85.671875px;',
    );
  });

  it('gains the ready class one frame after mount, not on the mounted tick', async () => {
    const wrapper = mountTabs({ attachTo: document.body });

    expect(indicator(wrapper).classes()).toEqual(['vf-tabs__indicator']);
    await nextTick();
    await nextTick();
    expect(indicator(wrapper).classes()).toEqual(['vf-tabs__indicator']);
    await frame();
    await nextTick();
    expect(indicator(wrapper).classes()).toEqual(['vf-tabs__indicator', 'vf-tabs__indicator--ready']);
  });
});

// ------------------------------------------------------------- scroller

describe('VfTabs characterization: horizontal scroller', () => {
  it('hides both scroll buttons before the first frame whatever the overflow, then shows the right one', async () => {
    const wrapper = mountTabs({ attachTo: document.body });
    pinSize(viewport(wrapper), { clientWidth: 120, scrollWidth: 480, scrollLeft: 0 });

    for (const button of [leftButton(wrapper), rightButton(wrapper)]) {
      expect(button.classes()).toContain('vf-horizontal-scroller__control--hidden');
      expect(button.classes()).toContain('vf-tabs__scroll-button--hidden');
      expect(button.attributes('aria-hidden')).toBe('true');
      expect(button.attributes('tabindex')).toBe('-1');
      expect(button.attributes('disabled')).toBe('');
    }
    expect(wrapper.classes()).toEqual(['vf-tabs']);
    expect(wrapper.get('.vf-tabs__list').classes()).toEqual(['vf-horizontal-scroller', 'vf-tabs__list']);

    await frame();
    await nextTick();
    expect(wrapper.classes()).toEqual(['vf-tabs', 'vf-tabs--scroll-controls-ready']);
    expect(wrapper.get('.vf-tabs__list').classes()).toEqual([
      'vf-horizontal-scroller',
      'vf-horizontal-scroller--controls-ready',
      'vf-horizontal-scroller--can-scroll-right',
      'vf-tabs__list--can-scroll-right',
      'vf-tabs--scroll-controls-ready',
      'vf-tabs__list',
    ]);
    expect(rightButton(wrapper).classes()).toEqual([
      'vf-horizontal-scroller__control',
      'vf-horizontal-scroller__control--right',
      'vf-tabs__scroll-button',
      'vf-tabs__scroll-button--right',
    ]);
    expect(rightButton(wrapper).attributes('aria-hidden')).toBe('false');
    expect(rightButton(wrapper).attributes('tabindex')).toBe('0');
    expect(rightButton(wrapper).attributes('disabled')).toBeUndefined();
    expect(leftButton(wrapper).attributes('disabled')).toBe('');
    // Fades wait for the second frame.
    expect(wrapper.findAll('.vf-horizontal-scroller__fade')).toHaveLength(0);

    await frame();
    await nextTick();
    expect(wrapper.classes()).toEqual([
      'vf-tabs',
      'vf-tabs--scroll-controls-ready',
      'vf-tabs--scroll-controls-animated',
    ]);
    expect(wrapper.findAll('.vf-horizontal-scroller__fade').map((fade) => fade.classes())).toEqual([
      ['vf-horizontal-scroller__fade', 'vf-horizontal-scroller__fade--right'],
    ]);
    expect(wrapper.get('.vf-horizontal-scroller__fade').attributes('aria-hidden')).toBe('true');
  });

  it('shows no control and no fade when nothing overflows', async () => {
    const wrapper = mountTabs({ attachTo: document.body });
    pinSize(viewport(wrapper), { clientWidth: 360, scrollWidth: 360, scrollLeft: 0 });
    await frame();
    await frame();
    await nextTick();

    expect(wrapper.get('.vf-tabs__list').classes()).not.toContain('vf-tabs__list--can-scroll-right');
    expect(leftButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(true);
    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(true);
    expect(wrapper.findAll('.vf-horizontal-scroller__fade')).toHaveLength(0);
  });

  it('uses a one-pixel threshold on both edges: 1px of remaining scroll is "cannot scroll"', async () => {
    const wrapper = mountTabs({ attachTo: document.body });
    pinSize(viewport(wrapper), { clientWidth: 359, scrollWidth: 360, scrollLeft: 0 });
    await frame();
    await frame();
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(true);

    pinSize(viewport(wrapper), { scrollWidth: 362, scrollLeft: 1 });
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(leftButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(true);
    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);

    pinSize(viewport(wrapper), { scrollLeft: 2 });
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(leftButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
  });

  it('shows both controls and both fades in the middle, and only the left ones at the end', async () => {
    const wrapper = mountTabs({ attachTo: document.body });
    pinSize(viewport(wrapper), { clientWidth: 120, scrollWidth: 480, scrollLeft: 100 });
    await frame();
    await frame();
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');

    expect(leftButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    expect(wrapper.findAll('.vf-horizontal-scroller__fade').map((fade) => fade.classes()[1])).toEqual([
      'vf-horizontal-scroller__fade--left',
      'vf-horizontal-scroller__fade--right',
    ]);

    pinSize(viewport(wrapper), { scrollLeft: 360 });
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(leftButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);
    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(true);
    expect(wrapper.findAll('.vf-horizontal-scroller__fade').map((fade) => fade.classes()[1])).toEqual([
      'vf-horizontal-scroller__fade--left',
    ]);
  });

  it('scrolls by max(120, round(clientWidth * 0.6)) smoothly, and instantly under reduced motion', async () => {
    const wrapper = mountTabs({ attachTo: document.body });
    const list = viewport(wrapper);
    const scrollTo = vi.fn();
    pinSize(list, { clientWidth: 300, scrollWidth: 900, scrollLeft: 50 });
    Object.defineProperty(list, 'scrollTo', { configurable: true, value: scrollTo });
    await frame();
    await frame();
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');

    await rightButton(wrapper).trigger('click');
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 230, behavior: 'smooth' });
    await leftButton(wrapper).trigger('click');
    expect(scrollTo).toHaveBeenLastCalledWith({ left: -130, behavior: 'smooth' });

    pinSize(list, { clientWidth: 150 });
    await rightButton(wrapper).trigger('click');
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 170, behavior: 'smooth' });

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    await rightButton(wrapper).trigger('click');
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 170, behavior: 'auto' });
  });

  it('marks 140 ms of scrolling on the viewport variable and the indicator class, restarting on each scroll', async () => {
    vi.useFakeTimers();
    const wrapper = mountTabs({ attachTo: document.body });

    expect(viewport(wrapper).getAttribute('style')).toBe('--vf-horizontal-scroller-scrollbar-width: none;');
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    expect(viewport(wrapper).getAttribute('style')).toBe('--vf-horizontal-scroller-scrollbar-width: thin;');
    expect(indicator(wrapper).classes()).toContain('vf-tabs__indicator--no-transition');

    vi.advanceTimersByTime(100);
    await wrapper.get('.vf-tabs__list-scroller').trigger('scroll');
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(viewport(wrapper).getAttribute('style')).toBe('--vf-horizontal-scroller-scrollbar-width: thin;');

    vi.advanceTimersByTime(40);
    await nextTick();
    expect(viewport(wrapper).getAttribute('style')).toBe('--vf-horizontal-scroller-scrollbar-width: none;');
    expect(indicator(wrapper).classes()).not.toContain('vf-tabs__indicator--no-transition');
  });

  it('observes the viewport with a ResizeObserver and listens to window resize, and tears both down', async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    const callbacks: Array<() => void> = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          callbacks.push(callback);
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const wrapper = mountTabs({ attachTo: document.body });
    await nextTick();

    // The scroller observes the viewport, the tabs observe it again.
    expect(observe.mock.calls.map(([element]) => element)).toEqual([viewport(wrapper), viewport(wrapper)]);
    expect(add.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(2);

    pinSize(viewport(wrapper), { clientWidth: 120, scrollWidth: 480, scrollLeft: 0 });
    await frame();
    await frame();
    for (const callback of callbacks) callback();
    await nextTick();
    expect(rightButton(wrapper).classes('vf-tabs__scroll-button--hidden')).toBe(false);

    wrapper.unmount();
    expect(disconnect).toHaveBeenCalledTimes(2);
    expect(remove.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(2);
    add.mockRestore();
    remove.mockRestore();
  });
});
