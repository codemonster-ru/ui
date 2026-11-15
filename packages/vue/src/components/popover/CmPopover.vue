<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, useAttrs, watch, type ComponentPublicInstance, type PropType } from 'vue';

import { observeCmAnchoredPosition, type CmAnchoredStyle } from '@codemonster-ru/ui-runtime/anchored-position';
import { authoredTriggerElement, CmAuthoredTrigger, disclosureTriggerActions } from '../../internal/disclosure-trigger';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { cmFocusableSelector, popoverKeyAction, resolveDisclosureOpen } from '@codemonster-ru/ui-runtime/core';
import { assertCm } from '../../internal/warn';
import type { CmPopoverPlacement } from './popover.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  open: { type: Boolean, default: undefined },
  defaultOpen: Boolean,
  disabled: Boolean,
  teleportTo: { type: [String, Object, Boolean] as PropType<string | HTMLElement | null | false>, default: null },
  disableTeleport: Boolean,
  triggerAsChild: Boolean,
  showArrow: Boolean,
  closeOnOutsideClick: { type: Boolean, default: true },
  closeOnEscape: { type: Boolean, default: true },
  focusOnOpen: Boolean,
  placement: {
    type: String as PropType<CmPopoverPlacement>,
    default: 'bottom-start',
    validator: (value: string) => ['top', 'bottom-start', 'bottom-end'].includes(value),
  },
});
const emit = defineEmits<{ openChange: [open: boolean]; 'update:open': [open: boolean] }>();
const attrs = useAttrs();
const root = ref<HTMLElement>();
const trigger = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const localOpen = ref(resolveDisclosureOpen(props.open ?? props.defaultOpen, props.disabled));
const panelStyle = shallowRef<CmAnchoredStyle>();
assertCm(props.id.trim() !== '' && props.label.trim() !== '', 'Popover id and label must be non-empty strings.');
const placement = computed(() =>
  ['top', 'bottom-start', 'bottom-end'].includes(props.placement) ? props.placement : ('bottom-start' as const),
);
const classes = computed(() =>
  mergeCmClasses(
    'cm-popover',
    placement.value === 'bottom-start' ? undefined : `cm-popover--${placement.value}`,
    localOpen.value ? 'cm-popover--open' : undefined,
    attrs.class,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, [
    'data-cm-controller',
    'data-cm-popover-close-on-outside-click',
    'data-cm-popover-close-on-escape',
    'data-cm-popover-focus-on-open',
  ]),
);
const teleportTarget = computed(() => {
  const anchor = trigger.value;
  const requested = props.teleportTo;
  if (!localOpen.value || props.disableTeleport || !requested || !anchor) return null;
  try {
    const target =
      typeof requested === 'string'
        ? ((requested === 'body' ? anchor.closest('dialog') : null) ?? anchor.ownerDocument.querySelector(requested))
        : requested;
    return target?.isConnected && !root.value?.contains(target) ? target : null;
  } catch {
    return null;
  }
});
watch(
  () => [props.open, props.disabled] as const,
  ([open, disabled]) => (localOpen.value = resolveDisclosureOpen(open ?? localOpen.value, disabled)),
);

function setOpen(open: boolean, restoreFocus = false): void {
  const next = resolveDisclosureOpen(open, props.disabled);
  if (localOpen.value === next) return;
  localOpen.value = next;
  emit('update:open', next);
  emit('openChange', next);
  if (restoreFocus) trigger.value?.focus();
}

const close = () => setOpen(false, true);

function focusPanel(): void {
  void nextTick(() => {
    const content = panel.value;
    if (!localOpen.value || !content) return;
    const candidates = [...content.querySelectorAll<HTMLElement>(cmFocusableSelector)].filter(
      (item) => !item.matches(':disabled') && !item.closest('[hidden], [inert]'),
    );
    const autofocus = candidates.find((item) => item.matches('[autofocus], [data-autofocus]'));
    (autofocus ?? candidates[0] ?? (props.focusOnOpen ? content : undefined))?.focus();
  });
}

function toggle(): void {
  if (localOpen.value) close();
  else {
    setOpen(true);
    if (props.focusOnOpen) focusPanel();
  }
}

const { activate, toggleFromSlot } = disclosureTriggerActions(toggle);
function captureTrigger(element: Element | ComponentPublicInstance | null): void {
  trigger.value = authoredTriggerElement(element);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  const action = popoverKeyAction(event.key, {
    disabled: props.disabled,
    onTrigger: event.target === trigger.value,
    open: localOpen.value,
  });
  if (!action || (action.type === 'close' && !props.closeOnEscape)) return;

  event.preventDefault();
  if (action.type === 'close') {
    setOpen(false, action.restoreFocus);
    return;
  }
  setOpen(true);
  if (action.focus === 'first') focusPanel();
}

function onDocumentClick(event: MouseEvent): void {
  const view = trigger.value?.ownerDocument.defaultView;
  if (
    props.closeOnOutsideClick &&
    view &&
    event.target instanceof view.Node &&
    !root.value?.contains(event.target) &&
    !panel.value?.contains(event.target)
  )
    setOpen(false);
}

watch(
  [localOpen, teleportTarget, placement, trigger, panel, () => props.showArrow],
  ([open, target, preferred, anchor, content], _, onCleanup) => {
    if (!open || !anchor || !content) return;
    const document = anchor.ownerDocument;
    const stop = observeCmAnchoredPosition(anchor, content, preferred, 10, target ? null : root.value, (style) => {
      panelStyle.value = style;
    });
    document.addEventListener('click', onDocumentClick);
    onCleanup(() => {
      stop();
      panelStyle.value = undefined;
      document.removeEventListener('click', onDocumentClick);
    });
  },
  { flush: 'post' },
);

useCmHydrated();
</script>

<template>
  <div
    ref="root"
    v-bind="rootAttrs"
    :class="classes"
    data-cm-controller="popover"
    :data-cm-popover-close-on-outside-click="props.closeOnOutsideClick ? undefined : 'false'"
    :data-cm-popover-close-on-escape="props.closeOnEscape ? undefined : 'false'"
    :data-cm-popover-focus-on-open="props.focusOnOpen ? 'true' : undefined"
    @keydown="onKeydown"
  >
    <CmAuthoredTrigger
      v-if="props.triggerAsChild && $slots.trigger"
      :id="`${props.id}-trigger`"
      :panel-id="`${props.id}-panel`"
      :label="props.label"
      :open="localOpen"
      :disabled="props.disabled"
      :capture="captureTrigger"
      :activate="activate"
      trigger-class="cm-popover__trigger"
      popup="dialog"
    >
      <slot name="trigger" :open="localOpen" :toggle="toggleFromSlot" />
    </CmAuthoredTrigger>
    <button
      v-else
      :id="`${props.id}-trigger`"
      ref="trigger"
      class="cm-popover__trigger"
      type="button"
      :aria-label="props.label"
      aria-haspopup="dialog"
      :aria-expanded="localOpen"
      :aria-controls="`${props.id}-panel`"
      :disabled="props.disabled || undefined"
      @click="activate"
    >
      <slot name="trigger" :open="localOpen" :toggle="toggleFromSlot">{{ props.label }}</slot>
    </button>
    <Teleport :to="teleportTarget ?? 'body'" :disabled="!teleportTarget">
      <div
        :id="`${props.id}-panel`"
        ref="panel"
        class="cm-popover__panel"
        :data-cm-floating-arrow="props.showArrow ? '' : undefined"
        role="dialog"
        :aria-labelledby="`${props.id}-trigger`"
        :hidden="!localOpen"
        :tabindex="props.focusOnOpen ? -1 : undefined"
        :data-cm-popover-portaled="teleportTarget ? '' : undefined"
        v-bind="panelStyle ? { style: panelStyle } : {}"
        @keydown="teleportTarget && onKeydown($event)"
      >
        <slot :open="localOpen" :close="close" />
      </div>
    </Teleport>
  </div>
</template>
