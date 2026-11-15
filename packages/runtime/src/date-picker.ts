import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import {
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
  type CmCalendarSelectionMode,
  type CmCalendarWeekday,
} from './core/date-picker.js';
import { dispatchCmEvent } from './events.js';
import { observeFormReset } from './form-reset.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface DatePickerValueChangeDetail {
  value: string;
}

export interface DatePickerSelectionChangeDetail {
  mode: 'multiple' | 'range';
  values: string[];
}

const triggerSelector = '.cm-date-picker';
const calendarSelector = '.cm-date-picker__calendar[role="dialog"]';
const clearSelector = '[data-cm-date-picker-clear]';
const daysSelector = '[data-cm-date-picker-days]';
const monthSelector = '[data-cm-date-picker-month]';
const valueSelector = '.cm-date-picker__value';
const hiddenInputSelector = 'input[type="hidden"]';
const daySelector = '[data-cm-date-picker-value]';
const previousSelector = '[data-cm-date-picker-previous]';
const nextSelector = '[data-cm-date-picker-next]';

const authoredDefaults = new WeakMap<Element, { dates: readonly string[]; formId: string | null }>();

export class CmDatePickerController implements CmController {
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;
  readonly #calendar: HTMLElement;
  readonly #clear: HTMLButtonElement | null;
  readonly #input: HTMLInputElement | null;
  readonly #mode: CmCalendarSelectionMode;
  readonly #fieldName: string;
  readonly #defaults: { dates: readonly string[]; formId: string | null };
  #selectedDates: string[];
  #visibleMonth: string;
  #focusedDate: string;
  #stopAutoUpdate: (() => void) | null = null;
  #stopFormReset: (() => void) | null = null;

  constructor(root: Element) {
    const trigger = root.querySelector<HTMLButtonElement>(triggerSelector);
    const calendar = root.querySelector<HTMLElement>(calendarSelector);
    if (!trigger || !calendar) throw new TypeError('DatePicker controller requires a trigger and calendar.');
    this.#root = root;
    this.#trigger = trigger;
    this.#calendar = calendar;
    this.#clear = root.querySelector<HTMLButtonElement>(clearSelector);
    this.#input = root.querySelector<HTMLInputElement>(hiddenInputSelector);
    const mode = trigger.dataset.cmDatePickerMode;
    this.#mode = mode === 'multiple' || mode === 'range' ? mode : 'single';
    this.#fieldName = trigger.dataset.cmDatePickerName ?? this.#input?.name ?? '';
    const initial =
      this.#mode === 'single'
        ? [this.#input?.value ?? trigger.dataset.cmValue ?? '']
        : this.#arrayInputs().map((input) => input.value);
    this.#selectedDates = initial.filter((date) => parseIsoDate(date) !== null);
    if (this.#mode === 'range') this.#selectedDates = this.#selectedDates.slice(0, 2).sort();
    if (this.#mode === 'multiple') this.#selectedDates = [...new Set(this.#selectedDates)];
    this.#defaults = authoredDefaults.get(root) ?? {
      dates: this.#selectedDates.slice(),
      formId: this.#input?.getAttribute('form') ?? null,
    };
    authoredDefaults.set(root, this.#defaults);
    this.#visibleMonth = this.#initialDate();
    this.#focusedDate = this.#visibleMonth;
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
    this.#root.addEventListener('mousedown', this.#handleMouseDown);
    this.#root.addEventListener('focusin', this.#handleDayFocus);
    this.#root.ownerDocument.addEventListener('click', this.#dismissOutside, true);
    this.#root.ownerDocument.addEventListener('focusin', this.#dismissOutside);
    if (this.#mode === 'single') {
      if (this.#input && this.#trigger.disabled) this.#input.disabled = true;
    } else {
      if (this.#fieldName) this.#trigger.dataset.cmDatePickerName = this.#fieldName;
      this.#writeArrayInputs(this.#selectedDates);
      this.#calendar.querySelector('[role="grid"]')?.setAttribute('aria-multiselectable', 'true');
      this.#syncDisplay(this.#selectedDates);
    }
    this.#synchronize(this.#trigger.getAttribute('aria-expanded') === 'true');
    this.#stopFormReset ??= observeFormReset(
      this.#trigger,
      () => {
        this.#applySelection([...this.#defaults.dates]);
        this.#setOpen(false, false);
      },
      () => this.#associatedForm(),
    );
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('mousedown', this.#handleMouseDown);
    this.#root.removeEventListener('focusin', this.#handleDayFocus);
    this.#root.ownerDocument.removeEventListener('click', this.#dismissOutside, true);
    this.#root.ownerDocument.removeEventListener('focusin', this.#dismissOutside);
    this.#releasePlacement();
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  #currentDates(): string[] {
    if (this.#mode !== 'single' || !this.#input) return this.#selectedDates;
    return parseIsoDate(this.#input.value) ? [this.#input.value] : [];
  }

  #arrayInputs(): HTMLInputElement[] {
    return [...this.#root.querySelectorAll<HTMLInputElement>(`:scope > ${hiddenInputSelector}`)].filter(
      (input) => input.name === this.#fieldName,
    );
  }

  #associatedForm(): HTMLFormElement | null {
    const input = this.#mode === 'single' ? this.#input : this.#arrayInputs()[0];
    if (input?.isConnected) return input.form;
    const formId = this.#trigger.getAttribute('form') ?? this.#defaults.formId;
    if (formId === null) return this.#trigger.form;
    const form = this.#trigger.ownerDocument.getElementById(formId);
    return form?.tagName === 'FORM' ? (form as HTMLFormElement) : null;
  }

  #writeArrayInputs(values: readonly string[]): void {
    if (this.#fieldName === '') return;
    const inputs = this.#arrayInputs();
    const form = inputs[0]?.getAttribute('form') ?? this.#trigger.getAttribute('form') ?? this.#defaults.formId;
    for (const [index, value] of values.entries()) {
      const input = inputs[index] ?? this.#root.ownerDocument.createElement('input');
      input.type = 'hidden';
      input.name = this.#fieldName;
      input.value = value;
      input.disabled = this.#trigger.disabled;
      if (form !== null) input.setAttribute('form', form);
      if (!inputs[index]) this.#root.append(input);
    }
    for (const input of inputs.slice(values.length)) input.remove();
  }

  #initialDate(): string {
    return this.#boundDate(this.#currentDates()[0] ?? formatIsoDate(new Date()));
  }

  #boundDate(value: string): string {
    return boundCalendarDate(value, this.#trigger.dataset.cmMin, this.#trigger.dataset.cmMax);
  }

  #canChangeMonth(value: string): boolean {
    return calendarMonthAllowed(value, this.#trigger.dataset.cmMin, this.#trigger.dataset.cmMax);
  }

  #firstDayOfWeek(): CmCalendarWeekday {
    const value = Number(this.#trigger.dataset.cmFirstDayOfWeek);
    return Number.isInteger(value) && value >= 0 && value <= 6 ? (value as CmCalendarWeekday) : 0;
  }

  readonly #handleMouseDown = (event: Event): void => {
    if ((event.target as Element | null)?.closest(clearSelector)) event.preventDefault();
  };

  readonly #dismissOutside = (event: Event): void => {
    if (!this.#calendar.hidden && !event.composedPath().includes(this.#root)) this.#setOpen(false, false);
  };

  readonly #handleDayFocus = (event: Event): void => {
    const day = (event.target as Element | null)?.closest<HTMLButtonElement>(daySelector);
    const value = day?.dataset.cmDatePickerValue;
    if (!day || day.disabled || !value) return;
    const previous = this.#calendar.querySelector<HTMLButtonElement>(`${daySelector}[tabindex="0"]`);
    if (previous && previous !== day) previous.tabIndex = -1;
    day.tabIndex = 0;
    this.#focusedDate = value;
  };

  readonly #handleClick = (event: Event): void => {
    const target = event.target as Element | null;
    if (!target || this.#trigger.disabled || this.#trigger.getAttribute('aria-readonly') === 'true') return;

    if (target.closest(clearSelector)) {
      this.#commit([]);
      this.#setOpen(false, true);
      return;
    }

    if (target.closest(previousSelector)) {
      this.#changeMonth(-1);
      return;
    }

    if (target.closest(nextSelector)) {
      this.#changeMonth(1);
      return;
    }

    const day = target.closest<HTMLButtonElement>(daySelector);
    const value = day?.dataset.cmDatePickerValue;
    if (day && !day.disabled && value) {
      const next = selectCalendarDate(this.#currentDates(), value, this.#mode);
      this.#commit(next);
      if (this.#mode === 'single' || (this.#mode === 'range' && next.length === 2)) this.#setOpen(false, true);
      else this.#moveFocus(value);
      return;
    }

    if (target.closest(triggerSelector)) this.#setOpen(this.#calendar.hidden, false);
  };

  readonly #handleKeydown = (event: Event): void => {
    const key = (event as KeyboardEvent).key;
    if (key === 'Escape' && !this.#calendar.hidden) {
      event.preventDefault();
      event.stopPropagation();
      this.#setOpen(false, true);
      return;
    }
    if (this.#calendar.hidden && (event.target as Element | null)?.closest(triggerSelector)) {
      if (!['ArrowDown', 'Enter', ' '].includes(key)) return;
      event.preventDefault();
      this.#setOpen(true, false);
      return;
    }
    if (this.#calendar.hidden) return;
    const day = (event.target as Element | null)?.closest<HTMLButtonElement>(daySelector);
    const value = day?.dataset.cmDatePickerValue;
    if (!day || !value) return;
    const rtl = day.ownerDocument.defaultView?.getComputedStyle(day).direction === 'rtl';
    const target = calendarKeyTarget(value, key, this.#firstDayOfWeek(), rtl);
    if (target === null) return;
    event.preventDefault();
    if (parseIsoDate(target) && this.#boundDate(target) === target) this.#moveFocus(target);
  };

  #changeMonth(delta: number): void {
    const target = shiftMonth(this.#visibleMonth, delta);
    if (this.#canChangeMonth(target)) this.#moveFocus(this.#boundDate(target));
  }

  #moveFocus(value: string): void {
    this.#focusedDate = value;
    this.#visibleMonth = value;
    this.#renderMonth();
    this.#focusDay();
  }

  #focusDay(): void {
    const day = this.#calendar.querySelector<HTMLButtonElement>(`${daySelector}[tabindex="0"]`);
    (day ?? this.#calendar).focus();
  }

  #renderMonth(): void {
    const days = this.#calendar.querySelector<HTMLElement>(daysSelector);
    if (!days) return;

    const month = this.#calendar.querySelector<HTMLElement>(monthSelector);
    const locale = this.#trigger.dataset.cmLocale;
    if (month) month.textContent = monthLabel(this.#visibleMonth, locale);
    const weekdays = weekdayLabels(this.#firstDayOfWeek(), locale);
    this.#calendar.querySelectorAll<HTMLElement>('[role="columnheader"]').forEach((header, index) => {
      if (weekdays[index] !== undefined) header.textContent = weekdays[index];
    });
    const previous = this.#calendar.querySelector<HTMLButtonElement>(previousSelector);
    const next = this.#calendar.querySelector<HTMLButtonElement>(nextSelector);
    if (previous) previous.disabled = !this.#canChangeMonth(shiftMonth(this.#visibleMonth, -1));
    if (next) next.disabled = !this.#canChangeMonth(shiftMonth(this.#visibleMonth, 1));

    const weeks = buildCalendarMonth({
      max: this.#trigger.dataset.cmMax ?? null,
      min: this.#trigger.dataset.cmMin ?? null,
      month: this.#visibleMonth,
      selected: this.#currentDates(),
      range: this.#mode === 'range',
      firstDayOfWeek: this.#firstDayOfWeek(),
      locale,
    });

    // The server renders the calendar's scaffolding only: a grid built from the current date would
    // make its markup depend on the day it was rendered. The cells are built here on first open.
    const cells = [...days.querySelectorAll<HTMLButtonElement>(daySelector)];
    if (cells.length === 0) {
      const document_ = this.#root.ownerDocument;
      for (let week = 0; week < weeks.length; week += 1) {
        const row = document_.createElement('div');
        row.className = 'cm-date-picker__week';
        row.setAttribute('role', 'row');
        for (let day = 0; day < 7; day += 1) {
          const cell = document_.createElement('button');
          cell.className = 'cm-date-picker__day';
          cell.type = 'button';
          cell.setAttribute('role', 'gridcell');
          row.append(cell);
          cells.push(cell);
        }
        days.append(row);
      }
    }

    weeks.flat().forEach((day, index) => {
      const cell = cells[index];
      if (!cell) return;
      cell.dataset.cmDatePickerValue = day.value;
      cell.textContent = day.label;
      cell.disabled = day.disabled;
      cell.classList.toggle('cm-date-picker__day--outside', day.outside);
      cell.classList.toggle('cm-date-picker__day--today', day.today);
      cell.classList.toggle('cm-date-picker__day--selected', day.selected);
      cell.classList.toggle('cm-date-picker__day--in-range', day.inRange);
      cell.classList.toggle('cm-date-picker__day--range-start', day.rangeStart);
      cell.classList.toggle('cm-date-picker__day--range-end', day.rangeEnd);
      cell.setAttribute('aria-label', day.accessibleLabel);
      cell.setAttribute('aria-selected', String(day.selected || day.inRange));
      if (day.today) cell.setAttribute('aria-current', 'date');
      else cell.removeAttribute('aria-current');
      cell.tabIndex = !day.disabled && day.value === this.#focusedDate ? 0 : -1;
    });
  }

  #applySelection(dates: string[]): void {
    this.#selectedDates = dates;
    if (this.#mode === 'single') {
      if (this.#input) this.#input.value = dates[0] ?? '';
    } else this.#writeArrayInputs(dates);
    this.#syncDisplay(dates);
  }

  #commit(dates: string[]): void {
    this.#applySelection(dates);
    if (this.#mode === 'single') {
      dispatchCmEvent<DatePickerValueChangeDetail>(this.#root, 'date-picker-value-change', { value: dates[0] ?? '' });
    } else {
      dispatchCmEvent<DatePickerSelectionChangeDetail>(this.#root, 'date-picker-selection-change', {
        mode: this.#mode,
        values: dates.slice(),
      });
    }
    const view = this.#root.ownerDocument.defaultView;
    if (view) this.#trigger.dispatchEvent(new view.Event('change', { bubbles: true }));
  }

  #syncDisplay(dates: readonly string[]): void {
    const valueElement = this.#trigger.querySelector<HTMLElement>(valueSelector);
    if (valueElement) {
      valueElement.textContent =
        dates.length === 0
          ? (this.#trigger.dataset.cmPlaceholder ?? '')
          : dates
              .map((date) =>
                formatDisplayDate(date, this.#trigger.dataset.cmLocale, this.#trigger.dataset.cmDisplayFormat),
              )
              .join(this.#mode === 'range' ? ' – ' : '; ');
    }
    this.#trigger.classList.toggle('cm-date-picker--placeholder', dates.length === 0);
    if (dates.length > 0) this.#trigger.dataset.cmFilled = 'true';
    else delete this.#trigger.dataset.cmFilled;
    if (this.#clear) this.#clear.hidden = dates.length === 0;
  }

  #setOpen(open: boolean, restoreFocus: boolean): void {
    if (this.#trigger.disabled || this.#trigger.getAttribute('aria-readonly') === 'true') open = false;
    const changed = this.#calendar.hidden === open;
    if (changed && open) {
      this.#focusedDate = this.#initialDate();
      this.#visibleMonth = this.#focusedDate;
    }
    if (changed) this.#synchronize(open);
    if (changed && open) this.#focusDay();
    if (restoreFocus) this.#trigger.focus();
    if (changed) dispatchCmEvent(this.#root, 'date-picker-open-change', { open });
  }

  #synchronize(open: boolean): void {
    this.#trigger.setAttribute('aria-expanded', String(open));
    this.#calendar.hidden = !open;
    if (open) {
      this.#calendar.tabIndex = -1;
      this.#renderMonth();
      this.#holdPlacement();
    } else {
      this.#calendar.removeAttribute('tabindex');
      this.#releasePlacement();
    }
  }

  #holdPlacement(): void {
    if (this.#stopAutoUpdate) return;
    const place = (): void => {
      void computePosition(this.#trigger, this.#calendar, {
        placement: 'bottom-start',
        middleware: [offset(2), flip(), shift()],
      }).then(({ x, y }) => {
        if (this.#calendar.hidden || !this.#stopAutoUpdate) return;
        this.#calendar.style.insetInlineStart = `${x}px`;
        this.#calendar.style.insetBlockStart = `${y}px`;
      });
    };
    this.#stopAutoUpdate = autoUpdate(this.#trigger, place, this.#calendar);
    place();
  }

  #releasePlacement(): void {
    this.#stopAutoUpdate?.();
    this.#stopAutoUpdate = null;
    this.#calendar.style.removeProperty('inset-inline-start');
    this.#calendar.style.removeProperty('inset-block-start');
  }
}

export const createCmDatePickerController: CmControllerFactory = (element) => new CmDatePickerController(element);
