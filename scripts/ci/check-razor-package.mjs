import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Runs the Razor adapter's own suite as part of `verify`.
 *
 * CI runs this in a container where PHP is guaranteed. Locally it is not, and a JavaScript
 * contributor should not be blocked by a missing PHP toolchain — but a silent pass would put the
 * adapter back outside `verify`, which is what let its breakages reach CI unnoticed. So a machine
 * without PHP is told plainly that it verified less than the name suggests.
 */
const repositoryRoot = resolve(import.meta.dirname, '../..');
const packageDirectory = join(repositoryRoot, 'packages/razor');

function has(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
}

if (!has('php') || !has('composer')) {
  console.warn('[razor-package] SKIPPED: php and composer are required to verify the Razor adapter.');
  console.warn('[razor-package] The razor CI job covers it. Install both to verify it here.');
  process.exit(0);
}

if (!existsSync(join(packageDirectory, 'vendor/autoload.php'))) {
  console.log('[razor-package] Installing Composer dependencies.');
  const install = spawnSync(
    'composer',
    ['install', '--no-interaction', '--prefer-dist', '--no-progress'],
    { cwd: packageDirectory, stdio: 'inherit' },
  );
  if (install.status !== 0) {
    console.error('[razor-package] FAILED: could not install Composer dependencies.');
    process.exit(1);
  }
}

const check = spawnSync('composer', ['check'], { cwd: packageDirectory, stdio: 'inherit' });
if (check.status !== 0) {
  console.error('[razor-package] FAILED: the Razor adapter suite did not pass.');
  process.exit(check.status ?? 1);
}

console.log('[razor-package] OK: the Razor adapter suite passed.');
