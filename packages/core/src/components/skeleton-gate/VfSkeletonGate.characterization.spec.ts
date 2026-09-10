// Characterization of the historical VfSkeletonGate at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The first migrated component that renders another migrated component. Its
// contract is therefore two contracts: what the gate itself composes, and what
// it hands to VfSkeleton. Both are pinned here, and neither is proved by
// VfSkeleton's own suite - a skeleton that renders correctly on its own says
// nothing about which props the gate forwarded to it.
//
// The name is the first thing to distrust. "Gate" suggests a component that
// chooses between two branches and renders one of them. It does not. Both
// branches are in the DOM at all times:
//
//   - the content wrapper always exists and always holds the default slot. When
//     the gate is not ready it is faded to opacity 0 by CSS, marked
//     aria-hidden and made inert - present, laid out, and unreachable;
//   - the overlay always exists and always holds the skeleton. When the gate is
//     ready `v-show` gives it `display: none` - present in the DOM, removed
//     from layout.
//
// So there is no mutual exclusivity to preserve and no branch to recreate. A
// port that "corrected" this into `v-if` would delete the fade transition the
// whole component exists for, keep every static snapshot looking right, and
// destroy the consumer's DOM on every state change.
//
// Six further historical decisions are reproduced rather than corrected:
//
//   - `aria-busy` is written as `!ready || undefined`, so it is `"true"` while
//     loading and *absent* when ready. It is never `"false"`. A consumer
//     attribute of the same name replaces it, because the component sets no
//     inheritAttrs: false;
//   - the fade-duration custom property is written into the root style on every
//     render, so the root always carries a style attribute even at the default;
//   - `reserveHeight` beats `minHeight` for the *root*, but the child skeleton
//     receives `minHeight` regardless. The two can legitimately disagree;
//   - the reserve check is `!= null` applied *after* the length conversion, so
//     `reserveHeight: 0` reserves `0px` and `reserveHeight: ''` wins the
//     precedence contest and then evaporates - silently swallowing a
//     `minHeight` that would otherwise have been written;
//   - `contentStyle` is a computed that always returns `{}`. It renders nothing
//     on the client and `style=""` under SSR;
//   - `preserveLastHeight` is a post-mount measurement. It has no server-
//     rendered effect at all, and no effect on an empty content wrapper.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VfSkeletonGate from './VfSkeletonGate.vue';

type GateProps = InstanceType<typeof VfSkeletonGate>['$props'];

function mountGate({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<GateProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfSkeletonGate, { props: props as GateProps, attrs, slots: slots as never });
}

async function ssrGate(props: Record<string, unknown> = {}, slot?: string) {
  const app = createSSRApp({
    render: () => h(VfSkeletonGate, props, slot === undefined ? undefined : { default: () => slot }),
  });

  return await renderToString(app);
}

const root = (wrapper: ReturnType<typeof mountGate>) => wrapper.element as HTMLElement;
const content = (wrapper: ReturnType<typeof mountGate>) =>
  wrapper.element.querySelector('.vf-skeleton-gate__content') as HTMLElement;
const overlay = (wrapper: ReturnType<typeof mountGate>) =>
  wrapper.element.querySelector('.vf-skeleton-gate__overlay') as HTMLElement;
const skeleton = (wrapper: ReturnType<typeof mountGate>) =>
  wrapper.element.querySelector('.vf-skeleton') as HTMLElement | null;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('VfSkeletonGate characterization: structure', () => {
  it('renders its own root wrapping exactly two children, in a fixed order', () => {
    const wrapper = mountGate();
    const children = Array.from(root(wrapper).children);

    expect(root(wrapper).tagName).toBe('DIV');
    expect(root(wrapper).classList.contains('vf-skeleton-gate')).toBe(true);
    expect(children.map((child) => child.className)).toEqual([
      'vf-skeleton-gate__content',
      'vf-skeleton-gate__overlay',
    ]);
  });

  it('renders the exact default markup', () => {
    expect(mountGate().html()).toBe(
      '<div class="vf-skeleton-gate" style="--vf-skeleton-gate-fade-duration: 220ms;" aria-busy="true">\n' +
        '  <div class="vf-skeleton-gate__content" aria-hidden="true" inert="true"></div>\n' +
        '  <div class="vf-skeleton-gate__overlay" aria-hidden="true">\n' +
        '    <!-- Default skeleton primitive used by the gate when no custom skeleton slot is provided. -->\n' +
        '    <div class="vf-skeleton vf-skeleton--animated" style="border-radius: var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div>\n' +
        '  </div>\n' +
        '</div>',
    );
  });

  it('renders the exact ready markup', () => {
    expect(mountGate({ props: { ready: true } }).html()).toBe(
      '<div class="vf-skeleton-gate" style="--vf-skeleton-gate-fade-duration: 220ms;">\n' +
        '  <div class="vf-skeleton-gate__content vf-skeleton-gate__content--ready"></div>\n' +
        '  <div class="vf-skeleton-gate__overlay" aria-hidden="true" style="display: none;">\n' +
        '    <!-- Default skeleton primitive used by the gate when no custom skeleton slot is provided. -->\n' +
        '    <div class="vf-skeleton vf-skeleton--animated" style="border-radius: var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div>\n' +
        '  </div>\n' +
        '</div>',
    );
  });

  it('emits no events', () => {
    expect(Object.keys(mountGate().emitted())).toEqual([]);
  });

  it('exposes exactly the historical prop names', () => {
    // Read off the component definition rather than off a rendered instance, so
    // a prop that stopped being declared fails here rather than silently
    // becoming a fallthrough attribute on the root.
    const declared = (VfSkeletonGate as unknown as { props: Record<string, unknown> }).props;

    expect(Object.keys(declared).sort()).toEqual([
      'fadeDuration',
      'minHeight',
      'normalizeContentSpacing',
      'preserveLastHeight',
      'radius',
      'ready',
      'reserveHeight',
    ]);
  });

  it('is named VfSkeletonGate', () => {
    expect((VfSkeletonGate as unknown as { name?: string }).name).toBe('VfSkeletonGate');
  });
});

describe('VfSkeletonGate characterization: both branches are always present', () => {
  it('renders the content wrapper and the overlay while loading', () => {
    const wrapper = mountGate({ slots: { default: () => 'Body' } });

    expect(content(wrapper)).not.toBeNull();
    expect(overlay(wrapper)).not.toBeNull();
    expect(content(wrapper).textContent).toBe('Body');
    expect(skeleton(wrapper)).not.toBeNull();
  });

  it('still renders both when ready: the overlay is hidden, not removed', () => {
    const wrapper = mountGate({ props: { ready: true }, slots: { default: () => 'Body' } });

    expect(content(wrapper).textContent).toBe('Body');
    // The skeleton is still in the document. This is the fact a v-if rewrite
    // would destroy while every ready-state assertion kept passing.
    expect(skeleton(wrapper)).not.toBeNull();
    expect(overlay(wrapper).style.display).toBe('none');
  });

  it('hides the overlay with an inline display rather than by unmounting it', () => {
    const wrapper = mountGate();

    expect(overlay(wrapper).style.display).toBe('');
    expect(skeleton(wrapper)).not.toBeNull();
  });

  it('never renders the content slot twice', () => {
    const wrapper = mountGate({ slots: { default: () => h('span', { class: 'consumer-body' }, 'Body') } });

    expect(wrapper.element.querySelectorAll('.consumer-body').length).toBe(1);
  });

  it('never renders a second skeleton', () => {
    expect(mountGate().element.querySelectorAll('.vf-skeleton').length).toBe(1);
    expect(mountGate({ props: { ready: true } }).element.querySelectorAll('.vf-skeleton').length).toBe(1);
  });

  it('keeps the consumer content out of the overlay and the skeleton out of the content wrapper', () => {
    const wrapper = mountGate({ slots: { default: () => 'Body' } });

    expect(overlay(wrapper).textContent).toBe('');
    expect(content(wrapper).querySelector('.vf-skeleton')).toBeNull();
  });
});

describe('VfSkeletonGate characterization: the ready predicate', () => {
  it('defaults to not ready', () => {
    expect(root(mountGate()).getAttribute('aria-busy')).toBe('true');
    expect(content(mountGate()).classList.contains('vf-skeleton-gate__content--ready')).toBe(false);
  });

  it('drops aria-busy entirely when ready rather than writing false', () => {
    const wrapper = mountGate({ props: { ready: true } });

    expect(root(wrapper).hasAttribute('aria-busy')).toBe(false);
  });

  // ready is declared `ready?: boolean`, so Vue casts what it is given rather
  // than reading it as a raw truthiness test. undefined falls back to the
  // default; the two falsy non-booleans below are what a `!ready` truthiness
  // check and a `ready === true` strict check disagree about, and the component
  // does neither - it receives an already-cast boolean.
  it.each([
    ['undefined', undefined, false],
    ['false', false, false],
    ['true', true, true],
  ])('treats ready=%s as ready=%s', (_label, value, expected) => {
    const wrapper = mountGate({ props: { ready: value } as Partial<GateProps> });

    expect(content(wrapper).classList.contains('vf-skeleton-gate__content--ready')).toBe(expected);
    expect(root(wrapper).hasAttribute('aria-busy')).toBe(!expected);
    expect(overlay(wrapper).style.display).toBe(expected ? 'none' : '');
    expect(content(wrapper).hasAttribute('inert')).toBe(!expected);
  });

  it('applies the ready modifier and the loading attributes as one consistent set', () => {
    for (const ready of [false, true]) {
      const wrapper = mountGate({ props: { ready } });
      const isReady = content(wrapper).classList.contains('vf-skeleton-gate__content--ready');

      // Every ready-driven output moves together. A mutation that inverted one
      // of them alone would be caught by the assertions above; this is what
      // catches one that inverted the predicate in only half the template.
      expect(isReady).toBe(ready);
      expect(root(wrapper).hasAttribute('aria-busy')).toBe(!ready);
      expect(content(wrapper).hasAttribute('aria-hidden')).toBe(!ready);
      expect(content(wrapper).hasAttribute('inert')).toBe(!ready);
      expect(overlay(wrapper).style.display).toBe(ready ? 'none' : '');
    }
  });
});

describe('VfSkeletonGate characterization: slots', () => {
  it('renders the default slot inside the content wrapper, unwrapped and unaltered', () => {
    const wrapper = mountGate({
      slots: { default: () => [h('h4', 'Title'), h('p', 'Paragraph')] },
    });

    expect(content(wrapper).innerHTML).toBe('<h4>Title</h4><p>Paragraph</p>');
  });

  it('renders no content and no wrapper text when the default slot is absent', () => {
    expect(content(mountGate()).innerHTML).toBe('');
  });

  it('still renders the content wrapper for an empty slot', () => {
    const wrapper = mountGate({ slots: { default: () => '' } });

    expect(content(wrapper)).not.toBeNull();
    expect(content(wrapper).textContent).toBe('');
  });

  it('preserves whitespace-only slot content as text', () => {
    const wrapper = mountGate({ slots: { default: () => ' ' } });

    expect(content(wrapper).textContent).toBe(' ');
  });

  it('replaces the default skeleton entirely when the skeleton slot is given', () => {
    const wrapper = mountGate({ slots: { skeleton: () => h('p', { class: 'custom-skeleton' }, 'Loading') } });

    expect(skeleton(wrapper)).toBeNull();
    expect(overlay(wrapper).innerHTML).toBe('<p class="custom-skeleton">Loading</p>');
  });

  it('renders the skeleton slot inside the overlay even when ready', () => {
    const wrapper = mountGate({
      props: { ready: true },
      slots: { skeleton: () => h('p', { class: 'custom-skeleton' }, 'Loading') },
    });

    expect(wrapper.element.querySelector('.custom-skeleton')).not.toBeNull();
    expect(overlay(wrapper).style.display).toBe('none');
  });

  it('falls back to the default skeleton when the skeleton slot renders nothing', () => {
    // Vue's slot fallback is keyed on the slot producing no vnodes, not on the
    // slot being absent. A slot returning an empty string produces a text
    // vnode, so the fallback does *not* come back.
    const wrapper = mountGate({ slots: { skeleton: () => '' } });

    expect(skeleton(wrapper)).toBeNull();
  });

  it('exposes no scope to either slot', () => {
    const seen: unknown[] = [];
    mountGate({
      slots: {
        default: (scope: unknown) => {
          seen.push(scope);
          return 'Body';
        },
        skeleton: (scope: unknown) => {
          seen.push(scope);
          return 'Loading';
        },
      },
    });

    expect(seen).toEqual([{}, {}]);
  });

  it('ignores a slot it does not declare', () => {
    const wrapper = mountGate({ slots: { footer: () => 'IGNORED' } });

    expect(wrapper.text()).toBe('');
  });
});

describe('VfSkeletonGate characterization: the root style attribute', () => {
  it('always writes the fade-duration custom property, even at the default', () => {
    expect(root(mountGate()).getAttribute('style')).toBe('--vf-skeleton-gate-fade-duration: 220ms;');
  });

  it('writes the caller fade duration in milliseconds, including zero', () => {
    expect(root(mountGate({ props: { fadeDuration: 0 } })).style.getPropertyValue('--vf-skeleton-gate-fade-duration')) //
      .toBe('0ms');
    expect(
      root(mountGate({ props: { fadeDuration: 900 } })).style.getPropertyValue('--vf-skeleton-gate-fade-duration'),
    ).toBe('900ms');
  });

  it('writes minHeight when nothing outranks it', () => {
    expect(root(mountGate({ props: { minHeight: 40 } })).style.minHeight).toBe('40px');
    expect(root(mountGate({ props: { minHeight: '3rem' } })).style.minHeight).toBe('3rem');
  });

  it('lets reserveHeight outrank minHeight on the root', () => {
    const wrapper = mountGate({ props: { minHeight: 40, reserveHeight: 120 } });

    expect(root(wrapper).style.minHeight).toBe('120px');
  });

  it('treats a zero reserveHeight as a reservation rather than an absence', () => {
    const wrapper = mountGate({ props: { minHeight: 50, reserveHeight: 0 } });

    expect(root(wrapper).style.minHeight).toBe('0px');
  });

  it('the quirk: an empty reserveHeight wins the precedence contest and then writes nothing', () => {
    // toCssLength('') returns '', which is not null, so the reserve branch is
    // taken - and Vue then drops a style property whose value is ''. The
    // minHeight the caller also passed never reaches the root.
    const wrapper = mountGate({ props: { minHeight: 50, reserveHeight: '' } });

    expect(root(wrapper).style.minHeight).toBe('');
    expect(root(wrapper).getAttribute('style')).toBe('--vf-skeleton-gate-fade-duration: 220ms;');
  });

  it('writes the radius as a root border-radius', () => {
    expect(root(mountGate({ props: { radius: '8px' } })).style.borderRadius).toBe('8px');
  });

  it('the quirk: an empty radius drops the declaration rather than meaning zero', () => {
    const wrapper = mountGate({ props: { radius: '' } });

    expect(root(wrapper).getAttribute('style')).toBe('--vf-skeleton-gate-fade-duration: 220ms;');
  });

  it('writes no root min-height or border-radius at the default', () => {
    const wrapper = mountGate();

    expect(root(wrapper).style.minHeight).toBe('');
    expect(root(wrapper).style.borderRadius).toBe('');
  });

  it('does not change the root style when the gate becomes ready', () => {
    const loading = root(mountGate({ props: { minHeight: 40, radius: '8px' } })).getAttribute('style');
    const ready = root(mountGate({ props: { minHeight: 40, radius: '8px', ready: true } })).getAttribute('style');

    expect(ready).toBe(loading);
  });
});

describe('VfSkeletonGate characterization: the content wrapper', () => {
  it('carries no style attribute on the client even though contentStyle is bound', () => {
    expect(content(mountGate()).hasAttribute('style')).toBe(false);
  });

  it('adds the normalize-spacing modifier only when asked', () => {
    expect(content(mountGate()).className).toBe('vf-skeleton-gate__content');
    expect(content(mountGate({ props: { normalizeContentSpacing: true } })).className).toBe(
      'vf-skeleton-gate__content vf-skeleton-gate__content--normalize-spacing',
    );
  });

  it('writes the ready modifier before the normalize-spacing modifier', () => {
    const wrapper = mountGate({ props: { ready: true, normalizeContentSpacing: true } });

    expect(content(wrapper).className).toBe(
      'vf-skeleton-gate__content vf-skeleton-gate__content--ready vf-skeleton-gate__content--normalize-spacing',
    );
  });

  it('never receives the radius, the min-height or the fade duration', () => {
    const wrapper = mountGate({ props: { radius: '8px', minHeight: 40, fadeDuration: 10 } });

    expect(content(wrapper).hasAttribute('style')).toBe(false);
  });
});

describe('VfSkeletonGate characterization: the overlay', () => {
  it('is always aria-hidden, ready or not', () => {
    expect(overlay(mountGate()).getAttribute('aria-hidden')).toBe('true');
    expect(overlay(mountGate({ props: { ready: true } })).getAttribute('aria-hidden')).toBe('true');
  });

  it('receives the radius and nothing else', () => {
    const wrapper = mountGate({ props: { radius: '8px', minHeight: 40, reserveHeight: 200 } });

    expect(overlay(wrapper).getAttribute('style')).toBe('border-radius: 8px;');
  });

  it('carries no style attribute when no radius is given', () => {
    expect(overlay(mountGate()).hasAttribute('style')).toBe(false);
  });

  it('the quirk: an empty radius leaves the overlay with no style attribute', () => {
    expect(overlay(mountGate({ props: { radius: '' } })).hasAttribute('style')).toBe(false);
  });
});

describe('VfSkeletonGate characterization: what reaches the child VfSkeleton', () => {
  it('forwards minHeight verbatim, including as a number', () => {
    expect(skeleton(mountGate({ props: { minHeight: 40 } }))!.style.minHeight).toBe('40px');
    expect(skeleton(mountGate({ props: { minHeight: '3rem' } }))!.style.minHeight).toBe('3rem');
  });

  it('forwards radius verbatim', () => {
    expect(skeleton(mountGate({ props: { radius: '8px' } }))!.style.borderRadius).toBe('8px');
  });

  it("lets the child's own default apply when the gate's radius is undefined", () => {
    // The gate's radius default is undefined, not a token. The token on a
    // default skeleton comes from VfSkeleton, and a gate that hardcoded one
    // would look identical until the child's default changed.
    expect(skeleton(mountGate())!.style.borderRadius).toBe('var(--vf-radius-surface)');
  });

  it('forwards an empty radius, which the child then drops entirely', () => {
    // Two components' quirks composing: the gate passes '' through, and the
    // child's empty-value rule turns that into no style attribute at all.
    expect(skeleton(mountGate({ props: { radius: '' } }))!.hasAttribute('style')).toBe(false);
  });

  it('does not forward reserveHeight to the child', () => {
    // The root reserves 120px; the skeleton is still asked for 50px. The two
    // heights legitimately disagree, and a port that forwarded the resolved
    // root height instead would make them agree and look tidier.
    const wrapper = mountGate({ props: { minHeight: 50, reserveHeight: 120 } });

    expect(root(wrapper).style.minHeight).toBe('120px');
    expect(skeleton(wrapper)!.style.minHeight).toBe('50px');
  });

  it('does not forward reserveHeight to the child even when the gate writes no min-height at all', () => {
    const wrapper = mountGate({ props: { minHeight: 50, reserveHeight: '' } });

    expect(root(wrapper).style.minHeight).toBe('');
    expect(skeleton(wrapper)!.style.minHeight).toBe('50px');
  });

  it('does not forward normalizeContentSpacing, fadeDuration, preserveLastHeight or ready', () => {
    const wrapper = mountGate({
      props: { normalizeContentSpacing: true, fadeDuration: 10, preserveLastHeight: true, ready: false },
    });

    // The skeleton is exactly the default skeleton: two classes, one radius
    // declaration, aria-hidden. Nothing the gate knows about leaked into it.
    expect(skeleton(wrapper)!.outerHTML).toBe(
      '<div class="vf-skeleton vf-skeleton--animated" style="border-radius: var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div>',
    );
  });

  it('leaves the child animated, because the gate has no animated prop to forward', () => {
    expect(skeleton(mountGate())!.classList.contains('vf-skeleton--animated')).toBe(true);
  });

  it('forwards no consumer attributes to the child', () => {
    const wrapper = mountGate({
      attrs: { class: 'consumer', style: 'opacity: 0.5', 'data-testid': 'gate', id: 'gate-1' },
    });

    expect(skeleton(wrapper)!.outerHTML).toBe(
      '<div class="vf-skeleton vf-skeleton--animated" style="border-radius: var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div>',
    );
  });

  it('renders the child inside the overlay and nowhere else', () => {
    const wrapper = mountGate();

    expect(skeleton(wrapper)!.parentElement).toBe(overlay(wrapper));
  });

  it('keeps the explanatory comment node beside the child', () => {
    // The comment is part of the historical markup. It is recorded so a port
    // that dropped it is a visible decision rather than an accident.
    expect(mountGate().html()).toContain(
      '<!-- Default skeleton primitive used by the gate when no custom skeleton slot is provided. -->',
    );
  });
});

describe('VfSkeletonGate characterization: consumer attributes', () => {
  it('appends a consumer class to the root after the canonical one', () => {
    expect(root(mountGate({ attrs: { class: 'consumer' } })).className).toBe('vf-skeleton-gate consumer');
  });

  it('merges a consumer style after the component declarations', () => {
    const wrapper = mountGate({ props: { minHeight: 40 }, attrs: { style: 'opacity: 0.5' } });

    expect(root(wrapper).getAttribute('style')).toBe(
      'min-height: 40px; --vf-skeleton-gate-fade-duration: 220ms; opacity: 0.5;',
    );
  });

  it('lets a consumer style override a declaration the component wrote', () => {
    const wrapper = mountGate({ props: { minHeight: 40 }, attrs: { style: 'min-height: 200px' } });

    expect(root(wrapper).style.minHeight).toBe('200px');
  });

  it('puts consumer attributes on the root rather than on either branch', () => {
    const wrapper = mountGate({ attrs: { 'data-testid': 'gate', id: 'gate-1' } });

    expect(root(wrapper).getAttribute('data-testid')).toBe('gate');
    expect(root(wrapper).getAttribute('id')).toBe('gate-1');
    expect(content(wrapper).hasAttribute('data-testid')).toBe(false);
    expect(overlay(wrapper).hasAttribute('data-testid')).toBe(false);
  });

  it('the quirk: a consumer aria-busy replaces the one the component wrote', () => {
    const wrapper = mountGate({ attrs: { 'aria-busy': 'false' } });

    expect(root(wrapper).getAttribute('aria-busy')).toBe('false');
  });

  it('a consumer aria-busy also reaches a ready gate, which writes none of its own', () => {
    const wrapper = mountGate({ props: { ready: true }, attrs: { 'aria-busy': 'true' } });

    expect(root(wrapper).getAttribute('aria-busy')).toBe('true');
  });

  it('writes no role of its own on any of its three elements', () => {
    const wrapper = mountGate();

    expect(root(wrapper).hasAttribute('role')).toBe(false);
    expect(content(wrapper).hasAttribute('role')).toBe(false);
    expect(overlay(wrapper).hasAttribute('role')).toBe(false);
  });

  it('exposes no live region and no status role', () => {
    expect(mountGate().html()).not.toContain('aria-live');
    expect(mountGate().html()).not.toContain('role="status"');
  });
});

describe('VfSkeletonGate characterization: consumer content ownership', () => {
  it('adds no focusable element of its own', () => {
    const wrapper = mountGate({ props: { ready: true } });

    expect(
      wrapper.element.querySelectorAll('a[href], button, input, select, textarea, [tabindex]').length,
    ).toBe(0);
  });

  it('leaves a consumer control in the content slot exactly as written', () => {
    const wrapper = mountGate({
      props: { ready: true },
      slots: { default: () => h('button', { type: 'button' }, 'Retry') },
    });
    const buttons = wrapper.element.querySelectorAll('button');

    expect(buttons.length).toBe(1);
    expect(buttons[0].outerHTML).toBe('<button type="button">Retry</button>');
    expect(buttons[0].parentElement).toBe(content(wrapper));
  });

  it('marks a consumer control inert and hidden while loading rather than removing it', () => {
    const wrapper = mountGate({ slots: { default: () => h('button', { type: 'button' }, 'Retry') } });

    // Still in the DOM, still one element, and unreachable - which is the
    // whole point of the inert/aria-hidden pair on the content wrapper.
    expect(wrapper.element.querySelectorAll('button').length).toBe(1);
    expect(content(wrapper).getAttribute('inert')).toBe('true');
    expect(content(wrapper).getAttribute('aria-hidden')).toBe('true');
  });
});

describe('VfSkeletonGate characterization: live transitions', () => {
  it('moves every ready-driven output when ready flips to true', async () => {
    const wrapper = mountGate({ slots: { default: () => 'Body' } });

    expect(root(wrapper).getAttribute('aria-busy')).toBe('true');

    await wrapper.setProps({ ready: true } as Partial<GateProps>);

    expect(root(wrapper).hasAttribute('aria-busy')).toBe(false);
    expect(content(wrapper).classList.contains('vf-skeleton-gate__content--ready')).toBe(true);
    expect(content(wrapper).hasAttribute('aria-hidden')).toBe(false);
    expect(content(wrapper).hasAttribute('inert')).toBe(false);
    expect(overlay(wrapper).style.display).toBe('none');
  });

  it('moves them back when ready flips to false', async () => {
    const wrapper = mountGate({ props: { ready: true }, slots: { default: () => 'Body' } });

    await wrapper.setProps({ ready: false } as Partial<GateProps>);

    expect(root(wrapper).getAttribute('aria-busy')).toBe('true');
    expect(content(wrapper).classList.contains('vf-skeleton-gate__content--ready')).toBe(false);
    expect(content(wrapper).getAttribute('inert')).toBe('true');
    expect(overlay(wrapper).style.display).toBe('');
  });

  it('keeps the same content element across the transition rather than recreating it', async () => {
    const wrapper = mountGate({ slots: { default: () => h('span', { class: 'consumer-body' }, 'Body') } });
    const before = wrapper.element.querySelector('.consumer-body');

    await wrapper.setProps({ ready: true } as Partial<GateProps>);

    // Node identity, not markup equality. This is what a v-if rewrite breaks:
    // consumer DOM state - scroll position, focus, an uncontrolled input's
    // value, a media element's playback - survives the transition here.
    expect(wrapper.element.querySelector('.consumer-body')).toBe(before);
  });

  it('keeps the same skeleton element across the transition', async () => {
    const wrapper = mountGate();
    const before = skeleton(wrapper);

    await wrapper.setProps({ ready: true } as Partial<GateProps>);

    expect(skeleton(wrapper)).toBe(before);
  });

  it('lands on exactly the markup a gate rendered ready from the start produces', async () => {
    const transitioned = mountGate({ slots: { default: () => 'Body' } });
    await transitioned.setProps({ ready: true } as Partial<GateProps>);
    await nextTick();

    const fresh = mountGate({ props: { ready: true }, slots: { default: () => 'Body' } });

    // The invariant the browser transition evidence rests on: a transition
    // converges on the canonical ready state rather than on a hybrid of the
    // two. A stale overlay or a half-updated attribute set fails here.
    expect(transitioned.html()).toBe(fresh.html());
  });

  it('does not change the forwarded child props when ready flips', async () => {
    const wrapper = mountGate({ props: { minHeight: 40, radius: '8px' } });
    const before = skeleton(wrapper)!.outerHTML;

    await wrapper.setProps({ ready: true } as Partial<GateProps>);

    expect(skeleton(wrapper)!.outerHTML).toBe(before);
  });
});

describe('VfSkeletonGate characterization: preserveLastHeight', () => {
  function stubMeasurement(height: number) {
    const observed: Element[] = [];
    let trigger: (() => void) | undefined;

    class ResizeObserverMock {
      constructor(callback: () => void) {
        trigger = callback;
      }
      observe(element: Element) {
        observed.push(element);
      }
      disconnect() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => height });

    return {
      observed,
      fire: () => trigger?.(),
      restore: () => {
        if (descriptor) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', descriptor);
      },
    };
  }

  it('does nothing at all when it is off', () => {
    const measurement = stubMeasurement(84);
    try {
      expect(root(mountGate({ slots: { default: () => 'Body' } })).style.minHeight).toBe('');
    } finally {
      measurement.restore();
    }
  });

  it('writes the measured content height onto the root while loading', async () => {
    const measurement = stubMeasurement(84);
    try {
      const wrapper = mountGate({ props: { preserveLastHeight: true }, slots: { default: () => 'Body' } });
      await nextTick();

      expect(root(wrapper).style.minHeight).toBe('84px');
    } finally {
      measurement.restore();
    }
  });

  it('does not have the measured height in the first rendered frame', async () => {
    // onMounted writes a ref, and a ref written during mount re-renders on the
    // next tick. So the very first paint of a preserveLastHeight gate carries
    // whatever reserveHeight or minHeight said, and the measured height
    // replaces it a tick later. A port that computed the height during render
    // would remove that frame and would be a different component.
    const measurement = stubMeasurement(84);
    try {
      const wrapper = mountGate({
        props: { preserveLastHeight: true, minHeight: 40 },
        slots: { default: () => 'Body' },
      });

      expect(root(wrapper).style.minHeight).toBe('40px');

      await nextTick();

      expect(root(wrapper).style.minHeight).toBe('84px');
    } finally {
      measurement.restore();
    }
  });

  it('outranks both reserveHeight and minHeight while loading', async () => {
    const measurement = stubMeasurement(84);
    try {
      const wrapper = mountGate({
        props: { preserveLastHeight: true, reserveHeight: 120, minHeight: 40 },
        slots: { default: () => 'Body' },
      });
      await nextTick();

      expect(root(wrapper).style.minHeight).toBe('84px');
    } finally {
      measurement.restore();
    }
  });

  it('stands down as soon as the gate is ready, handing the root back to reserveHeight', async () => {
    const measurement = stubMeasurement(84);
    try {
      const wrapper = mountGate({
        props: { preserveLastHeight: true, reserveHeight: 120 },
        slots: { default: () => 'Body' },
      });
      await nextTick();
      expect(root(wrapper).style.minHeight).toBe('84px');

      await wrapper.setProps({ ready: true } as Partial<GateProps>);

      expect(root(wrapper).style.minHeight).toBe('120px');
    } finally {
      measurement.restore();
    }
  });

  it('measures nothing when the content wrapper has no height', async () => {
    // `if (height && height > 0)` - a zero-height content wrapper leaves the
    // measurement null, so an empty gate behaves as if the prop were off. This
    // is the configuration in which the prop is safe to compare across
    // adapters, because there is nothing for a client runtime to measure.
    const measurement = stubMeasurement(0);
    try {
      const wrapper = mountGate({ props: { preserveLastHeight: true } });
      await nextTick();

      expect(root(wrapper).style.minHeight).toBe('');
    } finally {
      measurement.restore();
    }
  });

  it('observes the content wrapper, not the root or the overlay', () => {
    const measurement = stubMeasurement(84);
    try {
      const wrapper = mountGate({ props: { preserveLastHeight: true }, slots: { default: () => 'Body' } });

      expect(measurement.observed).toEqual([content(wrapper)]);
    } finally {
      measurement.restore();
    }
  });

  it('observes even when preserveLastHeight is off, and the measurement is simply unused', () => {
    // The observer is unconditional; only the *use* of what it measures is
    // gated. A port that made the observer conditional would be tidier and
    // would change when the height is first known.
    const measurement = stubMeasurement(84);
    try {
      const wrapper = mountGate({ slots: { default: () => 'Body' } });

      expect(measurement.observed).toEqual([content(wrapper)]);
    } finally {
      measurement.restore();
    }
  });

  it('survives an environment with no ResizeObserver at all', () => {
    vi.stubGlobal('ResizeObserver', undefined);

    expect(() => mountGate({ props: { preserveLastHeight: true }, slots: { default: () => 'Body' } })).not.toThrow();
  });

  it('disconnects the observer when the gate unmounts', () => {
    const disconnected: number[] = [];
    class ResizeObserverMock {
      observe() {}
      disconnect() {
        disconnected.push(1);
      }
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    mountGate({ slots: { default: () => 'Body' } }).unmount();

    expect(disconnected.length).toBe(1);
  });
});

describe('VfSkeletonGate characterization: SSR', () => {
  it('renders the loading branch server-side, with the content wrapper carrying an empty style', async () => {
    expect(await ssrGate({}, 'Body')).toBe(
      '<div class="vf-skeleton-gate" style="--vf-skeleton-gate-fade-duration:220ms;" aria-busy="true">' +
        '<div class="vf-skeleton-gate__content" style="" aria-hidden="true" inert><!--[-->Body<!--]--></div>' +
        '<div class="vf-skeleton-gate__overlay" style="" aria-hidden="true"><!--[-->' +
        '<!-- Default skeleton primitive used by the gate when no custom skeleton slot is provided. -->' +
        '<div class="vf-skeleton vf-skeleton--animated" style="border-radius:var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div><!--]--></div></div>',
    );
  });

  it('renders the ready branch server-side with the overlay already display:none', async () => {
    expect(await ssrGate({ ready: true }, 'Body')).toBe(
      '<div class="vf-skeleton-gate" style="--vf-skeleton-gate-fade-duration:220ms;">' +
        '<div class="vf-skeleton-gate__content vf-skeleton-gate__content--ready" style=""><!--[-->Body<!--]--></div>' +
        '<div class="vf-skeleton-gate__overlay" style="display:none;" aria-hidden="true"><!--[-->' +
        '<!-- Default skeleton primitive used by the gate when no custom skeleton slot is provided. -->' +
        '<div class="vf-skeleton vf-skeleton--animated" style="border-radius:var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div><!--]--></div></div>',
    );
  });

  it('renders both branches server-side in both states', async () => {
    for (const ready of [false, true]) {
      const html = await ssrGate({ ready }, 'Body');

      expect(html).toContain('vf-skeleton-gate__content');
      expect(html).toContain('vf-skeleton-gate__overlay');
      expect(html).toContain('vf-skeleton');
      expect(html).toContain('Body');
    }
  });

  it('writes bare inert server-side rather than inert="true"', async () => {
    expect(await ssrGate({}, 'Body')).toContain('inert>');
  });

  it('preserveLastHeight has no server-rendered effect whatsoever', async () => {
    // The measurement happens in onMounted, which never runs during SSR. This
    // is why a server-side adapter reproduces the prop by accepting it and
    // rendering as though it were off - that is not an omission, it is the
    // reference server output.
    expect(await ssrGate({ preserveLastHeight: true }, 'Body')).toBe(await ssrGate({}, 'Body'));
    expect(await ssrGate({ preserveLastHeight: true, reserveHeight: 120 }, 'Body')).toBe(
      await ssrGate({ reserveHeight: 120 }, 'Body'),
    );
  });

  it('applies the reserveHeight precedence server-side exactly as on the client', async () => {
    expect(await ssrGate({ minHeight: 40, reserveHeight: 120 })).toContain('min-height:120px;');
    expect(await ssrGate({ minHeight: 50, reserveHeight: 0 })).toContain('min-height:0px;');
  });

  it('the client/SSR divergence: an empty reserveHeight writes min-height:; server-side', async () => {
    // The client drops a style property whose value is '', so the root carries
    // only the fade-duration property. The SSR serialiser does not: it writes
    // the property with an empty value, producing the invalid-but-harmless
    // `min-height:;`. Both are the reference behaviour, they disagree, and a
    // server-side adapter has to choose. The Razor adapter reproduces the
    // client form, because that is what every browser ends up with once Vue
    // hydrates and what the parity harness therefore compares.
    expect(await ssrGate({ minHeight: 50, reserveHeight: '' })).toContain(
      'style="min-height:;--vf-skeleton-gate-fade-duration:220ms;"',
    );
    expect(root(mountGate({ props: { minHeight: 50, reserveHeight: '' } })).getAttribute('style')).toBe(
      '--vf-skeleton-gate-fade-duration: 220ms;',
    );
  });

  it('forwards the same child props server-side', async () => {
    expect(await ssrGate({ minHeight: 40, radius: '8px' })).toContain(
      '<div class="vf-skeleton vf-skeleton--animated" style="min-height:40px;border-radius:8px;" aria-hidden="true">',
    );
  });
});
