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
const validateOnly = process.argv.includes('--validate-only');

const variantSuffixes = [
  {
    suffix: 'Regular',
    style: 'regular',
  },
];

const componentFiles = readdirSync(componentsDir)
  .filter((file) => file.endsWith('.vue') && file !== 'icon.vue')
  .sort((left, right) => left.localeCompare(right));

const toPascalCase = (value) => value.replace(/(^\w|[-_]\w)/g, (part) => part.replace(/[-_]/g, '').toUpperCase());

const parseComponentName = (fileName) => {
  const componentName = fileName.replace(/\.vue$/, '');
  const matchedVariant = variantSuffixes.find(({ suffix }) => componentName.endsWith(suffix));

  if (!matchedVariant) {
    return {
      componentName,
      iconName: componentName,
      exportName: `Vif${toPascalCase(componentName)}Icon`,
      style: 'solid',
    };
  }

  const baseName = componentName.slice(0, -matchedVariant.suffix.length);

  return {
    componentName,
    iconName: baseName,
    exportName: `Vif${toPascalCase(baseName)}${toPascalCase(matchedVariant.style)}Icon`,
    style: matchedVariant.style,
  };
};

const componentEntries = componentFiles.map(parseComponentName);
const iconNames = componentEntries.filter((entry) => entry.style === 'solid').map((entry) => entry.iconName);

const indexContent = `export { default as VueIconify } from '@/lib/components/icon.vue';\n\nexport {\n  iconGroups,\n  iconNames,\n  icons,\n  iconCatalog,\n  coreIconNames,\n  dualStyleCoreIconNames,\n  showcaseIconEntries,\n} from '@/lib/iconMeta';\nexport type { IconName, IconCatalogEntry, IconShowcaseEntry } from '@/lib/iconMeta';\n`;

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

const compareIconCatalog = (iconNames, iconCatalog, componentEntries) => {
  const catalogNames = Object.keys(iconCatalog).sort((left, right) => left.localeCompare(right));
  const componentSet = new Set(iconNames);
  const catalogSet = new Set(catalogNames);
  const componentVariantsByIcon = componentEntries.reduce((variantsByIcon, entry) => {
    const currentVariants = variantsByIcon.get(entry.iconName) ?? [];
    currentVariants.push(entry.style);
    variantsByIcon.set(entry.iconName, currentVariants);
    return variantsByIcon;
  }, new Map());

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

    if (!['solid', 'regular'].includes(entry.style)) {
      throw new Error(`Icon catalog entry "${iconName}" has unsupported style "${entry.style}".`);
    }

    if (entry.variants !== undefined) {
      if (!Array.isArray(entry.variants) || entry.variants.length === 0) {
        throw new Error(`Icon catalog entry "${iconName}" has malformed variants metadata.`);
      }

      if (!entry.variants.every((variant) => ['solid', 'regular'].includes(variant))) {
        throw new Error(`Icon catalog entry "${iconName}" contains unsupported variants.`);
      }

      if (new Set(entry.variants).size !== entry.variants.length) {
        throw new Error(`Icon catalog entry "${iconName}" contains duplicate variants.`);
      }
    }

    const declaredVariants = entry.variants ?? [entry.style];
    const componentVariants = [...new Set(componentVariantsByIcon.get(iconName) ?? ['solid'])];

    if (
      declaredVariants.length !== componentVariants.length ||
      declaredVariants.some((variant) => !componentVariants.includes(variant))
    ) {
      throw new Error(
        `Icon catalog entry "${iconName}" variants do not match components. Expected ${componentVariants.join(', ')}, got ${declaredVariants.join(', ')}`,
      );
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
  compareIconCatalog(iconNames, iconCatalog, componentEntries);
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
