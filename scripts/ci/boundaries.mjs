// Architecture boundary model and analyzer for the multiplatform migration.
//
// The rules below encode the dependency direction of the approved plan
// (docs/multiplatform-architecture-plan.md, sections 9 and 10): neutral packages
// never import an adapter, the Razor adapter never imports the Vue adapter, and
// the Vue adapter never imports Razor bootstrap code.
//
// The analyzer is deliberately small and reads only what the repository already
// has: package manifests and source text. No dependency-analysis framework is
// introduced.
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

// Pseudo-target used for `vue`, `vue/*` and `@vue/*` specifiers.
export const vueTarget = 'vue';

const vueAdapterPackages = ['core', 'layouts', 'icons', 'codeblock', 'playground', 'playground-vite-plugin'];

// Packages whose dependency direction is enforced. A package absent from this
// list is unconstrained: M02 fixes the direction of the new boundaries and of
// the neutral packages that already satisfy it, and does not retro-fit rules
// onto the existing Vue adapter graph.
export const boundaryRules = [
  {
    id: 'shared-core',
    directory: 'packages/shared-core',
    packageName: '@codemonster-ru/vueforge-shared-core',
    layer: 'neutral',
    // M02 boundary package. Nothing may pull an adapter, a framework runtime or
    // the browser into the platform-neutral core.
    forbiddenTargets: [vueTarget, ...vueAdapterPackages, 'playground-core', 'razor', 'examples/playground'],
    forbidBrowserGlobals: true,
    mustBePrivate: true,
    mustExist: true,
  },
  {
    id: 'styles',
    directory: 'packages/styles',
    packageName: '@codemonster-ru/vueforge-styles',
    layer: 'neutral',
    // CSS owner. It receives tokens from theme and knows nothing about Vue
    // lifecycle or any adapter.
    forbiddenTargets: [vueTarget, ...vueAdapterPackages, 'playground-core', 'razor', 'examples/playground'],
    forbidBrowserGlobals: false,
    mustBePrivate: true,
    mustExist: true,
  },
  {
    id: 'theme',
    directory: 'packages/theme',
    packageName: '@codemonster-ru/vueforge-theme',
    layer: 'neutral',
    // Already neutral at the reference commit; the rule locks that in. DOM is
    // allowed on purpose: `applyThemeConfig` takes a Document, and
    // framework-independent does not mean DOM-free (plan, section 3.3).
    forbiddenTargets: [vueTarget, ...vueAdapterPackages, 'playground-core', 'razor', 'examples/playground'],
    forbidBrowserGlobals: false,
    mustBePrivate: false,
    mustExist: true,
  },
  {
    id: 'razor',
    directory: 'packages/razor',
    packageName: 'codemonster-ru/vueforge-razor',
    layer: 'adapter',
    // Declared now, active as soon as a Razor package is tracked in git. The
    // untracked first-migration leftover in the working tree is not scanned.
    forbiddenTargets: [vueTarget, 'core', 'layouts'],
    forbidBrowserGlobals: false,
    mustBePrivate: false,
    mustExist: false,
  },
  {
    id: 'core',
    directory: 'packages/core',
    packageName: '@codemonster-ru/vueforge-core',
    layer: 'vue-adapter',
    // The Vue adapter must not depend on Razor bootstrap.
    forbiddenTargets: ['razor'],
    forbidBrowserGlobals: false,
    mustBePrivate: false,
    mustExist: true,
  },
  {
    id: 'layouts',
    directory: 'packages/layouts',
    packageName: '@codemonster-ru/vueforge-layouts',
    layer: 'vue-adapter',
    forbiddenTargets: ['razor'],
    forbidBrowserGlobals: false,
    mustBePrivate: false,
    mustExist: true,
  },
];

const scannedExtensions = ['.ts', '.mts', '.cts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.vue', '.css'];

// Browser globals that must not appear in the platform-neutral core. Matched on
// a word boundary so `documentation` or `windowSize` do not trip the rule.
const browserGlobalPatterns = [
  /\bdocument\s*\./,
  /\bwindow\s*\./,
  /\bnavigator\s*\./,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bmatchMedia\b/,
  /\brequestAnimationFrame\b/,
  /\bHTML[A-Z]\w*Element\b/,
  /\bgetComputedStyle\b/,
];

const specifierPatterns = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\bimport\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g,
];

export function extractSpecifiers(source) {
  const specifiers = new Set();

  for (const pattern of specifierPatterns) {
    pattern.lastIndex = 0;
    let match = pattern.exec(source);
    while (match !== null) {
      specifiers.add(match[1]);
      match = pattern.exec(source);
    }
  }

  return [...specifiers];
}

function hasScannedExtension(filePath) {
  return scannedExtensions.some((extension) => filePath.endsWith(extension));
}

// Maps a module specifier onto a target id, or null when it points outside the
// architecture (an ordinary npm dependency, or a path that is not a package).
//
// A relative specifier only becomes an edge when it actually lands inside a
// known package directory. Without that check, quoted specifiers that live
// inside generated-code template literals — the auto-CSS entry writers in the
// core and layouts vite configs emit `'../${entryName}.css'` — would resolve to
// invented targets.
export function resolveTarget(specifier, fromFile, { rootDir, packageDirectoryByName, knownDirectories }) {
  if (specifier.includes('${') || specifier.includes('`')) {
    return null;
  }

  if (specifier === 'vue' || specifier.startsWith('vue/') || specifier.startsWith('@vue/')) {
    return vueTarget;
  }

  if (specifier.startsWith('@codemonster-ru/')) {
    const [scope, packageSegment] = specifier.split('/');
    return packageDirectoryByName.get(`${scope}/${packageSegment}`) ?? null;
  }

  if (specifier.startsWith('.')) {
    const relativePath = relative(rootDir, resolve(fromFile, '..', specifier))
      .split('\\')
      .join('/');
    const segments = relativePath.split('/');

    if (segments[0] === 'packages' && knownDirectories.has(segments[1])) {
      return segments[1];
    }
    if (segments[0] === 'examples' && knownDirectories.has(`examples/${segments[1]}`)) {
      return `examples/${segments[1]}`;
    }
  }

  return null;
}

function readManifest(rootDir, directory) {
  try {
    return JSON.parse(readFileSync(resolve(rootDir, directory, 'package.json'), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Analyses the tracked file list against the boundary rules.
 *
 * @param {{ rootDir: string, files: string[] }} input repository root and the
 *   repo-relative paths to consider. Callers pass git-tracked files only, so
 *   untracked leftovers never influence the result.
 */
export function analyzeBoundaries({ rootDir, files }) {
  const violations = [];
  const notes = [];
  const edges = [];

  const packageDirectoryByName = new Map();
  const knownDirectories = new Set(boundaryRules.map((rule) => rule.directory.split('/').slice(1).join('/')));

  for (const file of files) {
    if (!/^(packages|examples)\/[^/]+\/package\.json$/.test(file)) {
      continue;
    }

    const [area, directoryName] = file.split('/');
    const directoryId = area === 'examples' ? `examples/${directoryName}` : directoryName;
    knownDirectories.add(directoryId);

    const manifest = readManifest(rootDir, file.slice(0, -'/package.json'.length));
    if (manifest?.name) {
      packageDirectoryByName.set(manifest.name, directoryId);
    }
  }

  const resolution = { rootDir, packageDirectoryByName, knownDirectories };

  for (const rule of boundaryRules) {
    const manifest = readManifest(rootDir, rule.directory);
    const ownedFiles = files.filter((file) => file.startsWith(`${rule.directory}/`));

    if (!manifest) {
      if (rule.mustExist) {
        violations.push(`${rule.id}: expected a package manifest at ${rule.directory}/package.json`);
      } else if (ownedFiles.length > 0) {
        violations.push(`${rule.id}: tracked files exist under ${rule.directory} but the manifest is missing`);
      } else {
        notes.push(`${rule.id}: not tracked yet; its rules are declared and will apply once the package lands`);
      }
      continue;
    }

    if (manifest.name !== rule.packageName) {
      violations.push(`${rule.id}: package name is "${manifest.name}", the plan fixes it at "${rule.packageName}"`);
    }

    if (rule.mustBePrivate && manifest.private !== true) {
      violations.push(`${rule.id}: boundary package must stay "private": true until it has a real consumer`);
    }

    const forbidden = new Set(rule.forbiddenTargets);

    for (const field of ['dependencies', 'peerDependencies']) {
      for (const dependencyName of Object.keys(manifest[field] ?? {})) {
        const target = resolveTarget(dependencyName, resolve(rootDir, rule.directory, 'package.json'), resolution);
        if (target !== null && forbidden.has(target)) {
          violations.push(
            `${rule.id}: manifest ${field} declares forbidden dependency "${dependencyName}" (${rule.id} -> ${target})`,
          );
        }
      }
    }

    for (const file of ownedFiles) {
      if (!hasScannedExtension(file)) {
        continue;
      }

      const absolutePath = resolve(rootDir, file);
      let source;
      try {
        source = readFileSync(absolutePath, 'utf8');
      } catch {
        continue;
      }

      for (const specifier of extractSpecifiers(source)) {
        const target = resolveTarget(specifier, absolutePath, resolution);
        if (target === null || target === rule.id) {
          continue;
        }

        edges.push({ from: rule.id, to: target, file, specifier });

        if (forbidden.has(target)) {
          violations.push(`${file}: forbidden dependency ${rule.id} -> ${target} via "${specifier}"`);
          continue;
        }

        // Allowed direction, but reached through a relative path that leaves the
        // package. Reported so the known build-time leaks stay visible without
        // failing a milestone that is not allowed to touch product source
        // (plan, sections 3.3 and 10).
        if (specifier.startsWith('.')) {
          notes.push(
            `${file}: escape import ${rule.id} -> ${target} via "${specifier}" (allowed direction, published entry preferred)`,
          );
        }
      }

      if (rule.forbidBrowserGlobals) {
        for (const pattern of browserGlobalPatterns) {
          if (pattern.test(source)) {
            violations.push(`${file}: ${rule.id} must stay DOM-free, found browser global matching ${pattern}`);
          }
        }
      }
    }
  }

  return { violations, notes, edges };
}
