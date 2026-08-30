/**
 * Consistency rules for a committed visual baseline set.
 *
 * A baseline directory holds a manifest and the PNGs it describes. Three things can drift apart:
 * the routes the capture config asks for, the routes the manifest claims, and the files actually on
 * disk. Nothing checked that, so deleting a route's baselines left a manifest still advertising
 * them and the comparison refused to run — in CI, long after the change looked green locally.
 */

export function findBaselineManifestIssues({ configuredRoutes, manifest, files }) {
  const issues = [];

  if (!Array.isArray(manifest?.routes) || !Array.isArray(manifest?.screenshots)) {
    return ['Baseline manifest must define routes and screenshots arrays.'];
  }

  const configured = new Set(configuredRoutes);
  const claimed = new Set(manifest.routes);

  for (const route of claimed) {
    if (!configured.has(route)) {
      issues.push(`Baseline manifest claims route ${route}, which the capture config no longer lists.`);
    }
  }

  for (const route of configured) {
    if (!claimed.has(route)) {
      issues.push(`Capture config lists route ${route}, which the baseline manifest does not cover.`);
    }
  }

  const onDisk = new Set(files);
  const described = new Set();

  for (const screenshot of manifest.screenshots) {
    const name = screenshot?.filename;
    if (typeof name !== 'string' || name === '') {
      issues.push('Baseline manifest has a screenshot entry without a filename.');
      continue;
    }
    described.add(name);
    if (!claimed.has(screenshot.route)) {
      issues.push(`Baseline manifest describes ${name} for unlisted route ${String(screenshot.route)}.`);
    }
    if (!onDisk.has(name)) {
      issues.push(`Baseline manifest describes ${name}, which is missing from the baseline directory.`);
    }
  }

  for (const name of onDisk) {
    if (!described.has(name)) {
      issues.push(`Baseline directory holds ${name}, which the manifest does not describe.`);
    }
  }

  return issues;
}
