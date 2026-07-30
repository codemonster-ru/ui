<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, useAttrs, watch, type StyleValue } from 'vue';
import { flip, offset, shift, type MiddlewareType, type PlacementType } from '@codemonster-ru/floater.js';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import VfButton from '@/components/button/VfButton.vue';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import VfSelect from '@/components/select/VfSelect.vue';
import { vfFieldContextKey } from '@/components/field/context';
import { useClickOutside, useDisclosure, useEscapeKey, useFloating, useId } from '@/composables';
import { useFocusScopeBranch } from '@/composables/useFocusTrap';
import { vfMotionDurationsMs } from '@/theme/motion';
import type {
  VfControlSize,
  VfDatePickerLabels,
  VfDropdownPlacement,
  VfSelectOption,
} from '@/types/components';
import { cx } from '@/utils/classes';

defineOptions({
  inheritAttrs: false,
});

interface VfDatePickerProps {
  modelValue?: string;
  min?: string;
  max?: string;
  showTime?: boolean;
  minuteStep?: number;
  locale?: string | string[];
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  size?: VfControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  placeholder?: string;
  placement?: VfDropdownPlacement;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  labels?: Partial<VfDatePickerLabels>;
}

const props = withDefaults(defineProps<VfDatePickerProps>(), {
  modelValue: '',
  min: undefined,
  max: undefined,
  showTime: false,
  minuteStep: 1,
  locale: undefined,
  firstDayOfWeek: 1,
  size: 'md',
  invalid: false,
  disabled: false,
  readonly: false,
  clearable: false,
  placeholder: undefined,
  placement: 'bottom-start',
  teleportTo: undefined,
  disableTeleport: false,
  labels: () => ({}),
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

interface CalendarDay {
  date: Date;
  value: string;
  label: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  disabled: boolean;
}

const attrs = useAttrs();
const fieldContext = inject(vfFieldContextKey, null);
const triggerRef = ref<HTMLElement | null>(null);
const calendarRef = ref<HTMLElement | null>(null);
const triggerId = useId({ prefix: 'vf-date-picker-trigger' });
const calendarId = useId({ prefix: 'vf-date-picker-calendar' });
const hourSelectId = useId({ prefix: 'vf-date-picker-hour' });
const minuteSelectId = useId({ prefix: 'vf-date-picker-minute' });
const disclosure = useDisclosure();
const isOpen = disclosure.isOpen;
const today = startOfDay(new Date());
const initialDate = parseModelValue(props.modelValue) ?? today;
const visibleMonth = ref(startOfMonth(initialDate));
const focusedDate = ref(initialDate);
const draftDate = ref(initialDate);
const draftHour = ref(initialDate.getHours());
const draftMinute = ref(initialDate.getMinutes());
const transitionDuration = {
  enter: vfMotionDurationsMs.normal,
  leave: vfMotionDurationsMs.normal,
} as const;

fieldContext?.setFloatingSupported(true);
useFocusScopeBranch(calendarRef, isOpen);

const resolvedLabels = computed<VfDatePickerLabels>(() => ({
  calendar: 'Choose date',
  clear: 'Clear date',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  time: 'Time',
  hour: 'Hour',
  minute: 'Minute',
  ...props.labels,
}));
const selectedDate = computed(() => parseModelValue(props.modelValue));
const minDate = computed(() => parseBoundary(props.min, false));
const maxDate = computed(() => parseBoundary(props.max, true));
const normalizedMinuteStep = computed(() =>
  Math.min(60, Math.max(1, Math.trunc(props.minuteStep) || 1)),
);
const hasValue = computed(() => selectedDate.value !== null);
const hasClearControl = computed(
  () => props.clearable && hasValue.value && !props.disabled && !props.readonly,
);
const isFloatingLabel = computed(() => fieldContext?.labelPlacement.value === 'floating');
const externalClass = computed(() => attrs.class as string | undefined);
const externalStyle = computed<StyleValue>(() => attrs.style as StyleValue);
const triggerAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) =>
        key.startsWith('aria-') ||
        key.startsWith('data-') ||
        key === 'title' ||
        key === 'tabindex',
    ),
  ),
);
const dateFormatter = computed(
  () =>
    new Intl.DateTimeFormat(props.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(props.showTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : {}),
    }),
);
const monthFormatter = computed(
  () => new Intl.DateTimeFormat(props.locale, { year: 'numeric', month: 'long' }),
);
const dayFormatter = computed(
  () => new Intl.DateTimeFormat(props.locale, { weekday: 'short' }),
);
const dateLabelFormatter = computed(
  () => new Intl.DateTimeFormat(props.locale, { dateStyle: 'full' }),
);
const displayValue = computed(() =>
  selectedDate.value ? dateFormatter.value.format(selectedDate.value) : props.placeholder ?? '',
);
const activeDate = computed(() =>
  props.showTime && isOpen.value ? draftDate.value : selectedDate.value,
);
const timeCandidates = computed(() =>
  Array.from({ length: 24 }, (_, hour) =>
    Array.from(
      { length: Math.ceil(60 / normalizedMinuteStep.value) },
      (_, index) => ({
        hour,
        minute: index * normalizedMinuteStep.value,
      }),
    ),
  ).flat(),
);
const hourOptions = computed<VfSelectOption[]>(() =>
  Array.from({ length: 24 }, (_, hour) => ({
    value: String(hour).padStart(2, '0'),
    label: String(hour).padStart(2, '0'),
    disabled: !timeCandidates.value.some(
      (candidate) =>
        candidate.hour === hour &&
        isDateTimeSelectable(toDateTime(draftDate.value, candidate.hour, candidate.minute)),
    ),
  })),
);
const minuteOptions = computed<VfSelectOption[]>(() =>
  Array.from(
    { length: Math.ceil(60 / normalizedMinuteStep.value) },
    (_, index) => index * normalizedMinuteStep.value,
  ).map((minute) => ({
    value: String(minute).padStart(2, '0'),
    label: String(minute).padStart(2, '0'),
    disabled: !isDateTimeSelectable(toDateTime(draftDate.value, draftHour.value, minute)),
  })),
);
const draftHourValue = computed(() => String(draftHour.value).padStart(2, '0'));
const draftMinuteValue = computed(() => String(draftMinute.value).padStart(2, '0'));
const weekdayLabels = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const day = addDays(new Date(2024, 0, 7), (props.firstDayOfWeek + index) % 7);
    return dayFormatter.value.format(day);
  }),
);
const calendarDays = computed<CalendarDay[]>(() => {
  const monthStart = visibleMonth.value;
  const leadingDays = (monthStart.getDay() - props.firstDayOfWeek + 7) % 7;
  const gridStart = addDays(monthStart, -leadingDays);
  const requiredDays = leadingDays + endOfMonth(monthStart).getDate();
  const cellCount = Math.max(35, Math.ceil(requiredDays / 7) * 7);

  return Array.from({ length: cellCount }, (_, index) => {
    const date = addDays(gridStart, index);
    const value = formatDate(date);

    return {
      date,
      value,
      label: dateLabelFormatter.value.format(date),
      inCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: isSameDay(date, today),
      isSelected: activeDate.value ? isSameDay(date, activeDate.value) : false,
      disabled: isDateDisabled(date),
    };
  });
});
const calendarWeeks = computed(() =>
  Array.from(
    { length: calendarDays.value.length / 7 },
    (_, index) => calendarDays.value.slice(index * 7, index * 7 + 7),
  ),
);
const triggerClasses = computed(() =>
  cx(
    'vf-date-picker',
    props.size !== 'md' && `vf-date-picker--${props.size}`,
    props.invalid && 'vf-date-picker--invalid',
    isOpen.value && 'vf-date-picker--open',
    !hasValue.value && props.placeholder && 'vf-date-picker--placeholder',
    hasClearControl.value && 'vf-date-picker--with-clear',
    isFloatingLabel.value && 'vf-date-picker--floating',
  ),
);
const wrapperClasses = computed(() =>
  cx(
    'vf-date-picker-wrap',
    props.size !== 'md' && `vf-date-picker-wrap--${props.size}`,
    hasClearControl.value && 'vf-date-picker-wrap--with-clear',
    isFloatingLabel.value && 'vf-date-picker-wrap--floating',
  ),
);
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
const { placement: floatingPlacement, styles: floatingStyles } = useFloating(
  triggerRef,
  calendarRef,
  {
    enabled: isOpen,
    placement: computed(() => props.placement),
    middleware: computed(
      () => [offset(2), flip({ placements: allowedPlacements.value }), shift()] as MiddlewareType[],
    ),
    strategy: 'fixed',
  },
);
const calendarClasses = computed(() => [
  'vf-dropdown__menu',
  'vf-date-picker__calendar',
  floatingPlacement.value.startsWith('top') && 'vf-dropdown__menu--top',
]);
const calendarStyles = computed(() => floatingStyles.value);
const previousMonthDisabled = computed(() => !monthHasSelectableDate(addMonths(visibleMonth.value, -1)));
const nextMonthDisabled = computed(() => !monthHasSelectableDate(addMonths(visibleMonth.value, 1)));

watch([hasValue, isOpen], ([value, open]) => {
  fieldContext?.setFilled(value || open);
}, { immediate: true });

watch(
  () => props.modelValue,
  (value) => {
    const date = parseModelValue(value);

    if (date) {
      visibleMonth.value = startOfMonth(date);
      focusedDate.value = date;

      if (!isOpen.value) {
        syncDraft(date);
      }
    }
  },
);

onBeforeUnmount(() => {
  fieldContext?.setFloatingSupported(false);
  fieldContext?.setFilled(false);
});

function parseDate(value?: string): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  return formatDate(date) === value ? date : null;
}

function parseDateTime(value?: string): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );

  return formatDateTime(date) === value ? date : null;
}

function parseModelValue(value?: string): Date | null {
  return parseDateTime(value) ?? parseDate(value);
}

function parseBoundary(value: string | undefined, endForDateOnly: boolean): Date | null {
  const dateTime = parseDateTime(value);

  if (dateTime) {
    return dateTime;
  }

  const date = parseDate(value);

  if (!date) {
    return null;
  }

  return endForDateOnly ? endOfDay(date) : date;
}

function formatDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(date)}T${hour}:${minute}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function moveToMonth(date: Date, amount: number): Date {
  const month = addMonths(date, amount);
  return new Date(
    month.getFullYear(),
    month.getMonth(),
    Math.min(date.getDate(), endOfMonth(month).getDate()),
  );
}

function isSameDay(left: Date, right: Date): boolean {
  return formatDate(left) === formatDate(right);
}

function isDateDisabled(date: Date): boolean {
  if (props.showTime) {
    return !timeCandidates.value.some((candidate) =>
      isDateTimeSelectable(toDateTime(date, candidate.hour, candidate.minute)),
    );
  }

  return Boolean(
    (minDate.value && endOfDay(date) < minDate.value) ||
    (maxDate.value && startOfDay(date) > maxDate.value),
  );
}

function toDateTime(date: Date, hour: number, minute: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
}

function isDateTimeSelectable(date: Date): boolean {
  return Boolean(
    (!minDate.value || date >= minDate.value) &&
    (!maxDate.value || date <= maxDate.value),
  );
}

function monthHasSelectableDate(month: Date): boolean {
  const start = startOfMonth(month);
  const end = endOfDay(endOfMonth(month));
  return !(minDate.value && end < minDate.value) && !(maxDate.value && start > maxDate.value);
}

function syncDraft(date: Date) {
  draftDate.value = startOfDay(date);
  draftHour.value = date.getHours();
  draftMinute.value =
    Math.floor(date.getMinutes() / normalizedMinuteStep.value) * normalizedMinuteStep.value;
  ensureDraftTime();
}

function ensureDraftTime() {
  const current = toDateTime(draftDate.value, draftHour.value, draftMinute.value);

  if (isDateTimeSelectable(current) && draftMinute.value % normalizedMinuteStep.value === 0) {
    return;
  }

  const available = timeCandidates.value
    .map((candidate) => ({
      ...candidate,
      date: toDateTime(draftDate.value, candidate.hour, candidate.minute),
    }))
    .filter((candidate) => isDateTimeSelectable(candidate.date));
  const target = available.reduce<(typeof available)[number] | null>((closest, candidate) => {
    if (!closest) {
      return candidate;
    }

    return Math.abs(candidate.date.getTime() - current.getTime()) <
      Math.abs(closest.date.getTime() - current.getTime())
      ? candidate
      : closest;
  }, null);

  if (target) {
    draftHour.value = target.hour;
    draftMinute.value = target.minute;
  }
}

async function focusDay(date: Date) {
  focusedDate.value = date;
  visibleMonth.value = startOfMonth(date);
  await nextTick();
  calendarRef.value
    ?.querySelector<HTMLElement>(`[data-date="${formatDate(date)}"]:not(:disabled)`)
    ?.focus();
}

function getInitialFocusDate(): Date {
  const preferred = selectedDate.value ?? today;

  if (!isDateDisabled(preferred)) {
    return preferred;
  }

  return minDate.value ?? maxDate.value ?? preferred;
}

function openCalendar() {
  if (props.disabled || props.readonly) {
    return;
  }

  const date = getInitialFocusDate();
  syncDraft(selectedDate.value ?? date);
  visibleMonth.value = startOfMonth(date);
  disclosure.open();
  void focusDay(date);
}

function closeCalendar(options: { restoreFocus?: boolean } = {}) {
  disclosure.close();

  if (options.restoreFocus !== false) {
    triggerRef.value?.focus();
  }
}

function toggleCalendar() {
  if (isOpen.value) {
    closeCalendar();
    return;
  }

  openCalendar();
}

function selectDate(day: CalendarDay) {
  if (day.disabled || props.readonly) {
    return;
  }

  if (props.showTime) {
    draftDate.value = day.date;
    focusedDate.value = day.date;
    visibleMonth.value = startOfMonth(day.date);
    ensureDraftTime();
    emitDraftDateTime();
    return;
  }

  emit('update:modelValue', day.value);
  closeCalendar();
}

function updateDraftHour(value: string) {
  draftHour.value = Number(value);
  ensureDraftTime();
  emitDraftDateTime();
}

function updateDraftMinute(value: string) {
  draftMinute.value = Number(value);
  emitDraftDateTime();
}

function emitDraftDateTime() {
  const value = toDateTime(draftDate.value, draftHour.value, draftMinute.value);

  if (!isDateTimeSelectable(value)) {
    return;
  }

  emit('update:modelValue', formatDateTime(value));
}

function clearValue(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  if (!hasClearControl.value) {
    return;
  }

  emit('update:modelValue', '');
  closeCalendar();
}

function changeMonth(amount: number) {
  const target = addMonths(visibleMonth.value, amount);

  if (!monthHasSelectableDate(target)) {
    return;
  }

  visibleMonth.value = target;
  const day = Math.min(focusedDate.value.getDate(), endOfMonth(target).getDate());
  const candidate = new Date(target.getFullYear(), target.getMonth(), day);
  const nextFocus = isDateDisabled(candidate)
    ? minDate.value && candidate < minDate.value
      ? minDate.value
      : maxDate.value ?? candidate
    : candidate;
  void focusDay(nextFocus);
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
    event.preventDefault();
    openCalendar();
  }
}

function onDayKeydown(event: KeyboardEvent, day: CalendarDay) {
  let target: Date | null = null;

  if (event.key === 'ArrowLeft') target = addDays(day.date, -1);
  if (event.key === 'ArrowRight') target = addDays(day.date, 1);
  if (event.key === 'ArrowUp') target = addDays(day.date, -7);
  if (event.key === 'ArrowDown') target = addDays(day.date, 7);
  if (event.key === 'Home') target = addDays(day.date, -((day.date.getDay() - props.firstDayOfWeek + 7) % 7));
  if (event.key === 'End') target = addDays(day.date, 6 - ((day.date.getDay() - props.firstDayOfWeek + 7) % 7));
  if (event.key === 'PageUp') target = moveToMonth(day.date, -1);
  if (event.key === 'PageDown') target = moveToMonth(day.date, 1);

  if (!target) {
    return;
  }

  event.preventDefault();

  if (!isDateDisabled(target)) {
    void focusDay(target);
  }
}

function isTimeSelectClick(event: MouseEvent | PointerEvent) {
  if (!props.showTime) {
    return false;
  }

  const controlledIds = [hourSelectId.value, minuteSelectId.value]
    .map((id) => document.getElementById(id)?.getAttribute('aria-controls'))
    .filter((id): id is string => Boolean(id));

  return event.composedPath().some(
    (target) => target instanceof Element && controlledIds.includes(target.id),
  );
}

useClickOutside(
  [triggerRef, calendarRef],
  (event) => {
    if (isTimeSelectClick(event)) {
      return;
    }

    if (isOpen.value) {
      closeCalendar({ restoreFocus: false });
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
    closeCalendar();
  },
  {
    enabled: isOpen,
  },
);
</script>

<template>
  <div :class="[wrapperClasses, externalClass]" :style="externalStyle">
    <input
      v-if="typeof attrs.name === 'string'"
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
      :aria-controls="calendarId"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      :aria-invalid="props.invalid || undefined"
      :aria-readonly="props.readonly || undefined"
      :disabled="props.disabled"
      v-bind="triggerAttrs"
      @click="toggleCalendar"
      @keydown="onTriggerKeydown"
    >
      <span class="vf-date-picker__value">{{ displayValue }}</span>
      <span class="vf-date-picker__icon" aria-hidden="true">
        <VueIconify :icon="icons.calendar" size="var(--vf-field-icon-size)" />
      </span>
    </button>

    <VfIconButton
      v-if="hasClearControl"
      class="vf-date-picker-wrap__clear"
      :icon="icons.xmark"
      variant="ghost"
      size="sm"
      :aria-label="resolvedLabels.clear"
      @mousedown.prevent
      @click="clearValue"
    />

    <Teleport :to="teleportTarget" :disabled="teleportDisabled">
      <Transition name="vf-floating-transition" appear :duration="transitionDuration">
        <section
          v-if="isOpen"
          :id="calendarId"
          ref="calendarRef"
          :class="calendarClasses"
          :style="calendarStyles"
          :aria-label="resolvedLabels.calendar"
          role="dialog"
        >
          <header class="vf-date-picker__header">
            <VfIconButton
              class="vf-date-picker__navigation"
              :icon="icons.caretLeft"
              size="md"
              :aria-label="resolvedLabels.previousMonth"
              :disabled="previousMonthDisabled"
              @click="changeMonth(-1)"
            />
            <div class="vf-date-picker__month" aria-live="polite">
              {{ monthFormatter.format(visibleMonth) }}
            </div>
            <VfIconButton
              class="vf-date-picker__navigation"
              :icon="icons.caretRight"
              size="md"
              :aria-label="resolvedLabels.nextMonth"
              :disabled="nextMonthDisabled"
              @click="changeMonth(1)"
            />
          </header>

          <div class="vf-date-picker__grid" role="grid">
            <div class="vf-date-picker__weekdays" role="row">
              <span
                v-for="(label, index) in weekdayLabels"
                :key="index"
                class="vf-date-picker__weekday"
                role="columnheader"
              >
                {{ label }}
              </span>
            </div>
            <div class="vf-date-picker__days">
              <div
                v-for="(week, weekIndex) in calendarWeeks"
                :key="weekIndex"
                class="vf-date-picker__week"
                role="row"
              >
                <VfButton
                  v-for="day in week"
                  :key="day.value"
                  variant="ghost"
                  size="md"
                  class="vf-date-picker__day"
                  :class="{
                    'vf-date-picker__day--outside': !day.inCurrentMonth,
                    'vf-date-picker__day--today': day.isToday,
                    'vf-date-picker__day--selected': day.isSelected,
                  }"
                  role="gridcell"
                  :data-date="day.value"
                  :aria-label="day.label"
                  :aria-selected="day.isSelected"
                  :aria-current="day.isToday ? 'date' : undefined"
                  :disabled="day.disabled"
                  :tabindex="isSameDay(day.date, focusedDate) ? 0 : -1"
                  @focus="focusedDate = day.date"
                  @click="selectDate(day)"
                  @keydown="onDayKeydown($event, day)"
                >
                  {{ day.date.getDate() }}
                </VfButton>
              </div>
            </div>
          </div>

          <div v-if="props.showTime" class="vf-date-picker__time">
            <span class="vf-date-picker__time-label">{{ resolvedLabels.time }}</span>
            <div class="vf-date-picker__time-controls">
              <VfSelect
                :id="hourSelectId"
                class="vf-date-picker__time-select"
                :model-value="draftHourValue"
                :options="hourOptions"
                :aria-label="resolvedLabels.hour"
                @update:model-value="updateDraftHour"
              />
              <span class="vf-date-picker__time-separator" aria-hidden="true">:</span>
              <VfSelect
                :id="minuteSelectId"
                class="vf-date-picker__time-select"
                :model-value="draftMinuteValue"
                :options="minuteOptions"
                :aria-label="resolvedLabels.minute"
                @update:model-value="updateDraftMinute"
              />
            </div>
          </div>
        </section>
      </Transition>
    </Teleport>
  </div>
</template>
