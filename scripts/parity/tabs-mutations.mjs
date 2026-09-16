// The negative fixture for the VfTabs parity gate.
//
// The third mutation set for a component that owns controls and changes its
// own state, and the first for one whose controls carry an explicit
// interactive role, a roving tabindex, aria-selected, an id graph with a
// 0-or-1 panel, a measured indicator and an internal scroller. It has to
// prove:
//
//   - the two attributes the audit found nobody compared, tabindex and
//     aria-selected, are compared now: a stale roving tabindex and a stale
//     aria-selected each fail on the DOM dimension they live in, and the
//     latter independently on the accessibility tree (sections 15-17);
//   - multi-kind ownership is identity, not count: a missing tab, a tab that
//     became a div, a tab without its role, a scroll button with the tab's
//     role, a missing scroll button, a tab removed and a scroll button added,
//     a consumer button counted as the component's - each fails on
//     ownership (sections 18-19);
//   - the live state is halves, not one value: aria-selected moved while
//     tabindex stayed, the panel patched while the tab stayed, the indicator
//     stale while the selection moved, the selection moved while the
//     indicator stayed - each fails on its own field (sections 23, 48);
//   - the keyboard contract is measured key by key, and focus apart from
//     selection (section 50);
//   - the indicator is unrounded and the scroller state is a set of halves
//     (section 51);
//   - the live stage is directional (section 52).
//
// Capture mutations perturb the stored evidence and prove the comparator
// reports each dimension; browser mutations rewrite real elements on the real
// pages, before extraction or between a gesture and its measurement, and
// prove the extractor, the driver and the screenshots see the defect.
import { eachTheme, fail, mutateElements } from './mutations.mjs';

const DEFAULT = 'tabs/default';
const PANEL = 'tabs/panel';
const SETTINGS = 'tabs/default-value-settings';

const TAB = '.vf-tabs__tab';
const nth = (index) => `[role="tablist"] > .vf-tabs__tab:nth-child(${index})`;

/** A capture mutation that rewrites one field of a case's snapshot on one target. */
function snapshotMutation({ id, description, caseId, field, from, to, dimensions, target = 'razor', directions }) {
  return {
    id,
    klass: 'snapshot',
    description,
    expect: { dimensions, caseIds: [caseId], ...(directions ? { directions } : {}) },
    apply(captures) {
      eachTheme(captures, target, (capture) => {
        const snapshot = capture.interactions[caseId];
        if (snapshot === undefined) fail(`${caseId} has no snapshot; the stage did not run at all`);
        if (JSON.stringify(snapshot[field]) !== JSON.stringify(from)) {
          fail(`${caseId} recorded ${field}=${JSON.stringify(snapshot[field])}, not ${JSON.stringify(from)}`);
        }
        snapshot[field] = to;
      });
    },
  };
}

export { snapshotMutation, TAB, nth, DEFAULT, PANEL, SETTINGS };

// ------------------------------------------------------------ capture mutations

export const tabsParityMutations = [];

// ------------------------------------------------------------ policy mutations

export const tabsPolicyMutations = [];

// ----------------------------------------------------------- browser mutations

export const tabsBrowserMutations = [
  // ------------------------------------------- the two attribute holes
  {
    id: 'browser-tabs-tabindex-inverted',
    target: 'razor',
    caseIds: [SETTINGS],
    description:
      'the roving tabindex is inverted on the real page: the selected tab gets -1 and the two others 0, with aria-selected untouched',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [SETTINGS],
    },
    beforeExtract: mutateElements(
      [SETTINGS],
      TAB,
      `
      element.setAttribute('tabindex', element.getAttribute('aria-selected') === 'true' ? '-1' : '0');
    `,
    ),
  },
  {
    id: 'browser-tabs-aria-selected-stale',
    target: 'razor',
    caseIds: [SETTINGS],
    description:
      'aria-selected stays on the first tab while tabindex, the panel and the indicator all say the middle one is selected',
    expect: {
      dimensions: ['dom.aria', 'a11y.states'],
      details: { 'dom.aria': ['aria-selected'] },
      caseIds: [SETTINGS],
    },
    beforeExtract: mutateElements(
      [SETTINGS],
      TAB,
      `
      const tabs = [...element.parentElement.children];
      element.setAttribute('aria-selected', tabs.indexOf(element) === 0 ? 'true' : 'false');
    `,
    ),
  },
];
