// Browser enhancement for the server-rendered VfSelect.
//
// The fourth Razor controller that owns an overlay: a listbox it creates on
// open, moves out of its own root, positions with floater.js, animates in and
// out, and destroys on close. What is reproduced, in the order the reference
// runs it:
//
//   - a click on the trigger toggles it and moves no focus on open; ArrowDown,
//     ArrowUp, Enter and Space on the trigger open it with preventDefault - and
//     again when already open. Home, End, Escape and Tab do not. A disabled
//     trigger is a disabled <button> and receives neither;
//   - opening puts the select on the page-wide escape stack at once, renders a
//     fresh listbox from the server's inert options - id from the trigger's
//     aria-controls, labelled by the trigger, role=listbox, aria-selected and
//     the selected class for the value this instance holds now - with the last
//     placement and position the previous open computed and the trigger's
//     offsetWidth as min-width, inserted before this instance's teleport
//     anchor with `enter-from` and `enter-active`; a microtask later floater.js
//     computes the position with the reference's middleware and strategy and
//     autoUpdate starts on the trigger alone; a microtask and an animation
//     frame after the insertion - the reference's nextTick and
//     requestAnimationFrame - the target option (the selected one among the
//     enabled options, else the first) is scrolled into view with the padding
//     and, for a keyboard open, focused;
//   - inside the open listbox ArrowDown, ArrowUp, Home and End move real DOM
//     focus over the enabled options through the shared rule, with
//     preventDefault; Escape closes and focuses the trigger, prevented; Enter
//     and Space select the focused option, prevented, and focus the trigger;
//     nothing else is handled, Tab included - the listbox stays open;
//   - an option click selects without focusing the trigger; a document click
//     outside the trigger and the listbox closes without focusing anything;
//     one listener per instance, registered at bootstrap in document order,
//     as the reference registers them at mount;
//   - the clear button prevents its mousedown, prevents and stops its click,
//     clears, closes and focuses the trigger;
//   - Escape from anywhere else is the page-wide LIFO stack in
//     escape-stack.ts, shared with every other overlay: the most recently
//     opened entry handles an Escape nobody prevented. An Escape the listbox's
//     own handler prevented never reaches it;
//   - closing takes the entry off the stack, stops autoUpdate and runs the
//     leave: `leave-from` and `leave-active`, `leave-to` two frames later,
//     removal the normal motion duration after that;
//   - unmounted by a host (disposal.ts), as a select inside a closing popover
//     is: the listbox leaves at once, without a leave, the entry leaves the
//     stack, and nothing of this instance answers again.
//
// There is no controlled mode: a selection or a clear is applied here - the
// hidden input's value, the label, the classes, data-vf-filled, the swap of
// the chevron and the clear button - after one bubbling `vf-select:value-change`
// on the root with `{ value }`, the host's equivalent of update:modelValue. A
// listbox that is leaving keeps what it showed, as the reference's does.
//
// Inside a vf-field the trigger is the field's declared control, and every
// change of `value || open` is reported to the field controller with a
// `vf-field:filled-change` on the trigger. The field owns its classes.
//
// Scope is deliberate and narrow. The controller mounts only roots the Razor
// adapter rendered, found by their explicit ownership marker; a Vue-rendered
// select on the same page is invisible to it. Each root owns its trigger, its
// templates and the one listbox it holds a reference to - never a listbox it
// finds by query. There is no aria-activedescendant and no typeahead: the
// reference has neither.
//
// Decisions the two adapters share come from @codemonster-ru/vueforge-shared-core;
// the duration comes from the theme package, exactly as the reference reads it.
import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import type { MiddlewareType, PlacementType } from '@codemonster-ru/floater.js';
import {
  SELECT_OFFSET,
  SELECT_STRATEGY,
  SELECT_TRIGGER_OPEN_KEYS,
  resolveSelectDisplayLabel,
  resolveSelectFieldFilled,
  resolveSelectFlipPlacements,
  resolveSelectFocusIndex,
  resolveSelectHasClearControl,
  resolveSelectHasValue,
  resolveSelectMenuClasses,
  resolveSelectMenuNavigation,
  resolveSelectScrollTop,
  resolveSelectSelectedOption,
  resolveSelectTriggerClasses,
  resolveSelectWrapperClasses,
} from '@codemonster-ru/vueforge-shared-core';
import { vfMotionDurationsMs } from '@codemonster-ru/vueforge-theme';
import { registerDisposal } from './disposal.js';
import { activateEscapeEntry, removeEscapeEntry } from './escape-stack.js';

const ROOT_SELECTOR = '[data-vf-razor="select"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-select-enhanced';
const VALUE_CHANGE_EVENT = 'vf-select:value-change';
const FIELD_FILLED_EVENT = 'vf-field:filled-change';
const TRANSITION = 'vf-floating-transition';
const DURATION = vfMotionDurationsMs.normal;

/** Vue's nextFrame: the callback runs in the frame after the next one. */
function nextFrame(callback: () => void): number {
  let id = requestAnimationFrame(() => {
    id = requestAnimationFrame(callback);
  });
  return id;
}

interface LiveListbox {
  element: HTMLElement;
  transition: string[];
  timers: number[];
  phase: 'entering' | 'open' | 'leaving';
}

/** Writes a class list or a style property only when it changes, as Vue's patch does. */
function write(element: HTMLElement, property: 'className' | 'left' | 'top' | 'minWidth', value: string): void {
  if (property === 'className') {
    if (element.className !== value) element.className = value;
  } else if (element.style[property] !== value) {
    element.style[property] = value;
  }
}

interface SelectOptionData {
  value: string;
  label: string;
  disabled: boolean;
}

function enhanceRoot(root: HTMLElement): void {
  if (root.hasAttribute(ENHANCED_ATTRIBUTE)) return;

  const foundTrigger = root.querySelector<HTMLButtonElement>(':scope > button[data-vf-razor-select="trigger"]');
  const listboxTemplate = root.querySelector<HTMLTemplateElement>(':scope > template[data-vf-razor-select="listbox"]');
  if (!foundTrigger || !listboxTemplate) return;
  const trigger: HTMLButtonElement = foundTrigger;

  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  const optionMarkup = listboxTemplate.content;
  const options: SelectOptionData[] = [...optionMarkup.querySelectorAll<HTMLButtonElement>('[role="option"]')].map(
    (button) => ({
      value: button.getAttribute('data-vf-razor-select-value') ?? '',
      label: button.textContent ?? '',
      disabled: button.hasAttribute('disabled'),
    }),
  );
  const chevronTemplate = root.querySelector<HTMLTemplateElement>(':scope > template[data-vf-razor-select="chevron"]');
  const clearTemplate = root.querySelector<HTMLTemplateElement>(':scope > template[data-vf-razor-select="clear"]');
  const hidden = root.querySelector<HTMLInputElement>(':scope > input[type="hidden"]');
  const valueSpan = trigger.querySelector<HTMLElement>(':scope > .vf-select__value');
  const disabled = trigger.disabled;
  const placement = root.getAttribute('data-vf-razor-select-placement') ?? 'bottom-start';
  const placeholder = root.getAttribute('data-vf-razor-select-placeholder') ?? undefined;
  const floating = root.getAttribute('data-vf-razor-select-floating') === 'true';
  const clearable = root.getAttribute('data-vf-razor-select-clearable') === 'true';
  const size = root.getAttribute('data-vf-razor-select-size') ?? 'md';
  const invalid = root.getAttribute('data-vf-razor-select-invalid') === 'true';
  // Attributes the consumer forwarded over the component's own: the
  // reference binds them after its own, so they win on every render.
  const forwarded = new Set((root.getAttribute('data-vf-razor-select-forwarded') ?? '').split(' ').filter(Boolean));
  const reportsToField = trigger.hasAttribute('data-vf-razor-field-control');
  const hasLeading = trigger.querySelector(':scope > .vf-select__icon--leading') !== null;
  const hasTrailing = trigger.querySelector(':scope > .vf-select__icon--trailing') !== null;
  const listboxId = trigger.getAttribute('aria-controls') ?? '';
  const teleport = root.getAttribute('data-vf-razor-select-teleport') ?? 'body';
  const teleported = teleport !== 'false';
  const destination = teleported ? document.querySelector(teleport) : null;
  // Where this instance's listboxes are inserted: before an anchor appended
  // to the destination now, at bootstrap, in document order - where the
  // reference's Teleport puts its anchors at mount.
  const anchor = teleported && destination ? destination.appendChild(document.createTextNode('')) : null;

  let value = root.getAttribute('data-vf-razor-select-value') ?? '';
  const classState = () => ({
    size,
    hasLeading,
    hasTrailing,
    hasClear: resolveSelectHasClearControl(clearable, resolveSelectHasValue(value), disabled),
    floating,
  });
  // The consumer's class, as the server appended it after the computed ones.
  const serverClasses = resolveSelectWrapperClasses(classState()).join(' ');
  const consumerClass = root.className.startsWith(serverClasses)
    ? root.className.slice(serverClasses.length).trim()
    : '';

  let clearButton = root.querySelector<HTMLButtonElement>(':scope > .vf-select-wrap__clear');
  let x = 0;
  let y = 0;
  let currentPlacement = placement;
  let live: LiveListbox | null = null;
  let stopAutoUpdate: (() => void) | null = null;
  let run = 0;
  let disposed = false;
  // Held here rather than read back from aria-expanded, which a consumer may
  // have forwarded over the component's own.
  let opened = false;

  const isOpen = () => opened;
  // The reference's listbox ref is null while a listbox leaves, so a leaving
  // listbox has no options to walk or scroll.
  const items = () =>
    live && live.phase !== 'leaving'
      ? [...live.element.querySelectorAll<HTMLElement>('[role="option"]:not(:disabled)')]
      : [];

  // ----------------------------------------------------------------- state

  function writeState(): void {
    const state = classState();
    const hasValue = resolveSelectHasValue(value);
    const selected = resolveSelectSelectedOption(options, value);

    write(root, 'className', [...resolveSelectWrapperClasses(state), consumerClass].filter(Boolean).join(' '));
    write(
      trigger,
      'className',
      resolveSelectTriggerClasses({
        ...state,
        invalid,
        open: isOpen(),
        hasSelection: selected !== undefined,
        placeholder,
      }).join(' '),
    );
    if (!forwarded.has('data-vf-filled')) {
      if (hasValue) trigger.setAttribute('data-vf-filled', 'true');
      else trigger.removeAttribute('data-vf-filled');
    }
    if (valueSpan) {
      const label = resolveSelectDisplayLabel(selected?.label, floating, placeholder);
      if (valueSpan.textContent !== label) valueSpan.textContent = label;
    }
    if (hidden && hidden.value !== value) hidden.value = value;
    swapClear(state.hasClear);
  }

  /** The chevron and the clear button, one or the other, as the reference renders them. */
  function swapClear(hasClear: boolean): void {
    if (!chevronTemplate || !clearTemplate) return;

    if (hasClear && !clearButton) {
      trigger.querySelector(':scope > .vf-select__icon--chevron')?.remove();
      clearButton = clearTemplate.content.firstElementChild?.cloneNode(true) as HTMLButtonElement;
      attachClearListeners(clearButton);
      trigger.after(clearButton);
    } else if (!hasClear && clearButton) {
      clearButton.remove();
      clearButton = null;
      trigger.append(chevronTemplate.content.cloneNode(true));
    }
  }

  function reportFilled(): void {
    if (!reportsToField) return;
    trigger.dispatchEvent(
      new CustomEvent(FIELD_FILLED_EVENT, {
        detail: { filled: resolveSelectFieldFilled(resolveSelectHasValue(value), isOpen()) },
      }),
    );
  }

  function setOpenState(open: boolean): void {
    opened = open;
    if (!forwarded.has('aria-expanded')) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    writeState();
    reportFilled();
  }

  function applyValue(next: string): void {
    root.dispatchEvent(new CustomEvent(VALUE_CHANGE_EVENT, { bubbles: true, detail: { value: next } }));
    value = next;
    writeState();
    reportFilled();
  }

  // -------------------------------------------------------------- floating

  function paint(listbox: LiveListbox): void {
    write(
      listbox.element,
      'className',
      [...resolveSelectMenuClasses(currentPlacement), ...listbox.transition].join(' '),
    );
    write(listbox.element, 'left', `${x}px`);
    write(listbox.element, 'top', `${y}px`);
    write(listbox.element, 'minWidth', `${trigger.offsetWidth}px`);
  }

  async function update(): Promise<void> {
    const listbox = live;
    if (!listbox || listbox.phase === 'leaving') return;

    const result = await computePosition(trigger, listbox.element, {
      placement: placement as PlacementType,
      middleware: [
        offset(SELECT_OFFSET),
        flip({ placements: resolveSelectFlipPlacements(placement) as PlacementType[] }),
        shift(),
      ] as MiddlewareType[],
      strategy: SELECT_STRATEGY,
    });

    x = result.x;
    y = result.y;
    currentPlacement = result.placement;
    // The listbox may have started leaving while floater.js computed.
    if (live === listbox && (listbox.phase as LiveListbox['phase']) !== 'leaving') paint(listbox);
  }

  function stopPositioning(): void {
    run += 1;
    stopAutoUpdate?.();
    stopAutoUpdate = null;
  }

  function startPositioning(): void {
    stopPositioning();
    const current = run;

    void Promise.resolve().then(async () => {
      if (current !== run || !isOpen()) return;
      await update();
      if (current !== run || !isOpen() || !live) return;
      stopAutoUpdate = autoUpdate(trigger, () => {
        void update();
      });
    });
  }

  // ------------------------------------------------------------ transition

  function setTransition(listbox: LiveListbox, transition: string[]): void {
    listbox.transition = transition;
    paintClasses(listbox);
  }

  function paintClasses(listbox: LiveListbox): void {
    write(
      listbox.element,
      'className',
      [...resolveSelectMenuClasses(currentPlacement), ...listbox.transition].join(' '),
    );
  }

  function enter(listbox: LiveListbox): void {
    listbox.phase = 'entering';
    setTransition(listbox, [`${TRANSITION}-enter-from`, `${TRANSITION}-enter-active`]);
    listbox.timers.push(
      nextFrame(() => {
        if (listbox.phase !== 'entering') return;
        setTransition(listbox, [`${TRANSITION}-enter-active`, `${TRANSITION}-enter-to`]);
        listbox.timers.push(
          window.setTimeout(() => {
            if (listbox.phase !== 'entering') return;
            listbox.phase = 'open';
            setTransition(listbox, []);
          }, DURATION),
        );
      }),
    );
  }

  function clearTimers(listbox: LiveListbox): void {
    for (const id of listbox.timers) {
      cancelAnimationFrame(id);
      clearTimeout(id);
    }
    listbox.timers = [];
  }

  function leave(listbox: LiveListbox): void {
    clearTimers(listbox);
    listbox.phase = 'leaving';
    setTransition(listbox, [`${TRANSITION}-leave-from`]);
    // Vue forces a reflow between the two classes.
    void document.body.offsetHeight;
    setTransition(listbox, [`${TRANSITION}-leave-from`, `${TRANSITION}-leave-active`]);
    listbox.timers.push(
      nextFrame(() => {
        if (!listbox.element.isConnected) return;
        setTransition(listbox, [`${TRANSITION}-leave-active`, `${TRANSITION}-leave-to`]);
        listbox.timers.push(
          window.setTimeout(() => {
            clearTimers(listbox);
            listbox.element.remove();
          }, DURATION),
        );
      }),
    );
  }

  // --------------------------------------------------------------- listbox

  function buildListbox(): LiveListbox {
    const element = document.createElement('div');
    element.id = listboxId;
    element.setAttribute('aria-labelledby', trigger.id);
    element.setAttribute('role', 'listbox');
    const fragment = optionMarkup.cloneNode(true) as DocumentFragment;
    for (const option of fragment.querySelectorAll<HTMLElement>('[role="option"]')) {
      const selected = option.getAttribute('data-vf-razor-select-value') === value;
      option.className = [
        'vf-dropdown__item',
        'vf-select__option',
        ...(selected ? ['vf-select__option--selected'] : []),
      ].join(' ');
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
    }
    element.append(fragment);
    const listbox: LiveListbox = { element, transition: [], timers: [], phase: 'entering' };
    paint(listbox);
    attachListboxListeners(listbox);
    return listbox;
  }

  function place(element: HTMLElement): void {
    if (!teleported) {
      root.append(element);
    } else if (anchor) {
      anchor.before(element);
    }
  }

  /** The reference's syncSelectedIntoView: a nextTick and a frame after the render. */
  function syncIntoView(focus: boolean): void {
    void Promise.resolve().then(() => {
      requestAnimationFrame(() => {
        if (disposed) return;
        const target = items()[resolveSelectFocusIndex(options, value)];
        if (!target) return;
        const listbox = live?.element;
        if (listbox) {
          const scrollTop = resolveSelectScrollTop({
            top: target.offsetTop,
            height: target.offsetHeight,
            scrollTop: listbox.scrollTop,
            clientHeight: listbox.clientHeight,
          });
          if (scrollTop !== undefined) listbox.scrollTop = scrollTop;
        }
        if (focus) target.focus();
      });
    });
  }

  function open(focusSelected: boolean): void {
    if (disabled || disposed) return;

    if (!isOpen()) {
      activateEscapeEntry(onEscape);
      if (live && live.phase === 'leaving') {
        clearTimers(live);
        live.element.remove();
      }
      setOpenState(true);
      live = buildListbox();
      enter(live);
      place(live.element);
      startPositioning();
    }

    syncIntoView(focusSelected);
  }

  function close(restoreFocus: boolean): void {
    if (isOpen()) {
      removeEscapeEntry(onEscape);
      setOpenState(false);
      stopPositioning();
      if (live) leave(live);
    }

    if (restoreFocus) trigger.focus();
  }

  function select(option: SelectOptionData, restoreFocus: boolean): void {
    if (option.disabled) return;
    applyValue(option.value);
    close(restoreFocus);
  }

  function onEscape(event: KeyboardEvent): void {
    if (!isOpen()) return;
    event.preventDefault();
    close(true);
  }

  function attachListboxListeners(listbox: LiveListbox): void {
    listbox.element.addEventListener('keydown', (event) => {
      if (disposed) return;
      const list = items();
      const currentIndex = list.findIndex((item) => item === document.activeElement);
      const target = resolveSelectMenuNavigation(event.key, currentIndex, list.length);

      if (target !== undefined) {
        event.preventDefault();
        list[target]?.focus();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        const option = options.filter((item) => !item.disabled)[currentIndex];
        if (!option) return;
        event.preventDefault();
        select(option, true);
      }
    });

    // By position, not by value: duplicate values are separate options.
    listbox.element.querySelectorAll<HTMLElement>('[role="option"]').forEach((button, index) => {
      button.addEventListener('click', () => {
        if (disposed) return;
        const option = options[index];
        if (option) select(option, false);
      });
    });
  }

  function attachClearListeners(button: HTMLButtonElement): void {
    button.addEventListener('mousedown', (event) => event.preventDefault());
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (disposed || disabled || !resolveSelectHasClearControl(clearable, resolveSelectHasValue(value), disabled)) {
        return;
      }
      applyValue('');
      close(true);
    });
  }

  if (clearButton) attachClearListeners(clearButton);

  trigger.addEventListener('click', () => {
    if (disabled || disposed) return;
    if (isOpen()) close(true);
    else open(false);
  });

  trigger.addEventListener('keydown', (event) => {
    if (disabled || disposed) return;
    if (!SELECT_TRIGGER_OPEN_KEYS.includes(event.key)) return;
    event.preventDefault();
    open(true);
  });

  // One outside listener per instance, for the life of the page, gated by the
  // open state - the reference's useClickOutside with event 'click'.
  document.addEventListener('click', (event) => {
    if (disposed || !isOpen()) return;
    const node = event.target;
    if (!(node instanceof Node)) return;
    if (trigger.contains(node) || (live && live.phase !== 'leaving' && live.element.contains(node))) return;
    close(false);
  });

  registerDisposal(root, () => {
    disposed = true;
    removeEscapeEntry(onEscape);
    stopPositioning();
    if (live) {
      clearTimers(live);
      if (teleported) live.element.remove();
      live = null;
    }
    anchor?.remove();
  });
}

/**
 * Enhances every Razor-owned select inside `root`.
 *
 * Idempotent: a root is enhanced once, so calling this again after inserting
 * markup only picks up the new roots.
 */
export function enhanceVueForgeSelects(root: ParentNode = document): void {
  const roots =
    root instanceof Element && root.matches(ROOT_SELECTOR)
      ? [root as HTMLElement]
      : Array.from(root.querySelectorAll<HTMLElement>(ROOT_SELECTOR));

  for (const element of roots) {
    enhanceRoot(element);
  }
}
