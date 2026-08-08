import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { Resvg } from '@resvg/resvg-js';
import { format } from 'prettier';
import { VueIconify, iconCatalog } from '../dist/index.node.mjs';

const rootDir = process.cwd();
const snapshotDir = resolve(rootDir, '__tests__/visual-snapshots');
const update = process.argv.includes('--update');
const sizes = [16, 20, 24, 32];
const variants = ['regular', 'light', 'thin', 'solid'];
const families = ['classic', 'duotone'];
const columns = 11;
const padding = 4;
const background = '#171b23';
const foreground = '#f2f5fa';
const secondary = '#8ea8ff';
const secondaryOpacity = 0.65;
const systemIconNames = Object.entries(iconCatalog)
  .filter(([, entry]) => !entry.brand)
  .map(([iconName]) => iconName)
  .sort((left, right) => left.localeCompare(right));

const manifest = {
  version: 2,
  sizes,
  variants,
  families,
  columns,
  padding,
  background,
  foreground,
  secondary,
  secondaryOpacity,
  systemIconNames,
};

const parseOffset = (markup, property) => {
  const value = markup.match(new RegExp(`--vf-icon-offset-${property}:([^;"]+)`))?.[1];

  if (value === undefined) {
    throw new Error(`Rendered icon markup is missing the ${property}-axis optical offset.`);
  }

  return Number(value);
};

const renderIconMarkup = async (iconName, family, variant, size) => {
  const app = createSSRApp({
    render() {
      return h(VueIconify, {
        icon: iconName,
        family,
        variant,
        size,
        secondaryColor: secondary,
        secondaryOpacity,
      });
    },
  });
  const markup = await renderToString(app);
  const svg = markup
    .match(/<svg[\s\S]*<\/svg>/)?.[0]
    .replace(/\sdata-v-[\w-]+/g, '')
    .replaceAll('var(--vf-icon-secondary-paint, currentColor)', secondary)
    .replaceAll('var(--vf-icon-secondary-part-opacity, 0.4)', String(secondaryOpacity));

  if (!svg) {
    throw new Error(`Rendered ${iconName}/${variant} markup does not contain an SVG element.`);
  }

  return {
    svg,
    offsetX: parseOffset(markup, 'x'),
    offsetY: parseOffset(markup, 'y'),
  };
};

const renderSheet = async (family, variant, size) => {
  const cellSize = size + padding * 2;
  const rows = Math.ceil(systemIconNames.length / columns);
  const width = columns * cellSize;
  const height = rows * cellSize;
  const iconMarkup = [];

  for (const [index, iconName] of systemIconNames.entries()) {
    const { svg, offsetX, offsetY } = await renderIconMarkup(iconName, family, variant, size);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * cellSize + padding + offsetX * size;
    const y = row * cellSize + padding + offsetY * size;

    iconMarkup.push(`<g transform="translate(${x} ${y})">${svg}</g>`);
  }

  const source = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" color="${foreground}">`,
    `<rect width="${width}" height="${height}" fill="${background}"/>`,
    ...iconMarkup,
    '</svg>',
  ].join('');

  return new Resvg(source).render().asPng();
};

const expectedFiles = [];
const generatedSnapshots = new Map();

for (const size of sizes) {
  for (const family of families) {
    for (const variant of variants) {
      const fileName = family === 'classic' ? `${variant}-${size}.png` : `${family}-${variant}-${size}.png`;
      expectedFiles.push(fileName);
      generatedSnapshots.set(fileName, await renderSheet(family, variant, size));
    }
  }
}

const manifestFileName = 'manifest.json';
const manifestContent = await format(JSON.stringify(manifest), { parser: 'json' });

if (update) {
  mkdirSync(snapshotDir, { recursive: true });

  for (const [fileName, contents] of generatedSnapshots) {
    writeFileSync(resolve(snapshotDir, fileName), contents);
  }

  writeFileSync(resolve(snapshotDir, manifestFileName), manifestContent);
  console.log(`Updated ${expectedFiles.length} visual snapshot sheets for ${systemIconNames.length} system icons.`);
  process.exit(0);
}

const failures = [];

for (const [fileName, actual] of generatedSnapshots) {
  const snapshotPath = resolve(snapshotDir, fileName);

  if (!existsSync(snapshotPath)) {
    failures.push(`${fileName} is missing`);
    continue;
  }

  if (!readFileSync(snapshotPath).equals(actual)) {
    failures.push(`${fileName} differs`);
  }
}

const manifestPath = resolve(snapshotDir, manifestFileName);

if (!existsSync(manifestPath)) {
  failures.push(`${manifestFileName} is missing`);
} else if (readFileSync(manifestPath, 'utf8') !== manifestContent) {
  failures.push(`${manifestFileName} differs`);
}

if (failures.length > 0) {
  throw new Error(
    `Visual snapshots are not current:\n- ${failures.join('\n- ')}\nRun "npm run snapshot:variants:update" after intentional visual changes.`,
  );
}

console.log(`Visual snapshots: ${expectedFiles.length} sheets, ${systemIconNames.length} system icons.`);
