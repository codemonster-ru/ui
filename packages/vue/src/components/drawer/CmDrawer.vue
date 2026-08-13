<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import { useCmModal } from '../modal/use-modal';
import type { CmDrawerSide } from './drawer.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  open: Boolean,
  side: {
    type: String as PropType<CmDrawerSide>,
    default: 'end',
    validator: (value: string) => ['start', 'end'].includes(value),
  },
  closeLabel: { type: String, default: 'Close' },
});
const emit = defineEmits<{ openChange: [open: boolean]; 'update:open': [open: boolean] }>();
const attrs = useAttrs();
if (![props.id, props.title, props.closeLabel].every((value) => value.trim())) {
  throw new TypeError('Drawer id, title, and closeLabel must be non-empty strings.');
}
const side = computed(() => (['start', 'end'].includes(props.side) ? props.side : 'end'));
const modal = useCmModal(
  () => props.open,
  (open) => {
    emit('update:open', open);
    emit('openChange', open);
  },
);
const { dialog, localOpen, onCancel, onKeydown, setOpen } = modal;
const classes = computed(() =>
  mergeCmClasses(
    'cm-drawer',
    `cm-drawer--${side.value}`,
    localOpen.value ? 'cm-drawer--open' : undefined,
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
    'data-cm-drawer-state',
  ]),
);
</script>

<template>
  <dialog
    :id="`${props.id}-drawer`"
    ref="dialog"
    v-bind="rootAttrs"
    :class="classes"
    :open="localOpen || undefined"
    :aria-labelledby="`${props.id}-title`"
    :aria-describedby="props.description ? `${props.id}-description` : undefined"
    data-cm-controller="drawer"
    :data-cm-drawer-state="localOpen ? 'open' : 'closed'"
    @cancel="onCancel"
    @keydown="onKeydown"
  >
    <div class="cm-drawer__surface">
      <header class="cm-drawer__header">
        <h2 :id="`${props.id}-title`" class="cm-drawer__title">{{ props.title }}</h2>
        <!-- prettier-ignore -->
        <button class="cm-drawer__close" type="button" :aria-label="props.closeLabel" data-cm-drawer-close @click="setOpen(false)">×</button>
      </header>
      <p v-if="props.description" :id="`${props.id}-description`" class="cm-drawer__description">
        {{ props.description }}
      </p>
      <div class="cm-drawer__body"><slot /></div>
      <footer v-if="$slots.footer" class="cm-drawer__footer"><slot name="footer" /></footer>
    </div>
  </dialog>
</template>
