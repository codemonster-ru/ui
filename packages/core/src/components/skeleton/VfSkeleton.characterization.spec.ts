// Characterization of the historical VfSkeleton at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The feedback/status primitive of the M16 batch, and the only one of the three
// that another component already depends on: VfSkeletonGate and VfDataTable
// both render it, so its markup is load-bearing for two components that are not
// migrated yet.
//
// Four things here are historical and would each be tempting to "fix":
//
//   - `aria-hidden="true"` is a *static* attribute on the root. The component
//     sets no `inheritAttrs: false`, so a consumer attribute of the same name
//     overrides it, and `aria-hidden="false"` on a skeleton is reachable from
//     outside. Nothing prevents it and nothing warns;
//   - `animated` defaults to true, so the modifier is present unless it is
//     switched off. Every modifier migrated before this one works the other way
//     round, where the default state emits nothing;
//   - `radius` defaults to a token *string*, so `border-radius` is written on
//     every skeleton. An empty string does not mean "no rounding": Vue drops a
//     style property whose value is `''`, so it means "no declaration", and a
//     skeleton with an empty radius and no minHeight has no style attribute;
//   - `minHeight` accepts a number and appends `px`, so `0` becomes `0px`
//     rather than being dropped.
//
// The component has no slot, no emits, no props on any child, and no children
// at all. It is one div.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfSkeleton from './VfSkeleton.vue';

type SkeletonProps = InstanceType<typeof VfSkeleton>['$props'];

function mountSkeleton({
  props = {},
  attrs = {},
}: {
  props?: Partial<SkeletonProps>;
  attrs?: Record<string, unknown>;
} = {}) {
  return mount(VfSkeleton, { props: props as SkeletonProps, attrs });
}

async function ssrSkeleton(props: Record<string, unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfSkeleton, props) });

  return await renderToString(app);
}

describe('VfSkeleton characterization: structure', () => {
  it('renders one empty div and nothing else', () => {
    expect(mountSkeleton().html()).toBe(
      '<div class="vf-skeleton vf-skeleton--animated" style="border-radius: var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div>',
    );
  });

  it('renders a div root rather than a span', () => {
    expect(mountSkeleton().element.tagName).toBe('DIV');
  });

  it('has no children under any prop combination', () => {
    const skeleton = mountSkeleton({ props: { minHeight: 120, radius: '0', animated: false } });

    expect(skeleton.element.children.length).toBe(0);
    expect(skeleton.text()).toBe('');
  });

  it('has no slots and ignores slot content entirely', () => {
    const wrapper = mount(VfSkeleton, { slots: { default: () => 'IGNORED', label: () => 'ALSO IGNORED' } });

    expect(wrapper.element.children.length).toBe(0);
    expect(wrapper.text()).toBe('');
  });

  it('emits no events', () => {
    expect(Object.keys(mountSkeleton().emitted())).toEqual([]);
  });
});

describe('VfSkeleton characterization: props and defaults', () => {
  it('accepts exactly three props', () => {
    expect(Object.keys(mountSkeleton({ props: { minHeight: 1 } }).props() as Record<string, unknown>).sort()).toEqual([
      'animated',
      'minHeight',
      'radius',
    ]);
  });

  it('defaults animated to true', () => {
    expect(mountSkeleton().props('animated')).toBe(true);
  });

  it('defaults radius to the surface radius token', () => {
    expect(mountSkeleton().props('radius')).toBe('var(--vf-radius-surface)');
  });

  it('leaves minHeight undefined by default', () => {
    expect(mountSkeleton().props('minHeight')).toBeUndefined();
  });
});

describe('VfSkeleton characterization: classes', () => {
  it('emits the animation modifier at the default', () => {
    // The inverted convention. VfBadge and VfTag express their default by
    // absence; this one expresses it by presence.
    expect(mountSkeleton().classes()).toEqual(['vf-skeleton', 'vf-skeleton--animated']);
  });

  it('drops the animation modifier when animated is false', () => {
    expect(mountSkeleton({ props: { animated: false } }).classes()).toEqual(['vf-skeleton']);
  });

  it('appends a caller class after the canonical classes', () => {
    expect(mountSkeleton({ attrs: { class: 'mine' } }).classes()).toEqual([
      'vf-skeleton',
      'vf-skeleton--animated',
      'mine',
    ]);
  });

  it('appends every class of a caller array in order', () => {
    expect(mountSkeleton({ attrs: { class: ['a', 'b'] } }).classes()).toEqual([
      'vf-skeleton',
      'vf-skeleton--animated',
      'a',
      'b',
    ]);
  });

  it('appends a caller class to an unanimated skeleton too', () => {
    // A different position in the list: there is no modifier for it to follow.
    expect(mountSkeleton({ props: { animated: false }, attrs: { class: 'mine' } }).classes()).toEqual([
      'vf-skeleton',
      'mine',
    ]);
  });
});

describe('VfSkeleton characterization: inline style', () => {
  it('writes only the radius when no minHeight is given', () => {
    expect(mountSkeleton().attributes('style')).toBe('border-radius: var(--vf-radius-surface);');
  });

  it('writes min-height before border-radius', () => {
    expect(mountSkeleton({ props: { minHeight: 40 } }).attributes('style')).toBe(
      'min-height: 40px; border-radius: var(--vf-radius-surface);',
    );
  });

  it('turns a numeric minHeight into pixels', () => {
    expect(mountSkeleton({ props: { minHeight: 120 } }).attributes('style')).toContain('min-height: 120px');
  });

  it('treats zero as a length rather than an absence', () => {
    expect(mountSkeleton({ props: { minHeight: 0 } }).attributes('style')).toContain('min-height: 0px');
  });

  it('passes a string minHeight through untouched', () => {
    for (const value of ['3rem', '50%', 'var(--vf-space-8)']) {
      expect(mountSkeleton({ props: { minHeight: value } }).attributes('style')).toContain(`min-height: ${value}`);
    }
  });

  it('passes an arbitrary radius through untouched', () => {
    expect(mountSkeleton({ props: { radius: '0' } }).attributes('style')).toContain('border-radius: 0');
  });

  it('drops an empty minHeight instead of writing an empty declaration', () => {
    expect(mountSkeleton({ props: { minHeight: '' } }).attributes('style')).toBe(
      'border-radius: var(--vf-radius-surface);',
    );
  });

  it('drops an empty radius, which is not the same as no rounding', () => {
    // The quirk. `radius=""` does not round the corners to zero; it removes the
    // declaration, so whatever the stylesheet says applies.
    expect(mountSkeleton({ props: { radius: '' } }).attributes('style')).toBeUndefined();
  });

  it('writes no style attribute at all when both values are empty', () => {
    expect(mountSkeleton({ props: { minHeight: '', radius: '' } }).attributes('style')).toBeUndefined();
  });

  it('appends a caller style after its own declarations', () => {
    expect(mountSkeleton({ attrs: { style: 'margin-top: 2px' } }).attributes('style')).toBe(
      'border-radius: var(--vf-radius-surface); margin-top: 2px;',
    );
  });

  it('lets a caller style override the radius the component wrote', () => {
    // One declaration wins, not two present at once: the caller's style is
    // merged over the component's rather than concatenated after it.
    const style = mountSkeleton({ attrs: { style: 'border-radius: 99px' } }).attributes('style');

    expect(style).toBe('border-radius: 99px;');
  });
});

describe('VfSkeleton characterization: ARIA', () => {
  it('hides itself from the accessibility tree', () => {
    expect(mountSkeleton().attributes('aria-hidden')).toBe('true');
  });

  it('exposes no role', () => {
    // Not role=status, not role=progressbar, not aria-busy. A loading
    // placeholder that announced itself would be an accessibility improvement
    // and a product change.
    const skeleton = mountSkeleton();

    expect(skeleton.attributes('role')).toBeUndefined();
    expect(skeleton.attributes('aria-busy')).toBeUndefined();
    expect(skeleton.attributes('aria-label')).toBeUndefined();
    expect(skeleton.attributes('aria-live')).toBeUndefined();
  });

  it('keeps aria-hidden on every prop combination', () => {
    for (const props of [{ animated: false }, { minHeight: 40 }, { radius: '' }] as Partial<SkeletonProps>[]) {
      expect(mountSkeleton({ props }).attributes('aria-hidden')).toBe('true');
    }
  });

  it('lets a caller override aria-hidden to false', () => {
    // Historical and reachable: aria-hidden is a static attribute and the
    // component does not set inheritAttrs: false, so a fallthrough attribute of
    // the same name replaces it. Blocking this would be a silent API removal.
    expect(mountSkeleton({ attrs: { 'aria-hidden': 'false' } }).attributes('aria-hidden')).toBe('false');
  });

  it('lets a caller add a role the component never writes', () => {
    expect(mountSkeleton({ attrs: { role: 'status', 'aria-label': 'Loading' } }).attributes('role')).toBe('status');
  });
});

describe('VfSkeleton characterization: attrs', () => {
  it('forwards data and id attributes to the root', () => {
    const skeleton = mountSkeleton({ attrs: { 'data-testid': 'skeleton', id: 's1' } });

    expect(skeleton.attributes('data-testid')).toBe('skeleton');
    expect(skeleton.attributes('id')).toBe('s1');
  });

  it('inherits attributes rather than dropping them, having no inheritAttrs: false', () => {
    expect(mountSkeleton({ attrs: { title: 'Loading' } }).attributes('title')).toBe('Loading');
  });
});

describe('VfSkeleton characterization: SSR', () => {
  it('renders the default skeleton server-side', async () => {
    expect(await ssrSkeleton()).toBe(
      '<div class="vf-skeleton vf-skeleton--animated" style="border-radius:var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div>',
    );
  });

  it('renders an unanimated sized skeleton server-side', async () => {
    expect(await ssrSkeleton({ minHeight: '3rem', radius: '0', animated: false })).toBe(
      '<div class="vf-skeleton" style="min-height:3rem;border-radius:0;" aria-hidden="true"></div>',
    );
  });

  it('renders a caller aria-hidden override server-side', async () => {
    expect(await ssrSkeleton({ 'aria-hidden': 'false', class: 'mine' })).toBe(
      '<div class="vf-skeleton vf-skeleton--animated mine" style="border-radius:var(--vf-radius-surface);" ' +
        'aria-hidden="false"></div>',
    );
  });

  it('escapes hostile attribute values', async () => {
    expect(await ssrSkeleton({ 'data-x': 'a"b<c&d' })).toContain('data-x="a&quot;b&lt;c&amp;d"');
  });

  it('escapes a hostile radius rather than letting it close the attribute', async () => {
    // The radius reaches a style attribute verbatim, so its escaping is the
    // only thing between a prop and injected markup.
    const html = await ssrSkeleton({ radius: '0" onload="x' });

    expect(html).not.toContain('onload="x"');
    expect(html).toContain('&quot;');
  });
});
