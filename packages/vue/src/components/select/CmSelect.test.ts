import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { expect, it } from 'vitest';

import CmSelect from './CmSelect.vue';

it('positions an open portal in the containing dialog and retains keyboard ownership', async () => {
  const dialog = document.createElement('dialog');
  dialog.open = true;
  document.body.append(dialog);
  const wrapper = mount(CmSelect, {
    attachTo: dialog,
    props: {
      id: 'frequency',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly', disabled: true },
        { value: 'monthly', label: 'Monthly' },
      ],
      teleportTo: 'body',
    },
  });

  try {
    await nextTick();
    const trigger = wrapper.get<HTMLButtonElement>('#frequency');
    const listbox = dialog.querySelector<HTMLElement>('#frequency-listbox');
    expect(listbox?.parentElement).toBe(dialog);
    await trigger.trigger('click');
    expect(listbox?.hidden).toBe(false);
    await trigger.trigger('keydown', { key: 'ArrowUp' });
    expect(document.activeElement?.textContent).toBe('Monthly');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(listbox?.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger.element);
  } finally {
    wrapper.unmount();
    expect(dialog.querySelector('[role=listbox]')).toBeNull();
    dialog.remove();
  }
});
