<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { assertCm, warnCm } from '../../internal/warn';
import type { CmDatePickerLabels, CmDatePickerSize } from './date-picker.types';
import {
  boundCalendarDate,
  buildCalendarMonth,
  calendarKeyTarget,
  calendarMonthAllowed,
  formatIsoDate,
  formatDisplayDate,
  monthLabel,
  parseIsoDate,
  shiftMonth,
  weekdayLabels,
  type CmCalendarLocale,
  type CmCalendarWeekday,
} from './date-picker.calendar';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  modelValue: { type: String, default: '' },
  min: { type: String, default: null },
  max: { type: String, default: null },
  placeholder: { type: String, default: null },
  locale: { type: [String, Array] as PropType<CmCalendarLocale>, default: undefined },
  displayFormat: { type: String, default: undefined },
  firstDayOfWeek: {
    type: Number as PropType<CmCalendarWeekday>,
    default: 0,
    validator: (value: number) => Number.isInteger(value) && value >= 0 && value <= 6,
  },
  labels: { type: Object as PropType<CmDatePickerLabels>, default: () => ({}) },
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

const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const calendarRef = ref<HTMLElement | null>(null);
const currentValue = ref(sanitizeIsoDate(props.modelValue));
const isOpen = ref(false);
const visibleMonth = ref(currentValue.value === '' ? formatIsoDate(new Date()) : currentValue.value);
const focusedDate = ref(visibleMonth.value);

watch(
  () => props.modelValue,
  (value) => {
    const sanitized = sanitizeIsoDate(value);
    currentValue.value = sanitized;
    if (sanitized !== '') {
      const calendar = calendarRef.value;
      const focusInCalendar = Boolean(calendar?.contains(calendar.ownerDocument.activeElement));
      setFocusedDate(boundedDate(sanitized), focusInCalendar);
    }
  },
);

const size = computed(() => (['sm', 'md', 'lg'].includes(props.size) ? props.size : 'md'));
const calendarId = computed(() => `${props.id}-calendar`);
const monthId = computed(() => `${calendarId.value}-month`);
const name = computed(() => (typeof attrs.name === 'string' ? attrs.name : null));
const hasClear = computed(() => props.clearable && !props.disabled && !props.readonly);
const displayValue = computed(() =>
  currentValue.value === ''
    ? (props.placeholder ?? '')
    : formatDisplayDate(currentValue.value, props.locale, props.displayFormat),
);
const minDate = computed(() => sanitizeIsoDate(props.min ?? '') || undefined);
const maxDate = computed(() => sanitizeIsoDate(props.max ?? '') || undefined);
const firstDayOfWeek = computed(() =>
  Number.isInteger(props.firstDayOfWeek) && props.firstDayOfWeek >= 0 && props.firstDayOfWeek <= 6
    ? props.firstDayOfWeek
    : 0,
);
const weekdays = computed(() => weekdayLabels(firstDayOfWeek.value, props.locale));
const weeks = computed(() =>
  buildCalendarMonth({
    month: visibleMonth.value,
    selected: currentValue.value,
    min: minDate.value,
    max: maxDate.value,
    firstDayOfWeek: firstDayOfWeek.value,
    locale: props.locale,
  }),
);
const classes = computed(() =>
  mergeCmClasses(
    'cm-date-picker',
    `cm-date-picker--${size.value}`,
    props.invalid ? 'cm-date-picker--invalid' : undefined,
    currentValue.value === '' ? 'cm-date-picker--placeholder' : undefined,
    attrs.class,
  ),
);
const triggerAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['id', 'name', 'value', 'disabled', 'required', 'aria-invalid', 'aria-expanded']),
);

function setOpen(open: boolean, restoreFocus = false): void {
  if (props.disabled || props.readonly) open = false;
  if (isOpen.value === open) {
    if (restoreFocus) void nextTick(() => triggerRef.value?.focus());
    return;
  }
  isOpen.value = open;
  if (open) {
    setFocusedDate(boundedDate(currentValue.value || formatIsoDate(new Date())), true);
  } else if (restoreFocus) {
    void nextTick(() => triggerRef.value?.focus());
  }
}

function boundedDate(value: string): string {
  return boundCalendarDate(value, minDate.value, maxDate.value);
}

function setFocusedDate(value: string, focus: boolean): void {
  focusedDate.value = value;
  visibleMonth.value = value;
  if (!focus) return;
  void nextTick(() => {
    const calendar = calendarRef.value;
    if (!isOpen.value || focusedDate.value !== value || !calendar) return;
    const day = calendar.querySelector<HTMLButtonElement>(`[data-cm-date-picker-value="${value}"]:not(:disabled)`);
    (day ?? calendar).focus();
  });
}

function canChangeMonth(delta: number): boolean {
  return calendarMonthAllowed(shiftMonth(visibleMonth.value, delta), minDate.value, maxDate.value);
}

function commit(value: string): void {
  currentValue.value = value;
  if (value !== '') visibleMonth.value = value;
  emit('update:modelValue', value);
  emit('valueChange', value);
}

function selectDay(value: string, disabled: boolean): void {
  if (disabled || props.disabled || props.readonly) return;
  commit(value);
  setOpen(false, true);
}

function clearValue(): void {
  commit('');
  setOpen(false, true);
}

function changeMonth(delta: number): void {
  if (canChangeMonth(delta)) setFocusedDate(boundedDate(shiftMonth(visibleMonth.value, delta)), true);
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (props.disabled || props.readonly) return;
  if (isOpen.value && event.key === 'Escape') {
    onCalendarKeydown(event);
    return;
  }
  if (!isOpen.value && ['ArrowDown', 'Enter', ' '].includes(event.key)) {
    event.preventDefault();
    setOpen(true);
  }
}

function onCalendarKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  setOpen(false, true);
}

function onDayKeydown(event: KeyboardEvent, value: string): void {
  const day = event.currentTarget as HTMLElement;
  const rtl = day.ownerDocument.defaultView?.getComputedStyle(day).direction === 'rtl';
  const target = calendarKeyTarget(value, event.key, firstDayOfWeek.value, rtl);
  if (target === null) return;
  event.preventDefault();
  if (parseIsoDate(target) && boundedDate(target) === target) setFocusedDate(target, true);
}

watch(isOpen, (open, _, onCleanup) => {
  const root = rootRef.value;
  if (!open || !root) return;
  const document = root.ownerDocument;
  const dismissOutside = (event: Event) => {
    if (!event.composedPath().includes(root)) setOpen(false);
  };
  document.addEventListener('click', dismissOutside, true);
  document.addEventListener('focusin', dismissOutside);
  onCleanup(() => {
    document.removeEventListener('click', dismissOutside, true);
    document.removeEventListener('focusin', dismissOutside);
  });
});

watch([() => props.disabled, () => props.readonly], ([disabled, readonly]) => {
  if (disabled || readonly) setOpen(false);
});

useCmHydrated();
</script>

<template>
  <div ref="rootRef" class="cm-date-picker-wrap" data-cm-controller="date-picker">
    <input v-if="name" type="hidden" :name="name" :value="currentValue" :disabled="props.disabled || undefined" />
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
      :aria-label="props.labels.clear ?? props.clearLabel"
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
      ref="calendarRef"
      class="cm-date-picker__calendar"
      role="dialog"
      :aria-label="props.labels.calendar ?? 'Choose date'"
      :tabindex="isOpen ? -1 : undefined"
      :hidden="!isOpen"
      @keydown="onCalendarKeydown"
    >
      <header class="cm-date-picker__header">
        <button
          class="cm-date-picker__navigation"
          type="button"
          :aria-label="props.labels.previousMonth ?? props.previousMonthLabel"
          :disabled="isOpen && !canChangeMonth(-1) ? true : undefined"
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
        <span :id="monthId" class="cm-date-picker__month" aria-live="polite" data-cm-date-picker-month>{{
          isOpen ? monthLabel(visibleMonth, props.locale) : ''
        }}</span>
        <button
          class="cm-date-picker__navigation"
          type="button"
          :aria-label="props.labels.nextMonth ?? props.nextMonthLabel"
          :disabled="isOpen && !canChangeMonth(1) ? true : undefined"
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
      <div class="cm-date-picker__grid" role="grid" :aria-labelledby="monthId">
        <div class="cm-date-picker__weekdays" role="row">
          <span v-for="(label, index) in weekdays" :key="index" class="cm-date-picker__weekday" role="columnheader">
            {{ label }}
          </span>
        </div>
        <div class="cm-date-picker__days" role="rowgroup" data-cm-date-picker-days>
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
              role="gridcell"
              :aria-label="day.accessibleLabel"
              :aria-selected="day.selected"
              :aria-current="day.today ? 'date' : undefined"
              :tabindex="!day.disabled && day.value === focusedDate ? 0 : -1"
              :disabled="day.disabled || undefined"
              :data-cm-date-picker-value="day.value"
              @click="selectDay(day.value, day.disabled)"
              @focus="focusedDate = day.value"
              @keydown="onDayKeydown($event, day.value)"
            >
              {{ day.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
