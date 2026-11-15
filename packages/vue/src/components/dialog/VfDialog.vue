<script setup lang="ts">
import { computed, useId } from 'vue';
import { useVfModalPortal } from '../modal/modal-portal';
import CmDialog from './CmDialog.vue';
import type { VfDialogProps } from './dialog.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfDialogProps>(), {
  open: undefined,
  dismissible: true,
  closable: true,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  focusDialog: true,
  teleportTo: 'body',
});
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>();
const fallbackId = useId();
const { target } = useVfModalPortal(
  () => props.teleportTo,
  () => props.disableTeleport,
);
const bindings = computed(() => {
  const dialog: VfDialogProps & { id: string } = { ...props, id: props.id ?? fallbackId };
  delete dialog.teleportTo;
  delete dialog.disableTeleport;
  return dialog;
});
</script>

<template>
  <Teleport :to="target ?? 'body'" :disabled="!target">
    <CmDialog
      ref="modal"
      v-bind="{ ...$attrs, ...bindings }"
      :aria-label="props.ariaLabel ?? (!props.title && !props.ariaLabelledby && !$slots.header ? 'Dialog' : undefined)"
      @update:open="emit('update:open', $event)"
      @open-change="emit('openChange', $event)"
    >
      <template v-for="(_, name) in $slots" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope" />
      </template>
    </CmDialog>
  </Teleport>
</template>
