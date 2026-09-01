<script setup lang="ts">
import { computed, ref, useAttrs, watch, type PropType } from 'vue';

import {
  nextStepperValue,
  resolveStepperProgress,
  resolveStepperValue,
  resolveStepState,
} from '@codemonster-ru/ui-runtime/core';
import { useCmHydrated } from '../../internal/hydration';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import type { CmStepperContentPosition, CmStepperItem, CmStepperOrientation } from './stepper.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array as PropType<readonly CmStepperItem[]>, required: true },
  value: { type: String as PropType<string | null>, default: null },
  orientation: {
    type: String as PropType<CmStepperOrientation>,
    default: 'horizontal',
    validator: (value: string) => ['horizontal', 'vertical'].includes(value),
  },
  contentPosition: {
    type: String as PropType<CmStepperContentPosition>,
    default: 'bottom',
    validator: (value: string) => ['bottom', 'inline'].includes(value),
  },
  ariaLabel: { type: String, default: 'Progress' },
});
const emit = defineEmits<{ valueChange: [value: string]; 'update:value': [value: string] }>();
const attrs = useAttrs();
const root = ref<HTMLElement>();

const localValue = ref<string | null>(props.value);
watch(
  () => props.value,
  (value) => (localValue.value = value),
);

const orientation = computed(() => (props.orientation === 'vertical' ? 'vertical' : 'horizontal'));
const contentPosition = computed(() => (props.contentPosition === 'inline' ? 'inline' : 'bottom'));
const activeValue = computed(() => resolveStepperValue(props.items, localValue.value));
const progress = computed(() => resolveStepperProgress(props.items, activeValue.value));

const classes = computed(() =>
  mergeCmClasses(
    'cm-stepper',
    orientation.value === 'horizontal' ? undefined : `cm-stepper--${orientation.value}`,
    contentPosition.value === 'bottom' ? undefined : `cm-stepper--content-${contentPosition.value}`,
    attrs.class,
  ),
);
const rootStyle = computed(() => {
  const style: Record<string, string> = { '--cm-stepper-item-count': String(props.items.length) };
  if (progress.value !== null) style['--cm-stepper-progress-factor'] = String(progress.value);
  return style;
});
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'style', 'aria-label', 'data-cm-controller']));

function stepState(item: CmStepperItem): string {
  return resolveStepState(props.items, activeValue.value, item.value);
}

function activate(item: CmStepperItem): void {
  if (item.disabled || item.value === activeValue.value) return;
  localValue.value = item.value;
  emit('update:value', item.value);
  emit('valueChange', item.value);
}

function onKeydown(event: KeyboardEvent, item: CmStepperItem): void {
  const nextValue = nextStepperValue(props.items, item.value, event.key, orientation.value);
  if (nextValue === null) return;

  event.preventDefault();
  const next = props.items.find((candidate) => candidate.value === nextValue);
  if (next) activate(next);
  root.value?.querySelector<HTMLElement>(`[data-cm-stepper-value="${nextValue}"]`)?.focus();
}

useCmHydrated();
</script>

<template>
  <nav
    ref="root"
    v-bind="rootAttrs"
    :class="classes"
    :style="rootStyle"
    :aria-label="props.ariaLabel"
    data-cm-controller="stepper"
  >
    <ol class="cm-stepper__list">
      <li
        v-for="(item, index) in props.items"
        :key="item.value"
        class="cm-stepper__item"
        :class="`cm-stepper__item--${stepState(item)}`"
      >
        <button
          class="cm-stepper__trigger"
          :class="stepState(item) === 'current' ? 'cm-stepper__trigger--current' : undefined"
          type="button"
          :data-cm-stepper-value="item.value"
          :disabled="item.disabled || undefined"
          :aria-current="stepState(item) === 'current' ? 'step' : undefined"
          @click="activate(item)"
          @keydown="onKeydown($event, item)"
        >
          <span class="cm-stepper__rail" aria-hidden="true">
            <span class="cm-stepper__connector cm-stepper__connector--before"></span>
            <span class="cm-stepper__marker">{{ index + 1 }}</span>
            <span class="cm-stepper__connector cm-stepper__connector--after"></span>
          </span>
          <span class="cm-stepper__content"
            ><span class="cm-stepper__label">{{ item.label }}</span
            ><span v-if="item.description" class="cm-stepper__description">{{ item.description }}</span></span
          >
        </button>
      </li>
    </ol>
  </nav>
</template>
