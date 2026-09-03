import { execFileSync } from 'node:child_process';
import { acknowledgedChanges, findFrozenShowcaseChanges, findStaleAcknowledgements } from './frozen-showcase.mjs';

const base = process.env.FROZEN_SHOWCASE_BASE ?? 'origin/main';

/**
 * Committed changes plus the working tree.
 *
 * Reading only the committed diff made this report a clean run while an offending edit sat unstaged,
 * which is the moment the check is most useful: before the commit rather than after fourteen of them.
 */
function changedPaths() {
  try {
    const committed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' });
    const working = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map((line) => line.slice(3).split(' -> ').at(-1));
    return [...new Set([...committed.split('\n').filter(Boolean), ...working])];
  } catch {
    console.log(`[frozen-showcase] SKIPPED: cannot diff against ${base}.`);
    return null;
  }
}

const paths = changedPaths();
if (paths === null) process.exit(0);

const offending = findFrozenShowcaseChanges(paths).filter((path) => !(path in acknowledgedChanges));

if (offending.length > 0) {
  console.error('[frozen-showcase] These changes render into the showcase frozen against fd793696:');
  for (const path of offending) console.error(`[frozen-showcase]   ${path}`);
  console.error('[frozen-showcase] Its shell renders a section navigation on every route, so a demo added');
  console.error('[frozen-showcase] anywhere shifts page height and moves every frame the visual gate compares.');
  console.error('[frozen-showcase] Components with no VueForge ancestor belong in examples/ui-showcase.');
  console.error('[frozen-showcase] If the change is deliberate, say so in the decision journal and adjust this check.');
  process.exit(1);
}

const stale = findStaleAcknowledgements(paths);

if (stale.length > 0) {
  console.error('[frozen-showcase] Acknowledged changes that no longer differ:');
  for (const path of stale) console.error(`[frozen-showcase]   ${path}`);
  console.error(
    '[frozen-showcase] Remove them from acknowledgedChanges; an acknowledgement must not outlive its change.',
  );
  process.exit(1);
}

const acknowledged = Object.keys(acknowledgedChanges).length;
console.log(
  `[frozen-showcase] OK: none of the ${paths.length} changed path(s) render into the frozen showcase` +
    (acknowledged > 0 ? `, and ${acknowledged} reviewed change(s) are acknowledged.` : '.'),
);
