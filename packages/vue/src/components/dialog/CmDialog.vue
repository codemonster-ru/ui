<script setup lang="ts">
import { computed, useAttrs, useSlots, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { assertCm } from '../../internal/warn';
import { useCmModal } from '../modal/use-modal';
import type { CmDialogSize } from './dialog.types';

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
  closeLabel: { type: String, default: 'Close' },
  dismissible: { type: Boolean, default: true },
  closable: { type: Boolean, default: true },
  closeOnOverlayClick: Boolean,
  closeOnEscape: { type: Boolean, default: true },
  focusDialog: Boolean,
  size: {
    type: String as PropType<CmDialogSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  dividers: Boolean,
});
const emit = defineEmits<{ openChange: [open: boolean]; 'update:open': [open: boolean] }>();
const attrs = useAttrs();
const slots = useSlots();
const hasHeading = (): boolean => Boolean(props.title?.trim() || slots.header);
const ariaLabel = computed(() => props.ariaLabel?.trim() || undefined);
const explicitLabelledby = computed(() => props.ariaLabelledby?.trim() || undefined);
assertCm(
  [props.id, props.closeLabel].every((value) => value.trim() !== ''),
  'Dialog id and closeLabel must be non-empty strings.',
);
assertCm(
  Boolean(hasHeading() || ariaLabel.value || explicitLabelledby.value),
  'Dialog requires a title, header slot, aria-label, or aria-labelledby.',
);
const modal = useCmModal(
  () => props.open,
  (open) => {
    emit('update:open', open);
    emit('openChange', open);
  },
  props.defaultOpen,
);
const { dialog, localOpen, onCancel, onClose, onKeydown, setOpen } = modal;
defineExpose({ restoreAfterMove: modal.restoreAfterMove });
const allowEscape = computed(() => props.dismissible && props.closeOnEscape);
function requestClose(): void {
  if (props.dismissible) setOpen(false);
}
const size = computed(() => (['sm', 'md', 'lg'].includes(props.size) ? props.size : 'md'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-dialog',
    `cm-dialog--${size.value}`,
    props.dividers ? 'cm-dialog--dividers' : undefined,
    localOpen.value ? 'cm-dialog--open' : undefined,
    attrs.class,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, [
    'id',
    'open',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'data-cm-controller',
    'data-cm-dialog-state',
    'data-cm-dialog-dismissible',
    'data-cm-dialog-close-on-escape',
  ]),
);

useCmHydrated();
</script>

<template>
  <dialog
    :id="`${props.id}-dialog`"
    ref="dialog"
    v-bind="rootAttrs"
    :class="classes"
    :open="localOpen || undefined"
    :aria-label="ariaLabel"
    :aria-labelledby="explicitLabelledby ?? (!ariaLabel && hasHeading() ? `${props.id}-title` : undefined)"
    :aria-describedby="
      props.ariaDescribedby?.trim() || (props.description || $slots.description ? `${props.id}-description` : undefined)
    "
    data-cm-controller="dialog"
    :data-cm-dialog-state="localOpen ? 'open' : 'closed'"
    :data-cm-dialog-dismissible="props.dismissible ? 'true' : 'false'"
    :data-cm-dialog-close-on-escape="props.closeOnEscape ? undefined : 'false'"
    @cancel="onCancel($event, allowEscape)"
    @close="onClose"
    @keydown="onKeydown($event, allowEscape)"
    @click.self="props.closeOnOverlayClick ? requestClose() : undefined"
  >
    <div
      class="cm-dialog__surface"
      :tabindex="props.focusDialog ? -1 : undefined"
      :data-autofocus="props.focusDialog ? '' : undefined"
    >
      <header v-if="hasHeading() || $slots.actions || props.closable" class="cm-dialog__header">
        <h2 v-if="hasHeading()" :id="`${props.id}-title`" class="cm-dialog__title">
          <slot name="header" :title-id="`${props.id}-title`">{{ props.title }}</slot>
        </h2>
        <div v-if="$slots.actions" class="cm-dialog__actions">
          <slot name="actions" :close="requestClose" />
        </div>
        <!-- prettier-ignore -->
        <button v-if="props.closable" class="cm-dialog__close" type="button" :aria-label="props.closeLabel" :disabled="!props.dismissible" data-cm-dialog-close @click="requestClose">×</button>
      </header>
      <div v-if="$slots.description" :id="`${props.id}-description`" class="cm-dialog__description">
        <slot name="description" :description-id="`${props.id}-description`" />
      </div>
      <p v-else-if="props.description" :id="`${props.id}-description`" class="cm-dialog__description">
        {{ props.description }}
      </p>
      <div class="cm-dialog__body"><slot :close="requestClose" /></div>
      <footer v-if="$slots.footer" class="cm-dialog__footer">
        <slot name="footer" :close="requestClose" />
      </footer>
    </div>
  </dialog>
</template>
