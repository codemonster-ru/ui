// Characterization of the historical VfCard at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The slot-heavy surface of the M16 batch, selected over VfPanel by the
// Card-vs-Panel gate. Three slots, two props, and no interaction of its own:
// everything a user can operate inside a card was put there by the consumer.
// That distinction is what section 23 of the M16 plan is about, and it is the
// reason this component is in the batch at all.
//
// Five behaviours here are historical and none of them are visible in a
// rendered card:
//
//   - the `<header>` and `<footer>` wrappers carry no class. Only the fallback
//     heading and the body wrapper are classed. Adding `vf-card__header` would
//     read better, be trivially stylable, and be a product change;
//   - `title` is tested for truthiness, so `title=""` renders no header at all
//     rather than an empty one;
//   - the fallback `<h3>` is slot fallback content, so a header slot removes it
//     even when a title was also passed. The title is then silently ignored;
//   - the body and footer wrappers are keyed on the *presence* of a slot, not
//     on what it renders, so a slot producing nothing still emits an empty
//     wrapper - visible as a gap in the flex column;
//   - `v-bind="attrs"` follows `:class`, so a consumer class is appended after
//     the canonical ones and a consumer may put any role on the section.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfCard from './VfCard.vue';

type CardProps = InstanceType<typeof VfCard>['$props'];

function mountCard({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<CardProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfCard, { props: props as CardProps, attrs, slots: slots as never });
}

async function ssrCard(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfCard, props, slots as never) });

  return await renderToString(app);
}

/** The child element tags of the card root, in document order. */
function regionsOf(wrapper: ReturnType<typeof mountCard>): string[] {
  return [...wrapper.element.children].map((child) => child.tagName.toLowerCase());
}

describe('VfCard characterization: structure', () => {
  it('renders a section root', () => {
    // Not a div and not an article. A section has a landmark role only when it
    // is named, which this one never is - see the ARIA block below.
    expect(mountCard().element.tagName).toBe('SECTION');
  });

  it('renders an empty section when nothing is passed', () => {
    const card = mountCard();

    expect(card.classes()).toEqual(['vf-card']);
    expect(regionsOf(card)).toEqual([]);
  });

  it('renders header, body and footer in that order', () => {
    const card = mountCard({
      props: { title: 'Workspace' },
      slots: { default: 'Body', footer: 'Footer' },
    });

    expect(regionsOf(card)).toEqual(['header', 'div', 'footer']);
  });

  it('emits no events', () => {
    expect(Object.keys(mountCard().emitted())).toEqual([]);
  });

  it('renders no interactive element of its own in any configuration', () => {
    // The component-owned half of the static contract. Whatever a consumer
    // puts in a slot is the consumer's; the card itself never adds a control.
    const card = mountCard({
      props: { title: 'Workspace', compact: true },
      slots: { default: 'Body', footer: 'Footer' },
    });

    expect(card.findAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0);
  });
});

describe('VfCard characterization: props and defaults', () => {
  it('accepts exactly two props', () => {
    expect(Object.keys(mountCard({ props: { title: 'T' } }).props() as Record<string, unknown>).sort()).toEqual([
      'compact',
      'title',
    ]);
  });

  it('defaults compact to false and title to undefined', () => {
    expect(mountCard().props('compact')).toBe(false);
    expect(mountCard().props('title')).toBeUndefined();
  });
});

describe('VfCard characterization: classes', () => {
  it('emits no modifier at the default', () => {
    expect(mountCard().classes()).toEqual(['vf-card']);
  });

  it('emits the compact modifier', () => {
    expect(mountCard({ props: { compact: true } }).classes()).toEqual(['vf-card', 'vf-card--compact']);
  });

  it('appends a caller class after the canonical classes', () => {
    expect(mountCard({ props: { compact: true }, attrs: { class: 'mine' } }).classes()).toEqual([
      'vf-card',
      'vf-card--compact',
      'mine',
    ]);
  });
});

describe('VfCard characterization: the header region', () => {
  it('renders an unclassed header element', () => {
    // The quirk a reviewer would "fix" first. There is no vf-card__header.
    const header = mountCard({ props: { title: 'Workspace' } }).find('header');

    expect(header.exists()).toBe(true);
    expect(header.attributes('class')).toBeUndefined();
  });

  it('renders the title inside a classed h3', () => {
    const title = mountCard({ props: { title: 'Workspace' } }).find('h3');

    expect(title.classes()).toEqual(['vf-card__title']);
    expect(title.text()).toBe('Workspace');
  });

  it('renders no header when there is neither a title nor a header slot', () => {
    expect(
      mountCard({ slots: { default: 'Body' } })
        .find('header')
        .exists(),
    ).toBe(false);
  });

  it('renders no header for an empty-string title', () => {
    // Falsy, so it reads as no title at all. An empty header would be the
    // charitable reading and is not what happens.
    expect(
      mountCard({ props: { title: '' } })
        .find('header')
        .exists(),
    ).toBe(false);
  });

  it('opens the header on a header slot alone, with no title', () => {
    const card = mountCard({ slots: { header: '<span class="mine">Custom</span>' } });

    expect(card.find('header .mine').exists()).toBe(true);
    expect(card.find('h3').exists()).toBe(false);
  });

  it('drops the fallback heading when a header slot exists, even with a title', () => {
    // The title is silently unused. Rendering both would be the obvious
    // improvement and would change what every existing consumer sees.
    const card = mountCard({ props: { title: 'Workspace' }, slots: { header: 'Custom' } });

    expect(card.find('h3').exists()).toBe(false);
    expect(card.text()).toBe('Custom');
    expect(card.text()).not.toContain('Workspace');
  });

  it('brings the fallback heading back when the header slot renders nothing', () => {
    // The subtlest rule in the batch, and the reason the header wrapper and the
    // fallback heading are two separate questions rather than one. `<slot>`
    // falls back whenever its content yields no vnodes, so a consumer writing
    // `<template #header><b v-if="false"/></template>` gets the h3 back.
    const card = mountCard({ props: { title: 'Workspace' }, slots: { header: () => null } });

    expect(card.find('header').exists()).toBe(true);
    expect(card.find('h3.vf-card__title').text()).toBe('Workspace');
  });

  it('renders an empty h3 when an empty header slot meets no title', () => {
    // The wrapper opens because a header slot was passed; the heading appears
    // because that slot produced nothing; and there is no title to put in it.
    const card = mountCard({ slots: { header: () => null } });

    expect(card.find('header h3.vf-card__title').exists()).toBe(true);
    expect(card.find('h3').text()).toBe('');
  });

  it('escapes a hostile title as interpolated content', () => {
    const card = mountCard({ props: { title: '<img src=x onerror=alert(1)>' } });

    expect(card.find('h3').element.children.length).toBe(0);
    expect(card.html()).toContain('&lt;img');
  });
});

describe('VfCard characterization: the body region', () => {
  it('renders a classed div wrapper for the default slot', () => {
    // The one wrapper that is classed. header and footer are not.
    const body = mountCard({ slots: { default: 'Body' } }).find('div');

    expect(body.classes()).toEqual(['vf-card__body']);
    expect(body.text()).toBe('Body');
  });

  it('renders no body wrapper when there is no default slot', () => {
    expect(
      mountCard({ props: { title: 'Workspace' } })
        .find('.vf-card__body')
        .exists(),
    ).toBe(false);
  });

  it('renders an empty body wrapper when the default slot renders nothing', () => {
    // Keyed on the slot existing, not on its output. The empty div still takes
    // a row in the flex column and still contributes the column gap.
    const card = mountCard({ slots: { default: '' } });

    expect(card.find('.vf-card__body').exists()).toBe(true);
    expect(card.find('.vf-card__body').text()).toBe('');
  });

  it('renders arbitrary consumer markup inside the body unchanged', () => {
    const card = mountCard({ slots: { default: '<p class="mine">Paragraph</p>' } });

    expect(card.find('.vf-card__body > p.mine').exists()).toBe(true);
  });

  it('renders a consumer-provided interactive control inside the body', () => {
    // The component owns no interaction; the consumer may own plenty. This is
    // the fixture the static slot-ownership review is built on.
    const card = mountCard({ slots: { default: '<button type="button">Rename</button>' } });

    expect(card.find('.vf-card__body > button').exists()).toBe(true);
  });
});

describe('VfCard characterization: the footer region', () => {
  it('renders an unclassed footer element', () => {
    const footer = mountCard({ slots: { footer: 'Footer' } }).find('footer');

    expect(footer.exists()).toBe(true);
    expect(footer.attributes('class')).toBeUndefined();
  });

  it('has no prop that opens the footer', () => {
    // Unlike the header, which `title` can open on its own.
    expect(
      mountCard({ props: { title: 'Workspace', compact: true } })
        .find('footer')
        .exists(),
    ).toBe(false);
  });

  it('renders an empty footer when the footer slot renders nothing', () => {
    const card = mountCard({ slots: { footer: '' } });

    expect(card.find('footer').exists()).toBe(true);
    expect(card.find('footer').text()).toBe('');
  });

  it('renders a footer with no header and no body', () => {
    // The three regions are independent, not ordered gates.
    const card = mountCard({ slots: { footer: 'Footer' } });

    expect(regionsOf(card)).toEqual(['footer']);
  });
});

describe('VfCard characterization: slot combinations', () => {
  it('renders body and footer with no header', () => {
    expect(regionsOf(mountCard({ slots: { default: 'B', footer: 'F' } }))).toEqual(['div', 'footer']);
  });

  it('renders header and footer with no body', () => {
    expect(regionsOf(mountCard({ props: { title: 'T' }, slots: { footer: 'F' } }))).toEqual(['header', 'footer']);
  });

  it('renders header and body with no footer', () => {
    expect(regionsOf(mountCard({ props: { title: 'T' }, slots: { default: 'B' } }))).toEqual(['header', 'div']);
  });

  it('ignores named slots it does not declare', () => {
    expect(regionsOf(mountCard({ slots: { aside: 'NOPE' } }))).toEqual([]);
  });
});

describe('VfCard characterization: ARIA and attrs', () => {
  it('writes no role and no accessible name of its own', () => {
    // A section with no accessible name exposes no landmark role. Naming it -
    // aria-labelledby pointing at the title, say - would add a landmark to
    // every card in every existing application.
    const card = mountCard({ props: { title: 'Workspace' } });

    expect(card.attributes('role')).toBeUndefined();
    expect(card.attributes('aria-label')).toBeUndefined();
    expect(card.attributes('aria-labelledby')).toBeUndefined();
  });

  it('gives the title element no id for anything to point at', () => {
    expect(
      mountCard({ props: { title: 'Workspace' } })
        .find('h3')
        .attributes('id'),
    ).toBeUndefined();
  });

  it('lets a consumer put a role and a name on the section', () => {
    const card = mountCard({ attrs: { role: 'region', 'aria-label': 'Workspace' } });

    expect(card.attributes('role')).toBe('region');
    expect(card.attributes('aria-label')).toBe('Workspace');
  });

  it('forwards style, data and id attributes to the root', () => {
    const card = mountCard({ attrs: { style: 'opacity: 0.5', 'data-testid': 'card', id: 'c1' } });

    expect(card.attributes('style')).toBe('opacity: 0.5;');
    expect(card.attributes('data-testid')).toBe('card');
    expect(card.attributes('id')).toBe('c1');
  });

  it('does not leak attrs onto any region wrapper', () => {
    const card = mountCard({ slots: { default: 'B', footer: 'F' }, attrs: { 'data-testid': 'card' } });

    expect(card.find('.vf-card__body').attributes('data-testid')).toBeUndefined();
    expect(card.find('footer').attributes('data-testid')).toBeUndefined();
  });
});

describe('VfCard characterization: SSR', () => {
  it('renders an empty card server-side', async () => {
    expect(await ssrCard()).toBe('<section class="vf-card"><!--v-if--><!--v-if--><!--v-if--></section>');
  });

  it('renders the full composition server-side', async () => {
    const html = await ssrCard({ title: 'Workspace', compact: true }, { default: () => 'B', footer: () => 'F' });

    expect(html).toContain('<section class="vf-card vf-card--compact">');
    expect(html).toContain('<header>');
    expect(html).toContain('<h3 class="vf-card__title">Workspace</h3>');
    expect(html).toContain('<div class="vf-card__body">');
    expect(html).toContain('<footer>');
  });

  it('renders no header for an empty-string title server-side', async () => {
    expect(await ssrCard({ title: '' })).not.toContain('<header>');
  });

  it('escapes a hostile title server-side', async () => {
    expect(await ssrCard({ title: '<b>t</b>' })).toContain('&lt;b&gt;t&lt;/b&gt;');
  });

  it('escapes hostile attribute values', async () => {
    expect(await ssrCard({ 'data-x': 'a"b<c&d' })).toContain('data-x="a&quot;b&lt;c&amp;d"');
  });
});
