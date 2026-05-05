import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import VfDrawer from './VfDrawer.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('VfDrawer', () => {
  it('renders drawer content with aria wiring when open', async () => {
    mount(VfDrawer, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Navigation',
      },
      slots: {
        default: '<button data-autofocus>Focus target</button>',
      },
    });

    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]');
    const title = document.body.querySelector('.vf-drawer__title');

    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe(title?.id ?? null);
    expect(dialog?.hasAttribute('aria-describedby')).toBe(false);
    expect(document.activeElement?.textContent).toBe('Focus target');
  });

  it('applies placement and size classes', async () => {
    mount(VfDrawer, {
      attachTo: document.body,
      props: {
        open: true,
        placement: 'left',
        size: 'lg',
        title: 'Filters',
      },
      slots: {
        default: 'Drawer body',
      },
    });

    await nextTick();

    const root = document.body.querySelector('.vf-drawer');
    const content = document.body.querySelector('.vf-drawer__content');

    expect(root?.className).toContain('vf-drawer--left');
    expect(content?.className).toContain('vf-drawer__content--left');
    expect(content?.className).toContain('vf-drawer__content--lg');
  });

  it('supports fullscreen size class', async () => {
    mount(VfDrawer, {
      attachTo: document.body,
      props: {
        open: true,
        placement: 'right',
        size: 'full',
        title: 'Fullscreen',
      },
      slots: {
        default: 'Drawer body',
      },
    });

    await nextTick();

    const content = document.body.querySelector('.vf-drawer__content');
    expect(content?.className).toContain('vf-drawer__content--full');
  });

  it('is square by default and can opt into rounded corners', async () => {
    const wrapper = mount(VfDrawer, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Navigation',
      },
      slots: {
        default: 'Drawer body',
      },
    });

    await nextTick();

    let root = document.body.querySelector('.vf-drawer');
    expect(root?.classList.contains('vf-drawer--rounded')).toBe(false);

    await wrapper.setProps({ rounded: true });
    await nextTick();

    root = document.body.querySelector('.vf-drawer');
    expect(root?.classList.contains('vf-drawer--rounded')).toBe(true);
  });

  it('emits close requests for overlay clicks and escape', async () => {
    const wrapper = mount(VfDrawer, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Preferences',
      },
      slots: {
        default: 'Drawer body',
      },
    });

    await nextTick();

    document.body.querySelector('.vf-drawer__overlay')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(wrapper.emitted('update:open')).toEqual([[false]]);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.emitted('update:open')).toEqual([[false], [false]]);
  });

  it('supports uncontrolled mode and restores focus when closed', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open drawer';
    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mount(
      defineComponent({
        components: { VfDrawer },
        setup() {
          return () =>
            h(
              VfDrawer,
              {
                defaultOpen: true,
                title: 'Drawer title',
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

  it('locks body scroll while drawer is open', async () => {
    document.body.style.overflow = 'auto';

    const wrapper = mount(VfDrawer, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Drawer title',
      },
      slots: {
        default: 'Drawer body',
      },
    });

    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    await wrapper.setProps({ open: false });
    await nextTick();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('can lock scroll on a custom target instead of body', async () => {
    document.body.style.overflow = 'auto';
    const host = document.createElement('div');
    host.style.overflow = 'auto';
    document.body.appendChild(host);

    const wrapper = mount(VfDrawer, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Drawer title',
        scrollLockTarget: host,
      },
      slots: {
        default: 'Drawer body',
      },
    });

    await nextTick();
    expect(host.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('auto');

    await wrapper.setProps({ open: false });
    await nextTick();
    expect(host.style.overflow).toBe('auto');

    wrapper.unmount();
    host.remove();
  });

  it('can render without teleport when requested', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const wrapper = mount(VfDrawer, {
      attachTo: host,
      props: {
        open: true,
        disableTeleport: true,
        title: 'Inline drawer',
      },
      slots: {
        default: 'Drawer body',
      },
    });

    await nextTick();

    expect(host.querySelector('.vf-drawer')).not.toBeNull();

    wrapper.unmount();
    host.remove();
  });

  it('can render into a custom teleport target', async () => {
    const host = document.createElement('div');
    const target = document.createElement('div');
    document.body.appendChild(host);
    document.body.appendChild(target);

    const wrapper = mount(VfDrawer, {
      attachTo: host,
      props: {
        open: true,
        teleportTo: target,
        title: 'Targeted drawer',
      },
      slots: {
        default: 'Drawer body',
      },
    });

    await nextTick();

    expect(target.querySelector('.vf-drawer')).not.toBeNull();
    expect(host.querySelector('.vf-drawer')).toBeNull();

    wrapper.unmount();
    host.remove();
    target.remove();
  });

  it('forwards root attrs and supports shell-oriented css variables', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const wrapper = mount(VfDrawer, {
      attachTo: host,
      props: {
        open: true,
        disableTeleport: true,
        title: 'Shell drawer',
        offsetTop: 72,
        bodyPadding: 0,
      },
      attrs: {
        class: 'shell-drawer',
        style: {
          '--vf-drawer-radius-top-left': '0px',
          '--vf-drawer-radius-bottom-left': '0px',
        },
        'data-shell': 'sidebar',
      },
      slots: {
        default: 'Drawer body',
      },
    });

    await nextTick();

    const root = host.querySelector<HTMLElement>('.vf-drawer');

    expect(root).not.toBeNull();
    expect(root?.classList.contains('shell-drawer')).toBe(true);
    expect(root?.classList.contains('vf-drawer--offset-top')).toBe(true);
    expect(root?.dataset.shell).toBe('sidebar');
    expect(root?.style.getPropertyValue('--vf-drawer-offset-top')).toBe('72px');
    expect(root?.style.getPropertyValue('--vf-drawer-body-padding')).toBe('0px');
    expect(root?.style.getPropertyValue('--vf-drawer-radius-top-left')).toBe('0px');
    expect(root?.style.getPropertyValue('--vf-drawer-radius-bottom-left')).toBe('0px');

    wrapper.unmount();
    host.remove();
  });
});
