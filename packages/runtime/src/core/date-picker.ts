/**
 * Calendar arithmetic and pinned formatting, with no DOM and no framework.
 *
 * Both adapters built the same month grid from scratch: the Vue component in its own calendar
 * module, the controller inline while rendering cells. Six weeks starting from the Sunday on or
 * before the first of the month, the same ISO parsing, the same month shifting that clamps to a
 * shorter month.
 */

export interface CmCalendarDay {
  accessibleLabel: string;
  disabled: boolean;
  inRange: boolean;
  label: string;
  outside: boolean;
  rangeEnd: boolean;
  rangeStart: boolean;
  selected: boolean;
  today: boolean;
  value: string;
}

export type CmCalendarWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CmCalendarLocale = string | string[];
export type CmCalendarSelectionMode = 'single' | 'multiple' | 'range';
export type CmCalendarPrecision = 'day' | 'month' | 'year';

const yearRangeSize = 12;
const periodColumns = 3;

const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/u;
const isoTimePattern = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)$/u;
const displayFormatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

function localDate(year: number, month: number, day: number): Date {
  // The multi-argument Date constructor interprets years 0–99 as 1900–1999.
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
  const match = isoPattern.exec(value);
  if (!match || match[1] === '0000') return null;
  const date = localDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatIsoDate(date) === value ? date : null;
}

export function parseCalendarValue(value: string, precision: CmCalendarPrecision): Date | null {
  if (precision === 'month') return parseIsoDate(`${value}-01`);
  if (precision === 'year') return parseIsoDate(`${value}-01-01`);
  return parseIsoDate(value);
}

export function formatCalendarValue(date: Date, precision: CmCalendarPrecision): string {
  if (precision === 'year') return String(date.getFullYear()).padStart(4, '0');
  const day = formatIsoDate(date);
  return precision === 'month' ? day.slice(0, -3) : day;
}

// Callers below need a real Date to build a grid from. The component sanitizes every value it
// passes, so the fallback is defence in depth rather than a path the UI reaches.
function requireIsoDate(value: string): Date {
  return parseIsoDate(value) ?? new Date();
}

// The display and month names are pinned to one locale so a server-rendered control and the client
// that later takes it over agree, and so a capture does not depend on the machine's language.
export function formatDisplayDate(
  value: string,
  locale?: CmCalendarLocale,
  format?: string,
  precision: CmCalendarPrecision = 'day',
): string {
  const time = precision === 'day' ? calendarTimeValue(value) : null;
  const date = parseCalendarValue(time === null ? value : value.slice(0, 10), precision);
  if (date === null) return value;
  if (format) {
    const [year, month, day] = formatIsoDate(date).split('-');
    const tokens: Readonly<Record<string, string>> = {
      yyyy: year,
      yy: year.slice(-2),
      MM: month,
      M: String(Number(month)),
      dd: day,
      d: String(Number(day)),
      HH: String(Math.floor((time ?? 0) / 60)).padStart(2, '0'),
      H: String(Math.floor((time ?? 0) / 60)),
      mm: String((time ?? 0) % 60).padStart(2, '0'),
      m: String((time ?? 0) % 60),
    };
    return format.replace(/yyyy|yy|MM|M|dd|d|HH|H|mm|m/g, (token) => tokens[token]);
  }
  if (time !== null) {
    // Interpret the supplied wall time without local DST shifts or an implicit timezone conversion.
    const zoneless = new Date(0);
    zoneless.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    zoneless.setUTCHours(Math.floor(time / 60), time % 60, 0, 0);
    return new Intl.DateTimeFormat(locale ?? 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'UTC',
    }).format(zoneless);
  }
  const formatter =
    locale === undefined && precision === 'day'
      ? displayFormatter
      : new Intl.DateTimeFormat(locale ?? 'en-US', {
          year: precision === 'year' ? 'numeric' : '2-digit',
          ...(precision !== 'year' ? { month: '2-digit' } : {}),
          ...(precision === 'day' ? { day: '2-digit' } : {}),
        });
  return formatter.format(date);
}

export function monthLabel(value: string, locale?: CmCalendarLocale): string {
  const formatter =
    locale === undefined ? monthFormatter : new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  return formatter.format(requireIsoDate(value));
}

export function weekdayLabels(firstDayOfWeek: CmCalendarWeekday = 0, locale?: CmCalendarLocale): string[] {
  const formatter = locale === undefined ? weekdayFormatter : new Intl.DateTimeFormat(locale, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2024, 0, 7 + firstDayOfWeek + index)));
}

export function shiftMonth(value: string, delta: number): string {
  const date = requireIsoDate(value);
  const shifted = localDate(date.getFullYear(), date.getMonth() + delta, 1);
  const lastDay = localDate(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(date.getDate(), lastDay));
  return formatIsoDate(shifted);
}

export function calendarKeyTarget(
  value: string,
  key: string,
  firstDayOfWeek: CmCalendarWeekday = 0,
  rtl = false,
): string | null {
  const date = parseIsoDate(value);
  if (date === null) return null;
  if (key === 'PageUp' || key === 'PageDown') return shiftMonth(value, key === 'PageUp' ? -1 : 1);
  const weekIndex = (date.getDay() - firstDayOfWeek + 7) % 7;
  const deltas: Readonly<Record<string, number>> = {
    ArrowLeft: rtl ? 1 : -1,
    ArrowRight: rtl ? -1 : 1,
    ArrowUp: -7,
    ArrowDown: 7,
    Home: -weekIndex,
    End: 6 - weekIndex,
  };
  if (!Object.prototype.hasOwnProperty.call(deltas, key)) return null;
  date.setDate(date.getDate() + deltas[key]);
  return formatIsoDate(date);
}

export function boundCalendarDate(value: string, min?: string, max?: string): string {
  if (min && value < min) return min;
  if (max && value > max) return max;
  return value;
}

export function calendarMonthAllowed(value: string, min?: string, max?: string): boolean {
  if (parseIsoDate(value) === null) return false;
  const month = value.slice(0, 7);
  return (!min || month >= min.slice(0, 7)) && (!max || month <= max.slice(0, 7));
}

/** Keep the initial decade alignment when subsequent keyboard moves cross a 12-year boundary. */
export function calendarYearRangeStart(value: string, currentStart?: number): number {
  const year = Number(value.slice(0, 4));
  return currentStart === undefined
    ? Math.floor(year / 10) * 10
    : currentStart + Math.floor((year - currentStart) / yearRangeSize) * yearRangeSize;
}

export function calendarGridTitle(
  value: string,
  precision: CmCalendarPrecision,
  yearStart: number,
  locale?: CmCalendarLocale,
): string {
  if (precision === 'year') return `${yearStart}–${yearStart + yearRangeSize - 1}`;
  if (precision === 'month') {
    const date = parseCalendarValue(value, 'month');
    return date ? new Intl.DateTimeFormat(locale ?? 'en-US', { year: 'numeric' }).format(date) : '';
  }
  return monthLabel(value, locale);
}

export function calendarGridKeyTarget(
  value: string,
  key: string,
  precision: CmCalendarPrecision,
  firstDayOfWeek: CmCalendarWeekday,
  yearStart: number,
  rtl: boolean,
): string | null {
  if (precision === 'day') return calendarKeyTarget(value, key, firstDayOfWeek, rtl);
  const date = parseCalendarValue(value, precision);
  if (!date) return null;
  const year = date.getFullYear();
  const month = date.getMonth();
  const months = precision === 'month';
  if (key === 'Home') return formatCalendarValue(localDate(months ? year : yearStart, 0, 1), precision);
  if (key === 'End') {
    return formatCalendarValue(localDate(months ? year : yearStart + yearRangeSize - 1, months ? 11 : 0, 1), precision);
  }
  const offsets: Readonly<Record<string, number>> = {
    ArrowLeft: rtl ? 1 : -1,
    ArrowRight: rtl ? -1 : 1,
    ArrowUp: -periodColumns,
    ArrowDown: periodColumns,
    PageUp: -yearRangeSize,
    PageDown: yearRangeSize,
  };
  if (!Object.prototype.hasOwnProperty.call(offsets, key)) return null;
  const amount = offsets[key];
  return formatCalendarValue(localDate(year + (months ? 0 : amount), months ? month + amount : 0, 1), precision);
}

export function calendarAdjacentPeriod(
  value: string,
  delta: number,
  precision: CmCalendarPrecision,
  yearStart: number,
  min?: string,
  max?: string,
): string | null {
  if (precision === 'day') {
    const target = shiftMonth(value, delta);
    return calendarMonthAllowed(target, min, max) ? boundCalendarDate(target, min, max) : null;
  }
  const date = parseCalendarValue(value, precision);
  if (!date) return null;
  const months = precision === 'month';
  const step = delta * (months ? 1 : yearRangeSize);
  const year = date.getFullYear() + step;
  const first = months ? year : yearStart + step;
  const last = months ? year : first + yearRangeSize - 1;
  const minimum = min ? Number(min.slice(0, 4)) : 1;
  const maximum = max ? Number(max.slice(0, 4)) : 9999;
  if (last < minimum || first > maximum) return null;
  const boundedYear = Math.min(Math.max(year, minimum), maximum);
  return boundCalendarDate(formatCalendarValue(localDate(boundedYear, date.getMonth(), 1), precision), min, max);
}

export function selectCalendarDate(
  selected: readonly string[],
  value: string,
  mode: CmCalendarSelectionMode,
): string[] {
  if (mode === 'range' && selected.length === 1) return [selected[0], value].sort();
  if (mode !== 'multiple') return [value];
  if (selected.includes(value)) return selected.filter((date) => date !== value);
  return [...selected, value];
}

export interface CmCalendarTimeOptions {
  min?: string;
  max?: string;
  minuteStep: number;
}

export function calendarTimeValue(value: string): number | null {
  const match = isoTimePattern.exec(value);
  return match && parseIsoDate(match[1]) ? Number(match[2]) * 60 + Number(match[3]) : null;
}

export function calendarMinuteStep(value: number): number {
  return Math.min(60, Math.max(1, Math.trunc(value) || 1));
}

export function formatCalendarDateTime(day: string, minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  return `${day}T${hours}:${minute}`;
}

export function normalizeCalendarDateTime(value: string): string | null {
  if (calendarTimeValue(value) !== null) return value;
  return parseIsoDate(value) ? formatCalendarDateTime(value, 0) : null;
}

function timeWindow(day: string, { min, max }: CmCalendarTimeOptions): [number, number] | null {
  const first = min?.slice(0, 10);
  const last = max?.slice(0, 10);
  if ((first && day < first) || (last && day > last)) return null;
  return [
    min && day === first ? (calendarTimeValue(min) ?? 0) : 0,
    max && day === last ? (calendarTimeValue(max) ?? 1439) : 1439,
  ];
}

export function calendarDateHasTime(day: string, options: CmCalendarTimeOptions): boolean {
  const window = timeWindow(day, options);
  if (!window) return false;
  const [start, end] = window;
  const step = calendarMinuteStep(options.minuteStep);
  const minute = start % 60;
  const next = Math.ceil(minute / step) * step;
  return start - minute + Math.min(next, 60) <= end;
}

export function calendarNearestAvailableDay(day: string, options: CmCalendarTimeOptions): string {
  const candidates = [day, calendarKeyTarget(day, 'ArrowRight'), calendarKeyTarget(day, 'ArrowLeft')];
  return (
    candidates.find((value) => value !== null && parseIsoDate(value) !== null && calendarDateHasTime(value, options)) ??
    day
  );
}

export function calendarTimesForDay(day: string, options: CmCalendarTimeOptions): number[] {
  const window = timeWindow(day, options);
  if (!window) return [];
  const [start, end] = window;
  const step = calendarMinuteStep(options.minuteStep);
  const times: number[] = [];
  for (let hour = Math.floor(start / 60); hour <= Math.floor(end / 60); hour += 1) {
    for (let minute = 0; minute < 60; minute += step) {
      const value = hour * 60 + minute;
      if (value >= start && value <= end) times.push(value);
    }
  }
  return times;
}

export function nearestCalendarTime(times: readonly number[], preferred: number): number | null {
  let closest: number | null = null;
  for (const time of times) {
    if (closest === null || Math.abs(time - preferred) < Math.abs(closest - preferred)) closest = time;
  }
  return closest;
}

export function selectCalendarDateTime(
  selected: readonly string[],
  value: string,
  mode: CmCalendarSelectionMode,
): string[] {
  if (mode === 'multiple' && selected.some((date) => date.slice(0, 10) === value.slice(0, 10))) {
    return selected.filter((date) => date.slice(0, 10) !== value.slice(0, 10));
  }
  return selectCalendarDate(selected, value, mode);
}

export function updateCalendarDateTime(
  selected: readonly string[],
  value: string,
  mode: CmCalendarSelectionMode,
): string[] | null {
  if (mode === 'single') return [value];
  const index = selected.findIndex((date) => date.slice(0, 10) === value.slice(0, 10));
  if (index < 0) return null;
  const updated = selected.map((date, position) => (index === position ? value : date));
  return mode === 'range' ? updated.sort() : updated;
}

interface CalendarItemsOptions {
  max?: string | null;
  min?: string | null;
  selected: string | readonly string[];
  range?: boolean;
  locale?: CmCalendarLocale;
}

function calendarItemState(options: CalendarItemsOptions) {
  const selected = typeof options.selected === 'string' ? [options.selected] : options.selected;
  const values = new Set(selected);
  const [rangeStart, rangeEnd] = options.range ? [...selected].sort() : [];
  return (value: string) => ({
    disabled: Boolean((options.min && value < options.min) || (options.max && value > options.max)),
    selected: values.has(value),
    rangeStart: value === rangeStart,
    rangeEnd: value === rangeEnd,
    inRange: Boolean(rangeStart && rangeEnd && value > rangeStart && value < rangeEnd),
  });
}

export function buildCalendarMonth(
  options: CalendarItemsOptions & { month: string; firstDayOfWeek?: CmCalendarWeekday },
): CmCalendarDay[][] {
  const anchor = requireIsoDate(options.month);
  const today = formatIsoDate(new Date());
  const firstOfMonth = localDate(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(firstOfMonth);
  const leadingDays = (firstOfMonth.getDay() - (options.firstDayOfWeek ?? 0) + 7) % 7;
  start.setDate(1 - leadingDays);
  const accessibleFormatter = new Intl.DateTimeFormat(options.locale ?? 'en-US', { dateStyle: 'full' });
  const itemState = calendarItemState(options);

  const weeks: CmCalendarDay[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: CmCalendarDay[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = localDate(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + day);
      const value = formatIsoDate(date);
      const state = itemState(value);
      days.push({
        ...state,
        accessibleLabel: accessibleFormatter.format(date),
        disabled: state.disabled || date.getFullYear() < 1 || date.getFullYear() > 9999,
        label: String(date.getDate()),
        outside: date.getMonth() !== anchor.getMonth(),
        today: value === today,
        value,
      });
    }
    weeks.push(days);
  }
  return weeks;
}

export function buildCalendarGrid(
  options: CalendarItemsOptions & {
    month: string;
    firstDayOfWeek?: CmCalendarWeekday;
    precision: CmCalendarPrecision;
    yearStart: number;
  },
): CmCalendarDay[][] {
  const { precision, locale, yearStart } = options;
  if (precision === 'day') return buildCalendarMonth(options);
  const year = precision === 'month' ? Number(options.month.slice(0, 4)) : yearStart;
  const shortMonth = new Intl.DateTimeFormat(locale ?? 'en-US', { month: 'short' });
  const fullMonth = new Intl.DateTimeFormat(locale ?? 'en-US', { month: 'long', year: 'numeric' });
  const today = formatCalendarValue(new Date(), precision);
  const itemState = calendarItemState(options);
  const units = Array.from({ length: yearRangeSize }, (_, index) => {
    const monthMode = precision === 'month';
    const date = localDate(year + (monthMode ? 0 : index), monthMode ? index : 0, 1);
    const value = formatCalendarValue(date, precision);
    const state = itemState(value);
    return {
      ...state,
      accessibleLabel: monthMode ? fullMonth.format(date) : value,
      disabled: state.disabled || date.getFullYear() < 1 || date.getFullYear() > 9999,
      label: monthMode ? shortMonth.format(date) : value,
      outside: false,
      today: value === today,
      value,
    };
  });
  return Array.from({ length: yearRangeSize / periodColumns }, (_, row) =>
    units.slice(row * periodColumns, row * periodColumns + periodColumns),
  );
}
