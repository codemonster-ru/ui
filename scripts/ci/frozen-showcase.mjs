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

/**
 * Changes to frozen-showcase sources that were reviewed and accepted.
 *
 * A declaration is not a permanent exemption. It names a path that currently differs, and the
 * staleness check below fails once it stops differing -- so an entry cannot outlive the change it
 * describes and rot into a list nobody reads. The visual gate remains the authority on whether
 * pixels actually moved; this only records that someone looked.
 */
export const acknowledgedChanges = {
  'examples/vue/src/sections/icons/IconsShowcase.vue':
    'Import path only: the VueForge icons package moved to packages/vueforge-icons so the CodeMonster line could take the packages/icons name. The imported file is unchanged, so nothing renders differently.',
};

/** Reports acknowledged paths that no longer differ, so the list cannot outlive its reasons. */
export function findStaleAcknowledgements(changedPaths, acknowledged = acknowledgedChanges) {
  const changed = new Set(changedPaths);
  return Object.keys(acknowledged)
    .filter((path) => !changed.has(path))
    .sort();
}
