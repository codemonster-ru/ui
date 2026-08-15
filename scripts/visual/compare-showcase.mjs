import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [name, ...value] = argument.replace(/^--/u, '').split('=');
    return [name, value.join('=')];
  }),
);

const baselineDirectory = options.baseline ? resolve(options.baseline) : null;
const currentDirectory = options.current ? resolve(options.current) : null;
const diffDirectory = options.diff ? resolve(options.diff) : null;
const reportOnly = options['report-only'] === 'true';
const channelThreshold = Number(options.threshold ?? 2);

if (!baselineDirectory || !currentDirectory) {
  throw new Error(
    'Usage: node scripts/visual/compare-showcase.mjs --baseline=DIR --current=DIR [--diff=DIR] [--report-only=true]',
  );
}
if (!Number.isFinite(channelThreshold) || channelThreshold < 0 || channelThreshold > 255) {
  throw new Error('Pixel channel threshold must be between 0 and 255.');
}

const baselineManifest = JSON.parse(readFileSync(resolve(baselineDirectory, 'manifest.json'), 'utf8'));
const currentManifest = JSON.parse(readFileSync(resolve(currentDirectory, 'manifest.json'), 'utf8'));

for (const field of ['referenceCommit', 'routes', 'themes', 'viewports']) {
  if (JSON.stringify(baselineManifest[field]) !== JSON.stringify(currentManifest[field])) {
    throw new Error(`Showcase manifests use different ${field}.`);
  }
}

const baselineNames = new Set(baselineManifest.screenshots.map(({ filename }) => filename));
const currentNames = new Set(currentManifest.screenshots.map(({ filename }) => filename));
const missing = [...baselineNames].filter((filename) => !currentNames.has(filename)).sort();
const unexpected = [...currentNames].filter((filename) => !baselineNames.has(filename)).sort();
const comparisons = [];

if (diffDirectory) mkdirSync(diffDirectory, { recursive: true });

for (const filename of [...baselineNames].filter((name) => currentNames.has(name)).sort()) {
  const baselinePath = resolve(baselineDirectory, filename);
  const currentPath = resolve(currentDirectory, filename);
  if (!existsSync(baselinePath) || !existsSync(currentPath)) continue;

  const baseline = PNG.sync.read(readFileSync(baselinePath));
  const current = PNG.sync.read(readFileSync(currentPath));
  if (baseline.width !== current.width || baseline.height !== current.height) {
    comparisons.push({
      filename,
      height: `${baseline.height}/${current.height}`,
      ratio: 1,
      reason: 'dimension-mismatch',
      width: `${baseline.width}/${current.width}`,
    });
    continue;
  }

  const diff = diffDirectory ? new PNG({ height: baseline.height, width: baseline.width }) : null;
  let changedPixels = 0;
  const pixelCount = baseline.width * baseline.height;

  for (let offset = 0; offset < baseline.data.length; offset += 4) {
    const changed =
      Math.abs(baseline.data[offset] - current.data[offset]) > channelThreshold ||
      Math.abs(baseline.data[offset + 1] - current.data[offset + 1]) > channelThreshold ||
      Math.abs(baseline.data[offset + 2] - current.data[offset + 2]) > channelThreshold ||
      Math.abs(baseline.data[offset + 3] - current.data[offset + 3]) > channelThreshold;

    if (changed) changedPixels += 1;
    if (diff) {
      const luminance = Math.round(
        baseline.data[offset] * 0.2126 + baseline.data[offset + 1] * 0.7152 + baseline.data[offset + 2] * 0.0722,
      );
      diff.data[offset] = changed ? 255 : luminance;
      diff.data[offset + 1] = changed ? 0 : luminance;
      diff.data[offset + 2] = changed ? 80 : luminance;
      diff.data[offset + 3] = changed ? 255 : 96;
    }
  }

  const ratio = changedPixels / pixelCount;
  comparisons.push({ changedPixels, filename, pixelCount, ratio });
  if (diff && changedPixels > 0) {
    writeFileSync(resolve(diffDirectory, filename), PNG.sync.write(diff));
  }
}

const changed = comparisons.filter(({ ratio }) => ratio > 0).sort((left, right) => right.ratio - left.ratio);
const report = {
  baseline: baselineManifest.label,
  changed: changed.length,
  compared: comparisons.length,
  current: currentManifest.label,
  missing,
  threshold: channelThreshold,
  topDifferences: changed.slice(0, 25),
  unexpected,
};

const reportPath = resolve(diffDirectory ?? currentDirectory, 'comparison.json');
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `Compared ${comparisons.length} screenshots: ${changed.length} changed, ${missing.length} missing, ${unexpected.length} unexpected.`,
);
console.log(`Report: ${reportPath}`);

if (!reportOnly && (changed.length > 0 || missing.length > 0 || unexpected.length > 0)) {
  process.exitCode = 1;
}
