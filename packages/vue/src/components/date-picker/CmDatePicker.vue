<script setup lang="ts" generic="Multiple extends boolean = false, Range extends boolean = false">
import { computed, nextTick, ref, useAttrs, watch, type PropType } from 'vue';

import {
  observeCmAnchoredPosition,
  resolveCmAnchoredTarget,
  type CmAnchoredStyle,
} from '@codemonster-ru/ui-runtime/anchored-position';
import { useCmFloatingPaint } from '../../internal/floating-paint';
import { useCmFormReset } from '../../internal/form-reset';
import { mergeCmClasses, mergeCmPickerTriggerAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { assertCm, warnCm } from '../../internal/warn';
import type {
  CmDatePickerLabels,
  CmDatePickerPlacement,
  CmDatePickerProps,
  CmDatePickerSize,
  CmDatePickerValue,
} from './date-picker.types';
import {
  boundCalendarDate,
  buildCalendarGrid,
  calendarAdjacentPeriod,
  calendarDateHasTime,
  calendarGridKeyTarget,
  calendarGridTitle,
  calendarMinuteStep,
  calendarNearestAvailableDay,
  calendarTimesForDay,
  calendarTimeValue,
  calendarYearRangeStart,
  formatCalendarValue,
  formatCalendarDateTime,
  formatDisplayDate,
  nearestCalendarTime,
  normalizeCalendarDateTime,
  parseCalendarValue,
  selectCalendarDate,
  selectCalendarDateTime,
  updateCalendarDateTime,
  weekdayLabels,
  type CmCalendarLocale,
  type CmCalendarPrecision,
  type CmCalendarSelectionMode,
  type CmCalendarWeekday,
} from '@codemonster-ru/ui-runtime/core';

defineOptions({ inheritAttrs: false });
type ModelValue = CmDatePickerValue<Multiple, Range>;
const props = defineProps({
  id: { type: String, required: true },
  modelValue: { type: [String, Array] as unknown as PropType<ModelValue>, default: '' },
  controlledValue: Boolean,
  multiple: Boolean as PropType<Multiple>,
  range: Boolean as PropType<Range>,
  monthPicker: Boolean,
  yearPicker: Boolean,
  showTime: Boolean,
  minuteStep: { type: Number, default: 1 },
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
  placement: {
    type: String as PropType<CmDatePickerPlacement>,
    default: 'bottom-start',
    validator: (value: string) => value === 'bottom-start' || value === 'bottom-end',
  },
  teleportTo: { type: [String, Object, Boolean] as PropType<CmDatePickerProps['teleportTo']>, default: null },
  disableTeleport: Boolean,
  clearLabel: { type: String, default: 'Clear date' },
  previousMonthLabel: { type: String, default: 'Previous month' },
  nextMonthLabel: { type: String, default: 'Next month' },
});
const emit = defineEmits<{ valueChange: [value: ModelValue]; 'update:modelValue': [value: ModelValue] }>();
const attrs = useAttrs();
const precision = computed<CmCalendarPrecision>(() =>
  props.yearPicker ? 'year' : props.monthPicker ? 'month' : 'day',
);
const hasTime = computed(() => props.showTime && precision.value === 'day');
const minuteStep = computed(() => calendarMinuteStep(props.minuteStep));

assertCm(props.id.trim() !== '', 'DatePicker id must be a non-empty string.');
function sanitizeDate(value: string): string {
  if (value === '' || parseCalendarValue(value, precision.value)) return value;
  if (precision.value === 'day' && calendarTimeValue(value) !== null) return value;
  const format = hasTime.value
    ? 'YYYY-MM-DDTHH:mm'
    : { day: 'YYYY-MM-DD', month: 'YYYY-MM', year: 'YYYY' }[precision.value];
  warnCm(`DatePicker value must be a valid ${format} date: ${value}. The value is ignored.`);
  return '';
}

const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const calendarRef = ref<HTMLElement | null>(null);
const selectionMode = computed<CmCalendarSelectionMode>(() =>
  props.range ? 'range' : props.multiple ? 'multiple' : 'single',
);
const currentDates = ref(normalizeValues(props.modelValue));
const authoredDates = currentDates.value.slice();
const firstDate = computed(() => currentDates.value[0] ?? '');
const formValues = computed(() => (selectionMode.value === 'single' ? [firstDate.value] : currentDates.value));
const isOpen = ref(false);
const painted = useCmFloatingPaint(isOpen, calendarRef);
const calendarPosition = ref<CmAnchoredStyle>();
const placement = computed(() => (props.placement === 'bottom-end' ? 'bottom-end' : 'bottom-start'));
const portal = computed(() => (props.disableTeleport ? null : (props.teleportTo ?? null)));
const teleportTarget = computed(() => (painted.value ? resolveCmAnchoredTarget(rootRef.value, portal.value) : null));
const visibleMonth = ref(dayValue(firstDate.value) || formatCalendarValue(new Date(), precision.value));
const focusedDate = ref(visibleMonth.value);
const yearStart = ref(calendarYearRangeStart(visibleMonth.value));
const draftDay = ref('');
const draftTime = ref<number | null>(null);

function dayValue(value: string): string {
  return precision.value === 'day' ? value.slice(0, 10) : value;
}

function modelDate(value: string): string {
  const date = sanitizeDate(value);
  if (hasTime.value) return normalizeCalendarDateTime(date) ?? '';
  return dayValue(date);
}

function normalizeValues(value: string | string[]): string[] {
  if (selectionMode.value === 'single') {
    const date = typeof value === 'string' ? modelDate(value) : '';
    return date === '' ? [] : [date];
  }
  const dates = Array.isArray(value) ? value.map(modelDate).filter(Boolean) : [];
  return selectionMode.value === 'range' ? dates.slice(0, 2).sort() : [...new Set(dates)];
}

function datesMatch(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((date, index) => date === right[index]);
}

watch(
  [() => props.modelValue, selectionMode, precision, hasTime],
  ([value, , currentPrecision, time], [, , previousPrecision, previousTime]) => {
    const next = normalizeValues(value);
    if (currentPrecision === previousPrecision && time === previousTime && datesMatch(next, currentDates.value)) return;
    currentDates.value = next;
    if (props.controlledValue && isOpen.value && currentPrecision === previousPrecision && time === previousTime)
      return;
    if (firstDate.value !== '' || currentPrecision !== previousPrecision) {
      const calendar = calendarRef.value;
      const focusInCalendar = Boolean(calendar?.contains(calendar.ownerDocument.activeElement));
      const anchor = initialPickerDate();
      if (currentPrecision !== previousPrecision) yearStart.value = calendarYearRangeStart(anchor);
      setFocusedDate(anchor, focusInCalendar);
      if (isOpen.value && time) setTimeDraft(anchor, calendarTimeValue(firstDate.value) ?? draftTime.value ?? 0);
    }
  },
  { deep: true },
);

const size = computed(() => (['sm', 'md', 'lg'].includes(props.size) ? props.size : 'md'));
const calendarId = computed(() => `${props.id}-calendar`);
const monthId = computed(() => `${calendarId.value}-month`);
const timeLabelId = computed(() => `${calendarId.value}-time`);
const name = computed(() => (typeof attrs.name === 'string' ? attrs.name : null));
const formId = computed(() => (typeof attrs.form === 'string' ? attrs.form : undefined));
const hasClear = computed(() => props.clearable && !props.disabled && !props.readonly);
const displayValue = computed(() =>
  currentDates.value.length === 0
    ? (props.placeholder ?? '')
    : currentDates.value
        .map((date) => formatDisplayDate(date, props.locale, props.displayFormat, precision.value))
        .join(selectionMode.value === 'range' ? ' – ' : '; '),
);
const minValue = computed(() => sanitizeDate(props.min ?? '') || undefined);
const maxValue = computed(() => sanitizeDate(props.max ?? '') || undefined);
const minDate = computed(() => dayValue(minValue.value ?? '') || undefined);
const maxDate = computed(() => dayValue(maxValue.value ?? '') || undefined);
const timeSettings = computed(() => ({ min: minValue.value, max: maxValue.value, minuteStep: minuteStep.value }));
const timesForDraft = computed(() => (draftDay.value ? calendarTimesForDay(draftDay.value, timeSettings.value) : []));
const hours = computed(() => new Set(timesForDraft.value.map((value) => Math.floor(value / 60))));
const hour = computed(() => (draftTime.value === null ? undefined : Math.floor(draftTime.value / 60)));
const minute = computed(() => (draftTime.value === null ? undefined : draftTime.value % 60));
const minutes = computed(
  () =>
    new Set(timesForDraft.value.filter((value) => Math.floor(value / 60) === hour.value).map((value) => value % 60)),
);
const minuteChoices = computed(() =>
  Array.from({ length: Math.ceil(60 / minuteStep.value) }, (_, index) => index * minuteStep.value),
);
const firstDayOfWeek = computed(() =>
  Number.isInteger(props.firstDayOfWeek) && props.firstDayOfWeek >= 0 && props.firstDayOfWeek <= 6
    ? props.firstDayOfWeek
    : 0,
);
const weekdays = computed(() => weekdayLabels(firstDayOfWeek.value, props.locale));
const navigationLabels = computed(() => {
  const { labels } = props;
  if (precision.value === 'year')
    return [labels.previousDecade ?? 'Previous decade', labels.nextDecade ?? 'Next decade'];
  if (precision.value === 'month') return [labels.previousYear ?? 'Previous year', labels.nextYear ?? 'Next year'];
  return [labels.previousMonth ?? props.previousMonthLabel, labels.nextMonth ?? props.nextMonthLabel];
});
const weeks = computed(() => {
  const grid = buildCalendarGrid({
    month: visibleMonth.value,
    selected: hasTime.value ? currentDates.value.map(dayValue) : currentDates.value,
    range: selectionMode.value === 'range',
    min: minDate.value,
    max: maxDate.value,
    firstDayOfWeek: firstDayOfWeek.value,
    locale: props.locale,
    precision: precision.value,
    yearStart: yearStart.value,
  });
  if (!hasTime.value) return grid;
  return grid.map((row) =>
    row.map((day) => ({ ...day, disabled: day.disabled || !calendarDateHasTime(day.value, timeSettings.value) })),
  );
});
const classes = computed(() =>
  mergeCmClasses(
    'cm-date-picker',
    `cm-date-picker--${size.value}`,
    props.invalid ? 'cm-date-picker--invalid' : undefined,
    currentDates.value.length === 0 ? 'cm-date-picker--placeholder' : undefined,
    attrs.class,
  ),
);
const triggerAttrs = () =>
  mergeCmPickerTriggerAttrs(attrs, {
    id: props.id,
    type: 'button',
    role: 'combobox',
    'aria-haspopup': 'dialog',
    'aria-controls': calendarId.value,
    'aria-expanded': isOpen.value,
    'aria-invalid': props.invalid || undefined,
    'aria-required': props.required || undefined,
    'aria-readonly': props.readonly || undefined,
    disabled: props.disabled || undefined,
    'data-cm-min': hasTime.value ? minValue.value : minDate.value,
    'data-cm-max': hasTime.value ? maxValue.value : maxDate.value,
    'data-cm-placeholder': props.placeholder ?? undefined,
    'data-cm-filled': currentDates.value.length > 0 || undefined,
    'data-cm-date-picker-mode': selectionMode.value === 'single' ? undefined : selectionMode.value,
    'data-cm-date-picker-precision': precision.value === 'day' ? undefined : precision.value,
    'data-cm-date-picker-show-time': hasTime.value || undefined,
    'data-cm-date-picker-minute-step': hasTime.value ? minuteStep.value : undefined,
    'data-cm-date-picker-placement': placement.value === 'bottom-end' ? placement.value : undefined,
    'data-cm-date-picker-teleport-to': typeof portal.value === 'string' ? portal.value : undefined,
    'data-cm-date-picker-name': selectionMode.value === 'single' ? undefined : (name.value ?? undefined),
    'data-cm-locale': typeof props.locale === 'string' ? props.locale : undefined,
    'data-cm-display-format': props.displayFormat,
    'data-cm-first-day-of-week': firstDayOfWeek.value || undefined,
  });

function setOpen(open: boolean, restoreFocus = false): void {
  if (props.disabled || props.readonly) open = false;
  if (isOpen.value === open) {
    if (restoreFocus) void nextTick(() => triggerRef.value?.focus());
    return;
  }
  isOpen.value = open;
  if (open) {
    const focus = initialPickerDate();
    yearStart.value = calendarYearRangeStart(focus);
    setFocusedDate(focus, true);
    if (hasTime.value) {
      const now = new Date();
      setTimeDraft(focus, calendarTimeValue(firstDate.value) ?? now.getHours() * 60 + now.getMinutes());
    }
  } else if (restoreFocus) {
    void nextTick(() => triggerRef.value?.focus());
  }
}

function initialPickerDate(): string {
  const date = boundedDate(dayValue(firstDate.value) || formatCalendarValue(new Date(), precision.value));
  return hasTime.value ? calendarNearestAvailableDay(date, timeSettings.value) : date;
}

function boundedDate(value: string): string {
  return boundCalendarDate(value, minDate.value, maxDate.value);
}

function setFocusedDate(value: string, focus: boolean): void {
  if (precision.value === 'year') yearStart.value = calendarYearRangeStart(value, yearStart.value);
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

function adjacentPeriod(delta: number): string | null {
  const target = calendarAdjacentPeriod(
    visibleMonth.value,
    delta,
    precision.value,
    yearStart.value,
    minDate.value,
    maxDate.value,
  );
  if (!hasTime.value || target === null) return target;
  const available = calendarNearestAvailableDay(target, timeSettings.value);
  return available.slice(0, 7) !== visibleMonth.value.slice(0, 7) && calendarDateHasTime(available, timeSettings.value)
    ? available
    : null;
}

function reportValue(dates: string[]): void {
  const value = (selectionMode.value === 'single' ? (dates[0] ?? '') : dates.slice()) as ModelValue;
  emit('update:modelValue', value);
  emit('valueChange', value);
}

function commit(dates: string[]): void {
  if (!props.controlledValue) currentDates.value = dates;
  reportValue(dates);
}

function selectDay(value: string, disabled: boolean): void {
  if (disabled || props.disabled || props.readonly) return;
  const mode = selectionMode.value;
  if (hasTime.value) {
    setTimeDraft(value, draftTime.value ?? 0);
    if (draftTime.value === null) return;
    commit(selectCalendarDateTime(currentDates.value, formatCalendarDateTime(value, draftTime.value), mode));
    setFocusedDate(value, true);
    return;
  }
  const dates = selectCalendarDate(currentDates.value, value, mode);
  commit(dates);
  if (mode === 'single' || (mode === 'range' && dates.length === 2)) setOpen(false, true);
  else setFocusedDate(value, true);
}

function setTimeDraft(day: string, preferred: number): void {
  draftDay.value = day;
  draftTime.value = nearestCalendarTime(timesForDraft.value, preferred);
}

function updateTime(value: number): void {
  if (!timesForDraft.value.includes(value)) return;
  draftTime.value = value;
  const next = updateCalendarDateTime(
    currentDates.value,
    formatCalendarDateTime(draftDay.value, value),
    selectionMode.value,
  );
  if (next) commit(next);
}

function updateHour(value: number): void {
  const options = timesForDraft.value.filter((time) => Math.floor(time / 60) === value);
  const next = nearestCalendarTime(options, value * 60 + (minute.value ?? 0));
  if (next !== null) updateTime(next);
}

watch(timeSettings, () => {
  if (hasTime.value && isOpen.value && draftDay.value) setTimeDraft(draftDay.value, draftTime.value ?? 0);
});

function clearValue(): void {
  commit([]);
  setOpen(false, true);
}

function changePeriod(delta: number): void {
  const target = adjacentPeriod(delta);
  if (target !== null) setFocusedDate(target, true);
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
  const target = calendarGridKeyTarget(value, event.key, precision.value, firstDayOfWeek.value, yearStart.value, rtl);
  if (target === null) return;
  event.preventDefault();
  if (
    parseCalendarValue(target, precision.value) &&
    boundedDate(target) === target &&
    (!hasTime.value || calendarDateHasTime(target, timeSettings.value))
  ) {
    setFocusedDate(target, true);
  }
}

watch(isOpen, (open, _, onCleanup) => {
  const root = rootRef.value;
  if (!open || !root) return;
  const document = root.ownerDocument;
  const dismissOutside = (event: Event) => {
    const path = event.composedPath();
    if (!path.includes(root) && (!calendarRef.value || !path.includes(calendarRef.value))) setOpen(false);
  };
  document.addEventListener('click', dismissOutside, true);
  document.addEventListener('focusin', dismissOutside);
  onCleanup(() => {
    document.removeEventListener('click', dismissOutside, true);
    document.removeEventListener('focusin', dismissOutside);
  });
});

watch(
  [painted, calendarRef, triggerRef, teleportTarget, placement],
  ([visible, calendar, trigger, target, preferredPlacement], _, onCleanup) => {
    if (!visible || !calendar || !trigger) return;
    const stop = observeCmAnchoredPosition(
      trigger,
      calendar,
      preferredPlacement,
      2,
      target ? null : rootRef.value,
      (style) => {
        calendarPosition.value = style;
      },
    );
    onCleanup(() => {
      stop();
      calendarPosition.value = undefined;
    });
  },
  { flush: 'post' },
);

watch([() => props.disabled, () => props.readonly], ([disabled, readonly]) => {
  if (disabled || readonly) setOpen(false);
});

useCmFormReset(triggerRef, () => {
  setOpen(false);
  const defaults = authoredDates.filter((date) =>
    hasTime.value ? calendarTimeValue(date) !== null : parseCalendarValue(date, precision.value) !== null,
  );
  if (datesMatch(defaults, currentDates.value)) return;
  // A caller supplying a different model value still owns that state.
  if (datesMatch(defaults, normalizeValues(props.modelValue))) currentDates.value = defaults;
  reportValue(defaults);
});

useCmHydrated();
</script>

<template>
  <div ref="rootRef" class="cm-date-picker-wrap" data-cm-controller="date-picker">
    <template v-if="name">
      <input
        v-for="(value, index) in formValues"
        :key="index"
        type="hidden"
        :name="name"
        :form="formId"
        :value="value"
        :disabled="props.disabled || undefined"
      />
    </template>
    <button
      ref="triggerRef"
      :class="classes"
      v-bind="triggerAttrs()"
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
      :hidden="currentDates.length === 0"
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
    <Teleport :to="teleportTarget ?? 'body'" :disabled="!teleportTarget">
      <div
        :id="calendarId"
        ref="calendarRef"
        class="cm-date-picker__calendar"
        role="dialog"
        :aria-label="props.labels.calendar ?? 'Choose date'"
        :tabindex="isOpen ? -1 : undefined"
        :hidden="!isOpen"
        :data-cm-date-picker-portaled="teleportTarget ? '' : undefined"
        v-bind="calendarPosition ? { style: calendarPosition } : {}"
        @keydown="onCalendarKeydown"
      >
        <header class="cm-date-picker__header">
          <button
            class="cm-date-picker__navigation"
            type="button"
            :aria-label="navigationLabels[0]"
            :disabled="isOpen && adjacentPeriod(-1) === null ? true : undefined"
            data-cm-date-picker-previous
            @click="changePeriod(-1)"
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
            isOpen ? calendarGridTitle(visibleMonth, precision, yearStart, props.locale) : ''
          }}</span>
          <button
            class="cm-date-picker__navigation"
            type="button"
            :aria-label="navigationLabels[1]"
            :disabled="isOpen && adjacentPeriod(1) === null ? true : undefined"
            data-cm-date-picker-next
            @click="changePeriod(1)"
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
        <div
          class="cm-date-picker__grid"
          :class="{ 'cm-date-picker__grid--period': precision !== 'day' }"
          role="grid"
          :aria-labelledby="monthId"
          :aria-multiselectable="selectionMode !== 'single' || undefined"
        >
          <div v-if="precision === 'day'" class="cm-date-picker__weekdays" role="row">
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
                  'cm-date-picker__day--in-range': day.inRange,
                  'cm-date-picker__day--range-start': day.rangeStart,
                  'cm-date-picker__day--range-end': day.rangeEnd,
                }"
                type="button"
                role="gridcell"
                :aria-label="day.accessibleLabel"
                :aria-selected="day.selected || day.inRange"
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
        <div v-if="hasTime" class="cm-date-picker__time" data-cm-date-picker-time>
          <span :id="timeLabelId" class="cm-date-picker__time-label">{{ props.labels.time ?? 'Time' }}</span>
          <div class="cm-date-picker__time-controls" role="group" :aria-labelledby="timeLabelId">
            <select
              class="cm-date-picker__time-select"
              :aria-label="props.labels.hour ?? 'Hour'"
              :disabled="isOpen && draftTime === null ? true : undefined"
              :value="hour"
              data-cm-date-picker-hour
              @change="updateHour(Number(($event.target as HTMLSelectElement).value))"
            >
              <option
                v-for="number in isOpen ? 24 : 0"
                :key="number"
                :value="number - 1"
                :disabled="!hours.has(number - 1)"
              >
                {{ String(number - 1).padStart(2, '0') }}
              </option>
            </select>
            <span aria-hidden="true">:</span>
            <select
              class="cm-date-picker__time-select"
              :aria-label="props.labels.minute ?? 'Minute'"
              :disabled="isOpen && draftTime === null ? true : undefined"
              :value="minute"
              data-cm-date-picker-minute
              @change="hour !== undefined && updateTime(hour * 60 + Number(($event.target as HTMLSelectElement).value))"
            >
              <option
                v-for="choice in isOpen ? minuteChoices : []"
                :key="choice"
                :value="choice"
                :disabled="!minutes.has(choice)"
              >
                {{ String(choice).padStart(2, '0') }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
