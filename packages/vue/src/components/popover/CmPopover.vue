<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmPopoverPlacement } from './popover.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  open: Boolean,
  disabled: Boolean,
  placement: {
    type: String as PropType<CmPopoverPlacement>,
    default: 'bottom-start',
    validator: (value: string) => ['top', 'bottom-start', 'bottom-end'].includes(value),
  },
});
const emit = defineEmits<{ openChange: [open: boolean]; 'update:open': [open: boolean] }>();
const attrs = useAttrs();
const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const panel = ref<HTMLElement>();
const localOpen = ref(props.open && !props.disabled);
if (!props.id.trim() || !props.label.trim()) throw new TypeError('Popover id and label must be non-empty strings.');
const placement = computed(() =>
  ['top', 'bottom-start', 'bottom-end'].includes(props.placement) ? props.placement : 'bottom-start',
);
const classes = computed(() =>
  mergeCmClasses(
    'cm-popover',
    placement.value === 'bottom-start' ? undefined : `cm-popover--${placement.value}`,
    localOpen.value ? 'cm-popover--open' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['data-cm-controller']));
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

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && localOpen.value) {
    event.preventDefault();
    setOpen(false, true);
  } else if (event.target === trigger.value && event.key === 'ArrowDown' && !props.disabled) {
    event.preventDefault();
    setOpen(true);
    panel.value
      ?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      ?.focus();
  }
}

function onDocumentClick(event: MouseEvent): void {
  if (event.target instanceof Node && !root.value?.contains(event.target)) setOpen(false);
}

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));
</script>

<template>
  <div ref="root" v-bind="rootAttrs" :class="classes" data-cm-controller="popover" @keydown="onKeydown">
    <button
      :id="`${props.id}-trigger`"
      ref="trigger"
      class="cm-popover__trigger"
      type="button"
      :aria-label="props.label"
      :aria-expanded="localOpen"
      :aria-controls="`${props.id}-panel`"
      :disabled="props.disabled || undefined"
      @click="setOpen(!localOpen)"
    >
      <slot name="trigger" :open="localOpen" :toggle="() => setOpen(!localOpen)">{{ props.label }}</slot>
    </button>
    <div
      :id="`${props.id}-panel`"
      ref="panel"
      class="cm-popover__panel"
      role="dialog"
      :aria-labelledby="`${props.id}-trigger`"
      :hidden="!localOpen"
    >
      <slot />
    </div>
  </div>
</template>
