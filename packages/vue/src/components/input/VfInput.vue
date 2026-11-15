<script setup lang="ts">
import { computed } from 'vue';

import { omitCmOwnedAttrs } from '../../internal/root-attributes';
import VueIconify from '../icon/VueIconify.vue';
import CmInput from './CmInput.vue';
import type { VfInputProps } from './input.types';

defineOptions({ inheritAttrs: false });

const props = defineProps<VfInputProps>();
const emit = defineEmits<{
  input: [event: Event];
  'update:modelValue': [value: string];
}>();

const inputProps = computed(() => omitCmOwnedAttrs(props, ['leadingIcon', 'trailingIcon']));
</script>

<template>
  <CmInput
    v-bind="{ ...$attrs, ...inputProps }"
    @input="emit('input', $event)"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="$slots.leading || props.leadingIcon" #leading>
      <slot name="leading">
        <VueIconify v-if="props.leadingIcon" :icon="props.leadingIcon" size="var(--cm-field-icon-size-md)" />
      </slot>
    </template>
    <template v-if="$slots.trailing || props.trailingIcon" #trailing>
      <slot name="trailing">
        <VueIconify v-if="props.trailingIcon" :icon="props.trailingIcon" size="var(--cm-field-icon-size-md)" />
      </slot>
    </template>
  </CmInput>
</template>
