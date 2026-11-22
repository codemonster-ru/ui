<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch, watchEffect, type Component, type PropType } from 'vue';

import { focusCmModalMenuBarFallback, observeCmModalMenuBarAnchor } from '@codemonster-ru/ui-runtime/anchored-position';
import { menuBarKeyAction } from '@codemonster-ru/ui-runtime/core';
import { useCmHydrated } from '../../internal/hydration';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import CmMenuBarNode from './CmMenuBarNode.vue';
import type { CmMenuBarItem, CmMenuBarVariant } from './menu-bar.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array as PropType<readonly CmMenuBarItem[]>, required: true },
  openPath: { type: Array as PropType<readonly string[] | null>, default: null },
  submenuTarget: { type: Object as PropType<HTMLElement>, default: undefined },
  listId: { type: String, default: undefined },
  modelValue: { type: String as PropType<string | null>, default: undefined },
  defaultValue: { type: String as PropType<string | null>, default: null },
  variant: {
    type: String as PropType<CmMenuBarVariant>,
    default: 'default',
    validator: (value: string) => ['default', 'pills'].includes(value),
  },
  ariaLabel: { type: String, default: 'Main menu' },
  linkComponent: { type: [String, Object, Function] as PropType<string | Component>, default: undefined },
});
const emit = defineEmits<{
  select: [value: string];
  openPathChange: [values: string[]];
  'update:openPath': [values: string[]];
  'update:modelValue': [value: string];
  change: [value: string];
}>();
const attrs = useAttrs();
const menu = useTemplateRef<HTMLElement>('menu');
const itemSelector = '[data-cm-menu-bar-branch], [data-cm-menu-bar-value]';
const selected = ref(props.defaultValue);
const activeValue = computed(() => (props.modelValue === undefined ? selected.value : props.modelValue));
const focusedValue = ref<string | null>(null);
const clippedTabStop = ref<string>();
const pendingFocus = ref<{ branch: string; edge: 'first' | 'last' } | null>(null);
let dismissingHiddenAnchor = false;

const localPath = ref<string[]>([]);
watchEffect(() => {
  if (props.openPath) localPath.value = [...props.openPath];
});

const openPath = computed(() => props.openPath ?? localPath.value);
const classes = computed(() =>
  mergeCmClasses('cm-menu-bar', props.variant === 'pills' && 'cm-menu-bar--pills', attrs.class),
);
const rootAttrs = () => omitCmOwnedAttrs(attrs, ['class', 'aria-label', 'data-cm-controller']);

const menuItems = computed(() => {
  const ancestors = new Map<string, string[]>();
  let first: string | null = null;
  function collect(items: readonly CmMenuBarItem[], parents: string[]): void {
    for (const item of items) {
      const group = item.kind === 'group';
      if (!parents.length && !group && !item.disabled) first ??= item.value;
      ancestors.set(item.value, parents);
      if (item.children) collect(item.children, group ? parents : [...parents, item.value]);
    }
  }
  collect(props.items, []);
  return { ancestors, first };
});
const tabbableValue = computed(() => {
  const value = focusedValue.value ?? menuItems.value.first;
  return value === clippedTabStop.value ? null : value;
});

function ancestorsOf(value: string): string[] {
  return menuItems.value.ancestors.get(value) ?? [];
}

// A menu bar shows one path at a time, so opening a branch replaces the path rather than adding to
// it: the ancestors take it there, and the branch itself ends it.
function setOpenPath(next: string[]): void {
  if (props.openPath === null) localPath.value = next;
  emit('update:openPath', next);
  emit('openPathChange', next);
}

watchEffect((onCleanup) => {
  const root = menu.value;
  if (!root || openPath.value.length === 0) return;
  const disconnectOutside = (event: MouseEvent) => {
    if (openPath.value.length && !event.composedPath().includes(root)) setOpenPath([]);
  };
  root.ownerDocument.addEventListener('click', disconnectOutside);
  onCleanup(() => root.ownerDocument.removeEventListener('click', disconnectOutside));
});

function onToggle(value: string): void {
  pendingFocus.value = null;
  const ancestors = ancestorsOf(value);
  setOpenPath(openPath.value.includes(value) ? ancestors : [...ancestors, value]);
}

function onSelect(value: string): void {
  if (props.modelValue === undefined) selected.value = value;
  emit('update:modelValue', value);
  emit('change', value);
  emit('select', value);
  const focused = menu.value?.ownerDocument.activeElement;
  if (
    focused instanceof HTMLElement &&
    focused.closest('.cm-menu-bar') === menu.value &&
    itemValue(focused) === value
  ) {
    topItem(focused)?.focus();
  }
  pendingFocus.value = null;
  setOpenPath([]);
}

function itemValue(item: HTMLElement): string {
  return item.dataset.cmMenuBarBranch ?? item.dataset.cmMenuBarValue ?? '';
}

function enabledItems(list: Element | null | undefined): HTMLElement[] {
  if (!list) return [];
  return [...list.querySelectorAll<HTMLElement>(`:scope > li > :is(${itemSelector}, [role="group"])`)].flatMap(
    (item) =>
      item.matches('[role="group"]')
        ? enabledItems(item)
        : item.matches(':disabled, [aria-disabled="true"]')
          ? []
          : [item],
  );
}

function owningList(item: Element): Element | null {
  return item.closest('[role="menubar"], [role="menu"]');
}

function eventItem(event: Event): HTMLElement | null {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>(itemSelector) : null;
  return target?.closest('.cm-menu-bar') === menu.value && !target?.matches(':disabled, [aria-disabled="true"]')
    ? target
    : null;
}

function branchItem(value: string): HTMLElement | undefined {
  return [...(menu.value?.querySelectorAll<HTMLElement>('[data-cm-menu-bar-branch]') ?? [])].find(
    (entry) => itemValue(entry) === value,
  );
}

function topItem(item: HTMLElement): HTMLElement | undefined {
  const top = ancestorsOf(itemValue(item))[0];
  return top === undefined ? item : branchItem(top);
}

watch(
  [menu, () => openPath.value[0]],
  ([root, value], _, onCleanup) => {
    const branch = value === undefined ? undefined : branchItem(value);
    if (!root || !branch) return;
    const stop = observeCmModalMenuBarAnchor(branch, () => {
      clippedTabStop.value = value;
      const focused = (root.getRootNode() as Document | ShadowRoot).activeElement;
      if (
        focused === branch ||
        (focused instanceof HTMLElement && root.contains(focused) && ancestorsOf(itemValue(focused))[0] === value)
      ) {
        dismissingHiddenAnchor = true;
        focusCmModalMenuBarFallback(branch, enabledItems(root.firstElementChild));
        dismissingHiddenAnchor = false;
      }
      pendingFocus.value = null;
      setOpenPath([]);
    });
    if (stop) onCleanup(stop);
  },
  { flush: 'post' },
);

watch(
  clippedTabStop,
  (value, _, onCleanup) => {
    const branch = value === undefined ? undefined : branchItem(value);
    if (!branch) return;
    const stop = observeCmModalMenuBarAnchor(branch, undefined, () => {
      clippedTabStop.value = undefined;
    });
    if (stop) onCleanup(stop);
  },
  { flush: 'post' },
);

watch(openPath, (path) => {
  const root = menu.value;
  const focused = (root?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement;
  if (!(focused instanceof HTMLElement) || focused.closest('.cm-menu-bar') !== root) return;
  const hidden = ancestorsOf(itemValue(focused)).find((value, index) => path[index] !== value);
  if (hidden !== undefined) branchItem(hidden)?.focus();
});

watch(
  [openPath, pendingFocus],
  ([path, request]) => {
    if (!request || !path.includes(request.branch)) return;
    pendingFocus.value = null;
    const branch = branchItem(request.branch);
    if (!branch) return;
    const id = branch.getAttribute('aria-controls');
    const panel = id ? (branch.getRootNode() as Document | ShadowRoot).getElementById(id) : branch.nextElementSibling;
    if (!panel) return;
    const entries = enabledItems(panel);
    const preventScroll = panel.ownerDocument.defaultView?.getComputedStyle(panel).position !== 'static';
    (request.edge === 'last' ? entries[entries.length - 1] : entries[0])?.focus({ preventScroll });
  },
  { flush: 'post' },
);

function onFocusIn(event: FocusEvent): void {
  const item = eventItem(event);
  if (item) focusedValue.value = itemValue(item);
}

function onFocusOut(event: FocusEvent): void {
  if (event.relatedTarget instanceof Node && menu.value?.contains(event.relatedTarget)) return;
  pendingFocus.value = null;
  const item = eventItem(event);
  const top = item && topItem(item);
  focusedValue.value = top ? itemValue(top) : null;
  if (!dismissingHiddenAnchor && openPath.value.length) setOpenPath([]);
}

function onKeydown(event: KeyboardEvent): void {
  const item = eventItem(event);
  if (!item || event.defaultPrevented || (event.key === 'Escape' && openPath.value.length === 0)) return;
  const list = owningList(item);
  const siblings = enabledItems(list);
  const direction = item.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl' ? 'rtl' : 'ltr';
  const action = menuBarKeyAction(event.key, {
    direction,
    isBranch: item.hasAttribute('data-cm-menu-bar-branch'),
    isOpen: item.getAttribute('aria-expanded') === 'true',
    isTopLevel: list?.getAttribute('role') === 'menubar',
  });
  if (!action) return;

  event.preventDefault();
  pendingFocus.value = null;
  const value = itemValue(item);
  const ancestors = ancestorsOf(value);
  switch (action.type) {
    case 'close-all':
      setOpenPath([]);
      topItem(item)?.focus();
      return;
    case 'collapse':
      setOpenPath(ancestors);
      return;
    case 'close-to-parent':
      setOpenPath(ancestors.slice(0, -1));
      branchItem(ancestors[ancestors.length - 1])?.focus();
      return;
    case 'open':
      pendingFocus.value = { branch: value, edge: action.focus };
      setOpenPath([...ancestors, value]);
      return;
    case 'focus-sibling':
      siblings[(siblings.indexOf(item) + action.delta + siblings.length) % siblings.length]?.focus();
      return;
    case 'focus-edge':
      (action.edge === 'first' ? siblings[0] : siblings[siblings.length - 1])?.focus();
      return;
    case 'move-top-level': {
      const entries = enabledItems(menu.value?.firstElementChild);
      const from = topItem(item);
      const index = from ? entries.indexOf(from) : -1;
      if (index < 0) return;
      const next = entries[(index + action.delta + entries.length) % entries.length];
      setOpenPath(openPath.value.length && next.hasAttribute('data-cm-menu-bar-branch') ? [itemValue(next)] : []);
      next.focus();
      return;
    }
  }
}

useCmHydrated();
</script>

<template>
  <nav
    ref="menu"
    v-bind="rootAttrs()"
    :class="classes"
    :aria-label="props.ariaLabel"
    data-cm-controller="menu-bar"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @keydown="onKeydown"
  >
    <ul :id="props.listId" class="cm-menu-bar__list" role="menubar">
      <CmMenuBarNode
        v-for="item in props.items"
        :key="item.value"
        :item="item"
        :depth="0"
        :open-path="openPath"
        :active-value="activeValue"
        :active-branch="props.submenuTarget && activeValue ? ancestorsOf(activeValue)[0] : undefined"
        :tabbable-value="tabbableValue"
        :link-component="props.linkComponent"
        :submenu-target="props.submenuTarget"
        @toggle="onToggle"
        @select="onSelect"
      >
        <template v-for="name in Object.keys($slots)" #[name]="scope">
          <slot :name="name" v-bind="scope" />
        </template>
      </CmMenuBarNode>
    </ul>
    <slot name="scrollControls" />
  </nav>
</template>
