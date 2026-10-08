// Screenshot acquisition (M35), in real Chrome.
//
// Each test drives acquireScreenshot - or driveInteraction's scrollWindow - on a
// small page built for the defect it injects, and asserts the gate that has to
// catch it. Pixels are compared with a capture of the same region taken the old
// way where that is the honest oracle: a static page that the frame resize does
// not perturb.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { after, before, test } from 'node:test';

import { launchChrome, openPage } from '../baseline/cdp.mjs';
import {
  AcquisitionError,
  LEGACY,
  LEGACY_ACQUISITION,
  SCROLL_CANDIDATE_STEPS,
  SEMANTIC_SCROLL,
  acquireScreenshot,
  inspectPng,
  legacyAcquisition,
  scrollCandidates,
} from './acquisition.mjs';
import { driveInteraction } from './extract.mjs';
import { settleExpression, viewport } from './run.mjs';

let chrome;

before(async () => {
  chrome = await launchChrome();
});

after(async () => {
  await chrome?.close();
});

/** A fresh 1000x900 page showing `body`; `script` runs after it. */
async function open(body, script = '') {
  const page = await openPage(chrome.endpoint);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
  const html =
    '<!doctype html><html><head><style>body{margin:0;background:#f6f8fb;font:16px sans-serif}' +
    '.case{position:absolute;left:24px;width:360px;background:#fff;border:1px solid #888;box-sizing:border-box}</style></head>' +
    `<body>${body}<script>${script}</script></body></html>`;
  await page.send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
  await page.waitFor(`document.readyState === 'complete'`);
  await page.evaluate(settleExpression);
  return page;
}

const context = (caseId, extra = {}) => ({
  profile: 'synthetic',
  caseId,
  stage: 'initial',
  target: 'current',
  theme: 'light',
  viewport,
  followedReferences: [],
  settleExpression,
  ...extra,
});

/** The case's clip as run.mjs's extraction computes it. */
const clipOf = (page, caseId) =>
  page.evaluate(`(() => { const r = document.querySelector('[data-parity-case="${caseId}"]').getBoundingClientRect();
    return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), width: Math.round(r.width), height: Math.round(r.height) }; })()`);

const legacyBytes = async (page, clip) =>
  Buffer.from(
    (
      await page.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        fromSurface: true,
        clip: { ...clip, scale: 1 },
      })
    ).data,
    'base64',
  );
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function rejects(promise, pattern) {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof AcquisitionError, `expected an AcquisitionError, got ${error}`);
    assert.match(error.message, pattern);
    return error.diagnostics;
  }
  assert.fail(`acquisition passed; expected ${pattern}`);
}

const tallPage = (top, height, inner = 'Case') =>
  `<div style="height:4000px"></div><div class="case" data-parity-case="c" style="top:${top}px;height:${height}px">${inner}</div>`;

// ---------------------------------------------------------------- the plan

test('scroll candidates: nearest alignment, then 12 evenly spaced positions towards the far alignment', () => {
  const below = scrollCandidates({ x: 24, y: 2000, width: 360, height: 300 }, 0, 900, 3100);
  assert.equal(below.length, SCROLL_CANDIDATE_STEPS + 1);
  assert.equal(below[0], 1400, 'bottom-aligned, the smallest scroll that shows the clip');
  assert.equal(below.at(-1), 2000, 'top-aligned');
  assert.deepEqual(
    below,
    [...below].sort((a, b) => a - b),
  );
  const above = scrollCandidates({ x: 24, y: 100, width: 360, height: 300 }, 2500, 900, 3100);
  assert.equal(above[0], 100, 'from below the clip the nearest position is the top alignment');
  assert.deepEqual(scrollCandidates({ x: 24, y: 2000, width: 360, height: 300 }, 0, 900, 3100), below, 'deterministic');
  assert.deepEqual(
    scrollCandidates({ x: 24, y: 3000, width: 360, height: 300 }, 0, 900, 2000),
    [],
    'no position shows a clip past the end of the page',
  );
});

// ---------------------------------------------------------------- acquisition integrity

test('1. an offscreen clip that fits the viewport is scrolled into view, captured once and the scroll restored', async () => {
  const page = await open(tallPage(2000, 300, 'Offscreen case <b>text</b>'));
  const clip = await clipOf(page, 'c');
  const { bytes, diagnostics } = await acquireScreenshot(page, clip, context('c'));
  assert.equal(diagnostics.mode, SEMANTIC_SCROLL);
  assert.equal(diagnostics.scrolled, true);
  assert.equal(diagnostics.chosenScrollY, 1400);
  assert.equal(diagnostics.candidates.length, 1);
  assert.equal(diagnostics.restoration, 'verified');
  assert.equal(diagnostics.frameResized, 0);
  assert.equal(await page.evaluate('scrollY'), 0, 'the page is left where it was');
  assert.equal(sha(bytes), sha(await legacyBytes(page, clip)), 'the same pixels the old path takes of a static page');
  await page.close();
});

test('2. a clip taller than the viewport fails closed', async () => {
  const page = await open(tallPage(100, 1420));
  await rejects(
    acquireScreenshot(page, await clipOf(page, 'c'), context('c')),
    /larger than the semantic viewport and the capture is not on the legacy allowlist/,
  );
  await page.close();
});

test('3. a tall capture not on the allowlist fails even under an allowlisted profile, case or stage', async () => {
  const page = await open(tallPage(100, 1420));
  const clip = await clipOf(page, 'c');
  for (const extra of [
    { profile: 'dropdown', caseId: 'dropdown/interaction-scroll-follow', stage: 'initial' },
    { profile: 'dropdown', caseId: 'dropdown/interaction-flip-top', stage: 'post' },
    { profile: 'select', caseId: 'dropdown/interaction-scroll-follow', stage: 'post' },
  ]) {
    await page.evaluate(
      `document.querySelector('[data-parity-case]').setAttribute('data-parity-case', ${JSON.stringify(extra.caseId)})`,
    );
    await rejects(acquireScreenshot(page, clip, context(extra.caseId, extra)), /not on the legacy allowlist/);
  }
  await page.close();
});

test('4. no valid scroll position fails closed with every candidate and its reason, and the scroll is put back', async () => {
  // A fixed element no case owns covers the whole viewport column of the clip:
  // every position that shows the clip also puts it inside the clip.
  const page = await open(
    tallPage(2000, 300) +
      '<div id="f" style="position:fixed;left:0;top:0;width:500px;height:900px;background:rgba(255,0,0,.2)"></div>',
  );
  const diagnostics = await rejects(
    acquireScreenshot(page, await clipOf(page, 'c'), context('c')),
    /no scroll position satisfied/,
  );
  assert.equal(diagnostics.candidates.length, SCROLL_CANDIDATE_STEPS + 1);
  for (const candidate of diagnostics.candidates)
    assert.deepEqual(candidate.rejected, ['a fixed element the target does not own entered or left the clip']);
  assert.equal(diagnostics.mode, SEMANTIC_SCROLL, 'never handed to the legacy path');
  assert.equal(await page.evaluate('scrollY'), 0);
  await page.close();
});

test('5. a screenshot whose size is not the clip fails', async () => {
  const page = await open(tallPage(100, 300));
  const clip = { ...(await clipOf(page, 'c')), width: 360.5 };
  await rejects(acquireScreenshot(page, clip, context('c')), /the screenshot is \d+x300, the clip 360\.5x300/);
  await page.close();
});

test('6. a clip outside the viewport horizontally is refused rather than captured blank', async () => {
  const page = await open(
    '<div style="width:3000px;height:10px"></div><div class="case" data-parity-case="c" style="top:100px;left:1500px;height:100px">far right</div>',
  );
  const clip = await clipOf(page, 'c');
  const blank = await page.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    clip: { ...clip, scale: 1 },
  });
  assert.equal(
    inspectPng(Buffer.from(blank.data, 'base64')).uniform,
    true,
    'what an unguarded viewport-contained capture returns: an empty canvas',
  );
  await rejects(acquireScreenshot(page, clip, context('c')), /outside the viewport horizontally/);
  await page.close();
});

test('7. a scroll restoration that does not bring the page back fails', async () => {
  const page = await open(
    tallPage(2000, 300),
    `
    let away = false;
    addEventListener('scroll', () => { if (scrollY > 0) away = true; else if (away) document.querySelector('[data-parity-case]').dataset.moved = 'yes'; });`,
  );
  const diagnostics = await rejects(
    acquireScreenshot(page, await clipOf(page, 'c'), context('c')),
    /did not return to its state/,
  );
  assert.equal(diagnostics.restoration, 'failed');
  await page.close();
});

test('8. a viewport resize while the screenshot is taken fails', async () => {
  const page = await open(tallPage(100, 300));
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
  await rejects(
    acquireScreenshot(page, await clipOf(page, 'c'), context('c')),
    /resized while the screenshot was taken/,
  );
  await page.close();
});

test('9. a foreign fixed overlay that a scroll position would bring into the clip disqualifies that position only', async () => {
  const page = await open(
    tallPage(1500, 300) +
      '<div id="f" style="position:fixed;left:0;top:700px;width:500px;height:200px;background:red"></div>',
  );
  const clip = await clipOf(page, 'c');
  const { bytes, diagnostics } = await acquireScreenshot(page, clip, context('c'));
  assert.ok(diagnostics.candidates.length > 1);
  assert.match(diagnostics.candidates[0].rejected.join(), /does not own entered or left the clip/);
  assert.equal(sha(bytes), sha(await legacyBytes(page, clip)), 'no red in the evidence');
  await page.close();
});

test('10. a target overlay that changes side under a scroll disqualifies the position', async () => {
  // The case owns a fixed panel (aria-controls) that sits below its anchor, and
  // flips above it while the anchor is in the lower half of the viewport.
  const page = await open(
    tallPage(2000, 300, '<button aria-controls="p">anchor</button>') +
      '<div id="p" style="position:fixed;left:24px;width:200px;height:40px;background:#08f"></div>',
    `const place = () => { const a = document.querySelector('button').getBoundingClientRect(); const p = document.getElementById('p');
       const flip = a.bottom > 450 && a.bottom < 900; p.style.top = (flip ? a.top - 40 : a.bottom) + 'px'; p.className = flip ? 'above' : 'below'; };
     place(); addEventListener('scroll', place);`,
  );
  const { diagnostics } = await acquireScreenshot(page, await clipOf(page, 'c'), context('c'));
  assert.match(
    diagnostics.candidates[0].rejected.join(),
    /owned by the target moved relative to the target or changed its classes/,
  );
  assert.ok(diagnostics.candidates.at(-1).rejected.length === 0);
  await page.close();
});

test('11. a hidden 0x0 element is not mistaken for geometry that moved', async () => {
  const page = await open(tallPage(2000, 300, 'visible<span style="display:none">hidden</span><i hidden>also</i>'));
  const { diagnostics } = await acquireScreenshot(page, await clipOf(page, 'c'), context('c'));
  assert.equal(diagnostics.candidates.length, 1);
  assert.deepEqual(diagnostics.candidates[0].rejected, []);
  await page.close();
});

test('12. SVG-internal geometry is left out of the fingerprint, an SVG change is not', async () => {
  const icon =
    '<svg width="20" height="20" viewBox="0 0 7 13"><path id="path" transform="scale(0.97)" d="M1 1 L6 6.5 L1 12"/></svg>';
  const page = await open(tallPage(2000, 300, icon));
  const clip = await clipOf(page, 'c');
  const first = await acquireScreenshot(page, clip, context('c'));
  assert.equal(first.diagnostics.candidates.length, 1, 'an icon does not reject the scroll');
  await page.evaluate(`document.getElementById('path').setAttribute('d', 'M1 1 L6 6.5 L1 11')`);
  await page.evaluate(settleExpression);
  const changed = await acquireScreenshot(page, clip, context('c'));
  assert.notEqual(sha(changed.bytes), sha(first.bytes), 'the visual evidence still sees the SVG change');
  // A path that changes while the page scrolls is a changed target, not jitter.
  await page.evaluate(
    `addEventListener('scroll', () => document.getElementById('path').setAttribute('data-scrolled', String(scrollY)))`,
  );
  const diagnostics = await rejects(acquireScreenshot(page, clip, context('c')), /no scroll position satisfied/);
  assert.match(diagnostics.candidates[0].rejected.join(), /markup, computed styles or layout boxes changed/);
  await page.close();
});

test('13-14. a 1px shift or a single changed pixel is a different screenshot; an unchanged page is the same one', async () => {
  const shots = [];
  for (const inner of [
    '<b style="margin-left:10px">x</b>',
    '<b style="margin-left:11px">x</b>',
    '<b style="margin-left:10px;color:#010000">x</b>',
    '<b style="margin-left:10px">x</b>',
  ]) {
    const page = await open(tallPage(2000, 300, inner));
    shots.push(sha((await acquireScreenshot(page, await clipOf(page, 'c'), context('c'))).bytes));
    await page.close();
  }
  assert.equal(new Set(shots).size, 3);
  assert.equal(shots[0], shots[3]);
});

test('a page still scrolling by itself is acquired once it comes to rest, from where it rested', async () => {
  // As Space on a disabled checkbox leaves it: the browser's own animated scroll runs on after the scenario.
  const page = await open(
    tallPage(1000, 30),
    `window.__go = () => { let n = 0; const step = () => { scrollBy(0, 40); if (++n < 6) requestAnimationFrame(step); }; requestAnimationFrame(step); };`,
  );
  const clip = await clipOf(page, 'c');
  await page.evaluate('window.__go()');
  const { diagnostics } = await acquireScreenshot(page, clip, context('c'));
  assert.ok(diagnostics.restSettles >= 2, 'it waited for the motion to end');
  assert.equal(diagnostics.scrollAtRest.y, 240);
  assert.equal(diagnostics.scrolled, false, 'at rest the clip is in view, so nothing is scrolled');
  assert.equal(await page.evaluate('scrollY'), 240);
  await page.close();
});

test('a page that never comes to rest is not scrolled for acquisition', async () => {
  const page = await open(
    tallPage(2000, 300, '<b id="t">ticking</b>'),
    `const tick = () => { document.getElementById('t').style.opacity = String(0.5 + (performance.now() % 1000) / 2000); requestAnimationFrame(tick); }; requestAnimationFrame(tick);`,
  );
  const diagnostics = await rejects(
    acquireScreenshot(page, await clipOf(page, 'c'), context('c')),
    /did not come to rest within 20 settles \(target markup/,
  );
  assert.equal(diagnostics.scrolled, false);
  await page.close();
});

// ---------------------------------------------------------------- the legacy exception

test('26-27. the legacy allowlist is exactly the two scroll-follow post-interaction captures, frozen', () => {
  assert.deepEqual(
    LEGACY_ACQUISITION.map(({ profile, caseId, stage }) => [profile, caseId, stage]),
    [
      ['dropdown', 'dropdown/interaction-scroll-follow', 'post'],
      ['popover', 'popover/interaction-scroll-follow', 'post'],
    ],
  );
  assert.ok(Object.isFrozen(LEGACY_ACQUISITION) && LEGACY_ACQUISITION.every(Object.isFrozen));
  assert.throws(() => LEGACY_ACQUISITION.push({}));
  assert.equal(legacyAcquisition('dropdown', 'dropdown/interaction-scroll-follow', 'post-blurred'), null);
  assert.equal(legacyAcquisition('popover', 'dropdown/interaction-scroll-follow', 'post'), null);
});

test('28-30. an allowlisted capture keeps its whole tall clip, extends the frame and says so', async () => {
  const page = await open(tallPage(24, 1420, 'Actions'));
  await page.evaluate(
    `document.querySelector('[data-parity-case]').setAttribute('data-parity-case', 'dropdown/interaction-scroll-follow')`,
  );
  const clip = await clipOf(page, 'dropdown/interaction-scroll-follow');
  const { bytes, diagnostics } = await acquireScreenshot(
    page,
    clip,
    context('dropdown/interaction-scroll-follow', { profile: 'dropdown', stage: 'post' }),
  );
  assert.equal(diagnostics.mode, LEGACY);
  assert.match(diagnostics.legacyReason, /1420px/);
  assert.deepEqual([diagnostics.screenshot.width, diagnostics.screenshot.height], [360, 1420]);
  assert.ok(diagnostics.frameResized > 0, 'the documented cost of the exception');
  assert.equal(sha(bytes), sha(await legacyBytes(page, clip)));
  await page.close();
});

test('31. an allowlisted entry that fits the viewport is stale and fails; Mode A failures never become legacy', async () => {
  const page = await open(tallPage(100, 300));
  await page.evaluate(
    `document.querySelector('[data-parity-case]').setAttribute('data-parity-case', 'popover/interaction-scroll-follow')`,
  );
  const clip = await clipOf(page, 'popover/interaction-scroll-follow');
  await rejects(
    acquireScreenshot(page, clip, context('popover/interaction-scroll-follow', { profile: 'popover', stage: 'post' })),
    /allowlist entry is stale/,
  );
  await page.close();
});

// ---------------------------------------------------------------- scrollWindow

async function scrollScenario(pageHeight, y) {
  const page = await open(`<div data-parity-case="s" style="height:${pageHeight}px">scroll me</div>`);
  await page.evaluate(`document.body.style.margin = '0'`);
  try {
    return await driveInteraction(page, 's', [{ action: 'scrollWindow', y }]);
  } finally {
    await page.close();
  }
}

test('scrollWindow records the scroll it achieved', async () => {
  const events = await scrollScenario(1468, 16);
  assert.deepEqual(events.at(-1), { type: 'scrollWindow', requested: 16, before: 0, after: 16 });
});

test('16. a scrollWindow on a page that cannot scroll fails instead of measuring an unscrolled page', async () => {
  await assert.rejects(
    scrollScenario(800, 16),
    /scrollWindow in s requested 16px but the window moved from \(0, 0\) to \(0, 0\)/,
  );
});

test('17. a scrollWindow that moves less than requested fails', async () => {
  await assert.rejects(scrollScenario(910, 16), /requested 16px but the window moved from \(0, 0\) to \(0, 10\)/);
});
