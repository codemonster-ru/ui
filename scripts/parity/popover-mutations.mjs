// Negative fixtures for the VfPopover parity profile.
//
// The M30 overlay, and the first profile whose defects include another
// component's: the escape stack VfPopover shares with VfDropdown and the
// unmount of a dropdown inside a closing popover. Every mutation names the
// case and the dimension that has to catch it, so a defect reported under the
// wrong dimension counts as missed. The attack letters are the M30 plan's.
//
// Three families, as for the earlier overlay:
//
//   - capture mutations edit a real capture after the fact - the cheap way to
//     prove a dimension reads a field at all, and the only way to make
//     current and Razor identically wrong so that only the reference sees it;
//   - browser mutations break a real page before extraction, before the
//     gesture or after it. The cross-component defects are installed as
//     listeners on the real Razor page: a second escape stack that takes the
//     Escape first (A), a dropdown menu that survives its popover's close (B),
//     a stale escape entry that takes the Escape after a teardown (C), a
//     shield that lets Escape fall through (I). The rest are the popover's own:
//     wiring, focus, dismissal, presence, geometry and transitions;
//   - policy mutations smuggle approvals the validator or the occurrence
//     accounting has to reject.
import { eachTheme, fail, findNode } from './mutations.mjs';

const P_DEFAULT = 'popover/default';
const P_OPEN = 'popover/open';
const P_TWO = 'popover/open-two';
const P_BOTTOM_END = 'popover/open-bottom-end';
const CLICK_OPEN = 'popover/interaction-click-open';
const CLICK_CLOSE = 'popover/interaction-click-close';
const CLICK_INSIDE = 'popover/interaction-click-inside';
const OUTSIDE_KEPT = 'popover/interaction-outside-click-kept';
const ENTER_TOGGLE = 'popover/interaction-enter-toggles-closed';
const REOPEN = 'popover/interaction-arrowdown-reopens';
const UNHANDLED = 'popover/interaction-unhandled-keys-closed';
const ESCAPE = 'popover/interaction-escape';
const ESCAPE_KEPT = 'popover/interaction-escape-kept';
const AUTOFOCUS_DATA_FIRST = 'popover/interaction-autofocus-data-first';
const BESIDE_POPOVER_LAST = 'popover/interaction-beside-popover-last';
const SHIELD = 'popover/interaction-shield';
const NESTED_INNER = 'popover/interaction-nested-escape-inner';
const TEARDOWN = 'popover/interaction-nested-enter-teardown';
const TEARDOWN_ESCAPE = 'popover/interaction-nested-teardown-escape';

const trigger = (node) => node.classes.includes('vf-popover__trigger');
const panel = (node) => node.classes.includes('vf-popover__content');

/**
 * Runs `body` once per case with the case root, its popover triggers, its
 * dropdown triggers and a resolver for a trigger's panel or menu in scope. The
 * body throws MUTATION_NOT_APPLIED when what it was written to break is not
 * there.
 */
function onCases(caseIds, body) {
  return `(() => {
    let applied = 0;
    const evidence = [];
    for (const caseId of ${JSON.stringify(caseIds)}) {
      const root = document.querySelector('[data-parity-case="' + caseId + '"]');
      if (!root) throw new Error('MUTATION_NOT_APPLIED: no case ' + caseId);
      const triggers = [...root.querySelectorAll('.vf-popover__trigger')];
      if (triggers.length === 0) throw new Error('MUTATION_NOT_APPLIED: no trigger in ' + caseId);
      const referenced = (element) => document.getElementById(element.getAttribute('aria-controls'));
      ${body}
      applied += 1;
      evidence.push({ caseId });
    }
    return { applied, evidence };
  })()`;
}

const requirePanel = `const thePanel = referenced(triggers[0]); if (!thePanel) throw new Error('MUTATION_NOT_APPLIED: no open panel');`;

/**
 * Closes the case's open dropdown the one way that does not go through the
 * escape stack and is not seen by the popover's outside listener: a click on
 * an item, stopped at the menu after the dropdown has handled it.
 */
const closeDropdownQuietly = `
  const closeDropdown = (dropdownTrigger) => {
    const menu = document.getElementById(dropdownTrigger.getAttribute('aria-controls'));
    if (!menu) return false;
    menu.addEventListener('click', (event) => event.stopPropagation(), { once: true });
    menu.querySelector('[role="menuitem"]').click();
    return true;
  };`;

// ------------------------------------------------------------------ capture

export const popoverParityMutations = [
  {
    id: 'popover-current-and-razor-identically-shift-the-panel',
    klass: 'native',
    description:
      'M: current and Razor both write the open panel one pixel to the right - identically, so current-vs-razor agrees and only the reference sees it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [P_OPEN],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const node = capture.extracted[P_OPEN].dom.find(panel);
          if (!node?.attributes.style) fail('no positioned panel');
          node.attributes.style = node.attributes.style.replace(
            /left:([\d.]+)px/,
            (all, value) => `left:${Number(value) + 1}px`,
          );
        });
      }
    },
  },
  {
    id: 'popover-followed-panel-missing',
    klass: 'structure',
    description: "the open panel is gone from Razor's followed targets, as if the edge to it were not declared",
    expect: { dimensions: ['dom.structure'], caseIds: [P_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.extracted[P_OPEN].dom;
        const index = dom.findIndex(panel);
        if (index < 0) fail('no followed panel in the capture');
        dom.splice(index, 1);
      });
    },
  },
  {
    id: 'popover-panel-labelled-by-other-token',
    klass: 'relationship',
    description: "E: the two panels' aria-labelledby resolve to each other's trigger position",
    expect: { dimensions: ['dom.relationships'], caseIds: [P_TWO] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const panels = capture.extracted[P_TWO].dom.filter(panel);
        if (panels.length !== 2) fail('two panels expected');
        [panels[0].attributes['aria-labelledby'], panels[1].attributes['aria-labelledby']] = [
          panels[1].attributes['aria-labelledby'],
          panels[0].attributes['aria-labelledby'],
        ];
      });
    },
  },
  {
    id: 'popover-panel-tabindex-in-capture',
    klass: 'native',
    description: 'the open panel loses tabindex=-1 in the capture',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [P_OPEN],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.extracted[P_OPEN].dom.find(panel);
        if (node?.attributes.tabindex !== '-1') fail('the panel does not carry tabindex=-1');
        delete node.attributes.tabindex;
      });
    },
  },
  {
    id: 'popover-snapshot-panel-identity',
    klass: 'ownership',
    description: 'the owned panel is recorded as a div, the count unchanged',
    expect: { dimensions: ['ownership.controls'], caseIds: [P_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = capture.interactions[P_OPEN].componentControls.find((entry) => entry.role === 'panel');
        if (control?.tag !== 'section') fail('the panel is not a section');
        control.tag = 'div';
      });
    },
  },
  {
    id: 'popover-snapshot-leave-cut-short',
    klass: 'state',
    description: 'P: the leave Razor ran after the second click ended early, the end state unchanged',
    expect: { dimensions: ['interaction.state'], caseIds: [CLICK_CLOSE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const list = capture.interactions[CLICK_CLOSE].transitions[0];
        const index = list.indexOf('leave:normal');
        if (index < 0) fail('no normal leave recorded');
        list[index] = 'leave:short';
      });
    },
  },
  {
    id: 'popover-snapshot-orphan-overlay',
    klass: 'state',
    description: 'B: the snapshot after the teardown records a menu nobody owns',
    expect: { dimensions: ['interaction.state'], caseIds: [TEARDOWN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[TEARDOWN];
        if (JSON.stringify(snapshot.bodyOverlays) !== '[]') fail('the teardown left overlays');
        snapshot.bodyOverlays = ['orphan'];
      });
    },
  },
  {
    id: 'popover-snapshot-events-reordered',
    klass: 'events',
    description: "the dropdown's open and the popover's close are logged in the opposite order",
    expect: { dimensions: ['interaction.events'], caseIds: [TEARDOWN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const events = capture.interactions[TEARDOWN].events;
        if (events.length !== 3) fail('three notifications expected');
        [events[1], events[2]] = [events[2], events[1]];
      });
    },
  },
  {
    id: 'popover-trigger-haspopup-in-capture',
    klass: 'aria',
    description: 'the closed trigger announces a menu popup',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-haspopup'] }, caseIds: [P_DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, P_DEFAULT, trigger, 'trigger');
        if (node.attributes['aria-haspopup'] !== 'dialog') fail('the trigger does not announce a dialog');
        node.attributes['aria-haspopup'] = 'menu';
      });
    },
  },
];

// ------------------------------------------------------------------ browser

export const popoverBrowserMutations = [
  // ------------------------------------------------------ cross-component (A, B, C, I)
  {
    id: 'browser-popover-separate-escape-stacks',
    target: 'razor',
    caseIds: [BESIDE_POPOVER_LAST],
    description:
      "A: the dropdown's escape stack is its own and registered first - the Escape closes the dropdown opened earlier and never reaches the popover on top",
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [BESIDE_POPOVER_LAST] },
    beforeInteraction: onCases(
      [BESIDE_POPOVER_LAST],
      `${closeDropdownQuietly}
       const dropdownTrigger = root.querySelector('.vf-dropdown__trigger');
       if (!dropdownTrigger) throw new Error('MUTATION_NOT_APPLIED: no dropdown beside the popover');
       window.addEventListener('keydown', (event) => {
         if (event.key !== 'Escape' || dropdownTrigger.getAttribute('aria-expanded') !== 'true') return;
         event.preventDefault();
         event.stopImmediatePropagation();
         closeDropdown(dropdownTrigger);
       }, true);`,
    ),
  },
  {
    id: 'browser-popover-nested-menu-orphaned',
    target: 'razor',
    caseIds: [TEARDOWN],
    description:
      "B: the popover's close does not unmount its nested dropdown - the teleported menu stays in <body> after the panel is gone",
    expect: { dimensions: ['interaction.state'], caseIds: [TEARDOWN] },
    beforeInteraction: onCases(
      [TEARDOWN],
      `new MutationObserver((records) => {
         for (const record of records) {
           for (const node of record.removedNodes) {
             if (node instanceof HTMLElement && node.classList.contains('vf-dropdown__menu') && !node.isConnected) document.body.append(node);
           }
         }
       }).observe(document.body, { childList: true });`,
    ),
  },
  {
    id: 'browser-popover-stale-escape-entry',
    target: 'razor',
    caseIds: [TEARDOWN_ESCAPE],
    description:
      "C: the unmounted dropdown's escape entry stays on the stack - the next Escape is taken by it and never reaches the popover below",
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [TEARDOWN_ESCAPE] },
    beforeInteraction: onCases(
      [TEARDOWN_ESCAPE],
      `const opened = [];
       document.addEventListener('vf-dropdown:open-change', (event) => { if (event.detail.open) opened.push(event.target); });
       window.addEventListener('keydown', (event) => {
         if (event.key !== 'Escape' || !opened.some((dropdown) => !dropdown.isConnected)) return;
         event.preventDefault();
         event.stopImmediatePropagation();
       }, true);`,
    ),
  },
  {
    id: 'browser-popover-orphan-and-stale-entry',
    target: 'razor',
    caseIds: [TEARDOWN_ESCAPE],
    description: 'B+C: the nested dropdown survives its popover both in <body> and on the escape stack',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [TEARDOWN_ESCAPE] },
    beforeInteraction: onCases(
      [TEARDOWN_ESCAPE],
      `const opened = [];
       document.addEventListener('vf-dropdown:open-change', (event) => { if (event.detail.open) opened.push(event.target); });
       new MutationObserver((records) => {
         for (const record of records) {
           for (const node of record.removedNodes) {
             if (node instanceof HTMLElement && node.classList.contains('vf-dropdown__menu') && !node.isConnected) document.body.append(node);
           }
         }
       }).observe(document.body, { childList: true });
       window.addEventListener('keydown', (event) => {
         if (event.key !== 'Escape' || !opened.some((dropdown) => !dropdown.isConnected)) return;
         event.preventDefault();
         event.stopImmediatePropagation();
       }, true);`,
    ),
  },
  {
    id: 'browser-popover-shield-falls-through',
    target: 'razor',
    caseIds: [SHIELD],
    description:
      'I: an Escape the closeOnEscape=false popover on top leaves alone falls through to the dropdown below, which takes it and closes',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [SHIELD] },
    // Registered on the document before the stack's own listener exists, so it
    // runs first and plays the entry below: it closes the dropdown and prevents
    // the Escape, as the dropdown's handler would, and the stack then skips it.
    beforeInteraction: onCases(
      [SHIELD],
      `${closeDropdownQuietly}
       const dropdownTrigger = root.querySelector('.vf-dropdown__trigger');
       document.addEventListener('keydown', (event) => {
         if (event.key !== 'Escape' || triggers[0].getAttribute('aria-expanded') !== 'true') return;
         if (dropdownTrigger.getAttribute('aria-expanded') !== 'true') return;
         event.preventDefault();
         closeDropdown(dropdownTrigger);
       });`,
    ),
  },
  {
    id: 'browser-popover-inner-escape-closes-the-popover',
    target: 'razor',
    caseIds: [NESTED_INNER],
    description: 'the first Escape closes the popover over its open nested dropdown instead of the dropdown',
    expect: { dimensions: ['interaction.state', 'interaction.events', 'interaction.focus'], caseIds: [NESTED_INNER] },
    beforeInteraction: onCases(
      [NESTED_INNER],
      `window.addEventListener('keydown', (event) => {
         if (event.key !== 'Escape' || triggers[0].getAttribute('aria-expanded') !== 'true') return;
         event.preventDefault();
         event.stopImmediatePropagation();
         triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
       }, true);`,
    ),
  },

  // ------------------------------------------------------------ relationships (D, E, F)
  {
    id: 'browser-popover-trigger-controls-other-panel',
    target: 'razor',
    caseIds: [P_TWO],
    description: "D: the first real Razor trigger's aria-controls names the second popover's panel",
    expect: { dimensions: ['dom.relationships', 'interaction.relationships'], caseIds: [P_TWO] },
    beforeExtract: onCases(
      [P_TWO],
      `if (triggers.length !== 2) throw new Error('MUTATION_NOT_APPLIED: two triggers expected');
       triggers[0].setAttribute('aria-controls', triggers[1].getAttribute('aria-controls'));`,
    ),
  },
  {
    id: 'browser-popover-panel-labelled-by-wrong-trigger',
    target: 'razor',
    caseIds: [P_TWO],
    // Both triggers read "Details", so the accessible name cannot tell the two
    // apart: the edge is what differs, in the DOM graph and on the live DOM.
    description: "E: the first real Razor panel is labelled by the second popover's trigger",
    expect: { dimensions: ['dom.relationships', 'interaction.relationships'], caseIds: [P_TWO] },
    beforeExtract: onCases(
      [P_TWO],
      `const thePanel = referenced(triggers[0]); if (!thePanel) throw new Error('MUTATION_NOT_APPLIED: no open panel');
       thePanel.setAttribute('aria-labelledby', triggers[1].id);`,
    ),
  },
  {
    id: 'browser-popover-cross-wired',
    target: 'razor',
    caseIds: [P_TWO],
    // Consistently cross-wired: each trigger still reaches a dialog labelled by
    // it, so the live per-instance check is satisfied - only the document-order
    // tokens of M28.0 can tell the swapped pair from the correct one.
    description: "F: the two identical real Razor popovers control and are labelled by each other's halves",
    expect: { dimensions: ['dom.relationships'], caseIds: [P_TWO] },
    beforeExtract: onCases(
      [P_TWO],
      `if (triggers.length !== 2) throw new Error('MUTATION_NOT_APPLIED: two triggers expected');
       const panels = triggers.map(referenced);
       const first = triggers[0].getAttribute('aria-controls');
       triggers[0].setAttribute('aria-controls', triggers[1].getAttribute('aria-controls'));
       triggers[1].setAttribute('aria-controls', first);
       panels[0].setAttribute('aria-labelledby', triggers[1].id);
       panels[1].setAttribute('aria-labelledby', triggers[0].id);`,
    ),
  },

  // ----------------------------------------------------------------- focus (G, H)
  {
    id: 'browser-popover-pointer-open-keeps-trigger-focus',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description: 'G: a real Razor pointer open leaves focus on the trigger, as the dropdown does',
    expect: { dimensions: ['interaction.focus'], caseIds: [CLICK_OPEN] },
    afterInteraction: onCases([CLICK_OPEN], `triggers[0].focus();`),
  },
  {
    id: 'browser-popover-wrong-autofocus-target',
    target: 'razor',
    caseIds: [AUTOFOCUS_DATA_FIRST],
    description: 'H: the real Razor open prefers [autofocus] over an earlier [data-autofocus]',
    expect: { dimensions: ['interaction.focus'], caseIds: [AUTOFOCUS_DATA_FIRST] },
    afterInteraction: onCases(
      [AUTOFOCUS_DATA_FIRST],
      `${requirePanel} const target = thePanel.querySelector('[autofocus]'); if (!target) throw new Error('MUTATION_NOT_APPLIED: no [autofocus]'); target.focus();`,
    ),
  },
  {
    id: 'browser-popover-close-keeps-focus',
    target: 'razor',
    caseIds: [ESCAPE],
    description: 'a real Razor Escape closes the popover and leaves focus where it was',
    expect: { dimensions: ['interaction.focus'], caseIds: [ESCAPE] },
    afterInteraction: onCases([ESCAPE], `document.body.focus(); document.activeElement.blur?.();`),
  },

  // -------------------------------------------------------------- dismissal (J, K)
  {
    id: 'browser-popover-outside-click-ignores-the-switch',
    target: 'razor',
    caseIds: [OUTSIDE_KEPT],
    description: 'J: closeOnOutsideClick=false still closes the real Razor popover on an outside click',
    expect: { dimensions: ['interaction.state', 'interaction.events', 'interaction.focus'], caseIds: [OUTSIDE_KEPT] },
    beforeInteraction: onCases(
      [OUTSIDE_KEPT],
      `root.querySelector('.parity-after-control').addEventListener('click', () => {
         if (triggers[0].getAttribute('aria-expanded') === 'true') triggers[0].click();
       });`,
    ),
  },
  {
    id: 'browser-popover-inside-click-closes',
    target: 'razor',
    caseIds: [CLICK_INSIDE],
    description: 'K: a click on a button inside the real Razor panel closes it, as a closeOnSelect would',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [CLICK_INSIDE] },
    beforeInteraction: onCases(
      [CLICK_INSIDE],
      `document.addEventListener('click', (event) => {
         const thePanel = referenced(triggers[0]);
         if (thePanel && thePanel.contains(event.target) && event.target !== thePanel) triggers[0].click();
       });`,
    ),
  },
  {
    id: 'browser-popover-escape-ignores-the-switch',
    target: 'razor',
    caseIds: [ESCAPE_KEPT],
    description: 'closeOnEscape=false still closes the real Razor popover on Escape',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [ESCAPE_KEPT] },
    beforeInteraction: onCases(
      [ESCAPE_KEPT],
      `window.addEventListener('keydown', (event) => {
         if (event.key !== 'Escape' || triggers[0].getAttribute('aria-expanded') !== 'true') return;
         event.preventDefault();
         event.stopImmediatePropagation();
         triggers[0].click();
       }, true);`,
    ),
  },

  // --------------------------------------------------------------- keyboard
  {
    id: 'browser-popover-enter-reopens',
    target: 'razor',
    caseIds: [ENTER_TOGGLE],
    description:
      'Enter on the open real Razor trigger opens it again, as the dropdown does, instead of toggling it closed',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [ENTER_TOGGLE] },
    beforeInteraction: onCases(
      [ENTER_TOGGLE],
      `document.addEventListener('keydown', (event) => {
         if (event.key !== 'Enter' || event.target !== triggers[0] || triggers[0].getAttribute('aria-expanded') !== 'true') return;
         event.preventDefault();
         event.stopImmediatePropagation();
         triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
       }, true);`,
    ),
  },
  {
    id: 'browser-popover-reopen-silent',
    target: 'razor',
    caseIds: [REOPEN],
    description: 'ArrowDown on the open real Razor popover no longer notifies again',
    expect: { dimensions: ['interaction.events'], caseIds: [REOPEN] },
    beforeInteraction: onCases(
      [REOPEN],
      `document.addEventListener('keydown', (event) => {
         if (event.key !== 'ArrowDown' || event.target !== triggers[0] || triggers[0].getAttribute('aria-expanded') !== 'true') return;
         event.preventDefault();
         event.stopImmediatePropagation();
         referenced(triggers[0])?.focus();
       }, true);`,
    ),
  },
  {
    id: 'browser-popover-arrowup-prevented',
    target: 'razor',
    caseIds: [UNHANDLED],
    description: 'ArrowUp on the closed real Razor trigger is prevented',
    expect: { dimensions: ['interaction.state'], caseIds: [UNHANDLED] },
    beforeInteraction: onCases(
      [UNHANDLED],
      `triggers[0].addEventListener('keydown', (event) => { if (event.key === 'ArrowUp') event.preventDefault(); });`,
    ),
  },

  // ------------------------------------------------------------ presence (L)
  {
    id: 'browser-popover-closed-content-mounted',
    target: 'razor',
    caseIds: [P_DEFAULT],
    description: 'L: the closed real Razor popover keeps its panel mounted in <body>, hidden',
    expect: { dimensions: ['dom.structure', 'dom.relationships'], caseIds: [P_DEFAULT] },
    beforeExtract: onCases(
      [P_DEFAULT],
      `const hidden = document.createElement('section');
       hidden.id = triggers[0].getAttribute('aria-controls');
       hidden.className = 'vf-popover__content';
       hidden.setAttribute('role', 'dialog');
       hidden.setAttribute('tabindex', '-1');
       hidden.setAttribute('aria-labelledby', triggers[0].id);
       hidden.hidden = true;
       document.body.append(hidden);`,
    ),
  },
  {
    id: 'browser-popover-never-removed',
    target: 'razor',
    caseIds: [CLICK_CLOSE],
    description: 'L: the leaving real Razor panel is never removed',
    expect: { dimensions: ['interaction.state', 'dom.structure', 'interaction.convergence'], caseIds: [CLICK_CLOSE] },
    beforeInteraction: onCases(
      [CLICK_CLOSE],
      `const remove = Element.prototype.remove;
       Element.prototype.remove = function () {
         if (this.classList?.contains('vf-popover__content')) return undefined;
         return remove.call(this);
       };`,
    ),
  },
  {
    id: 'browser-popover-panel-kept-in-root',
    target: 'razor',
    caseIds: [P_OPEN],
    description: 'the real Razor panel stays inside the component root instead of <body>',
    expect: { dimensions: ['dom.structure', 'interaction.state'], caseIds: [P_OPEN] },
    beforeExtract: onCases([P_OPEN], `${requirePanel} triggers[0].after(thePanel);`),
  },

  // ------------------------------------------------------ geometry, time (N, P)
  {
    id: 'browser-popover-wrong-placement',
    target: 'razor',
    caseIds: [P_BOTTOM_END],
    description: 'N: the real Razor bottom-end panel is positioned as bottom-start',
    expect: { dimensions: ['dom.nativeAttributes', 'interaction.state'], caseIds: [P_BOTTOM_END] },
    beforeExtract: onCases(
      [P_BOTTOM_END],
      `${requirePanel}
       const align = () => {
         const left = triggers[0].getBoundingClientRect().left + 'px';
         if (thePanel.style.left !== left) thePanel.style.left = left;
       };
       align();
       new MutationObserver(align).observe(thePanel, { attributes: true, attributeFilter: ['style'] });`,
    ),
  },
  {
    id: 'browser-popover-removed-early',
    target: 'razor',
    caseIds: [CLICK_CLOSE],
    description: 'P: the leaving real Razor panel is removed the moment its leave begins',
    expect: { dimensions: ['interaction.state'], caseIds: [CLICK_CLOSE] },
    beforeInteraction: onCases(
      [CLICK_CLOSE],
      `new MutationObserver(() => {
         const target = referenced(triggers[0]);
         if (target && target.classList.contains('vf-floating-transition-leave-active')) target.remove();
       }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });`,
    ),
  },

  // ------------------------------------------------------------ current-only (O)
  {
    id: 'browser-popover-current-only-labelled-by-nothing',
    target: 'current',
    caseIds: [P_OPEN],
    verifyIsolation: true,
    description: 'O: only the real current Vue panel is labelled by an element that does not exist',
    expect: {
      dimensions: ['dom.relationships'],
      caseIds: [P_OPEN],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: onCases([P_OPEN], `${requirePanel} thePanel.setAttribute('aria-labelledby', 'vf-nowhere');`),
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

export const popoverPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [P_OPEN],
    'an approval for dom.structure - where the panel is',
  ),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [P_OPEN],
    'an approval for the owned trigger and panel',
  ),
  smuggled(
    'smuggled-state-approval',
    'interaction.state',
    [TEARDOWN],
    'an approval for the live state - the shape a "Razor leaves the nested menu, it goes on the next click" waiver would take',
  ),
  smuggled(
    'smuggled-events-approval',
    'interaction.events',
    [TEARDOWN_ESCAPE],
    'an approval for the notification log - the shape a "the stale entry is harmless" waiver would take',
  ),
  smuggled(
    'smuggled-relationship-approval',
    'interaction.relationships',
    [CLICK_OPEN],
    'an approval for the live relationship between a trigger and its teleported panel',
  ),
  smuggled('smuggled-wildcard-case', 'dom.nativeAttributes', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-unknown-case',
    'dom.nativeAttributes',
    ['popover/teleport-to-element'],
    'an approval naming a case the catalog does not have - the shape a "Razor cannot teleport to an element" waiver would take',
  ),
  idle(
    'idle-position-approval',
    'dom.nativeAttributes',
    [P_OPEN],
    'style',
    'section.vf-popover__content',
    'left:24px;top:63.0711px',
    'left:24px;top:63px',
    'a well-formed approval for a rounded panel position - the shape a "close enough" waiver would take. It tolerates a difference no target produces, so the accounting rejects it as unused',
  ),
];
