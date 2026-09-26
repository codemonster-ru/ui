// Negative fixtures for the VfDropdown parity profile.
//
// The M28 overlay: a trigger wrapper the component owns, and a role=menu it
// creates, teleports, positions and animates. Every mutation names the case
// and the dimension that has to catch it, so a defect reported under the
// wrong dimension counts as missed.
//
// Three families, as for the earlier interactive profiles:
//
//   - capture mutations edit a real capture after the fact - the cheap way to
//     prove a dimension reads a field at all, and the only way to make
//     current and Razor identically wrong so that only the reference sees it;
//   - browser mutations break a real page before extraction, before the
//     gesture or after it. The behaviour defects are installed as listeners
//     on the real Razor page - ArrowUp that opens, a walk that skips a
//     disabled item, Tab that closes, an inside click that is swallowed, an
//     outside click that never reaches the document, an Escape that closes the
//     wrong instance - and the floating and transition defects as observers
//     that pin a position, drop autoUpdate's wiring, remove a leaving menu
//     early or never. Two run on the current Vue page with isolation verified;
//   - policy mutations smuggle approvals the validator or the occurrence
//     accounting has to reject.
import { eachTheme, fail, findNode } from './mutations.mjs';

const D_DEFAULT = 'dropdown/default';
const D_OPEN = 'dropdown/open';
const D_TWO = 'dropdown/open-two';
const D_PILLS = 'dropdown/open-pills';
const D_IN_PLACE = 'dropdown/open-in-place';
const D_DISABLED = 'dropdown/disabled';
const CLICK_OPEN = 'dropdown/interaction-click-open';
const CLICK_CLOSE = 'dropdown/interaction-click-close';
const ARROWDOWN_OPEN = 'dropdown/interaction-arrowdown-open';
const ARROWUP_CLOSED = 'dropdown/interaction-arrowup-closed';
const DISABLED_BLOCKS = 'dropdown/interaction-disabled-blocks';
const TAB_IN_MENU = 'dropdown/interaction-tab-in-menu';
const CLICK_ARROW = 'dropdown/interaction-click-arrow';
const CLICK_DISABLED_ITEM = 'dropdown/interaction-click-disabled-item';
const KEEP_OPEN = 'dropdown/interaction-keep-open';
const OUTSIDE = 'dropdown/interaction-outside-click';
const ESCAPE_LIFO = 'dropdown/interaction-escape-lifo';
const TWO_OPEN = 'dropdown/interaction-two-keyboard-open';
const REEMIT = 'dropdown/interaction-reemit';
const SCROLL = 'dropdown/interaction-scroll-follow';

const trigger = (node) => node.classes.includes('vf-dropdown__trigger');
const menu = (node) => node.classes.includes('vf-dropdown__menu');

/**
 * Runs `body` once per case with the case root, its triggers and a resolver
 * for a trigger's menu in scope. The body throws MUTATION_NOT_APPLIED when
 * what it was written to break is not there.
 */
function onCases(caseIds, body) {
  return `(() => {
    let applied = 0;
    const evidence = [];
    for (const caseId of ${JSON.stringify(caseIds)}) {
      const root = document.querySelector('[data-parity-case="' + caseId + '"]');
      if (!root) throw new Error('MUTATION_NOT_APPLIED: no case ' + caseId);
      const triggers = [...root.querySelectorAll('.vf-dropdown__trigger')];
      if (triggers.length === 0) throw new Error('MUTATION_NOT_APPLIED: no trigger in ' + caseId);
      const menuOf = (element) => document.getElementById(element.getAttribute('aria-controls'));
      ${body}
      applied += 1;
      evidence.push({ caseId });
    }
    return { applied, evidence };
  })()`;
}

const requireMenu = `const theMenu = menuOf(triggers[0]); if (!theMenu) throw new Error('MUTATION_NOT_APPLIED: no open menu');`;

/**
 * An observer that keeps rewriting the case's menu position, as a floating
 * implementation that never ran or ran with other inputs would leave it. The
 * guard stops it answering its own write.
 */
const pinPosition = (leftExpression, topExpression) => `
  new MutationObserver(() => {
    const target = menuOf(triggers[0]);
    if (!target) return;
    const left = ${leftExpression};
    const top = ${topExpression};
    if (target.style.left !== left || target.style.top !== top) {
      target.style.left = left;
      target.style.top = top;
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });`;

// ------------------------------------------------------------------ capture

export const dropdownParityMutations = [
  {
    id: 'dropdown-current-and-razor-identically-lose-expanded',
    klass: 'aria',
    description:
      'current and Razor both drop aria-expanded from the closed trigger - identically, so current-vs-razor agrees and only the reference sees it',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['aria-expanded'] },
      caseIds: [D_DEFAULT],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const node = findNode(capture, D_DEFAULT, trigger, 'trigger');
          if (node.attributes['aria-expanded'] !== 'false') fail('the trigger is not closed');
          delete node.attributes['aria-expanded'];
        });
      }
    },
  },
  {
    id: 'dropdown-followed-menu-missing',
    klass: 'structure',
    description: "the open menu is gone from Razor's followed targets, as if the edge to it were not declared",
    expect: { dimensions: ['dom.structure'], caseIds: [D_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.extracted[D_OPEN].dom;
        const index = dom.findIndex(menu);
        if (index < 0) fail('no followed menu in the capture');
        dom.splice(index, 1);
      });
    },
  },
  {
    id: 'dropdown-menu-labelled-by-other-token',
    klass: 'relationship',
    description: "the menu's aria-labelledby resolves to another position in the case",
    expect: { dimensions: ['dom.relationships'], caseIds: [D_TWO] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const menus = capture.extracted[D_TWO].dom.filter(menu);
        if (menus.length !== 2) fail('two menus expected');
        [menus[0].attributes['aria-labelledby'], menus[1].attributes['aria-labelledby']] = [
          menus[1].attributes['aria-labelledby'],
          menus[0].attributes['aria-labelledby'],
        ];
      });
    },
  },
  {
    id: 'dropdown-trigger-tabindex-in-capture',
    klass: 'native',
    description: 'the disabled trigger keeps tabindex 0',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [D_DISABLED],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, D_DISABLED, trigger, 'trigger');
        if (node.attributes.tabindex !== '-1') fail('the trigger is not disabled');
        node.attributes.tabindex = '0';
      });
    },
  },
  {
    id: 'dropdown-snapshot-location-moved',
    klass: 'state',
    description: "the snapshot reports Razor's open menu somewhere other than <body>",
    expect: { dimensions: ['interaction.state'], caseIds: [D_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const state = capture.interactions[D_OPEN].menuStates[0];
        if (state?.location !== 'body') fail('the menu is not in body');
        state.location = 'elsewhere';
      });
    },
  },
  {
    id: 'dropdown-snapshot-leave-cut-short',
    klass: 'state',
    description: 'the leave Razor ran after the second click ended early',
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
    id: 'dropdown-snapshot-events-reordered',
    klass: 'events',
    description: 'the open and the close are logged in the opposite order',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_CLOSE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const events = capture.interactions[CLICK_CLOSE].events;
        if (events.length !== 2) fail('two notifications expected');
        events.reverse();
      });
    },
  },
  {
    id: 'dropdown-snapshot-focus-moved',
    klass: 'focus',
    description: 'keyboard open focuses the second item rather than the first',
    expect: { dimensions: ['interaction.focus'], caseIds: [ARROWDOWN_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[ARROWDOWN_OPEN];
        if (snapshot.focusItem !== 'Edit') fail('the first item is not focused');
        snapshot.focusItem = 'Duplicate';
      });
    },
  },
  {
    id: 'dropdown-snapshot-trigger-identity',
    klass: 'ownership',
    description: 'the owned trigger is recorded as a button with a role, the count unchanged',
    expect: { dimensions: ['ownership.controls'], caseIds: [D_DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = capture.interactions[D_DEFAULT].componentControls[0];
        if (control?.tag !== 'div') fail('the trigger is not a div');
        control.tag = 'button';
        control.ariaRole = 'button';
      });
    },
  },
  {
    id: 'dropdown-snapshot-arrowup-prevented',
    klass: 'state',
    description: 'ArrowUp on the closed trigger is recorded as prevented',
    expect: { dimensions: ['interaction.state'], caseIds: [ARROWUP_CLOSED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const record = capture.interactions[ARROWUP_CLOSED].keydownPrevented;
        if (record[0] !== 'ArrowUp:false') fail('ArrowUp was not left alone');
        record[0] = 'ArrowUp:true';
      });
    },
  },
  {
    id: 'dropdown-post-close-menu-left-behind',
    klass: 'convergence',
    description: "Razor's post-close DOM still carries the menu",
    expect: { dimensions: ['interaction.convergence', 'dom.structure'], caseIds: [CLICK_CLOSE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom?.[CLICK_CLOSE];
        const opened = capture.extracted[D_OPEN].dom.find(menu);
        if (!dom || !opened) fail('no post-close DOM or no menu to copy');
        dom.push(structuredClone(opened));
      });
    },
  },
  {
    id: 'dropdown-post-open-position-moved',
    klass: 'native',
    description: "Razor's opened menu is written one pixel to the right",
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [CLICK_OPEN],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.interactionDom?.[CLICK_OPEN]?.find(menu);
        if (!node?.attributes.style) fail('no positioned menu after the click');
        node.attributes.style = node.attributes.style.replace(
          /left:(\d+)px/,
          (all, value) => `left:${Number(value) + 1}px`,
        );
      });
    },
  },
];

// ------------------------------------------------------------------ browser

export const dropdownBrowserMutations = [
  // ------------------------------------------------------- relationships (A-C, U, V)
  {
    id: 'browser-dropdown-controls-dangling',
    target: 'razor',
    caseIds: [D_OPEN],
    description: "A: the real Razor trigger's aria-controls names no element while the menu is open",
    expect: { dimensions: ['dom.relationships', 'dom.structure', 'interaction.relationships'], caseIds: [D_OPEN] },
    beforeExtract: onCases(
      [D_OPEN],
      `${requireMenu} triggers[0].setAttribute('aria-controls', theMenu.id + '-wrong');`,
    ),
  },
  {
    id: 'browser-dropdown-labelledby-wrong',
    target: 'razor',
    caseIds: [D_OPEN],
    description: 'B: the real Razor menu is labelled by an element that does not exist',
    expect: { dimensions: ['dom.relationships', 'interaction.relationships', 'a11y.name'], caseIds: [D_OPEN] },
    beforeExtract: onCases([D_OPEN], `${requireMenu} theMenu.setAttribute('aria-labelledby', 'vf-nowhere');`),
  },
  {
    id: 'browser-dropdown-cross-wired',
    target: 'razor',
    caseIds: [D_TWO],
    description: "C: the two real Razor triggers control each other's menu",
    expect: { dimensions: ['dom.relationships', 'interaction.relationships'], caseIds: [D_TWO] },
    beforeExtract: onCases(
      [D_TWO],
      `if (triggers.length !== 2) throw new Error('MUTATION_NOT_APPLIED: two triggers expected');
       const first = triggers[0].getAttribute('aria-controls');
       triggers[0].setAttribute('aria-controls', triggers[1].getAttribute('aria-controls'));
       triggers[1].setAttribute('aria-controls', first);`,
    ),
  },
  {
    id: 'browser-dropdown-duplicate-trigger-ids',
    target: 'razor',
    caseIds: [D_TWO],
    description: "U: the second real Razor trigger takes the first one's generated id",
    expect: { dimensions: ['dom.relationships'], caseIds: [D_TWO] },
    beforeExtract: onCases(
      [D_TWO],
      `if (triggers.length !== 2) throw new Error('MUTATION_NOT_APPLIED: two triggers expected');
       triggers[1].id = triggers[0].id;`,
    ),
  },
  {
    id: 'browser-dropdown-menu-id-moved',
    target: 'razor',
    caseIds: [D_OPEN],
    description:
      "V: the real Razor menu's id no longer matches the trigger's aria-controls, so the edge is not followed",
    expect: { dimensions: ['dom.structure', 'dom.relationships', 'interaction.relationships'], caseIds: [D_OPEN] },
    beforeExtract: onCases([D_OPEN], `${requireMenu} theMenu.id = theMenu.id + '-moved';`),
  },

  // ------------------------------------------------------------ teleport (D, E)
  {
    id: 'browser-dropdown-menu-kept-in-root',
    target: 'razor',
    caseIds: [D_OPEN],
    description: 'D: the real Razor menu stays inside the component root instead of <body>',
    expect: { dimensions: ['dom.structure', 'interaction.state'], caseIds: [D_OPEN] },
    beforeExtract: onCases([D_OPEN], `${requireMenu} triggers[0].after(theMenu);`),
  },
  {
    id: 'browser-dropdown-menu-kept-in-root-after-open',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description: 'D: a real pointer open leaves the Razor menu inside the component root',
    expect: { dimensions: ['dom.structure', 'interaction.state'], caseIds: [CLICK_OPEN] },
    afterInteraction: onCases([CLICK_OPEN], `${requireMenu} triggers[0].after(theMenu);`),
  },
  {
    id: 'browser-dropdown-menu-wrong-destination',
    target: 'razor',
    caseIds: [D_OPEN],
    description:
      'E: the real Razor menu is teleported into a wrapper rather than <body> - the element and its edges are unchanged, so only where it is can tell',
    expect: { dimensions: ['interaction.state'], caseIds: [D_OPEN] },
    beforeExtract: onCases(
      [D_OPEN],
      `${requireMenu} const host = document.createElement('div'); document.body.append(host); host.append(theMenu);`,
    ),
  },
  {
    id: 'browser-dropdown-in-place-teleported',
    target: 'razor',
    caseIds: [D_IN_PLACE],
    description: 'the real Razor menu of a disableTeleport dropdown is moved to <body>',
    expect: { dimensions: ['dom.structure', 'interaction.state'], caseIds: [D_IN_PLACE] },
    beforeExtract: onCases([D_IN_PLACE], `${requireMenu} document.body.append(theMenu);`),
  },

  // ----------------------------------------------------------------- keyboard (F-H, M)
  {
    id: 'browser-dropdown-arrowup-opens',
    target: 'razor',
    caseIds: [ARROWUP_CLOSED],
    description: 'F: ArrowUp on the real closed Razor trigger opens it, as the menu-button pattern suggests',
    expect: {
      dimensions: ['interaction.state', 'interaction.events', 'interaction.convergence'],
      caseIds: [ARROWUP_CLOSED],
    },
    beforeInteraction: onCases(
      [ARROWUP_CLOSED],
      `document.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowUp' || event.target !== triggers[0]) return;
        event.preventDefault();
        triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
      }, true);`,
    ),
  },
  {
    id: 'browser-dropdown-disabled-item-skipped',
    target: 'razor',
    caseIds: [DISABLED_BLOCKS],
    description: 'G: the real Razor walk skips the disabled items instead of stopping at them',
    expect: { dimensions: ['interaction.focus'], caseIds: [DISABLED_BLOCKS] },
    beforeInteraction: onCases(
      [DISABLED_BLOCKS],
      `document.addEventListener('keydown', (event) => {
        const target = menuOf(triggers[0]);
        if (event.key !== 'ArrowDown' || !target || !target.contains(document.activeElement)) return;
        const items = [...target.querySelectorAll('[role="menuitem"]')];
        const next = items.slice(items.indexOf(document.activeElement) + 1)
          .find((item) => !item.disabled && item.getAttribute('aria-disabled') !== 'true');
        if (!next) return;
        event.preventDefault();
        event.stopPropagation();
        next.focus();
      }, true);`,
    ),
  },
  {
    id: 'browser-dropdown-tab-closes',
    target: 'razor',
    caseIds: [TAB_IN_MENU],
    description: 'H: Tab inside the real Razor menu closes it',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [TAB_IN_MENU] },
    beforeInteraction: onCases(
      [TAB_IN_MENU],
      `document.addEventListener('keydown', (event) => {
        const target = menuOf(triggers[0]);
        if (event.key === 'Tab' && target && target.contains(document.activeElement)) triggers[0].click();
      }, true);`,
    ),
  },
  {
    id: 'browser-dropdown-keyboard-open-keeps-trigger-focus',
    target: 'razor',
    caseIds: [ARROWDOWN_OPEN],
    description: 'M: a real keyboard open leaves focus on the Razor trigger instead of the first item',
    expect: { dimensions: ['interaction.focus'], caseIds: [ARROWDOWN_OPEN] },
    afterInteraction: onCases([ARROWDOWN_OPEN], `triggers[0].focus();`),
  },
  {
    id: 'browser-dropdown-reemit-dropped',
    target: 'razor',
    caseIds: [REEMIT],
    description: 'an opening key on the open Razor dropdown no longer notifies again',
    expect: { dimensions: ['interaction.events'], caseIds: [REEMIT] },
    beforeInteraction: onCases(
      [REEMIT],
      `document.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowDown' || event.target !== triggers[0] || triggers[0].getAttribute('aria-expanded') !== 'true') return;
        event.preventDefault();
        event.stopPropagation();
        menuOf(triggers[0])?.querySelector('[role="menuitem"]')?.focus();
      }, true);`,
    ),
  },

  // ------------------------------------------------------------------ pointer (I, J, L)
  {
    id: 'browser-dropdown-inside-click-ignored',
    target: 'razor',
    caseIds: [CLICK_ARROW],
    description: 'I: a real click inside the Razor menu on no item does not close it',
    expect: {
      dimensions: ['interaction.state', 'interaction.events', 'interaction.convergence'],
      caseIds: [CLICK_ARROW],
    },
    beforeInteraction: onCases(
      [CLICK_ARROW],
      `document.addEventListener('click', (event) => {
        const target = menuOf(triggers[0]);
        if (target && target.contains(event.target)) event.stopPropagation();
      }, true);`,
    ),
  },
  {
    id: 'browser-dropdown-outside-click-ignored',
    target: 'razor',
    caseIds: [OUTSIDE],
    description: 'J: a real outside click never reaches the Razor dropdown',
    expect: {
      dimensions: ['interaction.state', 'interaction.events', 'interaction.focus', 'interaction.convergence'],
      caseIds: [OUTSIDE],
    },
    beforeInteraction: onCases(
      [OUTSIDE],
      `document.addEventListener('click', (event) => {
        if (event.target.closest?.('.parity-after-control')) event.stopPropagation();
      }, true);`,
    ),
  },
  {
    id: 'browser-dropdown-pointer-open-focuses-item',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description: 'L: a real pointer open moves focus to the first Razor item',
    expect: { dimensions: ['interaction.focus'], caseIds: [CLICK_OPEN] },
    afterInteraction: onCases([CLICK_OPEN], `${requireMenu} theMenu.querySelector('[role="menuitem"]').focus();`),
  },
  {
    id: 'browser-dropdown-disabled-item-click-closes',
    target: 'razor',
    caseIds: [CLICK_DISABLED_ITEM],
    description: 'a real press on a disabled Razor item closes the menu',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [CLICK_DISABLED_ITEM] },
    beforeInteraction: onCases(
      [CLICK_DISABLED_ITEM],
      `document.addEventListener('pointerdown', (event) => {
        if (event.target.closest?.('[role="menuitem"][disabled]')) triggers[0].click();
      }, true);`,
    ),
  },
  {
    id: 'browser-dropdown-keep-open-ignored',
    target: 'razor',
    caseIds: [KEEP_OPEN],
    description: 'closeOnSelect=false is ignored: a real item click closes the Razor menu',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [KEEP_OPEN] },
    beforeInteraction: onCases(
      [KEEP_OPEN],
      `document.addEventListener('click', (event) => {
        const target = menuOf(triggers[0]);
        if (target && target.contains(event.target) && event.target.getAttribute('role') === 'menuitem') triggers[0].click();
      }, true);`,
    ),
  },

  // ------------------------------------------------------------- Escape and instances (K)
  {
    id: 'browser-dropdown-escape-closes-first',
    target: 'razor',
    caseIds: [ESCAPE_LIFO],
    description: 'K: Escape closes the first-opened Razor dropdown instead of the most recent',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [ESCAPE_LIFO] },
    beforeInteraction: onCases(
      [ESCAPE_LIFO],
      `window.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (triggers[0].getAttribute('aria-expanded') === 'true') triggers[0].click();
      }, true);`,
    ),
  },
  {
    id: 'browser-dropdown-mutual-exclusion',
    target: 'razor',
    caseIds: [TWO_OPEN],
    description: 'opening the second Razor dropdown closes the first - an exclusion the reference does not have',
    expect: { dimensions: ['interaction.state', 'interaction.events'], caseIds: [TWO_OPEN] },
    beforeInteraction: onCases(
      [TWO_OPEN],
      `document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' && event.target === triggers[1] && triggers[0].getAttribute('aria-expanded') === 'true') triggers[0].click();
      }, true);`,
    ),
  },

  // ----------------------------------------------------------- ARIA, identity (W)
  {
    id: 'browser-dropdown-haspopup-true',
    target: 'razor',
    caseIds: [D_DEFAULT],
    description:
      'the real Razor trigger announces aria-haspopup="true" - Chrome derives the same popup type from it, so the tree cannot tell; the M28 false PASS on the DOM dimension',
    expect: {
      dimensions: ['dom.aria', 'ownership.controls'],
      details: { 'dom.aria': ['aria-haspopup'] },
      caseIds: [D_DEFAULT],
    },
    beforeExtract: onCases([D_DEFAULT], `triggers[0].setAttribute('aria-haspopup', 'true');`),
  },
  {
    id: 'browser-dropdown-trigger-becomes-button',
    target: 'razor',
    caseIds: [D_DEFAULT],
    description:
      'W: the real Razor trigger wrapper is a button carrying the same attributes - one owned control either way',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [D_DEFAULT] },
    beforeExtract: onCases(
      [D_DEFAULT],
      `const button = document.createElement('button');
       for (const attribute of triggers[0].attributes) button.setAttribute(attribute.name, attribute.value);
       button.append(...triggers[0].childNodes);
       triggers[0].replaceWith(button);`,
    ),
  },
  {
    id: 'browser-dropdown-role-moved-to-trigger',
    target: 'razor',
    caseIds: [D_OPEN],
    description:
      'W: the real Razor trigger takes role=menuitem while an item loses it - every total is unchanged, and only the identity of the trigger differs',
    expect: { dimensions: ['ownership.controls', 'dom.aria'], caseIds: [D_OPEN] },
    beforeExtract: onCases(
      [D_OPEN],
      `${requireMenu} triggers[0].setAttribute('role', 'menuitem'); theMenu.querySelector('[role="menuitem"]').removeAttribute('role');`,
    ),
  },
  {
    id: 'browser-dropdown-expanded-stale',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description: 'the real Razor trigger still announces aria-expanded="false" after a pointer open',
    expect: { dimensions: ['dom.aria', 'interaction.state'], caseIds: [CLICK_OPEN] },
    afterInteraction: onCases([CLICK_OPEN], `triggers[0].setAttribute('aria-expanded', 'false');`),
  },
  {
    id: 'browser-dropdown-menu-role-listbox',
    target: 'razor',
    caseIds: [D_OPEN],
    description: 'the real Razor menu is a listbox',
    expect: { dimensions: ['dom.aria', 'a11y.role'], caseIds: [D_OPEN] },
    beforeExtract: onCases([D_OPEN], `${requireMenu} theMenu.setAttribute('role', 'listbox');`),
  },
  {
    id: 'browser-dropdown-arrow-exposed',
    target: 'razor',
    caseIds: [D_OPEN],
    description: 'the real Razor arrow is no longer aria-hidden',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-hidden'] }, caseIds: [D_OPEN] },
    beforeExtract: onCases(
      [D_OPEN],
      `${requireMenu} theMenu.querySelector('.vf-dropdown__arrow').removeAttribute('aria-hidden');`,
    ),
  },
  {
    id: 'browser-dropdown-disabled-tabbable',
    target: 'razor',
    caseIds: [D_DISABLED],
    description: 'the real disabled Razor trigger stays in the tab order',
    expect: {
      dimensions: ['dom.nativeAttributes', 'ownership.controls'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [D_DISABLED],
    },
    beforeExtract: onCases([D_DISABLED], `triggers[0].setAttribute('tabindex', '0');`),
  },
  {
    id: 'browser-dropdown-pills-modifier-lost',
    target: 'razor',
    caseIds: [D_PILLS],
    // Measured on the DOM captured right after the edit. The snapshot is taken
    // after the initial screenshots, whose resize makes the controller repaint
    // the menu's classes - so by then the modifier is back, as it would be on
    // any real page after the next position update.
    description: 'O: the real Razor pills menu loses its variant modifier',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [D_PILLS] },
    beforeExtract: onCases(
      [D_PILLS],
      `${requireMenu} if (!theMenu.classList.contains('vf-dropdown__menu--pills')) throw new Error('MUTATION_NOT_APPLIED: not pills');
       theMenu.classList.remove('vf-dropdown__menu--pills');`,
    ),
  },
  {
    id: 'browser-dropdown-extra-notification',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description: 'the real Razor root notifies one open more than it performed',
    expect: { dimensions: ['interaction.events'], caseIds: [CLICK_OPEN] },
    afterInteraction: onCases(
      [CLICK_OPEN],
      `triggers[0].closest('.vf-dropdown').dispatchEvent(new CustomEvent('vf-dropdown:open-change', { bubbles: true, detail: { open: true } }));`,
    ),
  },

  // ------------------------------------------------------------------ floating (Q, R)
  {
    id: 'browser-dropdown-floating-disabled',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description: 'Q: the real Razor menu stays at its unpositioned seed, as if floater.js never ran',
    expect: { dimensions: ['dom.nativeAttributes', 'interaction.state'], caseIds: [CLICK_OPEN] },
    beforeInteraction: onCases([CLICK_OPEN], pinPosition(`'0px'`, `'0px'`)),
  },
  {
    id: 'browser-dropdown-autoupdate-unwired',
    target: 'razor',
    caseIds: [SCROLL],
    description: 'Q: the real Razor menu is positioned once and never again - autoUpdate wires no listener',
    expect: { dimensions: ['dom.nativeAttributes', 'interaction.state'], caseIds: [SCROLL] },
    beforeInteraction: onCases(
      [SCROLL],
      `const add = window.addEventListener;
       window.addEventListener = function (type, listener, options) {
         if (type === 'scroll' || type === 'resize') return undefined;
         return add.call(this, type, listener, options);
       };
       if (window.visualViewport) window.visualViewport.addEventListener = () => undefined;
       window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };`,
    ),
  },
  {
    id: 'browser-dropdown-wrong-placement',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description:
      "R: the real Razor menu is aligned to the trigger's right edge - bottom-end where bottom-start was asked for",
    expect: { dimensions: ['dom.nativeAttributes', 'interaction.state'], caseIds: [CLICK_OPEN] },
    beforeInteraction: onCases(
      [CLICK_OPEN],
      pinPosition(
        `(triggers[0].getBoundingClientRect().right - target.getBoundingClientRect().width) + 'px'`,
        `target.style.top`,
      ),
    ),
  },

  // --------------------------------------------------------------- transitions (S, T)
  {
    id: 'browser-dropdown-removed-early',
    target: 'razor',
    caseIds: [CLICK_CLOSE],
    description: 'S: the leaving real Razor menu is removed the moment its leave begins',
    expect: { dimensions: ['interaction.state'], caseIds: [CLICK_CLOSE] },
    beforeInteraction: onCases(
      [CLICK_CLOSE],
      `new MutationObserver(() => {
        const target = menuOf(triggers[0]);
        if (target && target.classList.contains('vf-floating-transition-leave-active')) target.remove();
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });`,
    ),
  },
  {
    id: 'browser-dropdown-never-removed',
    target: 'razor',
    caseIds: [CLICK_CLOSE],
    description: 'T: the leaving real Razor menu is never removed',
    expect: { dimensions: ['interaction.state', 'dom.structure', 'interaction.convergence'], caseIds: [CLICK_CLOSE] },
    beforeInteraction: onCases(
      [CLICK_CLOSE],
      `const remove = Element.prototype.remove;
       Element.prototype.remove = function () {
         if (this.classList?.contains('vf-dropdown__menu')) return undefined;
         return remove.call(this);
       };`,
    ),
  },

  // ------------------------------------------------------------ current-only (N)
  {
    id: 'browser-dropdown-current-only-arrowup-opens',
    target: 'current',
    caseIds: [ARROWUP_CLOSED],
    verifyIsolation: true,
    description: 'N: ArrowUp opens only the real current Vue dropdown; reference and Razor are re-captured untouched',
    expect: {
      dimensions: ['interaction.state', 'interaction.events'],
      caseIds: [ARROWUP_CLOSED],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeInteraction: onCases(
      [ARROWUP_CLOSED],
      `document.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowUp' || event.target !== triggers[0]) return;
        event.preventDefault();
        triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
      }, true);`,
    ),
  },
  {
    id: 'browser-dropdown-current-only-haspopup',
    target: 'current',
    caseIds: [D_DEFAULT],
    verifyIsolation: true,
    description: 'N: only the real current Vue trigger announces aria-haspopup="true"',
    expect: {
      dimensions: ['dom.aria', 'ownership.controls'],
      details: { 'dom.aria': ['aria-haspopup'] },
      caseIds: [D_DEFAULT],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: onCases([D_DEFAULT], `triggers[0].setAttribute('aria-haspopup', 'true');`),
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

export const dropdownPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [D_OPEN],
    'an approval for dom.structure - the menu teleported or kept in place is decided here',
  ),
  smuggled('smuggled-visual-approval', 'visual', [D_OPEN], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [D_OPEN],
    "an approval for ownership.controls - the evidence that the trigger is the one owned control and every item the consumer's",
  ),
  smuggled(
    'smuggled-state-approval',
    'interaction.state',
    [ARROWUP_CLOSED],
    'an approval for the live state - the shape a "Razor opens on ArrowUp, which is nicer" waiver would take',
  ),
  smuggled(
    'smuggled-relationship-approval',
    'interaction.relationships',
    [CLICK_OPEN],
    'an approval for the live relationship between a trigger and its teleported menu',
  ),
  smuggled(
    'smuggled-events-approval',
    'interaction.events',
    [REEMIT],
    'an approval for the notification log - the shape a "Razor does not re-emit an open" waiver would take',
  ),
  smuggled(
    'smuggled-wildcard-case',
    'dom.nativeAttributes',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-unknown-case',
    'dom.nativeAttributes',
    ['dropdown/teleport-to-element'],
    'an approval naming a case the catalog does not have - the shape a "Razor cannot teleport to an element" waiver would take',
  ),
  idle(
    'idle-position-approval',
    'dom.nativeAttributes',
    [D_OPEN],
    'style',
    'div.vf-dropdown__menu.vf-dropdown__menu--default',
    'left:404px;top:63.0711px',
    'left:404px;top:63px',
    'a well-formed approval for a rounded menu position - the shape a "the menu is close enough" waiver would take. It tolerates a difference no target produces, so the accounting rejects it as unused',
  ),
];
