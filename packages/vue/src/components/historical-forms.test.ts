import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, h, nextTick } from 'vue';
import { expect, it, vi } from 'vitest';
import CmField from './field/CmField.vue';
import type { CmFieldDefaultSlotProps } from './field/field.types';
import VfFieldset from './fieldset/VfFieldset.vue';
import type { CmFieldsetDefaultSlotProps } from './fieldset/fieldset.types';
import VfTextarea from './textarea/VfTextarea.vue';

it('keeps generated fieldset message IDs distinct and stable through SSR hydration', async () => {
  const app = createSSRApp({
    render: () =>
      h('main', [
        h(
          VfFieldset,
          { id: 'billing', label: 'Fallback legend', description: 'Fallback help', disabled: true, form: 'details' },
          {
            label: () => h('strong', 'Billing notes'),
            description: () => h('em', 'Custom help'),
            error: () => 'Choose a plan',
            default: ({ describedBy, invalid }: CmFieldsetDefaultSlotProps) =>
              h('input', { 'aria-describedby': describedBy, 'aria-invalid': invalid }),
          },
        ),
        h(VfFieldset, { 'aria-label': 'Delivery notes', description: 'Delivery instructions' }),
      ]),
  });
  const container = document.createElement('div');
  container.innerHTML = await renderToString(app);
  const collectRelations = () =>
    Array.from(container.querySelectorAll('fieldset'), (fieldset) => {
      const messages = Array.from(fieldset.querySelectorAll('p[id]'), (message) => message.id);
      expect(fieldset.getAttribute('aria-describedby')).toBe(messages.join(' '));
      return messages;
    });
  const relations = collectRelations();
  expect(relations.map((ids) => ids.length)).toEqual([2, 1]);
  expect(new Set(relations.flat()).size).toBe(3);
  expect(container.querySelector('legend strong')?.textContent).toBe('Billing notes');
  expect(container.querySelector('.cm-fieldset__description em')?.textContent).toBe('Custom help');
  expect(container.querySelector('input')?.getAttribute('aria-describedby')).toBe(relations[0]?.join(' '));
  expect(container.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
  expect(container.querySelector('fieldset')?.getAttribute('aria-invalid')).toBe('true');
  expect(container.querySelector('fieldset')?.hasAttribute('disabled')).toBe(true);
  expect(container.querySelector('fieldset')?.getAttribute('form')).toBe('details');
  expect(container.querySelector('[aria-label="Delivery notes"] legend')).toBeNull();
  expect(container.querySelector('[aria-label="Delivery notes"]')?.hasAttribute('id')).toBe(false);

  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    app.mount(container);
    await nextTick();
    expect(collectRelations()).toEqual(relations);
    expect(warning).not.toHaveBeenCalled();
  } finally {
    app.unmount();
    warning.mockRestore();
  }
});

it('retains a textarea draft and emits native input until a changed model arrives', async () => {
  const input = vi.fn();
  const wrapper = mount(VfTextarea, {
    props: { modelValue: 'Initial' },
    attrs: { name: 'notes', rows: 4, maxlength: 40, onInput: input },
  });
  const textarea = wrapper.get('textarea');
  expect(textarea.element.value).toBe('Initial');

  await textarea.setValue('Edited\nlocally');
  expect(wrapper.emitted('update:modelValue')).toEqual([['Edited\nlocally']]);
  expect(input).toHaveBeenCalledExactlyOnceWith(expect.any(Event));
  await wrapper.setProps({ size: 'lg', invalid: true });
  expect(textarea.element.value).toBe('Edited\nlocally');
  expect(textarea.attributes()).toMatchObject({ name: 'notes', rows: '4', maxlength: '40', 'aria-invalid': 'true' });

  await wrapper.setProps({ modelValue: 'From the server' });
  expect(textarea.element.value).toBe('From the server');
  expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
  wrapper.unmount();
});

it('participates in floating Field metadata and native form submission', async () => {
  const wrapper = mount({
    render: () =>
      h('form', [
        h(
          CmField,
          { label: 'Notes', labelPlacement: 'floating', description: 'For your team', required: true },
          {
            default: ({ controlId, describedBy, required }: CmFieldDefaultSlotProps) =>
              h(VfTextarea, { id: controlId, 'aria-describedby': describedBy, name: 'notes', required }),
          },
        ),
        h(VfTextarea, { modelValue: 'Policy', name: 'policy', readonly: true }),
        h(
          VfFieldset,
          { label: 'Closed group', disabled: true },
          {
            default: () => h(VfTextarea, { modelValue: 'Excluded', name: 'excluded' }),
          },
        ),
      ]),
  });
  const form = wrapper.get('form').element;
  const notes = wrapper.get<HTMLTextAreaElement>('textarea[name=notes]');
  expect(wrapper.get('label').attributes('for')).toBe(notes.attributes('id'));
  expect(wrapper.get('.cm-field').classes()).toContain('cm-field--floating');
  expect(notes.attributes('placeholder')).toBe(' ');
  expect(notes.attributes('aria-describedby')).toBe(wrapper.get('.cm-field__description').attributes('id'));
  expect(form.checkValidity()).toBe(false);
  await notes.setValue('Line one\nLine two');
  expect(form.checkValidity()).toBe(true);
  expect(Array.from(new FormData(form).entries())).toEqual([
    ['notes', 'Line one\nLine two'],
    ['policy', 'Policy'],
  ]);
  wrapper.unmount();
});
