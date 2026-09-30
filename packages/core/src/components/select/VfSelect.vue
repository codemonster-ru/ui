<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, useAttrs, useSlots, watch, type StyleValue } from 'vue';
import { flip, offset, shift, type MiddlewareType, type PlacementType } from '@codemonster-ru/floater.js';
import {
  SELECT_OFFSET,
  SELECT_STRATEGY,
  SELECT_TRIGGER_OPEN_KEYS,
  resolveSelectDisplayLabel,
  resolveSelectFieldFilled,
  resolveSelectFlipPlacements,
  resolveSelectFocusIndex,
  resolveSelectForwardsAttribute,
  resolveSelectHasClearControl,
  resolveSelectHasValue,
  resolveSelectMenuClasses,
  resolveSelectMenuNavigation,
  resolveSelectRendersHiddenInput,
  resolveSelectScrollTop,
  resolveSelectSelectedOption,
  resolveSelectTeleport,
  resolveSelectTriggerClasses,
  resolveSelectWrapperClasses,
} from '@codemonster-ru/vueforge-shared-core';
import { VueIconify, icons, type IconName } from '@codemonster-ru/vueforge-icons';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import { useClickOutside, useDisclosure, useEscapeKey, useFloating, useId } from '@/composables';
import { useFocusScopeBranch } from '@/composables/useFocusTrap';
import { vfMotionDurationsMs } from '@/theme/motion';
import { cx } from '@/utils/classes';
import type { VfControlSize, VfDropdownPlacement, VfSelectOption } from '@/types/components';
import { vfFieldContextKey } from '@/components/field/context';

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
const fieldContext = inject(vfFieldContextKey, null);
const triggerId = useId({ prefix: 'vf-select-trigger' });

fieldContext?.setFloatingSupported(true);
const listboxId = useId({ prefix: 'vf-select-listbox' });
const transitionDuration = {
  enter: vfMotionDurationsMs.normal,
  leave: vfMotionDurationsMs.normal,
} as const;

const disclosure = useDisclosure();
const isOpen = disclosure.isOpen;

useFocusScopeBranch(menuRef, isOpen);

const selectedOption = computed(() => resolveSelectSelectedOption(props.options, props.modelValue));

const hasValue = computed(() => resolveSelectHasValue(props.modelValue));
const hasLeadingAdornment = computed(() => Boolean(props.leadingIcon) || Boolean(slots.leading));
const hasTrailingAdornment = computed(() => Boolean(props.trailingIcon) || Boolean(slots.trailing));
const hasClearControl = computed(() => resolveSelectHasClearControl(props.clearable, hasValue.value, props.disabled));
const isFloatingLabel = computed(() => fieldContext?.labelPlacement.value === 'floating');
const externalClass = computed(() => attrs.class as string | undefined);
const externalStyle = computed<StyleValue>(() => attrs.style as StyleValue);
const triggerAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => resolveSelectForwardsAttribute(key))),
);

const classState = computed(() => ({
  size: props.size,
  hasLeading: hasLeadingAdornment.value,
  hasTrailing: hasTrailingAdornment.value,
  hasClear: hasClearControl.value,
  floating: isFloatingLabel.value,
}));

const triggerClasses = computed(() =>
  cx(
    ...resolveSelectTriggerClasses({
      ...classState.value,
      invalid: props.invalid,
      open: isOpen.value,
      hasSelection: Boolean(selectedOption.value),
      placeholder: props.placeholder,
    }),
  ),
);

const wrapperClasses = computed(() => cx(...resolveSelectWrapperClasses(classState.value)));

const displayLabel = computed(() =>
  resolveSelectDisplayLabel(selectedOption.value?.label, isFloatingLabel.value, props.placeholder),
);

watch(
  [hasValue, isOpen],
  ([value, open]) => {
    fieldContext?.setFilled(resolveSelectFieldFilled(value, open));
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  fieldContext?.setFloatingSupported(false);
  fieldContext?.setFilled(false);
});

// The element case is this adapter's own: no other adapter can pass one.
const teleport = computed(() =>
  resolveSelectTeleport(
    props.teleportTo,
    props.disableTeleport,
    (value): value is HTMLElement => typeof HTMLElement !== 'undefined' && value instanceof HTMLElement,
  ),
);

const allowedPlacements = computed(() => resolveSelectFlipPlacements(props.placement) as PlacementType[]);

const { placement: floatingPlacement, styles: floatingStyles } = useFloating(triggerRef, menuRef, {
  enabled: isOpen,
  placement: computed(() => props.placement),
  middleware: computed(
    () => [offset(SELECT_OFFSET), flip({ placements: allowedPlacements.value }), shift()] as MiddlewareType[],
  ),
  strategy: SELECT_STRATEGY,
});

const menuClasses = computed(() => resolveSelectMenuClasses(floatingPlacement.value));

const menuStyles = computed(() => ({
  ...floatingStyles.value,
  minWidth: triggerRef.value ? `${triggerRef.value.offsetWidth}px` : undefined,
}));

function getItems() {
  return Array.from(menuRef.value?.querySelectorAll<HTMLElement>('[role="option"]:not(:disabled)') ?? []);
}

async function syncSelectedIntoView(options: { focus?: boolean } = {}) {
  await nextTick();
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  const items = getItems();
  const targetItem = items[resolveSelectFocusIndex(props.options, props.modelValue)];

  if (!targetItem) {
    return;
  }

  const menuElement = menuRef.value;

  if (menuElement) {
    const scrollTop = resolveSelectScrollTop({
      top: targetItem.offsetTop,
      height: targetItem.offsetHeight,
      scrollTop: menuElement.scrollTop,
      clientHeight: menuElement.clientHeight,
    });

    if (scrollTop !== undefined) {
      menuElement.scrollTop = scrollTop;
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

  if (SELECT_TRIGGER_OPEN_KEYS.includes(event.key)) {
    event.preventDefault();
    openMenu({ focusSelected: true });
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  const items = getItems();
  const currentIndex = items.findIndex((item) => item === document.activeElement);
  const target = resolveSelectMenuNavigation(event.key, currentIndex, items.length);

  if (target !== undefined) {
    event.preventDefault();
    items[target]?.focus();
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    const option = props.options.filter((item) => !item.disabled)[currentIndex];

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
  <div :class="[wrapperClasses, externalClass]" :style="externalStyle">
    <input
      v-if="resolveSelectRendersHiddenInput(attrs.name)"
      type="hidden"
      :name="attrs.name"
      :value="props.modelValue"
      :disabled="props.disabled"
    />

    <button
      :id="typeof attrs.id === 'string' ? attrs.id : triggerId"
      ref="triggerRef"
      type="button"
      :class="triggerClasses"
      :data-vf-filled="hasValue || undefined"
      :aria-controls="listboxId"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-invalid="props.invalid || undefined"
      :disabled="props.disabled"
      v-bind="triggerAttrs"
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

    <Teleport :to="teleport.target" :disabled="teleport.disabled">
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
            tabindex="-1"
            @click="selectOption(option, { restoreFocus: false })"
          >
            {{ option.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
