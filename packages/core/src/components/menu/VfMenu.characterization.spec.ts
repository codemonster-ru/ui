// Characterization of the historical VfMenu at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The smaller half of the M27 unit, and the thinnest component migrated so
// far: one `div.vf-menu[role=menu]` around an unscoped default slot. No
// props, no emits, no state, no provide, no lifecycle, no DOM or browser API.
// It does not know VfMenuItem exists - no import, no inject, no child
// traversal, no event delegation - and `menu.css` has no descendant
// combinator, so the coupling between the two is the block name and nothing
// else.
//
// What is pinned here is almost entirely one quirk, because it is the whole
// of what a migration could get wrong:
//
//   - `v-bind="attrs"` comes *last*, after `class` and `role`. Vue's
//     mergeProps lets the later source win for a plain attribute, so a
//     consumer `role` overrides `role="menu"` and the component does not
//     protect it. Only `class` merges rather than replacing, and it merges
//     component-first: `vf-menu` then the consumer's;
//   - VfMenuItem's ordering is the exact inverse, and the two must not be
//     made to agree. VfMenuItem.characterization.spec.ts pins that side.
//
// The interaction contract is that there is none. A menu with no items is a
// menu; the reference writes no tabindex, no aria-orientation, no
// aria-activedescendant and no open state, and handles no key. The arrow
// keys, Escape, focus-on-open and close-on-select that people attribute to a
// menu are VfDropdown's, which queries `[role="menuitem"]` inside its own
// panel and is not migrated in M27.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfMenu from './VfMenu.vue';

function mountMenu(attrs: Record<string, unknown> = {}, slot?: string) {
  return mount(VfMenu, { attrs, slots: slot === undefined ? {} : { default: slot } });
}

const ssr = async (props: Record<string, unknown> = {}, slot?: () => unknown) =>
  await renderToString(createSSRApp({ render: () => h(VfMenu, props, slot ? { default: slot } : undefined) }));

// ------------------------------------------------------------------ structure

describe('VfMenu characterization: structure', () => {
  it('renders exactly one div.vf-menu[role=menu] and nothing else', () => {
    const wrapper = mountMenu();

    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toEqual(['vf-menu']);
    expect(wrapper.attributes('role')).toBe('menu');
    expect(wrapper.html({ raw: true })).toBe('<div class="vf-menu" role="menu"></div>');
  });

  it('renders an empty menu on the server as the same single node', async () => {
    expect(await ssr()).toBe('<div class="vf-menu" role="menu"><!--[--><!--]--></div>');
  });

  it('places one consumer child directly in the root, with no wrapper', () => {
    expect(mountMenu({}, '<span>Item</span>').html({ raw: true })).toBe(
      '<div class="vf-menu" role="menu"><span>Item</span></div>',
    );
  });

  it('places several consumer children in order, with no wrapper and no separator', () => {
    const wrapper = mountMenu({}, '<span>One</span><span>Two</span><span>Three</span>');

    expect(wrapper.element.children).toHaveLength(3);
    expect(wrapper.html({ raw: true })).toBe(
      '<div class="vf-menu" role="menu"><span>One</span><span>Two</span><span>Three</span></div>',
    );
  });

  it('keeps nested consumer markup verbatim', () => {
    const wrapper = mountMenu({}, '<div class="group"><span>Deep</span></div>');

    expect(wrapper.html({ raw: true })).toBe(
      '<div class="vf-menu" role="menu"><div class="group"><span>Deep</span></div></div>',
    );
  });

  it('hosts raw role=menuitem children without touching them, as the historical spec used it', () => {
    const wrapper = mountMenu(
      {},
      '<button role="menuitem">Edit</button><button class="vf-menu__item--danger" role="menuitem">Delete</button>',
    );

    // The historical VfMenu.spec.ts mounted it exactly this way, with
    // VfMenuItem stubbed out entirely. The menu adds nothing to them: no
    // tabindex, no data attribute, no id, no aria-activedescendant.
    expect(wrapper.findAll('[role="menuitem"]')).toHaveLength(2);
    expect(wrapper.find('.vf-menu__item--danger').text()).toBe('Delete');
    expect(wrapper.findAll('[role="menuitem"]')[0].attributes('tabindex')).toBeUndefined();
    expect(wrapper.html({ raw: true })).toBe(
      '<div class="vf-menu" role="menu"><button role="menuitem">Edit</button>' +
        '<button class="vf-menu__item--danger" role="menuitem">Delete</button></div>',
    );
  });
});

// ---------------------------------------------------------- attrs and merging

describe('VfMenu characterization: attrs', () => {
  it('forwards id, data-* and aria-label to the root', () => {
    const wrapper = mountMenu({ id: 'actions', 'data-testid': 'menu', 'aria-label': 'Actions' }, 'x');

    expect(wrapper.attributes('id')).toBe('actions');
    expect(wrapper.attributes('data-testid')).toBe('menu');
    expect(wrapper.attributes('aria-label')).toBe('Actions');
  });

  it('forwards aria-labelledby, aria-describedby and style to the root', () => {
    const wrapper = mountMenu(
      { 'aria-labelledby': 'trigger', 'aria-describedby': 'hint', style: 'min-width: 10rem;' },
      'x',
    );

    expect(wrapper.attributes('aria-labelledby')).toBe('trigger');
    expect(wrapper.attributes('aria-describedby')).toBe('hint');
    expect(wrapper.attributes('style')).toBe('min-width: 10rem;');
  });

  it('merges a consumer class after the block class, not before it', () => {
    // The inverse of VfMenuItem, which merges the consumer's class first.
    // `v-bind="attrs"` is last here, so `vf-menu` is the earlier source.
    expect(mountMenu({ class: 'mine' }, 'x').attributes('class')).toBe('vf-menu mine');
  });

  it('lets a consumer tabindex land on the root, which writes none of its own', () => {
    expect(mountMenu({ tabindex: '0' }, 'x').attributes('tabindex')).toBe('0');
    expect(mountMenu({}, 'x').attributes('tabindex')).toBeUndefined();
  });

  it('lets a consumer role override role=menu, because attrs are bound last', () => {
    // Load-bearing. The component does not protect its own role, and a
    // migration that bound attrs first - or that hardcoded the role after
    // them - would silently make this attribute unoverridable.
    const wrapper = mountMenu({ role: 'list' }, 'x');

    expect(wrapper.attributes('role')).toBe('list');
    expect(wrapper.html({ raw: true })).toBe('<div class="vf-menu" role="list">x</div>');
  });

  it('renders the whole attr surface in one shape, class merged and role replaced', () => {
    expect(mountMenu({ id: 'm', class: 'mine', role: 'list', tabindex: '0' }, 'x').html({ raw: true })).toBe(
      '<div class="vf-menu mine" role="list" id="m" tabindex="0">x</div>',
    );
  });

  it('renders the same attr surface on the server', async () => {
    expect(await ssr({ id: 'm', class: 'mine', role: 'list' }, () => 'x')).toBe(
      '<div class="vf-menu mine" role="list" id="m"><!--[-->x<!--]--></div>',
    );
  });
});

// ---------------------------------------------------------------- no contract

describe('VfMenu characterization: what the component does not own', () => {
  it('declares no props and no emits', () => {
    // Reading it off the component rather than the docs: a migration that
    // grew an `orientation` or an `open` prop would fail here.
    const definition = VfMenu as unknown as { props?: unknown; emits?: unknown };

    expect(definition.props ?? {}).toEqual({});
    expect(definition.emits ?? undefined).toBeUndefined();
  });

  it('emits nothing of its own when its content is clicked and does not stop the click', async () => {
    const wrapper = mountMenu({}, '<button role="menuitem">Edit</button>');
    const seen: string[] = [];
    wrapper.element.addEventListener('click', () => seen.push('menu'));

    await wrapper.get('button').trigger('click');

    // The click reaches the menu root and travels on; the menu neither
    // handles it nor emits anything of its own. Closing on select is
    // VfDropdown's behaviour, on VfDropdown's own panel. test-utils records
    // the bubbled native `click` for a component with no declared emits, so
    // what is asserted is that nothing *else* was emitted.
    expect(seen).toEqual(['menu']);
    expect(Object.keys(wrapper.emitted())).toEqual(['click']);
  });

  it('handles no key: arrows, Home, End and Escape change nothing', async () => {
    const wrapper = mountMenu({}, '<button role="menuitem">A</button><button role="menuitem">B</button>');
    const before = wrapper.html({ raw: true });

    for (const key of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape']) {
      await wrapper.trigger('keydown', { key });
    }

    expect(wrapper.html({ raw: true })).toBe(before);
    expect(Object.keys(wrapper.emitted())).toEqual(['keydown']);
  });

  it('writes no menu-widget ARIA of its own', () => {
    const wrapper = mountMenu({}, '<button role="menuitem">A</button>');

    expect(wrapper.attributes('aria-orientation')).toBeUndefined();
    expect(wrapper.attributes('aria-activedescendant')).toBeUndefined();
    expect(wrapper.attributes('aria-hidden')).toBeUndefined();
    expect(wrapper.attributes('id')).toBeUndefined();
  });
});
