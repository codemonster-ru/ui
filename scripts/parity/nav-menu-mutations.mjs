// Negative fixtures for the VfNavMenu parity profile (M33).
//
// Every mutation names the case and the dimension that has to catch it, so a
// defect reported under the wrong dimension counts as missed. Three families,
// as for every profile since M27:
//
//   - capture mutations edit a real capture after the fact - the way to prove
//     a snapshot field is read at all, and the only way to make current and
//     Razor identically wrong so that only the reference sees it;
//   - browser mutations break a real page, installed as the behaviour a wrong
//     port would have: the active mark on the wrong sibling, a stale
//     aria-current or aria-expanded, a branch and a link that trade elements
//     with the count kept, a nested expansion forgotten, single mode keeping
//     a sibling's descendant, a wrong level, a disabled link left in the tab
//     order, a lost rel, a subtree removed before its leave, a transition that
//     ignores the computed duration and ends on its own timer, a compact state
//     the observer never updates, two instances sharing one measurement, keys
//     handled, events doubled. The Razor page is the usual target; one runs
//     on current Vue alone;
//   - policy mutations smuggle approvals the validator or the occurrence
//     accounting has to reject.
//
// The letters in the descriptions are the M33 false-pass attacks (A-N); the
// architecture plan's appendix records which dimension caught each.
import { eachTheme, fail } from './mutations.mjs';

const DEFAULT = 'nav-menu/default';
const ACTIVE_LEAF = 'nav-menu/active-leaf';
const ACTIVE_LINK = 'nav-menu/active-link';
const DEEP = 'nav-menu/deep';
const LINKS = 'nav-menu/links';
const DISABLED = 'nav-menu/disabled';
const SIDEBAR_NARROW = 'nav-menu/sidebar-narrow';
const SIDEBAR_PAIR = 'nav-menu/sidebar-pair';
const GROUP_ANCESTOR = 'nav-menu/group-ancestor';
const OPEN = 'nav-menu/interaction-open';
const CLOSE = 'nav-menu/interaction-close';
const PARENT_REOPEN = 'nav-menu/interaction-parent-reopen';
const SINGLE_DESCENDANTS_REOPEN = 'nav-menu/interaction-single-descendants-reopen';
const SELECT_MOVES = 'nav-menu/interaction-select-moves';
const SELECT_LINK = 'nav-menu/interaction-select-link';
const SELECT_BUTTON = 'nav-menu/interaction-select-button';
const DISABLED_LINK_CLICK = 'nav-menu/interaction-disabled-link';
const TAB_SKIPS = 'nav-menu/interaction-tab-skips-disabled';
const ARROW = 'nav-menu/interaction-arrow-ignored';
const ENTER_KEY = 'nav-menu/interaction-enter-key';

const STATE = 'interaction.state';
const FOCUS = 'interaction.focus';
const EVENTS = 'interaction.events';
const VALUE = 'interaction.value';

/**
 * Runs `body` once per case with the case root, its navs and `item(label)` -
 * the rendered item element with that label - in scope. The body throws
 * MUTATION_NOT_APPLIED when what it was written to break is not there.
 */
function onCases(caseIds, body) {
  return `(() => {
    let applied = 0;
    const evidence = [];
    for (const caseId of ${JSON.stringify(caseIds)}) {
      const root = document.querySelector('[data-parity-case="' + caseId + '"]');
      if (!root) continue;
      const navs = [...root.querySelectorAll('nav.vf-nav-menu')];
      if (navs.length === 0) throw new Error('MUTATION_NOT_APPLIED: no nav menu in ' + caseId);
      const labelOf = (element) => element.querySelector(':scope > .vf-nav-menu__item-content > .vf-nav-menu__label')?.textContent;
      const item = (label) => [...root.querySelectorAll('.vf-nav-menu__item')].find((element) => labelOf(element) === label) ?? null;
      const need = (label) => { const found = item(label); if (!found) throw new Error('MUTATION_NOT_APPLIED: no item ' + label); return found; };
      ${body}
      applied += 1;
      evidence.push({ caseId });
    }
    if (applied === 0) throw new Error('MUTATION_NOT_APPLIED: none of ${caseIds.join(', ')} is on the page');
    return { applied, evidence };
  })()`;
}

const itemNode = (label) => (node) =>
  node.classes.includes('vf-nav-menu__item') && JSON.stringify(node).includes(`"text":"${label}"`);

function findDom(nodes, predicate) {
  for (const node of nodes) {
    if (predicate(node)) return node;
    const found = findDom(node.children, predicate);
    if (found) return found;
  }
  return null;
}

// ------------------------------------------------------------------ capture

export const navMenuParityMutations = [
  {
    id: 'nav-menu-current-and-razor-identically-drop-the-change',
    klass: 'events',
    description:
      'N: current and Razor both announce nothing for a link selection - identically, so current-vs-razor agrees and only the reference sees it',
    expect: {
      dimensions: [EVENTS],
      caseIds: [SELECT_LINK],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const snapshot = capture.interactions[SELECT_LINK];
          if (!snapshot?.events?.length) fail('no announced change');
          snapshot.events = [];
        });
      }
    },
  },
  {
    id: 'nav-menu-current-and-razor-identically-compact-a-wide-sidebar',
    klass: 'state',
    description:
      'L: current and Razor both report a wide sidebar compact, before and after the probe - identically, so only the reference sees it',
    expect: {
      dimensions: [STATE],
      caseIds: [SIDEBAR_NARROW],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const snapshot = capture.interactions[SIDEBAR_NARROW];
          if (!snapshot?.compactProbe?.length) fail('no compact probe');
          snapshot.compactProbe = snapshot.compactProbe.map((entry) => ({
            ...entry,
            wide: entry.wide.map(() => true),
          }));
        });
      }
    },
  },
  {
    id: 'nav-menu-ownership-identity-swapped',
    klass: 'ownership',
    description:
      'D: in Razor a branch is recorded as a link and a button leaf as a branch - the count of owned controls is unchanged',
    expect: { dimensions: ['ownership.controls'], caseIds: [ACTIVE_LEAF] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const controls = capture.interactions[ACTIVE_LEAF]?.componentControls;
        const branch = controls?.find((entry) => entry.role === 'branch');
        const button = controls?.find((entry) => entry.role === 'button');
        if (!branch || !button) fail('no branch and button to swap');
        Object.assign(branch, { role: 'link', tag: 'a', type: null });
        Object.assign(button, { role: 'branch' });
      });
    },
  },
  {
    id: 'nav-menu-collapse-life-skips-the-hook-frame',
    klass: 'transition',
    description: "J: Razor's recorded collapse life lacks the frame the enter hook wrote its scroll height in",
    expect: { dimensions: [STATE], caseIds: [OPEN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const record = capture.interactions[OPEN]?.collapseTransitions?.[0];
        if (!record || record.states.length < 3) fail('no recorded enter');
        record.states.splice(1, 1);
      });
    },
  },
  {
    id: 'nav-menu-level-in-the-dom-description',
    klass: 'native',
    description: 'G: the Razor DOM record of the deepest link carries level 2 instead of 3',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['style'] }, caseIds: [DEEP] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findDom(capture.extracted[DEEP].dom, itemNode('Level 3'));
        if (!node?.attributes.style) fail('no level declaration');
        node.attributes.style = node.attributes.style.replace('--vf-nav-menu-level:3', '--vf-nav-menu-level:2');
        if (!node.attributes.style.includes(':2')) fail('the declaration did not change');
      });
    },
  },
];

// ------------------------------------------------------------------ browser

export const navMenuBrowserMutations = [
  {
    id: 'browser-nav-menu-active-on-the-wrong-sibling',
    target: 'razor',
    caseIds: [ACTIVE_LEAF],
    description: 'A: the Razor active mark lands on the sibling after the active leaf',
    expect: { dimensions: ['dom.aria', 'dom.canonicalClasses'], caseIds: [ACTIVE_LEAF] },
    beforeExtract: onCases(
      [ACTIVE_LEAF],
      `const active = need('Theming');
       const sibling = need('SSR');
       active.removeAttribute('aria-current');
       active.classList.remove('vf-nav-menu__item--active');
       active.parentElement.classList.remove('vf-nav-menu__node--active');
       sibling.setAttribute('aria-current', 'page');
       sibling.classList.add('vf-nav-menu__item--active');
       sibling.parentElement.classList.add('vf-nav-menu__node--active');`,
    ),
  },
  {
    id: 'browser-nav-menu-aria-current-stale',
    target: 'razor',
    caseIds: [SELECT_MOVES],
    description: 'B: the previously current item keeps aria-current after the selection moves',
    expect: { dimensions: ['dom.aria', STATE], caseIds: [SELECT_MOVES] },
    beforeInteraction: onCases(
      [SELECT_MOVES],
      `const first = root.querySelector('[aria-current="page"]');
       if (!first) throw new Error('MUTATION_NOT_APPLIED: nothing current');
       new MutationObserver(() => { if (!first.hasAttribute('aria-current')) first.setAttribute('aria-current', 'page'); })
         .observe(first, { attributes: true, attributeFilter: ['aria-current'] });`,
    ),
  },
  {
    id: 'browser-nav-menu-aria-expanded-stale',
    target: 'razor',
    caseIds: [OPEN],
    description: 'C: the Razor branch keeps announcing aria-expanded=false after it opened',
    expect: { dimensions: ['dom.aria', 'a11y.states', STATE], caseIds: [OPEN] },
    beforeInteraction: onCases(
      [OPEN],
      `const branch = need('Guide');
       new MutationObserver(() => { if (branch.getAttribute('aria-expanded') !== 'false') branch.setAttribute('aria-expanded', 'false'); })
         .observe(branch, { attributes: true, attributeFilter: ['aria-expanded'] });`,
    ),
  },
  {
    id: 'browser-nav-menu-branch-and-link-trade-elements',
    target: 'razor',
    caseIds: [ACTIVE_LINK],
    description:
      'D: a Razor branch is rendered as an anchor and a link leaf as a button, so the number of owned controls is unchanged',
    expect: { dimensions: ['ownership.controls', 'dom.structure'], caseIds: [ACTIVE_LINK] },
    beforeExtract: onCases(
      [ACTIVE_LINK],
      `const swap = (element, tag) => {
         const replacement = document.createElement(tag);
         for (const attribute of element.attributes) replacement.setAttribute(attribute.name, attribute.value);
         replacement.append(...element.childNodes);
         element.replaceWith(replacement);
         return replacement;
       };
       const branch = swap(need('Advanced'), 'a');
       branch.setAttribute('href', '#nav-advanced');
       branch.removeAttribute('type');
       const link = swap(need('Intro'), 'button');
       link.removeAttribute('href');
       link.setAttribute('type', 'button');`,
    ),
  },
  {
    id: 'browser-nav-menu-nested-expansion-forgotten',
    target: 'razor',
    caseIds: [PARENT_REOPEN],
    description: 'E: when the parent reopens, the Razor child comes back closed - its expansion forgotten',
    expect: { dimensions: [STATE, 'dom.structure'], caseIds: [PARENT_REOPEN] },
    afterInteraction: onCases(
      [PARENT_REOPEN],
      `const child = need('Advanced');
       if (child.getAttribute('aria-expanded') !== 'true') throw new Error('MUTATION_NOT_APPLIED: child not open');
       child.click();`,
    ),
  },
  {
    id: 'browser-nav-menu-single-keeps-sibling-descendant',
    target: 'razor',
    caseIds: [SINGLE_DESCENDANTS_REOPEN],
    description:
      "F: single mode closed Select but kept Select deep's value, so reopening Select shows Select deep open",
    expect: { dimensions: [STATE, 'dom.structure'], caseIds: [SINGLE_DESCENDANTS_REOPEN] },
    afterInteraction: onCases(
      [SINGLE_DESCENDANTS_REOPEN],
      `const deep = need('Select deep');
       if (deep.getAttribute('aria-expanded') !== 'false') throw new Error('MUTATION_NOT_APPLIED: descendant not closed');
       deep.click();`,
    ),
  },
  {
    id: 'browser-nav-menu-level-wrong',
    target: 'razor',
    caseIds: [DEEP],
    description: 'G: the deepest Razor link declares the level of its parent',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['style'] }, caseIds: [DEEP] },
    beforeExtract: onCases([DEEP], `need('Level 3').style.setProperty('--vf-nav-menu-level', '2');`),
  },
  {
    id: 'browser-nav-menu-disabled-link-tabbable',
    target: 'razor',
    caseIds: [DISABLED, TAB_SKIPS],
    description: 'H: the disabled Razor link stays in the tab order',
    expect: {
      dimensions: ['dom.nativeAttributes', FOCUS],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [TAB_SKIPS],
    },
    beforeExtract: onCases([DISABLED, TAB_SKIPS], `need('Off').removeAttribute('tabindex');`),
    beforeInteraction: onCases([TAB_SKIPS], `need('Off').removeAttribute('tabindex');`),
  },
  {
    id: 'browser-nav-menu-blank-rel-dropped',
    target: 'razor',
    caseIds: [LINKS],
    description: 'I: the Razor _blank link loses its derived rel',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['rel'] }, caseIds: [LINKS] },
    beforeExtract: onCases([LINKS], `need('External').removeAttribute('rel');`),
  },
  {
    id: 'browser-nav-menu-subtree-removed-before-its-leave',
    target: 'razor',
    caseIds: [CLOSE],
    description: 'J: the Razor collapse leaves the document the moment the branch closes, without its leave frames',
    expect: { dimensions: [STATE], caseIds: [CLOSE] },
    beforeInteraction: onCases(
      [CLOSE],
      `const branch = need('Guide');
       branch.addEventListener('click', () => {
         if (branch.getAttribute('aria-expanded') !== 'true') return;
         setTimeout(() => branch.parentElement.querySelector(':scope > .vf-nav-menu__collapse')?.remove(), 0);
       }, true);`,
    ),
  },
  {
    id: 'browser-nav-menu-transition-ends-on-a-fixed-timer',
    target: 'razor',
    caseIds: [OPEN, CLOSE],
    description:
      'K: the Razor controller ends every enter and leave on a fixed 320ms timer: it reads no computed duration and hears no transitionend',
    expect: { dimensions: [STATE], caseIds: [OPEN, CLOSE] },
    beforeInteraction: onCases(
      [OPEN, CLOSE],
      `window.addEventListener('transitionend', (event) => {
         if (event.target instanceof Element && event.target.classList.contains('vf-nav-menu__collapse')) event.stopImmediatePropagation();
       }, true);
       const computed = window.getComputedStyle.bind(window);
       window.getComputedStyle = (element, pseudo) => {
         const style = computed(element, pseudo);
         if (!element.classList?.contains('vf-nav-menu__collapse')) return style;
         return new Proxy(style, {
           get: (target, property) => {
             if (property === 'transitionDuration') return '0.32s, 0.32s';
             const value = Reflect.get(target, property);
             return typeof value === 'function' ? value.bind(target) : value;
           },
         });
       };`,
    ),
  },
  {
    id: 'browser-nav-menu-transition-classes-missing',
    target: 'razor',
    caseIds: [OPEN],
    description: "the Razor collapse never carries Vue's v-enter classes",
    expect: { dimensions: [STATE], caseIds: [OPEN] },
    beforeInteraction: onCases(
      [OPEN],
      `const strip = (node) => {
         if (!(node instanceof Element) || !node.classList.contains('vf-nav-menu__collapse')) return;
         for (const name of [...node.classList]) if (name.startsWith('v-')) node.classList.remove(name);
       };
       new MutationObserver((records) => {
         for (const record of records) {
           strip(record.target);
           for (const node of record.addedNodes) strip(node);
         }
       }).observe(root, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });`,
    ),
  },
  {
    id: 'browser-nav-menu-observer-stale',
    target: 'razor',
    caseIds: [SIDEBAR_NARROW],
    description: 'L: the Razor sidebar is measured once and never again - its observer does not answer the probe',
    expect: { dimensions: [STATE], caseIds: [SIDEBAR_NARROW] },
    beforeExtract: onCases(
      [SIDEBAR_NARROW],
      `const nav = navs[0];
       const frozen = nav.className;
       new MutationObserver(() => { if (nav.className !== frozen) nav.className = frozen; })
         .observe(nav, { attributes: true, attributeFilter: ['class'] });`,
    ),
  },
  {
    id: 'browser-nav-menu-instances-share-a-measurement',
    target: 'razor',
    caseIds: [SIDEBAR_PAIR],
    description: "M: the second Razor sidebar follows the first one's measurement",
    expect: { dimensions: [STATE], caseIds: [SIDEBAR_PAIR] },
    beforeExtract: onCases(
      [SIDEBAR_PAIR],
      `const [first, second] = navs;
       new MutationObserver(() => {
         second.classList.toggle('vf-nav-menu--sidebar-compact', first.classList.contains('vf-nav-menu--sidebar-compact'));
       }).observe(first, { attributes: true, attributeFilter: ['class'] });`,
    ),
  },
  {
    id: 'browser-nav-menu-disabled-link-selects',
    target: 'razor',
    caseIds: [DISABLED_LINK_CLICK],
    description: 'a click on the disabled Razor link is not prevented: the hash moves',
    expect: { dimensions: [VALUE], caseIds: [DISABLED_LINK_CLICK] },
    beforeInteraction: onCases(
      [DISABLED_LINK_CLICK],
      `const link = need('Off');
       document.addEventListener('click', (event) => {
         if (event.target instanceof Element && link.contains(event.target) && event.defaultPrevented) location.hash = link.getAttribute('href');
       });`,
    ),
  },
  {
    id: 'browser-nav-menu-change-announced-twice',
    target: 'razor',
    caseIds: [SELECT_BUTTON],
    description: 'the Razor controller announces a selection twice',
    expect: { dimensions: [EVENTS], caseIds: [SELECT_BUTTON] },
    beforeInteraction: onCases(
      [SELECT_BUTTON],
      `let echoing = false;
       navs[0].addEventListener('vf-nav-menu:change', (event) => {
         if (echoing) return;
         echoing = true;
         navs[0].dispatchEvent(new CustomEvent('vf-nav-menu:change', { bubbles: true, detail: event.detail }));
         echoing = false;
       });`,
    ),
  },
  {
    id: 'browser-nav-menu-arrow-key-handled',
    target: 'razor',
    caseIds: [ARROW],
    description: 'the Razor menu handles ArrowDown like a tree: prevented, focus moved to the next item',
    expect: { dimensions: [STATE, FOCUS], caseIds: [ARROW] },
    beforeInteraction: onCases(
      [ARROW],
      `navs[0].addEventListener('keydown', (event) => {
         if (event.key !== 'ArrowDown') return;
         event.preventDefault();
         need('Components').focus();
       });`,
    ),
  },
  {
    id: 'browser-nav-menu-enter-handled-on-keydown',
    target: 'razor',
    caseIds: [ENTER_KEY],
    description:
      'the Razor branch toggles on Enter keydown and prevents it, instead of leaving it to native activation',
    expect: { dimensions: [STATE], caseIds: [ENTER_KEY] },
    beforeInteraction: onCases(
      [ENTER_KEY],
      `const branch = need('Guide');
       branch.addEventListener('keydown', (event) => {
         if (event.key !== 'Enter') return;
         event.preventDefault();
         branch.click();
       });`,
    ),
  },
  {
    id: 'browser-nav-menu-branch-controls-added',
    target: 'razor',
    caseIds: [OPEN],
    description: 'the Razor branch names its collapse with aria-controls, which the reference never writes',
    expect: { dimensions: ['dom.relationships'], caseIds: [OPEN] },
    afterInteraction: onCases(
      [OPEN],
      `const branch = need('Guide');
       const collapse = branch.parentElement.querySelector(':scope > .vf-nav-menu__collapse');
       if (!collapse) throw new Error('MUTATION_NOT_APPLIED: no collapse');
       collapse.id = 'nav-collapse-guide';
       branch.setAttribute('aria-controls', collapse.id);`,
    ),
  },
  {
    id: 'browser-nav-menu-tree-role-added',
    target: 'razor',
    caseIds: [DEFAULT],
    description: 'the Razor list announces itself as a tree and its branches as tree items',
    expect: { dimensions: ['dom.aria'], caseIds: [DEFAULT] },
    beforeExtract: onCases(
      [DEFAULT],
      `root.querySelector('ul.vf-nav-menu__list').setAttribute('role', 'tree');
       for (const branch of root.querySelectorAll('.vf-nav-menu__item--branch')) branch.setAttribute('role', 'treeitem');`,
    ),
  },
  {
    id: 'browser-nav-menu-group-rendered-as-a-button',
    target: 'razor',
    caseIds: [GROUP_ANCESTOR],
    description: 'a Razor group label is a button',
    expect: { dimensions: ['dom.structure', 'ownership.controls'], caseIds: [GROUP_ANCESTOR] },
    beforeExtract: onCases(
      [GROUP_ANCESTOR],
      `const group = root.querySelector('.vf-nav-menu__group');
       if (!group) throw new Error('MUTATION_NOT_APPLIED: no group');
       const button = document.createElement('button');
       for (const attribute of group.attributes) button.setAttribute(attribute.name, attribute.value);
       button.setAttribute('type', 'button');
       button.append(...group.childNodes);
       group.replaceWith(button);`,
    ),
  },
  // Current Vue alone.
  {
    id: 'browser-nav-menu-current-branch-without-aria-expanded',
    target: 'current',
    caseIds: [DEFAULT],
    description: 'the current Vue branches announce no expanded state',
    expect: {
      dimensions: ['dom.aria'],
      caseIds: [DEFAULT],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: onCases(
      [DEFAULT],
      `for (const branch of root.querySelectorAll('.vf-nav-menu__item--branch')) branch.removeAttribute('aria-expanded');`,
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

export const navMenuPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [OPEN],
    'an approval for dom.structure - where the collapse is',
  ),
  smuggled(
    'smuggled-state-approval',
    STATE,
    [OPEN],
    'an approval for the live state - the shape a "the Razor transition ends on its own timer" waiver would take',
  ),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [ACTIVE_LINK],
    'an approval for a control the menu does not own as declared',
  ),
  smuggled('smuggled-wildcard-case', 'dom.nativeAttributes', ['*'], 'an approval that covers every case at once'),
  smuggled(
    'smuggled-unknown-case',
    'dom.nativeAttributes',
    ['nav-menu/router-link'],
    'an approval naming a case the catalog does not have - the shape a "Razor has no router" waiver would take instead of the refusal by name',
  ),
  idle(
    'idle-level-approval',
    'dom.nativeAttributes',
    [DEEP],
    'style',
    'a.vf-nav-menu__item',
    '--vf-nav-menu-level:3',
    '--vf-nav-menu-level:2',
    'a well-formed approval for a link one level shallower - the shape a "the level does not matter" waiver would take. It tolerates a difference no target produces, so the accounting rejects it as unused',
  ),
];
