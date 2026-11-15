<script setup lang="ts">
import { computed, useId, watch } from 'vue';
import { useScrollLock } from '../../composables/scroll-lock';
import { useVfModalPortal } from '../modal/modal-portal';
import CmDrawer from './CmDrawer.vue';
import type { VfDrawerProps } from './drawer.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfDrawerProps>(), {
  open: undefined,
  placement: 'right',
  dismissible: true,
  closable: true,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  focusDrawer: true,
  teleportTo: 'body',
  scrollLockTarget: undefined,
});
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>();
const fallbackId = useId();
const { target, modal } = useVfModalPortal(
  () => props.teleportTo,
  () => props.disableTeleport,
);
useScrollLock(() => Boolean(modal.value?.modalOpen && props.scrollLockTarget), {
  target: () => props.scrollLockTarget || null,
});
const useDocumentScroll = computed(() => props.scrollLockTarget == null);
watch(useDocumentScroll, () => modal.value?.restoreAfterMove()?.(), { flush: 'post' });
const bindings = computed(() => {
  const drawer: VfDrawerProps = { ...props };
  delete drawer.placement;
  delete drawer.teleportTo;
  delete drawer.disableTeleport;
  delete drawer.scrollLockTarget;
  return { ...drawer, side: props.placement, id: props.id ?? fallbackId };
});
</script>

<template>
  <Teleport :to="target ?? 'body'" :disabled="!target">
    <CmDrawer
      ref="modal"
      v-bind="{ ...$attrs, ...bindings }"
      :data-cm-modal-unlocked="useDocumentScroll ? undefined : ''"
      :aria-label="props.ariaLabel ?? (!props.title && !props.ariaLabelledby && !$slots.header ? 'Drawer' : undefined)"
      @update:open="emit('update:open', $event)"
      @open-change="emit('openChange', $event)"
    >
      <template v-for="(_, name) in $slots" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope" />
      </template>
    </CmDrawer>
  </Teleport>
</template>
