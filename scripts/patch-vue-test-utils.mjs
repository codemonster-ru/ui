import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve('node_modules/@vue/test-utils/package.json');
const lockPaths = [resolve('package-lock.json'), resolve('node_modules/.package-lock.json')];

if (!existsSync(manifestPath)) {
  console.log('[dependencies] @vue/test-utils is not installed; patch skipped.');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const expectedVersion = '2.4.11';
const vulnerableRange = '^1.14.9';
const safeRange = '>=2.0.3 <3';

if (manifest.version !== expectedVersion) {
  throw new Error(
    `Expected @vue/test-utils@${expectedVersion}, received ${manifest.version ?? 'unknown'}.`,
  );
}

if (
  manifest.dependencies?.['js-beautify'] !== vulnerableRange &&
  manifest.dependencies?.['js-beautify'] !== safeRange
) {
  throw new Error(
    `Unexpected @vue/test-utils js-beautify range: ${
      manifest.dependencies?.['js-beautify'] ?? 'missing'
    }.`,
  );
}

manifest.dependencies['js-beautify'] = safeRange;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

for (const lockPath of lockPaths) {
  if (!existsSync(lockPath)) {
    continue;
  }

  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  const lockEntry = lock.packages?.['node_modules/@vue/test-utils'];

  if (
    lockEntry?.dependencies?.['js-beautify'] !== vulnerableRange &&
    lockEntry?.dependencies?.['js-beautify'] !== safeRange
  ) {
    throw new Error(
      `Unexpected ${lockPath} js-beautify range: ${
        lockEntry?.dependencies?.['js-beautify'] ?? 'missing'
      }.`,
    );
  }

  lockEntry.dependencies['js-beautify'] = safeRange;
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

console.log('[dependencies] Patched @vue/test-utils to accept js-beautify@2.');
