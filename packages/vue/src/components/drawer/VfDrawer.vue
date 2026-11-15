<script setup lang="ts">
import { computed, useId } from 'vue';
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
  disableTeleport: false,
});
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>();
const fallbackId = useId();
const { target } = useVfModalPortal(
  () => props.teleportTo,
  () => props.disableTeleport,
);
const bindings = computed(() => {
  const drawer: VfDrawerProps = { ...props };
  delete drawer.placement;
  delete drawer.teleportTo;
  delete drawer.disableTeleport;
  return { ...drawer, side: props.placement, id: props.id ?? fallbackId };
});
</script>

<template>
  <Teleport :to="target ?? 'body'" :disabled="!target">
    <CmDrawer
      ref="modal"
      v-bind="{ ...$attrs, ...bindings }"
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
