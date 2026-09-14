// Characterization of the historical VfAccordion at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The first migrated component that owns an interactive control of its own: a
// native button it renders, wires and toggles. Everything before M22 either
// owned no interaction at all or wrapped a native control the browser drives;
// this component owns state, changes it on a user gesture, announces it through
// ARIA, and animates it. Each of those is a contract, and each is pinned here
// independently of the others - a port can get the state right and the ARIA
// wrong, or the ARIA right and the DOM wrong, and the parity harness has to be
// able to see which.
//
// Empirically established facts that are easy to "correct" and must not be:
//
//   - the state model is controlled-with-fallback. `open` wins whenever it is
//     not undefined; `defaultOpen` seeds the internal state otherwise. In
//     controlled mode a click *emits* the next value and changes nothing, and
//     the internal state is synced from the prop only on a *change*, never on
//     mount - so an accordion mounted with open=false and defaultOpen=true
//     opens the moment `open` becomes undefined;
//   - every toggle emits `update:open` and then `openChange`, both with the
//     next boolean, once each. Redundant requests are not deduplicated: two
//     clicks on a controlled-closed accordion emit `true` twice;
//   - Enter and Space are handled on keydown with preventDefault. That is why a
//     keyboard toggle produces no native click in a browser, and why the Razor
//     controller has to do the same rather than rely on native activation;
//   - the content is under `v-if`. A closed accordion has no panel in the DOM,
//     and the trigger's aria-controls names an id no element carries. Every
//     open renders the default slot afresh;
//   - the transition is `<Transition :css="false">` with JavaScript hooks that
//     write inline height, opacity, overflow and transition, and clear them
//     after the theme's normal duration. Leaving delays removal by that same
//     duration. An entered panel keeps an empty style attribute behind;
//   - a disabled trigger carries the native `disabled` attribute and nothing
//     else - no aria-disabled, no modifier class - and disabling does not close
//     an open accordion;
//   - there is no keyboard behaviour beyond Enter and Space, no focus
//     management, no heading, and the region has no name beyond aria-labelledby.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h, nextTick, reactive } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VfAccordion from './VfAccordion.vue';

type AccordionProps = InstanceType<typeof VfAccordion>['$props'];

const ICON_MARKUP =
  '<span aria-hidden="true" class="vf-accordion__icon"><span class="vf-icon" aria-hidden="true" icon="chevronDown" size="var(--vf-icon-size-sm)"></span></span>';
const OPEN_ICON_MARKUP = ICON_MARKUP.replace(
  'class="vf-accordion__icon"',
  'class="vf-accordion__icon vf-accordion__icon--open"',
);

/**
 * Mounts with the real Transition. Vue Test Utils stubs `<Transition>` by
 * default, which is fine for state and ARIA but hides the whole animation
 * contract; the transition tests below opt out of the stub explicitly.
 */
function mountAccordion({
  props = {},
  attrs = {},
  slots = {},
  realTransition = false,
}: {
  props?: Partial<AccordionProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  realTransition?: boolean;
} = {}) {
  return mount(VfAccordion, {
    props: props as AccordionProps,
    attrs,
    slots: slots as never,
    ...(realTransition ? { global: { stubs: { transition: false } }, attachTo: document.body } : {}),
  });
}

async function ssrAccordion(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfAccordion, props, slots) });

  return await renderToString(app);
}

const trigger = (wrapper: ReturnType<typeof mountAccordion>) => wrapper.get('button');
const panel = (wrapper: ReturnType<typeof mountAccordion>) => wrapper.find('.vf-accordion__content');

afterEach(() => {
  vi.useRealTimers();
});

// ------------------------------------------------------------------ structure

describe('VfAccordion characterization: structure', () => {
  it('renders a section root holding the trigger and, when closed, nothing else', () => {
    const wrapper = mountAccordion({ props: { title: 'Details' }, slots: { default: 'Body' }, realTransition: true });

    expect(wrapper.element.tagName).toBe('SECTION');
    expect(wrapper.classes()).toEqual(['vf-accordion']);
    expect([...wrapper.element.children].map((child) => child.tagName.toLowerCase())).toEqual(['button']);
  });

  it('renders the panel as the second child of the root when open', () => {
    const wrapper = mountAccordion({
      props: { title: 'Details', defaultOpen: true },
      slots: { default: 'Body' },
      realTransition: true,
    });

    expect([...wrapper.element.children].map((child) => child.tagName.toLowerCase())).toEqual(['button', 'div']);
    expect(wrapper.element.children[1].className).toBe('vf-accordion__content');
  });

  it('renders exactly the historical closed markup, with the trigger before the icon and a v-if comment', () => {
    const wrapper = mountAccordion({ props: { title: 'Details' }, slots: { default: 'Body' }, realTransition: true });

    expect(wrapper.html({ raw: true })).toBe(
      '<section class="vf-accordion">' +
        '<button id="vf-accordion-trigger-v-0" aria-controls="vf-accordion-content-v-1" aria-expanded="false" class="vf-accordion__trigger" type="button">' +
        '<span>Details</span>' +
        ICON_MARKUP +
        '</button>' +
        '<!--v-if-->' +
        '</section>',
    );
  });

  it('renders exactly the historical open markup: region, inner wrapper, slot', () => {
    const wrapper = mountAccordion({
      props: { title: 'Details', defaultOpen: true },
      slots: { default: 'Body' },
      realTransition: true,
    });

    expect(wrapper.html({ raw: true })).toBe(
      '<section class="vf-accordion">' +
        '<button id="vf-accordion-trigger-v-0" aria-controls="vf-accordion-content-v-1" aria-expanded="true" class="vf-accordion__trigger" type="button">' +
        '<span>Details</span>' +
        OPEN_ICON_MARKUP +
        '</button>' +
        '<div id="vf-accordion-content-v-1" aria-labelledby="vf-accordion-trigger-v-0" class="vf-accordion__content" role="region">' +
        '<div class="vf-accordion__content-inner">Body</div>' +
        '</div>' +
        '</section>',
    );
  });

  it('renders the trigger as a native button of type button, never a div or a submit button', () => {
    const control = trigger(mountAccordion());

    expect(control.element.tagName).toBe('BUTTON');
    expect(control.attributes('type')).toBe('button');
    expect(control.attributes('role')).toBeUndefined();
    expect(control.attributes('tabindex')).toBeUndefined();
    expect(control.classes()).toEqual(['vf-accordion__trigger']);
  });

  it('renders exactly one trigger and no other focusable element of its own', () => {
    for (const props of [{}, { defaultOpen: true }, { disabled: true }, { disabled: true, defaultOpen: true }]) {
      const wrapper = mountAccordion({ props, slots: { default: 'Body' } });

      expect(wrapper.findAll('button')).toHaveLength(1);
      expect(wrapper.findAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(1);
      expect(wrapper.findAll('[role]').map((node) => node.attributes('role'))).toEqual(
        props.defaultOpen ? ['region'] : [],
      );
    }
  });

  it('wraps the slot in an inner div inside the region, and nothing else is in the region', () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true }, slots: { default: '<p>One</p><p>Two</p>' } });
    const region = panel(wrapper);

    expect([...region.element.children].map((child) => child.className)).toEqual(['vf-accordion__content-inner']);
    expect(region.get('.vf-accordion__content-inner').html({ raw: true })).toBe(
      '<div class="vf-accordion__content-inner"><p>One</p><p>Two</p></div>',
    );
  });

  it('renders the region with role=region and no tabindex, heading or accessible name of its own', () => {
    const region = panel(mountAccordion({ props: { defaultOpen: true }, slots: { default: 'Body' } }));

    expect(region.attributes('role')).toBe('region');
    expect(region.attributes('tabindex')).toBeUndefined();
    expect(region.attributes('aria-label')).toBeUndefined();
    expect(region.attributes('hidden')).toBeUndefined();
    expect(region.find('h1, h2, h3, h4, h5, h6').exists()).toBe(false);
  });

  it('is named VfAccordion', () => {
    expect(mountAccordion().vm.$options.name ?? (VfAccordion as { __name?: string }).__name).toBe('VfAccordion');
  });
});

// ------------------------------------------------------------ props and emits

describe('VfAccordion characterization: props, defaults and emits', () => {
  it('accepts exactly four props with the historical defaults', () => {
    const declared = (VfAccordion as unknown as { props: Record<string, { default?: unknown; type: unknown }> }).props;

    expect(Object.keys(declared).sort()).toEqual(['defaultOpen', 'disabled', 'open', 'title']);
    expect(declared.open.default).toBeUndefined();
    expect(declared.defaultOpen.default).toBe(false);
    expect(declared.title.default).toBeUndefined();
    expect(declared.disabled.default).toBe(false);
    expect(declared.open.type).toBe(Boolean);
    expect(declared.title.type).toBe(String);
  });

  it('declares exactly two emits, in the historical order', () => {
    expect((VfAccordion as unknown as { emits: string[] }).emits).toEqual(['update:open', 'openChange']);
  });

  it('does not set inheritAttrs, so consumer attributes fall through to the root', () => {
    expect((VfAccordion as unknown as { inheritAttrs?: boolean }).inheritAttrs).toBeUndefined();
  });
});

// ------------------------------------------------------------- initial state

describe('VfAccordion characterization: initial state', () => {
  it('is closed by default: aria-expanded=false, no panel, no icon modifier', () => {
    const wrapper = mountAccordion({ slots: { default: 'Body' } });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(panel(wrapper).exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Body');
    expect(wrapper.get('.vf-accordion__icon').classes()).toEqual(['vf-accordion__icon']);
  });

  it('defaultOpen opens it: aria-expanded=true, panel present, icon modifier set', () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true }, slots: { default: 'Body' } });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
    expect(panel(wrapper).exists()).toBe(true);
    expect(wrapper.text()).toContain('Body');
    expect(wrapper.get('.vf-accordion__icon').classes()).toEqual(['vf-accordion__icon', 'vf-accordion__icon--open']);
  });

  it('open=true opens it and open=false closes it regardless of defaultOpen', () => {
    expect(trigger(mountAccordion({ props: { open: true } })).attributes('aria-expanded')).toBe('true');
    expect(trigger(mountAccordion({ props: { open: true, defaultOpen: false } })).attributes('aria-expanded')).toBe(
      'true',
    );
    expect(trigger(mountAccordion({ props: { open: false, defaultOpen: true } })).attributes('aria-expanded')).toBe(
      'false',
    );
    expect(panel(mountAccordion({ props: { open: false, defaultOpen: true } })).exists()).toBe(false);
  });

  it('writes aria-expanded as the strings "true" and "false", never omits it', () => {
    expect(trigger(mountAccordion()).attributes('aria-expanded')).toBe('false');
    expect(trigger(mountAccordion({ props: { disabled: true } })).attributes('aria-expanded')).toBe('false');
    expect(trigger(mountAccordion({ props: { defaultOpen: true } })).attributes('aria-expanded')).toBe('true');
  });
});

// ------------------------------------------------------------------ ids / ARIA

describe('VfAccordion characterization: generated ids and relationships', () => {
  it('generates prefixed ids for the trigger and the content from Vue useId', () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true } });

    expect(trigger(wrapper).attributes('id')).toMatch(/^vf-accordion-trigger-v-/);
    expect(panel(wrapper).attributes('id')).toMatch(/^vf-accordion-content-v-/);
    expect(trigger(wrapper).attributes('id')).not.toBe(panel(wrapper).attributes('id'));
  });

  it('points aria-controls at the panel and aria-labelledby back at the trigger', () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true } });

    expect(trigger(wrapper).attributes('aria-controls')).toBe(panel(wrapper).attributes('id'));
    expect(panel(wrapper).attributes('aria-labelledby')).toBe(trigger(wrapper).attributes('id'));
  });

  it('the quirk: while closed, aria-controls names an id that no element carries', () => {
    const wrapper = mountAccordion({ attachTo: document.body } as never);
    const controls = trigger(wrapper).attributes('aria-controls');

    expect(controls).toMatch(/^vf-accordion-content-v-/);
    expect(document.getElementById(controls as string)).toBeNull();
    expect(wrapper.find(`#${controls}`).exists()).toBe(false);
  });

  it('keeps the same ids across a toggle, so the relationship is stable while the panel is recreated', async () => {
    const wrapper = mountAccordion({ slots: { default: 'Body' } });
    const before = trigger(wrapper).attributes('aria-controls');

    await trigger(wrapper).trigger('click');
    expect(panel(wrapper).attributes('id')).toBe(before);
    expect(trigger(wrapper).attributes('aria-controls')).toBe(before);
    expect(trigger(wrapper).attributes('id')).toBe(panel(wrapper).attributes('aria-labelledby'));
  });

  it('gives sibling accordions distinct ids and local relationships', () => {
    // A plain render function rather than a second component in this file.
    const two = mount({
      render: () =>
        h('div', [
          h(VfAccordion, { title: 'A', defaultOpen: true }),
          h(VfAccordion, { title: 'B', defaultOpen: true }),
        ]),
    });
    const triggers = two.findAll('button');
    const panels = two.findAll('.vf-accordion__content');

    expect(new Set([...triggers, ...panels].map((node) => node.attributes('id'))).size).toBe(4);
    expect(triggers[0].attributes('aria-controls')).toBe(panels[0].attributes('id'));
    expect(triggers[1].attributes('aria-controls')).toBe(panels[1].attributes('id'));
    expect(panels[0].attributes('aria-labelledby')).toBe(triggers[0].attributes('id'));
    expect(panels[1].attributes('aria-labelledby')).toBe(triggers[1].attributes('id'));
  });

  it('writes no aria-disabled, aria-haspopup, aria-pressed or aria-label of its own on the trigger', () => {
    for (const props of [{}, { disabled: true }, { defaultOpen: true, title: 'T' }]) {
      const control = trigger(mountAccordion({ props }));

      for (const name of ['aria-disabled', 'aria-haspopup', 'aria-pressed', 'aria-label', 'aria-labelledby']) {
        expect(control.attributes(name), name).toBeUndefined();
      }
    }
  });
});

// ------------------------------------------------------------- title & slots

describe('VfAccordion characterization: title, trigger slot and default slot', () => {
  it('renders the title in a bare span inside the trigger', () => {
    expect(trigger(mountAccordion({ props: { title: 'Billing' } })).element.children[0].outerHTML).toBe(
      '<span>Billing</span>',
    );
  });

  it('the quirk: renders an empty span when there is no title at all, and for an empty title', () => {
    expect(trigger(mountAccordion()).element.children[0].outerHTML).toBe('<span></span>');
    expect(trigger(mountAccordion({ props: { title: '' } })).element.children[0].outerHTML).toBe('<span></span>');
  });

  it('lets the trigger slot replace the title span and hands it the open state', async () => {
    const wrapper = mountAccordion({
      props: { title: 'Ignored' },
      slots: { trigger: ({ open }: { open: boolean }) => h('em', `T:${open}`) },
    });

    expect(trigger(wrapper).element.children[0].outerHTML).toBe('<em>T:false</em>');
    expect(wrapper.text()).not.toContain('Ignored');

    await trigger(wrapper).trigger('click');
    expect(trigger(wrapper).element.children[0].outerHTML).toBe('<em>T:true</em>');
  });

  it('keeps the icon after the trigger slot, as the last child of the button', () => {
    const control = trigger(mountAccordion({ slots: { trigger: () => h('em', 'T') } }));
    const children = [...control.element.children];

    expect(children).toHaveLength(2);
    expect(children[1].className).toBe('vf-accordion__icon');
  });

  it('hands the default slot the open state, which is always true when it renders', () => {
    const wrapper = mountAccordion({
      props: { defaultOpen: true },
      slots: { default: ({ open }: { open: boolean }) => `B:${open}` },
    });

    expect(wrapper.get('.vf-accordion__content-inner').text()).toBe('B:true');
  });

  it('renders an empty inner wrapper when there is no default slot', () => {
    expect(panel(mountAccordion({ props: { defaultOpen: true } })).html({ raw: true })).toBe(
      '<div id="vf-accordion-content-v-1" aria-labelledby="vf-accordion-trigger-v-0" class="vf-accordion__content" role="region"><div class="vf-accordion__content-inner"></div></div>',
    );
  });

  it('leaves consumer content in the default slot exactly as written, controls included', () => {
    const wrapper = mountAccordion({
      props: { defaultOpen: true },
      slots: { default: '<p>Text</p><button type="button">Retry</button>' },
    });

    expect(wrapper.get('.vf-accordion__content-inner').html({ raw: true })).toBe(
      '<div class="vf-accordion__content-inner"><p>Text</p><button type="button">Retry</button></div>',
    );
    // Two buttons in total: the component's trigger and the consumer's.
    expect(wrapper.findAll('button')).toHaveLength(2);
    expect(wrapper.findAll('button')[0].classes()).toContain('vf-accordion__trigger');
    expect(wrapper.findAll('button')[1].classes()).toEqual([]);
  });

  it('ignores a slot it does not declare', () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true }, slots: { footer: 'Nope' } });

    expect(wrapper.text()).not.toContain('Nope');
  });
});

// ------------------------------------------------------------------- icon

describe('VfAccordion characterization: icon', () => {
  it('renders one chevron-down glyph at the small size inside an aria-hidden span', () => {
    const wrapper = mountAccordion();
    const icons = wrapper.findAll('.vf-accordion__icon');

    expect(icons).toHaveLength(1);
    expect(icons[0].attributes('aria-hidden')).toBe('true');
    expect(icons[0].element.children).toHaveLength(1);
    expect(icons[0].element.children[0].getAttribute('icon')).toBe('chevronDown');
    expect(icons[0].element.children[0].getAttribute('size')).toBe('var(--vf-icon-size-sm)');
  });

  it('adds the open modifier on the icon span and only there, and drops it on close', async () => {
    const wrapper = mountAccordion();

    await trigger(wrapper).trigger('click');
    expect(wrapper.get('.vf-accordion__icon').classes()).toEqual(['vf-accordion__icon', 'vf-accordion__icon--open']);
    expect(wrapper.classes()).toEqual(['vf-accordion']);
    expect(trigger(wrapper).classes()).toEqual(['vf-accordion__trigger']);

    await trigger(wrapper).trigger('click');
    expect(wrapper.get('.vf-accordion__icon').classes()).toEqual(['vf-accordion__icon']);
  });

  it('keeps the same glyph in both states: the rotation is CSS, not a second icon', async () => {
    const wrapper = mountAccordion();
    const glyph = () => wrapper.get('.vf-accordion__icon').element.children[0].getAttribute('icon');

    expect(glyph()).toBe('chevronDown');
    await trigger(wrapper).trigger('click');
    expect(glyph()).toBe('chevronDown');
  });
});

// ---------------------------------------------------------- click & keyboard

describe('VfAccordion characterization: click and keyboard', () => {
  it('a click on the trigger toggles open, and a second click toggles closed', async () => {
    const wrapper = mountAccordion({ slots: { default: 'Body' } });

    await trigger(wrapper).trigger('click');
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
    expect(panel(wrapper).exists()).toBe(true);

    await trigger(wrapper).trigger('click');
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(panel(wrapper).exists()).toBe(false);
  });

  it('Enter on keydown toggles and prevents the default, so no native click follows', async () => {
    const wrapper = mountAccordion();
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true });

    trigger(wrapper).element.dispatchEvent(event);
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
  });

  it('Space on keydown toggles and prevents the default', async () => {
    const wrapper = mountAccordion();
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true });

    trigger(wrapper).element.dispatchEvent(event);
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
  });

  it('handles Enter and Space on keydown only; keyup does nothing', async () => {
    const wrapper = mountAccordion();

    await trigger(wrapper).trigger('keyup', { key: 'Enter' });
    await trigger(wrapper).trigger('keyup', { key: ' ' });
    await trigger(wrapper).trigger('keypress', { key: 'Enter' });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('has no arrow, Home, End or Escape behaviour, and does not prevent those keys', async () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true } });

    for (const key of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape', 'Tab', 'a']) {
      const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true });
      trigger(wrapper).element.dispatchEvent(event);
      await nextTick();

      expect(event.defaultPrevented, key).toBe(false);
      expect(trigger(wrapper).attributes('aria-expanded'), key).toBe('true');
    }
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('matches the key strings exactly: "Spacebar" and "enter" are not activation keys', async () => {
    const wrapper = mountAccordion();

    await trigger(wrapper).trigger('keydown', { key: 'Spacebar' });
    await trigger(wrapper).trigger('keydown', { key: 'enter' });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
  });

  it('listens on the trigger, not the root: a click on the panel content does not toggle', async () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true }, slots: { default: '<p>Text</p>' } });

    await wrapper.get('.vf-accordion__content-inner p').trigger('click');
    await wrapper.trigger('click');

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('a nested accordion toggles itself only; its click bubbling through the outer panel changes nothing', async () => {
    const outer = mount(VfAccordion, {
      props: { title: 'Outer', defaultOpen: true },
      slots: { default: () => h(VfAccordion, { title: 'Inner' }, { default: () => 'Deep' }) },
    });
    const [outerTrigger, innerTrigger] = outer.findAll('button');

    await innerTrigger.trigger('click');

    expect(innerTrigger.attributes('aria-expanded')).toBe('true');
    expect(outerTrigger.attributes('aria-expanded')).toBe('true');
    expect(outer.emitted('update:open')).toBeUndefined();
    expect(outer.text()).toContain('Deep');
  });
});

// ------------------------------------------------------------------- events

describe('VfAccordion characterization: events', () => {
  it('emits update:open then openChange with the next value, once each per toggle', async () => {
    const wrapper = mountAccordion();

    await trigger(wrapper).trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
    expect(wrapper.emitted('openChange')).toEqual([[true]]);

    await trigger(wrapper).trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[true], [false]]);
    expect(wrapper.emitted('openChange')).toEqual([[true], [false]]);
  });

  it('emits update:open strictly before openChange', async () => {
    const order: string[] = [];
    const wrapper = mount(VfAccordion, {
      attrs: {
        'onUpdate:open': () => order.push('update:open'),
        onOpenChange: () => order.push('openChange'),
      },
    });

    await trigger(wrapper).trigger('click');
    expect(order).toEqual(['update:open', 'openChange']);
  });

  it('emits the same pair for a keyboard toggle as for a pointer toggle', async () => {
    const wrapper = mountAccordion();

    await trigger(wrapper).trigger('keydown', { key: 'Enter' });
    await trigger(wrapper).trigger('keydown', { key: ' ' });

    expect(wrapper.emitted('update:open')).toEqual([[true], [false]]);
    expect(wrapper.emitted('openChange')).toEqual([[true], [false]]);
  });

  it('emits nothing on mount, and nothing when props change', async () => {
    const wrapper = mountAccordion({ props: { open: false } });
    await wrapper.setProps({ open: true });
    await wrapper.setProps({ open: false });

    expect(wrapper.emitted('update:open')).toBeUndefined();
    expect(wrapper.emitted('openChange')).toBeUndefined();
  });

  it('emits exactly the two declared events and no others of its own', async () => {
    const wrapper = mountAccordion();
    await trigger(wrapper).trigger('click');

    // `click` is the native event Test Utils records on the root listener
    // proxy; the component itself declares only the two.
    expect(
      Object.keys(wrapper.emitted())
        .filter((name) => name !== 'click')
        .sort(),
    ).toEqual(['openChange', 'update:open']);
  });
});

// ------------------------------------------------------------ controlled mode

describe('VfAccordion characterization: controlled state', () => {
  it('in controlled mode a click emits the request and changes nothing', async () => {
    const wrapper = mountAccordion({ props: { open: false }, slots: { default: 'Body' } });

    await trigger(wrapper).trigger('click');

    expect(wrapper.emitted('update:open')).toEqual([[true]]);
    expect(wrapper.emitted('openChange')).toEqual([[true]]);
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(panel(wrapper).exists()).toBe(false);
  });

  it('the quirk: redundant requests are not deduplicated - two clicks on a controlled-closed accordion emit true twice', async () => {
    const wrapper = mountAccordion({ props: { open: false } });

    await trigger(wrapper).trigger('click');
    await trigger(wrapper).trigger('click');

    expect(wrapper.emitted('update:open')).toEqual([[true], [true]]);
  });

  it('follows the open prop when the consumer updates it', async () => {
    const wrapper = mountAccordion({ props: { open: false }, slots: { default: 'Body' } });

    await wrapper.setProps({ open: true });
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
    expect(panel(wrapper).exists()).toBe(true);

    await wrapper.setProps({ open: false });
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(panel(wrapper).exists()).toBe(false);
  });

  it('a v-model consumer round-trips: the emitted value written back opens it', async () => {
    const state = reactive({ open: false });
    const wrapper = mount({
      render: () => h(VfAccordion, { open: state.open, 'onUpdate:open': (value: boolean) => (state.open = value) }),
    });

    await wrapper.get('button').trigger('click');
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true');
    await wrapper.get('button').trigger('click');
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
  });

  it('the quirk: the internal state is synced only when the open prop changes, never on mount', async () => {
    // open=false at mount with defaultOpen=true: the internal state is seeded
    // true and the mount value is never written into it. Releasing control
    // therefore opens the accordion.
    const wrapper = mountAccordion({ props: { open: false, defaultOpen: true } });
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');

    await wrapper.setProps({ open: undefined });
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
  });

  it('a change of the open prop is synced, so releasing control after a change keeps the last value', async () => {
    const wrapper = mountAccordion({ props: { open: false, defaultOpen: true } });

    await wrapper.setProps({ open: true });
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: undefined });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
  });

  it('switching from uncontrolled to controlled takes the prop value at once', async () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true } });
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');

    await wrapper.setProps({ open: false });
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
  });

  it('defaultOpen is read once: changing it after mount does nothing', async () => {
    const wrapper = mountAccordion({ props: { defaultOpen: false } });

    await wrapper.setProps({ defaultOpen: true });
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
  });
});

// ------------------------------------------------------------------ disabled

describe('VfAccordion characterization: disabled', () => {
  it('writes the native disabled attribute on the trigger and nothing else', () => {
    const wrapper = mountAccordion({ props: { disabled: true } });

    expect(trigger(wrapper).attributes('disabled')).toBe('');
    expect(trigger(wrapper).attributes('aria-disabled')).toBeUndefined();
    expect(trigger(wrapper).classes()).toEqual(['vf-accordion__trigger']);
    expect(wrapper.classes()).toEqual(['vf-accordion']);
    expect(wrapper.attributes('aria-disabled')).toBeUndefined();
  });

  it('does not write disabled at all when enabled, rather than disabled="false"', () => {
    expect(trigger(mountAccordion()).attributes('disabled')).toBeUndefined();
    expect(trigger(mountAccordion({ props: { disabled: false } })).attributes('disabled')).toBeUndefined();
  });

  it('a disabled trigger neither toggles nor emits on click, Enter or Space', async () => {
    const wrapper = mountAccordion({ props: { disabled: true } });

    await trigger(wrapper).trigger('click');
    await trigger(wrapper).trigger('keydown', { key: 'Enter' });
    await trigger(wrapper).trigger('keydown', { key: ' ' });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(wrapper.emitted('update:open')).toBeUndefined();
    expect(wrapper.emitted('openChange')).toBeUndefined();
  });

  it('the quirk: Enter and Space are still default-prevented while disabled - the guard is inside toggle', async () => {
    const wrapper = mountAccordion({ props: { disabled: true } });
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true });

    trigger(wrapper).element.dispatchEvent(event);
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('disabling does not close an open accordion: the panel stays and aria-expanded stays true', () => {
    const wrapper = mountAccordion({ props: { disabled: true, defaultOpen: true }, slots: { default: 'Body' } });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
    expect(panel(wrapper).exists()).toBe(true);
    expect(trigger(wrapper).attributes('disabled')).toBe('');
  });

  it('re-enabling makes the same trigger operable again', async () => {
    const wrapper = mountAccordion({ props: { disabled: true } });
    await wrapper.setProps({ disabled: false });

    await trigger(wrapper).trigger('click');
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
  });
});

// ------------------------------------------------------------------- focus

describe('VfAccordion characterization: focus', () => {
  it('never moves focus: the trigger keeps focus through open and close, and the panel is not focusable', async () => {
    const wrapper = mountAccordion({ slots: { default: 'Body' }, realTransition: true });
    const control = trigger(wrapper).element as HTMLButtonElement;

    control.focus();
    expect(document.activeElement).toBe(control);

    await trigger(wrapper).trigger('click');
    expect(document.activeElement).toBe(control);
    expect(panel(wrapper).attributes('tabindex')).toBeUndefined();

    await trigger(wrapper).trigger('click');
    expect(document.activeElement).toBe(control);
    wrapper.unmount();
  });

  it('does not focus anything on mount, open or not', () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true }, realTransition: true });

    expect(document.activeElement).toBe(document.body);
    wrapper.unmount();
  });
});

// --------------------------------------------------------- consumer attributes

describe('VfAccordion characterization: consumer attributes', () => {
  it('appends a consumer class to the root after the canonical one, never replacing it', () => {
    expect(mountAccordion({ attrs: { class: 'mine' } }).classes()).toEqual(['vf-accordion', 'mine']);
  });

  it('puts id, style, role, data-* and aria-* attributes on the root section, not on the trigger', () => {
    const wrapper = mountAccordion({
      props: { defaultOpen: true },
      attrs: { id: 'faq', style: 'margin: 4px', role: 'group', 'data-testid': 'acc', 'aria-label': 'FAQ' },
    });

    expect(wrapper.attributes('id')).toBe('faq');
    expect(wrapper.attributes('style')).toBe('margin: 4px;');
    expect(wrapper.attributes('role')).toBe('group');
    expect(wrapper.attributes('data-testid')).toBe('acc');
    expect(wrapper.attributes('aria-label')).toBe('FAQ');

    for (const name of ['style', 'role', 'data-testid', 'aria-label']) {
      expect(trigger(wrapper).attributes(name), name).toBeUndefined();
    }
    for (const name of ['style', 'data-testid', 'aria-label']) {
      expect(panel(wrapper).attributes(name), name).toBeUndefined();
    }
    // The panel keeps its own role; the consumer's lands on the root only.
    expect(panel(wrapper).attributes('role')).toBe('region');
    expect(trigger(wrapper).attributes('id')).toMatch(/^vf-accordion-trigger-/);
  });

  it('a consumer id on the root does not change the generated trigger and panel ids', () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true }, attrs: { id: 'faq' } });

    expect(trigger(wrapper).attributes('id')).toBe('vf-accordion-trigger-v-0');
    expect(panel(wrapper).attributes('id')).toBe('vf-accordion-content-v-1');
  });

  it('a consumer title attribute is the prop, not a tooltip: it never reaches the root as an attribute', () => {
    const wrapper = mountAccordion({ attrs: { title: 'Billing' } });

    expect(wrapper.attributes('title')).toBeUndefined();
    expect(trigger(wrapper).element.children[0].outerHTML).toBe('<span>Billing</span>');
  });

  it('a consumer aria-expanded lands on the root and leaves the trigger state alone', () => {
    const wrapper = mountAccordion({ attrs: { 'aria-expanded': 'true' } });

    expect(wrapper.attributes('aria-expanded')).toBe('true');
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
  });

  it('native listeners on the root receive bubbled clicks from the trigger', async () => {
    const onClick = vi.fn();
    const wrapper = mount(VfAccordion, { attrs: { onClick } });

    await trigger(wrapper).trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ------------------------------------------------------- retention & identity

describe('VfAccordion characterization: DOM retention', () => {
  it('destroys the panel on close and recreates it on open - v-if, not v-show', async () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true }, slots: { default: 'Body' } });
    const first = panel(wrapper).element;

    await trigger(wrapper).trigger('click');
    expect(panel(wrapper).exists()).toBe(false);
    expect(first.isConnected).toBe(false);

    await trigger(wrapper).trigger('click');
    expect(panel(wrapper).exists()).toBe(true);
    expect(panel(wrapper).element).not.toBe(first);
  });

  it('renders the default slot afresh on every open, so consumer state inside it does not survive a close', async () => {
    let renders = 0;
    const wrapper = mountAccordion({
      slots: {
        default: () => {
          renders += 1;
          return h('input', { value: '' });
        },
      },
    });

    await trigger(wrapper).trigger('click');
    const input = wrapper.get('input').element as HTMLInputElement;
    input.value = 'typed';

    await trigger(wrapper).trigger('click');
    await trigger(wrapper).trigger('click');

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('');
    expect(renders).toBeGreaterThanOrEqual(2);
  });

  it('keeps the trigger as the same node across toggles', async () => {
    const wrapper = mountAccordion();
    const control = trigger(wrapper).element;

    await trigger(wrapper).trigger('click');
    await trigger(wrapper).trigger('click');

    expect(trigger(wrapper).element).toBe(control);
  });

  it('does not use hidden, display:none or a class to hide a closed panel: there is no panel', async () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true }, slots: { default: 'Body' } });

    await trigger(wrapper).trigger('click');

    expect(wrapper.find('[hidden]').exists()).toBe(false);
    expect(wrapper.find('.vf-accordion__content').exists()).toBe(false);
    expect(wrapper.html()).not.toContain('Body');
  });
});

// ---------------------------------------------------------------- transition

describe('VfAccordion characterization: transition', () => {
  const accordionTransition =
    'height var(--vf-motion-duration-normal) var(--vf-motion-ease-standard), ' +
    'opacity var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)';

  it('enters through inline styles: collapsed first, then measured height and full opacity on the next frame', async () => {
    vi.useFakeTimers();
    const wrapper = mountAccordion({ slots: { default: 'Body' }, realTransition: true });

    await trigger(wrapper).trigger('click');
    const region = panel(wrapper).element as HTMLElement;

    expect(region.style.height).toBe('0px');
    expect(region.style.opacity).toBe('0');
    expect(region.style.overflow).toBe('hidden');
    expect(region.style.transition).toBe(accordionTransition);

    vi.advanceTimersByTime(16);
    // jsdom measures no layout, so the "content height" is 0px here; what is
    // pinned is that the frame callback wrote a pixel height and the opacity.
    expect(region.style.height).toMatch(/^\d+px$/);
    expect(region.style.opacity).toBe('1');

    wrapper.unmount();
  });

  it('clears every inline declaration after the normal motion duration and leaves an empty style attribute', async () => {
    vi.useFakeTimers();
    const wrapper = mountAccordion({ slots: { default: 'Body' }, realTransition: true });

    await trigger(wrapper).trigger('click');
    // The frame callback and the done timer are both scheduled at the click,
    // so the whole enter takes exactly the normal duration from that moment.
    vi.advanceTimersByTime(319);
    await nextTick();
    expect((panel(wrapper).element as HTMLElement).style.opacity).toBe('1');
    expect((panel(wrapper).element as HTMLElement).style.transition).toBe(accordionTransition);

    vi.advanceTimersByTime(1);
    await nextTick();
    const region = panel(wrapper).element as HTMLElement;

    expect(region.style.height).toBe('');
    expect(region.style.opacity).toBe('');
    expect(region.style.overflow).toBe('');
    expect(region.style.transition).toBe('');
    // The quirk: the attribute itself survives, empty.
    expect(region.getAttribute('style')).toBe('');

    wrapper.unmount();
  });

  it('leaves through inline styles and delays removal by the normal motion duration', async () => {
    vi.useFakeTimers();
    const wrapper = mountAccordion({ props: { defaultOpen: true }, slots: { default: 'Body' }, realTransition: true });
    const region = panel(wrapper).element as HTMLElement;

    await trigger(wrapper).trigger('click');

    // aria-expanded has already flipped while the panel is still leaving.
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(region.isConnected).toBe(true);
    expect(region.style.height).toBe('0px');
    expect(region.style.opacity).toBe('0');
    expect(region.style.overflow).toBe('hidden');
    expect(region.style.transition).toBe(accordionTransition);

    vi.advanceTimersByTime(319);
    await nextTick();
    expect(region.isConnected).toBe(true);

    vi.advanceTimersByTime(1);
    await nextTick();
    expect(region.isConnected).toBe(false);
    expect(panel(wrapper).exists()).toBe(false);

    wrapper.unmount();
  });

  it('does not animate the initial render: an accordion mounted open carries no inline style', () => {
    const wrapper = mountAccordion({ props: { defaultOpen: true }, slots: { default: 'Body' }, realTransition: true });

    expect(panel(wrapper).attributes('style')).toBeUndefined();
    wrapper.unmount();
  });

  it('drives the transition itself: no CSS enter/leave classes are ever applied', async () => {
    vi.useFakeTimers();
    const wrapper = mountAccordion({ slots: { default: 'Body' }, realTransition: true });

    await trigger(wrapper).trigger('click');
    expect(panel(wrapper).classes()).toEqual(['vf-accordion__content']);
    vi.advanceTimersByTime(16);
    expect(panel(wrapper).classes()).toEqual(['vf-accordion__content']);

    wrapper.unmount();
  });

  it('writes the transition only on the region, never on the inner wrapper or the trigger', async () => {
    vi.useFakeTimers();
    const wrapper = mountAccordion({ slots: { default: 'Body' }, realTransition: true });

    await trigger(wrapper).trigger('click');

    expect(wrapper.get('.vf-accordion__content-inner').attributes('style')).toBeUndefined();
    expect(trigger(wrapper).attributes('style')).toBeUndefined();
    wrapper.unmount();
  });
});

// -------------------------------------------------------------------- SSR

describe('VfAccordion characterization: server rendering', () => {
  it('renders the closed state on the server with a v-if placeholder and no panel', async () => {
    expect(await ssrAccordion({ title: 'S' }, { default: () => 'Body' })).toBe(
      '<section class="vf-accordion">' +
        '<button id="vf-accordion-trigger-v-0" aria-controls="vf-accordion-content-v-1" aria-expanded="false" class="vf-accordion__trigger" type="button">' +
        '<!--[--><span>S</span><!--]-->' +
        ICON_MARKUP +
        '</button>' +
        '<!--v-if-->' +
        '</section>',
    );
  });

  it('renders the open state on the server with the region and no inline style', async () => {
    expect(await ssrAccordion({ title: 'S', defaultOpen: true }, { default: () => 'Body' })).toBe(
      '<section class="vf-accordion">' +
        '<button id="vf-accordion-trigger-v-0" aria-controls="vf-accordion-content-v-1" aria-expanded="true" class="vf-accordion__trigger" type="button">' +
        '<!--[--><span>S</span><!--]-->' +
        OPEN_ICON_MARKUP +
        '</button>' +
        '<div id="vf-accordion-content-v-1" aria-labelledby="vf-accordion-trigger-v-0" class="vf-accordion__content" role="region">' +
        '<div class="vf-accordion__content-inner"><!--[-->Body<!--]--></div>' +
        '</div>' +
        '</section>',
    );
  });

  it('renders the disabled attribute bare on the server and consumer attributes on the root', async () => {
    const html = await ssrAccordion({ title: 'S', disabled: true, class: 'mine', id: 'faq', style: { color: 'red' } });

    expect(html.startsWith('<section class="vf-accordion mine" id="faq" style="color:red;">')).toBe(true);
    expect(html).toContain('aria-expanded="false" disabled class="vf-accordion__trigger" type="button"');
  });

  it('the controlled prop decides the server state exactly as it decides the client state', async () => {
    expect(await ssrAccordion({ open: true })).toContain('aria-expanded="true"');
    expect(await ssrAccordion({ open: false, defaultOpen: true })).toContain('aria-expanded="false"');
    expect(await ssrAccordion({ open: false, defaultOpen: true })).not.toContain('vf-accordion__content');
  });
});
