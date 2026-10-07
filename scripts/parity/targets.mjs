// Builds the three render targets for a component's shared cases.
//
// Reference Vue comes from an immutable checkout of the reference commit, built
// with the M00 harness. Current Vue comes from the working tree. Razor comes
// from the real PHP package with its real packaged assets. No target is
// generated from another target's output.
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { linkDependencies, materialiseReferenceTree, buildReference } from '../baseline/isolated-reference.mjs';
import { referenceCommit, repositoryRoot, sha256 } from '../baseline/reference.mjs';

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
  // M35 P0-2: under parity:check the checkout is built once per run by
  // check-all.mjs and verified here, file by file, before this profile reads
  // it. Run on its own, a profile builds its own checkout, as before.
  const shared = process.env.PARITY_SHARED_REFERENCE;
  if (shared) {
    verifySharedReference(shared, process.env.PARITY_SHARED_REFERENCE_RUN);
  } else {
    prepareReferenceCheckout(checkoutDirectory);
  }

  return {
    ...buildVueTarget({ treeRoot: shared || checkoutDirectory, outputDirectory, label: 'reference', profile }),
    provenance: { source: 'immutable-reference-checkout', referenceCommit },
  };
}

function prepareReferenceCheckout(checkoutDirectory) {
  materialiseReferenceTree(checkoutDirectory);
  linkDependencies(checkoutDirectory);
  // The full workspace build is what produces the icons dist the reference
  // component resolves against.
  buildReference(checkoutDirectory);
}

const manifestName = 'parity-shared-reference.json';

/**
 * Everything a reference checkout depends on besides its own bytes (M35 P0-2):
 * the commit and its tree, the runtime, the procedure that builds it, and the
 * dependency tree linkDependencies copies in. The run token makes the checkout
 * belong to one parity:check and no other.
 */
function referenceIdentity(run) {
  const file = (path) =>
    existsSync(resolve(repositoryRoot, path)) ? sha256(readFileSync(resolve(repositoryRoot, path))) : null;
  return {
    referenceCommit,
    tree: execFileSync('git', ['-C', repositoryRoot, 'rev-parse', `${referenceCommit}^{tree}`], {
      encoding: 'utf8',
    }).trim(),
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    procedure: [
      'scripts/baseline/isolated-reference.mjs',
      'scripts/baseline/reference.mjs',
      'scripts/parity/targets.mjs',
    ].map(file),
    dependencies: ['package-lock.json', 'node_modules/.package-lock.json'].map(file),
    run,
  };
}

/** Path, type, link target and sha256 of every entry under the checkout but the manifest. */
function treeManifest(root, relative = '', entries = []) {
  for (const name of readdirSync(resolve(root, relative)).sort()) {
    const path = relative ? `${relative}/${name}` : name;
    if (path === manifestName) continue;
    const stat = lstatSync(resolve(root, path));
    if (stat.isSymbolicLink()) entries.push([path, 'link', readlinkSync(resolve(root, path))]);
    else if (stat.isDirectory()) {
      entries.push([path, 'dir']);
      treeManifest(root, path, entries);
    } else entries.push([path, 'file', sha256(readFileSync(resolve(root, path)))]);
  }
  return entries;
}

/** Builds the run's checkout once; the manifest is written last, so a partial build is never usable. */
export function prepareSharedReference(checkoutDirectory, run) {
  prepareReferenceCheckout(checkoutDirectory);
  sealSharedReference(checkoutDirectory, run);
}

/** Records what the checkout is and what it contains; the last thing a shared build does. */
export function sealSharedReference(checkoutDirectory, run) {
  writeFileSync(
    resolve(checkoutDirectory, manifestName),
    JSON.stringify({ identity: referenceIdentity(run), entries: treeManifest(checkoutDirectory) }),
  );
}

/** Fails unless the checkout is this run's, built for this reference, and unchanged to the byte. */
export function verifySharedReference(checkoutDirectory, run) {
  const path = resolve(checkoutDirectory, manifestName);
  if (!existsSync(path))
    throw new Error(`Shared reference ${checkoutDirectory} has no manifest: it was never completed.`);
  const recorded = JSON.parse(readFileSync(path, 'utf8'));
  if (JSON.stringify(recorded.identity) !== JSON.stringify(referenceIdentity(run))) {
    throw new Error(
      `Shared reference ${checkoutDirectory} was built for another reference, runtime, procedure or run.`,
    );
  }
  if (JSON.stringify(recorded.entries) !== JSON.stringify(treeManifest(checkoutDirectory))) {
    throw new Error(`Shared reference ${checkoutDirectory} changed after it was built.`);
  }
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
