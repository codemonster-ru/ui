<script lang="ts">
export type CoreDrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
export type CoreDrawerSupportedPlacement = Extract<CoreDrawerPlacement, 'left' | 'right'>;

export const coreDrawerUnsupportedPlacements = ['top', 'bottom'] as const satisfies readonly CoreDrawerPlacement[];

export function isCoreDrawerSupportedPlacement(
  placement: CoreDrawerPlacement,
): placement is CoreDrawerSupportedPlacement {
  return placement === 'left' || placement === 'right';
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch, type PropType } from 'vue';
import { CmButton, CmDrawer, CmIconButton, CmInput } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/drawer.css';

const props = defineProps({
  open: Boolean,
  placement: {
    type: String as PropType<CoreDrawerSupportedPlacement>,
    default: 'right',
    validator: (value: string) => ['left', 'right'].includes(value),
  },
  fullscreen: Boolean,
});

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const drawerId = computed(() => (props.fullscreen ? 'core-showcase-fullscreen-drawer' : 'core-showcase-drawer'));
const drawerTitle = computed(() => (props.fullscreen ? 'Fullscreen Drawer' : 'Drawer'));
const drawerSide = computed(() => (props.placement === 'left' ? 'start' : 'end'));
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
  <CmDrawer
    :id="drawerId"
    class="demo-application-drawer"
    :open="props.open"
    :title="drawerTitle"
    close-label="Close drawer"
    :side="drawerSide"
    :size="props.fullscreen ? 'full' : 'md'"
    dividers
    @click="handleBackdropClick"
    @update:open="requestOpenChange"
  >
    <template #actions="{ close }">
      <CmIconButton
        class="demo-application-drawer__close"
        label="Close drawer"
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
      <p class="demo-mt-0">{{ props.fullscreen ? 'Fullscreen drawer content.' : 'Drawer content.' }}</p>
      <CmInput :placeholder="props.fullscreen ? 'Search in fullscreen drawer' : 'Search in drawer'" />
    </div>

    <template #footer="{ close }">
      <div class="demo-inline">
        <CmButton autofocus @click="close">Apply</CmButton>
        <CmButton variant="secondary" @click="requestOpenChange(false)">Close</CmButton>
      </div>
    </template>
  </CmDrawer>
</template>

<style scoped>
:deep(.demo-application-drawer.cm-drawer) {
  overflow: hidden;
  transform: translate3d(0, 0, 0);
}

:deep(.demo-application-drawer > .cm-drawer__surface > .cm-drawer__header > .cm-drawer__close) {
  display: none;
}

:deep(.demo-application-drawer__close) {
  color: var(--cm-color-text-muted);
}

:deep(.demo-application-drawer__close .cm-icon-button__icon) {
  width: calc(var(--cm-icon-size-md) * 1.25);
  height: calc(var(--cm-icon-size-md) * 1.25);
}

:deep(.demo-application-drawer .cm-drawer__body) {
  flex: 1 1 auto;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.demo-application-drawer),
  :deep(.demo-application-drawer *) {
    transition-duration: 0.01ms !important;
  }
}
</style>
