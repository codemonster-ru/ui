import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { build } from 'esbuild';

const repositoryRoot = process.cwd();
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'vueforge-tree-shaking-'));
const commonBuildOptions = {
  absWorkingDir: repositoryRoot,
  bundle: true,
  external: ['vue'],
  format: 'esm',
  logLevel: 'silent',
  minify: true,
  nodePaths: [join(repositoryRoot, 'node_modules')],
  platform: 'browser',
  treeShaking: true,
};
// A framework adapter imports the shared core but must never drag in the DOM controllers beside
// it. These match the runtime's own strings rather than the markup contract: every adapter renders
// data-cm-controller on purpose, so that attribute proves nothing.
const domRuntimeMarkers = [
  ['CmRuntime registry', /Controller name must use lowercase kebab-case/],
  ['CmRuntime observer', /MutationObserver is not available/],
  ['a DOM controller', /controller requires/i],
  ['the positioning engine', /autoUpdate|computePosition/],
];
const unrelatedIcon = ['unused Bell geometry', /vf-duotone-primary-bell/];
const themeStorage = ['theme storage', /localStorage\.setItem/];
const themeRuntime = ['theme application runtime', /data-vf-theme-transition/];
const unrelatedRuntimeMarkers = [...domRuntimeMarkers, themeRuntime, themeStorage];

const cases = [
  {
    entry: "export { CmButton } from '@codemonster-ru/ui-vue';\n",
    fileName: 'ui-vue-button',
    forbiddenMarkers: unrelatedRuntimeMarkers,
    maxGzipBytes: 3 * 1024,
    name: 'ui-vue CmButton',
  },
  {
    entry: "export { CmTabs } from '@codemonster-ru/ui-vue';\n",
    fileName: 'ui-vue-tabs',
    forbiddenMarkers: unrelatedRuntimeMarkers,
    maxGzipBytes: 4 * 1024,
    name: 'ui-vue CmTabs with its shared core',
  },
  {
    entry: "export { CmButton, CmDialog, CmTabs } from '@codemonster-ru/ui-vue';\n",
    fileName: 'ui-vue-multiple',
    forbiddenMarkers: unrelatedRuntimeMarkers,
    maxGzipBytes: 8 * 1024,
    name: 'ui-vue multiple components',
  },
  {
    entry: "export { CmIcon } from '@codemonster-ru/ui-vue';\nexport { arrowLeft } from '@codemonster-ru/ui-icons';\n",
    fileName: 'ui-vue-static-icon',
    forbiddenMarkers: [...unrelatedRuntimeMarkers, unrelatedIcon],
    maxGzipBytes: 3 * 1024,
    name: 'ui-vue CmIcon with one static glyph',
  },
  {
    entry: "import * as Catalog from '@codemonster-ru/ui-icons/catalog';\nconsole.log(Catalog);\n",
    fileName: 'ui-icons-catalog',
    forbiddenMarkers: [...unrelatedRuntimeMarkers, unrelatedIcon],
    maxGzipBytes: 6 * 1024,
    name: 'ui-icons catalogue metadata without geometry',
  },
  {
    entry: "import * as CodeMonsterUiVue from '@codemonster-ru/ui-vue';\nconsole.log(CodeMonsterUiVue);\n",
    fileName: 'ui-vue-full',
    forbiddenMarkers: [...domRuntimeMarkers, themeRuntime, unrelatedIcon],
    // The theme provider, data table composition, and localized calendar are available here.
    // The restored namespace measured 35.45 KiB without the opt-in named icon catalogue.
    maxGzipBytes: 38 * 1024,
    minGzipBytes: 15 * 1024,
    name: 'ui-vue full namespace',
  },
  {
    entry: "export { CmThemeProvider } from '@codemonster-ru/ui-vue';\n",
    fileName: 'ui-vue-theme-provider',
    forbiddenMarkers: [...domRuntimeMarkers, themeRuntime, unrelatedIcon],
    requiredMarkers: [themeStorage],
    maxGzipBytes: 3 * 1024,
    name: 'ui-vue CmThemeProvider with persistence',
  },
  {
    entry: "import * as Historical from '@codemonster-ru/ui-vue/historical';\nconsole.log(Historical);\n",
    fileName: 'ui-vue-historical',
    forbiddenMarkers: unrelatedRuntimeMarkers,
    maxGzipBytes: 32 * 1024,
    name: 'ui-vue opt-in historical icon and menu namespace',
  },
  {
    entry: "import * as CodeMonsterUiCore from '@codemonster-ru/ui-runtime/core';\nconsole.log(CodeMonsterUiCore);\n",
    fileName: 'ui-core-full',
    forbiddenMarkers: unrelatedRuntimeMarkers,
    maxGzipBytes: 5 * 1024,
    name: 'ui-runtime core subpath',
  },
];
const forbiddenOutput = [
  ['OKLCH palette', /oklch\(/i],
  ['primitive color token graph', /--vf-palette-(?:neutral|primary|success|warning|danger|help)-/],
];

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

try {
  for (const testCase of cases) {
    const entryPath = join(temporaryDirectory, `${testCase.fileName}.js`);
    const outputPath = join(temporaryDirectory, `${testCase.fileName}.bundle.js`);
    const cssOutputPath = join(temporaryDirectory, `${testCase.fileName}.bundle.css`);
    writeFileSync(entryPath, testCase.entry);

    await build({
      ...commonBuildOptions,
      entryPoints: [entryPath],
      outfile: outputPath,
    });

    const output = readFileSync(outputPath);
    const outputText = output.toString('utf8');
    const gzipBytes = zlib.gzipSync(output).length;
    const cssOutput = existsSync(cssOutputPath) ? readFileSync(cssOutputPath) : null;
    const cssOutputText = cssOutput?.toString('utf8') ?? '';
    const searchableOutput = `${outputText}\n${cssOutputText}`;

    if (gzipBytes > testCase.maxGzipBytes) {
      throw new Error(
        `${testCase.name} gzip budget exceeded: ${formatKiB(gzipBytes)} > ${formatKiB(testCase.maxGzipBytes)}`,
      );
    }

    if (testCase.minGzipBytes && gzipBytes < testCase.minGzipBytes) {
      throw new Error(
        `${testCase.name} unexpectedly small: ${formatKiB(gzipBytes)} < ${formatKiB(testCase.minGzipBytes)}`,
      );
    }

    for (const [description, matcher] of testCase.forbiddenMarkers ?? []) {
      if (matcher.test(searchableOutput)) {
        throw new Error(`${testCase.name} retained ${description}.`);
      }
    }

    for (const [description, matcher] of testCase.requiredMarkers ?? []) {
      if (!matcher.test(searchableOutput)) throw new Error(`${testCase.name} did not retain ${description}.`);
    }

    if (testCase.checkForbidden !== false) {
      for (const [description, matcher] of forbiddenOutput) {
        if (matcher.test(searchableOutput)) {
          throw new Error(`${testCase.name} retained unrelated ${description}.`);
        }
      }
    }

    if (testCase.cssMarker) {
      if (!cssOutputText.includes(testCase.cssMarker)) {
        throw new Error(`${testCase.name} did not retain ${testCase.cssMarker} styles.`);
      }
    }

    for (const forbiddenCssMarker of testCase.forbiddenCssMarkers ?? []) {
      if (cssOutputText.includes(forbiddenCssMarker)) {
        throw new Error(`${testCase.name} retained unrelated ${forbiddenCssMarker} styles.`);
      }
    }

    const cssGzipBytes = cssOutput ? zlib.gzipSync(cssOutput).length : 0;
    if (testCase.maxCssGzipBytes && cssGzipBytes > testCase.maxCssGzipBytes) {
      throw new Error(
        `${testCase.name} CSS gzip budget exceeded: ${formatKiB(cssGzipBytes)} > ${formatKiB(testCase.maxCssGzipBytes)}`,
      );
    }

    console.log(
      `[tree-shaking-check] ${testCase.name}: ${formatKiB(output.length)} raw, ${formatKiB(gzipBytes)} gzip` +
        (cssOutput ? `; CSS ${formatKiB(cssOutput.length)} raw, ${formatKiB(cssGzipBytes)} gzip` : ''),
    );
  }

  console.log('[tree-shaking-check] OK');
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
