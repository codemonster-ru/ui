// Characterization of the historical VfGroupBox at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// A native fieldset whose legend can hold a disclosure trigger. It is the
// second migrated component that owns a control and changes state on a user
// gesture, after VfAccordion, and it differs from the accordion in exactly the
// places a port is most likely to copy the accordion instead of the reference:
//
//   - the trigger is VfButton (ghost), not a bare <button>, so its class list,
//     its type and its disabled rule are VfButton's, with the group box's own
//     class passed in first;
//   - there is no keydown handler at all. Enter and Space toggle through the
//     browser's native button activation - a click event, keydown not
//     prevented - where the accordion handles both keys itself and prevents the
//     default;
//   - there is no <Transition>. The content is under a bare v-if and leaves
//     the DOM in the same tick;
//   - the disclosure only exists when there is a title. `collapsible` without
//     a title (prop or slot) renders the plain static group, and `collapsed`
//     and `defaultCollapsed` are then ignored.
//
// Empirically established facts that are easy to "correct" and must not be:
//
//   - the content element carries a generated id in *every* mode, including
//     the static ones where nothing references it, and the trigger's id is
//     allocated even when no trigger renders;
//   - role=region and aria-labelledby appear only when the group is
//     collapsible; a merely titled group's content is a plain div;
//   - a closed group's aria-controls names the content id although no element
//     carries it;
//   - `disabled` is consumed and never reaches the fieldset, so the native
//     fieldset disabling of descendants is not available; without collapsible
//     the prop does nothing at all. On the trigger it is the native attribute
//     only - no aria-disabled, no modifier class;
//   - `hasTitle` is JavaScript truthiness: "" is no title, "0" is a title, and
//     a title slot counts by its presence whatever it renders;
//   - the model is controlled-with-fallback: a defined `collapsed` wins, a
//     click emits the requested value and changes nothing until the parent
//     writes it back; `defaultCollapsed` seeds the uncontrolled state once;
//   - the `toggle-icon` slot replaces the whole aria-hidden icon wrapper, so a
//     consumer icon is exposed to assistive technology unless it hides itself.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import VfGroupBox from './VfGroupBox.vue';

type GroupBoxProps = InstanceType<typeof VfGroupBox>['$props'];

const ICON_MARKUP =
  '<span aria-hidden="true" class="vf-group-box__icon"><span class="vf-icon" aria-hidden="true" icon="chevronDown" size="var(--vf-icon-size-sm)"></span></span>';

function mountGroupBox({
  props = {},
  attrs = {},
  slots = { default: 'Body' },
  attachTo,
}: {
  props?: Partial<GroupBoxProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  attachTo?: HTMLElement;
} = {}) {
  return mount(VfGroupBox, {
    props: props as GroupBoxProps,
    attrs,
    slots: slots as never,
    ...(attachTo ? { attachTo } : {}),
  });
}

async function ssrGroupBox(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfGroupBox, props, slots) });

  return await renderToString(app);
}

const trigger = (wrapper: ReturnType<typeof mountGroupBox>) => wrapper.get('button');
const content = (wrapper: ReturnType<typeof mountGroupBox>) => wrapper.find('.vf-group-box__content');

// ------------------------------------------------------------------ API

describe('VfGroupBox characterization: props, defaults and emits', () => {
  it('accepts exactly five props with the historical defaults', () => {
    const declared = (VfGroupBox as unknown as { props: Record<string, { default?: unknown; type: unknown }> }).props;

    expect(Object.keys(declared).sort()).toEqual(['collapsed', 'collapsible', 'defaultCollapsed', 'disabled', 'title']);
    expect(declared.title.default).toBeUndefined();
    expect(declared.collapsible.default).toBe(false);
    expect(declared.collapsed.default).toBeUndefined();
    expect(declared.defaultCollapsed.default).toBe(false);
    expect(declared.disabled.default).toBe(false);
    expect(declared.title.type).toBe(String);
    expect(declared.collapsed.type).toBe(Boolean);
  });

  it('declares exactly two emits, in the historical order', () => {
    expect((VfGroupBox as unknown as { emits: string[] }).emits).toEqual(['update:collapsed', 'collapsedChange']);
  });

  it('sets inheritAttrs to false and binds the attributes onto the fieldset itself', () => {
    expect((VfGroupBox as unknown as { inheritAttrs?: boolean }).inheritAttrs).toBe(false);
  });
});

// ------------------------------------------------------------------ structure

describe('VfGroupBox characterization: structure', () => {
  it('renders exactly the historical static markup without a title: no legend, a content div with an id', () => {
    const wrapper = mountGroupBox();

    expect(wrapper.html({ raw: true })).toBe(
      '<fieldset class="vf-group-box"><!--v-if-->' +
        '<div id="vf-group-box-content-v-1" class="vf-group-box__content">Body</div>' +
        '</fieldset>',
    );
  });

  it('renders exactly the historical titled markup: a legend with a title span and a plain content div', () => {
    const wrapper = mountGroupBox({ props: { title: 'Shipping' } });

    expect(wrapper.html({ raw: true })).toBe(
      '<fieldset class="vf-group-box vf-group-box--titled">' +
        '<legend class="vf-group-box__legend"><span class="vf-group-box__title">Shipping</span></legend>' +
        '<div id="vf-group-box-content-v-1" class="vf-group-box__content">Body</div>' +
        '</fieldset>',
    );
  });

  it('renders exactly the historical open collapsible markup', () => {
    const wrapper = mountGroupBox({ props: { title: 'Details', collapsible: true } });

    expect(wrapper.html({ raw: true })).toBe(
      '<fieldset class="vf-group-box vf-group-box--titled vf-group-box--collapsible">' +
        '<legend class="vf-group-box__legend">' +
        '<button id="vf-group-box-trigger-v-0" aria-controls="vf-group-box-content-v-1" aria-expanded="true" class="vf-group-box__trigger vf-button vf-button--ghost" type="button">' +
        '<!--v-if-->' +
        ICON_MARKUP +
        '<span class="vf-group-box__title">Details</span>' +
        '</button></legend>' +
        '<div id="vf-group-box-content-v-1" aria-labelledby="vf-group-box-trigger-v-0" class="vf-group-box__content" role="region">Body</div>' +
        '</fieldset>',
    );
  });

  it('renders exactly the historical closed collapsible markup: no content, a v-if comment in its place', () => {
    const wrapper = mountGroupBox({ props: { title: 'Details', collapsible: true, defaultCollapsed: true } });

    expect(wrapper.html({ raw: true })).toBe(
      '<fieldset class="vf-group-box vf-group-box--titled vf-group-box--collapsible vf-group-box--collapsed">' +
        '<legend class="vf-group-box__legend">' +
        '<button id="vf-group-box-trigger-v-0" aria-controls="vf-group-box-content-v-1" aria-expanded="false" class="vf-group-box__trigger vf-button vf-button--ghost" type="button">' +
        '<!--v-if-->' +
        ICON_MARKUP +
        '<span class="vf-group-box__title">Details</span>' +
        '</button></legend>' +
        '<!--v-if-->' +
        '</fieldset>',
    );
  });

  it('orders the root children legend, content', () => {
    const wrapper = mountGroupBox({ props: { title: 'Details', collapsible: true } });

    expect([...wrapper.element.children].map((child) => child.tagName.toLowerCase())).toEqual(['legend', 'div']);
    expect(wrapper.element.tagName).toBe('FIELDSET');
    expect(wrapper.get('legend').element.children[0].tagName).toBe('BUTTON');
  });

  it('writes the root modifiers in the historical order', () => {
    expect(mountGroupBox().classes()).toEqual(['vf-group-box']);
    expect(mountGroupBox({ props: { title: 'T' } }).classes()).toEqual(['vf-group-box', 'vf-group-box--titled']);
    expect(mountGroupBox({ props: { title: 'T', collapsible: true } }).classes()).toEqual([
      'vf-group-box',
      'vf-group-box--titled',
      'vf-group-box--collapsible',
    ]);
    expect(mountGroupBox({ props: { title: 'T', collapsible: true, collapsed: true } }).classes()).toEqual([
      'vf-group-box',
      'vf-group-box--titled',
      'vf-group-box--collapsible',
      'vf-group-box--collapsed',
    ]);
  });
});

// ------------------------------------------------------------------ title presence

describe('VfGroupBox characterization: title presence is JavaScript truthiness', () => {
  it('treats an empty title as no title: no legend, no modifier, no trigger even when collapsible', () => {
    const wrapper = mountGroupBox({ props: { title: '', collapsible: true } });

    expect(wrapper.find('legend').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.classes()).toEqual(['vf-group-box']);
    expect(content(wrapper).attributes('role')).toBeUndefined();
  });

  it('treats the title "0" as a title, and as a collapsible one when asked', () => {
    const wrapper = mountGroupBox({ props: { title: '0', collapsible: true } });

    expect(wrapper.get('legend .vf-group-box__title').text()).toBe('0');
    expect(wrapper.classes()).toEqual(['vf-group-box', 'vf-group-box--titled', 'vf-group-box--collapsible']);
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
    expect(content(wrapper).attributes('role')).toBe('region');
  });

  it('counts a title slot by its presence, even beside an empty title prop', () => {
    const wrapper = mountGroupBox({
      props: { title: '', collapsible: true },
      slots: { title: 'Slotted', default: 'Body' },
    });

    expect(wrapper.get('.vf-group-box__title').text()).toBe('Slotted');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('counts a title slot that renders nothing', () => {
    const wrapper = mountGroupBox({ slots: { title: () => [], default: 'Body' } });

    expect(wrapper.find('legend').exists()).toBe(true);
    expect(wrapper.classes()).toContain('vf-group-box--titled');
  });

  it('lets the title slot replace the title prop text inside the title span', () => {
    const wrapper = mountGroupBox({ props: { title: 'Prop' }, slots: { title: 'Slot', default: 'Body' } });

    expect(wrapper.get('.vf-group-box__title').text()).toBe('Slot');
    expect(wrapper.text()).not.toContain('Prop');
  });

  it('renders no trigger when collapsible has nothing to title', () => {
    const wrapper = mountGroupBox({ props: { collapsible: true, collapsed: true } });

    expect(wrapper.find('legend').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(content(wrapper).exists()).toBe(true);
    expect(wrapper.classes()).toEqual(['vf-group-box']);
  });
});

// ------------------------------------------------------------------ initial state

describe('VfGroupBox characterization: collapse resolution', () => {
  it.each([
    [{}, true],
    [{ defaultCollapsed: true }, false],
    [{ defaultCollapsed: false }, true],
    [{ collapsed: true }, false],
    [{ collapsed: false }, true],
    [{ collapsed: false, defaultCollapsed: true }, true],
    [{ collapsed: true, defaultCollapsed: false }, false],
  ])('collapsible with %o renders the content %s', (props, open) => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, ...props } });

    expect(content(wrapper).exists()).toBe(open);
    expect(trigger(wrapper).attributes('aria-expanded')).toBe(String(open));
    expect(wrapper.classes().includes('vf-group-box--collapsed')).toBe(!open);
  });

  it.each([{ collapsed: true }, { defaultCollapsed: true }, { collapsed: true, defaultCollapsed: true }])(
    'ignores %o when the group is not collapsible',
    (props) => {
      const wrapper = mountGroupBox({ props: { title: 'T', ...props } });

      expect(content(wrapper).exists()).toBe(true);
      expect(wrapper.classes()).toEqual(['vf-group-box', 'vf-group-box--titled']);
    },
  );

  it('reads defaultCollapsed once: changing it after mount does nothing', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });

    await wrapper.setProps({ defaultCollapsed: true });
    expect(content(wrapper).exists()).toBe(true);
  });
});

// ------------------------------------------------------------------ trigger

describe('VfGroupBox characterization: the trigger is VfButton', () => {
  it('is a native button of type button with the group box class passed in before the button classes', () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });
    const button = trigger(wrapper);

    expect(button.element.tagName).toBe('BUTTON');
    expect(button.attributes('type')).toBe('button');
    expect(button.element.className).toBe('vf-group-box__trigger vf-button vf-button--ghost');
    expect(button.attributes('role')).toBeUndefined();
    expect(button.attributes('tabindex')).toBeUndefined();
  });

  it('writes the trigger attributes in the historical order', () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, disabled: true } });

    expect(trigger(wrapper).element.getAttributeNames()).toEqual([
      'id',
      'aria-controls',
      'aria-expanded',
      'disabled',
      'class',
      'type',
    ]);
  });

  it('renders the icon wrapper then the title span, after the spinner placeholder', () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });

    expect([...trigger(wrapper).element.children].map((child) => child.className)).toEqual([
      'vf-group-box__icon',
      'vf-group-box__title',
    ]);
    expect(trigger(wrapper).element.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
  });
});

// ------------------------------------------------------------------ ids

describe('VfGroupBox characterization: generated ids and relationships', () => {
  it('wires the open pair both ways: trigger controls the content, the content is labelled by the trigger', () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });
    const triggerId = trigger(wrapper).attributes('id');
    const contentId = content(wrapper).attributes('id');

    expect(triggerId).toBe('vf-group-box-trigger-v-0');
    expect(contentId).toBe('vf-group-box-content-v-1');
    expect(trigger(wrapper).attributes('aria-controls')).toBe(contentId);
    expect(content(wrapper).attributes('aria-labelledby')).toBe(triggerId);
  });

  it('keeps aria-controls naming the absent content while closed, and restores the same id on open', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, defaultCollapsed: true } });

    expect(trigger(wrapper).attributes('aria-controls')).toBe('vf-group-box-content-v-1');
    expect(wrapper.find('#vf-group-box-content-v-1').exists()).toBe(false);

    await trigger(wrapper).trigger('click');
    expect(content(wrapper).attributes('id')).toBe('vf-group-box-content-v-1');
  });

  it('gives the static content an id nothing references, and still allocates the trigger id first', () => {
    const wrapper = mountGroupBox({ props: { title: 'T' } });

    expect(content(wrapper).attributes('id')).toBe('vf-group-box-content-v-1');
    expect(content(wrapper).attributes('aria-labelledby')).toBeUndefined();
    expect(wrapper.find('[aria-controls]').exists()).toBe(false);
  });

  it('allocates independent pairs for two instances, in document order', () => {
    const Pair = defineComponent({
      components: { VfGroupBox },
      template:
        '<div><VfGroupBox title="A" collapsible>A</VfGroupBox><VfGroupBox title="B" collapsible>B</VfGroupBox></div>',
    });
    const wrapper = mount(Pair);
    const buttons = wrapper.findAll('button');
    const contents = wrapper.findAll('.vf-group-box__content');

    expect(buttons.map((button) => button.attributes('id'))).toEqual([
      'vf-group-box-trigger-v-0',
      'vf-group-box-trigger-v-2',
    ]);
    expect(contents.map((node) => node.attributes('id'))).toEqual([
      'vf-group-box-content-v-1',
      'vf-group-box-content-v-3',
    ]);
    expect(buttons[1].attributes('aria-controls')).toBe('vf-group-box-content-v-3');
    expect(contents[1].attributes('aria-labelledby')).toBe('vf-group-box-trigger-v-2');
  });

  it('leaves a consumer id on the fieldset and the generated ids untouched', () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true }, attrs: { id: 'shipping' } });

    expect(wrapper.attributes('id')).toBe('shipping');
    expect(trigger(wrapper).attributes('id')).toBe('vf-group-box-trigger-v-0');
    expect(trigger(wrapper).attributes('aria-controls')).toBe('vf-group-box-content-v-1');
  });
});

// ------------------------------------------------------------------ slots

describe('VfGroupBox characterization: slots', () => {
  it('passes collapsed to all three slots, false while open', () => {
    const wrapper = mountGroupBox({
      props: { collapsible: true },
      slots: {
        title: '<b>T {{ params.collapsed }}</b>',
        'toggle-icon': '<i>I {{ params.collapsed }}</i>',
        default: '<p>D {{ params.collapsed }}</p>',
      },
    });

    expect(wrapper.get('b').text()).toBe('T false');
    expect(wrapper.get('i').text()).toBe('I false');
    expect(wrapper.get('p').text()).toBe('D false');
  });

  it('passes collapsed=true to the title and toggle-icon slots once closed', async () => {
    const wrapper = mountGroupBox({
      props: { collapsible: true },
      slots: {
        title: '<b>T {{ params.collapsed }}</b>',
        'toggle-icon': '<i>I {{ params.collapsed }}</i>',
        default: 'Body',
      },
    });

    await trigger(wrapper).trigger('click');
    expect(wrapper.get('b').text()).toBe('T true');
    expect(wrapper.get('i').text()).toBe('I true');
  });

  it('lets the toggle-icon slot replace the whole aria-hidden wrapper', () => {
    const wrapper = mountGroupBox({
      props: { title: 'Details', collapsible: true },
      slots: { 'toggle-icon': '<i class="custom">+</i>', default: 'Body' },
    });

    expect(wrapper.find('.vf-group-box__icon').exists()).toBe(false);
    expect(wrapper.find('[aria-hidden]').exists()).toBe(false);
    expect([...trigger(wrapper).element.children].map((child) => child.outerHTML)).toEqual([
      '<i class="custom">+</i>',
      '<span class="vf-group-box__title">Details</span>',
    ]);
  });

  it('never renders the toggle-icon slot without a trigger, and passes collapsed=false to a static title slot', () => {
    const wrapper = mountGroupBox({
      slots: { title: '<b>T {{ params.collapsed }}</b>', 'toggle-icon': '<i>I</i>', default: 'Body' },
      props: { collapsed: true },
    });

    expect(wrapper.find('i').exists()).toBe(false);
    expect(wrapper.get('b').text()).toBe('T false');
  });

  it('renders rich title markup inside the title span, inside the trigger', () => {
    const wrapper = mountGroupBox({
      props: { collapsible: true },
      slots: { title: '<strong>Invoice</strong> <em>#1024</em>', default: 'Body' },
    });

    expect(wrapper.get('button .vf-group-box__title').html()).toBe(
      '<span class="vf-group-box__title"><strong>Invoice</strong> <em>#1024</em></span>',
    );
  });

  it('renders the default slot directly inside the content div, with no inner wrapper', () => {
    const wrapper = mountGroupBox({ props: { title: 'T' }, slots: { default: '<p>A</p><p>B</p>' } });

    expect(content(wrapper).element.innerHTML).toBe('<p>A</p><p>B</p>');
  });

  it('renders an empty content div when there is no default slot', () => {
    const wrapper = mountGroupBox({ props: { title: 'T' }, slots: {} });

    expect(content(wrapper).element.innerHTML).toBe('');
  });
});

// ------------------------------------------------------------------ pointer

describe('VfGroupBox characterization: pointer toggle and events', () => {
  it('toggles on click and emits update:collapsed then collapsedChange with the new value', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });

    await trigger(wrapper).trigger('click');
    expect(content(wrapper).exists()).toBe(false);
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]]);
    expect(wrapper.emitted('collapsedChange')).toEqual([[true]]);

    await trigger(wrapper).trigger('click');
    expect(content(wrapper).exists()).toBe(true);
    expect(wrapper.emitted('update:collapsed')).toEqual([[true], [false]]);
    expect(wrapper.emitted('collapsedChange')).toEqual([[true], [false]]);
  });

  it('emits update:collapsed strictly before collapsedChange', async () => {
    const order: string[] = [];
    const wrapper = mountGroupBox({
      props: { title: 'T', collapsible: true },
      attrs: {
        'onUpdate:collapsed': (value: boolean) => order.push(`update:collapsed:${value}`),
        onCollapsedChange: (value: boolean) => order.push(`collapsedChange:${value}`),
      },
    });

    await trigger(wrapper).trigger('click');
    expect(order).toEqual(['update:collapsed:true', 'collapsedChange:true']);
  });

  it('emits nothing on mount and nothing when props change', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, collapsed: false } });
    await wrapper.setProps({ collapsed: true });
    await wrapper.setProps({ collapsible: false });

    expect(wrapper.emitted('update:collapsed')).toBeUndefined();
    expect(wrapper.emitted('collapsedChange')).toBeUndefined();
  });

  it('emits exactly the two declared events and no others of its own', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });
    await trigger(wrapper).trigger('click');

    expect(
      Object.keys(wrapper.emitted())
        .filter((name) => name !== 'click')
        .sort(),
    ).toEqual(['collapsedChange', 'update:collapsed']);
  });

  it('keeps focus on the trigger after a toggle', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true }, attachTo: host });

    (trigger(wrapper).element as HTMLButtonElement).focus();
    await trigger(wrapper).trigger('click');
    expect(document.activeElement).toBe(trigger(wrapper).element);
    wrapper.unmount();
    host.remove();
  });
});

// ------------------------------------------------------------------ keyboard

describe('VfGroupBox characterization: no keyboard handling of its own', () => {
  it.each(['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape'])(
    'a %j keydown on the trigger neither toggles, emits nor prevents the default',
    async (key) => {
      const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });
      const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true });

      trigger(wrapper).element.dispatchEvent(event);
      await nextTick();

      expect(event.defaultPrevented).toBe(false);
      expect(content(wrapper).exists()).toBe(true);
      expect(wrapper.emitted('update:collapsed')).toBeUndefined();
    },
  );

  it('keyup does nothing either: activation belongs to the browser, which turns Enter and Space into a click', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });
    const event = new KeyboardEvent('keyup', { key: ' ', cancelable: true, bubbles: true });

    trigger(wrapper).element.dispatchEvent(event);
    await nextTick();

    expect(event.defaultPrevented).toBe(false);
    expect(wrapper.emitted('update:collapsed')).toBeUndefined();
  });

  it('adds no document or window listener', () => {
    const documentAdd = vi.spyOn(document, 'addEventListener');
    const windowAdd = vi.spyOn(window, 'addEventListener');

    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });
    wrapper.unmount();

    expect(documentAdd).not.toHaveBeenCalled();
    expect(windowAdd).not.toHaveBeenCalled();
    documentAdd.mockRestore();
    windowAdd.mockRestore();
  });
});

// ------------------------------------------------------------------ controlled mode

describe('VfGroupBox characterization: controlled mode', () => {
  it('collapsed=true, click: emits false, keeps the DOM closed until the parent writes the value back', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, collapsed: true } });

    await trigger(wrapper).trigger('click');

    expect(wrapper.emitted('update:collapsed')).toEqual([[false]]);
    expect(wrapper.emitted('collapsedChange')).toEqual([[false]]);
    expect(content(wrapper).exists()).toBe(false);
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(wrapper.classes()).toContain('vf-group-box--collapsed');

    await wrapper.setProps({ collapsed: false });

    expect(content(wrapper).exists()).toBe(true);
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
    expect(wrapper.classes()).not.toContain('vf-group-box--collapsed');
  });

  it('does not deduplicate: two clicks on a controlled closed group request false twice', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, collapsed: true } });

    await trigger(wrapper).trigger('click');
    await trigger(wrapper).trigger('click');
    expect(wrapper.emitted('update:collapsed')).toEqual([[false], [false]]);
  });

  it('round-trips through v-model:collapsed', async () => {
    const Host = defineComponent({
      components: { VfGroupBox },
      setup: () => ({ collapsed: ref(false) }),
      template: '<VfGroupBox v-model:collapsed="collapsed" title="T" collapsible>Body</VfGroupBox>',
    });
    const wrapper = mount(Host);

    await wrapper.get('button').trigger('click');
    expect(wrapper.find('.vf-group-box__content').exists()).toBe(false);
    expect((wrapper.vm as unknown as { collapsed: boolean }).collapsed).toBe(true);
  });

  it('follows the controlled prop after mount in both directions', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, collapsed: false } });

    await wrapper.setProps({ collapsed: true });
    expect(content(wrapper).exists()).toBe(false);
    await wrapper.setProps({ collapsed: false });
    expect(content(wrapper).exists()).toBe(true);
  });
});

// ------------------------------------------------------------------ disabled

describe('VfGroupBox characterization: disabled', () => {
  it('writes only the native disabled attribute on the trigger: no aria-disabled, no modifier', () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, disabled: true } });

    expect(trigger(wrapper).attributes('disabled')).toBe('');
    expect(trigger(wrapper).attributes('aria-disabled')).toBeUndefined();
    expect(wrapper.classes()).toEqual(['vf-group-box', 'vf-group-box--titled', 'vf-group-box--collapsible']);
    expect(trigger(wrapper).element.className).toBe('vf-group-box__trigger vf-button vf-button--ghost');
  });

  it('never forwards disabled onto the fieldset, in any mode', () => {
    for (const props of [
      { disabled: true },
      { title: 'T', disabled: true },
      { title: 'T', collapsible: true, disabled: true },
    ]) {
      const wrapper = mountGroupBox({ props });
      expect(wrapper.attributes('disabled')).toBeUndefined();
      expect((wrapper.element as HTMLFieldSetElement).disabled).toBe(false);
    }
  });

  it('does not toggle or emit when a disabled trigger is clicked', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, disabled: true } });

    await trigger(wrapper).trigger('click');
    expect(content(wrapper).exists()).toBe(true);
    expect(wrapper.emitted('update:collapsed')).toBeUndefined();
  });

  it('keeps a closed group closed when it becomes disabled, and does not close an open one', async () => {
    const closed = mountGroupBox({ props: { title: 'T', collapsible: true, defaultCollapsed: true } });
    await closed.setProps({ disabled: true });
    expect(content(closed).exists()).toBe(false);

    const open = mountGroupBox({ props: { title: 'T', collapsible: true } });
    await open.setProps({ disabled: true });
    expect(content(open).exists()).toBe(true);
  });

  it('is unfocusable: a disabled native button refuses focus', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, disabled: true }, attachTo: host });

    (trigger(wrapper).element as HTMLButtonElement).focus();
    expect(document.activeElement).not.toBe(trigger(wrapper).element);
    wrapper.unmount();
    host.remove();
  });

  it('quirk: the string "true" leaves the trigger operable but the guard still refuses the toggle', async () => {
    // A type misuse - Vue warns - kept because it is the one place the
    // component's own guard is observable apart from the native attribute:
    // VfButton disables only for `true` or '', while `!props.disabled` treats
    // any non-empty string as disabled.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, disabled: 'true' as unknown as boolean } });

    expect(trigger(wrapper).attributes('disabled')).toBeUndefined();
    await trigger(wrapper).trigger('click');
    expect(content(wrapper).exists()).toBe(true);
    expect(wrapper.emitted('update:collapsed')).toBeUndefined();
    warn.mockRestore();
  });
});

// ------------------------------------------------------------------ consumer attributes

describe('VfGroupBox characterization: consumer attributes', () => {
  it('puts class, style, id, data-*, aria-* and native fieldset attributes on the fieldset, after the canonical classes', () => {
    const wrapper = mountGroupBox({
      props: { title: 'T', collapsible: true },
      attrs: {
        class: 'extra',
        style: 'color: red',
        id: 'gb',
        'data-testid': 'box',
        'aria-label': 'X',
        name: 'n',
        form: 'f',
      },
    });

    expect(wrapper.element.className).toBe('vf-group-box vf-group-box--titled vf-group-box--collapsible extra');
    expect(wrapper.attributes()).toMatchObject({
      style: 'color: red;',
      id: 'gb',
      'data-testid': 'box',
      'aria-label': 'X',
      name: 'n',
      form: 'f',
    });
    expect(trigger(wrapper).attributes('data-testid')).toBeUndefined();
    expect(content(wrapper).attributes('data-testid')).toBeUndefined();
  });

  it('lets a consumer aria-expanded land on the fieldset and leaves the trigger its own', () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true }, attrs: { 'aria-expanded': 'false' } });

    expect(wrapper.attributes('aria-expanded')).toBe('false');
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
  });
});

// ------------------------------------------------------------------ DOM retention

describe('VfGroupBox characterization: content lifecycle is v-if', () => {
  it('removes the content from the DOM when collapsing, in the same tick, and renders the slot afresh on expand', async () => {
    let renders = 0;
    const wrapper = mountGroupBox({
      props: { title: 'T', collapsible: true },
      slots: {
        default: () => {
          renders += 1;
          return h('input', { class: 'consumer' });
        },
      },
    });
    const first = wrapper.get('input.consumer').element as HTMLInputElement;
    first.value = 'typed';

    await trigger(wrapper).trigger('click');
    expect(wrapper.find('.vf-group-box__content').exists()).toBe(false);
    expect(wrapper.find('input.consumer').exists()).toBe(false);

    await trigger(wrapper).trigger('click');
    const second = wrapper.get('input.consumer').element as HTMLInputElement;
    expect(second).not.toBe(first);
    expect(second.value).toBe('');
    expect(renders).toBeGreaterThanOrEqual(2);
  });

  it('retains nothing hidden: no display:none, no hidden attribute, no inert copy', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });

    await trigger(wrapper).trigger('click');
    expect(wrapper.element.querySelectorAll('div').length).toBe(0);
    expect(wrapper.html()).not.toContain('Body');
  });

  it('removes a nested group box with the outer content', async () => {
    const Nested = defineComponent({
      components: { VfGroupBox },
      template:
        '<VfGroupBox title="Outer" collapsible><VfGroupBox title="Inner" collapsible>Inner body</VfGroupBox></VfGroupBox>',
    });
    const wrapper = mount(Nested);
    const [outer, inner] = wrapper.findAll('button');

    await inner.trigger('click');
    expect(wrapper.findAll('.vf-group-box__content')).toHaveLength(1);
    await outer.trigger('click');
    expect(wrapper.findAll('fieldset')).toHaveLength(1);
    expect(wrapper.findAll('button')).toHaveLength(1);
  });
});

// ------------------------------------------------------------------ dynamic props

describe('VfGroupBox characterization: dynamic collapsible and title', () => {
  it('keeps the internal state across collapsible false -> true', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, defaultCollapsed: true } });

    await wrapper.setProps({ collapsible: false });
    expect(content(wrapper).exists()).toBe(true);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(content(wrapper).attributes('role')).toBeUndefined();

    await wrapper.setProps({ collapsible: true });
    expect(content(wrapper).exists()).toBe(false);
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
  });

  it('keeps a click-collapsed state across collapsible false -> true', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true } });

    await trigger(wrapper).trigger('click');
    await wrapper.setProps({ collapsible: false });
    await wrapper.setProps({ collapsible: true });
    expect(content(wrapper).exists()).toBe(false);
  });

  it('starts open when collapsible arrives after mount without a seed', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T' } });

    await wrapper.setProps({ collapsible: true });
    expect(content(wrapper).exists()).toBe(true);
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
  });

  it('drops back to the static untitled group when the title goes away while collapsed', async () => {
    const wrapper = mountGroupBox({ props: { title: 'T', collapsible: true, defaultCollapsed: true } });

    await wrapper.setProps({ title: undefined });
    expect(wrapper.classes()).toEqual(['vf-group-box']);
    expect(content(wrapper).exists()).toBe(true);
  });
});

// ------------------------------------------------------------------ server rendering

describe('VfGroupBox characterization: server rendering', () => {
  it('renders the same element structure on the server as on mount, open', async () => {
    const html = await ssrGroupBox({ title: 'Details', collapsible: true }, { default: () => 'Body' });

    expect(html).toBe(
      '<fieldset class="vf-group-box vf-group-box--titled vf-group-box--collapsible">' +
        '<legend class="vf-group-box__legend">' +
        '<button id="vf-group-box-trigger-v-0" aria-controls="vf-group-box-content-v-1" aria-expanded="true" class="vf-group-box__trigger vf-button vf-button--ghost" type="button">' +
        '<!--v-if--><!--[--><!--[-->' +
        ICON_MARKUP +
        '<!--]--><span class="vf-group-box__title"><!--[-->Details<!--]--></span><!--]--></button></legend>' +
        '<div id="vf-group-box-content-v-1" aria-labelledby="vf-group-box-trigger-v-0" class="vf-group-box__content" role="region"><!--[-->Body<!--]--></div>' +
        '</fieldset>',
    );
  });

  it('renders the closed state on the server with no content and a dangling aria-controls', async () => {
    const html = await ssrGroupBox({ title: 'Details', collapsible: true, collapsed: true }, { default: () => 'Body' });

    expect(html).toContain('aria-controls="vf-group-box-content-v-1" aria-expanded="false"');
    expect(html).not.toContain('Body');
    expect(html.endsWith('</legend><!--v-if--></fieldset>')).toBe(true);
  });

  it('renders the static untitled group on the server with its content id', async () => {
    const html = await ssrGroupBox({}, { default: () => 'Body' });

    expect(html).toBe(
      '<fieldset class="vf-group-box"><!--v-if--><div id="vf-group-box-content-v-1" class="vf-group-box__content"><!--[-->Body<!--]--></div></fieldset>',
    );
  });
});
