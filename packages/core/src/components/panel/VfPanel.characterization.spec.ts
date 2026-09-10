// Characterization of the historical VfPanel at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The M18 component, and the nearest structural neighbour VfCard has: same
// `<section>` root, same conditional unclassed `<header>`, same `title` prop
// falling back to an `h3`. This suite exists to pin the panel's own contract,
// not to restate the card's, so the assertions that matter most here are the
// ones about what a panel does *differently*:
//
//   - the default slot has no wrapper and no condition. It renders straight
//     into the section as direct children. There is no `div.vf-panel__body`,
//     and an empty default slot emits nothing at all - where an empty card body
//     emits an empty div that still holds a row and a column gap open;
//   - there is no footer. A `footer` slot handed to a panel is silently
//     ignored, exactly as any other undeclared slot is;
//   - the modifier is `subtle`, not `compact`, and it is a different product:
//     it repaints the background and drops the shadow rather than tightening
//     the padding.
//
// Three behaviours are historical and shared in *form* with the card, and are
// pinned here independently rather than by pointing at the card's suite:
//
//   - the `<header>` wrapper carries no class. Only the fallback heading is
//     classed. Adding `vf-panel__header` would read better and be a product
//     change;
//   - `title` is tested for truthiness, so `title=""` renders no header at all
//     rather than an empty one;
//   - the fallback `<h3>` is slot fallback content, so a header slot removes it
//     even when a title was also passed - and a header slot that renders
//     nothing brings it back.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfPanel from './VfPanel.vue';

type PanelProps = InstanceType<typeof VfPanel>['$props'];

function mountPanel({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<PanelProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfPanel, { props: props as PanelProps, attrs, slots: slots as never });
}

async function ssrPanel(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfPanel, props, slots as never) });

  return await renderToString(app);
}

/** The child element tags of the panel root, in document order. */
function childrenOf(wrapper: ReturnType<typeof mountPanel>): string[] {
  return [...wrapper.element.children].map((child) => child.tagName.toLowerCase());
}

describe('VfPanel characterization: structure', () => {
  it('renders a section root', () => {
    // Not a div and not an article. A section has a landmark role only when it
    // is named, which this one never is - see the ARIA block below.
    expect(mountPanel().element.tagName).toBe('SECTION');
  });

  it('renders an empty section when nothing is passed', () => {
    const panel = mountPanel();

    expect(panel.classes()).toEqual(['vf-panel']);
    expect(childrenOf(panel)).toEqual([]);
  });

  it('renders the header first and the default slot after it', () => {
    const panel = mountPanel({ props: { title: 'Workspace' }, slots: { default: '<p>Body</p>' } });

    expect(childrenOf(panel)).toEqual(['header', 'p']);
  });

  it('emits no events', () => {
    expect(Object.keys(mountPanel().emitted())).toEqual([]);
  });

  it('renders no interactive element of its own in any configuration', () => {
    // The component-owned half of the static contract. Whatever a consumer puts
    // in a slot is the consumer's; the panel itself never adds a control.
    const panel = mountPanel({
      props: { title: 'Workspace', subtle: true },
      slots: { default: 'Body', header: 'Custom' },
    });

    expect(panel.findAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0);
  });
});

describe('VfPanel characterization: props and defaults', () => {
  it('accepts exactly two props', () => {
    expect(Object.keys(mountPanel({ props: { title: 'T' } }).props() as Record<string, unknown>).sort()).toEqual([
      'subtle',
      'title',
    ]);
  });

  it('defaults subtle to false and title to undefined', () => {
    expect(mountPanel().props('subtle')).toBe(false);
    expect(mountPanel().props('title')).toBeUndefined();
  });

  it('has no compact prop', () => {
    // VfCard's modifier, and the one a Card-shaped substitution would bring
    // with it. A panel that accepted it would be answering the wrong contract.
    expect(mountPanel({ props: { title: 'T' } }).props()).not.toHaveProperty('compact');
  });
});

describe('VfPanel characterization: classes', () => {
  it('emits no modifier at the default', () => {
    expect(mountPanel().classes()).toEqual(['vf-panel']);
  });

  it('emits the subtle modifier', () => {
    expect(mountPanel({ props: { subtle: true } }).classes()).toEqual(['vf-panel', 'vf-panel--subtle']);
  });

  it('never emits a card block name', () => {
    // The substitution M18 exists to catch. A panel rendering vf-card classes
    // would look like a card, style like a card, and select like a card.
    for (const subtle of [false, true]) {
      expect(mountPanel({ props: { subtle } }).classes().join(' ')).not.toContain('vf-card');
    }
  });

  it('appends a caller class after the canonical classes', () => {
    expect(mountPanel({ props: { subtle: true }, attrs: { class: 'mine' } }).classes()).toEqual([
      'vf-panel',
      'vf-panel--subtle',
      'mine',
    ]);
  });
});

describe('VfPanel characterization: the header region', () => {
  it('renders an unclassed header element', () => {
    // The quirk a reviewer would "fix" first. There is no vf-panel__header.
    const header = mountPanel({ props: { title: 'Workspace' } }).find('header');

    expect(header.exists()).toBe(true);
    expect(header.attributes('class')).toBeUndefined();
  });

  it('renders the title inside a classed h3', () => {
    const title = mountPanel({ props: { title: 'Workspace' } }).find('h3');

    expect(title.classes()).toEqual(['vf-panel__title']);
    expect(title.text()).toBe('Workspace');
  });

  it('renders no header when there is neither a title nor a header slot', () => {
    expect(
      mountPanel({ slots: { default: 'Body' } })
        .find('header')
        .exists(),
    ).toBe(false);
  });

  it('renders no header for an empty-string title', () => {
    // Falsy, so it reads as no title at all. An empty header would be the
    // charitable reading and is not what happens.
    expect(
      mountPanel({ props: { title: '' } })
        .find('header')
        .exists(),
    ).toBe(false);
  });

  it('opens the header on a header slot alone, with no title', () => {
    const panel = mountPanel({ slots: { header: '<span class="mine">Custom</span>' } });

    expect(panel.find('header .mine').exists()).toBe(true);
    expect(panel.find('h3').exists()).toBe(false);
  });

  it('drops the fallback heading when a header slot exists, even with a title', () => {
    // The title is silently unused. Rendering both would be the obvious
    // improvement and would change what every existing consumer sees.
    const panel = mountPanel({ props: { title: 'Workspace' }, slots: { header: 'Custom' } });

    expect(panel.find('h3').exists()).toBe(false);
    expect(panel.text()).toBe('Custom');
    expect(panel.text()).not.toContain('Workspace');
  });

  it('brings the fallback heading back when the header slot renders nothing', () => {
    // The subtlest rule the panel shares with the card, and the reason the
    // header wrapper and the fallback heading are two separate questions rather
    // than one. `<slot>` falls back whenever its content yields no vnodes, so a
    // consumer writing `<template #header><b v-if="false"/></template>` gets
    // the h3 back.
    const panel = mountPanel({ props: { title: 'Workspace' }, slots: { header: () => null } });

    expect(panel.find('header').exists()).toBe(true);
    expect(panel.find('h3.vf-panel__title').text()).toBe('Workspace');
  });

  it('renders an empty h3 when an empty header slot meets no title', () => {
    // The wrapper opens because a header slot was passed; the heading appears
    // because that slot produced nothing; and there is no title to put in it.
    const panel = mountPanel({ slots: { header: () => null } });

    expect(panel.find('header h3.vf-panel__title').exists()).toBe(true);
    expect(panel.find('h3').text()).toBe('');
  });

  it('escapes a hostile title as interpolated content', () => {
    const panel = mountPanel({ props: { title: '<img src=x onerror=alert(1)>' } });

    expect(panel.find('h3').element.children.length).toBe(0);
    expect(panel.html()).toContain('&lt;img');
  });
});

describe('VfPanel characterization: the default slot', () => {
  it('renders default slot content as a direct child of the section', () => {
    // The sharpest structural difference from VfCard, and the one a Card-shaped
    // implementation gets wrong while looking identical. There is no wrapper.
    const panel = mountPanel({ slots: { default: '<p class="mine">Paragraph</p>' } });

    expect(panel.find('section > p.mine').exists()).toBe(true);
    expect(childrenOf(panel)).toEqual(['p']);
  });

  it('renders no body wrapper of any kind', () => {
    const panel = mountPanel({ slots: { default: 'Body' } });

    expect(panel.find('.vf-panel__body').exists()).toBe(false);
    expect(panel.find('.vf-card__body').exists()).toBe(false);
    expect(panel.find('div').exists()).toBe(false);
  });

  it('renders nothing at all for an empty default slot', () => {
    // A card emits an empty classed div here, which still takes a row and a
    // column gap in the flex layout. A panel emits nothing, because there is
    // no wrapper to emit and no condition that could have produced one.
    const panel = mountPanel({ slots: { default: '' } });

    expect(childrenOf(panel)).toEqual([]);
    expect(panel.element.textContent).toBe('');
  });

  it('renders several root-level nodes as siblings of the header', () => {
    const panel = mountPanel({
      props: { title: 'Workspace' },
      slots: { default: '<p>One</p><p>Two</p>' },
    });

    expect(childrenOf(panel)).toEqual(['header', 'p', 'p']);
  });

  it('renders a consumer-provided interactive control inside the section', () => {
    // The component owns no interaction; the consumer may own plenty. This is
    // the fixture the static slot-ownership review is built on, and the control
    // sits directly in the section because there is nothing to wrap it.
    const panel = mountPanel({ slots: { default: '<button type="button">Rename</button>' } });

    expect(panel.find('section > button').exists()).toBe(true);
  });
});

describe('VfPanel characterization: slots it does not have', () => {
  it('ignores a footer slot entirely', () => {
    // Not an empty footer: no footer element. VfCard renders one keyed on the
    // slot being present; a panel has no footer in its template at all, and a
    // Card-shaped implementation would grow one here.
    const panel = mountPanel({ props: { title: 'Workspace' }, slots: { footer: 'Footer' } });

    expect(panel.find('footer').exists()).toBe(false);
    expect(childrenOf(panel)).toEqual(['header']);
    expect(panel.text()).not.toContain('Footer');
  });

  it('ignores named slots it does not declare', () => {
    expect(childrenOf(mountPanel({ slots: { aside: 'NOPE' } }))).toEqual([]);
  });
});

describe('VfPanel characterization: ARIA and attrs', () => {
  it('writes no role and no accessible name of its own', () => {
    // A section with no accessible name exposes no landmark role. Naming it -
    // aria-labelledby pointing at the title, say - would add a landmark to
    // every panel in every existing application.
    const panel = mountPanel({ props: { title: 'Workspace' } });

    expect(panel.attributes('role')).toBeUndefined();
    expect(panel.attributes('aria-label')).toBeUndefined();
    expect(panel.attributes('aria-labelledby')).toBeUndefined();
  });

  it('gives the title element no id for anything to point at', () => {
    expect(
      mountPanel({ props: { title: 'Workspace' } })
        .find('h3')
        .attributes('id'),
    ).toBeUndefined();
  });

  it('lets a consumer put a role and a name on the section', () => {
    const panel = mountPanel({ attrs: { role: 'region', 'aria-label': 'Workspace' } });

    expect(panel.attributes('role')).toBe('region');
    expect(panel.attributes('aria-label')).toBe('Workspace');
  });

  it('forwards style, data and id attributes to the root', () => {
    const panel = mountPanel({ attrs: { style: 'opacity: 0.5', 'data-testid': 'panel', id: 'p1' } });

    expect(panel.attributes('style')).toBe('opacity: 0.5;');
    expect(panel.attributes('data-testid')).toBe('panel');
    expect(panel.attributes('id')).toBe('p1');
  });

  it('does not leak attrs onto the header or onto slot content', () => {
    const panel = mountPanel({
      props: { title: 'Workspace' },
      slots: { default: '<p>Body</p>' },
      attrs: { 'data-testid': 'panel' },
    });

    expect(panel.find('header').attributes('data-testid')).toBeUndefined();
    expect(panel.find('p').attributes('data-testid')).toBeUndefined();
  });
});

describe('VfPanel characterization: SSR', () => {
  it('renders an empty panel server-side', async () => {
    // Two anchors, not three: the header's v-if and the default slot's fragment
    // markers. A card emits three v-if anchors here, one per optional region.
    expect(await ssrPanel()).toBe('<section class="vf-panel"><!--v-if--><!--[--><!--]--></section>');
  });

  it('renders the full composition server-side', async () => {
    const html = await ssrPanel({ title: 'Workspace', subtle: true }, { default: () => 'B' });

    expect(html).toBe(
      '<section class="vf-panel vf-panel--subtle">' +
        '<header><!--[--><h3 class="vf-panel__title">Workspace</h3><!--]--></header>' +
        '<!--[-->B<!--]--></section>',
    );
  });

  it('renders no body wrapper server-side', async () => {
    const html = await ssrPanel({}, { default: () => 'B' });

    expect(html).not.toContain('__body');
    expect(html).not.toContain('<div');
  });

  it('renders no footer server-side even when a footer slot is passed', async () => {
    expect(await ssrPanel({ title: 'Workspace' }, { footer: () => 'F' })).not.toContain('<footer>');
  });

  it('renders no header for an empty-string title server-side', async () => {
    expect(await ssrPanel({ title: '' })).not.toContain('<header>');
  });

  it('escapes a hostile title server-side', async () => {
    expect(await ssrPanel({ title: '<b>t</b>' })).toContain('&lt;b&gt;t&lt;/b&gt;');
  });

  it('escapes hostile attribute values', async () => {
    expect(await ssrPanel({ 'data-x': 'a"b<c&d' })).toContain('data-x="a&quot;b&lt;c&amp;d"');
  });
});
