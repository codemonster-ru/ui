// Characterization of the historical VfMenuItem at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The larger half of the M27 unit: one control per item, an anchor or a
// button, carrying an explicit `role="menuitem"`. It is the second migrated
// component with two rendering branches, and unlike VfLink both of its
// branches are native HTML - there is no `to`, no `component`, no
// RouterLink, no router import and therefore no Vue-only branch at all.
//
// Five things are pinned because a migration would get them wrong by reading
// the wrong neighbour:
//
//   - the branch test is `if (props.href)`, truthiness. `href=""` renders the
//     *button*. VfLink keeps `href=""` on its anchor, and the two must not be
//     made to agree;
//   - `rel` is written exactly as given. There is no `_blank` derivation.
//     VfLink derives `noopener noreferrer` and VfBreadcrumbs reuses VfLink's
//     rule; this component reuses neither, and calling `resolveLinkRel` here
//     would add an attribute the reference never writes;
//   - `v-bind="attrs"` comes *first*, before every component binding, so the
//     component wins. A consumer `role` cannot override `role="menuitem"`.
//     VfMenu's ordering is the exact inverse - its consumer role *does* win -
//     and VfMenu.characterization.spec.ts pins that side. `class` is the one
//     attribute that merges rather than replacing, and it merges
//     consumer-first here and component-first there;
//   - a disabled anchor drops its `href` but keeps `target` and `rel`, and
//     takes `aria-disabled` and `tabindex="-1"` rather than the `disabled`
//     attribute a button takes. There is no `--disabled` modifier class on
//     either branch;
//   - the click handler prevents the default for a disabled item and emits
//     nothing, but never stops propagation, so a disabled anchor's click
//     still bubbles.
//
// The keyboard contract is that the component owns none of it. Enter and
// Space on a button, Enter on an anchor: all native. No arrows, no Home/End,
// no Escape, no roving tabindex. `active` is a class and nothing more - no
// aria-selected, no aria-checked, no aria-current - so the accessibility
// tree cannot see it.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

// The icons package is stubbed with the real component's attr routing rather
// than with the package-wide setup stub, which renders a bare span and would
// hide the one thing worth pinning: VueIconify sets inheritAttrs: false and
// spreads its attrs onto the *inner svg*, not onto the wrapper span. So
// `vf-menu__item-icon` and `aria-hidden` land on the svg, and the flex child
// of `.vf-menu__item` is the untouched `span.vf-icon-wrapper`. That the name
// produces the right geometry is not knowable from a stub and is proven where
// the real package is loaded: the three-way parity run, whose compared
// vocabulary carries the glyph's path data since M27.
vi.mock('@codemonster-ru/vueforge-icons', () => {
  const toKebabCase = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

  return {
    VueIconify: {
      name: 'VueIconifyStub',
      inheritAttrs: false,
      props: { icon: String },
      template: '<span class="vf-icon-wrapper"><svg :data-icon="icon" v-bind="$attrs" class="vf-icon" /></span>',
    },
    icons: new Proxy({}, { get: (_target, property) => toKebabCase(String(property)) }),
  };
});

import VfMenuItem from './VfMenuItem.vue';

type MenuItemProps = InstanceType<typeof VfMenuItem>['$props'];

function mountItem(props: Record<string, unknown>, attrs: Record<string, unknown> = {}) {
  return mount(VfMenuItem, { props: props as unknown as MenuItemProps, attrs });
}

const html = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) =>
  mountItem(props, attrs).html({ raw: true });

const ssr = async (props: Record<string, unknown>) =>
  await renderToString(createSSRApp({ render: () => h(VfMenuItem, props as unknown as MenuItemProps) }));

const LABEL = (text: string) => `<span class="vf-menu__item-label">${text}</span>`;
const NO_ICON = '<!--v-if-->';
const ICON = (name: string) =>
  `<span class="vf-icon-wrapper"><svg data-icon="${name}" class="vf-menu__item-icon vf-icon" aria-hidden="true"></svg></span>`;

// ------------------------------------------------------------ branch identity

describe('VfMenuItem characterization: branch selection', () => {
  it('renders a button when there is no href', () => {
    expect(html({ label: 'Edit' })).toBe(
      `<button class="vf-menu__item" type="button" role="menuitem">${NO_ICON}${LABEL('Edit')}</button>`,
    );
  });

  it('renders an anchor when there is an href', () => {
    expect(html({ label: 'Go', href: '/a' })).toBe(
      `<a class="vf-menu__item" href="/a" role="menuitem">${NO_ICON}${LABEL('Go')}</a>`,
    );
  });

  it("renders the BUTTON for href='', because the branch test is truthiness", () => {
    // Load-bearing, and the one place VfLink's rule must not be borrowed:
    // VfLink renders `<a href="">`. A migration that used `href !== undefined`
    // would render an anchor with an empty href here.
    const wrapper = mountItem({ label: 'Go', href: '' });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('href')).toBeUndefined();
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('renders the button branch on the server identically', async () => {
    expect(await ssr({ label: 'Edit' })).toBe(
      `<button class="vf-menu__item" type="button" role="menuitem">${NO_ICON}${LABEL('Edit')}</button>`,
    );
  });

  it('renders the anchor branch on the server identically', async () => {
    expect(await ssr({ label: 'Go', href: '/a' })).toBe(
      `<a class="vf-menu__item" href="/a" role="menuitem">${NO_ICON}${LABEL('Go')}</a>`,
    );
  });

  it('writes role=menuitem on both branches, unconditionally', () => {
    for (const props of [
      { label: 'A' },
      { label: 'A', disabled: true },
      { label: 'A', href: '/a' },
      { label: 'A', href: '/a', disabled: true },
    ]) {
      expect(mountItem(props).attributes('role')).toBe('menuitem');
    }
  });

  it('writes type=button on the button branch only', () => {
    expect(mountItem({ label: 'A' }).attributes('type')).toBe('button');
    expect(mountItem({ label: 'A', disabled: true }).attributes('type')).toBe('button');
    expect(mountItem({ label: 'A', href: '/a' }).attributes('type')).toBeUndefined();
    expect(mountItem({ label: 'A', href: '/a', disabled: true }).attributes('type')).toBeUndefined();
  });

  it('has no slot: the label is a prop rendered into a span', () => {
    const wrapper = mount(VfMenuItem, {
      props: { label: 'Edit' } as unknown as MenuItemProps,
      slots: { default: '<em>ignored</em>' } as never,
    });

    expect(wrapper.find('em').exists()).toBe(false);
    expect(wrapper.get('.vf-menu__item-label').text()).toBe('Edit');
  });
});

// -------------------------------------------------------------------- classes

describe('VfMenuItem characterization: classes', () => {
  it('emits only the block class for the defaults', () => {
    expect(mountItem({ label: 'A' }).classes()).toEqual(['vf-menu__item']);
  });

  it('adds the active modifier for active', () => {
    expect(mountItem({ label: 'A', active: true }).classes()).toEqual(['vf-menu__item', 'vf-menu__item--active']);
  });

  it('adds the danger modifier for tone=danger and nothing for tone=default', () => {
    expect(mountItem({ label: 'A', tone: 'danger' }).classes()).toEqual(['vf-menu__item', 'vf-menu__item--danger']);
    expect(mountItem({ label: 'A', tone: 'default' }).classes()).toEqual(['vf-menu__item']);
  });

  it('orders the active modifier before the danger modifier', () => {
    expect(mountItem({ label: 'A', active: true, tone: 'danger' }).attributes('class')).toBe(
      'vf-menu__item vf-menu__item--active vf-menu__item--danger',
    );
  });

  it('writes no disabled modifier on either branch', () => {
    // The disabled look is `:is(:disabled, [aria-disabled='true'])` in CSS,
    // which is why one selector covers a button and an anchor. There is no
    // `vf-menu__item--disabled`, and inventing one would be a new class.
    expect(mountItem({ label: 'A', disabled: true }).classes()).toEqual(['vf-menu__item']);
    expect(mountItem({ label: 'A', href: '/a', disabled: true }).classes()).toEqual(['vf-menu__item']);
  });

  it('keeps the modifiers on a disabled item, which is still active and still danger', () => {
    expect(mountItem({ label: 'A', disabled: true, active: true, tone: 'danger' }).attributes('class')).toBe(
      'vf-menu__item vf-menu__item--active vf-menu__item--danger',
    );
  });

  it('merges a consumer class BEFORE the block class', () => {
    // The inverse of VfMenu and of VfLink, both of which put their own
    // classes first. `v-bind="attrs"` is the earlier source here.
    expect(mountItem({ label: 'A', active: true }, { class: 'mine' }).attributes('class')).toBe(
      'mine vf-menu__item vf-menu__item--active',
    );
    expect(mountItem({ label: 'A', href: '/a' }, { class: 'mine' }).attributes('class')).toBe('mine vf-menu__item');
  });
});

// ------------------------------------------------------------- the link branch

describe('VfMenuItem characterization: the link branch', () => {
  it('writes target as given', () => {
    expect(mountItem({ label: 'A', href: '/a', target: '_blank' }).attributes('target')).toBe('_blank');
  });

  it('writes rel exactly as given', () => {
    expect(mountItem({ label: 'A', href: '/a', rel: 'nofollow' }).attributes('rel')).toBe('nofollow');
  });

  it('writes NO rel for target=_blank when none was given', () => {
    // Load-bearing, and the single most likely accidental import in M27.
    // VfLink derives `noopener noreferrer` here and VfBreadcrumbs reuses
    // VfLink's rule. This component derives nothing, and reusing
    // resolveLinkRel would add an attribute the reference never writes.
    const wrapper = mountItem({ label: 'A', href: '/a', target: '_blank' });

    expect(wrapper.attributes('rel')).toBeUndefined();
    expect(wrapper.html({ raw: true })).toBe(
      `<a class="vf-menu__item" href="/a" target="_blank" role="menuitem">${NO_ICON}${LABEL('A')}</a>`,
    );
  });

  it('does not merge an explicit rel with a derived one for _blank', () => {
    expect(mountItem({ label: 'A', href: '/a', target: '_blank', rel: 'nofollow' }).attributes('rel')).toBe('nofollow');
  });

  it('writes an empty-string rel as given rather than treating it as absent', () => {
    // VfLink's rule tests `rel` for truthiness, so an empty string there
    // falls through to the derivation. Here the value is bound straight to
    // the attribute and an empty string is written as an empty attribute.
    expect(mountItem({ label: 'A', href: '/a', target: '_blank', rel: '' }).attributes('rel')).toBe('');
  });

  it('writes target and rel with no href at all when there is no destination', () => {
    // target and rel are props of this component, not of the anchor branch:
    // with no href the button branch renders and neither reaches the DOM.
    const wrapper = mountItem({ label: 'A', target: '_blank', rel: 'nofollow' });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('target')).toBeUndefined();
    expect(wrapper.attributes('rel')).toBeUndefined();
  });
});

// ------------------------------------------------------------------- disabled

describe('VfMenuItem characterization: disabled', () => {
  it('gives a disabled button the native attribute and aria-disabled, and no tabindex', () => {
    expect(html({ label: 'Edit', disabled: true })).toBe(
      '<button class="vf-menu__item" type="button" disabled="" aria-disabled="true" role="menuitem">' +
        `${NO_ICON}${LABEL('Edit')}</button>`,
    );
  });

  it('drops the href of a disabled anchor but keeps target and rel', () => {
    // The quirk in one assertion: no href, no `disabled` attribute, an
    // aria-disabled, a tabindex of -1 - and target and rel still written,
    // because only the href is guarded.
    expect(html({ label: 'Go', href: '/a', disabled: true, target: '_blank', rel: 'nofollow' })).toBe(
      '<a class="vf-menu__item" target="_blank" rel="nofollow" aria-disabled="true" tabindex="-1" role="menuitem">' +
        `${NO_ICON}${LABEL('Go')}</a>`,
    );
  });

  it('keeps a disabled anchor an anchor, with no disabled attribute', () => {
    const wrapper = mountItem({ label: 'Go', href: '/a', disabled: true });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBeUndefined();
    expect(wrapper.attributes('disabled')).toBeUndefined();
    expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.attributes('tabindex')).toBe('-1');
  });

  it('writes no aria-disabled and no tabindex on an enabled item of either branch', () => {
    for (const props of [{ label: 'A' }, { label: 'A', href: '/a' }]) {
      const wrapper = mountItem(props);

      expect(wrapper.attributes('aria-disabled')).toBeUndefined();
      expect(wrapper.attributes('tabindex')).toBeUndefined();
      expect(wrapper.attributes('disabled')).toBeUndefined();
    }
  });

  it('writes no tabindex on a disabled button, which the browser removes from the tab order itself', () => {
    expect(mountItem({ label: 'A', disabled: true }).attributes('tabindex')).toBeUndefined();
  });
});

// ------------------------------------------------------------------ the icon

describe('VfMenuItem characterization: icon', () => {
  it('renders no icon node at all when none is given', () => {
    expect(mountItem({ label: 'A' }).find('.vf-icon-wrapper').exists()).toBe(false);
  });

  it('renders the icon before the label, inside the wrapper the icon component owns', () => {
    expect(html({ label: 'Edit', icon: 'pencil' })).toBe(
      `<button class="vf-menu__item" type="button" role="menuitem">${ICON('pencil')}${LABEL('Edit')}</button>`,
    );
  });

  it('puts vf-menu__item-icon and aria-hidden on the INNER svg, not on the wrapper span', () => {
    // Load-bearing. VueIconify sets inheritAttrs: false and spreads its
    // attrs onto the svg, so the flex child of `.vf-menu__item` is the
    // wrapper span, which carries no `flex: none`. Moving the class to the
    // wrapper is the tidying a migration would do by accident.
    const wrapper = mountItem({ label: 'Edit', icon: 'pencil' });
    const span = wrapper.get('.vf-icon-wrapper');
    const svg = wrapper.get('svg');

    expect(span.element.tagName).toBe('SPAN');
    expect(span.classes()).toEqual(['vf-icon-wrapper']);
    expect(span.attributes('aria-hidden')).toBeUndefined();
    expect(svg.classes()).toEqual(['vf-menu__item-icon', 'vf-icon']);
    expect(svg.attributes('aria-hidden')).toBe('true');
  });

  it('renders the icon on the anchor branch the same way', () => {
    expect(html({ label: 'Go', href: '/a', icon: 'pencil' })).toBe(
      `<a class="vf-menu__item" href="/a" role="menuitem">${ICON('pencil')}${LABEL('Go')}</a>`,
    );
  });

  it('hands the icon name through untouched, including a name no glyph has', () => {
    // The prop is typed `IconName | string`, so an arbitrary string is public
    // API. The component passes it straight to the icon component and makes
    // no decision about it; what an unknown name renders is the icons
    // package's own rule - the `moon` fallback - and the Razor adapter
    // restates it through resolveMenuItemIconName because its renderer
    // throws instead. Proven end to end by the parity case that renders one.
    expect(mountItem({ label: 'A', icon: 'pencil' }).get('svg').attributes('data-icon')).toBe('pencil');
    expect(mountItem({ label: 'A', icon: 'no-such-glyph' }).get('svg').attributes('data-icon')).toBe('no-such-glyph');
  });

  it('renders the icon on the server the same way', async () => {
    expect(await ssr({ label: 'Edit', icon: 'pencil' })).toBe(
      `<button class="vf-menu__item" type="button" role="menuitem">${ICON('pencil')}${LABEL('Edit')}</button>`,
    );
  });
});

// --------------------------------------------------------------- attrs order

describe('VfMenuItem characterization: attrs', () => {
  it('forwards id, data-* and aria-label to the control', () => {
    const wrapper = mountItem({ label: 'A' }, { id: 'edit', 'data-testid': 'item', 'aria-label': 'Edit item' });

    expect(wrapper.attributes('id')).toBe('edit');
    expect(wrapper.attributes('data-testid')).toBe('item');
    expect(wrapper.attributes('aria-label')).toBe('Edit item');
  });

  it('forwards style to the control', () => {
    expect(mountItem({ label: 'A' }, { style: 'color: red;' }).attributes('style')).toBe('color: red;');
  });

  it('does NOT let a consumer role override role=menuitem, on either branch', () => {
    // Load-bearing, and the exact inverse of VfMenu. `v-bind="attrs"` is
    // first here, so every component binding wins.
    expect(mountItem({ label: 'A' }, { role: 'option' }).attributes('role')).toBe('menuitem');
    expect(mountItem({ label: 'A', href: '/a' }, { role: 'option' }).attributes('role')).toBe('menuitem');
  });

  it('takes href, target and rel as declared props, so they never arrive as fall-through attrs', () => {
    // Passing `href` "as an attr" is not a thing a consumer can do: Vue
    // routes a declared prop to props whatever the call site calls it, so
    // the value selects the anchor branch rather than landing on a button.
    // That is why the branch test can be a prop test and why the Razor
    // adapter consumes these three names rather than forwarding them.
    const wrapper = mountItem({ label: 'A' }, { href: '/consumer' });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('/consumer');
  });

  it('keeps a consumer tabindex on the button branch, which binds none of its own', () => {
    expect(mountItem({ label: 'A' }, { tabindex: '3' }).attributes('tabindex')).toBe('3');
  });

  it('DROPS a consumer tabindex on an enabled anchor, which binds undefined over it', () => {
    // The anchor branch binds `:tabindex="disabled ? -1 : undefined"`, and
    // binding undefined after the attrs removes the consumer's value. The
    // button branch above keeps it because that branch binds no tabindex at
    // all. The two branches genuinely differ here.
    expect(mountItem({ label: 'A', href: '/a' }, { tabindex: '3' }).attributes('tabindex')).toBeUndefined();
    expect(mountItem({ label: 'A', href: '/a', disabled: true }, { tabindex: '3' }).attributes('tabindex')).toBe('-1');
  });

  it('renders the whole consumer attr surface in one shape on each branch', () => {
    expect(html({ label: 'Edit' }, { class: 'mine', id: 'x', role: 'option', tabindex: '3' })).toBe(
      `<button class="mine vf-menu__item" id="x" role="menuitem" tabindex="3" type="button">${NO_ICON}${LABEL('Edit')}</button>`,
    );
    expect(html({ label: 'Go', href: '/a' }, { class: 'mine', role: 'option', tabindex: '3' })).toBe(
      `<a class="mine vf-menu__item" role="menuitem" href="/a">${NO_ICON}${LABEL('Go')}</a>`,
    );
  });
});

// --------------------------------------------------------------- click / emit

describe('VfMenuItem characterization: click and select', () => {
  it('emits select once per click on an enabled button, with no payload', async () => {
    const wrapper = mountItem({ label: 'A' });

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toHaveLength(1);
    expect(wrapper.emitted('select')?.[0]).toEqual([]);
  });

  it('emits select again on every reactivation', async () => {
    const wrapper = mountItem({ label: 'A' });

    await wrapper.trigger('click');
    await wrapper.trigger('click');
    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toHaveLength(3);
  });

  it('emits select on an enabled anchor and does not prevent the navigation default', async () => {
    const wrapper = mountItem({ label: 'A', href: '/a' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    wrapper.element.dispatchEvent(event);

    expect(wrapper.emitted('select')).toHaveLength(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it('emits nothing for a disabled anchor, prevents the default, and still lets the click bubble', async () => {
    // All three halves of the disabled anchor's contract in one test. The
    // handler returns early without stopping propagation, which is why a
    // disabled item inside a VfDropdown still closes it.
    const wrapper = mount(VfMenuItem, {
      props: { label: 'A', href: '/a', disabled: true } as unknown as MenuItemProps,
      attachTo: document.body,
    });
    const seen: string[] = [];
    const listener = () => seen.push('document');
    document.addEventListener('click', listener);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    wrapper.element.dispatchEvent(event);
    document.removeEventListener('click', listener);

    expect(wrapper.emitted('select')).toBeUndefined();
    expect(event.defaultPrevented).toBe(true);
    expect(seen).toEqual(['document']);
    wrapper.unmount();
  });

  it('emits nothing for a disabled button when a click is dispatched at it directly', async () => {
    const wrapper = mountItem({ label: 'A', disabled: true });

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('runs a consumer click listener alongside the component handler on an enabled item', async () => {
    const onClick = vi.fn();
    const wrapper = mountItem({ label: 'A' }, { onClick });

    await wrapper.trigger('click');

    // Both run: the attrs listener is merged with the template's own rather
    // than replacing it. The component neither suppresses nor re-orders it.
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('select')).toHaveLength(1);
  });

  it('still runs a consumer click listener on a DISABLED item, which only the emit is guarded against', async () => {
    const onClick = vi.fn();
    const wrapper = mountItem({ label: 'A', href: '/a', disabled: true }, { onClick });

    await wrapper.trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('does not stop propagation on an enabled item either', async () => {
    const wrapper = mount(VfMenuItem, {
      props: { label: 'A' } as unknown as MenuItemProps,
      attachTo: document.body,
    });
    let bubbled = false;
    const listener = () => {
      bubbled = true;
    };
    document.addEventListener('click', listener);

    wrapper.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document.removeEventListener('click', listener);

    expect(bubbled).toBe(true);
    expect(wrapper.emitted('select')).toHaveLength(1);
    wrapper.unmount();
  });
});

// ------------------------------------------------------------------- keyboard

describe('VfMenuItem characterization: keyboard', () => {
  it('registers no keydown handler: no key emits select or changes the DOM', async () => {
    const wrapper = mountItem({ label: 'A' });
    const before = wrapper.html({ raw: true });

    for (const key of ['Enter', ' ', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape']) {
      await wrapper.trigger('keydown', { key });
      await wrapper.trigger('keyup', { key });
    }

    // Enter and Space activate a button through the browser's native click
    // synthesis, which jsdom does not perform for a synthetic keydown. That
    // they do is the browser's contract, measured in the showcase probes;
    // what is pinned here is that the component adds nothing of its own.
    expect(wrapper.emitted('select')).toBeUndefined();
    expect(wrapper.html({ raw: true })).toBe(before);
  });

  it('owns no roving tabindex: two enabled items are both in the tab order', () => {
    expect(mountItem({ label: 'A' }).attributes('tabindex')).toBeUndefined();
    expect(mountItem({ label: 'B' }).attributes('tabindex')).toBeUndefined();
  });
});

// ------------------------------------------------------- what it does not own

describe('VfMenuItem characterization: what the component does not own', () => {
  it('exposes active as a class only, with no accessibility state', () => {
    const wrapper = mountItem({ label: 'A', active: true });

    expect(wrapper.classes()).toContain('vf-menu__item--active');
    expect(wrapper.attributes('aria-selected')).toBeUndefined();
    expect(wrapper.attributes('aria-checked')).toBeUndefined();
    expect(wrapper.attributes('aria-current')).toBeUndefined();
    expect(wrapper.attributes('aria-pressed')).toBeUndefined();
  });

  it('holds no internal state: clicking an inactive item does not make it active', async () => {
    const wrapper = mountItem({ label: 'A' });

    await wrapper.trigger('click');

    expect(wrapper.classes()).toEqual(['vf-menu__item']);
  });

  it('declares exactly the historical props and the one emit', () => {
    const definition = VfMenuItem as unknown as {
      props: Record<string, unknown>;
      emits: string[] | Record<string, unknown>;
    };

    expect(Object.keys(definition.props).sort()).toEqual([
      'active',
      'disabled',
      'href',
      'icon',
      'label',
      'rel',
      'target',
      'tone',
    ]);
    expect(Array.isArray(definition.emits) ? definition.emits : Object.keys(definition.emits)).toEqual(['select']);
  });

  it('has no to, no component and no router handoff', () => {
    const definition = VfMenuItem as unknown as { props: Record<string, unknown> };

    expect(definition.props).not.toHaveProperty('to');
    expect(definition.props).not.toHaveProperty('component');
  });

  it('defaults disabled and active to false and tone to default', () => {
    const wrapper = mountItem({ label: 'A' });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('disabled')).toBeUndefined();
    expect(wrapper.classes()).toEqual(['vf-menu__item']);
  });
});
