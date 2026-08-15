export interface CoreDateGridCell {
  date: string;
  day: number;
  disabled: boolean;
  inCurrentMonth: boolean;
  selected: boolean;
  today: boolean;
}

interface CoreDateGridOptions {
  max?: string;
  min?: string;
  month: string;
  selected?: string;
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
  if (options.selected) requireCoreDate(options.selected, 'DatePicker value');
  if (options.min) requireCoreDate(options.min, 'DatePicker min');
  if (options.max) requireCoreDate(options.max, 'DatePicker max');

  const leadingDays = (month.getDay() - 1 + 7) % 7;
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - leadingDays);
  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.max(35, Math.ceil((leadingDays + monthDays) / 7) * 7);

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const value = formatCoreDate(date);
    return {
      date: value,
      day: date.getDate(),
      disabled: isCoreDateDisabled(value, options.min, options.max),
      inCurrentMonth: date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear(),
      selected: value === options.selected,
      today: value === options.today,
    };
  });
}

export function getCoreWeekBoundary(value: string, boundary: 'end' | 'start'): string {
  const date = requireCoreDate(value, 'DatePicker value');
  const mondayOffset = (date.getDay() - 1 + 7) % 7;
  return addCoreDays(value, boundary === 'start' ? -mondayOffset : 6 - mondayOffset);
}
