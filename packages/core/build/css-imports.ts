import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Resolves local CSS imports into one publishable artifact.
 *
 * A fresh dependency set is created for each top-level call so separate CSS
 * exports remain self-contained, while repeated dependencies inside one
 * artifact are emitted only once.
 */
export function inlineCssImports(
  filePath: string,
  seen: Set<string> = new Set<string>(),
  trace: string[] = [],
): string {
  if (trace.includes(filePath)) {
    throw new Error(`Circular CSS import detected: ${[...trace, filePath].join(' -> ')}`);
  }

  if (seen.has(filePath)) {
    return '';
  }

  seen.add(filePath);
  const source = readFileSync(filePath, 'utf8');

  return source.replace(/^@import\s+['"](.+?)['"];\s*$/gm, (_statement, importPath: string) => {
    if (!importPath.startsWith('.')) {
      return `@import '${importPath}';`;
    }

    return inlineCssImports(resolve(dirname(filePath), importPath), seen, [...trace, filePath]);
  });
}

/** Composes several roots into one artifact with a shared dependency set. */
export function inlineCssFiles(filePaths: readonly string[]): string {
  const seen = new Set<string>();

  return filePaths
    .map((filePath) => inlineCssImports(filePath, seen))
    .filter(Boolean)
    .join('\n');
}
