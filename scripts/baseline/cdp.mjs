// Minimal Chrome DevTools Protocol driver for the baseline capture harness.
//
// The repository already drives Chrome over CDP in scripts/visual; this module
// keeps the same approach but launches and owns its own headless browser so a
// capture run is reproducible without a manually started Chrome.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromeArguments } from './reference.mjs';

const chromeCandidates = [
  process.env.VUEFORGE_BASELINE_CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

export function resolveChromeExecutable() {
  const executable = chromeCandidates.find((candidate) => existsSync(candidate));
  if (!executable) {
    throw new Error(
      'No Chrome executable found. Set VUEFORGE_BASELINE_CHROME to the browser binary used for baseline captures.',
    );
  }

  return executable;
}

function delay(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function waitForDevToolsEndpoint(profileDirectory, timeoutMs = 30_000) {
  const portFile = resolve(profileDirectory, 'DevToolsActivePort');
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (existsSync(portFile)) {
      const [port] = readFileSync(portFile, 'utf8').split('\n');
      if (port && Number.isInteger(Number(port))) {
        return `http://127.0.0.1:${Number(port)}`;
      }
    }
    await delay(100);
  }

  throw new Error('Chrome did not report a DevTools port.');
}

export async function launchChrome() {
  const executable = resolveChromeExecutable();
  const profileDirectory = mkdtempSync(resolve(tmpdir(), 'vueforge-baseline-chrome-'));
  const child = spawn(
    executable,
    [...chromeArguments, '--remote-debugging-port=0', `--user-data-dir=${profileDirectory}`, 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  const stderrChunks = [];
  child.stderr.on('data', (chunk) => stderrChunks.push(chunk.toString()));

  const endpoint = await waitForDevToolsEndpoint(profileDirectory);
  const version = await fetch(`${endpoint}/json/version`).then((response) => response.json());

  return {
    executable,
    endpoint,
    browser: version.Browser,
    userAgent: version['User-Agent'],
    protocolVersion: version['Protocol-Version'],
    async close() {
      child.kill('SIGTERM');
      await new Promise((resolvePromise) => child.once('exit', resolvePromise));
      rmSync(profileDirectory, { recursive: true, force: true });
    },
    stderr: () => stderrChunks.join(''),
  };
}

export async function openPage(endpoint) {
  const target = await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' }).then((response) => response.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolvePromise, reject) => {
    socket.addEventListener('open', resolvePromise, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timeoutId);
      if (message.error) request.reject(new Error(`${request.method}: ${message.error.message}`));
      else request.resolve(message.result);
      return;
    }

    if (message.method === 'Runtime.exceptionThrown') {
      pageErrors.push(
        message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text ?? 'exception',
      );
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args.map((argument) => argument.value ?? argument.description).join(' '));
    }
    if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
      failedRequests.push(message.params.errorText);
    }
  });

  const send = (method, params = {}) => {
    const id = nextId++;
    return new Promise((resolvePromise, reject) => {
      const timeoutId = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method}: DevTools request timed out.`));
      }, 60_000);
      pending.set(id, { resolve: resolvePromise, reject, method, timeoutId });
      socket.send(JSON.stringify({ id, method, params }));
    });
  };

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  };

  const waitFor = async (expression, timeoutMs = 60_000) => {
    const startedAt = Date.now();
    let lastError;
    while (Date.now() - startedAt < timeoutMs) {
      try {
        const value = await evaluate(expression);
        if (value) return value;
      } catch (error) {
        lastError = error;
      }
      await delay(100);
    }
    throw new Error(`Timed out waiting for ${expression}${lastError ? `: ${lastError.message}` : ''}`);
  };

  return {
    targetId: target.id,
    send,
    evaluate,
    waitFor,
    diagnostics: { consoleErrors, pageErrors, failedRequests },
    async close() {
      socket.close();
      await fetch(`${endpoint}/json/close/${target.id}`);
    },
  };
}

export { delay };
