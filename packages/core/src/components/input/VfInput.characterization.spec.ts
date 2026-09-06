/* eslint-disable vue/one-component-per-file */
// Characterization of the historical VfInput at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// These tests record observable behaviour before any extraction. They are not
// a proposal: where the reference does something surprising, the surprise is
// asserted as-is and listed in docs/multiplatform-architecture-plan.md instead
// of being fixed here.
//
// The shared core setup mocks @codemonster-ru/vueforge-icons with a registry
// that only contains `chevronDown`, which makes `icons.eye`, `icons.eyeSlash`
// and `icons.xmark` all `undefined` and therefore indistinguishable. This file
// installs a registry that echoes the requested glyph name so the icon contract
// is actually observable.
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

vi.mock('@codemonster-ru/vueforge-icons', () => ({
  VueIconify: {
    name: 'VueIconifyCharacterizationStub',
    props: ['icon', 'size'],
    template: '<span class="vf-icon" :data-icon="icon" :data-size="size" aria-hidden="true" />',
  },
  icons: new Proxy(
    {},
    {
      get: (_target, property) => String(property),
    },
  ),
}));

import { icons } from '@codemonster-ru/vueforge-icons';
import VfField from '@/components/field/VfField.vue';
import VfInput from './VfInput.vue';

function mountInput(options: Parameters<typeof mount>[1] = {}) {
  return mount(VfInput, { attachTo: document.body, ...options });
}

describe('VfInput characterization: props and defaults', () => {
  it('renders a bare input with the documented defaults and no adornment wrapper', () => {
    const wrapper = mountInput();
    const input = wrapper.get('input');

    expect(wrapper.find('.vf-input-wrap').exists()).toBe(false);
    expect(input.attributes('class')).toBe('vf-input');
    expect(input.element.value).toBe('');
    expect(input.attributes('type')).toBeUndefined();
    expect(input.attributes('aria-invalid')).toBeUndefined();
    expect(input.attributes('data-vf-filled')).toBeUndefined();
  });

  it('treats modelValue as a string and marks a non-empty value as filled', () => {
    const wrapper = mountInput({ props: { modelValue: 'Acme' } });
    const input = wrapper.get('input');

    expect(input.element.value).toBe('Acme');
    expect(input.attributes('data-vf-filled')).toBe('true');
  });

  it('does not inherit attrs onto an implicit root', () => {
    // inheritAttrs is false; every attribute placement below is explicit.
    expect(VfInput.inheritAttrs).toBe(false);
  });
});

describe('VfInput characterization: sizes and invalid state', () => {
  it.each([
    ['sm', 'vf-input vf-input--sm'],
    ['md', 'vf-input'],
    ['lg', 'vf-input vf-input--lg'],
  ])('renders size %s without a modifier for the default md', (size, expected) => {
    const wrapper = mountInput({ props: { size: size as 'sm' | 'md' | 'lg' } });

    expect(wrapper.get('input').attributes('class')).toBe(expected);
  });

  it.each([
    ['sm', 'vf-input-wrap vf-input-wrap--sm vf-input-wrap--with-leading'],
    ['md', 'vf-input-wrap vf-input-wrap--with-leading'],
    ['lg', 'vf-input-wrap vf-input-wrap--lg vf-input-wrap--with-leading'],
  ])('mirrors size %s onto the adornment wrapper', (size, expected) => {
    const wrapper = mountInput({
      props: { size: size as 'sm' | 'md' | 'lg', leadingIcon: 'magnifyingGlass' },
    });

    expect(wrapper.get('.vf-input-wrap').attributes('class')).toBe(expected);
  });

  it('exposes invalid through a modifier class and aria-invalid, and omits the attribute when valid', () => {
    const invalid = mountInput({ props: { invalid: true } });
    expect(invalid.get('input').attributes('class')).toBe('vf-input vf-input--invalid');
    expect(invalid.get('input').attributes('aria-invalid')).toBe('true');

    const valid = mountInput({ props: { invalid: false } });
    expect(valid.get('input').attributes('aria-invalid')).toBeUndefined();
  });

  it('mirrors invalid onto the adornment wrapper', () => {
    const wrapper = mountInput({ props: { invalid: true, trailingIcon: 'triangleExclamation' } });

    expect(wrapper.get('.vf-input-wrap').classes()).toContain('vf-input-wrap--invalid');
    expect(wrapper.get('input').classes()).toContain('vf-input--invalid');
  });
});

describe('VfInput characterization: adornment DOM', () => {
  it('renders the leading icon in an aria-hidden span and marks the input with-leading', () => {
    const wrapper = mountInput({ props: { leadingIcon: 'magnifyingGlass' } });
    const leading = wrapper.get('.vf-input-wrap__icon--leading');

    expect(leading.attributes('aria-hidden')).toBe('true');
    expect(leading.get('.vf-icon').attributes('data-icon')).toBe('magnifyingGlass');
    expect(leading.get('.vf-icon').attributes('data-size')).toBe('var(--vf-field-icon-size)');
    expect(wrapper.get('input').classes()).toContain('vf-input--with-leading');
    expect(wrapper.find('.vf-input-wrap__icon--trailing').exists()).toBe(false);
  });

  it('renders the trailing icon in an aria-hidden span and marks the input with-trailing', () => {
    const wrapper = mountInput({ props: { trailingIcon: 'circleInfo' } });
    const trailing = wrapper.get('.vf-input-wrap__icon--trailing');

    expect(trailing.attributes('aria-hidden')).toBe('true');
    expect(trailing.get('.vf-icon').attributes('data-icon')).toBe('circleInfo');
    expect(wrapper.get('input').classes()).toContain('vf-input--with-trailing');
    expect(wrapper.find('.vf-input-wrap__icon--leading').exists()).toBe(false);
  });

  it('keeps the documented child order inside the wrapper', () => {
    const wrapper = mountInput({
      props: {
        modelValue: 'secret',
        leadingIcon: 'lock',
        trailingIcon: 'circleInfo',
        clearable: true,
        passwordReveal: true,
      },
      attrs: { type: 'password' },
    });

    const order = [...wrapper.get('.vf-input-wrap').element.children].map((child) => child.className);

    expect(order).toEqual([
      'vf-input-wrap__icon vf-input-wrap__icon--leading',
      'vf-input vf-input--with-leading vf-input--with-trailing',
      'vf-input-wrap__icon vf-input-wrap__icon--trailing vf-input-wrap__icon--trailing-before-clear',
      'vf-icon-button vf-icon-button--ghost vf-icon-button--sm vf-input-wrap__password-toggle' +
        ' vf-input-wrap__password-toggle--before-clear',
      'vf-icon-button vf-icon-button--ghost vf-icon-button--sm vf-input-wrap__clear',
    ]);
  });

  it('applies the trailing geometry classes only for the combinations that need them', () => {
    const trailingAndClear = mountInput({
      props: { modelValue: 'value', trailingIcon: 'circleInfo', clearable: true },
    });
    expect(trailingAndClear.get('.vf-input-wrap').classes()).toContain('vf-input-wrap--with-trailing-and-clear');
    expect(trailingAndClear.get('.vf-input-wrap').classes()).not.toContain(
      'vf-input-wrap--with-trailing-password-and-clear',
    );

    const trailingPasswordAndClear = mountInput({
      props: { modelValue: 'value', trailingIcon: 'circleInfo', clearable: true, passwordReveal: true },
      attrs: { type: 'password' },
    });
    expect(trailingPasswordAndClear.get('.vf-input-wrap').classes()).toContain(
      'vf-input-wrap--with-trailing-password-and-clear',
    );

    const trailingOnly = mountInput({ props: { trailingIcon: 'circleInfo' } });
    expect(trailingOnly.get('.vf-input-wrap').classes()).not.toContain('vf-input-wrap--with-trailing-and-clear');
  });

  it('marks the adorned input as filled on the input element, not on the wrapper', async () => {
    const wrapper = mountInput({ props: { leadingIcon: 'magnifyingGlass' } });
    const input = wrapper.get('input');

    expect(input.attributes('data-vf-filled')).toBeUndefined();
    expect(wrapper.get('.vf-input-wrap').attributes('data-vf-filled')).toBeUndefined();

    await input.setValue('filled');

    expect(wrapper.get('input').attributes('data-vf-filled')).toBe('true');
    expect(wrapper.get('.vf-input-wrap').attributes('data-vf-filled')).toBeUndefined();
  });

  it('renders no wrapper when nothing is adorned, even for a password input without reveal', () => {
    const wrapper = mountInput({ props: { modelValue: 'secret' }, attrs: { type: 'password' } });

    expect(wrapper.find('.vf-input-wrap').exists()).toBe(false);
    expect(wrapper.get('input').attributes('type')).toBe('password');
  });
});

describe('VfInput characterization: leading and trailing slots', () => {
  it('renders slot content inside the adornment spans', () => {
    const wrapper = mountInput({
      slots: {
        leading: () => h('span', { class: 'consumer-leading' }, '@'),
        trailing: () => h('span', { class: 'consumer-trailing' }, 'kg'),
      },
    });

    expect(wrapper.get('.vf-input-wrap__icon--leading .consumer-leading').text()).toBe('@');
    expect(wrapper.get('.vf-input-wrap__icon--trailing .consumer-trailing').text()).toBe('kg');
    expect(wrapper.get('input').classes()).toEqual(
      expect.arrayContaining(['vf-input--with-leading', 'vf-input--with-trailing']),
    );
  });

  it('lets slot content replace the icon props rather than render alongside them', () => {
    const wrapper = mountInput({
      props: { leadingIcon: 'magnifyingGlass', trailingIcon: 'circleInfo' },
      slots: {
        leading: () => h('span', { class: 'consumer-leading' }, 'L'),
        trailing: () => h('span', { class: 'consumer-trailing' }, 'T'),
      },
    });

    expect(wrapper.findAll('.vf-input-wrap__icon .vf-icon')).toHaveLength(0);
    expect(wrapper.get('.vf-input-wrap__icon--leading').text()).toBe('L');
    expect(wrapper.get('.vf-input-wrap__icon--trailing').text()).toBe('T');
  });

  it('creates the wrapper for slots alone, with no icon props set', () => {
    const wrapper = mountInput({ slots: { trailing: () => h('span', 'unit') } });

    expect(wrapper.find('.vf-input-wrap').exists()).toBe(true);
    expect(wrapper.find('.vf-input-wrap__icon--leading').exists()).toBe(false);
  });
});

describe('VfInput characterization: consumer class and style placement', () => {
  it('places the consumer class on the input when there are no adornments', () => {
    const wrapper = mountInput({
      props: { size: 'lg' },
      attrs: { class: 'consumer-class', style: 'margin-top: 4px;' },
    });
    const input = wrapper.get('input');

    expect(input.attributes('class')).toBe('vf-input vf-input--lg consumer-class');
    expect(wrapper.find('.vf-input-wrap').exists()).toBe(false);
  });

  it('drops the consumer style entirely on a plain input', () => {
    // Recorded historical defect, not a proposal. inheritAttrs is false, the
    // bare input branch binds only :class and not :style, and `style` is
    // excluded from the forwarded attrs, so a consumer style is lost unless the
    // input happens to be adorned. Deliberately not fixed during
    // characterization.
    const wrapper = mountInput({ attrs: { style: 'margin-top: 4px;' } });

    expect(wrapper.get('input').attributes('style')).toBeUndefined();
    expect(wrapper.get('input').element.outerHTML).toBe('<input class="vf-input" value="">');
  });

  it('moves consumer class and style onto the wrapper as soon as the input is adorned', () => {
    const wrapper = mountInput({
      props: { size: 'lg', leadingIcon: 'magnifyingGlass' },
      attrs: { class: 'consumer-class', style: 'margin-top: 4px;' },
    });
    const root = wrapper.get('.vf-input-wrap');
    const input = wrapper.get('input');

    expect(root.attributes('class')).toBe('vf-input-wrap vf-input-wrap--lg vf-input-wrap--with-leading consumer-class');
    expect(root.attributes('style')).toBe('margin-top: 4px;');
    expect(input.attributes('class')).toBe('vf-input vf-input--lg vf-input--with-leading');
    expect(input.attributes('style')).toBeUndefined();
  });
});

describe('VfInput characterization: native attribute and type forwarding', () => {
  it('forwards native form attributes onto the input element', () => {
    const wrapper = mountInput({
      attrs: {
        id: 'workspace-name',
        name: 'workspace',
        placeholder: 'Acme',
        autocomplete: 'organization',
        required: true,
        maxlength: '32',
        'aria-describedby': 'workspace-hint',
        'data-testid': 'workspace-input',
      },
    });
    const input = wrapper.get('input');

    expect(input.attributes('id')).toBe('workspace-name');
    expect(input.attributes('name')).toBe('workspace');
    expect(input.attributes('placeholder')).toBe('Acme');
    expect(input.attributes('autocomplete')).toBe('organization');
    expect(input.attributes('required')).toBeDefined();
    expect(input.attributes('maxlength')).toBe('32');
    expect(input.attributes('aria-describedby')).toBe('workspace-hint');
    expect(input.attributes('data-testid')).toBe('workspace-input');
  });

  it('forwards numeric range attributes without normalising the type', () => {
    const wrapper = mountInput({
      props: { modelValue: '5' },
      attrs: { type: 'number', min: '0', max: '10', step: '0.5' },
    });
    const input = wrapper.get('input');

    expect(input.attributes('type')).toBe('number');
    expect(input.attributes('min')).toBe('0');
    expect(input.attributes('max')).toBe('10');
    expect(input.attributes('step')).toBe('0.5');
  });

  it.each(['text', 'email', 'search', 'tel', 'url', 'number', 'date', 'datetime-local', 'time', 'password', 'color'])(
    'passes the native type %s through unchanged',
    (type) => {
      const wrapper = mountInput({ attrs: { type } });

      expect(wrapper.get('input').attributes('type')).toBe(type);
    },
  );

  it('keeps native attributes off the adornment wrapper', () => {
    const wrapper = mountInput({
      props: { leadingIcon: 'magnifyingGlass' },
      attrs: { id: 'search-field', name: 'search', placeholder: 'Search' },
    });
    const root = wrapper.get('.vf-input-wrap');

    expect(root.attributes('id')).toBeUndefined();
    expect(root.attributes('name')).toBeUndefined();
    expect(root.attributes('placeholder')).toBeUndefined();
    expect(wrapper.get('input').attributes('id')).toBe('search-field');
  });

  it('ignores a non-string type attribute', () => {
    const wrapper = mountInput({ attrs: { type: 42 } });

    expect(wrapper.get('input').attributes('type')).toBeUndefined();
  });
});

describe('VfInput characterization: input events and external model updates', () => {
  it('emits update:modelValue on native input and keeps the rendered value in step', async () => {
    const wrapper = mountInput({ props: { modelValue: 'one' } });
    const input = wrapper.get('input');

    await input.setValue('two');

    expect(wrapper.emitted('update:modelValue')).toEqual([['two']]);
    expect(input.element.value).toBe('two');
  });

  it('adopts an external modelValue change without emitting', async () => {
    const wrapper = mountInput({ props: { modelValue: 'one' } });

    await wrapper.setProps({ modelValue: 'external' });

    expect(wrapper.get('input').element.value).toBe('external');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('keeps an uncontrolled value when the parent never writes modelValue back', async () => {
    const wrapper = mountInput();
    const input = wrapper.get('input');

    await input.setValue('typed');

    expect(input.element.value).toBe('typed');
    expect(wrapper.emitted('update:modelValue')).toEqual([['typed']]);
  });

  it('tracks the empty to filled to empty transition through data-vf-filled', async () => {
    const wrapper = mountInput();
    const input = wrapper.get('input');

    expect(input.attributes('data-vf-filled')).toBeUndefined();

    await input.setValue('filled');
    expect(input.attributes('data-vf-filled')).toBe('true');

    await input.setValue('');
    expect(input.attributes('data-vf-filled')).toBeUndefined();
  });

  it('keeps multiple instances independent', async () => {
    const wrapper = mount(
      defineComponent({
        components: { VfInput },
        template: '<div><VfInput class="first" /><VfInput class="second" /></div>',
      }),
      { attachTo: document.body },
    );

    await wrapper.get('input.first').setValue('alpha');

    expect(wrapper.get<HTMLInputElement>('input.first').element.value).toBe('alpha');
    expect(wrapper.get<HTMLInputElement>('input.second').element.value).toBe('');
  });
});

describe('VfInput characterization: clear control', () => {
  it('shows the clear control only for a non-empty, enabled, writable input', async () => {
    const wrapper = mountInput({ props: { clearable: true } });
    expect(wrapper.find('.vf-input-wrap__clear').exists()).toBe(false);

    await wrapper.setProps({ modelValue: 'value' });
    expect(wrapper.find('.vf-input-wrap__clear').exists()).toBe(true);
  });

  it('renders the clear control as a ghost sm icon button labelled Clear input', () => {
    const wrapper = mountInput({ props: { modelValue: 'value', clearable: true } });
    const clear = wrapper.get('.vf-input-wrap__clear');

    expect(clear.element.tagName).toBe('BUTTON');
    expect(clear.attributes('type')).toBe('button');
    expect(clear.attributes('aria-label')).toBe('Clear input');
    expect(clear.classes()).toEqual(
      expect.arrayContaining(['vf-icon-button', 'vf-icon-button--ghost', 'vf-icon-button--sm']),
    );
    expect(clear.get('.vf-icon').attributes('data-icon')).toBe(icons.xmark);
  });

  it('clears the value, emits an empty string and keeps focus while the wrapper survives', async () => {
    const wrapper = mountInput({
      props: { modelValue: 'value', clearable: true, leadingIcon: 'magnifyingGlass' },
    });
    const input = wrapper.get('input').element;

    await wrapper.get('.vf-input-wrap__clear').trigger('click');
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.get('input').element).toBe(input);
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(wrapper.find('.vf-input-wrap__clear').exists()).toBe(false);
  });

  it('drops the wrapper and re-creates the input when clearing removes the only adornment', async () => {
    const wrapper = mountInput({ props: { modelValue: 'value', clearable: true } });
    const before = wrapper.get('input').element;
    before.focus();
    expect(wrapper.find('.vf-input-wrap').exists()).toBe(true);

    await wrapper.get('.vf-input-wrap__clear').trigger('click');
    await nextTick();
    const after = wrapper.get('input').element;

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.find('.vf-input-wrap').exists()).toBe(false);
    expect(after.getAttribute('class')).toBe('vf-input');
    expect(after.value).toBe('');
    // Recorded historical defect, not a proposal. handleClear focuses the
    // current input synchronously, but collapsing the conditional wrapper
    // replaces that element on the next patch, so focus ends up on <body>.
    // Deliberately not fixed during characterization.
    expect(after).not.toBe(before);
    expect(document.activeElement).toBe(document.body);
  });

  it('hides the clear control for disabled and readonly inputs', () => {
    const disabled = mountInput({ props: { modelValue: 'value', clearable: true }, attrs: { disabled: true } });
    expect(disabled.find('.vf-input-wrap__clear').exists()).toBe(false);

    const readonly = mountInput({ props: { modelValue: 'value', clearable: true }, attrs: { readonly: true } });
    expect(readonly.find('.vf-input-wrap__clear').exists()).toBe(false);
  });

  it.each([
    [true, false],
    ['', false],
    ['true', false],
    ['false', true],
    ['disabled', true],
  ])('treats a disabled attr of %j as blocking the clear control: %j', (disabled, clearVisible) => {
    // Historical behaviour: only `true`, `""` and `"true"` count as disabled.
    // The HTML idiom `disabled="disabled"` does not suppress the clear action.
    const wrapper = mountInput({
      props: { modelValue: 'value', clearable: true },
      attrs: { disabled: disabled as boolean | string },
    });

    expect(wrapper.find('.vf-input-wrap__clear').exists()).toBe(clearVisible);
  });
});

describe('VfInput characterization: password reveal', () => {
  it('renders the reveal control only for passwordReveal on a password input', () => {
    const withoutType = mountInput({ props: { passwordReveal: true } });
    expect(withoutType.find('.vf-input-wrap__password-toggle').exists()).toBe(false);

    const textType = mountInput({ props: { passwordReveal: true }, attrs: { type: 'text' } });
    expect(textType.find('.vf-input-wrap__password-toggle').exists()).toBe(false);

    const passwordType = mountInput({ props: { passwordReveal: true }, attrs: { type: 'password' } });
    expect(passwordType.find('.vf-input-wrap__password-toggle').exists()).toBe(true);
  });

  it('swaps type, label, pressed state and glyph on toggle', async () => {
    const wrapper = mountInput({ props: { modelValue: 'secret', passwordReveal: true }, attrs: { type: 'password' } });
    const input = wrapper.get('input');
    const toggle = wrapper.get('.vf-input-wrap__password-toggle');

    expect(input.attributes('type')).toBe('password');
    expect(toggle.attributes('aria-label')).toBe('Show password');
    expect(toggle.attributes('aria-pressed')).toBe('false');
    expect(toggle.get('.vf-icon').attributes('data-icon')).toBe(icons.eye);

    await toggle.trigger('click');

    expect(input.attributes('type')).toBe('text');
    expect(toggle.attributes('aria-label')).toBe('Hide password');
    expect(toggle.attributes('aria-pressed')).toBe('true');
    expect(toggle.get('.vf-icon').attributes('data-icon')).toBe(icons.eyeSlash);

    await toggle.trigger('click');

    expect(input.attributes('type')).toBe('password');
    expect(toggle.attributes('aria-pressed')).toBe('false');
  });

  it('keeps the typed value across a visibility change', async () => {
    const wrapper = mountInput({ props: { passwordReveal: true }, attrs: { type: 'password' } });
    const input = wrapper.get('input');

    await input.setValue('typed-secret');
    await wrapper.get('.vf-input-wrap__password-toggle').trigger('click');

    expect(input.element.value).toBe('typed-secret');
    expect(input.attributes('type')).toBe('text');
  });

  it('restores the caret position and keeps focus on the input after toggling', async () => {
    const wrapper = mountInput({
      props: { modelValue: 'typed-secret', passwordReveal: true },
      attrs: { type: 'password' },
    });
    const input = wrapper.get('input');
    const toggle = wrapper.get('.vf-input-wrap__password-toggle');

    input.element.focus();
    input.element.setSelectionRange(6, 6);

    await toggle.trigger('click');
    await nextTick();

    expect(input.element.selectionStart).toBe(6);
    expect(input.element.selectionEnd).toBe(6);
    expect(document.activeElement).toBe(input.element);
  });

  it('restores a backward selection direction, not only the offsets', async () => {
    const wrapper = mountInput({
      props: { modelValue: 'typed-secret', passwordReveal: true },
      attrs: { type: 'password' },
    });
    const input = wrapper.get('input');

    input.element.focus();
    input.element.setSelectionRange(2, 8, 'backward');

    await wrapper.get('.vf-input-wrap__password-toggle').trigger('click');
    await nextTick();

    expect(input.element.selectionStart).toBe(2);
    expect(input.element.selectionEnd).toBe(8);
    expect(input.element.selectionDirection).toBe('backward');
  });

  it('focuses the input even when no selection was recorded', async () => {
    const wrapper = mountInput({ props: { passwordReveal: true }, attrs: { type: 'password' } });

    await wrapper.get('.vf-input-wrap__password-toggle').trigger('click');
    await nextTick();

    expect(document.activeElement).toBe(wrapper.get('input').element);
  });

  it('actively rewrites the caret after the toggle instead of relying on the browser keeping it', async () => {
    const wrapper = mountInput({
      props: { modelValue: 'typed-secret', passwordReveal: true },
      attrs: { type: 'password' },
    });
    const input = wrapper.get('input').element;
    const toggle = wrapper.get('.vf-input-wrap__password-toggle').element;

    input.focus();
    input.setSelectionRange(2, 8, 'backward');

    // Dispatched directly so the caret can be scrambled between the synchronous
    // part of the handler and its awaited restore. A component that only relied
    // on the element keeping its own selection would leave the scrambled value.
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    input.setSelectionRange(0, 0, 'none');

    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    await nextTick();

    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(8);
    expect(input.selectionDirection).toBe('backward');
  });

  it('tracks the caret from click, keyup and select before a toggle', async () => {
    const wrapper = mountInput({
      props: { modelValue: 'typed-secret', passwordReveal: true },
      attrs: { type: 'password' },
    });
    const input = wrapper.get('input');

    input.element.focus();
    input.element.setSelectionRange(3, 3);
    await input.trigger('keyup');

    input.element.setSelectionRange(11, 11);
    await input.trigger('select');

    await wrapper.get('.vf-input-wrap__password-toggle').trigger('click');
    await nextTick();

    expect(input.element.selectionStart).toBe(11);
  });
});

describe('VfInput characterization: field integration', () => {
  const FieldHarness = defineComponent({
    components: { VfField, VfInput },
    props: {
      labelPlacement: { type: String, default: 'top' },
      floatingVariant: { type: String, default: 'in' },
      initialValue: { type: String, default: '' },
      required: { type: Boolean, default: false },
    },
    setup(props) {
      return { value: ref(props.initialValue) };
    },
    template: `
      <VfField
        label="Workspace name"
        description="Shown in workspace settings."
        :required="required"
        :label-placement="labelPlacement"
        :floating-variant="floatingVariant"
      >
        <template #default="{ controlId, describedBy, invalid, required: isRequired }">
          <VfInput
            :id="controlId"
            v-model="value"
            :invalid="invalid"
            :aria-describedby="describedBy"
            :aria-required="isRequired ? 'true' : undefined"
          />
        </template>
      </VfField>
    `,
  });

  it('wires the field label, description and control together', () => {
    const wrapper = mount(FieldHarness, { attachTo: document.body });
    const label = wrapper.get('.vf-field__label');
    const input = wrapper.get('input');

    expect(label.attributes('for')).toBe(input.attributes('id'));
    expect(input.attributes('aria-describedby')).toBe(wrapper.get('.vf-field__description').attributes('id'));
    // A field alone does not make the control floating: the placement does.
    expect(input.classes()).not.toContain('vf-input--floating');
    expect(wrapper.get('.vf-field').classes()).not.toContain('vf-field--floating');
    expect(wrapper.find('.vf-field__label--floating').exists()).toBe(false);
  });

  it('stays non-floating inside a top-placement field even when adorned', async () => {
    const wrapper = mount(
      defineComponent({
        components: { VfField, VfInput },
        setup: () => ({ value: ref('Acme') }),
        template: `
          <VfField label="Workspace name">
            <template #default="{ controlId }">
              <VfInput :id="controlId" v-model="value" leading-icon="magnifyingGlass" />
            </template>
          </VfField>
        `,
      }),
      { attachTo: document.body },
    );
    await nextTick();

    expect(wrapper.get('.vf-input-wrap').classes()).not.toContain('vf-input-wrap--floating');
    expect(wrapper.get('input').classes()).not.toContain('vf-input--floating');
  });

  it('reports floating support to the field so a floating label can render', async () => {
    const wrapper = mount(FieldHarness, { props: { labelPlacement: 'floating' }, attachTo: document.body });
    await nextTick();

    expect(wrapper.get('.vf-field').classes()).toContain('vf-field--floating');
    expect(wrapper.get('.vf-field').classes()).toContain('vf-field--floating-in');
    expect(wrapper.find('.vf-field__label--floating').exists()).toBe(true);
    expect(wrapper.get('input').classes()).toContain('vf-input--floating');
  });

  it('reports filled state to the field and keeps it in step with the value', async () => {
    const wrapper = mount(FieldHarness, { props: { labelPlacement: 'floating' }, attachTo: document.body });
    await nextTick();

    expect(wrapper.get('.vf-field__control').classes()).not.toContain('vf-field__control--filled');

    await wrapper.get('input').setValue('Acme');
    expect(wrapper.get('.vf-field__control').classes()).toContain('vf-field__control--filled');

    await wrapper.get('input').setValue('');
    expect(wrapper.get('.vf-field__control').classes()).not.toContain('vf-field__control--filled');
  });

  it('reports an initially filled value to the field on mount', async () => {
    const wrapper = mount(FieldHarness, {
      props: { labelPlacement: 'floating', initialValue: 'Acme' },
      attachTo: document.body,
    });
    await nextTick();

    expect(wrapper.get('.vf-field__control').classes()).toContain('vf-field__control--filled');
    expect(wrapper.get('input').attributes('data-vf-filled')).toBe('true');
  });

  it('mirrors the floating state onto the adornment wrapper', async () => {
    const wrapper = mount(
      defineComponent({
        components: { VfField, VfInput },
        setup: () => ({ value: ref('Acme') }),
        template: `
          <VfField label="Workspace name" label-placement="floating">
            <template #default="{ controlId }">
              <VfInput :id="controlId" v-model="value" leading-icon="magnifyingGlass" />
            </template>
          </VfField>
        `,
      }),
      { attachTo: document.body },
    );
    await nextTick();

    expect(wrapper.get('.vf-input-wrap').classes()).toContain('vf-input-wrap--floating');
    expect(wrapper.get('input').classes()).toContain('vf-input--floating');
  });

  it('applies the requested floating variant', async () => {
    const wrapper = mount(FieldHarness, {
      props: { labelPlacement: 'floating', floatingVariant: 'on' },
      attachTo: document.body,
    });
    await nextTick();

    expect(wrapper.get('.vf-field').classes()).toContain('vf-field--floating-on');
  });

  it('withdraws floating support and filled state when the input unmounts', async () => {
    const wrapper = mount(
      defineComponent({
        components: { VfField, VfInput },
        setup: () => ({ mounted: ref(true), value: ref('Acme') }),
        template: `
          <VfField label="Workspace name" label-placement="floating">
            <template #default="{ controlId }">
              <VfInput v-if="mounted" :id="controlId" v-model="value" />
            </template>
          </VfField>
        `,
      }),
      { attachTo: document.body },
    );
    await nextTick();
    expect(wrapper.get('.vf-field').classes()).toContain('vf-field--floating');

    wrapper.vm.mounted = false;
    await nextTick();

    expect(wrapper.get('.vf-field').classes()).not.toContain('vf-field--floating');
    expect(wrapper.get('.vf-field__control').classes()).not.toContain('vf-field__control--filled');
  });

  it('marks required floating labels and forwards aria-required to the input', async () => {
    const wrapper = mount(FieldHarness, {
      props: { labelPlacement: 'floating', required: true },
      attachTo: document.body,
    });
    await nextTick();
    const marker = wrapper.get('.vf-field__label--floating .vf-field__required-mark');

    expect(marker.text()).toBe('*');
    expect(marker.attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('input').attributes('aria-required')).toBe('true');
    expect(wrapper.get('input').attributes('required')).toBeUndefined();
  });

  it('renders no floating classes outside a field', () => {
    const wrapper = mountInput({ props: { modelValue: 'Acme' } });

    expect(wrapper.get('input').classes()).not.toContain('vf-input--floating');
  });
});

describe('VfInput characterization: accessibility relationships', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps the adornment spans out of the accessibility tree', () => {
    const wrapper = mountInput({
      props: { modelValue: 'value', leadingIcon: 'magnifyingGlass', trailingIcon: 'circleInfo', clearable: true },
    });

    for (const span of wrapper.findAll('.vf-input-wrap__icon')) {
      expect(span.attributes('aria-hidden')).toBe('true');
    }
  });

  it('gives both action controls an accessible name and keeps the input labelled by the consumer', () => {
    const wrapper = mountInput({
      props: { modelValue: 'secret', clearable: true, passwordReveal: true },
      attrs: { type: 'password', 'aria-label': 'Password' },
    });

    expect(wrapper.get('input').attributes('aria-label')).toBe('Password');
    expect(wrapper.get('.vf-input-wrap__password-toggle').attributes('aria-label')).toBe('Show password');
    expect(wrapper.get('.vf-input-wrap__clear').attributes('aria-label')).toBe('Clear input');
  });

  it('lets a consumer aria-invalid override the computed one', () => {
    // Historical behaviour: forwarded attrs are bound after the computed
    // aria-invalid, so the consumer value wins.
    const wrapper = mountInput({ props: { invalid: true }, attrs: { 'aria-invalid': 'false' } });

    expect(wrapper.get('input').attributes('aria-invalid')).toBe('false');
  });
});
