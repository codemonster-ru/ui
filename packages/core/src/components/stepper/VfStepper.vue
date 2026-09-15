<script setup lang="ts">
import { computed, ref, useAttrs, watch, type CSSProperties } from 'vue';
import {
  resolveStepperActiveValue,
  resolveStepperClasses,
  resolveStepperFallbackValue,
  resolveStepperRootStyle,
  resolveStepperStepState,
} from '@codemonster-ru/vueforge-shared-core';
import { cx } from '@/utils/classes';
import type { VfStepperContentPosition, VfStepperItem, VfStepperOrientation } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfStepperProps {
  items: VfStepperItem[];
  modelValue?: string;
  defaultValue?: string;
  orientation?: VfStepperOrientation;
  contentPosition?: VfStepperContentPosition;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<VfStepperProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  orientation: 'horizontal',
  contentPosition: undefined,
  ariaLabel: 'Progress',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const attrs = useAttrs();
const rootClasses = computed(() =>
  cx(...resolveStepperClasses(props.orientation, props.contentPosition), attrs.class as string | undefined),
);
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class')));

const fallbackValue = computed(() => resolveStepperFallbackValue(props.items));
const internalValue = ref(props.defaultValue ?? fallbackValue.value);
const isControlled = computed(() => props.modelValue !== undefined);
const activeValue = computed(() => resolveStepperActiveValue(props.modelValue, internalValue.value, props.items));
// A plain object handed to Vue's serialisers, as the reference's was: the
// count always, the factor for two or more items, in that order.
const rootStyle = computed<CSSProperties>(() =>
  Object.fromEntries(resolveStepperRootStyle(props.items, activeValue.value)),
);

watch(
  () => props.items,
  (items) => {
    const hasActiveItem = items.some((item) => item.value === activeValue.value && !item.disabled);

    if (!hasActiveItem && fallbackValue.value) {
      setActiveValue(fallbackValue.value);
    }
  },
  { deep: true },
);

function setActiveValue(value: string) {
  if (!isControlled.value) {
    internalValue.value = value;
  }

  emit('update:modelValue', value);
  emit('change', value);
}

function activateStep(item: VfStepperItem) {
  if (!item.disabled && item.value !== activeValue.value) {
    setActiveValue(item.value);
  }
}

function getEnabledItems() {
  return props.items.filter((item) => !item.disabled);
}

function focusStepByValue(value: string) {
  const element = document.querySelector<HTMLElement>(`[data-vf-stepper-value="${value}"]`);
  element?.focus();
}

function handleKeydown(event: KeyboardEvent, currentItem: VfStepperItem) {
  const enabledItems = getEnabledItems();
  const currentIndex = enabledItems.findIndex((item) => item.value === currentItem.value);

  if (currentIndex === -1) {
    return;
  }

  const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
  const previousKey = props.orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

  if (event.key === nextKey) {
    event.preventDefault();
    const nextItem = enabledItems[(currentIndex + 1) % enabledItems.length];
    activateStep(nextItem);
    focusStepByValue(nextItem.value);
    return;
  }

  if (event.key === previousKey) {
    event.preventDefault();
    const previousItem = enabledItems[(currentIndex - 1 + enabledItems.length) % enabledItems.length];
    activateStep(previousItem);
    focusStepByValue(previousItem.value);
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    const firstItem = enabledItems[0];
    activateStep(firstItem);
    focusStepByValue(firstItem.value);
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    const lastItem = enabledItems[enabledItems.length - 1];
    activateStep(lastItem);
    focusStepByValue(lastItem.value);
  }
}

function stepState(item: VfStepperItem) {
  return resolveStepperStepState(props.items, activeValue.value, item);
}
</script>

<template>
  <nav :class="rootClasses" :style="rootStyle" :aria-label="props.ariaLabel" v-bind="rootAttrs">
    <ol class="vf-stepper__list">
      <li
        v-for="(item, index) in props.items"
        :key="item.value"
        class="vf-stepper__item"
        :class="`vf-stepper__item--${stepState(item)}`"
      >
        <button
          type="button"
          class="vf-stepper__trigger"
          :class="stepState(item) === 'current' && 'vf-stepper__trigger--current'"
          :data-vf-stepper-value="item.value"
          :disabled="item.disabled"
          :aria-current="stepState(item) === 'current' ? 'step' : undefined"
          @click="activateStep(item)"
          @keydown="handleKeydown($event, item)"
        >
          <span class="vf-stepper__rail" aria-hidden="true">
            <span class="vf-stepper__connector vf-stepper__connector--before" />
            <span class="vf-stepper__marker">
              {{ index + 1 }}
            </span>
            <span class="vf-stepper__connector vf-stepper__connector--after" />
          </span>

          <span class="vf-stepper__content">
            <span class="vf-stepper__label">{{ item.label }}</span>
            <span v-if="item.description" class="vf-stepper__description">{{ item.description }}</span>
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>
