#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function locationAt(source, offset) {
  const before = source.slice(0, offset);
  const lines = before.split('\n');
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
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

export function analyzeVueForgeSource(source, mapping) {
  const findings = [];
  const packageMappings = new Map(mapping.packageMappings.map((entry) => [entry.source, entry]));
  const componentMappings = new Map(mapping.componentMappings.map((entry) => [entry.source, entry]));
  const componentPattern = new RegExp(`\\b(${[...componentMappings.keys()].map(escapeRegExp).join('|')})\\b`, 'gu');

  for (const match of source.matchAll(/(['"])(@codemonster-ru\/vueforge-[a-z0-9-]+(?:\/[^'"\s]+)?)\1/gu)) {
    const specifier = match[2];
    const packageName = specifier.match(/^@codemonster-ru\/vueforge-[a-z0-9-]+/u)?.[0];
    const entry = packageMappings.get(packageName);
    const offset = (match.index ?? 0) + 1;
    findings.push({
      kind: 'package',
      value: specifier,
      action: entry?.action ?? 'manual',
      targets: entry?.targets ?? [],
      offset,
    });
  }

  for (const match of source.matchAll(componentPattern)) {
    const entry = componentMappings.get(match[1]);
    findings.push({
      kind: 'component',
      value: match[1],
      action: entry.action,
      targets: entry.targets,
      offset: match.index ?? 0,
    });
  }

  for (const [kind, pattern] of [
    ['css-variable', /--vf-[a-z0-9-]+/gu],
    ['css-class', /\.vf-[a-z0-9_-]+|(?<![-.a-z0-9_])vf-[a-z0-9_-]+/gu],
    ['theme-attribute', /\bdata-vf-theme\b/gu],
  ]) {
    for (const match of source.matchAll(pattern)) {
      const value = kind === 'css-class' && !match[0].startsWith('.') ? `.${match[0]}` : match[0];
      findings.push({ kind, value, action: 'manual', targets: [], offset: match.index ?? 0 });
    }
  }

  return findings.sort((left, right) => left.offset - right.offset || left.kind.localeCompare(right.kind));
}

export function checkVueForgeMigration(paths, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const mapping = options.mapping ?? readVueForgeMapping();
  const files = [...new Set(paths.flatMap(collectFiles))].sort();

  return files.flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    return analyzeVueForgeSource(source, mapping).map(({ offset, ...finding }) => ({
      file: relative(root, file).split('\\').join('/'),
      ...locationAt(source, offset),
      ...finding,
    }));
  });
}

function parseArguments(args) {
  const options = { format: 'text', allowFindings: false, paths: [] };
  for (const argument of args) {
    if (argument === '--write') throw new Error('This checker is read-only; --write belongs to CMUI-152 codemods.');
    if (argument === '--allow-findings') options.allowFindings = true;
    else if (argument === '--format=json') options.format = 'json';
    else if (argument.startsWith('-')) throw new Error(`Unknown option: ${argument}`);
    else options.paths.push(argument);
  }
  if (options.paths.length === 0) throw new Error('Provide at least one file or directory to check.');
  return options;
}

function formatFinding(finding) {
  const target = finding.targets.length > 0 ? ` -> ${finding.targets.join(' + ')}` : '';
  return `${finding.file}:${finding.line}:${finding.column} ${finding.kind} ${finding.value} [${finding.action}]${target}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const findings = checkVueForgeMigration(options.paths);
    if (options.format === 'json') console.log(JSON.stringify({ findings }, null, 2));
    else if (findings.length === 0) console.log('[vueforge-migration] No frozen VueForge references found.');
    else for (const finding of findings) console.log(formatFinding(finding));
    if (findings.length > 0 && !options.allowFindings) process.exitCode = 1;
  } catch (error) {
    console.error(`[vueforge-migration] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
