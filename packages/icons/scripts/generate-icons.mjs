import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const componentsDir = resolve(rootDir, 'src/lib/components');
const iconsJsonPath = resolve(rootDir, 'src/lib/icons.json');
const indexPath = resolve(rootDir, 'src/lib/index.ts');
const readmePath = resolve(rootDir, 'README.md');
const iconMetaPath = resolve(rootDir, 'src/lib/iconMeta.json');
const iconCatalogPath = resolve(rootDir, 'src/lib/iconCatalog.json');
const iconCorePath = resolve(rootDir, 'src/lib/iconCore.json');
const solidIconDataPath = resolve(rootDir, 'src/lib/internal/solidIconData.json');
const validateOnly = process.argv.includes('--validate-only');

const componentFiles = readdirSync(componentsDir)
  .filter((file) => file.endsWith('.vue') && file !== 'icon.vue')
  .sort((left, right) => left.localeCompare(right));

const iconNames = componentFiles.map((fileName) => fileName.replace(/\.vue$/, ''));

const indexContent = `export { default as VueIconify } from '@/lib/components/icon.vue';\n\nexport { iconGroups, iconNames, icons, iconCatalog, coreIconNames, showcaseIconEntries } from '@/lib/iconMeta';\nexport type { IconName, IconCatalogEntry, IconShowcaseEntry } from '@/lib/iconMeta';\nexport { iconVariants, outlineIconVariants } from '@/lib/iconVariants';\nexport type { IconVariant, OutlineIconVariant } from '@/lib/iconVariants';\n`;

const iconsContent = `${JSON.stringify({ list: iconNames }, null, 2)}\n`;

const replaceSection = (content, marker, replacement) => {
  const startMarker = `<!-- ${marker}:start -->`;
  const endMarker = `<!-- ${marker}:end -->`;
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 && endIndex === -1) {
    return content;
  }

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`README marker "${marker}" is malformed.`);
  }

  const before = content.slice(0, startIndex + startMarker.length);
  const after = content.slice(endIndex);

  return `${before}\n\n${replacement}\n\n${after}`;
};

const formatBullets = (items) => items.map((item) => `- \`${item}\``).join('\n');

const compareIconSets = (iconNames, iconGroups) => {
  const metadataIcons = iconGroups.flatMap((group) => group.icons);
  const componentSet = new Set(iconNames);
  const metadataSet = new Set(metadataIcons);

  const missingInMetadata = iconNames.filter((iconName) => !metadataSet.has(iconName));
  const missingComponentFiles = metadataIcons.filter((iconName) => !componentSet.has(iconName));
  const duplicateMetadataIcons = metadataIcons.filter((iconName, index) => metadataIcons.indexOf(iconName) !== index);

  if (missingInMetadata.length > 0) {
    throw new Error(`Icons missing from src/lib/iconMeta.json: ${missingInMetadata.join(', ')}`);
  }

  if (missingComponentFiles.length > 0) {
    throw new Error(`Metadata references missing icon components: ${[...new Set(missingComponentFiles)].join(', ')}`);
  }

  if (duplicateMetadataIcons.length > 0) {
    throw new Error(
      `Duplicate icon names found in src/lib/iconMeta.json: ${[...new Set(duplicateMetadataIcons)].join(', ')}`,
    );
  }
};

const compareIconCatalog = (iconNames, iconCatalog) => {
  const catalogNames = Object.keys(iconCatalog).sort((left, right) => left.localeCompare(right));
  const componentSet = new Set(iconNames);
  const catalogSet = new Set(catalogNames);

  const missingInCatalog = iconNames.filter((iconName) => !catalogSet.has(iconName));
  const missingComponents = catalogNames.filter((iconName) => !componentSet.has(iconName));

  if (missingInCatalog.length > 0) {
    throw new Error(`Icons missing from src/lib/iconCatalog.json: ${missingInCatalog.join(', ')}`);
  }

  if (missingComponents.length > 0) {
    throw new Error(`Catalog references missing icon components: ${missingComponents.join(', ')}`);
  }

  for (const iconName of catalogNames) {
    const entry = iconCatalog[iconName];

    if (!entry || typeof entry !== 'object') {
      throw new Error(`Icon catalog entry "${iconName}" must be an object.`);
    }

    if (typeof entry.title !== 'string' || entry.title.trim().length === 0) {
      throw new Error(`Icon catalog entry "${iconName}" must include a non-empty title.`);
    }

    if (!Array.isArray(entry.keywords) || entry.keywords.length === 0) {
      throw new Error(`Icon catalog entry "${iconName}" must include at least one keyword.`);
    }

    const normalizedKeywords = entry.keywords.map((keyword) => keyword.trim().toLowerCase()).filter(Boolean);

    if (normalizedKeywords.length !== entry.keywords.length) {
      throw new Error(`Icon catalog entry "${iconName}" contains empty keywords.`);
    }

    if (new Set(normalizedKeywords).size !== normalizedKeywords.length) {
      throw new Error(`Icon catalog entry "${iconName}" contains duplicate keywords.`);
    }

    if (!Array.isArray(entry.variants) || entry.variants.length === 0) {
      throw new Error(`Icon catalog entry "${iconName}" must include variants.`);
    }

    const compatibilityStyle = entry.brand ? 'solid' : 'outline';

    if (entry.style !== compatibilityStyle) {
      throw new Error(
        `Icon catalog entry "${iconName}" must keep deprecated style "${compatibilityStyle}" for compatibility.`,
      );
    }

    const requiredVariants = entry.brand ? ['solid'] : ['regular', 'light', 'thin'];
    const allowedVariants = ['solid', 'regular', 'light', 'thin'];

    if (
      requiredVariants.some((variant) => !entry.variants.includes(variant)) ||
      entry.variants.some((variant) => !allowedVariants.includes(variant)) ||
      new Set(entry.variants).size !== entry.variants.length ||
      (entry.brand && entry.variants.length !== 1)
    ) {
      throw new Error(
        `Icon catalog entry "${iconName}" has an invalid variant set for ${entry.brand ? 'a brand' : 'a system icon'}.`,
      );
    }
  }

  const solidIconData = JSON.parse(readFileSync(solidIconDataPath, 'utf8'));
  const catalogSolidIcons = iconNames
    .filter((iconName) => !iconCatalog[iconName].brand && iconCatalog[iconName].variants.includes('solid'))
    .sort((left, right) => left.localeCompare(right));
  const authoredSolidIcons = Object.keys(solidIconData).sort((left, right) => left.localeCompare(right));

  if (JSON.stringify(catalogSolidIcons) !== JSON.stringify(authoredSolidIcons)) {
    throw new Error('Authored solid geometry and catalog variant metadata do not match.');
  }

  for (const [iconName, solidIcon] of Object.entries(solidIconData)) {
    if (solidIcon.viewBox !== '0 0 24 24') {
      throw new Error(`Solid icon "${iconName}" must use the canonical 24-unit viewBox.`);
    }

    if (typeof solidIcon.body !== 'string' || !solidIcon.body.includes('currentColor')) {
      throw new Error(`Solid icon "${iconName}" must contain currentColor geometry.`);
    }

    if (/<script|\son[a-z]+=|javascript:/i.test(solidIcon.body)) {
      throw new Error(`Solid icon "${iconName}" contains unsafe SVG markup.`);
    }
  }
};

const compareCoreSet = (iconNames, coreIconNames) => {
  const componentSet = new Set(iconNames);
  const seen = new Set();
  const duplicates = [];

  for (const iconName of coreIconNames) {
    if (!componentSet.has(iconName)) {
      throw new Error(`Core set references missing icon component: ${iconName}`);
    }

    if (seen.has(iconName)) {
      duplicates.push(iconName);
    }

    seen.add(iconName);
  }

  if (duplicates.length > 0) {
    throw new Error(`Duplicate icon names found in src/lib/iconCore.json: ${[...new Set(duplicates)].join(', ')}`);
  }
};

const buildReadme = async () => {
  const readmeContent = readFileSync(readmePath, 'utf8');
  const iconGroups = JSON.parse(readFileSync(iconMetaPath, 'utf8'));
  const iconCatalog = JSON.parse(readFileSync(iconCatalogPath, 'utf8'));
  const coreIconNames = JSON.parse(readFileSync(iconCorePath, 'utf8'));

  compareIconSets(iconNames, iconGroups);
  compareIconCatalog(iconNames, iconCatalog);
  compareCoreSet(iconNames, coreIconNames);

  const categorySummarySection = iconGroups
    .map((group) => `- **${group.title}**: ${group.icons.length} icons`)
    .join('\n');

  const iconNamesSection = iconGroups.map((group) => `${group.title}:\n\n${formatBullets(group.icons)}`).join('\n\n');
  const exportNames = ['VueIconify', 'icons'];
  const exportSection = formatBullets(exportNames);
  const hasGeneratedMarkers =
    readmeContent.includes('<!-- generated-category-summary:start -->') &&
    readmeContent.includes('<!-- generated-category-summary:end -->') &&
    readmeContent.includes('<!-- generated-icon-names:start -->') &&
    readmeContent.includes('<!-- generated-icon-names:end -->') &&
    readmeContent.includes('<!-- generated-exports:start -->') &&
    readmeContent.includes('<!-- generated-exports:end -->');

  if (!hasGeneratedMarkers) {
    return;
  }

  let nextReadme = replaceSection(readmeContent, 'generated-category-summary', categorySummarySection);
  nextReadme = replaceSection(nextReadme, 'generated-icon-names', iconNamesSection);
  nextReadme = replaceSection(nextReadme, 'generated-exports', exportSection);

  if (validateOnly) {
    if (readmeContent !== nextReadme) {
      throw new Error('README.md is out of date. Run `npm run generate`.');
    }

    return;
  }

  writeFileSync(readmePath, nextReadme);
};

if (validateOnly) {
  const currentIndexContent = readFileSync(indexPath, 'utf8');
  const currentIconsContent = readFileSync(iconsJsonPath, 'utf8');

  if (currentIndexContent !== indexContent) {
    throw new Error('src/lib/index.ts is out of date. Run `npm run generate`.');
  }

  if (currentIconsContent !== iconsContent) {
    throw new Error('src/lib/icons.json is out of date. Run `npm run generate`.');
  }
} else {
  writeFileSync(indexPath, indexContent);
  writeFileSync(iconsJsonPath, iconsContent);
}

await buildReadme();
