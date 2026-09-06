// Compares two showcase capture sets.
//
// Missing and unexpected captures or cases are failures. A comparison never
// narrows itself to the intersection of both sides.
export function compareCaptureSets(expected, actual, { expectedLabel = 'baseline', actualLabel = 'current' } = {}) {
  const differences = [];

  const expectedById = new Map(expected.captures.map((capture) => [capture.id, capture]));
  const actualById = new Map(actual.captures.map((capture) => [capture.id, capture]));

  for (const id of expectedById.keys()) {
    if (!actualById.has(id)) differences.push(`capture ${id}: missing in ${actualLabel}`);
  }
  for (const id of actualById.keys()) {
    if (!expectedById.has(id)) differences.push(`capture ${id}: unexpected in ${actualLabel}`);
  }

  for (const [id, expectedCapture] of expectedById) {
    const actualCapture = actualById.get(id);
    if (!actualCapture) continue;

    const expectedCases = new Set(expectedCapture.cases);
    const actualCases = new Set(actualCapture.cases);

    for (const caseId of expectedCases) {
      if (!actualCases.has(caseId)) differences.push(`capture ${id}: missing case ${caseId}`);
    }
    for (const caseId of actualCases) {
      if (!expectedCases.has(caseId)) differences.push(`capture ${id}: unexpected case ${caseId}`);
    }
    if (expectedCapture.cases.join('|') !== actualCapture.cases.join('|') && expectedCases.size === actualCases.size) {
      differences.push(`capture ${id}: case order changed`);
    }

    const expectedCensus = expectedCapture.componentCensus ?? {};
    const actualCensus = actualCapture.componentCensus ?? {};
    for (const key of new Set([...Object.keys(expectedCensus), ...Object.keys(actualCensus)])) {
      if (expectedCensus[key] !== actualCensus[key]) {
        differences.push(
          `capture ${id}: component census ${key} ${expectedCensus[key] ?? 0} -> ${actualCensus[key] ?? 0}`,
        );
      }
    }

    if (expectedCapture.screenshot.sha256 !== actualCapture.screenshot.sha256) {
      differences.push(
        `capture ${id}: screenshot differs ` +
          `(${expectedLabel} ${expectedCapture.screenshot.sha256.slice(0, 12)}/${expectedCapture.screenshot.bytes}B, ` +
          `${actualLabel} ${actualCapture.screenshot.sha256.slice(0, 12)}/${actualCapture.screenshot.bytes}B)`,
      );
    }

    for (const key of ['scrollHeight', 'scrollWidth', 'clientWidth', 'theme', 'reducedMotion']) {
      if (expectedCapture.layout[key] !== actualCapture.layout[key]) {
        differences.push(
          `capture ${id}: layout.${key} ${JSON.stringify(expectedCapture.layout[key])} -> ` +
            `${JSON.stringify(actualCapture.layout[key])}`,
        );
      }
    }

    if (JSON.stringify(expectedCapture.fonts) !== JSON.stringify(actualCapture.fonts)) {
      differences.push(`capture ${id}: resolved fonts changed`);
    }
  }

  return differences;
}

// Environment drift is reported separately: it explains pixel differences
// instead of being hidden by them.
export function compareEnvironments(expected, actual) {
  const differences = [];
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);

  for (const key of keys) {
    if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
      differences.push(`environment.${key}: ${JSON.stringify(expected[key])} -> ${JSON.stringify(actual[key])}`);
    }
  }

  return differences;
}
