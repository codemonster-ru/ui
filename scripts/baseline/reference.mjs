// Shared provenance constants for the VueForge reference baseline (M00).
//
// The reference implementation is a single immutable commit. Every baseline
// artifact records that commit so a later comparison can never silently drift
// onto a different historical tree.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const referenceCommit = 'fd793696f50d3be0fcd3788f0f8f751c63869963';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const baselineDataDirectory = resolve(repositoryRoot, 'baseline');
export const inventoryBaselinePath = resolve(baselineDataDirectory, 'reference-inventory.json');
export const showcaseBaselinePath = resolve(baselineDataDirectory, 'reference-showcase.json');
export const artifactsDirectory = resolve(repositoryRoot, '.baseline-artifacts');

// Workspace packages whose public surface belongs to the historical contract.
// `entries` lists the source module behind every published JavaScript subpath.
// CodeBlock and Playground publish no package root, so their real entries are
// `/view`, `/highlight`, `/ui` and `/runtime`; the presence of `src/index.ts`
// does not make a root import part of the contract.
export const inventoryPackages = [
  { directory: 'packages/theme', entries: { '.': 'src/index.ts' } },
  { directory: 'packages/icons', entries: { '.': 'src/lib/index.ts' } },
  {
    directory: 'packages/core',
    entries: {
      '.': 'src/index.ts',
      './foundation': 'src/foundation/index.ts',
      './theme': 'src/theme/public.ts',
      './async': 'src/async.ts',
    },
  },
  { directory: 'packages/layouts', entries: { '.': 'src/index.ts' } },
  { directory: 'packages/codeblock', entries: { './view': 'src/view.ts', './highlight': 'src/highlight.ts' } },
  { directory: 'packages/playground-core', entries: { '.': 'src/index.ts' } },
  { directory: 'packages/playground', entries: { './ui': 'src/ui.ts', './runtime': 'src/runtime.ts' } },
  { directory: 'packages/playground-vite-plugin', entries: { '.': 'src/index.ts' } },
];

// Component barrels that define the historical public component catalogue.
export const componentBarrels = [
  { id: 'core', file: 'packages/core/src/components/index.ts' },
  { id: 'layouts', file: 'packages/layouts/src/index.ts' },
];

// Components published outside the component barrel of their package. Each is
// backed by a real SFC, so a deleted file fails the gate.
export const additionalPublicComponents = [
  { id: 'core:VfThemeProvider', name: 'VfThemeProvider', file: 'packages/core/src/providers/VfThemeProvider.vue' },
  { id: 'codeblock:VfCodeBlock', name: 'VfCodeBlock', file: 'packages/codeblock/src/components/VfCodeBlock.vue' },
  { id: 'playground:VfPlayground', name: 'VfPlayground', file: 'packages/playground/src/VfPlayground.vue' },
  { id: 'icons:VueIconify', name: 'VueIconify', file: 'packages/icons/src/lib/components/icon.vue' },
];

// Public component wrappers that are created in code rather than by an SFC.
// `VfPlaygroundAsync` is a real published name and belongs in the catalogue.
export const derivedPublicComponents = [{ name: 'VfPlaygroundAsync', package: 'packages/playground', entry: './ui' }];

// Appendix A of the architecture plan counts 68 public component names. The
// gate asserts the number so a shrunken barrel cannot pass quietly.
export const expectedPublicComponentCount = 68;

export const showcaseExample = {
  directory: 'examples/playground',
  appFile: 'examples/playground/src/App.vue',
  mainFile: 'examples/playground/src/main.ts',
  themeStorageKey: 'codemonster-showcase-theme',
};

// The six historical showcase routes. `/colors` is included deliberately: the
// first migration's cross-platform matrix omitted it and therefore could not
// detect Colors regressions (architecture plan, section 18.3).
export const showcaseRoutes = [
  {
    id: 'core',
    path: '/core',
    readySelector: '[data-test="form-geometry-matrix"]',
    caseSources: [
      { prefix: 'block', selector: 'section.demo-block', id: 'anchor' },
      { prefix: 'matrix', selector: '[data-test]', id: 'attr', attribute: 'data-test' },
    ],
  },
  {
    id: 'colors',
    path: '/colors',
    readySelector: '.color-system__theme-grid',
    caseSources: [
      { prefix: 'section', selector: 'section.color-system__section', id: 'attr', attribute: 'aria-labelledby' },
      { prefix: 'theme', selector: '.color-system__theme', id: 'attr', attribute: 'data-vf-theme' },
    ],
  },
  {
    id: 'layouts',
    path: '/layouts',
    readySelector: 'section.demo-block #demo-container',
    caseSources: [{ prefix: 'block', selector: 'section.demo-block', id: 'anchor' }],
  },
  {
    id: 'icons',
    path: '/icons',
    readySelector: '.variant-table .variant-row',
    caseSources: [
      { prefix: 'family', selector: 'section.family-section', id: 'heading' },
      { prefix: 'brands', selector: 'section.brand-section', id: 'attr', attribute: 'aria-labelledby' },
    ],
  },
  {
    id: 'codeblock',
    path: '/codeblock',
    readySelector: '.vf-skeleton-gate__content--ready .vf-codeblock',
    caseSources: [
      { prefix: 'block', selector: 'section.demo-block', id: 'heading' },
      { prefix: 'file', selector: '.vf-codeblock__filename', id: 'text' },
    ],
  },
  {
    id: 'playground',
    path: '/playground',
    readySelector: '.vf-skeleton-gate__content--ready .vf-playground',
    caseSources: [{ prefix: 'block', selector: 'section.demo-block', id: 'heading' }],
  },
];

export const showcaseViewports = [
  { id: 'desktop', width: 1440, height: 1100, mobile: false },
  { id: 'mobile', width: 390, height: 844, mobile: true },
];

export const showcaseThemes = ['light', 'dark'];

// Capture environment. Everything here is asserted or recorded per run so an
// environment drift is reported instead of silently changing the pixels.
export const captureEnvironment = {
  deviceScaleFactor: 1,
  locale: 'en-US',
  timezone: 'UTC',
  reducedMotion: 'reduce',
  forcedColors: 'none',
  screenshotFormat: 'png',
  // The reference declares `Inter, ui-sans-serif, system-ui, …` and ships no
  // @font-face rule, so the resolved face depends on the host. It is recorded
  // in every capture manifest instead of being assumed.
  fontProbeFamilies: ['--vf-font-family-base', '--vf-font-family-heading', '--vf-font-family-mono'],
  // Determinism controls applied before any page script runs. The showcase has
  // three real nondeterminism sources at the reference commit:
  //   - CoreShowcase drives a progress demo from setInterval + Math.random;
  //   - LayoutsShowcase renders `new Date().getFullYear()`;
  //   - VfDatePicker highlights "today".
  // The clock and the interval scheduler are controlled instead of masking the
  // components, which stay fully compared (architecture plan, section 18.2).
  determinism: {
    // 2025-01-01T00:00:00Z. The clock still advances with performance.now() so
    // relative timing (PlaygroundShowcase gates on Date.now() deltas) keeps
    // working; only the absolute date is pinned.
    clockEpochMs: 1_735_689_600_000,
    randomSeed: 0x5f3759df,
    freezeIntervals: true,
  },
};

export const chromeArguments = [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--hide-scrollbars',
  '--disable-lcd-text',
  '--force-device-scale-factor=1',
  '--force-prefers-reduced-motion',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-sync',
  '--disable-default-apps',
  '--disable-features=Translate,MediaRouter,OptimizationHints,CalculateNativeWinOcclusion',
  '--deterministic-mode',
  '--font-render-hinting=none',
  '--enable-font-antialiasing',
  '--mute-audio',
];

export function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

// Baseline data files are committed, so they are written in the repository's
// own Prettier style and stay checkable by `npm run lint:data`.
export async function writeBaselineJson(filePath, value) {
  const prettier = await import('prettier');
  const options = (await prettier.resolveConfig(filePath)) ?? {};
  const formatted = await prettier.format(JSON.stringify(value, null, 2), { ...options, filepath: filePath });

  writeFileSync(filePath, formatted);
}

export function captureId(route, viewport, theme) {
  return `${route}-${viewport}-${theme}`;
}
