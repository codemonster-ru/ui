// Captures the six historical showcase routes from a served origin.
//
// Every capture records the case inventory it saw, the resolved fonts, the
// emulated environment and a screenshot hash. Missing or unexpected cases are
// reported by the comparison step as failures; they never shrink a denominator.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { delay, launchChrome, openPage } from './cdp.mjs';
import {
  captureEnvironment,
  captureId,
  sha256,
  showcaseExample,
  showcaseRoutes,
  showcaseThemes,
  showcaseViewports,
} from './reference.mjs';

// Collects case identifiers from the rendered document. Case sources are
// declared per route in reference.mjs so the inventory stays explicit.
function caseInventoryExpression(route) {
  return `(() => {
    const sources = ${JSON.stringify(route.caseSources)};
    const normalise = (text) => (text ?? '').replace(/\\s+/g, ' ').trim();
    const ids = [];

    for (const source of sources) {
      for (const element of document.querySelectorAll(source.selector)) {
        let id = null;

        if (source.id === 'anchor') {
          const anchor = element.querySelector('[id]');
          id = anchor ? anchor.id : normalise(element.querySelector('h2, h3')?.textContent);
        } else if (source.id === 'heading') {
          id = normalise(element.querySelector('h1, h2, h3')?.textContent);
        } else if (source.id === 'attr') {
          id = element.getAttribute(source.attribute);
        } else if (source.id === 'text') {
          id = normalise(element.textContent);
        }

        if (id) ids.push(source.prefix + ':' + id);
      }
    }

    return ids;
  })()`;
}

// The reference declares `Inter, ui-sans-serif, …` and ships no @font-face, so
// the face that actually renders is host state. `document.fonts.check()` is not
// enough — it answers "usable", not "installed" — so the probe measures text
// against a forced generic fallback. A different installed face changes the
// advance width and the comparison reports it instead of blaming the pixels
// (architecture plan, section 18.3).
const fontProbeExpression = `(() => {
  const probeText = 'Handgloves 0123456789 VueForge';
  const computed = getComputedStyle(document.documentElement);
  const declared = ${JSON.stringify(captureEnvironment.fontProbeFamilies)}.map((token) => [
    token,
    computed.getPropertyValue(token).trim(),
  ]);

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const measure = (family) => {
    context.font = '16px ' + family;
    return Math.round(context.measureText(probeText).width * 100) / 100;
  };

  const families = new Set();
  for (const [, value] of declared) {
    for (const family of value.split(',')) {
      const name = family.trim().replace(/^["']|["']$/g, '');
      if (name) families.add(name);
    }
  }

  const genericWidths = {
    'sans-serif': measure('sans-serif'),
    monospace: measure('monospace'),
    serif: measure('serif'),
  };

  // CSS generic family keywords are resolved by the browser, not by an
  // installed file, so the installed verdict only applies to named faces.
  const genericFamilies = new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'math', 'emoji', 'fangsong',
    'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  ]);

  const resolvedFaces = {};
  for (const family of [...families].sort()) {
    const quoted = /\\s/.test(family) ? '"' + family + '"' : family;
    const width = measure(quoted + ', serif');
    resolvedFaces[family] = {
      width,
      generic: genericFamilies.has(family),
      // A named family that measures exactly like the forced serif fallback is
      // not installed: the stack fell through to the generic face.
      installed: genericFamilies.has(family) ? null : width !== genericWidths.serif,
    };
  }

  return {
    declared: Object.fromEntries(declared),
    genericWidths,
    resolvedFaces,
    documentFontsStatus: document.fonts.status,
    bodyFontFamily: getComputedStyle(document.body).fontFamily,
    bodyProbeWidth: (() => {
      context.font = '16px ' + getComputedStyle(document.body).fontFamily;
      return Math.round(context.measureText(probeText).width * 100) / 100;
    })(),
  };
})()`;

// Census of block-level VueForge classes on the route. A demo that quietly
// disappears from the showcase shows up here as a changed count, which is the
// regression `4e830431` produced in the first migration.
const componentCensusExpression = `(() => {
  const counts = {};
  const blockClass = /^vf-[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const element of document.querySelectorAll('[class]')) {
    for (const token of element.classList) {
      if (blockClass.test(token)) counts[token] = (counts[token] ?? 0) + 1;
    }
  }

  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : 1)));
})()`;

const layoutExpression = `(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  theme: document.documentElement.dataset.vfTheme ?? null,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  locale: Intl.DateTimeFormat().resolvedOptions().locale,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  devicePixelRatio: window.devicePixelRatio,
}))()`;

// Injected before any page script runs. It controls the environment clock and
// the interval scheduler; it does not touch component markup or CSS.
const determinismScript = `(() => {
  const settings = ${JSON.stringify(captureEnvironment.determinism)};
  const NativeDate = Date;
  const timeOrigin = performance.now();

  const now = () => Math.floor(settings.clockEpochMs + (performance.now() - timeOrigin));

  function PinnedDate(...args) {
    if (!(this instanceof PinnedDate)) return new NativeDate(now()).toString();
    return args.length === 0 ? new NativeDate(now()) : new NativeDate(...args);
  }
  PinnedDate.prototype = NativeDate.prototype;
  PinnedDate.now = now;
  PinnedDate.parse = NativeDate.parse;
  PinnedDate.UTC = NativeDate.UTC;
  Object.setPrototypeOf(PinnedDate, NativeDate);
  window.Date = PinnedDate;

  let seed = settings.randomSeed >>> 0;
  Math.random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  if (settings.freezeIntervals) {
    // The only setInterval in the reference showcase and packages drives the
    // random-walk progress demo. Freezing the scheduler keeps that demo at its
    // initial value instead of masking the ProgressBar out of the frame.
    const nativeSetInterval = window.setInterval.bind(window);
    window.setInterval = () => nativeSetInterval(() => {}, 2147483647);
  }
})()`;

async function settle(page, readySelector) {
  await page.waitFor(`document.readyState === 'complete'`);
  await page.waitFor(`Boolean(document.querySelector(${JSON.stringify(readySelector)}))`);
  await page.waitFor(`document.fonts.status === 'loaded'`);
  // Two consecutive animation frames with an unchanged document height is a
  // real readiness signal; an arbitrary sleep is not.
  await page.evaluate(`(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => done()));
    let previous = -1;
    let stable = 0;
    for (let attempt = 0; attempt < 200 && stable < 3; attempt += 1) {
      await frame();
      const height = document.documentElement.scrollHeight;
      stable = height === previous ? stable + 1 : 0;
      previous = height;
    }
    return true;
  })()`);
}

export async function captureShowcase({ origin, outputDirectory, label }) {
  mkdirSync(outputDirectory, { recursive: true });

  const chrome = await launchChrome();
  const page = await openPage(chrome.endpoint);
  const captures = [];

  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Network.enable');
    await page.send('Emulation.setLocaleOverride', { locale: captureEnvironment.locale });
    await page.send('Emulation.setTimezoneOverride', { timezoneId: captureEnvironment.timezone });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: determinismScript });

    for (const viewport of showcaseViewports) {
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: captureEnvironment.deviceScaleFactor,
        mobile: viewport.mobile,
      });

      for (const route of showcaseRoutes) {
        for (const theme of showcaseThemes) {
          await page.send('Emulation.setEmulatedMedia', {
            features: [
              { name: 'prefers-reduced-motion', value: captureEnvironment.reducedMotion },
              { name: 'forced-colors', value: captureEnvironment.forcedColors },
              { name: 'prefers-color-scheme', value: theme },
            ],
          });

          // The showcase persists its mode under its own storage key; the mode
          // is applied before the route renders so no theme transition is in
          // flight while the frame is taken.
          await page.send('Page.navigate', { url: `${origin}${route.path}` });
          await page.waitFor(`document.readyState === 'complete'`);
          await page.evaluate(
            `localStorage.setItem(${JSON.stringify(showcaseExample.themeStorageKey)}, ${JSON.stringify(theme)}); true`,
          );
          await page.send('Page.navigate', { url: `${origin}${route.path}` });
          await settle(page, route.readySelector);
          await page.waitFor(`document.documentElement.dataset.vfTheme === ${JSON.stringify(theme)}`);

          const cases = await page.evaluate(caseInventoryExpression(route));
          const componentCensus = await page.evaluate(componentCensusExpression);
          const fonts = await page.evaluate(fontProbeExpression);
          const layout = await page.evaluate(layoutExpression);

          const screenshot = await page.send('Page.captureScreenshot', {
            format: captureEnvironment.screenshotFormat,
            captureBeyondViewport: true,
            fromSurface: true,
          });
          const contents = Buffer.from(screenshot.data, 'base64');
          const id = captureId(route.id, viewport.id, theme);
          const filename = `${id}.png`;
          writeFileSync(resolve(outputDirectory, filename), contents);

          captures.push({
            id,
            route: route.id,
            path: route.path,
            viewport: viewport.id,
            theme,
            cases,
            caseCount: cases.length,
            componentCensus,
            layout,
            fonts,
            screenshot: { filename, bytes: contents.length, sha256: sha256(contents) },
          });

          await delay(50);
        }
      }
    }
  } finally {
    await page.close();
    await chrome.close();
  }

  return {
    label,
    origin,
    environment: {
      ...captureEnvironment,
      browser: chrome.browser,
      userAgent: chrome.userAgent,
      protocolVersion: chrome.protocolVersion,
      chromeExecutable: chrome.executable,
      platform: `${process.platform}-${process.arch}`,
      nodeVersion: process.version,
      viewports: showcaseViewports,
      themes: showcaseThemes,
      routes: showcaseRoutes.map((route) => ({ id: route.id, path: route.path })),
    },
    diagnostics: page.diagnostics,
    captures,
  };
}
