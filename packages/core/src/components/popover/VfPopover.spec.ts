import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import VfPopover from './VfPopover.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('VfPopover', () => {
  it('opens from trigger interaction and renders teleported content', async () => {
    const wrapper = mount(VfPopover, {
      attachTo: document.body,
      global: {
        stubs: {
          teleport: true,
        },
      },
      slots: {
        trigger: '<button type="button">Open</button>',
        default: '<div data-autofocus>Popover body</div>',
      },
    });

    await wrapper.get('.vf-popover__trigger').trigger('click');
    await nextTick();

    const popover = wrapper.get('[role="dialog"]');

    expect(popover.text()).toContain('Popover body');
    expect(wrapper.get('.vf-popover__trigger').attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('.vf-popover__arrow').exists()).toBe(true);
  });

  it('closes on escape and outside click', async () => {
    const wrapper = mount(VfPopover, {
      attachTo: document.body,
      global: {
        stubs: {
          teleport: true,
        },
      },
      slots: {
        trigger: '<button type="button">Open</button>',
        default: '<div>Popover body</div>',
      },
    });

    await wrapper.get('.vf-popover__trigger').trigger('click');
    await nextTick();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await wrapper.get('.vf-popover__trigger').trigger('click');
    await nextTick();

    document.body.click();
    await nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('supports controlled mode and emits updates', async () => {
    const wrapper = mount(
      defineComponent({
        components: { VfPopover },
        setup() {
          const open = ref(false);

          return () =>
            h(
              VfPopover,
              {
                open: open.value,
                'onUpdate:open': (value: boolean) => {
                  open.value = value;
                },
              },
              {
                trigger: () => h('button', { type: 'button' }, 'Toggle'),
                default: ({ close }: { close: () => void }) => h('button', { type: 'button', onClick: close }, 'Close'),
              },
            );
        },
      }),
      {
        attachTo: document.body,
        global: {
          stubs: {
            teleport: true,
          },
        },
      },
    );

    await wrapper.get('.vf-popover__trigger').trigger('click');
    await nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    await wrapper.get('[role="dialog"] button').trigger('click');
    await nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('can render without teleport when requested', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const wrapper = mount(VfPopover, {
      attachTo: host,
      props: {
        defaultOpen: true,
        disableTeleport: true,
      },
      slots: {
        trigger: '<button type="button">Open</button>',
        default: '<div>Popover body</div>',
      },
    });

    await nextTick();

    expect(host.querySelector('.vf-popover__content')).not.toBeNull();

    wrapper.unmount();
    host.remove();
  });

  it('can render into a custom teleport target', async () => {
    const host = document.createElement('div');
    const target = document.createElement('div');
    document.body.appendChild(host);
    document.body.appendChild(target);

    const wrapper = mount(VfPopover, {
      attachTo: host,
      props: {
        defaultOpen: true,
        teleportTo: target,
      },
      slots: {
        trigger: '<button type="button">Open</button>',
        default: '<div>Popover body</div>',
      },
    });

    await nextTick();

    expect(target.querySelector('.vf-popover__content')).not.toBeNull();
    expect(host.querySelector('.vf-popover__content')).toBeNull();

    wrapper.unmount();
    host.remove();
    target.remove();
  });
});
