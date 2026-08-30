<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import { assertCm, warnCm } from '../../internal/warn';
import type { CmDatePickerSize } from './date-picker.types';
import {
  buildCalendarMonth,
  formatIsoDate,
  formatDisplayDate,
  monthLabel,
  parseIsoDate,
  shiftMonth,
  weekdayLabels,
} from './date-picker.calendar';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  modelValue: { type: String, default: '' },
  min: { type: String, default: null },
  max: { type: String, default: null },
  placeholder: { type: String, default: null },
  size: {
    type: String as PropType<CmDatePickerSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  invalid: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  clearable: Boolean,
  clearLabel: { type: String, default: 'Clear date' },
  previousMonthLabel: { type: String, default: 'Previous month' },
  nextMonthLabel: { type: String, default: 'Next month' },
});
const emit = defineEmits<{ valueChange: [value: string]; 'update:modelValue': [value: string] }>();
const attrs = useAttrs();

assertCm(props.id.trim() !== '', 'DatePicker id must be a non-empty string.');
function sanitizeIsoDate(value: string): string {
  if (value === '' || parseIsoDate(value)) return value;
  warnCm(`DatePicker value must be a valid YYYY-MM-DD date: ${value}. The value is ignored.`);
  return '';
}

const triggerRef = ref<HTMLButtonElement | null>(null);
const currentValue = ref(sanitizeIsoDate(props.modelValue));
const isOpen = ref(false);
const visibleMonth = ref(currentValue.value === '' ? formatIsoDate(new Date()) : currentValue.value);

watch(
  () => props.modelValue,
  (value) => {
    const sanitized = sanitizeIsoDate(value);
    currentValue.value = sanitized;
    if (sanitized !== '') visibleMonth.value = sanitized;
  },
);

const size = computed(() => (['sm', 'md', 'lg'].includes(props.size) ? props.size : 'md'));
const calendarId = computed(() => `${props.id}-calendar`);
const name = computed(() => (typeof attrs.name === 'string' ? attrs.name : null));
const hasClear = computed(() => props.clearable && !props.disabled && !props.readonly);
const displayValue = computed(() =>
  currentValue.value === '' ? (props.placeholder ?? '') : formatDisplayDate(currentValue.value),
);
const minDate = computed(() => sanitizeIsoDate(props.min ?? '') || undefined);
const maxDate = computed(() => sanitizeIsoDate(props.max ?? '') || undefined);
const weeks = computed(() =>
  buildCalendarMonth({
    month: visibleMonth.value,
    selected: currentValue.value,
    min: minDate.value,
    max: maxDate.value,
  }),
);
const classes = computed(() =>
  mergeCmClasses(
    'cm-date-picker',
    `cm-date-picker--${size.value}`,
    props.invalid ? 'cm-date-picker--invalid' : undefined,
    currentValue.value === '' ? 'cm-date-picker--placeholder' : undefined,
    attrs.class as CmClassValue,
  ),
);
const triggerAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['id', 'name', 'value', 'disabled', 'required', 'aria-invalid', 'aria-expanded']),
);

function setOpen(open: boolean, restoreFocus = false): void {
  if (props.disabled || props.readonly) open = false;
  isOpen.value = open;
  if (restoreFocus) void nextTick(() => triggerRef.value?.focus());
}

function commit(value: string): void {
  currentValue.value = value;
  if (value !== '') visibleMonth.value = value;
  emit('update:modelValue', value);
  emit('valueChange', value);
}

function selectDay(value: string, disabled: boolean): void {
  if (disabled) return;
  commit(value);
  setOpen(false, true);
}

function clearValue(): void {
  commit('');
  setOpen(false, true);
}

function changeMonth(delta: number): void {
  visibleMonth.value = shiftMonth(visibleMonth.value, delta);
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (props.disabled || props.readonly) return;
  if (!isOpen.value && ['ArrowDown', 'Enter', ' '].includes(event.key)) {
    event.preventDefault();
    setOpen(true);
  }
}

function onCalendarKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  setOpen(false, true);
}
</script>

<template>
  <div class="cm-date-picker-wrap" data-cm-controller="date-picker">
    <input v-if="name" type="hidden" :name="name" :value="currentValue" />
    <button
      :id="props.id"
      ref="triggerRef"
      :class="classes"
      type="button"
      role="combobox"
      aria-haspopup="dialog"
      :aria-controls="calendarId"
      :aria-expanded="isOpen"
      :aria-invalid="props.invalid || undefined"
      :aria-required="props.required || undefined"
      :aria-readonly="props.readonly || undefined"
      :disabled="props.disabled || undefined"
      :data-cm-min="minDate"
      :data-cm-max="maxDate"
      :data-cm-placeholder="props.placeholder ?? undefined"
      :data-cm-filled="currentValue !== '' || undefined"
      v-bind="triggerAttrs"
      @click="setOpen(!isOpen)"
      @keydown="onTriggerKeydown"
    >
      <span class="cm-date-picker__value">{{ displayValue }}</span>
      <span class="cm-date-picker__icon" aria-hidden="true">
        <svg
          class="cm-date-picker__calendar-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          focusable="false"
        >
          <rect x="3" y="4.25" width="18" height="16.5" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="7.5" y1="2.75" x2="7.5" y2="6" />
          <line x1="16.5" y1="2.75" x2="16.5" y2="6" />
          <path d="M7.5 12.5h.01M12 12.5h.01M16.5 12.5h.01M7.5 16.5h.01M12 16.5h.01M16.5 16.5h.01" />
        </svg>
      </span>
    </button>
    <button
      v-if="hasClear"
      class="cm-date-picker__clear"
      type="button"
      :aria-label="props.clearLabel"
      :hidden="currentValue === ''"
      data-cm-date-picker-clear
      @mousedown.prevent
      @click="clearValue"
    >
      <span aria-hidden="true">
        <svg
          class="cm-date-picker__clear-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          focusable="false"
        >
          <line x1="5.75" y1="5.75" x2="18.25" y2="18.25" />
          <line x1="18.25" y1="5.75" x2="5.75" y2="18.25" />
        </svg>
      </span>
    </button>
    <div
      :id="calendarId"
      class="cm-date-picker__calendar"
      role="dialog"
      aria-label="Choose date"
      :hidden="!isOpen"
      @keydown="onCalendarKeydown"
    >
      <header class="cm-date-picker__header">
        <button
          class="cm-date-picker__navigation"
          type="button"
          :aria-label="props.previousMonthLabel"
          data-cm-date-picker-previous
          @click="changeMonth(-1)"
        >
          <svg
            class="cm-date-picker__navigation-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            focusable="false"
          >
            <polyline points="15 5.75 8.75 12 15 18.25" />
          </svg>
        </button>
        <span class="cm-date-picker__month" data-cm-date-picker-month>{{
          isOpen ? monthLabel(visibleMonth) : ''
        }}</span>
        <button
          class="cm-date-picker__navigation"
          type="button"
          :aria-label="props.nextMonthLabel"
          data-cm-date-picker-next
          @click="changeMonth(1)"
        >
          <svg
            class="cm-date-picker__navigation-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            focusable="false"
          >
            <polyline points="9 5.75 15.25 12 9 18.25" />
          </svg>
        </button>
      </header>
      <div class="cm-date-picker__weekdays" role="row">
        <span v-for="label in weekdayLabels()" :key="label" class="cm-date-picker__weekday" role="columnheader">
          {{ label }}
        </span>
      </div>
      <div class="cm-date-picker__days" data-cm-date-picker-days>
        <div v-for="(week, index) in isOpen ? weeks : []" :key="index" class="cm-date-picker__week" role="row">
          <button
            v-for="day in week"
            :key="day.value"
            class="cm-date-picker__day"
            :class="{
              'cm-date-picker__day--outside': day.outside,
              'cm-date-picker__day--today': day.today,
              'cm-date-picker__day--selected': day.selected,
            }"
            type="button"
            :aria-pressed="day.selected"
            :disabled="day.disabled || undefined"
            :data-cm-date-picker-value="day.value"
            @click="selectDay(day.value, day.disabled)"
          >
            {{ day.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
