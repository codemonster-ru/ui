// Waiting for a parity page to be ready, by event (M35 P1-1), in real Chrome.
//
// run.mjs used cdp.mjs's waitFor, which looks every 100 ms; the fixture's
// readiness mark usually lands a few milliseconds after the navigation, so
// each of a run's ~3 800 navigations waited out most of a poll. The wait is now
// a MutationObserver on the mark. Faster has to mean the same: these tests pin
// that it resolves for the mark and nothing else, never before it, never on the
// page being left, and fails rather than passes when the mark never comes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';

import { launchChrome, openPage } from '../baseline/cdp.mjs';
import { repositoryRoot } from '../baseline/reference.mjs';
import { readinessExpression } from './run.mjs';

let chrome;
let page;

beforeEach(async () => {
  chrome = await launchChrome();
  page = await openPage(chrome.endpoint);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
});

afterEach(async () => {
  await page?.close();
  await chrome?.close();
});

/** Navigates to a page whose script runs `script`; `window.__marked` records when the mark landed. */
async function open(script, nonce = 'page') {
  const html =
    `<!doctype html><html><body data-nonce="${nonce}"><script>` +
    `window.__mark = (value) => { document.documentElement.setAttribute('data-parity-ready', value); if (value === 'true') window.__marked = performance.now(); };` +
    `${script}</script></body></html>`;
  await page.send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
}

/** Resolves the readiness wait and reports when, in page time, against when the mark landed. */
async function waitInPage(timeoutMs) {
  await page.evaluate(`window.__waitResult = (${readinessExpression(timeoutMs)}).then(
    () => ({ resolvedAt: performance.now(), markedAt: window.__marked ?? null }),
    (error) => ({ rejected: error.message }))`);
  return page.evaluate('window.__waitResult');
}

test('a page that is already ready is ready at once - no polling quantum', { timeout: 10_000 }, async () => {
  await open(`__mark('true');`);
  await page.waitFor(`document.documentElement.getAttribute('data-parity-ready') === 'true'`);
  const elapsed = await page.evaluate(
    `(async () => { const started = performance.now(); await (${readinessExpression(5_000)}); return performance.now() - started; })()`,
  );
  assert.ok(elapsed < 20, `took ${elapsed} ms on a page that was already ready`);
});

test('a late mark is waited for, never anticipated, and seen promptly - not a poll later', async () => {
  await open(`setTimeout(() => __mark('true'), 150);`);
  const result = await waitInPage(60_000);
  assert.equal(result.rejected, undefined);
  assert.notEqual(result.markedAt, null, 'resolved before the mark landed');
  assert.ok(result.resolvedAt >= result.markedAt, 'resolved before the mark');
  assert.ok(
    result.resolvedAt - result.markedAt < 40,
    `resolved ${result.resolvedAt - result.markedAt} ms after the mark`,
  );
});

test('a mark that is not "true", and any other attribute, do not count', async () => {
  // The mark changes to "false" again after the wait has started, and another
  // attribute changes too; only the later "true" may resolve it.
  await open(
    `__mark('false'); setTimeout(() => __mark('false'), 50); setTimeout(() => document.documentElement.setAttribute('data-other', 'true'), 80); setTimeout(() => __mark('true'), 200);`,
  );
  const result = await waitInPage(60_000);
  assert.equal(result.rejected, undefined);
  assert.notEqual(result.markedAt, null, 'resolved before the mark landed');
  assert.ok(result.resolvedAt >= result.markedAt);
});

// Its own timeout turns a wait that never settles into a failure, not a hang.
test('a page that never becomes ready fails within the bound instead of passing', { timeout: 10_000 }, async () => {
  await open(`__mark('false');`);
  const started = Date.now();
  const result = await waitInPage(300);
  assert.equal(result.rejected, 'Timed out waiting for data-parity-ready');
  assert.ok(Date.now() - started < 5_000);
});

test('the page being left cannot pass for the next one, though its own mark still reads ready', async () => {
  await open(`__mark('true');`);
  await page.waitFor(`document.documentElement.getAttribute('data-parity-ready') === 'true'`);
  await page.evaluate('window.__parityNavigatedAway = true');
  const result = await waitInPage(60_000);
  assert.equal(result.rejected, 'readiness was read from the page being left');
});

test("run.mjs marks the page it leaves, navigates, then waits on the new page - and the wait sees the new page's mark", async () => {
  const source = readFileSync(resolve(repositoryRoot, 'scripts/parity/run.mjs'), 'utf8');
  assert.match(
    source,
    /await page\.evaluate\('window\.__parityNavigatedAway = true'\);\n\s+await page\.send\('Page\.navigate'[^\n]*\n\s+await page\.evaluate\(readinessExpression\(\)\);/,
  );
  assert.ok(
    !/waitFor\(`document\.documentElement\.getAttribute\('data-parity-ready'\)/.test(source),
    'the polling wait is gone',
  );

  // The same sequence by hand: old page ready, marked as left; new page ready later.
  await open(`__mark('true');`, 'old');
  await page.waitFor(`document.documentElement.getAttribute('data-parity-ready') === 'true'`);
  await page.evaluate('window.__parityNavigatedAway = true');
  await open(`setTimeout(() => __mark('true'), 120);`, 'new');
  await page.evaluate(readinessExpression());
  assert.equal(await page.evaluate('document.body.dataset.nonce'), 'new');
  assert.equal(await page.evaluate(`document.documentElement.getAttribute('data-parity-ready')`), 'true');
});

test(
  'an error inside the readiness wait fails it, with the error, rather than being waited out',
  { timeout: 10_000 },
  async () => {
    await open(`__mark('false'); window.MutationObserver = function () { throw new Error('observer unavailable'); };`);
    const result = await waitInPage(5_000);
    assert.equal(result.rejected, 'observer unavailable');
  },
);

test(
  'a wait whose document is replaced before it is ready fails - the new page cannot complete the old wait',
  { timeout: 10_000 },
  async () => {
    await open(`__mark('false');`, 'first');
    const pending = page.evaluate(readinessExpression(5_000));
    // A second round trip returns only after the first evaluation has started:
    // the wait is pending in the first document, not queued for the next one.
    await page.evaluate('1');
    // Another document, ready at once, takes the frame while the wait is pending.
    await open(`__mark('true');`, 'second');
    await assert.rejects(pending, (error) => !/Timed out waiting for data-parity-ready/.test(error.message));
    assert.equal(await page.evaluate('document.body.dataset.nonce'), 'second');
  },
);

test(
  'a wait that starts before the parser has made the root element waits for it, and then for the mark',
  { timeout: 15_000 },
  async () => {
    // Headers at once, the document 200 ms later: Page.navigate returns on the
    // committed document while it still has no documentElement.
    const server = createServer((request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.flushHeaders();
      setTimeout(
        () =>
          response.end(
            '<!doctype html><html><body><script>setTimeout(() => document.documentElement.setAttribute("data-parity-ready", "true"), 50);</script></body></html>',
          ),
        200,
      );
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    try {
      for (let i = 0; i < 3; i++) {
        await page.send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
        assert.equal(await page.evaluate('document.documentElement === null'), true, 'the root existed already');
        await page.evaluate(readinessExpression(5_000));
        assert.equal(await page.evaluate(`document.documentElement.getAttribute('data-parity-ready')`), 'true');
      }
    } finally {
      await new Promise((done) => server.close(done));
    }
  },
);
