// The hover and unhover steps of the scenario vocabulary (M31), in real Chrome.
//
// VfTooltip is the first component whose contract needs a pointer that stays
// on an element. The audit reproduced that the existing vocabulary cannot
// hold one: clickButton enters, presses, releases and parks the pointer at
// (900, 1) within a few milliseconds, so a tooltip's 80 ms timer is cancelled
// before it fires. These tests drive the real driveInteraction the parity
// runner calls, on small pages, and pin what the two steps promise and refuse:
//
//   - hover moves the real pointer onto the target and leaves it there: the
//     target matches :hover, the enter/over events fire, and nothing presses
//     or clicks;
//   - unhover moves it to the neutral point: leave/out fire and nothing but
//     the page matches :hover;
//   - both fail closed: a covered, zero-size or invisible target, an occupied
//     neutral point, and a step whose pointer move never happened are errors,
//     never a quiet hover of the wrong element;
//   - `through` reaches an element outside the case, as clickButton's does;
//   - clickButton is unchanged and cannot stand in for hover;
//   - a scroll while a hover is held is refused.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { launchChrome, openPage } from '../baseline/cdp.mjs';
import { driveInteraction } from './extract.mjs';

let chrome;
let page;

before(async () => {
  chrome = await launchChrome();
  page = await openPage(chrome.endpoint);
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1000,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
});

after(async () => {
  await page?.close();
  await chrome?.close();
});

/** Loads a page whose one case is `caseMarkup`, with `extra` beside it, and parks the pointer. */
async function load(caseMarkup, extra = '') {
  const html =
    '<!doctype html><html><head><style>body{margin:0;padding:24px}.target{display:inline-block;width:80px;height:30px}</style></head>' +
    `<body><div data-parity-case="c">${caseMarkup}</div>${extra}</body></html>`;
  await page.send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
  await page.waitFor(`document.querySelector('[data-parity-case="c"]') !== null`);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 900, y: 1 });
  await page.evaluate(`(() => {
    window.__pointer = [];
    for (const type of ['mouseover', 'mouseenter', 'mouseout', 'mouseleave'])
      document.addEventListener(type, (event) => { if (event.target.id) window.__pointer.push(type + ':' + event.target.id); }, true);
  })()`);
}

const hovered = () =>
  page.evaluate(`[...document.querySelectorAll(':hover')].map((node) => node.id || node.tagName.toLowerCase())`);
const pointer = () => page.evaluate('window.__pointer');

test('hover rests the pointer on the target: enter and over fire, :hover holds, nothing presses or clicks', async () => {
  await load('<span id="target" class="target">Info</span>');
  const inputEvents = await driveInteraction(page, 'c', [{ action: 'hover', selector: '#target' }]);

  assert.deepEqual(inputEvents, []);
  assert.deepEqual(await pointer(), ['mouseover:target', 'mouseenter:target']);
  assert.ok((await hovered()).includes('target'));
});

test('unhover takes it to the neutral point: leave and out fire and only the page stays :hover', async () => {
  await load('<span id="target" class="target">Info</span>');
  await driveInteraction(page, 'c', [{ action: 'hover', selector: '#target' }, { action: 'unhover' }]);

  assert.deepEqual(await pointer(), ['mouseover:target', 'mouseenter:target', 'mouseout:target', 'mouseleave:target']);
  assert.deepEqual(await hovered(), ['html', 'body']);
});

test('hover refuses a target an overlay covers, and moves nothing', async () => {
  await load(
    '<span id="target" class="target">Info</span>',
    '<div id="cover" style="position:fixed;inset:0;background:transparent"></div>',
  );

  await assert.rejects(
    driveInteraction(page, 'c', [{ action: 'hover', selector: '#target' }]),
    /covered by <div id="cover"/,
  );
  assert.deepEqual(await pointer(), []);
});

test('hover accepts a target whose centre hits its own descendant', async () => {
  await load(
    '<span id="target" class="target"><b id="inner" style="display:inline-block;width:80px;height:30px">Info</b></span>',
  );
  await driveInteraction(page, 'c', [{ action: 'hover', selector: '#target' }]);

  assert.ok((await hovered()).includes('target'));
  assert.ok((await hovered()).includes('inner'));
});

test('hover refuses a zero-size, a display:none and a visibility:hidden target', async () => {
  for (const style of ['width:0;height:0', 'display:none', 'visibility:hidden']) {
    await load(`<span id="target" class="target" style="${style}">Info</span>`);
    await assert.rejects(
      driveInteraction(page, 'c', [{ action: 'hover', selector: '#target' }]),
      /missing or not visible/,
      `a target with ${style} was hovered`,
    );
  }
});

test('hover refuses a target that does not exist', async () => {
  await load('<span id="target" class="target">Info</span>');

  await assert.rejects(
    driveInteraction(page, 'c', [{ action: 'hover', selector: '#missing' }]),
    /hover target is missing or not visible/,
  );
});

test('unhover refuses a neutral point something occupies', async () => {
  await load(
    '<span id="target" class="target">Info</span>',
    '<div id="banner" style="position:fixed;top:0;right:0;width:200px;height:20px"></div>',
  );

  await assert.rejects(
    driveInteraction(page, 'c', [{ action: 'hover', selector: '#target' }, { action: 'unhover' }]),
    /neutral point is occupied by <div id="banner"/,
  );
});

test('through hovers an element outside the case that a case element names', async () => {
  await load(
    '<span class="source" aria-describedby="far">Source</span>',
    '<div id="far" style="margin-top:40px"><span id="target" class="target">Far</span></div>',
  );
  await driveInteraction(page, 'c', [
    { action: 'hover', selector: '#target', through: { selector: '.source', attribute: 'aria-describedby' } },
  ]);

  assert.ok((await hovered()).includes('target'));
});

test('through: the element found before the move is the one held to :hover, even when the move breaks the reference', async () => {
  // A teleported tooltip closes the moment the pointer reaches it - its
  // trigger drops aria-describedby - and the node stays while it leaves. The
  // postcondition has to be about that node, not a fresh lookup that can no
  // longer find it.
  await load(
    '<span class="source" aria-describedby="far">Source</span>',
    '<div id="far" style="margin-top:40px"><span id="target" class="target">Far</span></div>',
  );
  await page.evaluate(
    `document.getElementById('target').addEventListener('mouseenter', () => document.querySelector('.source').removeAttribute('aria-describedby')); true`,
  );
  await driveInteraction(page, 'c', [
    { action: 'hover', selector: '#target', through: { selector: '.source', attribute: 'aria-describedby' } },
  ]);

  assert.ok((await hovered()).includes('target'));
  assert.equal(await page.evaluate(`document.querySelector('.source').hasAttribute('aria-describedby')`), false);
});

test('a hover whose pointer move never reached Chrome fails, and so does an unhover', async () => {
  await load('<span id="target" class="target">Info</span>');
  const send = page.send;
  const dropping = (predicate) => ({
    ...page,
    send: (method, params) =>
      method === 'Input.dispatchMouseEvent' && predicate(params) ? Promise.resolve({}) : send(method, params),
  });

  await assert.rejects(
    driveInteraction(
      dropping(() => true),
      'c',
      [{ action: 'hover', selector: '#target' }],
    ),
    /hover target is not :hover/,
  );
  await driveInteraction(page, 'c', [{ action: 'hover', selector: '#target' }]);
  await assert.rejects(
    driveInteraction(
      dropping((params) => params.x === 900 && params.y === 1),
      'c',
      [{ action: 'unhover' }],
    ),
    /unhover left a :hover/,
  );
});

test('clickButton is unchanged and cannot stand in for hover: it presses, clicks and leaves nothing hovered', async () => {
  await load('<button id="target" type="button" class="target">Info</button>');
  const inputEvents = await driveInteraction(page, 'c', [{ action: 'clickButton', selector: '#target' }], '#target');

  assert.deepEqual(
    inputEvents.map((event) => event.type),
    ['pointerdown', 'mousedown', 'mouseup', 'click'],
  );
  assert.deepEqual(await pointer(), ['mouseover:target', 'mouseenter:target', 'mouseout:target', 'mouseleave:target']);
  assert.deepEqual(await hovered(), ['html', 'body']);
});

test('a scroll while a hover is held is refused, and allowed once it is released', async () => {
  await load('<span id="target" class="target">Info</span>', '<div style="height:3000px"></div>');

  await assert.rejects(
    driveInteraction(page, 'c', [
      { action: 'hover', selector: '#target' },
      { action: 'scrollWindow', y: 10 },
    ]),
    /scrollWindow while a hover is held/,
  );
  await driveInteraction(page, 'c', [
    { action: 'hover', selector: '#target' },
    { action: 'unhover' },
    { action: 'scrollWindow', y: 10 },
  ]);
  assert.equal(await page.evaluate('window.scrollY'), 10);
});

test('an unknown step is still refused', async () => {
  await load('<span id="target" class="target">Info</span>');

  await assert.rejects(
    driveInteraction(page, 'c', [{ action: 'hoverOver', selector: '#target' }]),
    /unknown interaction step/,
  );
});
