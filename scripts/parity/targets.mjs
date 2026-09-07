// Builds the three render targets for a component's shared cases.
//
// Reference Vue comes from an immutable checkout of the reference commit, built
// with the M00 harness. Current Vue comes from the working tree. Razor comes
// from the real PHP package with its real packaged assets. No target is
// generated from another target's output.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { linkDependencies, materialiseReferenceTree, buildReference } from '../baseline/isolated-reference.mjs';
import { referenceCommit, repositoryRoot } from '../baseline/reference.mjs';

const fixtureDirectory = resolve(repositoryRoot, 'scripts/parity/fixtures');

function pageHtml({ title, stylesheets, scripts }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${stylesheets.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n')}
</head>
<body>
<div id="parity-root"></div>
${scripts.map((src) => `<script type="module" src="${src}"></script>`).join('\n')}
</body>
</html>
`;
}

function buildVueTarget({ treeRoot, outputDirectory, label, profile }) {
  mkdirSync(outputDirectory, { recursive: true });

  execFileSync(
    resolve(repositoryRoot, 'node_modules/.bin/vite'),
    ['build', '--config', resolve(fixtureDirectory, 'vue-cases.vite.config.mts')],
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        PARITY_TREE_ROOT: treeRoot,
        PARITY_OUT_DIR: outputDirectory,
        PARITY_CASES: profile.casesPath,
      },
      stdio: ['ignore', 'ignore', 'pipe'],
    },
  );

  copyFileSync(resolve(fixtureDirectory, 'parity-page.css'), resolve(outputDirectory, 'parity-page.css'));
  writeFileSync(
    resolve(outputDirectory, 'cases.html'),
    pageHtml({
      title: `VueForge ${profile.label} parity cases (${label})`,
      stylesheets: ['./vueforge.css', './parity-page.css'],
      scripts: ['./vue-cases.js'],
    }),
  );

  return { directory: outputDirectory, page: 'cases.html' };
}

/**
 * The reference target.
 *
 * The component and its stylesheet come from the immutable checkout; only the
 * neutral case data and the harness entry are supplied from outside, which is a
 * test wrapper around the historical component rather than a change to it.
 */
export function buildReferenceTarget(outputDirectory, checkoutDirectory, profile) {
  materialiseReferenceTree(checkoutDirectory);
  linkDependencies(checkoutDirectory);
  // The full workspace build is what produces the icons dist the reference
  // component resolves against.
  buildReference(checkoutDirectory);

  return {
    ...buildVueTarget({ treeRoot: checkoutDirectory, outputDirectory, label: 'reference', profile }),
    provenance: { source: 'immutable-reference-checkout', referenceCommit },
  };
}

export function buildCurrentTarget(outputDirectory, profile) {
  return {
    ...buildVueTarget({ treeRoot: repositoryRoot, outputDirectory, label: 'current', profile }),
    provenance: { source: 'working-tree' },
  };
}

/** The Razor target: real PHP render, real packaged assets. */
export function buildRazorTarget(outputDirectory, profile) {
  mkdirSync(outputDirectory, { recursive: true });

  const packageRoot = resolve(repositoryRoot, 'packages/razor');
  execFileSync(process.execPath, [resolve(packageRoot, 'build-assets.mjs')], { stdio: ['ignore', 'ignore', 'pipe'] });

  for (const asset of ['vueforge-razor.css', 'vueforge-razor.js']) {
    copyFileSync(resolve(packageRoot, 'dist', asset), resolve(outputDirectory, asset));
  }
  copyFileSync(resolve(fixtureDirectory, 'parity-page.css'), resolve(outputDirectory, 'parity-page.css'));

  execFileSync(
    'php',
    [
      resolve(fixtureDirectory, 'render-razor-cases.php'),
      resolve(repositoryRoot, profile.casesPath),
      resolve(outputDirectory, 'cases.html'),
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  return {
    directory: outputDirectory,
    page: 'cases.html',
    provenance: { source: 'razor-package', assets: 'packaged' },
  };
}
