<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  shallowRef,
  useAttrs,
  watch,
  watchEffect,
  type ComponentPublicInstance,
  type PropType,
} from 'vue';

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
import { observeCmAnchoredPosition, type CmAnchoredStyle } from '@codemonster-ru/ui-runtime/anchored-position';
import { authoredTriggerElement, CmAuthoredTrigger } from '../../internal/disclosure-trigger';
import { assertCm } from '../../internal/warn';
import type { CmColumnChooserColumn, CmColumnChooserTriggerScope } from './column-chooser.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  columns: { type: Array as PropType<readonly CmColumnChooserColumn[]>, required: true },
  visibleColumnKeys: { type: Array as PropType<readonly string[] | null>, default: null },
  requiredColumnKeys: { type: Array as PropType<readonly string[]>, default: () => [] },
  disabled: Boolean,
  triggerLabel: { type: String, default: 'Configure columns' },
  allLabel: { type: String, default: 'All columns' },
  triggerAsChild: Boolean,
  teleportTo: { type: [String, Object, Boolean] as PropType<string | HTMLElement | null | false>, default: null },
});
const emit = defineEmits<{
  visibleColumnsChange: [keys: string[]];
  'update:visibleColumnKeys': [keys: string[]];
}>();

assertCm(props.id.trim() !== '', 'ColumnChooser id must be a non-empty string.');

const attrs = useAttrs();
const slots = defineSlots<{ trigger?(scope: CmColumnChooserTriggerScope): unknown }>();
const root = ref<HTMLElement>();
const trigger = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const panelStyle = shallowRef<CmAnchoredStyle>();
const allInput = ref<HTMLInputElement>();
const isOpen = ref(false);

const columnKeys = computed(() => props.columns.map(({ key }) => key));
const localKeys = ref<string[] | null>(null);
watch(
  () => props.visibleColumnKeys,
  (keys) => {
    if (keys === null) localKeys.value = null;
  },
);

const visibleKeys = computed(() =>
  resolveVisibleColumns(columnKeys.value, props.visibleColumnKeys ?? localKeys.value, props.requiredColumnKeys),
);
const optionalKeys = computed(() => columnKeys.value.filter((key) => !props.requiredColumnKeys.includes(key)));
const chooserState = computed(() => resolveColumnChooserState(optionalKeys.value, visibleKeys.value));

watchEffect(() => {
  if (allInput.value) allInput.value.indeterminate = chooserState.value.partial;
});

const panelId = computed(() => `${props.id}-panel`);
const classes = computed(() => mergeCmClasses('cm-popover', 'cm-column-chooser', attrs.class));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'data-cm-controller']));
const teleportTarget = computed(() => {
  const anchor = trigger.value;
  const requested = props.teleportTo;
  if (!isOpen.value || !anchor || !requested) return null;
  try {
    const target =
      typeof requested === 'string'
        ? ((requested === 'body' ? anchor.closest('dialog') : null) ?? anchor.ownerDocument.querySelector(requested))
        : requested;
    return target?.isConnected && !root.value?.contains(target) ? target : null;
  } catch {
    return null;
  }
});

function columnLabel(column: CmColumnChooserColumn): string {
  return column.header?.trim() || column.key;
}

function commit(keys: string[]): void {
  if (props.visibleColumnKeys === null) localKeys.value = keys;
  emit('update:visibleColumnKeys', keys);
  emit('visibleColumnsChange', keys);
}

function onAllChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  commit(toggleAllColumns(columnKeys.value, input.checked, props.requiredColumnKeys));
  if (props.visibleColumnKeys !== null) {
    input.checked = chooserState.value.all;
    input.indeterminate = chooserState.value.partial;
  }
}

function onColumnChange(key: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  commit(toggleColumnVisibility(columnKeys.value, visibleKeys.value, key, input.checked, props.requiredColumnKeys));
  if (props.visibleColumnKeys !== null) input.checked = visibleKeys.value.includes(key);
}

function setOpen(open: boolean, restoreFocus = false): void {
  const next = resolveDisclosureOpen(open, props.disabled);
  if (isOpen.value === next) return;
  isOpen.value = next;
  if (restoreFocus) trigger.value?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
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
  if (action.focus === 'first') {
    void nextTick(() => {
      const first = [...(panel.value?.querySelectorAll<HTMLElement>(cmFocusableSelector) ?? [])].find(
        (element) => !element.matches(':disabled') && !element.closest('[hidden], [inert]'),
      );
      first?.focus();
    });
  }
}

function toggle(event: MouseEvent): void {
  if (!event.defaultPrevented) setOpen(!isOpen.value);
}

function captureTrigger(element: Element | ComponentPublicInstance | null): void {
  trigger.value = authoredTriggerElement(element);
}

watch(
  [isOpen, trigger, panel, teleportTarget],
  ([open, anchor, content, portal], _, onCleanup) => {
    if (!open || !anchor || !content) return;
    const document = anchor.ownerDocument;
    const dismissOutside = (event: MouseEvent) => {
      const path = event.composedPath();
      if ((!root.value || !path.includes(root.value)) && !path.includes(content)) setOpen(false);
    };
    document.addEventListener('click', dismissOutside);
    const stop = observeCmAnchoredPosition(anchor, content, 'bottom-start', 10, portal ? null : root.value, (style) => {
      panelStyle.value = style;
    });
    onCleanup(() => {
      stop();
      panelStyle.value = undefined;
      document.removeEventListener('click', dismissOutside);
    });
  },
  { flush: 'post' },
);

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) setOpen(false);
  },
);
useCmHydrated();
</script>

<template>
  <div ref="root" v-bind="rootAttrs" :class="classes" data-cm-controller="popover column-chooser" @keydown="onKeydown">
    <CmAuthoredTrigger
      v-if="props.triggerAsChild && slots.trigger"
      :id="props.id"
      :panel-id="panelId"
      :label="props.triggerLabel"
      :open="isOpen"
      :disabled="props.disabled"
      :capture="captureTrigger"
      :activate="toggle"
      trigger-class="cm-popover__trigger cm-column-chooser__trigger"
      popup="dialog"
    >
      <slot name="trigger" :visible-column-keys="visibleKeys" :disabled="props.disabled" />
    </CmAuthoredTrigger>
    <button
      v-else
      :id="props.id"
      ref="trigger"
      class="cm-popover__trigger cm-column-chooser__trigger"
      type="button"
      :aria-label="props.triggerLabel"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :disabled="props.disabled || undefined"
      @click="toggle"
    >
      <slot name="trigger" :visible-column-keys="visibleKeys" :disabled="props.disabled">{{ props.triggerLabel }}</slot>
    </button>
    <Teleport :to="teleportTarget ?? 'body'" :disabled="!teleportTarget">
      <div
        :id="panelId"
        ref="panel"
        class="cm-popover__panel cm-column-chooser__panel"
        role="dialog"
        :aria-labelledby="props.id"
        :hidden="!isOpen"
        :data-cm-popover-portaled="teleportTarget ? '' : undefined"
        v-bind="panelStyle ? { style: panelStyle } : {}"
        @keydown="teleportTarget && onKeydown($event)"
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
              @change="onAllChange"
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
              :data-cm-column-chooser-required="props.requiredColumnKeys.includes(column.key) ? '' : undefined"
              :checked="visibleKeys.includes(column.key)"
              :disabled="props.disabled || props.requiredColumnKeys.includes(column.key) || undefined"
              @change="onColumnChange(column.key, $event)"
            /><span class="cm-checkbox__control" aria-hidden="true"><span class="cm-checkbox__mark"></span></span
            ><span class="cm-checkbox__content">{{ columnLabel(column) }}</span>
          </label>
        </div>
      </div>
    </Teleport>
  </div>
</template>
