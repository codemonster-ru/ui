import { renderToString } from '@vue/server-renderer';
import { CmRuntime, createCmTabsController } from '@codemonster-ru/ui-runtime';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { createSSRApp, h, nextTick, ref } from 'vue';

import CmTabs from './CmTabs.vue';
import type { CmTabItem } from './tabs.types';

it('hydrates stable IDs and scoped slots without losing a per-item form field when switching tabs', async () => {
  const items = [
    { value: 'profile', label: 'Profile', tabId: 'profile.tab', panelId: 'profile.panel' },
    { value: 'activity', label: 'Activity' },
  ];
  const model = ref('profile');
  const slots = {
    tab: ({ item, isActive, index }: { item: CmTabItem; isActive: boolean; index: number }) =>
      h('span', `${index + 1}. ${item.label}${isActive ? ' selected' : ''}`),
    panel: ({ activeValue }: { activeValue: string }) => h('p', `Current panel is ${activeValue}`),
    panelProfile: () => h('input', { name: 'nickname', 'aria-label': 'Nickname' }),
  };
  const updateModel = (value: string): void => {
    model.value = value;
  };
  const view = () => h(CmTabs, { items, modelValue: model.value, 'onUpdate:modelValue': updateModel }, slots);
  const host = document.createElement('form');
  host.innerHTML = await renderToString(createSSRApp({ render: view }));
  document.body.append(host);
  const runtime = new CmRuntime().register('tabs', createCmTabsController);
  const dispose = runtime.observe(host);
  const app = createSSRApp({ render: view });
  try {
    const originalTabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const originalIds = originalTabs.map((tab) => tab.id);
    expect(originalIds[0]).toBe('profile.tab');
    expect(originalIds[1]).toMatch(/-tab-activity$/u);

    app.mount(host);
    await nextTick();
    const [profile, activity] = host.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(profile).toBe(originalTabs[0]);
    expect(activity).toBe(originalTabs[1]);
    expect([profile.id, activity.id]).toEqual(originalIds);
    expect(profile.getAttribute('aria-controls')).toBe('profile.panel');
    expect(profile.textContent).toBe('1. Profile selected');
    const field = host.querySelector<HTMLInputElement>('input[name="nickname"]');
    expect(field).not.toBeNull();
    if (!field) return;
    field.value = 'Cora';

    const press = (tab: HTMLButtonElement, key: string) =>
      tab.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    profile.focus();
    press(profile, 'ArrowRight');
    await nextTick();
    expect(document.activeElement).toBe(activity);
    expect(activity.textContent).toBe('2. Activity selected');
    const activityPanel = document.getElementById(activity.getAttribute('aria-controls') ?? '');
    expect(activityPanel?.textContent).toContain('Current panel is activity');
    expect(activityPanel?.getAttribute('aria-labelledby')).toBe(activity.id);

    press(activity, 'ArrowLeft');
    await nextTick();
    expect(host.querySelector<HTMLInputElement>('input[name="nickname"]')).toBe(field);
    expect(new FormData(host).get('nickname')).toBe('Cora');
    expect(activityPanel?.textContent).toBe('');
    expect(activityPanel?.hidden).toBe(true);
  } finally {
    app.unmount();
    dispose();
    host.remove();
  }
});

it('links an explicitly external panel, omits a missing relationship, and preserves the controlled request', async () => {
  const wrapper = mount(CmTabs, {
    props: {
      modelValue: 'settings',
      items: [
        { value: 'settings', label: 'Settings', tabId: 'settings:tab', panelId: 'settings:external' },
        { value: 'summary', label: 'Summary' },
      ],
    },
  });
  const [settings, summary] = wrapper.findAll('[role="tab"]');
  expect(settings.attributes('aria-controls')).toBe('settings:external');
  expect(settings.attributes('id')).toBe('settings:tab');
  expect(summary.attributes('aria-controls')).toBeUndefined();
  expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false);

  await summary.trigger('click');
  expect(settings.attributes('aria-selected')).toBe('true');
  expect(wrapper.emitted('change')).toEqual([['summary']]);
  wrapper.unmount();
});
