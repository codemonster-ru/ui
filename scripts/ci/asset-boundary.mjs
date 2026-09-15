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
 * Splits a source file into its string literals and its comment-free code.
 *
 * A regex that just pairs up quotes is wrong on real source, and wrong in the
 * dangerous direction. One apostrophe in prose - `the artifact's provenance` -
 * pairs with the opening quote of the next real literal, so everything after it
 * lands in the gaps between bogus "literals" and is never scanned. M10 found
 * this live: a forbidden `packages/icons` path injected into the Razor
 * stylesheet list was not reported, because a comment five lines above it
 * contained an apostrophe. Eight of the nineteen guarded files carry one.
 *
 * So the source is walked once, tracking whether it is inside a comment or a
 * string. `hashComments` is for PHP, where `#` starts a comment - except `#[`,
 * which is an attribute and can contain literals worth seeing.
 *
 * A scan that ends inside an unterminated string, regular expression or block
 * comment is reported rather than trusted: it means this walk lost sync, and
 * under-reporting is exactly the failure this guard exists to prevent.
 */
/** Where a `/` can only begin a regular expression, never a division. */
const REGEX_PRECEDING_CHARACTERS = new Set([
  '(',
  ',',
  '=',
  ':',
  '[',
  '!',
  '&',
  '|',
  '?',
  '{',
  '}',
  ';',
  '+',
  '-',
  '*',
  '%',
  '~',
  '^',
  '<',
  '>',
  '\n',
]);
const REGEX_PRECEDING_KEYWORDS =
  /(?:^|[^A-Za-z0-9_$])(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

export function scanSource(source, { hashComments = false, regexLiterals = !hashComments } = {}) {
  const literals = [];
  const code = [];
  let unterminated = false;
  let index = 0;

  /** The last character that mattered, used to tell a regex from a division. */
  const lastSignificant = () => {
    const text = code.join('');
    const trimmed = text.replace(/\s+$/, '');
    return { character: trimmed.at(-1), text: trimmed };
  };

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1;
      continue;
    }

    if (character === '/' && next === '*') {
      // A block comment that never closes swallowed the rest of the file and
      // still reported a clean scan, which is the one outcome this guard must
      // never produce: everything after `/*` became invisible, so a forbidden
      // path below it was neither a literal nor code. Losing sync here is
      // reported the same way an unterminated string or regex is.
      index += 2;
      let closed = false;

      while (index < source.length) {
        if (source[index] === '*' && source[index + 1] === '/') {
          closed = true;
          index += 2;
          break;
        }
        index += 1;
      }

      if (!closed) {
        unterminated = true;
        break;
      }

      continue;
    }

    // PHP 8 attributes start with `#[` and are code, not comment.
    if (hashComments && character === '#' && next !== '[') {
      while (index < source.length && source[index] !== '\n') index += 1;
      continue;
    }

    // A regular expression can contain quotes, and treating them as string
    // delimiters is how this walk lost sync on the Razor asset builder:
    // /^@import\s+['"](.+?)['"];/ opened a string that never closed.
    if (regexLiterals && character === '/') {
      const { character: previous, text } = lastSignificant();
      const startsRegex =
        previous === undefined || REGEX_PRECEDING_CHARACTERS.has(previous) || REGEX_PRECEDING_KEYWORDS.test(text);

      if (startsRegex) {
        let inClass = false;
        let closed = false;
        index += 1;

        while (index < source.length) {
          const inner = source[index];
          if (inner === '\\') {
            index += 2;
            continue;
          }
          if (inner === '\n') break;
          if (inner === '[') inClass = true;
          else if (inner === ']') inClass = false;
          else if (inner === '/' && !inClass) {
            closed = true;
            index += 1;
            break;
          }
          index += 1;
        }

        if (!closed) {
          unterminated = true;
          break;
        }

        // Flags, then a placeholder so the next `/` is read as division.
        while (index < source.length && /[a-z]/.test(source[index])) index += 1;
        code.push('0');
        continue;
      }
    }

    if (character === "'" || character === '"' || character === '`') {
      const quote = character;
      let value = '';
      let closed = false;
      index += 1;

      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          closed = true;
          index += 1;
          break;
        }
        value += source[index];
        index += 1;
      }

      if (!closed) {
        unterminated = true;
        break;
      }

      literals.push(value);
      code.push(value);
      continue;
    }

    code.push(character);
    index += 1;
  }

  return { literals, code: code.join(''), unterminated };
}

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
export function extractRepositoryPaths(source, options = {}) {
  const paths = new Set();

  for (const literal of scanSource(source, options).literals) {
    for (const match of literal.matchAll(repositoryPathPattern)) {
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
      const scanOptions = { hashComments: file.endsWith('.php') };
      const scan = scanSource(source, scanOptions);

      // Losing sync means the paths below are whatever survived the confusion,
      // which is not something to report as a clean result.
      if (scan.unterminated) {
        violations.push(
          `${file}: could not be scanned - an unterminated string, regular expression or ` +
            'block comment means its paths cannot be trusted.',
        );
        continue;
      }

      named = extractRepositoryPaths(source, scanOptions);

      // A relative literal that climbs out of the package. Found by the M22
      // boundary attack, the JavaScript twin of M21's dirname(__DIR__, n): a
      // `readFileSync(resolve(packageRoot, '../core/src/...'))` in the asset
      // build names no `packages/` path, so the repository-path scan above
      // never saw it, and it is not an import, so the dependency guard never
      // saw it either. Every `../` literal is resolved against the file's own
      // directory and judged as the repository path it reaches. M23 added the
      // `/../` prefix: PHP spells the same climb as `__DIR__ . '/../../core'`,
      // and a literal that starts with the slash was neither a `../` literal
      // nor a `packages/` path, so it reached the gate unseen - the PHP twin
      // of the M22 finding.
      for (const literal of scanSource(source, scanOptions).literals) {
        if (!/^\/?\.\.\//.test(literal)) continue;
        const segments = file.split('/').slice(0, -1);
        for (const part of literal.split('/')) {
          if (part === '..') segments.pop();
          else if (part !== '.' && part !== '') segments.push(part);
        }
        const reached = segments.join('/');
        if (/^(?:packages|examples)\//.test(reached) && !named.includes(reached)) named.push(reached);
      }

      // Belt and braces after M10 found the literal scan silently blind. A
      // forbidden package that appears in the code but in no literal is either
      // a construction this walk does not model or an attempt to hide one;
      // either way it is not a clean result. Comments are already stripped, so
      // prose explaining history still costs nothing.
      for (const forbidden of forbiddenPackages) {
        if (scan.code.includes(`${forbidden}/`) && !named.some((path) => packageOf(path) === forbidden)) {
          violations.push(
            `${file}: names "${forbidden}" outside any string literal this scanner understands. ` +
              'The Razor adapter and its build may only read ' +
              `${neutralPackages.join(', ')}.`,
          );
        }
      }
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

    // How many directories the file sits below the package root: a
    // `dirname(__DIR__, n)` that climbs further than that leaves the package
    // as surely as a `../` does. Found by the M21 boundary attack, which
    // wrote its escape with dirname() and was not caught.
    const depth = file.split('/').length - 3;

    for (const match of source.matchAll(/\b(require|require_once|include|include_once)\b\s*[^;]*/g)) {
      const statement = match[0];
      const climbs = [...statement.matchAll(/dirname\(\s*__DIR__\s*(?:,\s*(\d+))?\s*\)/g)].reduce(
        (total, [, levels]) => total + Number(levels ?? 1),
        0,
      );
      if (
        /\.\.\s*\/\s*\.\./.test(statement) ||
        /\.\.\//.test(statement.replace(/\s+/g, '')) ||
        climbs > depth ||
        /dirname\(\s*dirname\(/.test(statement)
      ) {
        violations.push(
          `${file}: ${match[1]} escapes the package (${statement.trim().slice(0, 80)}). ` +
            'Installed code is found through Composer autoloading, not relative paths.',
        );
      }
    }
  }

  return violations;
}
