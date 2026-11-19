import { mount } from '@vue/test-utils';
import { h, nextTick, ref, type VNode } from 'vue';
import { expect, it, vi } from 'vitest';

import CmButton from './button/CmButton.vue';
import CmCheckbox from './checkbox/CmCheckbox.vue';
import CmContainer from './container/CmContainer.vue';
import CmDataTable from './data-table/CmDataTable.vue';
import CmDialog from './dialog/CmDialog.vue';
import CmInput from './input/CmInput.vue';
import CmPopover from './popover/CmPopover.vue';
import CmTextarea from './textarea/CmTextarea.vue';

interface ForwardedAttributes {
  'data-example'?: string;
  onKeydown?: (event: KeyboardEvent) => void;
}

const cases: { name: string; selector: string; render: (attrs: ForwardedAttributes) => VNode }[] = [
  { name: 'Button', selector: 'button', render: (attrs) => h(CmButton, attrs, { default: () => 'Save' }) },
  { name: 'Checkbox', selector: 'input', render: (attrs) => h(CmCheckbox, { ...attrs, label: 'Updates' }) },
  { name: 'Container', selector: '.cm-container', render: (attrs) => h(CmContainer, attrs) },
  {
    name: 'DataTable',
    selector: '.cm-data-table',
    render: (attrs) =>
      h(CmDataTable, {
        ...attrs,
        id: 'projects',
        caption: 'Projects',
        columns: [{ key: 'name', header: 'Name' }],
        rows: [{ id: 'project', cells: { name: 'Project' } }],
      }),
  },
  { name: 'Dialog', selector: 'dialog', render: (attrs) => h(CmDialog, { ...attrs, id: 'confirm', title: 'Confirm' }) },
  { name: 'Input', selector: 'input', render: (attrs) => h(CmInput, attrs) },
  { name: 'clearable Input', selector: 'input', render: (attrs) => h(CmInput, { ...attrs, clearable: true }) },
  {
    name: 'Popover',
    selector: '.cm-popover',
    render: (attrs) => h(CmPopover, { ...attrs, id: 'help', label: 'Help' }),
  },
  { name: 'Textarea', selector: 'textarea', render: (attrs) => h(CmTextarea, attrs) },
];

it.each(cases)(
  'forwards current $name attributes and listeners from an initially empty set',
  async ({ selector, render }) => {
    const marker = ref<string>();
    const onKeydown = vi.fn();
    const wrapper = mount({
      render: () => render(marker.value ? { 'data-example': marker.value, onKeydown } : {}),
    });
    try {
      const control = wrapper.get(selector);
      expect(control.attributes('data-example')).toBeUndefined();

      marker.value = 'added';
      await nextTick();
      expect(control.attributes('data-example')).toBe('added');
      await control.trigger('keydown', { key: 'F2' });
      expect(onKeydown).toHaveBeenCalledOnce();

      marker.value = 'updated';
      await nextTick();
      expect(control.attributes('data-example')).toBe('updated');

      marker.value = undefined;
      await nextTick();
      expect(control.attributes('data-example')).toBeUndefined();
      await control.trigger('keydown', { key: 'F2' });
      expect(onKeydown).toHaveBeenCalledOnce();
    } finally {
      wrapper.unmount();
    }
  },
);

it('replaces a populated set of Button attributes after clearing it', async () => {
  const marker = ref<string | undefined>('initial');
  const wrapper = mount({
    render: () => h(CmButton, marker.value ? { 'data-example': marker.value } : {}, { default: () => 'Save' }),
  });
  try {
    const button = wrapper.get('button');
    expect(button.attributes('data-example')).toBe('initial');

    marker.value = undefined;
    await nextTick();
    expect(button.attributes('data-example')).toBeUndefined();

    marker.value = 'new';
    await nextTick();
    expect(button.attributes('data-example')).toBe('new');
  } finally {
    wrapper.unmount();
  }
});
