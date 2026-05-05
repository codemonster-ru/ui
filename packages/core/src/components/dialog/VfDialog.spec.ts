import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import VfDialog from './VfDialog.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('VfDialog', () => {
  it('renders dialog content with aria wiring when open', async () => {
    mount(VfDialog, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Delete project',
        description: 'This action cannot be undone.',
      },
      slots: {
        default: '<button data-autofocus>Confirm</button>',
      },
    });

    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]');
    const title = document.body.querySelector('.vf-dialog__title');
    const description = document.body.querySelector('.vf-dialog__description');

    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe(title?.id ?? null);
    expect(dialog?.getAttribute('aria-describedby')).toBe(description?.id ?? null);
    expect(document.activeElement?.textContent).toBe('Confirm');
  });

  it('emits close requests for overlay clicks and escape', async () => {
    const wrapper = mount(VfDialog, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Preferences',
      },
      slots: {
        default: 'Dialog body',
      },
    });

    await nextTick();

    const overlay = document.body.querySelector('.vf-dialog__overlay');
    overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(wrapper.emitted('update:open')).toEqual([[false]]);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.emitted('update:open')).toEqual([[false], [false]]);
  });

  it('renders a close icon button by default', async () => {
    const wrapper = mount(VfDialog, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Preferences',
      },
      slots: {
        default: 'Dialog body',
      },
    });

    await nextTick();

    const closeButton = document.body.querySelector<HTMLElement>('[aria-label="Close dialog"]');
    expect(closeButton).not.toBeNull();

    closeButton?.click();
    await nextTick();
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('supports uncontrolled mode and restores focus when closed', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open dialog';
    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mount(
      defineComponent({
        components: { VfDialog },
        setup() {
          return () =>
            h(
              VfDialog,
              {
                defaultOpen: true,
                title: 'Dialog title',
              },
              {
                default: ({ close }: { close: () => void }) =>
                  h('button', { 'data-test': 'close', onClick: close }, 'Close'),
              },
            );
        },
      }),
      {
        attachTo: document.body,
      },
    );

    await nextTick();
    document.body.querySelector<HTMLElement>('[data-test="close"]')?.click();
    await nextTick();

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    wrapper.unmount();
    trigger.remove();
  });

  it('locks body scroll while dialog is open', async () => {
    document.body.style.overflow = 'auto';

    const wrapper = mount(VfDialog, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Dialog title',
      },
      slots: {
        default: 'Dialog body',
      },
    });

    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    await wrapper.setProps({ open: false });
    await nextTick();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('can render without teleport when requested', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const wrapper = mount(VfDialog, {
      attachTo: host,
      props: {
        open: true,
        disableTeleport: true,
        title: 'Inline dialog',
      },
      slots: {
        default: 'Dialog body',
      },
    });

    await nextTick();

    expect(host.querySelector('.vf-dialog')).not.toBeNull();

    wrapper.unmount();
    host.remove();
  });

  it('can render into a custom teleport target', async () => {
    const host = document.createElement('div');
    const target = document.createElement('div');
    document.body.appendChild(host);
    document.body.appendChild(target);

    const wrapper = mount(VfDialog, {
      attachTo: host,
      props: {
        open: true,
        teleportTo: target,
        title: 'Targeted dialog',
      },
      slots: {
        default: 'Dialog body',
      },
    });

    await nextTick();

    expect(target.querySelector('.vf-dialog')).not.toBeNull();
    expect(host.querySelector('.vf-dialog')).toBeNull();

    wrapper.unmount();
    host.remove();
    target.remove();
  });
});
