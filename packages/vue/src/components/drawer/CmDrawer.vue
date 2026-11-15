<script setup lang="ts">
import { computed, useAttrs, useSlots, type CSSProperties, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { assertCm } from '../../internal/warn';
import { useCmModal } from '../modal/use-modal';
import { cmDrawerSides, cmDrawerSizes, type CmDrawerSide, type CmDrawerSize } from './drawer.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, default: undefined },
  description: { type: String as PropType<string | null>, default: null },
  open: { type: Boolean, default: undefined },
  defaultOpen: Boolean,
  ariaLabel: { type: String, default: undefined },
  ariaLabelledby: { type: String, default: undefined },
  ariaDescribedby: { type: String, default: undefined },
  side: {
    type: String as PropType<CmDrawerSide>,
    default: 'end',
    validator: (value: CmDrawerSide) => cmDrawerSides.includes(value),
  },
  closeLabel: { type: String, default: 'Close' },
  dismissible: { type: Boolean, default: true },
  closable: { type: Boolean, default: true },
  closeOnEscape: { type: Boolean, default: true },
  closeOnOverlayClick: Boolean,
  focusDrawer: Boolean,
  offsetTop: { type: [Number, String], default: undefined },
  bodyPadding: { type: [Number, String], default: undefined },
  size: {
    type: String as PropType<CmDrawerSize>,
    default: 'md',
    validator: (value: CmDrawerSize) => cmDrawerSizes.includes(value),
  },
  dividers: Boolean,
  rounded: Boolean,
});
const emit = defineEmits<{ openChange: [open: boolean]; 'update:open': [open: boolean] }>();
const attrs = useAttrs();
const slots = useSlots();
const hasHeading = () => Boolean(props.title?.trim() || slots.header);
const ariaLabel = computed(() => props.ariaLabel?.trim() || undefined);
const explicitLabelledby = computed(() => props.ariaLabelledby?.trim() || undefined);
assertCm(
  props.id.trim() !== '' && props.closeLabel.trim() !== '',
  'Drawer id and closeLabel must be non-empty strings.',
);
assertCm(Boolean(hasHeading() || ariaLabel.value || explicitLabelledby.value), 'Drawer requires an accessible name.');
const side = computed(() => (cmDrawerSides.includes(props.side) ? props.side : 'end'));
const size = computed(() => (cmDrawerSizes.includes(props.size) ? props.size : 'md'));
const modal = useCmModal(
  () => props.open,
  (open) => {
    emit('update:open', open);
    emit('openChange', open);
  },
  props.defaultOpen,
);
const { dialog, localOpen, onCancel, onClose, onKeydown, setOpen } = modal;
defineExpose({ restoreAfterMove: modal.restoreAfterMove, modalOpen: localOpen });
const allowEscape = computed(() => props.dismissible && props.closeOnEscape);
function requestClose(): void {
  if (props.dismissible) setOpen(false);
}
function onBackdropClick(event: MouseEvent): void {
  if (!props.closeOnOverlayClick || !dialog.value) return;
  const { left, top, right, bottom } = dialog.value.getBoundingClientRect();
  if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) requestClose();
}
const classes = computed(() =>
  mergeCmClasses(
    'cm-drawer',
    `cm-drawer--${side.value}`,
    `cm-drawer--${size.value}`,
    props.dividers ? 'cm-drawer--dividers' : undefined,
    props.rounded ? 'cm-drawer--rounded' : undefined,
    localOpen.value ? 'cm-drawer--open' : undefined,
    attrs.class,
  ),
);
function cssLength(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}
const rootAttrs = computed(() => {
  const forwarded = omitCmOwnedAttrs(attrs, []);
  const style: CSSProperties = {};
  if (props.offsetTop !== undefined) style['--cm-drawer-offset-top'] = cssLength(props.offsetTop);
  if (props.bodyPadding !== undefined) style['--cm-drawer-body-padding'] = cssLength(props.bodyPadding);
  if (Object.keys(style).length) forwarded.style = [attrs.style, style];
  return forwarded;
});

useCmHydrated();
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="rootAttrs"
    :id="`${props.id}-drawer`"
    :class="classes"
    :open="localOpen || undefined"
    :aria-label="ariaLabel"
    :aria-labelledby="explicitLabelledby ?? (!ariaLabel && hasHeading() ? `${props.id}-title` : undefined)"
    :aria-describedby="
      props.ariaDescribedby?.trim() || (props.description || $slots.description ? `${props.id}-description` : undefined)
    "
    data-cm-controller="drawer"
    :data-cm-drawer-state="localOpen ? 'open' : 'closed'"
    :data-cm-drawer-dismissible="props.dismissible ? 'true' : 'false'"
    :data-cm-drawer-closable="props.closable ? undefined : 'false'"
    :data-cm-drawer-close-on-escape="props.closeOnEscape ? undefined : 'false'"
    :data-cm-drawer-close-on-overlay-click="props.closeOnOverlayClick ? 'true' : undefined"
    @cancel="onCancel($event, allowEscape)"
    @close="onClose"
    @keydown="onKeydown($event, allowEscape)"
    @click.self="onBackdropClick"
  >
    <div
      class="cm-drawer__surface"
      :tabindex="props.focusDrawer ? -1 : undefined"
      :data-autofocus="props.focusDrawer ? '' : undefined"
    >
      <header v-if="hasHeading() || $slots.actions || props.closable" class="cm-drawer__header">
        <h2 v-if="hasHeading()" :id="`${props.id}-title`" class="cm-drawer__title">
          <slot name="header" :title-id="`${props.id}-title`">{{ props.title }}</slot>
        </h2>
        <div v-if="$slots.actions" class="cm-drawer__actions">
          <slot name="actions" :close="requestClose" />
        </div>
        <!-- prettier-ignore -->
        <button v-if="props.closable" class="cm-drawer__close" type="button" :aria-label="props.closeLabel" :disabled="!props.dismissible" data-cm-drawer-close @click="requestClose">×</button>
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
