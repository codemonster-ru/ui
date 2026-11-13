import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { PNG } from 'pngjs';
import { collectComponentCases } from '../contracts/component-cases.mjs';

const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const origin = process.env.CM_PARITY_ORIGIN ?? 'http://127.0.0.1:5176';
const profile = await mkdtemp(join(tmpdir(), 'cm-vanilla-chrome-'));
const chrome = spawn(
  chromePath,
  [
    '--headless',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
let socket;
let launchError;
chrome.on('error', (error) => {
  launchError = error;
});

async function waitFor(read, timeout = 8000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (launchError) throw launchError;
    const result = await read();
    if (result) return result;
    await delay(50);
  }
  throw new Error('Browser or fixture did not become ready.');
}

try {
  const port = await waitFor(async () => {
    try {
      return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  });
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  socket = new WebSocket(targets.find(({ type }) => type === 'page').webSocketDebuggerUrl);
  await new Promise((accept, reject) => {
    socket.addEventListener('open', accept, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  function send(method, params = {}) {
    return new Promise((accept, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => {
        socket.removeEventListener('message', receive);
        reject(new Error(`${method} timed out.`));
      }, 10_000);
      function receive(event) {
        const response = JSON.parse(event.data);
        if (response.id !== id) return;
        clearTimeout(timer);
        socket.removeEventListener('message', receive);
        if (response.error) reject(new Error(response.error.message));
        else accept(response.result);
      }
      socket.addEventListener('message', receive);
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails)
      throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    return response.result.value;
  }

  await send('Page.enable');
  await send('Emulation.setLocaleOverride', { locale: 'en-US' });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 660, deviceScaleFactor: 1, mobile: false });
  const { cases, errors } = collectComponentCases(resolve(import.meta.dirname, '../../contracts'));
  if (errors.length) throw new Error(errors.join('\n'));
  const selected = process.argv.slice(2);
  const report = [];
  for (const componentCase of cases.filter(({ id }) => !selected.length || selected.includes(id))) {
    const { id, componentSlug } = componentCase;
    for (const theme of ['light', 'dark']) {
      const result = { id, componentSlug, theme };
      try {
        const captures = [];
        for (const platform of ['vue', 'vanilla']) {
          const url = new URL('/', origin);
          url.search = new URLSearchParams({ case: id, platform, theme, catalog: 'all' });
          await send('Page.navigate', { url: url.href });
          await waitFor(() =>
            evaluate(`document.querySelector('[data-visual-ready="true"]')?.dataset.visualCase === ${JSON.stringify(id)} &&
            document.querySelector('[data-visual-ready="true"]')?.dataset.visualRenderer === ${JSON.stringify(platform === 'vue' ? 'vue-mounted' : 'vanilla-enhanced')}`),
          );
          await evaluate(
            'document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))',
          );
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 350, y: 650 });
          await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
          const data = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
          captures.push(PNG.sync.read(Buffer.from(data.data, 'base64')));
          if (id === 'accordion-default') {
            const point = await evaluate(`(() => {
              const { x, y, width, height } = document.querySelector('.cm-accordion__trigger').getBoundingClientRect();
              return { x: x + width / 2, y: y + height / 2 };
            })()`);
            for (const type of ['mousePressed', 'mouseReleased']) {
              await send('Input.dispatchMouseEvent', { ...point, type, button: 'left', clickCount: 1 });
            }
            await waitFor(() =>
              evaluate(`document.querySelector('.cm-accordion__trigger').getAttribute('aria-expanded') === 'true'
              && !document.querySelector('.cm-accordion__panel').hidden`),
            );
            await send('Input.dispatchKeyEvent', {
              type: 'rawKeyDown',
              key: 'ArrowDown',
              code: 'ArrowDown',
              windowsVirtualKeyCode: 40,
            });
            await send('Input.dispatchKeyEvent', {
              type: 'keyUp',
              key: 'ArrowDown',
              code: 'ArrowDown',
              windowsVirtualKeyCode: 40,
            });
            await waitFor(() =>
              evaluate("document.activeElement === document.querySelectorAll('.cm-accordion__trigger')[1]"),
            );
            result.accordionInteraction = 'passed';
          }
        }
        let differingPixels = 0;
        for (let i = 0; i < captures[0].data.length; i += 4) {
          if (
            [0, 1, 2, 3].some((channel) => Math.abs(captures[0].data[i + channel] - captures[1].data[i + channel]) > 2)
          )
            differingPixels++;
        }
        result.differingPixels = differingPixels;
      } catch (error) {
        result.error = error.message;
      }
      report.push(result);
      console.log(JSON.stringify(result));
    }
  }
  if (!report.length) throw new Error('No canonical cases selected.');
  await writeFile(
    process.env.CM_PARITY_REPORT ?? '/tmp/cm-vanilla-parity.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  if (report.some(({ error, differingPixels }) => error || differingPixels !== 0)) process.exitCode = 1;
} finally {
  socket?.close();
  if (chrome.exitCode === null && chrome.pid) {
    const done = new Promise((accept) => chrome.once('exit', accept));
    chrome.kill();
    await done;
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
