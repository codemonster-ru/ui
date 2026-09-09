// Characterization of the historical VfTag at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// Written independently of VfBadge's suite and deliberately not derived from
// it. The two components have the same shape - a span, one `tone` prop, a
// default slot, no emits - and the temptation is to characterize them once and
// parameterise the block name. That would defeat the purpose: the only way to
// prove one implementation has not silently become the other is to hold two
// sets of evidence that a substitution would break.
//
// Two things separate VfTag from VfBadge, and neither shows up in a class list:
//
//   - its `tone` prop is typed `VfFeedbackTone`, a distinct public type that
//     currently happens to have the same eight literals as `VfBadgeTone`;
//   - its tone modifiers style `border-color` and `color` only, never
//     `background`, which VfBadge's do. That distinction lives in CSS and is
//     asserted by the stylesheet contract, not here.
//
// VfTag shares VfBadge's neutral-suppression rule: `neutral` emits no modifier.
// Recorded here on its own evidence rather than by reference to VfBadge.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfTag from './VfTag.vue';
import type { VfFeedbackTone } from '@/types/components';

type TagProps = InstanceType<typeof VfTag>['$props'];

/** Every literal the public `VfFeedbackTone` union allows, in declaration order. */
const TONES: VfFeedbackTone[] = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

const NON_NEUTRAL_TONES = TONES.filter((tone) => tone !== 'neutral');

function mountTag({
  props = {},
  attrs = {},
  content = 'Beta',
}: {
  props?: Partial<TagProps>;
  attrs?: Record<string, unknown>;
  content?: string | null;
} = {}) {
  return mount(VfTag, {
    props: props as TagProps,
    attrs,
    slots: content === null ? {} : { default: () => content },
  });
}

async function ssrTag(props: Record<string, unknown> = {}, content: string | null = 'Beta') {
  const app = createSSRApp({
    render: () => h(VfTag, props, content === null ? undefined : { default: () => content }),
  });

  return await renderToString(app);
}

describe('VfTag characterization: structure', () => {
  it('renders a span as its root', () => {
    expect(mountTag().element.tagName).toBe('SPAN');
  });

  it('renders the default slot as its only content', () => {
    expect(mountTag({ content: 'Beta' }).html()).toBe('<span class="vf-tag">Beta</span>');
  });

  it('renders an empty span when no slot content is supplied', () => {
    expect(mountTag({ content: null }).html()).toBe('<span class="vf-tag"></span>');
  });

  it('has no named slots', () => {
    const wrapper = mount(VfTag, { slots: { icon: () => 'ICON', remove: () => 'X' } });

    expect(wrapper.html()).toBe('<span class="vf-tag"></span>');
  });

  it('emits no events', () => {
    // Notably there is no `remove` event: the historical tag is not dismissible.
    expect(Object.keys(mountTag().emitted())).toEqual([]);
  });
});

describe('VfTag characterization: props and defaults', () => {
  it('defaults tone to neutral', () => {
    expect(mountTag().props('tone')).toBe('neutral');
  });

  it('accepts exactly one prop', () => {
    expect(Object.keys(mountTag().props() as Record<string, unknown>)).toEqual(['tone']);
  });
});

describe('VfTag characterization: classes', () => {
  it('emits no tone modifier at the default neutral tone', () => {
    expect(mountTag().classes()).toEqual(['vf-tag']);
  });

  it('emits no tone modifier when neutral is passed explicitly', () => {
    expect(mountTag({ props: { tone: 'neutral' } }).classes()).toEqual(['vf-tag']);
  });

  it.each(NON_NEUTRAL_TONES)('emits vf-tag--%s for the non-neutral tone', (tone) => {
    expect(mountTag({ props: { tone } }).classes()).toEqual(['vf-tag', `vf-tag--${tone}`]);
  });

  it('never emits a VfBadge class', () => {
    // The isolation assertion. If VfBadge's resolver were reused for VfTag,
    // this fails here before any parity run.
    for (const tone of TONES) {
      expect(mountTag({ props: { tone } }).html()).not.toContain('vf-badge');
    }
  });
});

describe('VfTag characterization: attrs', () => {
  it('appends a caller class after the canonical classes', () => {
    expect(mountTag({ props: { tone: 'danger' }, attrs: { class: 'mine other' } }).html()).toBe(
      '<span class="vf-tag vf-tag--danger mine other">Beta</span>',
    );
  });

  it('appends a caller class at the neutral tone too', () => {
    expect(mountTag({ attrs: { class: 'mine' } }).html()).toBe('<span class="vf-tag mine">Beta</span>');
  });

  it('a caller class never replaces the canonical class', () => {
    expect(mountTag({ attrs: { class: 'mine' } }).classes()).toContain('vf-tag');
  });

  it('forwards style, data, id and title attributes to the root', () => {
    const tag = mountTag({ attrs: { style: 'color: red', 'data-testid': 'tag', id: 't1', title: 'Stage' } });

    expect(tag.attributes('style')).toBe('color: red;');
    expect(tag.attributes('data-testid')).toBe('tag');
    expect(tag.attributes('id')).toBe('t1');
    expect(tag.attributes('title')).toBe('Stage');
  });

  it('writes no ARIA of its own and forwards what the caller supplies', () => {
    expect(mountTag().attributes('role')).toBeUndefined();
    expect(mountTag().attributes('aria-label')).toBeUndefined();

    const labelled = mountTag({ attrs: { role: 'note', 'aria-label': 'Beta stage' } });

    expect(labelled.attributes('role')).toBe('note');
    expect(labelled.attributes('aria-label')).toBe('Beta stage');
  });
});

describe('VfTag characterization: SSR', () => {
  it('renders the neutral tag without a tone modifier', async () => {
    expect(await ssrTag()).toBe('<span class="vf-tag"><!--[-->Beta<!--]--></span>');
  });

  it('renders a toned tag with a caller class', async () => {
    expect(await ssrTag({ tone: 'info', class: 'mine' })).toBe(
      '<span class="vf-tag vf-tag--info mine"><!--[-->Beta<!--]--></span>',
    );
  });

  it.each(NON_NEUTRAL_TONES)('renders vf-tag--%s server-side', async (tone) => {
    expect(await ssrTag({ tone })).toContain(`class="vf-tag vf-tag--${tone}"`);
  });
});

describe('VfTag characterization: escaping', () => {
  it('renders hostile slot text as text, not markup', async () => {
    const hostile = '</span><img src=x onerror=alert(1)>';

    expect(mountTag({ content: hostile }).html()).toBe(
      '<span class="vf-tag">&lt;/span&gt;&lt;img src=x onerror=alert(1)&gt;</span>',
    );
    expect(await ssrTag({}, hostile)).toBe(
      '<span class="vf-tag"><!--[-->&lt;/span&gt;&lt;img src=x onerror=alert(1)&gt;<!--]--></span>',
    );
  });

  it('escapes the five significant characters in slot text', async () => {
    expect(await ssrTag({}, `a & b < c > d " e ' f`)).toBe(
      '<span class="vf-tag"><!--[-->a &amp; b &lt; c &gt; d &quot; e &#39; f<!--]--></span>',
    );
  });

  it('escapes hostile attribute values', async () => {
    expect(await ssrTag({ 'data-x': 'a"b<c&d' })).toContain('data-x="a&quot;b&lt;c&amp;d"');
  });
});
