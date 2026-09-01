/**
 * The VueForge showcase is compared pixel for pixel against commit fd793696, which is what proves
 * the migration did not change how anything looks. Its shell renders a section navigation on every
 * route, so a demo added anywhere shifts page height and moves every frame below it.
 *
 * That happened once and was found in CI, on the fourteenth commit of a branch, reported as 112
 * changed and 4 unexpected frames while nothing about the migrated components had regressed. The
 * pixel comparison needs a pinned browser and only runs in CI, so `verify` passing locally says
 * nothing about it. This says something about it locally, on the first commit rather than the last.
 */

const nonRenderingPatterns = [
  // Metadata read by the migration coverage check; no Vue file imports it.
  /^examples\/vue\/src\/sections\/core\/component-catalog\.json$/u,
  // Tests and their fixtures never reach a rendered page.
  /^examples\/vue\/src\/.*\.(?:test|spec)\.[cm]?[jt]sx?$/u,
  // Everything outside src is configuration, packaging, or prose.
  /^examples\/vue\/(?!src\/)/u,
];

/** Reports whether a repository path is rendered into a frozen showcase route. */
export function affectsFrozenShowcase(path) {
  if (!path.startsWith('examples/vue/')) return false;
  return !nonRenderingPatterns.some((pattern) => pattern.test(path));
}

/** Reports the changed paths that would move the frozen baseline. */
export function findFrozenShowcaseChanges(changedPaths) {
  return changedPaths.filter((path) => affectsFrozenShowcase(path)).sort();
}
