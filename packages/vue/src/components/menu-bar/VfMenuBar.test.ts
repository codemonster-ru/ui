import { mount } from '@vue/test-utils';
import { createSSRApp, defineComponent, h, nextTick, reactive, type PropType } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { expect, it, vi } from 'vitest';
import type { VfNavMenuItem } from '../nav-menu/nav-menu.types';
import VfMenuBar from './VfMenuBar.vue';

const RouterLink = defineComponent({
  props: { to: { type: Object as PropType<{ name: string }>, required: true } },
  setup:
    (props, { slots }) =>
    () =>
      h('a', { href: `#${props.to.name}` }, slots.default?.()),
});

const items: VfNavMenuItem[] = [
  { value: 'file', label: 'File', children: [{ value: 'new', label: 'New' }] },
  {
    value: 'edit',
    label: 'Edit',
    children: [
      {
        value: 'tools',
        kind: 'group',
        label: 'Tools',
        children: [
          { value: 'find', label: 'Find', children: [{ value: 'next', label: 'Find next' }] },
          { value: 'replace', label: 'Replace', disabled: true, children: [{ value: 'all', label: 'Replace all' }] },
        ],
      },
    ],
  },
];

it('uses mouse hover after opening, skips disabled branches, and delays closing across pointer reentry', async () => {
  vi.useFakeTimers();
  const menu = mount(VfMenuBar, { props: { items } });
  const branch = (value: string) => menu.get(`[data-cm-menu-bar-branch="${value}"]`);
  const hover = (value: string, pointerType = 'mouse') => branch(value).trigger('pointerover', { pointerType });
  try {
    await hover('edit');
    expect(branch('edit').attributes('aria-expanded')).toBe('false');
    await branch('file').trigger('click');
    await hover('edit', 'touch');
    expect(branch('file').attributes('aria-expanded')).toBe('true');
    await hover('edit');
    expect(branch('file').attributes('aria-expanded')).toBe('false');
    expect(branch('edit').attributes('aria-expanded')).toBe('true');
    await hover('find');
    await hover('replace');
    expect(menu.emitted('update:openPath')).toEqual([[['file']], [['edit']], [['edit', 'find']]]);
    expect(branch('find').attributes('aria-expanded')).toBe('true');
    await menu.trigger('pointerleave', { pointerType: 'mouse' });
    vi.advanceTimersByTime(119);
    await hover('find');
    vi.advanceTimersByTime(120);
    await nextTick();
    expect(branch('find').attributes('aria-expanded')).toBe('true');
    await menu.trigger('pointerleave', { pointerType: 'mouse' });
    vi.advanceTimersByTime(119);
    await nextTick();
    expect(branch('edit').attributes('aria-expanded')).toBe('true');
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(branch('edit').attributes('aria-expanded')).toBe('false');
    expect(menu.emitted('openPathChange')).toEqual([[['file']], [['edit']], [['edit', 'find']], [[]]]);
  } finally {
    menu.unmount();
    vi.useRealTimers();
  }
});

it('reports hover requests without changing a controlled open path until the host accepts', async () => {
  const menu = mount(VfMenuBar, { props: { items, openPath: ['file'] } });
  try {
    const edit = menu.get('[data-cm-menu-bar-branch="edit"]');
    await edit.trigger('pointerover', { pointerType: 'mouse' });
    expect(menu.emitted('update:openPath')).toEqual([[['edit']]]);
    expect(edit.attributes('aria-expanded')).toBe('false');
    await menu.setProps({ openPath: ['edit'] });
    expect(edit.attributes('aria-expanded')).toBe('true');
  } finally {
    menu.unmount();
  }
});

it('preserves focus when a hovered branch replaces the one opened by keyboard', async () => {
  const menu = mount(VfMenuBar, { attachTo: document.body, props: { items } });
  try {
    const file = menu.get<HTMLButtonElement>('[data-cm-menu-bar-branch="file"]');
    const edit = menu.get('[data-cm-menu-bar-branch="edit"]');
    const first = menu.get('[data-cm-menu-bar-value="new"]');
    file.element.focus();
    await file.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(first.element);
    await edit.trigger('pointerover', { pointerType: 'mouse' });
    expect(edit.attributes('aria-expanded')).toBe('true');
    expect(file.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(file.element);
  } finally {
    menu.unmount();
  }
});

it('links wide floating panels to their triggers and uses their logical keyboard parent', async () => {
  const media = Object.assign(new EventTarget(), { matches: true });
  vi.stubGlobal('matchMedia', () => media);
  const menu = mount(VfMenuBar, { attachTo: document.body, props: { items } });
  try {
    await nextTick();
    const edit = menu.get<HTMLButtonElement>('[data-cm-menu-bar-branch="edit"]');
    const panel = document.getElementById(edit.attributes('aria-controls') ?? '');
    expect(panel?.parentElement).toBe(menu.element);
    expect(panel?.hidden).toBe(true);
    edit.element.focus();
    await edit.trigger('keydown', { key: 'ArrowDown' });
    const find = menu.get('[data-cm-menu-bar-branch="find"]');
    expect(panel?.hidden).toBe(false);
    expect(document.activeElement).toBe(find.element);
    media.matches = false;
    media.dispatchEvent(new Event('change'));
    await nextTick();
    expect(edit.element.nextElementSibling).toBe(panel);
    expect(edit.attributes('aria-controls')).toBeUndefined();
    expect(document.activeElement).toBe(find.element);
    await find.trigger('keydown', { key: 'Escape' });
    expect(document.activeElement).toBe(edit.element);
    expect(panel?.hidden).toBe(true);
  } finally {
    menu.unmount();
    vi.unstubAllGlobals();
  }
});

it('renders initially open panels inline on the server and hydrates the wide layer', async () => {
  const createApp = () => createSSRApp({ render: () => h(VfMenuBar, { items, openPath: ['edit'] }) });
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = await renderToString(createApp());
  const selector = '[data-cm-menu-bar-branch="edit"]';
  const serverTrigger = host.querySelector(selector);
  expect(serverTrigger?.getAttribute('aria-controls')).toBeNull();
  expect(serverTrigger?.nextElementSibling?.matches('ul[role="menu"]:not([hidden])')).toBe(true);
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: true }));
  const app = createApp();
  const warnings: string[] = [];
  app.config.warnHandler = (warning) => warnings.push(warning);
  try {
    app.mount(host);
    await nextTick();
    const trigger = host.querySelector(selector);
    expect(trigger).toBe(serverTrigger);
    const panel = document.getElementById(trigger?.getAttribute('aria-controls') ?? '');
    expect(panel?.parentElement).toBe(host.firstElementChild);
    expect(panel?.hidden).toBe(false);
    expect(warnings).toEqual([]);
  } finally {
    app.unmount();
    host.remove();
    vi.unstubAllGlobals();
  }
});

it('renders routed leaves inside labelled groups and reports the original selected item', async () => {
  const overview = reactive<VfNavMenuItem>({
    value: 'overview',
    label: 'Overview',
    to: { name: 'overview' },
    leadingIcon: 'house',
  });
  const events: string[] = [];
  const selected: VfNavMenuItem[] = [];
  const menu = mount(VfMenuBar, {
    global: { components: { RouterLink } },
    props: {
      items: [
        {
          value: 'work',
          label: 'Workspace',
          kind: 'group',
          children: [{ value: 'old', label: 'Archived', to: { name: 'archive' }, disabled: true }, overview],
        },
        { value: 'help', label: 'Help', href: '#help', target: '_blank' },
      ],
      defaultValue: 'help',
      'onUpdate:modelValue': (value) => events.push(`model:${value}`),
      onChange: (value) => events.push(`change:${value}`),
      onSelect: (item: VfNavMenuItem) => {
        events.push(`select:${item.value}`);
        selected.push(item);
      },
    },
  });

  try {
    expect(menu.attributes('aria-label')).toBe('Menu bar');
    const leaf = menu.get('[role="group"][aria-label="Workspace"] a[href="#overview"]');
    expect(leaf.attributes('tabindex')).toBe('0');
    expect(leaf.find('svg[aria-hidden="true"]').exists()).toBe(true);
    const disabled = menu.get('a[data-cm-menu-bar-value="old"]');
    expect(disabled.attributes('href')).toBeUndefined();
    expect(disabled.attributes('aria-disabled')).toBe('true');
    await disabled.trigger('click');
    expect(events).toEqual([]);
    expect(menu.get('a[href="#help"]').attributes('rel')).toBe('noopener noreferrer');
    await leaf.trigger('click');
    expect(events).toEqual(['model:overview', 'change:overview', 'select:overview']);
    expect(selected).toHaveLength(1);
    expect(selected[0]).toBe(overview);
    expect(leaf.attributes('aria-current')).toBe('page');
  } finally {
    menu.unmount();
  }
});
