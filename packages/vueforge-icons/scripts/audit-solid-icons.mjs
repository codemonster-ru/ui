import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

const rootDir = process.cwd();
const solidIconData = JSON.parse(readFileSync(resolve(rootDir, 'src/lib/internal/solidIconData.json'), 'utf8'));
const canvasSize = 512;
const unitScale = 24 / canvasSize;
const failures = [];
const measurements = [];
const compactInkIcons = new Set(['caretDown', 'caretLeft', 'caretRight', 'caretUp']);

for (const [iconName, icon] of Object.entries(solidIconData)) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${canvasSize}" height="${canvasSize}" color="#000">${icon.body}</svg>`;
  const png = PNG.sync.read(new Resvg(source).render().asPng());
  let inkPixels = 0;
  let minX = canvasSize;
  let minY = canvasSize;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < canvasSize; y += 1) {
    for (let x = 0; x < canvasSize; x += 1) {
      const alpha = png.data[(y * canvasSize + x) * 4 + 3];

      if (alpha < 16) continue;

      inkPixels += alpha / 255;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const inkArea = (inkPixels / (canvasSize * canvasSize)) * 100;
  const bounds = {
    left: minX * unitScale,
    top: minY * unitScale,
    right: (maxX + 1) * unitScale,
    bottom: (maxY + 1) * unitScale,
  };

  measurements.push({ iconName, inkArea, bounds });

  if (maxX === -1) failures.push(`${iconName}: empty render`);
  const minimumInkArea = compactInkIcons.has(iconName) ? 4 : 8;

  if (inkArea < minimumInkArea || inkArea > 60) {
    failures.push(`${iconName}: ink area ${inkArea.toFixed(1)}% is outside ${minimumInkArea}–60%`);
  }
  if (bounds.left < 0.25 || bounds.top < 0.25 || bounds.right > 23.75 || bounds.bottom > 23.75) {
    failures.push(`${iconName}: artwork touches the canvas edge`);
  }
}

const inkAreas = measurements.map((measurement) => measurement.inkArea);
console.log(
  `Solid audit: ${measurements.length} icons, ink ${Math.min(...inkAreas).toFixed(1)}–${Math.max(...inkAreas).toFixed(1)}%.`,
);

if (failures.length > 0) {
  throw new Error(`Solid icon audit failed:\n${failures.join('\n')}`);
}
