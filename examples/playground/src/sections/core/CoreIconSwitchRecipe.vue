<script lang="ts">
export type CoreIconSwitchRecipeSize = 'sm' | 'md' | 'lg';
</script>

<script setup lang="ts">
import { Comment, Fragment, Text, computed, useAttrs, useSlots, type VNode } from 'vue';
import { VueIconify } from '@codemonster-ru/vueforge-icons';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    size?: CoreIconSwitchRecipeSize;
    invalid?: boolean;
    disabled?: boolean;
    label?: string;
    checkedIcon?: string;
    uncheckedIcon?: string;
  }>(),
  {
    modelValue: false,
    size: 'md',
    invalid: false,
    disabled: false,
    label: undefined,
    checkedIcon: undefined,
    uncheckedIcon: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [checked: boolean];
  change: [checked: boolean];
}>();

defineSlots<{
  default?(): unknown;
  thumb?(props: { checked: boolean }): unknown;
}>();

const attrs = useAttrs();
const slots = useSlots();
const thumbIcon = computed(() => (props.modelValue ? props.checkedIcon : props.uncheckedIcon));
const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !['class', 'style'].includes(key))),
);
const hasContent = computed(() => {
  if (props.label) return true;
  const nodes: VNode[] = slots.default?.() ?? [];

  function isRenderable(node: VNode): boolean {
    if (node.type === Comment) return false;
    if (node.type === Text) return String(node.children ?? '').trim().length > 0;
    if (node.type === Fragment && Array.isArray(node.children)) {
      return node.children.some((child) => isRenderable(child as VNode));
    }
    return true;
  }

  return nodes.some(isRenderable);
});

function updateChecked(event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  emit('update:modelValue', checked);
  emit('change', checked);
}
</script>

<template>
  <label
    :class="[
      'core-icon-switch-recipe',
      `core-icon-switch-recipe--${size}`,
      modelValue && 'core-icon-switch-recipe--checked',
      invalid && 'core-icon-switch-recipe--invalid',
      disabled && 'core-icon-switch-recipe--disabled',
      attrs.class,
    ]"
    :style="attrs.style"
  >
    <input
      class="core-icon-switch-recipe__input"
      type="checkbox"
      role="switch"
      :checked="modelValue"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      v-bind="inputAttrs"
      @change="updateChecked"
    />
    <span class="core-icon-switch-recipe__control" aria-hidden="true">
      <span class="core-icon-switch-recipe__thumb">
        <slot name="thumb" :checked="modelValue">
          <VueIconify v-if="thumbIcon" :icon="thumbIcon" size="var(--core-icon-switch-thumb-icon-size)" />
        </slot>
      </span>
    </span>
    <span v-if="hasContent" class="core-icon-switch-recipe__content">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped>
/* stylelint-disable no-descending-specificity -- Frozen switch states intentionally share one matrix. */

.core-icon-switch-recipe {
  --core-icon-switch-track-width: 2.375rem;
  --core-icon-switch-track-height: 1.375rem;
  --core-icon-switch-thumb-size: 1rem;
  --core-icon-switch-control-offset: 0.0625rem;
  --core-icon-switch-thumb-icon-size: 0.75rem;
  --core-icon-switch-thumb-travel: calc(
    var(--core-icon-switch-track-width) - var(--core-icon-switch-thumb-size) - 0.375rem
  );

  position: relative;
  display: inline-flex;
  align-items: flex-start;
  gap: var(--cm-space-3);
  inline-size: fit-content;
  min-inline-size: 0;
  color: var(--cm-color-text-primary);
  cursor: pointer;
}

.core-icon-switch-recipe--sm {
  --core-icon-switch-track-width: 2.125rem;
  --core-icon-switch-track-height: 1.25rem;
  --core-icon-switch-thumb-size: var(--cm-icon-size-sm);
  --core-icon-switch-control-offset: 0.0313rem;
  --core-icon-switch-thumb-icon-size: 0.625rem;

  gap: var(--cm-space-2);
}

.core-icon-switch-recipe--lg {
  --core-icon-switch-track-width: 2.625rem;
  --core-icon-switch-track-height: 1.5rem;
  --core-icon-switch-thumb-size: var(--cm-icon-size-lg);
  --core-icon-switch-control-offset: 0;
  --core-icon-switch-thumb-icon-size: var(--cm-icon-size-sm);
}

.core-icon-switch-recipe__input {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  clip-path: inset(50%);
  opacity: 0;
  white-space: nowrap;
}

.core-icon-switch-recipe__control {
  position: relative;
  display: inline-flex;
  box-sizing: border-box;
  flex-shrink: 0;
  inline-size: var(--core-icon-switch-track-width);
  block-size: var(--core-icon-switch-track-height);
  align-items: center;
  justify-content: center;
  margin-block-start: var(--core-icon-switch-control-offset);
  border: var(--cm-border-width) solid var(--cm-color-border-interactive);
  border-radius: var(--cm-radius-round);
  background: var(--cm-color-background-surface);
  transition:
    background-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    border-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    box-shadow var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.core-icon-switch-recipe__content {
  min-inline-size: 0;
  color: currentcolor;
  font-size: var(--cm-control-font-size-md);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.core-icon-switch-recipe__thumb {
  position: absolute;
  inset-inline-start: var(--cm-border-width-thick);
  display: inline-flex;
  box-sizing: border-box;
  inline-size: var(--core-icon-switch-thumb-size);
  block-size: var(--core-icon-switch-thumb-size);
  align-items: center;
  justify-content: center;
  border: var(--cm-border-width) solid var(--cm-color-icon-secondary);
  border-radius: var(--cm-radius-round);
  background: var(--cm-color-icon-secondary);
  color: var(--cm-color-icon-inverse);
  line-height: 1;
  transform: translateX(0);
  transition:
    transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    background-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    border-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    box-shadow var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.core-icon-switch-recipe__thumb > :deep(.vf-icon-wrapper),
.core-icon-switch-recipe__thumb > :deep(.vf-icon-wrapper > .vf-icon),
.core-icon-switch-recipe__thumb > :deep(svg) {
  inline-size: var(--core-icon-switch-thumb-icon-size);
  block-size: var(--core-icon-switch-thumb-icon-size);
}

.core-icon-switch-recipe__input:checked + .core-icon-switch-recipe__control,
.core-icon-switch-recipe--checked .core-icon-switch-recipe__control {
  border-color: var(--cm-color-interactive-primary-background);
  background: var(--cm-color-interactive-primary-background);
}

.core-icon-switch-recipe__input:checked + .core-icon-switch-recipe__control .core-icon-switch-recipe__thumb,
.core-icon-switch-recipe--checked .core-icon-switch-recipe__thumb {
  border-color: var(--cm-color-interactive-primary-foreground);
  background: var(--cm-color-interactive-primary-foreground);
  color: var(--cm-color-interactive-primary-background);
  transform: translateX(var(--core-icon-switch-thumb-travel));
}

.core-icon-switch-recipe:dir(rtl)
  .core-icon-switch-recipe__input:checked
  + .core-icon-switch-recipe__control
  .core-icon-switch-recipe__thumb,
.core-icon-switch-recipe:dir(rtl).core-icon-switch-recipe--checked .core-icon-switch-recipe__thumb {
  transform: translateX(calc(var(--core-icon-switch-thumb-travel) * -1));
}

.core-icon-switch-recipe:hover:not(.core-icon-switch-recipe--disabled) .core-icon-switch-recipe__control {
  border-color: var(--cm-color-interactive-primary-border);
  background: var(--cm-color-background-surface-hover);
}

.core-icon-switch-recipe--checked:hover:not(.core-icon-switch-recipe--disabled) .core-icon-switch-recipe__control {
  border-color: var(--cm-color-interactive-primary-hover-background);
  background: var(--cm-color-interactive-primary-hover-background);
}

.core-icon-switch-recipe:active:not(.core-icon-switch-recipe--disabled) .core-icon-switch-recipe__control {
  border-color: var(--cm-color-interactive-primary-border);
  background: var(--cm-color-background-surface-active);
}

.core-icon-switch-recipe--checked:active:not(.core-icon-switch-recipe--disabled) .core-icon-switch-recipe__control {
  border-color: var(--cm-color-interactive-primary-active-background);
  background: var(--cm-color-interactive-primary-active-background);
}

.core-icon-switch-recipe__input:focus-visible + .core-icon-switch-recipe__control {
  border-color: var(--cm-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.core-icon-switch-recipe--invalid:not(.core-icon-switch-recipe--disabled) .core-icon-switch-recipe__control {
  border-color: var(--cm-color-status-danger-border);
}

.core-icon-switch-recipe--sm .core-icon-switch-recipe__content {
  font-size: var(--cm-control-font-size-sm);
}

.core-icon-switch-recipe--lg .core-icon-switch-recipe__content {
  font-size: var(--cm-control-font-size-lg);
}

.core-icon-switch-recipe--disabled {
  color: var(--cm-color-text-disabled);
  cursor: not-allowed;
}

.core-icon-switch-recipe--disabled .core-icon-switch-recipe__control {
  border-color: var(--cm-color-border-disabled);
  background: var(--cm-color-background-surface-disabled);
}

.core-icon-switch-recipe--disabled .core-icon-switch-recipe__thumb {
  border-color: var(--cm-color-icon-secondary);
  background: var(--cm-color-icon-secondary);
  color: var(--cm-color-icon-inverse);
}

@media (forced-colors: active) {
  .core-icon-switch-recipe__input:checked + .core-icon-switch-recipe__control {
    background: Highlight;
    color: HighlightText;
  }
}

@media (prefers-reduced-motion: reduce) {
  .core-icon-switch-recipe,
  .core-icon-switch-recipe * {
    transition-duration: 0.01ms !important;
  }
}
</style>
