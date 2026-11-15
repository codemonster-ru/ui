<script setup lang="ts">
import { computed, useId } from 'vue';

import CmButton from '../button/CmButton.vue';
import type { CmButtonVariant } from '../button/button.types';
import CmDialog from '../dialog/CmDialog.vue';
import type { CmDialogSize } from '../dialog/dialog.types';
import type { CmConfirmDialogInitialFocus } from './confirm-dialog.types';

const props = withDefaults(
  defineProps<{
    open?: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: CmButtonVariant;
    size?: CmDialogSize;
    dividers?: boolean;
    teleportTo?: string | HTMLElement | null | false;
    disableTeleport?: boolean;
    initialFocus?: CmConfirmDialogInitialFocus;
    loading?: boolean;
    disabled?: boolean;
    closeOnConfirm?: boolean;
  }>(),
  {
    title: 'Confirm action',
    description: undefined,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    confirmVariant: 'danger',
    size: 'sm',
    dividers: true,
    teleportTo: undefined,
    initialFocus: 'cancel',
    closeOnConfirm: true,
  },
);
defineSlots<{
  default(): unknown;
  footer(props: { cancel(): void; confirm(): void; loading: boolean }): unknown;
}>();
const emit = defineEmits<{
  'update:open': [open: boolean];
  confirm: [];
  cancel: [];
}>();

const id = useId();
const focusDialog = computed(
  () => props.initialFocus === 'dialog' || props.loading || (props.initialFocus === 'confirm' && props.disabled),
);

function cancel(): void {
  if (props.loading) return;
  emit('cancel');
  emit('update:open', false);
}

function confirm(): void {
  if (props.loading || props.disabled) return;
  emit('confirm');
  if (props.closeOnConfirm) emit('update:open', false);
}
</script>

<template>
  <Teleport
    :to="props.teleportTo || 'body'"
    :disabled="props.disableTeleport || props.teleportTo === false || props.teleportTo === null"
  >
    <CmDialog
      :id="`cm-confirm-${id}`"
      class="cm-confirm-dialog"
      :open="props.open"
      :title="props.title"
      :description="props.description"
      :size="props.size"
      :dividers="props.dividers"
      :closable="!props.loading"
      :dismissible="!props.loading"
      close-on-overlay-click
      close-label="Close dialog"
      :focus-dialog="focusDialog"
      @update:open="cancel"
    >
      <template v-if="$slots.default" #default><slot /></template>
      <template #footer>
        <div class="cm-confirm-dialog__actions">
          <slot name="footer" :cancel="cancel" :confirm="confirm" :loading="props.loading">
            <CmButton
              variant="secondary"
              :disabled="props.loading"
              :autofocus="props.initialFocus === 'cancel' && !props.loading ? '' : undefined"
              @click="cancel"
            >
              {{ props.cancelLabel }}
            </CmButton>
            <CmButton
              :variant="props.confirmVariant"
              :loading="props.loading"
              :disabled="props.disabled"
              :autofocus="props.initialFocus === 'confirm' && !props.loading && !props.disabled ? '' : undefined"
              @click="confirm"
            >
              {{ props.confirmLabel }}
            </CmButton>
          </slot>
        </div>
      </template>
    </CmDialog>
  </Teleport>
</template>
