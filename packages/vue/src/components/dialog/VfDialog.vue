<script setup lang="ts">
import { useId } from 'vue';
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
});
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>();
const fallbackId = useId();
</script>

<template>
  <CmDialog
    v-bind="{ ...$attrs, ...props }"
    :id="props.id ?? fallbackId"
    :aria-label="props.ariaLabel ?? (!props.title && !props.ariaLabelledby && !$slots.header ? 'Dialog' : undefined)"
    @update:open="emit('update:open', $event)"
    @open-change="emit('openChange', $event)"
  >
    <template v-for="(_, name) in $slots" :key="name" #[name]="scope">
      <slot :name="name" v-bind="scope" />
    </template>
  </CmDialog>
</template>
