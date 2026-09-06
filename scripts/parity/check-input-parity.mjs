#!/usr/bin/env node
// Three-way parity gate for the shared VfInput cases.
//
//   reference Vue -> current Vue    the Vue contract is preserved
//   reference Vue -> Razor          the historical product reaches the new adapter
//   current Vue  -> Razor           the two adapters have not diverged
//
// The first direction is what stops the last one from passing while both new
// implementations are wrong together.
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { delay, launchChrome, openPage } from '../baseline/cdp.mjs';
import { artifactsDirectory, captureEnvironment, repositoryRoot, stableStringify } from '../baseline/reference.mjs';
import {
  classify,
  compareAccessibility,
  compareDom,
  compareInteraction,
  compareStyles,
  directions,
  loadPolicy,
} from './compare.mjs';
import { extractCasesExpression, interactionExpression } from './extract.mjs';
import { buildCurrentTarget, buildRazorTarget, buildReferenceTarget } from './targets.mjs';

const runDirectory = resolve(artifactsDirectory, 'parity');
const catalog = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/input/cases.json'), 'utf8'));
const policy = loadPolicy(resolve(repositoryRoot, 'contracts/input/parity-policy.json'));
const themes = ['light', 'dark'];
const viewport = { width: 1000, height: 900 };

const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

async function serve(directory) {
  const server = createServer((request, response) => {
    const filePath = resolve(directory, decodeURIComponent(request.url.split('?')[0]).replace(/^\/+/, ''));
    if (!filePath.startsWith(directory) || !existsSync(filePath)) {
      response.writeHead(404).end('not found');
      return;
    }
    response.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream' });
    response.end(readFileSync(filePath));
  });

  await new Promise((done) => server.listen(0, '127.0.0.1', done));

  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(done)),
  };
}

/** Accessibility semantics for the roles a case can expose. */
async function readAccessibility(page, caseId) {
  const roles = {
    control: 'input.vf-input',
    clear: '.vf-input-wrap__clear',
    reveal: '.vf-input-wrap__password-toggle',
  };
  const { root } = await page.send('DOM.getDocument', { depth: -1 });
  const exposed = {};

  for (const [role, selector] of Object.entries(roles)) {
    const { nodeId } = await page.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: `[data-parity-case="${caseId}"] ${selector}`,
    });
    if (!nodeId) continue;

    const { nodes } = await page.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    // An ignored node is not exposed to assistive technology, so it is absent
    // rather than present-with-empty-semantics.
    const node = nodes.find((candidate) => candidate.ignored !== true);
    if (!node) continue;

    const states = {};
    for (const property of node.properties ?? []) {
      if (['disabled', 'readonly', 'required', 'invalid', 'pressed', 'focusable'].includes(property.name)) {
        states[property.name] = String(property.value?.value ?? '');
      }
    }

    exposed[role] = { role: node.role?.value ?? null, name: (node.name?.value ?? '').trim(), states };
  }

  return exposed;
}

async function captureTarget(chrome, origin, page404, label, theme, screenshotDirectory) {
  const page = await openPage(chrome.endpoint);

  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('DOM.enable');
    await page.send('Accessibility.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      ...viewport,
      deviceScaleFactor: captureEnvironment.deviceScaleFactor,
      mobile: false,
    });
    await page.send('Emulation.setLocaleOverride', { locale: captureEnvironment.locale });
    await page.send('Emulation.setTimezoneOverride', { timezoneId: captureEnvironment.timezone });
    await page.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-motion', value: captureEnvironment.reducedMotion },
        { name: 'forced-colors', value: captureEnvironment.forcedColors },
        { name: 'prefers-color-scheme', value: theme },
      ],
    });

    await page.send('Page.navigate', { url: `${origin}/${page404}?theme=${theme}` });
    await page.waitFor(`document.documentElement.getAttribute('data-parity-ready') === 'true'`);
    await page.waitFor(`document.querySelectorAll('[data-parity-case]').length === ${catalog.cases.length}`);
    await page.waitFor(`document.fonts.status === 'loaded'`);
    await delay(150);

    const extracted = await page.evaluate(extractCasesExpression);
    const accessibility = {};
    const screenshots = {};

    for (const parityCase of catalog.cases) {
      accessibility[parityCase.id] = await readAccessibility(page, parityCase.id);

      if (!parityCase.visual) continue;

      const clip = extracted[parityCase.id].clip;
      const shot = await page.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        fromSurface: true,
        clip: { ...clip, scale: 1 },
      });
      const bytes = Buffer.from(shot.data, 'base64');
      const fileName = `${label}-${theme}-${parityCase.id.replace(/\//g, '_')}.png`;
      writeFileSync(resolve(screenshotDirectory, fileName), bytes);
      screenshots[parityCase.id] = { fileName, sha256: createHash('sha256').update(bytes).digest('hex') };
    }

    // Interaction scenarios run on a freshly loaded page so earlier cases
    // cannot influence later ones.
    const interactions = {};
    for (const parityCase of catalog.cases) {
      if (!parityCase.interaction) continue;
      await page.send('Page.navigate', { url: `${origin}/${page404}?theme=${theme}` });
      await page.waitFor(`document.documentElement.getAttribute('data-parity-ready') === 'true'`);
      await delay(120);
      interactions[parityCase.id] = await page.evaluate(
        interactionExpression(parityCase.id, parityCase.interaction.steps),
      );
    }

    return { extracted, accessibility, screenshots, interactions, diagnostics: page.diagnostics };
  } finally {
    await page.close();
  }
}

mkdirSync(runDirectory, { recursive: true });
const screenshotDirectory = resolve(runDirectory, 'screenshots');
mkdirSync(screenshotDirectory, { recursive: true });

process.stdout.write('Building the three render targets\n');
const targets = {
  reference: buildReferenceTarget(resolve(runDirectory, 'reference'), resolve(runDirectory, 'reference-checkout')),
  current: buildCurrentTarget(resolve(runDirectory, 'current')),
  razor: buildRazorTarget(resolve(runDirectory, 'razor')),
};

const chrome = await launchChrome();
const captures = {};
const servers = [];

try {
  for (const [label, target] of Object.entries(targets)) {
    const server = await serve(target.directory);
    servers.push(server);
    captures[label] = {};

    for (const theme of themes) {
      process.stdout.write(`  capturing ${label} (${theme})\n`);
      captures[label][theme] = await captureTarget(
        chrome,
        server.origin,
        target.page,
        label,
        theme,
        screenshotDirectory,
      );
    }
  }
} finally {
  await chrome.close();
  for (const server of servers) await server.close();
}

const failures = [];
const approved = [];
let comparisons = 0;
let visualComparisons = 0;
let visualDifferences = 0;

for (const direction of directions) {
  for (const theme of themes) {
    const left = captures[direction.from][theme];
    const right = captures[direction.to][theme];

    for (const parityCase of catalog.cases) {
      const id = parityCase.id;
      const raw = [
        ...compareDom(left.extracted[id].dom, right.extracted[id].dom),
        ...compareStyles(left.extracted[id].styles, right.extracted[id].styles),
        ...compareAccessibility(left.accessibility[id], right.accessibility[id]),
      ];

      if (parityCase.interaction) {
        raw.push(...compareInteraction(left.interactions[id], right.interactions[id]));
      }

      if (parityCase.visual) {
        visualComparisons += 1;
        const leftShot = left.screenshots[id];
        const rightShot = right.screenshots[id];
        if (leftShot.sha256 !== rightShot.sha256) {
          visualDifferences += 1;
          raw.push({
            dimension: 'visual',
            path: `theme=${theme}`,
            detail: 'screenshot',
            left: `${leftShot.fileName} ${leftShot.sha256.slice(0, 12)}`,
            right: `${rightShot.fileName} ${rightShot.sha256.slice(0, 12)}`,
          });
        }
      }

      comparisons += 1;
      const classified = classify(
        policy,
        id,
        direction,
        raw.map((entry) => ({ ...entry, theme })),
      );
      failures.push(...classified.failures);
      approved.push(...classified.approved);
    }
  }
}

const pageErrors = Object.entries(captures).flatMap(([label, byTheme]) =>
  Object.entries(byTheme).flatMap(([theme, capture]) =>
    capture.diagnostics.pageErrors.map((error) => `${label}/${theme}: ${error}`),
  ),
);

const report = {
  $comment: 'Three-way VfInput parity report. Generated by scripts/parity/check-input-parity.mjs.',
  generatedFor: { cases: catalog.cases.length, themes, viewport, directions: directions.map((d) => d.id) },
  provenance: Object.fromEntries(Object.entries(targets).map(([label, target]) => [label, target.provenance])),
  environment: {
    deviceScaleFactor: captureEnvironment.deviceScaleFactor,
    locale: captureEnvironment.locale,
    timezone: captureEnvironment.timezone,
    reducedMotion: captureEnvironment.reducedMotion,
    browser: chrome.browser,
  },
  summary: {
    caseComparisons: comparisons,
    visualComparisons,
    visualDifferences,
    failures: failures.length,
    approvedDivergences: approved.length,
    failuresByDimension: failures.reduce((counts, failure) => {
      counts[failure.dimension] = (counts[failure.dimension] ?? 0) + 1;
      return counts;
    }, {}),
  },
  failures,
  approvedDivergences: approved,
  pageErrors,
};

const reportPath = resolve(runDirectory, 'input-parity-report.json');
writeFileSync(reportPath, stableStringify(report));

process.stdout.write(
  `\n${catalog.cases.length} cases x ${themes.length} themes x ${directions.length} directions ` +
    `= ${comparisons} case comparisons, ${visualComparisons} screenshot comparisons.\n` +
    `Report: ${relative(repositoryRoot, reportPath)}\n`,
);

if (approved.length > 0) {
  const grouped = approved.reduce((counts, entry) => {
    counts[entry.dimension] = (counts[entry.dimension] ?? 0) + 1;
    return counts;
  }, {});
  process.stdout.write(
    `Approved divergences: ${Object.entries(grouped)
      .map(([k, v]) => `${k} x${v}`)
      .join(', ')}\n`,
  );
}

if (pageErrors.length > 0) {
  process.stderr.write(`\nPage errors:\n  - ${pageErrors.join('\n  - ')}\n`);
}

if (failures.length > 0 || pageErrors.length > 0) {
  process.stderr.write(`\n[input-parity] FAILED with ${failures.length} unapproved difference(s):\n`);
  for (const failure of failures.slice(0, 40)) {
    process.stderr.write(
      `  - ${failure.caseId} [${failure.direction}/${failure.theme}] ${failure.dimension} (${failure.classification})` +
        ` at ${failure.path}${failure.detail ? ` ${failure.detail}` : ''}\n` +
        `      ${failure.direction.split('-vs-')[0]}: ${JSON.stringify(failure.left)}\n` +
        `      ${failure.direction.split('-vs-')[1]}: ${JSON.stringify(failure.right)}\n`,
    );
  }
  if (failures.length > 40) {
    process.stderr.write(`  ... ${failures.length - 40} more in the report.\n`);
  }
  process.exit(1);
}

process.stdout.write('[input-parity] OK: three-way parity holds for every shared VfInput case.\n');
