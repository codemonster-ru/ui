/**
 * Calendar arithmetic and pinned formatting, with no DOM and no framework.
 *
 * Both adapters built the same month grid from scratch: the Vue component in its own calendar
 * module, the controller inline while rendering cells. Six weeks starting from the Sunday on or
 * before the first of the month, the same ISO parsing, the same month shifting that clamps to a
 * shorter month.
 */

export interface CmCalendarDay {
  disabled: boolean;
  label: string;
  outside: boolean;
  selected: boolean;
  today: boolean;
  value: string;
}

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
export function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value);
  return date === null ? value : displayFormatter.format(date);
}

export function monthLabel(value: string): string {
  return monthFormatter.format(requireIsoDate(value));
}

export function weekdayLabels(): string[] {
  return Array.from({ length: 7 }, (_, index) => weekdayFormatter.format(new Date(2024, 0, 7 + index)));
}

export function shiftMonth(value: string, delta: number): string {
  const date = requireIsoDate(value);
  const shifted = new Date(date.getFullYear(), date.getMonth() + delta, 1);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(date.getDate(), lastDay));
  return formatIsoDate(shifted);
}

export function buildCalendarMonth(options: {
  max?: string | null;
  min?: string | null;
  month: string;
  selected: string;
}): CmCalendarDay[][] {
  const anchor = requireIsoDate(options.month);
  const today = formatIsoDate(new Date());
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(firstOfMonth);
  start.setDate(1 - firstOfMonth.getDay());

  const weeks: CmCalendarDay[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: CmCalendarDay[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + day);
      const value = formatIsoDate(date);
      days.push({
        disabled: Boolean((options.min && value < options.min) || (options.max && value > options.max)),
        label: String(date.getDate()),
        outside: date.getMonth() !== anchor.getMonth(),
        selected: value === options.selected,
        today: value === today,
        value,
      });
    }
    weeks.push(days);
  }
  return weeks;
}
