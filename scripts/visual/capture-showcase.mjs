import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createShowcaseStateMatrix, readShowcaseStateConfig } from './showcase-state-cases.mjs';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [name, ...value] = argument.replace(/^--/u, '').split('=');
    return [name, value.join('=')];
  }),
);

const origin = options.origin;
const outputDirectory = options.output ? resolve(options.output) : null;
const label = options.label;
const chromeEndpoint = options.chrome ?? process.env.CHROME_REMOTE_ENDPOINT ?? 'http://127.0.0.1:9226';
const suite = options.suite ?? 'default';

if (!origin || !outputDirectory || !label) {
  throw new Error(
    'Usage: node scripts/visual/capture-showcase.mjs --origin=http://127.0.0.1:5175 --output=DIR --label=LABEL',
  );
}
if (!['default', 'states'].includes(suite)) {
  throw new Error('Visual capture suite must be default or states.');
}

const config = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../contracts/visual.config.json'), 'utf8'));
const sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

mkdirSync(outputDirectory, { recursive: true });

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

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolvePromise, reject) => {
    const timeoutId = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method}: Chrome DevTools request timed out.`));
    }, 30_000);
    pending.set(id, { method, reject, resolve: resolvePromise, timeoutId });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
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

async function prepareRoute(route, theme, reducedMotion = 'reduce', stabilizeMotion = true) {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reducedMotion }],
  });
  const url = `${origin.replace(/\/$/u, '')}/${route}`;
  await send('Page.navigate', { url });
  await waitFor('document.readyState === "complete" && document.querySelector("#app")?.children.length > 0');
  await evaluate(`(() => {
    localStorage.setItem('vf-theme', ${JSON.stringify(theme.name)});
    localStorage.setItem('codemonster-showcase-theme', ${JSON.stringify(theme.name)});
    document.documentElement.setAttribute('data-vf-theme', ${JSON.stringify(theme.attribute)});
    document.documentElement.setAttribute('data-cm-theme', ${JSON.stringify(theme.attribute)});
    location.reload();
    return true;
  })()`);
  await waitFor('document.readyState === "complete" && document.querySelector("#app")?.children.length > 0');
  await evaluate(`document.fonts?.ready ?? Promise.resolve()`);
  const motionStyle = stabilizeMotion
    ? '*,*::before,*::after{animation:none!important;caret-color:transparent!important;scroll-behavior:auto!important;transition:none!important}'
    : '*,*::before,*::after{caret-color:transparent!important;scroll-behavior:auto!important}';
  await evaluate(`(() => {
    const style = document.createElement('style');
    style.dataset.visualCapture = 'true';
    style.textContent = [
      ${JSON.stringify(motionStyle)},
      'html{scrollbar-width:none!important}',
      'html::-webkit-scrollbar{display:none!important}',
      '[role="progressbar"][aria-label="Dynamic progress"] :is(.vf-progress-bar__value,.cm-progress-bar__value),[role="progressbar"][aria-label="Installing module progress"] :is(.vf-progress-bar__value,.cm-progress-bar__value){inline-size:50%!important}',
      '[role="progressbar"][aria-label="Dynamic progress"] :is(.vf-progress-bar__label,.cm-progress-bar__label),[role="progressbar"][aria-label="Installing module progress"] :is(.vf-progress-bar__label,.cm-progress-bar__label){font-size:0!important}',
      '[role="progressbar"][aria-label="Dynamic progress"] :is(.vf-progress-bar__label,.cm-progress-bar__label)::after,[role="progressbar"][aria-label="Installing module progress"] :is(.vf-progress-bar__label,.cm-progress-bar__label)::after{content:"50%";font-size:0.625rem!important}',
    ].join('');
    document.head.append(style);

    return true;
  })()`);
  await sleep(route === 'playground' || route === 'codeblock' ? 3_000 : 500);
  if (route === 'codeblock') {
    await waitFor('document.querySelector("[data-showcase-loading-content=ready] .vf-codeblock") !== null');
  }
  if (route === 'playground') {
    await waitFor('document.querySelector("[data-showcase-loading-content=ready] .vf-playground") !== null');
  }
}

if (suite === 'states') {
  const stateConfig = readShowcaseStateConfig(resolve(import.meta.dirname, '../../contracts/visual.states.json'));
  const matrix = createShowcaseStateMatrix(stateConfig, config);
  const stateManifest = {
    label,
    referenceCommit: config.reference.commit,
    routes: [...new Set(stateConfig.states.map(({ route }) => route))],
    screenshots: [],
    stateCases: stateConfig.states,
    suite,
    themes: config.themes.map(({ name }) => name),
    viewports: config.viewports,
  };

  await send('DOM.enable');
  await send('CSS.enable');
  for (const stateCase of matrix) {
    await send('Emulation.setDeviceMetricsOverride', {
      deviceScaleFactor: 1,
      height: stateCase.viewport.height,
      mobile: false,
      width: stateCase.viewport.width,
    });
    await prepareRoute(stateCase.route, stateCase.theme, stateCase.media, stateCase.id !== 'reduced-motion');
    await evaluate(`(() => {
      const elements = document.querySelectorAll(${JSON.stringify(stateCase.selector)});
      const element = elements[${stateCase.index}];
      if (!element) throw new Error(${JSON.stringify(`Showcase state ${stateCase.id} target is unavailable.`)});
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
      return true;
    })()`);
    await sleep(100);

    const { root } = await send('DOM.getDocument');
    const { nodeIds } = await send('DOM.querySelectorAll', {
      nodeId: root.nodeId,
      selector: stateCase.selector,
    });
    const nodeId = nodeIds[stateCase.index];
    if (!nodeId) throw new Error(`Showcase state ${stateCase.id} target is unavailable.`);
    if (stateCase.pseudoClasses) {
      await send('CSS.forcePseudoState', { forcedPseudoClasses: stateCase.pseudoClasses, nodeId });
    }
    if (stateCase.assertReducedMotion) {
      await evaluate(`(() => {
        const target = document.querySelectorAll(${JSON.stringify(stateCase.selector)})[${stateCase.index}];
        const nodes = [target, ...target.querySelectorAll('*')];
        const pseudoElements = [null, '::before', '::after'];
        const hasDuration = (value) => value.split(',').some((duration) => Number.parseFloat(duration) > 0);
        const moving = nodes.some((node) => pseudoElements.some((pseudoElement) => {
          const style = getComputedStyle(node, pseudoElement);
          return style.animationName !== 'none' || hasDuration(style.transitionDuration);
        }));
        if (moving) throw new Error(${JSON.stringify(`Showcase state ${stateCase.id} retained active motion.`)});
        return true;
      })()`);
    }

    const { scrollLeft, scrollTop } = await evaluate('({ scrollLeft: window.scrollX, scrollTop: window.scrollY })');
    const { model } = await send('DOM.getBoxModel', { nodeId });
    const horizontal = model.border.filter((_, index) => index % 2 === 0);
    const vertical = model.border.filter((_, index) => index % 2 === 1);
    const viewportX = Math.floor(Math.min(...horizontal) - stateCase.padding);
    const viewportY = Math.floor(Math.min(...vertical) - stateCase.padding);
    const x = Math.max(0, viewportX + scrollLeft);
    const y = Math.max(0, viewportY + scrollTop);
    const width = Math.ceil(Math.max(...horizontal) + stateCase.padding + scrollLeft - x);
    const height = Math.ceil(Math.max(...vertical) + stateCase.padding + scrollTop - y);
    const { data } = await send('Page.captureScreenshot', {
      captureBeyondViewport: true,
      clip: { height, scale: 1, width, x, y },
      format: 'png',
      fromSurface: true,
    });
    writeFileSync(resolve(outputDirectory, stateCase.filename), Buffer.from(data, 'base64'));
    stateManifest.screenshots.push({
      filename: stateCase.filename,
      clip: { height, width, x, y },
      media: stateCase.media,
      route: stateCase.route,
      reducedMotionVerified: stateCase.assertReducedMotion || undefined,
      scrollTop,
      state: stateCase.id,
      theme: stateCase.theme.name,
      viewport: stateCase.viewport.name,
    });
  }

  writeFileSync(resolve(outputDirectory, 'manifest.json'), `${JSON.stringify(stateManifest, null, 2)}\n`);
  socket.close();
  console.log(`Captured ${stateManifest.screenshots.length} ${label} state screenshots in ${outputDirectory}.`);
  process.exit(0);
}

await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

const manifest = {
  label,
  referenceCommit: config.reference.commit,
  routes: config.reference.routes,
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
    for (const route of config.reference.routes) {
      await prepareRoute(route, theme);

      const pageHeight = await evaluate(
        'Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0)',
      );
      const tileCount = Math.max(1, Math.ceil(pageHeight / viewport.height));

      for (let tile = 0; tile < tileCount; tile += 1) {
        const scrollTop = Math.min(tile * viewport.height, Math.max(0, pageHeight - viewport.height));
        await evaluate(`scrollTo(0, ${scrollTop}); true`);
        await sleep(100);
        const { data } = await send('Page.captureScreenshot', {
          captureBeyondViewport: false,
          format: 'png',
          fromSurface: true,
        });
        const filename = `${route}--${theme.name}--${viewport.name}--${String(tile + 1).padStart(2, '0')}.png`;
        writeFileSync(resolve(outputDirectory, filename), Buffer.from(data, 'base64'));
        manifest.screenshots.push({
          filename,
          pageHeight,
          route,
          scrollTop,
          theme: theme.name,
          viewport: viewport.name,
        });
      }
    }
  }
}

writeFileSync(resolve(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
socket.close();
console.log(`Captured ${manifest.screenshots.length} ${label} showcase screenshots in ${outputDirectory}.`);
