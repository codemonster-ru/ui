// Characterization of the historical VfBreadcrumbs at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The M26 component, and the second migrated one whose owned controls are
// native anchors - N of them at once, one per item that is a link. It does
// not render VfLink and never did: it selects the element per item with the
// same two rules VfLink has (`to` selects a handoff to whatever is registered
// as `RouterLink`, otherwise an `<a>`; `rel` is derived only for `_blank`) and
// two rules of its own that decide whether an item is a link at all. Those two
// are the ones a migration would "fix" by accident:
//
//   - the current item. `current` on any item makes the explicit flags the
//     rule; with none, the last item is current. The current item is always a
//     span: its `href` is dropped. Two explicit flags make two current spans
//     with two aria-current attributes, and the reference never enforces one;
//   - the link test is truthiness, not definedness: `href: ''` and `to: ''`
//     are no destination, so the item is a span - without aria-current unless
//     it is also current. VfLink keeps `href=""` on the anchor; this component
//     does not, and the two must not be made to agree.
//
// The rest of what is pinned: `disabled` makes a span with a modifier and no
// aria-disabled; every consumer attr lands on the `nav` and none on the list,
// the items or the links; the separator is an owned aria-hidden span after
// every item but the last, whose *content* the scoped slot replaces; and the
// router branch is a handoff - `to`, `target`, `rel` and the link class, no
// attrs, no href - that with nothing registered renders Vue's literal
// unresolved element. No fallback to an anchor, no throw, no router detection.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, toRaw, type PropType } from 'vue';
import { describe, expect, it, vi } from 'vitest';

// The icons package is stubbed with the real name mapping rather than with the
// package-wide setup stub, which knows one glyph (chevronDown) and would
// resolve the separator's chevronRight to undefined. `icons.chevronRight` in
// the real package is the string 'chevron-right'. The stub records what the
// component passed it - the glyph name and the size - as data attributes.
// That the name produces the right geometry is not knowable from a stub and is
// proven where the real package is loaded: the three-way parity run, whose
// compared vocabulary carries the glyph's polyline points since M26.
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

import VfBreadcrumbs from './VfBreadcrumbs.vue';
import type { VfBreadcrumbItem } from '@/types/components';

type BreadcrumbsProps = InstanceType<typeof VfBreadcrumbs>['$props'];

const ICON = '<span class="vf-icon" data-icon="chevron-right" data-size="var(--vf-icon-size-sm)"></span>';
const SEPARATOR = `<span class="vf-breadcrumbs__separator" aria-hidden="true">${ICON}</span>`;
const SSR_SEPARATOR = `<span class="vf-breadcrumbs__separator" aria-hidden="true"><!--[-->${ICON}<!--]--></span>`;

const trail: VfBreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Breadcrumbs' },
];

function mountBreadcrumbs({
  props,
  attrs = {},
  slots = {},
  global = {},
  attachTo,
}: {
  props: BreadcrumbsProps;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  global?: Record<string, unknown>;
  attachTo?: Element;
}) {
  return mount(VfBreadcrumbs, { props, attrs, slots: slots as never, global, attachTo });
}

async function ssr(
  props: Record<string, unknown>,
  slots: Record<string, unknown> = {},
  register?: (app: ReturnType<typeof createSSRApp>) => void,
) {
  const app = createSSRApp({ render: () => h(VfBreadcrumbs, props as unknown as BreadcrumbsProps, slots as never) });
  register?.(app);

  return await renderToString(app);
}

const items = (wrapper: ReturnType<typeof mountBreadcrumbs>) => wrapper.findAll('li.vf-breadcrumbs__item');
const links = (wrapper: ReturnType<typeof mountBreadcrumbs>) => wrapper.findAll('.vf-breadcrumbs__link');
const currents = (wrapper: ReturnType<typeof mountBreadcrumbs>) => wrapper.findAll('.vf-breadcrumbs__current');
const separators = (wrapper: ReturnType<typeof mountBreadcrumbs>) => wrapper.findAll('.vf-breadcrumbs__separator');
/** The first child of an item: the link or the current span. */
const itemNode = (wrapper: ReturnType<typeof mountBreadcrumbs>, index: number) =>
  items(wrapper)[index].element.children[0];

/**
 * A stand-in for a router's link component, recording exactly what it was
 * handed. It renders an anchor so the handoff is observable in the DOM, but
 * nothing about it is vue-router: the reference never installs one.
 */
const handedTo: unknown[] = [];
const RecordingRouterLink = defineComponent({
  name: 'RouterLink',
  inheritAttrs: false,
  props: { to: { type: [String, Object] as PropType<string | Record<string, unknown>>, required: true } },
  setup(props, { attrs, slots }) {
    handedTo.push(props.to);

    return () =>
      h(
        'a',
        {
          'data-received-to': typeof props.to === 'string' ? props.to : JSON.stringify(props.to),
          'data-received-attrs': JSON.stringify(
            Object.fromEntries(
              Object.entries(attrs).map(([name, value]) => [name, typeof value === 'function' ? 'fn' : value]),
            ),
          ),
        },
        slots.default?.(),
      );
  },
});
const withRouter = { components: { RouterLink: RecordingRouterLink } };
const received = (element: Element) =>
  JSON.parse(element.getAttribute('data-received-attrs') ?? '{}') as Record<string, unknown>;

// ------------------------------------------------------------------ structure

describe('VfBreadcrumbs characterization: structure', () => {
  it('renders nav > ol > li, with a nav aria-label and no explicit role anywhere', () => {
    const wrapper = mountBreadcrumbs({ props: { items: trail } });

    expect(wrapper.element.tagName).toBe('NAV');
    expect(wrapper.classes()).toEqual(['vf-breadcrumbs']);
    expect(wrapper.attributes('aria-label')).toBe('Breadcrumb');
    expect(wrapper.element.children).toHaveLength(1);
    expect(wrapper.element.children[0].tagName).toBe('OL');
    expect(wrapper.element.children[0].className).toBe('vf-breadcrumbs__list');
    expect(items(wrapper)).toHaveLength(3);
    expect(wrapper.findAll('[role]')).toHaveLength(0);
  });

  it('renders exactly this markup for a three-item trail', () => {
    const wrapper = mountBreadcrumbs({ props: { items: trail } });

    expect(wrapper.html({ raw: true })).toBe(
      '<nav class="vf-breadcrumbs" aria-label="Breadcrumb"><ol class="vf-breadcrumbs__list">' +
        `<li class="vf-breadcrumbs__item"><a href="/" class="vf-breadcrumbs__link">Home</a>${SEPARATOR}</li>` +
        `<li class="vf-breadcrumbs__item"><a href="/docs" class="vf-breadcrumbs__link">Docs</a>${SEPARATOR}</li>` +
        '<li class="vf-breadcrumbs__item"><span class="vf-breadcrumbs__current" aria-current="page">Breadcrumbs</span><!--v-if--></li>' +
        '</ol></nav>',
    );
  });

  it('renders exactly this markup on the server', async () => {
    expect(await ssr({ items: trail })).toBe(
      '<nav class="vf-breadcrumbs" aria-label="Breadcrumb"><ol class="vf-breadcrumbs__list"><!--[-->' +
        `<li class="vf-breadcrumbs__item"><a href="/" class="vf-breadcrumbs__link">Home</a>${SSR_SEPARATOR}</li>` +
        `<li class="vf-breadcrumbs__item"><a href="/docs" class="vf-breadcrumbs__link">Docs</a>${SSR_SEPARATOR}</li>` +
        '<li class="vf-breadcrumbs__item"><span class="vf-breadcrumbs__current" aria-current="page">Breadcrumbs</span><!--v-if--></li>' +
        '<!--]--></ol></nav>',
    );
  });

  it('renders an empty list for no items: the nav and the ol stay, and nothing is current', async () => {
    const wrapper = mountBreadcrumbs({ props: { items: [] } });

    expect(wrapper.html({ raw: true })).toBe(
      '<nav class="vf-breadcrumbs" aria-label="Breadcrumb"><ol class="vf-breadcrumbs__list"></ol></nav>',
    );
    expect(wrapper.findAll('[aria-current]')).toHaveLength(0);
    expect(await ssr({ items: [] })).toBe(
      '<nav class="vf-breadcrumbs" aria-label="Breadcrumb"><ol class="vf-breadcrumbs__list"><!--[--><!--]--></ol></nav>',
    );
  });

  it('renders one item as the current span with no separator, whether or not it has an href', () => {
    for (const item of [{ label: 'Only' }, { label: 'Only', href: '/only' }]) {
      const wrapper = mountBreadcrumbs({ props: { items: [item] } });

      expect(items(wrapper)).toHaveLength(1);
      expect(links(wrapper)).toHaveLength(0);
      expect(separators(wrapper)).toHaveLength(0);
      expect(itemNode(wrapper, 0).outerHTML).toBe(
        '<span class="vf-breadcrumbs__current" aria-current="page">Only</span>',
      );
    }
  });

  it('has no emits and no default or item slot', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: trail },
      slots: { default: () => h('b', 'default-slot'), item: () => h('b', 'item-slot') },
    });

    expect(wrapper.vm.$options.emits).toBeUndefined();
    expect(wrapper.findAll('b')).toHaveLength(0);
    expect(wrapper.text()).toBe('HomeDocsBreadcrumbs');
  });
});

// -------------------------------------------------------------- current item

describe('VfBreadcrumbs characterization: current selection', () => {
  it('makes the last item current when no item is flagged, and drops its href', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
        ],
      },
    });

    expect(itemNode(wrapper, 0).outerHTML).toBe('<a href="/" class="vf-breadcrumbs__link">Home</a>');
    expect(itemNode(wrapper, 1).outerHTML).toBe(
      '<span class="vf-breadcrumbs__current" aria-current="page">Docs</span>',
    );
    expect(wrapper.html()).not.toContain('/docs');
  });

  it('an explicit current flag makes that item current and lets the last item be a link', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs', current: true },
          { label: 'Leaf', href: '/leaf' },
        ],
      },
    });

    expect(itemNode(wrapper, 0).tagName).toBe('A');
    expect(itemNode(wrapper, 1).outerHTML).toBe(
      '<span class="vf-breadcrumbs__current" aria-current="page">Docs</span>',
    );
    expect(itemNode(wrapper, 2).outerHTML).toBe('<a href="/leaf" class="vf-breadcrumbs__link">Leaf</a>');
    expect(wrapper.findAll('[aria-current]')).toHaveLength(1);
  });

  it('two explicit current flags make two current spans with two aria-current attributes', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [
          { label: 'A', href: '/a', current: true },
          { label: 'B', href: '/b', current: true },
          { label: 'C', href: '/c' },
        ],
      },
    });

    expect(wrapper.findAll('[aria-current="page"]')).toHaveLength(2);
    expect(itemNode(wrapper, 0).outerHTML).toBe('<span class="vf-breadcrumbs__current" aria-current="page">A</span>');
    expect(itemNode(wrapper, 1).outerHTML).toBe('<span class="vf-breadcrumbs__current" aria-current="page">B</span>');
    expect(itemNode(wrapper, 2).outerHTML).toBe('<a href="/c" class="vf-breadcrumbs__link">C</a>');
  });

  it('a current item without a destination is still the current span', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [
          { label: 'A', href: '/a' },
          { label: 'B', current: true },
          { label: 'C', href: '/c' },
        ],
      },
    });

    expect(itemNode(wrapper, 1).outerHTML).toBe('<span class="vf-breadcrumbs__current" aria-current="page">B</span>');
    expect(itemNode(wrapper, 2).tagName).toBe('A');
  });

  it('aria-current is exactly "page", only on the current span, never on an anchor', () => {
    const wrapper = mountBreadcrumbs({ props: { items: trail } });

    for (const element of wrapper.findAll('[aria-current]')) {
      expect(element.element.tagName).toBe('SPAN');
      expect(element.attributes('aria-current')).toBe('page');
    }
    expect(wrapper.findAll('a[aria-current]')).toHaveLength(0);
  });
});

// ------------------------------------------------------------ link selection

describe('VfBreadcrumbs characterization: link selection', () => {
  it('a disabled item is a span with the disabled modifier, no aria-current and no aria-disabled', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs', disabled: true }, { label: 'Leaf' }],
      },
    });
    const disabled = itemNode(wrapper, 1);

    expect(disabled.tagName).toBe('SPAN');
    expect([...disabled.classList]).toEqual(['vf-breadcrumbs__current', 'vf-breadcrumbs__current--disabled']);
    expect(disabled.hasAttribute('aria-current')).toBe(false);
    expect(disabled.hasAttribute('aria-disabled')).toBe(false);
    expect(disabled.hasAttribute('href')).toBe(false);
    expect(wrapper.html()).not.toContain('/docs');
  });

  it("writes both the block class and the modifier on the server; their order is the compiler's, not the contract", async () => {
    // A client-compiled render function serialises the static class first; an
    // SSR-compiled template serialises the bound class first. The parity
    // extractor sorts canonical classes, so the set is what is compared.
    const html = await ssr({
      items: [{ label: 'Home', href: '/' }, { label: 'Docs', disabled: true }, { label: 'Leaf' }],
    });
    const span = /<span class="([^"]+)">Docs<\/span>/.exec(html);

    expect(span?.[1].split(' ').sort()).toEqual(['vf-breadcrumbs__current', 'vf-breadcrumbs__current--disabled']);
    expect(html).not.toContain('aria-disabled');
  });

  it('a disabled current item carries both the modifier and aria-current', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Leaf', disabled: true },
        ],
      },
    });
    const last = itemNode(wrapper, 1);

    expect([...last.classList]).toEqual(['vf-breadcrumbs__current', 'vf-breadcrumbs__current--disabled']);
    expect(last.getAttribute('aria-current')).toBe('page');
  });

  it('a middle item with no destination is a span with the current class and no aria-current', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: [{ label: 'Home', href: '/' }, { label: 'Section' }, { label: 'Leaf' }] },
    });

    expect(itemNode(wrapper, 1).outerHTML).toBe('<span class="vf-breadcrumbs__current">Section</span>');
    expect(wrapper.findAll('[aria-current]')).toHaveLength(1);
  });

  it('href="" is no destination: the item is a span, not an anchor with an empty href', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: [{ label: 'Home', href: '/' }, { label: 'Empty', href: '' }, { label: 'Leaf' }] },
    });

    expect(itemNode(wrapper, 1).outerHTML).toBe('<span class="vf-breadcrumbs__current">Empty</span>');
    expect(wrapper.findAll('a[href=""]')).toHaveLength(0);
  });

  it('to="" is no destination either: a span, not a router element', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: [{ label: 'Home', to: '' }, { label: 'Leaf' }] },
      global: withRouter,
    });

    expect(itemNode(wrapper, 0).outerHTML).toBe('<span class="vf-breadcrumbs__current">Home</span>');
    expect(wrapper.findAll('[data-received-to]')).toHaveLength(0);
  });

  it('an empty label renders an empty anchor', () => {
    const wrapper = mountBreadcrumbs({ props: { items: [{ label: '', href: '/' }, { label: 'Leaf' }] } });

    expect(itemNode(wrapper, 0).outerHTML).toBe('<a href="/" class="vf-breadcrumbs__link"></a>');
  });

  it('duplicate labels and duplicate destinations render verbatim, one item each', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: [{ label: 'Same', href: '/x' }, { label: 'Same', href: '/x' }, { label: 'Same' }] },
    });

    expect(items(wrapper)).toHaveLength(3);
    expect(links(wrapper).map((link) => link.attributes('href'))).toEqual(['/x', '/x']);
    expect(links(wrapper).map((link) => link.text())).toEqual(['Same', 'Same']);
  });

  it('writes the label as the whole content of the link and of the span, with no wrapper', () => {
    const wrapper = mountBreadcrumbs({ props: { items: trail } });

    expect(itemNode(wrapper, 0).children).toHaveLength(0);
    expect(itemNode(wrapper, 0).textContent).toBe('Home');
    expect(itemNode(wrapper, 2).children).toHaveLength(0);
    expect(itemNode(wrapper, 2).textContent).toBe('Breadcrumbs');
  });
});

// ------------------------------------------------------------ target and rel

describe('VfBreadcrumbs characterization: target and rel', () => {
  const first = (item: VfBreadcrumbItem, global = {}) =>
    itemNode(mountBreadcrumbs({ props: { items: [item, { label: 'Leaf' }] }, global }), 0);

  it('derives rel="noopener noreferrer" for target=_blank with no rel', () => {
    const link = first({ label: 'Ext', href: 'https://example.com/', target: '_blank' });

    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('writes an explicit rel as given, without merging the default in', () => {
    const link = first({ label: 'Ext', href: 'https://example.com/', target: '_blank', rel: 'nofollow' });

    expect(link.getAttribute('rel')).toBe('nofollow');
  });

  it('derives nothing for target=_self', () => {
    const link = first({ label: 'Ext', href: '/s', target: '_self' });

    expect(link.getAttribute('target')).toBe('_self');
    expect(link.hasAttribute('rel')).toBe(false);
  });

  it('writes rel on its own when there is no target', () => {
    const link = first({ label: 'Ext', href: '/s', rel: 'nofollow' });

    expect(link.hasAttribute('target')).toBe(false);
    expect(link.getAttribute('rel')).toBe('nofollow');
  });

  it('treats rel="" as not given: nothing without _blank, the derived value with it', () => {
    expect(first({ label: 'Ext', href: '/s', rel: '' }).hasAttribute('rel')).toBe(false);
    expect(first({ label: 'Ext', href: 'https://example.com/', target: '_blank', rel: '' }).getAttribute('rel')).toBe(
      'noopener noreferrer',
    );
  });

  it('writes no target and no rel on a plain link', () => {
    const link = first({ label: 'Home', href: '/' });

    expect(link.hasAttribute('target')).toBe(false);
    expect(link.hasAttribute('rel')).toBe(false);
  });

  it('hands the same target and derived rel to the router component', () => {
    const link = first({ label: 'Home', to: '/to', target: '_blank' }, withRouter);

    expect(received(link)).toEqual({ target: '_blank', rel: 'noopener noreferrer', class: 'vf-breadcrumbs__link' });
  });
});

// ------------------------------------------------------------ router branch

describe('VfBreadcrumbs characterization: router branch', () => {
  it('hands a string `to` to the registered RouterLink with target, rel and the link class - and no attrs', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: [{ label: 'Home', to: '/' }, { label: 'Leaf' }] },
      attrs: { id: 'trail', 'data-testid': 't', class: 'consumer' },
      global: withRouter,
    });
    const link = itemNode(wrapper, 0);

    expect(link.getAttribute('data-received-to')).toBe('/');
    expect(received(link)).toEqual({ class: 'vf-breadcrumbs__link' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(wrapper.attributes('id')).toBe('trail');
  });

  it('hands an object `to` through untouched, by identity, and never serialises it', () => {
    const destination = { name: 'home', params: { id: 1 } };
    handedTo.length = 0;
    const wrapper = mountBreadcrumbs({
      props: { items: [{ label: 'Home', to: destination }, { label: 'Leaf' }] },
      global: withRouter,
    });

    // Vue Test Utils hands props through a reactive proxy; the raw object is the one the item held.
    expect(toRaw(handedTo[0] as object)).toBe(destination);
    expect(wrapper.html()).not.toContain('[object Object]');
    expect(itemNode(wrapper, 0).hasAttribute('href')).toBe(false);
  });

  it('drops href entirely when to is defined: the router component never receives it', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: [{ label: 'Home', to: '/to', href: '/href' }, { label: 'Leaf' }] },
      global: withRouter,
    });
    const link = itemNode(wrapper, 0);

    expect(link.getAttribute('data-received-to')).toBe('/to');
    expect(received(link).href).toBeUndefined();
    expect(wrapper.html()).not.toContain('/href');
  });

  it('renders the literal unresolved element with nothing registered - no anchor, no throw', () => {
    const wrapper = mountBreadcrumbs({ props: { items: [{ label: 'Home', to: '/' }, { label: 'Leaf' }] } });
    const link = itemNode(wrapper, 0);

    expect(link.tagName).toBe('ROUTERLINK');
    expect(link.getAttribute('to')).toBe('/');
    expect(link.className).toBe('vf-breadcrumbs__link');
    expect(link.hasAttribute('href')).toBe(false);
  });

  it('renders the unresolved element on the server, with an object `to` absent from the markup', async () => {
    expect(await ssr({ items: [{ label: 'Home', to: '/' }, { label: 'Leaf' }] })).toContain(
      '<RouterLink to="/" class="vf-breadcrumbs__link">Home</RouterLink>',
    );
    expect(await ssr({ items: [{ label: 'Home', to: { name: 'home' } }, { label: 'Leaf' }] })).toContain(
      '<RouterLink class="vf-breadcrumbs__link">Home</RouterLink>',
    );
  });

  it('renders the registered RouterLink on the server too', async () => {
    const html = await ssr({ items: [{ label: 'Home', to: '/' }, { label: 'Leaf' }] }, {}, (app) =>
      app.component('RouterLink', RecordingRouterLink),
    );

    expect(html).toContain('data-received-to="/"');
  });

  it('component replaces RouterLink for `to` items only: component="a" renders <a to> with no href, inert', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [{ label: 'Home', to: '/to' }, { label: 'Docs', href: '/docs' }, { label: 'Leaf' }],
        component: 'a',
      },
      global: withRouter,
      attachTo: document.body,
    });
    const routed = itemNode(wrapper, 0);
    const native = itemNode(wrapper, 1);

    expect(routed.outerHTML).toBe('<a to="/to" class="vf-breadcrumbs__link">Home</a>');
    (routed as HTMLElement).focus();
    expect(document.activeElement).not.toBe(routed);
    expect(native.outerHTML).toBe('<a href="/docs" class="vf-breadcrumbs__link">Docs</a>');
    expect(wrapper.findAll('[data-received-to]')).toHaveLength(0);
    wrapper.unmount();
  });

  it('a `to` item that is current or disabled is a span like any other', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [
          { label: 'A', to: '/a', disabled: true },
          { label: 'B', to: '/b' },
        ],
      },
      global: withRouter,
    });

    expect(itemNode(wrapper, 0).outerHTML).toBe(
      '<span class="vf-breadcrumbs__current vf-breadcrumbs__current--disabled">A</span>',
    );
    expect(itemNode(wrapper, 1).outerHTML).toBe('<span class="vf-breadcrumbs__current" aria-current="page">B</span>');
  });
});

// ------------------------------------------------------------------- root

describe('VfBreadcrumbs characterization: root attrs and aria-label', () => {
  it('uses the ariaLabel prop as the nav label, and writes an empty attribute for ariaLabel=""', async () => {
    expect(mountBreadcrumbs({ props: { items: trail, ariaLabel: 'Path' } }).attributes('aria-label')).toBe('Path');

    const empty = mountBreadcrumbs({ props: { items: trail, ariaLabel: '' } });
    expect(empty.element.hasAttribute('aria-label')).toBe(true);
    expect(empty.attributes('aria-label')).toBe('');
    expect(await ssr({ items: trail, ariaLabel: '' })).toContain('<nav class="vf-breadcrumbs" aria-label>');
  });

  it('a consumer aria-label attr is the same prop and lands on the nav', () => {
    expect(
      mountBreadcrumbs({ props: { items: trail }, attrs: { 'aria-label': 'Where' } }).attributes('aria-label'),
    ).toBe('Where');
  });

  it('lands every consumer attr on the nav and nowhere else, with the consumer class after the block class', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: trail },
      attrs: {
        class: 'consumer',
        id: 'trail',
        style: 'margin: 0px',
        'data-testid': 't',
        role: 'region',
        'aria-labelledby': 'heading',
        'aria-describedby': 'hint',
        title: 'T',
        tabindex: '0',
      },
    });

    expect(wrapper.attributes('class')).toBe('vf-breadcrumbs consumer');
    expect(wrapper.attributes('id')).toBe('trail');
    expect(wrapper.attributes('style')).toBe('margin: 0px;');
    expect(wrapper.attributes('data-testid')).toBe('t');
    expect(wrapper.attributes('role')).toBe('region');
    expect(wrapper.attributes('aria-labelledby')).toBe('heading');
    expect(wrapper.attributes('aria-describedby')).toBe('hint');
    expect(wrapper.attributes('title')).toBe('T');
    expect(wrapper.attributes('tabindex')).toBe('0');

    for (const selector of ['ol', 'li', 'a', 'span']) {
      for (const element of wrapper.findAll(selector)) {
        for (const name of [
          'id',
          'style',
          'data-testid',
          'role',
          'aria-labelledby',
          'aria-describedby',
          'title',
          'tabindex',
        ]) {
          expect(element.attributes(name), `${selector} carries ${name}`).toBeUndefined();
        }
        expect(element.classes()).not.toContain('consumer');
      }
    }
  });

  it('does not inherit attrs automatically', () => {
    expect(VfBreadcrumbs.inheritAttrs).toBe(false);
  });
});

// -------------------------------------------------------------- separator

describe('VfBreadcrumbs characterization: separator', () => {
  it('renders an aria-hidden separator span after every item but the last, holding the chevron-right glyph at the small size', () => {
    const wrapper = mountBreadcrumbs({ props: { items: trail } });

    expect(separators(wrapper)).toHaveLength(2);
    for (const [index, item] of items(wrapper).entries()) {
      const children = item.element.children;
      if (index < 2) {
        expect(children).toHaveLength(2);
        expect(children[1].outerHTML).toBe(SEPARATOR);
      } else {
        expect(children).toHaveLength(1);
      }
    }
  });

  it('renders the separator after a current or disabled span too - placement is by position, not by kind', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [
          { label: 'A', href: '/a', current: true },
          { label: 'B', disabled: true },
          { label: 'C', href: '/c' },
        ],
      },
    });

    expect(items(wrapper)[0].element.children[1].className).toBe('vf-breadcrumbs__separator');
    expect(items(wrapper)[1].element.children[1].className).toBe('vf-breadcrumbs__separator');
    expect(items(wrapper)[2].element.children).toHaveLength(1);
  });

  it('the separator slot replaces the content of the owned wrapper, which keeps its class and aria-hidden', () => {
    const wrapper = mountBreadcrumbs({ props: { items: trail }, slots: { separator: () => '/' } });

    expect(separators(wrapper).map((separator) => separator.element.outerHTML)).toEqual([
      '<span class="vf-breadcrumbs__separator" aria-hidden="true">/</span>',
      '<span class="vf-breadcrumbs__separator" aria-hidden="true">/</span>',
    ]);
    expect(wrapper.findAll('.vf-icon')).toHaveLength(0);
  });

  it('scopes the separator slot with the item and its index', () => {
    const scopes: unknown[] = [];
    mountBreadcrumbs({
      props: { items: trail },
      slots: {
        separator: (scope: Record<string, unknown>) => {
          scopes.push({ keys: Object.keys(scope).sort(), item: scope.item, index: scope.index });
          return '';
        },
      },
    });

    expect(scopes).toEqual([
      { keys: ['index', 'item'], item: trail[0], index: 0 },
      { keys: ['index', 'item'], item: trail[1], index: 1 },
    ]);
  });

  it('renders interactive slot content inside the aria-hidden wrapper, where it is still focusable', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: trail },
      slots: { separator: () => h('button', { type: 'button' }, 'x') },
      attachTo: document.body,
    });
    const button = wrapper.find('.vf-breadcrumbs__separator > button');

    expect(button.exists()).toBe(true);
    expect(button.element.closest('[aria-hidden="true"]')).not.toBeNull();
    (button.element as HTMLElement).focus();
    expect(document.activeElement).toBe(button.element);
    wrapper.unmount();
  });
});

// ------------------------------------------------------------ focusability

describe('VfBreadcrumbs characterization: focus', () => {
  it('every anchor takes focus, and no span does', () => {
    const wrapper = mountBreadcrumbs({
      props: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Section' },
          { label: 'Leaf' },
        ],
      },
      attachTo: document.body,
    });

    for (const link of links(wrapper)) {
      (link.element as HTMLElement).focus();
      expect(document.activeElement).toBe(link.element);
    }
    for (const current of currents(wrapper)) {
      (current.element as HTMLElement).focus();
      expect(document.activeElement).not.toBe(current.element);
    }
    wrapper.unmount();
  });

  it('the unresolved router element is not focusable', () => {
    const wrapper = mountBreadcrumbs({
      props: { items: [{ label: 'Home', to: '/' }, { label: 'Leaf' }] },
      attachTo: document.body,
    });
    const element = itemNode(wrapper, 0) as HTMLElement;

    element.focus();
    expect(document.activeElement).not.toBe(element);
    wrapper.unmount();
  });
});
