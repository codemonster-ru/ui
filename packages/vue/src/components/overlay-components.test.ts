import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CmDialog from './dialog/CmDialog.vue';
import CmDrawer from './drawer/CmDrawer.vue';
import CmPopover from './popover/CmPopover.vue';
import CmTooltip from './tooltip/CmTooltip.vue';

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('Vue overlay components', () => {
  it('closes Dialog with Escape and reports controlled state', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const wrapper = mount(CmDialog, {
      attachTo: document.body,
      props: { id: 'confirm', title: 'Confirm', open: true },
      slots: { default: 'Continue?' },
    });
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
    expect(document.activeElement).toBe(opener);
    wrapper.unmount();
  });

  it('locks user dismissal when Dialog is not dismissible', async () => {
    const wrapper = mount(CmDialog, {
      props: { id: 'busy-confirm', title: 'Deleting', open: true, dismissible: false },
    });
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' });
    await wrapper.get('[data-cm-dialog-close]').trigger('click');
    expect(wrapper.emitted('update:open')).toBeUndefined();
    expect(wrapper.get('dialog').attributes('open')).toBe('');
    expect(wrapper.get('[data-cm-dialog-close]').attributes('disabled')).toBe('');
  });

  it('renders Drawer on a logical side and closes from its button', async () => {
    const wrapper = mount(CmDrawer, {
      props: { id: 'filters', title: 'Filters', open: true, side: 'start' },
    });
    expect(wrapper.classes()).toContain('cm-drawer--start');
    await wrapper.get('[data-cm-drawer-close]').trigger('click');
    expect(wrapper.emitted('openChange')).toEqual([[false]]);
  });

  it('opens Popover from ArrowDown and dismisses it outside', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    const wrapper = mount(CmPopover, {
      attachTo: document.body,
      props: { id: 'help', label: 'Help' },
      slots: { default: '<button class="inside">Details</button>' },
    });
    await wrapper.get('.cm-popover__trigger').trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.get('.cm-popover__panel').attributes('hidden')).toBeUndefined();
    outside.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.get('.cm-popover__panel').attributes('hidden')).toBe('');
    expect(wrapper.emitted('openChange')).toEqual([[true], [false]]);
    wrapper.unmount();
  });

  it('shows Tooltip after its finite delay and hides it with Escape', async () => {
    vi.useFakeTimers();
    const wrapper = mount(CmTooltip, { props: { id: 'save', label: 'Save', content: 'Save changes' } });
    const trigger = wrapper.get('.cm-tooltip__trigger');
    await trigger.trigger('focus');
    expect(wrapper.get('[role="tooltip"]').attributes('hidden')).toBe('');
    await vi.advanceTimersByTimeAsync(300);
    expect(wrapper.get('[role="tooltip"]').attributes('hidden')).toBeUndefined();
    await trigger.trigger('keydown', { key: 'Escape' });
    expect(wrapper.get('[role="tooltip"]').attributes('hidden')).toBe('');
  });
});
