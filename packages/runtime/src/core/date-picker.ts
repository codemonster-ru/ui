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

const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/u;
const displayFormatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

export function formatIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
  const match = isoPattern.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatIsoDate(date) === value ? date : null;
}

// Callers below need a real Date to build a grid from. The component sanitizes every value it
// passes, so the fallback is defence in depth rather than a path the UI reaches.
function requireIsoDate(value: string): Date {
  return parseIsoDate(value) ?? new Date();
}

// The display and month names are pinned to one locale so a server-rendered control and the client
// that later takes it over agree, and so a capture does not depend on the machine's language.
export function formatDisplayDate(value: string, locale?: CmCalendarLocale, format?: string): string {
  const date = parseIsoDate(value);
  if (date === null) return value;
  if (format) {
    const [year, month, day] = value.split('-');
    const tokens: Readonly<Record<string, string>> = {
      yyyy: year,
      yy: year.slice(-2),
      MM: month,
      M: String(Number(month)),
      dd: day,
      d: String(Number(day)),
    };
    return format.replace(/yyyy|yy|MM|M|dd|d/g, (token) => tokens[token]);
  }
  const formatter =
    locale === undefined
      ? displayFormatter
      : new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: '2-digit' });
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
  const shifted = new Date(date.getFullYear(), date.getMonth() + delta, 1);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
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

export function buildCalendarMonth(options: {
  max?: string | null;
  min?: string | null;
  month: string;
  selected: string | readonly string[];
  range?: boolean;
  firstDayOfWeek?: CmCalendarWeekday;
  locale?: CmCalendarLocale;
}): CmCalendarDay[][] {
  const anchor = requireIsoDate(options.month);
  const today = formatIsoDate(new Date());
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(firstOfMonth);
  const leadingDays = (firstOfMonth.getDay() - (options.firstDayOfWeek ?? 0) + 7) % 7;
  start.setDate(1 - leadingDays);
  const accessibleFormatter = new Intl.DateTimeFormat(options.locale ?? 'en-US', { dateStyle: 'full' });
  const selected = typeof options.selected === 'string' ? [options.selected] : options.selected;
  const selectedDates = new Set(selected);
  const [rangeStart, rangeEnd] = options.range ? [...selected].sort() : [];

  const weeks: CmCalendarDay[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: CmCalendarDay[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + day);
      const value = formatIsoDate(date);
      days.push({
        accessibleLabel: accessibleFormatter.format(date),
        disabled: Boolean((options.min && value < options.min) || (options.max && value > options.max)),
        inRange: Boolean(rangeStart && rangeEnd && value > rangeStart && value < rangeEnd),
        label: String(date.getDate()),
        outside: date.getMonth() !== anchor.getMonth(),
        rangeEnd: value === rangeEnd,
        rangeStart: value === rangeStart,
        selected: selectedDates.has(value),
        today: value === today,
        value,
      });
    }
    weeks.push(days);
  }
  return weeks;
}
