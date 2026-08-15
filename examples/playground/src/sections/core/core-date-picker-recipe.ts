export interface CoreDateGridCell {
  date: string;
  day: number;
  disabled: boolean;
  inRange: boolean;
  inCurrentMonth: boolean;
  rangeEnd: boolean;
  rangeStart: boolean;
  selected: boolean;
  today: boolean;
}

export type CoreDateSelectionMode = 'multiple' | 'range' | 'single';
export type CoreDatePickerMode = 'date' | 'datetime' | 'month' | 'year';
export type CoreDatePickerValue = string | string[];

export interface CoreDatePeriodCell {
  disabled: boolean;
  label: string;
  selected: boolean;
  today: boolean;
  value: string;
}

interface CoreDateGridOptions {
  max?: string;
  min?: string;
  month: string;
  mode?: CoreDateSelectionMode;
  selected?: string | readonly string[];
  today: string;
}

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;
const monthPattern = /^(\d{4})-(\d{2})$/u;
const yearPattern = /^\d{4}$/u;
const dateTimePattern = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/u;

export function parseCoreDate(value: string): Date | null {
  const match = datePattern.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatCoreDate(date) === value ? date : null;
}

export function requireCoreDate(value: string, label: string): Date {
  const date = parseCoreDate(value);
  if (!date) throw new TypeError(`${label} must be a valid YYYY-MM-DD date: ${value}`);
  return date;
}

export function parseCorePickerValue(value: string, mode: CoreDatePickerMode): Date | null {
  if (mode === 'date') return parseCoreDate(value);
  if (mode === 'datetime') {
    const match = dateTimePattern.exec(value);
    if (!match || !parseCoreDate(match[1]!)) return null;
    const hour = Number(match[2]);
    const minute = Number(match[3]);
    return hour < 24 && minute < 60 ? new Date(`${match[1]}T${match[2]}:${match[3]}:00`) : null;
  }
  if (mode === 'year') {
    if (!yearPattern.test(value)) return null;
    const date = new Date(0, 0, 1);
    date.setFullYear(Number(value));
    return formatCoreYearValue(date) === value ? date : null;
  }
  const match = monthPattern.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return formatCoreMonthValue(date) === value ? date : null;
}

export function requireCorePickerValue(value: string, mode: CoreDatePickerMode): Date {
  const date = parseCorePickerValue(value, mode);
  if (!date) throw new TypeError(`DatePicker ${mode} value is invalid: ${value}`);
  return date;
}

export function formatCoreDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCoreMonthValue(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatCoreYearValue(date: Date): string {
  return String(date.getFullYear()).padStart(4, '0');
}

export function formatCoreDateDisplay(value: string): string {
  const date = requireCoreDate(value, 'DatePicker value');
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
}

export function formatCoreDateSelection(values: readonly string[], mode: CoreDateSelectionMode): string {
  return values.map(formatCoreDateDisplay).join(mode === 'range' ? ' – ' : '; ');
}

export function formatCorePickerDisplay(value: string, mode: CoreDatePickerMode): string {
  const date = requireCorePickerValue(value, mode);
  if (mode === 'year') return formatCoreYearValue(date);
  if (mode === 'month') {
    return new Intl.DateTimeFormat('en-US', { month: '2-digit', year: '2-digit' }).format(date);
  }
  if (mode === 'datetime') return `${formatCoreDateDisplay(value.slice(0, 10))} ${value.slice(11)}`;
  return formatCoreDateDisplay(value);
}

export function combineCoreDateTime(date: string, hour: string, minute: string): string {
  requireCoreDate(date, 'DatePicker date');
  const value = `${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  requireCorePickerValue(value, 'datetime');
  return value;
}

export function normalizeCoreDateSelection(
  value: CoreDatePickerValue,
  mode: CoreDateSelectionMode,
  pickerMode: CoreDatePickerMode = 'date',
): readonly string[] {
  if (pickerMode !== 'date' && mode !== 'single') {
    throw new TypeError(`DatePicker ${pickerMode} mode supports single selection only.`);
  }
  if (mode === 'single') {
    if (typeof value !== 'string') throw new TypeError('DatePicker single value must be a string.');
    if (value) requireCorePickerValue(value, pickerMode);
    return value ? [value] : [];
  }
  if (!Array.isArray(value)) throw new TypeError(`DatePicker ${mode} value must be an array.`);
  const values = mode === 'range' ? value.slice(0, 2) : value.slice();
  values.forEach((entry) => requireCoreDate(entry, 'DatePicker value'));
  return values;
}

export function createCoreMonthGrid(options: {
  max?: string;
  min?: string;
  selected?: string;
  today: string;
  year: number;
}): CoreDatePeriodCell[] {
  const today = requireCoreDate(options.today, 'DatePicker today');
  if (options.selected) requireCorePickerValue(options.selected, 'month');
  return Array.from({ length: 12 }, (_, month) => {
    const date = new Date(options.year, month, 1);
    const value = formatCoreMonthValue(date);
    const end = formatCoreDate(new Date(options.year, month + 1, 0));
    return {
      disabled: Boolean((options.min && end < options.min) || (options.max && `${value}-01` > options.max)),
      label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
      selected: value === options.selected,
      today: date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth(),
      value,
    };
  });
}

export function getCoreYearPageStart(value: string | Date): number {
  const year = typeof value === 'string' ? requireCorePickerValue(value, 'year').getFullYear() : value.getFullYear();
  return Math.floor(year / 10) * 10;
}

export function createCoreYearGrid(options: {
  max?: string;
  min?: string;
  selected?: string;
  startYear: number;
  today: string;
}): CoreDatePeriodCell[] {
  const today = requireCoreDate(options.today, 'DatePicker today');
  if (options.selected) requireCorePickerValue(options.selected, 'year');
  return Array.from({ length: 12 }, (_, index) => {
    const year = options.startYear + index;
    const value = String(year).padStart(4, '0');
    return {
      disabled: Boolean(
        (options.min && `${value}-12-31` < options.min) || (options.max && `${value}-01-01` > options.max),
      ),
      label: value,
      selected: value === options.selected,
      today: year === today.getFullYear(),
      value,
    };
  });
}

export function toggleCoreMultipleDate(values: readonly string[], value: string): string[] {
  requireCoreDate(value, 'DatePicker value');
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function selectCoreDateRange(values: readonly string[], value: string): string[] {
  requireCoreDate(value, 'DatePicker value');
  if (values.length !== 1) return [value];
  return [values[0]!, value].sort();
}

export function formatCoreDateLabel(value: string): string {
  const date = requireCoreDate(value, 'DatePicker value');
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(date);
}

export function formatCoreMonthLabel(month: string): string {
  const date = requireCoreDate(month, 'DatePicker month');
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export function startOfCoreMonth(value: string): string {
  const date = requireCoreDate(value, 'DatePicker value');
  return formatCoreDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function addCoreDays(value: string, amount: number): string {
  const date = requireCoreDate(value, 'DatePicker value');
  return formatCoreDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount));
}

export function moveCoreDateByMonth(value: string, amount: number): string {
  const date = requireCoreDate(value, 'DatePicker value');
  const month = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return formatCoreDate(new Date(month.getFullYear(), month.getMonth(), Math.min(date.getDate(), lastDay)));
}

export function isCoreDateDisabled(value: string, min?: string, max?: string): boolean {
  return Boolean((min && value < min) || (max && value > max));
}

export function coreMonthHasSelectableDate(month: string, min?: string, max?: string): boolean {
  const start = startOfCoreMonth(month);
  const date = requireCoreDate(start, 'DatePicker month');
  const end = formatCoreDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  return !(min && end < min) && !(max && start > max);
}

export function createCoreDateGrid(options: CoreDateGridOptions): CoreDateGridCell[] {
  const month = requireCoreDate(startOfCoreMonth(options.month), 'DatePicker month');
  requireCoreDate(options.today, 'DatePicker today');
  const selected = typeof options.selected === 'string' ? [options.selected] : (options.selected ?? []);
  selected.forEach((value) => requireCoreDate(value, 'DatePicker value'));
  const range = options.mode === 'range' ? [...selected].sort() : [];
  if (options.min) requireCoreDate(options.min, 'DatePicker min');
  if (options.max) requireCoreDate(options.max, 'DatePicker max');

  const leadingDays = (month.getDay() - 1 + 7) % 7;
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - leadingDays);
  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.max(35, Math.ceil((leadingDays + monthDays) / 7) * 7);

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const value = formatCoreDate(date);
    const rangeStart = range[0];
    const rangeEnd = range[1];
    return {
      date: value,
      day: date.getDate(),
      disabled: isCoreDateDisabled(value, options.min, options.max),
      inRange: Boolean(rangeStart && rangeEnd && value > rangeStart && value < rangeEnd),
      inCurrentMonth: date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear(),
      rangeEnd: value === rangeEnd,
      rangeStart: value === rangeStart,
      selected: selected.includes(value),
      today: value === options.today,
    };
  });
}

export function getCoreWeekBoundary(value: string, boundary: 'end' | 'start'): string {
  const date = requireCoreDate(value, 'DatePicker value');
  const mondayOffset = (date.getDay() - 1 + 7) % 7;
  return addCoreDays(value, boundary === 'start' ? -mondayOffset : 6 - mondayOffset);
}
