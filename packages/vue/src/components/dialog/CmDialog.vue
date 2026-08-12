<script setup lang="ts">
import { computed, useAttrs } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import { useCmModal } from '../modal/use-modal';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  open: Boolean,
  closeLabel: { type: String, default: 'Close' },
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
const classes = computed(() =>
  mergeCmClasses('cm-dialog', localOpen.value ? 'cm-dialog--open' : undefined, attrs.class as CmClassValue),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, [
    'id',
    'open',
    'aria-labelledby',
    'aria-describedby',
    'data-cm-controller',
    'data-cm-dialog-state',
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
    :aria-describedby="props.description ? `${props.id}-description` : undefined"
    data-cm-controller="dialog"
    :data-cm-dialog-state="localOpen ? 'open' : 'closed'"
    @cancel="onCancel"
    @keydown="onKeydown"
  >
    <div class="cm-dialog__surface">
      <header class="cm-dialog__header">
        <h2 :id="`${props.id}-title`" class="cm-dialog__title">{{ props.title }}</h2>
        <!-- prettier-ignore -->
        <button class="cm-dialog__close" type="button" :aria-label="props.closeLabel" data-cm-dialog-close @click="setOpen(false)">×</button>
      </header>
      <p v-if="props.description" :id="`${props.id}-description`" class="cm-dialog__description">
        {{ props.description }}
      </p>
      <div class="cm-dialog__body"><slot /></div>
      <footer v-if="$slots.footer" class="cm-dialog__footer"><slot name="footer" /></footer>
    </div>
  </dialog>
</template>
