<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmTooltipDelay, CmTooltipPlacement } from './tooltip.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  content: { type: String, required: true },
  defaultVisible: Boolean,
  placement: {
    type: String as PropType<CmTooltipPlacement>,
    default: 'top',
    validator: (value: string) => ['top', 'bottom', 'start', 'end'].includes(value),
  },
  delay: {
    type: String as PropType<CmTooltipDelay>,
    default: 'short',
    validator: (value: string) => ['none', 'short', 'long'].includes(value),
  },
});
const attrs = useAttrs();
const visible = ref(props.defaultVisible);
let timer: ReturnType<typeof setTimeout> | undefined;
if (![props.id, props.label, props.content].every((value) => value.trim())) {
  throw new TypeError('Tooltip id, label, and content must be non-empty strings.');
}
const placement = computed(() =>
  ['top', 'bottom', 'start', 'end'].includes(props.placement) ? props.placement : 'top',
);
const delay = computed(() => (['none', 'short', 'long'].includes(props.delay) ? props.delay : 'short'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-tooltip',
    `cm-tooltip--${placement.value}`,
    `cm-tooltip--delay-${delay.value}`,
    visible.value ? 'cm-tooltip--visible' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['data-cm-controller']));

function clearTimer(): void {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
}

function show(): void {
  clearTimer();
  const milliseconds = delay.value === 'none' ? 0 : delay.value === 'long' ? 700 : 300;
  timer = setTimeout(() => (visible.value = true), milliseconds);
}

function hide(): void {
  clearTimer();
  visible.value = false;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    hide();
  }
}

onBeforeUnmount(clearTimer);
</script>

<template>
  <span v-bind="rootAttrs" :class="classes" data-cm-controller="tooltip">
    <button
      class="cm-tooltip__trigger"
      type="button"
      :aria-label="props.label"
      :aria-describedby="`${props.id}-tooltip`"
      @focus="show"
      @blur="hide"
      @pointerenter="show"
      @pointerleave="hide"
      @keydown="onKeydown"
    >
      <slot name="trigger">{{ props.label }}</slot>
    </button>
    <span :id="`${props.id}-tooltip`" class="cm-tooltip__content" role="tooltip" :hidden="!visible">
      <slot name="content">{{ props.content }}</slot>
    </span>
  </span>
</template>
