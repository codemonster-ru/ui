import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const outputArgument = process.argv.find((argument) => argument.startsWith('--output='));
const outputPath = outputArgument ? resolve(outputArgument.slice('--output='.length)) : null;

if (!outputPath) {
  throw new Error('Razor visual rendering requires --output=FILE.');
}
const php = spawnSync('php', ['--version'], { encoding: 'utf8' });
if (php.error?.code === 'ENOENT') {
  throw new Error(
    'PHP is unavailable. Install PHP 8.2+ or run this renderer in the CI/Docker Annabel environment; Razor visual output was not generated.',
  );
}
if (php.status !== 0) {
  throw new Error(`PHP availability check failed: ${php.stderr.trim() || `exit ${php.status}`}.`);
}

const autoload = resolve(import.meta.dirname, '../../packages/razor/vendor/autoload.php');
if (!existsSync(autoload)) {
  throw new Error(
    'Razor Composer dependencies are unavailable. Run composer install --working-dir=packages/razor before visual rendering.',
  );
}

execFileSync('php', [resolve(import.meta.dirname, 'render-cross-platform-button.php'), outputPath], {
  stdio: 'inherit',
});
