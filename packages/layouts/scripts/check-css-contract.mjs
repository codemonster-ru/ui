/* global process, console */
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const entriesDir = join(process.cwd(), 'src/style-entries');

const ownBases = {
  'container.css': ['container'],
  'stack.css': ['stack'],
  'inline.css': ['inline'],
  'section.css': ['section'],
  'grid.css': ['grid'],
  'app-shell.css': [
    'app-shell',
    'header-area',
    'subheader-area',
    'sidebar-area',
    'content-area',
    'content-subheader-area',
    'aside-area',
    'footer-area',
  ],
  'document-layout.css': ['document-layout'],
  'auth-layout.css': ['auth-layout'],
  'error-layout.css': ['error-layout'],
  'setup-layout.css': ['setup-layout', 'container'],
  'header-area.css': ['header-area'],
  'sidebar-area.css': ['sidebar-area'],
  'content-area.css': ['content-area', 'content-subheader-area'],
  'aside-area.css': ['aside-area'],
  'footer-area.css': ['footer-area'],
};

const baseOf = (token) => token.split(/--|__/)[0];
let failures = 0;

for (const fileName of readdirSync(entriesDir)
  .filter((name) => name.endsWith('.css'))
  .sort()) {
  const css = readFileSync(join(entriesDir, fileName), 'utf8');
  const expected = new Set(ownBases[fileName] ?? [basename(fileName, '.css')]);

  const classBases = new Set([...css.matchAll(/\.vf-([a-z0-9-]+)/g)].map((m) => baseOf(m[1])));

  for (const classBase of classBases) {
    if (!expected.has(classBase)) {
      console.error(`[css-contract] Unexpected cross selector in ${fileName}: .vf-${classBase}*`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log('[css-contract] layouts component CSS dependency contract passed.');
