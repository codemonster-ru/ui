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
  const menu = mount(VfMenuBar, { attachTo: document.body, props: { items, defaultValue: 'next' } });
  try {
    await nextTick();
    const edit = menu.get<HTMLButtonElement>('[data-cm-menu-bar-branch="edit"]');
    expect(edit.classes()).toContain('cm-menu-bar__item--ancestor-active');
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
    expect(panel?.parentElement).toBe(menu.element);
    expect(panel?.style.position).toBe('');
    expect(edit.attributes('aria-controls')).toBe(panel?.id);
    expect(document.activeElement).toBe(find.element);
    await find.trigger('keydown', { key: 'Escape' });
    expect(document.activeElement).toBe(edit.element);
    expect(panel?.hidden).toBe(true);
  } finally {
    menu.unmount();
    vi.unstubAllGlobals();
  }
});

it.each([
  ['ltr', 1, false],
  ['rtl', -1, true],
] as const)(
  'shows overflow controls and hands off focus at each logical edge in %s',
  async (direction, sign, reduce) => {
    vi.stubGlobal('matchMedia', (query: string) =>
      Object.assign(new EventTarget(), { matches: reduce && query.includes('prefers-reduced-motion') }),
    );
    const menu = mount(VfMenuBar, { attachTo: document.body, props: { items } });
    try {
      await nextTick();
      const list = menu.get<HTMLElement>('[role="menubar"]').element;
      list.style.direction = direction;
      const start = menu.get<HTMLButtonElement>('[data-cm-scroll-edge="start"]').element;
      const end = menu.get<HTMLButtonElement>('[data-cm-scroll-edge="end"]').element;
      expect(start.hidden && end.hidden).toBe(true);
      expect(end.getAttribute('aria-controls')).toBe(list.id);
      let width = 180;
      const scrollBy = vi.fn((options: ScrollToOptions) => {
        list.scrollLeft = sign * Math.max(0, Math.min(280 - width, sign * (list.scrollLeft + (options.left ?? 0))));
        list.dispatchEvent(new Event('scroll'));
      });
      Object.defineProperties(list, {
        clientWidth: { get: () => width },
        scrollWidth: { value: 280 },
        scrollBy: { value: scrollBy },
      });
      window.dispatchEvent(new Event('resize'));
      await nextTick();
      expect(start.hidden).toBe(true);
      expect(end.hidden).toBe(false);
      end.focus();
      end.click();
      await nextTick();
      expect(scrollBy).toHaveBeenCalledWith({ left: sign * 120, behavior: reduce ? 'instant' : 'smooth' });
      expect(end.hidden).toBe(true);
      expect(start.hidden).toBe(false);
      expect(document.activeElement).toBe(menu.get('[data-cm-menu-bar-branch="edit"]').element);
      start.focus();
      start.click();
      await nextTick();
      expect(start.hidden).toBe(true);
      expect(document.activeElement).toBe(menu.get('[data-cm-menu-bar-branch="file"]').element);
      end.focus();
      width = 320;
      window.dispatchEvent(new Event('resize'));
      await nextTick();
      expect(end.hidden).toBe(true);
      expect(document.activeElement).toBe(menu.get('[data-cm-menu-bar-branch="edit"]').element);
    } finally {
      menu.unmount();
      vi.unstubAllGlobals();
    }
  },
);

it('releases submenu focus while a closing portal keeps its placement', async () => {
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: true }));
  const menu = mount(VfMenuBar, { attachTo: document.body, props: { items, openPath: ['file'] } });
  try {
    await nextTick();
    const trigger = menu.get('[data-cm-menu-bar-branch="file"]');
    const panelId = trigger.attributes('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) throw new Error('The menu trigger must identify its submenu.');
    let finished!: () => void;
    const paint = new Promise<void>((resolve) => (finished = resolve));
    Object.defineProperty(panel, 'getAnimations', {
      value: () => [{ transitionProperty: 'display', finished: paint }],
    });
    menu.get<HTMLElement>('[data-cm-menu-bar-value="new"]').element.focus();
    await menu.setProps({ openPath: [] });
    expect(document.activeElement).toBe(trigger.element);
    expect(panel.hidden).toBe(true);
    expect(panel.style.position).toBe('fixed');
    await menu.setProps({ openPath: ['file'] });
    finished();
    await paint;
    expect(panel.hidden).toBe(false);
    expect(panel.style.position).toBe('fixed');
    await menu.setProps({ openPath: [] });
    await nextTick();
    expect(panel.style.position).toBe('');
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
  const focused = host.querySelector<HTMLElement>('[data-cm-menu-bar-branch="find"]');
  focused?.focus();
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: true }));
  const app = createApp();
  const warnings: string[] = [];
  app.config.warnHandler = (warning) => warnings.push(warning);
  try {
    app.mount(host);
    await nextTick();
    await nextTick();
    const trigger = host.querySelector(selector);
    expect(trigger).toBe(serverTrigger);
    const panel = document.getElementById(trigger?.getAttribute('aria-controls') ?? '');
    expect(panel?.parentElement).toBe(host.firstElementChild);
    expect(panel?.hidden).toBe(false);
    expect(document.activeElement).toBe(focused);
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
