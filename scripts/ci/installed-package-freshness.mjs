// Freshness of an installed Composer path-repository copy (M30 step zero).
//
// The Razor showcase installs the staged package through a Composer `path`
// repository with `symlink: false`. Composer identifies such a package by
// sha1(composer.json + repository options), so a change to any component, the
// browser bundle or the stylesheet leaves that reference - and the lock - as
// they were, and `composer install` answers "Nothing to install" over an older
// copy. Until M30 the showcase gate compared VueForgeRazorProvider.php alone,
// which only moves when a component is registered: a later edit to a component
// file ran the showcase against the previous code and passed.
//
// The comparison here is the whole tree, file for file, by content: every PHP
// source, the bundled browser runtime and stylesheet, the assets manifest, the
// provenance record and the icon registry. No timestamps, no allow-list of
// "files that matter" - an installed copy is current only when it is the staged
// artifact.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Every file below `directory`, as a sorted map of relative path to sha256. */
export function packageTree(directory) {
  const files = new Map();
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else
        files.set(
          relative(directory, path).split(sep).join('/'),
          createHash('sha256').update(readFileSync(path)).digest('hex'),
        );
    }
  };
  walk(directory);
  return new Map([...files].sort(([left], [right]) => (left < right ? -1 : 1)));
}

/** How the installed copy differs from the staged artifact; empty when it is current. */
export function packageTreeDifferences(stagedDirectory, installedDirectory) {
  const staged = packageTree(stagedDirectory);
  const installed = packageTree(installedDirectory);
  const differences = [];
  for (const [path, digest] of staged) {
    if (!installed.has(path)) differences.push(`missing ${path}`);
    else if (installed.get(path) !== digest) differences.push(`stale ${path}`);
  }
  for (const path of installed.keys()) {
    if (!staged.has(path)) differences.push(`extra ${path}`);
  }
  return differences;
}
