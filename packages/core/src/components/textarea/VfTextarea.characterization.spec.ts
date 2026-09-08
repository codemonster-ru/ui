// Characterization of the historical VfTextarea at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// These tests record observable behaviour before a Razor adapter is written
// against it. Where the reference does something surprising, the surprise is
// asserted as-is rather than fixed here.
//
// The thing to know before porting: `v-bind="attrs"` is written *after* the
// component's own bindings, so a consumer attribute wins over them. That is the
// opposite of VfButton, where the component's own :disabled is applied last and
// wins. Two form controls in the same library, opposite precedence.
import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';

import { vfFieldContextKey } from '../field/context';
import VfTextarea from './VfTextarea.vue';

type TextareaProps = InstanceType<typeof VfTextarea>['$props'];

function mountTextarea({
  props = {},
  attrs = {},
}: { props?: Partial<TextareaProps>; attrs?: Record<string, unknown> } = {}) {
  return mount(VfTextarea, { attachTo: document.body, props: props as TextareaProps, attrs });
}

/** A field stand-in that records what the control reports through the context. */
function mountInField(props: Record<string, unknown> = {}, placement: 'top' | 'floating' = 'floating') {
  const reported = { filled: [] as boolean[], floatingSupported: [] as boolean[] };
  const wrapper = mount(
    defineComponent({
      setup() {
        return () => h(VfTextarea, props);
      },
      provide() {
        return {
          [vfFieldContextKey as symbol]: {
            labelPlacement: ref(placement),
            setFilled: (value: boolean) => reported.filled.push(value),
            setFloatingSupported: (value: boolean) => reported.floatingSupported.push(value),
          },
        };
      },
    }),
    { attachTo: document.body },
  );

  return { wrapper, reported };
}

describe('VfTextarea characterization: element and defaults', () => {
  it('renders a native textarea element', () => {
    expect(mountTextarea().element.tagName).toBe('TEXTAREA');
  });

  it('carries only the canonical class at the default size', () => {
    expect(mountTextarea().get('textarea').classes()).toEqual(['vf-textarea']);
  });

  it('omits the size modifier at the default medium size', () => {
    const classes = mountTextarea({ props: { size: 'md' } })
      .get('textarea')
      .classes();

    expect(classes).not.toContain('vf-textarea--md');
    expect(classes).toEqual(['vf-textarea']);
  });

  it('emits a modifier for the two non-default sizes', () => {
    for (const size of ['sm', 'lg'] as const) {
      expect(mountTextarea({ props: { size } }).get('textarea').classes()).toContain(`vf-textarea--${size}`);
    }
  });

  it('interpolates an undocumented size into the class name without validating it', () => {
    expect(
      mountTextarea({ props: { size: 'xl' as TextareaProps['size'] } })
        .get('textarea')
        .classes(),
    ).toContain('vf-textarea--xl');
  });

  it('renders no rows attribute of its own', () => {
    // There is no rows prop: rows is a native attribute a consumer forwards.
    expect(mountTextarea().get('textarea').attributes('rows')).toBeUndefined();
  });

  it('starts empty, unfilled and valid', () => {
    const textarea = mountTextarea().get('textarea');

    expect((textarea.element as HTMLTextAreaElement).value).toBe('');
    expect(textarea.attributes('data-vf-filled')).toBeUndefined();
    expect(textarea.attributes('aria-invalid')).toBeUndefined();
  });
});

describe('VfTextarea characterization: value and model', () => {
  it('renders the model value as the live value of the control', () => {
    const textarea = mountTextarea({ props: { modelValue: 'Release notes' } }).get('textarea');

    expect((textarea.element as HTMLTextAreaElement).value).toBe('Release notes');
  });

  it('renders a multiline model value with its newlines intact', () => {
    const textarea = mountTextarea({ props: { modelValue: 'first\nsecond\nthird' } }).get('textarea');

    expect((textarea.element as HTMLTextAreaElement).value).toBe('first\nsecond\nthird');
  });

  it('keeps markup-like text as text rather than as markup', () => {
    const value = '<script>alert(1)</script> & "quoted" & \'single\'';
    const textarea = mountTextarea({ props: { modelValue: value } }).get('textarea');

    expect((textarea.element as HTMLTextAreaElement).value).toBe(value);
    expect(textarea.element.querySelector('script')).toBeNull();
  });

  it('emits update:modelValue with the new value when the user types', async () => {
    const wrapper = mountTextarea();
    const textarea = wrapper.get('textarea');
    (textarea.element as HTMLTextAreaElement).value = 'typed';
    await textarea.trigger('input');

    expect(wrapper.emitted('update:modelValue')).toEqual([['typed']]);
  });

  it('follows a model value changed from outside', async () => {
    const wrapper = mountTextarea({ props: { modelValue: 'one' } });
    await wrapper.setProps({ modelValue: 'two' });

    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('two');
  });

  it('marks itself filled through a data attribute, and only when non-empty', async () => {
    const wrapper = mountTextarea({ props: { modelValue: 'x' } });
    expect(wrapper.get('textarea').attributes('data-vf-filled')).toBe('true');

    await wrapper.setProps({ modelValue: '' });
    expect(wrapper.get('textarea').attributes('data-vf-filled')).toBeUndefined();
  });

  it('counts whitespace as filled, because the test is length rather than content', () => {
    // A quirk: '   ' is filled. The reference measures string length and does
    // not trim, so a floating label lifts over whitespace.
    expect(
      mountTextarea({ props: { modelValue: '   ' } })
        .get('textarea')
        .attributes('data-vf-filled'),
    ).toBe('true');
  });
});

describe('VfTextarea characterization: invalid', () => {
  it('exposes aria-invalid only when invalid', () => {
    expect(
      mountTextarea({ props: { invalid: true } })
        .get('textarea')
        .attributes('aria-invalid'),
    ).toBe('true');
    expect(mountTextarea().get('textarea').attributes('aria-invalid')).toBeUndefined();
  });

  it('adds the invalid modifier class', () => {
    expect(
      mountTextarea({ props: { invalid: true } })
        .get('textarea')
        .classes(),
    ).toContain('vf-textarea--invalid');
  });
});

describe('VfTextarea characterization: attribute forwarding', () => {
  it('forwards native textarea attributes', () => {
    const textarea = mountTextarea({
      attrs: {
        rows: 6,
        placeholder: 'Say something',
        name: 'notes',
        maxlength: 200,
        minlength: 2,
        spellcheck: 'false',
        autocomplete: 'off',
        wrap: 'hard',
      },
    }).get('textarea');

    expect(textarea.attributes('rows')).toBe('6');
    expect(textarea.attributes('placeholder')).toBe('Say something');
    expect(textarea.attributes('name')).toBe('notes');
    expect(textarea.attributes('maxlength')).toBe('200');
    expect(textarea.attributes('minlength')).toBe('2');
    expect(textarea.attributes('spellcheck')).toBe('false');
    expect(textarea.attributes('autocomplete')).toBe('off');
    expect(textarea.attributes('wrap')).toBe('hard');
  });

  it('forwards disabled, readonly and required', () => {
    const textarea = mountTextarea({ attrs: { disabled: true, readonly: true, required: true } }).get('textarea');

    expect(textarea.attributes('disabled')).toBeDefined();
    expect(textarea.attributes('readonly')).toBeDefined();
    expect(textarea.attributes('required')).toBeDefined();
  });

  it('forwards aria and data attributes', () => {
    const textarea = mountTextarea({
      attrs: { 'aria-label': 'Notes', 'aria-describedby': 'notes-hint', 'data-testid': 'notes' },
    }).get('textarea');

    expect(textarea.attributes('aria-label')).toBe('Notes');
    expect(textarea.attributes('aria-describedby')).toBe('notes-hint');
    expect(textarea.attributes('data-testid')).toBe('notes');
  });

  it('merges a consumer class with the canonical one', () => {
    const classes = mountTextarea({ attrs: { class: 'consumer-textarea' } })
      .get('textarea')
      .classes();

    expect(classes).toContain('vf-textarea');
    expect(classes).toContain('consumer-textarea');
  });

  it('forwards a consumer style', () => {
    expect(
      mountTextarea({ attrs: { style: 'min-height: 120px' } })
        .get('textarea')
        .attributes('style'),
    ).toBe('min-height: 120px;');
  });

  it('lets a consumer attribute override the component own binding', () => {
    // The quirk that distinguishes this component from VfButton: v-bind="attrs"
    // is written after the component's own bindings, so a consumer wins. Here
    // an explicit aria-invalid="false" survives an invalid component.
    expect(
      mountTextarea({ props: { invalid: true }, attrs: { 'aria-invalid': 'false' } })
        .get('textarea')
        .attributes('aria-invalid'),
    ).toBe('false');
  });
});

describe('VfTextarea characterization: field integration', () => {
  it('opts into floating support as soon as it is inside a field', () => {
    const { reported } = mountInField();

    expect(reported.floatingSupported).toContain(true);
  });

  it('reports its filled state to the field immediately', () => {
    expect(mountInField({ modelValue: 'notes' }).reported.filled).toContain(true);
    expect(mountInField({ modelValue: '' }).reported.filled).toContain(false);
  });

  it('reports a change of filled state to the field', async () => {
    const { wrapper, reported } = mountInField({ modelValue: '' });
    const textarea = wrapper.get('textarea');
    (textarea.element as HTMLTextAreaElement).value = 'now filled';
    await textarea.trigger('input');
    await nextTick();

    expect(reported.filled.at(-1)).toBe(true);
  });

  it('carries the floating modifier from the field placement alone', () => {
    // Like VfInput, it reads the placement rather than whether the field
    // actually floated.
    expect(mountInField({}, 'floating').wrapper.get('textarea').classes()).toContain('vf-textarea--floating');
    expect(mountInField({}, 'top').wrapper.get('textarea').classes()).not.toContain('vf-textarea--floating');
  });

  it('tells the field it is empty and unsupported when it goes away', async () => {
    const { wrapper, reported } = mountInField({ modelValue: 'notes' });
    wrapper.unmount();

    expect(reported.floatingSupported.at(-1)).toBe(false);
    expect(reported.filled.at(-1)).toBe(false);
  });

  it('renders no floating modifier outside a field', () => {
    expect(mountTextarea().get('textarea').classes()).not.toContain('vf-textarea--floating');
  });
});

describe('VfTextarea characterization: how the value reaches the DOM', () => {
  // The fact that decides what a server-rendered port is allowed to emit.
  it('transports the value as an attribute and leaves the element empty on the client', () => {
    const element = mountTextarea({ props: { modelValue: 'line one\nline two' } }).get('textarea')
      .element as HTMLTextAreaElement;

    // HTML defines no `value` content attribute for textarea - the initial
    // value is the element's text. Vue writes one anyway and sets the property
    // alongside it, so the browser shows the right thing for the wrong reason.
    expect(element.getAttribute('value')).toBe('line one\nline two');
    expect(element.textContent).toBe('');
    expect(element.value).toBe('line one\nline two');
  });

  it('transports the value as element text when server-rendered', async () => {
    // The native form, and the one a PHP adapter has to use: with no client to
    // set the property, only the element's text survives as the initial value.
    const html = await renderToString(
      createSSRApp({ render: () => h(VfTextarea, { modelValue: 'line one\nline two' }) }),
    );

    expect(html).toContain('>line one\nline two</textarea>');
    expect(html).not.toContain('value="line one');
  });

  it('escapes markup-like text when server-rendered, so user text cannot become markup', () => {
    return renderToString(
      createSSRApp({ render: () => h(VfTextarea, { modelValue: '<script>alert(1)</script> & "q"' }) }),
    ).then((html) => {
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;');
    });
  });
});
