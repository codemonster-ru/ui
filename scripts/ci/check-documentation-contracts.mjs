#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import { compileTemplate, parse as parseSfc } from '@vue/compiler-sfc';
import { isDocumentationScriptLanguage } from './documentation-fences.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ignoredDirectoryNames = new Set(['.git', '.npm-cache', 'build', 'coverage', 'dist', 'node_modules', 'vendor']);
const issues = [];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function toRelative(filePath) {
  return toPosix(path.relative(repositoryRoot, filePath));
}

function report(filePath, line, message) {
  issues.push(`${toRelative(filePath)}:${line} ${message}`);
}

function listFilesRecursively(directory, predicate) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectoryNames.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(entryPath, predicate));
    } else if (predicate(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

function lineNumberAt(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function diagnosticMessage(diagnostic) {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
}

function maskFencedCode(source) {
  const lines = source.split('\n');
  let fence = null;

  return lines
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/u)?.[1];

      if (!fence && marker) {
        fence = { character: marker[0], length: marker.length };
        return ' '.repeat(line.length);
      }

      if (
        fence &&
        marker &&
        marker[0] === fence.character &&
        marker.length >= fence.length &&
        line.trim().replaceAll(fence.character, '') === ''
      ) {
        fence = null;
        return ' '.repeat(line.length);
      }

      return fence ? ' '.repeat(line.length) : line;
    })
    .join('\n');
}

function pathExistsWithExactCase(targetPath) {
  const absolutePath = path.resolve(targetPath);
  const relativePath = path.relative(repositoryRoot, absolutePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return false;
  }

  let currentPath = repositoryRoot;
  for (const segment of relativePath.split(path.sep).filter(Boolean)) {
    if (!existsSync(currentPath) || !statSync(currentPath).isDirectory()) {
      return false;
    }

    const exactSegment = readdirSync(currentPath).find((entry) => entry === segment);
    if (!exactSegment) {
      return false;
    }
    currentPath = path.join(currentPath, exactSegment);
  }

  return existsSync(currentPath);
}

function resolveMarkdownTarget(candidatePath) {
  const candidates = [
    candidatePath,
    `${candidatePath}.md`,
    path.join(candidatePath, 'index.md'),
    path.join(candidatePath, 'README.md'),
  ];

  for (const candidate of candidates) {
    if (!pathExistsWithExactCase(candidate)) {
      continue;
    }
    if (statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function headingSlug(value) {
  return value
    .replace(/<[^>]+>/gu, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/[`*_~]/gu, '')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
    .replace(/\s+/gu, '-');
}

function markdownAnchors(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const maskedSource = maskFencedCode(source);
  const anchors = new Set();
  const slugCounts = new Map();

  for (const line of maskedSource.split('\n')) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/u)?.[1];
    if (heading) {
      const baseSlug = headingSlug(heading);
      const count = slugCounts.get(baseSlug) ?? 0;
      anchors.add(count === 0 ? baseSlug : `${baseSlug}-${count}`);
      slugCounts.set(baseSlug, count + 1);
    }

    for (const match of line.matchAll(/\bid=["']([^"']+)["']/gu)) {
      anchors.add(match[1]);
    }
  }

  return anchors;
}

function normalizeLinkTarget(rawTarget) {
  return rawTarget.replace(/^<|>$/gu, '').replaceAll('&amp;', '&');
}

function checkLocalLink(sourceFile, source, rawTarget, offset) {
  const target = normalizeLinkTarget(rawTarget);

  if (/^(?:data:|mailto:|tel:|[a-z][a-z\d+.-]*:\/\/|\/\/)/iu.test(target)) {
    return;
  }

  const hashIndex = target.indexOf('#');
  const queryIndex = target.indexOf('?');
  const pathEndCandidates = [hashIndex, queryIndex].filter((index) => index >= 0);
  const pathEnd = pathEndCandidates.length > 0 ? Math.min(...pathEndCandidates) : target.length;
  const targetPath = decodeURIComponent(target.slice(0, pathEnd));
  const anchor = hashIndex >= 0 ? decodeURIComponent(target.slice(hashIndex + 1).split('?')[0]) : '';
  const candidatePath = targetPath
    ? targetPath.startsWith('/')
      ? path.join(repositoryRoot, 'docs', targetPath.slice(1))
      : path.resolve(path.dirname(sourceFile), targetPath)
    : sourceFile;
  const resolvedTarget = resolveMarkdownTarget(candidatePath);
  const line = lineNumberAt(source, offset);

  if (!resolvedTarget) {
    report(sourceFile, line, `links to missing local target ${JSON.stringify(target)}.`);
    return;
  }

  if (anchor && path.extname(resolvedTarget).toLowerCase() === '.md' && !markdownAnchors(resolvedTarget).has(anchor)) {
    report(sourceFile, line, `links to missing anchor #${anchor} in ${toRelative(resolvedTarget)}.`);
  }
}

function checkMarkdownLinks(markdownFiles) {
  for (const filePath of markdownFiles) {
    const source = readFileSync(filePath, 'utf8');
    const maskedSource = maskFencedCode(source);
    const inlineLinkPattern = /!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\)/gu;
    const referenceLinkPattern = /^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gmu;
    const htmlLinkPattern = /<(?:a\s+[^>]*href|img\s+[^>]*src)=["']([^"']+)["']/giu;

    for (const pattern of [inlineLinkPattern, referenceLinkPattern, htmlLinkPattern]) {
      for (const match of maskedSource.matchAll(pattern)) {
        checkLocalLink(filePath, source, match[1], match.index ?? 0);
      }
    }
  }
}

const publicPackages = new Map();
for (const packageJsonPath of listFilesRecursively(path.join(repositoryRoot, 'packages'), (filePath) =>
  filePath.endsWith(`${path.sep}package.json`),
)) {
  const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  if (!manifest.private) {
    publicPackages.set(manifest.name, { manifest, packageJsonPath });
  }
}

function packageExportExists(manifest, exportKey) {
  if (!manifest.exports || typeof manifest.exports !== 'object') {
    return exportKey === '.';
  }

  return Object.hasOwn(manifest.exports, exportKey);
}

function checkPublicPackageSpecifier(specifier, filePath, line) {
  if (!specifier.startsWith('@codemonster-ru/ui-') && !specifier.startsWith('@codemonster-ru/vueforge-')) {
    return;
  }

  const match = specifier.match(/^(@codemonster-ru\/(?:ui|vueforge)-[a-z\d-]+)(\/.*)?$/u);
  const packageName = match?.[1];
  const subpath = match?.[2];
  const packageRecord = packageName ? publicPackages.get(packageName) : undefined;

  if (!packageRecord) {
    report(filePath, line, `references unknown package ${JSON.stringify(specifier)}.`);
    return;
  }

  const exportKey = subpath ? `.${subpath}` : '.';
  if (!packageExportExists(packageRecord.manifest, exportKey)) {
    report(filePath, line, `imports unpublished subpath ${JSON.stringify(specifier)}.`);
  }
}

function collectScriptImports(sourceFile, markdownPath, markdownLine) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    const localLine = sourceFile.getLineAndCharacterOfPosition(statement.getStart()).line;
    checkPublicPackageSpecifier(statement.moduleSpecifier.text, markdownPath, markdownLine + localLine + 1);
  }
}

function checkScriptSnippet(code, language, filePath, line) {
  const scriptKind = language === 'js' || language === 'javascript' ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    `snippet.${scriptKind === ts.ScriptKind.JS ? 'js' : 'ts'}`,
    code,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  for (const diagnostic of sourceFile.parseDiagnostics) {
    const diagnosticLine =
      diagnostic.start == null ? 0 : sourceFile.getLineAndCharacterOfPosition(diagnostic.start).line;
    report(
      filePath,
      line + diagnosticLine + 1,
      `contains an invalid ${language} snippet: ${diagnosticMessage(diagnostic)}`,
    );
  }

  collectScriptImports(sourceFile, filePath, line);
}

function checkVueSnippet(code, filePath, line) {
  if (/<script(?:\s|>)/u.test(code) || /^\s*(?:<!--[^]*?-->\s*)?<template>/u.test(code)) {
    const parsed = parseSfc(code, { filename: `${toRelative(filePath)}:${line}` });
    for (const error of parsed.errors) {
      report(filePath, line, `contains an invalid Vue SFC snippet: ${String(error)}`);
    }

    for (const block of [parsed.descriptor.script, parsed.descriptor.scriptSetup]) {
      if (block) {
        checkScriptSnippet(block.content, block.lang ?? 'js', filePath, line + block.loc.start.line - 1);
      }
    }

    if (parsed.descriptor.template) {
      const result = compileTemplate({
        id: 'documentation-snippet',
        filename: `${toRelative(filePath)}:${line}`,
        source: parsed.descriptor.template.content,
      });
      for (const error of result.errors) {
        report(
          filePath,
          line + parsed.descriptor.template.loc.start.line - 1,
          `contains an invalid Vue template: ${String(error)}`,
        );
      }
    }
    return;
  }

  const result = compileTemplate({
    id: 'documentation-fragment',
    filename: `${toRelative(filePath)}:${line}`,
    source: code,
  });
  for (const error of result.errors) {
    report(filePath, line, `contains an invalid Vue template fragment: ${String(error)}`);
  }
}

function checkInstallSnippet(code, filePath, line) {
  const installPattern = /^\s*(?:npm\s+(?:install|i)|pnpm\s+add|yarn\s+add)\s+(.+)$/gmu;
  for (const match of code.matchAll(installPattern)) {
    const packages = match[1].split(/\s+/u).filter((token) => token && !token.startsWith('-'));
    for (const token of packages) {
      const packageName = token.match(/^(@codemonster-ru\/(?:ui|vueforge)-[a-z\d-]+)(?:@.+)?$/u)?.[1];
      if ((token.startsWith('@codemonster-ru/ui-') || token.startsWith('@codemonster-ru/vueforge-')) && !packageName) {
        report(filePath, line, `contains an invalid CodeMonster install target ${JSON.stringify(token)}.`);
      } else if (packageName && !publicPackages.has(packageName)) {
        report(filePath, line, `installs unknown package ${JSON.stringify(packageName)}.`);
      }
    }
  }
}

function checkCodeSnippets(markdownFiles) {
  const snippetPattern = /^```([a-z][a-z\d-]*)(?:[^\n]*)\n([\s\S]*?)^```\s*$/gmu;

  for (const filePath of markdownFiles) {
    const source = readFileSync(filePath, 'utf8');
    for (const match of source.matchAll(snippetPattern)) {
      const language = match[1];
      const code = match[2];
      const line = lineNumberAt(source, match.index ?? 0);

      if (!isDocumentationScriptLanguage(language)) {
        continue;
      }

      if (language === 'vue') {
        checkVueSnippet(code, filePath, line);
      } else if (language === 'bash' || language === 'sh' || language === 'shell') {
        checkInstallSnippet(code, filePath, line);
      } else {
        checkScriptSnippet(code, language, filePath, line);
      }
    }
  }
}

function checkReadmeContracts() {
  const requiredHeadings = [
    ['requirements'],
    ['install', 'installation'],
    ['quick-start', 'quickstart'],
    ['documentation'],
    ['license'],
  ];

  for (const { manifest, packageJsonPath } of publicPackages.values()) {
    const readmePath = path.join(path.dirname(packageJsonPath), 'README.md');
    const source = readFileSync(readmePath, 'utf8');
    const headings = [...source.matchAll(/^#{1,6}\s+(.+?)\s*$/gmu)].map((match) => headingSlug(match[1]));

    for (const alternatives of requiredHeadings) {
      if (
        !alternatives.some((expected) =>
          headings.some(
            (heading) => heading === expected || heading.startsWith(`${expected}-`) || heading.endsWith(`-${expected}`),
          ),
        )
      ) {
        report(readmePath, 1, `${manifest.name} README is missing a ${alternatives[0]} section.`);
      }
    }

    if (!source.includes(manifest.version)) {
      report(readmePath, 1, `${manifest.name} README does not identify current version ${manifest.version}.`);
    }
  }
}

const markdownFiles = listFilesRecursively(repositoryRoot, (filePath) => filePath.endsWith('.md'));
checkMarkdownLinks(markdownFiles);
checkCodeSnippets(markdownFiles);
checkReadmeContracts();

if (issues.length > 0) {
  console.error(`Documentation contract validation failed with ${issues.length} issue(s):\n`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Documentation contracts passed for ${markdownFiles.length} Markdown files and ${publicPackages.size} packages.`);
