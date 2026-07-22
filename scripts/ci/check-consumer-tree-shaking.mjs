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
  external: ['vue', '@codemonster-ru/vueforge-icons', '@codemonster-ru/floater.js'],
  format: 'esm',
  logLevel: 'silent',
  minify: true,
  nodePaths: [join(repositoryRoot, 'node_modules')],
  platform: 'browser',
  treeShaking: true,
};
const cases = [
  {
    entry: "export { VfButton } from '@codemonster-ru/vueforge-core';\n",
    fileName: 'core-root-button',
    maxGzipBytes: 4 * 1024,
    name: 'core root VfButton',
  },
  {
    cssMarker: '.vf-button',
    entry: "export { VfButton } from '@codemonster-ru/vueforge-core/button';\n",
    fileName: 'core-subpath-button',
    forbiddenCssMarkers: ['.vf-accordion'],
    maxCssGzipBytes: 4 * 1024,
    maxGzipBytes: 5 * 1024,
    name: 'core component VfButton with CSS',
  },
  {
    entry: "export { VfButton, VfDialog, VfDataTable } from '@codemonster-ru/vueforge-core';\n",
    fileName: 'core-multiple',
    maxGzipBytes: 20 * 1024,
    name: 'core root multiple components',
  },
  {
    checkForbidden: false,
    entry: "import * as VueForgeCore from '@codemonster-ru/vueforge-core';\nconsole.log(VueForgeCore);\n",
    fileName: 'core-full',
    minGzipBytes: 40 * 1024,
    maxGzipBytes: 100 * 1024,
    name: 'core full namespace',
  },
  {
    entry: "export { VfContainer } from '@codemonster-ru/vueforge-layouts';\n",
    fileName: 'layouts-root-container',
    maxGzipBytes: 4 * 1024,
    name: 'layouts root VfContainer',
  },
  {
    cssMarker: '.vf-container',
    entry: "export { VfContainer } from '@codemonster-ru/vueforge-layouts/container';\n",
    fileName: 'layouts-subpath-container',
    maxCssGzipBytes: 2 * 1024,
    maxGzipBytes: 5 * 1024,
    name: 'layouts component VfContainer with CSS',
  },
];
const forbiddenOutput = [
  ['OKLCH palette', /oklch\(/i],
  ['primitive color token graph', /--vf-palette-(?:neutral|primary|success|warning|danger|help)-/],
  ['theme application runtime', /data-vf-theme-transition|localStorage\.setItem/],
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
