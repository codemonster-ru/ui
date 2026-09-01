<script setup lang="ts">
import { computed, ref, useAttrs, watch, watchEffect, type PropType } from 'vue';

import { useCmHydrated } from '../../internal/hydration';
import {
  cmFocusableSelector,
  popoverKeyAction,
  resolveColumnChooserState,
  resolveDisclosureOpen,
  resolveVisibleColumns,
  toggleAllColumns,
  toggleColumnVisibility,
} from '@codemonster-ru/ui-runtime/core';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { assertCm } from '../../internal/warn';
import type { CmColumnChooserColumn } from './column-chooser.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  columns: { type: Array as PropType<readonly CmColumnChooserColumn[]>, required: true },
  visibleColumnKeys: { type: Array as PropType<readonly string[] | null>, default: null },
  requiredColumnKeys: { type: Array as PropType<readonly string[]>, default: () => [] },
  disabled: Boolean,
  triggerLabel: { type: String, default: 'Configure columns' },
  allLabel: { type: String, default: 'All columns' },
});
const emit = defineEmits<{
  visibleColumnsChange: [keys: string[]];
  'update:visibleColumnKeys': [keys: string[]];
}>();

assertCm(props.id.trim() !== '', 'ColumnChooser id must be a non-empty string.');

const attrs = useAttrs();
const trigger = ref<HTMLButtonElement>();
const panel = ref<HTMLElement>();
const allInput = ref<HTMLInputElement>();
const isOpen = ref(false);

const columnKeys = computed(() => props.columns.map(({ key }) => key));
const localKeys = ref<string[] | null>(props.visibleColumnKeys === null ? null : [...props.visibleColumnKeys]);
watch(
  () => props.visibleColumnKeys,
  (keys) => (localKeys.value = keys === null ? null : [...keys]),
);

const visibleKeys = computed(() => resolveVisibleColumns(columnKeys.value, localKeys.value, props.requiredColumnKeys));
const optionalKeys = computed(() => columnKeys.value.filter((key) => !props.requiredColumnKeys.includes(key)));
const chooserState = computed(() => resolveColumnChooserState(optionalKeys.value, visibleKeys.value));

watchEffect(() => {
  if (allInput.value) allInput.value.indeterminate = chooserState.value.partial;
});

const panelId = computed(() => `${props.id}-panel`);
const classes = computed(() => mergeCmClasses('cm-popover', 'cm-column-chooser', attrs.class));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'data-cm-controller']));

function columnLabel(column: CmColumnChooserColumn): string {
  return column.header ?? column.key;
}

function commit(keys: string[]): void {
  localKeys.value = keys;
  emit('update:visibleColumnKeys', keys);
  emit('visibleColumnsChange', keys);
}

function setOpen(open: boolean, restoreFocus = false): void {
  const next = resolveDisclosureOpen(open, props.disabled);
  if (isOpen.value === next) return;
  isOpen.value = next;
  if (restoreFocus) trigger.value?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  const action = popoverKeyAction(event.key, {
    disabled: props.disabled,
    onTrigger: event.target === trigger.value,
    open: isOpen.value,
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

useCmHydrated();
</script>

<template>
  <div v-bind="rootAttrs" :class="classes" data-cm-controller="popover" @keydown="onKeydown">
    <button
      :id="props.id"
      ref="trigger"
      class="cm-popover__trigger cm-column-chooser__trigger"
      type="button"
      :aria-label="props.triggerLabel"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :disabled="props.disabled || undefined"
      @click="setOpen(!isOpen)"
    >
      <slot name="trigger">{{ props.triggerLabel }}</slot>
    </button>
    <div
      :id="panelId"
      ref="panel"
      class="cm-popover__panel cm-column-chooser__panel"
      role="dialog"
      :aria-labelledby="props.id"
      :hidden="!isOpen"
    >
      <div class="cm-column-chooser__all">
        <label class="cm-checkbox cm-checkbox--md">
          <input
            ref="allInput"
            class="cm-checkbox__input"
            type="checkbox"
            data-cm-column-chooser-all
            :checked="chooserState.all"
            :disabled="props.disabled || optionalKeys.length === 0 || undefined"
            @change="
              commit(
                toggleAllColumns(columnKeys, ($event.target as HTMLInputElement).checked, props.requiredColumnKeys),
              )
            "
          /><span class="cm-checkbox__control" aria-hidden="true"><span class="cm-checkbox__mark"></span></span
          ><span class="cm-checkbox__content">{{ props.allLabel }}</span>
        </label>
      </div>
      <div class="cm-column-chooser__options">
        <label v-for="column in props.columns" :key="column.key" class="cm-checkbox cm-checkbox--md">
          <input
            class="cm-checkbox__input"
            type="checkbox"
            :data-cm-column-chooser-key="column.key"
            :checked="visibleKeys.includes(column.key)"
            :disabled="props.disabled || props.requiredColumnKeys.includes(column.key) || undefined"
            @change="
              commit(
                toggleColumnVisibility(
                  columnKeys,
                  visibleKeys,
                  column.key,
                  ($event.target as HTMLInputElement).checked,
                  props.requiredColumnKeys,
                ),
              )
            "
          /><span class="cm-checkbox__control" aria-hidden="true"><span class="cm-checkbox__mark"></span></span
          ><span class="cm-checkbox__content">{{ columnLabel(column) }}</span>
        </label>
      </div>
    </div>
  </div>
</template>
