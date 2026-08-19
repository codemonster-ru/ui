<script setup lang="ts">
import { onBeforeUnmount, watch, type PropType } from 'vue';
import { CmButton, CmDialog, CmIconButton } from '@codemonster-ru/ui-vue';

type CoreDialogSize = 'sm' | 'md' | 'lg';

const props = defineProps({
  open: Boolean,
  size: {
    type: String as PropType<CoreDialogSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
});

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

let previousBodyOverflow: string | undefined;

function setScrollLock(locked: boolean): void {
  if (typeof document === 'undefined') return;

  if (locked) {
    previousBodyOverflow ??= document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  } else if (previousBodyOverflow !== undefined) {
    document.body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = undefined;
  }
}

function requestOpenChange(open: boolean): void {
  emit('update:open', open);
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) requestOpenChange(false);
}

watch(
  () => props.open,
  (open) => setScrollLock(open),
  { immediate: true },
);

onBeforeUnmount(() => setScrollLock(false));
</script>

<template>
  <CmDialog
    id="core-showcase-dialog"
    class="demo-application-dialog"
    :open="props.open"
    title="Dialog"
    close-label="Close dialog"
    :size="props.size"
    dividers
    @click="handleBackdropClick"
    @update:open="requestOpenChange"
  >
    <template #actions="{ close }">
      <CmIconButton
        class="demo-application-dialog__close"
        label="Close dialog"
        size="md"
        variant="ghost"
        @click="close"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5.75 5.75 18.25 18.25M18.25 5.75 5.75 18.25"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </CmIconButton>
    </template>

    <div class="demo-stack">
      <p class="demo-m-0">Dialog content.</p>
    </div>

    <template #footer="{ close }">
      <div class="demo-inline">
        <CmButton autofocus @click="close">Looks good</CmButton>
        <CmButton variant="secondary" @click="requestOpenChange(false)">Close</CmButton>
      </div>
    </template>
  </CmDialog>
</template>

<style scoped>
:deep(.demo-application-dialog.cm-dialog) {
  overflow: hidden;
  transform: translate3d(0, 0, 0);
}

:deep(.demo-application-dialog > .cm-dialog__surface > .cm-dialog__header > .cm-dialog__close) {
  display: none;
}

:deep(.demo-application-dialog__close) {
  color: var(--cm-color-icon-secondary);
}

:deep(.demo-application-dialog__close .cm-icon-button__icon) {
  width: calc(var(--cm-icon-size-md) * 1.25);
  height: calc(var(--cm-icon-size-md) * 1.25);
}

:deep(.demo-application-dialog .cm-dialog__body) {
  flex: 1 1 auto;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.demo-application-dialog),
  :deep(.demo-application-dialog *) {
    transition-duration: 0.01ms !important;
  }
}
</style>
