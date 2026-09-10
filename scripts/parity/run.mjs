// The three-way parity run: build, capture, compare.
//
// Split out of check-input-parity.mjs in M07.1 so the gate and the mutation
// harness share one pipeline. Mutations run in fresh browser pages against the
// same freshly built targets; every changed screenshot is captured from Chrome.
//
// M10 made it component-blind. The profile rides on the catalog rather than on
// every signature, so the pipeline below reads the same for VfInput and
// VfIconButton and there is exactly one implementation of what a difference
// means.
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
import {
  extractCasesExpression,
  driveInteraction,
  interactionExpression,
  staticOwnershipViolations,
} from './extract.mjs';
import { buildCurrentTarget, buildRazorTarget, buildReferenceTarget } from './targets.mjs';

export const themes = ['light', 'dark'];
export const viewport = { width: 1000, height: 900 };

/** Where a component's captures, screenshots and report are written. */
export function runDirectoryFor(profile) {
  return resolve(artifactsDirectory, profile.artifactDirectory);
}

/**
 * The case catalog, with its profile attached.
 *
 * The profile travels on the catalog rather than through every signature in
 * this file: the catalog is already passed to each stage, and a component that
 * could be captured with another component's roles is not a distinction worth
 * being able to express.
 */
export function loadCatalog(profile) {
  const catalog = JSON.parse(readFileSync(resolve(repositoryRoot, profile.casesPath), 'utf8'));

  if (catalog.component !== profile.component) {
    throw new Error(
      `${profile.casesPath} declares component [${catalog.component}], but the profile is [${profile.component}].`,
    );
  }

  return { ...catalog, profile };
}

export function loadParityPolicy(profile) {
  return loadPolicy(resolve(repositoryRoot, profile.policyPath));
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

/**
 * Accessibility semantics for the roles a case can expose.
 *
 * The roles come from the profile. Hardcoding VfInput's here would have made
 * this silently exhaustive-looking and empty for every other component: no
 * selector would match, no role would be exposed, and the a11y dimensions would
 * compare nothing while still reporting success.
 */
async function readAccessibility(page, caseId, roles) {
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

// Settling means "give the page a chance to paint, then carry on".
//
// A bare double requestAnimationFrame assumes a frame will be produced. That
// held for every VfInput scenario, which all change something visible, and
// broke on the first VfIconButton keyboard case: pressing Enter on a button
// that is already focused changes no pixel, headless Chrome produces no frame,
// and the callback never runs. The evaluate then hangs until the DevTools
// request times out and the whole gate dies with an error that names none of
// this.
//
// The fallback resolves only when no frame arrived, and it is far longer than
// a frame interval, so a page that does paint still settles on rAF exactly as
// before. No frame means nothing changed, which is the settled state anyway.
const settleExpression = `new Promise((done) => {
  let settled = false;
  const finish = () => { if (!settled) { settled = true; done(); } };
  requestAnimationFrame(() => requestAnimationFrame(finish));
  setTimeout(finish, 500);
})`;

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
    const extraction = await page.evaluate(extractCasesExpression(catalog.profile.measuredRoles));
    const allExtracted = extraction.cases;
    const extracted = Object.fromEntries(selectedCases.map(({ id }) => [id, allExtracted[id]]));

    // A collision is wrong on every target at once, so there is nothing for the
    // three-way comparison to disagree about - it has to fail the capture. Two
    // fields sharing a generated id makes one label reach the other's control,
    // which every static check still reports as correct.
    if (extraction.duplicateIds.length > 0) {
      throw new Error(
        `${label} (${theme}) rendered duplicate ids across cases: ` +
          extraction.duplicateIds.map((entry) => `${entry.id} in ${entry.cases.join(' and ')}`).join(', '),
      );
    }
    const accessibility = {};
    const screenshots = {};

    for (const parityCase of selectedCases) {
      accessibility[parityCase.id] = await readAccessibility(page, parityCase.id, catalog.profile.accessibilityRoles);
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
    // A component with no interaction still has to produce interaction
    // evidence. Recording the posture per case is what makes "nothing to drive"
    // a measurement instead of a stage that quietly did not run; see
    // staticInteractionExpression in extract.mjs.
    if (catalog.profile.snapshot === 'static') {
      for (const parityCase of selectedCases) {
        if (parityCase.interaction) {
          throw new Error(
            `Case ${parityCase.id} declares an interaction, but the ${catalog.profile.id} profile is static.`,
          );
        }
        const snapshot = await page.evaluate(interactionExpression(parityCase.id, 'static'));
        // Fail closed on a snapshot that came back without its measurements, and
        // on one whose measurements contradict what the case declared. An empty
        // snapshot on every target compares equal to itself, so the comparator
        // would report a clean pass for a stage that measured nothing - the
        // exact silent skip the static profile exists to make impossible - and
        // a component that grew a control of its own would be measured
        // identically wrong on every target, which a three-way comparison
        // cannot see either. Both have to be caught here, where there is still
        // a target to name.
        const violations = staticOwnershipViolations(parityCase, snapshot);
        if (violations.length > 0) {
          throw new Error(`Static ownership failed on ${label} (${theme}): ${violations.join('; ')}.`);
        }

        interactions[parityCase.id] = snapshot;
      }
    }

    for (const parityCase of selectedCases) {
      if (!parityCase.interaction) continue;
      await navigate();
      const context = { target: label, theme, caseId: parityCase.id };
      await applyBrowserMutation(page, mutation, 'beforeInteraction', context, evidence);
      const inputEvents = await driveInteraction(
        page,
        parityCase.id,
        parityCase.interaction.steps,
        catalog.profile.activationSelector,
      );
      await applyBrowserMutation(page, mutation, 'afterInteraction', context, evidence);
      const result = await page.evaluate(interactionExpression(parityCase.id, catalog.profile.snapshot));
      interactions[parityCase.id] = { ...result, inputEvents };

      // Declared interaction outcomes are checked against what the target
      // actually did, on every target, in both themes.
      //
      // Without this, `expect` would be the catalog describing itself: the
      // coverage guards read it to tell "Enter activates an enabled button" or
      // "clicking the label focuses the control" apart from a case that merely
      // performs the gesture, and nothing would stop a case from claiming an
      // outcome it never causes. Here each claim is measured against the
      // snapshot the scenario produced from real pointer and key events.
      //
      // Only on an unmutated capture. A browser mutation deliberately breaks
      // behaviour - browser-icon-button-not-clickable stops the button
      // activating on purpose - and catching that is the comparator's job, not
      // this assertion's. Throwing here would abort the mutation harness
      // before it could report the defect it was constructed to find.
      const expected = mutation ? undefined : parityCase.interaction.expect;
      for (const [key, want] of Object.entries(expected ?? {})) {
        // `activates` is a claim about a counter; everything else is a claim
        // about a snapshot field of the same name.
        const got = key === 'activates' ? (result.activations ?? 0) > 0 : result[key];

        if (key !== 'activates' && !(key in result)) {
          throw new Error(
            `${parityCase.id} on ${label} (${theme}): the catalog expects [${key}], ` +
              "which this component's interaction snapshot does not record.",
          );
        }

        if (got !== want) {
          throw new Error(
            `${parityCase.id} on ${label} (${theme}): the catalog expects ${key}=${JSON.stringify(want)}, ` +
              `but the component recorded ${JSON.stringify(got)}.`,
          );
        }
      }

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
        const blurred = await page.evaluate(interactionExpression(parityCase.id, catalog.profile.snapshot));
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
  const runDirectory = runDirectoryFor(catalog.profile);
  mkdirSync(runDirectory, { recursive: true });
  const screenshotDirectory = resolve(runDirectory, 'screenshots');
  mkdirSync(screenshotDirectory, { recursive: true });

  log('Building the three render targets\n');
  const targets = {
    reference: buildReferenceTarget(
      resolve(runDirectory, 'reference'),
      resolve(runDirectory, 'reference-checkout'),
      catalog.profile,
    ),
    current: buildCurrentTarget(resolve(runDirectory, 'current'), catalog.profile),
    razor: buildRazorTarget(resolve(runDirectory, 'razor'), catalog.profile),
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

        // The static posture is compared for every case, not only for cases
        // that declared a scenario - a static profile has none by definition,
        // so gating this on `parityCase.interaction` would compare nothing and
        // report a clean pass, which is exactly the silent skip forbidden here.
        if (catalog.profile.snapshot === 'static') {
          const leftStatic = left.interactions[id];
          const rightStatic = right.interactions[id];

          if (!leftStatic || !rightStatic) {
            throw new Error(
              `The ${catalog.profile.id} profile is static but case ${id} produced no interaction snapshot on ` +
                `${!leftStatic ? direction.from : direction.to}. A missing measurement is a failure, not a skip.`,
            );
          }

          raw.push(...compareInteraction(leftStatic, rightStatic));
        }

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
