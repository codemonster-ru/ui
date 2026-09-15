// Characterization of the historical VfStepper at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The second migrated component that owns interactive controls, and a
// deliberately different shape from VfAccordion: N native buttons rather than
// one, a string selection rather than a boolean, a DOM that persists while the
// selection moves rather than a panel that is created and destroyed, native
// Enter/Space activation rather than a keydown handler, Arrow/Home/End
// navigation that moves focus between the owned buttons, native disabled
// members, and no generated ids, no relationship graph, no transition and no
// slots. Each of those is pinned here on its own, so a port can be wrong in one
// and the harness can say which.
//
// Empirically established facts that are easy to "correct" and must not be:
//
//   - the state model is controlled-with-fallback on a *string*. The active
//     value is `modelValue ?? internalValue ?? fallbackValue`, where the
//     fallback is the first non-disabled item, and the internal value is seeded
//     once from `defaultValue ?? fallbackValue`. Controlled means
//     `modelValue !== undefined`: an empty string is controlled with no current
//     step; `null` is *controlled for emitting* but falls through to the
//     internal value for rendering;
//   - activating an enabled, non-current step writes the internal value only
//     when uncontrolled, then emits `update:modelValue` and then `change`,
//     once each, with the value. A current step re-clicked emits nothing; a
//     disabled step emits nothing. A controlled consumer that does not write
//     back sees the same pair emitted again on the next click;
//   - a step is `disabled` first, then `current` when its index equals the
//     active index, then `complete` when the active index is found and the
//     step is before it, then `upcoming`. An unknown active value makes every
//     enabled step upcoming and leaves no aria-current anywhere;
//   - the root style writes `--vf-stepper-item-count` always and
//     `--vf-stepper-progress-factor` only for two or more items, as the raw
//     JavaScript serialisation of `index / (count - 1)` with an unknown value
//     normalised to index 0: `0.3333333333333333`, never rounded;
//   - there is no Enter or Space handler. The trigger is a native button and
//     the browser activates it; a keydown for either key is neither prevented
//     nor acted on by the component;
//   - ArrowRight/ArrowLeft (horizontal) and ArrowDown/ArrowUp (vertical), Home
//     and End are handled on keydown with preventDefault, relative to the
//     *focused* trigger among the enabled items, wrapping, and both activate
//     and focus the target. The other axis is ignored and not prevented;
//   - focus is moved through `document.querySelector('[data-vf-stepper-value=…]')`,
//     which is document-wide: two steppers sharing a value send the second
//     stepper's keyboard focus into the first. The state stays instance-local;
//   - a deep watch on `items` reseeds the state to the fallback when the active
//     item disappears or becomes disabled, and emits the pair as a click
//     would. It is not immediate, so a disabled defaultValue survives mount;
//   - every item stays in the DOM across a selection change: state moves
//     between the existing list items, and nothing is re-created.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h, nextTick, reactive } from 'vue';
import { describe, expect, it } from 'vitest';

import VfStepper from './VfStepper.vue';
import type { VfStepperItem } from '@/types/components';

type StepperProps = InstanceType<typeof VfStepper>['$props'];

const ITEMS: VfStepperItem[] = [
  { value: 'account', label: 'Account' },
  { value: 'profile', label: 'Profile', description: 'Tell us about yourself' },
  { value: 'confirm', label: 'Confirm' },
];

function withDisabled(items: VfStepperItem[], ...values: string[]): VfStepperItem[] {
  return items.map((item) => (values.includes(item.value) ? { ...item, disabled: true } : { ...item }));
}

function mountStepper({
  props = {},
  attrs = {},
  attachTo,
}: {
  props?: Partial<StepperProps>;
  attrs?: Record<string, unknown>;
  attachTo?: Element;
} = {}) {
  return mount(VfStepper, {
    props: { items: ITEMS, ...props } as StepperProps,
    attrs,
    ...(attachTo ? { attachTo } : {}),
  });
}

type Wrapper = ReturnType<typeof mountStepper>;

const triggers = (wrapper: Wrapper) => wrapper.findAll('button.vf-stepper__trigger');
const trigger = (wrapper: Wrapper, value: string) => wrapper.get(`[data-vf-stepper-value="${value}"]`);
const items = (wrapper: Wrapper) => wrapper.findAll('li.vf-stepper__item');
/** The value of every trigger carrying aria-current, in document order. */
const currentValues = (wrapper: Wrapper) =>
  wrapper.findAll('[aria-current]').map((element) => element.attributes('data-vf-stepper-value'));
/** The state modifier of every item, in document order. */
const itemStates = (wrapper: Wrapper) =>
  items(wrapper).map((item) =>
    item
      .classes()
      .filter((name) => name.startsWith('vf-stepper__item--'))
      .map((name) => name.slice('vf-stepper__item--'.length))
      .join(','),
  );
const rootStyle = (wrapper: Wrapper) => wrapper.attributes('style');
const focusedValue = () => document.activeElement?.getAttribute('data-vf-stepper-value') ?? null;

/** A real, cancelable keydown on a trigger, returning whether the component prevented it. */
function keydown(wrapper: Wrapper, value: string, key: string): boolean {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  trigger(wrapper, value).element.dispatchEvent(event);

  return event.defaultPrevented;
}

async function ssrStepper(props: Record<string, unknown>) {
  const app = createSSRApp({ render: () => h(VfStepper, { items: ITEMS, ...props }) });

  return await renderToString(app);
}

const RAIL = (index: number) =>
  '<span class="vf-stepper__rail" aria-hidden="true">' +
  '<span class="vf-stepper__connector vf-stepper__connector--before"></span>' +
  `<span class="vf-stepper__marker">${index}</span>` +
  '<span class="vf-stepper__connector vf-stepper__connector--after"></span>' +
  '</span>';

/** The exact historical markup of the three default items with `account` current. */
const DEFAULT_LIST =
  '<ol class="vf-stepper__list">' +
  '<li class="vf-stepper__item vf-stepper__item--current">' +
  '<button type="button" class="vf-stepper__trigger vf-stepper__trigger--current" data-vf-stepper-value="account" aria-current="step">' +
  RAIL(1) +
  '<span class="vf-stepper__content"><span class="vf-stepper__label">Account</span><!--v-if--></span>' +
  '</button></li>' +
  '<li class="vf-stepper__item vf-stepper__item--upcoming">' +
  '<button type="button" class="vf-stepper__trigger" data-vf-stepper-value="profile">' +
  RAIL(2) +
  '<span class="vf-stepper__content"><span class="vf-stepper__label">Profile</span><span class="vf-stepper__description">Tell us about yourself</span></span>' +
  '</button></li>' +
  '<li class="vf-stepper__item vf-stepper__item--upcoming">' +
  '<button type="button" class="vf-stepper__trigger" data-vf-stepper-value="confirm">' +
  RAIL(3) +
  '<span class="vf-stepper__content"><span class="vf-stepper__label">Confirm</span><!--v-if--></span>' +
  '</button></li>' +
  '</ol>';

// ------------------------------------------------------------------ structure

describe('VfStepper characterization: structure', () => {
  it('renders exactly the historical default markup: nav, ol, one li and one native button per item', () => {
    const wrapper = mountStepper();

    expect(wrapper.html({ raw: true })).toBe(
      '<nav class="vf-stepper vf-stepper--horizontal vf-stepper--content-below" ' +
        'style="--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0;" aria-label="Progress">' +
        DEFAULT_LIST +
        '</nav>',
    );
  });

  it('is a nav holding one ordered list and nothing else', () => {
    const wrapper = mountStepper();

    expect(wrapper.element.tagName).toBe('NAV');
    expect([...wrapper.element.children].map((child) => child.tagName.toLowerCase())).toEqual(['ol']);
    expect(wrapper.get('ol').classes()).toEqual(['vf-stepper__list']);
  });

  it('renders one list item per item, each holding exactly one native button of type=button', () => {
    const wrapper = mountStepper();

    expect(items(wrapper)).toHaveLength(3);
    for (const item of items(wrapper)) {
      const children = [...item.element.children];
      expect(children.map((child) => child.tagName.toLowerCase())).toEqual(['button']);
      expect(children[0].getAttribute('type')).toBe('button');
      expect(children[0].classList.contains('vf-stepper__trigger')).toBe(true);
    }
    expect(wrapper.findAll('button')).toHaveLength(3);
    expect(wrapper.findAll('[role]')).toHaveLength(0);
  });

  it('numbers the marker from one and hides the rail from assistive technology', () => {
    const wrapper = mountStepper();

    expect(wrapper.findAll('.vf-stepper__marker').map((marker) => marker.text())).toEqual(['1', '2', '3']);
    for (const rail of wrapper.findAll('.vf-stepper__rail')) {
      expect(rail.attributes('aria-hidden')).toBe('true');
      expect([...rail.element.children].map((child) => child.className)).toEqual([
        'vf-stepper__connector vf-stepper__connector--before',
        'vf-stepper__marker',
        'vf-stepper__connector vf-stepper__connector--after',
      ]);
    }
  });

  it('renders the description span only for items that have one, leaving a v-if comment otherwise', () => {
    const wrapper = mountStepper();

    expect(trigger(wrapper, 'profile').find('.vf-stepper__description').text()).toBe('Tell us about yourself');
    expect(trigger(wrapper, 'account').find('.vf-stepper__description').exists()).toBe(false);
    expect(trigger(wrapper, 'account').get('.vf-stepper__content').element.innerHTML).toBe(
      '<span class="vf-stepper__label">Account</span><!--v-if-->',
    );
  });

  it('treats an empty description as absent', () => {
    const wrapper = mountStepper({ props: { items: [{ value: 'a', label: 'A', description: '' }] } });

    expect(wrapper.find('.vf-stepper__description').exists()).toBe(false);
  });

  it('writes the item value onto the trigger as data-vf-stepper-value, and nowhere else', () => {
    const wrapper = mountStepper();

    expect(triggers(wrapper).map((button) => button.attributes('data-vf-stepper-value'))).toEqual([
      'account',
      'profile',
      'confirm',
    ]);
    expect(wrapper.findAll('[data-vf-stepper-value]')).toHaveLength(3);
  });

  it('generates no ids and no relationship attributes', () => {
    const wrapper = mountStepper({ props: { defaultValue: 'profile' } });

    expect(wrapper.findAll('[id]')).toHaveLength(0);
    for (const name of ['aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-expanded', 'aria-selected']) {
      expect(wrapper.findAll(`[${name}]`), name).toHaveLength(0);
    }
  });

  it('renders an empty list for no items', () => {
    const wrapper = mountStepper({ props: { items: [] } });

    expect(wrapper.html({ raw: true })).toBe(
      '<nav class="vf-stepper vf-stepper--horizontal vf-stepper--content-below" style="--vf-stepper-item-count: 0;" aria-label="Progress">' +
        '<ol class="vf-stepper__list"></ol>' +
        '</nav>',
    );
  });
});

// ------------------------------------------------------------ props: layout

describe('VfStepper characterization: orientation and content position', () => {
  it('defaults to horizontal with content below', () => {
    expect(mountStepper().classes()).toEqual(['vf-stepper', 'vf-stepper--horizontal', 'vf-stepper--content-below']);
  });

  it.each([
    ['horizontal', undefined, 'below'],
    ['horizontal', 'below', 'below'],
    ['horizontal', 'above', 'above'],
    ['horizontal', 'start', 'below'],
    ['horizontal', 'end', 'below'],
    ['vertical', undefined, 'end'],
    ['vertical', 'end', 'end'],
    ['vertical', 'start', 'start'],
    ['vertical', 'above', 'end'],
    ['vertical', 'below', 'end'],
  ] as const)('resolves %s + contentPosition=%s to content-%s', (orientation, contentPosition, resolved) => {
    const wrapper = mountStepper({ props: { orientation, contentPosition } });

    expect(wrapper.classes()).toEqual(['vf-stepper', `vf-stepper--${orientation}`, `vf-stepper--content-${resolved}`]);
  });

  it('labels the nav "Progress" by default and takes ariaLabel as a prop', () => {
    expect(mountStepper().attributes('aria-label')).toBe('Progress');
    expect(mountStepper({ props: { ariaLabel: 'Checkout' } }).attributes('aria-label')).toBe('Checkout');
    // The kebab-case attribute is the same prop, not a forwarded attr.
    expect(mountStepper({ attrs: { 'aria-label': 'Checkout' } }).attributes('aria-label')).toBe('Checkout');
  });
});

// ------------------------------------------------------------------- attrs

describe('VfStepper characterization: consumer attributes', () => {
  it('appends a consumer class after the three canonical classes', () => {
    const wrapper = mountStepper({ attrs: { class: 'checkout-steps' } });

    expect(wrapper.attributes('class')).toBe(
      'vf-stepper vf-stepper--horizontal vf-stepper--content-below checkout-steps',
    );
  });

  it('merges a consumer style after the root custom properties', () => {
    const wrapper = mountStepper({ attrs: { style: 'color: red' } });

    expect(rootStyle(wrapper)).toBe('--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0; color: red;');
  });

  it('forwards every other attribute onto the nav and none onto the list or the triggers', () => {
    const wrapper = mountStepper({
      attrs: { id: 'checkout', role: 'group', tabindex: '0', 'data-testid': 'steps', 'aria-current': 'page' },
    });

    expect(wrapper.attributes('id')).toBe('checkout');
    expect(wrapper.attributes('role')).toBe('group');
    expect(wrapper.attributes('tabindex')).toBe('0');
    expect(wrapper.attributes('data-testid')).toBe('steps');
    // A consumer aria-current lands on the root; the triggers keep their own.
    expect(wrapper.attributes('aria-current')).toBe('page');
    expect(triggers(wrapper).map((button) => button.attributes('aria-current'))).toEqual([
      'step',
      undefined,
      undefined,
    ]);
    expect(wrapper.get('ol').attributes()).toEqual({ class: 'vf-stepper__list' });
    expect(Object.keys(trigger(wrapper, 'profile').attributes()).sort()).toEqual([
      'class',
      'data-vf-stepper-value',
      'type',
    ]);
  });

  it('writes the attributes in the historical order: class, style, aria-label, then the forwarded attrs', () => {
    const wrapper = mountStepper({ attrs: { id: 'checkout', class: 'x' } });

    expect(wrapper.html({ raw: true }).slice(0, wrapper.html({ raw: true }).indexOf('><ol'))).toBe(
      '<nav class="vf-stepper vf-stepper--horizontal vf-stepper--content-below x" ' +
        'style="--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0;" aria-label="Progress" id="checkout"',
    );
  });
});

// ------------------------------------------------------------ state model

describe('VfStepper characterization: active value resolution', () => {
  it('falls back to the first enabled item when nothing is given', () => {
    expect(currentValues(mountStepper())).toEqual(['account']);
    expect(currentValues(mountStepper({ props: { items: withDisabled(ITEMS, 'account') } }))).toEqual(['profile']);
  });

  it('seeds the uncontrolled state from defaultValue', () => {
    expect(currentValues(mountStepper({ props: { defaultValue: 'profile' } }))).toEqual(['profile']);
  });

  it('renders the controlled modelValue', () => {
    expect(currentValues(mountStepper({ props: { modelValue: 'confirm' } }))).toEqual(['confirm']);
  });

  it('prefers modelValue over defaultValue', () => {
    expect(currentValues(mountStepper({ props: { modelValue: 'confirm', defaultValue: 'profile' } }))).toEqual([
      'confirm',
    ]);
  });

  it('treats an empty-string modelValue as a controlled value that matches nothing', () => {
    const wrapper = mountStepper({ props: { modelValue: '' } });

    expect(currentValues(wrapper)).toEqual([]);
    expect(itemStates(wrapper)).toEqual(['upcoming', 'upcoming', 'upcoming']);
  });

  it('treats an unknown modelValue as no current step: every enabled step upcoming', () => {
    const wrapper = mountStepper({ props: { modelValue: 'missing' } });

    expect(currentValues(wrapper)).toEqual([]);
    expect(itemStates(wrapper)).toEqual(['upcoming', 'upcoming', 'upcoming']);
    expect(wrapper.findAll('.vf-stepper__trigger--current')).toHaveLength(0);
  });

  it('keeps an unknown defaultValue rather than falling back', () => {
    const wrapper = mountStepper({ props: { defaultValue: 'missing' } });

    expect(currentValues(wrapper)).toEqual([]);
    expect(itemStates(wrapper)).toEqual(['upcoming', 'upcoming', 'upcoming']);
  });

  it('renders a null modelValue from the internal state, as ?? does', () => {
    expect(currentValues(mountStepper({ props: { modelValue: null as unknown as string } }))).toEqual(['account']);
    expect(
      currentValues(mountStepper({ props: { modelValue: null as unknown as string, defaultValue: 'confirm' } })),
    ).toEqual(['confirm']);
  });

  it('has no current step when every item is disabled', () => {
    const wrapper = mountStepper({ props: { items: withDisabled(ITEMS, 'account', 'profile', 'confirm') } });

    expect(currentValues(wrapper)).toEqual([]);
    expect(itemStates(wrapper)).toEqual(['disabled', 'disabled', 'disabled']);
  });

  it('keeps a disabled defaultValue as the active value without announcing it', () => {
    // The watch is not immediate, so the disabled seed survives mount: the
    // active index is 1, account is complete, confirm upcoming, and nothing
    // carries aria-current.
    const wrapper = mountStepper({ props: { items: withDisabled(ITEMS, 'profile'), defaultValue: 'profile' } });

    expect(currentValues(wrapper)).toEqual([]);
    expect(itemStates(wrapper)).toEqual(['complete', 'disabled', 'upcoming']);
    expect(rootStyle(wrapper)).toBe('--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0.5;');
  });

  it('renders a single item as current with no factor', () => {
    const wrapper = mountStepper({ props: { items: [ITEMS[0]] } });

    expect(currentValues(wrapper)).toEqual(['account']);
    expect(rootStyle(wrapper)).toBe('--vf-stepper-item-count: 1;');
  });

  it('resolves duplicate values to the first occurrence', () => {
    const wrapper = mountStepper({
      props: {
        items: [
          { value: 'a', label: 'First' },
          { value: 'a', label: 'Second' },
          { value: 'b', label: 'Third' },
        ],
        defaultValue: 'b',
      },
    });

    expect(itemStates(wrapper)).toEqual(['complete', 'complete', 'current']);
    expect(rootStyle(wrapper)).toBe('--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 1;');
  });
});

// ---------------------------------------------------------------- step state

describe('VfStepper characterization: step state precedence', () => {
  it('marks steps before the active one complete, the active one current, the rest upcoming', () => {
    const wrapper = mountStepper({ props: { defaultValue: 'profile' } });

    expect(itemStates(wrapper)).toEqual(['complete', 'current', 'upcoming']);
    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(triggers(wrapper).map((button) => button.classes().includes('vf-stepper__trigger--current'))).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('puts disabled before every other state, whichever side of the active step it is on', () => {
    expect(
      itemStates(mountStepper({ props: { items: withDisabled(ITEMS, 'account'), defaultValue: 'confirm' } })),
    ).toEqual(['disabled', 'complete', 'current']);
    expect(
      itemStates(mountStepper({ props: { items: withDisabled(ITEMS, 'confirm'), defaultValue: 'account' } })),
    ).toEqual(['current', 'upcoming', 'disabled']);
    expect(
      itemStates(mountStepper({ props: { items: withDisabled(ITEMS, 'profile'), defaultValue: 'account' } })),
    ).toEqual(['current', 'disabled', 'upcoming']);
  });

  it('writes the native disabled attribute on a disabled trigger and nothing else', () => {
    const wrapper = mountStepper({ props: { items: withDisabled(ITEMS, 'profile') } });
    const disabled = trigger(wrapper, 'profile');

    expect(disabled.attributes('disabled')).toBe('');
    expect(disabled.attributes('aria-disabled')).toBeUndefined();
    expect(disabled.attributes('aria-current')).toBeUndefined();
    expect(disabled.classes()).toEqual(['vf-stepper__trigger']);
    expect(trigger(wrapper, 'account').attributes('disabled')).toBeUndefined();
  });

  it('marks the last step current with everything before it complete', () => {
    expect(itemStates(mountStepper({ props: { defaultValue: 'confirm' } }))).toEqual([
      'complete',
      'complete',
      'current',
    ]);
  });

  it('marks every step upcoming when the active value is unknown, disabled ones excepted', () => {
    expect(itemStates(mountStepper({ props: { items: withDisabled(ITEMS, 'profile'), modelValue: 'x' } }))).toEqual([
      'upcoming',
      'disabled',
      'upcoming',
    ]);
  });
});

// ---------------------------------------------------------------- root style

describe('VfStepper characterization: root style and progress factor', () => {
  const many = (count: number): VfStepperItem[] =>
    Array.from({ length: count }, (unused, index) => ({ value: `s${index}`, label: `Step ${index + 1}` }));

  it('writes only the item count for zero or one item', () => {
    expect(rootStyle(mountStepper({ props: { items: [] } }))).toBe('--vf-stepper-item-count: 0;');
    expect(rootStyle(mountStepper({ props: { items: many(1) } }))).toBe('--vf-stepper-item-count: 1;');
  });

  it.each([
    [2, 's0', '0'],
    [2, 's1', '1'],
    [3, 's0', '0'],
    [3, 's1', '0.5'],
    [3, 's2', '1'],
    [4, 's1', '0.3333333333333333'],
    [4, 's2', '0.6666666666666666'],
    [4, 's3', '1'],
    [7, 's1', '0.16666666666666666'],
    [7, 's5', '0.8333333333333334'],
  ])('writes index / (count - 1) for %i items with %s active as %s, unrounded', (count, value, factor) => {
    expect(rootStyle(mountStepper({ props: { items: many(count), modelValue: value } }))).toBe(
      `--vf-stepper-item-count: ${count}; --vf-stepper-progress-factor: ${factor};`,
    );
  });

  it('normalises an unknown active value to index zero', () => {
    expect(rootStyle(mountStepper({ props: { items: many(4), modelValue: 'missing' } }))).toBe(
      '--vf-stepper-item-count: 4; --vf-stepper-progress-factor: 0;',
    );
  });

  it('counts disabled items and computes the factor from the active index regardless of disabled', () => {
    expect(rootStyle(mountStepper({ props: { items: withDisabled(ITEMS, 'account', 'profile') } }))).toBe(
      '--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 1;',
    );
    expect(rootStyle(mountStepper({ props: { items: withDisabled(ITEMS, 'account', 'profile', 'confirm') } }))).toBe(
      '--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0;',
    );
  });

  it('writes the same factor whether the value is controlled or uncontrolled', () => {
    expect(rootStyle(mountStepper({ props: { defaultValue: 'profile' } }))).toBe(
      rootStyle(mountStepper({ props: { modelValue: 'profile' } })),
    );
  });
});

// ------------------------------------------------------------------ events

describe('VfStepper characterization: activation and events', () => {
  it('activates an enabled non-current step on click: internal state, then update:modelValue, then change', async () => {
    const wrapper = mountStepper();

    await trigger(wrapper, 'profile').trigger('click');

    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(itemStates(wrapper)).toEqual(['complete', 'current', 'upcoming']);
    expect(rootStyle(wrapper)).toBe('--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0.5;');
    expect(wrapper.emitted('update:modelValue')).toEqual([['profile']]);
    expect(wrapper.emitted('change')).toEqual([['profile']]);
  });

  it('emits update:modelValue strictly before change', async () => {
    const order: string[] = [];
    const wrapper = mount(VfStepper, {
      props: { items: ITEMS },
      attrs: {
        'onUpdate:modelValue': () => order.push('update:modelValue'),
        onChange: () => order.push('change'),
      },
    });

    await trigger(wrapper, 'confirm').trigger('click');

    expect(order).toEqual(['update:modelValue', 'change']);
  });

  it('emits nothing and changes nothing when the current step is clicked again', async () => {
    const wrapper = mountStepper({ props: { defaultValue: 'profile' } });

    await trigger(wrapper, 'profile').trigger('click');
    await trigger(wrapper, 'profile').trigger('click');

    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('emits nothing for a disabled step, even when its click handler is reached directly', async () => {
    const wrapper = mountStepper({ props: { items: withDisabled(ITEMS, 'profile') } });

    // A disabled button never delivers a click in a browser; the guard is
    // pinned by dispatching one anyway.
    trigger(wrapper, 'profile').element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(currentValues(wrapper)).toEqual(['account']);
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('moves backwards on click as readily as forwards', async () => {
    const wrapper = mountStepper({ props: { defaultValue: 'confirm' } });

    await trigger(wrapper, 'account').trigger('click');

    expect(itemStates(wrapper)).toEqual(['current', 'upcoming', 'upcoming']);
    expect(rootStyle(wrapper)).toBe('--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0;');
    expect(wrapper.emitted('change')).toEqual([['account']]);
  });

  it('in controlled mode emits the pair and changes nothing, and repeats the pair on the next click', async () => {
    const wrapper = mountStepper({ props: { modelValue: 'account' } });

    await trigger(wrapper, 'profile').trigger('click');
    await trigger(wrapper, 'profile').trigger('click');

    expect(currentValues(wrapper)).toEqual(['account']);
    expect(itemStates(wrapper)).toEqual(['current', 'upcoming', 'upcoming']);
    expect(wrapper.emitted('update:modelValue')).toEqual([['profile'], ['profile']]);
    expect(wrapper.emitted('change')).toEqual([['profile'], ['profile']]);
  });

  it('follows a controlled consumer that writes the value back', async () => {
    const live = reactive({ modelValue: 'account' });
    const wrapper = mount({
      render: () =>
        h(VfStepper, {
          items: ITEMS,
          modelValue: live.modelValue,
          'onUpdate:modelValue': (value: string) => (live.modelValue = value),
        }),
    });

    await wrapper.get('[data-vf-stepper-value="confirm"]').trigger('click');

    expect(wrapper.findAll('[aria-current]').map((element) => element.attributes('data-vf-stepper-value'))).toEqual([
      'confirm',
    ]);
    expect(live.modelValue).toBe('confirm');
  });

  it('with a null modelValue emits without writing the internal state', async () => {
    const wrapper = mountStepper({ props: { modelValue: null as unknown as string } });

    await trigger(wrapper, 'profile').trigger('click');

    expect(currentValues(wrapper)).toEqual(['account']);
    expect(wrapper.emitted('change')).toEqual([['profile']]);
  });

  it('re-renders to a new controlled value without emitting', async () => {
    const wrapper = mountStepper({ props: { modelValue: 'account' } });

    await wrapper.setProps({ modelValue: 'confirm' });

    expect(itemStates(wrapper)).toEqual(['complete', 'complete', 'current']);
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('reveals the seeded internal state when control is released', async () => {
    const wrapper = mountStepper({ props: { modelValue: 'confirm', defaultValue: 'profile' } });

    await wrapper.setProps({ modelValue: undefined });

    expect(currentValues(wrapper)).toEqual(['profile']);
  });
});

// ------------------------------------------------- keyboard: native activation

describe('VfStepper characterization: Enter and Space are native activation', () => {
  it.each(['Enter', ' '])('does not handle %j on keydown: not prevented, no state change, no emit', async (key) => {
    const wrapper = mountStepper({ attachTo: document.body });

    const prevented = keydown(wrapper, 'profile', key);
    await nextTick();

    expect(prevented).toBe(false);
    expect(currentValues(wrapper)).toEqual(['account']);
    expect(wrapper.emitted('change')).toBeUndefined();
    wrapper.unmount();
  });

  it('activates through the native click the browser synthesises for the key', async () => {
    // What a native button does on Enter/Space is a click; the component owns
    // only the click handler.
    const wrapper = mountStepper();

    await trigger(wrapper, 'profile').trigger('click');

    expect(wrapper.emitted('change')).toEqual([['profile']]);
  });
});

// ------------------------------------------------------- keyboard: navigation

describe('VfStepper characterization: Arrow, Home and End navigation', () => {
  const HORIZONTAL_NEXT = 'ArrowRight';
  const HORIZONTAL_PREVIOUS = 'ArrowLeft';
  const VERTICAL_NEXT = 'ArrowDown';
  const VERTICAL_PREVIOUS = 'ArrowUp';

  it('horizontal: ArrowRight prevents the default, activates the next enabled step and focuses it', async () => {
    const wrapper = mountStepper({ attachTo: document.body });

    const prevented = keydown(wrapper, 'account', HORIZONTAL_NEXT);
    await nextTick();

    expect(prevented).toBe(true);
    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(focusedValue()).toBe('profile');
    expect(wrapper.emitted('update:modelValue')).toEqual([['profile']]);
    expect(wrapper.emitted('change')).toEqual([['profile']]);
    wrapper.unmount();
  });

  it('horizontal: ArrowLeft goes to the previous enabled step', async () => {
    const wrapper = mountStepper({ attachTo: document.body, props: { defaultValue: 'confirm' } });

    const prevented = keydown(wrapper, 'confirm', HORIZONTAL_PREVIOUS);
    await nextTick();

    expect(prevented).toBe(true);
    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(focusedValue()).toBe('profile');
    wrapper.unmount();
  });

  it.each([VERTICAL_NEXT, VERTICAL_PREVIOUS])('horizontal: %s is ignored and not prevented', async (key) => {
    const wrapper = mountStepper({ attachTo: document.body, props: { defaultValue: 'profile' } });
    (trigger(wrapper, 'profile').element as HTMLElement).focus();

    const prevented = keydown(wrapper, 'profile', key);
    await nextTick();

    expect(prevented).toBe(false);
    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(focusedValue()).toBe('profile');
    expect(wrapper.emitted('change')).toBeUndefined();
    wrapper.unmount();
  });

  it('vertical: ArrowDown and ArrowUp navigate', async () => {
    const wrapper = mountStepper({ attachTo: document.body, props: { orientation: 'vertical' } });

    expect(keydown(wrapper, 'account', VERTICAL_NEXT)).toBe(true);
    await nextTick();
    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(focusedValue()).toBe('profile');

    expect(keydown(wrapper, 'profile', VERTICAL_PREVIOUS)).toBe(true);
    await nextTick();
    expect(currentValues(wrapper)).toEqual(['account']);
    expect(focusedValue()).toBe('account');
    wrapper.unmount();
  });

  it.each([HORIZONTAL_NEXT, HORIZONTAL_PREVIOUS])('vertical: %s is ignored and not prevented', async (key) => {
    const wrapper = mountStepper({ attachTo: document.body, props: { orientation: 'vertical' } });

    const prevented = keydown(wrapper, 'account', key);
    await nextTick();

    expect(prevented).toBe(false);
    expect(currentValues(wrapper)).toEqual(['account']);
    expect(wrapper.emitted('change')).toBeUndefined();
    wrapper.unmount();
  });

  it('wraps from the last enabled step to the first, and from the first to the last', async () => {
    const wrapper = mountStepper({ attachTo: document.body, props: { defaultValue: 'confirm' } });

    keydown(wrapper, 'confirm', HORIZONTAL_NEXT);
    await nextTick();
    expect(currentValues(wrapper)).toEqual(['account']);
    expect(focusedValue()).toBe('account');

    keydown(wrapper, 'account', HORIZONTAL_PREVIOUS);
    await nextTick();
    expect(currentValues(wrapper)).toEqual(['confirm']);
    expect(focusedValue()).toBe('confirm');
    wrapper.unmount();
  });

  it('skips a disabled step in either direction', async () => {
    const wrapper = mountStepper({ attachTo: document.body, props: { items: withDisabled(ITEMS, 'profile') } });

    keydown(wrapper, 'account', HORIZONTAL_NEXT);
    await nextTick();
    expect(currentValues(wrapper)).toEqual(['confirm']);
    expect(focusedValue()).toBe('confirm');

    keydown(wrapper, 'confirm', HORIZONTAL_PREVIOUS);
    await nextTick();
    expect(currentValues(wrapper)).toEqual(['account']);
    expect(focusedValue()).toBe('account');
    wrapper.unmount();
  });

  it('skips several disabled steps and wraps past a disabled last step', async () => {
    const wrapper = mountStepper({
      attachTo: document.body,
      props: {
        items: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', disabled: true },
          { value: 'c', label: 'C', disabled: true },
          { value: 'd', label: 'D' },
          { value: 'e', label: 'E', disabled: true },
        ],
      },
    });

    keydown(wrapper, 'a', HORIZONTAL_NEXT);
    await nextTick();
    expect(currentValues(wrapper)).toEqual(['d']);

    keydown(wrapper, 'd', HORIZONTAL_NEXT);
    await nextTick();
    expect(currentValues(wrapper)).toEqual(['a']);
    expect(focusedValue()).toBe('a');
    wrapper.unmount();
  });

  it('navigates relative to the focused trigger, not the active step', async () => {
    const wrapper = mountStepper({ attachTo: document.body });

    keydown(wrapper, 'confirm', HORIZONTAL_PREVIOUS);
    await nextTick();

    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(focusedValue()).toBe('profile');
    wrapper.unmount();
  });

  it('Home activates and focuses the first enabled step, End the last enabled step', async () => {
    const wrapper = mountStepper({
      attachTo: document.body,
      props: { items: withDisabled(ITEMS, 'account', 'confirm'), defaultValue: 'profile' },
    });

    expect(keydown(wrapper, 'profile', 'Home')).toBe(true);
    await nextTick();
    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(focusedValue()).toBe('profile');

    const wide = mountStepper({
      attachTo: document.body,
      props: {
        items: [
          { value: 'a', label: 'A', disabled: true },
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C' },
          { value: 'd', label: 'D' },
          { value: 'e', label: 'E', disabled: true },
        ],
        defaultValue: 'c',
      },
    });

    expect(keydown(wide, 'c', 'Home')).toBe(true);
    await nextTick();
    expect(currentValues(wide)).toEqual(['b']);
    expect(focusedValue()).toBe('b');

    expect(keydown(wide, 'b', 'End')).toBe(true);
    await nextTick();
    expect(currentValues(wide)).toEqual(['d']);
    expect(focusedValue()).toBe('d');
    expect(wide.emitted('change')).toEqual([['b'], ['d']]);

    wrapper.unmount();
    wide.unmount();
  });

  it('Home on the first step and End on the last step still prevent and focus, but emit nothing', async () => {
    const wrapper = mountStepper({ attachTo: document.body });
    (trigger(wrapper, 'confirm').element as HTMLElement).focus();

    expect(keydown(wrapper, 'account', 'Home')).toBe(true);
    await nextTick();
    expect(focusedValue()).toBe('account');
    expect(wrapper.emitted('change')).toBeUndefined();

    const last = mountStepper({ attachTo: document.body, props: { defaultValue: 'confirm' } });
    expect(keydown(last, 'confirm', 'End')).toBe(true);
    await nextTick();
    expect(focusedValue()).toBe('confirm');
    expect(last.emitted('change')).toBeUndefined();

    wrapper.unmount();
    last.unmount();
  });

  it('in controlled mode moves focus and emits, and leaves the rendered state to the consumer', async () => {
    const wrapper = mountStepper({ attachTo: document.body, props: { modelValue: 'account' } });

    keydown(wrapper, 'account', HORIZONTAL_NEXT);
    await nextTick();

    expect(currentValues(wrapper)).toEqual(['account']);
    expect(focusedValue()).toBe('profile');
    expect(wrapper.emitted('update:modelValue')).toEqual([['profile']]);
    expect(wrapper.emitted('change')).toEqual([['profile']]);
    wrapper.unmount();
  });

  it('ignores a keydown on a disabled trigger without preventing it', async () => {
    const wrapper = mountStepper({ attachTo: document.body, props: { items: withDisabled(ITEMS, 'profile') } });

    expect(keydown(wrapper, 'profile', HORIZONTAL_NEXT)).toBe(false);
    await nextTick();

    expect(currentValues(wrapper)).toEqual(['account']);
    expect(wrapper.emitted('change')).toBeUndefined();
    wrapper.unmount();
  });

  it.each(['Tab', 'Escape', 'PageDown', 'a'])('ignores %j and does not prevent it', async (key) => {
    const wrapper = mountStepper({ attachTo: document.body });

    expect(keydown(wrapper, 'account', key)).toBe(false);
    await nextTick();
    expect(wrapper.emitted('change')).toBeUndefined();
    wrapper.unmount();
  });
});

// -------------------------------------------------------------------- focus

describe('VfStepper characterization: focus movement', () => {
  it('moves focus with a document-wide lookup: two steppers sharing values send focus into the first', async () => {
    // The historical focusStepByValue queries the document, not the instance.
    // The second stepper's ArrowRight changes the second stepper's state and
    // focuses the *first* stepper's matching trigger. Reproduced, not fixed.
    const first = mountStepper({ attachTo: document.body });
    const second = mountStepper({ attachTo: document.body });

    keydown(second, 'account', 'ArrowRight');
    await nextTick();

    expect(currentValues(second)).toEqual(['profile']);
    expect(currentValues(first)).toEqual(['account']);
    expect(second.emitted('change')).toEqual([['profile']]);
    expect(first.emitted('change')).toBeUndefined();
    expect(first.element.contains(document.activeElement)).toBe(true);
    expect(second.element.contains(document.activeElement)).toBe(false);
    expect(focusedValue()).toBe('profile');

    first.unmount();
    second.unmount();
  });

  it('keeps focus in the right instance when the values are distinct', async () => {
    const first = mountStepper({ attachTo: document.body });
    const second = mountStepper({
      attachTo: document.body,
      props: {
        items: [
          { value: 'ship', label: 'Shipping' },
          { value: 'pay', label: 'Payment' },
        ],
      },
    });

    keydown(second, 'ship', 'ArrowRight');
    await nextTick();

    expect(currentValues(second)).toEqual(['pay']);
    expect(second.element.contains(document.activeElement)).toBe(true);
    expect(focusedValue()).toBe('pay');

    first.unmount();
    second.unmount();
  });

  it('does nothing to focus on a click', async () => {
    const wrapper = mountStepper({ attachTo: document.body });

    await trigger(wrapper, 'profile').trigger('click');

    expect(document.activeElement).toBe(document.body);
    wrapper.unmount();
  });
});

// ------------------------------------------------------------ dynamic items

describe('VfStepper characterization: the deep items watch', () => {
  it('reseeds to the fallback and emits the pair when the active item becomes disabled', async () => {
    const live = reactive({ items: ITEMS.map((item) => ({ ...item })) });
    const wrapper = mountStepper({ props: { items: live.items, defaultValue: 'profile' } });

    live.items[1].disabled = true;
    await nextTick();

    expect(currentValues(wrapper)).toEqual(['account']);
    expect(itemStates(wrapper)).toEqual(['current', 'disabled', 'upcoming']);
    expect(wrapper.emitted('update:modelValue')).toEqual([['account']]);
    expect(wrapper.emitted('change')).toEqual([['account']]);
  });

  it('reseeds and emits when the active item is removed', async () => {
    const wrapper = mountStepper({ props: { defaultValue: 'profile' } });

    await wrapper.setProps({ items: [ITEMS[0], ITEMS[2]] });

    expect(currentValues(wrapper)).toEqual(['account']);
    expect(items(wrapper)).toHaveLength(2);
    expect(wrapper.emitted('change')).toEqual([['account']]);
  });

  it('in controlled mode emits the fallback but renders no current step until the consumer writes back', async () => {
    const wrapper = mountStepper({ props: { modelValue: 'profile' } });

    await wrapper.setProps({ items: [ITEMS[0], ITEMS[2]] });

    expect(currentValues(wrapper)).toEqual([]);
    expect(wrapper.emitted('update:modelValue')).toEqual([['account']]);
    expect(wrapper.emitted('change')).toEqual([['account']]);
  });

  it('does nothing when the active item survives the change', async () => {
    const wrapper = mountStepper({ props: { defaultValue: 'profile' } });

    await wrapper.setProps({ items: [...ITEMS, { value: 'done', label: 'Done' }] });

    expect(currentValues(wrapper)).toEqual(['profile']);
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('does nothing when there is no enabled fallback to reseed to', async () => {
    const wrapper = mountStepper({ props: { defaultValue: 'profile' } });

    await wrapper.setProps({ items: withDisabled(ITEMS, 'account', 'profile', 'confirm') });

    expect(currentValues(wrapper)).toEqual([]);
    expect(itemStates(wrapper)).toEqual(['disabled', 'disabled', 'disabled']);
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('is not immediate: a disabled defaultValue is not reseeded at mount', () => {
    const wrapper = mountStepper({ props: { items: withDisabled(ITEMS, 'profile'), defaultValue: 'profile' } });

    expect(wrapper.emitted('change')).toBeUndefined();
    expect(itemStates(wrapper)).toEqual(['complete', 'disabled', 'upcoming']);
  });
});

// ------------------------------------------------------------ persistence

describe('VfStepper characterization: persistent DOM', () => {
  it('keeps every list item and trigger across a selection change; only state moves', async () => {
    const wrapper = mountStepper();
    const itemsBefore = items(wrapper).map((item) => item.element);
    const triggersBefore = triggers(wrapper).map((button) => button.element);

    await trigger(wrapper, 'confirm').trigger('click');

    expect(items(wrapper).map((item) => item.element)).toEqual(itemsBefore);
    expect(triggers(wrapper).map((button) => button.element)).toEqual(triggersBefore);
    expect(itemStates(wrapper)).toEqual(['complete', 'complete', 'current']);
    expect(currentValues(wrapper)).toEqual(['confirm']);
    expect(triggersBefore[2].classList.contains('vf-stepper__trigger--current')).toBe(true);
    expect(triggersBefore[0].classList.contains('vf-stepper__trigger--current')).toBe(false);
  });

  it('moves aria-current, the item modifier, the trigger modifier and the factor together', async () => {
    const wrapper = mountStepper({ props: { defaultValue: 'profile' } });

    await trigger(wrapper, 'account').trigger('click');

    expect(currentValues(wrapper)).toEqual(['account']);
    expect(itemStates(wrapper)).toEqual(['current', 'upcoming', 'upcoming']);
    expect(wrapper.findAll('.vf-stepper__trigger--current').map((b) => b.attributes('data-vf-stepper-value'))).toEqual([
      'account',
    ]);
    expect(rootStyle(wrapper)).toBe('--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0;');
  });

  it('renders a fresh instance of the target state identically to the one a click produced', async () => {
    const clicked = mountStepper();
    await trigger(clicked, 'profile').trigger('click');

    expect(clicked.html({ raw: true })).toBe(mountStepper({ props: { defaultValue: 'profile' } }).html({ raw: true }));
  });
});

// ---------------------------------------------------------------------- SSR

describe('VfStepper characterization: server rendering', () => {
  it('renders the default state with the fragment markers Vue writes around v-for', async () => {
    expect(await ssrStepper({})).toBe(
      '<nav class="vf-stepper vf-stepper--horizontal vf-stepper--content-below" ' +
        'style="--vf-stepper-item-count:3;--vf-stepper-progress-factor:0;" aria-label="Progress">' +
        DEFAULT_LIST.replace('<ol class="vf-stepper__list">', '<ol class="vf-stepper__list"><!--[-->').replace(
          '</ol>',
          '<!--]--></ol>',
        ) +
        '</nav>',
    );
  });

  it('renders a controlled vertical stepper with consumer attributes and a disabled member', async () => {
    const html = await ssrStepper({
      items: withDisabled(ITEMS, 'confirm'),
      modelValue: 'profile',
      orientation: 'vertical',
      contentPosition: 'start',
      class: 'checkout',
      style: 'color: red',
      id: 'steps',
      'data-testid': 'steps',
    });

    expect(
      html.startsWith(
        '<nav class="vf-stepper vf-stepper--vertical vf-stepper--content-start checkout" ' +
          'style="--vf-stepper-item-count:3;--vf-stepper-progress-factor:0.5;color:red;" aria-label="Progress" ' +
          'id="steps" data-testid="steps"><ol class="vf-stepper__list"><!--[-->',
      ),
    ).toBe(true);
    expect(html).toContain(
      '<li class="vf-stepper__item vf-stepper__item--complete"><button type="button" class="vf-stepper__trigger" data-vf-stepper-value="account">',
    );
    expect(html).toContain(
      '<li class="vf-stepper__item vf-stepper__item--current"><button type="button" class="vf-stepper__trigger vf-stepper__trigger--current" data-vf-stepper-value="profile" aria-current="step">',
    );
    expect(html).toContain(
      '<li class="vf-stepper__item vf-stepper__item--disabled"><button type="button" class="vf-stepper__trigger" data-vf-stepper-value="confirm" disabled>',
    );
  });
});
