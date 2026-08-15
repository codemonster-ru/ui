<script lang="ts">
import type { InjectionKey, Ref } from 'vue';

export type CoreSelectRecipeSize = 'sm' | 'md' | 'lg';
export type CoreSelectRecipePlacement = 'bottom-start' | 'bottom-end';
export type CoreSelectRecipeFloatingVariant = 'in' | 'on' | 'over';

export interface CoreSelectRecipeOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CoreSelectRecipeFieldContext {
  labelPlacement: Ref<'top' | 'floating'>;
  floatingVariant?: Ref<CoreSelectRecipeFloatingVariant>;
  setFilled: (filled: boolean) => void;
  setFloatingSupported: (supported: boolean) => void;
}

export const coreSelectRecipeFieldContextKey: InjectionKey<CoreSelectRecipeFieldContext> = Symbol(
  'core-select-recipe-field-context',
);
</script>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useId,
  useSlots,
  watch,
  type CSSProperties,
} from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    options: readonly CoreSelectRecipeOption[];
    modelValue?: string;
    size?: CoreSelectRecipeSize;
    invalid?: boolean;
    leadingIcon?: string;
    trailingIcon?: string;
    clearable?: boolean;
    clearLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    placement?: CoreSelectRecipePlacement;
    teleportTo?: string | HTMLElement | null | false;
    disableTeleport?: boolean;
  }>(),
  {
    modelValue: '',
    size: 'md',
    invalid: false,
    leadingIcon: undefined,
    trailingIcon: undefined,
    clearable: false,
    clearLabel: 'Clear select',
    placeholder: undefined,
    disabled: false,
    required: false,
    placement: 'bottom-start',
    teleportTo: undefined,
    disableTeleport: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const attrs = useAttrs();
const slots = useSlots();
const triggerRef = ref<HTMLButtonElement>();
const menuRef = ref<HTMLElement>();
const open = ref(false);
const menuAbove = ref(false);
const menuStyle = ref<CSSProperties>();
const fieldContext = inject(coreSelectRecipeFieldContextKey, null);
const generatedId = useId();
const generatedListboxId = useId();

fieldContext?.setFloatingSupported(true);

const triggerId = computed(() => (typeof attrs.id === 'string' ? attrs.id : `core-select-${generatedId}`));
const listboxId = computed(() => `core-select-listbox-${generatedListboxId}`);
const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue));
const hasValue = computed(() => String(props.modelValue ?? '').length > 0);
const hasLeading = computed(() => Boolean(props.leadingIcon) || Boolean(slots.leading));
const hasTrailing = computed(() => Boolean(props.trailingIcon) || Boolean(slots.trailing));
const hasClear = computed(() => props.clearable && hasValue.value && !props.disabled);
const floating = computed(() => fieldContext?.labelPlacement.value === 'floating');
const floatingVariant = computed(() => fieldContext?.floatingVariant?.value ?? 'in');
const displayLabel = computed(() => selectedOption.value?.label ?? (floating.value ? '' : (props.placeholder ?? '')));
const teleportDisabled = computed(
  () => props.disableTeleport || props.teleportTo === false || props.teleportTo === null,
);
const teleportTarget = computed(() => {
  if (typeof props.teleportTo === 'string') return props.teleportTo;
  if (typeof HTMLElement !== 'undefined' && props.teleportTo instanceof HTMLElement) return props.teleportTo;
  return 'body';
});
const triggerAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => key.startsWith('aria-') || key.startsWith('data-') || ['title', 'tabindex'].includes(key),
    ),
  ),
);

function enabledOptions(): CoreSelectRecipeOption[] {
  return props.options.filter((option) => !option.disabled);
}

function optionElements(): HTMLElement[] {
  return [...(menuRef.value?.querySelectorAll<HTMLElement>('[role="option"]:not(:disabled)') ?? [])];
}

function updateMenuPosition(): void {
  const trigger = triggerRef.value;
  const menu = menuRef.value;
  if (!trigger || !menu || !open.value) return;
  const rect = trigger.getBoundingClientRect();
  const menuHeight = menu.offsetHeight;
  const showAbove = rect.bottom + 2 + menuHeight > window.innerHeight - 8 && rect.top - menuHeight - 2 >= 8;
  const desiredLeft = props.placement === 'bottom-end' ? rect.right - menu.offsetWidth : rect.left;
  const maxLeft = Math.max(8, window.innerWidth - menu.offsetWidth - 8);
  menuAbove.value = showAbove;
  menuStyle.value = {
    position: 'fixed',
    insetBlockStart: `${showAbove ? rect.top - menuHeight - 2 : rect.bottom + 2}px`,
    left: `${Math.min(Math.max(desiredLeft, 8), maxLeft)}px`,
    minWidth: `${rect.width}px`,
  };
}

async function focusSelected(): Promise<void> {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const options = enabledOptions();
  const index = Math.max(
    options.findIndex((option) => option.value === props.modelValue),
    0,
  );
  const target = optionElements()[index];
  if (!target) return;
  const menu = menuRef.value;
  if (menu) {
    const top = target.offsetTop;
    const bottom = top + target.offsetHeight;
    if (top - 8 < menu.scrollTop) menu.scrollTop = Math.max(top - 8, 0);
    else if (bottom + 8 > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight + 8;
  }
  target.focus();
}

function openMenu(focus = false): void {
  if (props.disabled) return;
  open.value = true;
  void nextTick(updateMenuPosition);
  if (focus) void focusSelected();
}

function closeMenu(restoreFocus = true): void {
  open.value = false;
  if (restoreFocus) triggerRef.value?.focus();
}

function toggleMenu(): void {
  if (open.value) closeMenu();
  else openMenu();
}

function updateValue(value: string): void {
  emit('update:modelValue', value);
  emit('change', value);
}

function clearValue(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  if (!hasClear.value) return;
  updateValue('');
  closeMenu();
}

function selectOption(option: CoreSelectRecipeOption, restoreFocus: boolean): void {
  if (option.disabled) return;
  updateValue(option.value);
  closeMenu(restoreFocus);
}

function handleTriggerKeydown(event: KeyboardEvent): void {
  if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key) || props.disabled) return;
  event.preventDefault();
  openMenu(true);
}

function handleMenuKeydown(event: KeyboardEvent): void {
  const options = optionElements();
  const index = options.findIndex((option) => option === document.activeElement);
  let nextIndex: number | undefined;
  if (event.key === 'ArrowDown') nextIndex = (index + 1 + options.length) % options.length;
  else if (event.key === 'ArrowUp') nextIndex = (index - 1 + options.length) % options.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = options.length - 1;
  else if (event.key === 'Escape') closeMenu();
  else if (event.key === 'Enter' || event.key === ' ') {
    const option = enabledOptions()[index];
    if (option) selectOption(option, true);
    else return;
  } else return;
  event.preventDefault();
  if (nextIndex !== undefined) options[nextIndex]?.focus();
}

function handleDocumentClick(event: MouseEvent): void {
  if (!open.value || !(event.target instanceof Node)) return;
  if (!triggerRef.value?.contains(event.target) && !menuRef.value?.contains(event.target)) closeMenu(false);
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (open.value && event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
  }
}

watch([hasValue, open], ([filled, isOpen]) => fieldContext?.setFilled(filled || isOpen), { immediate: true });

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
  window.addEventListener('resize', updateMenuPosition);
  window.addEventListener('scroll', updateMenuPosition, true);
});

onBeforeUnmount(() => {
  fieldContext?.setFloatingSupported(false);
  fieldContext?.setFilled(false);
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleDocumentKeydown);
  window.removeEventListener('resize', updateMenuPosition);
  window.removeEventListener('scroll', updateMenuPosition, true);
});
</script>

<template>
  <div
    :class="[
      'core-select-recipe-wrap',
      `core-select-recipe-wrap--${size}`,
      hasLeading && 'core-select-recipe-wrap--with-leading',
      hasTrailing && 'core-select-recipe-wrap--with-trailing',
      hasClear && 'core-select-recipe-wrap--with-clear',
      floating && 'core-select-recipe-wrap--floating',
      floating && `core-select-recipe-wrap--floating-${floatingVariant}`,
      attrs.class,
    ]"
    :style="attrs.style"
    :data-core-select-filled="hasValue || open || undefined"
    :data-core-select-floating-supported="floating || undefined"
  >
    <input
      v-if="typeof attrs.name === 'string'"
      type="hidden"
      :name="attrs.name"
      :value="modelValue"
      :disabled="disabled"
    />
    <button
      :id="triggerId"
      ref="triggerRef"
      type="button"
      :class="[
        'core-select-recipe',
        `core-select-recipe--${size}`,
        invalid && 'core-select-recipe--invalid',
        open && 'core-select-recipe--open',
        !selectedOption && placeholder && 'core-select-recipe--placeholder',
        hasLeading && 'core-select-recipe--with-leading',
        hasTrailing && 'core-select-recipe--with-trailing',
        hasClear && 'core-select-recipe--with-clear',
        floating && 'core-select-recipe--floating',
      ]"
      :aria-controls="listboxId"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-invalid="invalid || undefined"
      :aria-required="required || undefined"
      :disabled="disabled"
      v-bind="triggerAttrs"
      @click="toggleMenu"
      @keydown="handleTriggerKeydown"
    >
      <span v-if="hasLeading" class="core-select-recipe__icon core-select-recipe__icon--leading" aria-hidden="true">
        <slot name="leading">
          <VueIconify v-if="leadingIcon" :icon="leadingIcon" size="var(--core-select-icon-size)" />
        </slot>
      </span>
      <span class="core-select-recipe__value">{{ displayLabel }}</span>
      <span v-if="hasTrailing" class="core-select-recipe__icon core-select-recipe__icon--trailing" aria-hidden="true">
        <slot name="trailing">
          <VueIconify v-if="trailingIcon" :icon="trailingIcon" size="var(--core-select-icon-size)" />
        </slot>
      </span>
      <span v-if="!hasClear" class="core-select-recipe__icon core-select-recipe__icon--chevron" aria-hidden="true">
        <VueIconify :icon="icons.chevronDown" size="var(--core-select-icon-size)" />
      </span>
    </button>
    <button
      v-if="hasClear"
      class="core-select-recipe__clear"
      type="button"
      :aria-label="clearLabel"
      @mousedown.prevent
      @click="clearValue"
    >
      <VueIconify :icon="icons.xmark" size="var(--core-select-icon-size)" aria-hidden="true" />
    </button>

    <Teleport :to="teleportTarget" :disabled="teleportDisabled">
      <Transition name="core-select-recipe-menu" appear>
        <div
          v-if="open"
          :id="listboxId"
          ref="menuRef"
          class="core-select-recipe__menu"
          :class="menuAbove && 'core-select-recipe__menu--top'"
          :style="menuStyle"
          :aria-labelledby="triggerId"
          role="listbox"
          @keydown="handleMenuKeydown"
        >
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="core-select-recipe__option"
            :class="option.value === modelValue && 'core-select-recipe__option--selected'"
            role="option"
            :aria-selected="option.value === modelValue"
            :disabled="option.disabled"
            tabindex="-1"
            @click="selectOption(option, false)"
          >
            {{ option.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* stylelint-disable no-descending-specificity -- Select state and floating matrices intentionally overlap. */

.core-select-recipe-wrap {
  position: relative;
  box-sizing: border-box;
  inline-size: 100%;
}

.core-select-recipe {
  --core-select-icon-size: var(--cm-icon-size-md);

  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  gap: var(--cm-space-2);
  inline-size: 100%;
  min-block-size: var(--cm-control-height-md);
  padding: 0.3125rem var(--cm-space-3);
  border: var(--cm-border-width) solid var(--cm-color-border-interactive);
  border-radius: var(--cm-radius-control);
  appearance: none;
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  cursor: pointer;
  font: inherit;
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-tight);
  text-align: start;
  transition:
    background-color var(--cm-motion-duration-fast) var(--cm-motion-ease-standard),
    border-color var(--cm-motion-duration-fast) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-fast) var(--cm-motion-ease-standard);
}

.core-select-recipe--sm {
  --core-select-icon-size: 0.9375rem;

  min-block-size: var(--cm-control-height-sm);
  padding: var(--cm-space-1) var(--cm-space-2);
  font-size: var(--cm-font-size-md);
}

.core-select-recipe--lg {
  --core-select-icon-size: 1.0625rem;

  min-block-size: var(--cm-control-height-lg);
  padding: var(--cm-space-2) 0.875rem;
  font-size: var(--cm-font-size-2xl);
}

.core-select-recipe:is(:focus, :focus-visible),
.core-select-recipe--open:not(.core-select-recipe--invalid) {
  border-color: var(--cm-color-border-focus);
}

.core-select-recipe:focus-visible,
.core-select-recipe--open {
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.core-select-recipe:hover:not(:disabled, .core-select-recipe--invalid, :focus, :focus-visible) {
  border-color: var(--cm-color-interactive-primary-border);
}

.core-select-recipe--invalid,
.core-select-recipe--invalid:is(:hover, :focus, :focus-visible) {
  border-color: var(--cm-color-status-danger-border);
}

.core-select-recipe:disabled {
  border-color: var(--cm-color-border-disabled);
  background: var(--cm-color-background-surface-disabled);
  color: var(--cm-color-text-disabled);
  cursor: not-allowed;
  box-shadow: none;
}

.core-select-recipe__value {
  display: inline-flex;
  min-inline-size: 0;
  min-block-size: var(--core-select-icon-size);
  flex: 1;
  align-items: center;
  overflow: hidden;
  line-height: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.core-select-recipe__value:empty::before {
  content: '\00a0';
}

.core-select-recipe--placeholder .core-select-recipe__value {
  color: var(--cm-color-text-placeholder);
}

.core-select-recipe__icon {
  display: inline-flex;
  inline-size: var(--core-select-icon-size);
  block-size: var(--core-select-icon-size);
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: var(--cm-color-icon-secondary);
  line-height: 1;
  pointer-events: none;
  transition: transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.core-select-recipe--open .core-select-recipe__icon--chevron {
  transform: rotate(180deg);
}

.core-select-recipe--with-clear {
  padding-inline-end: 2.25rem;
}

.core-select-recipe--with-clear.core-select-recipe--sm {
  padding-inline-end: 2rem;
}

.core-select-recipe--with-clear.core-select-recipe--lg {
  padding-inline-end: 2.375rem;
}

.core-select-recipe__clear {
  position: absolute;
  z-index: 1;
  inset-block-start: 50%;
  inset-inline-end: 0.625rem;
  display: inline-flex;
  inline-size: 1.375rem;
  block-size: 1.375rem;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--cm-radius-control-tight);
  background: transparent;
  color: var(--cm-color-icon-secondary);
  cursor: pointer;
  transform: translateY(-50%);
}

.core-select-recipe-wrap--sm .core-select-recipe__clear {
  inset-inline-end: var(--cm-space-2);
  inline-size: 1.25rem;
  block-size: 1.25rem;
}

.core-select-recipe-wrap--lg .core-select-recipe__clear {
  inline-size: var(--cm-icon-size-xl);
  block-size: var(--cm-icon-size-xl);
}

.core-select-recipe__clear:hover {
  color: var(--cm-color-icon-primary);
}

.core-select-recipe__clear:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.core-select-recipe-wrap--floating-in .core-select-recipe--floating {
  padding-block: 1.3125rem 0.1875rem;
}

.core-select-recipe-wrap--floating-in .core-select-recipe--floating.core-select-recipe--sm {
  padding-block: 1.0625rem 0.125rem;
}

.core-select-recipe-wrap--floating-in .core-select-recipe--floating.core-select-recipe--lg {
  padding-block: 1.5625rem 0.3125rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe__icon:is(.core-select-recipe__icon--leading, .core-select-recipe__icon--trailing) {
  position: absolute;
  inset-block-start: 50%;
  transform: translateY(-50%);
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe__icon--leading {
  inset-inline-start: 0.625rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe__icon--trailing {
  inset-inline-end: 0.625rem;
}

.core-select-recipe-wrap:is(
    .core-select-recipe-wrap--floating-in,
    .core-select-recipe-wrap--floating-on
  ).core-select-recipe-wrap--with-clear
  .core-select-recipe__icon--trailing {
  inset-inline-end: 2.25rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe--with-leading {
  padding-inline-start: 2.125rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe--with-trailing {
  padding-inline-end: 2.25rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe--with-trailing.core-select-recipe--with-clear {
  padding-inline-end: 3.625rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe--sm.core-select-recipe--with-leading {
  padding-inline-start: 1.875rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe--sm.core-select-recipe--with-trailing {
  padding-inline-end: 1.9375rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe--sm.core-select-recipe--with-trailing.core-select-recipe--with-clear {
  padding-inline-end: 3.25rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe--lg.core-select-recipe--with-leading {
  padding-inline-start: 2.25rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe--lg.core-select-recipe--with-trailing {
  padding-inline-end: 2.3125rem;
}

.core-select-recipe-wrap:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe--lg.core-select-recipe--with-trailing.core-select-recipe--with-clear {
  padding-inline-end: 3.875rem;
}

.core-select-recipe-wrap--sm:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe__icon--leading {
  inset-inline-start: var(--cm-space-2);
}

.core-select-recipe-wrap--sm:is(.core-select-recipe-wrap--floating-in, .core-select-recipe-wrap--floating-on)
  .core-select-recipe__icon--trailing {
  inset-inline-end: var(--cm-space-2);
}

.core-select-recipe-wrap--sm:is(
    .core-select-recipe-wrap--floating-in,
    .core-select-recipe-wrap--floating-on
  ).core-select-recipe-wrap--with-clear
  .core-select-recipe__icon--trailing {
  inset-inline-end: 2rem;
}

.core-select-recipe-wrap--lg:is(
    .core-select-recipe-wrap--floating-in,
    .core-select-recipe-wrap--floating-on
  ).core-select-recipe-wrap--with-clear
  .core-select-recipe__icon--trailing {
  inset-inline-end: 2.375rem;
}

.core-select-recipe-wrap--floating-in .core-select-recipe__icon--chevron {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: 0.625rem;
  transform: translateY(-50%);
}

.core-select-recipe-wrap--sm.core-select-recipe-wrap--floating-in .core-select-recipe__icon--chevron {
  inset-inline-end: var(--cm-space-2);
}

.core-select-recipe-wrap--floating-in .core-select-recipe--open .core-select-recipe__icon--chevron {
  transform: translateY(-50%) rotate(180deg);
}

.core-select-recipe__menu {
  z-index: 30;
  display: flex;
  min-inline-size: 12rem;
  max-block-size: 16rem;
  flex-direction: column;
  gap: var(--cm-space-1);
  padding: var(--cm-space-2);
  overflow: auto;
  overscroll-behavior: contain;
  border: var(--cm-border-width) solid var(--cm-color-border-default);
  border-radius: var(--cm-radius-overlay);
  background: var(--cm-color-background-surface-elevated);
  box-shadow: var(--cm-shadow-overlay);
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition:
    transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    opacity var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.core-select-recipe-menu-enter-from,
.core-select-recipe-menu-leave-to {
  opacity: 0;
  transform: translate3d(0, var(--cm-space-1), 0) scale(0.97);
}

.core-select-recipe-menu-enter-from.core-select-recipe__menu--top,
.core-select-recipe-menu-leave-to.core-select-recipe__menu--top {
  transform: translate3d(0, calc(-1 * var(--cm-space-1)), 0) scale(0.97);
}

.core-select-recipe__option {
  display: flex;
  inline-size: 100%;
  min-block-size: var(--cm-control-height-sm);
  align-items: center;
  padding: var(--cm-space-1) var(--cm-space-2);
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control-tight);
  background: transparent;
  color: var(--cm-color-text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: var(--cm-font-size-xl);
  line-height: var(--cm-line-height-normal);
  text-align: start;
}

.core-select-recipe__option:hover:not(:disabled, .core-select-recipe__option--selected) {
  background: var(--cm-color-background-surface-hover);
  color: var(--cm-color-text-primary);
}

.core-select-recipe__option:focus-visible {
  border-color: var(--cm-color-border-focus);
  outline: none;
  background: var(--cm-color-background-surface-hover);
  color: var(--cm-color-selected-foreground);
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.core-select-recipe__option--selected,
.core-select-recipe__option[aria-selected='true'] {
  background: var(--cm-color-background-surface-selected);
  color: var(--cm-color-selected-foreground);
}

.core-select-recipe__option:disabled {
  background: transparent;
  color: var(--cm-color-text-disabled);
  cursor: not-allowed;
}

@media (forced-colors: active) {
  .core-select-recipe--invalid {
    border-color: Mark;
  }
}

@media (prefers-reduced-motion: reduce) {
  .core-select-recipe,
  .core-select-recipe * {
    transition-duration: 0.01ms !important;
  }
}
</style>
