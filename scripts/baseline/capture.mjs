// Captures the six historical showcase routes from a served origin.
//
// Every capture records the case inventory it saw, the resolved fonts, the
// emulated environment and a screenshot hash. Missing or unexpected cases are
// reported by the comparison step as failures; they never shrink a denominator.
//
// How the full-page pixels are acquired (M35.6d). Until M35.6d every capture
// used captureBeyondViewport:true. Chrome implements it by resizing the frame
// to the document and copying the first frame produced at that size. In that
// frame the composited sticky header cells of the /core tables, whose left
// edges sit at fractional x (922.297, 1119.047), were rasterised either at
// their exact subpixel position or snapped by a fraction of a pixel - chosen
// per capture, not by the page (2 of 10 Linux reference->reference runs,
// including CI run 38120371890). The same resize issued explicitly, followed by
// a wait for the page to be at rest at that size, gave the exact raster in
// every launch - byte-identical to the frame with those cells not composited.
// So the frame is now resized explicitly, the page has to come to rest, and the
// capture is accepted only if two frames taken one after the other are
// byte-identical; anything else fails the capture. Nothing is retried.
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

// A page is at rest when, for restQuietFrames consecutive animation frames,
// nothing that changes pixels by itself is pending: no finite animation or
// transition is running, the DOM did not mutate, the document size did not
// change, every image finished loading and every code block carries its Shiki
// tokens. VfCodeBlock renders a plain fallback first and highlights
// asynchronously, loading each grammar on demand - on /codeblock the html, php
// and scss blocks are still plain 500 ms after load - and the route
// readySelector does not wait for it. Only the plain-text languages are
// rendered without tokens by design (code-highlight.ts maps plaintext, text and
// txt to no grammar); a block in any other language that stays plain, because
// highlighting is late or failed, keeps the page from rest. Infinite
// animations are not waited for - the two-frame identity check below rejects
// any that are visible. The wait is bounded; reaching the bound is a failure.
export const restQuietFrames = 3;
export const restFrameLimit = 900;

export const restExpression = `(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => done()));
  let mutations = 0;
  const observer = new MutationObserver((records) => { mutations += records.length; });
  observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  const sample = () => {
    const finite = document.getAnimations().filter(
      (animation) => animation.playState === 'running' && Number.isFinite(animation.effect?.getComputedTiming?.().endTime),
    );
    const codeBlocks = [...document.querySelectorAll('.vf-codeblock')];
    const plainLanguages = ['plaintext', 'text', 'txt'];
    const language = (block) =>
      (block.querySelector('.vf-codeblock__language')?.textContent ?? '').split(':').pop().trim().toLowerCase();
    return {
      fonts: document.fonts.status,
      finiteAnimations: finite.length,
      animationSample: finite.slice(0, 5).map((animation) =>
        animation.constructor.name + ':' + (animation.transitionProperty ?? animation.animationName) + '@' +
        (animation.effect?.target?.tagName ?? '?') + '.' + String(animation.effect?.target?.className ?? '').slice(0, 60)),
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      incompleteImages: [...document.images].filter((image) => !image.complete).length,
      codeBlocks: codeBlocks.length,
      unhighlightedCodeBlocks: codeBlocks.filter(
        (block) => !block.querySelector('.vf-codeblock__shiki-token') && !plainLanguages.includes(language(block)),
      ).length,
    };
  };
  let previous = sample();
  let quiet = 0;
  let frames = 0;
  try {
    for (; frames < ${restFrameLimit} && quiet < ${restQuietFrames}; frames += 1) {
      mutations = 0;
      await frame();
      observer.takeRecords().forEach(() => { mutations += 1; });
      const current = sample();
      const atRest =
        current.fonts === 'loaded' &&
        current.finiteAnimations === 0 &&
        mutations === 0 &&
        current.scrollHeight === previous.scrollHeight &&
        current.scrollWidth === previous.scrollWidth &&
        current.incompleteImages === 0 &&
        current.unhighlightedCodeBlocks === 0;
      quiet = atRest ? quiet + 1 : 0;
      previous = { ...current, mutations };
    }
  } finally {
    observer.disconnect();
  }
  return { atRest: quiet >= ${restQuietFrames}, frames, last: previous };
})()`;

async function waitForRest(page, phase) {
  const rest = await page.evaluate(restExpression);
  if (!rest.atRest) {
    throw new CaptureRejected(`the page did not come to rest ${phase} within ${restFrameLimit} frames`, {
      phase,
      rest,
    });
  }
  return { phase, frames: rest.frames };
}

// A capture the harness refuses to use. It carries what was measured and any
// frames obtained, so the refusal can be diagnosed from the run artifacts.
class CaptureRejected extends Error {
  constructor(reason, diagnostics, frames = []) {
    super(reason);
    this.name = 'CaptureRejected';
    this.diagnostics = diagnostics;
    this.frames = frames;
  }
}

export function pngSize(buffer) {
  // IHDR is the first chunk: width and height are the big-endian words at 16 and 20.
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

// The frame is resized to the document measured at the capture viewport - the
// same size captureBeyondViewport used - and the page has to come to rest at
// that size. Two frames are then copied one after the other without any
// resize; they have to be byte-identical and exactly the measured size. The
// frame is put back afterwards.
async function acquireFullPage(page, viewport) {
  const size = await page.evaluate(
    `({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })`,
  );
  if (size.width !== viewport.width) {
    throw new CaptureRejected(
      `the document is ${size.width}px wide in a ${viewport.width}px viewport; the full-page geometry is undefined`,
      { size },
    );
  }

  const metrics = { deviceScaleFactor: captureEnvironment.deviceScaleFactor, mobile: viewport.mobile };
  await page.send('Emulation.setDeviceMetricsOverride', { ...metrics, width: size.width, height: size.height });

  try {
    await page.waitFor(`window.innerWidth === ${size.width} && window.innerHeight === ${size.height}`, 10_000);
    const rest = await waitForRest(page, 'at the full-page size');

    const resizedBefore = page.eventCounts['Page.frameResized'];
    const parameters = { format: captureEnvironment.screenshotFormat, captureBeyondViewport: false, fromSurface: true };
    const first = Buffer.from((await page.send('Page.captureScreenshot', parameters)).data, 'base64');
    await page.evaluate(`new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(true))))`);
    const second = Buffer.from((await page.send('Page.captureScreenshot', parameters)).data, 'base64');
    const resizedDuringCapture = page.eventCounts['Page.frameResized'] - resizedBefore;

    const diagnostics = {
      size,
      rest,
      resizedDuringCapture,
      first: { bytes: first.length, sha256: sha256(first), size: pngSize(first) },
      second: { bytes: second.length, sha256: sha256(second), size: pngSize(second) },
    };
    const rejected = (reason) => new CaptureRejected(reason, diagnostics, [first, second]);

    if (resizedDuringCapture !== 0) {
      throw rejected(`the frame was resized ${resizedDuringCapture} time(s) during the capture`);
    }
    for (const shot of [diagnostics.first, diagnostics.second]) {
      if (!shot.size || shot.size.width !== size.width || shot.size.height !== size.height) {
        throw rejected(`a screenshot is ${JSON.stringify(shot.size)}, not ${size.width}x${size.height}`);
      }
    }
    if (!first.equals(second)) {
      throw rejected('two consecutive frames differ; the page is not at rest');
    }

    return { contents: first, acquisition: { method: 'expanded-viewport', size, rest, stabilityFrames: 2 } };
  } finally {
    await page.send('Emulation.setDeviceMetricsOverride', {
      ...metrics,
      width: viewport.width,
      height: viewport.height,
    });
  }
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
          const id = captureId(route.id, viewport.id, theme);

          let acquired;
          let cases;
          let componentCensus;
          let fonts;
          let layout;
          try {
            const rest = await waitForRest(page, 'at the capture viewport');

            cases = await page.evaluate(caseInventoryExpression(route));
            componentCensus = await page.evaluate(componentCensusExpression);
            fonts = await page.evaluate(fontProbeExpression);
            layout = await page.evaluate(layoutExpression);

            acquired = await acquireFullPage(page, viewport);
            acquired.acquisition.restAtViewport = rest;
          } catch (error) {
            if (error instanceof CaptureRejected) {
              // Fail closed and keep the evidence: no frame of a rejected capture
              // is written as a capture, and the run stops here.
              writeFileSync(
                resolve(outputDirectory, `${id}.rejected.json`),
                `${JSON.stringify({ id, reason: error.message, diagnostics: error.diagnostics }, null, 2)}\n`,
              );
              error.frames.forEach((frame, index) =>
                writeFileSync(resolve(outputDirectory, `${id}.rejected-${index + 1}.png`), frame),
              );
              error.message = `capture ${id} rejected: ${error.message}`;
            }
            throw error;
          }

          const { contents, acquisition } = acquired;
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
            acquisition,
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
      // Recorded so a capture set acquired another way never compares as equal.
      acquisition: 'expanded-viewport-at-rest',
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
