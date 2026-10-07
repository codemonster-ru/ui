// The Razor parity page starts in the theme it was asked for (M35), in real
// Chrome, on the real fixture.
//
// The Vue fixture sets data-vf-theme before it mounts, so no case element ever
// has a style from another theme. The Razor fixture's cases are in the HTML
// itself, and until M35 the theme was set at the end of the page's module
// script - after the browser had sometimes already styled those cases in the
// default theme. Every colour transition the components declare then ran from
// light to dark: 3 931 on a stepper page, 2 679 on a tabs page, and the page
// declared itself ready in the same task, mid-transition. The 100 ms readiness
// poll and the settle after it usually covered them; the P1-1 attempt, which
// waited by event, captured them (736 colour differences on stepper, dark).
//
// The theme is now set in <head>, before a case is parsed, and the page is
// ready only if that held. These tests build the real Razor target - the PHP
// fixture and the packaged assets - and watch it from document creation.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, resolve } from 'node:path';
import { after, afterEach, before, beforeEach, test } from 'node:test';

import { launchChrome, openPage } from '../baseline/cdp.mjs';
import { profiles } from './profiles.mjs';
import { buildCurrentTarget, buildRazorTarget } from './targets.mjs';

const root = mkdtempSync(resolve(tmpdir(), 'vueforge-razor-theme-test-'));
const servers = {};
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

/** Serves a built target; `rewrite` may change cases.html on the way out. */
async function serve(directory, rewrite = (html) => html) {
  const server = createServer((request, response) => {
    const file = resolve(directory, decodeURIComponent(request.url.split('?')[0]).replace(/^\/+/, ''));
    if (!existsSync(file)) return response.writeHead(404).end();
    response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' });
    const bytes = readFileSync(file);
    response.end(file.endsWith('cases.html') ? rewrite(bytes.toString('utf8')) : bytes);
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(done)),
  };
}

// Before any page script: the theme when the first case is parsed, every
// transition that runs, split into the colour ones a theme change starts and
// the rest, and what the page looked like when it declared itself ready.
const recorder = `(() => {
  const themeColour = /^(color|background-color|border-(top|right|bottom|left)-color|border-color|box-shadow|outline-color|text-decoration-color|fill|stroke)$/;
  const log = (window.__themeLog = { themeAtFirstCase: undefined, colour: 0, other: {}, readyCases: null, readyTheme: null });
  new MutationObserver(() => {
    if (log.themeAtFirstCase === undefined && document.querySelector('[data-parity-case]')) {
      log.themeAtFirstCase = document.documentElement.getAttribute('data-vf-theme');
    }
    if (log.readyCases === null && document.documentElement?.getAttribute('data-parity-ready') === 'true') {
      log.readyCases = document.querySelectorAll('[data-parity-case]').length;
      log.readyTheme = document.documentElement.getAttribute('data-vf-theme');
      const probe = document.querySelector('.vf-tabs__tab, .vf-stepper__label');
      log.readyColour = probe ? getComputedStyle(probe).color : null;
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-parity-ready'] });
  document.addEventListener('transitionrun', (event) => {
    if (themeColour.test(event.propertyName)) log.colour += 1;
    else log.other[event.propertyName] = (log.other[event.propertyName] ?? 0) + 1;
  }, true);
})()`;

let chrome;
let page;

before(() => {
  for (const id of ['tabs', 'stepper']) buildRazorTarget(resolve(root, id, 'razor'), profiles[id]);
  buildCurrentTarget(resolve(root, 'tabs', 'current'), profiles.tabs);
});

after(async () => {
  for (const server of Object.values(servers)) await server.close();
  rmSync(root, { recursive: true, force: true });
});

beforeEach(async () => {
  chrome = await launchChrome();
  page = await openPage(chrome.endpoint);
  for (const method of ['Page.enable', 'Runtime.enable']) await page.send(method);
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1000,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: recorder });
});

afterEach(async () => {
  await page?.close();
  await chrome?.close();
});

/** Loads a target in a theme as the harness does - ready, fonts, settle - then waits for it to rest. */
async function load(target, theme) {
  servers[target] ??= await serve(resolve(root, target));
  await page.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'reduce' },
      { name: 'prefers-color-scheme', value: theme },
    ],
  });
  await page.send('Page.navigate', { url: `${servers[target].origin}/cases.html?theme=${theme}` });
  await page.waitFor(`document.documentElement.getAttribute('data-parity-ready') === 'true'`);
  await page.waitFor(`document.fonts.status === 'loaded'`);
  await page.evaluate('new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))');
  await page.evaluate('new Promise((done) => setTimeout(done, 300))');
  const log = await page.evaluate('window.__themeLog');
  const settledColour = await page.evaluate(
    `(() => { const probe = document.querySelector('.vf-tabs__tab, .vf-stepper__label'); return probe ? getComputedStyle(probe).color : null; })()`,
  );
  return { ...log, settledColour };
}

for (const [id, theme] of [
  ['tabs', 'dark'],
  ['stepper', 'dark'],
  ['tabs', 'light'],
  ['stepper', 'light'],
]) {
  test(`Razor ${id}, ${theme}: the cases are parsed in the requested theme, no colour transition runs, and ready means settled`, async () => {
    const cases = JSON.parse(readFileSync(resolve(import.meta.dirname, '../..', profiles[id].casesPath), 'utf8')).cases;
    for (let i = 0; i < 4; i++) {
      const log = await load(`${id}/razor`, theme);
      assert.equal(log.themeAtFirstCase, theme, 'the first case was parsed before the theme was set');
      assert.equal(log.colour, 0, `${log.colour} colour transitions ran`);
      assert.equal(log.readyTheme, theme);
      assert.equal(log.readyCases, cases.length, 'ready before every case was on the page');
      assert.equal(log.readyColour, log.settledColour, 'the colour at ready is not the settled colour');
    }
  });
}

test('the transitions the components themselves declare still run on Razor, exactly as on current Vue', async () => {
  const razor = await load('tabs/razor', 'dark');
  const vue = await load('tabs/current', 'dark');
  assert.ok(Object.values(razor.other).reduce((sum, count) => sum + count, 0) > 0, 'no component transition ran');
  assert.deepEqual(razor.other, vue.other);
  assert.equal(vue.colour, 0);
  assert.equal(vue.themeAtFirstCase, 'dark');
});

test('a Razor page whose theme was never established does not declare itself ready', async () => {
  // The fixture without its <head> theme script: the cases render in the
  // default theme, and readiness must fail closed rather than pass.
  servers['stripped'] = await serve(resolve(root, 'tabs/razor'), (html) => {
    const stripped = html.replace(/<script>\s*\/\/ The requested theme is set here[\s\S]*?<\/script>\n/, '');
    assert.notEqual(stripped, html, 'the head theme script was not found');
    return stripped;
  });
  await page.send('Page.navigate', { url: `${servers['stripped'].origin}/cases.html?theme=dark` });
  await assert.rejects(
    page.waitFor(`document.documentElement.getAttribute('data-parity-ready') === 'true'`, 2_000),
    /Timed out waiting/,
  );
  assert.ok(page.diagnostics.pageErrors.some((error) => /requested theme dark was not established/.test(error)));
});
