import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const componentsDir = path.join(rootDir, 'src/lib/components');
const opticalOffsetsPath = path.join(rootDir, 'src/lib/iconOpticalOffsets.json');

const threshold = Number(process.argv[2] ?? '8');
const opticalOffsets = JSON.parse(fs.readFileSync(opticalOffsetsPath, 'utf8'));

const files = fs
  .readdirSync(componentsDir)
  .filter((name) => name.endsWith('.vue') && name !== 'icon.vue')
  .sort((left, right) => left.localeCompare(right));

const extractSvg = (filePath, iconName) => {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/<template>([\s\S]*?)<\/template>/);

  if (!match) {
    return null;
  }

  let svg = match[1].trim();
  svg = svg.replace(
    /v-bind="iconSvgAttrs"/g,
    'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" style="color:#000"',
  );
  svg = svg.replace(/:width="size"/g, 'width="512"');
  svg = svg.replace(/:height="size"/g, 'height="512"');
  svg = svg.replace(/:id="maskId"/g, 'id="mask0"');
  svg = svg.replace(/:mask="`url\(#\$\{maskId\}\)`"/g, 'mask="url(#mask0)"');
  svg = svg.replace(/currentColor/g, '#000');
  svg = svg.replace(/useId\(\)/g, '0');

  const offset = opticalOffsets[iconName] ?? { x: 0, y: 0 };
  const translateX = offset.x * 512;
  const translateY = offset.y * 512;

  svg = svg.replace(/^<svg([^>]*)>/, `<svg$1><g transform="translate(${translateX} ${translateY})">`);
  svg = svg.replace(/<\/svg>$/, '</g></svg>');

  return svg;
};

const getBoundingBox = (buffer) => {
  const png = PNG.sync.read(buffer);
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const idx = (png.width * y + x) << 2;

      if (png.data[idx + 3] > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1) {
    return null;
  }

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

const results = [];

for (const file of files) {
  const iconName = file.replace(/\.vue$/, '');
  const svg = extractSvg(path.join(componentsDir, file), iconName);

  if (!svg) {
    continue;
  }

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } }).render().asPng();
  const bbox = getBoundingBox(png);

  if (!bbox) {
    continue;
  }

  const dx = +(bbox.centerX - 255.5).toFixed(2);
  const dy = +(bbox.centerY - 255.5).toFixed(2);
  const distance = +Math.hypot(dx, dy).toFixed(2);

  results.push({ icon: iconName, dx, dy, distance });
}

const offenders = results
  .filter((result) => result.distance >= threshold)
  .sort((left, right) => right.distance - left.distance);

if (offenders.length === 0) {
  console.log(`All icons are within the ${threshold}px centering threshold.`);
  process.exit(0);
}

console.log(JSON.stringify(offenders, null, 2));
process.exit(1);
