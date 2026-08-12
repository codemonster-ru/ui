<script setup lang="ts">
import { computed, onMounted, useAttrs, useTemplateRef, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmCheckboxSize } from './checkbox.types';

defineOptions({ inheritAttrs: false });

const sizes: readonly CmCheckboxSize[] = ['sm', 'md', 'lg'];
const props = defineProps({
  modelValue: Boolean,
  value: { type: String, default: 'on' },
  label: { type: String, default: '' },
  size: {
    type: String as PropType<CmCheckboxSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  invalid: Boolean,
  disabled: Boolean,
  required: Boolean,
  indeterminate: Boolean,
});
const emit = defineEmits<{
  change: [event: Event];
  'update:modelValue': [value: boolean];
}>();
const attrs = useAttrs();
const input = useTemplateRef<HTMLInputElement>('input');
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-checkbox',
    `cm-checkbox--${size.value}`,
    props.invalid ? 'cm-checkbox--invalid' : undefined,
    attrs.class as CmClassValue,
  ),
);
const controlAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['style', 'type', 'value', 'checked', 'disabled', 'required', 'aria-invalid']),
);
const rootAttrs = computed(() => (attrs.style === undefined ? {} : { style: attrs.style }));

function syncIndeterminate(): void {
  if (input.value) input.value.indeterminate = props.indeterminate;
}

onMounted(syncIndeterminate);
watch(() => props.indeterminate, syncIndeterminate, { flush: 'post' });

function updateChecked(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).checked);
  emit('change', event);
}
</script>

<template>
  <label v-bind="rootAttrs" :class="classes">
    <input
      ref="input"
      v-bind="controlAttrs"
      class="cm-checkbox__input"
      type="checkbox"
      :value="props.value"
      :checked="props.modelValue"
      :disabled="props.disabled || undefined"
      :required="props.required || undefined"
      :aria-invalid="props.invalid ? 'true' : undefined"
      @change="updateChecked"
    />
    <span class="cm-checkbox__control" aria-hidden="true"><span class="cm-checkbox__mark" /></span>
    <span class="cm-checkbox__content"
      ><slot>{{ props.label }}</slot></span
    >
  </label>
</template>
