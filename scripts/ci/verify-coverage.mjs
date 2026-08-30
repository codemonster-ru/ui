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
export function findUncoveredVerifySteps(verifyScript, workflowText) {
  const workflowScripts = parseWorkflowScripts(workflowText);
  return parseVerifySteps(verifyScript).filter((step) => !workflowScripts.has(step));
}
