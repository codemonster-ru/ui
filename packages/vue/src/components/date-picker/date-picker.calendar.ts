// The calendar rules live in the shared core so both adapters build the same month. This module
// stays as the component's local entry point.
export {
  buildCalendarMonth,
  formatDisplayDate,
  formatIsoDate,
  monthLabel,
  parseIsoDate,
  shiftMonth,
  weekdayLabels,
} from '@codemonster-ru/ui-runtime/core';
export type { CmCalendarDay } from '@codemonster-ru/ui-runtime/core';
