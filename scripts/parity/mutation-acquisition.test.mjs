// M35.1: a failed acquisition on a mutated page is never visual evidence.
//
// End to end on the real verdict path: real Chrome pages, the screenshot
// handler captureTarget calls (run.mjs), the real comparator and
// judgeBrowserMutation with the real mutation definitions. Only the capture
// objects around the screenshots are assembled here, the way
// live-parity.test.mjs assembles them, and a mutated theme whose page was
// invalidated is handled exactly as captureAll handles it.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';

import { launchChrome, openPage } from '../baseline/cdp.mjs';
import { INFRASTRUCTURE, PageInvalidated, REJECTION, acquisitionOutcome } from './acquisition.mjs';
import { browserMutations } from './browser-mutations.mjs';
import { buttonBrowserMutations } from './button-mutations.mjs';
import { dropdownBrowserMutations } from './dropdown-mutations.mjs';
import {
  ACQUISITION_REJECTED,
  DETECTED,
  INFRASTRUCTURE_ERROR,
  MISSED,
  judgeBrowserMutation,
  rejectionDeclarationProblems,
} from './mutation-verdict.mjs';
import { navMenuBrowserMutations } from './nav-menu-mutations.mjs';
import { compareCaptures, failedAcquisitions, screenshot, settleExpression, viewport } from './run.mjs';

const byId = (list, id) => list.find((mutation) => mutation.id === id) ?? assert.fail(`no mutation ${id}`);
const glyphVisibility = byId(browserMutations, 'browser-glyph-visibility');
const glyphDisplay = byId(browserMutations, 'browser-glyph-display');
const spinner = byId(buttonBrowserMutations, 'browser-button-spinner-after-the-label');
const wrongPlacement = byId(dropdownBrowserMutations, 'browser-dropdown-wrong-placement');
const observerStale = byId(navMenuBrowserMutations, 'browser-nav-menu-observer-stale');

const themes = ['light', 'dark'];
const policy = { dimensions: {}, approvedDivergences: [] };

let chrome;
let directory;

before(async () => {
  chrome = await launchChrome();
  directory = mkdtempSync(join(tmpdir(), 'parity-m35-1-'));
});

after(async () => {
  await chrome?.close();
  if (directory) rmSync(directory, { recursive: true, force: true });
});

/** A 1000x900 page with each case at its own position; `script` runs after it. */
async function open({ cases, extra = '', script = '' }) {
  const page = await openPage(chrome.endpoint);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
  const body =
    '<div style="height:6000px"></div>' +
    cases
      .map(
        ({ id, top, left = 24, html }) =>
          `<div class="case" data-parity-case="${id}" style="top:${top}px;left:${left}px">${html}</div>`,
      )
      .join('') +
    extra;
  const html =
    '<!doctype html><html><head><style>body{margin:0;background:#f6f8fb;font:16px sans-serif}' +
    '.case{position:absolute;width:360px;height:120px;background:#fff;border:1px solid #888;box-sizing:border-box}</style></head>' +
    `<body>${body}<script>${script}</script></body></html>`;
  await page.send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
  await page.waitFor(`document.readyState === 'complete'`);
  await page.evaluate(settleExpression);
  return page;
}

const clipOf = (page, caseId) =>
  page.evaluate(`(() => { const r = document.querySelector('[data-parity-case="${caseId}"]').getBoundingClientRect();
    return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), width: Math.round(r.width), height: Math.round(r.height) }; })()`);

const node = (attributes = {}) => [
  { tag: 'div', classes: ['case'], consumerClasses: [], attributes, children: [], text: 'case' },
];

/** One target's capture of the cases, shaped as captureTarget returns it. */
function captureOf(caseIds, stage, records, { dom = () => node(), snapshot = () => ({}) } = {}) {
  const initial = stage === 'initial';
  return {
    extracted: Object.fromEntries(caseIds.map((id) => [id, { dom: dom(id), styles: {} }])),
    accessibility: Object.fromEntries(caseIds.map((id) => [id, {}])),
    screenshots: initial ? records : {},
    interactions: initial
      ? {}
      : Object.fromEntries(caseIds.map((id) => [id, { clip: {}, inputEvents: [], ...snapshot(id) }])),
    interactionScreenshots: initial ? {} : records,
    naturalInteractionScreenshots: {},
    transitions: {},
    transitionScreenshots: {},
    interactionDom: {},
    interactionAccessibility: {},
    diagnostics: { pageErrors: [] },
  };
}

/**
 * The clean reference and current pages and the mutated Razor page, each case
 * shot in order by run.mjs's handler, in both themes. `mutatedPage` may carry
 * a `hook(page)` (an environment fault) and a `clip(clip)` override. Returns
 * what captureAll hands the verdict, plus the comparator's view of it.
 */
async function capture({ mutation, profile, stage, cleanPage, mutatedPage, razorDom, razorSnapshot, cleanSnapshot }) {
  const caseIds = mutation.caseIds;
  const catalog = {
    profile: { id: profile, followedReferences: [] },
    cases: caseIds.map((id) => (stage === 'initial' ? { id, visual: true } : { id, interaction: { steps: [] } })),
  };
  const captures = { reference: {}, current: {}, razor: {} };
  const acquisitionFailures = [];
  const invalidated = [];
  const shotsTaken = [];
  for (const target of ['reference', 'current', 'razor']) {
    const mutated = target === mutation.target;
    for (const theme of themes) {
      const spec = mutated ? mutatedPage : cleanPage;
      const page = await open(spec);
      await spec.hook?.(page);
      const log = [];
      const records = {};
      try {
        for (const caseId of caseIds) {
          const clip = await clipOf(page, caseId);
          records[caseId] = await screenshot(
            page,
            spec.clip ? spec.clip(clip) : clip,
            directory,
            `${target}-${theme}-${stage}-${caseId.replace(/\//g, '_')}.png`,
            { catalog, caseId, stage, target, theme, mutated, log },
          );
          shotsTaken.push({ target, theme, caseId });
        }
        captures[target][theme] = captureOf(
          caseIds,
          stage,
          records,
          mutated ? { dom: razorDom, snapshot: razorSnapshot ?? cleanSnapshot } : { snapshot: cleanSnapshot },
        );
      } catch (error) {
        // captureAll: an invalidated mutated theme is logged, never merged.
        if (!(error instanceof PageInvalidated) || !mutated) throw error;
        invalidated.push(acquisitionOutcome(error.diagnostics));
        captures[target][theme] = structuredClone(captures.reference[theme]);
      } finally {
        await page.close();
      }
      if (mutated) acquisitionFailures.push(...failedAcquisitions(log));
    }
  }
  const captured = {
    id: mutation.id,
    captures,
    applied: 1,
    evidence: [],
    isolation: {},
    acquisitionFailures,
    invalidated,
  };
  return {
    captured,
    catalog,
    shotsTaken,
    verdict: judgeBrowserMutation({ mutation, captured, clean: captures, catalog, policy }),
    compared: compareCaptures(captures, catalog, policy),
  };
}

const visualFailures = (compared) => compared.failures.filter((entry) => entry.dimension.startsWith('visual'));

// A fixed element the case does not own, covering the whole column of every
// position that would show the clip: no defect of the target, yet no valid
// acquisition scroll exists.
const foreignOverlay =
  '<div style="position:fixed;left:0;top:0;width:500px;height:900px;background:rgba(255,0,0,.2)"></div>';
// Something unrelated to the case that never stops changing.
const ticker =
  "const t = document.getElementById('tick'); const tick = () => { t.style.opacity = String(0.5 + (performance.now() % 1000) / 2000); requestAnimationFrame(tick); }; requestAnimationFrame(tick);";
// Coming back from an acquisition scroll changes the case for good.
const restorationBreaks = `let away = false;
  addEventListener('scroll', () => { if (scrollY > 0) away = true; else if (away) document.querySelectorAll('[data-parity-case]').forEach((c) => { c.dataset.moved = 'yes'; }); });`;
// A resize of the viewport while the screenshot is being taken.
const resizeDuringCapture = (page) => {
  const send = page.send;
  page.send = async (method, params) => {
    if (method === 'Page.captureScreenshot') {
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1000,
        height: 899,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await page.evaluate(settleExpression);
      await send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
      await page.evaluate(settleExpression);
    }
    return send(method, params);
  };
};
// The document scrolled sideways, so a clip at the left edge is outside the viewport.
const scrolledSideways = (page) =>
  page.evaluate(
    `document.body.insertAdjacentHTML('afterbegin', '<div style="width:4000px;height:1px"></div>'); scrollTo(2000, 0)`,
  );

const loading = (labelFirst) => [
  { id: 'button/loading', top: 2000, html: labelFirst ? 'Saving <b>◌</b>' : '<b>◌</b> Saving' },
];
const glyphPage = (style = '') =>
  glyphVisibility.caseIds.map((id, index) => ({
    id,
    top: 150 + index * 700,
    html: `value <span class="vf-icon-wrapper" style="${style}">◆</span>`,
  }));

// ------------------------------------------------------- genuine evidence

test('1, 12. a genuine visual mutation with valid screenshots is detected (button spinner, scrolled acquisition)', async () => {
  const { verdict, compared } = await capture({
    mutation: spinner,
    profile: 'button',
    stage: 'initial',
    cleanPage: { cases: loading(false) },
    mutatedPage: { cases: loading(true) },
  });
  assert.equal(verdict.status, DETECTED, verdict.detail);
  assert.equal(verdict.acquisition, undefined, 'no acquisition failed');
  assert.equal(visualFailures(compared).length, 4, 'two directions x two themes of real pixel differences');
  assert.deepEqual(compared.acquisitionGaps, []);
});

for (const mutation of [glyphVisibility, glyphDisplay]) {
  test(`12. ${mutation.id}: a genuine post-interaction glyph defect is detected on all seven cases`, async () => {
    const property = mutation.id.endsWith('visibility') ? 'visibility:hidden' : 'display:none';
    const { verdict } = await capture({
      mutation,
      profile: 'input',
      stage: 'post',
      cleanPage: { cases: glyphPage() },
      mutatedPage: { cases: glyphPage(property) },
    });
    assert.equal(verdict.status, DETECTED, verdict.detail);
  });
}

// ------------------------------------------------- no synthetic visual evidence

test('2, 11. a visual-only mutation plus an unrelated acquisition rejection is not detected', async () => {
  // The Razor page has no defect at all; only the unrelated overlay differs.
  const { verdict, compared } = await capture({
    mutation: spinner,
    profile: 'button',
    stage: 'initial',
    cleanPage: { cases: loading(false) },
    mutatedPage: { cases: loading(false), extra: foreignOverlay },
  });
  assert.equal(verdict.status, ACQUISITION_REJECTED, verdict.detail);
  assert.equal(verdict.acquisition.unexpectedRejections.length, 2);
  assert.ok(verdict.acquisition.unexpectedRejections.every((o) => o.code === 'no-valid-scroll-position'));
  // Even read without the verdict, the comparator offers no visual evidence.
  assert.deepEqual(visualFailures(compared), []);
  assert.equal(compared.acquisitionGaps.length, 4);
});

for (const mutation of [glyphVisibility, glyphDisplay]) {
  test(`2, 4, 11. ${mutation.id}: a resize during the mutated capture is an infrastructure error, not detection`, async () => {
    const { verdict, captured, shotsTaken } = await capture({
      mutation,
      profile: 'input',
      stage: 'post',
      cleanPage: { cases: glyphPage() },
      // Not even mutated: the only thing wrong is the environment.
      mutatedPage: { cases: glyphPage(), hook: resizeDuringCapture },
    });
    assert.equal(verdict.status, INFRASTRUCTURE_ERROR, verdict.detail);
    assert.ok(captured.invalidated.length === 2 && captured.invalidated.every((o) => o.pageUsable === false));
    assert.ok(verdict.acquisition.infrastructure.every((o) => o.code === 'viewport-resized-during-capture'));
    assert.equal(
      shotsTaken.filter((shot) => shot.target === 'razor').length,
      0,
      'nothing more is measured on a page the resize reached',
    );
  });
}

test('3. an acquisition that fails before any pixel is taken produces no visual difference', async () => {
  const { verdict, compared } = await capture({
    mutation: spinner,
    profile: 'button',
    stage: 'initial',
    cleanPage: { cases: [{ id: 'button/loading', top: 100, html: '<b>◌</b> Saving' }] },
    mutatedPage: { cases: [{ id: 'button/loading', top: 100, html: '<b>◌</b> Saving' }], hook: scrolledSideways },
  });
  assert.equal(verdict.status, ACQUISITION_REJECTED);
  for (const outcome of verdict.acquisition.unexpectedRejections) {
    assert.equal(outcome.code, 'clip-outside-viewport-horizontally');
    assert.equal(outcome.kind, REJECTION);
    assert.equal(outcome.screenshotObtained, false);
    assert.equal(outcome.obtainedSha256, null);
    assert.match(outcome.reason, /outside the viewport horizontally; acquisition only scrolls vertically/);
  }
  assert.deepEqual(visualFailures(compared), []);
  assert.ok(compared.acquisitionGaps.every((gap) => gap.target === 'razor' && gap.acquisition.code));
});

test('5. a screenshot of the wrong dimensions is an infrastructure error, with its pixels kept as provenance only', async () => {
  const { verdict, compared } = await capture({
    mutation: spinner,
    profile: 'button',
    stage: 'initial',
    cleanPage: { cases: [{ id: 'button/loading', top: 100, html: '<b>◌</b> Saving' }] },
    mutatedPage: {
      cases: [{ id: 'button/loading', top: 100, html: 'Saving <b>◌</b>' }],
      clip: (clip) => ({ ...clip, width: clip.width + 0.5 }),
    },
  });
  assert.equal(verdict.status, INFRASTRUCTURE_ERROR, verdict.detail);
  for (const outcome of verdict.acquisition.infrastructure) {
    assert.equal(outcome.code, 'screenshot-size-mismatch');
    assert.equal(outcome.kind, INFRASTRUCTURE);
    assert.equal(outcome.screenshotObtained, true);
    assert.match(outcome.obtainedSha256, /^[0-9a-f]{64}$/);
  }
  assert.deepEqual(visualFailures(compared), [], 'the obtained pixels differ, and are still not evidence');
});

test('6. a page that never comes to rest is an infrastructure error', async () => {
  const { verdict, compared } = await capture({
    mutation: spinner,
    profile: 'button',
    stage: 'initial',
    cleanPage: { cases: loading(false) },
    mutatedPage: { cases: loading(false), extra: '<p id="tick">unrelated</p>', script: ticker },
  });
  // The ticker is outside the case, so it moves no target fingerprint: the
  // page is at rest as acquisition defines it, and the capture succeeds.
  assert.equal(verdict.status, MISSED, 'no defect, no ticker in the case: nothing to detect');
  assert.deepEqual(compared.acquisitionGaps, []);

  const ticking = await capture({
    mutation: spinner,
    profile: 'button',
    stage: 'initial',
    cleanPage: { cases: loading(false) },
    mutatedPage: { cases: [{ id: 'button/loading', top: 2000, html: '<b id="tick">◌</b> Saving' }], script: ticker },
  });
  assert.equal(ticking.verdict.status, INFRASTRUCTURE_ERROR, ticking.verdict.detail);
  assert.ok(ticking.verdict.acquisition.infrastructure.every((o) => o.code === 'page-not-at-rest'));
  assert.deepEqual(visualFailures(ticking.compared), []);
});

test('7, 8. a screenshot taken before restoration failed is kept as provenance, the page is invalidated, nothing is accepted', async () => {
  // The Razor glyphs really are hidden, so the obtained pixels differ: a harness
  // that accepted them would report a detection the restoration has voided.
  const { verdict, captured, shotsTaken, compared } = await capture({
    mutation: glyphVisibility,
    profile: 'input',
    stage: 'post',
    cleanPage: { cases: glyphPage() },
    mutatedPage: { cases: glyphPage('visibility:hidden'), script: restorationBreaks },
  });
  assert.equal(verdict.status, ACQUISITION_REJECTED, verdict.detail);
  assert.equal(captured.invalidated.length, 2);
  for (const outcome of captured.invalidated) {
    assert.equal(outcome.code, 'restoration-failed');
    assert.equal(outcome.restoration, 'failed');
    assert.equal(outcome.pageUsable, false);
    assert.equal(outcome.screenshotObtained, true);
    assert.match(outcome.obtainedSha256, /^[0-9a-f]{64}$/);
  }
  // The first glyph case is on screen and needs no scroll; the second does,
  // and is where the page is lost. No case after it is measured.
  assert.deepEqual(
    shotsTaken.filter((shot) => shot.target === 'razor').map((shot) => shot.caseId),
    [glyphVisibility.caseIds[0], glyphVisibility.caseIds[0]],
  );
  assert.deepEqual(visualFailures(compared), []);
});

// ------------------------------------------- declared and undeclared rejections

const offscreenMenu = [{ id: wrongPlacement.caseIds[0], top: 100, html: 'Actions' }];
const placement = (left) => () => [{ side: 'below', left, right: 135.828, gap: 17.063 }];

test('9. browser-dropdown-wrong-placement: its declared off-screen clip is an expected rejection, not visual evidence', async () => {
  assert.ok(wrongPlacement.acquisitionRejections?.length, 'the mutation declares the rejection its defect causes');
  const { verdict, compared } = await capture({
    mutation: wrongPlacement,
    profile: 'dropdown',
    stage: 'post',
    cleanPage: { cases: offscreenMenu },
    mutatedPage: { cases: offscreenMenu, hook: scrolledSideways },
    razorDom: () => node({ style: 'left: -42px' }),
    cleanSnapshot: (id) => ({ menuGeometry: placement(0)(id) }),
    razorSnapshot: (id) => ({ menuGeometry: placement(-135.828)(id) }),
  });
  assert.equal(verdict.status, DETECTED, verdict.detail);
  assert.equal(verdict.acquisition.expectedRejections.length, 2);
  assert.ok(verdict.acquisition.expectedRejections.every((o) => o.code === 'clip-outside-viewport-horizontally'));
  assert.deepEqual(visualFailures(compared), [], 'no visual.postInteraction from the missing screenshot');
  assert.ok(verdict.result.failures.some((entry) => entry.dimension === 'dom.nativeAttributes'));
  assert.ok(verdict.result.failures.some((entry) => entry.dimension === 'interaction.state'));
});

test('9, 10. a declared rejection without the declared comparator evidence is not detected', async () => {
  const { verdict } = await capture({
    mutation: wrongPlacement,
    profile: 'dropdown',
    stage: 'post',
    cleanPage: { cases: offscreenMenu },
    mutatedPage: { cases: offscreenMenu, hook: scrolledSideways },
    // Only the DOM moved; the follow geometry the contract also asks for did not.
    razorDom: () => node({ style: 'left: -42px' }),
    cleanSnapshot: (id) => ({ menuGeometry: placement(0)(id) }),
  });
  assert.equal(verdict.status, MISSED, verdict.detail);
});

test('10. an undeclared rejection plus an unrelated DOM difference is not promoted to detection', async () => {
  const { verdict, compared } = await capture({
    mutation: spinner,
    profile: 'button',
    stage: 'initial',
    cleanPage: { cases: [{ id: 'button/loading', top: 100, html: '<b>◌</b> Saving' }] },
    mutatedPage: { cases: [{ id: 'button/loading', top: 100, html: '<b>◌</b> Saving' }], hook: scrolledSideways },
    razorDom: () => node({ 'data-unrelated': 'yes' }),
  });
  assert.equal(verdict.status, ACQUISITION_REJECTED, verdict.detail);
  assert.ok(compared.failures.some((entry) => entry.dimension === 'dom.productData'));

  // Declaring the rejection does not turn the DOM difference into the pixels
  // this mutation is about.
  const declared = {
    ...spinner,
    acquisitionRejections: [{ caseId: 'button/loading', stage: 'initial', code: 'clip-outside-viewport-horizontally' }],
  };
  const withDeclaration = await capture({
    mutation: declared,
    profile: 'button',
    stage: 'initial',
    cleanPage: { cases: [{ id: 'button/loading', top: 100, html: '<b>◌</b> Saving' }] },
    mutatedPage: { cases: [{ id: 'button/loading', top: 100, html: '<b>◌</b> Saving' }], hook: scrolledSideways },
    razorDom: () => node({ 'data-unrelated': 'yes' }),
  });
  assert.equal(withDeclaration.verdict.status, MISSED, withDeclaration.verdict.detail);
  assert.equal(withDeclaration.verdict.acquisition.expectedRejections.length, 2);
});

test('browser-nav-menu-observer-stale: a restoration failure invalidates the page and adds no visual difference', async () => {
  const cases = [{ id: observerStale.caseIds[0], top: 2000, html: '<nav>Sidebar</nav>' }];
  const { verdict, captured, compared } = await capture({
    mutation: observerStale,
    profile: 'nav-menu',
    stage: 'initial',
    cleanPage: { cases },
    mutatedPage: { cases, script: restorationBreaks },
  });
  assert.equal(verdict.status, ACQUISITION_REJECTED, verdict.detail);
  assert.ok(captured.invalidated.every((o) => o.code === 'restoration-failed' && o.pageUsable === false));
  assert.deepEqual(visualFailures(compared), [], 'M35 added four synthetic visual differences here');
});

test('a declared rejection must name a case of the mutation, a screenshot stage and a rejection code', () => {
  assert.deepEqual(rejectionDeclarationProblems(wrongPlacement), []);
  const declare = (rule) => rejectionDeclarationProblems({ ...spinner, acquisitionRejections: [rule] });
  assert.match(
    declare({ caseId: 'button/loading', stage: 'initial', code: 'page-not-at-rest' }).join(),
    /not an acquisition rejection/,
  );
  assert.match(
    declare({ caseId: 'button/loading', stage: 'initial', code: 'no-such-code' }).join(),
    /not an acquisition rejection/,
  );
  assert.match(
    declare({ caseId: 'button/other', stage: 'initial', code: 'no-valid-scroll-position' }).join(),
    /not one of the mutation's cases/,
  );
  assert.match(
    declare({ caseId: 'button/loading', stage: 'later', code: 'no-valid-scroll-position' }).join(),
    /not a screenshot stage/,
  );
  assert.throws(
    () =>
      judgeBrowserMutation({
        mutation: {
          ...spinner,
          acquisitionRejections: [
            { caseId: 'button/loading', stage: 'initial', code: 'viewport-resized-during-capture' },
          ],
        },
        captured: { acquisitionFailures: [], invalidated: [] },
        clean: {},
        catalog: {},
        policy,
      }),
    /not an acquisition rejection/,
  );
});

test('M35.2: a mutated page whose own transition outlasts the readiness bound is an infrastructure error, not detection', async () => {
  // The Razor spinner case differs in pixels and starts a 60s-delayed
  // transition: readiness gives up before any pixel is taken.
  const slow =
    '<style>.slow{visibility:visible;transition:visibility 0.01ms linear 60s}.slow.gone{visibility:hidden}</style>';
  const { verdict, compared } = await capture({
    mutation: spinner,
    profile: 'button',
    stage: 'initial',
    cleanPage: { cases: loading(false) },
    mutatedPage: {
      cases: [{ id: 'button/loading', top: 2000, html: 'Saving <b class="slow">◌</b>' }],
      extra: slow,
      hook: (page) => page.evaluate(`document.querySelector('.slow').classList.add('gone')`),
    },
  });
  assert.equal(verdict.status, INFRASTRUCTURE_ERROR, verdict.detail);
  for (const outcome of verdict.acquisition.infrastructure) {
    assert.equal(outcome.code, 'page-not-at-rest');
    assert.match(outcome.reason, /CSSTransition visibility on b\.slow\.gone until 60000\.01ms/);
    assert.equal(outcome.screenshotObtained, false);
  }
  assert.deepEqual(visualFailures(compared), []);
});
