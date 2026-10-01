// Characterization of the historical VfNavMenu at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The M33 component: a recursive navigation tree. VfNavMenu owns the state -
// the active value and the list of expanded values - and VfNavMenuItemNode
// renders one item per <li>, recursing into its children. What is pinned here,
// before anything is moved, is what the reference does rather than what a
// navigation tree "should" do:
//
//   - the topology. nav > probe span + ul > li per item. A group is a div and
//     its children are an always-rendered nested ul; a branch (an item with
//     non-empty children that is not a group) is a button and its children sit
//     in a collapse div that exists only while it is expanded; any other item
//     is a leaf - an anchor when it has `href` or `to` defined, otherwise a
//     button. Every item element carries `--vf-nav-menu-level` inline;
//   - the active value is `modelValue ?? internal`, and the internal value is
//     seeded from `defaultValue` and written only when `modelValue` is
//     undefined. A click on an enabled leaf emits update:modelValue, change and
//     select, in that order, every time - also on the active leaf. A branch
//     click emits nothing;
//   - expansion is one list of values in the root. Activating a value adds its
//     ancestors - group values included - and nothing ever removes them except
//     a toggle. Closing a branch removes that value only, so its descendants
//     stay expanded and reappear when it is reopened. In single mode, opening
//     a branch first removes every *sibling* branch and every branch below
//     those siblings, where siblings are the children of the same parent path -
//     a group is a parent - and leaves its own descendants and every other
//     subtree alone. Nothing enforces single mode on what activation opened;
//   - links: `href` and `to` select an anchor by definedness, so `href: ''` is
//     a link; `to` hands off to whatever is registered as `RouterLink` and
//     wins over `href`; rel is VfLink's rule (explicit, else noopener for
//     `_blank`); a disabled link keeps its href, gains aria-disabled and
//     tabindex=-1, and its click is prevented; a disabled button is natively
//     disabled;
//   - the transition is Vue's <Transition> with JS hooks and *no* `css:false`:
//     the hooks write inline height, opacity, overflow and transition, and Vue
//     itself adds the default `v-` classes and finishes from `transitionend` -
//     counting one event per listed duration, on the element itself - or from
//     a timeout of the longest computed duration plus one millisecond;
//   - compactness: a sidebar is compact when `compact` says so, otherwise when
//     its measured width is at most the CSS probe's width. Measurement happens
//     on mount and on every ResizeObserver callback - never on the server;
//   - no keyboard handling of its own: buttons and links are native.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount, type VueWrapper } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, nextTick, reactive, toRaw, type PropType } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The icons package is stubbed with the real name mapping, as the breadcrumbs
// characterization does: `icons.chevronDown` is 'chevron-down' and
// `icons.externalLink` is 'external-link' in the real package. The stub
// records the glyph name and the size the component passed.
vi.mock('@codemonster-ru/vueforge-icons', () => {
  const toKebabCase = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

  return {
    VueIconify: {
      name: 'VueIconifyStub',
      props: { icon: String, size: String },
      template: '<span class="vf-icon" :data-icon="icon" :data-size="size" />',
    },
    icons: new Proxy({}, { get: (_target, property) => toKebabCase(String(property)) }),
  };
});

import VfNavMenu from './VfNavMenu.vue';
import type { VfNavMenuItem } from '@/types/components';

type NavMenuProps = InstanceType<typeof VfNavMenu>['$props'];

const CHEVRON = '<span class="vf-icon" data-icon="chevron-down" data-size="var(--vf-icon-size-sm)"></span>';
const EXTERNAL = '<span class="vf-icon" data-icon="external-link" data-size="var(--vf-icon-size-sm)"></span>';
const TRANSITION =
  'height var(--vf-motion-duration-normal) var(--vf-motion-ease-standard), opacity var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)';

/** A tree with every kind of item: a branch with a nested branch, a group, links and buttons. */
const tree = (): VfNavMenuItem[] => [
  {
    value: 'guide',
    label: 'Guide',
    children: [
      { value: 'intro', label: 'Intro', href: '/intro' },
      {
        value: 'advanced',
        label: 'Advanced',
        children: [
          { value: 'theming', label: 'Theming' },
          { value: 'ssr', label: 'SSR', href: '/ssr' },
        ],
      },
    ],
  },
  {
    value: 'components',
    label: 'Components',
    children: [{ value: 'button', label: 'Button', href: '/button' }],
  },
  { value: 'changelog', label: 'Changelog' },
];

/** Branches under a group and beside it, for the single-mode sibling rule. */
const grouped = (): VfNavMenuItem[] => [
  {
    value: 'library',
    label: 'Library',
    children: [
      {
        value: 'forms',
        kind: 'group',
        label: 'Forms',
        children: [
          { value: 'input', label: 'Input', children: [{ value: 'input-api', label: 'Input API' }] },
          {
            value: 'select',
            label: 'Select',
            children: [
              { value: 'select-api', label: 'Select API' },
              { value: 'select-deep', label: 'Select deep', children: [{ value: 'select-leaf', label: 'Leaf' }] },
            ],
          },
        ],
      },
      { value: 'layout', label: 'Layout', children: [{ value: 'grid', label: 'Grid' }] },
    ],
  },
  { value: 'about', label: 'About', children: [{ value: 'team', label: 'Team' }] },
];

/** The root is the nav; the wrapper's own type says only `Element`. */
type Wrapper = Omit<VueWrapper, 'element'> & { readonly element: HTMLElement };

function mountNav({
  props,
  attrs = {},
  global = {},
  attachTo,
  slots,
}: {
  props: NavMenuProps;
  attrs?: Record<string, unknown>;
  global?: Record<string, unknown>;
  attachTo?: Element;
  slots?: Record<string, unknown>;
}): Wrapper {
  return mount(VfNavMenu, {
    props,
    attrs,
    slots: slots as never,
    attachTo,
    global: { ...global, stubs: { transition: false, ...((global.stubs as object) ?? {}) } },
  }) as unknown as Wrapper;
}

async function ssr(props: Record<string, unknown>, register?: (app: ReturnType<typeof createSSRApp>) => void) {
  const app = createSSRApp({ render: () => h(VfNavMenu, props as unknown as NavMenuProps) });
  register?.(app);

  return await renderToString(app);
}

/** Every item element - group div, branch button, leaf anchor or button - in document order. */
const itemElements = (wrapper: Wrapper) => [
  ...wrapper.element.querySelectorAll<HTMLElement>('.vf-nav-menu__item, .vf-nav-menu__group'),
];
const labelOf = (element: Element) =>
  element.querySelector('.vf-nav-menu__label, .vf-nav-menu__group-label')?.textContent ?? '';
const item = (wrapper: Wrapper, label: string) => {
  const found = itemElements(wrapper).find((element) => labelOf(element) === label);
  if (!found) throw new Error(`no item labelled ${label}`);
  return found;
};
const nodeOf = (wrapper: Wrapper, label: string) => item(wrapper, label).closest('li') as HTMLLIElement;
const visibleLabels = (wrapper: Wrapper) => itemElements(wrapper).map(labelOf);
const expandedBranches = (wrapper: Wrapper) =>
  [...wrapper.element.querySelectorAll('button[aria-expanded="true"]')].map(labelOf);
/**
 * A click, then the settled tree. The real <Transition> runs in these tests -
 * a stubbed one would put its own element in the markup - and jsdom computes
 * no transition duration, so Vue finishes every enter and leave at the class
 * swap two animation frames later. Waiting for those keeps a leaving subtree
 * out of the next assertion.
 */
const settle = async () => {
  await nextTick();
  for (let index = 0; index < 3; index += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  await nextTick();
};
const click = async (wrapper: Wrapper, label: string) => {
  // jsdom cannot navigate; an anchor's default action is cancelled after the
  // component has seen the click, which is all these tests read.
  const target = item(wrapper, label);
  target.addEventListener('click', (event) => event.preventDefault(), { once: true });
  target.click();
  await settle();
};
/** A click and one tick: for the transition tests, which drive the frames themselves. */
const press = async (wrapper: Wrapper, label: string) => {
  item(wrapper, label).click();
  await nextTick();
};

/**
 * A stand-in for a router's link component, recording what it was handed. It
 * renders an anchor so the handoff is observable; nothing about it is
 * vue-router, which the reference never imports.
 */
const handedTo: unknown[] = [];
const RecordingRouterLink = defineComponent({
  name: 'RouterLink',
  inheritAttrs: false,
  props: { to: { type: [String, Object] as PropType<string | Record<string, unknown>>, required: true } },
  setup(props, { attrs, slots }) {
    handedTo.push(props.to);

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
          onClick: attrs.onClick as never,
        },
        slots.default?.(),
      );
  },
});
const withRouter = { components: { RouterLink: RecordingRouterLink } };
/** The element a leaf renders, whatever it is: the router link's anchor carries none of the item classes. */
const leafElement = (wrapper: Wrapper, index = 0) =>
  wrapper.element.querySelectorAll('.vf-nav-menu__list > li')[index].firstElementChild as HTMLElement;
const received = (element: Element) =>
  JSON.parse(element.getAttribute('data-received-attrs') ?? '{}') as Record<string, unknown>;

// ------------------------------------------------------------------ public API

describe('VfNavMenu characterization: public API', () => {
  it('declares exactly these props, with these defaults', () => {
    const options = VfNavMenu as unknown as { props: Record<string, { default?: unknown; required?: boolean }> };

    expect(Object.keys(options.props).sort()).toEqual(
      ['ariaLabel', 'compact', 'defaultValue', 'expandMode', 'items', 'modelValue', 'variant'].sort(),
    );
    expect(options.props.items.required).toBe(true);
    expect(options.props.ariaLabel.default).toBe('Navigation');
    expect(options.props.expandMode.default).toBe('multiple');
    expect(options.props.variant.default).toBe('default');
    expect(options.props.modelValue.default).toBeUndefined();
    expect(options.props.defaultValue.default).toBeUndefined();
    expect(options.props.compact.default).toBeUndefined();
  });

  it('declares exactly three emits', () => {
    const options = VfNavMenu as unknown as { emits: string[] };

    expect([...options.emits].sort()).toEqual(['change', 'select', 'update:modelValue']);
  });

  it('renders no slot: default and named slots are ignored', () => {
    const wrapper = mountNav({
      props: { items: [{ value: 'a', label: 'A' }] },
      slots: { default: () => h('i', { class: 'slotted' }), item: () => h('i', { class: 'slotted' }) },
    });

    expect(wrapper.find('.slotted').exists()).toBe(false);
  });

  it('falls every attr through to the nav, after the component classes', () => {
    const wrapper = mountNav({
      props: { items: [{ value: 'a', label: 'A' }] },
      attrs: { id: 'docs', class: 'consumer', 'data-testid': 'nav', title: 'Docs', style: 'color: red;' },
    });

    expect(wrapper.element.tagName).toBe('NAV');
    expect(wrapper.element.getAttribute('class')).toBe('vf-nav-menu vf-nav-menu--default vf-nav-menu--simple consumer');
    expect(wrapper.attributes('id')).toBe('docs');
    expect(wrapper.attributes('data-testid')).toBe('nav');
    expect(wrapper.attributes('title')).toBe('Docs');
    expect(wrapper.attributes('style')).toBe('color: red;');
    expect(wrapper.find('ul').attributes('id')).toBeUndefined();
    expect(wrapper.element.querySelectorAll('[data-testid], [id], [title]')).toHaveLength(0);
  });

  it('a consumer aria-label attr is the ariaLabel prop; an empty one is written empty', () => {
    expect(mountNav({ props: { items: [], ariaLabel: 'Docs' } }).attributes('aria-label')).toBe('Docs');
    expect(mountNav({ props: { items: [] }, attrs: { 'aria-label': 'Attr' } }).attributes('aria-label')).toBe('Attr');
    expect(mountNav({ props: { items: [], ariaLabel: '' } }).attributes('aria-label')).toBe('');
  });
});

// -------------------------------------------------------------------- topology

describe('VfNavMenu characterization: topology', () => {
  it('renders exactly this markup for a collapsed tree', () => {
    const wrapper = mountNav({
      props: {
        items: [
          { value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1' }] },
          { value: 'b', label: 'B', href: '/b' },
          { value: 'c', label: 'C' },
        ],
      },
    });

    expect(wrapper.html({ raw: true })).toBe(
      '<nav class="vf-nav-menu vf-nav-menu--default vf-nav-menu--simple" aria-label="Navigation">' +
        '<span class="vf-nav-menu__compact-breakpoint-probe" aria-hidden="true"></span>' +
        '<ul class="vf-nav-menu__list">' +
        '<li class="vf-nav-menu__node vf-nav-menu__node--level-0">' +
        '<button class="vf-nav-menu__item vf-nav-menu__item--branch vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level: 0;" aria-expanded="false" type="button">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">A</span></span>' +
        `<span class="vf-nav-menu__icon" aria-hidden="true">${CHEVRON}</span></button><!--v-if--></li>` +
        '<li class="vf-nav-menu__node vf-nav-menu__node--level-0">' +
        '<a href="/b" class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level: 0;">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">B</span></span><!--v-if--></a><!--v-if--></li>' +
        '<li class="vf-nav-menu__node vf-nav-menu__node--level-0">' +
        '<button class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level: 0;" type="button">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">C</span></span></button><!--v-if--></li>' +
        '</ul></nav>',
    );
  });

  it('renders an expanded branch as a collapse div holding a nested list, one level deeper', () => {
    const wrapper = mountNav({
      props: { items: [{ value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1' }] }], defaultValue: 'a1' },
    });
    const collapse = wrapper.element.querySelector('.vf-nav-menu__collapse')!;

    expect(collapse.outerHTML).toBe(
      '<div class="vf-nav-menu__collapse vf-nav-menu__collapse--level-0"><ul class="vf-nav-menu__list vf-nav-menu__list--nested">' +
        '<li class="vf-nav-menu__node vf-nav-menu__node--level-1 vf-nav-menu__node--active">' +
        '<button class="vf-nav-menu__item vf-nav-menu__item--icon-offset vf-nav-menu__item--active" style="--vf-nav-menu-level: 1;" aria-current="page" type="button">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">A1</span></span></button><!--v-if--></li>' +
        '</ul></div>',
    );
    expect(collapse.parentElement!.tagName).toBe('LI');
    expect(collapse.previousElementSibling!.tagName).toBe('BUTTON');
  });

  it('renders a group as a div and its children as an always-rendered nested list, with no button and no collapse', () => {
    const wrapper = mountNav({
      props: {
        items: [{ value: 'g', kind: 'group', label: 'G', children: [{ value: 'g1', label: 'G1' }] }],
      },
    });
    const node = wrapper.element.querySelector('li')!;

    expect(node.outerHTML).toBe(
      '<li class="vf-nav-menu__node vf-nav-menu__node--level-0">' +
        '<div class="vf-nav-menu__group vf-nav-menu__group--level-0" style="--vf-nav-menu-level: 0;">' +
        '<span class="vf-nav-menu__item-content"><span class="vf-nav-menu__group-label">G</span></span></div>' +
        '<ul class="vf-nav-menu__list vf-nav-menu__list--nested">' +
        '<li class="vf-nav-menu__node vf-nav-menu__node--level-1">' +
        '<button class="vf-nav-menu__item vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level: 1;" type="button">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">G1</span></span></button><!--v-if--></li>' +
        '</ul></li>',
    );
    // A group with groups present is not a simple menu.
    expect(wrapper.classes()).toEqual(['vf-nav-menu', 'vf-nav-menu--default']);
  });

  it('renders a group with no or empty children as the group div alone', () => {
    for (const children of [undefined, []]) {
      const wrapper = mountNav({ props: { items: [{ value: 'g', kind: 'group', label: 'G', children }] } });

      expect(wrapper.element.querySelector('li')!.innerHTML).toBe(
        '<div class="vf-nav-menu__group vf-nav-menu__group--level-0" style="--vf-nav-menu-level: 0;">' +
          '<span class="vf-nav-menu__item-content"><span class="vf-nav-menu__group-label">G</span></span></div><!--v-if-->',
      );
    }
  });

  it('renders an item with empty children as a leaf - a button, or a link when it has a destination', () => {
    const wrapper = mountNav({
      props: {
        items: [
          { value: 'a', label: 'A', children: [] },
          { value: 'b', label: 'B', href: '/b', children: [] },
        ],
      },
    });

    expect(item(wrapper, 'A').tagName).toBe('BUTTON');
    expect(item(wrapper, 'A').hasAttribute('aria-expanded')).toBe(false);
    expect(item(wrapper, 'B').tagName).toBe('A');
  });

  it('renders an item with children as a branch button even when it has href or to: the destination is dropped', () => {
    const wrapper = mountNav({
      props: {
        items: [
          { value: 'a', label: 'A', href: '/a', target: '_blank', children: [{ value: 'a1', label: 'A1' }] },
          { value: 'b', label: 'B', to: '/b', children: [{ value: 'b1', label: 'B1' }] },
        ],
      },
      global: withRouter,
    });

    for (const label of ['A', 'B']) {
      const branch = item(wrapper, label);
      expect(branch.tagName).toBe('BUTTON');
      expect(branch.hasAttribute('href')).toBe(false);
      expect(branch.hasAttribute('target')).toBe(false);
      expect(branch.hasAttribute('rel')).toBe(false);
      expect(branch.querySelector('[data-icon="external-link"]')).toBeNull();
    }
    expect(wrapper.html()).not.toContain('data-received-to');
  });

  it('writes the depth on the li, on the group and collapse modifiers, and as --vf-nav-menu-level on every item element', () => {
    const wrapper = mountNav({
      props: {
        items: [
          {
            value: 'a',
            label: 'A',
            children: [
              {
                value: 'g',
                kind: 'group',
                label: 'G',
                children: [{ value: 'b', label: 'B', children: [{ value: 'c', label: 'C', href: '/c' }] }],
              },
            ],
          },
        ],
        defaultValue: 'c',
      },
    });

    expect(itemElements(wrapper).map((element) => [labelOf(element), element.getAttribute('style')])).toEqual([
      ['A', '--vf-nav-menu-level: 0;'],
      ['G', '--vf-nav-menu-level: 1;'],
      ['B', '--vf-nav-menu-level: 2;'],
      ['C', '--vf-nav-menu-level: 3;'],
    ]);
    expect([...wrapper.element.querySelectorAll('li')].map((li) => li.classList[1])).toEqual([
      'vf-nav-menu__node--level-0',
      'vf-nav-menu__node--level-1',
      'vf-nav-menu__node--level-2',
      'vf-nav-menu__node--level-3',
    ]);
    expect(item(wrapper, 'G').className).toBe('vf-nav-menu__group vf-nav-menu__group--level-1');
    expect([...wrapper.element.querySelectorAll('.vf-nav-menu__collapse')].map((element) => element.className)).toEqual(
      ['vf-nav-menu__collapse vf-nav-menu__collapse--level-0', 'vf-nav-menu__collapse vf-nav-menu__collapse--level-2'],
    );
    // A group's nested list carries no level class; only the top-level list lacks --nested.
    expect([...wrapper.element.querySelectorAll('ul')].map((list) => list.className)).toEqual([
      'vf-nav-menu__list',
      'vf-nav-menu__list vf-nav-menu__list--nested',
      'vf-nav-menu__list vf-nav-menu__list--nested',
      'vf-nav-menu__list vf-nav-menu__list--nested',
    ]);
  });

  it('keeps the item order of the model at every depth, and renders an empty items list as an empty list', () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'theming' } });

    expect(visibleLabels(wrapper)).toEqual(['Guide', 'Intro', 'Advanced', 'Theming', 'SSR', 'Components', 'Changelog']);
    expect(mountNav({ props: { items: [] } }).html({ raw: true })).toBe(
      '<nav class="vf-nav-menu vf-nav-menu--default vf-nav-menu--simple" aria-label="Navigation">' +
        '<span class="vf-nav-menu__compact-breakpoint-probe" aria-hidden="true"></span><ul class="vf-nav-menu__list"></ul></nav>',
    );
  });

  it('writes --top only at level 0 and --icon-offset only without a leading icon, on every item kind but the group', () => {
    const wrapper = mountNav({
      props: {
        items: [
          {
            value: 'a',
            label: 'A',
            leadingIcon: 'home',
            children: [{ value: 'a1', label: 'A1', leadingIcon: 'home' }],
          },
          { value: 'b', label: 'B', href: '/b', leadingIcon: 'home' },
          { value: 'c', label: 'C' },
        ],
        defaultValue: 'a1',
      },
    });

    expect(item(wrapper, 'A').className).toBe(
      'vf-nav-menu__item vf-nav-menu__item--branch vf-nav-menu__item--top vf-nav-menu__item--ancestor-active vf-nav-menu__item--expanded',
    );
    expect(item(wrapper, 'A1').className).toBe('vf-nav-menu__item vf-nav-menu__item--active');
    expect(item(wrapper, 'B').className).toBe('vf-nav-menu__item vf-nav-menu__item--top');
    expect(item(wrapper, 'C').className).toBe(
      'vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset',
    );
  });

  it('renders a leading icon in an aria-hidden span before the label, at the medium icon size, with the name passed as given', () => {
    const wrapper = mountNav({
      props: {
        items: [
          { value: 'a', label: 'A', leadingIcon: 'home', children: [{ value: 'a1', label: 'A1' }] },
          { value: 'b', label: 'B', href: '/b', leadingIcon: 'chevronRight' },
          { value: 'c', label: 'C', leadingIcon: 'not-an-icon' },
        ],
      },
    });

    for (const [label, icon] of [
      ['A', 'home'],
      ['B', 'chevronRight'],
      ['C', 'not-an-icon'],
    ]) {
      expect(item(wrapper, label).querySelector('.vf-nav-menu__item-content')!.innerHTML).toBe(
        `<span class="vf-nav-menu__leading-icon" aria-hidden="true"><span class="vf-icon" data-icon="${icon}" data-size="var(--vf-icon-size-md)"></span></span>` +
          `<span class="vf-nav-menu__label">${label}</span>`,
      );
    }
    // A leading icon anywhere, at any depth, makes the menu not simple; a group does too.
    expect(wrapper.classes()).toEqual(['vf-nav-menu', 'vf-nav-menu--default']);
    expect(
      mountNav({
        props: { items: [{ value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1', leadingIcon: 'home' }] }] },
      }).classes(),
    ).toEqual(['vf-nav-menu', 'vf-nav-menu--default']);
    // A group never renders its leading icon.
    expect(
      mountNav({ props: { items: [{ value: 'g', kind: 'group', label: 'G', leadingIcon: 'home' }] } })
        .find('.vf-nav-menu__leading-icon')
        .exists(),
    ).toBe(false);
  });

  it('writes the variant modifier verbatim, and --simple beside it', () => {
    for (const variant of ['default', 'pills', 'sidebar'] as const) {
      expect(mountNav({ props: { items: [], variant } }).classes()).toEqual([
        'vf-nav-menu',
        `vf-nav-menu--${variant}`,
        'vf-nav-menu--simple',
      ]);
    }
  });

  it('escapes labels as text', () => {
    const wrapper = mountNav({ props: { items: [{ value: 'a', label: '<b>A</b> & "B"' }] } });

    expect(wrapper.find('.vf-nav-menu__label').element.innerHTML).toBe('&lt;b&gt;A&lt;/b&gt; &amp; "B"');
  });
});

// --------------------------------------------------------------------- server

describe('VfNavMenu characterization: server render', () => {
  it('renders exactly this markup on the server: active ancestry open, everything else a comment', async () => {
    expect(
      await ssr({
        items: [
          { value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1', href: '/a1' }] },
          { value: 'b', label: 'B', children: [{ value: 'b1', label: 'B1' }] },
        ],
        defaultValue: 'a1',
      }),
    ).toBe(
      '<nav class="vf-nav-menu vf-nav-menu--default vf-nav-menu--simple" aria-label="Navigation">' +
        '<span class="vf-nav-menu__compact-breakpoint-probe" aria-hidden="true"></span>' +
        '<ul class="vf-nav-menu__list"><!--[-->' +
        '<li class="vf-nav-menu__node vf-nav-menu__node--level-0 vf-nav-menu__node--expanded vf-nav-menu__node--ancestor-active">' +
        '<button class="vf-nav-menu__item vf-nav-menu__item--branch vf-nav-menu__item--top vf-nav-menu__item--icon-offset vf-nav-menu__item--ancestor-active vf-nav-menu__item--expanded" style="--vf-nav-menu-level:0;" aria-expanded="true" type="button">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">A</span></span>' +
        `<span class="vf-nav-menu__icon vf-nav-menu__icon--open" aria-hidden="true">${CHEVRON}</span></button>` +
        '<div class="vf-nav-menu__collapse vf-nav-menu__collapse--level-0"><ul class="vf-nav-menu__list vf-nav-menu__list--nested"><!--[-->' +
        '<li class="vf-nav-menu__node vf-nav-menu__node--level-1 vf-nav-menu__node--active">' +
        '<a href="/a1" class="vf-nav-menu__item vf-nav-menu__item--icon-offset vf-nav-menu__item--active" style="--vf-nav-menu-level:1;" aria-current="page">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">A1</span></span><!--v-if--></a><!--v-if--></li>' +
        '<!--]--></ul></div></li>' +
        '<li class="vf-nav-menu__node vf-nav-menu__node--level-0">' +
        '<button class="vf-nav-menu__item vf-nav-menu__item--branch vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level:0;" aria-expanded="false" type="button">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">B</span></span>' +
        `<span class="vf-nav-menu__icon" aria-hidden="true">${CHEVRON}</span></button><!--v-if--></li>` +
        '<!--]--></ul></nav>',
    );
  });

  it('never renders a sidebar compact on the server unless `compact` says so', async () => {
    expect(await ssr({ items: [], variant: 'sidebar' })).toContain(
      '<nav class="vf-nav-menu vf-nav-menu--sidebar vf-nav-menu--simple" aria-label="Navigation">',
    );
    expect(await ssr({ items: [], variant: 'sidebar', compact: true })).toContain(
      '<nav class="vf-nav-menu vf-nav-menu--sidebar vf-nav-menu--simple vf-nav-menu--sidebar-compact" aria-label="Navigation">',
    );
    expect(await ssr({ items: [], variant: 'pills', compact: true })).toContain(
      '<nav class="vf-nav-menu vf-nav-menu--pills vf-nav-menu--simple" aria-label="Navigation">',
    );
  });

  it('renders a controlled value on the server exactly as an uncontrolled default', async () => {
    const items = tree();

    expect(await ssr({ items, modelValue: 'ssr' })).toBe(await ssr({ items, defaultValue: 'ssr' }));
  });
});

// ---------------------------------------------------------------- active value

describe('VfNavMenu characterization: active value', () => {
  it('marks the active leaf with aria-current=page, the --active modifier on the item and the li', () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'ssr' } });
    const active = item(wrapper, 'SSR');

    expect(active.getAttribute('aria-current')).toBe('page');
    expect(active.classList.contains('vf-nav-menu__item--active')).toBe(true);
    expect(nodeOf(wrapper, 'SSR').className).toBe(
      'vf-nav-menu__node vf-nav-menu__node--level-2 vf-nav-menu__node--active',
    );
    expect(wrapper.findAll('[aria-current]')).toHaveLength(1);
    expect(wrapper.findAll('.vf-nav-menu__item--active')).toHaveLength(1);
  });

  it('marks every ancestor of the active value: the li and the branch button, never with aria-current', () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'ssr' } });

    for (const [label, level] of [
      ['Guide', 0],
      ['Advanced', 1],
    ] as const) {
      expect(nodeOf(wrapper, label).className).toBe(
        `vf-nav-menu__node vf-nav-menu__node--level-${level} vf-nav-menu__node--expanded vf-nav-menu__node--ancestor-active`,
      );
      expect(item(wrapper, label).classList.contains('vf-nav-menu__item--ancestor-active')).toBe(true);
      expect(item(wrapper, label).hasAttribute('aria-current')).toBe(false);
    }
    expect(nodeOf(wrapper, 'Components').className).toBe('vf-nav-menu__node vf-nav-menu__node--level-0');
  });

  it('marks a group ancestor on its li - expanded and ancestor-active - while the group div stays bare', () => {
    const wrapper = mountNav({ props: { items: grouped(), defaultValue: 'input-api' } });

    expect(nodeOf(wrapper, 'Forms').className).toBe(
      'vf-nav-menu__node vf-nav-menu__node--level-1 vf-nav-menu__node--expanded vf-nav-menu__node--ancestor-active',
    );
    expect(item(wrapper, 'Forms').className).toBe('vf-nav-menu__group vf-nav-menu__group--level-1');
  });

  it('an active branch marks its li only: no aria-current, no --active on the button, and it is not expanded', () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'advanced' } });

    expect(nodeOf(wrapper, 'Advanced').className).toBe(
      'vf-nav-menu__node vf-nav-menu__node--level-1 vf-nav-menu__node--active',
    );
    expect(item(wrapper, 'Advanced').hasAttribute('aria-current')).toBe(false);
    expect(item(wrapper, 'Advanced').getAttribute('aria-expanded')).toBe('false');
    expect(expandedBranches(wrapper)).toEqual(['Guide']);
  });

  it('an active group marks its li --active and nothing else', () => {
    const wrapper = mountNav({ props: { items: grouped(), defaultValue: 'forms' } });

    expect(nodeOf(wrapper, 'Forms').className).toBe(
      'vf-nav-menu__node vf-nav-menu__node--level-1 vf-nav-menu__node--active',
    );
    expect(wrapper.findAll('[aria-current]')).toHaveLength(0);
  });

  it('marks every item sharing the active value, and expands the ancestors of the first match only', () => {
    const wrapper = mountNav({
      props: {
        items: [
          { value: 'a', label: 'A', children: [{ value: 'dup', label: 'Dup 1' }] },
          { value: 'b', label: 'B', children: [{ value: 'dup', label: 'Dup 2' }] },
          { value: 'dup', label: 'Dup 3' },
        ],
        defaultValue: 'dup',
      },
    });

    expect(expandedBranches(wrapper)).toEqual(['A']);
    expect(wrapper.findAll('[aria-current="page"]').map((node) => labelOf(node.element))).toEqual(['Dup 1', 'Dup 3']);
  });

  it('an unknown or empty value marks nothing and expands nothing', () => {
    for (const defaultValue of ['nowhere', '']) {
      const wrapper = mountNav({ props: { items: tree(), defaultValue } });

      expect(wrapper.findAll('[aria-current]')).toHaveLength(0);
      expect(expandedBranches(wrapper)).toEqual([]);
    }
  });

  it('modelValue wins over defaultValue whenever it is defined, an empty string included', () => {
    expect(
      mountNav({ props: { items: tree(), modelValue: 'changelog', defaultValue: 'intro' } })
        .findAll('[aria-current]')
        .map((node) => labelOf(node.element)),
    ).toEqual(['Changelog']);
    expect(
      mountNav({ props: { items: tree(), modelValue: '', defaultValue: 'changelog' } }).findAll('[aria-current]'),
    ).toHaveLength(0);
  });
});

// --------------------------------------------------------------------- events

describe('VfNavMenu characterization: events', () => {
  it('a button leaf click emits update:modelValue, change and select, in that order, with the value and the item', async () => {
    const order: string[] = [];
    const items = tree();
    const wrapper = mountNav({
      props: {
        items,
        'onUpdate:modelValue': () => order.push('update:modelValue'),
        onChange: () => order.push('change'),
        onSelect: () => order.push('select'),
      } as NavMenuProps,
    });

    await click(wrapper, 'Changelog');

    expect(order).toEqual(['update:modelValue', 'change', 'select']);
    expect(wrapper.emitted('update:modelValue')).toEqual([['changelog']]);
    expect(wrapper.emitted('change')).toEqual([['changelog']]);
    expect(toRaw(wrapper.emitted('select')![0][0])).toBe(items[2]);
  });

  it('uncontrolled: the click moves the active value; clicking the active item emits all three again', async () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'changelog' } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Intro');
    expect(wrapper.findAll('[aria-current]').map((node) => labelOf(node.element))).toEqual(['Intro']);

    await click(wrapper, 'Intro');
    expect(wrapper.emitted('update:modelValue')).toEqual([['intro'], ['intro']]);
    expect(wrapper.emitted('change')).toEqual([['intro'], ['intro']]);
    expect(wrapper.emitted('select')).toHaveLength(2);
  });

  it('controlled: the click emits but the active value stays until the parent writes it back', async () => {
    const wrapper = mountNav({ props: { items: tree(), modelValue: 'changelog' } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Intro');
    expect(wrapper.emitted('update:modelValue')).toEqual([['intro']]);
    expect(wrapper.findAll('[aria-current]').map((node) => labelOf(node.element))).toEqual(['Changelog']);

    await wrapper.setProps({ modelValue: 'intro' });
    expect(wrapper.findAll('[aria-current]').map((node) => labelOf(node.element))).toEqual(['Intro']);
  });

  it('dropping modelValue to undefined falls back to the internal value, which a controlled click never wrote', async () => {
    const wrapper = mountNav({ props: { items: tree(), modelValue: 'changelog', defaultValue: 'components' } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Intro');
    await wrapper.setProps({ modelValue: undefined });

    expect(
      wrapper.findAll('.vf-nav-menu__node--active').map((node) => labelOf(node.element.firstElementChild!)),
    ).toEqual(['Components']);
  });

  it('a branch click emits nothing', async () => {
    const wrapper = mountNav({ props: { items: tree() } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Guide');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('an enabled link click emits all three and does not prevent the navigation', async () => {
    const wrapper = mountNav({ props: { items: tree() }, attachTo: document.body });
    await click(wrapper, 'Guide');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    let prevented: boolean | null = null;
    document.addEventListener('click', (e) => ((prevented = e.defaultPrevented), e.preventDefault()), { once: true });

    item(wrapper, 'Intro').dispatchEvent(event);
    await nextTick();

    expect(prevented).toBe(false);
    expect(wrapper.emitted('update:modelValue')).toEqual([['intro']]);
    expect(wrapper.emitted('select')).toHaveLength(1);
  });

  it('a disabled link click is prevented and emits nothing; the active value does not move', async () => {
    const wrapper = mountNav({
      props: { items: [{ value: 'x', label: 'X', href: '/x', disabled: true }], defaultValue: 'none' },
      attachTo: document.body,
    });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    item(wrapper, 'X').dispatchEvent(event);
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('select')).toBeUndefined();
    expect(wrapper.findAll('[aria-current]')).toHaveLength(0);
  });

  it('a disabled button leaf and a disabled branch are natively disabled: a click does nothing at all', async () => {
    const wrapper = mountNav({
      props: {
        items: [
          { value: 'x', label: 'X', disabled: true },
          { value: 'y', label: 'Y', disabled: true, children: [{ value: 'y1', label: 'Y1' }] },
        ],
      },
    });

    await click(wrapper, 'X');
    await click(wrapper, 'Y');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(expandedBranches(wrapper)).toEqual([]);
  });

  it('selecting a leaf also expands its ancestors (they are open already when it was clickable)', async () => {
    const wrapper = mountNav({ props: { items: tree(), modelValue: 'nowhere' } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Advanced');
    await click(wrapper, 'Guide');
    // Guide closed, Advanced still expanded underneath.
    expect(expandedBranches(wrapper)).toEqual([]);
    await click(wrapper, 'Guide');
    expect(expandedBranches(wrapper)).toEqual(['Guide', 'Advanced']);
  });
});

// ------------------------------------------------------------------ expansion

describe('VfNavMenu characterization: expansion', () => {
  it('a branch click toggles aria-expanded, the --expanded modifiers, the open icon and the collapse', async () => {
    const wrapper = mountNav({ props: { items: tree() } });
    const guide = item(wrapper, 'Guide');

    await click(wrapper, 'Guide');
    expect(guide.getAttribute('aria-expanded')).toBe('true');
    expect(guide.classList.contains('vf-nav-menu__item--expanded')).toBe(true);
    expect(nodeOf(wrapper, 'Guide').classList.contains('vf-nav-menu__node--expanded')).toBe(true);
    expect(guide.querySelector('.vf-nav-menu__icon')!.className).toBe('vf-nav-menu__icon vf-nav-menu__icon--open');
    expect(visibleLabels(wrapper)).toEqual(['Guide', 'Intro', 'Advanced', 'Components', 'Changelog']);

    await click(wrapper, 'Guide');
    expect(guide.getAttribute('aria-expanded')).toBe('false');
    expect(guide.classList.contains('vf-nav-menu__item--expanded')).toBe(false);
    expect(guide.querySelector('.vf-nav-menu__icon')!.className).toBe('vf-nav-menu__icon');
  });

  it('multiple mode keeps every opened branch open, at every depth', async () => {
    const wrapper = mountNav({ props: { items: tree() } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Components');
    await click(wrapper, 'Advanced');

    expect(expandedBranches(wrapper)).toEqual(['Guide', 'Advanced', 'Components']);
  });

  it('closing a parent keeps the nested expansion, which reappears when the parent reopens', async () => {
    const wrapper = mountNav({ props: { items: tree() } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Advanced');
    await click(wrapper, 'Guide');
    expect(wrapper.text()).not.toContain('Theming');

    await click(wrapper, 'Guide');
    expect(expandedBranches(wrapper)).toEqual(['Guide', 'Advanced']);
    expect(visibleLabels(wrapper)).toContain('Theming');
  });

  it('single mode: opening a branch closes its siblings and every branch below them, and leaves its own descendants', async () => {
    const wrapper = mountNav({ props: { items: grouped(), expandMode: 'single' } });

    await click(wrapper, 'Library');
    await click(wrapper, 'Select');
    await click(wrapper, 'Select deep');
    await click(wrapper, 'Input');
    // Input and Select are siblings under the Forms group: Select and Select deep close.
    expect(expandedBranches(wrapper)).toEqual(['Library', 'Input']);

    await click(wrapper, 'Select');
    // Select deep was closed by the sibling rule, so it stays closed.
    expect(expandedBranches(wrapper)).toEqual(['Library', 'Select']);
  });

  it('single mode: a sibling group is skipped whole - the branches inside it are not collapsed', async () => {
    const wrapper = mountNav({ props: { items: grouped(), expandMode: 'single' } });

    await click(wrapper, 'Library');
    await click(wrapper, 'Layout');
    await click(wrapper, 'Input');
    // Input's siblings are the Forms group's children; Layout is not one of them.
    expect(expandedBranches(wrapper)).toEqual(['Library', 'Input', 'Layout']);

    // Layout's siblings are Library's children: the Forms group, which is not
    // a branch, so it is filtered out before its descendants are collected -
    // Input stays open beside Layout.
    await click(wrapper, 'Layout');
    await click(wrapper, 'Layout');
    expect(expandedBranches(wrapper)).toEqual(['Library', 'Input', 'Layout']);
  });

  it('single mode: opening a top-level branch closes the other top-level branches and everything under them', async () => {
    const wrapper = mountNav({ props: { items: grouped(), expandMode: 'single' } });

    await click(wrapper, 'Library');
    await click(wrapper, 'Input');
    await click(wrapper, 'About');
    expect(expandedBranches(wrapper)).toEqual(['About']);

    await click(wrapper, 'Library');
    expect(expandedBranches(wrapper)).toEqual(['Library']);
  });

  it('single mode: reopening a parent keeps its own still-expanded descendants', async () => {
    // Found by the mutation that let single mode collapse the opened branch's
    // own subtree: nothing above reopened a branch whose child was still
    // expanded. The sibling rule excludes the opened value, so its own
    // descendants survive.
    const wrapper = mountNav({ props: { items: tree(), expandMode: 'single' } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Advanced');
    await click(wrapper, 'Guide');
    await click(wrapper, 'Guide');
    expect(expandedBranches(wrapper)).toEqual(['Guide', 'Advanced']);
    expect(visibleLabels(wrapper)).toContain('Theming');
  });

  it('single mode: closing a branch touches nothing else', async () => {
    const wrapper = mountNav({ props: { items: tree(), expandMode: 'single' } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Advanced');
    await click(wrapper, 'Advanced');
    expect(expandedBranches(wrapper)).toEqual(['Guide']);
  });

  it('single mode is not enforced on what activation opens: two siblings may stay open', async () => {
    const wrapper = mountNav({ props: { items: tree(), expandMode: 'single', modelValue: 'intro' } });

    await click(wrapper, 'Components');
    expect(expandedBranches(wrapper)).toEqual(['Components']);

    await wrapper.setProps({ modelValue: 'theming' });
    expect(expandedBranches(wrapper)).toEqual(['Guide', 'Advanced', 'Components']);
  });

  it('a changed active value adds its ancestors and never removes the previous ones', async () => {
    const wrapper = mountNav({ props: { items: tree(), modelValue: 'theming' } });
    expect(expandedBranches(wrapper)).toEqual(['Guide', 'Advanced']);

    await wrapper.setProps({ modelValue: 'button' });
    expect(expandedBranches(wrapper)).toEqual(['Guide', 'Advanced', 'Components']);
  });

  it('the active ancestry is re-added whenever the items change, even after the user closed it', async () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'intro' } });

    await click(wrapper, 'Guide');
    expect(expandedBranches(wrapper)).toEqual([]);

    await wrapper.setProps({ items: tree() });
    expect(expandedBranches(wrapper)).toEqual(['Guide']);
  });

  it('a user-closed active ancestry stays closed while neither the items nor the value change', async () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'intro' } });

    await click(wrapper, 'Guide');
    await click(wrapper, 'Changelog');
    // The value changed: changelog has no ancestors, nothing reopens.
    expect(expandedBranches(wrapper)).toEqual([]);
  });

  it('a deep mutation of the items re-syncs the ancestry (the watch is deep)', async () => {
    const items = reactive(tree());
    const wrapper = mountNav({ props: { items, defaultValue: 'intro' } });
    await click(wrapper, 'Guide');

    items[2].label = 'Changes';
    await nextTick();
    expect(expandedBranches(wrapper)).toEqual(['Guide']);
  });

  it('a disabled branch on the active path is expanded, and cannot be toggled', async () => {
    const wrapper = mountNav({
      props: {
        items: [{ value: 'a', label: 'A', disabled: true, children: [{ value: 'a1', label: 'A1' }] }],
        defaultValue: 'a1',
      },
    });

    expect(item(wrapper, 'A').getAttribute('aria-expanded')).toBe('true');
    expect(item(wrapper, 'A').hasAttribute('disabled')).toBe(true);
    await click(wrapper, 'A');
    expect(expandedBranches(wrapper)).toEqual(['A']);
  });

  it('a disabled branch writes no aria-disabled and no --disabled modifier', () => {
    const wrapper = mountNav({
      props: { items: [{ value: 'a', label: 'A', disabled: true, children: [{ value: 'a1', label: 'A1' }] }] },
    });

    expect(item(wrapper, 'A').outerHTML).toBe(
      '<button class="vf-nav-menu__item vf-nav-menu__item--branch vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level: 0;" aria-expanded="false" disabled="" type="button">' +
        `<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">A</span></span><span class="vf-nav-menu__icon" aria-hidden="true">${CHEVRON}</span></button>`,
    );
  });

  it('expansion is keyed by value: two branches sharing a value open and close together', async () => {
    const wrapper = mountNav({
      props: {
        items: [
          { value: 'same', label: 'One', children: [{ value: 'x', label: 'X' }] },
          { value: 'same', label: 'Two', children: [{ value: 'y', label: 'Y' }] },
        ],
      },
    });

    await click(wrapper, 'One');
    expect(expandedBranches(wrapper)).toEqual(['One', 'Two']);
  });

  it('has no branch aria-controls and no id anywhere', () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'ssr' } });

    expect(wrapper.findAll('[aria-controls]')).toHaveLength(0);
    expect(wrapper.findAll('[id]')).toHaveLength(0);
    expect(wrapper.findAll('[role]')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------- links

describe('VfNavMenu characterization: links', () => {
  const leaf = (entry: Partial<VfNavMenuItem>, global = {}) =>
    item(mountNav({ props: { items: [{ value: 'x', label: 'X', ...entry }] }, global }), 'X');

  it('renders a native anchor with href, target and rel, in that attribute order', () => {
    expect(leaf({ href: '/x', target: '_self', rel: 'help' }).outerHTML).toBe(
      '<a href="/x" target="_self" rel="help" class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level: 0;">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">X</span></span><!--v-if--></a>',
    );
  });

  it('derives rel for _blank only, and renders the external glyph for _blank only', () => {
    const blank = leaf({ href: '/x', target: '_blank' });
    expect(blank.getAttribute('rel')).toBe('noopener noreferrer');
    expect(blank.lastElementChild!.outerHTML).toBe(
      `<span class="vf-nav-menu__icon vf-nav-menu__icon--external" aria-hidden="true">${EXTERNAL}</span>`,
    );

    expect(leaf({ href: '/x', target: '_blank', rel: 'external' }).getAttribute('rel')).toBe('external');
    expect(leaf({ href: '/x', target: '_top' }).hasAttribute('rel')).toBe(false);
    expect(leaf({ href: '/x', target: '_self' }).hasAttribute('rel')).toBe(false);
    expect(leaf({ href: '/x', target: '_top' }).querySelector('[data-icon="external-link"]')).toBeNull();
    expect(leaf({ href: '/x', rel: '' }).hasAttribute('rel')).toBe(false);
    expect(leaf({ href: '/x', target: '_blank', rel: '' }).getAttribute('rel')).toBe('noopener noreferrer');
    // A target on an item with no destination is not a link and renders nothing of it.
    const button = leaf({ target: '_blank' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.hasAttribute('target')).toBe(false);
    expect(button.querySelector('[data-icon="external-link"]')).toBeNull();
  });

  it('selects the link by definedness: href "" is an anchor with an empty href', () => {
    const anchor = leaf({ href: '' });

    expect(anchor.tagName).toBe('A');
    expect(anchor.getAttribute('href')).toBe('');
  });

  it('a disabled link keeps its href and gains aria-disabled, tabindex=-1 and the --disabled modifier', () => {
    expect(leaf({ href: '/x', disabled: true }).outerHTML).toBe(
      '<a href="/x" class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset vf-nav-menu__item--disabled" style="--vf-nav-menu-level: 0;" aria-disabled="true" tabindex="-1">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">X</span></span><!--v-if--></a>',
    );
  });

  it('a disabled active link is still current: aria-current beside aria-disabled', () => {
    const wrapper = mountNav({
      props: { items: [{ value: 'x', label: 'X', href: '/x', disabled: true }], defaultValue: 'x' },
    });

    expect(item(wrapper, 'X').getAttribute('aria-current')).toBe('page');
    expect(item(wrapper, 'X').className).toBe(
      'vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset vf-nav-menu__item--active vf-nav-menu__item--disabled',
    );
  });

  it('a disabled button leaf has the native attribute and the modifier, no aria-disabled and no tabindex', () => {
    expect(leaf({ disabled: true }).outerHTML).toBe(
      '<button class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset vf-nav-menu__item--disabled" style="--vf-nav-menu-level: 0;" disabled="" type="button">' +
        '<span class="vf-nav-menu__item-content"><!--v-if--><span class="vf-nav-menu__label">X</span></span></button>',
    );
  });

  it('`disabled: false` writes nothing', () => {
    expect(leaf({ href: '/x', disabled: false }).outerHTML).not.toMatch(/disabled|tabindex/);
    expect(leaf({ disabled: false }).outerHTML).not.toMatch(/disabled|tabindex/);
  });
});

// ------------------------------------------------------------ router branch

describe('VfNavMenu characterization: router branch', () => {
  const routed = (entry: Partial<VfNavMenuItem>) =>
    leafElement(mountNav({ props: { items: [{ value: 'x', label: 'X', ...entry }] }, global: withRouter }));

  it('hands `to` to the registered RouterLink with target, rel, class, style, aria and the click listener - never href', () => {
    const link = routed({ to: '/x', href: '/href', target: '_blank' });

    expect(link.getAttribute('data-received-to')).toBe('/x');
    expect(received(link)).toEqual({
      target: '_blank',
      rel: 'noopener noreferrer',
      class: 'vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset',
      style: { '--vf-nav-menu-level': '0' },
      onClick: 'fn',
    });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.outerHTML).not.toContain('/href');
    // The external glyph is the component's, inside the router link's slot.
    expect(link.querySelector('[data-icon="external-link"]')).not.toBeNull();
  });

  it('hands the active and disabled state as attrs: aria-current, aria-disabled and tabindex', () => {
    const wrapper = mountNav({
      props: { items: [{ value: 'x', label: 'X', to: '/x', disabled: true }], defaultValue: 'x' },
      global: withRouter,
    });

    expect(received(leafElement(wrapper))).toMatchObject({
      'aria-current': 'page',
      'aria-disabled': true,
      tabindex: -1,
    });
  });

  it('hands an object `to` through by identity and never serialises it', () => {
    const destination = { name: 'docs', params: { id: 1 } };
    handedTo.length = 0;
    const link = routed({ to: destination });

    expect(toRaw(handedTo[0] as object)).toBe(destination);
    expect(link.outerHTML).not.toContain('[object Object]');
  });

  it('the click the router link forwards selects the item, and a disabled one is prevented', async () => {
    const wrapper = mountNav({
      props: {
        items: [
          { value: 'x', label: 'X', to: '/x' },
          { value: 'y', label: 'Y', to: '/y', disabled: true },
        ],
      },
      global: withRouter,
    });

    leafElement(wrapper, 0).click();
    await nextTick();
    expect(wrapper.emitted('update:modelValue')).toEqual([['x']]);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    leafElement(wrapper, 1).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
  });

  it('renders the literal unresolved element with nothing registered: no anchor, no href, no throw', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountNav({ props: { items: [{ value: 'x', label: 'X', to: '/x' }] } });
    const element = wrapper.element.querySelector('li')!.firstElementChild!;
    warn.mockRestore();

    expect(element.tagName).toBe('ROUTERLINK');
    expect(element.getAttribute('to')).toBe('/x');
    expect(element.hasAttribute('href')).toBe(false);
    expect(element.className).toBe('vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset');
  });

  it('renders the unresolved element on the server, and the registered one when registered', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const unresolved = await ssr({ items: [{ value: 'x', label: 'X', to: '/x' }] });
    warn.mockRestore();
    expect(unresolved).toContain(
      '<RouterLink to="/x" class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level:0;">',
    );

    const registered = await ssr({ items: [{ value: 'x', label: 'X', to: '/x' }] }, (app) =>
      app.component('RouterLink', RecordingRouterLink),
    );
    expect(registered).toContain('data-received-to="/x"');
  });

  it('VfNavMenu imports no router: the handoff is resolution by name', () => {
    // Read from disk rather than imported: the sources are evidence here, not modules.
    const read = (name: string) => readFileSync(resolve(__dirname, name), 'utf8');

    for (const name of ['VfNavMenu.vue', 'VfNavMenuItemNode.vue']) {
      expect(read(name)).not.toContain('vue-router');
    }
    expect(read('VfNavMenuItemNode.vue')).toContain("resolveDynamicComponent('RouterLink')");
  });
});

// ----------------------------------------------------------------- transition

describe('VfNavMenu characterization: transition', () => {
  let durations: string;

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    });
    durations = '0.32s, 0.32s';
    const computed = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = computed(element, pseudo);
      if (!(element as Element).classList?.contains('vf-nav-menu__collapse')) return style;
      return new Proxy(style, {
        get: (target, property) =>
          property === 'transitionDuration'
            ? durations
            : property === 'transitionDelay'
              ? '0s'
              : Reflect.get(target, property),
      });
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 72 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight;
  });

  const frame = () => vi.advanceTimersByTime(16);
  const collapse = (wrapper: Wrapper) => wrapper.element.querySelector<HTMLElement>('.vf-nav-menu__collapse');
  const state = (element: HTMLElement | null) =>
    element ? { classes: element.className, style: element.getAttribute('style') } : null;
  const transitionEnd = (element: Element, propertyName = 'height') =>
    element.dispatchEvent(Object.assign(new Event('transitionend', { bubbles: true }), { propertyName }));
  const single = () => [{ value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1' }] }];

  it('enters collapsed with the v-enter classes, grows to the scroll height on the next frame, then swaps to v-enter-to', async () => {
    const wrapper = mountNav({ props: { items: single() }, attachTo: document.body });

    await press(wrapper, 'A');
    expect(state(collapse(wrapper))).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0 v-enter-from v-enter-active',
      style: `transition: ${TRANSITION}; overflow: hidden; height: 0px; opacity: 0;`,
    });

    frame();
    expect(state(collapse(wrapper))).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0 v-enter-from v-enter-active',
      style: `transition: ${TRANSITION}; overflow: hidden; height: 72px; opacity: 1;`,
    });

    frame();
    expect(state(collapse(wrapper))).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0 v-enter-active v-enter-to',
      style: `transition: ${TRANSITION}; overflow: hidden; height: 72px; opacity: 1;`,
    });
  });

  it('finishes the enter on one transitionend per listed duration, on the element itself, then clears every inline declaration', async () => {
    const wrapper = mountNav({ props: { items: single() }, attachTo: document.body });
    await press(wrapper, 'A');
    frame();
    frame();
    const element = collapse(wrapper)!;

    // A bubbling transitionend from inside is not the element's own.
    transitionEnd(element.querySelector('button')!);
    transitionEnd(element);
    expect(element.className).toContain('v-enter-to');

    transitionEnd(element, 'opacity');
    expect(state(element)).toEqual({ classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0', style: '' });
  });

  it('finishes the enter on the longest computed duration plus one millisecond when no transitionend comes', async () => {
    durations = '0.2s, 0.32s';
    const wrapper = mountNav({ props: { items: single() }, attachTo: document.body });
    await press(wrapper, 'A');
    frame();
    frame();

    vi.advanceTimersByTime(320);
    expect(collapse(wrapper)!.className).toContain('v-enter-to');
    vi.advanceTimersByTime(1);
    expect(state(collapse(wrapper))).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0',
      style: '',
    });
  });

  it('finishes the enter at the class swap when the computed duration is zero', async () => {
    durations = '0s';
    const wrapper = mountNav({ props: { items: single() }, attachTo: document.body });
    await press(wrapper, 'A');
    frame();
    expect(collapse(wrapper)!.className).toContain('v-enter-from');

    frame();
    expect(state(collapse(wrapper))).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0',
      style: '',
    });
  });

  it('leaves from the scroll height with the v-leave classes, shrinks to zero on the next frame, and is removed on transitionend', async () => {
    const wrapper = mountNav({ props: { items: single() }, attachTo: document.body });
    await press(wrapper, 'A');
    frame();
    frame();
    transitionEnd(collapse(wrapper)!);
    transitionEnd(collapse(wrapper)!, 'opacity');

    await press(wrapper, 'A');
    const element = collapse(wrapper)!;
    expect(item(wrapper, 'A').getAttribute('aria-expanded')).toBe('false');
    expect(state(element)).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0 v-leave-from v-leave-active',
      style: `transition: ${TRANSITION}; overflow: hidden; height: 72px; opacity: 1;`,
    });

    frame();
    expect(state(element)).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0 v-leave-from v-leave-active',
      style: `transition: ${TRANSITION}; overflow: hidden; height: 0px; opacity: 0;`,
    });

    frame();
    expect(element.className).toBe('vf-nav-menu__collapse vf-nav-menu__collapse--level-0 v-leave-active v-leave-to');
    expect(element.isConnected).toBe(true);

    transitionEnd(element);
    expect(element.isConnected).toBe(true);
    transitionEnd(element, 'opacity');
    expect(element.isConnected).toBe(false);
    // The after-leave hook clears the detached element too.
    expect(state(element)).toEqual({ classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0', style: '' });
    expect(nodeOf(wrapper, 'A').innerHTML).toContain('<!--v-if-->');
  });

  it('removes a leaving subtree on the timeout when no transitionend comes', async () => {
    const wrapper = mountNav({ props: { items: single(), defaultValue: 'a1' }, attachTo: document.body });
    const element = collapse(wrapper)!;

    await press(wrapper, 'A');
    frame();
    frame();
    vi.advanceTimersByTime(320);
    expect(element.isConnected).toBe(true);
    vi.advanceTimersByTime(1);
    expect(element.isConnected).toBe(false);
  });

  it('renders an initially expanded subtree without a transition', () => {
    const wrapper = mountNav({ props: { items: single(), defaultValue: 'a1' }, attachTo: document.body });

    expect(state(collapse(wrapper))).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0',
      style: null,
    });
  });

  it('a reopened parent renders its still-expanded children without a transition: only the toggled branch animates', async () => {
    const wrapper = mountNav({ props: { items: tree() }, attachTo: document.body });
    await press(wrapper, 'Guide');
    await press(wrapper, 'Advanced');
    for (let index = 0; index < 4; index += 1) frame();
    vi.advanceTimersByTime(400);
    await press(wrapper, 'Guide');
    for (let index = 0; index < 4; index += 1) frame();
    vi.advanceTimersByTime(400);

    await press(wrapper, 'Guide');
    const [outer, inner] = wrapper.element.querySelectorAll<HTMLElement>('.vf-nav-menu__collapse');
    expect(outer.className).toContain('v-enter-from');
    expect(state(inner)).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-1',
      style: null,
    });
  });

  it('an activation that opens a closed ancestor animates it like a click', async () => {
    const wrapper = mountNav({ props: { items: single(), modelValue: 'none' }, attachTo: document.body });

    await wrapper.setProps({ modelValue: 'a1' });
    expect(collapse(wrapper)!.className).toContain('v-enter-from v-enter-active');
  });

  it('reopening while leaving removes the leaving subtree at once and enters a fresh one from zero', async () => {
    const wrapper = mountNav({ props: { items: single(), defaultValue: 'a1' }, attachTo: document.body });
    const leaving = collapse(wrapper)!;

    await press(wrapper, 'A');
    frame();
    await press(wrapper, 'A');

    expect(leaving.isConnected).toBe(false);
    const entering = collapse(wrapper)!;
    expect(entering).not.toBe(leaving);
    expect(wrapper.element.querySelectorAll('.vf-nav-menu__collapse')).toHaveLength(1);
    expect(state(entering)).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0 v-enter-from v-enter-active',
      style: `transition: ${TRANSITION}; overflow: hidden; height: 0px; opacity: 0;`,
    });
  });

  it('closing while entering cancels the enter - no cleanup - and leaves from the full scroll height', async () => {
    const wrapper = mountNav({ props: { items: single() }, attachTo: document.body });

    await press(wrapper, 'A');
    frame();
    frame();
    const element = collapse(wrapper)!;
    await press(wrapper, 'A');

    expect(state(element)).toEqual({
      classes: 'vf-nav-menu__collapse vf-nav-menu__collapse--level-0 v-leave-from v-leave-active',
      style: `transition: ${TRANSITION}; overflow: hidden; height: 72px; opacity: 1;`,
    });
    frame();
    frame();
    transitionEnd(element);
    transitionEnd(element, 'opacity');
    expect(element.isConnected).toBe(false);
  });

  it('leaves no frame or timer behind once a toggle has settled', async () => {
    const wrapper = mountNav({ props: { items: single() }, attachTo: document.body });

    await press(wrapper, 'A');
    frame();
    frame();
    vi.advanceTimersByTime(321);
    await press(wrapper, 'A');
    frame();
    frame();
    vi.advanceTimersByTime(321);

    expect(vi.getTimerCount()).toBe(0);
  });
});

// ------------------------------------------------------------- compactness

describe('VfNavMenu characterization: responsive compactness', () => {
  let observed: Element[];
  let callbacks: Array<() => void>;
  let disconnects: number;
  const widths = new Map<string, number>();

  beforeEach(() => {
    observed = [];
    callbacks = [];
    disconnects = 0;
    widths.clear();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          callbacks.push(callback);
        }
        observe(element: Element) {
          observed.push(element);
        }
        disconnect() {
          disconnects += 1;
        }
      },
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const key = this.classList.contains('vf-nav-menu__compact-breakpoint-probe')
        ? `probe:${this.parentElement?.id}`
        : `root:${this.id}`;
      return { width: widths.get(key) ?? 0 } as DOMRect;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sidebar = async (id: string, extra: Partial<NavMenuProps> = {}) => {
    const wrapper = mountNav({
      props: { items: [], variant: 'sidebar', ...extra },
      attrs: { id },
      attachTo: document.body,
    });
    // The measurement runs in onMounted; the class follows on the next render.
    await nextTick();
    return wrapper;
  };
  const compact = (wrapper: Wrapper) => wrapper.classes().includes('vf-nav-menu--sidebar-compact');

  it('observes the root, then the probe, with one observer per instance', async () => {
    const wrapper = await sidebar('one');

    expect(observed).toEqual([
      wrapper.element,
      wrapper.element.querySelector('.vf-nav-menu__compact-breakpoint-probe'),
    ]);
    expect(callbacks).toHaveLength(1);
  });

  it('measures on mount: a sidebar no wider than the probe is compact, a wider one is not', async () => {
    widths.set('probe:narrow', 128).set('root:narrow', 128).set('probe:wide', 128).set('root:wide', 129);

    expect(compact(await sidebar('narrow'))).toBe(true);
    expect(compact(await sidebar('wide'))).toBe(false);
  });

  it('a probe with no width never makes the sidebar compact', async () => {
    widths.set('probe:zero', 0).set('root:zero', 0);

    expect(compact(await sidebar('zero'))).toBe(false);
  });

  it('re-measures on every observer callback, wide to narrow and back', async () => {
    widths.set('probe:x', 128).set('root:x', 400);
    const wrapper = await sidebar('x');
    expect(compact(wrapper)).toBe(false);

    widths.set('root:x', 100);
    callbacks[0]();
    await nextTick();
    expect(compact(wrapper)).toBe(true);

    widths.set('root:x', 300);
    callbacks[0]();
    await nextTick();
    expect(compact(wrapper)).toBe(false);
  });

  it('keeps instances apart: each observer measures its own root against its own probe', async () => {
    widths.set('probe:a', 128).set('root:a', 400).set('probe:b', 128).set('root:b', 400);
    const a = await sidebar('a');
    const b = await sidebar('b');

    widths.set('root:a', 90);
    callbacks[0]();
    await nextTick();
    expect([compact(a), compact(b)]).toEqual([true, false]);

    callbacks[1]();
    await nextTick();
    expect([compact(a), compact(b)]).toEqual([true, false]);
  });

  it('an explicit compact wins over the measurement in both directions', async () => {
    widths.set('probe:t', 128).set('root:t', 900).set('probe:f', 128).set('root:f', 50);

    expect(compact(await sidebar('t', { compact: true }))).toBe(true);
    expect(compact(await sidebar('f', { compact: false }))).toBe(false);
  });

  it('only the sidebar variant is ever compact, and measuring another variant records nothing', async () => {
    widths.set('probe:p', 128).set('root:p', 50);
    const wrapper = mountNav({ props: { items: [], variant: 'pills', compact: true }, attrs: { id: 'p' } });
    expect(compact(wrapper)).toBe(false);

    // Switching to sidebar re-measures on the next tick: narrow, so compact once the explicit value is gone.
    await wrapper.setProps({ variant: 'sidebar', compact: undefined });
    expect(compact(wrapper)).toBe(false);
    await nextTick();
    await nextTick();
    expect(compact(wrapper)).toBe(true);

    await wrapper.setProps({ variant: 'default' });
    expect(compact(wrapper)).toBe(false);
  });

  it('places the compact modifier last, after --simple', async () => {
    widths.set('probe:o', 128).set('root:o', 10);

    expect((await sidebar('o')).classes()).toEqual([
      'vf-nav-menu',
      'vf-nav-menu--sidebar',
      'vf-nav-menu--simple',
      'vf-nav-menu--sidebar-compact',
    ]);
  });

  it('disconnects its observer on unmount', async () => {
    const wrapper = await sidebar('u');

    wrapper.unmount();
    expect(disconnects).toBe(1);
  });

  it('observes every variant, not only the sidebar', async () => {
    mountNav({ props: { items: [] } });

    expect(observed).toHaveLength(2);
  });

  it('without ResizeObserver it listens to window resize instead, and removes the listener on unmount', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    widths.set('probe:w', 128).set('root:w', 400);
    const wrapper = await sidebar('w');
    expect(add.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);

    widths.set('root:w', 100);
    window.dispatchEvent(new Event('resize'));
    await nextTick();
    expect(compact(wrapper)).toBe(true);

    wrapper.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);
  });
});

// ------------------------------------------------------------------- keyboard

describe('VfNavMenu characterization: focus and keyboard', () => {
  it('handles no key: arrows, Home and End neither move focus nor are prevented', () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'intro' }, attachTo: document.body });
    const guide = item(wrapper, 'Guide');
    guide.focus();

    for (const key of ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'Escape']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      guide.dispatchEvent(event);
      expect(event.defaultPrevented, key).toBe(false);
      expect(document.activeElement, key).toBe(guide);
    }
  });

  it('Enter and Space on a branch are native activation only: no keydown handler toggles it', async () => {
    const wrapper = mountNav({ props: { items: tree() }, attachTo: document.body });
    const guide = item(wrapper, 'Guide');

    for (const key of ['Enter', ' ']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      guide.dispatchEvent(event);
      await nextTick();
      expect(event.defaultPrevented).toBe(false);
    }
    expect(guide.getAttribute('aria-expanded')).toBe('false');
  });

  it('a toggle keeps focus where the user put it', async () => {
    const wrapper = mountNav({ props: { items: tree() }, attachTo: document.body });
    const guide = item(wrapper, 'Guide');
    guide.focus();

    await click(wrapper, 'Guide');
    expect(document.activeElement).toBe(guide);
  });

  it('a disabled link leaves the tab order (tabindex -1) but stays programmatically focusable', () => {
    const wrapper = mountNav({
      props: { items: [{ value: 'x', label: 'X', href: '/x', disabled: true }] },
      attachTo: document.body,
    });
    const link = item(wrapper, 'X');

    expect(link.tabIndex).toBe(-1);
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it('focus inside a subtree that collapses is lost to the body when the subtree is removed', async () => {
    const wrapper = mountNav({ props: { items: tree(), defaultValue: 'intro' }, attachTo: document.body });
    item(wrapper, 'Intro').focus();

    await click(wrapper, 'Guide');
    // The leave holds the subtree until its transition ends.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(document.activeElement).toBe(document.body);
  });
});

// ------------------------------------------------------------------ reactivity

describe('VfNavMenu characterization: reactive items', () => {
  it('re-renders added, removed and relabelled items in place', async () => {
    const wrapper = mountNav({ props: { items: [{ value: 'a', label: 'A' }] } });

    await wrapper.setProps({
      items: [
        { value: 'b', label: 'B' },
        { value: 'a', label: 'A2' },
      ],
    });
    expect(wrapper.findAll('.vf-nav-menu__label').map((label) => label.text())).toEqual(['B', 'A2']);
  });
});
