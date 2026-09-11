// Characterization of the historical VfAlert at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The M19 component, and the first migrated component that writes a semantic
// role of its own. The milestone was planned around a second first - a
// component-owned dismiss control - and the reference does not have one. That
// is the most important thing this file pins, and it pins it as a measurement
// rather than an assumption:
//
//   - there is no `dismissible`, `closable` or `dismissable` prop, and no prop
//     of any other name that makes a control appear;
//   - the component emits nothing. `defineEmits` is not called, and no click
//     handler exists anywhere in the template;
//   - no configuration of props and slots renders a focusable element the
//     component owns. Whatever a consumer puts in a slot is the consumer's.
//
// A migration that "completed" the alert with the close button every other
// design system has would be a product change, and every assertion in the
// "what an alert does not have" block below is what refuses it.
//
// What the reference does have, and what is pinned as-is:
//
//   - `role="alert"` on the section, written before the forwarded attrs, so a
//     consumer role replaces it. Nothing else about accessibility is written:
//     no aria-live, no aria-atomic, no accessible name. The live-region
//     semantics an alert has are the ones the role implies;
//   - `tone` is paint plus glyph choice. It selects a modifier class - except
//     `primary`, the default, which emits none - and it selects the fallback
//     icon. It changes nothing about the role or any other attribute. The
//     `neutral` tone emits `vf-alert--neutral`, a class no stylesheet defines,
//     so a neutral alert looks exactly like a primary one and differs only in
//     its class list;
//   - the icon container is `aria-hidden` whatever it holds, including a
//     consumer icon slot. `hideIcon` removes the container entirely, consumer
//     slot and all;
//   - the title paragraph is keyed on `title || $slots.title`, and its content
//     is slot fallback, so a title slot that renders nothing brings the prop
//     text back - and with an empty prop, an empty paragraph;
//   - the body wrapper is unconditional. An alert with no content still renders
//     an empty `div.vf-alert__body`.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

// The icons package is stubbed here with the *real* name mapping rather than
// with the package-wide setup stub, which knows one glyph (chevronDown) and
// would resolve every alert icon to undefined. `icons.checkCircle` in the real
// package is the string 'check-circle', and the tone-to-glyph rule is half of
// what `tone` does, so the names have to be the real ones for this file to pin
// it. The stub component records what the alert passed it - the glyph name and
// the size - as data attributes, so a DOM assertion reads what the component
// decided rather than what a stub happened to write.
vi.mock('@codemonster-ru/vueforge-icons', () => {
  const toKebabCase = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

  return {
    VueIconify: {
      name: 'VueIconifyStub',
      props: { icon: String, size: String },
      template: '<span class="vf-icon" :data-icon="icon" :data-size="size" />',
    },
    icons: new Proxy({}, { get: (_target, property) => toKebabCase(String(property)) }),
  };
});

import VfAlert from './VfAlert.vue';

type AlertProps = InstanceType<typeof VfAlert>['$props'];

/** Every tone the public union allows, in declaration order. */
const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] as const;

/** What each tone paints and which glyph it falls back to. The rule under test, stated as data. */
const TONE_CONTRACT: Record<(typeof TONES)[number], { modifier: string | null; icon: string }> = {
  neutral: { modifier: 'vf-alert--neutral', icon: 'info-circle' },
  primary: { modifier: null, icon: 'info-circle' },
  success: { modifier: 'vf-alert--success', icon: 'check-circle' },
  info: { modifier: 'vf-alert--info', icon: 'info-circle' },
  warn: { modifier: 'vf-alert--warn', icon: 'alert-circle' },
  help: { modifier: 'vf-alert--help', icon: 'question-circle' },
  danger: { modifier: 'vf-alert--danger', icon: 'x-circle' },
  contrast: { modifier: 'vf-alert--contrast', icon: 'info-circle' },
};

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]';

function mountAlert({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<AlertProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfAlert, { props: props as AlertProps, attrs, slots: slots as never });
}

async function ssrAlert(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfAlert, props, slots as never) });

  return await renderToString(app);
}

/** The child element tags of the alert root, in document order. */
function childrenOf(wrapper: ReturnType<typeof mountAlert>): string[] {
  return [...wrapper.element.children].map((child) => child.tagName.toLowerCase());
}

/** The glyph name the alert handed the icon component, read off the stub. */
function glyphOf(wrapper: ReturnType<typeof mountAlert>): string | undefined {
  return wrapper.find('.vf-alert__icon .vf-icon').attributes('data-icon');
}

describe('VfAlert characterization: structure', () => {
  it('renders a section root', () => {
    expect(mountAlert().element.tagName).toBe('SECTION');
  });

  it('renders the icon container first and the content wrapper second', () => {
    expect(childrenOf(mountAlert())).toEqual(['div', 'div']);
    expect(mountAlert().element.children[0].className).toBe('vf-alert__icon');
    expect(mountAlert().element.children[1].className).toBe('vf-alert__content');
  });

  it('renders the title paragraph above the body inside the content wrapper', () => {
    const content = mountAlert({ props: { title: 'Saved' }, slots: { default: 'Body' } }).find('.vf-alert__content');

    expect([...content.element.children].map((child) => child.className)).toEqual([
      'vf-alert__title',
      'vf-alert__body',
    ]);
    expect(content.element.children[0].tagName).toBe('P');
    expect(content.element.children[1].tagName).toBe('DIV');
  });

  it('always renders the body wrapper, even with nothing to put in it', () => {
    // Not conditional on the slot. An empty alert still has an empty classed
    // div, which is the opposite of what VfPanel does with its default slot.
    const body = mountAlert().find('.vf-alert__body');

    expect(body.exists()).toBe(true);
    expect(body.element.children.length).toBe(0);
    expect(body.text()).toBe('');
  });
});

describe('VfAlert characterization: what an alert does not have', () => {
  // The block M19 was planned around. Every assertion here is about an absence,
  // and each is a measurement of the reference rather than an omission from
  // this file.

  it('declares exactly four props, none of which is a dismiss switch', () => {
    const props = mountAlert().props() as Record<string, unknown>;

    expect(Object.keys(props).sort()).toEqual(['hideIcon', 'icon', 'title', 'tone']);
    for (const name of ['dismissible', 'dismissable', 'closable', 'closeable', 'onDismiss', 'onClose']) {
      expect(props).not.toHaveProperty(name);
    }
  });

  it('emits no events', () => {
    // No `defineEmits` and nothing to click. A consumer listening for `dismiss`
    // or `close` hears nothing, and always did.
    const alert = mountAlert({ props: { title: 'Saved' }, slots: { default: 'Body' } });

    expect(Object.keys(alert.emitted())).toEqual([]);
    expect((alert.vm.$options as { emits?: unknown }).emits).toBeUndefined();
  });

  it('renders no interactive element of its own in any configuration', () => {
    // Every tone, with and without the icon, with and without a title, with
    // every slot filled by static content. Nothing the component itself
    // renders is focusable. The consumer half of this proof is below.
    for (const tone of TONES) {
      for (const hideIcon of [false, true]) {
        for (const title of [undefined, 'Saved']) {
          const alert = mountAlert({
            props: { tone, hideIcon, title },
            slots: { default: 'Body', title: 'Custom title', icon: '<i>i</i>' },
          });

          expect(alert.findAll(FOCUSABLE)).toHaveLength(0);
          expect(alert.findAll('button')).toHaveLength(0);
          expect(alert.findAll('[role]').filter((node) => node.element !== alert.element)).toHaveLength(0);
        }
      }
    }
  });

  it('does not grow a dismiss control for a consumer attribute that sounds like one', () => {
    // `dismissible` is not a prop, so it falls through as an attribute onto the
    // section - and that is all it does.
    const alert = mountAlert({ attrs: { dismissible: 'true', closable: '' } });

    expect(alert.attributes('dismissible')).toBe('true');
    expect(alert.findAll(FOCUSABLE)).toHaveLength(0);
  });

  it('writes no live-region attributes of its own', () => {
    // The role implies them. Writing aria-live="polite" on top would change
    // how an alert is announced, and writing "assertive" would be redundant;
    // the reference writes neither.
    const alert = mountAlert({ props: { tone: 'danger', title: 'Failed' } });

    expect(alert.attributes('aria-live')).toBeUndefined();
    expect(alert.attributes('aria-atomic')).toBeUndefined();
    expect(alert.attributes('aria-label')).toBeUndefined();
    expect(alert.attributes('aria-labelledby')).toBeUndefined();
    expect(alert.attributes('aria-describedby')).toBeUndefined();
  });

  it('gives the title no id for anything to point at', () => {
    expect(
      mountAlert({ props: { title: 'Saved' } })
        .find('.vf-alert__title')
        .attributes('id'),
    ).toBeUndefined();
  });
});

describe('VfAlert characterization: props and defaults', () => {
  it('defaults tone to primary, hideIcon to false, and title and icon to undefined', () => {
    const alert = mountAlert();

    expect(alert.props('tone')).toBe('primary');
    expect(alert.props('hideIcon')).toBe(false);
    expect(alert.props('title')).toBeUndefined();
    expect(alert.props('icon')).toBeUndefined();
  });

  it('accepts every feedback tone', () => {
    for (const tone of TONES) {
      expect(mountAlert({ props: { tone } }).props('tone')).toBe(tone);
    }
  });
});

describe('VfAlert characterization: tone is paint and glyph choice', () => {
  it.each(TONES)('%s emits the expected modifier and falls back to the expected glyph', (tone) => {
    const alert = mountAlert({ props: { tone } });
    const { modifier, icon } = TONE_CONTRACT[tone];

    expect(alert.classes()).toEqual(modifier === null ? ['vf-alert'] : ['vf-alert', modifier]);
    expect(glyphOf(alert)).toBe(icon);
  });

  it('suppresses the modifier at primary, which is the default, and not at neutral', () => {
    // The rule VfBadge and VfTag have is the mirror image: they suppress
    // `neutral` and emit `primary`. An alert whose tone rule was borrowed from
    // either would emit vf-alert--primary and drop vf-alert--neutral, and this
    // is what notices.
    expect(mountAlert({ props: { tone: 'primary' } }).classes()).toEqual(['vf-alert']);
    expect(mountAlert({ props: { tone: 'neutral' } }).classes()).toEqual(['vf-alert', 'vf-alert--neutral']);
    expect(mountAlert().classes()).toEqual(['vf-alert']);
  });

  it('never emits a badge or tag block name', () => {
    for (const tone of TONES) {
      const classes = mountAlert({ props: { tone } }).classes().join(' ');

      expect(classes).not.toContain('vf-badge');
      expect(classes).not.toContain('vf-tag');
    }
  });

  it('shares one glyph between neutral, primary, info and contrast', () => {
    // Four tones, one icon. The fallback chain names six tones and has a final
    // default; `neutral` is not named and falls to that default, which happens
    // to be the same glyph `info` and `contrast` name explicitly.
    for (const tone of ['neutral', 'primary', 'info', 'contrast'] as const) {
      expect(glyphOf(mountAlert({ props: { tone } }))).toBe('info-circle');
    }
  });

  it('does not change the role, the live-region attributes or any other attribute', () => {
    // Tone is not semantics. A danger alert and a success alert expose the same
    // role, and neither writes anything the other does not.
    const attributeNames = (tone: (typeof TONES)[number]) =>
      Object.keys(mountAlert({ props: { tone } }).attributes())
        .filter((name) => name !== 'class')
        .sort();

    for (const tone of TONES) {
      expect(mountAlert({ props: { tone } }).attributes('role')).toBe('alert');
      expect(attributeNames(tone)).toEqual(['role']);
    }
  });

  it('paints the tone on the icon container through the root modifier only', () => {
    // The icon container carries no tone class of its own; the stylesheet
    // reaches it as `.vf-alert--danger .vf-alert__icon`.
    expect(
      mountAlert({ props: { tone: 'danger' } })
        .find('.vf-alert__icon')
        .classes(),
    ).toEqual(['vf-alert__icon']);
  });
});

describe('VfAlert characterization: the icon', () => {
  it('wraps the glyph in a decorative container', () => {
    const container = mountAlert().find('.vf-alert__icon');

    expect(container.element.tagName).toBe('DIV');
    expect(container.attributes('aria-hidden')).toBe('true');
  });

  it('asks the icon component for the large size', () => {
    // A literal custom property, not the icon component's own default. The
    // Razor adapter has to write the same string into the glyph.
    expect(mountAlert().find('.vf-alert__icon .vf-icon').attributes('data-size')).toBe('var(--vf-icon-size-lg)');
  });

  it('marks nothing but the container decorative', () => {
    // aria-hidden is on the container, not on the glyph. The glyph is hidden by
    // inheritance; an adapter that wrote aria-hidden on the svg as well would
    // differ in an attribute nothing can see.
    const glyph = mountAlert().findComponent({ name: 'VueIconifyStub' });

    expect(glyph.vm.$attrs['aria-hidden']).toBeUndefined();
  });

  it('lets the icon prop replace the tone glyph', () => {
    expect(glyphOf(mountAlert({ props: { tone: 'danger', icon: 'user' } }))).toBe('user');
  });

  it('passes an unknown icon name through without validating it', () => {
    // The alert performs no lookup of its own. What an unknown name renders is
    // the icon package's decision - it falls back to its own default glyph -
    // and not this component's.
    expect(glyphOf(mountAlert({ props: { icon: 'no-such-glyph' } }))).toBe('no-such-glyph');
  });

  it('treats an empty icon prop as a glyph name rather than as no icon', () => {
    // `props.icon ?? default` is a nullish check, not a truthiness one. An
    // empty string is a name, and is handed to the icon component as one.
    expect(glyphOf(mountAlert({ props: { icon: '' } }))).toBe('');
  });

  it('lets the icon slot replace the glyph but not the container', () => {
    const alert = mountAlert({ props: { icon: 'user' }, slots: { icon: '<i class="mine">i</i>' } });

    expect(alert.find('.vf-alert__icon .mine').exists()).toBe(true);
    expect(alert.find('.vf-alert__icon .vf-icon').exists()).toBe(false);
    expect(alert.find('.vf-alert__icon').attributes('aria-hidden')).toBe('true');
  });

  it('brings the glyph back when the icon slot renders nothing', () => {
    // Slot fallback: an icon slot yielding no vnodes falls back to the tone
    // glyph, exactly as the title slot falls back to the title prop.
    expect(glyphOf(mountAlert({ props: { tone: 'warn' }, slots: { icon: () => null } }))).toBe('alert-circle');
  });

  it('removes the whole container for hideIcon, consumer slot included', () => {
    // Not an empty container, and not the slot content unwrapped: nothing. A
    // consumer icon slot is discarded along with it.
    const alert = mountAlert({ props: { hideIcon: true, icon: 'user' }, slots: { icon: '<i class="mine">i</i>' } });

    expect(alert.find('.vf-alert__icon').exists()).toBe(false);
    expect(alert.find('.mine').exists()).toBe(false);
    expect(childrenOf(alert)).toEqual(['div']);
    expect(alert.element.children[0].className).toBe('vf-alert__content');
  });

  it('hides the icon for every tone', () => {
    for (const tone of TONES) {
      expect(
        mountAlert({ props: { tone, hideIcon: true } })
          .find('.vf-alert__icon')
          .exists(),
      ).toBe(false);
    }
  });
});

describe('VfAlert characterization: the title', () => {
  it('renders the title prop inside a classed paragraph', () => {
    const title = mountAlert({ props: { title: 'Saved' } }).find('.vf-alert__title');

    expect(title.element.tagName).toBe('P');
    expect(title.text()).toBe('Saved');
  });

  it('renders no title paragraph when there is neither a prop nor a slot', () => {
    expect(
      mountAlert({ slots: { default: 'Body' } })
        .find('.vf-alert__title')
        .exists(),
    ).toBe(false);
  });

  it('renders no title paragraph for an empty-string title', () => {
    // Falsy, so it reads as no title. An empty paragraph would take a row of
    // the content grid's gap and is not what happens.
    expect(
      mountAlert({ props: { title: '' } })
        .find('.vf-alert__title')
        .exists(),
    ).toBe(false);
  });

  it('opens the paragraph on a title slot alone', () => {
    const alert = mountAlert({ slots: { title: '<em class="mine">Custom</em>' } });

    expect(alert.find('.vf-alert__title .mine').exists()).toBe(true);
    expect(alert.find('.vf-alert__title').text()).toBe('Custom');
  });

  it('lets the title slot replace the prop text, which then goes unused', () => {
    const alert = mountAlert({ props: { title: 'Saved' }, slots: { title: 'Custom' } });

    expect(alert.find('.vf-alert__title').text()).toBe('Custom');
    expect(alert.text()).not.toContain('Saved');
  });

  it('brings the prop text back when the title slot renders nothing', () => {
    const alert = mountAlert({ props: { title: 'Saved' }, slots: { title: () => null } });

    expect(alert.find('.vf-alert__title').text()).toBe('Saved');
  });

  it('renders an empty paragraph when an empty title slot meets an empty prop', () => {
    // The paragraph opens because a slot was passed; the slot produced nothing,
    // so the fallback renders the prop; and the prop is empty. The quirk the
    // panel has with its heading, and the alert has with its paragraph.
    const alert = mountAlert({ props: { title: '' }, slots: { title: () => null } });

    expect(alert.find('.vf-alert__title').exists()).toBe(true);
    expect(alert.find('.vf-alert__title').text()).toBe('');
  });

  it('escapes a hostile title as interpolated content', () => {
    const alert = mountAlert({ props: { title: '<img src=x onerror=alert(1)>' } });

    expect(alert.find('.vf-alert__title').element.children.length).toBe(0);
    expect(alert.html()).toContain('&lt;img');
  });
});

describe('VfAlert characterization: the default slot', () => {
  it('renders default slot content inside the body wrapper', () => {
    const alert = mountAlert({ slots: { default: '<p class="mine">Paragraph</p>' } });

    expect(alert.find('.vf-alert__body > p.mine').exists()).toBe(true);
  });

  it('renders several root-level nodes inside the one body wrapper', () => {
    const body = mountAlert({ slots: { default: '<p>One</p><p>Two</p>' } }).find('.vf-alert__body');

    expect([...body.element.children].map((child) => child.tagName)).toEqual(['P', 'P']);
  });

  it('renders a consumer-provided control inside the body, and it is the only control there', () => {
    // The consumer half of the ownership proof. The component owns no
    // interaction; the consumer may put a button in the body, and the static
    // snapshot in the parity harness is asserted against that number.
    const alert = mountAlert({ slots: { default: '<button type="button">Retry</button>' } });

    expect(alert.find('.vf-alert__body > button').exists()).toBe(true);
    expect(alert.findAll(FOCUSABLE)).toHaveLength(1);
  });

  it('renders a consumer-provided control inside the title paragraph too', () => {
    const alert = mountAlert({ slots: { title: '<a href="#docs">Read more</a>' } });

    expect(alert.find('.vf-alert__title > a').exists()).toBe(true);
    expect(alert.findAll(FOCUSABLE)).toHaveLength(1);
  });

  it('ignores named slots it does not declare', () => {
    const alert = mountAlert({ slots: { actions: '<button type="button">Dismiss</button>', footer: 'F' } });

    expect(alert.findAll('button')).toHaveLength(0);
    expect(alert.text()).not.toContain('F');
  });
});

describe('VfAlert characterization: ARIA and attrs', () => {
  it('writes role="alert" on the section', () => {
    expect(mountAlert().attributes('role')).toBe('alert');
  });

  it('writes the same role whether or not the icon and the title render', () => {
    expect(mountAlert({ props: { hideIcon: true } }).attributes('role')).toBe('alert');
    expect(mountAlert({ props: { title: 'Saved' }, slots: { default: 'Body' } }).attributes('role')).toBe('alert');
  });

  it('lets a consumer role replace its own', () => {
    // The role is written before `v-bind="attrs"`, so a consumer's wins. That
    // is how an application turns an alert into a status region without a
    // second component, and it is historical.
    expect(mountAlert({ attrs: { role: 'status' } }).attributes('role')).toBe('status');
  });

  it('lets a consumer add live-region attributes and an accessible name', () => {
    const alert = mountAlert({ attrs: { 'aria-live': 'polite', 'aria-atomic': 'false', 'aria-label': 'Save' } });

    expect(alert.attributes('aria-live')).toBe('polite');
    expect(alert.attributes('aria-atomic')).toBe('false');
    expect(alert.attributes('aria-label')).toBe('Save');
    expect(alert.attributes('role')).toBe('alert');
  });

  it('appends a caller class after the canonical classes', () => {
    expect(mountAlert({ props: { tone: 'warn' }, attrs: { class: 'mine' } }).classes()).toEqual([
      'vf-alert',
      'vf-alert--warn',
      'mine',
    ]);
    expect(mountAlert({ attrs: { class: 'mine' } }).classes()).toEqual(['vf-alert', 'mine']);
  });

  it('forwards style, data and id attributes to the root', () => {
    const alert = mountAlert({ attrs: { style: 'opacity: 0.5', 'data-testid': 'alert', id: 'a1' } });

    expect(alert.attributes('style')).toBe('opacity: 0.5;');
    expect(alert.attributes('data-testid')).toBe('alert');
    expect(alert.attributes('id')).toBe('a1');
  });

  it('does not leak attrs onto the icon, the content wrapper, the title or the body', () => {
    const alert = mountAlert({
      props: { title: 'Saved' },
      slots: { default: 'Body' },
      attrs: { 'data-testid': 'alert', role: 'status' },
    });

    for (const selector of ['.vf-alert__icon', '.vf-alert__content', '.vf-alert__title', '.vf-alert__body']) {
      expect(alert.find(selector).attributes('data-testid')).toBeUndefined();
      expect(alert.find(selector).attributes('role')).toBeUndefined();
    }
  });
});

describe('VfAlert characterization: SSR', () => {
  it('renders an empty alert server-side', async () => {
    // The icon container with its fragment-wrapped glyph, one v-if anchor for
    // the absent title, and the unconditional body with an empty fragment.
    expect(await ssrAlert()).toBe(
      '<section class="vf-alert" role="alert">' +
        '<div class="vf-alert__icon" aria-hidden="true"><!--[-->' +
        '<span class="vf-icon" data-icon="info-circle" data-size="var(--vf-icon-size-lg)"></span>' +
        '<!--]--></div>' +
        '<div class="vf-alert__content"><!--v-if--><div class="vf-alert__body"><!--[--><!--]--></div></div>' +
        '</section>',
    );
  });

  it('renders the full composition server-side', async () => {
    const html = await ssrAlert({ title: 'Saved', tone: 'success', 'data-x': 'a"b' }, { default: () => 'B' });

    expect(html).toBe(
      '<section class="vf-alert vf-alert--success" role="alert" data-x="a&quot;b">' +
        '<div class="vf-alert__icon" aria-hidden="true"><!--[-->' +
        '<span class="vf-icon" data-icon="check-circle" data-size="var(--vf-icon-size-lg)"></span>' +
        '<!--]--></div>' +
        '<div class="vf-alert__content">' +
        '<p class="vf-alert__title"><!--[-->Saved<!--]--></p>' +
        '<div class="vf-alert__body"><!--[-->B<!--]--></div>' +
        '</div></section>',
    );
  });

  it('renders no icon container server-side for hideIcon', async () => {
    const html = await ssrAlert({ hideIcon: true }, { icon: () => 'I' });

    expect(html).toBe(
      '<section class="vf-alert" role="alert"><!--v-if-->' +
        '<div class="vf-alert__content"><!--v-if--><div class="vf-alert__body"><!--[--><!--]--></div></div>' +
        '</section>',
    );
    expect(html).not.toContain('I');
  });

  it('lets a consumer role win server-side too', async () => {
    expect(await ssrAlert({ role: 'status' })).toContain('<section class="vf-alert" role="status">');
  });

  it('renders no button server-side in any configuration', async () => {
    for (const tone of TONES) {
      expect(await ssrAlert({ tone, title: 'T' }, { default: () => 'B' })).not.toContain('<button');
    }
  });

  it('escapes a hostile title server-side', async () => {
    expect(await ssrAlert({ title: '<b>t</b>' })).toContain('&lt;b&gt;t&lt;/b&gt;');
  });
});
