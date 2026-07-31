import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { format } from 'prettier';

const rootDir = process.cwd();
const componentsDir = resolve(rootDir, 'src/lib/components');
const referenceSetPath = resolve(rootDir, 'src/lib/iconReferenceSet.json');
const outputPath = resolve(rootDir, 'src/lib/iconReferenceBefore.json');
const referenceSet = JSON.parse(readFileSync(referenceSetPath, 'utf8'));
const force = process.argv.includes('--force');

if (existsSync(outputPath) && !force) {
  throw new Error(
    'Reference baseline already exists. Pass --force only when intentionally starting a new redesign batch.',
  );
}

const toStaticSvg = (source, iconName) => {
  const template = source.match(/<template>([\s\S]*?)<\/template>/)?.[1].trim();

  if (!template) {
    throw new Error(`Missing template for "${iconName}".`);
  }

  return template
    .replace(/v-bind="iconSvgAttrs"/g, 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none"')
    .replace(/:width="size"/g, 'width="100%"')
    .replace(/:height="size"/g, 'height="100%"')
    .replace(/:id="maskId"/g, `id="before-${iconName}-mask"`)
    .replace(/:mask="`url\(#\$\{maskId\}\)`"/g, `mask="url(#before-${iconName}-mask)"`)
    .replace(/currentColor/g, 'var(--audit-icon-color, currentColor)');
};

const snapshots = Object.fromEntries(
  referenceSet.map((iconName) => {
    const source = readFileSync(resolve(componentsDir, `${iconName}.vue`), 'utf8');
    return [iconName, toStaticSvg(source, iconName)];
  }),
);

writeFileSync(outputPath, await format(JSON.stringify(snapshots), { parser: 'json', printWidth: 120 }));
console.log(`Captured ${referenceSet.length} reference icons in src/lib/iconReferenceBefore.json.`);
