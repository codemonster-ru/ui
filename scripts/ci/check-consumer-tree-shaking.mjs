import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    exportName: 'VfButton',
    maxGzipBytes: 4 * 1024,
    name: 'core root VfButton',
    packageName: '@codemonster-ru/vueforge-core',
  },
  {
    exportName: 'VfContainer',
    maxGzipBytes: 4 * 1024,
    name: 'layouts root VfContainer',
    packageName: '@codemonster-ru/vueforge-layouts',
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
    const entryPath = join(temporaryDirectory, `${testCase.exportName}.js`);
    const outputPath = join(temporaryDirectory, `${testCase.exportName}.bundle.js`);
    writeFileSync(
      entryPath,
      `export { ${testCase.exportName} } from '${testCase.packageName}';\n`,
    );

    await build({
      ...commonBuildOptions,
      entryPoints: [entryPath],
      outfile: outputPath,
    });

    const output = readFileSync(outputPath);
    const outputText = output.toString('utf8');
    const gzipBytes = zlib.gzipSync(output).length;

    if (gzipBytes > testCase.maxGzipBytes) {
      throw new Error(
        `${testCase.name} gzip budget exceeded: ${formatKiB(gzipBytes)} > ${formatKiB(testCase.maxGzipBytes)}`,
      );
    }

    for (const [description, matcher] of forbiddenOutput) {
      if (matcher.test(outputText)) {
        throw new Error(`${testCase.name} retained unrelated ${description}.`);
      }
    }

    console.log(
      `[tree-shaking-check] ${testCase.name}: ${formatKiB(output.length)} raw, ${formatKiB(gzipBytes)} gzip`,
    );
  }

  console.log('[tree-shaking-check] OK');
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
