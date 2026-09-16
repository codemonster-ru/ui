#!/usr/bin/env node
// Gate: the three-way parity harness must actually detect a broken adapter.
//
// The three real targets are captured once. The clean comparison has to pass
// first - a harness that cannot agree with itself proves nothing - and then
// every mutation is applied to a copy of that capture and has to be caught by
// the dimension it was written for. Being caught by "something failed" is not
// enough: a defect reported under the wrong dimension is a defect nobody can
// route to an owner.
//
// Nothing is written to the source tree, so an interrupted run cannot leave a
// deliberate defect behind. A mutation that cannot find what it is supposed to
// break fails the gate instead of counting as a detection.
import { relative, resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { repositoryRoot, stableStringify } from '../baseline/reference.mjs';
import { validatePolicy } from './compare.mjs';
import { profileFromArgv } from './profiles.mjs';
import {
  assertPolicyIsWellFormed,
  captureAll,
  collectPageErrors,
  compareCaptures,
  loadCatalog,
  loadParityPolicy,
  runDirectoryFor,
} from './run.mjs';
import {
  badgeBrowserMutations,
  badgeParityMutations,
  badgePolicyMutations,
  dividerBrowserMutations,
  dividerParityMutations,
  dividerPolicyMutations,
  tagBrowserMutations,
  tagParityMutations,
  tagPolicyMutations,
} from './presentation-mutations.mjs';
import {
  avatarBrowserMutations,
  avatarParityMutations,
  avatarPolicyMutations,
  cardBrowserMutations,
  cardParityMutations,
  cardPolicyMutations,
  skeletonBrowserMutations,
  skeletonParityMutations,
  skeletonPolicyMutations,
} from './m16-mutations.mjs';
import { panelBrowserMutations, panelParityMutations, panelPolicyMutations } from './panel-mutations.mjs';
import { alertBrowserMutations, alertParityMutations, alertPolicyMutations } from './alert-mutations.mjs';
import {
  progressSpinnerBrowserMutations,
  progressSpinnerParityMutations,
  progressSpinnerPolicyMutations,
} from './progress-spinner-mutations.mjs';
import {
  progressBarBrowserMutations,
  progressBarParityMutations,
  progressBarPolicyMutations,
} from './progress-bar-mutations.mjs';
import {
  accordionBrowserMutations,
  accordionParityMutations,
  accordionPolicyMutations,
} from './accordion-mutations.mjs';
import { stepperBrowserMutations, stepperParityMutations, stepperPolicyMutations } from './stepper-mutations.mjs';
import { tabsBrowserMutations, tabsParityMutations, tabsPolicyMutations } from './tabs-mutations.mjs';
import { linkBrowserMutations, linkParityMutations, linkPolicyMutations } from './link-mutations.mjs';
import {
  skeletonGateBrowserMutations,
  skeletonGateParityMutations,
  skeletonGatePolicyMutations,
} from './skeleton-gate-mutations.mjs';
import { browserMutations } from './browser-mutations.mjs';
import { assessMutation, MutationNotApplied, parityMutations, policyMutations } from './mutations.mjs';
import {
  iconButtonBrowserMutations,
  iconButtonParityMutations,
  iconButtonPolicyMutations,
} from './icon-button-mutations.mjs';
import { fieldBrowserMutations, fieldParityMutations, fieldPolicyMutations } from './field-mutations.mjs';
import { buttonBrowserMutations, buttonParityMutations, buttonPolicyMutations } from './button-mutations.mjs';
import { textareaBrowserMutations, textareaParityMutations, textareaPolicyMutations } from './textarea-mutations.mjs';
import {
  checkboxBrowserMutations,
  checkboxParityMutations,
  checkboxPolicyMutations,
  radioBrowserMutations,
  radioParityMutations,
  radioPolicyMutations,
  switchBrowserMutations,
  switchParityMutations,
  switchPolicyMutations,
} from './checkable-mutations.mjs';

/**
 * The negative fixture is component-specific even though the harness is not.
 * A mutation says "break this element in this case", which only means anything
 * for the component that renders it.
 */
const mutationSets = {
  input: { capture: parityMutations, policy: policyMutations, browser: browserMutations },
  'icon-button': {
    capture: iconButtonParityMutations,
    policy: iconButtonPolicyMutations,
    browser: iconButtonBrowserMutations,
  },
  field: { capture: fieldParityMutations, policy: fieldPolicyMutations, browser: fieldBrowserMutations },
  button: { capture: buttonParityMutations, policy: buttonPolicyMutations, browser: buttonBrowserMutations },
  textarea: {
    capture: textareaParityMutations,
    policy: textareaPolicyMutations,
    browser: textareaBrowserMutations,
  },
  checkbox: {
    capture: checkboxParityMutations,
    policy: checkboxPolicyMutations,
    browser: checkboxBrowserMutations,
  },
  radio: { capture: radioParityMutations, policy: radioPolicyMutations, browser: radioBrowserMutations },
  switch: { capture: switchParityMutations, policy: switchPolicyMutations, browser: switchBrowserMutations },
  badge: { capture: badgeParityMutations, policy: badgePolicyMutations, browser: badgeBrowserMutations },
  tag: { capture: tagParityMutations, policy: tagPolicyMutations, browser: tagBrowserMutations },
  divider: {
    capture: dividerParityMutations,
    policy: dividerPolicyMutations,
    browser: dividerBrowserMutations,
  },
  skeleton: {
    capture: skeletonParityMutations,
    policy: skeletonPolicyMutations,
    browser: skeletonBrowserMutations,
  },
  avatar: {
    capture: avatarParityMutations,
    policy: avatarPolicyMutations,
    browser: avatarBrowserMutations,
  },
  card: { capture: cardParityMutations, policy: cardPolicyMutations, browser: cardBrowserMutations },
  panel: { capture: panelParityMutations, policy: panelPolicyMutations, browser: panelBrowserMutations },
  alert: { capture: alertParityMutations, policy: alertPolicyMutations, browser: alertBrowserMutations },
  'progress-spinner': {
    capture: progressSpinnerParityMutations,
    policy: progressSpinnerPolicyMutations,
    browser: progressSpinnerBrowserMutations,
  },
  'progress-bar': {
    capture: progressBarParityMutations,
    policy: progressBarPolicyMutations,
    browser: progressBarBrowserMutations,
  },
  accordion: {
    capture: accordionParityMutations,
    policy: accordionPolicyMutations,
    browser: accordionBrowserMutations,
  },
  stepper: { capture: stepperParityMutations, policy: stepperPolicyMutations, browser: stepperBrowserMutations },
  tabs: { capture: tabsParityMutations, policy: tabsPolicyMutations, browser: tabsBrowserMutations },
  link: { capture: linkParityMutations, policy: linkPolicyMutations, browser: linkBrowserMutations },
  'skeleton-gate': {
    capture: skeletonGateParityMutations,
    policy: skeletonGatePolicyMutations,
    browser: skeletonGateBrowserMutations,
  },
};

const profile = profileFromArgv();
const mutations = mutationSets[profile.id];

if (!mutations) {
  throw new Error(
    `No parity mutation set for component [${profile.id}]. A gate with no negative fixture proves nothing.`,
  );
}
const runDirectory = runDirectoryFor(profile);
const catalog = loadCatalog(profile);
const policy = loadParityPolicy(profile);
const caseIds = catalog.cases.map((parityCase) => parityCase.id);

assertPolicyIsWellFormed(policy, catalog);

const results = [];
const failures = [];

function interactionEvidence(captured) {
  return Object.fromEntries(
    Object.entries(captured).map(([target, byTheme]) => [
      target,
      Object.fromEntries(
        Object.entries(byTheme).map(([theme, capture]) => [
          theme,
          Object.fromEntries(
            Object.entries(capture.interactions).map(([caseId, interaction]) => [
              caseId,
              {
                value: interaction.value,
                type: interaction.type,
                selection: interaction.selection,
                focusRole: interaction.focusRole,
                inputEvents: interaction.inputEvents,
                postInteractionScreenshot: capture.interactionScreenshots[caseId],
              },
            ]),
          ),
        ]),
      ),
    ]),
  );
}

function record(id, status, detail) {
  results.push({ id, status, detail });
  const marker = status === 'detected' ? 'detected' : status === 'rejected' ? 'rejected' : 'MISSED  ';
  process.stdout.write(`${marker}  ${id}${detail ? ` — ${detail}` : ''}\n`);
  if (status !== 'detected' && status !== 'rejected') failures.push(`${id}: ${detail}`);
}

// ------------------------------------------------------------------ policy
//
// The registry mutations need no browser, so they run first and fail fast.
process.stdout.write('Divergence registry mutations\n');

for (const mutation of mutations.policy) {
  const mutated = structuredClone(policy);
  try {
    mutation.apply(mutated);
  } catch (error) {
    record(mutation.id, 'not-applied', `could not be applied: ${error.message}`);
    continue;
  }

  const problems = validatePolicy(mutated, caseIds);

  if (mutation.rejectedBy === 'validation') {
    if (problems.length > 0) {
      record(mutation.id, 'rejected', `${mutation.description} → ${problems[0]}`);
    } else {
      record(mutation.id, 'missed', `${mutation.description} → the validator accepted it`);
    }
    continue;
  }

  // Rejected by occurrence accounting instead: it has to survive validation,
  // or the run below would never reach the accounting.
  if (problems.length > 0) {
    record(mutation.id, 'missed', `${mutation.description} → rejected by validation before the run: ${problems[0]}`);
    continue;
  }
  // A valid rule with deliberately wrong usage is evaluated after capture.
  // Pending work is neither a successful detection nor a harness failure.
}

if (failures.length > 0) {
  process.stderr.write(`\n[parity-mutations] FAILED before capture:\n  - ${failures.join('\n  - ')}\n`);
  process.exit(1);
}

// ------------------------------------------------------------------ capture
process.stdout.write('\n');
const { captures, targets, browser, mutationCaptures } = await captureAll(catalog, {
  log: (line) => process.stdout.write(line),
  browserMutations: mutations.browser,
});

const pageErrors = collectPageErrors(captures);
if (pageErrors.length > 0) {
  process.stderr.write(`\n[parity-mutations] page errors during capture:\n  - ${pageErrors.join('\n  - ')}\n`);
  process.exit(1);
}

process.stdout.write('\nBaseline run (no mutation) — the comparison must pass.\n');
const baseline = compareCaptures(captures, catalog, policy);

if (baseline.failures.length > 0 || baseline.approvalProblems.length > 0) {
  process.stderr.write('The unmutated parity comparison does not pass; nothing else is meaningful.\n');
  for (const failure of baseline.failures.slice(0, 20)) {
    process.stderr.write(`  - ${failure.caseId} [${failure.direction}] ${failure.dimension} at ${failure.path}\n`);
  }
  for (const problem of baseline.approvalProblems) process.stderr.write(`  - ${problem}\n`);
  process.exit(1);
}
process.stdout.write(
  `  passed: ${baseline.summary.caseComparisons} case comparisons, ` +
    `${baseline.summary.approvedDivergences} approved divergence(s).\n\n`,
);

// ------------------------------------------- registry mutations, on real data
process.stdout.write('Divergence registry mutations rejected by occurrence accounting\n');
for (const mutation of mutations.policy.filter((entry) => entry.rejectedBy === 'occurrences')) {
  const mutated = structuredClone(policy);
  mutation.apply(mutated);
  const result = compareCaptures(captures, catalog, mutated);

  if (result.approvalProblems.length > 0 || result.failures.length > 0) {
    const reason = result.approvalProblems[0] ?? `${result.failures.length} unapproved difference(s)`;
    record(mutation.id, 'rejected', `${mutation.description} → ${reason}`);
  } else {
    record(mutation.id, 'missed', `${mutation.description} → the run accepted it`);
  }
}

// ---------------------------------------------------------- target mutations
process.stdout.write('\nTarget mutations\n');

for (const mutation of mutations.capture) {
  const mutated = structuredClone(captures);

  try {
    mutation.apply(mutated);
    if (JSON.stringify(mutated) === JSON.stringify(captures)) {
      throw new MutationNotApplied('mutation left the captures unchanged');
    }
  } catch (error) {
    const why = error instanceof MutationNotApplied ? error.message : `${error.name}: ${error.message}`;
    record(mutation.id, 'not-applied', `could not be applied, so it proves nothing: ${why}`);
    continue;
  }

  const result = compareCaptures(mutated, catalog, policy);
  const missing = assessMutation(mutation.expect, result.failures);
  if (missing.length > 0) {
    record(mutation.id, 'missed', `${mutation.description} → missing ${JSON.stringify(missing)}`);
    continue;
  }
  record(
    mutation.id,
    'detected',
    `${mutation.klass}: ${result.failures.length} failure(s), all expected dimensions/cases/directions/themes caught`,
  );
  results.at(-1).summary = result.summary;
  results.at(-1).failures = result.failures;
}

// Real browser mutations prove the extractor and screenshots see the defect.
process.stdout.write('\nBrowser mutations\n');
for (const mutation of mutations.browser) {
  const captured = mutationCaptures.find((entry) => entry.id === mutation.id);
  if (!captured || captured.applied <= 0) {
    record(mutation.id, 'not-applied', 'browser did not confirm a mutation');
    continue;
  }
  const pageErrors = collectPageErrors(captured.captures);
  if (pageErrors.length > 0) {
    record(mutation.id, 'infrastructure-error', pageErrors.join('; '));
    continue;
  }
  const result = compareCaptures(captured.captures, catalog, policy);
  const missing = assessMutation(mutation.expect, result.failures);
  if (missing.length > 0) {
    record(mutation.id, 'missed', `missing ${JSON.stringify(missing)}`);
    continue;
  }
  const isolationEvidence = [];
  if (mutation.verifyIsolation) {
    let isolated = !result.failures.some((entry) => entry.direction === 'reference-vs-razor');
    for (const target of ['reference', 'razor']) {
      for (const theme of ['light', 'dark']) {
        const fresh = captured.isolation?.[target]?.[theme];
        const clean = captures[target][theme];
        for (const caseId of mutation.caseIds) {
          const matches =
            fresh &&
            isDeepStrictEqual(fresh.extracted[caseId], clean.extracted[caseId]) &&
            isDeepStrictEqual(fresh.accessibility[caseId], clean.accessibility[caseId]) &&
            fresh.screenshots[caseId]?.sha256 === clean.screenshots[caseId]?.sha256;
          isolated &&= Boolean(matches);
          isolationEvidence.push({
            target,
            theme,
            caseId,
            unchanged: Boolean(matches),
            sha256: fresh?.screenshots[caseId]?.sha256,
          });
        }
      }
    }
    if (!isolated) {
      record(mutation.id, 'missed', 'fresh reference/Razor observations changed or isolation proof is missing');
      continue;
    }
  }
  record(mutation.id, 'detected', `${mutation.description}: ${result.failures.length} difference(s)`);
  Object.assign(results.at(-1), {
    summary: result.summary,
    failures: result.failures,
    evidence: captured.evidence,
    isolationEvidence,
  });
}

const reportPath = resolve(runDirectory, `${profile.id}-parity-mutations.json`);
writeFileSync(
  reportPath,
  stableStringify({
    $comment: 'Parity mutation results. Generated by scripts/parity/check-input-parity-mutations.mjs.',
    browser,
    provenance: Object.fromEntries(Object.entries(targets).map(([label, target]) => [label, target.provenance])),
    baseline: baseline.summary,
    approvalUsage: baseline.approvalUsage,
    interactionEvidence: interactionEvidence(captures),
    results,
  }),
);

process.stdout.write(`\nReport: ${relative(repositoryRoot, reportPath)}\n`);

if (failures.length > 0) {
  process.stderr.write(`\n[parity-mutations] FAILED: ${failures.length} mutation(s) not caught as intended:\n`);
  for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
  process.exit(1);
}

process.stdout.write(
  `\n[parity-mutations] OK: ${mutations.policy.length} registry mutation(s) rejected, ` +
    `${mutations.capture.length} capture and ${mutations.browser.length} browser mutation(s) caught by the intended dimension.\n`,
);
