// Negative fixtures for the VfSelect parity profile (M32).
//
// Every mutation names the case and the dimension that has to catch it, so a
// defect reported under the wrong dimension counts as missed. Three families,
// as for the earlier overlays:
//
//   - capture mutations edit a real capture after the fact - the cheap way to
//     prove a dimension reads a field at all, the only way to make current and
//     Razor identically wrong so that only the reference sees it, and the way
//     to express a floater.js configuration a page cannot change (no flip, no
//     shift);
//   - browser mutations break a real page, installed as the behaviour a wrong
//     port would have: capture-phase listeners that move focus the reference
//     does not move, close what it leaves open, swallow what it prevents or an
//     event it dispatches; observers that re-enable a disabled option, strip a
//     class, a min-width or a role, leave an orphan listbox behind or cross the
//     wiring of two; attributes forwarded or dropped. The Razor page is the
//     usual target; one runs on current Vue alone;
//   - policy mutations smuggle approvals the validator or the occurrence
//     accounting has to reject.
import { eachTheme, fail } from './mutations.mjs';

const DEFAULT = 'select/default';
const SELECTED = 'select/selected';
const ATTRS = 'select/attrs';
const FORM_DISABLED_STATIC = 'select/form-disabled';
const FORM_REQUIRED_STATIC = 'select/form-required';
const CLICK_OPEN = 'select/interaction-click-open';
const ARROWDOWN_OPEN = 'select/interaction-arrowdown-open';
const SKIP = 'select/interaction-skip-disabled';
const WALK = 'select/interaction-walk';
const TAB_OPEN = 'select/interaction-tab-open';
const ENTER_SELECT = 'select/interaction-enter-select';
const ESCAPE_OPTION = 'select/interaction-escape-option';
const OPTION_CLICK = 'select/interaction-option-click';
const OUTSIDE_CLICK = 'select/interaction-outside-click';
const CLEAR = 'select/interaction-clear';
const FORM_SELECT = 'select/interaction-form-select';
const FORM_RESET = 'select/interaction-form-reset';
const FORM_DISABLED = 'select/interaction-form-disabled';
const FIELD_OPEN_EMPTY = 'select/interaction-field-open-empty';
const FIELD_SELECT = 'select/interaction-field-select';
const MIN_WIDTH = 'select/interaction-min-width';
const FLIP = 'select/interaction-flip-top';
const SHIFT = 'select/interaction-shift';
const SCROLL_CLICK = 'select/interaction-scroll-on-click';
const TWO_OPEN = 'select/interaction-two-keyboard-open';
const POPOVER_CLOSE = 'select/interaction-popover-close';

const STATE = 'interaction.state';
const FOCUS = 'interaction.focus';
const RELATIONSHIPS = 'interaction.relationships';
const VALUE = 'interaction.value';
const EVENTS = 'interaction.events';

const listboxNode = (node) => node.classes.includes('vf-select__menu');

/**
 * Runs `body` once per case with the case root, its select wrappers and their
 * triggers in scope; `listboxOf(i)` is the listbox trigger i names. The body
 * throws MUTATION_NOT_APPLIED when what it was written to break is not there.
 * A live-parity scenario runs with its case alone in the document, so a
 * mutation naming several cases finds one of them per scenario.
 */
function onCases(caseIds, body) {
  return `(() => {
    let applied = 0;
    const evidence = [];
    for (const caseId of ${JSON.stringify(caseIds)}) {
      const root = document.querySelector('[data-parity-case="' + caseId + '"]');
      if (!root) continue;
      const selects = [...root.querySelectorAll('.vf-select-wrap')];
      if (selects.length === 0) throw new Error('MUTATION_NOT_APPLIED: no select in ' + caseId);
      const triggers = selects.map((select) => select.querySelector(':scope > button.vf-select'));
      const listboxOf = (index) => document.getElementById(triggers[index].getAttribute('aria-controls') ?? '');
      const inListbox = (node) => node instanceof Element && node.closest('.vf-select__menu') !== null;
      ${body}
      applied += 1;
      evidence.push({ caseId });
    }
    if (applied === 0) throw new Error('MUTATION_NOT_APPLIED: none of ${caseIds.join(', ')} is on the page');
    return { applied, evidence };
  })()`;
}

/** Calls `visit(listbox)` for every select listbox inserted anywhere from now on. */
const onListboxes = (visit) => `
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement && node.classList.contains('vf-select__menu')) (${visit})(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });`;

const requireOpen = `const theListbox = listboxOf(0); if (!theListbox) throw new Error('MUTATION_NOT_APPLIED: no open listbox');`;

// ------------------------------------------------------------------ capture

export const selectParityMutations = [
  {
    id: 'select-current-and-razor-identically-shift-the-listbox',
    klass: 'native',
    description:
      'current and Razor both write the open listbox one pixel to the right - identically, so current-vs-razor agrees and only the reference sees it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: [CLICK_OPEN],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const node = capture.interactionDom[CLICK_OPEN].find(listboxNode);
          if (!node?.attributes.style) fail('no positioned listbox');
          node.attributes.style = node.attributes.style.replace(
            /left:\s*([\d.]+)px/,
            (all, value) => `left:${Number(value) + 1}px`,
          );
        });
      }
    },
  },
  {
    id: 'select-followed-listbox-missing',
    klass: 'structure',
    description: "the open listbox is gone from Razor's followed targets, as if the edge to it were not declared",
    expect: { dimensions: ['dom.structure'], caseIds: [CLICK_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const dom = capture.interactionDom[CLICK_OPEN];
        const index = dom.findIndex(listboxNode);
        if (index < 0) fail('no followed listbox');
        dom.splice(index, 1);
      });
    },
  },
  {
    id: 'select-trigger-announces-a-menu',
    klass: 'aria',
    description: 'the Razor trigger announces aria-haspopup="menu", as a trigger copied from VfDropdown would',
    expect: { dimensions: ['dom.aria'], caseIds: [DEFAULT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const find = (nodes) => {
          for (const node of nodes) {
            if (node.tag === 'button' && node.classes.includes('vf-select')) return node;
            const inner = find(node.children ?? []);
            if (inner) return inner;
          }
          return null;
        };
        const trigger = find(capture.extracted[DEFAULT].dom);
        if (!trigger) fail('no trigger');
        trigger.attributes['aria-haspopup'] = 'menu';
      });
    },
  },
  {
    id: 'select-filled-marker-missing',
    klass: 'data',
    description: 'the Razor trigger of a filled select carries no data-vf-filled',
    expect: { dimensions: ['dom.productData'], caseIds: [SELECTED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        let found = false;
        const walk = (nodes) => {
          for (const node of nodes) {
            if (node.attributes?.['data-vf-filled'] !== undefined) {
              delete node.attributes['data-vf-filled'];
              found = true;
            }
            walk(node.children ?? []);
          }
        };
        walk(capture.extracted[SELECTED].dom);
        if (!found) fail('no data-vf-filled');
      });
    },
  },
  {
    id: 'select-does-not-flip',
    klass: 'state',
    description:
      'the Razor listbox stays below a trigger near the bottom of the viewport, as with a flip over the wrong pair',
    expect: { dimensions: [STATE], caseIds: [FLIP] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const geometry = capture.interactions[FLIP].listboxGeometryAfterResize[0];
        if (geometry?.side !== 'above') fail('no flipped listbox');
        geometry.side = 'below';
      });
    },
  },
  {
    id: 'select-does-not-shift',
    klass: 'state',
    description: 'the Razor listbox runs off the right edge of the viewport, as without shift()',
    expect: { dimensions: [STATE], caseIds: [SHIFT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const geometry = capture.interactions[SHIFT].listboxGeometryAfterResize[0];
        if (!(geometry?.left < 0)) fail('no shifted listbox');
        geometry.left = 0;
        geometry.withinViewport = false;
      });
    },
  },
  {
    id: 'select-options-exposed-as-menu-items',
    klass: 'a11y',
    description: 'assistive technology is told the Razor options are menu items',
    expect: { dimensions: ['a11y.role'], caseIds: [CLICK_OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = capture.interactionAccessibility[CLICK_OPEN]?.firstOption;
        if (node?.role !== 'option') fail('no option in the tree');
        node.role = 'menuitem';
      });
    },
  },
  {
    id: 'select-value-announced-twice',
    klass: 'events',
    description: 'the Razor select announces one keyboard selection twice',
    expect: { dimensions: [EVENTS], caseIds: [ENTER_SELECT] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const events = capture.interactions[ENTER_SELECT].events;
        if (events.length !== 1) fail('no single selection event');
        events.push({ ...events[0] });
      });
    },
  },
];

// ------------------------------------------------------------------ browser

export const selectBrowserMutations = [
  // Attributes.
  {
    id: 'browser-select-title-dropped',
    target: 'razor',
    caseIds: [ATTRS],
    description: 'the forwarded title never reaches the Razor trigger',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['title'] }, caseIds: [ATTRS] },
    beforeExtract: onCases(
      [ATTRS],
      `if (!triggers[0].hasAttribute('title')) throw new Error('MUTATION_NOT_APPLIED: no title');
       triggers[0].removeAttribute('title');`,
    ),
  },
  {
    id: 'browser-select-required-forwarded',
    target: 'razor',
    caseIds: [ATTRS, FORM_REQUIRED_STATIC],
    description: 'required reaches the Razor trigger, as a native control would take it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['required'] },
      caseIds: [ATTRS, FORM_REQUIRED_STATIC],
    },
    beforeExtract: onCases([ATTRS, FORM_REQUIRED_STATIC], `triggers[0].setAttribute('required', '');`),
  },
  {
    id: 'browser-select-hidden-input-without-name',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the Razor select renders a hidden input even without a name',
    expect: { dimensions: ['dom.structure'], caseIds: [DEFAULT] },
    beforeExtract: onCases(
      [DEFAULT],
      `const input = document.createElement('input');
       input.type = 'hidden';
       input.value = '';
       selects[0].prepend(input);`,
    ),
  },
  {
    id: 'browser-select-disabled-select-submits',
    target: 'razor',
    caseIds: [FORM_DISABLED_STATIC, FORM_DISABLED],
    description: 'the hidden input of a disabled Razor select is not disabled, so it is submitted',
    expect: { dimensions: [VALUE], caseIds: [FORM_DISABLED] },
    beforeExtract: onCases(
      [FORM_DISABLED_STATIC, FORM_DISABLED],
      `const input = selects[0].querySelector(':scope > input[type="hidden"]');
       if (!input?.disabled) throw new Error('MUTATION_NOT_APPLIED: no disabled hidden input');
       input.disabled = false;`,
    ),
    beforeInteraction: onCases(
      [FORM_DISABLED],
      `const input = selects[0].querySelector(':scope > input[type="hidden"]');
       if (!input?.disabled) throw new Error('MUTATION_NOT_APPLIED: no disabled hidden input');
       input.disabled = false;`,
    ),
  },
  // Trigger and listbox keyboard.
  {
    id: 'browser-select-keyboard-open-focuses-first',
    target: 'razor',
    caseIds: [ARROWDOWN_OPEN],
    description: 'a keyboard open focuses the first enabled option instead of the selected one',
    expect: { dimensions: [FOCUS], caseIds: [ARROWDOWN_OPEN] },
    beforeInteraction: onCases(
      [ARROWDOWN_OPEN],
      `document.addEventListener('keydown', (event) => {
         if (event.key !== 'ArrowDown' || event.target !== triggers[0]) return;
         setTimeout(() => listboxOf(0)?.querySelector('[role="option"]:not(:disabled)')?.focus(), 150);
       }, true);`,
    ),
  },
  {
    id: 'browser-select-disabled-option-walked',
    target: 'razor',
    caseIds: [SKIP],
    description: 'the disabled option is an item of the walk: ArrowDown from Starter lands on Legacy',
    expect: { dimensions: [FOCUS], caseIds: [SKIP] },
    beforeInteraction: onCases(
      [SKIP],
      onListboxes(
        `(listbox) => listbox.querySelectorAll('[disabled]').forEach((option) => option.removeAttribute('disabled'))`,
      ),
    ),
  },
  {
    id: 'browser-select-walk-does-not-wrap',
    target: 'razor',
    caseIds: [WALK],
    description: 'ArrowDown stops on the last enabled option instead of wrapping to the first',
    expect: { dimensions: [FOCUS], caseIds: [WALK] },
    beforeInteraction: onCases(
      [WALK],
      `document.addEventListener('keydown', (event) => {
         if (event.key !== 'ArrowDown' || !inListbox(event.target)) return;
         const enabled = [...event.target.closest('.vf-select__menu').querySelectorAll('[role="option"]:not(:disabled)')];
         if (event.target !== enabled.at(-1)) return;
         event.preventDefault();
         event.stopImmediatePropagation();
       }, true);`,
    ),
  },
  {
    id: 'browser-select-tab-closes',
    target: 'razor',
    caseIds: [TAB_OPEN],
    description: 'Tab from an option closes the listbox',
    expect: { dimensions: [STATE], caseIds: [TAB_OPEN] },
    beforeInteraction: onCases(
      [TAB_OPEN],
      `document.addEventListener('keydown', (event) => {
         if (event.key === 'Tab' && inListbox(event.target)) document.body.click();
       }, true);`,
    ),
  },
  {
    id: 'browser-select-enter-not-prevented',
    target: 'razor',
    caseIds: [ENTER_SELECT],
    description:
      'Enter on an option is handled without preventDefault: its native activation lands on the trigger the selection just focused, and the listbox opens again',
    expect: { dimensions: [STATE], caseIds: [ENTER_SELECT] },
    beforeInteraction: onCases(
      [ENTER_SELECT],
      `const preventNative = KeyboardEvent.prototype.preventDefault;
       KeyboardEvent.prototype.preventDefault = function () {
         if (this.type === 'keydown' && this.key === 'Enter' && inListbox(this.target)) return;
         return preventNative.call(this);
       };`,
    ),
  },
  // Pointer and focus.
  {
    id: 'browser-select-pointer-selection-restores-focus',
    target: 'razor',
    caseIds: [OPTION_CLICK],
    description: 'an option click puts focus back on the trigger, as a keyboard selection does',
    expect: { dimensions: [FOCUS], caseIds: [OPTION_CLICK] },
    beforeInteraction: onCases(
      [OPTION_CLICK],
      `document.addEventListener('click', (event) => {
         if (inListbox(event.target)) setTimeout(() => triggers[0].focus(), 0);
       });`,
    ),
  },
  {
    id: 'browser-select-outside-click-restores-focus',
    target: 'razor',
    caseIds: [OUTSIDE_CLICK],
    description: "an outside click puts focus on the trigger, as VfDropdown's does",
    expect: { dimensions: [FOCUS], caseIds: [OUTSIDE_CLICK] },
    beforeInteraction: onCases(
      [OUTSIDE_CLICK],
      `document.addEventListener('click', (event) => {
         if (event.target instanceof Element && event.target.closest('.parity-after-control')) setTimeout(() => triggers[0].focus(), 0);
       });`,
    ),
  },
  {
    id: 'browser-select-clear-keeps-focus-away',
    target: 'razor',
    caseIds: [CLEAR],
    description: 'the clear button leaves focus where it was instead of on the trigger',
    expect: { dimensions: [FOCUS], caseIds: [CLEAR] },
    beforeInteraction: onCases(
      [CLEAR],
      // Capture phase: the clear button stops its click from bubbling.
      `document.addEventListener('click', (event) => {
         if (event.target instanceof Element && event.target.closest('.vf-select-wrap__clear')) setTimeout(() => triggers[0].blur(), 0);
       }, true);`,
    ),
  },
  {
    id: 'browser-select-clear-not-announced',
    target: 'razor',
    caseIds: [CLEAR],
    description: 'the Razor clear empties the select without announcing the value',
    expect: { dimensions: [EVENTS], caseIds: [CLEAR] },
    beforeInteraction: onCases(
      [CLEAR],
      `document.addEventListener('vf-select:value-change', (event) => event.stopImmediatePropagation(), true);`,
    ),
  },
  // Forms.
  {
    id: 'browser-select-hidden-input-stale',
    target: 'razor',
    caseIds: [FORM_SELECT],
    description: 'the hidden input keeps the value it had before the selection',
    expect: { dimensions: [VALUE], caseIds: [FORM_SELECT] },
    beforeInteraction: onCases(
      [FORM_SELECT],
      `const input = selects[0].querySelector(':scope > input[type="hidden"]');
       const before = input.value;
       document.addEventListener('keydown', (event) => {
         if (event.key === 'Enter' && inListbox(event.target)) setTimeout(() => { input.value = before; }, 0);
       }, true);`,
    ),
  },
  {
    id: 'browser-select-reset-handled',
    target: 'razor',
    caseIds: [FORM_RESET],
    description: 'a native form reset empties the select',
    expect: { dimensions: [VALUE], caseIds: [FORM_RESET] },
    beforeInteraction: onCases(
      [FORM_RESET],
      `root.querySelector('form').addEventListener('reset', () => setTimeout(() => {
         selects[0].querySelector(':scope > input[type="hidden"]').value = '';
       }, 0));`,
    ),
  },
  // The field.
  {
    id: 'browser-select-field-hears-no-report',
    target: 'razor',
    caseIds: [FIELD_OPEN_EMPTY, FIELD_SELECT],
    description:
      "the field never hears the select's report - what the field controller did before M32, when it followed the first <input> and a select has none or only a hidden one",
    expect: { dimensions: [STATE], caseIds: [FIELD_OPEN_EMPTY, FIELD_SELECT] },
    beforeInteraction: onCases(
      [FIELD_OPEN_EMPTY, FIELD_SELECT],
      `document.addEventListener('vf-field:filled-change', (event) => event.stopImmediatePropagation(), true);`,
    ),
  },
  {
    id: 'browser-select-field-ignores-open',
    target: 'razor',
    caseIds: [FIELD_OPEN_EMPTY],
    description: 'an open empty select leaves its field unfilled: filled follows the value alone',
    expect: { dimensions: [STATE], caseIds: [FIELD_OPEN_EMPTY] },
    beforeInteraction: onCases(
      [FIELD_OPEN_EMPTY],
      `const control = root.querySelector('.vf-field__control');
       new MutationObserver(() => {
         if (control.classList.contains('vf-field__control--filled')) control.classList.remove('vf-field__control--filled');
       }).observe(control, { attributes: true, attributeFilter: ['class'] });`,
    ),
  },
  // Floating and scroll.
  {
    id: 'browser-select-no-min-width',
    target: 'razor',
    caseIds: [MIN_WIDTH],
    description: 'the listbox is not as wide as the trigger: no min-width',
    expect: { dimensions: [STATE], caseIds: [MIN_WIDTH] },
    beforeInteraction: onCases(
      [MIN_WIDTH],
      onListboxes(`(listbox) => new MutationObserver(() => {
        if (listbox.style.minWidth !== '') listbox.style.minWidth = '';
      }).observe(listbox, { attributes: true, attributeFilter: ['style'] })`),
    ),
  },
  {
    id: 'browser-select-offset-ten',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description: "the listbox sits 10px below the trigger - VfDropdown's gap - instead of 2px",
    expect: { dimensions: [STATE], caseIds: [CLICK_OPEN] },
    afterInteraction: onCases(
      [CLICK_OPEN],
      `${requireOpen}
       theListbox.style.top = parseFloat(theListbox.style.top) + 8 + 'px';`,
    ),
  },
  {
    id: 'browser-select-top-class-missing',
    target: 'razor',
    caseIds: [FLIP],
    description: 'a flipped listbox does not carry vf-dropdown__menu--top',
    expect: { dimensions: [STATE], caseIds: [FLIP] },
    beforeInteraction: onCases(
      [FLIP],
      onListboxes(`(listbox) => new MutationObserver(() => {
        if (listbox.classList.contains('vf-dropdown__menu--top')) listbox.classList.remove('vf-dropdown__menu--top');
      }).observe(listbox, { attributes: true, attributeFilter: ['class'] })`),
    ),
  },
  {
    id: 'browser-select-not-scrolled-into-view',
    target: 'razor',
    caseIds: [SCROLL_CLICK],
    description: 'the selected option is not scrolled into view',
    expect: { dimensions: [STATE], caseIds: [SCROLL_CLICK] },
    afterInteraction: onCases(
      [SCROLL_CLICK],
      `${requireOpen}
       if (theListbox.scrollTop === 0) throw new Error('MUTATION_NOT_APPLIED: nothing scrolled');
       theListbox.scrollTop = 0;`,
    ),
  },
  // Relationships and teardown.
  {
    id: 'browser-select-cross-wired',
    target: 'razor',
    caseIds: [TWO_OPEN],
    description: "each trigger names the other's listbox",
    expect: { dimensions: [RELATIONSHIPS], caseIds: [TWO_OPEN] },
    afterInteraction: onCases(
      [TWO_OPEN],
      `const first = triggers[0].getAttribute('aria-controls');
       triggers[0].setAttribute('aria-controls', triggers[1].getAttribute('aria-controls'));
       triggers[1].setAttribute('aria-controls', first);`,
    ),
  },
  {
    id: 'browser-select-identical-listboxes-one-place',
    target: 'razor',
    caseIds: [TWO_OPEN],
    description: 'the second listbox - same labels - is drawn where the first one is, under the first trigger',
    expect: { dimensions: [STATE], caseIds: [TWO_OPEN] },
    afterInteraction: onCases(
      [TWO_OPEN],
      `const [a, b] = [listboxOf(0), listboxOf(1)];
       if (!a || !b) throw new Error('MUTATION_NOT_APPLIED: two listboxes are not open');
       b.style.left = a.style.left;`,
    ),
  },
  {
    id: 'browser-select-orphan-listbox',
    target: 'razor',
    caseIds: [ESCAPE_OPTION],
    description: 'a closed listbox leaves a copy behind in <body> that nothing names',
    expect: { dimensions: [STATE], caseIds: [ESCAPE_OPTION] },
    beforeInteraction: onCases(
      [ESCAPE_OPTION],
      `new MutationObserver((records) => {
         for (const record of records) {
           for (const node of record.removedNodes) {
             if (!(node instanceof HTMLElement) || !node.classList.contains('vf-select__menu')) continue;
             const copy = node.cloneNode(true);
             copy.id = node.id + '-orphan';
             copy.className = 'vf-dropdown__menu vf-select__menu';
             document.body.append(copy);
           }
         }
       }).observe(document.body, { childList: true });`,
    ),
  },
  {
    id: 'browser-select-stale-escape-entry',
    target: 'razor',
    caseIds: [POPOVER_CLOSE],
    description: 'the select unmounted with its popover still takes the next Escape',
    expect: { dimensions: [STATE], caseIds: [POPOVER_CLOSE] },
    beforeInteraction: onCases(
      [POPOVER_CLOSE],
      // The select inside the popover exists only while the popover is open,
      // so it is looked up when the popover trigger is clicked.
      `let armed = false;
       document.addEventListener('click', (event) => {
         const inner = root.querySelectorAll('button.vf-select')[1];
         const open = inner && document.getElementById(inner.getAttribute('aria-controls') ?? '');
         if (event.target instanceof Element && event.target.closest('.vf-popover__trigger') && open) armed = true;
       }, true);
       document.addEventListener('keydown', (event) => {
         if (armed && event.key === 'Escape') event.preventDefault();
       });`,
    ),
  },
  {
    id: 'browser-select-activedescendant-added',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description: 'the trigger names the listbox as its active descendant, as a combobox port would',
    expect: { dimensions: [RELATIONSHIPS], caseIds: [CLICK_OPEN] },
    afterInteraction: onCases(
      [CLICK_OPEN],
      `${requireOpen}
       triggers[0].setAttribute('aria-activedescendant', theListbox.id);`,
    ),
  },
  {
    id: 'browser-select-option-role-dropped',
    target: 'razor',
    caseIds: [CLICK_OPEN],
    description: 'the options lose role=option',
    expect: { dimensions: ['ownership.controls'], caseIds: [CLICK_OPEN] },
    afterInteraction: onCases(
      [CLICK_OPEN],
      `${requireOpen}
       theListbox.querySelectorAll('[role="option"]').forEach((option) => option.removeAttribute('role'));`,
    ),
  },
  // Current Vue alone.
  {
    id: 'browser-select-current-keyboard-selection-keeps-focus',
    target: 'current',
    caseIds: [ENTER_SELECT],
    description: 'the current Vue select does not put focus back on the trigger after a keyboard selection',
    expect: {
      dimensions: [FOCUS],
      caseIds: [ENTER_SELECT],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeInteraction: onCases(
      [ENTER_SELECT],
      `document.addEventListener('keydown', (event) => {
         if (event.key === 'Enter' && inListbox(event.target)) setTimeout(() => triggers[0].blur(), 0);
       }, true);`,
    ),
  },
];

// ------------------------------------------------------------------- policy

const push = (policy, entry) => {
  policy.approvedDivergences.push(entry);
};

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

export const selectPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [CLICK_OPEN],
    'an approval for dom.structure - where the listbox is',
  ),
  smuggled(
    'smuggled-state-approval',
    STATE,
    [FIELD_OPEN_EMPTY],
    'an approval for the live state - the shape a "the Razor field does not follow the open select" waiver would take',
  ),
  smuggled(
    'smuggled-value-approval',
    VALUE,
    [FORM_SELECT],
    'an approval for the submitted value - the shape a "Razor keeps the server value" waiver would take',
  ),
  smuggled(
    'smuggled-relationship-approval',
    RELATIONSHIPS,
    [TWO_OPEN],
    'an approval for the live reference between a trigger and its teleported listbox',
  ),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [CLICK_OPEN],
    'an approval for an option the select does not own',
  ),
  smuggled('smuggled-wildcard-case', 'dom.nativeAttributes', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-unknown-case',
    'dom.nativeAttributes',
    ['select/uncontrolled-self-update'],
    'an approval naming a case the catalog does not have - the shape a "Razor has no controlled mode" waiver would take instead of the declared platform divergence',
  ),
  idle(
    'idle-position-approval',
    'dom.nativeAttributes',
    [CLICK_OPEN],
    'style',
    'div.vf-select__menu',
    'left:24px;top:62px',
    'left:24px;top:70px',
    'a well-formed approval for a listbox 8px lower - the shape a "the gap does not matter" waiver would take. It tolerates a difference no target produces, so the accounting rejects it as unused',
  ),
];
