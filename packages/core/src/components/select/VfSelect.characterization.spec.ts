// Characterization of the historical VfSelect at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// A custom listbox, not a native <select>: a <button> trigger the component
// owns, a hidden input it renders only for a string `name`, and a
// `role=listbox` panel of <button role=option> it creates on open, teleports
// out of its own root, positions with floater.js, animates, and destroys on
// close. Measured, not assumed from what a select usually does:
//
//   - the displayed value is derived from `modelValue` alone. Selecting emits
//     update:modelValue and nothing else; a parent that does not write the
//     value back keeps the old label, the old hidden value and the old
//     aria-selected. Clearing emits '' - never null or undefined;
//   - the trigger opens on ArrowDown, ArrowUp, Enter and Space, prevented, and
//     moves focus to the selected option or, without one, to the first enabled
//     option - after a nextTick and an animation frame. Home, End, Escape and
//     Tab on a closed trigger do nothing and are not prevented. A click opens
//     without moving focus;
//   - inside the menu the arrows wrap over the enabled options only (a disabled
//     option is not an item at all), Home and End go to the ends, Enter and
//     Space select the focused option and put focus back on the trigger,
//     Escape closes and puts focus back on the trigger, and Tab is not handled
//     - the menu stays open. There is no typeahead and no aria-activedescendant:
//     focus is real DOM focus on the option buttons;
//   - a pointer selection does not restore focus, an outside click does not
//     restore focus, and the outside event is a document `click` - a
//     pointerdown alone closes nothing;
//   - the clear button prevents its mousedown, stops its click, emits '' and
//     puts focus on the trigger;
//   - Escape is both a local keydown handler on the menu and an entry on the
//     shared LIFO escape stack. From an option the local handler prevents the
//     event first and the stack ignores it; from anywhere else the stack
//     closes the select;
//   - the hidden input carries `name`, `value` and `disabled`; `required` and
//     every other attribute outside aria-*, data-*, title and tabindex are
//     dropped; nothing listens to a form reset;
//   - inside a VfField the select declares floating support and reports
//     filled as `value || open`;
//   - floater.js is called with offset(2), flip over the two placements of the
//     requested side, shift(), strategy 'fixed'; the menu takes the trigger's
//     offsetWidth as min-width and a top placement adds
//     `vf-dropdown__menu--top`. Opening scrolls the target option into view
//     with an 8px padding, keyboard or not;
//   - the transition is `vf-floating-transition`, appear, with an explicit
//     duration of the theme's normal motion (320 ms) both ways.
//
// Real-browser facts jsdom cannot show - Chrome's native button activation,
// geometry, focus falling to <body> after a pointer selection removes the
// option - are measured by the three-way parity catalog
// (contracts/select/cases.json) and recorded in the M32 appendix.
import { mount, flushPromises } from '@vue/test-utils';
import { renderToString, type SSRContext } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, nextTick, ref, type Component } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import VfSelect from './VfSelect.vue';
import VfField from '@/components/field/VfField.vue';
import VfPopover from '@/components/popover/VfPopover.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';

type FloaterModule = typeof import('@codemonster-ru/floater.js');
type ComputeArguments = Parameters<FloaterModule['computePosition']>;

// A transparent recorder around the real floater.js, as in the dropdown suite.
const floating = vi.hoisted(() => ({
  fake: null as null | ((...args: ComputeArguments) => unknown),
  calls: [] as { reference: Element; floating: HTMLElement; options: Record<string, unknown> }[],
  autoUpdates: [] as { reference: Element; argumentCount: number }[],
  cleanups: 0,
}));

vi.mock('@codemonster-ru/floater.js', async (importOriginal) => {
  const real = await importOriginal<FloaterModule>();

  return {
    ...real,
    computePosition: (...args: ComputeArguments) => {
      const [reference, floatingElement, options] = args;
      floating.calls.push({
        reference: reference as Element,
        floating: floatingElement,
        options: options as Record<string, unknown>,
      });
      return floating.fake ? Promise.resolve(floating.fake(...args)) : real.computePosition(...args);
    },
    autoUpdate: (...args: Parameters<FloaterModule['autoUpdate']>) => {
      floating.autoUpdates.push({ reference: args[0] as Element, argumentCount: args.length });
      const cleanup = real.autoUpdate(...args);
      return () => {
        floating.cleanups += 1;
        cleanup();
      };
    },
  };
});

// Instant enter and leave: the menu is rendered and removed in the same tick.
const InstantTransition = defineComponent({
  inheritAttrs: false,
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.(),
});

const OPTIONS = [
  { value: 'starter', label: 'Starter' },
  { value: 'legacy', label: 'Legacy', disabled: true },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
];

interface MountOptions {
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  realTransition?: boolean;
}

function mountSelect({ props = {}, attrs = {}, slots = {}, realTransition = false }: MountOptions = {}) {
  return mount(VfSelect, {
    props: { options: OPTIONS, ...props } as never,
    attrs,
    slots: slots as never,
    attachTo: document.body.appendChild(document.createElement('div')),
    global: { stubs: { transition: realTransition ? false : InstantTransition } },
  });
}

/** A select whose parent writes every emitted value back, as `v-model` does. */
function mountModel(initial = '', props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const model = ref(initial);
  const Host = defineComponent({
    setup: () => () =>
      h(VfSelect, {
        options: OPTIONS,
        ...props,
        ...attrs,
        modelValue: model.value,
        'onUpdate:modelValue': (value: string) => {
          model.value = value;
        },
      }),
  });
  const wrapper = mount(Host, {
    attachTo: document.body.appendChild(document.createElement('div')),
    global: { stubs: { transition: InstantTransition } },
  });
  return { wrapper, model };
}

type Wrapper = { element: Element; get: (selector: string) => { element: Element } };

const triggerOf = (wrapper: Wrapper) => wrapper.get('button.vf-select').element as HTMLButtonElement;
const listboxOf = (wrapper: Wrapper) => document.getElementById(triggerOf(wrapper).getAttribute('aria-controls') ?? '');
const optionsOf = (wrapper: Wrapper) => [
  ...(listboxOf(wrapper)?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []),
];
const hiddenOf = (wrapper: Wrapper) =>
  (wrapper.element as HTMLElement).querySelector<HTMLInputElement>('input[type="hidden"]');
const labelOf = (element: Element | null | undefined) => (element?.textContent ?? '').trim();
const valueOf = (wrapper: Wrapper) => labelOf(wrapper.get('.vf-select__value').element);
const last = <T>(list: readonly T[]) => list[list.length - 1];
const emittedValues = (wrapper: ReturnType<typeof mountSelect>) =>
  ((wrapper.emitted('update:modelValue') ?? []) as string[][]).map((call) => call[0]);

function key(target: Element | Document, name: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

function click(target: Element) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function pointer(target: Element, type: string) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/** Everything the trigger does after its handler: nextTick, a frame, and the focus. */
async function settle() {
  await flushPromises();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await flushPromises();
}

async function openByClick(wrapper: Wrapper) {
  click(triggerOf(wrapper));
  await settle();
}

async function openByKey(wrapper: Wrapper, name = 'ArrowDown') {
  triggerOf(wrapper).focus();
  const event = key(triggerOf(wrapper), name);
  await settle();
  return event;
}

beforeEach(() => {
  document.body.innerHTML = '';
  floating.fake = null;
  floating.calls.length = 0;
  floating.autoUpdates.length = 0;
  floating.cleanups = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

// ------------------------------------------------------------ closed structure

describe('VfSelect characterization: closed structure', () => {
  it('renders a wrapper holding only the trigger while closed, with no name', () => {
    const wrapper = mountSelect();
    const root = wrapper.element as HTMLElement;

    expect(root.tagName).toBe('DIV');
    expect(root.className).toBe('vf-select-wrap');
    expect(root.hasAttribute('style')).toBe(false);
    expect([...root.children].map((child) => `${child.tagName}.${child.className}`)).toEqual(['BUTTON.vf-select']);
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('writes exactly the historical trigger attributes', () => {
    const trigger = triggerOf(mountSelect());

    expect([...trigger.attributes].map((attribute) => attribute.name).sort()).toEqual([
      'aria-controls',
      'aria-expanded',
      'aria-haspopup',
      'class',
      'id',
      'type',
    ]);
    expect(trigger.getAttribute('type')).toBe('button');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
    expect(trigger.hasAttribute('role')).toBe(false);
  });

  it('points aria-controls at the future listbox id while closed: the reference is dangling', () => {
    const trigger = triggerOf(mountSelect());
    const controls = trigger.getAttribute('aria-controls') ?? '';

    expect(controls).toMatch(/^vf-select-listbox-v-\d+$/);
    expect(document.getElementById(controls)).toBeNull();
  });

  it('generates the trigger id before the listbox id', () => {
    const trigger = triggerOf(mountSelect());
    const listboxSuffix = Number(last((trigger.getAttribute('aria-controls') ?? '').split('-')));
    const triggerSuffix = Number(last(trigger.id.split('-')));

    expect(trigger.id).toMatch(/^vf-select-trigger-v-\d+$/);
    expect(listboxSuffix).toBe(triggerSuffix + 1);
  });

  it('renders the value span and a chevron icon inside the trigger, and nothing else', () => {
    const trigger = triggerOf(mountSelect());

    expect([...trigger.children].map((child) => child.className)).toEqual([
      'vf-select__value',
      'vf-select__icon vf-select__icon--chevron',
    ]);
    expect(trigger.querySelector('.vf-select__icon--chevron')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the historical markup on the server: hidden input, trigger and teleport placeholders', async () => {
    const context: SSRContext = {};
    const html = await renderToString(
      createSSRApp({
        render: () => h(VfSelect, { options: OPTIONS, modelValue: 'pro', name: 'plan', placeholder: 'Pick' }),
      }),
      context,
    );

    // The server writes an empty style for the absent consumer style; a
    // mounted client writes none (pinned under attrs).
    expect(html).toMatch(
      /^<div class="vf-select-wrap" style=""><input type="hidden" name="plan" value="pro"><button id="vf-select-trigger-v-\d+" type="button" class="vf-select" data-vf-filled="true" aria-controls="vf-select-listbox-v-\d+" aria-expanded="false" aria-haspopup="listbox"><!--v-if--><span class="vf-select__value">Pro<\/span><!--v-if--><span class="vf-select__icon vf-select__icon--chevron" aria-hidden="true"><span class="vf-icon" aria-hidden="true" icon="chevronDown" size="var\(--vf-field-icon-size\)"><\/span><\/span><\/button><!--v-if--><!--teleport start--><!--teleport end--><\/div>$/,
    );
    expect(context.teleports?.body).toBe(
      '<!--teleport start anchor--><!--[--><!--v-if--><!--]--><!--teleport anchor-->',
    );
  });
});

// ----------------------------------------------------------- props and classes

describe('VfSelect characterization: props and classes', () => {
  it('writes the size modifier on both the wrapper and the trigger, and none for md', () => {
    expect(mountSelect({ props: { size: 'sm' } }).element.className).toBe('vf-select-wrap vf-select-wrap--sm');
    expect(triggerOf(mountSelect({ props: { size: 'lg' } })).className).toBe('vf-select vf-select--lg');
    expect(mountSelect({ props: { size: 'md' } }).element.className).toBe('vf-select-wrap');
  });

  it('writes the invalid modifier and aria-invalid="true" only when invalid', () => {
    const trigger = triggerOf(mountSelect({ props: { invalid: true } }));

    expect(trigger.className).toBe('vf-select vf-select--invalid');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(triggerOf(mountSelect()).hasAttribute('aria-invalid')).toBe(false);
  });

  it('shows the placeholder and the placeholder modifier when nothing is selected', () => {
    const wrapper = mountSelect({ props: { placeholder: 'Choose a plan' } });

    expect(valueOf(wrapper)).toBe('Choose a plan');
    expect(triggerOf(wrapper).className).toBe('vf-select vf-select--placeholder');
  });

  it('renders an empty value span without a placeholder', () => {
    const wrapper = mountSelect();

    expect(wrapper.get('.vf-select__value').element.innerHTML).toBe('');
    expect(triggerOf(wrapper).className).toBe('vf-select');
  });

  it('renders leading and trailing icons and their modifiers on both elements', () => {
    const wrapper = mountSelect({ props: { leadingIcon: 'search', trailingIcon: 'star' } });
    const trigger = triggerOf(wrapper);

    expect(wrapper.element.className).toBe('vf-select-wrap vf-select-wrap--with-leading vf-select-wrap--with-trailing');
    expect(trigger.className).toBe('vf-select vf-select--with-leading vf-select--with-trailing');
    expect([...trigger.children].map((child) => child.className)).toEqual([
      'vf-select__icon vf-select__icon--leading',
      'vf-select__value',
      'vf-select__icon vf-select__icon--trailing',
      'vf-select__icon vf-select__icon--chevron',
    ]);
    expect(trigger.querySelector('.vf-select__icon--leading')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the leading and trailing slots in place of the icons', () => {
    const wrapper = mountSelect({
      slots: { leading: '<b class="lead">L</b>', trailing: '<i class="trail">T</i>' },
    });
    const trigger = triggerOf(wrapper);

    expect(trigger.querySelector('.vf-select__icon--leading')?.innerHTML).toBe('<b class="lead">L</b>');
    expect(trigger.querySelector('.vf-select__icon--trailing')?.innerHTML).toBe('<i class="trail">T</i>');
    expect(trigger.className).toBe('vf-select vf-select--with-leading vf-select--with-trailing');
  });

  it('shows the clear button only when clearable, filled and enabled, and hides the chevron for it', () => {
    const clear = mountSelect({ props: { clearable: true, modelValue: 'pro' } });
    const button = clear.get('.vf-select-wrap__clear').element as HTMLButtonElement;

    expect(clear.element.className).toBe('vf-select-wrap vf-select-wrap--with-clear');
    expect(triggerOf(clear).className).toBe('vf-select vf-select--with-clear');
    expect(triggerOf(clear).querySelector('.vf-select__icon--chevron')).toBeNull();
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('aria-label')).toBe('Clear select');
    expect(button.getAttribute('type')).toBe('button');
    expect([...clear.element.children].map((child) => child.tagName)).toEqual(['BUTTON', 'BUTTON']);

    expect(
      mountSelect({ props: { clearable: true } })
        .find('.vf-select-wrap__clear')
        .exists(),
    ).toBe(false);
    expect(
      mountSelect({ props: { clearable: true, modelValue: 'pro', disabled: true } })
        .find('.vf-select-wrap__clear')
        .exists(),
    ).toBe(false);
    expect(
      mountSelect({ props: { modelValue: 'pro' } })
        .find('.vf-select-wrap__clear')
        .exists(),
    ).toBe(false);
  });

  it('writes the disabled attribute on the trigger', () => {
    expect(triggerOf(mountSelect({ props: { disabled: true } })).disabled).toBe(true);
  });

  it('declares exactly the historical props and the one emit', () => {
    const component = VfSelect as unknown as { props: Record<string, unknown>; emits: unknown };

    expect(Object.keys(component.props).sort()).toEqual(
      [
        'clearable',
        'disableTeleport',
        'disabled',
        'invalid',
        'leadingIcon',
        'modelValue',
        'options',
        'placeholder',
        'placement',
        'size',
        'teleportTo',
        'trailingIcon',
      ].sort(),
    );
    expect(component.emits).toEqual(['update:modelValue']);
  });
});

// ------------------------------------------------------------------- attrs

describe('VfSelect characterization: attrs', () => {
  it('puts class and style on the wrapper, after the component classes', () => {
    const wrapper = mountSelect({ attrs: { class: 'consumer', style: 'margin-top: 4px;' } });

    expect(wrapper.element.className).toBe('vf-select-wrap consumer');
    expect(wrapper.element.getAttribute('style')).toBe('margin-top: 4px;');
    expect(triggerOf(wrapper).className).toBe('vf-select');
    expect(triggerOf(wrapper).hasAttribute('style')).toBe(false);
  });

  it('uses a string id as the trigger id and as the listbox labelledby', async () => {
    const wrapper = mountSelect({ attrs: { id: 'plan-select' } });
    await openByClick(wrapper);

    expect(triggerOf(wrapper).id).toBe('plan-select');
    expect(wrapper.element.hasAttribute('id')).toBe(false);
    expect(listboxOf(wrapper)?.getAttribute('aria-labelledby')).toBe('plan-select');
  });

  it('forwards aria-*, data-*, title and tabindex to the trigger', () => {
    const trigger = triggerOf(
      mountSelect({
        attrs: {
          'aria-label': 'Plan',
          'aria-describedby': 'help',
          'data-testid': 'plan',
          title: 'Pick a plan',
          tabindex: '3',
        },
      }),
    );

    expect(trigger.getAttribute('aria-label')).toBe('Plan');
    expect(trigger.getAttribute('aria-describedby')).toBe('help');
    expect(trigger.getAttribute('data-testid')).toBe('plan');
    expect(trigger.getAttribute('title')).toBe('Pick a plan');
    expect(trigger.getAttribute('tabindex')).toBe('3');
  });

  it('lets forwarded attributes override the component’s own trigger attributes', () => {
    const trigger = triggerOf(
      mountSelect({ attrs: { 'aria-haspopup': 'true', 'aria-expanded': 'mixed', 'data-vf-filled': 'no' } }),
    );

    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('mixed');
    expect(trigger.getAttribute('data-vf-filled')).toBe('no');
  });

  it('drops required, autofocus, form, role and listeners: they reach no element', () => {
    const onFocus = vi.fn();
    const wrapper = mountSelect({
      attrs: { required: true, autofocus: true, form: 'f', role: 'combobox', name: 'plan', onFocus },
    });
    const everything = [wrapper.element, ...wrapper.element.querySelectorAll('*')];

    for (const name of ['required', 'autofocus', 'form', 'role']) {
      expect(everything.some((element) => element.hasAttribute(name))).toBe(false);
    }
    triggerOf(wrapper).dispatchEvent(new FocusEvent('focus'));
    expect(onFocus).not.toHaveBeenCalled();
    expect(hiddenOf(wrapper)?.required).toBe(false);
  });

  it('ignores a non-string id and a non-string name', () => {
    const wrapper = mountSelect({ attrs: { id: 7, name: 7 } });

    expect(triggerOf(wrapper).id).toMatch(/^vf-select-trigger-v-\d+$/);
    expect(hiddenOf(wrapper)).toBeNull();
  });
});

// ---------------------------------------------------------- options and display

describe('VfSelect characterization: options and display', () => {
  it('displays the label of the option whose value equals modelValue', () => {
    expect(valueOf(mountSelect({ props: { modelValue: 'team' } }))).toBe('Team');
  });

  it('displays a disabled selected option too', () => {
    const wrapper = mountSelect({ props: { modelValue: 'legacy', placeholder: 'Pick' } });

    expect(valueOf(wrapper)).toBe('Legacy');
    expect(triggerOf(wrapper).className).toBe('vf-select');
  });

  it('treats a value no option has as filled but unselected: placeholder shown, data-vf-filled written', () => {
    const wrapper = mountSelect({ props: { modelValue: 'ghost', placeholder: 'Pick', name: 'plan' } as never });

    expect(valueOf(wrapper)).toBe('Pick');
    expect(triggerOf(wrapper).className).toBe('vf-select vf-select--placeholder');
    expect(triggerOf(wrapper).getAttribute('data-vf-filled')).toBe('true');
  });

  it('selects an empty-string option without counting as filled', () => {
    const wrapper = mountSelect({
      props: { modelValue: '', options: [{ value: '', label: 'None' }, ...OPTIONS], clearable: true },
    });

    expect(valueOf(wrapper)).toBe('None');
    expect(triggerOf(wrapper).hasAttribute('data-vf-filled')).toBe(false);
    expect(wrapper.find('.vf-select-wrap__clear').exists()).toBe(false);
  });

  it('displays the first of duplicate values and marks every duplicate selected', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mountSelect({
      props: {
        modelValue: 'x',
        options: [
          { value: 'x', label: 'First' },
          { value: 'x', label: 'Second' },
        ],
      },
    });
    await openByClick(wrapper);

    expect(valueOf(wrapper)).toBe('First');
    expect(optionsOf(wrapper).map((option) => option.getAttribute('aria-selected'))).toEqual(['true', 'true']);
    warn.mockRestore();
  });

  it('renders an empty listbox for no options', async () => {
    const wrapper = mountSelect({ props: { options: [] } });
    await openByClick(wrapper);

    expect(listboxOf(wrapper)?.children.length).toBe(0);
    expect(listboxOf(wrapper)?.getAttribute('role')).toBe('listbox');
  });

  it('writes data-vf-filled="true" only for a non-empty value', () => {
    expect(triggerOf(mountSelect({ props: { modelValue: 'pro' } })).getAttribute('data-vf-filled')).toBe('true');
    expect(triggerOf(mountSelect()).hasAttribute('data-vf-filled')).toBe(false);
  });

  it('re-derives the label, the listbox and the selection when the options prop changes', async () => {
    const wrapper = mountSelect({ props: { modelValue: 'b', options: [{ value: 'a', label: 'A' }] } });
    expect(valueOf(wrapper)).toBe('');

    await wrapper.setProps({
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    } as never);
    expect(valueOf(wrapper)).toBe('B');

    await openByClick(wrapper);
    await wrapper.setProps({ options: [{ value: 'b', label: 'Bee' }] } as never);
    expect(optionsOf(wrapper).map(labelOf)).toEqual(['Bee']);
    expect(valueOf(wrapper)).toBe('Bee');
  });
});

// ------------------------------------------------------------- open structure

describe('VfSelect characterization: open structure', () => {
  it('teleports the open listbox to the end of <body>', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    const listbox = listboxOf(wrapper)!;

    expect(listbox.parentElement).toBe(document.body);
    expect(wrapper.element.contains(listbox)).toBe(false);
    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('true');
  });

  it('writes exactly the historical listbox attributes', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    const listbox = listboxOf(wrapper)!;

    expect([...listbox.attributes].map((attribute) => attribute.name).sort()).toEqual([
      'aria-labelledby',
      'class',
      'id',
      'role',
      'style',
    ]);
    expect(listbox.className).toBe('vf-dropdown__menu vf-select__menu');
    expect(listbox.getAttribute('aria-labelledby')).toBe(triggerOf(wrapper).id);
    expect(listbox.hasAttribute('aria-activedescendant')).toBe(false);
    expect(listbox.hasAttribute('tabindex')).toBe(false);
  });

  it('renders one <button role=option tabindex=-1> per option, with aria-selected and native disabled', async () => {
    const wrapper = mountSelect({ props: { modelValue: 'pro' } });
    await openByClick(wrapper);
    const options = optionsOf(wrapper);

    expect(options.map(labelOf)).toEqual(['Starter', 'Legacy', 'Pro', 'Team']);
    expect(options.map((option) => option.tagName)).toEqual(['BUTTON', 'BUTTON', 'BUTTON', 'BUTTON']);
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true', 'false']);
    expect(options.map((option) => option.disabled)).toEqual([false, true, false, false]);
    expect(options.every((option) => option.getAttribute('tabindex') === '-1')).toBe(true);
    expect(options.every((option) => option.getAttribute('type') === 'button')).toBe(true);
    expect(options[2].className).toBe('vf-dropdown__item vf-select__option vf-select__option--selected');
    expect(options[0].className).toBe('vf-dropdown__item vf-select__option');
    expect([...options[1].attributes].map((attribute) => attribute.name).sort()).toEqual([
      'aria-selected',
      'class',
      'disabled',
      'role',
      'tabindex',
      'type',
    ]);
    expect(options[1].hasAttribute('aria-disabled')).toBe(false);
  });

  it('writes the vf-select--open modifier on the trigger while open', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);

    expect(triggerOf(wrapper).classList.contains('vf-select--open')).toBe(true);
  });

  it('teleports into a selector target, renders in place for disableTeleport, false or null', async () => {
    const target = document.body.appendChild(document.createElement('div'));
    target.id = 'overlay';
    const selector = mountSelect({ props: { teleportTo: '#overlay' } });
    await openByClick(selector);
    expect(listboxOf(selector)?.parentElement).toBe(target);

    for (const props of [{ disableTeleport: true }, { teleportTo: false }, { teleportTo: null }]) {
      const inPlace = mountSelect({ props });
      await openByClick(inPlace);
      expect(listboxOf(inPlace)?.parentElement).toBe(inPlace.element);
      expect(last([...inPlace.element.children])).toBe(listboxOf(inPlace));
    }
  });

  it('teleports into an element when teleportTo is an HTMLElement', async () => {
    const target = document.body.appendChild(document.createElement('section'));
    const wrapper = mountSelect({ props: { teleportTo: target } });
    await openByClick(wrapper);

    expect(listboxOf(wrapper)?.parentElement).toBe(target);
  });

  it('creates a new listbox node on every open', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    const first = listboxOf(wrapper);
    await openByClick(wrapper);
    await openByClick(wrapper);

    expect(listboxOf(wrapper)).not.toBe(first);
    expect(listboxOf(wrapper)).not.toBeNull();
  });
});

// ------------------------------------------------------------- controlled model

describe('VfSelect characterization: controlled model', () => {
  it('emits the selected value and keeps the old label when the parent does not write it back', async () => {
    const wrapper = mountSelect({ props: { modelValue: 'starter', name: 'plan' } as never });
    await openByClick(wrapper);
    click(optionsOf(wrapper)[2]);
    await settle();

    expect(emittedValues(wrapper)).toEqual(['pro']);
    expect(valueOf(wrapper)).toBe('Starter');
    expect(hiddenOf(wrapper)?.value).toBe('starter');
    await openByClick(wrapper);
    expect(optionsOf(wrapper).map((option) => option.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
  });

  it('follows modelValue with write-back', async () => {
    const { wrapper, model } = mountModel('starter', {}, { name: 'plan' });
    await openByClick(wrapper as never);
    click(optionsOf(wrapper as never)[3]);
    await settle();

    expect(model.value).toBe('team');
    expect(valueOf(wrapper as never)).toBe('Team');
    expect(hiddenOf(wrapper as never)?.value).toBe('team');
  });

  it('emits the value again when the already selected option is chosen', async () => {
    const wrapper = mountSelect({ props: { modelValue: 'pro' } });
    await openByClick(wrapper);
    click(optionsOf(wrapper)[2]);
    await settle();

    expect(emittedValues(wrapper)).toEqual(['pro']);
  });

  it('emits nothing on open or close', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    await openByClick(wrapper);

    // Test utils also records the native events the root saw; only the
    // component's own emits count.
    expect(Object.keys(wrapper.emitted()).filter((name) => !['click', 'keydown', 'focusin'].includes(name))).toEqual(
      [],
    );
  });

  it('emits nothing when modelValue changes from outside', async () => {
    const wrapper = mountSelect({ props: { modelValue: 'pro' } });
    await wrapper.setProps({ modelValue: 'team' } as never);

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(valueOf(wrapper)).toBe('Team');
  });

  it('clears with an empty string, never null, and keeps the old value without write-back', async () => {
    const wrapper = mountSelect({ props: { modelValue: 'pro', clearable: true } });
    const button = wrapper.get('.vf-select-wrap__clear').element;
    click(button);
    await settle();

    expect(emittedValues(wrapper)).toEqual(['']);
    expect(valueOf(wrapper)).toBe('Pro');
  });

  it('clears with write-back: the clear button goes away and the placeholder returns', async () => {
    const { wrapper, model } = mountModel('pro', { clearable: true, placeholder: 'Pick' });
    click(wrapper.get('.vf-select-wrap__clear').element);
    await settle();

    expect(model.value).toBe('');
    expect(valueOf(wrapper as never)).toBe('Pick');
    expect(wrapper.find('.vf-select-wrap__clear').exists()).toBe(false);
  });
});

// ------------------------------------------------------------ trigger keyboard

describe('VfSelect characterization: trigger keyboard', () => {
  it.each(['ArrowDown', 'ArrowUp', 'Enter', ' '])('opens on %j, prevented', async (name) => {
    const wrapper = mountSelect();
    const event = await openByKey(wrapper, name);

    expect(event.defaultPrevented).toBe(true);
    expect(listboxOf(wrapper)).not.toBeNull();
  });

  it.each(['Home', 'End', 'Escape', 'Tab', 'a', 'PageDown'])(
    'does nothing on %j and does not prevent it',
    async (name) => {
      const wrapper = mountSelect();
      const event = await openByKey(wrapper, name);

      expect(event.defaultPrevented).toBe(false);
      expect(listboxOf(wrapper)).toBeNull();
    },
  );

  it('focuses the selected option after a keyboard open', async () => {
    const wrapper = mountSelect({ props: { modelValue: 'team' } });
    await openByKey(wrapper, 'ArrowUp');

    expect(labelOf(document.activeElement)).toBe('Team');
    expect(document.activeElement?.getAttribute('role')).toBe('option');
  });

  it('falls back to the first enabled option without a selection', async () => {
    const wrapper = mountSelect({
      props: {
        options: [{ value: 'a', label: 'A', disabled: true }, ...OPTIONS],
      },
    });
    await openByKey(wrapper);

    expect(labelOf(document.activeElement)).toBe('Starter');
  });

  it('falls back to the first enabled option when the selected one is disabled or missing', async () => {
    const disabledSelected = mountSelect({ props: { modelValue: 'legacy' } });
    await openByKey(disabledSelected);
    expect(labelOf(document.activeElement)).toBe('Starter');

    const missing = mountSelect({ props: { modelValue: 'ghost' } });
    await openByKey(missing);
    expect(labelOf(document.activeElement)).toBe('Starter');
  });

  it('counts the selected index among enabled options only', async () => {
    // Legacy (disabled) precedes Pro: Pro is enabled index 1, button index 2.
    const wrapper = mountSelect({ props: { modelValue: 'pro' } });
    await openByKey(wrapper);

    expect(labelOf(document.activeElement)).toBe('Pro');
  });

  it('moves focus only after a nextTick and an animation frame', async () => {
    // The test releases the frame itself. jsdom runs frames on a 16 ms timer, which on a loaded
    // machine could fire inside flushPromises() and move focus before the first assertion.
    const frames: FrameRequestCallback[] = [];
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });

    try {
      const wrapper = mountSelect({ props: { modelValue: 'pro' } });
      triggerOf(wrapper).focus();
      key(triggerOf(wrapper), 'ArrowDown');
      await flushPromises();

      expect(listboxOf(wrapper)).not.toBeNull();
      expect(document.activeElement).toBe(triggerOf(wrapper));
      expect(frames.length).toBeGreaterThan(0);

      frames.splice(0).forEach((callback) => callback(performance.now()));
      await flushPromises();
      expect(labelOf(document.activeElement)).toBe('Pro');
    } finally {
      requestFrame.mockRestore();
    }
  });

  it('leaves focus on the trigger when there is no enabled option', async () => {
    const wrapper = mountSelect({ props: { options: [{ value: 'a', label: 'A', disabled: true }] } });
    await openByKey(wrapper);

    expect(listboxOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('refocuses the target option on an opening key while already open by click', async () => {
    const wrapper = mountSelect({ props: { modelValue: 'team' } });
    await openByClick(wrapper);
    triggerOf(wrapper).focus();
    const event = key(triggerOf(wrapper), 'ArrowDown');
    await settle();

    expect(event.defaultPrevented).toBe(true);
    expect(labelOf(document.activeElement)).toBe('Team');
  });

  it('ignores every key while disabled, without preventing it', async () => {
    const wrapper = mountSelect({ props: { disabled: true } });
    for (const name of ['ArrowDown', 'Enter', ' ']) {
      expect(key(triggerOf(wrapper), name).defaultPrevented).toBe(false);
    }
    await settle();

    expect(listboxOf(wrapper)).toBeNull();
  });
});

// --------------------------------------------------------------- menu keyboard

describe('VfSelect characterization: menu keyboard', () => {
  async function openAt(modelValue = 'starter') {
    const wrapper = mountSelect({ props: { modelValue } });
    await openByKey(wrapper);
    return wrapper;
  }

  it('walks the enabled options with the arrows, skipping the disabled one, and wraps both ways', async () => {
    const wrapper = await openAt('starter');
    const walk: string[] = [];

    for (const name of ['ArrowDown', 'ArrowDown', 'ArrowDown']) {
      expect(key(document.activeElement!, name).defaultPrevented).toBe(true);
      walk.push(labelOf(document.activeElement));
    }
    for (const name of ['ArrowUp', 'ArrowUp']) {
      key(document.activeElement!, name);
      walk.push(labelOf(document.activeElement));
    }

    expect(walk).toEqual(['Pro', 'Team', 'Starter', 'Team', 'Pro']);
    expect(listboxOf(wrapper)).not.toBeNull();
  });

  it('goes to the first and last enabled options on Home and End, prevented', async () => {
    await openAt('pro');

    expect(key(document.activeElement!, 'End').defaultPrevented).toBe(true);
    expect(labelOf(document.activeElement)).toBe('Team');
    expect(key(document.activeElement!, 'Home').defaultPrevented).toBe(true);
    expect(labelOf(document.activeElement)).toBe('Starter');
  });

  it.each(['Enter', ' '])('selects the focused option on %j, prevented, and focuses the trigger', async (name) => {
    const wrapper = await openAt('starter');
    key(document.activeElement!, 'ArrowDown');
    const event = key(document.activeElement!, name);
    await settle();

    expect(event.defaultPrevented).toBe(true);
    expect(emittedValues(wrapper)).toEqual(['pro']);
    expect(listboxOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('closes on Escape from an option, prevents it and focuses the trigger', async () => {
    const wrapper = await openAt('pro');
    const event = key(document.activeElement!, 'Escape');
    await settle();

    expect(event.defaultPrevented).toBe(true);
    expect(listboxOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
    expect(emittedValues(wrapper)).toEqual([]);
  });

  it('does not handle Tab: not prevented, and the listbox stays open', async () => {
    const wrapper = await openAt('pro');
    const forward = key(document.activeElement!, 'Tab');
    const backward = key(document.activeElement!, 'Tab', { shiftKey: true });
    await settle();

    expect(forward.defaultPrevented).toBe(false);
    expect(backward.defaultPrevented).toBe(false);
    expect(listboxOf(wrapper)).not.toBeNull();
    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('true');
  });

  it('has no typeahead: a letter moves nothing and is not prevented', async () => {
    await openAt('starter');
    const event = key(document.activeElement!, 't');

    expect(event.defaultPrevented).toBe(false);
    expect(labelOf(document.activeElement)).toBe('Starter');
  });

  it('starts the walk from -1 when focus is in the listbox but on no option', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    const listbox = listboxOf(wrapper)!;

    key(listbox, 'ArrowDown');
    expect(labelOf(document.activeElement)).toBe('Starter');

    triggerOf(wrapper).focus();
    key(listbox, 'ArrowUp');
    // (-1 - 1 + 3) % 3 = 1: the second enabled option, not the last.
    expect(labelOf(document.activeElement)).toBe('Pro');
  });

  it('does not select on Enter when focus is on no option, and does not prevent it', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    const event = key(listboxOf(wrapper)!, 'Enter');

    expect(event.defaultPrevented).toBe(false);
    expect(emittedValues(wrapper)).toEqual([]);
  });

  it('never lands on a disabled option, whatever the key', async () => {
    const wrapper = mountSelect({
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', disabled: true },
          { value: 'c', label: 'C', disabled: true },
        ],
      },
    });
    await openByKey(wrapper);
    const visited = new Set<string>();

    for (const name of ['ArrowDown', 'ArrowUp', 'End', 'Home', 'ArrowDown']) {
      key(document.activeElement!, name);
      visited.add(labelOf(document.activeElement));
    }

    expect([...visited]).toEqual(['A']);
  });
});

// -------------------------------------------------------------------- pointer

describe('VfSelect characterization: pointer', () => {
  it('opens on a trigger click without moving focus', async () => {
    const outside = document.body.appendChild(document.createElement('button'));
    const wrapper = mountSelect({ props: { modelValue: 'pro' } });
    outside.focus();
    await openByClick(wrapper);

    expect(listboxOf(wrapper)).not.toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('closes on a second trigger click and focuses the trigger', async () => {
    const outside = document.body.appendChild(document.createElement('button'));
    const wrapper = mountSelect();
    await openByClick(wrapper);
    outside.focus();
    await openByClick(wrapper);

    expect(listboxOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('selects on an option click and does not restore focus to the trigger', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    const option = optionsOf(wrapper)[3];
    option.focus();
    click(option);
    await settle();

    expect(emittedValues(wrapper)).toEqual(['team']);
    expect(listboxOf(wrapper)).toBeNull();
    expect(document.activeElement).not.toBe(triggerOf(wrapper));
  });

  it('ignores a click on a disabled option: no emit, still open', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    // A disabled <button> receives no click from a real pointer; a synthetic
    // one reaches the handler, which refuses it.
    click(optionsOf(wrapper)[1]);
    await settle();

    expect(emittedValues(wrapper)).toEqual([]);
    expect(listboxOf(wrapper)).not.toBeNull();
  });

  it('closes on an outside document click without moving focus to the trigger', async () => {
    const outside = document.body.appendChild(document.createElement('button'));
    const wrapper = mountSelect();
    await openByClick(wrapper);
    outside.focus();
    click(outside);
    await settle();

    expect(listboxOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('drops focus to <body> when an outside click closes a listbox holding it', async () => {
    const outside = document.body.appendChild(document.createElement('div'));
    const wrapper = mountSelect();
    await openByKey(wrapper);
    expect(labelOf(document.activeElement)).toBe('Starter');
    click(outside);
    await settle();

    expect(listboxOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('does not close on an outside pointerdown or mousedown: the outside event is click', async () => {
    const outside = document.body.appendChild(document.createElement('div'));
    const wrapper = mountSelect();
    await openByClick(wrapper);
    pointer(outside, 'pointerdown');
    pointer(outside, 'mousedown');
    pointer(outside, 'mouseup');
    await settle();

    expect(listboxOf(wrapper)).not.toBeNull();
  });

  it('does not close on a click inside the listbox padding', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    click(listboxOf(wrapper)!);
    await settle();

    expect(listboxOf(wrapper)).not.toBeNull();
  });

  it('closes on a click on the wrapper outside the trigger: the wrapper is not inside', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    click(wrapper.element);
    await settle();

    expect(listboxOf(wrapper)).toBeNull();
  });

  it('does nothing on a click while disabled', async () => {
    const wrapper = mountSelect({ props: { disabled: true } });
    click(triggerOf(wrapper));
    await settle();

    expect(listboxOf(wrapper)).toBeNull();
  });
});

// ---------------------------------------------------------------------- clear

describe('VfSelect characterization: clear', () => {
  it('prevents the clear button’s mousedown', () => {
    const wrapper = mountSelect({ props: { modelValue: 'pro', clearable: true } });

    expect(pointer(wrapper.get('.vf-select-wrap__clear').element, 'mousedown').defaultPrevented).toBe(true);
  });

  it('prevents and stops the clear click, emits "" and focuses the trigger', async () => {
    const outside = document.body.appendChild(document.createElement('button'));
    const documentClicks = vi.fn();
    document.addEventListener('click', documentClicks);
    const wrapper = mountSelect({ props: { modelValue: 'pro', clearable: true } });
    outside.focus();
    const event = click(wrapper.get('.vf-select-wrap__clear').element);
    await settle();
    document.removeEventListener('click', documentClicks);

    expect(event.defaultPrevented).toBe(true);
    expect(documentClicks).not.toHaveBeenCalled();
    expect(emittedValues(wrapper)).toEqual(['']);
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('closes an open listbox when clearing, and the stopped click is not an outside click', async () => {
    const { wrapper } = mountModel('pro', { clearable: true });
    await openByClick(wrapper as never);
    click(wrapper.get('.vf-select-wrap__clear').element);
    await settle();

    expect(listboxOf(wrapper as never)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper as never));
  });
});

// --------------------------------------------------------------------- Escape

describe('VfSelect characterization: Escape', () => {
  it('closes on a document Escape from the trigger after a click open, prevents it, focuses the trigger', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    const event = key(document, 'Escape');
    await settle();

    expect(event.defaultPrevented).toBe(true);
    expect(listboxOf(wrapper)).toBeNull();
    expect(document.activeElement).toBe(triggerOf(wrapper));
  });

  it('lets the local handler take Escape from an option: the stack sees it prevented', async () => {
    const stack = vi.fn();
    const wrapper = mountSelect();
    await openByKey(wrapper);
    // A document listener registered after the stack's: it sees what the stack saw.
    document.addEventListener('keydown', stack);
    key(document.activeElement!, 'Escape');
    document.removeEventListener('keydown', stack);

    expect(stack).toHaveBeenCalledTimes(1);
    expect((stack.mock.calls[0][0] as KeyboardEvent).defaultPrevented).toBe(true);
  });

  it('does not prevent Escape while closed', () => {
    mountSelect();

    expect(key(document, 'Escape').defaultPrevented).toBe(false);
  });

  it('ignores an Escape something else already prevented', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    event.preventDefault();
    document.dispatchEvent(event);
    await settle();

    expect(listboxOf(wrapper)).not.toBeNull();
  });

  it('shares the LIFO stack with a popover: the select opened inside closes first, the popover second', async () => {
    const Host = defineComponent({
      setup: () => () =>
        h(
          VfPopover,
          { defaultOpen: true },
          { trigger: () => 'Filters', default: () => h(VfSelect, { options: OPTIONS }) },
        ),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    await settle();
    const trigger = document.querySelector<HTMLElement>('button.vf-select')!;
    click(trigger);
    await settle();
    const listbox = () => document.getElementById(trigger.getAttribute('aria-controls') ?? '');

    expect(listbox()).not.toBeNull();
    key(document, 'Escape');
    await settle();
    expect(listbox()).toBeNull();
    expect(document.querySelector('.vf-popover__content')).not.toBeNull();

    key(document, 'Escape');
    await settle();
    expect(document.querySelector('.vf-popover__content')).toBeNull();
  });

  it('closes the popover around it too when an option is clicked: the listbox is outside the panel', async () => {
    const Host = defineComponent({
      setup: () => () =>
        h(
          VfPopover,
          { defaultOpen: true },
          { trigger: () => 'Filters', default: () => h(VfSelect, { options: OPTIONS }) },
        ),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    await settle();
    const trigger = document.querySelector<HTMLElement>('button.vf-select')!;
    click(trigger);
    await settle();
    const option = document
      .getElementById(trigger.getAttribute('aria-controls') ?? '')!
      .querySelector('[role="option"]')!;
    click(option);
    await settle();

    expect(document.querySelector('.vf-popover__content')).toBeNull();
    expect(document.querySelector('[role="listbox"]')).toBeNull();
  });

  it('leaves no stack entry after it closes: the next Escape reaches what is below', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    await openByClick(wrapper);

    expect(key(document, 'Escape').defaultPrevented).toBe(false);
  });

  /** A popover beside the select, opened by its parent while the select is open. */
  function mountBesidePopover() {
    const popoverOpen = ref(false);
    const Host = defineComponent({
      setup: () => () =>
        h('div', [
          h(
            VfPopover,
            {
              open: popoverOpen.value,
              'onUpdate:open': (value: boolean) => {
                popoverOpen.value = value;
              },
            },
            { trigger: () => 'Filters', default: () => 'Panel' },
          ),
          h(VfSelect, { options: OPTIONS, modelValue: 'pro' }),
        ]),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    const trigger = () => document.querySelector<HTMLElement>('button.vf-select')!;
    return {
      popoverOpen,
      trigger,
      listbox: () => document.getElementById(trigger().getAttribute('aria-controls') ?? ''),
      panel: () => document.querySelector('.vf-popover__content'),
    };
  }

  it('closes itself, not the popover opened above it on the stack, on Escape from its option', async () => {
    const { popoverOpen, trigger, listbox, panel } = mountBesidePopover();
    trigger().focus();
    key(trigger(), 'ArrowDown');
    await settle();
    popoverOpen.value = true;
    await settle();
    expect(labelOf(document.activeElement)).toBe('Pro');
    expect(panel()).not.toBeNull();

    // The local handler closes the select and prevents the event, so the
    // stack - whose top is the popover - ignores it.
    key(document.activeElement!, 'Escape');
    await settle();

    expect(listbox()).toBeNull();
    expect(panel()).not.toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('lets an Escape from outside the listbox reach the top of the stack, above the select', async () => {
    const { popoverOpen, trigger, listbox, panel } = mountBesidePopover();
    click(trigger());
    await settle();
    popoverOpen.value = true;
    await settle();

    key(document, 'Escape');
    await settle();

    expect(panel()).toBeNull();
    expect(listbox()).not.toBeNull();
  });

  it('holds no stack entry while closed: a popover opened before it still takes Escape', async () => {
    const { popoverOpen, trigger, listbox, panel } = mountBesidePopover();
    popoverOpen.value = true;
    await settle();
    click(trigger());
    await settle();
    click(trigger());
    await settle();
    expect(listbox()).toBeNull();

    key(document, 'Escape');
    await settle();

    expect(panel()).toBeNull();
  });
});

// ---------------------------------------------------------------------- forms

describe('VfSelect characterization: forms', () => {
  function mountInForm(props: Record<string, unknown>, attrs: Record<string, unknown> = {}) {
    const form = document.body.appendChild(document.createElement('form'));
    const wrapper = mount(VfSelect, {
      props: { options: OPTIONS, ...props } as never,
      attrs,
      attachTo: form.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    return { form, wrapper };
  }
  const entries = (form: HTMLFormElement) => [...new FormData(form).entries()];

  it('submits nothing without a name', () => {
    const { form } = mountInForm({ modelValue: 'pro' });

    expect(entries(form)).toEqual([]);
  });

  it('submits name=value from the hidden input, first in the wrapper', () => {
    const { form, wrapper } = mountInForm({ modelValue: 'pro' }, { name: 'plan' });
    const hidden = hiddenOf(wrapper)!;

    expect(entries(form)).toEqual([['plan', 'pro']]);
    expect(wrapper.element.firstElementChild).toBe(hidden);
    expect([...hidden.attributes].map((attribute) => attribute.name).sort()).toEqual(['name', 'type', 'value']);
  });

  it('submits an empty value for an empty model, and the raw value when no option matches', () => {
    expect(entries(mountInForm({}, { name: 'plan' }).form)).toEqual([['plan', '']]);
    expect(entries(mountInForm({ modelValue: 'ghost' }, { name: 'plan' }).form)).toEqual([['plan', 'ghost']]);
  });

  it('omits a disabled select from submission through the hidden input’s disabled', () => {
    const { form, wrapper } = mountInForm({ modelValue: 'pro', disabled: true }, { name: 'plan' });

    expect(hiddenOf(wrapper)?.disabled).toBe(true);
    expect(entries(form)).toEqual([]);
  });

  it('submits the written-back value after a selection, and "" after a written-back clear', async () => {
    const form = document.body.appendChild(document.createElement('form'));
    const model = ref('starter');
    const Host = defineComponent({
      setup: () => () =>
        h(VfSelect, {
          options: OPTIONS,
          name: 'plan',
          clearable: true,
          modelValue: model.value,
          'onUpdate:modelValue': (value: string) => {
            model.value = value;
          },
        }),
    });
    const wrapper = mount(Host, {
      attachTo: form.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    await openByClick(wrapper as never);
    click(optionsOf(wrapper as never)[2]);
    await settle();
    expect(entries(form)).toEqual([['plan', 'pro']]);

    click(wrapper.get('.vf-select-wrap__clear').element);
    await settle();
    expect(entries(form)).toEqual([['plan', '']]);
  });

  it('keeps the old submitted value when a selection is not written back', async () => {
    const { form, wrapper } = mountInForm({ modelValue: 'starter' }, { name: 'plan' });
    await openByClick(wrapper);
    click(optionsOf(wrapper)[3]);
    await settle();

    expect(entries(form)).toEqual([['plan', 'starter']]);
  });

  it('forwards no native validation: required is dropped and the form stays valid', () => {
    const { form } = mountInForm({ modelValue: '' }, { name: 'plan', required: true });

    expect(form.checkValidity()).toBe(true);
    expect(form.querySelector('[required]')).toBeNull();
  });

  it('does nothing on a form reset: no emit, no label or value change', async () => {
    const { form, wrapper } = mountInForm({ modelValue: 'pro' }, { name: 'plan' });
    form.reset();
    await settle();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(valueOf(wrapper)).toBe('Pro');
    expect(entries(form)).toEqual([['plan', 'pro']]);
  });

  it('keeps a reset from restoring a written-back value: the hidden value is its own default', async () => {
    const form = document.body.appendChild(document.createElement('form'));
    const model = ref('starter');
    const Host = defineComponent({
      setup: () => () =>
        h(VfSelect, {
          options: OPTIONS,
          name: 'plan',
          modelValue: model.value,
          'onUpdate:modelValue': (value: string) => {
            model.value = value;
          },
        }),
    });
    const wrapper = mount(Host, {
      attachTo: form.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    await openByClick(wrapper as never);
    click(optionsOf(wrapper as never)[3]);
    await settle();
    form.reset();
    await settle();

    expect(entries(form)).toEqual([['plan', 'team']]);
    expect(valueOf(wrapper as never)).toBe('Team');
    expect(hiddenOf(wrapper as never)?.getAttribute('value')).toBe('team');
  });
});

// ---------------------------------------------------------------------- field

describe('VfSelect characterization: inside VfField', () => {
  function mountInField(select: Record<string, unknown>, field: Record<string, unknown> = {}) {
    const model = ref((select.modelValue as string | undefined) ?? '');
    const Host = defineComponent({
      setup: () => () =>
        h(
          VfField,
          { label: 'Plan', labelPlacement: 'floating', ...field },
          {
            default: (scope: { controlId: string; describedBy?: string; invalid: boolean }) =>
              h(VfSelect, {
                options: OPTIONS,
                ...select,
                id: scope.controlId,
                'aria-describedby': scope.describedBy,
                invalid: scope.invalid,
                modelValue: model.value,
                'onUpdate:modelValue': (value: string) => {
                  model.value = value;
                },
              }),
          },
        ),
    });
    const wrapper = mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    const control = () => wrapper.get('.vf-field__control').element as HTMLElement;
    return { wrapper, model, control, filled: () => control().classList.contains('vf-field__control--filled') };
  }

  it('declares floating support a tick after the first render: the field renders its floating label after the select', async () => {
    const { wrapper, control } = mountInField({});
    // The select reports during its own setup, after the field has rendered.
    expect(wrapper.element.className).toBe('vf-field');
    await nextTick();

    expect(wrapper.element.className).toBe('vf-field vf-field--floating vf-field--floating-in');
    expect(last([...control().children])?.className).toBe('vf-field__label vf-field__label--floating');
    expect(control().className).toBe('vf-field__control vf-field__control--floating');
  });

  it('reports filled as value || open: empty closed, empty open, filled closed, filled open', async () => {
    const empty = mountInField({});
    await nextTick();
    expect(empty.filled()).toBe(false);
    await openByClick(empty.wrapper as never);
    expect(empty.filled()).toBe(true);
    await openByClick(empty.wrapper as never);
    expect(empty.filled()).toBe(false);

    const filled = mountInField({ modelValue: 'pro' });
    await nextTick();
    expect(filled.filled()).toBe(true);
    await openByClick(filled.wrapper as never);
    expect(filled.filled()).toBe(true);
  });

  it('suppresses the placeholder under a floating label, and marks the trigger floating', () => {
    const { wrapper } = mountInField({ placeholder: 'Pick' });
    const trigger = triggerOf(wrapper as never);

    expect(valueOf(wrapper as never)).toBe('');
    expect(trigger.className).toBe('vf-select vf-select--placeholder vf-select--floating');
    expect(wrapper.get('.vf-select-wrap').element.className).toBe('vf-select-wrap vf-select-wrap--floating');
  });

  it('keeps the placeholder under a top label', () => {
    const { wrapper } = mountInField({ placeholder: 'Pick' }, { labelPlacement: 'top' });

    expect(valueOf(wrapper as never)).toBe('Pick');
    expect(triggerOf(wrapper as never).className).toBe('vf-select vf-select--placeholder');
  });

  it('returns to unfilled after a written-back clear', async () => {
    const { wrapper, filled } = mountInField({ modelValue: 'pro', clearable: true });
    click(wrapper.get('.vf-select-wrap__clear').element);
    await settle();

    expect(filled()).toBe(false);
  });

  it('wires the label, the description and the error to the trigger', () => {
    const { wrapper } = mountInField({}, { labelPlacement: 'top', description: 'Billing', error: 'Required' });
    const trigger = triggerOf(wrapper as never);
    const label = wrapper.get('label.vf-field__label').element;

    expect(label.getAttribute('for')).toBe(trigger.id);
    expect(trigger.getAttribute('aria-describedby')?.split(' ')).toEqual([
      wrapper.get('.vf-field__description').element.id,
      wrapper.get('.vf-field__error').element.id,
    ]);
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
  });

  it('opens the select from a click on the field label, which the browser forwards to the button', async () => {
    const { wrapper } = mountInField({}, { labelPlacement: 'top' });
    const trigger = triggerOf(wrapper as never);
    // jsdom forwards a label click to its labelable control, as a browser does.
    click(wrapper.get('label.vf-field__label').element);
    await settle();

    expect(document.getElementById(trigger.getAttribute('aria-controls') ?? '')).not.toBeNull();
  });

  it('clears the field’s filled and floating support when it unmounts', async () => {
    const show = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(
          VfField,
          { label: 'Plan', labelPlacement: 'floating' },
          { default: () => (show.value ? h(VfSelect, { options: OPTIONS, modelValue: 'pro' }) : h('span')) },
        ),
    });
    const wrapper = mount(Host, { attachTo: document.body.appendChild(document.createElement('div')) });
    await nextTick();
    expect(wrapper.element.className).toContain('vf-field--floating');

    show.value = false;
    await settle();
    expect(wrapper.element.className).toBe('vf-field');
    expect(wrapper.get('.vf-field__control').element.className).toBe('vf-field__control');
  });
});

// ------------------------------------------------------------------- floating

describe('VfSelect characterization: floating', () => {
  it('positions the listbox with offset(2), the start flip pair, shift and a fixed strategy', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);
    const call = last(floating.calls)!;
    const middleware = call.options.middleware as { name: string; params?: Record<string, unknown> }[];

    expect(call.reference).toBe(triggerOf(wrapper));
    expect(call.floating).toBe(listboxOf(wrapper));
    expect(call.options.placement).toBe('bottom-start');
    expect(call.options.strategy).toBe('fixed');
    expect(middleware.map((entry) => entry.name)).toEqual(['offset', 'flip', 'shift']);
    expect(middleware[0].params).toEqual({ value: 2 });
    expect(middleware[1].params).toEqual({ placements: ['bottom-start', 'top-start'] });
    expect(middleware[2].params).toBeUndefined();
  });

  it('flips between the end pair for bottom-end, and treats any other placement as the start pair', async () => {
    const end = mountSelect({ props: { placement: 'bottom-end' } });
    await openByClick(end);
    let middleware = last(floating.calls)!.options.middleware as { params?: Record<string, unknown> }[];
    expect(last(floating.calls)!.options.placement).toBe('bottom-end');
    expect(middleware[1].params).toEqual({ placements: ['bottom-end', 'top-end'] });

    const top = mountSelect({ props: { placement: 'top-end' } });
    await openByClick(top);
    middleware = last(floating.calls)!.options.middleware as { params?: Record<string, unknown> }[];
    expect(middleware[1].params).toEqual({ placements: ['bottom-start', 'top-start'] });
  });

  it('writes left, top and the trigger’s offsetWidth as min-width', async () => {
    const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(173);
    floating.fake = () => ({ x: 12.5, y: 40.25, placement: 'bottom-start', middlewareData: {} });
    const wrapper = mountSelect();
    await openByClick(wrapper);
    width.mockRestore();

    expect(listboxOf(wrapper)?.getAttribute('style')).toBe('left: 12.5px; top: 40.25px; min-width: 173px;');
  });

  it('starts at left 0 and top 0 before the first computation', async () => {
    const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80);
    const wrapper = mountSelect();
    click(triggerOf(wrapper));
    await nextTick();
    width.mockRestore();

    expect(listboxOf(wrapper)?.getAttribute('style')).toBe('left: 0px; top: 0px; min-width: 80px;');
  });

  it('adds vf-dropdown__menu--top when the computed placement is on top', async () => {
    floating.fake = () => ({ x: 0, y: 0, placement: 'top-start', middlewareData: {} });
    const wrapper = mountSelect();
    await openByClick(wrapper);

    expect(listboxOf(wrapper)?.className).toBe('vf-dropdown__menu vf-select__menu vf-dropdown__menu--top');
  });

  it('keeps the listbox positioned with autoUpdate on the trigger alone, and stops on close', async () => {
    const wrapper = mountSelect();
    await openByClick(wrapper);

    expect(floating.autoUpdates.map((entry) => entry.reference)).toEqual([triggerOf(wrapper)]);
    expect(floating.autoUpdates[0].argumentCount).toBe(2);

    await openByClick(wrapper);
    expect(floating.cleanups).toBe(1);
  });

  it('computes nothing while closed', async () => {
    mountSelect();
    await settle();

    expect(floating.calls).toEqual([]);
  });
});

// ------------------------------------------------------------- scroll into view

describe('VfSelect characterization: scroll into view', () => {
  function geometry(item: { top: number; height: number }, menu: { scrollTop: number; clientHeight: number }) {
    const spies = [
      vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockReturnValue(item.top),
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(item.height),
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(menu.clientHeight),
    ];
    return () => spies.forEach((spy) => spy.mockRestore());
  }

  it('scrolls a target below the view up to 8px under its bottom edge, on a click open too', async () => {
    const restore = geometry({ top: 300, height: 32 }, { scrollTop: 0, clientHeight: 200 });
    const wrapper = mountSelect({ props: { modelValue: 'team' } });
    await openByClick(wrapper);
    const scrollTop = listboxOf(wrapper)!.scrollTop;
    restore();

    // 300 + 32 - 200 + 8
    expect(scrollTop).toBe(140);
  });

  it('scrolls a target above the view to 8px above it, never below 0', async () => {
    const restore = geometry({ top: 4, height: 32 }, { scrollTop: 0, clientHeight: 200 });
    const wrapper = mountSelect({ props: { modelValue: 'starter' } });
    click(triggerOf(wrapper));
    await nextTick();
    listboxOf(wrapper)!.scrollTop = 50;
    await settle();
    const scrollTop = listboxOf(wrapper)!.scrollTop;
    restore();

    expect(scrollTop).toBe(0);
  });

  it('leaves the scroll alone when the target already fits with its padding', async () => {
    const restore = geometry({ top: 40, height: 32 }, { scrollTop: 0, clientHeight: 200 });
    const wrapper = mountSelect({ props: { modelValue: 'pro' } });
    await openByClick(wrapper);
    const scrollTop = listboxOf(wrapper)!.scrollTop;
    restore();

    expect(scrollTop).toBe(0);
  });
});

// ------------------------------------------------------------------ transition

describe('VfSelect characterization: transition', () => {
  const classes = (element: Element | null) => (element ? [...element.classList] : null);

  it('enters with vf-floating-transition classes for 320 ms', async () => {
    vi.useFakeTimers();
    const wrapper = mountSelect({ realTransition: true });

    click(triggerOf(wrapper));
    await nextTick();
    const listbox = listboxOf(wrapper)!;
    expect(classes(listbox)).toEqual([
      'vf-dropdown__menu',
      'vf-select__menu',
      'vf-floating-transition-enter-from',
      'vf-floating-transition-enter-active',
    ]);

    await vi.advanceTimersByTimeAsync(40);
    expect(classes(listbox)).toEqual([
      'vf-dropdown__menu',
      'vf-select__menu',
      'vf-floating-transition-enter-active',
      'vf-floating-transition-enter-to',
    ]);

    await vi.advanceTimersByTimeAsync(260);
    expect(classes(listbox)).toContain('vf-floating-transition-enter-active');

    await vi.advanceTimersByTimeAsync(70);
    expect(classes(listbox)).toEqual(['vf-dropdown__menu', 'vf-select__menu']);
  });

  it('keeps the leaving listbox in the DOM for 320 ms, with aria-expanded already false', async () => {
    vi.useFakeTimers();
    const wrapper = mountSelect({ realTransition: true });
    click(triggerOf(wrapper));
    await vi.advanceTimersByTimeAsync(400);
    const listbox = listboxOf(wrapper)!;

    click(triggerOf(wrapper));
    await nextTick();
    expect(triggerOf(wrapper).getAttribute('aria-expanded')).toBe('false');
    expect(listbox.isConnected).toBe(true);
    expect(classes(listbox)).toEqual([
      'vf-dropdown__menu',
      'vf-select__menu',
      'vf-floating-transition-leave-from',
      'vf-floating-transition-leave-active',
    ]);

    await vi.advanceTimersByTimeAsync(320);
    expect(listbox.isConnected).toBe(true);
    await vi.advanceTimersByTimeAsync(80);
    expect(listbox.isConnected).toBe(false);
  });
});

// ------------------------------------------------------------------- disposal

describe('VfSelect characterization: disposal', () => {
  it('removes the listbox, the stack entry, the outside listener and autoUpdate when unmounted open', async () => {
    const outsideClicks = vi.spyOn(document, 'removeEventListener');
    const wrapper = mountSelect();
    await openByClick(wrapper);
    expect(document.querySelector('[role="listbox"]')).not.toBeNull();

    wrapper.unmount();
    await settle();

    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(key(document, 'Escape').defaultPrevented).toBe(false);
    expect(outsideClicks.mock.calls.some(([type]) => type === 'click')).toBe(true);
    expect(floating.cleanups).toBe(1);
    outsideClicks.mockRestore();
  });

  it('unmounts an open select with the popover panel that holds it', async () => {
    const open = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(
          VfPopover,
          { open: open.value },
          { trigger: () => 'Filters', default: () => h(VfSelect, { options: OPTIONS }) },
        ),
    });
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    await settle();
    click(document.querySelector('button.vf-select')!);
    await settle();
    expect(document.querySelector('[role="listbox"]')).not.toBeNull();

    open.value = false;
    await settle();

    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(key(document, 'Escape').defaultPrevented).toBe(false);
  });
});

// --------------------------------------------------------- multiple instances

describe('VfSelect characterization: multiple instances', () => {
  function mountPair() {
    const Host = defineComponent({
      setup: () => () =>
        h('div', [
          h(VfSelect, { class: 'first', options: OPTIONS, modelValue: 'starter' }),
          h(VfSelect, { class: 'second', options: OPTIONS, modelValue: 'team' }),
        ]),
    });
    const wrapper = mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    const trigger = (name: string) => wrapper.get(`.${name} > button.vf-select`).element as HTMLElement;
    return {
      wrapper,
      trigger,
      listbox: (name: string) => document.getElementById(trigger(name).getAttribute('aria-controls') ?? ''),
    };
  }

  it('wires every instance to its own listbox, labelled by its own trigger', async () => {
    const { trigger, listbox } = mountPair();
    click(trigger('first'));
    trigger('second').focus();
    key(trigger('second'), 'ArrowDown');
    await settle();

    expect(listbox('first')).not.toBe(listbox('second'));
    expect(listbox('first')?.getAttribute('aria-labelledby')).toBe(trigger('first').id);
    expect(listbox('second')?.getAttribute('aria-labelledby')).toBe(trigger('second').id);
    expect(labelOf(listbox('second')?.querySelector('[aria-selected="true"]'))).toBe('Team');
  });

  it('closes a click-opened neighbour when another select is clicked open: an outside click', async () => {
    const { trigger, listbox } = mountPair();
    click(trigger('first'));
    await settle();
    click(trigger('second'));
    await settle();

    expect(listbox('first')).toBeNull();
    expect(listbox('second')).not.toBeNull();
  });

  it('keeps two keyboard-opened selects open at once, and Escape closes the later one first', async () => {
    const { trigger, listbox } = mountPair();
    for (const name of ['first', 'second']) {
      trigger(name).focus();
      key(trigger(name), 'ArrowDown');
      await settle();
    }
    expect(listbox('first')).not.toBeNull();

    key(document, 'Escape');
    await settle();
    expect(listbox('second')).toBeNull();
    expect(listbox('first')).not.toBeNull();
  });
});

// ------------------------------------------------------------ modal branch

describe('VfSelect characterization: focus-scope branch', () => {
  async function mountInTrap() {
    const Trap = defineComponent({
      setup(_, { slots }) {
        const container = ref<HTMLElement | null>(null);
        useFocusTrap(container, { enabled: true });
        return () => h('div', { ref: container, class: 'trap' }, slots.default?.());
      },
    });
    const Host: Component = {
      render: () =>
        h(Trap, null, () => [
          h('button', { type: 'button', class: 'first' }, 'First'),
          h(VfSelect, { options: OPTIONS }),
        ]),
    };
    mount(Host, {
      attachTo: document.body.appendChild(document.createElement('div')),
      global: { stubs: { transition: InstantTransition } },
    });
    await settle();
    const trigger = document.querySelector<HTMLElement>('button.vf-select')!;
    click(trigger);
    await settle();
    return { trigger, options: [...document.querySelectorAll<HTMLElement>('body > .vf-select__menu [role="option"]')] };
  }

  it('keeps the teleported listbox inside the trap scope: Tab from the trigger is left to the browser', async () => {
    const { trigger } = await mountInTrap();
    trigger.focus();

    expect(key(trigger, 'Tab').defaultPrevented).toBe(false);
  });

  it('wraps Tab from the last enabled option, the last element of the scope, to the first', async () => {
    const { options } = await mountInTrap();
    last(options)!.focus();

    expect(key(last(options)!, 'Tab').defaultPrevented).toBe(true);
    expect(labelOf(document.activeElement)).toBe('First');
  });
});
