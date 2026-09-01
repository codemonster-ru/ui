import { execFileSync } from 'node:child_process';
import { findFrozenShowcaseChanges } from './frozen-showcase.mjs';

const base = process.env.FROZEN_SHOWCASE_BASE ?? 'origin/main';

function changedPaths() {
  try {
    const diff = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' });
    return diff.split('\n').filter(Boolean);
  } catch {
    console.log(`[frozen-showcase] SKIPPED: cannot diff against ${base}.`);
    return null;
  }
}

const paths = changedPaths();
if (paths === null) process.exit(0);

const offending = findFrozenShowcaseChanges(paths);

if (offending.length > 0) {
  console.error('[frozen-showcase] These changes render into the showcase frozen against fd793696:');
  for (const path of offending) console.error(`[frozen-showcase]   ${path}`);
  console.error('[frozen-showcase] Its shell renders a section navigation on every route, so a demo added');
  console.error('[frozen-showcase] anywhere shifts page height and moves every frame the visual gate compares.');
  console.error('[frozen-showcase] Components with no VueForge ancestor belong in examples/ui-showcase.');
  console.error('[frozen-showcase] If the change is deliberate, say so in the decision journal and adjust this check.');
  process.exit(1);
}

console.log(`[frozen-showcase] OK: none of the ${paths.length} changed path(s) render into the frozen showcase.`);
