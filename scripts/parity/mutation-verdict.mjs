// The verdict of one real browser mutation (M35.1).
//
// M35 recorded a failed acquisition on a mutated page as a screenshot hash no
// real screenshot could equal, and the comparator counted it as a visual
// difference: a mutation that expects only pixels was reported detected by an
// acquisition that produced none, including one that failed for reasons that
// had nothing to do with the defect. A failed acquisition is now an outcome of
// its own, judged before any comparator evidence is read:
//
//   infrastructure-error - an acquisition failed for a reason that says
//     nothing about the target (see ACQUISITION_FAILURES). Not evaluable.
//   acquisition-rejected - the target's geometry or behaviour ruled a capture
//     out and the mutation does not declare that rejection, or a rejection
//     left a page nothing more could be measured on. Not evaluable.
//   detected - every expectation the mutation declares is met by genuine
//     comparator differences. A rejection the mutation declares
//     (`acquisitionRejections`, matched on case, stage, failure code and the
//     mutated target) may sit beside it, reported as such; it is never part
//     of the evidence, and a missing screenshot is never a visual difference.
//   missed - evaluable, and the declared evidence is not all there.
//
// Only `detected` passes the gate.
import { isDeepStrictEqual } from 'node:util';

import { ACQUISITION_FAILURES, INFRASTRUCTURE, REJECTION } from './acquisition.mjs';
import { assessMutation } from './mutations.mjs';
import { compareCaptures } from './run.mjs';

export const DETECTED = 'detected';
export const MISSED = 'missed';
export const ACQUISITION_REJECTED = 'acquisition-rejected';
export const INFRASTRUCTURE_ERROR = 'infrastructure-error';

const captureKey = ({ caseId, stage, target, theme }) => [caseId, stage, target, theme].join('|');
const describe = (outcomes) =>
  outcomes.map((o) => `${o.caseId} [${o.stage}] on ${o.target} (${o.theme}): ${o.code} - ${o.reason}`).join('; ');

/**
 * A declared rejection names a case of the mutation, a screenshot stage and a
 * rejection code. An infrastructure failure can never be declared.
 */
export function rejectionDeclarationProblems(mutation) {
  return (mutation.acquisitionRejections ?? []).flatMap((rule) => {
    const problems = [];
    if (!mutation.caseIds.includes(rule.caseId))
      problems.push(`case ${rule.caseId} is not one of the mutation's cases`);
    if (!['initial', 'transitioned', 'post', 'post-blurred'].includes(rule.stage)) {
      problems.push(`stage ${rule.stage} is not a screenshot stage`);
    }
    if (ACQUISITION_FAILURES[rule.code] !== REJECTION) problems.push(`${rule.code} is not an acquisition rejection`);
    return problems.map((problem) => `${mutation.id}: declared acquisition rejection: ${problem}`);
  });
}

/** Whether the mutation declares this rejection as one its own defect causes. */
export function permitsRejection(mutation, outcome) {
  return (
    outcome.kind === REJECTION &&
    outcome.target === mutation.target &&
    (mutation.acquisitionRejections ?? []).some(
      (rule) => rule.caseId === outcome.caseId && rule.stage === outcome.stage && rule.code === outcome.code,
    )
  );
}

/**
 * `captured` is a captureAll mutation capture: the merged captures, the
 * mutation's applied count, its isolation captures, every failed acquisition
 * of the mutated target and the themes a failure left unusable. `clean` is the
 * unmutated capture, for the isolation proof.
 */
export function judgeBrowserMutation({ mutation, captured, clean, catalog, policy }) {
  const declarationProblems = rejectionDeclarationProblems(mutation);
  if (declarationProblems.length > 0) throw new Error(declarationProblems.join('; '));
  const failed = captured.acquisitionFailures ?? [];
  const invalidated = captured.invalidated ?? [];
  const infrastructure = failed.filter((outcome) => outcome.kind === INFRASTRUCTURE);
  const expectedRejections = failed.filter((outcome) => permitsRejection(mutation, outcome));
  const unexpectedRejections = failed.filter(
    (outcome) => outcome.kind === REJECTION && !permitsRejection(mutation, outcome),
  );
  const unknown = failed.filter((outcome) => outcome.kind !== INFRASTRUCTURE && outcome.kind !== REJECTION);
  if (unknown.length > 0) throw new Error(`Unclassified acquisition failure: ${describe(unknown)}`);
  const acquisition =
    failed.length > 0 ? { infrastructure, expectedRejections, unexpectedRejections, invalidated } : undefined;

  if (infrastructure.length > 0) {
    return {
      status: INFRASTRUCTURE_ERROR,
      detail: `acquisition infrastructure failure: ${describe(infrastructure)}`,
      acquisition,
    };
  }
  if (unexpectedRejections.length > 0) {
    return {
      status: ACQUISITION_REJECTED,
      detail: `acquisition rejected a capture the mutation does not declare: ${describe(unexpectedRejections)}`,
      acquisition,
    };
  }
  if (invalidated.length > 0) {
    return {
      status: ACQUISITION_REJECTED,
      detail: `a failed acquisition left the page unusable, so its evidence is incomplete: ${describe(invalidated)}`,
      acquisition,
    };
  }

  const result = compareCaptures(captured.captures, catalog, policy);
  // Every screenshot the comparator found missing has to be a failure the
  // capture recorded - a gap nothing explains is a harness defect.
  const recorded = new Set(failed.map(captureKey));
  const unexplained = result.acquisitionGaps.filter(
    (gap) => !gap.acquisition || !recorded.has(captureKey(gap.acquisition)),
  );
  if (unexplained.length > 0) {
    throw new Error(
      `${mutation.id}: screenshot(s) missing without a recorded acquisition failure: ${JSON.stringify(unexplained)}`,
    );
  }

  const missing = assessMutation(mutation.expect, result.failures);
  if (missing.length > 0) {
    return { status: MISSED, detail: `missing ${JSON.stringify(missing)}`, acquisition, result };
  }

  const isolationEvidence = [];
  if (mutation.verifyIsolation) {
    let isolated = !result.failures.some((entry) => entry.direction === 'reference-vs-razor');
    for (const target of ['reference', 'razor']) {
      for (const theme of ['light', 'dark']) {
        const fresh = captured.isolation?.[target]?.[theme];
        const unmutated = clean[target][theme];
        for (const caseId of mutation.caseIds) {
          const matches =
            fresh &&
            isDeepStrictEqual(fresh.extracted[caseId], unmutated.extracted[caseId]) &&
            isDeepStrictEqual(fresh.accessibility[caseId], unmutated.accessibility[caseId]) &&
            fresh.screenshots[caseId]?.sha256 === unmutated.screenshots[caseId]?.sha256;
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
      return {
        status: MISSED,
        detail: 'fresh reference/Razor observations changed or isolation proof is missing',
        acquisition,
        result,
      };
    }
  }

  return {
    status: DETECTED,
    detail: `${mutation.description}: ${result.failures.length} difference(s)`,
    acquisition,
    result,
    isolationEvidence,
  };
}
