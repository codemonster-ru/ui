// Characterization of the historical VfLink at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The M25 component, and the first migrated one whose rendered element is a
// native link. It has two rendering branches and this suite pins both, but
// they are not two halves of one cross-platform contract:
//
//   - the native branch renders an `<a>` and is the whole of what a second
//     platform has to reproduce: the class list, where a consumer's attrs land,
//     and one derivation - `rel` defaults to `noopener noreferrer` when
//     `target` is `_blank` and nothing else;
//   - the router branch is a *handoff*. When `to` is set the component resolves
//     whatever is registered as `RouterLink` (or the `component` prop) and hands
//     it `to`, `target`, `rel`, the class list, every attr and the default
//     slot. It never imports vue-router, never resolves an href, never matches
//     a route, never writes an active class or aria-current, never intercepts a
//     click. All of that belongs to the component it resolved - and with
//     nothing registered under that name, Vue renders a literal unresolved
//     `<RouterLink>` element, which is not a link at all. That is the
//     historical behaviour and it is pinned here as such: no fallback to `<a>`,
//     no throw, no router detection.
//
// Three details are historical and easy to "fix" by accident:
//
//   - `to` wins over `href`, and `href` is then discarded entirely: it is not
//     forwarded to the router component either;
//   - an anchor with no destination at all is still an `<a>`, with no `href`,
//     no `role`, no `tabindex`. It is not focusable and exposes nothing;
//   - the class attribute is `vf-link`, then the modifiers, then the consumer's
//     class - the consumer class is merged last, not first.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, markRaw, type PropType } from 'vue';
import { describe, expect, it } from 'vitest';

import VfLink from './VfLink.vue';

type LinkProps = InstanceType<typeof VfLink>['$props'];

function mountLink({
  props = {},
  attrs = {},
  slots = { default: 'Docs' },
  global = {},
  attachTo,
}: {
  props?: Partial<LinkProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  global?: Record<string, unknown>;
  attachTo?: Element;
} = {}) {
  return mount(VfLink, { props: props as LinkProps, attrs, slots: slots as never, global, attachTo });
}

async function ssrLink(props: Record<string, unknown> = {}, slot = 'Docs') {
  const app = createSSRApp({ render: () => h(VfLink, props, { default: () => slot }) });

  return await renderToString(app);
}

/**
 * A stand-in for a router's link component, recording exactly what it was
 * handed. It renders an anchor so the handoff is observable in the DOM, but
 * nothing about it is vue-router: the reference never installs one, and the
 * shipped test at fd793696 stubs RouterLink the same way.
 */
const RecordingRouterLink = defineComponent({
  name: 'RouterLink',
  inheritAttrs: false,
  props: { to: { type: [String, Object] as PropType<string | Record<string, unknown>>, required: true } },
  setup(props, { attrs, slots }) {
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

const received = (wrapper: ReturnType<typeof mountLink>) =>
  JSON.parse(wrapper.attributes('data-received-attrs') ?? '{}') as Record<string, unknown>;

describe('VfLink characterization: native branch', () => {
  it('renders a native anchor carrying href, with the slot as its content and nothing wrapped', () => {
    const link = mountLink({ props: { href: '/docs' } });

    expect(link.element.tagName).toBe('A');
    expect(link.attributes('href')).toBe('/docs');
    expect(link.classes()).toEqual(['vf-link']);
    expect(link.element.children).toHaveLength(0);
    expect(link.text()).toBe('Docs');
  });

  it('renders exactly this markup on the server', async () => {
    expect(await ssrLink({ href: '/docs' })).toBe('<a href="/docs" class="vf-link"><!--[-->Docs<!--]--></a>');
  });

  it('keeps an empty-string href as a present, empty attribute', () => {
    const link = mountLink({ props: { href: '' } });

    expect(link.element.hasAttribute('href')).toBe(true);
    expect(link.attributes('href')).toBe('');
  });

  it('renders an anchor with no destination when neither href nor to is given', () => {
    // Not a span, not a button, and not an anchor given a placeholder. No
    // href, no role, no tabindex: the element is inert and exposes nothing.
    const link = mountLink();

    expect(link.element.tagName).toBe('A');
    expect(link.element.hasAttribute('href')).toBe(false);
    expect(link.element.hasAttribute('role')).toBe(false);
    expect(link.element.hasAttribute('tabindex')).toBe(false);
    expect(link.html()).toBe('<a class="vf-link">Docs</a>');
  });

  it('renders the no-destination anchor the same way on the server', async () => {
    expect(await ssrLink()).toBe('<a class="vf-link"><!--[-->Docs<!--]--></a>');
  });

  it('is focusable with an href and not without one', () => {
    const withHref = mountLink({ props: { href: '/docs' }, attachTo: document.body });
    (withHref.element as HTMLElement).focus();
    expect(document.activeElement).toBe(withHref.element);
    withHref.unmount();

    const withEmptyHref = mountLink({ props: { href: '' }, attachTo: document.body });
    (withEmptyHref.element as HTMLElement).focus();
    expect(document.activeElement).toBe(withEmptyHref.element);
    withEmptyHref.unmount();

    const without = mountLink({ attachTo: document.body });
    (without.element as HTMLElement).focus();
    expect(document.activeElement).not.toBe(without.element);
    without.unmount();
  });

  it('renders an empty anchor when the slot renders nothing', () => {
    const link = mountLink({ props: { href: '/docs' }, slots: {} });

    expect(link.html()).toBe('<a href="/docs" class="vf-link"></a>');
  });

  it('renders consumer content verbatim, including consumer controls, and owns none of them', () => {
    const link = mountLink({
      props: { href: '/docs' },
      slots: { default: '<span class="consumer-label">Docs</span><button type="button">B</button>' },
    });

    expect(link.html()).toBe(
      '<a href="/docs" class="vf-link"><span class="consumer-label">Docs</span><button type="button">B</button></a>',
    );
    expect(link.findAll('button')).toHaveLength(1);
  });

  it('declares no emits and forwards a click listener to the anchor as a native listener', async () => {
    // A consumer's @click is an attr, not an emit: it lands on the anchor and
    // fires with the native event. The component declares nothing itself.
    const events: string[] = [];
    const link = mountLink({
      props: { href: '/docs' },
      attrs: {
        onClick: (event: MouseEvent) => {
          event.preventDefault();
          events.push(event.type);
        },
      },
    });

    expect((VfLink as unknown as { emits?: unknown }).emits).toBeUndefined();
    await link.trigger('click');
    expect(events).toEqual(['click']);
  });
});

describe('VfLink characterization: rel derivation', () => {
  it('derives rel="noopener noreferrer" for target="_blank" when no rel is given', () => {
    const link = mountLink({ props: { href: 'https://example.com', target: '_blank' } });

    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
  });

  it('lets an explicit rel win over the derived one, without merging', () => {
    const link = mountLink({ props: { href: 'https://example.com', target: '_blank', rel: 'nofollow' } });

    expect(link.attributes('rel')).toBe('nofollow');
  });

  it('derives nothing for any other target', () => {
    for (const target of ['_self', '_parent', '_top', 'preview']) {
      const link = mountLink({ props: { href: '/docs', target } });

      expect(link.attributes('target')).toBe(target);
      expect(link.element.hasAttribute('rel')).toBe(false);
    }
  });

  it('writes an explicit rel with no target at all', () => {
    const link = mountLink({ props: { href: '/docs', rel: 'me' } });

    expect(link.attributes('rel')).toBe('me');
    expect(link.element.hasAttribute('target')).toBe(false);
  });

  it('writes neither target nor rel by default', () => {
    const link = mountLink({ props: { href: '/docs' } });

    expect(link.element.hasAttribute('target')).toBe(false);
    expect(link.element.hasAttribute('rel')).toBe(false);
  });

  it('treats an empty-string rel as absent, so the derivation still applies', () => {
    // `props.rel` is tested for truthiness: '' does not win over the default.
    const link = mountLink({ props: { href: 'https://example.com', target: '_blank', rel: '' } });

    expect(link.attributes('rel')).toBe('noopener noreferrer');
  });
});

describe('VfLink characterization: modifiers', () => {
  it('emits no modifier at the defaults: underline none, tone default', () => {
    expect(mountLink({ props: { href: '/docs', underline: 'none', tone: 'default' } }).classes()).toEqual(['vf-link']);
  });

  it('emits vf-link--underline-hover for underline="hover"', () => {
    expect(mountLink({ props: { href: '/docs', underline: 'hover' } }).classes()).toEqual([
      'vf-link',
      'vf-link--underline-hover',
    ]);
  });

  it('emits vf-link--underline-always for underline="always"', () => {
    expect(mountLink({ props: { href: '/docs', underline: 'always' } }).classes()).toEqual([
      'vf-link',
      'vf-link--underline-always',
    ]);
  });

  it('emits vf-link--muted for tone="muted"', () => {
    expect(mountLink({ props: { href: '/docs', tone: 'muted' } }).classes()).toEqual(['vf-link', 'vf-link--muted']);
  });

  it('orders the underline modifier before the tone modifier', () => {
    expect(mountLink({ props: { href: '/docs', underline: 'always', tone: 'muted' } }).classes()).toEqual([
      'vf-link',
      'vf-link--underline-always',
      'vf-link--muted',
    ]);
  });

  it('applies the modifiers to the no-destination anchor too', () => {
    expect(mountLink({ props: { underline: 'hover', tone: 'muted' } }).classes()).toEqual([
      'vf-link',
      'vf-link--underline-hover',
      'vf-link--muted',
    ]);
  });
});

describe('VfLink characterization: attrs on the native anchor', () => {
  it('merges a consumer class after the canonical classes', () => {
    const link = mountLink({ props: { href: '/docs', underline: 'hover' }, attrs: { class: 'consumer-link' } });

    expect(link.attributes('class')).toBe('vf-link vf-link--underline-hover consumer-link');
  });

  it('merges a consumer class after vf-link at the defaults', () => {
    expect(mountLink({ props: { href: '/docs' }, attrs: { class: 'consumer-link' } }).attributes('class')).toBe(
      'vf-link consumer-link',
    );
  });

  it('forwards style, id and data-* to the anchor', () => {
    const link = mountLink({
      props: { href: '/docs' },
      attrs: { style: 'opacity: 0.6', id: 'docs-link', 'data-testid': 'docs' },
    });

    expect(link.attributes('style')).toBe('opacity: 0.6;');
    expect(link.attributes('id')).toBe('docs-link');
    expect(link.attributes('data-testid')).toBe('docs');
  });

  it('forwards ARIA attributes verbatim and writes none of its own', () => {
    const plain = mountLink({ props: { href: '/docs' } });
    expect([...plain.element.attributes].map((attribute) => attribute.name).sort()).toEqual(['class', 'href']);

    const link = mountLink({
      props: { href: '/docs' },
      attrs: { 'aria-label': 'Documentation', 'aria-current': 'page', 'aria-describedby': 'docs-hint' },
    });

    expect(link.attributes('aria-label')).toBe('Documentation');
    expect(link.attributes('aria-current')).toBe('page');
    expect(link.attributes('aria-describedby')).toBe('docs-hint');
  });

  it('lets a consumer role and tabindex land on the anchor', () => {
    // The component writes neither, so there is nothing for a consumer value to
    // override: it is simply written.
    const link = mountLink({ props: { href: '/docs' }, attrs: { role: 'button', tabindex: '-1' } });

    expect(link.attributes('role')).toBe('button');
    expect(link.attributes('tabindex')).toBe('-1');
  });

  it('forwards the native link attributes it has no prop for', () => {
    const link = mountLink({
      props: { href: '/report.pdf' },
      attrs: {
        download: 'report.pdf',
        hreflang: 'en',
        referrerpolicy: 'no-referrer',
        type: 'application/pdf',
        title: 'Report',
      },
    });

    expect(link.attributes('download')).toBe('report.pdf');
    expect(link.attributes('hreflang')).toBe('en');
    expect(link.attributes('referrerpolicy')).toBe('no-referrer');
    expect(link.attributes('type')).toBe('application/pdf');
    expect(link.attributes('title')).toBe('Report');
  });

  it('writes the link props after the attrs, so href, target and rel are the props', () => {
    // The spread order is attrs first, link props second. A consumer cannot
    // reach the three from attrs anyway - they are declared props - but the
    // order is what makes the class merge below land last as well.
    const link = mountLink({
      props: { href: '/docs', target: '_blank' },
      attrs: { class: 'c', 'data-order': 'x' },
    });

    expect(link.attributes('href')).toBe('/docs');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(link.attributes('class')).toBe('vf-link c');
  });
});

describe('VfLink characterization: router branch', () => {
  it('renders a literal unresolved RouterLink element when nothing is registered under that name', () => {
    // No vue-router is installed in the reference and none is resolved here:
    // resolveDynamicComponent falls through to the string and Vue renders an
    // unknown element. It is not an anchor, has no href and is not a link.
    const link = mountLink({ props: { to: '/docs' } });

    expect(link.element.tagName).toBe('ROUTERLINK');
    expect(link.attributes('to')).toBe('/docs');
    expect(link.attributes('class')).toBe('vf-link');
    expect(link.element.hasAttribute('href')).toBe(false);
    expect(link.text()).toBe('Docs');
  });

  it('renders the unresolved element the same way on the server', async () => {
    expect(await ssrLink({ to: '/docs' })).toBe(
      '<RouterLink to="/docs" class="vf-link"><!--[-->Docs<!--]--></RouterLink>',
    );
  });

  it('serialises an object destination as [object Object] on the unresolved element and drops it on the server', async () => {
    // What an unknown element does with an object attribute. The component
    // does not serialise, interpret or convert the object: this is the DOM's
    // own stringification, pinned so a "helpful" JSON encoding is a regression.
    const link = mountLink({ props: { to: { name: 'docs', params: { id: 1 } } } });

    expect(link.element.tagName).toBe('ROUTERLINK');
    expect(link.attributes('to')).toBe('[object Object]');
    expect(await ssrLink({ to: { name: 'docs' } })).toBe(
      '<RouterLink class="vf-link"><!--[-->Docs<!--]--></RouterLink>',
    );
  });

  it('hands a registered RouterLink the destination, the link props, the classes, the attrs and the slot', () => {
    const link = mountLink({
      props: { to: '/docs', target: '_blank', underline: 'hover' },
      attrs: { class: 'consumer-link', id: 'docs', 'aria-current': 'page', 'data-testid': 'docs', onClick: () => {} },
      global: { components: { RouterLink: RecordingRouterLink } },
    });

    expect(link.element.tagName).toBe('A');
    expect(link.attributes('data-received-to')).toBe('/docs');
    expect(received(link)).toEqual({
      class: 'vf-link vf-link--underline-hover consumer-link',
      id: 'docs',
      'aria-current': 'page',
      'data-testid': 'docs',
      onClick: 'fn',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    expect(link.text()).toBe('Docs');
  });

  it('passes an object destination through untouched', () => {
    const to = { name: 'docs', params: { id: 1 }, query: { tab: 'api' } };
    const link = mountLink({ props: { to }, global: { components: { RouterLink: RecordingRouterLink } } });

    expect(JSON.parse(link.attributes('data-received-to') ?? 'null')).toEqual(to);
  });

  it('prefers to over href and discards href entirely', () => {
    const link = mountLink({
      props: { to: '/router', href: '/native' },
      global: { components: { RouterLink: RecordingRouterLink } },
    });

    expect(link.attributes('data-received-to')).toBe('/router');
    expect(received(link)).not.toHaveProperty('href');
    expect(link.attributes('href')).toBeUndefined();
  });

  it('discards href on the unresolved element as well', () => {
    const link = mountLink({ props: { to: '/router', href: '/native' } });

    expect(link.element.tagName).toBe('ROUTERLINK');
    expect(link.element.hasAttribute('href')).toBe(false);
  });

  it('hands the derived rel and no target to the router component exactly as it would to an anchor', () => {
    const blank = mountLink({
      props: { to: '/docs', target: '_blank' },
      global: { components: { RouterLink: RecordingRouterLink } },
    });
    expect(received(blank)).toMatchObject({ target: '_blank', rel: 'noopener noreferrer' });

    const explicit = mountLink({
      props: { to: '/docs', target: '_blank', rel: 'nofollow' },
      global: { components: { RouterLink: RecordingRouterLink } },
    });
    expect(received(explicit)).toMatchObject({ rel: 'nofollow' });

    const plain = mountLink({ props: { to: '/docs' }, global: { components: { RouterLink: RecordingRouterLink } } });
    expect(received(plain)).not.toHaveProperty('target');
    expect(received(plain)).not.toHaveProperty('rel');
  });

  it('uses the component prop instead of RouterLink when both to and component are given', () => {
    // markRaw because the component object travels through a reactive prop;
    // the warning it avoids is about the test's plumbing, not the contract.
    const Custom = markRaw(
      defineComponent({
        name: 'CustomLink',
        inheritAttrs: false,
        props: { to: { type: [String, Object], required: true } },
        setup(props, { attrs, slots }) {
          return () =>
            h('span', { 'data-custom-to': String(props.to), 'data-custom-class': attrs.class }, slots.default?.());
        },
      }),
    );
    const link = mountLink({
      props: { to: '/docs', component: Custom, tone: 'muted' },
      global: { components: { RouterLink: RecordingRouterLink } },
    });

    expect(link.element.tagName).toBe('SPAN');
    expect(link.attributes('data-custom-to')).toBe('/docs');
    expect(link.attributes('data-custom-class')).toBe('vf-link vf-link--muted');
  });

  it('renders a string component as that element, with to written as a plain attribute', () => {
    // Garbage in: `component="a"` gives an anchor with `to` and no href. The
    // component does not translate one into the other.
    const link = mountLink({ props: { to: '/docs', component: 'a' } });

    expect(link.html()).toBe('<a to="/docs" class="vf-link">Docs</a>');
  });

  it('ignores the component prop entirely in the native branch', () => {
    const link = mountLink({
      props: { href: '/docs', component: 'span' },
      global: { components: { RouterLink: RecordingRouterLink } },
    });

    expect(link.element.tagName).toBe('A');
    expect(link.attributes('href')).toBe('/docs');
  });

  it('never resolves RouterLink while to is undefined, even when one is registered', () => {
    const link = mountLink({ props: { href: '/docs' }, global: { components: { RouterLink: RecordingRouterLink } } });

    expect(link.element.hasAttribute('data-received-to')).toBe(false);
    expect(link.attributes('href')).toBe('/docs');
  });
});

describe('VfLink characterization: public API', () => {
  it('declares exactly the seven historical props with their defaults', () => {
    const declared = (VfLink as unknown as { props: Record<string, { default?: unknown }> }).props;

    expect(Object.keys(declared).sort()).toEqual(['component', 'href', 'rel', 'target', 'to', 'tone', 'underline']);
    expect(declared.underline.default).toBe('none');
    expect(declared.tone.default).toBe('default');
    for (const name of ['href', 'to', 'target', 'rel', 'component']) {
      expect(declared[name].default, name).toBeUndefined();
    }
  });

  it('does not import or depend on vue-router', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const source = readFileSync(resolve(__dirname, 'VfLink.vue'), 'utf8');

    expect(source).not.toContain('vue-router');
    expect(source).toContain("resolveDynamicComponent('RouterLink')");
  });
});
