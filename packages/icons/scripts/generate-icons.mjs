import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cmIconFamilies, cmIconVariants } from '../src/types.ts';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(packageDirectory, 'src/generated');
const controlIcons = ['chevronDown', 'chevronLeft', 'chevronRight', 'externalLink'];
const { origin, icons } = JSON.parse(await readFile(resolve(packageDirectory, 'data/geometry.json'), 'utf8'));
const forms = cmIconFamilies.flatMap((family) => cmIconVariants.map((variant) => `${family}/${variant}`));

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

const header = '// Generated. Do not edit; see provenance.json.\n';
const names = Object.keys(icons).sort();
if (names.length === 0) throw new Error('The geometry source is empty.');
const outputs = new Map();
let renderings = 0;

// Validate the input before updating any output. One module per icon keeps named imports independent.
for (const name of names) {
  if (!/^[a-z][a-zA-Z0-9]*$/u.test(name) || name === 'index') {
    throw new Error(`Invalid icon name: ${name}`);
  }
  const geometry = icons[name];
  const entries = Object.entries(geometry);
  if (entries.length === 0) throw new Error(`Missing geometry for ${name}`);
  for (const [form, { body, viewBox }] of entries) {
    if (!forms.includes(form) || typeof body !== 'string' || !body || typeof viewBox !== 'string' || !viewBox) {
      throw new Error(`Invalid geometry for ${name}/${form}`);
    }
  }
  renderings += entries.length;
  outputs.set(`${name}.ts`, header + emitGeometry(name, geometry));
}

outputs.set(
  'index.ts',
  header +
    names.map((name) => `export { ${name} } from './${name}.js';`).join('\n') +
    `\n\nexport const cmIconNames = ${JSON.stringify(names, null, 2)} as const;\n`,
);

const skipped = names.length * forms.length - renderings;
const provenance = { commit: origin.commit, icons: names.length, skipped, source: origin.source };
outputs.set('provenance.json', `${JSON.stringify(provenance, null, 2)}\n`);

await mkdir(outputDirectory, { recursive: true });
for (const [file, contents] of outputs) {
  await writeFile(resolve(outputDirectory, file), contents, 'utf8');
}
for (const file of await readdir(outputDirectory)) {
  if (file.endsWith('.ts') && !outputs.has(file)) {
    await rm(resolve(outputDirectory, file), { force: true });
  }
}

console.log(`[icons] Generated ${names.length} icon(s) and ${renderings} rendering(s) from data/geometry.json.`);
