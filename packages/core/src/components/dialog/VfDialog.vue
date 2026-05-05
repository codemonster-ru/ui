<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch, type Slots } from 'vue';
import { icons } from '@codemonster-ru/vueforge-icons';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import { cx } from '@/utils/classes';
import { useDisclosure, useEscapeKey, useFocusTrap, useId } from '@/composables';
import { useScrollLock } from '@/foundation';
import { vfMotionDurationsMs } from '@/theme/motion';
import type { VfDialogSize } from '@/types/components';

interface VfDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  description?: string;
  size?: VfDialogSize;
  dividers?: boolean;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  closable?: boolean;
}

const props = withDefaults(defineProps<VfDialogProps>(), {
  open: undefined,
  defaultOpen: false,
  title: undefined,
  description: undefined,
  size: 'md',
  dividers: false,
  teleportTo: undefined,
  disableTeleport: false,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  closable: true,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  openChange: [value: boolean];
}>();

const contentRef = ref<HTMLElement | null>(null);
const lastFocusedElement = ref<HTMLElement | null>(null);
const dialogSlots = useSlots() as Slots;
const titleId = useId({ prefix: 'vf-dialog-title' });
const descriptionId = useId({ prefix: 'vf-dialog-description' });

const disclosure = useDisclosure({
  defaultOpen: props.defaultOpen,
  open: computed(() => props.open),
  onOpenChange: (value) => {
    emit('update:open', value);
    emit('openChange', value);
  },
});

const isOpen = disclosure.isOpen;
const transitionDuration = {
  enter: vfMotionDurationsMs.fast,
  leave: vfMotionDurationsMs.fast,
} as const;
const teleportDisabled = computed(
  () => props.disableTeleport || props.teleportTo === false || props.teleportTo === null,
);
const teleportTarget = computed(() => {
  if (typeof props.teleportTo === 'string') {
    return props.teleportTo;
  }

  if (typeof HTMLElement !== 'undefined' && props.teleportTo instanceof HTMLElement) {
    return props.teleportTo;
  }

  return 'body';
});

const dialogClasses = computed(() =>
  cx(
    'vf-dialog__content',
    props.dividers && 'vf-dialog__content--dividers',
    props.size !== 'md' && `vf-dialog__content--${props.size}`,
  ),
);

const hasHeaderSlot = computed(() => Boolean(dialogSlots.header));
const hasDescriptionSlot = computed(() => Boolean(dialogSlots.description));
const labelledBy = computed<string | undefined>(() => (props.title || hasHeaderSlot.value ? titleId.value : undefined));
const describedBy = computed<string | undefined>(() =>
  props.description || hasDescriptionSlot.value ? descriptionId.value : undefined,
);

function close() {
  disclosure.close();
}

function handleOverlayClick() {
  if (!props.closeOnOverlayClick) {
    return;
  }

  close();
}

function focusDialogContent() {
  const container = contentRef.value;

  if (!container) {
    return;
  }

  const autoFocusTarget = container.querySelector<HTMLElement>('[autofocus], [data-autofocus]');

  if (autoFocusTarget) {
    autoFocusTarget.focus();
    return;
  }

  container.focus();
}

useEscapeKey(
  (event) => {
    if (!props.closeOnEscape || !isOpen.value) {
      return;
    }

    event.preventDefault();
    close();
  },
  {
    enabled: isOpen,
  },
);

useFocusTrap(contentRef, {
  enabled: isOpen,
});

useScrollLock(isOpen);

watch(
  isOpen,
  async (value) => {
    if (typeof document === 'undefined') {
      return;
    }

    if (value) {
      lastFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      await nextTick();
      focusDialogContent();
      return;
    }

    lastFocusedElement.value?.focus();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (isOpen.value) {
    lastFocusedElement.value?.focus();
  }
});
</script>

<template>
  <Teleport :to="teleportTarget" :disabled="teleportDisabled">
    <Transition name="vf-dialog-transition" appear :duration="transitionDuration">
      <div v-if="isOpen" class="vf-dialog">
        <div class="vf-dialog__overlay" aria-hidden="true" @click="handleOverlayClick" />

        <section
          ref="contentRef"
          :class="dialogClasses"
          :aria-describedby="describedBy"
          :aria-labelledby="labelledBy"
          aria-modal="true"
          role="dialog"
          tabindex="-1"
        >
          <header v-if="title || description || $slots.header || $slots.description" class="vf-dialog__header">
            <div>
              <slot name="header">
                <h2 v-if="title" :id="titleId" class="vf-dialog__title">
                  {{ title }}
                </h2>
              </slot>

              <slot name="description">
                <p v-if="description" :id="descriptionId" class="vf-dialog__description">
                  {{ description }}
                </p>
              </slot>
            </div>

            <div class="vf-dialog__actions">
              <slot name="actions" :close="close" />

              <VfIconButton
                v-if="props.closable"
                :icon="icons.xmark"
                aria-label="Close dialog"
                size="md"
                variant="ghost"
                @click="close"
              />
            </div>
          </header>

          <div v-if="$slots.default" class="vf-dialog__body">
            <slot :close="close" />
          </div>

          <footer v-if="$slots.footer" class="vf-dialog__footer">
            <slot name="footer" :close="close" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
