import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , iconName, categoryId, legacyVariantArg] = process.argv;

const rootDir = process.cwd();
const componentsDir = resolve(rootDir, 'src/lib/components');
const iconMetaPath = resolve(rootDir, 'src/lib/iconMeta.json');
const iconCatalogPath = resolve(rootDir, 'src/lib/iconCatalog.json');
const componentPath = resolve(componentsDir, `${iconName}.vue`);
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!iconName || !categoryId) {
  fail('Usage: npm run create-icon -- <iconName> <categoryId>');
}

if (!/^[a-z][A-Za-z0-9]*$/.test(iconName)) {
  fail('Icon name must be lowerCamelCase, for example: externalLink');
}

if (legacyVariantArg && legacyVariantArg !== 'solid') {
  fail('New icons are scaffolded as solid-only for now. Omit the variant argument.');
}

const iconGroups = JSON.parse(readFileSync(iconMetaPath, 'utf8'));
const iconCatalog = JSON.parse(readFileSync(iconCatalogPath, 'utf8'));
const targetGroup = iconGroups.find((group) => group.id === categoryId);

if (!targetGroup) {
  const availableGroups = iconGroups.map((group) => group.id).join(', ');
  fail(`Unknown category "${categoryId}". Available categories: ${availableGroups}`);
}

if (existsSync(componentPath)) {
  fail(`Component already exists: src/lib/components/${iconName}.vue`);
}

const duplicateGroup = iconGroups.find((group) => group.icons.includes(iconName));

if (duplicateGroup) {
  fail(`Icon "${iconName}" already exists in metadata group "${duplicateGroup.id}".`);
}

if (iconCatalog[iconName]) {
  fail(`Icon "${iconName}" already exists in src/lib/iconCatalog.json.`);
}

const toTitleCase = (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (part) => part.toUpperCase());

const toKeywords = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(' ')
    .filter(Boolean);

const componentTemplate = `<template>
    <svg v-bind="iconSvgAttrs" :width="size" :height="size">
        <!-- Replace the placeholder path with the final icon geometry. -->
        <path fill='currentColor' d='' />
    </svg>
</template>

<script setup lang="ts">
import { iconSizeDefaults, iconSvgAttrs, type IconSizeProps } from './_shared';

withDefaults(defineProps<IconSizeProps>(), iconSizeDefaults);
</script>
`;

writeFileSync(componentPath, componentTemplate);

const nextIconGroups = iconGroups.map((group) =>
  group.id === categoryId
    ? {
        ...group,
        icons: [...group.icons, iconName].sort((left, right) => left.localeCompare(right)),
      }
    : group,
);

writeFileSync(iconMetaPath, `${JSON.stringify(nextIconGroups, null, 4)}\n`);

const nextIconCatalog = {
  ...iconCatalog,
  [iconName]: {
    title: toTitleCase(iconName),
    keywords: toKeywords(iconName),
    style: 'solid',
  },
};

writeFileSync(iconCatalogPath, `${JSON.stringify(nextIconCatalog, null, 4)}\n`);

console.log(`Created src/lib/components/${iconName}.vue`);
console.log(`Added "${iconName}" to src/lib/iconMeta.json under "${categoryId}"`);
console.log(`Seeded "${iconName}" in src/lib/iconCatalog.json as "${toTitleCase(iconName)}" (solid)`);
console.log('Next steps:');
console.log(`1. Draw the final SVG path in src/lib/components/${iconName}.vue`);
console.log('2. Refine title and keywords in src/lib/iconCatalog.json if needed');
console.log('3. Run `npm run generate`');
console.log('4. Run `npm run validate-icons && npm run smoke`');
