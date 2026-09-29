// Negative fixtures for the VfTooltip parity profile (M31).
//
// Every mutation names the case and the dimension that has to catch it, so a
// defect reported under the wrong dimension counts as missed. Three families,
// as for the earlier overlays:
//
//   - capture mutations edit a real capture after the fact - the cheap way to
//     prove a dimension reads a field at all, the only way to make current and
//     Razor identically wrong so that only the reference sees it, and the way
//     to express a floater.js configuration a page cannot change (the popover
//     flip pair, shift disabled, the arrow a pixel off);
//   - browser mutations break a real page. The tooltip's own defects are
//     installed as the behaviour a wrong port would have: page-level timers
//     that fire at once, never, or survive a cancel; capture-phase listeners
//     that keep the wrapper from hearing an event it should, or hear one it
//     should not; observers that keep a stale reference, a wrong class, a
//     leaving node or an orphan; an entry on the escape stack. The Razor page
//     is the usual target; one runs on current Vue alone;
//   - policy mutations smuggle approvals the validator or the occurrence
//     accounting has to reject.
import { eachTheme, fail } from './mutations.mjs';

const T_DEFAULT = 'tooltip/default';
const T_ATTRS = 'tooltip/attrs';
const HOVER_OPEN = 'tooltip/interaction-hover-open';
const FOCUS_OPEN = 'tooltip/interaction-focus-open';
const LONG_OPEN = 'tooltip/interaction-long-delay-open';
const CANCEL_POINTER = 'tooltip/interaction-pending-cancel-pointer';
const CANCEL_FOCUS = 'tooltip/interaction-pending-cancel-focus';
const REENTRY = 'tooltip/interaction-reentry-restart';
const RESTART = 'tooltip/interaction-activation-restart';
const POINTER_CLICK = 'tooltip/interaction-pointer-click';
const DUPLICATE = 'tooltip/interaction-duplicate-timer';
const FOCUS_THEN_LEAVE = 'tooltip/interaction-focus-then-mouseleave';
const HOVER_THEN_BLUR = 'tooltip/interaction-hover-then-focusout';
const DESCENDANT = 'tooltip/interaction-descendant-focus-move';
const HOVER_WITHIN = 'tooltip/interaction-hover-within';
const UNHOVER_CLOSE = 'tooltip/interaction-unhover-close';
const FOCUSOUT_CLOSE = 'tooltip/interaction-focusout-close';
const ONTO_TELEPORTED = 'tooltip/interaction-pointer-onto-teleported';
const ONTO_IN_PLACE = 'tooltip/interaction-pointer-onto-in-place';
const ABSENT = 'tooltip/interaction-content-absent';
const WHITESPACE = 'tooltip/interaction-content-whitespace';
const SLOT_BEATS_TEXT = 'tooltip/interaction-content-slot-beats-text';
const FLIP_BOTTOM = 'tooltip/interaction-flip-to-bottom';
const SHIFT_LEFT = 'tooltip/interaction-shift-left';
const TWO_DIFFERENT = 'tooltip/interaction-two-different-open';
const TWO_IDENTICAL = 'tooltip/interaction-two-identical-open';
const TWO_REVERSE = 'tooltip/interaction-two-reverse-open';
const POPOVER_ESCAPE = 'tooltip/interaction-popover-escape';
const POPOVER_DISPOSE = 'tooltip/interaction-popover-dispose';
const DISPOSE_PENDING = 'tooltip/interaction-popover-dispose-pending';
const KEYS = 'tooltip/interaction-keys-unhandled';

const STATE = 'interaction.state';
const RELATIONSHIPS = 'interaction.relationships';

const tooltipNode = (node) => node.classes.includes('vf-tooltip__content');
const arrowNode = (node) => node.classes.includes('vf-tooltip__arrow');

/**
 * Runs `body` once per case with the case root, its tooltip roots and their
 * triggers in scope. The body throws MUTATION_NOT_APPLIED when what it was
 * written to break is not there. A live-parity scenario runs with its case
 * alone in the document, so a mutation naming several cases finds one of them
 * per scenario; finding none is not applying it.
 */
function onCases(caseIds, body) {
  return `(() => {
    let applied = 0;
    const evidence = [];
    for (const caseId of ${JSON.stringify(caseIds)}) {
      const root = document.querySelector('[data-parity-case="' + caseId + '"]');
      if (!root) continue;
      const roots = [...root.querySelectorAll('.vf-tooltip')];
      if (roots.length === 0) throw new Error('MUTATION_NOT_APPLIED: no tooltip in ' + caseId);
      const triggers = roots.map((tooltip) => tooltip.querySelector(':scope > .vf-tooltip__trigger'));
      const described = (trigger) => document.getElementById(trigger.getAttribute('aria-describedby') ?? '');
      ${body}
      applied += 1;
      evidence.push({ caseId });
    }
    if (applied === 0) throw new Error('MUTATION_NOT_APPLIED: none of ${caseIds.join(', ')} is on the page');
    return { applied, evidence };
  })()`;
}

const requireTooltip = `const theTooltip = described(triggers[0]); if (!theTooltip) throw new Error('MUTATION_NOT_APPLIED: no open tooltip');`;

/** Page timers of `delay` ms - the tooltip's open timer, and nothing else on the page - rewritten by `rewrite`. */
const timers = (delay, rewrite) => `
  const realSet = window.setTimeout.bind(window);
  const realClear = window.clearTimeout.bind(window);
  const DELAY = ${delay};
  ${rewrite}`;

/** A capture-phase listener on the document that runs before the wrapper hears the event. */
const intercept = (type, condition, action = 'event.stopPropagation();') => `
  document.addEventListener('${type}', (event) => {
    const tooltip = event.target instanceof Element ? event.target.closest('.vf-tooltip') : null;
    if (!tooltip || !roots.includes(tooltip)) return;
    if (!(${condition})) return;
    ${action}
  }, true);`;

// ------------------------------------------------------------------ capture

export const tooltipParityMutations = [
  {
    id: 'tooltip-current-and-razor-identically-shift-the-tooltip',
    klass: 'native',
    description:
      'current and Razor both write the open tooltip one pixel to the right - identically, so current-vs-razor agrees and only the reference sees it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [HOVER_OPEN],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const node = capture.interactionDom[HOVER_OPEN].find(tooltipNode);
          if (!node?.attributes.style) fail('no positioned tooltip');
          node.attributes.style = node.attributes.style.replace(
            /left:([\d.]+)px/,
            (all, value) => `left:${Number(value) + 1}px`,
          );
        });
      }
    },
  },
  {
    id: 'tooltip-followed-tooltip-missing',
    klass: 'structure',
    description: "the open tooltip is gone from Razor's followed targets, as if the edge to it were not declared",
    expect: { dimensions: ['dom.structure'], caseIds: [HOVER_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom[HOVER_OPEN];
        const index = dom.findIndex(tooltipNode);
        if (index < 0) fail('no followed tooltip');
        dom.splice(index, 1);
      });
    },
  },
  {
    id: 'tooltip-popover-flip-pair-copied',
    klass: 'state',
    description:
      "the flip pair is the popover's bottom-start/top-start: the flipped tooltip lines up with the trigger's start edge instead of centring on it",
    expect: {
      dimensions: ['dom.nativeAttributes', STATE],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [FLIP_BOTTOM],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.interactionDom[FLIP_BOTTOM].find(tooltipNode);
        const geometry = capture.interactions[FLIP_BOTTOM].tooltipGeometry[0];
        if (!node?.attributes.style || !geometry) fail('no flipped tooltip');
        node.attributes.style = node.attributes.style.replace(
          /left:([-\d.]+)px/,
          (all, value) => `left:${Number(value) - geometry.left}px`,
        );
        geometry.right -= geometry.left;
        geometry.left = 0;
      });
    },
  },
  {
    id: 'tooltip-shift-disabled',
    klass: 'state',
    description: 'shift is not applied: the long tooltip at the left edge overflows the viewport',
    expect: {
      dimensions: ['dom.nativeAttributes', STATE],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [SHIFT_LEFT],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.interactionDom[SHIFT_LEFT].find(tooltipNode);
        const geometry = capture.interactions[SHIFT_LEFT].tooltipGeometry[0];
        if (!node?.attributes.style || !geometry) fail('no shifted tooltip');
        node.attributes.style = node.attributes.style.replace(
          /left:([-\d.]+)px/,
          (all, value) => `left:${Number(value) - 100}px`,
        );
        geometry.left -= 100;
        geometry.right -= 100;
      });
    },
  },
  {
    id: 'tooltip-arrow-coordinates-off',
    klass: 'native',
    description: 'the arrow is written one pixel off its computed offset',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [HOVER_OPEN],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const tooltip = capture.interactionDom[HOVER_OPEN].find(tooltipNode);
        const arrow = tooltip?.children.find(arrowNode);
        if (!arrow?.attributes.style) fail('no positioned arrow');
        arrow.attributes.style = arrow.attributes.style.replace(
          /left:([-\d.]+)px/,
          (all, value) => `left:${Number(value) + 1}px`,
        );
      });
    },
  },
  {
    id: 'tooltip-timing-record-only',
    klass: 'state',
    description:
      'the latency record alone says the tooltip opened early - proving the timing field is compared on its own, beside every final state',
    expect: { dimensions: [STATE], caseIds: [LONG_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const opening = capture.interactions[LONG_OPEN].openings[0];
        if (!opening) fail('no opening recorded');
        opening.latency = 'early';
      });
    },
  },
];

// ------------------------------------------------------------------ browser

export const tooltipBrowserMutations = [
  // ---------------------------------------------------------------- timers
  {
    id: 'browser-tooltip-opens-immediately',
    target: 'razor',
    caseIds: [LONG_OPEN, HOVER_OPEN],
    description: 'the open timer fires at once: an activation opens the tooltip without its delay',
    expect: { dimensions: [STATE], caseIds: [LONG_OPEN, HOVER_OPEN] },
    beforeInteraction: onCases(
      [LONG_OPEN, HOVER_OPEN],
      timers(
        `Number(root.querySelector('.vf-tooltip').getAttribute('data-vf-razor-tooltip-open-delay'))`,
        `window.setTimeout = (callback, ms, ...rest) => realSet(callback, ms === DELAY ? 0 : ms, ...rest);`,
      ),
    ),
  },
  {
    id: 'browser-tooltip-timer-never-fires',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: 'the open timer is started and never fires',
    expect: { dimensions: [STATE, RELATIONSHIPS, 'dom.structure'], caseIds: [HOVER_OPEN] },
    beforeInteraction: onCases(
      [HOVER_OPEN],
      timers(
        80,
        `window.setTimeout = (callback, ms, ...rest) => (ms === DELAY ? realSet(() => {}, ms) : realSet(callback, ms, ...rest));`,
      ),
    ),
  },
  {
    id: 'browser-tooltip-pending-timer-survives-close',
    target: 'razor',
    caseIds: [CANCEL_POINTER, CANCEL_FOCUS, REENTRY],
    description:
      'a leave or a focusout does not cancel the pending open: the tooltip opens after all, and a re-entry opens early',
    expect: { dimensions: [STATE], caseIds: [CANCEL_POINTER, CANCEL_FOCUS, REENTRY] },
    beforeInteraction: onCases(
      [CANCEL_POINTER, CANCEL_FOCUS, REENTRY],
      timers(
        600,
        `const open = new Set();
         window.setTimeout = (callback, ms, ...rest) => { const id = realSet(callback, ms, ...rest); if (ms === DELAY) open.add(id); return id; };
         window.clearTimeout = (id) => { if (!open.has(id)) realClear(id); };`,
      ),
    ),
  },
  {
    id: 'browser-tooltip-duplicate-timers',
    target: 'razor',
    caseIds: [DUPLICATE, POINTER_CLICK],
    description:
      'an activation starts a timer without clearing the one before it, and only the last is ever cancelled: hover, focus and leave - or one click - open it',
    expect: { dimensions: [STATE, RELATIONSHIPS], caseIds: [DUPLICATE, POINTER_CLICK] },
    // A clear immediately followed by a new timer of the delay is the start of
    // an activation: that clear is dropped, so the earlier timer leaks. A
    // clear on its own - a close - still cancels.
    beforeInteraction: onCases(
      [DUPLICATE, POINTER_CLICK],
      `const realSet = window.setTimeout.bind(window);
       const realClear = window.clearTimeout.bind(window);
       const delay = Number(roots[0].getAttribute('data-vf-razor-tooltip-open-delay'));
       let pending = null;
       window.clearTimeout = (id) => { pending = id; queueMicrotask(() => { if (pending === id) realClear(id); pending = null; }); };
       window.setTimeout = (callback, ms, ...rest) => { if (ms === delay) pending = null; return realSet(callback, ms, ...rest); };`,
    ),
  },
  {
    id: 'browser-tooltip-activation-keeps-the-pending-timer',
    target: 'razor',
    caseIds: [RESTART],
    description: 'a second activation keeps the pending timer instead of restarting it: the open comes early',
    expect: { dimensions: [STATE], caseIds: [RESTART] },
    beforeInteraction: onCases(
      [RESTART],
      `const realSet = window.setTimeout.bind(window);
       const realClear = window.clearTimeout.bind(window);
       const live = new Map();
       let clearing = null;
       window.clearTimeout = (id) => { clearing = id; queueMicrotask(() => { if (clearing === id) { realClear(id); live.delete(id); } clearing = null; }); };
       window.setTimeout = (callback, ms, ...rest) => {
         if (ms === 1500 && clearing !== null && live.has(clearing)) {
           const kept = clearing;
           clearing = null;
           return kept;
         }
         const id = realSet((...args) => { live.delete(id); callback(...args); }, ms, ...rest);
         if (ms === 1500) live.set(id, true);
         return id;
       };`,
    ),
  },

  // ------------------------------------------------------------- events
  {
    id: 'browser-tooltip-hovered-or-focused',
    target: 'razor',
    caseIds: [FOCUS_THEN_LEAVE, HOVER_THEN_BLUR],
    description:
      'two flags instead of the last event: a mouseleave does not close while focus is inside, and a focusout does not close while the pointer is',
    expect: { dimensions: [STATE, RELATIONSHIPS], caseIds: [FOCUS_THEN_LEAVE, HOVER_THEN_BLUR] },
    beforeInteraction: onCases(
      [FOCUS_THEN_LEAVE, HOVER_THEN_BLUR],
      intercept('mouseleave', 'tooltip.contains(document.activeElement)') +
        intercept('focusout', "tooltip.matches(':hover') && !tooltip.contains(event.relatedTarget)"),
    ),
  },
  {
    id: 'browser-tooltip-hover-ignored',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: 'mouseenter never reaches the wrapper: a hover opens nothing',
    expect: { dimensions: [STATE, RELATIONSHIPS, 'dom.structure'], caseIds: [HOVER_OPEN] },
    beforeInteraction: onCases([HOVER_OPEN], intercept('mouseenter', 'true')),
  },
  {
    id: 'browser-tooltip-unhover-ignored',
    target: 'razor',
    caseIds: [UNHOVER_CLOSE],
    description: 'mouseleave never reaches the wrapper: an unhover leaves the tooltip open',
    expect: { dimensions: [STATE, RELATIONSHIPS, 'interaction.convergence'], caseIds: [UNHOVER_CLOSE] },
    beforeInteraction: onCases([UNHOVER_CLOSE], intercept('mouseleave', 'true')),
  },
  {
    id: 'browser-tooltip-focusin-ignored',
    target: 'razor',
    caseIds: [FOCUS_OPEN],
    description: 'focusin never reaches the wrapper: focus opens nothing',
    expect: { dimensions: [STATE, RELATIONSHIPS], caseIds: [FOCUS_OPEN] },
    beforeInteraction: onCases([FOCUS_OPEN], intercept('focusin', 'true')),
  },
  {
    id: 'browser-tooltip-focusout-ignored',
    target: 'razor',
    caseIds: [FOCUSOUT_CLOSE],
    description: 'focusout never reaches the wrapper: focus leaving keeps the tooltip open',
    expect: { dimensions: [STATE, RELATIONSHIPS], caseIds: [FOCUSOUT_CLOSE] },
    beforeInteraction: onCases([FOCUSOUT_CLOSE], intercept('focusout', 'true')),
  },
  {
    id: 'browser-tooltip-descendant-focus-is-inside',
    target: 'razor',
    caseIds: [DESCENDANT],
    description:
      'focus moving between two controls in the wrapper is treated as staying inside: no close, no reopen, no leave',
    expect: { dimensions: [STATE], caseIds: [DESCENDANT] },
    beforeInteraction: onCases(
      [DESCENDANT],
      intercept('focusout', 'tooltip.contains(event.relatedTarget)') +
        intercept('focusin', 'tooltip.contains(event.relatedTarget)'),
    ),
  },
  {
    id: 'browser-tooltip-bubbling-mouseover',
    target: 'razor',
    caseIds: [HOVER_WITHIN],
    description:
      'the listeners are the bubbling mouseout and mouseover: the pointer moving between two controls inside closes and reopens the tooltip',
    expect: { dimensions: [STATE], caseIds: [HOVER_WITHIN] },
    beforeInteraction: onCases(
      [HOVER_WITHIN],
      `document.addEventListener('mouseout', (event) => {
         const tooltip = event.target instanceof Element ? event.target.closest('.vf-tooltip') : null;
         if (!tooltip || !roots.includes(tooltip) || !tooltip.contains(event.relatedTarget)) return;
         tooltip.dispatchEvent(new MouseEvent('mouseleave'));
         tooltip.dispatchEvent(new MouseEvent('mouseenter'));
       }, true);`,
    ),
  },
  {
    id: 'browser-tooltip-listeners-on-the-trigger',
    target: 'razor',
    caseIds: [ONTO_IN_PLACE],
    description:
      'the listeners are on the trigger span instead of the wrapper: the pointer moving onto an in-place tooltip leaves the trigger and closes it',
    expect: { dimensions: [STATE, RELATIONSHIPS], caseIds: [ONTO_IN_PLACE] },
    beforeInteraction: onCases(
      [ONTO_IN_PLACE],
      `document.addEventListener('mouseout', (event) => {
         const trigger = event.target instanceof Element ? event.target.closest('.vf-tooltip__trigger') : null;
         if (!trigger || !triggers.includes(trigger) || trigger.contains(event.relatedTarget)) return;
         trigger.parentElement.dispatchEvent(new MouseEvent('mouseleave'));
       }, true);`,
    ),
  },
  {
    id: 'browser-tooltip-teleported-hoverable',
    target: 'razor',
    caseIds: [ONTO_TELEPORTED],
    description:
      'a teleported tooltip is made hoverable: the pointer moving onto it does not close it - the WCAG 1.4.13 improvement the reference does not have',
    expect: { dimensions: [STATE, RELATIONSHIPS], caseIds: [ONTO_TELEPORTED] },
    beforeInteraction: onCases(
      [ONTO_TELEPORTED],
      intercept(
        'mouseleave',
        'event.relatedTarget instanceof Element && described(tooltip.querySelector(":scope > .vf-tooltip__trigger"))?.contains(event.relatedTarget)',
      ),
    ),
  },

  // ---------------------------------------------------------- aria and dom
  {
    id: 'browser-tooltip-describedby-absent',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: 'the open tooltip is not named by its trigger',
    expect: { dimensions: ['dom.structure', RELATIONSHIPS], caseIds: [HOVER_OPEN] },
    afterInteraction: onCases([HOVER_OPEN], `${requireTooltip} triggers[0].removeAttribute('aria-describedby');`),
  },
  {
    id: 'browser-tooltip-describedby-while-closed',
    target: 'razor',
    caseIds: [T_DEFAULT],
    description: 'a closed trigger already names its future tooltip id',
    expect: { dimensions: ['dom.relationships'], caseIds: [T_DEFAULT] },
    beforeExtract: onCases(
      [T_DEFAULT],
      `triggers[0].setAttribute('aria-describedby', roots[0].getAttribute('data-vf-razor-tooltip-id'));`,
    ),
  },
  {
    id: 'browser-tooltip-wrong-target',
    target: 'razor',
    caseIds: [TWO_DIFFERENT],
    description: 'A: the first trigger names the second tooltip',
    expect: { dimensions: ['dom.relationships', RELATIONSHIPS], caseIds: [TWO_DIFFERENT] },
    afterInteraction: onCases(
      [TWO_DIFFERENT],
      `if (!described(triggers[0]) || !described(triggers[1])) throw new Error('MUTATION_NOT_APPLIED: two open tooltips expected');
       triggers[0].setAttribute('aria-describedby', triggers[1].getAttribute('aria-describedby'));`,
    ),
  },
  {
    id: 'browser-tooltip-cross-wired-identical',
    target: 'razor',
    caseIds: [TWO_IDENTICAL],
    description:
      'F: two identical tooltips swapped consistently - each trigger names the other one, every id still resolves and every text is the same',
    expect: { dimensions: ['dom.relationships', RELATIONSHIPS], caseIds: [TWO_IDENTICAL] },
    afterInteraction: onCases(
      [TWO_IDENTICAL],
      `const first = triggers[0].getAttribute('aria-describedby');
       if (!first || !triggers[1].hasAttribute('aria-describedby')) throw new Error('MUTATION_NOT_APPLIED: two open tooltips expected');
       triggers[0].setAttribute('aria-describedby', triggers[1].getAttribute('aria-describedby'));
       triggers[1].setAttribute('aria-describedby', first);`,
    ),
  },
  {
    id: 'browser-tooltip-duplicate-id',
    target: 'razor',
    caseIds: [TWO_DIFFERENT],
    description: 'C+D: both tooltips carry one id and both triggers name it',
    expect: { dimensions: ['dom.structure', RELATIONSHIPS], caseIds: [TWO_DIFFERENT] },
    afterInteraction: onCases(
      [TWO_DIFFERENT],
      `const tooltips = triggers.map(described);
       if (tooltips.some((node) => !node)) throw new Error('MUTATION_NOT_APPLIED: two open tooltips expected');
       tooltips[1].id = tooltips[0].id;
       triggers[1].setAttribute('aria-describedby', tooltips[0].id);`,
    ),
  },
  {
    id: 'browser-tooltip-wrong-body-order',
    target: 'razor',
    caseIds: [TWO_REVERSE],
    description: 'H: tooltips are appended to <body> in the order they open, not at their mount-order anchors',
    expect: { dimensions: ['dom.relationships', RELATIONSHIPS], caseIds: [TWO_REVERSE] },
    afterInteraction: onCases(
      [TWO_REVERSE],
      `const tooltips = triggers.map(described);
       if (tooltips.some((node) => !node)) throw new Error('MUTATION_NOT_APPLIED: two open tooltips expected');
       document.body.append(tooltips[0]);`,
    ),
  },
  {
    id: 'browser-tooltip-describedby-on-the-control',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: "aria-describedby is moved to the consumer's button, the better-looking target",
    expect: { dimensions: ['dom.relationships', RELATIONSHIPS], caseIds: [HOVER_OPEN] },
    afterInteraction: onCases(
      [HOVER_OPEN],
      `${requireTooltip}
       triggers[0].querySelector('button').setAttribute('aria-describedby', theTooltip.id);
       triggers[0].removeAttribute('aria-describedby');`,
    ),
  },
  {
    id: 'browser-tooltip-describedby-on-the-root',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: 'aria-describedby is written on the root span instead of the trigger wrapper',
    expect: { dimensions: ['dom.relationships', RELATIONSHIPS], caseIds: [HOVER_OPEN] },
    afterInteraction: onCases(
      [HOVER_OPEN],
      `${requireTooltip}
       roots[0].setAttribute('aria-describedby', theTooltip.id);
       triggers[0].removeAttribute('aria-describedby');`,
    ),
  },
  {
    id: 'browser-tooltip-role-status',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: 'the tooltip announces role=status',
    expect: { dimensions: ['dom.aria', 'a11y.role', STATE], caseIds: [HOVER_OPEN] },
    afterInteraction: onCases([HOVER_OPEN], `${requireTooltip} theTooltip.setAttribute('role', 'status');`),
  },
  {
    id: 'browser-tooltip-orphan-left-in-body',
    target: 'razor',
    caseIds: [UNHOVER_CLOSE],
    description:
      'G: a closed tooltip is left in <body> - named by nothing, so the followed DOM cannot see it; the snapshot counts it',
    expect: { dimensions: [STATE], caseIds: [UNHOVER_CLOSE] },
    beforeInteraction: onCases(
      [UNHOVER_CLOSE],
      `new MutationObserver((records) => {
         for (const record of records) {
           for (const node of record.removedNodes) {
             if (node instanceof HTMLElement && node.classList.contains('vf-tooltip__content') && !node.isConnected) {
               node.className = 'vf-tooltip__content vf-tooltip__content--top';
               document.body.append(node);
             }
           }
         }
       }).observe(document.body, { childList: true });`,
    ),
  },
  {
    id: 'browser-tooltip-empty-content-normalized',
    target: 'razor',
    caseIds: [ABSENT],
    description: 'an open tooltip with no content does not name its id: the dangling reference is normalized away',
    expect: { dimensions: ['dom.relationships', RELATIONSHIPS], caseIds: [ABSENT] },
    afterInteraction: onCases(
      [ABSENT],
      `if (!triggers[0].hasAttribute('aria-describedby') || described(triggers[0])) throw new Error('MUTATION_NOT_APPLIED: no dangling reference');
       triggers[0].removeAttribute('aria-describedby');`,
    ),
  },
  {
    id: 'browser-tooltip-whitespace-trimmed',
    target: 'razor',
    caseIds: [WHITESPACE],
    description: 'a whitespace-only text is trimmed to nothing: no tooltip renders and the reference dangles',
    expect: { dimensions: ['dom.structure', RELATIONSHIPS], caseIds: [WHITESPACE] },
    afterInteraction: onCases([WHITESPACE], `${requireTooltip} theTooltip.remove();`),
  },
  {
    id: 'browser-tooltip-text-beats-slot',
    target: 'razor',
    caseIds: [SLOT_BEATS_TEXT],
    description: 'the text renders instead of the content slot given beside it',
    expect: { dimensions: ['dom.text', STATE], caseIds: [SLOT_BEATS_TEXT] },
    afterInteraction: onCases(
      [SLOT_BEATS_TEXT],
      `${requireTooltip}
       for (const child of [...theTooltip.childNodes].slice(0, -1)) child.remove();
       theTooltip.prepend(document.createTextNode('Ignored text'));`,
    ),
  },

  // ------------------------------------------------------------- floating
  {
    id: 'browser-tooltip-flip-disabled',
    target: 'razor',
    caseIds: [FLIP_BOTTOM],
    description: 'flip is disabled: a top tooltip at the viewport top keeps its top side and modifiers',
    expect: { dimensions: ['dom.canonicalClasses', STATE], caseIds: [FLIP_BOTTOM] },
    beforeInteraction: onCases(
      [FLIP_BOTTOM],
      `new MutationObserver((records) => {
         for (const record of records) {
           const node = record.target;
           if (!(node instanceof HTMLElement) || !/vf-tooltip__(content|arrow)--bottom/.test(node.className)) continue;
           node.className = node.className.replace('--bottom', '--top');
         }
       }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });`,
    ),
  },
  {
    id: 'browser-tooltip-arrow-missing',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: 'the tooltip has no arrow span',
    expect: { dimensions: ['dom.structure', STATE], caseIds: [HOVER_OPEN] },
    afterInteraction: onCases(
      [HOVER_OPEN],
      `${requireTooltip} const arrow = theTooltip.querySelector(':scope > .vf-tooltip__arrow'); if (!arrow) throw new Error('MUTATION_NOT_APPLIED: no arrow'); arrow.remove();`,
    ),
  },
  {
    id: 'browser-tooltip-arrow-wrong-side',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: "the arrow carries the other side's modifier",
    expect: { dimensions: ['dom.canonicalClasses', STATE], caseIds: [HOVER_OPEN] },
    beforeInteraction: onCases(
      [HOVER_OPEN],
      // The arrow's classes are written before the tooltip is inserted, so
      // the observer turns it over on insertion as well as on a repaint.
      `const turn = (node) => {
         if (node instanceof HTMLElement && node.classList.contains('vf-tooltip__arrow--top')) node.className = node.className.replace('--top', '--bottom');
       };
       new MutationObserver((records) => {
         for (const record of records) {
           turn(record.target);
           for (const node of record.addedNodes) if (node instanceof HTMLElement) node.querySelectorAll('.vf-tooltip__arrow').forEach(turn);
         }
       }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });`,
    ),
  },
  {
    id: 'browser-tooltip-offset-wrong',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: 'the tooltip sits two pixels further from its trigger than the reference offset puts it',
    expect: { dimensions: [STATE], caseIds: [HOVER_OPEN] },
    beforeInteraction: onCases(
      [HOVER_OPEN],
      `const style = document.createElement('style');
       style.textContent = '.vf-tooltip__content { translate: 0 -2px; }';
       document.head.append(style);`,
    ),
  },

  // ------------------------------------------------------------ transition
  {
    id: 'browser-tooltip-instant-close-removal',
    target: 'razor',
    caseIds: [UNHOVER_CLOSE],
    description:
      'a closing tooltip is removed at once instead of leaving: the final DOM and the screenshot are right, the lifecycle is not',
    expect: { dimensions: [STATE], caseIds: [UNHOVER_CLOSE] },
    beforeInteraction: onCases(
      [UNHOVER_CLOSE],
      `new MutationObserver((records) => {
         for (const record of records) {
           const node = record.target;
           if (node instanceof HTMLElement && node.classList.contains('vf-tooltip__content') && node.classList.contains('vf-floating-transition-leave-active')) node.remove();
         }
       }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });`,
    ),
  },
  {
    id: 'browser-tooltip-no-enter-from',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: 'the enter begins without its enter-from frame - a frame no reduced-motion screenshot ever sees',
    expect: { dimensions: [STATE], caseIds: [HOVER_OPEN] },
    beforeInteraction: onCases(
      [HOVER_OPEN],
      // Stripped before the node is inserted, whichever insertion the port
      // uses: an observer would run after the fixture's log has seen the frame.
      `const strip = (node) => {
         if (node instanceof HTMLElement && node.classList.contains('vf-tooltip__content')) node.classList.remove('vf-floating-transition-enter-from');
       };
       for (const [owner, name] of [[Node.prototype, 'insertBefore'], [Node.prototype, 'appendChild'], [Element.prototype, 'after'], [Element.prototype, 'before'], [Element.prototype, 'append'], [CharacterData.prototype, 'after'], [CharacterData.prototype, 'before']]) {
         const real = owner[name];
         owner[name] = function (...nodes) {
           nodes.forEach(strip);
           return real.apply(this, nodes);
         };
       }`,
    ),
  },
  {
    id: 'browser-tooltip-describedby-removed-late',
    target: 'razor',
    caseIds: [UNHOVER_CLOSE],
    description: 'aria-describedby stays on the trigger until the leaving tooltip is gone',
    expect: { dimensions: [STATE], caseIds: [UNHOVER_CLOSE] },
    beforeInteraction: onCases(
      [UNHOVER_CLOSE],
      `const trigger = triggers[0];
       let restoring = null;
       new MutationObserver((records) => {
         for (const record of records) {
           if (record.type === 'attributes' && record.target === trigger && record.oldValue && !trigger.hasAttribute('aria-describedby')) {
             const node = document.getElementById(record.oldValue);
             if (node && node.isConnected) { restoring = record.oldValue; trigger.setAttribute('aria-describedby', record.oldValue); }
           }
           for (const node of record.removedNodes ?? []) {
             if (node instanceof HTMLElement && node.id === restoring) { restoring = null; trigger.removeAttribute('aria-describedby'); }
           }
         }
       }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ['aria-describedby'] });`,
    ),
  },

  // ------------------------------------------------------------- escape
  {
    id: 'browser-tooltip-on-the-escape-stack',
    target: 'razor',
    caseIds: [POPOVER_ESCAPE, KEYS],
    description:
      'the tooltip takes an entry on the escape stack when it opens: the Escape closes the tooltip, is prevented, and never reaches the popover below',
    expect: { dimensions: [STATE], caseIds: [POPOVER_ESCAPE, KEYS] },
    beforeInteraction: onCases(
      [POPOVER_ESCAPE, KEYS],
      `window.addEventListener('keydown', (event) => {
         if (event.key !== 'Escape') return;
         const open = roots.find((tooltip) => tooltip.querySelector(':scope > .vf-tooltip__trigger').hasAttribute('aria-describedby'));
         if (!open) return;
         event.preventDefault();
         event.stopImmediatePropagation();
         open.dispatchEvent(new MouseEvent('mouseleave'));
       }, true);`,
    ),
  },

  // -------------------------------------------------------------- disposal
  {
    id: 'browser-tooltip-leave-on-dispose',
    target: 'razor',
    caseIds: [POPOVER_DISPOSE],
    description:
      'the tooltip inside a closing popover leaves over 320 ms instead of going at once: the node outlives the popover that held it',
    expect: { dimensions: [STATE], caseIds: [POPOVER_DISPOSE] },
    beforeInteraction: onCases(
      [POPOVER_DISPOSE],
      `new MutationObserver((records) => {
         for (const record of records) {
           for (const node of record.removedNodes) {
             if (!(node instanceof HTMLElement) || !node.classList.contains('vf-tooltip__content') || node.isConnected) continue;
             node.classList.add('vf-floating-transition-leave-from', 'vf-floating-transition-leave-active');
             document.body.append(node);
             setTimeout(() => node.remove(), 320);
           }
         }
       }).observe(document.body, { childList: true });`,
    ),
  },
  {
    id: 'browser-tooltip-dispose-keeps-the-timer',
    target: 'razor',
    caseIds: [DISPOSE_PENDING],
    description:
      'a tooltip timer pending inside a closing popover still fires: a tooltip opens for a trigger that is gone',
    expect: { dimensions: [STATE], caseIds: [DISPOSE_PENDING] },
    beforeInteraction: onCases(
      [DISPOSE_PENDING],
      `const realClear = window.clearTimeout.bind(window);
       const realSet = window.setTimeout.bind(window);
       const pending = new Set();
       window.setTimeout = (callback, ms, ...rest) => {
         const id = realSet((...args) => {
           pending.delete(id);
           callback(...args);
           if (ms === 600) {
             const orphan = document.createElement('span');
             orphan.className = 'vf-tooltip__content vf-tooltip__content--top';
             orphan.setAttribute('role', 'tooltip');
             orphan.textContent = 'Inside hint';
             document.body.append(orphan);
           }
         }, ms, ...rest);
         if (ms === 600) pending.add(id);
         return id;
       };
       window.clearTimeout = (id) => { if (!pending.has(id)) realClear(id); };`,
    ),
  },

  // ------------------------------------------------------------ packaging
  {
    id: 'browser-tooltip-controller-missing',
    target: 'razor',
    caseIds: [HOVER_OPEN, FOCUS_OPEN],
    description: 'the browser controller is missing: nothing ever reaches a wrapper, and no tooltip opens',
    expect: { dimensions: [STATE, RELATIONSHIPS, 'dom.structure'], caseIds: [HOVER_OPEN, FOCUS_OPEN] },
    beforeInteraction: onCases(
      [HOVER_OPEN, FOCUS_OPEN],
      ['mouseenter', 'mouseleave', 'focusin', 'focusout'].map((type) => intercept(type, 'true')).join(''),
    ),
  },
  {
    id: 'browser-tooltip-css-missing',
    target: 'razor',
    caseIds: [HOVER_OPEN],
    description: "the package's tooltip rules are missing from the stylesheet",
    expect: { dimensions: ['visual.postInteraction', STATE], caseIds: [HOVER_OPEN] },
    beforeInteraction: onCases(
      [HOVER_OPEN],
      `let removed = 0;
       for (const sheet of document.styleSheets) {
         for (let index = sheet.cssRules.length - 1; index >= 0; index -= 1) {
           if ((sheet.cssRules[index].selectorText ?? '').includes('vf-tooltip')) { sheet.deleteRule(index); removed += 1; }
         }
       }
       if (removed === 0) throw new Error('MUTATION_NOT_APPLIED: no tooltip rules');`,
    ),
  },

  // ---------------------------------------------------------- current only
  {
    id: 'browser-tooltip-current-only-role',
    target: 'current',
    caseIds: [HOVER_OPEN],
    verifyIsolation: true,
    description: 'only the real current Vue tooltip announces role=status',
    expect: {
      dimensions: ['dom.aria'],
      caseIds: [HOVER_OPEN],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    afterInteraction: onCases([HOVER_OPEN], `${requireTooltip} theTooltip.setAttribute('role', 'status');`),
  },
];

// ------------------------------------------------------------------ policy

function push(policy, entry) {
  policy.approvedDivergences.push(entry);
}

const smuggled = (id, dimension, caseIds, description) => ({
  id,
  description,
  rejectedBy: 'validation',
  apply(policy) {
    push(policy, {
      id,
      dimension,
      target: 'razor',
      caseIds,
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'smuggled',
    });
  },
});

/** A well-formed approval on an approvable dimension that tolerates no real difference: rejected by accounting. */
const idle = (id, dimension, caseIds, detail, pathSelector, left, right, description) => ({
  id,
  description,
  rejectedBy: 'occurrences',
  apply(policy) {
    push(policy, {
      id,
      dimension,
      target: 'razor',
      caseIds,
      detail,
      pathSelector,
      left,
      right,
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'A deliberately idle entry used by the parity mutation harness.',
    });
  },
});

export const tooltipPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [HOVER_OPEN],
    'an approval for dom.structure - where the tooltip is',
  ),
  smuggled(
    'smuggled-state-approval',
    STATE,
    [UNHOVER_CLOSE],
    'an approval for the live state - the shape a "Razor removes the tooltip at once, nobody sees the leave" waiver would take',
  ),
  smuggled(
    'smuggled-timing-approval',
    STATE,
    [LONG_OPEN],
    'an approval for the timing record - the shape a "the delay is close enough" waiver would take',
  ),
  smuggled(
    'smuggled-relationship-approval',
    RELATIONSHIPS,
    [TWO_DIFFERENT],
    'an approval for the live reference between a trigger and its teleported tooltip',
  ),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [T_ATTRS],
    'an approval for a control the tooltip does not own',
  ),
  smuggled('smuggled-wildcard-case', 'dom.nativeAttributes', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-unknown-case',
    'dom.nativeAttributes',
    ['tooltip/teleport-to-element'],
    'an approval naming a case the catalog does not have - the shape a "Razor cannot teleport to an element" waiver would take',
  ),
  idle(
    'idle-position-approval',
    'dom.nativeAttributes',
    [HOVER_OPEN],
    'style',
    'span.vf-tooltip__content',
    'left:120px;top:38.4011px',
    'left:120px;top:38px',
    'a well-formed approval for a rounded tooltip position - the shape a "close enough" waiver would take. It tolerates a difference no target produces, so the accounting rejects it as unused',
  ),
];
