// Builds and serves the reference showcase from an immutable, isolated
// checkout.
//
// The shared working tree is never switched between capture steps: the
// reference tree is materialised with `git archive` at the pinned commit into
// its own directory, and the workspace symlinks inside the copied node_modules
// are relative, so every `@codemonster-ru/*` import resolves inside the
// isolated tree. New implementation sources and CSS cannot reach a historical
// capture.
import { execFileSync, spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { referenceCommit, repositoryRoot, sha256 } from './reference.mjs';

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
}

async function findFreePort() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolvePromise(port));
    });
  });
}

function delay(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

// Symlinks must survive the copy: the workspace links inside node_modules are
// relative and must keep pointing at the isolated packages. APFS/reflink copies
// are used when available because the tree is large.
function copyPreservingSymlinks(source, destination) {
  const platformArguments =
    process.platform === 'darwin' ? ['-Rc', source, destination] : ['-a', '--reflink=auto', source, destination];

  try {
    run('cp', platformArguments);
    return;
  } catch {
    // Fall through to the portable copy below.
  }

  cpSync(source, destination, { recursive: true, verbatimSymlinks: true });
}

// A git archive of the exact commit. Nothing from the working tree, including
// untracked first-migration leftovers, can leak into it.
export function materialiseReferenceTree(targetDirectory, commit = referenceCommit) {
  rmSync(targetDirectory, { recursive: true, force: true });
  mkdirSync(targetDirectory, { recursive: true });

  const archive = execFileSync('git', ['-C', repositoryRoot, 'archive', '--format=tar', commit], {
    maxBuffer: 512 * 1024 * 1024,
  });
  execFileSync('tar', ['-x', '-C', targetDirectory], { input: archive, maxBuffer: 512 * 1024 * 1024 });

  if (!existsSync(resolve(targetDirectory, 'package.json'))) {
    throw new Error(`git archive of ${commit} did not produce a repository root in ${targetDirectory}.`);
  }

  const treeHash = run('git', ['-C', repositoryRoot, 'rev-parse', `${commit}^{tree}`]).trim();

  return { directory: targetDirectory, commit, treeHash };
}

// Third-party dependencies are cloned from the repository install. The
// `@codemonster-ru/*` entries are relative symlinks, so they re-point at the
// isolated packages automatically; the assertion below proves it.
export function linkDependencies(targetDirectory) {
  const source = resolve(repositoryRoot, 'node_modules');
  if (!existsSync(source)) {
    throw new Error('node_modules is missing. Run npm install before capturing the reference.');
  }

  const destination = resolve(targetDirectory, 'node_modules');
  rmSync(destination, { recursive: true, force: true });
  copyPreservingSymlinks(source, destination);

  // Proves the isolated tree is self-contained before anything is built.
  for (const workspace of ['vueforge-core', 'vueforge-layouts', 'vueforge-icons', 'vueforge-theme']) {
    const probe = resolve(destination, '@codemonster-ru', workspace);
    const resolved = realpathSync(probe);
    if (!resolved.startsWith(realpathSync(targetDirectory))) {
      throw new Error(`Isolated checkout leaks into the working tree: ${probe} resolves to ${resolved}.`);
    }
  }

  return { lockfileSha256: sha256(readFileSync(resolve(targetDirectory, 'package-lock.json'))) };
}

export function buildReference(targetDirectory) {
  // The package build regenerates the gitignored `.generated/theme` CSS that
  // the showcase imports, so the isolated tree needs no artifact copy.
  run('npm', ['run', 'build'], { cwd: targetDirectory, stdio: ['ignore', 'ignore', 'pipe'] });
  run('npm', ['run', 'build'], {
    cwd: resolve(targetDirectory, 'examples/playground'),
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  const indexPath = resolve(targetDirectory, 'examples/playground/dist/index.html');
  if (!existsSync(indexPath)) {
    throw new Error('Reference showcase build produced no dist/index.html.');
  }

  return { showcaseIndexSha256: sha256(readFileSync(indexPath)) };
}

export async function serveReference(targetDirectory) {
  const port = await findFreePort();
  const child = spawn(
    resolve(targetDirectory, 'node_modules/.bin/vite'),
    ['preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: resolve(targetDirectory, 'examples/playground'), stdio: ['ignore', 'pipe', 'pipe'] },
  );

  const origin = `http://127.0.0.1:${port}`;
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(`${origin}/core`);
      if (response.ok) {
        return {
          origin,
          async close() {
            child.kill('SIGTERM');
            await new Promise((resolvePromise) => child.once('exit', resolvePromise));
          },
        };
      }
    } catch {
      // The preview server is not listening yet.
    }
    await delay(200);
  }

  child.kill('SIGTERM');
  throw new Error('Reference preview server did not become reachable.');
}

// One call for the whole immutable pipeline: archive -> deps -> build -> serve.
export async function prepareReference(targetDirectory, commit = referenceCommit) {
  const tree = materialiseReferenceTree(targetDirectory, commit);
  const dependencies = linkDependencies(targetDirectory);
  const build = buildReference(targetDirectory);
  const server = await serveReference(targetDirectory);

  return {
    ...tree,
    ...dependencies,
    ...build,
    origin: server.origin,
    close: server.close,
  };
}
