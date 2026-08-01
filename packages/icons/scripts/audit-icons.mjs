import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { format } from 'prettier';

const rootDir = process.cwd();
const componentsDir = resolve(rootDir, 'src/lib/components');
const outputPath = resolve(rootDir, 'src/lib/iconAudit.json');
const metadataPath = resolve(rootDir, 'src/lib/iconMeta.json');
const catalogPath = resolve(rootDir, 'src/lib/iconCatalog.json');
const offsetsPath = resolve(rootDir, 'src/lib/iconOpticalOffsets.json');
const showcasePath = resolve(rootDir, 'src/lib/iconShowcase.json');
const referenceSetPath = resolve(rootDir, 'src/lib/iconReferenceSet.json');
const migrationBatch02Path = resolve(rootDir, 'src/lib/iconMigrationBatch02.json');
const migrationBatch03Path = resolve(rootDir, 'src/lib/iconMigrationBatch03.json');
const migrationBatch04Path = resolve(rootDir, 'src/lib/iconMigrationBatch04.json');
const migrationBatch05Path = resolve(rootDir, 'src/lib/iconMigrationBatch05.json');
const migrationBatch06Path = resolve(rootDir, 'src/lib/iconMigrationBatch06.json');
const migrationBatch07Path = resolve(rootDir, 'src/lib/iconMigrationBatch07.json');
const migrationBatch08Path = resolve(rootDir, 'src/lib/iconMigrationBatch08.json');
const migrationBatch09Path = resolve(rootDir, 'src/lib/iconMigrationBatch09.json');
const migrationBatch10Path = resolve(rootDir, 'src/lib/iconMigrationBatch10.json');
const migrationBatch11Path = resolve(rootDir, 'src/lib/iconMigrationBatch11.json');
const migrationBatch12Path = resolve(rootDir, 'src/lib/iconMigrationBatch12.json');
const migrationBatch13Path = resolve(rootDir, 'src/lib/iconMigrationBatch13.json');
const migrationBatch14Path = resolve(rootDir, 'src/lib/iconMigrationBatch14.json');
const migrationBatch15Path = resolve(rootDir, 'src/lib/iconMigrationBatch15.json');
const migrationBatch16Path = resolve(rootDir, 'src/lib/iconMigrationBatch16.json');
const migrationBatch17Path = resolve(rootDir, 'src/lib/iconMigrationBatch17.json');
const migrationBatch18Path = resolve(rootDir, 'src/lib/iconMigrationBatch18.json');
const migrationBatch19Path = resolve(rootDir, 'src/lib/iconMigrationBatch19.json');
const validateOnly = process.argv.includes('--validate-only');
const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const offsets = JSON.parse(readFileSync(offsetsPath, 'utf8'));
const showcase = JSON.parse(readFileSync(showcasePath, 'utf8'));
const referenceSet = JSON.parse(readFileSync(referenceSetPath, 'utf8'));
const migrationBatch02 = JSON.parse(readFileSync(migrationBatch02Path, 'utf8'));
const migrationBatch03 = JSON.parse(readFileSync(migrationBatch03Path, 'utf8'));
const migrationBatch04 = JSON.parse(readFileSync(migrationBatch04Path, 'utf8'));
const migrationBatch05 = JSON.parse(readFileSync(migrationBatch05Path, 'utf8'));
const migrationBatch06 = JSON.parse(readFileSync(migrationBatch06Path, 'utf8'));
const migrationBatch07 = JSON.parse(readFileSync(migrationBatch07Path, 'utf8'));
const migrationBatch08 = JSON.parse(readFileSync(migrationBatch08Path, 'utf8'));
const migrationBatch09 = JSON.parse(readFileSync(migrationBatch09Path, 'utf8'));
const migrationBatch10 = JSON.parse(readFileSync(migrationBatch10Path, 'utf8'));
const migrationBatch11 = JSON.parse(readFileSync(migrationBatch11Path, 'utf8'));
const migrationBatch12 = JSON.parse(readFileSync(migrationBatch12Path, 'utf8'));
const migrationBatch13 = JSON.parse(readFileSync(migrationBatch13Path, 'utf8'));
const migrationBatch14 = JSON.parse(readFileSync(migrationBatch14Path, 'utf8'));
const migrationBatch15 = JSON.parse(readFileSync(migrationBatch15Path, 'utf8'));
const migrationBatch16 = JSON.parse(readFileSync(migrationBatch16Path, 'utf8'));
const migrationBatch17 = JSON.parse(readFileSync(migrationBatch17Path, 'utf8'));
const migrationBatch18 = JSON.parse(readFileSync(migrationBatch18Path, 'utf8'));
const migrationBatch19 = JSON.parse(readFileSync(migrationBatch19Path, 'utf8'));
const outlineSource = readFileSync(resolve(rootDir, 'src/lib/internal/outlineIcon.ts'), 'utf8');
const outlineObjectBody = outlineSource.match(
  /export const outlineGeometry = \{([\s\S]*?)\n\} as const satisfies/,
)?.[1];

if (!outlineObjectBody) {
  throw new Error('Unable to read canonical outline geometry.');
}

const geometryNode = (tag, attrs) => ({ tag, attrs });
const pathNode = (d, attrs = {}) => geometryNode('path', { d, ...attrs });
const lineNode = (x1, y1, x2, y2) => geometryNode('line', { x1, y1, x2, y2 });
const circleNode = (cx, cy, r, attrs = {}) => geometryNode('circle', { cx, cy, r, ...attrs });
const rectNode = (x, y, width, height, rx) => geometryNode('rect', { x, y, width, height, rx });
const polylineNode = (points) => geometryNode('polyline', { points });
const outlineGeometry = Function(
  'path',
  'line',
  'circle',
  'rect',
  'polyline',
  `"use strict"; return ({${outlineObjectBody}});`,
)(pathNode, lineNode, circleNode, rectNode, polylineNode);
const groupByIcon = Object.fromEntries(
  metadata.flatMap((group) => group.icons.map((iconName) => [iconName, group.id])),
);

const files = readdirSync(componentsDir)
  .filter((fileName) => fileName.endsWith('.vue') && fileName !== 'icon.vue')
  .sort((left, right) => left.localeCompare(right));

const getTemplate = (source, iconName) => {
  const template = source.match(/<template>([\s\S]*?)<\/template>/)?.[1].trim();

  if (template) {
    return template;
  }

  const outlineName = source.match(/createOutlineIcon\('([^']+)'\)/)?.[1];
  const geometry = outlineGeometry[outlineName];

  if (!outlineName || !geometry) {
    throw new Error(`Missing template or canonical geometry for "${iconName}".`);
  }

  const serializeAttrs = (attrs) =>
    Object.entries(attrs)
      .map(([name, value]) => `${name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}="${value}"`)
      .join(' ');
  const nodes = geometry.map((node) => `<${node.tag} ${serializeAttrs(node.attrs)} />`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${nodes}</svg>`;
};

const toStaticSvg = (template, iconName) => {
  const explicitViewBox = template.match(/viewBox="([^"]+)"/)?.[1];
  const isOutline = template.includes('v-bind="outlineIconSvgAttrs"');
  const viewBox = explicitViewBox ?? (isOutline ? '0 0 24 24' : '0 0 512 512');

  const withoutExplicitViewBox = template.includes('v-bind=') ? template.replace(/\sviewBox="[^"]+"/, '') : template;

  return withoutExplicitViewBox
    .replace(
      /v-bind="(?:iconSvgAttrs|outlineIconSvgAttrs)"/g,
      `xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" style="color:#000"`,
    )
    .replace(/:width="size"/g, 'width="512"')
    .replace(/:height="size"/g, 'height="512"')
    .replace(/:id="maskId"/g, `id="audit-${iconName}-mask"`)
    .replace(/:mask="`url\(#\$\{maskId\}\)`"/g, `mask="url(#audit-${iconName}-mask)"`)
    .replace(/currentColor/g, '#000');
};

const render = (svg) => {
  return PNG.sync.read(new Resvg(svg, { fitTo: { mode: 'width', value: 512 } }).render().asPng());
};

const analyzePixels = (png) => {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  let inkPixels = 0;
  const occupied = new Uint8Array(png.width * png.height);

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const pixelIndex = y * png.width + x;
      const alpha = png.data[(pixelIndex << 2) + 3];

      if (alpha < 16) {
        continue;
      }

      occupied[pixelIndex] = 1;
      inkPixels += alpha / 255;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX === -1) {
    throw new Error('Rendered SVG has no visible pixels.');
  }

  const internalGaps = [];
  const collectRuns = (length, readPixel) => {
    let seenInk = false;
    let gapStart = -1;

    for (let index = 0; index < length; index += 1) {
      if (readPixel(index)) {
        if (seenInk && gapStart !== -1) {
          internalGaps.push(index - gapStart);
        }

        seenInk = true;
        gapStart = -1;
      } else if (seenInk && gapStart === -1) {
        gapStart = index;
      }
    }
  };

  for (let y = minY; y <= maxY; y += 1) {
    collectRuns(png.width, (x) => occupied[y * png.width + x]);
  }

  for (let x = minX; x <= maxX; x += 1) {
    collectRuns(png.height, (y) => occupied[y * png.width + x]);
  }

  const scale = 24 / 512;
  const width = (maxX - minX + 1) * scale;
  const height = (maxY - minY + 1) * scale;
  const centerX = ((minX + maxX + 1) / 2) * scale;
  const centerY = ((minY + maxY + 1) / 2) * scale;
  const meaningfulGaps = internalGaps.filter((gap) => gap >= 20);

  return {
    bounds: {
      x: +(minX * scale).toFixed(2),
      y: +(minY * scale).toFixed(2),
      width: +width.toFixed(2),
      height: +height.toFixed(2),
    },
    center: {
      x: +centerX.toFixed(2),
      y: +centerY.toFixed(2),
      dx: +(centerX - 12).toFixed(2),
      dy: +(centerY - 12).toFixed(2),
    },
    boundsArea: +(width * height).toFixed(2),
    inkArea: +((inkPixels / (512 * 512)) * 100).toFixed(2),
    minimumGap: meaningfulGaps.length > 0 ? +(Math.min(...meaningfulGaps) * scale).toFixed(2) : null,
  };
};

const getPerceptualHash = (png) => {
  const bits = [];

  for (let cellY = 0; cellY < 16; cellY += 1) {
    for (let cellX = 0; cellX < 16; cellX += 1) {
      let alpha = 0;

      for (let y = cellY * 32; y < (cellY + 1) * 32; y += 1) {
        for (let x = cellX * 32; x < (cellX + 1) * 32; x += 1) {
          alpha += png.data[((y * png.width + x) << 2) + 3];
        }
      }

      bits.push(alpha / (32 * 32) > 72 ? '1' : '0');
    }
  }

  return bits
    .join('')
    .match(/.{4}/g)
    .map((chunk) => Number.parseInt(chunk, 2).toString(16))
    .join('');
};

const parseGeometry = (template) => {
  const primitiveNames = ['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse'];
  const primitiveTypes = Object.fromEntries(
    primitiveNames
      .map((name) => [name, (template.match(new RegExp(`<${name}(?:\\s|>)`, 'g')) ?? []).length])
      .filter(([, count]) => count > 0),
  );
  const strokeWidths = [...template.matchAll(/stroke-width="([^"]+)"/g)].map((match) => Number(match[1]));
  const linecaps = [...template.matchAll(/stroke-linecap="([^"]+)"/g)].map((match) => match[1]);
  const linejoins = [...template.matchAll(/stroke-linejoin="([^"]+)"/g)].map((match) => match[1]);
  const hardcodedColors = [
    ...template.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\))"/g),
  ].map((match) => match[1]);

  return {
    primitiveTypes,
    primitiveCount: Object.values(primitiveTypes).reduce((sum, count) => sum + count, 0),
    usesFill: /fill="currentColor"/.test(template),
    usesStroke: /stroke="currentColor"/.test(template),
    strokeWidths: [...new Set(strokeWidths)],
    linecaps: [...new Set(linecaps)],
    linejoins: [...new Set(linejoins)],
    hardcodedColors: [...new Set(hardcodedColors)],
    forbiddenFeatures: ['script', 'foreignObject', 'image', 'use'].filter((name) =>
      new RegExp(`<${name}(?:\\s|>)`).test(template),
    ),
  };
};

const buildWarnings = (entry) => {
  const warnings = [];
  const centerDistance = Math.hypot(entry.center.dx, entry.center.dy);
  const isCompactDirectional = /^(?:caret|chevron)/.test(entry.icon);

  if (!isCompactDirectional && (entry.bounds.width < 12.5 || entry.bounds.width > 22.5)) {
    warnings.push('bounds-width-outlier');
  }
  if (!isCompactDirectional && (entry.bounds.height < 12.5 || entry.bounds.height > 22.5)) {
    warnings.push('bounds-height-outlier');
  }
  if (!isCompactDirectional && (entry.boundsArea < 170 || entry.boundsArea > 455)) {
    warnings.push('bounds-area-outlier');
  }
  if (entry.inkArea < 4 || entry.inkArea > 55) warnings.push('ink-area-outlier');
  if (centerDistance > 0.7) warnings.push('visual-center-outlier');
  if (entry.minimumGap !== null && entry.minimumGap < 0.8) warnings.push('small-internal-gap');
  if (entry.primitiveCount > 10) warnings.push('excessive-primitives');
  if (entry.hardcodedColors.length > 0) warnings.push('hardcoded-color');
  if (entry.forbiddenFeatures.length > 0) warnings.push('forbidden-svg-feature');
  if (entry.usesStroke && entry.strokeWidths.length === 0) warnings.push('missing-stroke-width');
  if (entry.usesStroke && (!entry.linecaps.includes('round') || !entry.linejoins.includes('round'))) {
    warnings.push('inconsistent-stroke-attributes');
  }

  return warnings;
};

const entries = files.map((fileName) => {
  const icon = fileName.replace(/\.vue$/, '');
  const source = readFileSync(resolve(componentsDir, fileName), 'utf8');
  const template = getTemplate(source, icon);
  const png = render(toStaticSvg(template, icon));
  const entry = {
    icon,
    group: groupByIcon[icon] ?? 'unassigned',
    ...analyzePixels(png),
    ...parseGeometry(template),
    opticalOffset: offsets[icon] ?? { x: 0, y: 0 },
    perceptualHash: getPerceptualHash(png),
  };

  return { ...entry, warnings: buildWarnings(entry) };
});

const iconNames = entries.map((entry) => entry.icon);
const metadataNames = metadata.flatMap((group) => group.icons);
const catalogNames = Object.keys(catalog);
const metadataMismatch = {
  missingFromMetadata: iconNames.filter((icon) => !metadataNames.includes(icon)),
  missingComponents: metadataNames.filter((icon) => !iconNames.includes(icon)),
  missingFromCatalog: iconNames.filter((icon) => !catalogNames.includes(icon)),
  catalogWithoutComponent: catalogNames.filter((icon) => !iconNames.includes(icon)),
};

const entriesByHash = entries.reduce((groups, entry) => {
  groups[entry.perceptualHash] ??= [];
  groups[entry.perceptualHash].push(entry);
  return groups;
}, {});
const exactGeometryGroups = Object.values(entriesByHash)
  .filter((group) => group.length > 1)
  .map((group) => group.map((entry) => entry.icon));
const bitCount = (value) => {
  let current = value;
  let count = 0;

  while (current > 0) {
    count += current & 1;
    current >>= 1;
  }

  return count;
};
const hashDistance = (left, right) => {
  let distance = 0;

  for (let index = 0; index < left.length; index += 1) {
    distance += bitCount(Number.parseInt(left[index], 16) ^ Number.parseInt(right[index], 16));
  }

  return distance;
};
const nearGeometryPairs = [];

for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
    const left = entries[leftIndex];
    const right = entries[rightIndex];
    const distance = hashDistance(left.perceptualHash, right.perceptualHash);

    if (distance > 0 && distance <= 12) {
      nearGeometryPairs.push({ icons: [left.icon, right.icon], distance });
    }
  }
}

const relatedFamilies = [
  ['arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown'],
  ['arrowLeftLong', 'arrowRightLong', 'arrowUpLong', 'arrowDownLong'],
  ['arrowTurnUpLeft', 'arrowTurnUpRight', 'arrowTurnRightUp', 'arrowTurnLeftDown'],
  ['logIn', 'logOut'],
  ['filter', 'funnelX'],
  ['server', 'hardDrive'],
  ['terminal', 'code'],
  ['creditCard', 'wallet', 'receipt'],
  ['building', 'briefcase'],
  ['expand', 'collapse'],
  ['chevronLeft', 'chevronRight', 'chevronUp', 'chevronDown'],
  ['caretLeft', 'caretRight', 'caretUp', 'caretDown'],
  ['user', 'userPlus', 'userMinus', 'userCheck'],
  ['file', 'fileText'],
  ['folder', 'folderOpen'],
  ['lock', 'unlock'],
  ['download', 'upload'],
  ['checkCircle', 'xCircle', 'infoCircle', 'questionCircle'],
  ['eye', 'eyeSlash'],
  ['clock', 'history'],
  ['refresh', 'rotateRight', 'circleNotch'],
  ['copy', 'clipboard'],
  ['inbox', 'archive'],
];
const relatedVariantWarnings = relatedFamilies.flatMap((familyIcons) => {
  const familyEntries = familyIcons.map((iconName) => entries.find((entry) => entry.icon === iconName)).filter(Boolean);
  const areas = familyEntries.map((entry) => entry.boundsArea);
  const renderTypes = new Set(
    familyEntries.map((entry) => `${entry.usesFill ? 'fill' : ''}${entry.usesStroke ? 'stroke' : ''}`),
  );
  const areaRatio = Math.max(...areas) / Math.min(...areas);
  const reasons = [];

  if (areaRatio > 1.35) reasons.push(`bounds area ratio ${areaRatio.toFixed(2)}`);
  if (renderTypes.size > 1) reasons.push('mixed fill/stroke construction');

  return reasons.length > 0 ? [{ icons: familyIcons, reasons }] : [];
});
const showcaseNames = showcase.map((entry) => entry.icon);
const duplicateReferenceIcons = [
  ...new Set(referenceSet.filter((icon, index) => referenceSet.indexOf(icon) !== index)),
];
const showcaseConsistency = {
  missingIcons: iconNames.filter((icon) => !showcaseNames.includes(icon)),
  unknownIcons: showcaseNames.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(showcaseNames.filter((icon, index) => showcaseNames.indexOf(icon) !== index))],
  invalidReferenceIcons: referenceSet.filter((icon) => !iconNames.includes(icon)),
  duplicateReferenceIcons,
  referenceCountMismatch: referenceSet.length === 30 ? [] : [referenceSet.length],
  referenceStyleMismatch: referenceSet.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch02Consistency = {
  invalidIcons: migrationBatch02.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch02.filter((icon, index) => migrationBatch02.indexOf(icon) !== index))],
  countMismatch: migrationBatch02.length === 8 ? [] : [migrationBatch02.length],
  styleMismatch: migrationBatch02.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch03Consistency = {
  invalidIcons: migrationBatch03.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch03.filter((icon, index) => migrationBatch03.indexOf(icon) !== index))],
  countMismatch: migrationBatch03.length === 7 ? [] : [migrationBatch03.length],
  styleMismatch: migrationBatch03.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch04Consistency = {
  invalidIcons: migrationBatch04.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch04.filter((icon, index) => migrationBatch04.indexOf(icon) !== index))],
  countMismatch: migrationBatch04.length === 7 ? [] : [migrationBatch04.length],
  styleMismatch: migrationBatch04.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch05Consistency = {
  invalidIcons: migrationBatch05.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch05.filter((icon, index) => migrationBatch05.indexOf(icon) !== index))],
  countMismatch: migrationBatch05.length === 2 ? [] : [migrationBatch05.length],
  styleMismatch: migrationBatch05.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch06Consistency = {
  invalidIcons: migrationBatch06.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch06.filter((icon, index) => migrationBatch06.indexOf(icon) !== index))],
  countMismatch: migrationBatch06.length === 3 ? [] : [migrationBatch06.length],
  styleMismatch: migrationBatch06.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch07Consistency = {
  invalidIcons: migrationBatch07.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch07.filter((icon, index) => migrationBatch07.indexOf(icon) !== index))],
  countMismatch: migrationBatch07.length === 2 ? [] : [migrationBatch07.length],
  styleMismatch: migrationBatch07.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch08Consistency = {
  invalidIcons: migrationBatch08.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch08.filter((icon, index) => migrationBatch08.indexOf(icon) !== index))],
  countMismatch: migrationBatch08.length === 3 ? [] : [migrationBatch08.length],
  styleMismatch: migrationBatch08.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch09Consistency = {
  invalidIcons: migrationBatch09.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch09.filter((icon, index) => migrationBatch09.indexOf(icon) !== index))],
  countMismatch: migrationBatch09.length === 2 ? [] : [migrationBatch09.length],
  styleMismatch: migrationBatch09.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch10Consistency = {
  invalidIcons: migrationBatch10.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch10.filter((icon, index) => migrationBatch10.indexOf(icon) !== index))],
  countMismatch: migrationBatch10.length === 2 ? [] : [migrationBatch10.length],
  styleMismatch: migrationBatch10.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch11Consistency = {
  invalidIcons: migrationBatch11.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch11.filter((icon, index) => migrationBatch11.indexOf(icon) !== index))],
  countMismatch: migrationBatch11.length === 4 ? [] : [migrationBatch11.length],
  styleMismatch: migrationBatch11.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch12Consistency = {
  invalidIcons: migrationBatch12.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch12.filter((icon, index) => migrationBatch12.indexOf(icon) !== index))],
  countMismatch: migrationBatch12.length === 4 ? [] : [migrationBatch12.length],
  styleMismatch: migrationBatch12.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch13Consistency = {
  invalidIcons: migrationBatch13.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch13.filter((icon, index) => migrationBatch13.indexOf(icon) !== index))],
  countMismatch: migrationBatch13.length === 2 ? [] : [migrationBatch13.length],
  styleMismatch: migrationBatch13.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch14Consistency = {
  invalidIcons: migrationBatch14.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch14.filter((icon, index) => migrationBatch14.indexOf(icon) !== index))],
  countMismatch: migrationBatch14.length === 2 ? [] : [migrationBatch14.length],
  styleMismatch: migrationBatch14.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch15Consistency = {
  invalidIcons: migrationBatch15.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch15.filter((icon, index) => migrationBatch15.indexOf(icon) !== index))],
  countMismatch: migrationBatch15.length === 2 ? [] : [migrationBatch15.length],
  styleMismatch: migrationBatch15.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch16Consistency = {
  invalidIcons: migrationBatch16.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch16.filter((icon, index) => migrationBatch16.indexOf(icon) !== index))],
  countMismatch: migrationBatch16.length === 2 ? [] : [migrationBatch16.length],
  styleMismatch: migrationBatch16.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch17Consistency = {
  invalidIcons: migrationBatch17.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch17.filter((icon, index) => migrationBatch17.indexOf(icon) !== index))],
  countMismatch: migrationBatch17.length === 3 ? [] : [migrationBatch17.length],
  styleMismatch: migrationBatch17.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch18Consistency = {
  invalidIcons: migrationBatch18.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch18.filter((icon, index) => migrationBatch18.indexOf(icon) !== index))],
  countMismatch: migrationBatch18.length === 2 ? [] : [migrationBatch18.length],
  styleMismatch: migrationBatch18.filter((icon) => catalog[icon]?.style !== 'outline'),
};
const migrationBatch19Consistency = {
  invalidIcons: migrationBatch19.filter((icon) => !iconNames.includes(icon)),
  duplicates: [...new Set(migrationBatch19.filter((icon, index) => migrationBatch19.indexOf(icon) !== index))],
  countMismatch: migrationBatch19.length === 2 ? [] : [migrationBatch19.length],
  styleMismatch: migrationBatch19.filter((icon) => catalog[icon]?.style !== 'outline'),
};

const result = {
  generatedAt: new Date().toISOString(),
  summary: {
    iconCount: entries.length,
    fillOnly: entries.filter((entry) => entry.usesFill && !entry.usesStroke).length,
    strokeOnly: entries.filter((entry) => entry.usesStroke && !entry.usesFill).length,
    mixed: entries.filter((entry) => entry.usesStroke && entry.usesFill).length,
    opticalOffsetCount: entries.filter((entry) => entry.opticalOffset.x !== 0 || entry.opticalOffset.y !== 0).length,
    suspiciousCount: entries.filter((entry) => entry.warnings.length > 0).length,
    strokeWidths: [...new Set(entries.flatMap((entry) => entry.strokeWidths))].sort((left, right) => left - right),
    primitiveTypes: [...new Set(entries.flatMap((entry) => Object.keys(entry.primitiveTypes)))].sort(),
  },
  metadataMismatch,
  exactGeometryGroups,
  nearGeometryPairs,
  relatedVariantWarnings,
  showcaseConsistency,
  migrationBatch02Consistency,
  migrationBatch03Consistency,
  migrationBatch04Consistency,
  migrationBatch05Consistency,
  migrationBatch06Consistency,
  migrationBatch07Consistency,
  migrationBatch08Consistency,
  migrationBatch09Consistency,
  migrationBatch10Consistency,
  migrationBatch11Consistency,
  migrationBatch12Consistency,
  migrationBatch13Consistency,
  migrationBatch14Consistency,
  migrationBatch15Consistency,
  migrationBatch16Consistency,
  migrationBatch17Consistency,
  migrationBatch18Consistency,
  migrationBatch19Consistency,
  icons: entries,
};
const output = await format(JSON.stringify(result), { parser: 'json', printWidth: 120 });

if (Object.values(metadataMismatch).some((items) => items.length > 0)) {
  throw new Error(`Metadata/catalog mismatch: ${JSON.stringify(metadataMismatch)}`);
}

if (Object.values(showcaseConsistency).some((items) => items.length > 0)) {
  throw new Error(`Showcase/reference-set mismatch: ${JSON.stringify(showcaseConsistency)}`);
}

if (Object.values(migrationBatch02Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 02 mismatch: ${JSON.stringify(migrationBatch02Consistency)}`);
}

if (Object.values(migrationBatch03Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 03 mismatch: ${JSON.stringify(migrationBatch03Consistency)}`);
}

if (Object.values(migrationBatch04Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 04 mismatch: ${JSON.stringify(migrationBatch04Consistency)}`);
}

if (Object.values(migrationBatch05Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 05 mismatch: ${JSON.stringify(migrationBatch05Consistency)}`);
}

if (Object.values(migrationBatch06Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 06 mismatch: ${JSON.stringify(migrationBatch06Consistency)}`);
}

if (Object.values(migrationBatch07Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 07 mismatch: ${JSON.stringify(migrationBatch07Consistency)}`);
}

if (Object.values(migrationBatch08Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 08 mismatch: ${JSON.stringify(migrationBatch08Consistency)}`);
}

if (Object.values(migrationBatch09Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 09 mismatch: ${JSON.stringify(migrationBatch09Consistency)}`);
}

if (Object.values(migrationBatch10Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 10 mismatch: ${JSON.stringify(migrationBatch10Consistency)}`);
}

if (Object.values(migrationBatch11Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 11 mismatch: ${JSON.stringify(migrationBatch11Consistency)}`);
}

if (Object.values(migrationBatch12Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 12 mismatch: ${JSON.stringify(migrationBatch12Consistency)}`);
}

if (Object.values(migrationBatch13Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 13 mismatch: ${JSON.stringify(migrationBatch13Consistency)}`);
}

if (Object.values(migrationBatch14Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 14 mismatch: ${JSON.stringify(migrationBatch14Consistency)}`);
}

if (Object.values(migrationBatch15Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 15 mismatch: ${JSON.stringify(migrationBatch15Consistency)}`);
}

if (Object.values(migrationBatch16Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 16 mismatch: ${JSON.stringify(migrationBatch16Consistency)}`);
}

if (Object.values(migrationBatch17Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 17 mismatch: ${JSON.stringify(migrationBatch17Consistency)}`);
}

if (Object.values(migrationBatch18Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 18 mismatch: ${JSON.stringify(migrationBatch18Consistency)}`);
}

if (Object.values(migrationBatch19Consistency).some((items) => items.length > 0)) {
  throw new Error(`Migration batch 19 mismatch: ${JSON.stringify(migrationBatch19Consistency)}`);
}

if (validateOnly) {
  const current = JSON.parse(readFileSync(outputPath, 'utf8'));
  const { generatedAt: currentGeneratedAt, ...comparableCurrent } = current;
  const { generatedAt: nextGeneratedAt, ...comparableResult } = result;
  void currentGeneratedAt;
  void nextGeneratedAt;

  if (JSON.stringify(comparableCurrent) !== JSON.stringify(comparableResult)) {
    throw new Error('src/lib/iconAudit.json is out of date. Run `npm run audit:icons`.');
  }
} else {
  writeFileSync(outputPath, output);
  console.log(`Audited ${entries.length} icons: ${result.summary.suspiciousCount} require visual review.`);
}
