import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [name, ...value] = argument.replace(/^--/u, '').split('=');
    return [name, value.join('=')];
  }),
);
const origin = options.origin;
const outputDirectory = options.output ? resolve(options.output) : null;
const label = options.label;
const source = options.source ?? 'adapters';
const chromeEndpoint = options.chrome ?? process.env.CHROME_REMOTE_ENDPOINT ?? 'http://127.0.0.1:9226';

if (!origin || !outputDirectory || !label || !['adapters', 'vueforge'].includes(source)) {
  throw new Error(
    'Usage: node scripts/visual/capture-cross-platform-button.mjs --origin=URL --output=DIR --label=LABEL [--source=adapters|vueforge]',
  );
}

const config = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../contracts/visual.config.json'), 'utf8'));
const platforms = source === 'vueforge' ? ['reference'] : ['vue', 'razor'];
const sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

const targets = await fetch(`${chromeEndpoint}/json/list`).then((response) => {
  if (!response.ok) throw new Error(`Chrome DevTools endpoint returned ${response.status}.`);
  return response.json();
});
const target = targets.find((candidate) => candidate.type === 'page');
if (!target) throw new Error('Chrome page target is unavailable.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolvePromise, reject) => {
  socket.addEventListener('open', resolvePromise, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  clearTimeout(request.timeoutId);
  if (message.error) request.reject(new Error(`${request.method}: ${message.error.message}`));
  else request.resolve(message.result);
});

function send(method, parameters = {}) {
  const id = nextId++;
  return new Promise((resolvePromise, reject) => {
    const timeoutId = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method}: Chrome DevTools request timed out.`));
    }, 30_000);
    pending.set(id, { method, reject, resolve: resolvePromise, timeoutId });
    socket.send(JSON.stringify({ id, method, params: parameters }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

async function waitFor(expression, timeout = 30_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    try {
      if (await evaluate(expression)) return;
    } catch {
      // Navigation temporarily invalidates the execution context.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${expression}.`);
}

await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

for (const platform of platforms) {
  const platformDirectory = source === 'vueforge' ? outputDirectory : resolve(outputDirectory, platform);
  mkdirSync(platformDirectory, { recursive: true });
  const manifest = {
    label: source === 'vueforge' ? label : `${label}-${platform}`,
    referenceCommit: config.reference.commit,
    ...(source === 'vueforge'
      ? {
          sourceFixture: {
            component: '@codemonster-ru/vueforge-core/VfButton',
            props: {},
            renderer: 'Vue createApp at the reference commit',
            slots: { default: 'Save' },
          },
        }
      : {}),
    routes: ['button-default'],
    screenshots: [],
    themes: config.themes.map(({ name }) => name),
    viewports: config.viewports,
  };

  for (const viewport of config.viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      deviceScaleFactor: 1,
      height: viewport.height,
      mobile: false,
      width: viewport.width,
    });
    for (const theme of config.themes) {
      if (source === 'vueforge') {
        const url = `${origin.replace(/\/$/u, '')}/?theme=${theme.name}`;
        await send('Page.navigate', { url });
        await waitFor(
          'document.readyState === "complete" && document.querySelector("#visual-root")?.dataset.visualRenderer === "vueforge-fd-mounted" && document.querySelector("#visual-root")?.dataset.visualReady === "true"',
        );
      } else {
        const url = `${origin.replace(/\/$/u, '')}/?platform=${platform}&theme=${theme.name}`;
        await send('Page.navigate', { url });
        await waitFor(
          `document.readyState === "complete" && document.querySelector("#visual-root")?.dataset.visualRenderer === ${JSON.stringify(platform === 'vue' ? 'vue-mounted' : 'razor-rendered')} && document.querySelector("#visual-root")?.dataset.visualReady === "true"`,
        );
      }

      await evaluate('document.fonts?.ready ?? Promise.resolve()');
      await evaluate(`(() => {
        const style = document.createElement('style');
        style.dataset.visualCapture = 'true';
        style.textContent = '*,*::before,*::after{animation:none!important;caret-color:transparent!important;scroll-behavior:auto!important;transition:none!important}';
        document.head.append(style);
        return true;
      })()`);
      await sleep(100);

      const selector = source === 'vueforge' ? '#visual-root .vf-button' : '#visual-root .cm-button';
      await evaluate(`(() => {
        const target = document.querySelector(${JSON.stringify(selector)});
        if (!target) throw new Error('button-default visual target is unavailable.');
        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      })()`);
      const { root } = await send('DOM.getDocument');
      const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
      if (!nodeId) throw new Error('button-default visual target is unavailable.');

      const { scrollLeft, scrollTop } = await evaluate('({ scrollLeft: window.scrollX, scrollTop: window.scrollY })');
      const { model } = await send('DOM.getBoxModel', { nodeId });
      const horizontal = model.border.filter((_, index) => index % 2 === 0);
      const vertical = model.border.filter((_, index) => index % 2 === 1);
      const padding = 4;
      const viewportX = Math.round(Math.min(...horizontal) - padding);
      const viewportY = Math.round(Math.min(...vertical) - padding);
      const x = Math.max(0, viewportX + scrollLeft);
      const y = Math.max(0, viewportY + scrollTop);
      const width = Math.ceil(Math.max(...horizontal) + padding + scrollLeft - x);
      const height = Math.ceil(Math.max(...vertical) + padding + scrollTop - y);
      const { data } = await send('Page.captureScreenshot', {
        captureBeyondViewport: true,
        clip: { height, scale: 1, width, x, y },
        format: 'png',
        fromSurface: true,
      });
      const filename = `button-default--${theme.name}--${viewport.name}.png`;
      writeFileSync(resolve(platformDirectory, filename), Buffer.from(data, 'base64'));
      manifest.screenshots.push({ filename, platform, theme: theme.name, viewport: viewport.name });
    }
  }

  writeFileSync(resolve(platformDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

socket.close();
console.log(
  `Captured ${platforms.length * config.themes.length * config.viewports.length} ${label} Button screenshots.`,
);
