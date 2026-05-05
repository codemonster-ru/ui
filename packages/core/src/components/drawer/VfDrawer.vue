<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  useSlots,
  watch,
  type CSSProperties,
  type Slots,
  type StyleValue,
} from 'vue';
import { icons } from '@codemonster-ru/vueforge-icons';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import { cx } from '@/utils/classes';
import { useDisclosure, useEscapeKey, useFocusTrap, useId } from '@/composables';
import { useScrollLock } from '@/foundation';
import { vfMotionDurationsMs } from '@/theme/motion';
import type { VfDrawerPlacement, VfDrawerSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfDrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  size?: VfDrawerSize;
  placement?: VfDrawerPlacement;
  dividers?: boolean;
  rounded?: boolean;
  offsetTop?: string | number;
  bodyPadding?: string | number;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  scrollLockTarget?: HTMLElement | null | false;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  closable?: boolean;
}

const props = withDefaults(defineProps<VfDrawerProps>(), {
  open: undefined,
  defaultOpen: false,
  title: undefined,
  size: 'md',
  placement: 'right',
  dividers: false,
  rounded: false,
  offsetTop: undefined,
  bodyPadding: undefined,
  teleportTo: undefined,
  disableTeleport: false,
  scrollLockTarget: undefined,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  closable: true,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  openChange: [value: boolean];
}>();

const attrs = useAttrs();
const contentRef = ref<HTMLElement | null>(null);
const lastFocusedElement = ref<HTMLElement | null>(null);
const drawerSlots = useSlots() as Slots;
const titleId = useId({ prefix: 'vf-drawer-title' });

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
  enter: vfMotionDurationsMs.normal,
  leave: vfMotionDurationsMs.normal,
} as const;

function normalizeCssLength(value: string | number | undefined): string | undefined {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value;
}

const drawerVariables = computed<CSSProperties>(() => {
  const variables: CSSProperties = {};
  const offsetTop = normalizeCssLength(props.offsetTop);
  const bodyPadding = normalizeCssLength(props.bodyPadding);

  if (offsetTop != null) {
    variables['--vf-drawer-offset-top'] = offsetTop;
  }

  if (bodyPadding != null) {
    variables['--vf-drawer-body-padding'] = bodyPadding;
  }

  return variables;
});

const rootClasses = computed(() =>
  cx(
    'vf-drawer',
    `vf-drawer--${props.placement}`,
    props.dividers && 'vf-drawer--dividers',
    props.rounded && 'vf-drawer--rounded',
    props.offsetTop != null && 'vf-drawer--offset-top',
  ),
);
const rootStyles = computed<StyleValue>(() => [drawerVariables.value, attrs.style as StyleValue]);
const rootAttrs = computed(() => {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'));
});
const teleportDisabled = computed(
  () => props.disableTeleport || props.teleportTo === false || props.teleportTo === null,
);
const resolvedScrollLockTarget = computed(() => {
  if (props.scrollLockTarget === false) {
    return null;
  }

  return props.scrollLockTarget;
});
const teleportTarget = computed(() => {
  if (typeof props.teleportTo === 'string') {
    return props.teleportTo;
  }

  if (typeof HTMLElement !== 'undefined' && props.teleportTo instanceof HTMLElement) {
    return props.teleportTo;
  }

  return 'body';
});
const contentClasses = computed(() =>
  cx('vf-drawer__content', `vf-drawer__content--${props.placement}`, `vf-drawer__content--${props.size}`),
);

const hasHeaderSlot = computed(() => Boolean(drawerSlots.header));
const labelledBy = computed<string | undefined>(() => (props.title || hasHeaderSlot.value ? titleId.value : undefined));

function close() {
  disclosure.close();
}

function handleOverlayClick() {
  if (!props.closeOnOverlayClick) {
    return;
  }

  close();
}

function focusDrawerContent() {
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

useScrollLock(isOpen, {
  target: resolvedScrollLockTarget,
});

watch(
  isOpen,
  async (value) => {
    if (typeof document === 'undefined') {
      return;
    }

    if (value) {
      lastFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      await nextTick();
      focusDrawerContent();
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
    <Transition name="vf-drawer-transition" appear :duration="transitionDuration">
      <div v-if="isOpen" :class="[rootClasses, attrs.class]" :style="rootStyles" v-bind="rootAttrs">
        <div class="vf-drawer__overlay" aria-hidden="true" @click="handleOverlayClick" />

        <section
          ref="contentRef"
          :class="contentClasses"
          :aria-labelledby="labelledBy"
          aria-modal="true"
          role="dialog"
          tabindex="-1"
        >
          <header v-if="title || $slots.header" class="vf-drawer__header">
            <div>
              <slot name="header">
                <h2 v-if="title" :id="titleId" class="vf-drawer__title">
                  {{ title }}
                </h2>
              </slot>
            </div>

            <div class="vf-drawer__actions">
              <slot name="actions" :close="close" />

              <VfIconButton
                v-if="props.closable"
                :icon="icons.xmark"
                aria-label="Close drawer"
                size="md"
                variant="ghost"
                @click="close"
              />
            </div>
          </header>

          <div v-if="$slots.default" class="vf-drawer__body">
            <slot :close="close" />
          </div>

          <footer v-if="$slots.footer" class="vf-drawer__footer">
            <slot name="footer" :close="close" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
