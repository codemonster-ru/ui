<script setup lang="ts">
import VfButton from '@/components/button/VfButton.vue';
import VfDialog from '@/components/dialog/VfDialog.vue';
import { useId } from '@/composables';
import type { VfButtonVariant, VfConfirmDialogInitialFocus, VfDialogSize } from '@/types/components';

interface VfConfirmDialogProps {
  open?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: VfButtonVariant;
  size?: VfDialogSize;
  dividers?: boolean;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  initialFocus?: VfConfirmDialogInitialFocus;
  loading?: boolean;
  disabled?: boolean;
  closeOnConfirm?: boolean;
}

const props = withDefaults(defineProps<VfConfirmDialogProps>(), {
  open: false,
  title: 'Confirm action',
  description: undefined,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmVariant: 'danger',
  size: 'sm',
  dividers: true,
  teleportTo: undefined,
  disableTeleport: false,
  initialFocus: 'cancel',
  loading: false,
  disabled: false,
  closeOnConfirm: true,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const descriptionId = useId({ prefix: 'vf-confirm-dialog-description' });

function cancel() {
  if (props.loading) return;
  emit('cancel');
  emit('update:open', false);
}

function confirm() {
  if (props.loading || props.disabled) return;
  emit('confirm');
  if (props.closeOnConfirm) emit('update:open', false);
}

function handleOpenChange(value: boolean) {
  if (value) {
    emit('update:open', true);
    return;
  }

  cancel();
}
</script>

<template>
  <VfDialog
    :open="props.open"
    :title="props.title"
    :size="props.size"
    :dividers="props.dividers"
    :teleport-to="props.teleportTo"
    :disable-teleport="props.disableTeleport"
    :aria-describedby="props.description ? descriptionId : undefined"
    :closable="!props.loading"
    :close-on-escape="!props.loading"
    :close-on-overlay-click="!props.loading"
    @update:open="handleOpenChange"
  >
    <template v-if="props.description || $slots.default" #default>
      <p v-if="props.description" :id="descriptionId" class="vf-confirm-dialog__description">
        {{ props.description }}
      </p>
      <slot />
    </template>

    <template #footer>
      <div class="vf-confirm-dialog__actions">
        <slot name="footer" :cancel="cancel" :confirm="confirm" :loading="props.loading">
          <VfButton
            variant="secondary"
            :disabled="props.loading"
            :data-autofocus="props.initialFocus === 'cancel' && !props.loading ? '' : undefined"
            @click="cancel"
          >
            {{ props.cancelLabel }}
          </VfButton>
          <VfButton
            :variant="props.confirmVariant"
            :loading="props.loading"
            :disabled="props.disabled"
            :data-autofocus="props.initialFocus === 'confirm' && !props.loading && !props.disabled ? '' : undefined"
            @click="confirm"
          >
            {{ props.confirmLabel }}
          </VfButton>
        </slot>
      </div>
    </template>
  </VfDialog>
</template>
