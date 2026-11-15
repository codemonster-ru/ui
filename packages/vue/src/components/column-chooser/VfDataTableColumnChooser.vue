<script setup lang="ts">
import { gear } from '@codemonster-ru/ui-icons';
import { computed, useId } from 'vue';
import CmIconButton from '../icon-button/CmIconButton.vue';
import CmIcon from '../icon/CmIcon.vue';
import CmColumnChooser from './CmColumnChooser.vue';
import type { CmColumnChooserTriggerScope, VfDataTableColumnChooserProps } from './column-chooser.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfDataTableColumnChooserProps>(), {
  triggerLabel: 'Configure columns',
  teleportTo: 'body',
});
const emit = defineEmits<{ 'update:modelValue': [keys: string[]] }>();
defineSlots<{ trigger?(scope: CmColumnChooserTriggerScope): unknown }>();
const fallbackId = useId();
const visibleColumns = computed(() => props.modelValue ?? props.columns.map(({ key }) => key));
</script>

<template>
  <CmColumnChooser
    v-bind="$attrs"
    :id="props.id ?? fallbackId"
    :columns="props.columns"
    :required-column-keys="props.requiredColumnKeys"
    :visible-column-keys="visibleColumns"
    :disabled="props.disabled"
    :trigger-label="props.triggerLabel"
    :all-label="props.allLabel"
    :teleport-to="props.teleportTo"
    trigger-as-child
    @update:visible-column-keys="emit('update:modelValue', $event)"
  >
    <template #trigger="scope">
      <slot name="trigger" v-bind="scope">
        <CmIconButton :label="props.triggerLabel" :title="props.triggerLabel" size="sm" variant="ghost">
          <CmIcon :icon="gear" />
        </CmIconButton>
      </slot>
    </template>
  </CmColumnChooser>
</template>
