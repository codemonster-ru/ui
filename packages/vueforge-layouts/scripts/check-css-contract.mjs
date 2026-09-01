/* global process, console */
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const entriesDir = join(process.cwd(), 'src/style-entries');
const fullShellPath = join(process.cwd(), 'src/style-parts/shell.css');

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

const appShellCss = readFileSync(join(entriesDir, 'app-shell.css'), 'utf8');
const fullShellCss = readFileSync(fullShellPath, 'utf8');
const fullAppShellStart = fullShellCss.indexOf('.vf-app-shell {');

if (fullAppShellStart < 0) {
  console.error('[css-contract] Missing .vf-app-shell block in src/style-parts/shell.css.');
  failures += 1;
} else {
  const fullAppShellCss = fullShellCss.slice(fullAppShellStart);
  const normalizeCss = (value) => value.replace(/\s+/g, ' ').trim();
  const gridLonghands = (css) =>
    [...css.matchAll(/(grid-template-(?:areas|rows|columns))\s*:\s*([^;]+);/g)].map(
      ([, property, value]) => `${property}: ${normalizeCss(value)}`,
    );
  const extractRuleBody = (css, selector) => {
    const marker = `${selector} {`;
    const ruleStart = css.indexOf(marker);
    if (ruleStart < 0) return null;

    const bodyStart = ruleStart + marker.length;
    const bodyEnd = css.indexOf('}', bodyStart);
    return bodyEnd < 0 ? null : normalizeCss(css.slice(bodyStart, bodyEnd));
  };

  for (const [sourceName, css] of [
    ['src/style-entries/app-shell.css', appShellCss],
    ['src/style-parts/shell.css', fullAppShellCss],
  ]) {
    for (const match of css.matchAll(/grid-template\s*:\s*([^;]+);/g)) {
      const value = match[1];
      if (/['"]/.test(value) && !value.includes('/')) {
        console.error(
          `[css-contract] Invalid area grid-template without an explicit columns separator in ${sourceName}.`,
        );
        failures += 1;
      }
    }
  }

  const componentGridContract = gridLonghands(appShellCss);
  const fullGridContract = gridLonghands(fullAppShellCss);
  if (JSON.stringify(componentGridContract) !== JSON.stringify(fullGridContract)) {
    console.error('[css-contract] AppShell grid declarations drifted between full and component CSS.');
    failures += 1;
  }

  const subheaderSelector = '.vf-subheader-area';
  const componentSubheaderContract = extractRuleBody(appShellCss, subheaderSelector);
  const fullSubheaderContract = extractRuleBody(fullAppShellCss, subheaderSelector);
  if (!componentSubheaderContract || componentSubheaderContract !== fullSubheaderContract) {
    console.error('[css-contract] AppShell subheader declarations drifted between full and component CSS.');
    failures += 1;
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log('[css-contract] layouts component CSS dependency contract passed.');
