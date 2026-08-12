<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import CmMenu from '../menu/CmMenu.vue';
import type { CmMenuItem } from '../menu/menu.types';
import type { CmDropdownPlacement } from './dropdown.types';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  items: { type: Array as PropType<readonly CmMenuItem[]>, required: true },
  open: Boolean,
  disabled: Boolean,
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
const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const localOpen = ref(props.open && !props.disabled);
const placement = computed(() =>
  ['bottom-start', 'bottom-end'].includes(props.placement) ? props.placement : 'bottom-start',
);
const classes = computed(() =>
  mergeCmClasses(
    'cm-dropdown',
    placement.value === 'bottom-end' ? 'cm-dropdown--bottom-end' : undefined,
    localOpen.value ? 'cm-dropdown--open' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['data-cm-controller']));

if (!props.id.trim() || !props.label.trim()) throw new TypeError('Dropdown id and label must be non-empty strings.');

watch(
  () => [props.open, props.disabled] as const,
  ([open, disabled]) => (localOpen.value = open && !disabled),
);

function setOpen(open: boolean, restoreFocus = false): void {
  const next = open && !props.disabled;
  if (localOpen.value === next) return;
  localOpen.value = next;
  emit('update:open', next);
  emit('openChange', next);
  if (restoreFocus) trigger.value?.focus();
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (props.disabled || !['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  setOpen(true);
  const items = root.value?.querySelectorAll<HTMLElement>(
    '[data-cm-menu-item]:not([disabled]):not([aria-disabled="true"])',
  );
  const item = event.key === 'ArrowUp' ? items?.[items.length - 1] : items?.[0];
  item?.focus();
}

function onSelect(value: string): void {
  emit('select', value);
  setOpen(false, true);
}

function onDocumentClick(event: MouseEvent): void {
  if (event.target instanceof Node && !root.value?.contains(event.target)) setOpen(false);
}

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));
</script>

<template>
  <div ref="root" v-bind="rootAttrs" :class="classes" data-cm-controller="dropdown">
    <button
      :id="`${props.id}-trigger`"
      ref="trigger"
      class="cm-dropdown__trigger"
      type="button"
      aria-haspopup="menu"
      :aria-controls="`${props.id}-menu`"
      :aria-expanded="localOpen"
      :disabled="props.disabled || undefined"
      @click="setOpen(!localOpen)"
      @keydown="onTriggerKeydown"
    >
      {{ props.label }}
    </button>
    <CmMenu
      :id="`${props.id}-menu`"
      class="cm-dropdown__menu"
      :items="props.items"
      :aria-labelledby="`${props.id}-trigger`"
      :hidden="!localOpen"
      @select="onSelect"
      @close-request="setOpen(false, true)"
    />
  </div>
</template>
