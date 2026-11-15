import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { historicalComponentEntries } from './historical-component-entries.mjs';

const { name } = JSON.parse(readFileSync('package.json', 'utf8'));
const entries = historicalComponentEntries(name);
if (entries.length === 0) throw new Error(`No historical component entries are registered for ${name}.`);

const directory = resolve('dist/historical-entries');
mkdirSync(resolve(directory, 'node'), { recursive: true });
mkdirSync(resolve(directory, 'browser'), { recursive: true });
writeFileSync(
  resolve(directory, 'shared-styles.js'),
  "import '@codemonster-ru/ui-tokens/tokens.css';\n" +
    "import '@codemonster-ru/ui-css/fonts.css';\n" +
    "import '@codemonster-ru/ui-css/foundation.css';\n",
);

for (const { slug, moduleName, names, types, styles, defaultName } of entries) {
  const source = `../../${moduleName}.js`;
  const exports = defaultName ? `${names}, ${defaultName} as default` : names;
  const reexport = `export { ${exports} } from '${source}';\n`;
  writeFileSync(resolve(directory, `node/${slug}.js`), reexport);
  writeFileSync(
    resolve(directory, `node/${slug}.d.ts`),
    reexport + (types ? `export type { ${types} } from '${source}';\n` : ''),
  );
  writeFileSync(
    resolve(directory, `browser/${slug}.js`),
    "import '../shared-styles.js';\n" +
      styles.map((style) => `import '@codemonster-ru/ui-css/${style}.css';\n`).join('') +
      `export { ${defaultName ? 'default, ' : ''}${names} } from '../node/${slug}.js';\n`,
  );
}
