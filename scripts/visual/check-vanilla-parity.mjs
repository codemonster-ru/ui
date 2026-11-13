import { collectBehaviorScenarios } from '../contracts/behavior-scenarios.mjs';
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
  if (process.env.CM_PARITY_BEHAVIOR === '1') {
    const { scenarios, errors: scenarioErrors } = collectBehaviorScenarios(
      resolve(import.meta.dirname, '../../contracts'),
    );
    if (scenarioErrors.length) throw new Error(scenarioErrors.join('\n'));
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
    // Commit each visual state before the next input can reverse its transitions.
    const settleMotion = `(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const finiteAnimations = document.getAnimations().filter(animation =>
        Number.isFinite(animation.effect?.getComputedTiming().endTime));
      await Promise.allSettled(finiteAnimations.map(animation => animation.finished));
    })()`;
    const result = [];
    for (const { componentSlug, data } of scenarios.filter(
      ({ data }) => !process.argv[2] || process.argv.slice(2).includes(data.id),
    )) {
      for (const platform of ['vue', 'vanilla']) {
        const row = { scenario: data.id, platform, failures: [], motion: [] };
        result.push(row);
        try {
          const url = new URL('/', origin);
          url.search = new URLSearchParams({
            case: data.case,
            platform,
            theme: 'light',
            catalog: 'all',
            behavior: 'true',
            ...(data.id === 'document-layout-declared-offsets' ? { enhance: 'false' } : {}),
          });
          await send('Page.navigate', { url: url.href });
          await waitFor(() =>
            evaluate(`document.querySelector('[data-visual-ready="true"]')?.dataset.visualCase === ${JSON.stringify(data.case)} &&
            document.querySelector('[data-visual-ready="true"]')?.dataset.visualRenderer === ${JSON.stringify(platform === 'vue' ? 'vue-mounted' : 'vanilla-enhanced')}`),
          );
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 350, y: 650 });
          await evaluate(settleMotion);
          await evaluate(`(() => {
            window.motionTrace = [];
            for (const type of ['transitionrun','animationstart']) document.addEventListener(type, event => {
              const style = getComputedStyle(event.target);
              window.motionTrace.push({type, name: event.propertyName ?? event.animationName,
                duration: type === 'transitionrun' ? style.transitionDuration : style.animationDuration});
            });
          })()`);
          for (const [index, step] of data.steps.entries()) {
            const locator = `window.behaviorTarget(${JSON.stringify(componentSlug)},${JSON.stringify(step.target)})`;
            try {
              if (step.action === 'press') {
                await evaluate(`(() => { const target = ${locator}; if (!target) throw Error('Missing target');
                  if (!target.contains(document.activeElement)) {
                    if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.tabIndex = -1;
                    target.focus();
                  } })()`);
                const keys = {
                  Enter: 13,
                  ' ': 32,
                  Escape: 27,
                  Tab: 9,
                  Home: 36,
                  End: 35,
                  ArrowDown: 40,
                  ArrowUp: 38,
                  ArrowLeft: 37,
                  ArrowRight: 39,
                };
                const key = step.key;
                const code = key === ' ' ? 'Space' : key;
                await send('Input.dispatchKeyEvent', {
                  type: 'keyDown',
                  key,
                  code,
                  windowsVirtualKeyCode: keys[key],
                  ...(['Enter', ' '].includes(key) ? { text: key === 'Enter' ? '\r' : ' ' } : {}),
                });
                await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keys[key] });
              } else if (step.action) {
                await evaluate(`(() => {
                  const target = ${locator}; const step = ${JSON.stringify(step)};
                  if (!target) throw Error('Missing target');
                  if (step.action === 'click') { if (!target.disabled) target.focus(); target.click(); }
                  if (step.action === 'focus') target.focus();
                  if (step.action === 'submit') target.requestSubmit();
                  if (step.action === 'setValue') {
                    target.value = step.value;
                    for (const type of ['input','change']) target.dispatchEvent(new Event(type, { bubbles: true }));
                  }
                })()`);
              } else {
                const actual = await evaluate(`(() => {
                  const target = ${locator}; const step = ${JSON.stringify(step)};
                  if (step.expect === 'eventCount') {
                    const name = step.name.replace(/^cm:/,'');
                    const qualified = ['next','back'].includes(name) ? 'setup-layout-' + name : name;
                    return window.behaviorEvents.get(qualified) ?? 0;
                  }
                  if (step.expect === 'visible') return Boolean(target && !target.closest('[hidden]') &&
                    getComputedStyle(target).display !== 'none' && (target.localName !== 'dialog' || target.open));
                  if (!target) throw Error('Missing target');
                  if (step.expect === 'attribute') return target.getAttribute(step.name);
                  if (step.expect === 'focus') return document.activeElement === target;
                  if (step.expect === 'formValue') return new FormData(target).get(step.name);
                  if (step.expect === 'styleProperty') return target.style.getPropertyValue(step.name);
                  if (step.expect === 'text') return target.textContent.trim();
                  if (step.expect === 'validity') return target.validity.valid;
                })()`);
                const expected = step.expect === 'eventCount' ? step.count : step.value;
                if (actual !== expected) row.failures.push({ index, step, actual });
              }
              if (step.action) {
                if (componentSlug === 'tooltip') await delay(650);
                await evaluate(settleMotion);
              }
            } catch (error) {
              row.failures.push({ index, step, error: error.message });
            }
          }
          row.motion = await evaluate('window.motionTrace');
        } catch (error) {
          row.failures.push({ error: error.message });
        }
        console.log(JSON.stringify(row));
      }
    }
    await writeFile(
      process.env.CM_PARITY_REPORT ?? '/tmp/cm-vanilla-behavior.json',
      JSON.stringify(result, null, 2) + '\n',
    );
    const signature = ({ motion }) =>
      JSON.stringify(
        [
          ...new Set(
            motion
              .filter(({ duration }) => duration.split(',').some((value) => parseFloat(value) > 0))
              .map((entry) => JSON.stringify(entry)),
          ),
        ].sort(),
      );
    const motionMismatches = result.filter(
      (row, index) => index % 2 === 0 && signature(row) !== signature(result[index + 1]),
    );
    console.log(
      JSON.stringify({ runs: result.length, motionMismatches: motionMismatches.map(({ scenario }) => scenario) }),
    );
    if (result.some(({ failures }) => failures.length) || motionMismatches.length) process.exitCode = 1;
  } else {
    if (errors.length) throw new Error(errors.join('\n'));
    const selected = process.argv.slice(2);
    const report = [];
    const animatedCases = new Set();
    for (const componentCase of cases.filter(({ id }) => !selected.length || selected.includes(id))) {
      const { id, componentSlug } = componentCase;
      for (const theme of ['light', 'dark']) {
        const result = { id, componentSlug, theme };
        try {
          const captures = [];
          const motion = [];
          for (const platform of ['vue', 'vanilla']) {
            const url = new URL('/', origin);
            url.search = new URLSearchParams({ case: id, platform, theme, catalog: 'all' });
            await send('Page.navigate', { url: url.href });
            await waitFor(() =>
              evaluate(`document.querySelector('[data-visual-ready="true"]')?.dataset.visualCase === ${JSON.stringify(id)} &&
            document.querySelector('[data-visual-ready="true"]')?.dataset.visualRenderer === ${JSON.stringify(platform === 'vue' ? 'vue-mounted' : 'vanilla-enhanced')}`),
            );
            await evaluate(`(() => {
            const style = document.createElement('style');
            style.textContent = '*{caret-color:transparent!important}';
            document.head.append(style);
          })()`);
            await evaluate(
              'document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))',
            );
            await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 350, y: 650 });
            await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
            const data = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
            captures.push(PNG.sync.read(Buffer.from(data.data, 'base64')));
            await send('Emulation.setEmulatedMedia', {
              features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
            });
            motion.push(
              await evaluate(`(() => {
              const root = document.querySelector('#visual-root');
              const entries = new Set();
              for (const element of root.querySelectorAll('*')) {
                if (element.closest('[hidden]') || !element.getClientRects().length) continue;
                for (const pseudo of [null, '::before', '::after']) {
                  const style = getComputedStyle(element, pseudo);
                  if (pseudo && ['none', 'normal'].includes(style.content)) continue;
                  if (style.animationName !== 'none') entries.add(JSON.stringify([
                    pseudo, style.animationName, style.animationDuration, style.animationTimingFunction,
                    style.animationIterationCount
                  ]));
                }
              }
              return [...entries].sort();
            })()`),
            );
            await send('Emulation.setEmulatedMedia', {
              features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
            });
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
              [0, 1, 2, 3].some(
                (channel) => Math.abs(captures[0].data[i + channel] - captures[1].data[i + channel]) > 2,
              )
            )
              differingPixels++;
          }
          result.differingPixels = differingPixels;
          result.motion = {
            vue: motion[0],
            vanilla: motion[1],
            equal: JSON.stringify(motion[0]) === JSON.stringify(motion[1]),
          };
          if (motion[0].length || motion[1].length) animatedCases.add(id);
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
    console.log(`Compared animation signatures for ${animatedCases.size} animated case(s).`);
    if (report.some(({ error, differingPixels, motion }) => error || differingPixels !== 0 || !motion.equal))
      process.exitCode = 1;
  }
} finally {
  socket?.close();
  if (chrome.exitCode === null && chrome.pid) {
    const done = new Promise((accept) => chrome.once('exit', accept));
    chrome.kill();
    await done;
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
