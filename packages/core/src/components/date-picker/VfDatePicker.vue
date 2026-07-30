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
import type { VfControlSize, VfDatePickerLabels, VfDropdownPlacement, VfSelectOption } from '@/types/components';
import { cx } from '@/utils/classes';

defineOptions({
  inheritAttrs: false,
});

interface VfDatePickerProps {
  modelValue?: string | string[];
  min?: string;
  max?: string;
  multiple?: boolean;
  range?: boolean;
  monthPicker?: boolean;
  yearPicker?: boolean;
  showTime?: boolean;
  minuteStep?: number;
  locale?: string | string[];
  displayFormat?: string;
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
  multiple: false,
  range: false,
  monthPicker: false,
  yearPicker: false,
  showTime: false,
  minuteStep: 1,
  locale: undefined,
  displayFormat: undefined,
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
  'update:modelValue': [value: string | string[]];
}>();

interface CalendarDay {
  date: Date;
  value: string;
  label: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  disabled: boolean;
}

interface CalendarMonth {
  date: Date;
  value: string;
  label: string;
  shortLabel: string;
  isCurrent: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  disabled: boolean;
}

interface CalendarYear {
  date: Date;
  value: string;
  isCurrent: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  disabled: boolean;
}

interface SelectedValue {
  value: string;
  date: Date;
}

const YEAR_RANGE_SIZE = 12;
const YEAR_ROW_SIZE = 3;

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
const initialDate = parseModelValues(props.modelValue, props.multiple || props.range)[0]?.date ?? today;
const visibleMonth = ref(startOfMonth(initialDate));
const visibleYearRangeStart = ref(getInitialYearRangeStart(initialDate));
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

const resolvedLabels = computed<Required<VfDatePickerLabels>>(() => ({
  calendar: 'Choose date',
  clear: 'Clear date',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousDecade: 'Previous decade',
  nextDecade: 'Next decade',
  time: 'Time',
  hour: 'Hour',
  minute: 'Minute',
  ...props.labels,
}));
const isArrayMode = computed(() => props.multiple || props.range);
const hasTimePicker = computed(() => props.showTime && !props.monthPicker && !props.yearPicker);
const selectedValues = computed(() => {
  const values = parseModelValues(props.modelValue, isArrayMode.value);
  return props.range ? values.slice(0, 2) : values;
});
const selectedDate = computed(() => selectedValues.value[0]?.date ?? null);
const formValues = computed(() =>
  isArrayMode.value
    ? Array.isArray(props.modelValue)
      ? props.modelValue
      : []
    : [typeof props.modelValue === 'string' ? props.modelValue : ''],
);
const rangeBounds = computed(() => {
  if (!props.range || selectedValues.value.length < 2) {
    return null;
  }

  const [first, second] = selectedValues.value;

  return first!.date <= second!.date
    ? { start: first!.date, end: second!.date }
    : { start: second!.date, end: first!.date };
});
const minDate = computed(() => parseBoundary(props.min, false));
const maxDate = computed(() => parseBoundary(props.max, true));
const normalizedMinuteStep = computed(() => Math.min(60, Math.max(1, Math.trunc(props.minuteStep) || 1)));
const hasValue = computed(() => selectedDate.value !== null);
const hasClearControl = computed(() => props.clearable && hasValue.value && !props.disabled && !props.readonly);
const isFloatingLabel = computed(() => fieldContext?.labelPlacement.value === 'floating');
const externalClass = computed(() => attrs.class as string | undefined);
const externalStyle = computed<StyleValue>(() => attrs.style as StyleValue);
const triggerAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => key.startsWith('aria-') || key.startsWith('data-') || key === 'title' || key === 'tabindex',
    ),
  ),
);
const dateFormatter = computed(() => {
  if (props.yearPicker) {
    return new Intl.DateTimeFormat(props.locale, { year: 'numeric' });
  }

  return new Intl.DateTimeFormat(props.locale, {
    year: '2-digit',
    month: '2-digit',
    ...(!props.monthPicker ? { day: '2-digit' } : {}),
    ...(hasTimePicker.value ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : {}),
  });
});
const monthFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { year: 'numeric', month: 'long' }));
const yearFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { year: 'numeric' }));
const monthOptionFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { month: 'short' }));
const monthLabelFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { year: 'numeric', month: 'long' }));
const dayFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { weekday: 'short' }));
const dateLabelFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { dateStyle: 'full' }));
const displayValue = computed(() => {
  if (selectedValues.value.length > 0) {
    return selectedValues.value.map(({ date }) => formatDisplayDate(date)).join(props.range ? ' – ' : '; ');
  }

  return isFloatingLabel.value ? '' : (props.placeholder ?? '');
});
const activeDate = computed(() => (hasTimePicker.value && isOpen.value ? draftDate.value : selectedDate.value));
const timeCandidates = computed(() =>
  Array.from({ length: 24 }, (_, hour) =>
    Array.from({ length: Math.ceil(60 / normalizedMinuteStep.value) }, (_, index) => ({
      hour,
      minute: index * normalizedMinuteStep.value,
    })),
  ).flat(),
);
const hourOptions = computed<VfSelectOption[]>(() =>
  Array.from({ length: 24 }, (_, hour) => ({
    value: String(hour).padStart(2, '0'),
    label: String(hour).padStart(2, '0'),
    disabled: !timeCandidates.value.some(
      (candidate) =>
        candidate.hour === hour && isDateTimeSelectable(toDateTime(draftDate.value, candidate.hour, candidate.minute)),
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
    const rangeStart = rangeBounds.value?.start ?? selectedValues.value[0]?.date;
    const rangeEnd = rangeBounds.value?.end;
    const isRangeStart = Boolean(props.range && rangeStart && isSameDay(date, rangeStart));
    const isRangeEnd = Boolean(props.range && rangeEnd && isSameDay(date, rangeEnd));
    const isInRange = Boolean(
      rangeBounds.value && date > startOfDay(rangeBounds.value.start) && date < startOfDay(rangeBounds.value.end),
    );

    return {
      date,
      value,
      label: dateLabelFormatter.value.format(date),
      inCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: isSameDay(date, today),
      isSelected: props.range
        ? isRangeStart || isRangeEnd
        : props.multiple
          ? selectedValues.value.some((selected) => isSameDay(date, selected.date))
          : activeDate.value
            ? isSameDay(date, activeDate.value)
            : false,
      isInRange,
      isRangeStart,
      isRangeEnd,
      disabled: isDateDisabled(date),
    };
  });
});
const calendarWeeks = computed(() =>
  Array.from({ length: calendarDays.value.length / 7 }, (_, index) =>
    calendarDays.value.slice(index * 7, index * 7 + 7),
  ),
);
const calendarMonths = computed<CalendarMonth[]>(() =>
  Array.from({ length: 12 }, (_, month) => {
    const date = new Date(visibleMonth.value.getFullYear(), month, 1);
    const rangeStart = rangeBounds.value?.start ?? selectedValues.value[0]?.date;
    const rangeEnd = rangeBounds.value?.end;
    const isRangeStart = Boolean(props.range && rangeStart && isSameMonth(date, rangeStart));
    const isRangeEnd = Boolean(props.range && rangeEnd && isSameMonth(date, rangeEnd));
    const isInRange = Boolean(
      rangeBounds.value && date > startOfMonth(rangeBounds.value.start) && date < startOfMonth(rangeBounds.value.end),
    );

    return {
      date,
      value: formatMonth(date),
      label: monthLabelFormatter.value.format(date),
      shortLabel: monthOptionFormatter.value.format(date),
      isCurrent: isSameMonth(date, today),
      isSelected: props.range
        ? isRangeStart || isRangeEnd
        : props.multiple
          ? selectedValues.value.some((selected) => isSameMonth(date, selected.date))
          : activeDate.value
            ? isSameMonth(date, activeDate.value)
            : false,
      isInRange,
      isRangeStart,
      isRangeEnd,
      disabled: isMonthDisabled(date),
    };
  }),
);
const calendarMonthRows = computed(() =>
  Array.from({ length: 4 }, (_, index) => calendarMonths.value.slice(index * 3, index * 3 + 3)),
);
const calendarYears = computed<CalendarYear[]>(() =>
  Array.from({ length: YEAR_RANGE_SIZE }, (_, index) => {
    const date = new Date(visibleYearRangeStart.value + index, 0, 1);
    const rangeStart = rangeBounds.value?.start ?? selectedValues.value[0]?.date;
    const rangeEnd = rangeBounds.value?.end;
    const isRangeStart = Boolean(props.range && rangeStart && isSameYear(date, rangeStart));
    const isRangeEnd = Boolean(props.range && rangeEnd && isSameYear(date, rangeEnd));
    const isInRange = Boolean(
      rangeBounds.value && date > startOfYear(rangeBounds.value.start) && date < startOfYear(rangeBounds.value.end),
    );

    return {
      date,
      value: formatYear(date),
      isCurrent: isSameYear(date, today),
      isSelected: props.range
        ? isRangeStart || isRangeEnd
        : props.multiple
          ? selectedValues.value.some((selected) => isSameYear(date, selected.date))
          : activeDate.value
            ? isSameYear(date, activeDate.value)
            : false,
      isInRange,
      isRangeStart,
      isRangeEnd,
      disabled: isYearDisabled(date),
    };
  }),
);
const calendarYearRows = computed(() =>
  Array.from({ length: YEAR_RANGE_SIZE / YEAR_ROW_SIZE }, (_, index) =>
    calendarYears.value.slice(index * YEAR_ROW_SIZE, index * YEAR_ROW_SIZE + YEAR_ROW_SIZE),
  ),
);
const visibleYearRangeLabel = computed(
  () => `${visibleYearRangeStart.value}–${visibleYearRangeStart.value + YEAR_RANGE_SIZE - 1}`,
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
const { placement: floatingPlacement, styles: floatingStyles } = useFloating(triggerRef, calendarRef, {
  enabled: isOpen,
  placement: computed(() => props.placement),
  middleware: computed(() => [offset(2), flip({ placements: allowedPlacements.value }), shift()] as MiddlewareType[]),
  strategy: 'fixed',
});
const calendarClasses = computed(() => [
  'vf-dropdown__menu',
  'vf-date-picker__calendar',
  floatingPlacement.value.startsWith('top') && 'vf-dropdown__menu--top',
]);
const calendarStyles = computed(() => floatingStyles.value);
const previousPeriodDisabled = computed(() =>
  props.yearPicker
    ? !yearRangeHasSelectableYear(visibleYearRangeStart.value - YEAR_RANGE_SIZE)
    : props.monthPicker
      ? !yearHasSelectableMonth(addYears(visibleMonth.value, -1))
      : !monthHasSelectableDate(addMonths(visibleMonth.value, -1)),
);
const nextPeriodDisabled = computed(() =>
  props.yearPicker
    ? !yearRangeHasSelectableYear(visibleYearRangeStart.value + YEAR_RANGE_SIZE)
    : props.monthPicker
      ? !yearHasSelectableMonth(addYears(visibleMonth.value, 1))
      : !monthHasSelectableDate(addMonths(visibleMonth.value, 1)),
);

watch(
  [hasValue, isOpen],
  ([value, open]) => {
    fieldContext?.setFilled(value || open);
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (value) => {
    const date = parseModelValues(value, props.multiple || props.range)[0]?.date;

    if (date && !isOpen.value) {
      visibleMonth.value = startOfMonth(date);
      visibleYearRangeStart.value = getInitialYearRangeStart(date);
      focusedDate.value = date;
      syncDraft(date);
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

function parseMonth(value?: string): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);

  return formatMonth(date) === value ? date : null;
}

function parseYear(value?: string): Date | null {
  const match = value?.match(/^(\d{4})$/);

  if (!match) {
    return null;
  }

  const date = new Date(Number(match[1]), 0, 1);

  return formatYear(date) === value ? date : null;
}

function parseDateTime(value?: string): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));

  return formatDateTime(date) === value ? date : null;
}

function parseModelValue(value?: string): Date | null {
  if (props.yearPicker) {
    return parseYear(value);
  }

  if (props.monthPicker) {
    return parseMonth(value);
  }

  return parseDateTime(value) ?? parseDate(value);
}

function parseModelValues(value: string | string[] | undefined, multiple: boolean): SelectedValue[] {
  const values = multiple ? (Array.isArray(value) ? value : []) : typeof value === 'string' ? [value] : [];

  return values.flatMap((item) => {
    const date = parseModelValue(item);
    return date ? [{ value: item, date }] : [];
  });
}

function parseBoundary(value: string | undefined, endForDateOnly: boolean): Date | null {
  if (props.yearPicker) {
    const year = parseYear(value);

    if (!year) {
      return null;
    }

    return endForDateOnly ? endOfDay(endOfYear(year)) : year;
  }

  if (props.monthPicker) {
    const month = parseMonth(value);

    if (!month) {
      return null;
    }

    return endForDateOnly ? endOfDay(endOfMonth(month)) : month;
  }

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

function formatYear(date: Date): string {
  return String(date.getFullYear()).padStart(4, '0');
}

function formatMonth(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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

function formatDisplayDate(date: Date): string {
  if (!props.displayFormat) {
    return dateFormatter.value.format(date);
  }

  const tokens: Record<string, string> = {
    yyyy: String(date.getFullYear()).padStart(4, '0'),
    yy: String(date.getFullYear()).slice(-2),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    M: String(date.getMonth() + 1),
    dd: String(date.getDate()).padStart(2, '0'),
    d: String(date.getDate()),
    HH: String(date.getHours()).padStart(2, '0'),
    H: String(date.getHours()),
    mm: String(date.getMinutes()).padStart(2, '0'),
    m: String(date.getMinutes()),
  };

  return props.displayFormat.replace(/yyyy|yy|MM|M|dd|d|HH|H|mm|m/g, (token) => tokens[token] ?? token);
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

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addYears(date: Date, amount: number): Date {
  return new Date(date.getFullYear() + amount, date.getMonth(), 1);
}

function getInitialYearRangeStart(date: Date): number {
  return Math.floor(date.getFullYear() / 10) * 10;
}

function moveToMonth(date: Date, amount: number): Date {
  const month = addMonths(date, amount);
  return new Date(month.getFullYear(), month.getMonth(), Math.min(date.getDate(), endOfMonth(month).getDate()));
}

function isSameDay(left: Date, right: Date): boolean {
  return formatDate(left) === formatDate(right);
}

function isSameMonth(left: Date, right: Date): boolean {
  return formatMonth(left) === formatMonth(right);
}

function isSameYear(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear();
}

function isSameSelectionUnit(left: Date, right: Date): boolean {
  if (props.yearPicker) {
    return isSameYear(left, right);
  }

  return props.monthPicker ? isSameMonth(left, right) : isSameDay(left, right);
}

function isDateDisabled(date: Date): boolean {
  if (hasTimePicker.value) {
    return !timeCandidates.value.some((candidate) =>
      isDateTimeSelectable(toDateTime(date, candidate.hour, candidate.minute)),
    );
  }

  return Boolean(
    (minDate.value && endOfDay(date) < minDate.value) || (maxDate.value && startOfDay(date) > maxDate.value),
  );
}

function isMonthDisabled(month: Date): boolean {
  const start = startOfMonth(month);
  const end = endOfDay(endOfMonth(month));
  return Boolean((minDate.value && end < minDate.value) || (maxDate.value && start > maxDate.value));
}

function isYearDisabled(year: Date): boolean {
  const start = startOfYear(year);
  const end = endOfDay(endOfYear(year));
  return Boolean((minDate.value && end < minDate.value) || (maxDate.value && start > maxDate.value));
}

function toDateTime(date: Date, hour: number, minute: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
}

function isDateTimeSelectable(date: Date): boolean {
  return Boolean((!minDate.value || date >= minDate.value) && (!maxDate.value || date <= maxDate.value));
}

function monthHasSelectableDate(month: Date): boolean {
  const start = startOfMonth(month);
  const end = endOfDay(endOfMonth(month));
  return !(minDate.value && end < minDate.value) && !(maxDate.value && start > maxDate.value);
}

function yearHasSelectableMonth(year: Date): boolean {
  return Array.from({ length: 12 }, (_, month) => new Date(year.getFullYear(), month, 1)).some(
    (month) => !isMonthDisabled(month),
  );
}

function yearRangeHasSelectableYear(startYear: number): boolean {
  return Array.from({ length: YEAR_RANGE_SIZE }, (_, index) => new Date(startYear + index, 0, 1)).some(
    (year) => !isYearDisabled(year),
  );
}

function syncDraft(date: Date) {
  draftDate.value = startOfDay(date);
  draftHour.value = date.getHours();
  draftMinute.value = Math.floor(date.getMinutes() / normalizedMinuteStep.value) * normalizedMinuteStep.value;
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

    return Math.abs(candidate.date.getTime() - current.getTime()) < Math.abs(closest.date.getTime() - current.getTime())
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
  calendarRef.value?.querySelector<HTMLElement>(`[data-date="${formatDate(date)}"]:not(:disabled)`)?.focus();
}

async function focusMonth(date: Date) {
  focusedDate.value = startOfMonth(date);
  visibleMonth.value = startOfMonth(date);
  await nextTick();
  calendarRef.value?.querySelector<HTMLElement>(`[data-month="${formatMonth(date)}"]:not(:disabled)`)?.focus();
}

async function focusYear(date: Date) {
  const year = date.getFullYear();

  if (year < visibleYearRangeStart.value || year >= visibleYearRangeStart.value + YEAR_RANGE_SIZE) {
    visibleYearRangeStart.value += Math.floor((year - visibleYearRangeStart.value) / YEAR_RANGE_SIZE) * YEAR_RANGE_SIZE;
  }

  focusedDate.value = startOfYear(date);
  visibleMonth.value = startOfMonth(date);
  await nextTick();
  calendarRef.value?.querySelector<HTMLElement>(`[data-year="${formatYear(date)}"]:not(:disabled)`)?.focus();
}

function getInitialFocusDate(): Date {
  const preferred = selectedDate.value ?? today;

  const selectable = props.yearPicker
    ? !isYearDisabled(preferred)
    : props.monthPicker
      ? !isMonthDisabled(preferred)
      : !isDateDisabled(preferred);

  if (selectable) {
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
  visibleYearRangeStart.value = getInitialYearRangeStart(date);
  disclosure.open();
  if (props.yearPicker) {
    void focusYear(date);
  } else if (props.monthPicker) {
    void focusMonth(date);
  } else {
    void focusDay(date);
  }
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

function selectValue(date: Date, value: string, disabled: boolean) {
  if (disabled || props.readonly) {
    return;
  }

  focusedDate.value = date;
  visibleMonth.value = startOfMonth(date);

  if (props.range) {
    draftDate.value = date;

    if (hasTimePicker.value) {
      ensureDraftTime();
    }

    const selectedValue = hasTimePicker.value
      ? formatDateTime(toDateTime(draftDate.value, draftHour.value, draftMinute.value))
      : value;

    if (selectedValues.value.length !== 1) {
      emit('update:modelValue', [selectedValue]);
      return;
    }

    const nextRange = [
      selectedValues.value[0]!,
      { value: selectedValue, date: parseModelValue(selectedValue) ?? date },
    ].sort((left, right) => left.date.getTime() - right.date.getTime());

    emit(
      'update:modelValue',
      nextRange.map((selected) => selected.value),
    );

    if (!hasTimePicker.value) {
      closeCalendar();
    }

    return;
  }

  if (props.multiple) {
    const remainingValues = selectedValues.value
      .filter((selected) => !isSameSelectionUnit(selected.date, date))
      .map((selected) => selected.value);

    if (remainingValues.length < selectedValues.value.length) {
      emit('update:modelValue', remainingValues);
      return;
    }

    draftDate.value = date;

    if (hasTimePicker.value) {
      ensureDraftTime();
    }

    emit('update:modelValue', [
      ...remainingValues,
      hasTimePicker.value ? formatDateTime(toDateTime(draftDate.value, draftHour.value, draftMinute.value)) : value,
    ]);
    return;
  }

  if (hasTimePicker.value) {
    draftDate.value = date;
    ensureDraftTime();
    emitDraftDateTime();
    return;
  }

  emit('update:modelValue', value);
  closeCalendar();
}

function selectDate(day: CalendarDay) {
  selectValue(day.date, day.value, day.disabled);
}

function selectMonth(month: CalendarMonth) {
  selectValue(month.date, month.value, month.disabled);
}

function selectYear(year: CalendarYear) {
  selectValue(year.date, year.value, year.disabled);
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

  const formattedValue = formatDateTime(value);

  if (!isArrayMode.value) {
    emit('update:modelValue', formattedValue);
    return;
  }

  const activeIndex = selectedValues.value.findIndex((selected) => isSameDay(selected.date, draftDate.value));

  if (activeIndex === -1) {
    return;
  }

  emit(
    'update:modelValue',
    selectedValues.value.map((selected, index) => (index === activeIndex ? formattedValue : selected.value)),
  );
}

function clearValue(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  if (!hasClearControl.value) {
    return;
  }

  emit('update:modelValue', isArrayMode.value ? [] : '');
  closeCalendar();
}

function changePeriod(amount: number) {
  if (props.yearPicker) {
    const targetStartYear = visibleYearRangeStart.value + amount * YEAR_RANGE_SIZE;

    if (!yearRangeHasSelectableYear(targetStartYear)) {
      return;
    }

    const candidate = new Date(focusedDate.value.getFullYear() + amount * YEAR_RANGE_SIZE, 0, 1);
    const nextFocus = isYearDisabled(candidate)
      ? minDate.value && candidate < minDate.value
        ? minDate.value
        : (maxDate.value ?? candidate)
      : candidate;
    void focusYear(nextFocus);
    return;
  }

  if (props.monthPicker) {
    const target = addYears(visibleMonth.value, amount);

    if (!yearHasSelectableMonth(target)) {
      return;
    }

    const candidate = new Date(target.getFullYear(), focusedDate.value.getMonth(), 1);
    const nextFocus = isMonthDisabled(candidate)
      ? minDate.value && candidate < minDate.value
        ? minDate.value
        : (maxDate.value ?? candidate)
      : candidate;
    void focusMonth(nextFocus);
    return;
  }

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
      : (maxDate.value ?? candidate)
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

function onMonthKeydown(event: KeyboardEvent, month: CalendarMonth) {
  let target: Date | null = null;

  if (event.key === 'ArrowLeft') target = addMonths(month.date, -1);
  if (event.key === 'ArrowRight') target = addMonths(month.date, 1);
  if (event.key === 'ArrowUp') target = addMonths(month.date, -3);
  if (event.key === 'ArrowDown') target = addMonths(month.date, 3);
  if (event.key === 'Home') target = new Date(month.date.getFullYear(), 0, 1);
  if (event.key === 'End') target = new Date(month.date.getFullYear(), 11, 1);
  if (event.key === 'PageUp') target = addYears(month.date, -1);
  if (event.key === 'PageDown') target = addYears(month.date, 1);

  if (!target) {
    return;
  }

  event.preventDefault();

  if (!isMonthDisabled(target)) {
    void focusMonth(target);
  }
}

function onYearKeydown(event: KeyboardEvent, year: CalendarYear) {
  let target: Date | null = null;

  if (event.key === 'ArrowLeft') target = addYears(year.date, -1);
  if (event.key === 'ArrowRight') target = addYears(year.date, 1);
  if (event.key === 'ArrowUp') target = addYears(year.date, -YEAR_ROW_SIZE);
  if (event.key === 'ArrowDown') target = addYears(year.date, YEAR_ROW_SIZE);
  if (event.key === 'Home') target = new Date(visibleYearRangeStart.value, 0, 1);
  if (event.key === 'End') target = new Date(visibleYearRangeStart.value + YEAR_RANGE_SIZE - 1, 0, 1);
  if (event.key === 'PageUp') target = addYears(year.date, -YEAR_RANGE_SIZE);
  if (event.key === 'PageDown') target = addYears(year.date, YEAR_RANGE_SIZE);

  if (!target) {
    return;
  }

  event.preventDefault();

  if (!isYearDisabled(target)) {
    void focusYear(target);
  }
}

function isTimeSelectClick(event: MouseEvent | PointerEvent) {
  if (!hasTimePicker.value) {
    return false;
  }

  const controlledIds = [hourSelectId.value, minuteSelectId.value]
    .map((id) => document.getElementById(id)?.getAttribute('aria-controls'))
    .filter((id): id is string => Boolean(id));

  return event.composedPath().some((target) => target instanceof Element && controlledIds.includes(target.id));
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
    <template v-if="typeof attrs.name === 'string'">
      <input
        v-for="(value, index) in formValues"
        :key="`${value}-${index}`"
        type="hidden"
        :name="attrs.name"
        :value="value"
        :disabled="props.disabled"
      />
    </template>

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
              :aria-label="
                props.yearPicker
                  ? resolvedLabels.previousDecade
                  : props.monthPicker
                    ? resolvedLabels.previousYear
                    : resolvedLabels.previousMonth
              "
              :disabled="previousPeriodDisabled"
              @click="changePeriod(-1)"
            />
            <div class="vf-date-picker__month" aria-live="polite">
              {{
                props.yearPicker
                  ? visibleYearRangeLabel
                  : props.monthPicker
                    ? yearFormatter.format(visibleMonth)
                    : monthFormatter.format(visibleMonth)
              }}
            </div>
            <VfIconButton
              class="vf-date-picker__navigation"
              :icon="icons.caretRight"
              size="md"
              :aria-label="
                props.yearPicker
                  ? resolvedLabels.nextDecade
                  : props.monthPicker
                    ? resolvedLabels.nextYear
                    : resolvedLabels.nextMonth
              "
              :disabled="nextPeriodDisabled"
              @click="changePeriod(1)"
            />
          </header>

          <div v-if="props.yearPicker" class="vf-date-picker__years" role="grid">
            <div
              v-for="(row, rowIndex) in calendarYearRows"
              :key="rowIndex"
              class="vf-date-picker__year-row"
              role="row"
            >
              <VfButton
                v-for="year in row"
                :key="year.value"
                variant="ghost"
                size="md"
                class="vf-date-picker__year-option"
                :class="{
                  'vf-date-picker__day--today': year.isCurrent,
                  'vf-date-picker__day--in-range': year.isInRange,
                  'vf-date-picker__day--range-start': year.isRangeStart,
                  'vf-date-picker__day--range-end': year.isRangeEnd,
                  'vf-date-picker__day--selected': year.isSelected,
                }"
                role="gridcell"
                :data-year="year.value"
                :aria-label="year.value"
                :aria-selected="year.isSelected"
                :aria-current="year.isCurrent ? 'date' : undefined"
                :disabled="year.disabled"
                :tabindex="isSameYear(year.date, focusedDate) ? 0 : -1"
                @focus="focusedDate = year.date"
                @click="selectYear(year)"
                @keydown="onYearKeydown($event, year)"
              >
                {{ year.value }}
              </VfButton>
            </div>
          </div>

          <div v-else-if="props.monthPicker" class="vf-date-picker__months" role="grid">
            <div
              v-for="(row, rowIndex) in calendarMonthRows"
              :key="rowIndex"
              class="vf-date-picker__month-row"
              role="row"
            >
              <VfButton
                v-for="month in row"
                :key="month.value"
                variant="ghost"
                size="md"
                class="vf-date-picker__month-option"
                :class="{
                  'vf-date-picker__day--today': month.isCurrent,
                  'vf-date-picker__day--in-range': month.isInRange,
                  'vf-date-picker__day--range-start': month.isRangeStart,
                  'vf-date-picker__day--range-end': month.isRangeEnd,
                  'vf-date-picker__day--selected': month.isSelected,
                }"
                role="gridcell"
                :data-month="month.value"
                :aria-label="month.label"
                :aria-selected="month.isSelected"
                :aria-current="month.isCurrent ? 'date' : undefined"
                :disabled="month.disabled"
                :tabindex="isSameMonth(month.date, focusedDate) ? 0 : -1"
                @focus="focusedDate = month.date"
                @click="selectMonth(month)"
                @keydown="onMonthKeydown($event, month)"
              >
                {{ month.shortLabel }}
              </VfButton>
            </div>
          </div>

          <div v-else class="vf-date-picker__grid" role="grid">
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
              <div v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex" class="vf-date-picker__week" role="row">
                <VfButton
                  v-for="day in week"
                  :key="day.value"
                  variant="ghost"
                  size="md"
                  class="vf-date-picker__day"
                  :class="{
                    'vf-date-picker__day--outside': !day.inCurrentMonth,
                    'vf-date-picker__day--today': day.isToday,
                    'vf-date-picker__day--in-range': day.isInRange,
                    'vf-date-picker__day--range-start': day.isRangeStart,
                    'vf-date-picker__day--range-end': day.isRangeEnd,
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

          <div v-if="hasTimePicker" class="vf-date-picker__time">
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
