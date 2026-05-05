<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, useSlots } from 'vue';
import { flip, offset, shift, type MiddlewareType, type PlacementType } from '@codemonster-ru/floater.js';
import { VueIconify, icons, type IconName } from '@codemonster-ru/vueforge-icons';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import { useClickOutside, useDisclosure, useEscapeKey, useFloating, useId } from '@/composables';
import { vfMotionDurationsMs } from '@/theme/motion';
import { cx } from '@/utils/classes';
import type { VfControlSize, VfDropdownPlacement, VfSelectOption } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfSelectProps {
  modelValue?: string;
  options: VfSelectOption[];
  size?: VfControlSize;
  invalid?: boolean;
  leadingIcon?: IconName | string;
  trailingIcon?: IconName | string;
  clearable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  placement?: VfDropdownPlacement;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
}

const props = withDefaults(defineProps<VfSelectProps>(), {
  modelValue: '',
  size: 'md',
  invalid: false,
  leadingIcon: undefined,
  trailingIcon: undefined,
  clearable: false,
  placeholder: undefined,
  disabled: false,
  placement: 'bottom-start',
  teleportTo: undefined,
  disableTeleport: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const attrs = useAttrs();
const slots = useSlots();
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const triggerId = useId({ prefix: 'vf-select-trigger' });
const listboxId = useId({ prefix: 'vf-select-listbox' });
const transitionDuration = {
  enter: vfMotionDurationsMs.fast,
  leave: vfMotionDurationsMs.fast,
} as const;

const disclosure = useDisclosure();
const isOpen = disclosure.isOpen;

const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue));

const hasValue = computed(() => String(props.modelValue ?? '').length > 0);
const hasLeadingAdornment = computed(() => Boolean(props.leadingIcon) || Boolean(slots.leading));
const hasTrailingAdornment = computed(() => Boolean(props.trailingIcon) || Boolean(slots.trailing));
const hasClearControl = computed(() => Boolean(props.clearable) && hasValue.value && !props.disabled);

const triggerClasses = computed(() =>
  cx(
    'vf-select',
    props.size !== 'md' && `vf-select--${props.size}`,
    props.invalid && 'vf-select--invalid',
    isOpen.value && 'vf-select--open',
    !selectedOption.value && props.placeholder && 'vf-select--placeholder',
    hasLeadingAdornment.value && 'vf-select--with-leading',
    hasTrailingAdornment.value && 'vf-select--with-trailing',
    hasClearControl.value && 'vf-select--with-clear',
  ),
);

const wrapperClasses = computed(() =>
  cx(
    'vf-select-wrap',
    props.size !== 'md' && `vf-select-wrap--${props.size}`,
    hasLeadingAdornment.value && 'vf-select-wrap--with-leading',
    hasTrailingAdornment.value && 'vf-select-wrap--with-trailing',
    hasClearControl.value && 'vf-select-wrap--with-clear',
  ),
);

const displayLabel = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value.label;
  }

  return props.placeholder ?? '';
});

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

const allowedPlacements = computed<PlacementType[]>(() =>
  props.placement === 'bottom-end' ? ['bottom-end', 'top-end'] : ['bottom-start', 'top-start'],
);

const { placement: floatingPlacement, styles: floatingStyles } = useFloating(triggerRef, menuRef, {
  enabled: isOpen,
  placement: computed(() => props.placement),
  middleware: computed(() => [offset(2), flip({ placements: allowedPlacements.value }), shift()] as MiddlewareType[]),
  strategy: 'fixed',
});

const menuClasses = computed(() => [
  'vf-dropdown__menu',
  'vf-select__menu',
  floatingPlacement.value.startsWith('top') && 'vf-dropdown__menu--top',
]);

const menuStyles = computed(() => ({
  ...floatingStyles.value,
  minWidth: triggerRef.value ? `${triggerRef.value.offsetWidth}px` : undefined,
}));

function getItems() {
  return Array.from(menuRef.value?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
}

async function syncSelectedIntoView(options: { focus?: boolean } = {}) {
  await nextTick();
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  const items = getItems();
  const selectedIndex = props.options.findIndex((option) => option.value === props.modelValue && !option.disabled);

  const targetItem = items[Math.max(selectedIndex, 0)];

  if (!targetItem) {
    return;
  }

  const menuElement = menuRef.value;

  if (menuElement) {
    const itemTop = targetItem.offsetTop;
    const itemBottom = itemTop + targetItem.offsetHeight;
    const viewPadding = 8;
    const viewTop = menuElement.scrollTop;
    const viewBottom = viewTop + menuElement.clientHeight;

    if (itemTop - viewPadding < viewTop) {
      menuElement.scrollTop = Math.max(itemTop - viewPadding, 0);
    } else if (itemBottom + viewPadding > viewBottom) {
      menuElement.scrollTop = itemBottom - menuElement.clientHeight + viewPadding;
    }
  }

  if (options.focus) {
    targetItem.focus();
  }
}

function openMenu(options: { focusSelected?: boolean } = {}) {
  if (props.disabled) {
    return;
  }

  disclosure.open();

  void syncSelectedIntoView({ focus: options.focusSelected });
}

function closeMenu(options: { restoreFocus?: boolean } = {}) {
  disclosure.close();

  if (options.restoreFocus !== false) {
    triggerRef.value?.focus();
  }
}

function toggleMenu() {
  if (props.disabled) {
    return;
  }

  if (isOpen.value) {
    closeMenu();
    return;
  }

  openMenu();
}

function clearValue(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  if (props.disabled || !hasClearControl.value) {
    return;
  }

  emit('update:modelValue', '');
  closeMenu();
}

function selectOption(option: VfSelectOption, options: { restoreFocus?: boolean } = {}) {
  if (option.disabled) {
    return;
  }

  emit('update:modelValue', option.value);
  closeMenu({ restoreFocus: options.restoreFocus });
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled) {
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openMenu({ focusSelected: true });
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  const items = getItems();
  const currentIndex = items.findIndex((item) => item === document.activeElement);

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    items[(currentIndex + 1 + items.length) % items.length]?.focus();
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    items[(currentIndex - 1 + items.length) % items.length]?.focus();
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    items[0]?.focus();
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    items[items.length - 1]?.focus();
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    const option = props.options[currentIndex];

    if (!option) {
      return;
    }

    event.preventDefault();
    selectOption(option, { restoreFocus: true });
  }
}

useClickOutside(
  [triggerRef, menuRef],
  () => {
    if (isOpen.value) {
      closeMenu({ restoreFocus: false });
    }
  },
  {
    enabled: isOpen,
    event: 'click',
  },
);

useEscapeKey(
  (event) => {
    if (!isOpen.value) {
      return;
    }

    event.preventDefault();
    closeMenu();
  },
  {
    enabled: isOpen,
  },
);
</script>

<template>
  <div :class="wrapperClasses">
    <input v-if="typeof attrs.name === 'string'" type="hidden" :name="attrs.name" :value="props.modelValue" />

    <button
      :id="typeof attrs.id === 'string' ? attrs.id : triggerId"
      ref="triggerRef"
      type="button"
      :class="triggerClasses"
      :aria-controls="listboxId"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-invalid="props.invalid || undefined"
      :disabled="props.disabled"
      @click="toggleMenu"
      @keydown="onTriggerKeydown"
    >
      <span v-if="hasLeadingAdornment" class="vf-select__icon vf-select__icon--leading" aria-hidden="true">
        <slot name="leading">
          <VueIconify v-if="props.leadingIcon" :icon="props.leadingIcon" size="var(--vf-field-icon-size)" />
        </slot>
      </span>

      <span class="vf-select__value">{{ displayLabel }}</span>

      <span v-if="hasTrailingAdornment" class="vf-select__icon vf-select__icon--trailing" aria-hidden="true">
        <slot name="trailing">
          <VueIconify v-if="props.trailingIcon" :icon="props.trailingIcon" size="var(--vf-field-icon-size)" />
        </slot>
      </span>

      <span v-if="!hasClearControl" class="vf-select__icon vf-select__icon--chevron" aria-hidden="true">
        <VueIconify :icon="icons.chevronDown" size="var(--vf-field-icon-size)" />
      </span>
    </button>

    <VfIconButton
      v-if="hasClearControl"
      class="vf-select-wrap__clear"
      :icon="icons.xmark"
      variant="ghost"
      size="sm"
      aria-label="Clear select"
      @mousedown.prevent
      @click="clearValue"
    />

    <Teleport :to="teleportTarget" :disabled="teleportDisabled">
      <Transition name="vf-floating-transition" appear :duration="transitionDuration">
        <div
          v-if="isOpen"
          :id="listboxId"
          ref="menuRef"
          :class="menuClasses"
          :style="menuStyles"
          :aria-labelledby="typeof attrs.id === 'string' ? attrs.id : triggerId"
          role="listbox"
          @keydown="onMenuKeydown"
        >
          <button
            v-for="option in props.options"
            :key="option.value"
            type="button"
            class="vf-dropdown__item vf-select__option"
            :class="[option.value === props.modelValue && 'vf-select__option--selected']"
            role="option"
            :aria-selected="option.value === props.modelValue"
            :disabled="option.disabled"
            @click="selectOption(option, { restoreFocus: false })"
          >
            {{ option.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
