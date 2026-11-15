<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
  watchEffect,
  watchPostEffect,
  type ComponentPublicInstance,
} from 'vue';

import { attachCmAnchoredPosition } from '@codemonster-ru/ui-runtime/anchored-position';
import { normalizeIconName, resolveNamedIcon } from '../icon/named-icon';
import type { VfNavMenuItem } from '../nav-menu/nav-menu.types';
import CmMenuBar from './CmMenuBar.vue';
import type { CmMenuBarItem, VfMenuBarProps } from './menu-bar.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<VfMenuBarProps>(), { ariaLabel: 'Menu bar', variant: 'default' });
const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:openPath': [values: string[]];
  openPathChange: [values: string[]];
  change: [value: string];
  select: [item: VfNavMenuItem];
}>();
const localPath = ref<string[]>([]);
watchEffect(() => {
  if (props.openPath) localPath.value = [...props.openPath];
});
const openPath = computed(() => props.openPath ?? localPath.value);
const component = useTemplateRef<ComponentPublicInstance>('menu');
const menuRoot = () => component.value?.$el as HTMLElement | undefined;
const submenuTarget = ref<HTMLElement>();
let closeTimer: ReturnType<typeof setTimeout> | undefined;
const cancelClose = () => clearTimeout(closeTimer);
onBeforeUnmount(cancelClose);
onMounted(() => {
  const root = menuRoot();
  const query = root?.ownerDocument.defaultView?.matchMedia?.('(width > 640px)');
  if (!root || !query) return;
  const sync = () => {
    const target = query.matches ? root : undefined;
    if (target === submenuTarget.value) return;
    const focus = focusedItem(root);
    const trigger = focus?.closest('[role="menu"]') ? branchItem(root, openPath.value[0]) : undefined;
    // Moving the panel disconnects its focused item. Keep focus in the bar during the move.
    trigger?.focus();
    submenuTarget.value = target;
    if (trigger && focus)
      void nextTick(() => {
        if (focusedItem(root) === trigger && focus.isConnected) focus.focus();
      });
  };
  sync();
  query.addEventListener('change', sync);
  onBeforeUnmount(() => query.removeEventListener('change', sync));
});
watchPostEffect((onCleanup) => {
  const value = openPath.value[0];
  const root = submenuTarget.value;
  if (!root || value === undefined) return;
  const trigger = branchItem(root, value);
  const panel = (root.getRootNode() as Document | ShadowRoot).getElementById(
    trigger?.getAttribute('aria-controls') ?? '',
  );
  if (!trigger || !panel) return;
  panel.style.position = 'fixed';
  const stop = attachCmAnchoredPosition(trigger, panel, 'bottom-start', 8, null);
  onCleanup(() => {
    stop();
    panel.style.position = '';
  });
});

const menu = computed(() => {
  const byValue = new Map<string, { item: VfNavMenuItem; path: string[] }>();
  function resolveItem(item: VfNavMenuItem, ancestors: string[]): CmMenuBarItem {
    const path = item.kind === 'group' ? ancestors : [...ancestors, item.value];
    byValue.set(item.value, { item, path });
    return {
      ...item,
      children: item.children?.map((child) => resolveItem(child, path)),
      leadingIcon: item.leadingIcon ? resolveNamedIcon(normalizeIconName(item.leadingIcon)) : undefined,
    };
  }
  return { items: props.items.map((item) => resolveItem(item, [])), byValue };
});

function branchItem(root: HTMLElement, value: string): HTMLButtonElement | undefined {
  return [...root.querySelectorAll<HTMLButtonElement>('[data-cm-menu-bar-branch]')].find(
    (element) => element.dataset.cmMenuBarBranch === value,
  );
}

function focusedItem(root: HTMLElement): HTMLElement | undefined {
  const focus = (root.getRootNode() as Document | ShadowRoot).activeElement;
  return focus instanceof HTMLElement && focus.closest('.cm-menu-bar') === root ? focus : undefined;
}

watch(openPath, (path) => {
  const root = menuRoot();
  const focus = root && focusedItem(root);
  if (!root || !focus) return;
  const value = focus.dataset.cmMenuBarBranch ?? focus.dataset.cmMenuBarValue;
  const hidden = menu.value.byValue
    .get(value ?? '')
    ?.path.slice(0, -1)
    .find((key, index) => path[index] !== key);
  // Keep focus on the first trigger whose submenu the new path will hide.
  if (hidden !== undefined) branchItem(root, hidden)?.focus();
});

function onSelect(value: string): void {
  const item = menu.value.byValue.get(value)?.item;
  if (item) emit('select', item);
}

function changePath(path: string[]): void {
  cancelClose();
  if (props.openPath == null) localPath.value = path;
  emit('update:openPath', path);
  emit('openPathChange', path);
}

function onPointerOver(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') return;
  cancelClose();
  if (!openPath.value.length || !(event.target instanceof Element)) return;
  const branch = event.target.closest<HTMLButtonElement>('[data-cm-menu-bar-branch]');
  const key = branch?.dataset.cmMenuBarBranch;
  if (!key || branch.disabled || openPath.value.includes(key) || branch.closest('.cm-menu-bar') !== event.currentTarget)
    return;
  const entry = menu.value.byValue.get(key);
  if (entry) changePath(entry.path);
}

function onPointerLeave(event: PointerEvent): void {
  const path = openPath.value;
  if (event.pointerType !== 'mouse' || !path.length) return;
  cancelClose();
  closeTimer = setTimeout(() => {
    if (path === openPath.value) changePath([]);
  }, 120);
}
</script>

<template>
  <CmMenuBar
    ref="menu"
    v-bind="$attrs"
    :items="menu.items"
    :open-path="openPath"
    :submenu-target="submenuTarget"
    :model-value="props.modelValue"
    :default-value="props.defaultValue"
    :variant="props.variant"
    :aria-label="props.ariaLabel"
    :link-component="props.linkComponent"
    @update:open-path="changePath"
    @pointerover="onPointerOver"
    @pointerleave="onPointerLeave"
    @keydown="cancelClose"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @select="onSelect"
  />
</template>
