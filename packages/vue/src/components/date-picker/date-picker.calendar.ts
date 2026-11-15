// The calendar rules live in the shared core so both adapters build the same month. This module
// stays as the component's local entry point.
export {
  boundCalendarDate,
  buildCalendarMonth,
  calendarKeyTarget,
  calendarMonthAllowed,
  formatDisplayDate,
  formatIsoDate,
  monthLabel,
  parseIsoDate,
  selectCalendarDate,
  shiftMonth,
  weekdayLabels,
} from '@codemonster-ru/ui-runtime/core';
export type {
  CmCalendarDay,
  CmCalendarLocale,
  CmCalendarSelectionMode,
  CmCalendarWeekday,
} from '@codemonster-ru/ui-runtime/core';
