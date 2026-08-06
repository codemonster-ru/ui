import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import VfConfirmDialog from './VfConfirmDialog.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('VfConfirmDialog', () => {
  it('does not render an empty dialog body when no default content is provided', async () => {
    mount(VfConfirmDialog, {
      attachTo: document.body,
      props: { open: true, title: 'Delete user?', description: 'This action cannot be undone.' },
    });
    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]');
    const description = document.body.querySelector('.vf-confirm-dialog__description');

    expect(document.body.querySelector('.vf-dialog__body')?.textContent).toContain('This action cannot be undone.');
    expect(document.body.querySelector('.vf-dialog__header')?.textContent).not.toContain(
      'This action cannot be undone.',
    );
    expect(dialog?.getAttribute('aria-describedby')).toBe(description?.id);
    expect(document.body.querySelector('.vf-dialog__header')).not.toBeNull();
    expect(document.body.querySelector('.vf-dialog__footer')).not.toBeNull();
    expect(document.body.querySelector('.vf-dialog__content--dividers')).not.toBeNull();
  });

  it('allows dividers to be disabled', async () => {
    mount(VfConfirmDialog, {
      attachTo: document.body,
      props: { open: true, dividers: false },
    });
    await nextTick();

    expect(document.body.querySelector('.vf-dialog__content--dividers')).toBeNull();
  });

  it('focuses cancel by default and allows confirmation to receive initial focus', async () => {
    const wrapper = mount(VfConfirmDialog, {
      attachTo: document.body,
      props: { open: true, confirmLabel: 'Delete' },
    });
    await nextTick();

    expect(document.activeElement?.textContent).toBe('Cancel');

    await wrapper.setProps({ initialFocus: 'confirm' });
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    await nextTick();

    expect(document.activeElement?.textContent).toBe('Delete');
  });

  it('can render into a custom teleport target', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(VfConfirmDialog, {
      attachTo: document.body,
      props: { open: true, teleportTo: target },
    });
    await nextTick();

    expect(target.querySelector('.vf-dialog')).not.toBeNull();
  });

  it('renders a dialog body when default content is provided', async () => {
    mount(VfConfirmDialog, {
      attachTo: document.body,
      props: { open: true },
      slots: { default: '<p>Additional consequences</p>' },
    });
    await nextTick();

    expect(document.body.querySelector('.vf-dialog__body')?.textContent).toContain('Additional consequences');
  });

  it('emits confirmation and closes by default', async () => {
    const wrapper = mount(VfConfirmDialog, {
      attachTo: document.body,
      props: { open: true, title: 'Delete user?', confirmLabel: 'Delete' },
    });
    await nextTick();

    const confirmButton = [...document.body.querySelectorAll('button')].find(
      (button) => button.textContent === 'Delete',
    );
    confirmButton?.click();
    await nextTick();

    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.emitted('update:open')?.slice(-1)[0]).toEqual([false]);
  });

  it('reports cancellation from its cancel button', async () => {
    const wrapper = mount(VfConfirmDialog, {
      attachTo: document.body,
      props: { open: true },
    });
    await nextTick();

    const cancelButton = [...document.body.querySelectorAll('button')].find(
      (button) => button.textContent === 'Cancel',
    );
    cancelButton?.click();
    await nextTick();

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('update:open')?.slice(-1)[0]).toEqual([false]);
  });

  it('does not close while confirmation is loading', async () => {
    const wrapper = mount(VfConfirmDialog, {
      attachTo: document.body,
      props: { open: true, loading: true },
    });
    await nextTick();

    document.body.querySelector<HTMLElement>('.vf-dialog__overlay')?.click();
    await nextTick();

    expect(wrapper.emitted('cancel')).toBeUndefined();
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });
});
