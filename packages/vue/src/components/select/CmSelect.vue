<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmSelectOption, CmSelectSize } from './select.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  options: { type: Array as PropType<readonly CmSelectOption[]>, required: true },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: null },
  size: {
    type: String as PropType<CmSelectSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  invalid: Boolean,
  disabled: Boolean,
  required: Boolean,
  clearable: Boolean,
  clearLabel: { type: String, default: 'Clear selection' },
});
const emit = defineEmits<{ valueChange: [value: string]; 'update:modelValue': [value: string] }>();
const attrs = useAttrs();

if (!props.id.trim()) throw new TypeError('Select id must be a non-empty string.');

const triggerRef = ref<HTMLButtonElement | null>(null);
const listboxRef = ref<HTMLElement | null>(null);
const currentValue = ref(props.modelValue);
const isOpen = ref(false);

watch(
  () => props.modelValue,
  (value) => {
    currentValue.value = value;
  },
);

const normalizedOptions = computed(() => {
  if (props.options.length === 0) throw new TypeError('Select requires options.');
  const values = new Set<string>();
  for (const option of props.options) {
    if (!option.label.trim() || values.has(option.value))
      throw new TypeError(`Invalid Select option: ${option.value}.`);
    values.add(option.value);
  }
  return props.options;
});

const size = computed(() => (['sm', 'md', 'lg'].includes(props.size) ? props.size : 'md'));
const listboxId = computed(() => `${props.id}-listbox`);
const selectedOption = computed(() =>
  normalizedOptions.value.find((option) => option.value === currentValue.value && currentValue.value !== ''),
);
const displayLabel = computed(() => selectedOption.value?.label ?? props.placeholder ?? '');
const hasClear = computed(() => props.clearable && !props.disabled);
const name = computed(() => (typeof attrs.name === 'string' ? attrs.name : null));

const classes = computed(() =>
  mergeCmClasses(
    'cm-select',
    `cm-select--${size.value}`,
    props.invalid ? 'cm-select--invalid' : undefined,
    attrs.class as CmClassValue,
  ),
);
const triggerAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['id', 'name', 'value', 'disabled', 'required', 'aria-invalid', 'aria-expanded']),
);

function enabledOptions(): HTMLButtonElement[] {
  return [
    ...(listboxRef.value?.querySelectorAll<HTMLButtonElement>('[role="option"]:not([aria-disabled="true"])') ?? []),
  ];
}

function setOpen(open: boolean, restoreFocus = false): void {
  if (props.disabled) open = false;
  isOpen.value = open;
  if (restoreFocus) void nextTick(() => triggerRef.value?.focus());
}

function commit(value: string): void {
  currentValue.value = value;
  emit('update:modelValue', value);
  emit('valueChange', value);
}

function selectOption(option: CmSelectOption): void {
  if (option.disabled) return;
  commit(option.value);
  setOpen(false, true);
}

function clearValue(): void {
  commit('');
  setOpen(false, true);
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (props.disabled) return;
  if (!isOpen.value) {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
    void nextTick(() => {
      const options = enabledOptions();
      const selected = options.find((option) => option.getAttribute('aria-selected') === 'true');
      (event.key === 'ArrowUp' ? options[options.length - 1] : (selected ?? options[0]))?.focus();
    });
  }
}

function onListboxKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    setOpen(false, true);
    return;
  }

  const options = enabledOptions();
  const active = options.indexOf(document.activeElement as HTMLButtonElement);

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    options[active === -1 ? 0 : (active + step + options.length) % options.length]?.focus();
    return;
  }

  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    (event.key === 'Home' ? options[0] : options[options.length - 1])?.focus();
  }
}

function onDocumentClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (triggerRef.value?.contains(target) || listboxRef.value?.contains(target)) return;
  setOpen(false);
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined') return;
  if (open) document.addEventListener('click', onDocumentClick);
  else document.removeEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('click', onDocumentClick);
});
</script>

<template>
  <div class="cm-select-wrap" data-cm-controller="select">
    <input v-if="name" type="hidden" :name="name" :value="currentValue" />
    <button
      :id="props.id"
      ref="triggerRef"
      :class="classes"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-expanded="isOpen"
      :aria-invalid="props.invalid || undefined"
      :aria-required="props.required || undefined"
      :disabled="props.disabled || undefined"
      :data-cm-placeholder="props.placeholder ?? undefined"
      :data-cm-filled="currentValue !== '' || undefined"
      v-bind="triggerAttrs"
      @click="setOpen(!isOpen)"
      @keydown="onTriggerKeydown"
    >
      <span v-if="$slots.leading" class="cm-select__icon cm-select__icon--leading" aria-hidden="true">
        <slot name="leading" />
      </span>
      <span class="cm-select__value">{{ displayLabel }}</span>
      <span v-if="$slots.trailing" class="cm-select__icon cm-select__icon--trailing" aria-hidden="true">
        <slot name="trailing" />
      </span>
      <span v-if="!hasClear" class="cm-select__icon cm-select__icon--chevron" aria-hidden="true"></span>
    </button>
    <button
      v-if="hasClear"
      class="cm-select__clear"
      type="button"
      :aria-label="props.clearLabel"
      :hidden="currentValue === ''"
      data-cm-select-clear
      @mousedown.prevent
      @click="clearValue"
    >
      <span aria-hidden="true">&times;</span>
    </button>
    <div
      :id="listboxId"
      ref="listboxRef"
      class="cm-select__listbox"
      role="listbox"
      :aria-labelledby="props.id"
      :hidden="!isOpen"
      @keydown="onListboxKeydown"
    >
      <button
        v-for="option in normalizedOptions"
        :key="option.value"
        class="cm-select__option"
        :class="option.value === currentValue && currentValue !== '' ? 'cm-select__option--selected' : undefined"
        type="button"
        role="option"
        tabindex="-1"
        :aria-selected="option.value === currentValue && currentValue !== ''"
        :aria-disabled="option.disabled || undefined"
        :data-cm-select-value="option.value"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
