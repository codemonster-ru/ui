<script setup lang="ts">
import { computed } from 'vue';
import { icons } from '@codemonster-ru/vueforge-icons';
import VfCheckbox from '@/components/checkbox/VfCheckbox.vue';
import VfDropdown from '@/components/dropdown/VfDropdown.vue';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import type { VfDataTableColumn } from '@/types/components';

interface VfDataTableColumnChooserProps {
  columns: VfDataTableColumn[];
  modelValue?: string[];
  requiredColumnKeys?: string[];
  disabled?: boolean;
  triggerLabel?: string;
  allLabel?: string;
}

const props = withDefaults(defineProps<VfDataTableColumnChooserProps>(), {
  modelValue: undefined,
  requiredColumnKeys: () => [],
  disabled: false,
  triggerLabel: 'Configure columns',
  allLabel: 'All columns',
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const columnKeys = computed(() => props.columns.map((column) => column.key));
const requiredKeys = computed(() => new Set(props.requiredColumnKeys.filter((key) => columnKeys.value.includes(key))));
const visibleKeys = computed(() => {
  const requested = props.modelValue ?? columnKeys.value;
  const requestedKeys = new Set(requested);

  return columnKeys.value.filter((key) => requestedKeys.has(key) || requiredKeys.value.has(key));
});
const optionalColumns = computed(() => props.columns.filter((column) => !requiredKeys.value.has(column.key)));
const selectedOptionalCount = computed(
  () => optionalColumns.value.filter((column) => visibleKeys.value.includes(column.key)).length,
);
const allSelected = computed(
  () => optionalColumns.value.length === 0 || selectedOptionalCount.value === optionalColumns.value.length,
);
const partiallySelected = computed(
  () => selectedOptionalCount.value > 0 && selectedOptionalCount.value < optionalColumns.value.length,
);

function columnLabel(column: VfDataTableColumn) {
  return column.header || column.key;
}

function commit(keys: Iterable<string>) {
  const nextKeys = new Set([...keys, ...requiredKeys.value]);
  emit(
    'update:modelValue',
    columnKeys.value.filter((key) => nextKeys.has(key)),
  );
}

function toggleAll(checked: boolean) {
  commit(checked ? columnKeys.value : requiredKeys.value);
}

function toggleColumn(key: string, checked: boolean) {
  const nextKeys = new Set(visibleKeys.value);
  if (checked) nextKeys.add(key);
  else nextKeys.delete(key);
  commit(nextKeys);
}
</script>

<template>
  <VfDropdown
    class="vf-data-table-column-chooser"
    placement="bottom-start"
    :close-on-select="false"
    :disabled="props.disabled"
  >
    <template #trigger>
      <slot name="trigger" :visible-column-keys="visibleKeys" :disabled="props.disabled">
        <VfIconButton
          :icon="icons.gear"
          variant="ghost"
          size="sm"
          :aria-label="props.triggerLabel"
          :title="props.triggerLabel"
          :disabled="props.disabled"
        />
      </slot>
    </template>

    <div class="vf-data-table-column-chooser__options">
      <div class="vf-data-table-column-chooser__all">
        <VfCheckbox
          :model-value="allSelected"
          :indeterminate="partiallySelected"
          :label="props.allLabel"
          :disabled="props.disabled || optionalColumns.length === 0"
          @update:model-value="toggleAll"
        />
      </div>
      <VfCheckbox
        v-for="column in props.columns"
        :key="column.key"
        :model-value="visibleKeys.includes(column.key)"
        :label="columnLabel(column)"
        :disabled="props.disabled || requiredKeys.has(column.key)"
        @update:model-value="toggleColumn(column.key, $event)"
      />
    </div>
  </VfDropdown>
</template>
