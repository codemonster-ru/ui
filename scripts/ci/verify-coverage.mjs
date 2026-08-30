const npmRunPattern = /npm run ([A-Za-z0-9:_-]+)/gu;

function collectNpmScripts(source) {
  if (typeof source !== 'string') {
    return [];
  }

  return [...source.matchAll(npmRunPattern)].map((match) => match[1]);
}

/**
 * Reads the ordered `npm run` steps the root `verify` script chains together.
 */
export function parseVerifySteps(verifyScript) {
  return [...new Set(collectNpmScripts(verifyScript))];
}

/**
 * Reads every `npm run` step any workflow job executes.
 */
export function parseWorkflowScripts(workflowText) {
  return new Set(collectNpmScripts(workflowText));
}

/**
 * Reports the `verify` steps no workflow job runs, in `verify` order.
 */
export function findUncoveredVerifySteps(verifyScript, workflowText, coveredElsewhere = {}) {
  const workflowScripts = parseWorkflowScripts(workflowText);
  const declared = new Set(Object.keys(coveredElsewhere));
  return parseVerifySteps(verifyScript).filter(
    (step) => !workflowScripts.has(step) && !declared.has(step),
  );
}

/**
 * Reports the CI steps `verify` does not run, excluding ones declared as CI-only.
 *
 * This is the direction that actually bites. `verify` passing locally reads as "this branch is
 * good", and every step CI runs that `verify` does not is a way for that reading to be wrong. A
 * step may legitimately be CI-only — a pinned browser, a container — but that has to be a written
 * decision rather than something nobody noticed.
 */
export function findVerifyGaps(verifyScript, workflowText, ciOnlySteps = {}) {
  const covered = new Set(parseVerifySteps(verifyScript));
  const declared = new Set(Object.keys(ciOnlySteps));

  return [...parseWorkflowScripts(workflowText)]
    .filter((step) => !covered.has(step) && !declared.has(step))
    .sort();
}

/**
 * Reports declared CI-only exceptions that no longer describe anything, so the list cannot rot into
 * a record of steps that were moved into `verify` years ago.
 */
export function findStaleCiOnlyDeclarations(verifyScript, workflowText, ciOnlySteps = {}) {
  const covered = new Set(parseVerifySteps(verifyScript));
  const workflowScripts = parseWorkflowScripts(workflowText);

  return Object.keys(ciOnlySteps)
    .filter((step) => !workflowScripts.has(step) || covered.has(step))
    .sort();
}

/**
 * Reports CI jobs that run no `verify` step at all and are not declared.
 *
 * A job built entirely from commands that are not `npm run` — a container, a browser download — is
 * invisible to the step-level checks above. The Razor job is exactly that shape, which is how
 * "verify is green" came to mean less than it looked like it meant.
 */
export function findUncoveredJobs(verifyScript, jobs, ciOnlyJobs = {}) {
  const covered = new Set(parseVerifySteps(verifyScript));
  const declared = new Set(Object.keys(ciOnlyJobs));

  return Object.entries(jobs)
    .filter(([name, job]) => {
      if (declared.has(name)) return false;
      const steps = collectNpmScripts(
        (job?.steps ?? []).map((step) => step?.run ?? '').join('\n'),
      );
      return !steps.some((step) => covered.has(step));
    })
    .map(([name]) => name)
    .sort();
}
