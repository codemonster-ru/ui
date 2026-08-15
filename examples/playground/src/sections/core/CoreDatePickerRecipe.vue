<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch, type PropType } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';

import {
  addCoreDays,
  coreMonthHasSelectableDate,
  createCoreDateGrid,
  formatCoreDateDisplay,
  formatCoreDateLabel,
  formatCoreMonthLabel,
  formatCoreDateSelection,
  getCoreWeekBoundary,
  isCoreDateDisabled,
  moveCoreDateByMonth,
  normalizeCoreDateSelection,
  requireCoreDate,
  selectCoreDateRange,
  startOfCoreMonth,
  toggleCoreMultipleDate,
  type CoreDatePickerValue,
  type CoreDateSelectionMode,
} from './core-date-picker-recipe';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  id: { type: String, required: true },
  modelValue: { type: [String, Array] as PropType<CoreDatePickerValue>, default: '' },
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
const emit = defineEmits<{ 'update:modelValue': [value: CoreDatePickerValue] }>();
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

const selectedValues = computed(() => normalizeCoreDateSelection(props.modelValue, props.selectionMode));
const initialDate = selectedValues.value[0] ?? props.today;
const visibleMonth = ref(startOfCoreMonth(initialDate));
const focusedDate = ref(initialDate);
const calendarId = computed(() => `${props.id}-calendar`);
const displayValue = computed(() => {
  if (selectedValues.value.length === 0) return props.placeholder;
  if (props.selectionMode === 'single') return formatCoreDateDisplay(selectedValues.value[0]!);
  return formatCoreDateSelection(selectedValues.value, props.selectionMode);
});
const showClear = computed(
  () => props.clearable && selectedValues.value.length > 0 && !props.disabled && !props.readonly,
);
const cells = computed(() =>
  createCoreDateGrid({
    max: props.max ?? undefined,
    min: props.min ?? undefined,
    mode: props.selectionMode,
    month: visibleMonth.value,
    selected: selectedValues.value,
    today: props.today,
  }),
);
const weeks = computed(() =>
  Array.from({ length: cells.value.length / 7 }, (_, index) => cells.value.slice(index * 7, index * 7 + 7)),
);
const previousDisabled = computed(
  () =>
    !coreMonthHasSelectableDate(
      moveCoreDateByMonth(visibleMonth.value, -1),
      props.min ?? undefined,
      props.max ?? undefined,
    ),
);
const nextDisabled = computed(
  () =>
    !coreMonthHasSelectableDate(
      moveCoreDateByMonth(visibleMonth.value, 1),
      props.min ?? undefined,
      props.max ?? undefined,
    ),
);
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
    visibleMonth.value = startOfCoreMonth(value);
    focusedDate.value = value;
  },
  { deep: true },
);

function initialFocusDate(): string {
  for (const candidate of [...selectedValues.value, props.today, props.min, props.max]) {
    if (candidate && !isCoreDateDisabled(candidate, props.min ?? undefined, props.max ?? undefined)) return candidate;
  }
  return props.today;
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

async function openCalendar(): Promise<void> {
  if (props.disabled || props.readonly || open.value) return;
  const value = initialFocusDate();
  focusedDate.value = value;
  visibleMonth.value = startOfCoreMonth(value);
  open.value = true;
  await nextTick();
  updatePanelPosition();
  await focusDate(value);
}

function closeCalendar(restoreFocus = true): void {
  if (!open.value) return;
  open.value = false;
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

function changeMonth(amount: number): void {
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
  <div ref="rootRef" v-bind="rootAttrs" class="core-date-picker-recipe" :class="$attrs.class">
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
            aria-label="Previous month"
            :disabled="previousDisabled"
            @click="changeMonth(-1)"
          >
            <VueIconify :icon="icons.caretLeft" size="var(--cm-icon-size-md)" aria-hidden="true" />
          </button>
          <div class="core-date-picker-recipe__month" aria-live="polite">{{ formatCoreMonthLabel(visibleMonth) }}</div>
          <button
            class="core-date-picker-recipe__navigation"
            type="button"
            aria-label="Next month"
            :disabled="nextDisabled"
            @click="changeMonth(1)"
          >
            <VueIconify :icon="icons.caretRight" size="var(--cm-icon-size-md)" aria-hidden="true" />
          </button>
        </header>
        <div class="core-date-picker-recipe__grid" role="grid">
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
.core-date-picker-recipe__day {
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
.core-date-picker-recipe__day:hover:not(:disabled, .core-date-picker-recipe__day--selected) {
  background: var(--cm-color-background-surface-hover);
}

.core-date-picker-recipe__navigation:focus-visible,
.core-date-picker-recipe__day:focus-visible {
  z-index: 1;
  border-color: var(--cm-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.core-date-picker-recipe__navigation:disabled,
.core-date-picker-recipe__day:disabled {
  color: var(--cm-color-text-disabled);
  cursor: not-allowed;
}

.core-date-picker-recipe__grid {
  display: grid;
  gap: var(--cm-space-1);
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

@media (prefers-reduced-motion: reduce) {
  .core-date-picker-recipe__trigger {
    transition: none;
  }
}
</style>
