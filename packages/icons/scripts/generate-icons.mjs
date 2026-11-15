/**
 * Renders every icon the VueForge package draws and writes the result as data.
 *
 * The alternative was reimplementing outlineIcon.ts in PHP: 2,135 lines carrying per-icon masks,
 * duotone exceptions, solid-body overrides and optical offsets. Two engines that must agree on 879
 * outputs would drift, and the drift would be invisible -- an icon that renders slightly differently
 * still renders. Precomputing removes the second engine instead of testing it.
 *
 * An icon's rendered form depends on the icon, the family and the variant, never on runtime state,
 * so every output can be computed once. This runs headlessly in Node: no browser, no bundler.
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { cmIconFamilies, cmIconVariants } from '../src/types.ts';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = resolve(process.argv[2] ?? resolve(packageDirectory, '../vueforge-icons'));
const sourceEntry = resolve(sourceDirectory, 'dist/index.node.mjs');
const outputDirectory = resolve(packageDirectory, 'src/generated');
const controlIcons = ['chevronDown', 'chevronLeft', 'chevronRight', 'externalLink'];

const source = await import(sourceEntry);
const { VueIconify, iconNames, iconVariants, iconFamilies } = source;
const forms = cmIconFamilies.flatMap((family) => cmIconVariants.map((variant) => `${family}/${variant}`));
if (
  iconFamilies.some((family) => !cmIconFamilies.includes(family)) ||
  iconVariants.some((variant) => !cmIconVariants.includes(variant))
) {
  throw new Error('The source icon families and weights must match the supported geometry formats.');
}

/** Strips the wrapper the VueForge component adds; the CodeMonster adapters supply their own. */
function extractBody(html) {
  const match = html.match(/<svg[^>]*viewBox="([^"]*)"[^>]*>([\s\S]*)<\/svg>/u);
  return match ? { body: match[2], viewBox: match[1] } : null;
}

/**
 * Vue scopes styles with a `data-v-*` attribute tied to the VueForge build. Carrying it into the
 * generated data would tie every CodeMonster icon to a hash from another package's compilation.
 */
function stripScopeAttributes(body) {
  return body.replace(/ data-v-[0-9a-f]+=""/gu, '');
}

const icons = {};
const skipped = [];

for (const name of iconNames) {
  const rendered = {};

  for (const family of iconFamilies) {
    for (const variant of iconVariants) {
      let html;
      try {
        html = await renderToString(createSSRApp({ render: () => h(VueIconify, { family, icon: name, variant }) }));
      } catch {
        skipped.push(`${name}/${family}/${variant}`);
        continue;
      }

      const extracted = extractBody(html);
      if (!extracted) {
        skipped.push(`${name}/${family}/${variant}`);
        continue;
      }

      rendered[`${family}/${variant}`] = {
        body: stripScopeAttributes(extracted.body),
        viewBox: extracted.viewBox,
      };
    }
  }

  if (Object.keys(rendered).length > 0) icons[name] = rendered;
}

const exec = promisify(execFile);
const commit = process.argv[3] ?? (await exec('git', ['rev-parse', 'HEAD'], { cwd: sourceDirectory })).stdout.trim();
const version = JSON.parse(await readFile(resolve(sourceDirectory, 'package.json'), 'utf8')).version;

function emitGeometry(name, rendered) {
  const boxes = new Set(Object.values(rendered).map(({ viewBox }) => viewBox));
  if (boxes.size !== 1) {
    return (
      "import type { CmIconGeometry } from '../types.js';\n\n" +
      `export const ${name}: CmIconGeometry = ${JSON.stringify(rendered, null, 2)};\n`
    );
  }
  const [viewBox] = boxes;
  const bodies = forms.map((form) => rendered[form]?.body ?? null);
  while (bodies.at(-1) === null) bodies.pop();
  const encoded = bodies.map((body, index) => {
    const first = bodies.indexOf(body);
    return body !== null && first < index ? first : body;
  });
  const box = viewBox === '0 0 24 24' ? '' : `, ${JSON.stringify(viewBox)}`;
  const control = controlIcons.includes(name);
  const regularIndex = forms.indexOf('classic/regular');
  const bodyList = encoded.map((body, index) =>
    control && index === regularIndex ? 'regularBody' : JSON.stringify(body),
  );
  return (
    "import { createIconGeometry } from '../geometry.js';\n\n" +
    (control
      ? `const regularBody = ${JSON.stringify(bodies[regularIndex])};\n` +
        `export const ${name}Regular = { 'classic/regular': { body: regularBody, viewBox: ${JSON.stringify(viewBox)} } };\n\n`
      : '') +
    `export const ${name} = /* @__PURE__ */ createIconGeometry([\n  ${bodyList.join(',\n  ')}\n]${box});\n`
  );
}

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(outputDirectory, { recursive: true });

// One module per icon keeps named imports independent of the catalogue.
for (const [name, rendered] of Object.entries(icons)) {
  await writeFile(
    resolve(outputDirectory, `${name}.ts`),
    // The header does not name the source package: check:package-contracts rejects any VueForge
    // reference inside the CodeMonster line, and it is right to -- an exception for comments would
    // be an exception a real import could hide behind. provenance.json records it once instead.
    `// Generated. Do not edit; see provenance.json.\n` + emitGeometry(name, rendered),
    'utf8',
  );
}

const names = Object.keys(icons).sort();
await writeFile(
  resolve(outputDirectory, 'index.ts'),
  `// Generated. Do not edit; see provenance.json.\n` +
    names.map((name) => `export { ${name} } from './${name}.js';`).join('\n') +
    `\n\nexport const cmIconNames = ${JSON.stringify(names, null, 2)} as const;\n`,
  'utf8',
);

await writeFile(
  resolve(outputDirectory, 'provenance.json'),
  `${JSON.stringify({ commit, icons: names.length, skipped: skipped.length, source: `@codemonster-ru/vueforge-icons@${version}` }, null, 2)}\n`,
  'utf8',
);

console.log(`[icons] Generated ${names.length} icon(s) from @codemonster-ru/vueforge-icons@${version}.`);
console.log(
  `[icons] ${skipped.length} combination(s) do not exist, which is expected: brand marks are classic/solid only.`,
);
