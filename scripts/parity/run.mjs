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
  controlOwnershipViolations,
  extractCasesExpression,
  driveInteraction,
  interactionExpression,
  staticOwnershipViolations,
  transitionCapabilityViolation,
  transitionExpression,
  transitionViolations,
  skeletonGateIdentityExpression,
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
      // `live` and `atomic` joined the list in M19: VfAlert is the first
      // migrated component whose root is a live region, and the politeness
      // and atomicity the browser derives from its role - or from a consumer
      // aria-live - are the announcement contract. Before M19 nothing recorded
      // them, so an adapter exposing a polite alert where the reference
      // exposes an assertive one compared equal.
      // `valuenow`, `valuemin` and `valuemax` joined in M20: VfProgressSpinner
      // is the first migrated component whose root is a progressbar, and the
      // value the browser derives - none, for the reference, which writes no
      // aria-value* at all - is the contract. Without them a spinner that
      // started exposing 0..100 compared equal to one exposing nothing.
      if (
        [
          'disabled',
          'readonly',
          'required',
          'invalid',
          'pressed',
          'focusable',
          'live',
          'atomic',
          'valuenow',
          'valuemin',
          'valuemax',
          // `expanded` joined in M22: VfAccordion is the first migrated
          // component whose control announces an expanded state, and the
          // value Chrome derives from aria-expanded - before and after a
          // gesture - is the announcement contract. Without it a trigger
          // whose panel opened while aria-expanded stayed false compared
          // equal in the tree.
          'expanded',
          // `selected` joined in M24: VfTabs is the first migrated component
          // whose controls announce a selected state, and Chrome 153 derives
          // it from aria-selected on role=tab (reproduced before it was
          // added: the tree recorded null for a claimed selected tab). It is
          // what makes the tree an independent proof of the selection beside
          // dom.aria - unlike aria-current (M23), which Chrome does not expose.
          'selected',
        ].includes(property.name)
      ) {
        states[property.name] = String(property.value?.value ?? '');
      }
    }

    // The current value of a range widget is not a property: CDP carries it
    // in the node's `value` field. Recorded as a state only when it is a
    // number, which is what a progressbar, a slider or a spinbutton exposes -
    // a textbox's string value is content, not state, and is compared as
    // dom.liveValue. Without this, a spinner given aria-valuenow="0" on one
    // target compared equal to one exposing no value at all, because Chrome
    // reports valuemin=0 and valuemax=100 for every progressbar by default.
    if (node.value?.type === 'number') {
      states.valuenow = String(node.value.value);
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
    // Live parity records, filled only for a profile that declares liveParity.
    const interactionDom = {};
    const interactionAccessibility = {};
    // A component with no interaction still has to produce interaction
    // evidence. Recording the posture per case is what makes "nothing to drive"
    // a measurement instead of a stage that quietly did not run; see
    // staticInteractionExpression in extract.mjs. Keyed on the profile's own
    // declaration rather than on the snapshot name: VfSkeletonGate owns no
    // interaction *and* has a state that can be driven, so `staticOwnership`
    // says the component must prove it grew no controls of its own, and
    // `snapshot` says what shape its evidence takes.
    // Two ownership models, one stage. A static profile proves it owns no
    // control; a profile with `controlOwnership` (M22) proves it owns exactly
    // the controls it declares, by identity. Either way every case is
    // measured, the measurement is asserted against the declaration on this
    // target before any comparison, and a missing or contradictory snapshot
    // fails here - where there is still a target to name - rather than
    // comparing equal to itself across three targets. An interaction case's
    // record is replaced by its post-scenario measurement in the loop below.
    //
    // Only on an unmutated capture, for the reason the interaction
    // expectations below are: a browser mutation deliberately grows or removes
    // a control on purpose, and catching that is the comparator's job.
    // Throwing here would abort the mutation harness before it could report
    // the defect it was constructed to find. Nothing is weakened by this: the
    // unmutated run - the one that decides whether the gate passes - still
    // fails closed here, and a mutated run still moves the ownership dimension
    // in the comparison, which is what the mutation declares it expects.
    const ownsControls = Boolean(catalog.profile.controlOwnership);
    const isStatic = catalog.profile.staticOwnership || catalog.profile.snapshot === 'static';
    const assertOwnership = (parityCase, snapshot, when = '', options = {}) => {
      if (mutation) return;
      const violations = ownsControls
        ? controlOwnershipViolations(parityCase, snapshot, catalog.profile, options)
        : staticOwnershipViolations(parityCase, snapshot);
      if (violations.length > 0) {
        throw new Error(
          `${ownsControls ? 'Control' : 'Static'} ownership failed ${when}on ${label} (${theme}): ${violations.join('; ')}.`,
        );
      }
    };
    if (isStatic || ownsControls) {
      for (const parityCase of selectedCases) {
        if (isStatic && parityCase.interaction) {
          throw new Error(
            `Case ${parityCase.id} declares an interaction, but the ${catalog.profile.id} profile is static.`,
          );
        }
        const snapshot = await page.evaluate(
          interactionExpression(parityCase.id, catalog.profile.snapshot, catalog.profile.controlOwnership),
        );
        assertOwnership(parityCase, snapshot);
        interactions[parityCase.id] = snapshot;
      }
    }

    // The transition stage. A case that declares one is driven through the
    // component's own public API - the fixture holds `ready` in reactive state
    // and exposes a setter - and then re-extracted, so what is recorded is a
    // component that changed rather than a page that was re-rendered.
    //
    // Each transition gets a fresh page, for the reason every interaction
    // scenario does: a transition driven on a page another transition has
    // already touched is measuring two things at once.
    const transitions = {};
    const transitionScreenshots = {};

    for (const parityCase of selectedCases) {
      if (!parityCase.transition) continue;
      await navigate();
      const context = { target: label, theme, caseId: parityCase.id };
      await applyBrowserMutation(page, mutation, 'beforeTransition', context, evidence);
      // Marked before the state changes, read after it. See
      // skeletonGateIdentityExpression: the mark is an expando, so it reaches
      // no other dimension. The expression is component-specific - it names the
      // gate's own elements - and is selected here the way the snapshot
      // expression beside it is.
      const identityBefore = await page.evaluate(skeletonGateIdentityExpression(parityCase.id, 'mark'));
      const driven = await page.evaluate(transitionExpression(parityCase.id, parityCase.transition.to));
      await page.evaluate(settleExpression);
      await applyBrowserMutation(page, mutation, 'afterTransition', context, evidence);

      // The declared capability, asserted in both directions. The check itself
      // lives in extract.mjs so it can be tested against the function the
      // runner calls - M17 had it inline here, where nothing could reach it,
      // and transition-evidence.test.mjs is what M17.1 added to make both
      // directions assertable.
      const capabilityProblem = transitionCapabilityViolation(catalog.profile, label, driven.supported, parityCase.id);
      if (capabilityProblem) {
        throw new Error(`${capabilityProblem} (${theme})`);
      }

      if (driven.supported !== true) {
        // Recorded rather than skipped. The record is what the comparison reads
        // to see that this target was asked and answered, instead of a missing
        // key that would compare equal to another missing key.
        transitions[parityCase.id] = { supported: false, declared: false };
        continue;
      }

      const state = await page.evaluate(interactionExpression(parityCase.id, catalog.profile.snapshot));
      const identity = await page.evaluate(skeletonGateIdentityExpression(parityCase.id, 'read'));
      const after = await page.evaluate(extractCasesExpression(catalog.profile.measuredRoles));

      transitions[parityCase.id] = {
        supported: true,
        declared: true,
        applied: driven.applied,
        state,
        identityBefore,
        identity,
        // The DOM the case ended up with, kept so the convergence check can
        // compare it against a fresh render of the state it was driven to.
        dom: after.cases[parityCase.id].dom,
        convergesWith: after.cases[parityCase.transition.matches]?.dom ?? null,
      };

      if (parityCase.visual) {
        transitionScreenshots[parityCase.id] = await screenshot(
          page,
          after.cases[parityCase.id].clip,
          screenshotDirectory,
          `${filePrefix}-${theme}-transitioned-${parityCase.id.replace(/\//g, '_')}.png`,
        );
      }

      // Fail closed on a transition that ran and did not do what it said, on
      // the target that did it. Only on an unmutated capture: a mutation
      // deliberately breaks a transition, and catching that is the
      // comparator's job - throwing here would abort the mutation harness
      // before it could report the defect it was built to find.
      if (!mutation) {
        const violations = transitionViolations(
          parityCase,
          transitions[parityCase.id],
          transitions[parityCase.id].dom,
          transitions[parityCase.id].convergesWith,
        );
        if (violations.length > 0) {
          throw new Error(`Transition failed on ${label} (${theme}): ${violations.join('; ')}.`);
        }
      }
    }

    for (const parityCase of selectedCases) {
      if (!parityCase.interaction) continue;
      await navigate();
      // A live-parity scenario is driven with its case alone in the document.
      // Found by M23: the reference stepper moves keyboard focus through a
      // document-wide lookup by value, so on a page of sixty-five cases
      // sharing the same values a key pressed in one case focused a trigger
      // in an earlier one - an artifact of the catalog page, not of the
      // component, and one that would have made every focus claim depend on
      // document order. Every other case is removed before the gesture; the
      // initial stage has already measured them all on the full page, and
      // convergence still compares against that extraction. Gated on
      // liveParity: the earlier interaction profiles carry their contract
      // inside their snapshots and their accepted mutation fixtures act on
      // every scenario case of the page at once, and a stage they did not
      // opt into must not move them.
      if (catalog.profile.liveParity) {
        await page.evaluate(
          `document.querySelectorAll('[data-parity-case]:not([data-parity-case="${parityCase.id}"])').forEach((node) => node.remove())`,
        );
      }
      const context = { target: label, theme, caseId: parityCase.id };
      await applyBrowserMutation(page, mutation, 'beforeInteraction', context, evidence);
      const inputEvents = await driveInteraction(
        page,
        parityCase.id,
        parityCase.interaction.steps,
        catalog.profile.activationSelector,
      );
      await applyBrowserMutation(page, mutation, 'afterInteraction', context, evidence);
      const result = await page.evaluate(
        interactionExpression(parityCase.id, catalog.profile.snapshot, catalog.profile.controlOwnership),
      );
      interactions[parityCase.id] = { ...result, inputEvents };

      // Live parity, added in M22 for the first component whose gesture
      // changes its DOM. The snapshot above is the component-shaped record;
      // this is everything the initial stage measured, measured again: the
      // ownership assertion against the scenario's own budget, the DOM
      // description, the accessibility tree. Convergence - the gesture's DOM
      // has to equal this target's initial extraction of the case the scenario
      // names, or the toggle landed on a hybrid - is judged in compareCaptures,
      // where it is a within-target invariant reported per direction and never
      // approvable.
      // Gated on the profile because the earlier interaction profiles carry
      // their live contract inside their snapshots and their approvals are
      // counted exactly; a stage they did not opt into must not move them.
      if (catalog.profile.liveParity) {
        if (ownsControls) {
          assertOwnership(parityCase, result, `after ${parityCase.id} `, {
            consumerInteractive: parityCase.interaction.consumerInteractive,
          });
        }
        const after = await page.evaluate(extractCasesExpression(catalog.profile.measuredRoles));
        interactionDom[parityCase.id] = after.cases[parityCase.id].dom;
        interactionAccessibility[parityCase.id] = await readAccessibility(
          page,
          parityCase.id,
          catalog.profile.accessibilityRoles,
        );
      }

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
        // Three kinds of claim, one comparison. `activates` is a claim about
        // the click counter; `a11y:<role>.<state>` (M22.1) is a claim about the
        // accessibility tree read after the gesture - a live stage that copied
        // the initial tree instead of re-reading it would agree with itself on
        // every target, and only a per-target claim can notice; everything
        // else is a claim about a snapshot field of the same name. A claim
        // about something no record measured is an error, not a miss.
        const a11yClaim = key.startsWith('a11y:') ? key.slice('a11y:'.length).split('.') : null;
        const a11yNode = a11yClaim ? interactionAccessibility[parityCase.id]?.[a11yClaim[0]] : undefined;
        const measured = a11yClaim ? a11yNode !== undefined : key === 'activates' || key in result;
        if (!measured) {
          throw new Error(
            `${parityCase.id} on ${label} (${theme}): the catalog expects [${key}], which ` +
              (a11yClaim
                ? 'no live accessibility record exposes'
                : "this component's interaction snapshot does not record") +
              '. A claim about something that was not measured is not evidence.',
          );
        }
        const got = a11yClaim
          ? (a11yNode.states[a11yClaim[1]] ?? null)
          : key === 'activates'
            ? (result.activations ?? 0) > 0
            : result[key];

        const matches =
          want !== null && typeof want === 'object' ? JSON.stringify(got) === JSON.stringify(want) : got === want;
        if (!matches) {
          throw new Error(
            `${parityCase.id} on ${label} (${theme}): the catalog expects ${key}=${JSON.stringify(want)}, ` +
              `but the ${a11yClaim ? 'tree' : 'component'} recorded ${JSON.stringify(got)}.`,
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
      transitions,
      transitionScreenshots,
      interactionDom,
      interactionAccessibility,
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
    'transitions',
    'transitionScreenshots',
    'interactionDom',
    'interactionAccessibility',
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
  let transitionComparisons = 0;
  let transitionsCarriedByConvergence = 0;
  let liveComparisons = 0;
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
        // The ownership snapshot, compared for every case the capture measured
        // it on: every case of a static profile, and every case without a
        // scenario of a profile that owns controls - a scenario case's snapshot
        // is its post-scenario one and is compared below. Not gated on
        // `parityCase.interaction` for the static profile, whose cases have
        // none by definition; a missing snapshot on either side is a failure,
        // never a skip, because absence on both sides compares equal.
        const ownershipMeasured =
          catalog.profile.staticOwnership ||
          catalog.profile.snapshot === 'static' ||
          (catalog.profile.controlOwnership && !parityCase.interaction);
        if (ownershipMeasured) {
          const leftOwnership = left.interactions[id];
          const rightOwnership = right.interactions[id];

          if (!leftOwnership || !rightOwnership) {
            throw new Error(
              `The ${catalog.profile.id} profile measures ownership but case ${id} produced no ownership snapshot on ` +
                `${!leftOwnership ? direction.from : direction.to}. A missing measurement is a failure, not a skip.`,
            );
          }

          raw.push(...compareInteraction(leftOwnership, rightOwnership));
        }

        // The transition comparison. Three things, in order of what they can
        // tell apart:
        //
        //   - whether both targets could transition at all. A target that lost
        //     its mechanism reports supported:false and differs here, rather
        //     than producing no evidence and comparing equal to itself;
        //   - the state each landed in, field by field, which is what a stale
        //     overlay or a half-updated attribute set moves;
        //   - convergence, which is a *within-target* invariant and therefore
        //     the one that survives a target with no transition of its own:
        //     each target's transitioned DOM must equal its own render of the
        //     case the catalog names. Compared per direction so a failure is
        //     attributed to a target rather than to the pair.
        if (parityCase.transition) {
          const leftTransition = left.transitions[id];
          const rightTransition = right.transitions[id];

          if (!leftTransition || !rightTransition) {
            throw new Error(
              `Case ${id} declares a transition but produced no transition evidence on ` +
                `${!leftTransition ? direction.from : direction.to}. A missing measurement is a failure, not a skip.`,
            );
          }

          // A target's capability having to match what the profile declared is
          // asserted at capture time, where the target can be named. Here the
          // only question left is whether the two sides of *this* direction can
          // both be driven. When they cannot, the transition contract for this
          // direction is carried by the case the catalog names as the state to
          // land on - which this same loop compares three ways, on every
          // dimension, a few lines above.
          if (leftTransition.supported !== rightTransition.supported) {
            transitionsCarriedByConvergence += 1;
          } else if (leftTransition.supported) {
            transitionComparisons += 1;
            raw.push(...compareInteraction(leftTransition.state, rightTransition.state));

            for (const [side, capture, target] of [
              ['left', leftTransition, direction.from],
              ['right', rightTransition, direction.to],
            ]) {
              // Node identity is a within-target invariant like convergence:
              // each target must keep the elements it had, and a target that
              // recreated them is named rather than the pair being reported.
              const recreated = Object.entries(capture.identity ?? {})
                .filter(([name, value]) => value === 'recreated' && capture.identityBefore?.[name] === 'marked')
                .map(([name]) => name);

              if (recreated.length > 0) {
                raw.push({
                  dimension: 'transition.identity',
                  path: `${target}/${recreated.join(',')}`,
                  detail:
                    `${target} destroyed and recreated [${recreated.join(', ')}] across the transition. ` +
                    'Both halves are permanent elements; recreating one discards whatever DOM state it held.',
                  left: side === 'left' ? 'recreated' : 'same-node',
                  right: side === 'right' ? 'recreated' : 'same-node',
                });
              }
            }

            for (const [side, capture, target] of [
              ['left', leftTransition, direction.from],
              ['right', rightTransition, direction.to],
            ]) {
              if (JSON.stringify(capture.dom) !== JSON.stringify(capture.convergesWith)) {
                raw.push({
                  dimension: 'transition.convergence',
                  path: `${target}/${parityCase.transition.matches}`,
                  detail:
                    `the transitioned case does not equal ${target}'s own render of ` +
                    `${parityCase.transition.matches}; a transition has to land on that state, not on a hybrid`,
                  left: side === 'left' ? 'diverged' : 'converged',
                  right: side === 'right' ? 'diverged' : 'converged',
                });
              }
            }

            if (parityCase.visual) {
              const leftShot = left.transitionScreenshots[id];
              const rightShot = right.transitionScreenshots[id];
              if (leftShot && rightShot && leftShot.sha256 !== rightShot.sha256) {
                visualDifferences += 1;
                raw.push({
                  dimension: 'visual.postInteraction',
                  path: `theme=${theme}/transitioned`,
                  detail: 'post-transition screenshot',
                  left: `${leftShot.fileName} ${leftShot.sha256.slice(0, 12)}`,
                  right: `${rightShot.fileName} ${rightShot.sha256.slice(0, 12)}`,
                });
              }
            }
          }
        }

        if (parityCase.interaction) {
          raw.push(...compareInteraction(left.interactions[id], right.interactions[id]));

          // Live parity: the post-scenario DOM and accessibility tree compared
          // exactly as the initial ones are, on their own dimensions with the
          // path prefixed so a report tells the two apart, and convergence as
          // a within-target invariant attributed to the target that broke it.
          if (catalog.profile.liveParity) {
            for (const [side, capture, target] of [
              ['left', left, direction.from],
              ['right', right, direction.to],
            ]) {
              if (!capture.interactionDom?.[id] || !capture.interactionAccessibility?.[id]) {
                throw new Error(
                  `Case ${id} declares a live interaction but ${target} produced no post-interaction ` +
                    `${!capture.interactionDom?.[id] ? 'DOM' : 'accessibility'} record. A missing measurement is a ` +
                    'failure, not a skip.',
                );
              }
              // The state to converge on is the target's own initial extraction
              // of the case the catalog names - captured on the same page, by
              // the same expression, before any gesture. M22.1 removed the
              // separate post-gesture baseline that M22 recorded beside the
              // result: a harness that filled it from the result itself would
              // have made convergence vacuous, and nothing could have noticed.
              const expectedDom = capture.extracted[parityCase.interaction.matches]?.dom;
              if (parityCase.interaction.matches !== undefined && expectedDom === undefined) {
                throw new Error(
                  `Case ${id} converges on ${parityCase.interaction.matches}, which ${target} did not extract.`,
                );
              }
              if (
                expectedDom !== undefined &&
                JSON.stringify(capture.interactionDom[id]) !== JSON.stringify(expectedDom)
              ) {
                raw.push({
                  dimension: 'interaction.convergence',
                  path: `${target}/${parityCase.interaction.matches}`,
                  detail:
                    `the post-interaction DOM does not equal ${target}'s own render of ` +
                    `${parityCase.interaction.matches}; a gesture has to land on that state, not on a hybrid`,
                  left: side === 'left' ? 'diverged' : 'converged',
                  right: side === 'right' ? 'diverged' : 'converged',
                });
              }
            }
            raw.push(
              ...compareDom(left.interactionDom[id], right.interactionDom[id]).map((entry) => ({
                ...entry,
                path: `post-interaction/${entry.path}`,
              })),
              ...compareAccessibility(left.interactionAccessibility[id], right.interactionAccessibility[id]).map(
                (entry) => ({ ...entry, path: `post-interaction/${entry.path}` }),
              ),
            );
            liveComparisons += 1;
          }

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
      transitionComparisons,
      transitionsCarriedByConvergence,
      liveComparisons,
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
