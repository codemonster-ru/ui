import { mount } from '@vue/test-utils';
import { defineComponent, h, reactive, type PropType } from 'vue';
import { expect, it } from 'vitest';
import type { VfNavMenuItem } from '../nav-menu/nav-menu.types';
import VfMenuBar from './VfMenuBar.vue';

const RouterLink = defineComponent({
  props: { to: { type: Object as PropType<{ name: string }>, required: true } },
  setup:
    (props, { slots }) =>
    () =>
      h('a', { href: `#${props.to.name}` }, slots.default?.()),
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
