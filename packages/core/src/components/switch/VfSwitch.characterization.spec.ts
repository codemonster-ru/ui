// Characterization of the historical VfSwitch at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// Deliberately not derived from the VfCheckbox suite even though the underlying
// element is the same. Three things differ, and a port that assumed otherwise
// would get all three wrong: this component adds role="switch" and does *not*
// add aria-checked, it has two props VfCheckbox has no equivalent for, and it
// decides whether it has content by walking the slot's VNodes rather than
// asking whether a slot was passed.
import { mount } from '@vue/test-utils';
import { Comment, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfSwitch from './VfSwitch.vue';

type SwitchProps = InstanceType<typeof VfSwitch>['$props'];

function mountSwitch({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<SwitchProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfSwitch, { attachTo: document.body, props: props as SwitchProps, attrs, slots: slots as never });
}

describe('VfSwitch characterization: structure and role', () => {
  it('renders a label as its root', () => {
    expect(mountSwitch().element.tagName).toBe('LABEL');
  });

  it('is a native checkbox that calls itself a switch', () => {
    const input = mountSwitch().get('input');

    expect(input.attributes('type')).toBe('checkbox');
    expect(input.attributes('role')).toBe('switch');
    expect(input.classes()).toEqual(['vf-switch__input']);
  });

  it('carries no aria-checked, unlike VfCheckbox', () => {
    // The switch relies on the element's own checked state; the checkbox
    // duplicates it into an attribute. Both are preserved as they are.
    expect(mountSwitch().get('input').attributes('aria-checked')).toBeUndefined();
    expect(
      mountSwitch({ props: { modelValue: true } })
        .get('input')
        .attributes('aria-checked'),
    ).toBeUndefined();
  });

  it('renders an aria-hidden control holding a thumb', () => {
    const control = mountSwitch().get('.vf-switch__control');

    expect(control.attributes('aria-hidden')).toBe('true');
    expect(control.find('.vf-switch__thumb').exists()).toBe(true);
  });

  it('exposes the checked state to the thumb slot', () => {
    const wrapper = mountSwitch({
      props: { modelValue: true },
      slots: { thumb: (scope: { checked: boolean }) => h('i', { class: 'thumb-probe' }, String(scope.checked)) },
    });

    expect(wrapper.get('.thumb-probe').text()).toBe('true');
  });
});

describe('VfSwitch characterization: content detection', () => {
  it('renders no content element without a label or slot', () => {
    expect(mountSwitch().find('.vf-switch__content').exists()).toBe(false);
  });

  it('renders the label prop as content', () => {
    expect(
      mountSwitch({ props: { label: 'Notify me' } })
        .get('.vf-switch__content')
        .text(),
    ).toBe('Notify me');
  });

  it('treats a whitespace-only slot as no content at all', () => {
    // The VNode walk is what makes this different from VfCheckbox, which only
    // asks whether a slot exists.
    expect(
      mountSwitch({ slots: { default: () => '   ' } })
        .find('.vf-switch__content')
        .exists(),
    ).toBe(false);
  });

  it('treats a comment-only slot as no content', () => {
    expect(
      mountSwitch({ slots: { default: () => h(Comment) } })
        .find('.vf-switch__content')
        .exists(),
    ).toBe(false);
  });

  it('treats a real element slot as content', () => {
    expect(
      mountSwitch({ slots: { default: () => h('span', 'On') } })
        .find('.vf-switch__content')
        .exists(),
    ).toBe(true);
  });
});

describe('VfSwitch characterization: classes', () => {
  it('always emits a size modifier, including at the default size', () => {
    expect(mountSwitch().classes()).toEqual(['vf-switch', 'vf-switch--md']);
  });

  it('emits the static modifier only when asked', () => {
    expect(mountSwitch({ props: { static: true } }).classes()).toContain('vf-switch--static');
    expect(mountSwitch().classes()).not.toContain('vf-switch--static');
  });

  it('emits a thumb contrast modifier only when it is not auto', () => {
    expect(
      mountSwitch()
        .classes()
        .some((name) => name.includes('thumb-contrast')),
    ).toBe(false);
    expect(mountSwitch({ props: { thumbContrast: 'inverse' } }).classes()).toContain(
      'vf-switch--thumb-contrast-inverse',
    );
  });

  it('emits state modifiers in a fixed order', () => {
    const classes = mountSwitch({
      props: {
        size: 'sm',
        static: true,
        thumbContrast: 'inverse',
        modelValue: true,
        invalid: true,
        disabled: true,
      },
    }).classes();

    expect(classes).toEqual([
      'vf-switch',
      'vf-switch--sm',
      'vf-switch--static',
      'vf-switch--thumb-contrast-inverse',
      'vf-switch--checked',
      'vf-switch--invalid',
      'vf-switch--disabled',
    ]);
  });

  it('puts a consumer class and style on the root label', () => {
    const wrapper = mountSwitch({ attrs: { class: 'consumer-switch', style: 'margin: 4px' } });

    expect(wrapper.classes()).toContain('consumer-switch');
    expect(wrapper.attributes('style')).toBe('margin: 4px;');
  });
});

describe('VfSwitch characterization: checked, aria and events', () => {
  it('reflects the model onto the native checked state', () => {
    expect((mountSwitch({ props: { modelValue: true } }).get('input').element as HTMLInputElement).checked).toBe(true);
  });

  it('exposes aria-invalid only when invalid, and disables from its own prop', () => {
    expect(
      mountSwitch({ props: { invalid: true } })
        .get('input')
        .attributes('aria-invalid'),
    ).toBe('true');
    expect(mountSwitch().get('input').attributes('aria-invalid')).toBeUndefined();
    expect(
      mountSwitch({ props: { disabled: true } })
        .get('input')
        .attributes('disabled'),
    ).toBeDefined();
  });

  it('forwards everything except class and style onto the input', () => {
    const input = mountSwitch({ attrs: { id: 'notify', name: 'notify', 'data-testid': 'notify' } }).get('input');

    expect(input.attributes('id')).toBe('notify');
    expect(input.attributes('name')).toBe('notify');
    expect(input.attributes('data-testid')).toBe('notify');
  });

  it('lets a consumer override an attribute the component does not declare', () => {
    expect(
      mountSwitch({ props: { invalid: true }, attrs: { 'aria-invalid': 'false' } })
        .get('input')
        .attributes('aria-invalid'),
    ).toBe('false');
  });

  it('emits both update:modelValue and change with the new boolean', async () => {
    const wrapper = mountSwitch();
    const input = wrapper.get('input');
    (input.element as HTMLInputElement).checked = true;
    await input.trigger('change');

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
    expect(wrapper.emitted('change')).toEqual([[true]]);
  });

  it('emits on being switched off, unlike VfRadio', () => {
    // A switch owns its own boolean, so both directions are its own news.
    const wrapper = mountSwitch({ props: { modelValue: true } });
    const input = wrapper.get('input');
    (input.element as HTMLInputElement).checked = false;

    return input.trigger('change').then(() => {
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    });
  });
});
