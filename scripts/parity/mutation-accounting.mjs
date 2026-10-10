// The accounting of one parity mutation suite (M35.5c).
//
// From M10 until M35.5c the VfIconButton dead-rule mutation declared
// `rejectedBy: 'usage'`, a kind the driver never ran: it skipped the validation
// branch, was filtered out of the occurrence pass, produced no result at all,
// and the closing line still counted it among the rejected registry mutations,
// because that line counted the registry, not the results.
//
// Two rules close that:
//
//   - a registry mutation declares a rejection kind the driver runs, or it is
//     a failure before any capture;
//   - the verdict of a suite is read from its individual results, and every
//     registered mutation has exactly one of them. A missing, duplicated or
//     unregistered identity fails the suite; no count is derived from the
//     registry.
//
// Nothing here touches a browser, so the policy phases and the accounting can
// be tested on the real registries without capturing anything.

/**
 * How a registry mutation can be rejected:
 *
 *   validation  - validatePolicy refuses the mutated registry before capture.
 *   occurrences - the mutated registry is valid, and the comparison of the
 *                 clean captures under it reports an unapproved difference or
 *                 an approval-usage problem (a rule that matched nothing, or
 *                 more or fewer differences than it expects).
 */
export const POLICY_REJECTIONS = ['validation', 'occurrences'];

/** Status a registry mutation must end with, and status a target mutation must end with. */
export const PASSING_STATUS = { policy: 'rejected', capture: 'detected', browser: 'detected' };

/**
 * The registry mutations before capture.
 *
 * `validate(mutatedPolicy)` returns the validator's problems. Returns the
 * results this phase decides and the mutations left for `policyMutationsOnRun`.
 */
export function policyMutationsBeforeRun(policyMutations, policy, validate) {
  const results = [];
  const pending = [];

  for (const mutation of policyMutations) {
    if (!POLICY_REJECTIONS.includes(mutation.rejectedBy)) {
      results.push({
        id: mutation.id,
        status: 'unsupported-rejection',
        detail: `declares rejectedBy ${JSON.stringify(mutation.rejectedBy)}, which the driver does not run (known: ${POLICY_REJECTIONS.join(', ')})`,
      });
      continue;
    }

    const mutated = structuredClone(policy);
    try {
      mutation.apply(mutated);
    } catch (error) {
      results.push({ id: mutation.id, status: 'not-applied', detail: `could not be applied: ${error.message}` });
      continue;
    }

    const problems = validate(mutated);

    if (mutation.rejectedBy === 'validation') {
      results.push(
        problems.length > 0
          ? { id: mutation.id, status: 'rejected', detail: `${mutation.description} → ${problems[0]}` }
          : { id: mutation.id, status: 'missed', detail: `${mutation.description} → the validator accepted it` },
      );
      continue;
    }

    // Rejected by occurrence accounting instead: it has to survive validation,
    // or the run would never reach the accounting.
    if (problems.length > 0) {
      results.push({
        id: mutation.id,
        status: 'missed',
        detail: `${mutation.description} → rejected by validation before the run: ${problems[0]}`,
      });
      continue;
    }
    // A valid rule with deliberately wrong usage is evaluated after capture.
    pending.push(mutation);
  }

  return { results, pending };
}

/**
 * The registry mutations left pending, judged on real data.
 *
 * `compare(mutatedPolicy)` is the comparison of the clean captures under the
 * mutated registry (compareCaptures).
 */
export function policyMutationsOnRun(pending, policy, compare) {
  return pending.map((mutation) => {
    const mutated = structuredClone(policy);
    mutation.apply(mutated);
    const result = compare(mutated);

    if (result.approvalProblems.length > 0 || result.failures.length > 0) {
      const reason = result.approvalProblems[0] ?? `${result.failures.length} unapproved difference(s)`;
      return { id: mutation.id, status: 'rejected', detail: `${mutation.description} → ${reason}` };
    }
    return { id: mutation.id, status: 'missed', detail: `${mutation.description} → the run accepted it` };
  });
}

/**
 * Reconciles a suite's registry with its results.
 *
 * `mutations` is a suite's `{ policy, capture, browser }`. Every count is read
 * from `results`; the registry only says which identities must be there.
 */
export function accountSuite(mutations, results) {
  const kindOf = new Map();
  const problems = [];
  let registered = 0;

  for (const kind of Object.keys(PASSING_STATUS)) {
    for (const mutation of mutations[kind]) {
      registered += 1;
      if (kindOf.has(mutation.id)) problems.push(`${mutation.id}: registered more than once`);
      kindOf.set(mutation.id, kind);
    }
  }

  const resultsById = new Map();
  for (const result of results) {
    resultsById.set(result.id, [...(resultsById.get(result.id) ?? []), result]);
  }

  const missing = [...kindOf.keys()].filter((id) => !resultsById.has(id));
  const duplicates = [...resultsById].filter(([, entries]) => entries.length > 1).map(([id]) => id);
  const unregistered = [...resultsById.keys()].filter((id) => !kindOf.has(id));

  for (const id of missing) problems.push(`${id}: registered, but produced no result`);
  for (const id of duplicates) problems.push(`${id}: produced ${resultsById.get(id).length} results`);
  for (const id of unregistered) problems.push(`${id}: a result for a mutation that is not registered`);

  const byStatus = {};
  const passing = { policy: 0, capture: 0, browser: 0 };
  for (const result of results) {
    byStatus[result.status] = (byStatus[result.status] ?? 0) + 1;
    const kind = kindOf.get(result.id);
    if (!kind) continue;
    if (result.status === PASSING_STATUS[kind]) {
      passing[kind] += 1;
    } else if (result.status === 'detected' || result.status === 'rejected') {
      problems.push(
        `${result.id}: a ${kind} mutation reported ${result.status}, it can only pass as ${PASSING_STATUS[kind]}`,
      );
    }
  }

  return {
    registered,
    accounted: results.length,
    byStatus,
    passing,
    missing,
    duplicates,
    unregistered,
    problems,
    // Every registered identity passed, each exactly once.
    complete: problems.length === 0 && passing.policy + passing.capture + passing.browser === registered,
  };
}
