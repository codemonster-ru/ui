#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const annabelRepository = resolve(process.env.ANNABEL_REPOSITORY ?? resolve(repositoryRoot, '../../PHP/annabel'));
const composerCache = resolve(process.env.COMPOSER_CACHE_DIRECTORY ?? `${process.env.HOME}/.cache/composer`);
const dockerImage = process.env.ANNABEL_PHP_IMAGE ?? 'annabel-php';
const composerVersion = '1.0.0';

if (!existsSync(resolve(annabelRepository, 'packages/razor/composer.json'))) {
  throw new Error(`Annabel repository not found at ${annabelRepository}. Set ANNABEL_REPOSITORY to its absolute path.`);
}
if (!process.env.HOME) {
  throw new Error('HOME is required only to locate the read/write Composer cache mount.');
}

const script = String.raw`
set -eu
workspace_root=/tmp/codemonster-ui-workspace
package_root="$workspace_root/packages/razor"
archive_package_root=/tmp/codemonster-ui-archive-package
artifact_root=/tmp/codemonster-ui-artifacts
extracted_root=/tmp/codemonster-ui-extracted
consumer_root=/tmp/codemonster-ui-consumer

mkdir -p "$workspace_root/packages"
cp -R /workspace/packages/razor "$package_root"
rm -rf "$package_root/vendor" "$package_root/composer.lock"
cp -R /workspace/contracts "$workspace_root/contracts"
cp -R /workspace/scripts/fixtures/composer-packed-consumer "$consumer_root"
mkdir -p "$artifact_root"

composer --working-dir="$package_root" config repositories.annabel '{"type":"path","url":"/annabel/packages/*","options":{"symlink":false}}'
composer --working-dir="$package_root" config minimum-stability dev
composer --working-dir="$package_root" config prefer-stable true
composer --working-dir="$package_root" update --no-interaction --prefer-dist
composer --working-dir="$package_root" check

cp -R /workspace/packages/razor "$archive_package_root"
composer --working-dir="$archive_package_root" config version "$CODEMONSTER_UI_COMPOSER_VERSION"
composer --working-dir="$archive_package_root" archive --format=zip --dir="$artifact_root" --file="codemonster-ui-$CODEMONSTER_UI_COMPOSER_VERSION" --no-interaction
archive_path=$(find "$artifact_root" -maxdepth 1 -type f -name '*.zip' -print)
test -n "$archive_path"
test "$(printf '%s\n' "$archive_path" | wc -l | tr -d ' ')" = 1

archive_files=$(unzip -Z1 "$archive_path")
printf '%s\n' "$archive_files" | grep -Eq '(^|/)composer.json$'
printf '%s\n' "$archive_files" | grep -Eq '(^|/)src/UiComponentProvider.php$'
printf '%s\n' "$archive_files" | grep -Eq '(^|/)resources/views/components/button.razor.php$'
printf '%s\n' "$archive_files" | grep -Eq '(^|/)resources/assets/manifest.json$'
printf '%s\n' "$archive_files" | grep -Eq '(^|/)README.md$'
printf '%s\n' "$archive_files" | grep -Eq '(^|/)LICENSE$'
if printf '%s\n' "$archive_files" | grep -Eq '(^|/)(tests|vendor)/|(^|/)(phpunit\.xml\.dist|phpstan\.neon\.dist|composer\.lock)$'; then
  echo '[composer-packed-consumer] Archive contains development-only files.' >&2
  exit 1
fi

mkdir -p "$extracted_root"
unzip -q "$archive_path" -d "$extracted_root"

composer --working-dir="$consumer_root" update --no-interaction --prefer-dist --no-scripts
composer --working-dir="$consumer_root" validate --strict
php "$consumer_root/smoke.php"

installed_root="$consumer_root/vendor/codemonster-ru/ui"
test -f "$installed_root/composer.json"
test ! -d "$installed_root/tests"
test ! -f "$installed_root/phpunit.xml.dist"
test ! -f "$installed_root/phpstan.neon.dist"
if grep -R -nE "file:|/workspace|/annabel" "$installed_root/composer.json" "$installed_root/src"; then
  echo '[composer-packed-consumer] Installed package leaked a workspace path.' >&2
  exit 1
fi

echo '[composer-packed-consumer] OK: Composer installed and consumed the exact CodeMonster UI archive.'
`;

const arguments_ = [
  'run',
  '--rm',
  '-e',
  'COMPOSER_CACHE_DIR=/composer-cache',
  '-e',
  `CODEMONSTER_UI_COMPOSER_VERSION=${composerVersion}`,
  '-v',
  `${composerCache}:/composer-cache`,
  '-v',
  `${repositoryRoot}:/workspace:ro`,
  '-v',
  `${annabelRepository}:/annabel:ro`,
  dockerImage,
  'sh',
  '-lc',
  script,
];

console.log(`[composer-packed-consumer] Using ${dockerImage} with Annabel at ${annabelRepository}.`);
execFileSync('docker', arguments_, { stdio: 'inherit' });
