#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { readVueForgeMapping } from './migration/vueforge-mapping.mjs';

const ignoredDirectories = new Set(['.git', 'build', 'coverage', 'dist', 'node_modules', 'storage', 'var', 'vendor']);
const supportedExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.mjs',
  '.php',
  '.sass',
  '.scss',
  '.ts',
  '.tsx',
  '.vue',
]);
const uiVuePackage = '@codemonster-ru/ui-vue';

function kebab(value) {
  return value
    .replace(/^Vf/u, '')
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .toLowerCase();
}

function collectFiles(path) {
  const absolute = resolve(path);
  if (!existsSync(absolute)) throw new Error(`Path does not exist: ${path}`);
  if (!statSync(absolute).isDirectory()) return supportedExtensions.has(extname(absolute)) ? [absolute] : [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    return collectFiles(resolve(absolute, entry.name));
  });
}

function applyEdits(source, edits) {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce((output, edit) => output.slice(0, edit.start) + edit.text + output.slice(edit.end), source);
}

function renameScriptIdentifiers(source, renames) {
  if (renames.size === 0) return source;
  const sourceFile = ts.createSourceFile('migration.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if (ts.isIdentifier(node) && renames.has(node.text)) {
      edits.push({ start: node.getStart(sourceFile), end: node.getEnd(), text: renames.get(node.text) });
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return applyEdits(source, edits);
}

function migrateNamedImports(source, directMappings) {
  const renames = new Map();
  const importPattern =
    /import\s*\{([\s\S]*?)\}\s*from\s*(['"])(@codemonster-ru\/vueforge-(?:core|layouts)(?:\/[^'"]+)?)\2\s*;?/gu;
  const migrated = source.replace(importPattern, (statement, contents, quote, packageSource) => {
    const remaining = [];
    const replacements = [];
    for (const rawSpecifier of contents.split(',')) {
      const specifier = rawSpecifier.trim();
      const match = specifier.match(/^(type\s+)?(Vf[A-Z][A-Za-z0-9]+)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/u);
      const mapping = match ? directMappings.get(match[2]) : undefined;
      if (!match || match[1] || !mapping) {
        if (specifier) remaining.push(specifier);
        continue;
      }
      const target = mapping.targets[0];
      const alias = match[3];
      replacements.push(alias ? `${target} as ${alias}` : target);
      if (!alias) renames.set(match[2], target);
    }
    if (replacements.length === 0) return statement;

    const parts = [];
    if (remaining.length > 0) parts.push(`import { ${remaining.join(', ')} } from ${quote}${packageSource}${quote};`);
    parts.push(`import { ${replacements.join(', ')} } from ${quote}${uiVuePackage}${quote};`);
    return parts.join('\n');
  });
  return { source: renameScriptIdentifiers(migrated, renames), renames };
}

function migrateVue(source, directMappings) {
  const renames = new Map();
  const migratedScripts = source.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gu, (_all, open, script, close) => {
    const result = migrateNamedImports(script, directMappings);
    for (const [from, to] of result.renames) renames.set(from, to);
    return `${open}${result.source}${close}`;
  });
  if (renames.size === 0) return migratedScripts;
  return migratedScripts.replace(/(<\/?)(Vf[A-Z][A-Za-z0-9]+)(?=[\s/>])/gu, (all, open, name) => {
    return renames.has(name) ? `${open}${renames.get(name)}` : all;
  });
}

export function migrateCodeMonsterSource(source, extension, mapping = readVueForgeMapping()) {
  const directMappings = new Map(
    mapping.componentMappings.filter(({ action }) => action === 'replace').map((entry) => [entry.source, entry]),
  );
  let migrated =
    extension === '.vue' ? migrateVue(source, directMappings) : migrateNamedImports(source, directMappings).source;

  for (const [legacy, entry] of directMappings) {
    const slug = kebab(legacy);
    for (const packageName of ['core', 'layouts']) {
      const from = `@codemonster-ru/vueforge-${packageName}/${slug}.css`;
      migrated = migrated.replaceAll(from, `@codemonster-ru/ui-css/${slug}.css`);
    }
  }
  return migrated;
}

export function migrateCodeMonsterPaths(paths, { write = false } = {}) {
  const files = [...new Set(paths.flatMap(collectFiles))].sort();
  const changed = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const migrated = migrateCodeMonsterSource(source, extname(file));
    if (migrated === source) continue;
    changed.push(file);
    if (write) writeFileSync(file, migrated);
  }
  return changed;
}

function parseArguments(args) {
  const options = { write: false, paths: [] };
  for (const argument of args) {
    if (argument === '--write') options.write = true;
    else if (argument.startsWith('-')) throw new Error(`Unknown option: ${argument}`);
    else options.paths.push(argument);
  }
  if (options.paths.length === 0) throw new Error('Provide at least one file or directory to migrate.');
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const changed = migrateCodeMonsterPaths(options.paths, options);
    console.log(`[codemonster-migration] ${options.write ? 'Updated' : 'Would update'} ${changed.length} file(s).`);
    if (!options.write && changed.length > 0) process.exitCode = 1;
  } catch (error) {
    console.error(`[codemonster-migration] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
