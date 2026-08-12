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
  name: 'codemonster-ru/ui',
  php: '>=8.2',
  razor: '^2.1',
  releaseOrder: 5,
});

export const codeMonsterUiPackageSizeBudgets = Object.freeze({
  '@codemonster-ru/ui-tokens': { cssGzip: 12 * 1024, cssRaw: 64 * 1024, jsGzip: 24 * 1024 },
  '@codemonster-ru/ui-icons': { cssGzip: 0, cssRaw: 0, jsGzip: 256 * 1024 },
  '@codemonster-ru/ui-runtime': { cssGzip: 0, cssRaw: 0, jsGzip: 32 * 1024 },
  '@codemonster-ru/ui-css': { cssGzip: 48 * 1024, cssRaw: 320 * 1024, jsGzip: 8 * 1024 },
  '@codemonster-ru/ui-utilities': { cssGzip: 32 * 1024, cssRaw: 256 * 1024, jsGzip: 8 * 1024 },
  '@codemonster-ru/ui-vue': { cssGzip: 8 * 1024, cssRaw: 32 * 1024, jsGzip: 128 * 1024 },
  '@codemonster-ru/ui-react': { cssGzip: 8 * 1024, cssRaw: 32 * 1024, jsGzip: 128 * 1024 },
  '@codemonster-ru/ui-angular': { cssGzip: 8 * 1024, cssRaw: 32 * 1024, jsGzip: 128 * 1024 },
});
