import type { CmCalendarLocale, CmCalendarWeekday } from '@codemonster-ru/ui-runtime/core';

export type CmDatePickerSize = 'sm' | 'md' | 'lg';
export type CmDatePickerPlacement = 'bottom-start' | 'bottom-end';
export interface CmDatePickerLabels {
  calendar?: string;
  clear?: string;
  previousMonth?: string;
  nextMonth?: string;
  previousYear?: string;
  nextYear?: string;
  previousDecade?: string;
  nextDecade?: string;
  time?: string;
  hour?: string;
  minute?: string;
}

export type CmDatePickerValue<Multiple extends boolean = false, Range extends boolean = false> = Multiple extends true
  ? string[]
  : Range extends true
    ? string[]
    : string;

export interface CmDatePickerProps<Multiple extends boolean = false, Range extends boolean = false> {
  id: string;
  modelValue?: CmDatePickerValue<Multiple, Range>;
  multiple?: Multiple;
  range?: Range;
  monthPicker?: boolean;
  yearPicker?: boolean;
  showTime?: boolean;
  minuteStep?: number;
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
  placement?: CmDatePickerPlacement;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  clearLabel?: string;
  previousMonthLabel?: string;
  nextMonthLabel?: string;
}

export type VfDatePickerLabels = CmDatePickerLabels;
export type VfDatePickerProps = Omit<
  CmDatePickerProps<boolean, boolean>,
  'id' | 'min' | 'max' | 'placeholder' | 'clearLabel' | 'previousMonthLabel' | 'nextMonthLabel'
> & {
  id?: string;
  min?: string;
  max?: string;
  placeholder?: string;
};
