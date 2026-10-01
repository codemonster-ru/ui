// Browser enhancement for the server-rendered VfNavMenu.
//
// The reference is a tree whose state lives in its root - the active value and
// the list of expanded values - and whose branches open and close through
// Vue's <Transition>. What is reproduced, rule for rule and hook for hook:
//
//   - a branch click toggles its value; in single mode opening first closes
//     the sibling branches and every branch below them. A branch click emits
//     nothing;
//   - an enabled leaf click - button or link - makes its value active, adds
//     its ancestry to the expanded values and dispatches one bubbling
//     `vf-nav-menu:change` on the root with `{ value }`, every time, also on
//     the active leaf; the link's navigation is left alone. A disabled link's
//     click is prevented and does nothing else;
//   - after every change every rendered node is repainted from the shared
//     rules: the li classes, aria-expanded and the chevron of a branch,
//     aria-current and the classes of a leaf;
//   - a branch that becomes expanded renders its collapse from the server's
//     pristine template and runs Vue's enter: the hooks' inline transition,
//     overflow, height 0 and opacity 0 with `v-enter-from v-enter-active`;
//     the scroll height and full opacity a frame later; `v-enter-to` the
//     frame after; and the end - one `transitionend` per listed duration on
//     the element itself, or a timeout of the longest computed duration plus
//     one millisecond - removes the classes and clears every inline
//     declaration. A branch that becomes collapsed runs Vue's leave the same
//     way and removes the subtree at its end. A subtree rendered inside an
//     entering one renders without a transition, as a Transition that has
//     just mounted does; a subtree that is leaving is frozen. Reversals follow
//     Vue: closing while entering cancels the enter, reopening while leaving
//     removes the leaving subtree at once;
//   - compactness: on enhancement, and on every ResizeObserver callback for
//     the root and the probe, the sidebar is measured against the probe.
//     Without ResizeObserver, window resize.
//
// Nothing here depends on the overlay controllers: no escape stack, no
// floater.js, no shared timer. Animation frames and timeouts are two id
// spaces, so each controller keeps its own two sets and cancels each id with
// its own API - see the M32 select defect.
//
// Scope is the ownership marker: a root the Razor adapter rendered, never a
// Vue-rendered `.vf-nav-menu`, and only its own nodes.
import {
  NAV_MENU_COLLAPSE_TRANSITION,
  resolveNavMenuBranchClasses,
  resolveNavMenuCompact,
  resolveNavMenuHasDescendant,
  resolveNavMenuIconClasses,
  resolveNavMenuIsBranch,
  resolveNavMenuIsSimple,
  resolveNavMenuLeafClasses,
  resolveNavMenuMeasuredCompact,
  resolveNavMenuNodeClasses,
  resolveNavMenuRootClasses,
  resolveNavMenuSyncedExpandedValues,
  resolveNavMenuToggledExpandedValues,
  type VfNavMenuItemLike,
} from '@codemonster-ru/vueforge-shared-core';
import { registerDisposal } from './disposal.js';

const ROOT_SELECTOR = '[data-vf-razor="nav-menu"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-nav-menu-enhanced';
const PATH_ATTRIBUTE = 'data-vf-razor-nav-menu-path';
const TEMPLATE_SELECTOR = ':scope > template[data-vf-razor-nav-menu="collapse"]';
const CHANGE_EVENT = 'vf-nav-menu:change';

/** Writes a class list only when it differs, as Vue patches only what changed. */
function setClass(element: HTMLElement, classes: string[]): void {
  const value = classes.join(' ');
  if (element.className !== value) element.className = value;
}

/** Writes or removes an attribute only when it differs. */
function setAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (element.getAttribute(name) === value) return;
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/** Vue's transition end ids are one counter for the page; so is this one. */
let endId = 0;

/** What Vue keeps on a transitioning element: its expandos, by name. */
interface CollapseState {
  /** el[enterCbKey]: the pending enter, called with `cancelled`. */
  enterCallback?: (cancelled: boolean) => void;
  /** el[leaveCbKey]: the pending leave, called with `cancelled`. */
  leaveCallback?: (cancelled?: boolean) => void;
  /** el._isLeaving */
  isLeaving: boolean;
  /** el._enterCancelled */
  enterCancelled?: boolean;
  /** el._endId */
  endId: number;
}

function enhanceRoot(root: HTMLElement): void {
  if (root.hasAttribute(ENHANCED_ATTRIBUTE)) return;
  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  const tree = JSON.parse(root.getAttribute('data-vf-razor-nav-menu-tree') ?? '[]') as VfNavMenuItemLike[];
  const expandMode = root.getAttribute('data-vf-razor-nav-menu-expand-mode') ?? 'multiple';
  const variant = root.getAttribute('data-vf-razor-nav-menu-variant') ?? 'default';
  const explicitCompact = root.getAttribute('data-vf-razor-nav-menu-compact');
  const compact = explicitCompact === null ? undefined : explicitCompact === 'true';
  const simple = resolveNavMenuIsSimple(tree);
  const probe = root.querySelector<HTMLElement>(':scope > .vf-nav-menu__compact-breakpoint-probe');
  // Whatever the server wrote on the root that is not the component's own is
  // the consumer's, and stays after the component's classes as Vue merges it.
  const ownInitial = new Set(
    resolveNavMenuRootClasses({
      variant,
      simple,
      compact: resolveNavMenuCompact({ variant, compact, measured: false }),
    }),
  );
  const consumerClasses = [...root.classList].filter((name) => !ownInitial.has(name));

  let active: string | undefined = root.getAttribute('data-vf-razor-nav-menu-value') ?? undefined;
  let expanded = resolveNavMenuSyncedExpandedValues(tree, [], active);
  let measured = false;

  // Every frame and every timeout this root schedules, in two sets: a frame id
  // is never handed to clearTimeout, nor a timeout id to cancelAnimationFrame.
  const frames = new Set<number>();
  const timeouts = new Set<number>();
  const endListeners = new Set<{ element: HTMLElement; type: string; listener: (event: Event) => void }>();
  const collapseStates = new WeakMap<HTMLElement, CollapseState>();
  /** The collapse that is leaving under each branch li - Vue's leavingVNodesCache, one key per Transition. */
  const leavingByBranch = new WeakMap<HTMLElement, HTMLElement>();

  const frame = (callback: () => void): void => {
    const id = window.requestAnimationFrame(() => {
      frames.delete(id);
      callback();
    });
    frames.add(id);
  };
  // Vue's nextFrame: the callback runs in the frame after the next one, and
  // both frames are recorded.
  const nextFrame = (callback: () => void): void => frame(() => frame(callback));
  const timeout = (callback: () => void, ms: number): void => {
    const id = window.setTimeout(() => {
      timeouts.delete(id);
      callback();
    }, ms);
    timeouts.add(id);
  };

  const stateOf = (element: HTMLElement): CollapseState => {
    let state = collapseStates.get(element);
    if (!state) {
      state = { isLeaving: false, endId: 0 };
      collapseStates.set(element, state);
    }
    return state;
  };

  /** Vue's getTransitionInfo, for a transition of no declared type. */
  const transitionInfo = (
    element: HTMLElement,
  ): { type: 'transition' | 'animation' | null; timeout: number; propCount: number } => {
    const styles = window.getComputedStyle(element);
    const list = (value: string): string[] => (value || '').split(', ');
    const toMs = (value: string): number =>
      value === 'auto' ? 0 : Number(value.slice(0, -1).replace(',', '.')) * 1000;
    const longest = (delays: string[], durations: string[]): number => {
      while (delays.length < durations.length) delays = delays.concat(delays);
      return Math.max(...durations.map((duration, index) => toMs(duration) + toMs(delays[index]!)));
    };
    const transitionDurations = list(styles.transitionDuration);
    const transitionTimeout = longest(list(styles.transitionDelay), transitionDurations);
    const animationDurations = list(styles.animationDuration);
    const animationTimeout = longest(list(styles.animationDelay), animationDurations);
    const timeoutMs = Math.max(transitionTimeout, animationTimeout);
    const type = timeoutMs > 0 ? (transitionTimeout > animationTimeout ? 'transition' : 'animation') : null;

    return {
      type,
      timeout: timeoutMs,
      propCount: type ? (type === 'transition' ? transitionDurations.length : animationDurations.length) : 0,
    };
  };

  /**
   * Vue's whenTransitionEnds: the end is one `transitionend` per listed
   * duration on the element itself, or the longest computed duration plus one
   * millisecond, whichever comes first; a later call on the same element makes
   * an earlier one stale. A computed duration of zero ends at once.
   */
  const whenTransitionEnds = (element: HTMLElement, resolve: () => void): void => {
    const state = stateOf(element);
    const id = (state.endId = ++endId);
    const resolveIfNotStale = (): void => {
      if (id === state.endId) resolve();
    };
    const { type, timeout: timeoutMs, propCount } = transitionInfo(element);
    if (!type) {
      resolve();
      return;
    }
    const endEvent = `${type}end`;
    let ended = 0;
    const record = { element, type: endEvent, listener: (_event: Event): void => {} };
    const end = (): void => {
      element.removeEventListener(endEvent, record.listener);
      endListeners.delete(record);
      resolveIfNotStale();
    };
    record.listener = (event: Event): void => {
      if (event.target === element && ++ended >= propCount) end();
    };
    timeout(() => {
      if (ended < propCount) end();
    }, timeoutMs + 1);
    element.addEventListener(endEvent, record.listener);
    endListeners.add(record);
  };

  const clearInlineStyles = (element: HTMLElement): void => {
    element.style.transition = '';
    element.style.overflow = '';
    element.style.height = '';
    element.style.opacity = '';
  };

  const itemAt = (path: number[]): VfNavMenuItemLike | null => {
    let items: VfNavMenuItemLike[] | undefined = tree;
    let item: VfNavMenuItemLike | null = null;
    for (const index of path) {
      item = items?.[index] ?? null;
      if (!item) return null;
      items = item.children;
    }
    return item;
  };
  const pathOf = (node: HTMLElement): number[] =>
    (node.getAttribute(PATH_ATTRIBUTE) ?? '').split('.').filter(Boolean).map(Number);
  /** The values of an item's ancestors, outermost first - the reference's parentPath. */
  const parentValues = (path: number[]): string[] =>
    path.slice(0, -1).map((_, index) => itemAt(path.slice(0, index + 1))!.value);

  const isLeaving = (element: HTMLElement): boolean => {
    for (let node: HTMLElement | null = element; node && node !== root; node = node.parentElement) {
      if (node.classList.contains('vf-nav-menu__collapse') && collapseStates.get(node)?.isLeaving) return true;
    }
    return false;
  };
  const liveCollapseOf = (node: HTMLElement): HTMLElement | null =>
    [...node.querySelectorAll<HTMLElement>(':scope > .vf-nav-menu__collapse')].find(
      (element) => !collapseStates.get(element)?.isLeaving && element !== leavingByBranch.get(node),
    ) ?? null;

  /** Repaints one node's own classes and attributes from the state. */
  const paintNode = (node: HTMLElement): void => {
    const path = pathOf(node);
    const item = itemAt(path);
    if (!item) return;
    const level = path.length - 1;
    const isActive = active === item.value;
    const ancestorActive = !isActive && resolveNavMenuHasDescendant(item, active);
    const isExpanded = expanded.includes(item.value);
    const hasLeadingIcon = Boolean(item.leadingIcon);
    setClass(node, resolveNavMenuNodeClasses({ level, expanded: isExpanded, active: isActive, ancestorActive }));

    const element = node.firstElementChild as HTMLElement | null;
    if (!element || element.classList.contains('vf-nav-menu__group')) return;

    if (resolveNavMenuIsBranch(item)) {
      setClass(element, resolveNavMenuBranchClasses({ level, hasLeadingIcon, ancestorActive, expanded: isExpanded }));
      setAttribute(element, 'aria-expanded', isExpanded ? 'true' : 'false');
      const icon = element.querySelector<HTMLElement>(':scope > .vf-nav-menu__icon');
      if (icon) setClass(icon, resolveNavMenuIconClasses(isExpanded));
      return;
    }

    setClass(
      element,
      resolveNavMenuLeafClasses({
        level,
        hasLeadingIcon,
        active: isActive,
        ancestorActive,
        disabled: Boolean(item.disabled),
      }),
    );
    setAttribute(element, 'aria-current', isActive ? 'page' : null);
  };

  /** A fresh collapse from the branch's pristine template, painted, nested expansions rendered in place. */
  const renderCollapse = (node: HTMLElement): HTMLElement | null => {
    const template = node.querySelector<HTMLTemplateElement>(TEMPLATE_SELECTOR);
    const collapse = template?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
    if (!collapse) return null;
    for (const child of collapse.querySelectorAll<HTMLElement>(`li[${PATH_ATTRIBUTE}]`)) paintNode(child);
    materialize(collapse);
    return collapse;
  };

  /**
   * Renders, without a transition, every expanded branch below `container`
   * that has no collapse yet - the reference mounting a subtree whose own
   * Transitions have not mounted.
   */
  const materialize = (container: HTMLElement): void => {
    for (const node of container.querySelectorAll<HTMLElement>(`:scope > ul > li[${PATH_ATTRIBUTE}]`)) {
      descend(node);
    }
  };
  const descend = (node: HTMLElement): void => {
    const item = itemAt(pathOf(node));
    if (!item) return;
    const list = node.querySelector<HTMLElement>(':scope > ul');
    if (list) {
      // A group: its children are always there.
      for (const child of list.querySelectorAll<HTMLElement>(`:scope > li[${PATH_ATTRIBUTE}]`)) descend(child);
      return;
    }
    if (!resolveNavMenuIsBranch(item) || !expanded.includes(item.value)) return;
    const collapse = renderCollapse(node);
    if (collapse) node.querySelector<HTMLTemplateElement>(TEMPLATE_SELECTOR)!.before(collapse);
  };

  /** Vue's enter, for a collapse rendered under `node`. */
  const enter = (node: HTMLElement): void => {
    const collapse = renderCollapse(node);
    if (!collapse) return;
    const state = stateOf(collapse);

    // beforeEnter: a collapse still leaving under this branch is removed at
    // once - not cancelled, so its after-leave runs - as Vue removes the
    // leaving vnode early. Then the hook, then the two enter classes.
    const leaving = leavingByBranch.get(node);
    if (leaving) collapseStates.get(leaving)?.leaveCallback?.();
    collapse.style.transition = NAV_MENU_COLLAPSE_TRANSITION;
    collapse.style.overflow = 'hidden';
    collapse.style.height = '0';
    collapse.style.opacity = '0';
    collapse.classList.add('v-enter-from');
    collapse.classList.add('v-enter-active');
    node.querySelector<HTMLTemplateElement>(TEMPLATE_SELECTOR)!.before(collapse);

    // enter. `finishEnter` is runtime-dom's; the callback is BaseTransition's
    // el[enterCbKey]: cancelled, it runs onEnterCancelled - finishEnter with
    // the cancelled flag - and otherwise the after-enter hook.
    const finishEnter = (isCancelled?: boolean): void => {
      state.enterCancelled = isCancelled;
      collapse.classList.remove('v-enter-to');
      collapse.classList.remove('v-enter-active');
    };
    let called = false;
    const enterCallback = (cancelled: boolean): void => {
      if (called) return;
      called = true;
      if (cancelled) finishEnter(true);
      else clearInlineStyles(collapse);
      state.enterCallback = undefined;
    };
    state.enterCallback = enterCallback;
    const resolve = (): void => {
      finishEnter();
      enterCallback(false);
    };
    // The enter hook - the transition again, the target size a frame later -
    // then Vue's frame pair and the end.
    collapse.style.transition = NAV_MENU_COLLAPSE_TRANSITION;
    frame(() => {
      collapse.style.height = `${collapse.scrollHeight}px`;
      collapse.style.opacity = '1';
    });
    nextFrame(() => {
      collapse.classList.remove('v-enter-from');
      collapse.classList.add('v-enter-to');
      whenTransitionEnds(collapse, resolve);
    });
  };

  /** Vue's leave, for the live collapse of `node`. */
  const leave = (node: HTMLElement, collapse: HTMLElement): void => {
    const state = stateOf(collapse);
    state.enterCallback?.(true);

    // beforeLeave
    collapse.style.transition = NAV_MENU_COLLAPSE_TRANSITION;
    collapse.style.overflow = 'hidden';
    collapse.style.height = `${collapse.scrollHeight}px`;
    collapse.style.opacity = '1';

    let called = false;
    state.leaveCallback = (cancelled?: boolean): void => {
      if (called) return;
      called = true;
      collapse.remove();
      if (!cancelled) clearInlineStyles(collapse);
      state.leaveCallback = undefined;
      if (leavingByBranch.get(node) === collapse) leavingByBranch.delete(node);
    };
    leavingByBranch.set(node, collapse);

    state.isLeaving = true;
    const resolve = (): void => {
      state.isLeaving = false;
      collapse.classList.remove('v-leave-from');
      collapse.classList.remove('v-leave-to');
      collapse.classList.remove('v-leave-active');
      state.leaveCallback?.(false);
    };
    collapse.classList.add('v-leave-from');
    if (!state.enterCancelled) {
      void document.body.offsetHeight;
      collapse.classList.add('v-leave-active');
    } else {
      collapse.classList.add('v-leave-active');
      void document.body.offsetHeight;
    }
    nextFrame(() => {
      if (!state.isLeaving) return;
      collapse.classList.remove('v-leave-from');
      collapse.classList.add('v-leave-to');
      whenTransitionEnds(collapse, resolve);
    });
    // The leave hook.
    void collapse.offsetHeight;
    frame(() => {
      collapse.style.height = '0';
      collapse.style.opacity = '0';
    });
  };

  /** Repaints every live node and opens or closes every branch whose state moved, outermost first. */
  const paint = (): void => {
    const visit = (list: HTMLElement): void => {
      for (const node of list.querySelectorAll<HTMLElement>(`:scope > li[${PATH_ATTRIBUTE}]`)) {
        paintNode(node);
        const item = itemAt(pathOf(node));
        if (!item) continue;
        const groupList = node.querySelector<HTMLElement>(':scope > ul');
        if (groupList) {
          visit(groupList);
          continue;
        }
        if (!resolveNavMenuIsBranch(item)) continue;
        const live = liveCollapseOf(node);
        const shouldBeOpen = expanded.includes(item.value);
        if (live && !shouldBeOpen) {
          leave(node, live);
        } else if (!live && shouldBeOpen) {
          enter(node);
        } else if (live) {
          visit(live.querySelector<HTMLElement>(':scope > ul')!);
        }
      }
    };
    visit(root.querySelector<HTMLElement>(':scope > ul.vf-nav-menu__list')!);
  };

  const paintRoot = (): void => {
    const isCompact = resolveNavMenuCompact({ variant, compact, measured });
    setClass(root, [...resolveNavMenuRootClasses({ variant, simple, compact: isCompact }), ...consumerClasses]);
  };

  const measure = (): void => {
    measured = resolveNavMenuMeasuredCompact({
      variant,
      rootWidth: root.getBoundingClientRect().width,
      breakpointWidth: probe?.getBoundingClientRect().width ?? 0,
    });
    paintRoot();
  };

  root.addEventListener('click', (event) => {
    const element = (event.target as Element | null)?.closest<HTMLElement>('.vf-nav-menu__item');
    if (!element || !root.contains(element) || element.closest(ROOT_SELECTOR) !== root || isLeaving(element)) return;
    const node = element.parentElement;
    if (!node?.hasAttribute(PATH_ATTRIBUTE)) return;
    const path = pathOf(node);
    const item = itemAt(path);
    if (!item) return;

    if (resolveNavMenuIsBranch(item)) {
      if (item.disabled) return;
      expanded = resolveNavMenuToggledExpandedValues(tree, expanded, item.value, parentValues(path), expandMode);
      paint();
      return;
    }

    if (item.disabled) {
      event.preventDefault();
      return;
    }
    active = item.value;
    expanded = resolveNavMenuSyncedExpandedValues(tree, expanded, item.value);
    root.dispatchEvent(new CustomEvent(CHANGE_EVENT, { bubbles: true, detail: { value: item.value } }));
    paint();
  });

  // The reference measures on mount and on every observation of the root
  // and the probe; without ResizeObserver it listens to window resize.
  measure();
  let observer: ResizeObserver | undefined;
  const onWindowResize = (): void => measure();
  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', onWindowResize);
  } else {
    observer = new ResizeObserver(() => measure());
    observer.observe(root);
    if (probe) observer.observe(probe);
  }

  registerDisposal(root, () => {
    observer?.disconnect();
    window.removeEventListener('resize', onWindowResize);
    for (const id of frames) window.cancelAnimationFrame(id);
    for (const id of timeouts) window.clearTimeout(id);
    frames.clear();
    timeouts.clear();
    for (const record of endListeners) record.element.removeEventListener(record.type, record.listener);
    endListeners.clear();
  });
}

/**
 * Enhances every Razor-owned nav menu inside `root`. Idempotent: a root is
 * enhanced once, so calling this again after inserting markup only picks up
 * the new roots.
 */
export function enhanceVueForgeNavMenus(root: ParentNode = document): void {
  const roots =
    root instanceof Element && root.matches(ROOT_SELECTOR)
      ? [root as HTMLElement]
      : Array.from(root.querySelectorAll<HTMLElement>(ROOT_SELECTOR));

  for (const element of roots) enhanceRoot(element);
}
