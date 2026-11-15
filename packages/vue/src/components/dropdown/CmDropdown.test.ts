import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { expect, it } from 'vitest';

import CmDropdown from './CmDropdown.vue';

it('keeps a body portal within its dialog and owns Escape only while the menu is open', async () => {
  const dialog = document.createElement('dialog');
  dialog.open = true;
  document.body.append(dialog);
  const escapes: boolean[] = [];
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') escapes.push(event.defaultPrevented);
  });
  const wrapper = mount(CmDropdown, {
    attachTo: dialog,
    props: {
      id: 'actions',
      label: 'Actions',
      teleportTo: 'body',
      variant: 'pills',
      items: [
        { id: 'edit', label: 'Edit', active: true },
        { id: 'preview', label: 'Preview', disabled: true },
        { id: 'delete', label: 'Delete' },
      ],
    },
  });

  try {
    const trigger = wrapper.get<HTMLButtonElement>('#actions-trigger');
    await trigger.trigger('keydown', { key: 'ArrowUp' });
    await nextTick();
    const menu = dialog.querySelector<HTMLElement>('#actions-menu');
    expect(menu?.parentElement).toBe(dialog);
    expect(menu?.dataset.cmDropdownMenuVariant).toBe('pills');
    expect(document.activeElement?.textContent).toBe('Delete');
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(menu?.hidden).toBe(true);
    expect(escapes).toEqual([true]);
    expect(document.activeElement).toBe(trigger.element);
    await trigger.trigger('keydown', { key: 'Escape' });
    expect(escapes).toEqual([true, false]);
  } finally {
    wrapper.unmount();
    dialog.remove();
  }
});
