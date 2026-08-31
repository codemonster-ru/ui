export const codeMonsterUiNodeEngine = '^22.22.3 || ^24.15.0 || >=26.0.0';

export const codeMonsterUiNpmPackages = Object.freeze([
  { directory: 'tokens', name: '@codemonster-ru/ui-tokens', releaseOrder: 1 },
  { directory: 'icons', name: '@codemonster-ru/ui-icons', releaseOrder: 2 },
  { directory: 'runtime', name: '@codemonster-ru/ui-runtime', releaseOrder: 2 },
  { directory: 'css', name: '@codemonster-ru/ui-css', releaseOrder: 3 },
  { directory: 'utilities', name: '@codemonster-ru/ui-utilities', releaseOrder: 3 },
  {
    directory: 'vue',
    frameworkPeers: { vue: '^3.5.0' },
    name: '@codemonster-ru/ui-vue',
    releaseOrder: 4,
  },
  // A layout composes components, so it releases after them.
  {
    directory: 'layouts',
    frameworkPeers: { vue: '^3.5.0' },
    name: '@codemonster-ru/ui-layouts',
    releaseOrder: 5,
  },
  {
    directory: 'react',
    frameworkPeers: { react: '^19.2.0', 'react-dom': '^19.2.0' },
    name: '@codemonster-ru/ui-react',
    releaseOrder: 4,
  },
  {
    directory: 'angular',
    frameworkPeers: { '@angular/core': '^22.0.0' },
    name: '@codemonster-ru/ui-angular',
    releaseOrder: 4,
  },
]);

export const codeMonsterUiComposerPackage = Object.freeze({
  directory: 'razor',
  name: 'codemonster-ru/ui-razor',
  php: '>=8.2',
  razor: '^2.1',
  releaseOrder: 5,
});

export const codeMonsterUiPackageSizeBudgets = Object.freeze({
  '@codemonster-ru/ui-tokens': { cssGzip: 12 * 1024, cssRaw: 64 * 1024, jsGzip: 24 * 1024 },
  '@codemonster-ru/ui-icons': { cssGzip: 0, cssRaw: 0, jsGzip: 256 * 1024 },
  // The shared core lives here, so this package carries logic the adapters used to duplicate.
  // Measured 31.45 KiB before that move and 33.29 KiB after, while ui-vue fell from 24.82 to
  // 24.16: one implementation costs about 1.2 KiB more than two specialised ones, which is the
  // deliberate trade.
  //
  // The tight headroom then did its job: carrying ColumnChooser and TableOfContents across added
  // two core modules and pushed this to 36.06 KiB, which failed the 36 KiB limit rather than
  // passing unnoticed. Three components remain on the list at roughly half a KiB of rules each, so
  // 40 KiB covers them with the same narrow margin instead of a blank cheque.
  '@codemonster-ru/ui-runtime': { cssGzip: 0, cssRaw: 0, jsGzip: 40 * 1024 },
  '@codemonster-ru/ui-css': { cssGzip: 48 * 1024, cssRaw: 320 * 1024, jsGzip: 8 * 1024 },
  '@codemonster-ru/ui-utilities': { cssGzip: 32 * 1024, cssRaw: 256 * 1024, jsGzip: 8 * 1024 },
  '@codemonster-ru/ui-vue': { cssGzip: 8 * 1024, cssRaw: 32 * 1024, jsGzip: 128 * 1024 },
  '@codemonster-ru/ui-layouts': { cssGzip: 8 * 1024, cssRaw: 32 * 1024, jsGzip: 64 * 1024 },
  '@codemonster-ru/ui-react': { cssGzip: 8 * 1024, cssRaw: 32 * 1024, jsGzip: 128 * 1024 },
  '@codemonster-ru/ui-angular': { cssGzip: 8 * 1024, cssRaw: 32 * 1024, jsGzip: 128 * 1024 },
});
