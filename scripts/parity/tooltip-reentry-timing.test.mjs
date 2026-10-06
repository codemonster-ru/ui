// The re-entry scenario's timing window under slow frames (M35.0a), in real
// Chrome.
//
// tooltip/interaction-reentry-restart proves two things about the historical
// VfTooltip (fd793696): a leave cancels the pending open before its delay
// expires, and a re-entry starts a fresh delay. Its first leg has to fit
// between two bounds:
//
//   - the leave must land before the 600 ms delay after the first enter, or
//     the pending open fires and the case records two openings;
//   - the re-entry must land more than half the delay after the first enter,
//     or a timer that was not restarted would open on time rather than early,
//     and the browser mutation whose leave does not cancel it would go unseen.
//
// What lies between the enter and the leave is not only the scenario's wait:
// every step settles on two animation frames and every CDP call waits for the
// renderer. The M35.0 final run met the M31 catalog's wait of 500 ms with
// headless Chrome at 30 frames per second: the leave landed about 634 ms after
// the enter on all three targets, and the gate failed. These tests drive the
// catalog's own steps through the real driveInteraction, on a page with the
// historical timer logic, with the harness's frame-bound calls slowed to what
// 30 and 20 frames per second cost, and at the host's own frame rate.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';

import { launchChrome, openPage } from '../baseline/cdp.mjs';
import { repositoryRoot } from '../baseline/reference.mjs';
import { driveInteraction } from './extract.mjs';
import { profiles } from './profiles.mjs';

const caseId = 'tooltip/interaction-reentry-restart';
const scenario = JSON.parse(readFileSync(resolve(repositoryRoot, profiles.tooltip.casesPath), 'utf8')).cases.find(
  (entry) => entry.id === caseId,
);
const delay = scenario.props.openDelay;

let chrome;
let page;

beforeEach(async () => {
  chrome = await launchChrome();
  page = await openPage(chrome.endpoint);
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1000,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
});

afterEach(async () => {
  await page?.close();
  await chrome?.close();
});

/**
 * The historical timer logic of VfTooltip at fd793696: an enter clears any
 * pending timer and starts one of the delay, a leave clears it and closes.
 * `survives` is the defect of browser-tooltip-pending-timer-survives-close: the
 * pending open is never cancelled.
 */
async function load({ survives = false } = {}) {
  const html =
    '<!doctype html><html><head><style>body{margin:0;padding:24px}.vf-tooltip__trigger{display:inline-block;width:120px;height:30px}</style></head><body>' +
    `<div data-parity-case="${caseId}"><span class="vf-tooltip"><span class="vf-tooltip__trigger">Slow hint</span></span></div>` +
    `<script>
      window.__log = [];
      const root = document.querySelector('.vf-tooltip');
      const trigger = root.querySelector('.vf-tooltip__trigger');
      let timer = null;
      const clear = () => { if (timer !== null && !${survives}) clearTimeout(timer); timer = null; };
      root.addEventListener('mouseenter', () => {
        window.__log.push(['enter', performance.now()]);
        clear();
        timer = setTimeout(() => { window.__log.push(['open', performance.now()]); trigger.setAttribute('aria-describedby', 'tip'); }, ${delay});
      });
      root.addEventListener('mouseleave', () => {
        window.__log.push(['leave', performance.now()]);
        clear();
        trigger.removeAttribute('aria-describedby');
      });
    </script></body></html>`;
  await page.send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
  await page.waitFor(`document.querySelector('.vf-tooltip__trigger') !== null`);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 900, y: 1 });
}

/**
 * The page as the driver sees it, with every frame-bound call slowed: a settle
 * (two frames) and a pointer move (acknowledged on the next frame) cost what
 * they cost at `fps` instead of 60. Nothing in the page changes; only the
 * harness's own scheduling between the steps grows.
 */
function throttled(fps) {
  const frame = 1000 / fps - 1000 / 60;
  const pause = (ms) => new Promise((done) => setTimeout(done, ms));
  return {
    ...page,
    send: async (method, params) => {
      const result = await page.send(method, params);
      if (method === 'Input.dispatchMouseEvent') await pause(frame);
      return result;
    },
    evaluate: async (expression) => {
      const result = await page.evaluate(expression);
      if (expression.includes('let settled = false')) await pause(2 * frame);
      return result;
    },
  };
}

async function run(driver) {
  await driveInteraction(driver, caseId, scenario.interaction.steps, profiles.tooltip.activationSelector);
  const log = await page.evaluate('window.__log');
  const at = (kind, index = 0) => log.filter(([entry]) => entry === kind)[index]?.[1];
  return {
    leaveAfterEnter: at('leave') - at('enter'),
    reentryAfterEnter: at('enter', 1) - at('enter'),
    firstOpenAfterReentry: at('open') - at('enter', 1),
    openings: log.filter(([entry]) => entry === 'open').length,
  };
}

test('the catalog scenario is the re-entry it claims: hover, a wait, unhover, hover, a wait past the delay', () => {
  assert.equal(delay, 600);
  assert.deepEqual(
    scenario.interaction.steps.map((step) => step.action),
    ['hover', 'wait', 'unhover', 'hover', 'wait'],
  );
  assert.deepEqual(scenario.interaction.expect.openings, [{ instance: 0, via: 'pointer', latency: 'on-time' }]);
});

for (const fps of [null, 30, 20]) {
  test(`at ${fps ? `${fps} frames per second` : 'the host frame rate'} the leave cancels the pending open, and the re-entry opens once on a fresh delay`, async () => {
    await load();
    const timing = await run(fps ? throttled(fps) : page);

    assert.ok(timing.leaveAfterEnter < delay, `the leave landed ${timing.leaveAfterEnter} ms after the enter`);
    assert.ok(
      timing.reentryAfterEnter > delay / 2,
      `the re-entry landed ${timing.reentryAfterEnter} ms after the enter, too soon to tell a restarted delay apart`,
    );
    assert.equal(timing.openings, 1);
    assert.ok(timing.firstOpenAfterReentry >= delay, `opened ${timing.firstOpenAfterReentry} ms after the re-entry`);
  });
}

test('a leave that does not cancel the pending open is still told apart: it opens early after the re-entry', async () => {
  for (const fps of [null, 20]) {
    await load({ survives: true });
    const timing = await run(fps ? throttled(fps) : page);

    assert.ok(
      timing.firstOpenAfterReentry < delay / 2,
      `at ${fps ?? 'host'} fps the surviving timer opened ${timing.firstOpenAfterReentry} ms after the re-entry, which reads as on time`,
    );
  }
});
