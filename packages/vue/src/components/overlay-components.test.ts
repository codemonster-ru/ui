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

  it('composes Dialog regions without losing its accessible relationships', () => {
    const wrapper = mount(CmDialog, {
      props: { id: 'publish', title: 'Publish', size: 'lg', dividers: true },
      slots: {
        header: 'Publish <strong>release</strong>?',
        description: 'Review the <strong>public changes</strong>.',
        actions: '<button type="button">Preview</button>',
      },
    });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['cm-dialog--lg', 'cm-dialog--dividers']));
    expect(wrapper.get('dialog').attributes('aria-labelledby')).toBe('publish-title');
    expect(wrapper.get('#publish-title').element.tagName).toBe('H2');
    expect(wrapper.get('#publish-title').text()).toBe('Publish release?');
    expect(wrapper.get('dialog').attributes('aria-describedby')).toBe('publish-description');
    expect(wrapper.get('.cm-dialog__actions').text()).toBe('Preview');
  });

  it('renders Drawer on a logical side and closes from its button', async () => {
    const wrapper = mount(CmDrawer, {
      props: { id: 'filters', title: 'Filters', open: true, side: 'start' },
    });
    expect(wrapper.classes()).toContain('cm-drawer--start');
    await wrapper.get('[data-cm-drawer-close]').trigger('click');
    expect(wrapper.emitted('openChange')).toEqual([[false]]);
  });

  it('supports finite Drawer presentation and dismissal locking', async () => {
    let requestSlotClose: (() => void) | undefined;
    const wrapper = mount(CmDrawer, {
      props: {
        id: 'account',
        title: 'Account',
        open: true,
        size: 'full',
        dividers: true,
        rounded: true,
        dismissible: false,
      },
      slots: {
        header: 'Account <strong>settings</strong>',
        actions: ({ close }: { close: () => void }) => {
          requestSlotClose = close;
          return 'Reset';
        },
      },
    });
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['cm-drawer--full', 'cm-drawer--dividers', 'cm-drawer--rounded']),
    );
    expect(wrapper.get('#account-title').text()).toBe('Account settings');
    expect(wrapper.get('#account-title').element.tagName).toBe('H2');
    requestSlotClose?.();
    expect(wrapper.emitted('update:open')).toBeUndefined();
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('update:open')).toBeUndefined();
    expect(wrapper.get('[data-cm-drawer-close]').attributes('disabled')).toBe('');
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

  it('keeps Popover trigger composition inside the labelled native button', () => {
    const wrapper = mount(CmPopover, {
      props: { id: 'profile', label: 'Open profile details' },
      slots: { trigger: '<span aria-hidden="true">●</span>' },
    });
    const trigger = wrapper.get('button.cm-popover__trigger');
    expect(trigger.attributes('aria-label')).toBe('Open profile details');
    expect(trigger.get('span').attributes('aria-hidden')).toBe('true');
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

  it('renders trusted Tooltip trigger and non-interactive rich content', () => {
    const wrapper = mount(CmTooltip, {
      props: { id: 'archive', label: 'Archive', content: 'Archive project' },
      slots: {
        trigger: '<span aria-hidden="true">×</span>',
        content: 'Archive <strong>this project</strong>',
      },
    });
    expect(wrapper.get('.cm-tooltip__trigger').attributes('aria-label')).toBe('Archive');
    expect(wrapper.get('[role="tooltip"] strong').text()).toBe('this project');
  });
});
