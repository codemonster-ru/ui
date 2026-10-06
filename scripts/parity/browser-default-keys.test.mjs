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

// M35.0c. The window guard above only acts on a key that reaches window. A
// mutation fixture that stops the key on its way - stepper's
// browser-stepper-arrow-without-prevent-default intercepts ArrowRight on the
// list and calls stopImmediatePropagation, deliberately without preventing it -
// left the browser to answer it, and the browser opened chrome://settings/help
// again. The cause was not the unconsumed key: pressKey sent the Windows key
// code as nativeVirtualKeyCode, which macOS reads as another physical key (39
// is the quote key), and that key reached the browser as a shortcut. The driver
// no longer sends one.
const interceptor = (prevent) =>
  `window.__intercepted = 0; window.__windowSaw = 0;
   addEventListener('keydown', () => { window.__windowSaw += 1; });
   document.querySelector('[data-parity-case="c"]').addEventListener('keydown', (event) => {
     if (event.key !== 'ArrowRight') return;
     window.__intercepted += 1;
     event.stopImmediatePropagation();
     ${prevent ? 'event.preventDefault();' : ''}
   }, true);`;

test('a key a mutation stops before window, unprevented, stays unprevented and leaves the page visible', async () => {
  await load(interceptor(false));
  const inputEvents = await press('ArrowRight');

  assert.equal(await page.evaluate('window.__intercepted'), 1, 'the interceptor ran');
  assert.equal(await page.evaluate('window.__windowSaw'), 0, 'nothing on window saw the key, the guard included');
  assert.deepEqual(keydownPrevented(inputEvents), [false]);
  assert.deepEqual(await health(), healthy);
});

test('an interceptor that prevents the key is recorded as prevented - the evidence a preventDefault "fix" would change', async () => {
  await load(interceptor(true));

  assert.deepEqual(keydownPrevented(await press('ArrowRight')), [true]);
  assert.equal(await page.evaluate('window.__windowSaw'), 0);
});

test(
  'the old payload - the Windows code as nativeVirtualKeyCode - still makes the browser take the stopped key',
  { skip: process.platform !== 'darwin' && 'the mismatch is macOS key codes; CI runs Linux' },
  async () => {
    // The positive control: what pressKey sent until M35.0c, by hand, on the
    // same page. Without it the tests above could pass on a browser that never
    // took such keys at all.
    await load(interceptor(false));
    await page.evaluate(`document.getElementById('a').focus()`);
    const old = { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 };
    await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...old });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...old });

    const after = await health();
    assert.equal(after.visibility, 'hidden');
    // chrome://help/ is the page before its redirect to chrome://settings/help.
    assert.equal(after.browserPages.length, 1);
    assert.match(after.browserPages[0], /^chrome:\/\/(settings\/)?help\/?$/);
  },
);

test('pressKey sends key, code and the Windows key code - and no nativeVirtualKeyCode - for every key it knows', async () => {
  const sent = [];
  const recorder = {
    send: async (method, params) => {
      if (method === 'Input.dispatchKeyEvent') sent.push(params);
      return {};
    },
    evaluate: async () => null,
  };
  const keys = {
    Enter: 13,
    ' ': 32,
    Tab: 9,
    Escape: 27,
    Home: 36,
    End: 35,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
  };
  for (const key of Object.keys(keys)) {
    sent.length = 0;
    await extract.driveInteraction(recorder, 'c', [{ action: 'pressKey', key }]);
    assert.deepEqual(
      sent.map((event) => event.type),
      key === 'Enter' || key === ' ' ? ['keyDown', 'keyUp'] : ['rawKeyDown', 'keyUp'],
      key,
    );
    for (const event of sent) {
      assert.equal(event.key, key);
      assert.equal(event.windowsVirtualKeyCode, keys[key], key);
      assert.ok(!('nativeVirtualKeyCode' in event), `${key} ${event.type} carries a nativeVirtualKeyCode`);
    }
  }
});
