import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

await import('./audit-icons.mjs');

const rootDir = process.cwd();
const audit = JSON.parse(readFileSync(resolve(rootDir, 'src/lib/iconAudit.json'), 'utf8'));
const thresholdPixels = Number(process.argv[2] ?? '8');
const normalizedThreshold = (thresholdPixels / 512) * 24;
const offenders = audit.icons
  .map((entry) => {
    const effectiveDx = entry.center.dx + entry.opticalOffset.x * 24;
    const effectiveDy = entry.center.dy + entry.opticalOffset.y * 24;
    const distance = Math.hypot(effectiveDx, effectiveDy);

    return {
      icon: entry.icon,
      dx: +((effectiveDx / 24) * 512).toFixed(2),
      dy: +((effectiveDy / 24) * 512).toFixed(2),
      distance: +((distance / 24) * 512).toFixed(2),
      sourceCenter: entry.center,
      opticalOffset: entry.opticalOffset,
    };
  })
  .filter((entry) => entry.distance >= thresholdPixels)
  .sort((left, right) => right.distance - left.distance);

if (offenders.length === 0) {
  console.log(`All icons are within the ${thresholdPixels}px effective-centering threshold.`);
  process.exit(0);
}

console.log(
  JSON.stringify(
    {
      thresholdPixels,
      normalizedThreshold: +normalizedThreshold.toFixed(3),
      note: 'These are review candidates after optical offsets, not automatic failures of visual quality.',
      offenders,
    },
    null,
    2,
  ),
);
process.exit(1);
