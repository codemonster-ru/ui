// The browser's own answer to a key the component leaves alone (M35.0), in
// real Chrome.
//
// The stepper's wrong-axis scenario presses ArrowDown on a horizontal stepper,
// which the historical component does not handle - its contract is
// keydownPrevented=[false]. Headless Chrome hands an unconsumed key like that
// to the browser, which opened chrome://settings/help as the active tab: the
// capture page went hidden, produced no frame again, and stayed that way across
// every later navigation, so 17 of 27 stepper scenarios were captured on a
// hidden page on all three targets. The overlay fixtures had swallowed such
// keys since M28; the generic driver did not.
//
// These tests drive the real driveInteraction on small pages and pin the two
// facts the driver now keeps apart:
//
//   - the component's answer is recorded as it was, before the harness touches
//     the event: a key nobody prevented stays false, a key the component
//     prevented stays true;
//   - only then, and only for the explicit navigation keys, is the browser's
//     default swallowed: the page stays visible, keeps producing frames, opens
//     no chrome:// target, and a later scenario runs the same way. Enter, Space
//     and Tab keep their defaults - native activation and focus moves are what
//     the scenarios measure.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import { launchChrome, openPage } from '../baseline/cdp.mjs';
import * as extract from './extract.mjs';

let chrome;
let page;

// A fresh browser per test: the defect is browser-wide - the stolen tab stays
// active - so a shared one would let one failure stand in for the next.
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
 * Loads a short page - nothing to scroll, as a live-parity case alone on its
 * page is - whose one case holds three buttons. `script` runs as page code,
 * before driveInteraction installs anything.
 */
async function load(script = '') {
  const html =
    '<!doctype html><html><head><style>body{margin:0;padding:24px}</style></head><body>' +
    '<div data-parity-case="c"><button id="a" class="vf-icon-button">A</button>' +
    '<button id="b">B</button><button id="c">C</button></div>' +
    `<script>window.__clicks = 0; document.addEventListener('click', () => { window.__clicks += 1; }); ${script}</script>` +
    '</body></html>';
  await page.send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
  await page.waitFor(`document.querySelector('[data-parity-case="c"]') !== null`);
}

const press = (key, selector = '#a') =>
  extract.driveInteraction(page, 'c', [
    { action: 'focusButton', selector },
    { action: 'pressKey', key },
  ]);

const keydownPrevented = (inputEvents) =>
  inputEvents.filter((entry) => entry.type === 'keydown').map((entry) => entry.defaultPrevented);

/** Everything the defect broke, measured after the gesture. */
async function health() {
  const targets = await fetch(`${chrome.endpoint}/json/list`).then((response) => response.json());
  return {
    visibility: await page.evaluate('document.visibilityState'),
    // Fires within a frame on a page that renders; never on a hidden one.
    frame: await page.evaluate(
      `new Promise((done) => { requestAnimationFrame(() => done('frame')); setTimeout(() => done('no frame'), 250); })`,
    ),
    browserPages: targets
      .filter((target) => target.type === 'page' && target.url.startsWith('chrome://'))
      .map((target) => target.url),
  };
}

const healthy = { visibility: 'visible', frame: 'frame', browserPages: [] };

test('an unhandled navigation key is recorded as not prevented, and the page stays visible and rendering', async () => {
  await load();
  const inputEvents = await press('ArrowDown');

  assert.deepEqual(keydownPrevented(inputEvents), [false]);
  assert.deepEqual(await health(), healthy);
});

test('a later scenario after an unhandled key runs on a visible page too', async () => {
  for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'ArrowRight', 'ArrowLeft', 'Escape']) {
    await load();
    assert.deepEqual(keydownPrevented(await press(key)), [false], key);
    assert.deepEqual(await health(), healthy, key);
  }
});

test('a key the component prevents is still recorded as prevented', async () => {
  await load(
    `document.getElementById('a').addEventListener('keydown', (event) => { if (event.key === 'ArrowRight') event.preventDefault(); });`,
  );

  assert.deepEqual(keydownPrevented(await press('ArrowRight')), [true]);
  assert.deepEqual(await health(), healthy);
});

test("the record is the component's answer: a consumer handler sees the key unprevented, and the harness does not overwrite it later", async () => {
  // A consumer handler on the document, in the bubble phase - after the
  // component's, before the harness's. A harness that swallowed first, or that
  // read defaultPrevented after its own swallow, would turn [false] into [true].
  await load(
    `window.__seen = []; document.addEventListener('keydown', (event) => window.__seen.push(event.key + ':' + event.defaultPrevented));`,
  );
  const inputEvents = await press('ArrowDown');
  await page.evaluate('new Promise((done) => setTimeout(done, 50))');

  assert.deepEqual(await page.evaluate('window.__seen'), ['ArrowDown:false']);
  assert.deepEqual(keydownPrevented(inputEvents), [false]);
  assert.deepEqual(keydownPrevented(await page.evaluate('window.__parityInputEvents')), [false]);
});

test('Enter, Space and Tab keep their browser defaults: activation and the focus move still happen', async () => {
  for (const key of ['Enter', ' ']) {
    await load();
    const inputEvents = await press(key);
    assert.deepEqual(keydownPrevented(inputEvents), [false], key);
    assert.equal(await page.evaluate('window.__clicks'), 1, `${key} activates the button`);
    assert.deepEqual(await health(), healthy, key);
  }

  await load();
  assert.deepEqual(keydownPrevented(await press('Tab')), [false]);
  assert.equal(await page.evaluate('document.activeElement.id'), 'b', 'Tab moves focus');
});

test('the swallowed keys are an explicit list of navigation keys, and none of them produces a character', () => {
  assert.deepEqual(extract.browserDefaultKeys, [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Escape',
  ]);
  for (const key of ['Enter', ' ', 'Tab']) assert.ok(!extract.browserDefaultKeys.includes(key), key);
});
