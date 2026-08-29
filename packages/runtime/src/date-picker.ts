import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface DatePickerValueChangeDetail {
  value: string;
}

const triggerSelector = '.cm-date-picker';
const calendarSelector = '.cm-date-picker__calendar[role="dialog"]';
const clearSelector = '[data-cm-date-picker-clear]';
const daysSelector = '[data-cm-date-picker-days]';
const monthSelector = '[data-cm-date-picker-month]';
const valueSelector = '.cm-date-picker__value';
const hiddenInputSelector = 'input[type="hidden"]';

const displayFormatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/u;

function formatIso(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIso(value: string): Date | null {
  const match = isoPattern.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatIso(date) === value ? date : null;
}

export class CmDatePickerController implements CmController {
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;
  readonly #calendar: HTMLElement;
  readonly #clear: HTMLButtonElement | null;
  readonly #input: HTMLInputElement | null;
  #visibleMonth: string;
  #stopAutoUpdate: (() => void) | null = null;

  constructor(root: Element) {
    const trigger = root.querySelector<HTMLButtonElement>(triggerSelector);
    const calendar = root.querySelector<HTMLElement>(calendarSelector);
    if (!trigger || !calendar) throw new TypeError('DatePicker controller requires a trigger and calendar.');
    this.#root = root;
    this.#trigger = trigger;
    this.#calendar = calendar;
    this.#clear = root.querySelector<HTMLButtonElement>(clearSelector);
    this.#input = root.querySelector<HTMLInputElement>(hiddenInputSelector);
    this.#visibleMonth = this.#currentValue() || formatIso(new Date());
  }

  connect(): void {
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('keydown', this.#handleKeydown);
    this.#root.addEventListener('mousedown', this.#handleMouseDown);
    this.#root.ownerDocument.addEventListener('click', this.#handleDocumentClick);
    this.#synchronize(this.#trigger.getAttribute('aria-expanded') === 'true');
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('keydown', this.#handleKeydown);
    this.#root.removeEventListener('mousedown', this.#handleMouseDown);
    this.#root.ownerDocument.removeEventListener('click', this.#handleDocumentClick);
    this.#releasePlacement();
  }

  #currentValue(): string {
    return this.#input?.value ?? '';
  }

  readonly #handleMouseDown = (event: Event): void => {
    if ((event.target as Element | null)?.closest(clearSelector)) event.preventDefault();
  };

  readonly #handleDocumentClick = (event: Event): void => {
    const target = event.target as Node | null;
    if (target && !this.#root.contains(target)) this.#setOpen(false, false);
  };

  readonly #handleClick = (event: Event): void => {
    const target = event.target as Element | null;
    if (!target) return;

    if (target.closest(clearSelector)) {
      this.#commit('');
      this.#setOpen(false, true);
      return;
    }

    if (target.closest('[data-cm-date-picker-previous]')) {
      this.#changeMonth(-1);
      return;
    }

    if (target.closest('[data-cm-date-picker-next]')) {
      this.#changeMonth(1);
      return;
    }

    const day = target.closest<HTMLButtonElement>('[data-cm-date-picker-value]');
    if (day && !day.disabled) {
      this.#commit(day.dataset.cmDatePickerValue ?? '');
      this.#setOpen(false, true);
      return;
    }

    if (target.closest(triggerSelector)) this.#setOpen(this.#calendar.hidden, false);
  };

  readonly #handleKeydown = (event: Event): void => {
    const key = (event as KeyboardEvent).key;
    if (key === 'Escape' && !this.#calendar.hidden) {
      event.preventDefault();
      this.#setOpen(false, true);
      return;
    }
    if (this.#calendar.hidden && (event.target as Element | null)?.closest(triggerSelector)) {
      if (!['ArrowDown', 'Enter', ' '].includes(key)) return;
      event.preventDefault();
      this.#setOpen(true, false);
    }
  };

  #changeMonth(delta: number): void {
    const anchor = parseIso(this.#visibleMonth);
    if (!anchor) return;
    const shifted = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
    const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
    shifted.setDate(Math.min(anchor.getDate(), lastDay));
    this.#visibleMonth = formatIso(shifted);
    this.#renderMonth();
  }

  #renderMonth(): void {
    const anchor = parseIso(this.#visibleMonth);
    const days = this.#calendar.querySelector<HTMLElement>(daysSelector);
    if (!anchor || !days) return;

    const month = this.#calendar.querySelector<HTMLElement>(monthSelector);
    if (month) month.textContent = monthFormatter.format(anchor);

    const selected = this.#currentValue();
    const today = formatIso(new Date());
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    // The server renders the calendar's scaffolding only: a grid built from the current date would
    // make its markup depend on the day it was rendered. The cells are built here on first open.
    const built = [...days.querySelectorAll<HTMLButtonElement>('[data-cm-date-picker-value]')];

    const cells = built;

    if (cells.length === 0) {
      const document_ = this.#root.ownerDocument;
      for (let week = 0; week < 6; week += 1) {
        const row = document_.createElement('div');
        row.className = 'cm-date-picker__week';
        row.setAttribute('role', 'row');
        for (let day = 0; day < 7; day += 1) {
          const cell = document_.createElement('button');
          cell.className = 'cm-date-picker__day';
          cell.type = 'button';
          row.append(cell);
          cells.push(cell);
        }
        days.append(row);
      }
    }

    cells.forEach((cell, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const value = formatIso(date);
      cell.dataset.cmDatePickerValue = value;
      cell.textContent = String(date.getDate());
      const min = this.#trigger.dataset.cmMin;
      const max = this.#trigger.dataset.cmMax;
      cell.disabled = Boolean((min && value < min) || (max && value > max));
      cell.classList.toggle('cm-date-picker__day--outside', date.getMonth() !== anchor.getMonth());
      cell.classList.toggle('cm-date-picker__day--today', value === today);
      cell.classList.toggle('cm-date-picker__day--selected', value === selected && selected !== '');
      cell.setAttribute('aria-pressed', String(value === selected && selected !== ''));
    });
  }

  #commit(value: string): void {
    if (this.#input) this.#input.value = value;
    if (value !== '') this.#visibleMonth = value;

    const parsed = parseIso(value);
    const valueElement = this.#trigger.querySelector<HTMLElement>(valueSelector);
    if (valueElement) {
      valueElement.textContent = parsed
        ? displayFormatter.format(parsed)
        : (this.#trigger.dataset.cmPlaceholder ?? '');
    }
    this.#trigger.classList.toggle('cm-date-picker--placeholder', value === '');
    if (value) this.#trigger.dataset.cmFilled = 'true';
    else delete this.#trigger.dataset.cmFilled;
    if (this.#clear) this.#clear.hidden = value === '';
    this.#renderMonth();

    dispatchCmEvent<DatePickerValueChangeDetail>(this.#root, 'date-picker-value-change', { value });
    const view = this.#root.ownerDocument.defaultView;
    if (view) this.#trigger.dispatchEvent(new view.Event('change', { bubbles: true }));
  }

  #setOpen(open: boolean, restoreFocus: boolean): void {
    if (this.#trigger.disabled || this.#trigger.getAttribute('aria-readonly') === 'true') open = false;
    const changed = this.#calendar.hidden === open;
    this.#synchronize(open);
    if (restoreFocus) this.#trigger.focus();
    if (changed) dispatchCmEvent(this.#root, 'date-picker-open-change', { open });
  }

  #synchronize(open: boolean): void {
    this.#trigger.setAttribute('aria-expanded', String(open));
    this.#calendar.hidden = !open;
    if (open) {
      this.#renderMonth();
      this.#holdPlacement();
    } else {
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
