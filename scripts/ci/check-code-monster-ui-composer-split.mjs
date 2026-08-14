import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const workflow = readFileSync(resolve(repositoryRoot, '.github/workflows/split.yml'), 'utf8');
const composerManifest = JSON.parse(readFileSync(resolve(repositoryRoot, 'packages/razor/composer.json'), 'utf8'));
const errors = [];

for (const requiredFragment of [
  "- 'ui-razor/v*.*.*'",
  'git subtree split --prefix=packages/razor',
  'github.com/codemonster-ru/ui-razor.git',
  'repository: codemonster-ru/ui-razor',
]) {
  if (!workflow.includes(requiredFragment)) {
    errors.push(`split workflow is missing: ${requiredFragment}`);
  }
}

if (composerManifest.support?.source !== 'https://github.com/codemonster-ru/ui-razor') {
  errors.push('codemonster-ru/ui-razor support.source must reference the public split repository.');
}

if (errors.length > 0) {
  console.error(`[ui-composer-split] FAILED with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    '[ui-composer-split] OK: packages/razor maps to codemonster-ru/ui-razor with ui-razor/v* release tags.',
  );
}
