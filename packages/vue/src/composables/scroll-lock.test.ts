import { mount } from '@vue/test-utils';
import { defineComponent, effectScope, h, nextTick, ref, shallowRef } from 'vue';
import { expect, it, vi } from 'vitest';
import { useScrollLock } from './scroll-lock';

it('preserves scrollbar compensation and body styles until the last owner unmounts', () => {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1_200);
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1_180);
  const bodyStyle = document.body.getAttribute('style');
  document.body.style.cssText = 'overflow: auto !important; padding-right: 10px !important; color: red';
  const scope = effectScope();
  scope.run(() => useScrollLock(true));
  const LockOwner = defineComponent({
    setup() {
      useScrollLock(true);
      return () => h('span');
    },
  });
  try {
    const { style } = document.body;
    const host = mount(LockOwner);
    try {
      expect(style.overflow).toBe('hidden');
      expect(style.paddingRight).toBe('30px');
      scope.stop();
      expect(style.overflow).toBe('hidden');
      expect(style.paddingRight).toBe('30px');
    } finally {
      host.unmount();
    }
    expect(style.overflow).toBe('auto');
    expect(style.getPropertyPriority('overflow')).toBe('important');
    expect(style.paddingRight).toBe('10px');
    expect(style.getPropertyPriority('padding-right')).toBe('important');
    expect(style.color).toBe('red');
  } finally {
    scope.stop();
    if (bodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', bodyStyle);
    vi.restoreAllMocks();
  }
});

it('moves a reactive lock between targets and reacquires after manual unlock and an enabled change', async () => {
  const first = document.createElement('div');
  const second = document.createElement('div');
  first.style.cssText = 'overflow-x: clip; overflow-y: auto !important; padding-right: 9px';
  second.style.overflow = 'scroll';
  const target = shallowRef<HTMLElement | null>(null);
  const enabled = ref(true);
  const scope = effectScope();
  const lock = scope.run(() => useScrollLock(() => enabled.value, { target }))!;

  try {
    expect(document.body.style.overflow).toBe('hidden');
    target.value = first;
    await nextTick();
    expect(document.body.style.overflow).toBe('');
    expect(first.style.overflow).toBe('hidden');
    expect(first.style.getPropertyPriority('overflow')).toBe('important');
    expect(first.style.paddingRight).toBe('9px');

    target.value = second;
    await nextTick();
    expect(first.style.overflowX).toBe('clip');
    expect(first.style.overflowY).toBe('auto');
    expect(first.style.getPropertyPriority('overflow-y')).toBe('important');
    expect(second.style.overflow).toBe('hidden');

    lock.unlock();
    lock.unlock();
    expect(second.style.overflow).toBe('scroll');
    enabled.value = false;
    await nextTick();
    enabled.value = true;
    await nextTick();
    expect(second.style.overflow).toBe('hidden');
  } finally {
    scope.stop();
  }
  expect(second.style.overflow).toBe('scroll');
});
