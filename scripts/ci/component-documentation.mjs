/**
 * Every exported CodeMonster component must appear in the component guides.
 *
 * check-documentation-contracts.mjs enforces an API page per component for the VueForge line only;
 * it reads `packages/core` and `packages/vueforge-layouts` and knows nothing about `Cm*`. So the
 * whole CodeMonster line was documented by discipline, and discipline held for 46 of 49 — the three
 * that slipped were the three added most recently, which is how this kind of gap always looks.
 *
 * The guides are the public migration boundary the release notes point at, so a component missing
 * from them is a component a consumer cannot migrate to.
 */

const exportPattern = /export \{ default as (Cm[A-Za-z0-9]+) \}/gu;

/** Reads the component names an adapter package exports. */
export function collectExportedComponents(indexSources) {
  const exported = new Set();

  for (const source of indexSources) {
    for (const match of source.matchAll(exportPattern)) exported.add(match[1]);
  }

  return exported;
}

/** Reports exported components that no component guide mentions. */
export function findUndocumentedComponents(exported, guideSources) {
  const guides = guideSources.join('\n');
  return [...exported].filter((name) => !guides.includes(name)).sort();
}
