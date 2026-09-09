// Characterization of the historical VfBadge at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// Written before VfTag was looked at, and deliberately not shared with it. The
// two components are the closest pair in the catalog - both are a toned span
// with one prop and a default slot - which is exactly why their evidence is
// kept apart: a suite that covered both could not tell the difference between
// "Tag behaves correctly" and "Tag is Badge".
//
// What this one records that VfTag's does not: the `tone` prop is typed
// `VfBadgeTone`, a public type of its own, and the tone modifiers it emits
// belong to a stylesheet that varies background, border and colour. VfTag's
// vary border and colour only. The class lists look interchangeable; the
// components are not.
//
// The first surprise is the neutral tone: it emits no modifier class at all,
// so `neutral` is expressed by absence. That inverts the convention M14 pinned
// for VfCheckbox/VfRadio/VfSwitch, where the size modifier is always emitted
// including at the default. Both conventions are historical and both are kept.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfBadge from './VfBadge.vue';
import type { VfBadgeTone } from '@/types/components';

type BadgeProps = InstanceType<typeof VfBadge>['$props'];

/** Every literal the public `VfBadgeTone` union allows, in declaration order. */
const TONES: VfBadgeTone[] = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

const NON_NEUTRAL_TONES = TONES.filter((tone) => tone !== 'neutral');

function mountBadge({
  props = {},
  attrs = {},
  content = 'Draft',
}: {
  props?: Partial<BadgeProps>;
  attrs?: Record<string, unknown>;
  content?: string | null;
} = {}) {
  return mount(VfBadge, {
    props: props as BadgeProps,
    attrs,
    slots: content === null ? {} : { default: () => content },
  });
}

/** SSR is characterized separately because it is the output Razor is compared against. */
async function ssrBadge(props: Record<string, unknown> = {}, content: string | null = 'Draft') {
  const app = createSSRApp({
    render: () => h(VfBadge, props, content === null ? undefined : { default: () => content }),
  });

  return await renderToString(app);
}

describe('VfBadge characterization: structure', () => {
  it('renders a span as its root', () => {
    expect(mountBadge().element.tagName).toBe('SPAN');
  });

  it('renders the default slot as its only content', () => {
    expect(mountBadge({ content: 'Draft' }).html()).toBe('<span class="vf-badge">Draft</span>');
  });

  it('renders an empty span when no slot content is supplied', () => {
    // There is no fallback text and no label prop: the badge has exactly one
    // content channel.
    expect(mountBadge({ content: null }).html()).toBe('<span class="vf-badge"></span>');
  });

  it('has no named slots', () => {
    // Asserted through the rendered output rather than the instance: a named
    // slot the component does not read produces no markup.
    const wrapper = mount(VfBadge, { slots: { icon: () => 'ICON', trailing: () => 'TRAIL' } });

    expect(wrapper.html()).toBe('<span class="vf-badge"></span>');
  });

  it('emits no events', () => {
    expect(Object.keys(mountBadge().emitted())).toEqual([]);
  });
});

describe('VfBadge characterization: props and defaults', () => {
  it('defaults tone to neutral', () => {
    expect(mountBadge().props('tone')).toBe('neutral');
  });

  it('accepts exactly one prop', () => {
    // `tone` is the entire prop surface. Anything else a caller passes is an
    // attribute, which is what the attrs characterization below relies on.
    expect(Object.keys(mountBadge().props() as Record<string, unknown>)).toEqual(['tone']);
  });
});

describe('VfBadge characterization: classes', () => {
  it('emits no tone modifier at the default neutral tone', () => {
    // The inverse of the M14 checkable convention: neutral is the absence of a
    // modifier, not `vf-badge--neutral`.
    expect(mountBadge().classes()).toEqual(['vf-badge']);
  });

  it('emits no tone modifier when neutral is passed explicitly', () => {
    expect(mountBadge({ props: { tone: 'neutral' } }).classes()).toEqual(['vf-badge']);
  });

  it.each(NON_NEUTRAL_TONES)('emits vf-badge--%s for the non-neutral tone', (tone) => {
    expect(mountBadge({ props: { tone } }).classes()).toEqual(['vf-badge', `vf-badge--${tone}`]);
  });

  it('never emits a VfTag class', () => {
    // The isolation assertion: if VfTag's implementation were ever reused here,
    // this is what notices.
    for (const tone of TONES) {
      expect(mountBadge({ props: { tone } }).html()).not.toContain('vf-tag');
    }
  });
});

describe('VfBadge characterization: attrs', () => {
  it('appends a caller class after the canonical classes', () => {
    // inheritAttrs is false and `v-bind="attrs"` follows `:class`, but Vue
    // merges class rather than replacing it, so the canonical classes stay
    // first and the caller's are appended.
    expect(mountBadge({ props: { tone: 'primary' }, attrs: { class: 'mine other' } }).html()).toBe(
      '<span class="vf-badge vf-badge--primary mine other">Draft</span>',
    );
  });

  it('appends a caller class at the neutral tone too', () => {
    expect(mountBadge({ attrs: { class: 'mine' } }).html()).toBe('<span class="vf-badge mine">Draft</span>');
  });

  it('a caller class never replaces the canonical class', () => {
    expect(mountBadge({ attrs: { class: 'mine' } }).classes()).toContain('vf-badge');
  });

  it('forwards style, data, id and title attributes to the root', () => {
    const badge = mountBadge({
      attrs: { style: 'color: red', 'data-testid': 'badge', id: 'b1', title: 'Status' },
    });

    expect(badge.attributes('style')).toBe('color: red;');
    expect(badge.attributes('data-testid')).toBe('badge');
    expect(badge.attributes('id')).toBe('b1');
    expect(badge.attributes('title')).toBe('Status');
  });

  it('forwards arbitrary aria and role attributes without adding any of its own', () => {
    // The component writes no ARIA at all. A badge is a plain span unless the
    // caller says otherwise, and that absence is the contract.
    expect(mountBadge().attributes('role')).toBeUndefined();
    expect(mountBadge().attributes('aria-label')).toBeUndefined();

    const labelled = mountBadge({ attrs: { role: 'status', 'aria-label': 'Two items' } });

    expect(labelled.attributes('role')).toBe('status');
    expect(labelled.attributes('aria-label')).toBe('Two items');
  });
});

describe('VfBadge characterization: SSR', () => {
  it('renders the neutral badge without a tone modifier', async () => {
    expect(await ssrBadge()).toBe('<span class="vf-badge"><!--[-->Draft<!--]--></span>');
  });

  it('renders a toned badge with a caller class and style', async () => {
    expect(await ssrBadge({ tone: 'primary', class: 'mine', style: 'color:red' })).toBe(
      '<span class="vf-badge vf-badge--primary mine" style="color:red;"><!--[-->Draft<!--]--></span>',
    );
  });

  it.each(NON_NEUTRAL_TONES)('renders vf-badge--%s server-side', async (tone) => {
    expect(await ssrBadge({ tone })).toContain(`class="vf-badge vf-badge--${tone}"`);
  });
});

describe('VfBadge characterization: escaping', () => {
  it('renders hostile slot text as text, not markup', async () => {
    const hostile = '</span><img src=x onerror=alert(1)>';

    expect(mountBadge({ content: hostile }).html()).toBe(
      '<span class="vf-badge">&lt;/span&gt;&lt;img src=x onerror=alert(1)&gt;</span>',
    );
    expect(await ssrBadge({}, hostile)).toBe(
      '<span class="vf-badge"><!--[-->&lt;/span&gt;&lt;img src=x onerror=alert(1)&gt;<!--]--></span>',
    );
  });

  it('escapes the five significant characters in slot text', async () => {
    expect(await ssrBadge({}, `a & b < c > d " e ' f`)).toBe(
      '<span class="vf-badge"><!--[-->a &amp; b &lt; c &gt; d &quot; e &#39; f<!--]--></span>',
    );
  });

  it('escapes hostile attribute values', async () => {
    expect(await ssrBadge({ 'data-x': 'a"b<c&d' })).toContain('data-x="a&quot;b&lt;c&amp;d"');
  });
});
