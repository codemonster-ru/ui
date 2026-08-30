<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { cmFocusableSelector, popoverKeyAction, resolveDisclosureOpen } from '@codemonster-ru/ui-runtime/core';
import { assertCm } from '../../internal/warn';
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
const localOpen = ref(resolveDisclosureOpen(props.open, props.disabled));
assertCm(props.id.trim() !== '' && props.label.trim() !== '', 'Popover id and label must be non-empty strings.');
const placement = computed(() =>
  ['top', 'bottom-start', 'bottom-end'].includes(props.placement) ? props.placement : 'bottom-start',
);
const classes = computed(() =>
  mergeCmClasses(
    'cm-popover',
    placement.value === 'bottom-start' ? undefined : `cm-popover--${placement.value}`,
    localOpen.value ? 'cm-popover--open' : undefined,
    attrs.class,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['data-cm-controller']));
watch(
  () => [props.open, props.disabled] as const,
  ([open, disabled]) => (localOpen.value = resolveDisclosureOpen(open, disabled)),
);

function setOpen(open: boolean, restoreFocus = false): void {
  const next = resolveDisclosureOpen(open, props.disabled);
  if (localOpen.value === next) return;
  localOpen.value = next;
  emit('update:open', next);
  emit('openChange', next);
  if (restoreFocus) trigger.value?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  const action = popoverKeyAction(event.key, {
    disabled: props.disabled,
    onTrigger: event.target === trigger.value,
    open: localOpen.value,
  });
  if (!action) return;

  event.preventDefault();
  if (action.type === 'close') {
    setOpen(false, action.restoreFocus);
    return;
  }
  setOpen(true);
  if (action.focus === 'first') panel.value?.querySelector<HTMLElement>(cmFocusableSelector)?.focus();
}

function onDocumentClick(event: MouseEvent): void {
  if (event.target instanceof Node && !root.value?.contains(event.target)) setOpen(false);
}

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));

useCmHydrated();
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
