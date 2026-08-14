#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dockerImage = process.env.ANNABEL_PHP_IMAGE ?? 'annabel-php';

const script = String.raw`
set -eu
consumer_root=/tmp/codemonster-ui-registry-consumer
installed_root="$consumer_root/vendor/codemonster-ru/ui-razor"

cp -R /workspace/scripts/fixtures/composer-registry-consumer "$consumer_root"
cp /workspace/scripts/fixtures/composer-packed-consumer/smoke.php "$consumer_root/smoke.php"

composer --working-dir="$consumer_root" update --no-interaction --prefer-dist --no-scripts
composer --working-dir="$consumer_root" validate --no-check-publish
composer --working-dir="$consumer_root" audit --locked --no-interaction
php "$consumer_root/verify-lock.php"
php "$consumer_root/smoke.php"

test -f "$installed_root/composer.json"
test ! -d "$installed_root/.git"
if grep -R -nE '"type"[[:space:]]*:[[:space:]]*"path"|file:|/workspace|/annabel' \
  "$consumer_root/composer.json" "$consumer_root/composer.lock" "$installed_root/composer.json" "$installed_root/src"; then
  echo '[composer-registry-consumer] Registry install leaked a local repository or workspace path.' >&2
  exit 1
fi

echo '[composer-registry-consumer] OK: exact Packagist archive metadata, rendering, and assets passed.'
`;

console.log(`[composer-registry-consumer] Using ${dockerImage} with a fresh Composer cache.`);
execFileSync(
  'docker',
  [
    'run',
    '--rm',
    '-e',
    'COMPOSER_CACHE_DIR=/tmp/composer-cache',
    '-v',
    `${repositoryRoot}:/workspace:ro`,
    dockerImage,
    'sh',
    '-lc',
    script,
  ],
  { stdio: 'inherit' },
);
