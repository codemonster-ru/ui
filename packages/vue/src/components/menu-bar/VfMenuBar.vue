<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
  watchEffect,
  type ComponentPublicInstance,
} from 'vue';

import { afterCmFloatingExit, observeCmAnchoredPosition } from '@codemonster-ru/ui-runtime/anchored-position';
import {
  focusHorizontalEdge,
  observeHorizontalScroll,
  scrollHorizontalList,
} from '@codemonster-ru/ui-runtime/tabs-scroll';
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
const topBranch = computed(() => openPath.value[0]);
const component = useTemplateRef<ComponentPublicInstance>('menu');
const menuRoot = () => component.value?.$el as HTMLElement | undefined;
const listId = useId();
const topItems = '.cm-menu-bar__item--top';
const enabledTopItems = `${topItems}:not(:disabled,[aria-disabled="true"])`;
const scrollEdges = ref({ start: false, end: false });
const scrollButtons = [
  { edge: 'start', label: 'Scroll menu toward start' },
  { edge: 'end', label: 'Scroll menu toward end' },
] as const;
const submenuTarget = ref<HTMLElement>();
const wide = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | undefined;
const cancelClose = () => clearTimeout(closeTimer);
onBeforeUnmount(cancelClose);
onMounted(() => {
  const root = menuRoot();
  if (!root) return;
  const query = root.ownerDocument.defaultView?.matchMedia?.('(width > 640px)');
  const sync = () => (wide.value = query?.matches ?? false);
  sync();
  query?.addEventListener('change', sync);
  onBeforeUnmount(() => query?.removeEventListener('change', sync));
  const focus = focusedItem(root);
  const trigger = focus?.closest('[role="menu"]') ? branchItem(root, topBranch.value) : undefined;
  // On hydration an initially focused submenu item moves out of the scroll viewport.
  trigger?.focus();
  submenuTarget.value = root;
  if (trigger && focus)
    void nextTick(() => {
      if (focusedItem(root) === trigger && focus.isConnected) focus.focus();
    });
});
watch(
  [submenuTarget, topBranch, wide],
  ([root, value, floating], _, onCleanup) => {
    if (!root || value === undefined || !floating) return;
    const trigger = branchItem(root, value);
    const panel = (root.getRootNode() as Document | ShadowRoot).getElementById(
      trigger?.getAttribute('aria-controls') ?? '',
    );
    if (!trigger || !panel) return;
    panel.style.position = 'fixed';
    const stop = observeCmAnchoredPosition(trigger, panel, 'bottom-start', 8, null, (style) =>
      Object.assign(panel.style, style),
    );
    onCleanup(() => {
      stop();
      const reset = () => Object.assign(panel.style, { position: '', inset: '', left: '', top: '' });
      if (panel.hidden && wide.value) afterCmFloatingExit(panel, reset);
      else reset();
    });
  },
  { flush: 'post' },
);

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

const viewport = () => submenuTarget.value?.querySelector<HTMLElement>(':scope > .cm-menu-bar__list');
watch(
  [submenuTarget, menu],
  ([root], _, onCleanup) => {
    const list = viewport();
    if (!root || !list) return;
    onCleanup(
      observeHorizontalScroll(
        list,
        (edges) => {
          const edge = focusedItem(root)?.dataset.cmScrollEdge;
          if ((edge === 'start' || edge === 'end') && !edges[edge]) focusHorizontalEdge(list, edge, enabledTopItems);
          scrollEdges.value = edges;
        },
        undefined,
        topItems,
      ),
    );
  },
  { flush: 'post' },
);

function scroll(edge: 'start' | 'end', event: MouseEvent): void {
  const list = viewport();
  if (!list || !(event.currentTarget instanceof HTMLElement)) return;
  scrollHorizontalList(
    list,
    edge,
    event.currentTarget,
    enabledTopItems,
    Math.max(120, Math.round(list.clientWidth * 0.6)),
  );
}

function branchItem(root: HTMLElement, value: string): HTMLButtonElement | undefined {
  return [...root.querySelectorAll<HTMLButtonElement>('[data-cm-menu-bar-branch]')].find(
    (element) => element.dataset.cmMenuBarBranch === value,
  );
}

function focusedItem(root: HTMLElement): HTMLElement | undefined {
  const focus = (root.getRootNode() as Document | ShadowRoot).activeElement;
  return focus instanceof HTMLElement && focus.closest('.cm-menu-bar') === root ? focus : undefined;
}

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
    :list-id="listId"
    :data-cm-menu-bar-scroll="submenuTarget ? '' : undefined"
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
  >
    <template #scrollControls>
      <button
        v-for="{ edge, label } in scrollButtons"
        :key="edge"
        type="button"
        class="cm-scroll-edge"
        :data-cm-scroll-edge="edge"
        :aria-label="label"
        :aria-controls="listId"
        :hidden="!scrollEdges[edge]"
        @click="scroll(edge, $event)"
      ></button>
    </template>
  </CmMenuBar>
</template>
