<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, useAttrs, watch, type ComponentPublicInstance, type PropType } from 'vue';

import { observeCmAnchoredPosition, type CmAnchoredStyle } from '../../internal/anchored-position';
import { authoredTriggerElement, CmAuthoredTrigger, disclosureTriggerActions } from '../../internal/disclosure-trigger';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { dropdownKeyAction, resolveDisclosureOpen } from '@codemonster-ru/ui-runtime/core';
import { assertCm } from '../../internal/warn';
import CmMenu from '../menu/CmMenu.vue';
import type { CmMenuItem } from '../menu/menu.types';
import type {
  CmDropdownContentScope,
  CmDropdownPlacement,
  CmDropdownTriggerScope,
  CmDropdownVariant,
} from './dropdown.types';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  items: { type: Array as PropType<readonly CmMenuItem[]>, default: () => [] },
  open: { type: Boolean, default: undefined },
  defaultOpen: Boolean,
  disabled: Boolean,
  closeOnSelect: { type: Boolean, default: true },
  variant: {
    type: String as PropType<CmDropdownVariant>,
    default: 'default',
    validator: (value: string) => ['default', 'pills'].includes(value),
  },
  placement: {
    type: String as PropType<CmDropdownPlacement>,
    default: 'bottom-start',
    validator: (value: string) => ['bottom-start', 'bottom-end'].includes(value),
  },
  teleportTo: { type: [String, Object, Boolean] as PropType<string | HTMLElement | null | false>, default: null },
  disableTeleport: Boolean,
  triggerAsChild: Boolean,
});
const emit = defineEmits<{
  openChange: [open: boolean];
  select: [value: string];
  'update:open': [open: boolean];
}>();
const attrs = useAttrs();
const slots = defineSlots<{
  trigger?: (scope: CmDropdownTriggerScope) => unknown;
  default?: (scope: CmDropdownContentScope) => unknown;
}>();
const root = ref<HTMLElement>();
const trigger = ref<HTMLElement>();
const menu = shallowRef<ComponentPublicInstance>();
const menuElement = computed(() => {
  const element: unknown = menu.value?.$el;
  return typeof HTMLElement !== 'undefined' && element instanceof HTMLElement ? element : undefined;
});
const coordinates = shallowRef<CmAnchoredStyle>();
const portalWidth = ref(0);
const localOpen = ref(resolveDisclosureOpen(props.open ?? props.defaultOpen, props.disabled));
const placement = computed(() =>
  ['bottom-start', 'bottom-end'].includes(props.placement) ? props.placement : 'bottom-start',
);
const teleportTarget = computed(() => {
  const anchor = trigger.value;
  const requested = props.teleportTo;
  if (!localOpen.value || props.disableTeleport || !requested || !anchor) return null;
  try {
    const target =
      typeof requested === 'string'
        ? ((requested === 'body' ? anchor.closest('dialog') : null) ?? anchor.ownerDocument.querySelector(requested))
        : requested;
    return target?.isConnected && !root.value?.contains(target) ? target : null;
  } catch {
    return null;
  }
});
const menuAttrs = computed(() => ({
  ...(teleportTarget.value && props.variant === 'pills' ? { 'data-cm-dropdown-menu-variant': 'pills' } : {}),
  ...(teleportTarget.value
    ? {
        style: {
          ...coordinates.value,
          position: 'fixed',
          minWidth: `max(${portalWidth.value}px, var(--cm-space-16) * 3)`,
        },
      }
    : coordinates.value
      ? { style: coordinates.value }
      : {}),
}));
const classes = computed(() =>
  mergeCmClasses(
    'cm-dropdown',
    placement.value === 'bottom-end' ? 'cm-dropdown--bottom-end' : undefined,
    props.variant === 'pills' ? 'cm-dropdown--pills' : undefined,
    localOpen.value ? 'cm-dropdown--open' : undefined,
    attrs.class,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['data-cm-controller', 'data-cm-dropdown-close-on-select']));

assertCm(props.id.trim() !== '' && props.label.trim() !== '', 'Dropdown id and label must be non-empty strings.');

watch(
  () => [props.open, props.disabled] as const,
  ([open, disabled]) => (localOpen.value = resolveDisclosureOpen(open ?? localOpen.value, disabled)),
);

function setOpen(open: boolean, restoreFocus = false): void {
  const next = resolveDisclosureOpen(open, props.disabled);
  if (localOpen.value === next) return;
  localOpen.value = next;
  emit('update:open', next);
  emit('openChange', next);
  if (restoreFocus) trigger.value?.focus();
}

async function onTriggerKeydown(event: KeyboardEvent): Promise<void> {
  const action = dropdownKeyAction(event.key, {
    disabled: props.disabled,
    onTrigger: true,
    open: localOpen.value,
  });
  if (!action) return;

  event.preventDefault();
  if (action.type === 'close') {
    event.stopPropagation();
    setOpen(false, action.restoreFocus);
    return;
  }
  setOpen(true);
  await nextTick();
  const panel = menuElement.value;
  if (!panel) return;
  const items = [
    ...panel.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled, [aria-disabled="true"])'),
  ].filter((item) => item.closest('[role="menu"]') === panel);
  const index = action.focus === 'last' ? items.length - 1 : 0;
  items[index]?.focus();
}

function onSelect(value: string): void {
  emit('select', value);
  if (props.closeOnSelect) close();
}

function onContentClick(event: MouseEvent): void {
  if (!slots.default || event.defaultPrevented || !(event.target instanceof Element)) return;
  const item = event.target.closest<HTMLElement>('[role="menuitem"]');
  if (
    !item ||
    item.closest('[role="menu"]') !== event.currentTarget ||
    item.matches(':disabled, [aria-disabled="true"]')
  )
    return;
  const value = item.dataset.cmMenuValue;
  if (value) onSelect(value);
  else if (props.closeOnSelect) close();
}

function close(): void {
  setOpen(false, true);
}

function toggle(event?: MouseEvent): void {
  if (event?.defaultPrevented) return;
  event?.preventDefault();
  setOpen(!localOpen.value);
}

const { activate, toggleFromSlot } = disclosureTriggerActions(toggle);
function captureTrigger(element: Element | ComponentPublicInstance | null): void {
  trigger.value = authoredTriggerElement(element);
}

function onDocumentClick(event: MouseEvent): void {
  const view = trigger.value?.ownerDocument.defaultView;
  if (
    view &&
    event.target instanceof view.Node &&
    !root.value?.contains(event.target) &&
    !menuElement.value?.contains(event.target)
  )
    setOpen(false);
}

watch(
  [localOpen, teleportTarget, placement, trigger, menuElement],
  ([open, target, placement, anchor, panel], _, onCleanup) => {
    if (!open || !anchor || !panel) return;
    const document = anchor.ownerDocument;
    const stop = observeCmAnchoredPosition(anchor, panel, placement, 10, target ? null : root.value, (style) => {
      if (target) portalWidth.value = anchor.offsetWidth;
      coordinates.value = style;
    });
    document.addEventListener('click', onDocumentClick);
    onCleanup(() => {
      stop();
      coordinates.value = undefined;
      document.removeEventListener('click', onDocumentClick);
    });
  },
  { flush: 'post' },
);

useCmHydrated();
</script>

<template>
  <div
    ref="root"
    v-bind="rootAttrs"
    :class="classes"
    data-cm-controller="dropdown"
    :data-cm-dropdown-close-on-select="props.closeOnSelect ? undefined : 'false'"
  >
    <CmAuthoredTrigger
      v-if="props.triggerAsChild && slots.trigger"
      :id="`${props.id}-trigger`"
      :panel-id="`${props.id}-menu`"
      :label="props.label"
      :open="localOpen"
      :disabled="props.disabled"
      :capture="captureTrigger"
      :activate="activate"
      :on-trigger-keydown="onTriggerKeydown"
      trigger-class="cm-dropdown__trigger"
      popup="menu"
    >
      <slot name="trigger" :open="localOpen" :disabled="props.disabled" :toggle="toggleFromSlot" />
    </CmAuthoredTrigger>
    <button
      v-else
      :id="`${props.id}-trigger`"
      ref="trigger"
      class="cm-dropdown__trigger"
      type="button"
      aria-haspopup="menu"
      :aria-label="slots.trigger ? props.label : undefined"
      :aria-controls="`${props.id}-menu`"
      :aria-expanded="localOpen"
      :disabled="props.disabled || undefined"
      @click="activate"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" :open="localOpen" :disabled="props.disabled" :toggle="toggleFromSlot">{{
        props.label
      }}</slot>
    </button>
    <Teleport :to="teleportTarget ?? 'body'" :disabled="!teleportTarget">
      <CmMenu
        :id="`${props.id}-menu`"
        ref="menu"
        v-bind="menuAttrs"
        class="cm-dropdown__menu"
        :items="props.items"
        :aria-labelledby="`${props.id}-trigger`"
        :hidden="!localOpen"
        @select="onSelect"
        @click="onContentClick"
        @close-request="close"
      >
        <template v-if="slots.default" #default>
          <slot :open="localOpen" :close="close" />
        </template>
      </CmMenu>
    </Teleport>
  </div>
</template>
