// Neutral asset boundary for the Razor adapter.
//
// The dependency guard in boundaries.mjs reads import specifiers. H3 was a
// dependency it could not see: the Razor asset build named Vue adapter files as
// plain strings and read them with the filesystem, so `packages/razor` could not
// be built without `packages/core` while every import-level check stayed green.
//
// This is deliberately not a general static analyzer. It answers one question
// about a short list of files: does anything in the Razor adapter or its build
// name a path owned by a Vue adapter package?
import { readFileSync } from 'node:fs';

/** Files that may only ever reach neutral packages. */
export const guardedRoots = ['packages/razor/'];

/** Packages a Razor artifact may be composed from. */
export const neutralPackages = ['packages/theme', 'packages/styles', 'packages/shared-core'];

/** Packages the Razor adapter must never read, import or resolve. */
export const forbiddenPackages = [
  'packages/core',
  'packages/layouts',
  'packages/icons',
  'packages/codeblock',
  'packages/playground',
  'packages/playground-core',
  'packages/playground-vite-plugin',
  'examples/playground',
];

/** Composer package names that would pull an adapter back in. */
const forbiddenComposerPackages = ['codemonster-ru/vueforge-core', 'codemonster-ru/vueforge-layouts'];

const scannedExtensions = ['.mjs', '.cjs', '.js', '.ts', '.mts', '.php', '.json'];

const repositoryPathPattern = /(?:packages|examples)\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*/g;

/**
 * Any repository path a file names in a string literal.
 *
 * String literals rather than raw text, because that is where filesystem
 * coupling actually lives: `readFileSync('...')`, `resolve(root, '...')`, a
 * template literal and a bare string in an array all reach the same file, and
 * only the last one looks like an import. Prose in a comment explaining what a
 * package used to read is not a dependency, and flagging it would push accurate
 * comments out of the code.
 */
export function extractRepositoryPaths(source) {
  const paths = new Set();

  for (const literal of source.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g)) {
    const value = literal[1] ?? literal[2] ?? literal[3] ?? '';
    for (const match of value.matchAll(repositoryPathPattern)) {
      paths.add(match[0]);
    }
  }

  return [...paths];
}

/**
 * Repository paths a JSON document names, ignoring `$comment` prose.
 *
 * Generated artifacts record where they came from, and that provenance is
 * worth keeping accurate.
 */
export function extractJsonRepositoryPaths(value, key = '') {
  if (typeof value === 'string') {
    if (key.startsWith('$comment')) return [];
    return [...value.matchAll(repositoryPathPattern)].map((match) => match[0]);
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractJsonRepositoryPaths(entry, key));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([childKey, child]) => extractJsonRepositoryPaths(child, childKey));
  }

  return [];
}

function packageOf(repositoryPath) {
  const segments = repositoryPath.split('/');
  return segments.length >= 2 ? `${segments[0]}/${segments[1]}` : repositoryPath;
}

/**
 * @param {{ rootDir: string, files: string[], readFile?: (path: string) => string }} input
 *   Repository root and the repo-relative tracked files to consider.
 */
export function analyzeAssetBoundary({ rootDir, files, readFile }) {
  const violations = [];
  const edges = [];
  const read = readFile ?? ((file) => readFileSync(`${rootDir}/${file}`, 'utf8'));

  for (const file of files) {
    if (!guardedRoots.some((root) => file.startsWith(root))) continue;
    if (!scannedExtensions.some((extension) => file.endsWith(extension))) continue;

    let source;
    try {
      source = read(file);
    } catch {
      continue;
    }

    // A Composer manifest is checked as a manifest, not as prose.
    if (file.endsWith('composer.json')) {
      let manifest;
      try {
        manifest = JSON.parse(source);
      } catch {
        violations.push(`${file}: is not valid JSON, so its dependencies cannot be checked`);
        continue;
      }

      for (const field of ['require', 'require-dev']) {
        for (const name of Object.keys(manifest[field] ?? {})) {
          if (forbiddenComposerPackages.includes(name)) {
            violations.push(`${file}: composer ${field} declares forbidden dependency "${name}"`);
          }
        }
      }

      for (const repository of manifest.repositories ?? []) {
        if (repository?.type === 'path') {
          violations.push(
            `${file}: declares a path repository (${repository.url}). ` +
              'A distributable package must not resolve dependencies out of the working tree.',
          );
        }
      }
      continue;
    }

    let named;
    if (file.endsWith('.json')) {
      try {
        named = [...new Set(extractJsonRepositoryPaths(JSON.parse(source)))];
      } catch {
        violations.push(`${file}: is not valid JSON, so its paths cannot be checked`);
        continue;
      }
    } else {
      named = extractRepositoryPaths(source);
    }

    for (const repositoryPath of named) {
      const owner = packageOf(repositoryPath);

      // A file may always talk about its own package.
      if (guardedRoots.some((root) => repositoryPath.startsWith(root.replace(/\/$/, '')))) continue;

      if (forbiddenPackages.includes(owner)) {
        violations.push(
          `${file}: names "${repositoryPath}", which belongs to ${owner}. ` +
            'The Razor adapter and its build may only read ' +
            `${neutralPackages.join(', ')}. This is how H3 was reintroduced last time.`,
        );
        continue;
      }

      if (neutralPackages.includes(owner)) {
        edges.push({ file, path: repositoryPath, owner });
      }
    }
  }

  return { violations, edges };
}

/**
 * PHP that reaches outside its own package.
 *
 * `require __DIR__ . '/../../core/...'` would be invisible to a manifest check
 * and to the import scanner. Composer autoloading is the only supported way for
 * the installed package to find code.
 */
export function analyzePhpIncludes({ rootDir, files, readFile }) {
  const violations = [];
  const read = readFile ?? ((file) => readFileSync(`${rootDir}/${file}`, 'utf8'));

  for (const file of files) {
    if (!file.startsWith('packages/razor/src/') || !file.endsWith('.php')) continue;

    let source;
    try {
      source = read(file);
    } catch {
      continue;
    }

    for (const match of source.matchAll(/\b(require|require_once|include|include_once)\b\s*[^;]*/g)) {
      const statement = match[0];
      if (/\.\.\s*\/\s*\.\./.test(statement) || /\.\.\//.test(statement.replace(/\s+/g, ''))) {
        violations.push(
          `${file}: ${match[1]} escapes the package (${statement.trim().slice(0, 80)}). ` +
            'Installed code is found through Composer autoloading, not relative paths.',
        );
      }
    }
  }

  return violations;
}
