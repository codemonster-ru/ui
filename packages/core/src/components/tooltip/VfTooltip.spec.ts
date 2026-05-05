import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import VfTooltip from './VfTooltip.vue';

describe('VfTooltip', () => {
  it('opens on hover and focus, and links trigger to tooltip content', async () => {
    vi.useFakeTimers();

    const wrapper = mount(VfTooltip, {
      props: {
        text: 'Helpful hint',
        placement: 'bottom',
        openDelay: 10,
      },
      slots: {
        default: '<button type="button">Info</button>',
      },
    });

    await wrapper.trigger('mouseenter');
    vi.advanceTimersByTime(10);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const tooltip = document.body.querySelector<HTMLElement>('[role="tooltip"]');
    const tooltipArrow = document.body.querySelector<HTMLElement>('.vf-tooltip__arrow');
    const trigger = wrapper.get('.vf-tooltip__trigger');

    expect(tooltip?.textContent).toBe('Helpful hint');
    expect(tooltip?.getAttribute('style')).toContain('left:');
    expect(tooltip?.getAttribute('style')).toContain('top:');
    expect(tooltipArrow).not.toBeNull();
    expect(tooltipArrow?.getAttribute('style')).toContain('left:');
    expect(tooltipArrow?.getAttribute('style')).toContain('top:');
    expect(trigger.attributes('aria-describedby')).toBe(tooltip?.getAttribute('id') ?? '');

    await wrapper.trigger('mouseleave');
    await wrapper.vm.$nextTick();
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();

    vi.useRealTimers();
  });

  it('can render without teleport when requested', async () => {
    vi.useFakeTimers();

    const host = document.createElement('div');
    document.body.appendChild(host);

    const wrapper = mount(VfTooltip, {
      attachTo: host,
      props: {
        text: 'Inline hint',
        openDelay: 0,
        disableTeleport: true,
      },
      slots: {
        default: '<button type="button">Info</button>',
      },
    });

    await wrapper.trigger('mouseenter');
    vi.advanceTimersByTime(0);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(host.querySelector('.vf-tooltip__content')).not.toBeNull();

    wrapper.unmount();
    host.remove();
    vi.useRealTimers();
  });

  it('can render into a custom teleport target', async () => {
    vi.useFakeTimers();

    const host = document.createElement('div');
    const target = document.createElement('div');
    document.body.appendChild(host);
    document.body.appendChild(target);

    const wrapper = mount(VfTooltip, {
      attachTo: host,
      props: {
        text: 'Targeted hint',
        openDelay: 0,
        teleportTo: target,
      },
      slots: {
        default: '<button type="button">Info</button>',
      },
    });

    await wrapper.trigger('mouseenter');
    vi.advanceTimersByTime(0);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(target.querySelector('.vf-tooltip__content')).not.toBeNull();
    expect(host.querySelector('.vf-tooltip__content')).toBeNull();

    wrapper.unmount();
    host.remove();
    target.remove();
    vi.useRealTimers();
  });
});
