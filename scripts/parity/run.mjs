// The three-way VfInput parity run: build, capture, compare.
//
// Split out of check-input-parity.mjs in M07.1 so the gate and the mutation
// harness share one pipeline. Mutations run in fresh browser pages against the
// same freshly built targets; every changed screenshot is captured from Chrome.
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { launchChrome, openPage } from '../baseline/cdp.mjs';
import { artifactsDirectory, captureEnvironment, repositoryRoot } from '../baseline/reference.mjs';
import {
  classify,
  compareAccessibility,
  compareDom,
  compareInteraction,
  compareStyles,
  directions,
  loadPolicy,
  summariseApprovals,
  validatePolicy,
} from './compare.mjs';
import { extractCasesExpression, driveInteraction, interactionExpression } from './extract.mjs';
import { buildCurrentTarget, buildRazorTarget, buildReferenceTarget } from './targets.mjs';

export const runDirectory = resolve(artifactsDirectory, 'parity');
export const themes = ['light', 'dark'];
export const viewport = { width: 1000, height: 900 };

export function loadCatalog() {
  return JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/input/cases.json'), 'utf8'));
}

export function loadParityPolicy() {
  return loadPolicy(resolve(repositoryRoot, 'contracts/input/parity-policy.json'));
}

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

async function screenshot(page, clip, directory, fileName) {
  const shot = await page.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
    clip: { ...clip, scale: 1 },
  });
  const bytes = Buffer.from(shot.data, 'base64');
  writeFileSync(resolve(directory, fileName), bytes);

  return { fileName, sha256: createHash('sha256').update(bytes).digest('hex') };
}

const settleExpression = `new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))`;

async function applyBrowserMutation(page, mutation, phase, context, evidence) {
  if (!mutation?.[phase]) return;
  const result = await page.evaluate(mutation[phase]);
  if (!result || !Number.isInteger(result.applied) || result.applied < 1) {
    throw new Error(`MUTATION_COULD_NOT_BE_APPLIED: ${mutation.id}/${phase}/${context.caseId ?? 'initial'}`);
  }
  evidence.push({ ...context, phase, ...result });
  await page.evaluate(settleExpression);
}

async function captureTarget(
  chrome,
  origin,
  targetPage,
  label,
  theme,
  screenshotDirectory,
  catalog,
  { selectedCases = catalog.cases, mutation, evidence = [], filePrefix = label } = {},
) {
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

    const navigate = async () => {
      await page.send('Page.navigate', { url: `${origin}/${targetPage}?theme=${theme}` });
      await page.waitFor(`document.documentElement.getAttribute('data-parity-ready') === 'true'`);
      await page.waitFor(`document.querySelectorAll('[data-parity-case]').length === ${catalog.cases.length}`);
      await page.waitFor(`document.fonts.status === 'loaded'`);
      await page.evaluate(settleExpression);
    };
    await navigate();
    await applyBrowserMutation(page, mutation, 'beforeExtract', { target: label, theme }, evidence);
    const allExtracted = await page.evaluate(extractCasesExpression);
    const extracted = Object.fromEntries(selectedCases.map(({ id }) => [id, allExtracted[id]]));
    const accessibility = {};
    const screenshots = {};

    for (const parityCase of selectedCases) {
      accessibility[parityCase.id] = await readAccessibility(page, parityCase.id);
      if (!parityCase.visual) continue;
      screenshots[parityCase.id] = await screenshot(
        page,
        extracted[parityCase.id].clip,
        screenshotDirectory,
        `${filePrefix}-${theme}-${parityCase.id.replace(/\//g, '_')}.png`,
      );
    }

    // Each scenario owns a fresh page state. Natural focus and selection are
    // recorded before any explicit cross-framework visual normalization.
    const interactions = {};
    const interactionScreenshots = {};
    const naturalInteractionScreenshots = {};
    for (const parityCase of selectedCases) {
      if (!parityCase.interaction) continue;
      await navigate();
      const context = { target: label, theme, caseId: parityCase.id };
      await applyBrowserMutation(page, mutation, 'beforeInteraction', context, evidence);
      const inputEvents = await driveInteraction(page, parityCase.id, parityCase.interaction.steps);
      await applyBrowserMutation(page, mutation, 'afterInteraction', context, evidence);
      const result = await page.evaluate(interactionExpression(parityCase.id));
      interactions[parityCase.id] = { ...result, inputEvents };
      const naturalShot = await screenshot(
        page,
        result.clip,
        screenshotDirectory,
        `${filePrefix}-${theme}-post-${parityCase.id.replace(/\//g, '_')}.png`,
      );
      naturalInteractionScreenshots[parityCase.id] = naturalShot;
      interactionScreenshots[parityCase.id] = naturalShot;

      // Only this historical wrapper transition changes focus ownership. Its
      // natural frame remains strict reference/current; an additional frame
      // after blur compares every pixel across all three targets. This never
      // masks arbitrary pixels or approves a whole screenshot difference.
      if (parityCase.interaction.visualFocus === 'blur-after-recording') {
        if (parityCase.id !== 'input/interaction-wrapper-transition') {
          throw new Error(`Unsupported focus normalization: ${parityCase.id}`);
        }
        await page.evaluate(`document.activeElement?.blur()`);
        await page.evaluate(settleExpression);
        const blurred = await page.evaluate(interactionExpression(parityCase.id));
        interactionScreenshots[parityCase.id] = await screenshot(
          page,
          blurred.clip,
          screenshotDirectory,
          `${filePrefix}-${theme}-post-blurred-${parityCase.id.replace(/\//g, '_')}.png`,
        );
      } else if (parityCase.interaction.visualFocus !== undefined) {
        throw new Error(`Unknown visualFocus: ${parityCase.interaction.visualFocus}`);
      }
    }

    return {
      extracted,
      accessibility,
      screenshots,
      interactions,
      interactionScreenshots,
      naturalInteractionScreenshots,
      diagnostics: page.diagnostics,
    };
  } finally {
    await page.close();
  }
}

function mergeCapture(target, recaptured) {
  for (const key of [
    'extracted',
    'accessibility',
    'screenshots',
    'interactions',
    'interactionScreenshots',
    'naturalInteractionScreenshots',
  ])
    Object.assign(target[key], recaptured[key]);
  for (const key of Object.keys(target.diagnostics)) {
    target.diagnostics[key].push(...recaptured.diagnostics[key]);
  }
}

/** Builds all targets once, then captures clean and fresh browser-mutated pages. */
export async function captureAll(catalog, { log = () => {}, browserMutations = [] } = {}) {
  mkdirSync(runDirectory, { recursive: true });
  const screenshotDirectory = resolve(runDirectory, 'screenshots');
  mkdirSync(screenshotDirectory, { recursive: true });

  log('Building the three render targets\n');
  const targets = {
    reference: buildReferenceTarget(resolve(runDirectory, 'reference'), resolve(runDirectory, 'reference-checkout')),
    current: buildCurrentTarget(resolve(runDirectory, 'current')),
    razor: buildRazorTarget(resolve(runDirectory, 'razor')),
  };
  const chrome = await launchChrome();
  const captures = {};
  const servers = {};
  const mutationCaptures = [];

  try {
    for (const [label, target] of Object.entries(targets)) {
      servers[label] = await serve(target.directory);
      captures[label] = {};
      for (const theme of themes) {
        log(`  capturing ${label} (${theme})\n`);
        captures[label][theme] = await captureTarget(
          chrome,
          servers[label].origin,
          target.page,
          label,
          theme,
          screenshotDirectory,
          catalog,
        );
      }
    }

    for (const mutation of browserMutations) {
      if (!['current', 'razor'].includes(mutation.target)) {
        throw new Error(`Invalid browser mutation target: ${mutation.target}`);
      }
      const selectedCases = catalog.cases.filter(({ id }) => mutation.caseIds.includes(id));
      if (selectedCases.length !== mutation.caseIds.length || selectedCases.length === 0) {
        throw new Error(`MUTATION_COULD_NOT_BE_APPLIED: unknown or duplicate cases for ${mutation.id}`);
      }
      const mutated = structuredClone(captures);
      const evidence = [];
      log(`  browser mutation ${mutation.id} (${mutation.target})\n`);
      for (const theme of themes) {
        const target = targets[mutation.target];
        const recaptured = await captureTarget(
          chrome,
          servers[mutation.target].origin,
          target.page,
          mutation.target,
          theme,
          screenshotDirectory,
          catalog,
          { selectedCases, mutation, evidence, filePrefix: `${mutation.id}-${mutation.target}` },
        );
        mergeCapture(mutated[mutation.target][theme], recaptured);
      }
      if (evidence.length === 0) {
        throw new Error(`MUTATION_COULD_NOT_BE_APPLIED: no browser changes for ${mutation.id}`);
      }
      const isolation = {};
      // Re-capture the unmutated targets from their own origins in fresh pages;
      // report their observations, not merely hashes copied from clean data.
      if (mutation.verifyIsolation) {
        for (const [label, target] of Object.entries(targets)) {
          if (label === mutation.target) continue;
          isolation[label] = {};
          for (const theme of themes) {
            isolation[label][theme] = await captureTarget(
              chrome,
              servers[label].origin,
              target.page,
              label,
              theme,
              screenshotDirectory,
              catalog,
              { selectedCases, filePrefix: `${mutation.id}-isolation-${label}` },
            );
          }
        }
      }
      mutationCaptures.push({
        id: mutation.id,
        captures: mutated,
        applied: evidence.reduce((total, entry) => total + entry.applied, 0),
        evidence,
        isolation,
      });
    }
  } finally {
    await chrome.close();
    for (const server of Object.values(servers)) await server.close();
  }

  return { targets, captures, mutationCaptures, browser: chrome.browser, screenshotDirectory };
}

/**
 * Compares one set of captures against the policy.
 *
 * Pure: it reads captures and policy and returns findings, so the mutation
 * harness can call it repeatedly on perturbed copies of the same capture.
 */
export function compareCaptures(captures, catalog, policy) {
  const failures = [];
  const approved = [];
  let comparisons = 0;
  let visualComparisons = 0;
  let postInteractionComparisons = 0;
  let naturalPostInteractionComparisons = 0;
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

          if (parityCase.interaction.visualFocus === 'blur-after-recording' && direction.to === 'current') {
            naturalPostInteractionComparisons += 1;
            const naturalLeft = left.naturalInteractionScreenshots[id];
            const naturalRight = right.naturalInteractionScreenshots[id];
            if (naturalLeft.sha256 !== naturalRight.sha256) {
              visualDifferences += 1;
              raw.push({
                dimension: 'visual.postInteraction',
                path: `theme=${theme}/natural-focus`,
                detail: 'natural post-interaction screenshot',
                left: `${naturalLeft.fileName} ${naturalLeft.sha256.slice(0, 12)}`,
                right: `${naturalRight.fileName} ${naturalRight.sha256.slice(0, 12)}`,
              });
            }
          }
          postInteractionComparisons += 1;
          const leftShot = left.interactionScreenshots[id];
          const rightShot = right.interactionScreenshots[id];
          if (leftShot.sha256 !== rightShot.sha256) {
            visualDifferences += 1;
            raw.push({
              dimension: 'visual.postInteraction',
              path: `theme=${theme}`,
              detail: 'post-interaction screenshot',
              left: `${leftShot.fileName} ${leftShot.sha256.slice(0, 12)}`,
              right: `${rightShot.fileName} ${rightShot.sha256.slice(0, 12)}`,
            });
          }
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

  const { rows, problems } = summariseApprovals(policy, approved);

  return {
    failures,
    approved,
    approvalUsage: rows,
    approvalProblems: problems,
    summary: {
      caseComparisons: comparisons,
      visualComparisons,
      postInteractionVisualComparisons: postInteractionComparisons,
      naturalPostInteractionVisualComparisons: naturalPostInteractionComparisons,
      visualDifferences,
      failures: failures.length,
      approvedDivergences: approved.length,
      failuresByDimension: failures.reduce((counts, failure) => {
        counts[failure.dimension] = (counts[failure.dimension] ?? 0) + 1;
        return counts;
      }, {}),
    },
  };
}

export function collectPageErrors(captures) {
  return Object.entries(captures).flatMap(([label, byTheme]) =>
    Object.entries(byTheme).flatMap(([theme, capture]) =>
      capture.diagnostics.pageErrors.map((error) => `${label}/${theme}: ${error}`),
    ),
  );
}

/** Fails before any browser work if the registry itself is malformed. */
export function assertPolicyIsWellFormed(policy, catalog) {
  const problems = validatePolicy(
    policy,
    catalog.cases.map((parityCase) => parityCase.id),
  );

  if (problems.length > 0) {
    throw new Error(`The divergence policy is invalid:\n  - ${problems.join('\n  - ')}`);
  }
}
