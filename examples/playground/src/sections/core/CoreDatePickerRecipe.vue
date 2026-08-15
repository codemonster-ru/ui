<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch, type PropType } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';

import {
  addCoreDays,
  combineCoreDateTime,
  coreMonthHasSelectableDate,
  createCoreDateGrid,
  createCoreMonthGrid,
  createCoreYearGrid,
  formatCoreDateLabel,
  formatCoreMonthLabel,
  formatCoreDateSelection,
  formatCorePickerDisplay,
  getCoreWeekBoundary,
  getCoreYearPageStart,
  isCoreDateDisabled,
  moveCoreDateByMonth,
  normalizeCoreDateSelection,
  requireCorePickerValue,
  requireCoreDate,
  selectCoreDateRange,
  startOfCoreMonth,
  toggleCoreMultipleDate,
  type CoreDatePickerValue,
  type CoreDatePickerMode,
  type CoreDateSelectionMode,
} from './core-date-picker-recipe';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  id: { type: String, required: true },
  modelValue: { type: [String, Array] as PropType<CoreDatePickerValue>, default: '' },
  pickerMode: { type: String as PropType<CoreDatePickerMode>, default: 'date' },
  selectionMode: { type: String as PropType<CoreDateSelectionMode>, default: 'single' },
  today: { type: String, required: true },
  min: { type: String, default: null },
  max: { type: String, default: null },
  invalid: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  clearable: Boolean,
  placeholder: { type: String, default: '' },
});
const emit = defineEmits<{
  'open-change': [open: boolean];
  'update:modelValue': [value: CoreDatePickerValue];
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const calendarRef = ref<HTMLElement | null>(null);
const open = ref(false);

for (const [label, value] of [
  ['DatePicker today', props.today],
  ['DatePicker min', props.min ?? ''],
  ['DatePicker max', props.max ?? ''],
] as const) {
  if (value) requireCoreDate(value, label);
}
if (props.min && props.max && props.min > props.max) throw new TypeError('DatePicker min must not exceed max.');

const selectedValues = computed(() =>
  normalizeCoreDateSelection(props.modelValue, props.selectionMode, props.pickerMode),
);
const initialDate = selectedValues.value[0]
  ? requireCorePickerValue(selectedValues.value[0], props.pickerMode)
  : requireCorePickerValue(props.today, 'date');
const initialDateValue = `${String(initialDate.getFullYear()).padStart(4, '0')}-${String(initialDate.getMonth() + 1).padStart(2, '0')}-${String(initialDate.getDate()).padStart(2, '0')}`;
const visibleMonth = ref(startOfCoreMonth(initialDateValue));
const focusedDate = ref(initialDateValue);
const visibleYearPageStart = ref(getCoreYearPageStart(String(initialDate.getFullYear()).padStart(4, '0')));
const calendarId = computed(() => `${props.id}-calendar`);
const displayValue = computed(() => {
  if (selectedValues.value.length === 0) return props.placeholder;
  if (props.selectionMode === 'single') return formatCorePickerDisplay(selectedValues.value[0]!, props.pickerMode);
  return formatCoreDateSelection(selectedValues.value, props.selectionMode);
});
const dateTimeHour = computed(() =>
  props.pickerMode === 'datetime' && selectedValues.value[0] ? selectedValues.value[0].slice(11, 13) : '00',
);
const dateTimeMinute = computed(() =>
  props.pickerMode === 'datetime' && selectedValues.value[0] ? selectedValues.value[0].slice(14, 16) : '00',
);
const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));
const showClear = computed(
  () => props.clearable && selectedValues.value.length > 0 && !props.disabled && !props.readonly,
);
const cells = computed(() =>
  createCoreDateGrid({
    max: props.max ?? undefined,
    min: props.min ?? undefined,
    mode: props.selectionMode,
    month: visibleMonth.value,
    selected: selectedValues.value.map(pickerValueAsDate),
    today: props.today,
  }),
);
const weeks = computed(() =>
  Array.from({ length: cells.value.length / 7 }, (_, index) => cells.value.slice(index * 7, index * 7 + 7)),
);
const monthCells = computed(() =>
  createCoreMonthGrid({
    max: props.max ?? undefined,
    min: props.min ?? undefined,
    selected: selectedValues.value[0],
    today: props.today,
    year: Number(visibleMonth.value.slice(0, 4)),
  }),
);
const yearCells = computed(() =>
  createCoreYearGrid({
    max: props.max ?? undefined,
    min: props.min ?? undefined,
    selected: selectedValues.value[0],
    startYear: visibleYearPageStart.value,
    today: props.today,
  }),
);
const periodRows = computed(() => {
  const options = props.pickerMode === 'month' ? monthCells.value : yearCells.value;
  return Array.from({ length: 4 }, (_, index) => options.slice(index * 3, index * 3 + 3));
});
const calendarTitle = computed(() => {
  if (props.pickerMode === 'year') return `${visibleYearPageStart.value}–${visibleYearPageStart.value + 11}`;
  if (props.pickerMode === 'month') return visibleMonth.value.slice(0, 4);
  return formatCoreMonthLabel(visibleMonth.value);
});
const previousPeriodLabel = computed(() =>
  props.pickerMode === 'year' ? 'Previous decade' : props.pickerMode === 'month' ? 'Previous year' : 'Previous month',
);
const nextPeriodLabel = computed(() =>
  props.pickerMode === 'year' ? 'Next decade' : props.pickerMode === 'month' ? 'Next year' : 'Next month',
);
const previousDisabled = computed(() => {
  if (props.pickerMode === 'year') {
    return !createCoreYearGrid({
      max: props.max ?? undefined,
      min: props.min ?? undefined,
      startYear: visibleYearPageStart.value - 12,
      today: props.today,
    }).some(({ disabled }) => !disabled);
  }
  if (props.pickerMode === 'month') {
    return !createCoreMonthGrid({
      max: props.max ?? undefined,
      min: props.min ?? undefined,
      today: props.today,
      year: Number(visibleMonth.value.slice(0, 4)) - 1,
    }).some(({ disabled }) => !disabled);
  }
  return !coreMonthHasSelectableDate(
    moveCoreDateByMonth(visibleMonth.value, -1),
    props.min ?? undefined,
    props.max ?? undefined,
  );
});
const nextDisabled = computed(() => {
  if (props.pickerMode === 'year') {
    return !createCoreYearGrid({
      max: props.max ?? undefined,
      min: props.min ?? undefined,
      startYear: visibleYearPageStart.value + 12,
      today: props.today,
    }).some(({ disabled }) => !disabled);
  }
  if (props.pickerMode === 'month') {
    return !createCoreMonthGrid({
      max: props.max ?? undefined,
      min: props.min ?? undefined,
      today: props.today,
      year: Number(visibleMonth.value.slice(0, 4)) + 1,
    }).some(({ disabled }) => !disabled);
  }
  return !coreMonthHasSelectableDate(
    moveCoreDateByMonth(visibleMonth.value, 1),
    props.min ?? undefined,
    props.max ?? undefined,
  );
});
const rootAttrs = computed(() => (attrs.style === undefined ? {} : { style: attrs.style }));
const triggerAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => key.startsWith('aria-') || key.startsWith('data-') || key === 'title' || key === 'tabindex',
    ),
  ),
);
const panelStyle = ref<Record<string, string>>({});
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

watch(
  () => props.modelValue,
  () => {
    const value = selectedValues.value[0];
    if (!value || open.value) return;
    const date = pickerValueAsDate(value);
    visibleMonth.value = startOfCoreMonth(date);
    focusedDate.value = date;
    visibleYearPageStart.value = getCoreYearPageStart(date.slice(0, 4));
  },
  { deep: true },
);

function initialFocusDate(): string {
  const selected = selectedValues.value.map(pickerValueAsDate);
  for (const candidate of [...selected, props.today, props.min, props.max]) {
    if (candidate && !isCoreDateDisabled(candidate, props.min ?? undefined, props.max ?? undefined)) return candidate;
  }
  return props.today;
}

function pickerValueAsDate(value: string): string {
  if (props.pickerMode === 'datetime') return value.slice(0, 10);
  if (props.pickerMode === 'year') return `${value}-01-01`;
  if (props.pickerMode === 'month') return `${value}-01`;
  return value;
}

function updatePanelPosition(): void {
  if (!open.value || !triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  const viewportPadding = 16;
  const offset = 2;
  const width = Math.min(320, window.innerWidth - viewportPadding * 2);
  const estimatedHeight = calendarRef.value?.getBoundingClientRect().height || 336;
  const below = rect.bottom + offset;
  const top =
    below + estimatedHeight <= window.innerHeight - viewportPadding
      ? below
      : Math.max(viewportPadding, rect.top - offset - estimatedHeight);
  const left = Math.min(
    Math.max(viewportPadding, rect.left),
    Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
  );
  panelStyle.value = {
    inlineSize: `${width}px`,
    insetBlockStart: `${Math.round(top)}px`,
    insetInlineStart: `${Math.round(left)}px`,
  };
}

async function focusDate(value: string): Promise<void> {
  if (isCoreDateDisabled(value, props.min ?? undefined, props.max ?? undefined)) return;
  focusedDate.value = value;
  visibleMonth.value = startOfCoreMonth(value);
  await nextTick();
  calendarRef.value?.querySelector<HTMLButtonElement>(`[data-date="${value}"]`)?.focus();
}

async function focusPeriod(value: string): Promise<void> {
  const date = pickerValueAsDate(value);
  if (isCoreDateDisabled(date, props.min ?? undefined, props.max ?? undefined)) return;
  focusedDate.value = date;
  visibleMonth.value = startOfCoreMonth(date);
  if (props.pickerMode === 'year') {
    const year = Number(value);
    if (year < visibleYearPageStart.value || year >= visibleYearPageStart.value + 12) {
      visibleYearPageStart.value += Math.floor((year - visibleYearPageStart.value) / 12) * 12;
    }
  }
  await nextTick();
  const attribute = props.pickerMode === 'year' ? 'data-year' : 'data-month';
  calendarRef.value?.querySelector<HTMLButtonElement>(`[${attribute}="${value}"]`)?.focus();
}

async function openCalendar(): Promise<void> {
  if (props.disabled || props.readonly || open.value) return;
  const value = initialFocusDate();
  focusedDate.value = value;
  visibleMonth.value = startOfCoreMonth(value);
  open.value = true;
  emit('open-change', true);
  await nextTick();
  updatePanelPosition();
  if (props.pickerMode === 'date' || props.pickerMode === 'datetime') await focusDate(value);
  else await focusPeriod(props.pickerMode === 'year' ? value.slice(0, 4) : value.slice(0, 7));
}

function closeCalendar(restoreFocus = true): void {
  if (!open.value) return;
  open.value = false;
  emit('open-change', false);
  if (restoreFocus) void nextTick(() => triggerRef.value?.focus());
}

function toggleCalendar(): void {
  if (open.value) closeCalendar();
  else void openCalendar();
}

function clearValue(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  if (!showClear.value) return;
  emit('update:modelValue', props.selectionMode === 'single' ? '' : []);
  closeCalendar();
  triggerRef.value?.focus();
}

function selectDate(value: string, disabled: boolean): void {
  if (disabled || props.readonly) return;
  if (props.pickerMode === 'datetime') {
    emit('update:modelValue', combineCoreDateTime(value, dateTimeHour.value, dateTimeMinute.value));
    return;
  }
  if (props.selectionMode === 'multiple') {
    emit('update:modelValue', toggleCoreMultipleDate(selectedValues.value, value));
    return;
  }
  if (props.selectionMode === 'range') {
    const range = selectCoreDateRange(selectedValues.value, value);
    emit('update:modelValue', range);
    if (range.length === 2) closeCalendar();
    return;
  }
  emit('update:modelValue', value);
  closeCalendar();
}

function updateDateTimePart(part: 'hour' | 'minute', event: Event): void {
  if (!(event.target instanceof HTMLSelectElement) || props.disabled || props.readonly) return;
  const date = selectedValues.value[0]?.slice(0, 10) ?? focusedDate.value;
  const hour = part === 'hour' ? event.target.value : dateTimeHour.value;
  const minute = part === 'minute' ? event.target.value : dateTimeMinute.value;
  emit('update:modelValue', combineCoreDateTime(date, hour, minute));
}

function selectPeriod(value: string, disabled: boolean): void {
  if (disabled || props.readonly) return;
  emit('update:modelValue', value);
  closeCalendar();
}

function changePeriod(amount: number): void {
  if (props.pickerMode === 'year') {
    void focusPeriod(String(Number(focusedDate.value.slice(0, 4)) + amount * 12).padStart(4, '0'));
    return;
  }
  if (props.pickerMode === 'month') {
    const target = moveCoreDateByMonth(focusedDate.value, amount * 12);
    void focusPeriod(target.slice(0, 7));
    return;
  }
  const month = moveCoreDateByMonth(visibleMonth.value, amount);
  if (!coreMonthHasSelectableDate(month, props.min ?? undefined, props.max ?? undefined)) return;
  const target = moveCoreDateByMonth(focusedDate.value, amount);
  const bounded = props.min && target < props.min ? props.min : props.max && target > props.max ? props.max : target;
  void focusDate(bounded);
}

function handleTriggerKeydown(event: KeyboardEvent): void {
  if (!['ArrowDown', 'Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  void openCalendar();
}

function handleDayKeydown(event: KeyboardEvent, value: string, disabled: boolean): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectDate(value, disabled);
    return;
  }
  let target: string | null = null;
  if (event.key === 'ArrowLeft') target = addCoreDays(value, -1);
  if (event.key === 'ArrowRight') target = addCoreDays(value, 1);
  if (event.key === 'ArrowUp') target = addCoreDays(value, -7);
  if (event.key === 'ArrowDown') target = addCoreDays(value, 7);
  if (event.key === 'Home') target = getCoreWeekBoundary(value, 'start');
  if (event.key === 'End') target = getCoreWeekBoundary(value, 'end');
  if (event.key === 'PageUp') target = moveCoreDateByMonth(value, -1);
  if (event.key === 'PageDown') target = moveCoreDateByMonth(value, 1);
  if (!target) return;
  event.preventDefault();
  void focusDate(target);
}

function handlePeriodKeydown(event: KeyboardEvent, value: string, disabled: boolean): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectPeriod(value, disabled);
    return;
  }
  let target: string | null = null;
  if (props.pickerMode === 'month') {
    const date = `${value}-01`;
    if (event.key === 'ArrowLeft') target = moveCoreDateByMonth(date, -1).slice(0, 7);
    if (event.key === 'ArrowRight') target = moveCoreDateByMonth(date, 1).slice(0, 7);
    if (event.key === 'ArrowUp') target = moveCoreDateByMonth(date, -3).slice(0, 7);
    if (event.key === 'ArrowDown') target = moveCoreDateByMonth(date, 3).slice(0, 7);
    if (event.key === 'Home') target = `${value.slice(0, 4)}-01`;
    if (event.key === 'End') target = `${value.slice(0, 4)}-12`;
    if (event.key === 'PageUp') target = moveCoreDateByMonth(date, -12).slice(0, 7);
    if (event.key === 'PageDown') target = moveCoreDateByMonth(date, 12).slice(0, 7);
  } else {
    const year = Number(value);
    if (event.key === 'ArrowLeft') target = String(year - 1).padStart(4, '0');
    if (event.key === 'ArrowRight') target = String(year + 1).padStart(4, '0');
    if (event.key === 'ArrowUp') target = String(year - 3).padStart(4, '0');
    if (event.key === 'ArrowDown') target = String(year + 3).padStart(4, '0');
    if (event.key === 'Home') target = String(visibleYearPageStart.value).padStart(4, '0');
    if (event.key === 'End') target = String(visibleYearPageStart.value + 11).padStart(4, '0');
    if (event.key === 'PageUp') target = String(year - 12).padStart(4, '0');
    if (event.key === 'PageDown') target = String(year + 12).padStart(4, '0');
  }
  if (!target) return;
  event.preventDefault();
  void focusPeriod(target);
}

function handleDocumentClick(event: MouseEvent): void {
  if (!open.value || !(event.target instanceof Node)) return;
  if (rootRef.value?.contains(event.target) || calendarRef.value?.contains(event.target)) return;
  closeCalendar(false);
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !open.value) return;
  event.preventDefault();
  closeCalendar();
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
  window.addEventListener('resize', updatePanelPosition);
  window.addEventListener('scroll', updatePanelPosition, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleDocumentKeydown);
  window.removeEventListener('resize', updatePanelPosition);
  window.removeEventListener('scroll', updatePanelPosition, true);
});
</script>

<template>
  <div
    ref="rootRef"
    v-bind="rootAttrs"
    class="core-date-picker-recipe"
    :class="$attrs.class"
    :data-cm-filled="selectedValues.length > 0 || undefined"
  >
    <button
      :id="props.id"
      ref="triggerRef"
      v-bind="triggerAttrs"
      class="core-date-picker-recipe__trigger"
      :class="{
        'core-date-picker-recipe__trigger--invalid': props.invalid,
        'core-date-picker-recipe__trigger--open': open,
        'core-date-picker-recipe__trigger--placeholder': selectedValues.length === 0 && props.placeholder,
        'core-date-picker-recipe__trigger--with-clear': showClear,
      }"
      type="button"
      aria-haspopup="dialog"
      :aria-controls="calendarId"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-invalid="props.invalid ? 'true' : undefined"
      :aria-readonly="props.readonly ? 'true' : undefined"
      :disabled="props.disabled || undefined"
      @click="toggleCalendar"
      @keydown="handleTriggerKeydown"
    >
      <span class="core-date-picker-recipe__value">{{ displayValue }}</span>
      <span class="core-date-picker-recipe__icon" aria-hidden="true">
        <VueIconify :icon="icons.calendar" size="var(--cm-icon-size-md)" />
      </span>
    </button>
    <button
      v-if="showClear"
      class="core-date-picker-recipe__clear"
      type="button"
      aria-label="Clear date"
      @mousedown.prevent
      @click="clearValue"
    >
      <VueIconify :icon="icons.xmark" size="var(--cm-icon-size-sm)" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <section
        v-if="open"
        :id="calendarId"
        ref="calendarRef"
        class="core-date-picker-recipe__calendar"
        :style="panelStyle"
        aria-label="Choose date"
        role="dialog"
      >
        <header class="core-date-picker-recipe__header">
          <button
            class="core-date-picker-recipe__navigation"
            type="button"
            :aria-label="previousPeriodLabel"
            :disabled="previousDisabled"
            @click="changePeriod(-1)"
          >
            <VueIconify :icon="icons.caretLeft" size="var(--cm-icon-size-md)" aria-hidden="true" />
          </button>
          <div class="core-date-picker-recipe__month" aria-live="polite">{{ calendarTitle }}</div>
          <button
            class="core-date-picker-recipe__navigation"
            type="button"
            :aria-label="nextPeriodLabel"
            :disabled="nextDisabled"
            @click="changePeriod(1)"
          >
            <VueIconify :icon="icons.caretRight" size="var(--cm-icon-size-md)" aria-hidden="true" />
          </button>
        </header>
        <div
          v-if="props.pickerMode === 'month' || props.pickerMode === 'year'"
          class="core-date-picker-recipe__periods"
          role="grid"
        >
          <div
            v-for="(row, rowIndex) in periodRows"
            :key="rowIndex"
            class="core-date-picker-recipe__period-row"
            role="row"
          >
            <button
              v-for="period in row"
              :key="period.value"
              class="core-date-picker-recipe__period"
              :class="{
                'core-date-picker-recipe__day--today': period.today,
                'core-date-picker-recipe__day--selected': period.selected,
              }"
              type="button"
              role="gridcell"
              :data-month="props.pickerMode === 'month' ? period.value : undefined"
              :data-year="props.pickerMode === 'year' ? period.value : undefined"
              :aria-label="period.label"
              :aria-selected="period.selected ? 'true' : 'false'"
              :aria-current="period.today ? 'date' : undefined"
              :disabled="period.disabled || undefined"
              :tabindex="period.value === focusedDate.slice(0, props.pickerMode === 'year' ? 4 : 7) ? 0 : -1"
              @focus="focusedDate = pickerValueAsDate(period.value)"
              @click="selectPeriod(period.value, period.disabled)"
              @keydown="handlePeriodKeydown($event, period.value, period.disabled)"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
        <div v-else class="core-date-picker-recipe__grid" role="grid">
          <div class="core-date-picker-recipe__weekdays" role="row">
            <span
              v-for="label in weekdayLabels"
              :key="label"
              class="core-date-picker-recipe__weekday"
              role="columnheader"
            >
              {{ label }}
            </span>
          </div>
          <div class="core-date-picker-recipe__days">
            <div v-for="(week, weekIndex) in weeks" :key="weekIndex" class="core-date-picker-recipe__week" role="row">
              <button
                v-for="day in week"
                :key="day.date"
                class="core-date-picker-recipe__day"
                :class="{
                  'core-date-picker-recipe__day--outside': !day.inCurrentMonth,
                  'core-date-picker-recipe__day--today': day.today,
                  'core-date-picker-recipe__day--in-range': day.inRange,
                  'core-date-picker-recipe__day--range-start': day.rangeStart,
                  'core-date-picker-recipe__day--range-end': day.rangeEnd,
                  'core-date-picker-recipe__day--selected': day.selected,
                }"
                type="button"
                role="gridcell"
                :data-date="day.date"
                :aria-label="formatCoreDateLabel(day.date)"
                :aria-selected="day.selected ? 'true' : 'false'"
                :aria-current="day.today ? 'date' : undefined"
                :disabled="day.disabled || undefined"
                :tabindex="day.date === focusedDate ? 0 : -1"
                @focus="focusedDate = day.date"
                @click="selectDate(day.date, day.disabled)"
                @keydown="handleDayKeydown($event, day.date, day.disabled)"
              >
                {{ day.day }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="props.pickerMode === 'datetime'" class="core-date-picker-recipe__time">
          <span class="core-date-picker-recipe__time-label">Time</span>
          <div class="core-date-picker-recipe__time-controls">
            <select
              class="core-date-picker-recipe__time-select"
              aria-label="Hour"
              :value="dateTimeHour"
              @change="updateDateTimePart('hour', $event)"
            >
              <option v-for="hour in hourOptions" :key="hour" :value="hour">{{ hour }}</option>
            </select>
            <span aria-hidden="true">:</span>
            <select
              class="core-date-picker-recipe__time-select"
              aria-label="Minute"
              :value="dateTimeMinute"
              @change="updateDateTimePart('minute', $event)"
            >
              <option v-for="minute in minuteOptions" :key="minute" :value="minute">{{ minute }}</option>
            </select>
          </div>
        </div>
      </section>
    </Teleport>
  </div>
</template>

<style scoped>
/* stylelint-disable no-descending-specificity -- Interactive date states intentionally layer base, focus, and selection selectors. */

.core-date-picker-recipe {
  position: relative;
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 0;
}

.core-date-picker-recipe__trigger {
  display: inline-flex;
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 0;
  min-block-size: var(--cm-control-height-md);
  align-items: center;
  justify-content: space-between;
  gap: var(--cm-space-2);
  padding: 0.3125rem var(--cm-space-3);
  border: var(--cm-border-width) solid var(--cm-color-border-interactive);
  border-radius: var(--cm-radius-control);
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

.core-date-picker-recipe__trigger:hover:not(:disabled, .core-date-picker-recipe__trigger--invalid) {
  border-color: var(--cm-color-interactive-primary-border);
}

.core-date-picker-recipe__trigger:focus-visible,
.core-date-picker-recipe__trigger--open {
  border-color: var(--cm-color-border-focus);
  outline: none;
}

.core-date-picker-recipe__trigger:focus-visible {
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.core-date-picker-recipe__trigger--invalid,
.core-date-picker-recipe__trigger--invalid:hover,
.core-date-picker-recipe__trigger--invalid:focus-visible {
  border-color: var(--cm-color-status-danger-border);
}

.core-date-picker-recipe__trigger:disabled {
  border-color: var(--cm-color-border-disabled);
  background: var(--cm-color-background-surface-disabled);
  color: var(--cm-color-text-disabled);
  cursor: not-allowed;
}

.core-date-picker-recipe__trigger[aria-readonly='true'] {
  cursor: default;
}

.core-date-picker-recipe__trigger--with-clear {
  padding-inline-end: 3.625rem;
}

.core-date-picker-recipe__value {
  min-inline-size: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.core-date-picker-recipe__value:empty::before {
  content: '\00a0';
}

.core-date-picker-recipe__trigger--placeholder .core-date-picker-recipe__value {
  color: var(--cm-color-text-placeholder);
}

.core-date-picker-recipe__icon {
  display: inline-flex;
  flex: 0 0 auto;
  color: var(--cm-color-icon-secondary);
  line-height: 1;
}

.core-date-picker-recipe__clear {
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

.core-date-picker-recipe__clear:hover {
  color: var(--cm-color-icon-primary);
}

.core-date-picker-recipe__clear:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.core-date-picker-recipe__calendar {
  position: fixed;
  z-index: 10;
  display: grid;
  gap: var(--cm-space-2);
  max-block-size: none;
  padding: var(--cm-space-3);
  border: var(--cm-border-width) solid var(--cm-color-border-default);
  border-radius: var(--cm-radius-overlay);
  background: var(--cm-color-background-surface-elevated);
  box-shadow: var(--cm-shadow-overlay);
  color: var(--cm-color-text-primary);
}

.core-date-picker-recipe__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--cm-space-2);
}

.core-date-picker-recipe__month {
  font-weight: var(--cm-font-weight-medium);
  text-align: center;
  text-transform: capitalize;
}

.core-date-picker-recipe__navigation,
.core-date-picker-recipe__day,
.core-date-picker-recipe__period {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control-tight);
  background: transparent;
  color: var(--cm-color-text-primary);
  cursor: pointer;
  font: inherit;
}

.core-date-picker-recipe__navigation {
  inline-size: var(--cm-control-height-md);
  block-size: var(--cm-control-height-md);
}

.core-date-picker-recipe__navigation:hover:not(:disabled),
.core-date-picker-recipe__day:hover:not(:disabled, .core-date-picker-recipe__day--selected),
.core-date-picker-recipe__period:hover:not(:disabled, .core-date-picker-recipe__day--selected) {
  background: var(--cm-color-background-surface-hover);
}

.core-date-picker-recipe__navigation:focus-visible,
.core-date-picker-recipe__day:focus-visible,
.core-date-picker-recipe__period:focus-visible {
  z-index: 1;
  border-color: var(--cm-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.core-date-picker-recipe__navigation:disabled,
.core-date-picker-recipe__day:disabled,
.core-date-picker-recipe__period:disabled {
  color: var(--cm-color-text-disabled);
  cursor: not-allowed;
}

.core-date-picker-recipe__grid {
  display: grid;
  gap: var(--cm-space-1);
}

.core-date-picker-recipe__periods {
  display: grid;
  row-gap: 0.125rem;
}

.core-date-picker-recipe__period-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 0.125rem;
}

.core-date-picker-recipe__period {
  min-inline-size: 0;
  min-block-size: var(--cm-control-height-md);
  padding: var(--cm-space-2) var(--cm-space-3);
  text-transform: capitalize;
}

.core-date-picker-recipe__weekdays,
.core-date-picker-recipe__week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  column-gap: 0.125rem;
  justify-items: center;
}

.core-date-picker-recipe__days {
  display: grid;
  row-gap: 0.125rem;
}

.core-date-picker-recipe__weekday {
  padding-block: var(--cm-space-1);
  color: var(--cm-color-text-muted);
  font-size: var(--cm-font-size-sm);
  font-weight: var(--cm-font-weight-medium);
  line-height: var(--cm-line-height-normal);
  text-align: center;
  text-transform: capitalize;
}

.core-date-picker-recipe__day {
  inline-size: var(--cm-control-height-md);
  min-inline-size: var(--cm-control-height-md);
  block-size: var(--cm-control-height-md);
  min-block-size: var(--cm-control-height-md);
}

.core-date-picker-recipe__day--outside {
  color: var(--cm-color-text-muted);
}

.core-date-picker-recipe__day--today {
  border-color: var(--cm-color-border-interactive);
}

.core-date-picker-recipe__day--in-range,
.core-date-picker-recipe__day--range-start,
.core-date-picker-recipe__day--range-end {
  position: relative;
  inline-size: 100%;
}

.core-date-picker-recipe__day--in-range {
  border-radius: 0;
  background: var(--cm-color-background-surface-hover);
  color: var(--cm-color-text-primary);
}

.core-date-picker-recipe__day--range-start {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

.core-date-picker-recipe__day--range-end {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}

.core-date-picker-recipe__day--range-start.core-date-picker-recipe__day--range-end {
  border-radius: var(--cm-radius-control-tight);
}

.core-date-picker-recipe__day--in-range::before,
.core-date-picker-recipe__day--in-range::after,
.core-date-picker-recipe__day--range-start::after,
.core-date-picker-recipe__day--range-end::before {
  position: absolute;
  inset-block: calc(var(--cm-border-width) * -1);
  inline-size: 0.125rem;
  background: var(--cm-color-background-surface-hover);
  content: '';
}

.core-date-picker-recipe__day--in-range::before,
.core-date-picker-recipe__day--range-end::before {
  inset-inline-end: 100%;
}

.core-date-picker-recipe__day--in-range::after,
.core-date-picker-recipe__day--range-start::after {
  inset-inline-start: 100%;
}

.core-date-picker-recipe__week > :first-child::before,
.core-date-picker-recipe__week > :last-child::after,
.core-date-picker-recipe__day--range-start.core-date-picker-recipe__day--range-end::before,
.core-date-picker-recipe__day--range-start.core-date-picker-recipe__day--range-end::after {
  display: none;
}

.core-date-picker-recipe__day--selected,
.core-date-picker-recipe__day--selected:hover,
.core-date-picker-recipe__day--selected:focus-visible {
  border-color: transparent;
  background: var(--cm-color-background-surface-selected);
  color: var(--cm-color-selected-foreground);
}

.core-date-picker-recipe__time {
  display: grid;
  gap: var(--cm-space-1);
  padding-block-start: var(--cm-space-2);
  border-block-start: var(--cm-border-width) solid var(--cm-color-border-divider);
}

.core-date-picker-recipe__time-label {
  color: var(--cm-color-text-muted);
  font-size: var(--cm-font-size-sm);
  font-weight: var(--cm-font-weight-medium);
  line-height: var(--cm-line-height-normal);
}

.core-date-picker-recipe__time-controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--cm-space-2);
}

.core-date-picker-recipe__time-select {
  box-sizing: border-box;
  min-inline-size: 0;
  block-size: var(--cm-control-height-md);
  padding-inline: var(--cm-space-2);
  border: var(--cm-border-width) solid var(--cm-color-border-interactive);
  border-radius: var(--cm-radius-control);
  background: var(--cm-color-background-surface);
  color: var(--cm-color-text-primary);
  font: inherit;
}

.core-date-picker-recipe__time-select:focus-visible {
  border-color: var(--cm-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  .core-date-picker-recipe__trigger {
    transition: none;
  }
}
</style>
