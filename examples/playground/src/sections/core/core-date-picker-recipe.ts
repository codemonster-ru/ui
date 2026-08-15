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
export type CoreDatePickerValue = string | string[];

interface CoreDateGridOptions {
  max?: string;
  min?: string;
  month: string;
  mode?: CoreDateSelectionMode;
  selected?: string | readonly string[];
  today: string;
}

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;

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

export function formatCoreDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCoreDateDisplay(value: string): string {
  const date = requireCoreDate(value, 'DatePicker value');
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
}

export function formatCoreDateSelection(values: readonly string[], mode: CoreDateSelectionMode): string {
  return values.map(formatCoreDateDisplay).join(mode === 'range' ? ' – ' : '; ');
}

export function normalizeCoreDateSelection(value: CoreDatePickerValue, mode: CoreDateSelectionMode): readonly string[] {
  if (mode === 'single') {
    if (typeof value !== 'string') throw new TypeError('DatePicker single value must be a string.');
    if (value) requireCoreDate(value, 'DatePicker value');
    return value ? [value] : [];
  }
  if (!Array.isArray(value)) throw new TypeError(`DatePicker ${mode} value must be an array.`);
  const values = mode === 'range' ? value.slice(0, 2) : value.slice();
  values.forEach((entry) => requireCoreDate(entry, 'DatePicker value'));
  return values;
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
