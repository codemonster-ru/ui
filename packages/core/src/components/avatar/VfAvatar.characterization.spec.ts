// Characterization of the historical VfAvatar at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The presentation component of the M16 batch and the one that exercises the
// neutral icon pipeline. Its contract is a four-branch fallback chain:
//
//     image  ->  label  ->  icon  ->  default slot
//
// The chain is the product, not an implementation detail. Each branch renders a
// different element with a different class and different accessibility
// semantics, and a port that reordered two of them would still render an
// avatar for every input - which is exactly why the order is pinned here branch
// by branch rather than by a single "renders something" assertion.
//
// Three further behaviours are historical:
//
//   - the tests are plain truthiness, so an empty string does not select its
//     own branch. `image=""` falls through to the label exactly as an absent
//     image does, and there is no way to request an empty label;
//   - `imageAlt` defaults to `''`, so the image branch always carries an `alt`
//     attribute and is therefore decorative by default rather than unlabelled;
//   - the icon branch passes `aria-hidden="true"` to the glyph, so an
//     icon-only avatar exposes no accessible name at all.
//
// The icon branch is asserted here against the icon stub this package mounts in
// place of the real icons package: what these tests can prove is that the
// branch delegates to VueIconify with the avatar's own class, the requested
// icon name and the decorative flag. That the delegation produces the *right
// glyph geometry* is not knowable from a stub and is proven where the real
// package is loaded: the three-way parity run and the packaged Composer
// consumer.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfAvatar from './VfAvatar.vue';

type AvatarProps = InstanceType<typeof VfAvatar>['$props'];

function mountAvatar({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<AvatarProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfAvatar, { props: props as AvatarProps, attrs, slots: slots as never });
}

async function ssrAvatar(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfAvatar, props, slots as never) });

  return await renderToString(app);
}

/** Which of the four branches actually rendered, read off the DOM. */
function branchOf(wrapper: ReturnType<typeof mountAvatar>): 'image' | 'label' | 'icon' | 'slot' | 'empty' {
  if (wrapper.find('img.vf-avatar__image').exists()) return 'image';
  if (wrapper.find('span.vf-avatar__label').exists()) return 'label';
  if (wrapper.find('.vf-avatar__icon').exists()) return 'icon';

  return wrapper.element.children.length > 0 || wrapper.text() !== '' ? 'slot' : 'empty';
}

describe('VfAvatar characterization: structure', () => {
  it('renders a span root', () => {
    expect(mountAvatar().element.tagName).toBe('SPAN');
  });

  it('renders an empty span when nothing selects a branch', () => {
    // Not an error and not a placeholder: an avatar with no content is valid.
    const avatar = mountAvatar();

    expect(avatar.classes()).toEqual(['vf-avatar']);
    expect(avatar.element.children.length).toBe(0);
    expect(avatar.text()).toBe('');
  });

  it('renders exactly one child in every branch that has one', () => {
    for (const props of [{ image: '/a.png' }, { label: 'MC' }, { icon: 'user' }] as Partial<AvatarProps>[]) {
      expect(mountAvatar({ props }).element.children.length).toBe(1);
    }
  });

  it('emits no events', () => {
    expect(Object.keys(mountAvatar().emitted())).toEqual([]);
  });
});

describe('VfAvatar characterization: props and defaults', () => {
  it('accepts exactly six props', () => {
    const avatar = mountAvatar({ props: { image: '/a.png', label: 'MC', icon: 'user' } });

    expect(Object.keys(avatar.props() as Record<string, unknown>).sort()).toEqual([
      'icon',
      'image',
      'imageAlt',
      'label',
      'shape',
      'size',
    ]);
  });

  it('defaults size to md and shape to square', () => {
    expect(mountAvatar().props('size')).toBe('md');
    expect(mountAvatar().props('shape')).toBe('square');
  });

  it('defaults imageAlt to the empty string rather than to undefined', () => {
    // Which is why an image avatar is decorative by default: it carries
    // alt="", not a missing alt.
    expect(mountAvatar().props('imageAlt')).toBe('');
  });

  it('leaves image, label and icon undefined by default', () => {
    const avatar = mountAvatar();

    expect(avatar.props('image')).toBeUndefined();
    expect(avatar.props('label')).toBeUndefined();
    expect(avatar.props('icon')).toBeUndefined();
  });
});

describe('VfAvatar characterization: the fallback chain', () => {
  it('renders the image when an image is given, whatever else is given', () => {
    expect(
      branchOf(mountAvatar({ props: { image: '/a.png', label: 'MC', icon: 'user' }, slots: { default: 'S' } })),
    ).toBe('image');
  });

  it('renders the label when there is no image', () => {
    expect(branchOf(mountAvatar({ props: { label: 'MC', icon: 'user' }, slots: { default: 'S' } }))).toBe('label');
  });

  it('renders the icon when there is no image and no label', () => {
    expect(branchOf(mountAvatar({ props: { icon: 'user' }, slots: { default: 'S' } }))).toBe('icon');
  });

  it('renders the default slot only when all three props are absent', () => {
    expect(branchOf(mountAvatar({ slots: { default: 'S' } }))).toBe('slot');
  });

  it('puts the label ahead of the icon, which is the pair most easily reversed', () => {
    // Stated on its own because it is the only adjacent pair where both
    // branches are plausible content for an avatar. Reversing image and label,
    // or icon and slot, produces something a reviewer would notice.
    const avatar = mountAvatar({ props: { label: 'MC', icon: 'user' } });

    expect(avatar.find('span.vf-avatar__label').exists()).toBe(true);
    expect(avatar.find('.vf-avatar__icon').exists()).toBe(false);
  });

  it('never renders two branches at once', () => {
    const avatar = mountAvatar({ props: { image: '/a.png', label: 'MC', icon: 'user' }, slots: { default: 'S' } });

    expect(avatar.findAll('img, span.vf-avatar__label, .vf-avatar__icon')).toHaveLength(1);
    expect(avatar.text()).toBe('');
  });

  it('treats an empty image as no image', () => {
    expect(branchOf(mountAvatar({ props: { image: '', label: 'MC' } }))).toBe('label');
  });

  it('treats an empty label as no label', () => {
    expect(branchOf(mountAvatar({ props: { label: '', icon: 'user' } }))).toBe('icon');
  });

  it('treats an empty icon as no icon', () => {
    expect(branchOf(mountAvatar({ props: { icon: '' }, slots: { default: 'S' } }))).toBe('slot');
  });

  it('falls all the way through when every channel is an empty string', () => {
    expect(branchOf(mountAvatar({ props: { image: '', label: '', icon: '' } }))).toBe('empty');
  });
});

describe('VfAvatar characterization: the image branch', () => {
  it('renders an img carrying the image class and the src', () => {
    const image = mountAvatar({ props: { image: '/a.png' } }).find('img');

    expect(image.classes()).toEqual(['vf-avatar__image']);
    expect(image.attributes('src')).toBe('/a.png');
  });

  it('writes an empty alt when no imageAlt is given', () => {
    // Present and empty, which marks the image decorative. A missing alt would
    // make it an unlabelled image instead, and screen readers treat the two
    // differently.
    expect(
      mountAvatar({ props: { image: '/a.png' } })
        .find('img')
        .attributes('alt'),
    ).toBe('');
  });

  it('writes the alt verbatim when given', () => {
    expect(
      mountAvatar({ props: { image: '/a.png', imageAlt: 'Maya Chen' } })
        .find('img')
        .attributes('alt'),
    ).toBe('Maya Chen');
  });

  it('ignores imageAlt entirely when the image branch is not taken', () => {
    const avatar = mountAvatar({ props: { label: 'L', imageAlt: 'unused' } });

    expect(avatar.html()).not.toContain('unused');
  });

  it('adds no loading, decoding or dimension attributes', () => {
    const image = mountAvatar({ props: { image: '/a.png' } }).find('img');

    for (const name of ['loading', 'decoding', 'width', 'height', 'referrerpolicy']) {
      expect(image.attributes(name)).toBeUndefined();
    }
  });

  it('has no image-failure handling of any kind', () => {
    // No @error, no fallback to the label, no state. A broken src renders a
    // broken image, and that is the historical behaviour.
    const avatar = mountAvatar({ props: { image: '/missing.png', label: 'MC' } });

    avatar.find('img').trigger('error');

    expect(branchOf(avatar)).toBe('image');
  });
});

describe('VfAvatar characterization: the label branch', () => {
  it('renders a span carrying the label class and the text', () => {
    const label = mountAvatar({ props: { label: 'MC' } }).find('span.vf-avatar__label');

    expect(label.text()).toBe('MC');
  });

  it('does not transform the label', () => {
    // No initials extraction, no uppercasing, no truncation in markup. The
    // stylesheet ellipsises; the component writes what it was given.
    expect(
      mountAvatar({ props: { label: 'maya chen' } })
        .find('span.vf-avatar__label')
        .text(),
    ).toBe('maya chen');
  });

  it('escapes hostile label text as interpolated content', () => {
    const avatar = mountAvatar({ props: { label: '<img src=x onerror=alert(1)>' } });

    expect(avatar.find('span.vf-avatar__label').element.children.length).toBe(0);
    expect(avatar.html()).toContain('&lt;img');
  });
});

describe('VfAvatar characterization: the icon branch', () => {
  it('delegates to the icon component with the avatar icon class', () => {
    // The class lands on the glyph rather than on a wrapper the avatar owns:
    // there is no `span.vf-avatar__icon` of the component's own making.
    const icon = mountAvatar({ props: { icon: 'user' } }).find('.vf-avatar__icon');

    expect(icon.exists()).toBe(true);
  });

  it('passes the icon name straight through', () => {
    expect(
      mountAvatar({ props: { icon: 'user' } })
        .find('.vf-avatar__icon')
        .attributes('icon'),
    ).toBe('user');
  });

  it('marks the glyph decorative', () => {
    // So an icon-only avatar contributes no accessible name at all. Adding one
    // would be an accessibility improvement and a product change.
    //
    // Read off what the avatar passed rather than off the rendered element: the
    // icon stub this package mounts writes an aria-hidden of its own, so a DOM
    // assertion would still pass if VfAvatar stopped passing one. Found by the
    // characterization mutation gate reporting avatar-exposes-the-decorative-
    // glyph as MISSED.
    const glyph = mountAvatar({ props: { icon: 'user' } }).findComponent({ name: 'VueIconifyStub' });

    expect(glyph.vm.$attrs['aria-hidden']).toBe('true');
  });

  it('passes the avatar icon class to the glyph rather than wrapping it', () => {
    const glyph = mountAvatar({ props: { icon: 'user' } }).findComponent({ name: 'VueIconifyStub' });

    expect(glyph.vm.$attrs.class).toBe('vf-avatar__icon');
  });

  it('passes an unknown icon name through without validating it', () => {
    // The avatar performs no lookup of its own. What an unknown name renders is
    // the icon package's decision, not this component's.
    expect(
      mountAvatar({ props: { icon: 'no-such-glyph' } })
        .find('.vf-avatar__icon')
        .attributes('icon'),
    ).toBe('no-such-glyph');
  });

  it('passes no size to the glyph, so the icon package default applies', () => {
    expect(
      mountAvatar({ props: { icon: 'user' } })
        .find('.vf-avatar__icon')
        .attributes('size'),
    ).toBeUndefined();
  });
});

describe('VfAvatar characterization: the default slot branch', () => {
  it('renders arbitrary slot markup unchanged', () => {
    const avatar = mountAvatar({ slots: { default: '<b class="mine">X</b>' } });

    expect(avatar.find('b.mine').exists()).toBe(true);
  });

  it('wraps slot content in nothing at all', () => {
    // Unlike the label branch, which wraps its text in a classed span.
    const avatar = mountAvatar({ slots: { default: '<b>X</b>' } });

    expect(avatar.element.children[0]?.tagName).toBe('B');
  });

  it('is unreachable once any of the three props is truthy', () => {
    for (const props of [{ image: '/a.png' }, { label: 'MC' }, { icon: 'user' }] as Partial<AvatarProps>[]) {
      expect(mountAvatar({ props, slots: { default: 'SHOULD NOT APPEAR' } }).text()).not.toContain('SHOULD NOT APPEAR');
    }
  });

  it('ignores named slots it does not declare', () => {
    const avatar = mountAvatar({ slots: { header: 'NOPE', icon: 'ALSO NOPE' } });

    expect(avatar.text()).toBe('');
  });
});

describe('VfAvatar characterization: classes', () => {
  it('emits no modifier at the default size and shape', () => {
    expect(mountAvatar().classes()).toEqual(['vf-avatar']);
  });

  it('emits no size modifier when md is passed explicitly', () => {
    expect(mountAvatar({ props: { size: 'md' } }).classes()).toEqual(['vf-avatar']);
  });

  it('emits no shape modifier when square is passed explicitly', () => {
    // Suppressed by a different rule than the size: the shape modifier exists
    // only for `circle`, so `square` has no modifier to suppress.
    expect(mountAvatar({ props: { shape: 'square' } }).classes()).toEqual(['vf-avatar']);
  });

  it('emits the sm and lg size modifiers', () => {
    expect(mountAvatar({ props: { size: 'sm' } }).classes()).toEqual(['vf-avatar', 'vf-avatar--sm']);
    expect(mountAvatar({ props: { size: 'lg' } }).classes()).toEqual(['vf-avatar', 'vf-avatar--lg']);
  });

  it('emits the circle modifier after the size modifier', () => {
    expect(mountAvatar({ props: { size: 'lg', shape: 'circle' } }).classes()).toEqual([
      'vf-avatar',
      'vf-avatar--lg',
      'vf-avatar--circle',
    ]);
  });

  it('appends a caller class after the canonical classes', () => {
    expect(mountAvatar({ props: { size: 'sm' }, attrs: { class: 'mine' } }).classes()).toEqual([
      'vf-avatar',
      'vf-avatar--sm',
      'mine',
    ]);
  });

  it('puts no branch class on the root', () => {
    // The branch is visible in the child, never in the root class list.
    for (const props of [{ image: '/a.png' }, { label: 'MC' }, { icon: 'user' }] as Partial<AvatarProps>[]) {
      expect(mountAvatar({ props }).classes()).toEqual(['vf-avatar']);
    }
  });
});

describe('VfAvatar characterization: attrs', () => {
  it('forwards style, data and id attributes to the root', () => {
    const avatar = mountAvatar({ attrs: { style: 'opacity: 0.5', 'data-testid': 'avatar', id: 'a1' } });

    expect(avatar.attributes('style')).toBe('opacity: 0.5;');
    expect(avatar.attributes('data-testid')).toBe('avatar');
    expect(avatar.attributes('id')).toBe('a1');
  });

  it('forwards consumer ARIA to the root, which writes none of its own', () => {
    const avatar = mountAvatar({ props: { icon: 'user' }, attrs: { role: 'img', 'aria-label': 'Maya Chen' } });

    expect(avatar.attributes('role')).toBe('img');
    expect(avatar.attributes('aria-label')).toBe('Maya Chen');
  });

  it('exposes no role or accessible name of its own', () => {
    const avatar = mountAvatar({ props: { image: '/a.png', imageAlt: 'Maya' } });

    expect(avatar.attributes('role')).toBeUndefined();
    expect(avatar.attributes('aria-label')).toBeUndefined();
  });

  it('does not leak attrs onto the branch child', () => {
    // inheritAttrs is false and attrs are bound to the root explicitly, so a
    // caller attribute never reaches the img, the label or the glyph.
    const avatar = mountAvatar({ props: { image: '/a.png' }, attrs: { 'data-testid': 'avatar' } });

    expect(avatar.find('img').attributes('data-testid')).toBeUndefined();
  });
});

describe('VfAvatar characterization: SSR', () => {
  it('renders the image branch server-side', async () => {
    expect(await ssrAvatar({ image: '/a.png', imageAlt: 'Maya' })).toBe(
      '<span class="vf-avatar"><img class="vf-avatar__image" src="/a.png" alt="Maya"></span>',
    );
  });

  it('renders the label branch server-side', async () => {
    expect(await ssrAvatar({ label: 'MC', size: 'sm' })).toBe(
      '<span class="vf-avatar vf-avatar--sm"><span class="vf-avatar__label">MC</span></span>',
    );
  });

  it('renders the slot branch server-side', async () => {
    expect(await ssrAvatar({ shape: 'circle' }, { default: () => h('b', 'X') })).toContain(
      '<span class="vf-avatar vf-avatar--circle">',
    );
  });

  it('escapes a hostile alt rather than letting it close the attribute', async () => {
    const html = await ssrAvatar({ image: '/a.png', imageAlt: 'a"b<c&d' });

    expect(html).toContain('alt="a&quot;b&lt;c&amp;d"');
  });

  it('escapes a hostile src', async () => {
    expect(await ssrAvatar({ image: '/a.png?x="y' })).toContain('src="/a.png?x=&quot;y"');
  });

  it('escapes hostile label text', async () => {
    expect(await ssrAvatar({ label: '<b>x</b>' })).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
