<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import { useCmModal } from '../modal/use-modal';
import type { CmDialogSize } from './dialog.types';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  open: Boolean,
  closeLabel: { type: String, default: 'Close' },
  dismissible: { type: Boolean, default: true },
  size: {
    type: String as PropType<CmDialogSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  dividers: Boolean,
});
const emit = defineEmits<{ openChange: [open: boolean]; 'update:open': [open: boolean] }>();
const attrs = useAttrs();
if (![props.id, props.title, props.closeLabel].every((value) => value.trim())) {
  throw new TypeError('Dialog id, title, and closeLabel must be non-empty strings.');
}
const modal = useCmModal(
  () => props.open,
  (open) => {
    emit('update:open', open);
    emit('openChange', open);
  },
);
const { dialog, localOpen, onCancel, onKeydown, setOpen } = modal;
function requestClose(): void {
  if (props.dismissible) setOpen(false);
}
const size = computed(() => (['sm', 'md', 'lg'].includes(props.size) ? props.size : 'md'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-dialog',
    `cm-dialog--${size.value}`,
    props.dividers ? 'cm-dialog--dividers' : undefined,
    localOpen.value ? 'cm-dialog--open' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, [
    'id',
    'open',
    'aria-labelledby',
    'aria-describedby',
    'data-cm-controller',
    'data-cm-dialog-state',
    'data-cm-dialog-dismissible',
  ]),
);
</script>

<template>
  <dialog
    :id="`${props.id}-dialog`"
    ref="dialog"
    v-bind="rootAttrs"
    :class="classes"
    :open="localOpen || undefined"
    :aria-labelledby="`${props.id}-title`"
    :aria-describedby="props.description || $slots.description ? `${props.id}-description` : undefined"
    data-cm-controller="dialog"
    :data-cm-dialog-state="localOpen ? 'open' : 'closed'"
    :data-cm-dialog-dismissible="props.dismissible ? 'true' : 'false'"
    @cancel="props.dismissible ? onCancel($event) : $event.preventDefault()"
    @keydown="props.dismissible ? onKeydown($event) : undefined"
  >
    <div class="cm-dialog__surface">
      <header class="cm-dialog__header">
        <h2 :id="`${props.id}-title`" class="cm-dialog__title">
          <slot name="header" :title-id="`${props.id}-title`">{{ props.title }}</slot>
        </h2>
        <div v-if="$slots.actions" class="cm-dialog__actions">
          <slot name="actions" :close="requestClose" />
        </div>
        <!-- prettier-ignore -->
        <button class="cm-dialog__close" type="button" :aria-label="props.closeLabel" :disabled="!props.dismissible" data-cm-dialog-close @click="requestClose">×</button>
      </header>
      <div v-if="$slots.description" :id="`${props.id}-description`" class="cm-dialog__description">
        <slot name="description" :description-id="`${props.id}-description`" />
      </div>
      <p v-else-if="props.description" :id="`${props.id}-description`" class="cm-dialog__description">
        {{ props.description }}
      </p>
      <div class="cm-dialog__body"><slot :close="requestClose" /></div>
      <footer v-if="$slots.footer" class="cm-dialog__footer">
        <slot name="footer" :close="requestClose" />
      </footer>
    </div>
  </dialog>
</template>
