<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch, type PropType } from 'vue';

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
const trigger = ref<HTMLButtonElement>();
const localOpen = ref(resolveDisclosureOpen(props.open ?? props.defaultOpen, props.disabled));
const placement = computed(() =>
  ['bottom-start', 'bottom-end'].includes(props.placement) ? props.placement : 'bottom-start',
);
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
    setOpen(false, action.restoreFocus);
    return;
  }
  setOpen(true);
  await nextTick();
  const menu = root.value?.querySelector('.cm-dropdown__menu');
  if (!menu) return;
  const items = [
    ...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled, [aria-disabled="true"])'),
  ].filter((item) => item.closest('[role="menu"]') === menu);
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

function onDocumentClick(event: MouseEvent): void {
  if (event.target instanceof Node && !root.value?.contains(event.target)) setOpen(false);
}

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));

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
    <button
      :id="`${props.id}-trigger`"
      ref="trigger"
      class="cm-dropdown__trigger"
      type="button"
      aria-haspopup="menu"
      :aria-label="slots.trigger ? props.label : undefined"
      :aria-controls="`${props.id}-menu`"
      :aria-expanded="localOpen"
      :disabled="props.disabled || undefined"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" :open="localOpen" :disabled="props.disabled" :toggle="toggle">{{ props.label }}</slot>
    </button>
    <CmMenu
      :id="`${props.id}-menu`"
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
  </div>
</template>
