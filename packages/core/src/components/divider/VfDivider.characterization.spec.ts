// Characterization of the historical VfDivider at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The third component of the M15 batch and the one that is not a toned span.
// It is here to prove the batch's evidence does not collapse into one shape,
// and it carries the only accessibility surface in the batch.
//
// That surface is historically odd, and the oddity is the contract:
//
//   - the root is a `div`, not an `hr`;
//   - `aria-orientation` is written unconditionally, on both orientations;
//   - `role="separator"` is written only when the orientation is vertical.
//
// So a horizontal divider is a `div` carrying `aria-orientation="horizontal"`
// and no role at all - an ARIA attribute on an element with no role, which is
// inert. Standards cleanup would remove it, add `role="separator"` to both, or
// switch to `hr`. All three would be a product change, and §30 of the M15 plan
// exists to prove the harness rejects them.
//
// Separately, `v-bind="attrs"` appears after `:role` and `:aria-orientation`
// in the template, so a caller can override both. That override path is
// historical behaviour and is characterized rather than sanitized.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfDivider from './VfDivider.vue';

type DividerProps = InstanceType<typeof VfDivider>['$props'];

function mountDivider({
  props = {},
  attrs = {},
}: {
  props?: Partial<DividerProps>;
  attrs?: Record<string, unknown>;
} = {}) {
  return mount(VfDivider, { props: props as DividerProps, attrs });
}

async function ssrDivider(props: Record<string, unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfDivider, props) });

  return await renderToString(app);
}

describe('VfDivider characterization: structure', () => {
  it('renders a div as its root, not an hr', () => {
    // An hr would be the conventional element and is not what the reference
    // does. Pinned explicitly because it is the most tempting "fix".
    expect(mountDivider().element.tagName).toBe('DIV');
  });

  it('renders a self-closing element with no children', () => {
    expect(mountDivider().html()).toBe(
      '<div class="vf-divider vf-divider--horizontal" aria-orientation="horizontal"></div>',
    );
  });

  it('has no slots and ignores slot content entirely', () => {
    const wrapper = mount(VfDivider, { slots: { default: () => 'IGNORED', label: () => 'ALSO IGNORED' } });

    expect(wrapper.html()).toBe('<div class="vf-divider vf-divider--horizontal" aria-orientation="horizontal"></div>');
    expect(wrapper.text()).toBe('');
  });

  it('emits no events', () => {
    expect(Object.keys(mountDivider().emitted())).toEqual([]);
  });
});

describe('VfDivider characterization: props and defaults', () => {
  it('defaults orientation to horizontal', () => {
    expect(mountDivider().props('orientation')).toBe('horizontal');
  });

  it('accepts exactly one prop', () => {
    expect(Object.keys(mountDivider().props() as Record<string, unknown>)).toEqual(['orientation']);
  });
});

describe('VfDivider characterization: classes', () => {
  it('always emits an orientation modifier, including at the default', () => {
    // Unlike VfBadge and VfTag in this same batch, where the default tone emits
    // nothing. The two conventions sit side by side inside one milestone.
    expect(mountDivider().classes()).toEqual(['vf-divider', 'vf-divider--horizontal']);
  });

  it('emits the vertical modifier when vertical', () => {
    expect(mountDivider({ props: { orientation: 'vertical' } }).classes()).toEqual([
      'vf-divider',
      'vf-divider--vertical',
    ]);
  });

  it('appends a caller class after the canonical classes', () => {
    expect(mountDivider({ attrs: { class: 'mine' } }).classes()).toEqual([
      'vf-divider',
      'vf-divider--horizontal',
      'mine',
    ]);
  });
});

describe('VfDivider characterization: ARIA', () => {
  it('writes aria-orientation on a horizontal divider but no role', () => {
    // The historical quirk. An aria-* attribute on a roleless div is inert;
    // reproducing it is the contract.
    const divider = mountDivider();

    expect(divider.attributes('aria-orientation')).toBe('horizontal');
    expect(divider.attributes('role')).toBeUndefined();
  });

  it('writes both role=separator and aria-orientation on a vertical divider', () => {
    const divider = mountDivider({ props: { orientation: 'vertical' } });

    expect(divider.attributes('role')).toBe('separator');
    expect(divider.attributes('aria-orientation')).toBe('vertical');
  });

  it('ties the role strictly to the orientation prop', () => {
    // Stated as a pair so that "always emit role" and "never emit role" are
    // both caught, rather than only one of them.
    expect(mountDivider({ props: { orientation: 'horizontal' } }).attributes('role')).toBeUndefined();
    expect(mountDivider({ props: { orientation: 'vertical' } }).attributes('role')).toBe('separator');
  });
});

describe('VfDivider characterization: caller overrides', () => {
  it('lets a caller add a role to a horizontal divider', () => {
    // attrs are bound after the component's own attributes, so the caller wins.
    expect(mountDivider({ attrs: { role: 'presentation' } }).attributes('role')).toBe('presentation');
  });

  it('lets a caller replace the role on a vertical divider', () => {
    const divider = mountDivider({ props: { orientation: 'vertical' }, attrs: { role: 'none' } });

    expect(divider.attributes('role')).toBe('none');
  });

  it('lets a caller override aria-orientation against the prop', () => {
    // The class still says horizontal; only the ARIA attribute is overridden.
    // The two can disagree, and historically nothing prevents that.
    const divider = mountDivider({ attrs: { 'aria-orientation': 'vertical' } });

    expect(divider.attributes('aria-orientation')).toBe('vertical');
    expect(divider.classes()).toContain('vf-divider--horizontal');
  });

  it('lets a caller override both role and aria-orientation at once', () => {
    const divider = mountDivider({
      props: { orientation: 'vertical' },
      attrs: { role: 'presentation', 'aria-orientation': 'horizontal' },
    });

    expect(divider.attributes('role')).toBe('presentation');
    expect(divider.attributes('aria-orientation')).toBe('horizontal');
    expect(divider.classes()).toContain('vf-divider--vertical');
  });

  it('forwards style, data and id attributes to the root', () => {
    const divider = mountDivider({ attrs: { style: 'margin: 4px', 'data-testid': 'divider', id: 'd1' } });

    expect(divider.attributes('style')).toBe('margin: 4px;');
    expect(divider.attributes('data-testid')).toBe('divider');
    expect(divider.attributes('id')).toBe('d1');
  });
});

describe('VfDivider characterization: SSR', () => {
  it('renders the horizontal divider with no role server-side', async () => {
    expect(await ssrDivider()).toBe(
      '<div class="vf-divider vf-divider--horizontal" aria-orientation="horizontal"></div>',
    );
  });

  it('renders the vertical divider with role=separator server-side', async () => {
    expect(await ssrDivider({ orientation: 'vertical' })).toBe(
      '<div class="vf-divider vf-divider--vertical" aria-orientation="vertical" role="separator"></div>',
    );
  });

  it('renders a caller role override server-side', async () => {
    expect(await ssrDivider({ role: 'presentation', class: 'mine' })).toBe(
      '<div class="vf-divider vf-divider--horizontal mine" aria-orientation="horizontal" role="presentation"></div>',
    );
  });

  it('escapes hostile attribute values', async () => {
    expect(await ssrDivider({ 'data-x': 'a"b<c&d' })).toContain('data-x="a&quot;b&lt;c&amp;d"');
  });
});
