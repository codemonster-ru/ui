import { join, resolve } from 'node:path';
import { codeMonsterUiPackageSizeBudgets } from './code-monster-ui-package-catalog.mjs';
import {
  formatCodeMonsterUiPackageMeasurement,
  validateCodeMonsterUiPackageBudget,
} from './code-monster-ui-package-budgets.mjs';
import { discoverCodeMonsterUiWorkspaces } from './code-monster-ui-workspaces.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const workspaces = discoverCodeMonsterUiWorkspaces(join(repositoryRoot, 'packages'));
const errors = [];

for (const workspace of workspaces) {
  const packageDirectory = join(repositoryRoot, 'packages', workspace.directory);
  const budget = codeMonsterUiPackageSizeBudgets[workspace.name];
  if (!budget) {
    errors.push(`${workspace.name} has no approved package size budget.`);
    continue;
  }
  const result = validateCodeMonsterUiPackageBudget(workspace, packageDirectory, budget);
  errors.push(...result.errors);
  if (result.measurement) {
    console.log(
      `[ui-package-budgets] ${formatCodeMonsterUiPackageMeasurement(workspace, packageDirectory, result.measurement)}`,
    );
  }
}

if (errors.length > 0) {
  console.error(`[ui-package-budgets] FAILED with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else if (workspaces.length === 0) {
  console.log('[ui-package-budgets] No CodeMonster UI npm workspaces to measure yet.');
} else {
  console.log(`[ui-package-budgets] OK: ${workspaces.length} package budget(s) passed.`);
}
