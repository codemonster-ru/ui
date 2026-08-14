<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import { useCmModal } from '../modal/use-modal';
import type { CmDrawerSide, CmDrawerSize } from './drawer.types';

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
  dismissible: { type: Boolean, default: true },
  size: {
    type: String as PropType<CmDrawerSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg', 'full'].includes(value),
  },
  dividers: Boolean,
  rounded: Boolean,
});
const emit = defineEmits<{ openChange: [open: boolean]; 'update:open': [open: boolean] }>();
const attrs = useAttrs();
if (![props.id, props.title, props.closeLabel].every((value) => value.trim())) {
  throw new TypeError('Drawer id, title, and closeLabel must be non-empty strings.');
}
const side = computed(() => (['start', 'end'].includes(props.side) ? props.side : 'end'));
const size = computed(() => (['sm', 'md', 'lg', 'full'].includes(props.size) ? props.size : 'md'));
const modal = useCmModal(
  () => props.open,
  (open) => {
    emit('update:open', open);
    emit('openChange', open);
  },
);
const { dialog, localOpen, onCancel, onKeydown, setOpen } = modal;
function requestClose(): void {
  if (props.dismissible) setOpen(false);
}
const classes = computed(() =>
  mergeCmClasses(
    'cm-drawer',
    `cm-drawer--${side.value}`,
    `cm-drawer--${size.value}`,
    props.dividers ? 'cm-drawer--dividers' : undefined,
    props.rounded ? 'cm-drawer--rounded' : undefined,
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
    'data-cm-drawer-dismissible',
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
    :aria-describedby="props.description || $slots.description ? `${props.id}-description` : undefined"
    data-cm-controller="drawer"
    :data-cm-drawer-state="localOpen ? 'open' : 'closed'"
    :data-cm-drawer-dismissible="props.dismissible ? 'true' : 'false'"
    @cancel="props.dismissible ? onCancel($event) : $event.preventDefault()"
    @keydown="props.dismissible ? onKeydown($event) : undefined"
  >
    <div class="cm-drawer__surface">
      <header class="cm-drawer__header">
        <h2 :id="`${props.id}-title`" class="cm-drawer__title">
          <slot name="header" :title-id="`${props.id}-title`">{{ props.title }}</slot>
        </h2>
        <div v-if="$slots.actions" class="cm-drawer__actions">
          <slot name="actions" :close="requestClose" />
        </div>
        <!-- prettier-ignore -->
        <button class="cm-drawer__close" type="button" :aria-label="props.closeLabel" :disabled="!props.dismissible" data-cm-drawer-close @click="requestClose">×</button>
      </header>
      <div v-if="$slots.description" :id="`${props.id}-description`" class="cm-drawer__description">
        <slot name="description" :description-id="`${props.id}-description`" />
      </div>
      <p v-else-if="props.description" :id="`${props.id}-description`" class="cm-drawer__description">
        {{ props.description }}
      </p>
      <div class="cm-drawer__body"><slot :close="requestClose" /></div>
      <footer v-if="$slots.footer" class="cm-drawer__footer">
        <slot name="footer" :close="requestClose" />
      </footer>
    </div>
  </dialog>
</template>
