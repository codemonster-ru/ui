// Characterization of the historical VfFieldset at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// A native fieldset that groups consumer controls under a legend, with a
// description and an error paragraph the fieldset itself points at. It is the
// second migrated component whose root is a fieldset, after VfGroupBox, and it
// differs from the group box in exactly the places a port is most likely to
// copy the group box instead of the reference:
//
//   - attributes fall through to the fieldset the ordinary Vue way
//     (inheritAttrs is not disabled), so a consumer class is appended after
//     the component's own, and a consumer `aria-describedby` *replaces* the
//     one the component computed;
//   - `disabled`, `form` and `name` are not props. They reach the fieldset as
//     native attributes, so the browser disables every nested control - the
//     group box consumes `disabled` and never forwards it;
//   - the legend holds the label as plain text, with no span and no id, and
//     the fieldset carries no aria-labelledby: the legend names the group
//     natively;
//   - the description and the error come *after* the control wrapper, and
//     their ids are what the fieldset's own aria-describedby lists.
//
// Empirically established facts that are easy to "correct" and must not be:
//
//   - presence is JavaScript truthiness for props and presence for slots:
//     "" is no label/description/error, "0" is one, and a slot counts even
//     when it renders nothing - in which case the prop is its fallback text;
//   - the invalid modifier is `invalid || hasError`. Neither the fieldset nor
//     anything inside it gets aria-invalid, and the error paragraph has no
//     role and no live region;
//   - both ids are allocated on every render in the same order (description,
//     then error), whether or not their paragraph renders;
//   - the default slot is scoped with `describedBy` (camelized from the
//     template's `described-by`) and `invalid`. The scoped describedBy is the
//     computed value even when a consumer overrode the fieldset's attribute.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';

import VfFieldset from './VfFieldset.vue';

type FieldsetProps = InstanceType<typeof VfFieldset>['$props'];
type Scope = { describedBy?: string; invalid: boolean };

function mountFieldset({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<FieldsetProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfFieldset, {
    props: props as FieldsetProps,
    attrs,
    slots: slots as never,
  });
}

async function ssrFieldset(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfFieldset, props, slots) });

  return await renderToString(app);
}

/** The ids the fieldset's aria-describedby names, resolved against the fieldset's own subtree. */
function describedTargets(wrapper: ReturnType<typeof mountFieldset>) {
  const fieldset = wrapper.get('fieldset').element;
  const ids = (fieldset.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);

  return ids.map((id) => fieldset.querySelector(`[id="${id}"]`)?.className ?? `#missing:${id}`);
}

// ------------------------------------------------------------------ API

describe('VfFieldset characterization: props and options', () => {
  it('accepts exactly four props with the historical defaults and types', () => {
    const declared = (VfFieldset as unknown as { props: Record<string, { default?: unknown; type: unknown }> }).props;

    expect(Object.keys(declared).sort()).toEqual(['description', 'error', 'invalid', 'label']);
    expect(declared.label.default).toBeUndefined();
    expect(declared.description.default).toBeUndefined();
    expect(declared.error.default).toBeUndefined();
    expect(declared.invalid.default).toBe(false);
    expect(declared.label.type).toBe(String);
    expect(declared.description.type).toBe(String);
    expect(declared.error.type).toBe(String);
    expect(declared.invalid.type).toBe(Boolean);
  });

  it('declares no emits and leaves inheritAttrs at the Vue default', () => {
    expect((VfFieldset as unknown as { emits?: unknown }).emits).toBeUndefined();
    expect((VfFieldset as unknown as { inheritAttrs?: boolean }).inheritAttrs).toBeUndefined();
  });
});

// ------------------------------------------------------------------ structure

describe('VfFieldset characterization: structure', () => {
  it('renders exactly the historical minimal markup: a bare fieldset around an empty control wrapper', () => {
    expect(mountFieldset().html({ raw: true })).toBe(
      '<fieldset class="vf-fieldset"><!--v-if--><div class="vf-fieldset__control"></div><!--v-if--><!--v-if--></fieldset>',
    );
  });

  it('renders exactly the historical full markup: legend, control, description, then error', () => {
    const wrapper = mountFieldset({
      props: { label: 'Plan', description: 'Choose one.', error: 'Required.' },
      slots: { default: 'Controls' },
    });

    expect(wrapper.html({ raw: true })).toBe(
      '<fieldset class="vf-fieldset vf-fieldset--invalid" aria-describedby="vf-fieldset-description-v-0 vf-fieldset-error-v-1">' +
        '<legend class="vf-fieldset__legend">Plan</legend>' +
        '<div class="vf-fieldset__control">Controls</div>' +
        '<p id="vf-fieldset-description-v-0" class="vf-fieldset__description">Choose one.</p>' +
        '<p id="vf-fieldset-error-v-1" class="vf-fieldset__error">Required.</p>' +
        '</fieldset>',
    );
  });

  it('places the description and the error after the control wrapper, not between legend and control', () => {
    const wrapper = mountFieldset({ props: { label: 'Plan', description: 'D', error: 'E' } });
    const order = Array.from(wrapper.get('fieldset').element.children).map((child) => child.className);

    expect(order).toEqual([
      'vf-fieldset__legend',
      'vf-fieldset__control',
      'vf-fieldset__description',
      'vf-fieldset__error',
    ]);
  });

  it('serialises the historical server markup', async () => {
    expect(await ssrFieldset({ label: 'Plan', description: 'D', error: 'E' }, { default: () => 'Controls' })).toBe(
      '<fieldset class="vf-fieldset vf-fieldset--invalid" aria-describedby="vf-fieldset-description-v-0 vf-fieldset-error-v-1">' +
        '<legend class="vf-fieldset__legend"><!--[-->Plan<!--]--></legend>' +
        '<div class="vf-fieldset__control"><!--[-->Controls<!--]--></div>' +
        '<p id="vf-fieldset-description-v-0" class="vf-fieldset__description"><!--[-->D<!--]--></p>' +
        '<p id="vf-fieldset-error-v-1" class="vf-fieldset__error"><!--[-->E<!--]--></p>' +
        '</fieldset>',
    );
  });

  it('serialises the minimal server markup without an aria-describedby attribute', async () => {
    expect(await ssrFieldset()).toBe(
      '<fieldset class="vf-fieldset"><!--v-if--><div class="vf-fieldset__control"><!--[--><!--]--></div><!--v-if--><!--v-if--></fieldset>',
    );
  });

  it('always renders the control wrapper, with or without a default slot', () => {
    expect(mountFieldset().findAll('.vf-fieldset__control')).toHaveLength(1);
    expect(mountFieldset({ slots: { default: 'x' } }).findAll('.vf-fieldset__control')).toHaveLength(1);
  });
});

// ------------------------------------------------------------------ label

describe('VfFieldset characterization: label', () => {
  it('renders the label prop as plain text in a classed legend with no id', () => {
    const legend = mountFieldset({ props: { label: 'Shipping' } }).get('legend');

    expect(legend.classes()).toEqual(['vf-fieldset__legend']);
    expect(legend.text()).toBe('Shipping');
    expect(legend.attributes('id')).toBeUndefined();
    expect(legend.element.children).toHaveLength(0);
  });

  it('never writes aria-labelledby: the legend names the fieldset natively', () => {
    const fieldset = mountFieldset({ props: { label: 'Shipping' } }).get('fieldset');

    expect(fieldset.attributes('aria-labelledby')).toBeUndefined();
    expect(fieldset.attributes('aria-label')).toBeUndefined();
  });

  it('treats an empty label as no label, so no legend renders', () => {
    expect(
      mountFieldset({ props: { label: '' } })
        .find('legend')
        .exists(),
    ).toBe(false);
  });

  it('treats the label "0" as a label, by JavaScript truthiness', () => {
    expect(
      mountFieldset({ props: { label: '0' } })
        .get('legend')
        .text(),
    ).toBe('0');
  });

  it('renders a label slot in the legend, replacing the prop', () => {
    const legend = mountFieldset({
      props: { label: 'Prop label' },
      slots: { label: '<strong>Slot</strong> label' },
    }).get('legend');

    expect(legend.html({ raw: true })).toBe('<legend class="vf-fieldset__legend"><strong>Slot</strong> label</legend>');
  });

  it('opens the legend for a label slot alone', () => {
    expect(
      mountFieldset({ slots: { label: 'Slot only' } })
        .get('legend')
        .text(),
    ).toBe('Slot only');
  });

  it('counts a label slot that renders nothing and falls back to the prop text', () => {
    const legend = mountFieldset({ props: { label: 'Fallback' }, slots: { label: () => [] } }).get('legend');

    expect(legend.text()).toBe('Fallback');
  });

  it('renders an empty legend for a label slot that renders nothing and no prop', () => {
    expect(
      mountFieldset({ slots: { label: () => [] } })
        .get('legend')
        .html({ raw: true }),
    ).toBe('<legend class="vf-fieldset__legend"></legend>');
  });

  it('escapes hostile label text', () => {
    const legend = mountFieldset({ props: { label: '<b>bold</b>' } }).get('legend');

    expect(legend.text()).toBe('<b>bold</b>');
    expect(legend.find('b').exists()).toBe(false);
  });
});

// ------------------------------------------------------------------ description

describe('VfFieldset characterization: description', () => {
  it('renders the description prop in a classed paragraph whose id the fieldset lists', () => {
    const wrapper = mountFieldset({ props: { description: 'Shown to the team.' } });
    const description = wrapper.get('p.vf-fieldset__description');

    expect(description.text()).toBe('Shown to the team.');
    expect(description.attributes('id')).toMatch(/^vf-fieldset-description-/);
    expect(wrapper.get('fieldset').attributes('aria-describedby')).toBe(description.attributes('id'));
  });

  it('treats an empty description as none: no paragraph and no aria-describedby attribute at all', () => {
    const wrapper = mountFieldset({ props: { description: '' } });

    expect(wrapper.find('.vf-fieldset__description').exists()).toBe(false);
    expect(wrapper.get('fieldset').attributes()).not.toHaveProperty('aria-describedby');
  });

  it('treats the description "0" as a description', () => {
    expect(
      mountFieldset({ props: { description: '0' } })
        .get('.vf-fieldset__description')
        .text(),
    ).toBe('0');
  });

  it('renders a description slot, replacing the prop, and lists it', () => {
    const wrapper = mountFieldset({
      props: { description: 'Prop' },
      slots: { description: 'Slot <em>text</em>' },
    });
    const description = wrapper.get('.vf-fieldset__description');

    expect(description.html({ raw: true })).toContain('Slot <em>text</em>');
    expect(description.text()).not.toContain('Prop');
    expect(describedTargets(wrapper)).toEqual(['vf-fieldset__description']);
  });

  it('counts a description slot that renders nothing and falls back to the prop text', () => {
    expect(
      mountFieldset({ props: { description: 'Fallback' }, slots: { description: () => [] } })
        .get('.vf-fieldset__description')
        .text(),
    ).toBe('Fallback');
  });

  it('counts an empty description slot with no prop: an empty listed paragraph', () => {
    const wrapper = mountFieldset({ slots: { description: () => [] } });

    expect(wrapper.get('.vf-fieldset__description').text()).toBe('');
    expect(describedTargets(wrapper)).toEqual(['vf-fieldset__description']);
  });

  it('does not make the fieldset invalid', () => {
    expect(
      mountFieldset({ props: { description: 'D' } })
        .get('fieldset')
        .classes(),
    ).toEqual(['vf-fieldset']);
  });
});

// ------------------------------------------------------------------ error

describe('VfFieldset characterization: error', () => {
  it('renders the error prop in a classed paragraph whose id the fieldset lists', () => {
    const wrapper = mountFieldset({ props: { error: 'Pick one.' } });
    const error = wrapper.get('p.vf-fieldset__error');

    expect(error.text()).toBe('Pick one.');
    expect(error.attributes('id')).toMatch(/^vf-fieldset-error-/);
    expect(wrapper.get('fieldset').attributes('aria-describedby')).toBe(error.attributes('id'));
  });

  it('gives the error paragraph no role, no live region and no atomic flag', () => {
    const error = mountFieldset({ props: { error: 'Pick one.' } }).get('.vf-fieldset__error');

    expect(Object.keys(error.attributes()).sort()).toEqual(['class', 'id']);
  });

  it('treats an empty error as none: no paragraph, no modifier, no aria-describedby', () => {
    const wrapper = mountFieldset({ props: { error: '' } });

    expect(wrapper.find('.vf-fieldset__error').exists()).toBe(false);
    expect(wrapper.get('fieldset').classes()).toEqual(['vf-fieldset']);
    expect(wrapper.get('fieldset').attributes()).not.toHaveProperty('aria-describedby');
  });

  it('treats the error "0" as an error, and so as invalid', () => {
    const wrapper = mountFieldset({ props: { error: '0' } });

    expect(wrapper.get('.vf-fieldset__error').text()).toBe('0');
    expect(wrapper.get('fieldset').classes()).toContain('vf-fieldset--invalid');
  });

  it('renders an error slot, replacing the prop, and lists it', () => {
    const wrapper = mountFieldset({ props: { error: 'Prop' }, slots: { error: '<strong>Slot</strong>' } });

    expect(wrapper.get('.vf-fieldset__error').html({ raw: true })).toBe(
      `<p id="${wrapper.get('.vf-fieldset__error').attributes('id')}" class="vf-fieldset__error"><strong>Slot</strong></p>`,
    );
    expect(describedTargets(wrapper)).toEqual(['vf-fieldset__error']);
  });

  it('makes the fieldset invalid through an error slot alone', () => {
    expect(
      mountFieldset({ slots: { error: 'Slot error' } })
        .get('fieldset')
        .classes(),
    ).toContain('vf-fieldset--invalid');
  });

  it('counts an error slot that renders nothing: the prop is its fallback, and the fieldset is invalid', () => {
    const fallback = mountFieldset({ props: { error: 'Fallback' }, slots: { error: () => [] } });
    const empty = mountFieldset({ slots: { error: () => [] } });

    expect(fallback.get('.vf-fieldset__error').text()).toBe('Fallback');
    expect(empty.get('.vf-fieldset__error').text()).toBe('');
    expect(empty.get('fieldset').classes()).toContain('vf-fieldset--invalid');
  });
});

// ------------------------------------------------------------------ invalid

describe('VfFieldset characterization: invalid state', () => {
  it('is not invalid by default', () => {
    expect(mountFieldset().get('fieldset').classes()).toEqual(['vf-fieldset']);
  });

  it('adds only the modifier class for invalid=true: no error paragraph, no reference, no aria-invalid', () => {
    const wrapper = mountFieldset({ props: { invalid: true } });
    const fieldset = wrapper.get('fieldset');

    expect(fieldset.classes()).toEqual(['vf-fieldset', 'vf-fieldset--invalid']);
    expect(wrapper.find('.vf-fieldset__error').exists()).toBe(false);
    expect(fieldset.attributes()).not.toHaveProperty('aria-describedby');
    expect(fieldset.attributes()).not.toHaveProperty('aria-invalid');
  });

  it('is invalid through an error even when invalid is explicitly false', () => {
    expect(
      mountFieldset({ props: { invalid: false, error: 'E' } })
        .get('fieldset')
        .classes(),
    ).toEqual(['vf-fieldset', 'vf-fieldset--invalid']);
  });

  it('never writes aria-invalid anywhere in its own markup', () => {
    const wrapper = mountFieldset({ props: { invalid: true, error: 'E', label: 'L', description: 'D' } });

    expect(wrapper.findAll('[aria-invalid]')).toHaveLength(0);
    expect(wrapper.get('fieldset').attributes()).not.toHaveProperty('aria-invalid');
  });

  it('follows the props reactively', async () => {
    const wrapper = mountFieldset({ props: { invalid: false } });

    await wrapper.setProps({ invalid: true });
    expect(wrapper.get('fieldset').classes()).toContain('vf-fieldset--invalid');

    await wrapper.setProps({ invalid: false, error: 'Now wrong' });
    expect(wrapper.get('fieldset').classes()).toContain('vf-fieldset--invalid');
    expect(describedTargets(wrapper)).toEqual(['vf-fieldset__error']);

    await wrapper.setProps({ error: undefined });
    expect(wrapper.get('fieldset').classes()).toEqual(['vf-fieldset']);
    expect(wrapper.get('fieldset').attributes()).not.toHaveProperty('aria-describedby');
  });
});

// ------------------------------------------------------------------ relationships

describe('VfFieldset characterization: generated ids and aria-describedby', () => {
  it('lists the description before the error, space separated', () => {
    const wrapper = mountFieldset({ props: { description: 'D', error: 'E' } });

    expect(describedTargets(wrapper)).toEqual(['vf-fieldset__description', 'vf-fieldset__error']);
  });

  it('names only elements inside its own fieldset', () => {
    const wrapper = mountFieldset({ props: { description: 'D', error: 'E' } });

    expect(describedTargets(wrapper).some((target) => target.startsWith('#missing'))).toBe(false);
  });

  it('allocates both ids on every render, in the same order, whether or not their paragraph renders', () => {
    const errorOnly = mountFieldset({ props: { error: 'E' } });
    const descriptionOnly = mountFieldset({ props: { description: 'D' } });

    expect(errorOnly.get('.vf-fieldset__error').attributes('id')).toBe('vf-fieldset-error-v-1');
    expect(descriptionOnly.get('.vf-fieldset__description').attributes('id')).toBe('vf-fieldset-description-v-0');
  });

  it('never writes an id on the fieldset, the legend or the control wrapper', () => {
    const wrapper = mountFieldset({ props: { label: 'L', description: 'D', error: 'E' } });

    expect(wrapper.get('fieldset').attributes('id')).toBeUndefined();
    expect(wrapper.get('legend').attributes('id')).toBeUndefined();
    expect(wrapper.get('.vf-fieldset__control').attributes('id')).toBeUndefined();
  });

  it('keeps two instances apart: distinct ids, each fieldset naming only its own paragraphs', () => {
    const Pair = defineComponent({
      render: () =>
        h('div', [
          h(VfFieldset, { label: 'One', description: 'D1', error: 'E1' }),
          h(VfFieldset, { label: 'Two', description: 'D2', error: 'E2' }),
        ]),
    });
    const wrapper = mount(Pair);
    const [first, second] = wrapper.findAll('fieldset').map((node) => node.element);
    const ids = (fieldset: Element) => (fieldset.getAttribute('aria-describedby') ?? '').split(' ');

    expect(new Set([...ids(first), ...ids(second)]).size).toBe(4);
    for (const fieldset of [first, second]) {
      for (const id of ids(fieldset)) expect(fieldset.querySelector(`[id="${id}"]`)).not.toBeNull();
    }
    expect(first.querySelector('.vf-fieldset__description')?.textContent).toBe('D1');
    expect(second.querySelector('.vf-fieldset__error')?.textContent).toBe('E2');
  });
});

// ------------------------------------------------------------------ attributes

describe('VfFieldset characterization: consumer and native attributes', () => {
  it('appends a consumer class after the modifier and forwards style, id and data attributes to the fieldset', () => {
    const fieldset = mountFieldset({
      props: { invalid: true },
      attrs: { class: 'consumer', style: 'max-width: 30rem', id: 'billing', 'data-testid': 'fs' },
    }).get('fieldset');

    expect(fieldset.attributes('class')).toBe('vf-fieldset vf-fieldset--invalid consumer');
    expect(fieldset.attributes('style')).toBe('max-width: 30rem;');
    expect(fieldset.attributes('id')).toBe('billing');
    expect(fieldset.attributes('data-testid')).toBe('fs');
  });

  it('appends a consumer class directly after the base class when there is no modifier', () => {
    expect(
      mountFieldset({ attrs: { class: 'consumer' } })
        .get('fieldset')
        .attributes('class'),
    ).toBe('vf-fieldset consumer');
  });

  it('forwards nothing to the legend, the control wrapper or the paragraphs', () => {
    const wrapper = mountFieldset({
      props: { label: 'L', description: 'D', error: 'E' },
      attrs: { class: 'consumer', 'data-testid': 'fs', title: 'Hint' },
    });

    for (const selector of ['legend', '.vf-fieldset__control', '.vf-fieldset__description', '.vf-fieldset__error']) {
      const attributes = wrapper.get(selector).attributes();
      expect(attributes['data-testid']).toBeUndefined();
      expect(attributes.title).toBeUndefined();
      expect(attributes.class).not.toContain('consumer');
    }
  });

  it('lets a consumer aria-describedby replace the computed one', () => {
    const wrapper = mountFieldset({
      props: { description: 'D', error: 'E' },
      attrs: { 'aria-describedby': 'outside' },
    });

    expect(wrapper.get('fieldset').attributes('aria-describedby')).toBe('outside');
  });

  it('forwards a consumer aria-describedby when the component computed none', () => {
    expect(
      mountFieldset({ attrs: { 'aria-describedby': 'outside' } })
        .get('fieldset')
        .attributes('aria-describedby'),
    ).toBe('outside');
  });

  it('forwards a consumer aria-invalid and role unchanged, writing neither itself', () => {
    const fieldset = mountFieldset({ attrs: { 'aria-invalid': 'true', role: 'radiogroup' } }).get('fieldset');

    expect(fieldset.attributes('aria-invalid')).toBe('true');
    expect(fieldset.attributes('role')).toBe('radiogroup');
  });

  it('keeps disabled, form and name native attributes of the fieldset', () => {
    const fieldset = mountFieldset({ attrs: { disabled: true, form: 'checkout', name: 'shipping' } }).get('fieldset');
    const element = fieldset.element as HTMLFieldSetElement;

    expect(fieldset.attributes('disabled')).toBe('');
    expect(fieldset.attributes('form')).toBe('checkout');
    expect(fieldset.attributes('name')).toBe('shipping');
    expect(element.disabled).toBe(true);
    expect(element.name).toBe('shipping');
  });

  it('disables every nested control natively through a disabled fieldset', () => {
    const wrapper = mountFieldset({
      attrs: { disabled: true },
      slots: { default: '<input class="nested" /><button class="nested-button" type="button">Go</button>' },
    });

    expect((wrapper.get('input.nested').element as HTMLInputElement).matches(':disabled')).toBe(true);
    expect((wrapper.get('button.nested-button').element as HTMLButtonElement).matches(':disabled')).toBe(true);
  });

  it('leaves nested controls enabled without the attribute', () => {
    const wrapper = mountFieldset({ slots: { default: '<input class="nested" />' } });

    expect((wrapper.get('input.nested').element as HTMLInputElement).matches(':disabled')).toBe(false);
    expect(wrapper.get('fieldset').attributes()).not.toHaveProperty('disabled');
  });

  it('forwards a consumer listener to the fieldset', async () => {
    const clicks: string[] = [];
    const wrapper = mountFieldset({ attrs: { onClick: () => clicks.push('fieldset') } });

    await wrapper.get('fieldset').trigger('click');
    expect(clicks).toEqual(['fieldset']);
  });
});

// ------------------------------------------------------------------ scoped slot

describe('VfFieldset characterization: the scoped default slot', () => {
  it('passes exactly describedBy and invalid', () => {
    let scope: Record<string, unknown> = {};
    mountFieldset({
      props: { description: 'D', error: 'E' },
      slots: { default: (props: Record<string, unknown>) => ((scope = props), 'x') },
    });

    expect(Object.keys(scope).sort()).toEqual(['describedBy', 'invalid']);
  });

  it('passes the same describedBy the fieldset lists, and invalid true for an error', () => {
    let scope: Scope = { invalid: false };
    const wrapper = mountFieldset({
      props: { description: 'D', error: 'E' },
      slots: { default: (props: Scope) => ((scope = props), 'x') },
    });

    expect(scope.describedBy).toBe(wrapper.get('fieldset').attributes('aria-describedby'));
    expect(scope.invalid).toBe(true);
  });

  it('passes describedBy undefined and invalid false when there is nothing to describe', () => {
    let scope: Scope = { invalid: true, describedBy: 'stale' };
    mountFieldset({ slots: { default: (props: Scope) => ((scope = props), 'x') } });

    expect(scope.describedBy).toBeUndefined();
    expect(scope.invalid).toBe(false);
  });

  it('passes invalid true for invalid alone, with describedBy undefined', () => {
    let scope: Scope = { invalid: false };
    mountFieldset({ props: { invalid: true }, slots: { default: (props: Scope) => ((scope = props), 'x') } });

    expect(scope).toEqual({ describedBy: undefined, invalid: true });
  });

  it('passes the computed describedBy even when a consumer replaced the fieldset attribute', () => {
    let scope: Scope = { invalid: false };
    const wrapper = mountFieldset({
      props: { description: 'D' },
      attrs: { 'aria-describedby': 'outside' },
      slots: { default: (props: Scope) => ((scope = props), 'x') },
    });

    expect(wrapper.get('fieldset').attributes('aria-describedby')).toBe('outside');
    expect(scope.describedBy).toBe(wrapper.get('.vf-fieldset__description').attributes('id'));
  });

  it('lets a nested control bind the scope: the control names the same paragraphs and owns aria-invalid', () => {
    const wrapper = mountFieldset({
      props: { label: 'Plan', description: 'D', error: 'E' },
      slots: {
        default: ({ describedBy, invalid }: Scope) =>
          h('input', {
            class: 'nested',
            'aria-describedby': describedBy,
            'aria-invalid': invalid ? 'true' : undefined,
          }),
      },
    });
    const input = wrapper.get('input.nested');

    expect(input.attributes('aria-describedby')).toBe(wrapper.get('fieldset').attributes('aria-describedby'));
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.element.parentElement?.className).toBe('vf-fieldset__control');
  });

  it('updates the scope when the description and error change', async () => {
    const scopes: Scope[] = [];
    const description = ref<string | undefined>(undefined);
    const Host = defineComponent({
      render: () =>
        h(VfFieldset, { description: description.value }, { default: (props: Scope) => (scopes.push(props), 'x') }),
    });
    const wrapper = mount(Host);

    description.value = 'Now described';
    await nextTick();

    expect(scopes[0]?.describedBy).toBeUndefined();
    expect(scopes[scopes.length - 1]?.describedBy).toBe(wrapper.get('.vf-fieldset__description').attributes('id'));
  });
});

// ------------------------------------------------------------------ against the group box

describe('VfFieldset characterization: not a group box', () => {
  it('carries no group box class, title span, content wrapper or trigger', () => {
    const wrapper = mountFieldset({ props: { label: 'L' }, slots: { default: 'x' } });

    expect(wrapper.html()).not.toContain('vf-group-box');
    expect(wrapper.find('legend span').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.get('.vf-fieldset__control').attributes('id')).toBeUndefined();
  });
});
