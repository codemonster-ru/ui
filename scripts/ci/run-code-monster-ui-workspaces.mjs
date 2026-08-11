import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverCodeMonsterUiWorkspaces } from './code-monster-ui-workspaces.mjs';

const allowedScripts = new Set(['build', 'check']);
const script = process.argv[2];

if (!allowedScripts.has(script)) {
  console.error(`Usage: node ${process.argv[1]} <${[...allowedScripts].join('|')}>`);
  process.exitCode = 1;
} else {
  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const workspaces = discoverCodeMonsterUiWorkspaces(join(projectRoot, 'packages'));

  for (const workspace of workspaces) {
    const result = spawnSync('npm', ['run', script, '--workspace', workspace.name], {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
  }

  if (workspaces.length === 0) {
    console.log(`No CodeMonster UI npm workspaces to ${script} yet.`);
  }
}
