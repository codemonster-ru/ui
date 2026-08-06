import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import VfDataTableColumnChooser from './VfDataTableColumnChooser.vue';

const columns = [
  { key: 'actions', header: 'Actions' },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
];

describe('VfDataTableColumnChooser', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps required columns visible while toggling a column', async () => {
    const wrapper = mount(VfDataTableColumnChooser, {
      props: {
        columns,
        modelValue: ['actions', 'name', 'email'],
        requiredColumnKeys: ['actions'],
      },
    });

    await wrapper.get('button').trigger('click');
    await nextTick();
    const checkboxes = [...document.body.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    checkboxes[2].click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([['actions', 'email']]);
    expect(checkboxes[1].disabled).toBe(true);
  });

  it('emits only required columns when all optional columns are cleared', async () => {
    const wrapper = mount(VfDataTableColumnChooser, {
      props: {
        columns,
        modelValue: ['actions', 'name', 'email'],
        requiredColumnKeys: ['actions'],
      },
    });

    await wrapper.get('button').trigger('click');
    await nextTick();
    document.body.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([['actions']]);
  });

  it('does not open a custom trigger while disabled', async () => {
    const wrapper = mount(VfDataTableColumnChooser, {
      props: {
        columns,
        disabled: true,
      },
      slots: {
        trigger: '<button type="button">Columns</button>',
      },
    });

    const trigger = wrapper.get('.vf-dropdown__trigger');
    await trigger.trigger('click');
    await nextTick();

    expect(trigger.attributes('aria-disabled')).toBe('true');
    expect(document.body.querySelector('.vf-dropdown__menu')).toBeNull();
  });
});
