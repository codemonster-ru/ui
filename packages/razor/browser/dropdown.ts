// Browser enhancement for the server-rendered VfDropdown.
//
// The first Razor controller that owns an overlay: a menu it creates on open,
// moves out of its own root, positions with floater.js, animates in and out,
// and destroys on close. What is reproduced, in the order the reference runs
// it - order matters here, because floater.js measures the menu while its
// enter transition's first frame is still applied, and a controller that
// measured it a frame later would put it somewhere else:
//
//   - a click on the trigger toggles it; ArrowDown, Enter and Space on the
//     trigger open it with preventDefault and focus the first item - again,
//     and notifying again, when it is already open. ArrowUp, Home and End do
//     not open it. A disabled trigger does nothing and prevents nothing;
//   - opening notifies first, then renders: a fresh menu from the server's
//     pristine content - id from the trigger's aria-controls, labelled by the
//     trigger, role=menu, the arrow first - with the last placement and
//     position the previous open computed, inserted before this instance's
//     teleport anchor with `enter-from` and `enter-active`; a microtask later
//     floater.js computes the position with the reference's middleware and
//     strategy and autoUpdate starts on the trigger alone; two frames later
//     `enter-from` becomes `enter-to`, and the normal motion duration after
//     that the classes go;
//   - closing notifies, focuses the trigger, then stops autoUpdate and runs
//     the leave: `leave-from` and `leave-active`, `leave-to` two frames later,
//     removal the normal motion duration after that. A reopen while one is
//     leaving removes it at once, as Vue's transition does;
//   - inside the open menu ArrowDown, ArrowUp, Home and End move focus over
//     every [role="menuitem"] - disabled ones too - through the shared rule,
//     with preventDefault; nothing else is handled, Tab included;
//   - a click anywhere inside the menu closes it when closeOnSelect is on; a
//     document click outside the trigger and the menu closes it and focuses
//     the trigger; one listener per instance, registered at bootstrap in
//     document order, as the reference registers them at mount;
//   - Escape is a LIFO stack shared by every dropdown on the page: one
//     document keydown listener, the most recently opened entry handles an
//     Escape nobody prevented, and closes.
//
// Every open and close dispatches one bubbling `vf-dropdown:open-change` on
// the root with `{ open }`, the host's equivalent of update:open and
// openChange - including the ones the reference emits for a menu that was
// already open or already closed.
//
// Scope is deliberate and narrow. The controller mounts only roots the Razor
// adapter rendered, found by their explicit ownership marker; a Vue-rendered
// dropdown on the same page is invisible to it, and so is a copied
// `.vf-dropdown` class without the marker. Each root owns its trigger, its
// template and the one menu it holds a reference to - never a menu it finds
// by query - so a dropdown nested in another's menu is its own root.
//
// There is no floating runtime here beyond the calls the reference makes:
// computePosition and autoUpdate from the bundled floater.js, with the
// reference's arguments. The open state is the trigger's aria-expanded, read
// on every gesture; the placement and position the next open starts from are
// the only values held, because the reference holds them too.
//
// Decisions the two adapters share come from @codemonster-ru/vueforge-shared-core;
// the duration comes from the theme package, exactly as the reference reads it.
import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import type { MiddlewareType, PlacementType } from '@codemonster-ru/floater.js';
import {
  DROPDOWN_OFFSET,
  DROPDOWN_STRATEGY,
  DROPDOWN_TRIGGER_OPEN_KEYS,
  resolveDropdownArrowClasses,
  resolveDropdownArrowOffset,
  resolveDropdownFlipPlacements,
  resolveDropdownMenuClasses,
  resolveDropdownMenuNavigation,
} from '@codemonster-ru/vueforge-shared-core';
import { vfMotionDurationsMs } from '@codemonster-ru/vueforge-theme';

const ROOT_SELECTOR = '[data-vf-razor="dropdown"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-dropdown-enhanced';
const TEMPLATE_SELECTOR = ':scope > template[data-vf-razor-dropdown="menu"]';
const OPEN_CHANGE_EVENT = 'vf-dropdown:open-change';
const TRANSITION = 'vf-floating-transition';
const DURATION = vfMotionDurationsMs.normal;

// ------------------------------------------------------------- escape stack

// The reference's useEscapeKey, for this adapter's dropdowns: an entry is
// removed and pushed again whenever it activates, the single document
// listener exists only while an entry does, and only the last entry sees an
// Escape nobody has prevented.
type EscapeEntry = (event: KeyboardEvent) => void;
const escapeEntries: EscapeEntry[] = [];
let escapeListener: ((event: KeyboardEvent) => void) | null = null;

function removeEscapeEntry(entry: EscapeEntry): void {
  const index = escapeEntries.indexOf(entry);
  if (index >= 0) escapeEntries.splice(index, 1);

  if (escapeEntries.length === 0 && escapeListener) {
    document.removeEventListener('keydown', escapeListener);
    escapeListener = null;
  }
}

function activateEscapeEntry(entry: EscapeEntry): void {
  removeEscapeEntry(entry);
  escapeEntries.push(entry);

  if (escapeListener) return;

  escapeListener = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    escapeEntries[escapeEntries.length - 1]?.(event);
  };
  document.addEventListener('keydown', escapeListener);
}

// --------------------------------------------------------------- transition

/** Vue's nextFrame: the callback runs in the frame after the next one. */
function nextFrame(callback: () => void): number {
  let id = requestAnimationFrame(() => {
    id = requestAnimationFrame(callback);
  });
  return id;
}

/**
 * One menu element and the transition classes it currently carries.
 *
 * Kept beside the element because the placement classes are rewritten after
 * every computation, and the transition classes have to survive that the way
 * Vue's class patch keeps them: base classes first, transition classes after,
 * in the order they were added.
 */
interface LiveMenu {
  element: HTMLElement;
  arrow: HTMLElement;
  transition: string[];
  timers: number[];
  phase: 'entering' | 'open' | 'leaving';
}

function setTransition(menu: LiveMenu, base: string[], transition: string[]): void {
  menu.transition = transition;
  write(menu.element, 'className', [...base, ...transition].join(' '));
}

/**
 * Writes a property only when it changes, as Vue's patch does. A rewrite of
 * the same value is not free: it invalidates the element's style and repaints
 * it, and a menu repainted where the reference's is not rasterises its
 * rounded corners on a different history.
 */
function write(element: HTMLElement, property: 'className', value: string): void;
function write(element: HTMLElement, property: 'left' | 'top', value: string): void;
function write(element: HTMLElement, property: 'className' | 'left' | 'top', value: string): void {
  if (property === 'className') {
    if (element.className !== value) element.className = value;
  } else if (element.style[property] !== value) {
    element.style[property] = value;
  }
}

// ------------------------------------------------------------------ enhance

interface DropdownParts {
  root: HTMLElement;
  trigger: HTMLElement;
  /** The default slot's markup, pristine, cloned into every menu this root opens. */
  content: DocumentFragment;
  /** A menu the server rendered open, still in place. */
  serverMenu: HTMLElement | null;
  placement: string;
  variant: string;
  closeOnSelect: boolean;
  /** Where the menu goes: an element, or null for in place. */
  destination: Element | null;
  teleported: boolean;
}

function findParts(root: HTMLElement): DropdownParts | null {
  const trigger = root.querySelector<HTMLElement>(':scope > .vf-dropdown__trigger');
  if (!trigger) return null;

  const template = root.querySelector<HTMLTemplateElement>(TEMPLATE_SELECTOR);
  const serverMenu = root.querySelector<HTMLElement>(':scope > .vf-dropdown__menu');
  const content = document.createDocumentFragment();

  // The pristine content: the template's fragment for a closed render, a
  // clone of what follows the arrow for an open one. Either way every later
  // open renders the slot as the server rendered it - the freshness v-if
  // gives a Vue consumer.
  if (template) {
    content.append(template.content.cloneNode(true));
  } else if (serverMenu) {
    for (const child of [...serverMenu.childNodes].slice(1)) content.append(child.cloneNode(true));
  }

  const teleport = root.getAttribute('data-vf-razor-dropdown-teleport') ?? 'body';
  const teleported = teleport !== 'false';

  return {
    root,
    trigger,
    content,
    serverMenu,
    placement: root.getAttribute('data-vf-razor-dropdown-placement') ?? 'bottom-start',
    variant: root.getAttribute('data-vf-razor-dropdown-variant') ?? 'default',
    closeOnSelect: root.getAttribute('data-vf-razor-dropdown-close-on-select') !== 'false',
    destination: teleported ? document.querySelector(teleport) : null,
    teleported,
  };
}

function enhanceRoot(root: HTMLElement, enhanceContent: (node: ParentNode) => void): void {
  if (root.hasAttribute(ENHANCED_ATTRIBUTE)) return;

  const parts = findParts(root);
  if (!parts) return;

  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  const { trigger, content, placement, variant, closeOnSelect, destination, teleported } = parts;
  const disabled = trigger.getAttribute('aria-disabled') === 'true';
  const menuId = trigger.getAttribute('aria-controls') ?? '';

  // Where this instance's menus are inserted: before an anchor appended to
  // the destination now, at bootstrap, in document order - which is where the
  // reference's Teleport puts its anchors at mount. Menus therefore sit in the
  // destination in instance order whatever order they open in. An in-place
  // menu goes straight after the trigger.
  const anchor = teleported && destination ? destination.appendChild(document.createTextNode('')) : null;

  // The values the reference keeps between opens: the next menu renders the
  // last computed placement and position before floater.js runs again.
  let x = 0;
  let y = 0;
  let currentPlacement = placement;
  let arrowData: Record<string, number> | undefined;
  let live: LiveMenu | null = null;
  let stopAutoUpdate: (() => void) | null = null;
  let run = 0;

  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';
  const menuClasses = () => resolveDropdownMenuClasses(variant, currentPlacement);
  // The reference's menu ref is null while a menu leaves, so a leaving menu
  // has no items to walk.
  const items = () =>
    live && live.phase !== 'leaving' ? [...live.element.querySelectorAll<HTMLElement>('[role="menuitem"]')] : [];

  function notify(open: boolean): void {
    root.dispatchEvent(new CustomEvent(OPEN_CHANGE_EVENT, { bubbles: true, detail: { open } }));
  }

  function paint(menu: LiveMenu): void {
    const offsetInMenu = resolveDropdownArrowOffset(arrowData);

    setTransition(menu, menuClasses(), menu.transition);
    write(menu.element, 'left', `${x}px`);
    write(menu.element, 'top', `${y}px`);
    write(menu.arrow, 'className', resolveDropdownArrowClasses(currentPlacement).join(' '));
    write(menu.arrow, 'left', `${offsetInMenu.x}px`);
    write(menu.arrow, 'top', `${offsetInMenu.y}px`);
  }

  async function update(): Promise<void> {
    const menu = live;
    if (!menu || menu.phase === 'leaving') return;

    const result = await computePosition(trigger, menu.element, {
      placement: placement as PlacementType,
      middleware: [
        offset(DROPDOWN_OFFSET),
        flip({ placements: resolveDropdownFlipPlacements(placement) as PlacementType[] }),
        shift(),
        arrow(menu.arrow),
      ] as MiddlewareType[],
      strategy: DROPDOWN_STRATEGY,
    });

    x = result.x;
    y = result.y;
    currentPlacement = result.placement;
    arrowData = result.middlewareData?.arrow as Record<string, number> | undefined;
    if (live === menu && menu.phase !== 'leaving') paint(menu);
  }

  function stopPositioning(): void {
    run += 1;
    stopAutoUpdate?.();
    stopAutoUpdate = null;
  }

  function startPositioning(): void {
    stopPositioning();
    const current = run;

    // A microtask, as the reference's two nextTicks are: after the menu is in
    // the DOM with its enter-from frame applied, before anything is painted.
    void Promise.resolve().then(async () => {
      if (current !== run || !isOpen()) return;
      await update();
      if (current !== run || !isOpen() || !live) return;
      stopAutoUpdate = autoUpdate(trigger, () => {
        void update();
      });
    });
  }

  function enter(menu: LiveMenu): void {
    menu.phase = 'entering';
    setTransition(menu, menuClasses(), [`${TRANSITION}-enter-from`, `${TRANSITION}-enter-active`]);
    menu.timers.push(
      nextFrame(() => {
        if (menu.phase !== 'entering') return;
        setTransition(menu, menuClasses(), [`${TRANSITION}-enter-active`, `${TRANSITION}-enter-to`]);
        menu.timers.push(
          window.setTimeout(() => {
            if (menu.phase !== 'entering') return;
            menu.phase = 'open';
            setTransition(menu, menuClasses(), []);
          }, DURATION),
        );
      }),
    );
  }

  function clearTimers(menu: LiveMenu): void {
    for (const id of menu.timers) {
      cancelAnimationFrame(id);
      clearTimeout(id);
    }
    menu.timers = [];
  }

  function leave(menu: LiveMenu): void {
    clearTimers(menu);
    menu.phase = 'leaving';
    setTransition(menu, menuClasses(), [`${TRANSITION}-leave-from`]);
    // Vue forces a reflow between the two classes.
    void document.body.offsetHeight;
    setTransition(menu, menuClasses(), [`${TRANSITION}-leave-from`, `${TRANSITION}-leave-active`]);
    menu.timers.push(
      nextFrame(() => {
        // A reopen may already have removed this menu.
        if (!menu.element.isConnected) return;
        setTransition(menu, menuClasses(), [`${TRANSITION}-leave-active`, `${TRANSITION}-leave-to`]);
        menu.timers.push(
          window.setTimeout(() => {
            clearTimers(menu);
            menu.element.remove();
          }, DURATION),
        );
      }),
    );
  }

  function buildMenu(): LiveMenu {
    const element = document.createElement('div');
    element.id = menuId;
    element.setAttribute('aria-labelledby', trigger.id);
    element.setAttribute('role', 'menu');
    const arrowElement = document.createElement('span');
    arrowElement.setAttribute('aria-hidden', 'true');
    element.append(arrowElement, content.cloneNode(true));
    const menu: LiveMenu = { element, arrow: arrowElement, transition: [], timers: [], phase: 'entering' };
    paint(menu);
    attachMenuListeners(element);
    return menu;
  }

  function place(element: HTMLElement): void {
    if (!teleported) {
      trigger.after(element);
    } else if (anchor) {
      anchor.before(element);
    }
  }

  function open(focusFirstItem: boolean): void {
    if (disabled) return;

    const wasOpen = isOpen();
    if (!wasOpen) activateEscapeEntry(onEscape);
    notify(true);

    if (!wasOpen) {
      // A menu still leaving is removed at once, as Vue's transition does
      // when the same element enters again.
      if (live && live.phase === 'leaving') {
        clearTimers(live);
        live.element.remove();
      }
      trigger.setAttribute('aria-expanded', 'true');
      live = buildMenu();
      // The enter classes first and the insertion second, as Vue's
      // before-enter hook runs: the menu's first computed style is already
      // the enter-from frame, so nothing transitions into it.
      enter(live);
      place(live.element);
      enhanceContent(live.element);
    }

    // Focus is queued before the position, which is the order the reference's
    // two continuations resume in after its render.
    if (focusFirstItem) {
      void Promise.resolve().then(() => items()[0]?.focus());
    }
    if (!wasOpen) startPositioning();
  }

  function close(): void {
    const wasOpen = isOpen();
    if (wasOpen) removeEscapeEntry(onEscape);
    notify(false);
    trigger.focus();

    if (!wasOpen) return;

    trigger.setAttribute('aria-expanded', 'false');
    stopPositioning();
    if (live) leave(live);
  }

  function onEscape(event: KeyboardEvent): void {
    if (!isOpen()) return;
    event.preventDefault();
    close();
  }

  function attachMenuListeners(element: HTMLElement): void {
    element.addEventListener('click', () => {
      if (closeOnSelect) close();
    });
    element.addEventListener('keydown', (event) => {
      const list = items();
      const target = resolveDropdownMenuNavigation(
        event.key,
        list.findIndex((item) => item === document.activeElement),
        list.length,
      );
      if (target === undefined) return;
      event.preventDefault();
      list[target]?.focus();
    });
  }

  trigger.addEventListener('click', () => {
    if (disabled) return;
    if (isOpen()) close();
    else open(false);
  });

  trigger.addEventListener('keydown', (event) => {
    if (disabled) return;
    if (!DROPDOWN_TRIGGER_OPEN_KEYS.includes(event.key)) return;
    event.preventDefault();
    open(true);
  });

  // One outside listener per instance, for the life of the page, gated by the
  // open state - the reference's useClickOutside with event 'click'.
  document.addEventListener('click', (event) => {
    if (!isOpen()) return;
    const node = event.target;
    if (!(node instanceof Node)) return;
    if (trigger.contains(node) || (live && live.phase !== 'leaving' && live.element.contains(node))) return;
    close();
  });

  // A menu the server rendered open is replaced by a fresh one at its
  // destination, entered as the reference's appear transition enters it,
  // positioned, and put on the escape stack - without a notification, as the
  // reference emits nothing for its initial state. Replaced rather than
  // moved: the server's node has been painted without the enter-from frame,
  // and entering it would animate into that frame instead of out of it.
  if (isOpen()) {
    parts.serverMenu?.remove();
    activateEscapeEntry(onEscape);
    live = buildMenu();
    enter(live);
    place(live.element);
    enhanceContent(live.element);
    startPositioning();
  }
}

/**
 * Enhances every Razor-owned dropdown inside `root`.
 *
 * Idempotent: a root is enhanced once, so calling this again after inserting
 * markup only picks up the new roots. `enhanceContent` is called on each
 * freshly rendered menu so other Razor components rendered inside the slot
 * mount as they would on a fresh page.
 */
export function enhanceVueForgeDropdowns(
  root: ParentNode = document,
  enhanceContent: (node: ParentNode) => void = () => {},
): void {
  const roots =
    root instanceof Element && root.matches(ROOT_SELECTOR)
      ? [root as HTMLElement]
      : Array.from(root.querySelectorAll<HTMLElement>(ROOT_SELECTOR));

  for (const element of roots) {
    enhanceRoot(element, enhanceContent);
  }
}
