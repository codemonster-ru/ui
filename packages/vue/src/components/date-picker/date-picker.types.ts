import type { CmCalendarLocale, CmCalendarWeekday } from './date-picker.calendar';

export type CmDatePickerSize = 'sm' | 'md' | 'lg';
export interface CmDatePickerLabels {
  calendar?: string;
  clear?: string;
  previousMonth?: string;
  nextMonth?: string;
}

export interface CmDatePickerProps {
  id: string;
  modelValue?: string;
  min?: string | null;
  max?: string | null;
  placeholder?: string | null;
  locale?: CmCalendarLocale;
  displayFormat?: string;
  firstDayOfWeek?: CmCalendarWeekday;
  labels?: CmDatePickerLabels;
  size?: CmDatePickerSize;
  invalid?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  previousMonthLabel?: string;
  nextMonthLabel?: string;
}
