import { afterCmFloatingExit, attachCmAnchoredPosition, resolveCmAnchoredTarget } from './anchored-position.js';
import {
  boundCalendarDate,
  buildCalendarGrid,
  calendarAdjacentPeriod,
  calendarDateHasTime,
  calendarGridKeyTarget,
  calendarGridTitle,
  calendarMinuteStep,
  calendarNearestAvailableDay,
  calendarTimesForDay,
  calendarTimeValue,
  calendarYearRangeStart,
  formatCalendarValue,
  formatCalendarDateTime,
  formatDisplayDate,
  nearestCalendarTime,
  normalizeCalendarDateTime,
  parseCalendarValue,
  selectCalendarDate,
  selectCalendarDateTime,
  updateCalendarDateTime,
  weekdayLabels,
  type CmCalendarPrecision,
  type CmCalendarSelectionMode,
  type CmCalendarTimeOptions,
  type CmCalendarWeekday,
} from './core/date-picker.js';
import { dispatchCmEvent } from './events.js';
import { observeFormReset } from './form-reset.js';
import type { CmController, CmControllerFactory } from './runtime.js';
import { CmSelectController, type SelectValueChangeDetail } from './select.js';

export interface DatePickerValueChangeDetail {
  value: string;
}

export interface DatePickerSelectionChangeDetail {
  mode: 'multiple' | 'range';
  values: string[];
}

const triggerSelector = '.cm-date-picker';
const openRingAttribute = 'data-cm-open-ring';
const calendarSelector = '.cm-date-picker__calendar[role="dialog"]';
const clearSelector = '[data-cm-date-picker-clear]';
const daysSelector = '[data-cm-date-picker-days]';
const monthSelector = '[data-cm-date-picker-month]';
const valueSelector = '.cm-date-picker__value';
const hiddenInputSelector = 'input[type="hidden"]';
const daySelector = '[data-cm-date-picker-value]';
const previousSelector = '[data-cm-date-picker-previous]';
const nextSelector = '[data-cm-date-picker-next]';
const hourSelector = '[data-cm-date-picker-hour]';
const minuteSelector = '[data-cm-date-picker-minute]';

const authoredDefaults = new WeakMap<Element, { dates: readonly string[]; formId: string | null }>();

// Older authored DatePickers use native selects as the time-control containers.
function timeHost(element: HTMLElement): HTMLElement {
  if (element.localName !== 'select') return element;
  const host = element.ownerDocument.createElement('div');
  for (const { name, value } of element.attributes) host.setAttribute(name, value);
  element.replaceWith(host);
  return host;
}

function mountTimeSelect(host: HTMLElement, id: string, label: string) {
  const document = host.ownerDocument;
  const root = host.appendChild(document.createElement('div'));
  root.className = 'cm-select-wrap';
  const trigger = root.appendChild(document.createElement('button'));
  trigger.id = id;
  trigger.type = 'button';
  trigger.className = 'cm-select cm-select--md';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-label', host.dataset.cmLabel ?? host.getAttribute('aria-label') ?? label);
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-controls', `${id}-listbox`);
  const labelledBy = host.getAttribute('aria-labelledby');
  if (labelledBy) trigger.setAttribute('aria-labelledby', labelledBy);
  const value = trigger.appendChild(document.createElement('span'));
  value.className = 'cm-select__value';
  const icon = trigger.appendChild(document.createElement('span'));
  icon.className = 'cm-select__icon cm-select__icon--chevron';
  icon.setAttribute('aria-hidden', 'true');
  const svg = icon.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
  svg.setAttribute('class', 'cm-select__chevron');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('focusable', 'false');
  const chevron = svg.appendChild(document.createElementNS(svg.namespaceURI, 'polyline'));
  chevron.setAttribute('points', '5.75 8.75 12 15 18.25 8.75');
  chevron.setAttribute('stroke', 'currentColor');
  chevron.setAttribute('stroke-width', '2');
  chevron.setAttribute('stroke-linecap', 'round');
  chevron.setAttribute('stroke-linejoin', 'round');
  const listbox = root.appendChild(document.createElement('div'));
  listbox.id = `${id}-listbox`;
  listbox.className = 'cm-select__listbox';
  listbox.hidden = true;
  listbox.setAttribute('role', 'listbox');
  listbox.setAttribute('aria-labelledby', id);
  const controller = new CmSelectController(root);
  controller.connect();
  return { root, trigger, value, listbox, controller };
}

type TimeSelect = ReturnType<typeof mountTimeSelect>;

export class CmDatePickerController implements CmController {
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;
  readonly #calendar: HTMLElement;
  readonly #clear: HTMLButtonElement | null;
  readonly #input: HTMLInputElement | null;
  readonly #mode: CmCalendarSelectionMode;
  readonly #precision: CmCalendarPrecision;
  readonly #hasTime: boolean;
  readonly #hourHost: HTMLElement | null;
  readonly #minuteHost: HTMLElement | null;
  readonly #fieldName: string;
  readonly #defaults: { dates: readonly string[]; formId: string | null };
  #selectedDates: string[];
  #visibleMonth: string;
  #focusedDate: string;
  #yearStart: number;
  #draftDay = '';
  #draftTime: number | null = null;
  #hourSelect: TimeSelect | null = null;
  #minuteSelect: TimeSelect | null = null;
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
    const precision = trigger.dataset.cmDatePickerPrecision;
    this.#precision = precision === 'month' || precision === 'year' ? precision : 'day';
    this.#hasTime = this.#precision === 'day' && trigger.dataset.cmDatePickerShowTime === 'true';
    const hour = calendar.querySelector<HTMLElement>(hourSelector);
    const minute = calendar.querySelector<HTMLElement>(minuteSelector);
    if (this.#hasTime && (!hour || !minute)) {
      throw new TypeError('DatePicker time selection requires hour and minute controls.');
    }
    this.#hourHost = hour && timeHost(hour);
    this.#minuteHost = minute && timeHost(minute);
    this.#fieldName = trigger.dataset.cmDatePickerName ?? this.#input?.name ?? '';
    const initial =
      this.#mode === 'single'
        ? [this.#input?.value ?? trigger.dataset.cmValue ?? '']
        : this.#arrayInputs().map((input) => input.value);
    this.#selectedDates = initial.map((date) => this.#modelDate(date)).filter(Boolean);
    if (this.#mode === 'range') this.#selectedDates = this.#selectedDates.slice(0, 2).sort();
    if (this.#mode === 'multiple') this.#selectedDates = [...new Set(this.#selectedDates)];
    this.#defaults = authoredDefaults.get(root) ?? {
      dates: this.#selectedDates.slice(),
      formId: this.#input?.getAttribute('form') ?? null,
    };
    authoredDefaults.set(root, this.#defaults);
    this.#visibleMonth = this.#initialDate();
    this.#focusedDate = this.#visibleMonth;
    this.#yearStart = calendarYearRangeStart(this.#visibleMonth);
  }

  connect(): void {
    for (const element of [this.#trigger, this.#clear, this.#calendar]) {
      element?.addEventListener('click', this.#handleClick);
      element?.addEventListener('keydown', this.#handleKeydown);
    }
    this.#clear?.addEventListener('mousedown', this.#handleMouseDown);
    this.#calendar.addEventListener('pointerdown', this.#clearOpenRing, true);
    this.#calendar.addEventListener('focusin', this.#handleDayFocus);
    if (this.#hasTime) this.#calendar.addEventListener('cm:select-value-change', this.#handleTimeChange);
    this.#root.ownerDocument.addEventListener('click', this.#dismissOutside, true);
    this.#root.ownerDocument.addEventListener('focusin', this.#dismissOutside);
    if (this.#mode === 'single') {
      if (this.#input && this.#trigger.disabled) this.#input.disabled = true;
      if (this.#hasTime) this.#applySelection(this.#selectedDates);
    } else {
      if (this.#fieldName) this.#trigger.dataset.cmDatePickerName = this.#fieldName;
      this.#writeArrayInputs(this.#selectedDates);
      this.#calendar.querySelector('[role="grid"]')?.setAttribute('aria-multiselectable', 'true');
      this.#syncDisplay(this.#selectedDates);
    }
    this.#calendar
      .querySelector('[role="grid"]')
      ?.classList.toggle('cm-date-picker__grid--period', this.#precision !== 'day');
    this.#synchronize(this.#trigger.getAttribute('aria-expanded') === 'true');
    this.#stopFormReset ??= observeFormReset(
      this.#trigger,
      () => {
        const dates = this.#defaults.dates.map((date) => this.#modelDate(date)).filter(Boolean);
        this.#applySelection(dates);
        this.#setOpen(false, false);
      },
      () => this.#associatedForm(),
    );
  }

  disconnect(): void {
    for (const element of [this.#trigger, this.#clear, this.#calendar]) {
      element?.removeEventListener('click', this.#handleClick);
      element?.removeEventListener('keydown', this.#handleKeydown);
    }
    this.#clear?.removeEventListener('mousedown', this.#handleMouseDown);
    this.#calendar.removeEventListener('pointerdown', this.#clearOpenRing, true);
    this.#clearOpenRing();
    this.#calendar.removeEventListener('focusin', this.#handleDayFocus);
    this.#calendar.removeEventListener('cm:select-value-change', this.#handleTimeChange);
    this.#unmountTimeControls();
    this.#root.ownerDocument.removeEventListener('click', this.#dismissOutside, true);
    this.#root.ownerDocument.removeEventListener('focusin', this.#dismissOutside);
    this.#releasePlacement();
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  #currentDates(): string[] {
    if (this.#mode !== 'single' || !this.#input) return this.#selectedDates;
    const date = this.#modelDate(this.#input.value);
    return date ? [date] : [];
  }

  #modelDate(date: string): string {
    if (this.#hasTime) return normalizeCalendarDateTime(date) ?? '';
    return parseCalendarValue(date, this.#precision) ? date : '';
  }

  #dayValue(value: string | undefined): string | undefined {
    return this.#precision === 'day' ? value?.slice(0, 10) : value;
  }

  #timeSettings(): CmCalendarTimeOptions {
    return {
      min: this.#trigger.dataset.cmMin,
      max: this.#trigger.dataset.cmMax,
      minuteStep: calendarMinuteStep(Number(this.#trigger.dataset.cmDatePickerMinuteStep)),
    };
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
    const date = this.#boundDate(
      this.#dayValue(this.#currentDates()[0]) ?? formatCalendarValue(new Date(), this.#precision),
    );
    return this.#hasTime ? calendarNearestAvailableDay(date, this.#timeSettings()) : date;
  }

  #boundDate(value: string): string {
    return boundCalendarDate(
      value,
      this.#dayValue(this.#trigger.dataset.cmMin),
      this.#dayValue(this.#trigger.dataset.cmMax),
    );
  }

  #adjacentPeriod(delta: number): string | null {
    const target = calendarAdjacentPeriod(
      this.#visibleMonth,
      delta,
      this.#precision,
      this.#yearStart,
      this.#dayValue(this.#trigger.dataset.cmMin),
      this.#dayValue(this.#trigger.dataset.cmMax),
    );
    if (!this.#hasTime || target === null) return target;
    const times = this.#timeSettings();
    const available = calendarNearestAvailableDay(target, times);
    return available.slice(0, 7) !== this.#visibleMonth.slice(0, 7) && calendarDateHasTime(available, times)
      ? available
      : null;
  }

  #firstDayOfWeek(): CmCalendarWeekday {
    const value = Number(this.#trigger.dataset.cmFirstDayOfWeek);
    return Number.isInteger(value) && value >= 0 && value <= 6 ? (value as CmCalendarWeekday) : 0;
  }

  readonly #handleMouseDown = (event: Event): void => {
    if ((event.target as Element | null)?.closest(clearSelector)) event.preventDefault();
  };

  readonly #clearOpenRing = (): void => {
    this.#trigger.removeAttribute(openRingAttribute);
  };

  readonly #dismissOutside = (event: Event): void => {
    const path = event.composedPath();
    if (!this.#calendar.hidden && !path.includes(this.#root) && !path.includes(this.#calendar)) {
      this.#setOpen(false, false);
    }
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
      this.#changePeriod(-1);
      return;
    }

    if (target.closest(nextSelector)) {
      this.#changePeriod(1);
      return;
    }

    const day = target.closest<HTMLButtonElement>(daySelector);
    const value = day?.dataset.cmDatePickerValue;
    if (day && !day.disabled && value) {
      if (this.#hasTime) {
        this.#prepareTime(value, this.#draftTime ?? 0);
        if (this.#draftTime === null) return;
        this.#commit(
          selectCalendarDateTime(this.#currentDates(), formatCalendarDateTime(value, this.#draftTime), this.#mode),
        );
        this.#moveFocus(value);
        return;
      }
      const next = selectCalendarDate(this.#currentDates(), value, this.#mode);
      this.#commit(next);
      if (this.#mode === 'single' || (this.#mode === 'range' && next.length === 2)) this.#setOpen(false, true);
      else this.#moveFocus(value);
      return;
    }

    if (target.closest(triggerSelector)) this.#setOpen(this.#calendar.hidden, false);
  };

  readonly #handleKeydown = (event: Event): void => {
    if (event.defaultPrevented) return;
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
    const target = calendarGridKeyTarget(value, key, this.#precision, this.#firstDayOfWeek(), this.#yearStart, rtl);
    if (target === null) return;
    event.preventDefault();
    if (
      parseCalendarValue(target, this.#precision) &&
      this.#boundDate(target) === target &&
      (!this.#hasTime || calendarDateHasTime(target, this.#timeSettings()))
    ) {
      this.#moveFocus(target);
    }
  };

  readonly #handleTimeChange = (event: Event): void => {
    const hourChange = event.target === this.#hourSelect?.root;
    if (!hourChange && event.target !== this.#minuteSelect?.root) return;
    event.stopPropagation();
    if (
      this.#calendar.hidden ||
      this.#draftTime === null ||
      this.#trigger.disabled ||
      this.#trigger.getAttribute('aria-readonly') === 'true'
    ) {
      return;
    }
    const times = calendarTimesForDay(this.#draftDay, this.#timeSettings());
    const choice = Number((event as CustomEvent<SelectValueChangeDetail>).detail.value);
    const time = hourChange
      ? nearestCalendarTime(
          times.filter((value) => Math.floor(value / 60) === choice),
          choice * 60 + (this.#draftTime % 60),
        )
      : Math.floor(this.#draftTime / 60) * 60 + choice;
    if (time === null || !times.includes(time)) return;
    this.#draftTime = time;
    this.#renderTime(times);
    const dates = updateCalendarDateTime(
      this.#currentDates(),
      formatCalendarDateTime(this.#draftDay, time),
      this.#mode,
    );
    if (dates) this.#commit(dates);
  };

  #prepareTime(day: string, preferred: number): void {
    this.#draftDay = day;
    const times = calendarTimesForDay(day, this.#timeSettings());
    this.#draftTime = nearestCalendarTime(times, preferred);
    this.#renderTime(times);
  }

  #renderTime(times: readonly number[]): void {
    if (!this.#hourSelect || !this.#minuteSelect) return;
    const hour = this.#draftTime === null ? -1 : Math.floor(this.#draftTime / 60);
    const minute = this.#draftTime === null ? -1 : this.#draftTime % 60;
    const hours = new Set(times.map((time) => Math.floor(time / 60)));
    const minutes = new Set(times.filter((time) => Math.floor(time / 60) === hour).map((time) => time % 60));
    this.#timeOptions(this.#hourSelect, 24, 1, hours, hour);
    this.#timeOptions(this.#minuteSelect, 60, this.#timeSettings().minuteStep, minutes, minute);
  }

  #timeOptions(select: TimeSelect, limit: number, step: number, allowed: ReadonlySet<number>, selected: number): void {
    const count = Math.ceil(limit / step);
    for (let index = 0; index < count; index += 1) {
      const value = index * step;
      let option = select.listbox.children[index] as HTMLButtonElement | undefined;
      if (!option) {
        option = select.listbox.ownerDocument.createElement('button');
        option.type = 'button';
        option.tabIndex = -1;
        option.className = 'cm-select__option';
        option.setAttribute('role', 'option');
        select.listbox.append(option);
      }
      option.dataset.cmSelectValue = String(value);
      option.textContent = String(value).padStart(2, '0');
      if (allowed.has(value)) option.removeAttribute('aria-disabled');
      else option.setAttribute('aria-disabled', 'true');
      option.setAttribute('aria-selected', String(value === selected));
      option.classList.toggle('cm-select__option--selected', value === selected);
    }
    while (select.listbox.children.length > count) select.listbox.lastElementChild?.remove();
    select.trigger.disabled = selected < 0;
    if (selected < 0) delete select.trigger.dataset.cmFilled;
    else select.trigger.dataset.cmFilled = 'true';
    select.value.textContent = selected < 0 ? '' : String(selected).padStart(2, '0');
  }

  #unmountTimeControls(): void {
    for (const select of [this.#hourSelect, this.#minuteSelect]) {
      select?.controller.disconnect();
      select?.root.remove();
    }
    this.#hourSelect = this.#minuteSelect = null;
  }

  #changePeriod(delta: number): void {
    const target = this.#adjacentPeriod(delta);
    if (target !== null) this.#moveFocus(target);
  }

  #moveFocus(value: string): void {
    if (this.#precision === 'year') this.#yearStart = calendarYearRangeStart(value, this.#yearStart);
    this.#focusedDate = value;
    this.#visibleMonth = value;
    this.#renderGrid();
    this.#focusDay();
  }

  #focusDay(): void {
    const day = this.#calendar.querySelector<HTMLButtonElement>(`${daySelector}[tabindex="0"]`);
    (day ?? this.#calendar).focus();
    day?.scrollIntoView?.({ block: 'nearest' });
  }

  #renderGrid(): void {
    const days = this.#calendar.querySelector<HTMLElement>(daysSelector);
    if (!days) return;

    const month = this.#calendar.querySelector<HTMLElement>(monthSelector);
    const locale = this.#trigger.dataset.cmLocale;
    if (month) month.textContent = calendarGridTitle(this.#visibleMonth, this.#precision, this.#yearStart, locale);
    if (this.#precision === 'day') {
      const weekdays = weekdayLabels(this.#firstDayOfWeek(), locale);
      this.#calendar.querySelectorAll<HTMLElement>('[role="columnheader"]').forEach((header, index) => {
        if (weekdays[index] !== undefined) header.textContent = weekdays[index];
      });
    }
    const previous = this.#calendar.querySelector<HTMLButtonElement>(previousSelector);
    const next = this.#calendar.querySelector<HTMLButtonElement>(nextSelector);
    if (previous) previous.disabled = this.#adjacentPeriod(-1) === null;
    if (next) next.disabled = this.#adjacentPeriod(1) === null;

    const weeks = buildCalendarGrid({
      max: this.#dayValue(this.#trigger.dataset.cmMax),
      min: this.#dayValue(this.#trigger.dataset.cmMin),
      month: this.#visibleMonth,
      selected: this.#currentDates().map((date) => this.#dayValue(date) ?? date),
      range: this.#mode === 'range',
      firstDayOfWeek: this.#firstDayOfWeek(),
      locale,
      precision: this.#precision,
      yearStart: this.#yearStart,
    });

    // The server renders the calendar's scaffolding only: a grid built from the current date would
    // make its markup depend on the day it was rendered. The cells are built here on first open.
    const cells = [...days.querySelectorAll<HTMLButtonElement>(daySelector)];
    if (cells.length === 0) {
      const document_ = this.#root.ownerDocument;
      for (const week of weeks) {
        const row = document_.createElement('div');
        row.className = 'cm-date-picker__week';
        row.setAttribute('role', 'row');
        for (let day = 0; day < week.length; day += 1) {
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
      cell.disabled = day.disabled || (this.#hasTime && !calendarDateHasTime(day.value, this.#timeSettings()));
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
      cell.tabIndex = !cell.disabled && day.value === this.#focusedDate ? 0 : -1;
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
                formatDisplayDate(
                  date,
                  this.#trigger.dataset.cmLocale,
                  this.#trigger.dataset.cmDisplayFormat,
                  this.#precision,
                ),
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
      this.#yearStart = calendarYearRangeStart(this.#visibleMonth);
    }
    if (changed) this.#synchronize(open);
    if (changed && open) this.#focusDay();
    if (restoreFocus) this.#trigger.focus();
    if (changed) dispatchCmEvent(this.#root, 'date-picker-open-change', { open });
  }

  #synchronize(open: boolean): void {
    const closing = !open && !this.#calendar.hidden;
    this.#trigger.setAttribute('aria-expanded', String(open));
    this.#trigger.toggleAttribute(openRingAttribute, open);
    this.#calendar.hidden = !open;
    if (open) {
      this.#calendar.tabIndex = -1;
      if (this.#hasTime && this.#hourHost && this.#minuteHost) {
        const id = `${this.#calendar.id}-time`;
        this.#hourSelect = mountTimeSelect(this.#hourHost, `${id}-hour`, 'Hour');
        this.#minuteSelect = mountTimeSelect(this.#minuteHost, `${id}-minute`, 'Minute');
        const now = new Date();
        this.#prepareTime(
          this.#focusedDate,
          calendarTimeValue(this.#currentDates()[0] ?? '') ?? now.getHours() * 60 + now.getMinutes(),
        );
      }
      this.#renderGrid();
      this.#holdPlacement();
    } else {
      this.#unmountTimeControls();
      this.#calendar.removeAttribute('tabindex');
      if (closing) afterCmFloatingExit(this.#calendar, () => this.#releasePlacement());
    }
  }

  #holdPlacement(): void {
    if (this.#stopAutoUpdate) return;
    const calendar = this.#calendar;
    const placement = this.#trigger.dataset.cmDatePickerPlacement === 'bottom-end' ? 'bottom-end' : 'bottom-start';
    const target = this.#portalTarget();
    const origin = target ? calendar.ownerDocument.createComment('date-picker') : null;
    if (target && origin) {
      calendar.before(origin);
      target.append(calendar);
      calendar.setAttribute('data-cm-date-picker-portaled', '');
    }
    const stop = attachCmAnchoredPosition(
      this.#trigger,
      calendar,
      placement,
      2,
      target ? null : calendar.parentElement,
    );
    this.#stopAutoUpdate = () => {
      stop();
      if (origin) {
        calendar.removeAttribute('data-cm-date-picker-portaled');
        if (origin.parentNode) origin.replaceWith(calendar);
        else calendar.remove();
      }
    };
  }

  #portalTarget(): Element | null {
    return resolveCmAnchoredTarget(this.#root, this.#trigger.dataset.cmDatePickerTeleportTo);
  }

  #releasePlacement(): void {
    this.#stopAutoUpdate?.();
    this.#stopAutoUpdate = null;
  }
}

export const createCmDatePickerController: CmControllerFactory = (element) => new CmDatePickerController(element);
