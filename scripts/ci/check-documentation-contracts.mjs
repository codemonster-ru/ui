#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import { compileTemplate, parse as parseSfc } from '@vue/compiler-sfc';
import { isDocumentationScriptLanguage } from './documentation-fences.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ignoredDirectoryNames = new Set(['.git', '.npm-cache', 'build', 'coverage', 'dist', 'node_modules']);
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

function checkVueForgeSpecifier(specifier, filePath, line) {
  if (!specifier.startsWith('@codemonster-ru/vueforge-')) {
    return;
  }

  const match = specifier.match(/^(@codemonster-ru\/vueforge-[a-z\d-]+)(\/.*)?$/u);
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
    checkVueForgeSpecifier(statement.moduleSpecifier.text, markdownPath, markdownLine + localLine + 1);
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
      const packageName = token.match(/^(@codemonster-ru\/vueforge-[a-z\d-]+)(?:@.+)?$/u)?.[1];
      if (token.startsWith('@codemonster-ru/vueforge-') && !packageName) {
        report(filePath, line, `contains an invalid VueForge install target ${JSON.stringify(token)}.`);
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

function kebabCaseComponent(componentName) {
  return componentName
    .replace(/^Vf/u, '')
    .replace(/([a-z\d])([A-Z])/gu, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/gu, '$1-$2')
    .toLowerCase();
}

function findVueComponentSource(componentName, rootDirectory) {
  return listFilesRecursively(rootDirectory, (filePath) => path.basename(filePath) === `${componentName}.vue`)[0];
}

function publicComponentContracts() {
  const contracts = [];
  const coreComponentsRoot = path.join(repositoryRoot, 'packages/core/src/components');
  const coreIndexPath = path.join(coreComponentsRoot, 'index.ts');
  const coreIndex = readFileSync(coreIndexPath, 'utf8');

  for (const match of coreIndex.matchAll(/export\s*\{\s*(Vf[A-Za-z\d]+)\s*\}\s*from\s*['"][^'"]+['"]/gu)) {
    const componentName = match[1];
    contracts.push({
      componentName,
      sourcePath: findVueComponentSource(componentName, coreComponentsRoot),
      docsPath: path.join(repositoryRoot, 'docs/core/components', kebabCaseComponent(componentName), 'api.md'),
    });
  }

  const layoutsRoot = path.join(repositoryRoot, 'packages/layouts/src');
  const layoutsIndex = readFileSync(path.join(layoutsRoot, 'index.ts'), 'utf8');
  for (const match of layoutsIndex.matchAll(
    /export\s*\{\s*default\s+as\s+(Vf[A-Za-z\d]+)\s*\}\s*from\s*['"]([^'"]+\.vue)['"]/gu,
  )) {
    const componentName = match[1];
    contracts.push({
      componentName,
      sourcePath: path.resolve(layoutsRoot, match[2]),
      docsPath: path.join(repositoryRoot, 'docs/layouts/components', kebabCaseComponent(componentName), 'api.md'),
    });
  }

  contracts.push(
    {
      componentName: 'VueIconify',
      sourcePath: path.join(repositoryRoot, 'packages/icons/src/lib/components/icon.vue'),
      docsPath: path.join(repositoryRoot, 'docs/icons/components/vue-iconify/api.md'),
    },
    {
      componentName: 'VfCodeBlock',
      sourcePath: path.join(repositoryRoot, 'packages/codeblock/src/components/VfCodeBlock.vue'),
      docsPath: path.join(repositoryRoot, 'docs/codeblock/components/code-block/api.md'),
    },
    {
      componentName: 'VfPlayground',
      sourcePath: path.join(repositoryRoot, 'packages/playground/src/VfPlayground.vue'),
      docsPath: path.join(repositoryRoot, 'docs/playground/components/playground/api.md'),
    },
  );

  return contracts;
}

function findMacroCall(sourceFile, macroName) {
  let result;

  function visit(node) {
    if (
      !result &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === macroName
    ) {
      result = node;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return result;
}

function declarationName(declaration) {
  return declaration.name && ts.isIdentifier(declaration.name) ? declaration.name.text : undefined;
}

function resolveRelativeTypeImport(typeName, sourceFile, sourcePath) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      continue;
    }

    const imported = namedBindings.elements.find((element) => element.name.text === typeName);
    if (!imported || !statement.moduleSpecifier.text.startsWith('.')) {
      continue;
    }

    const importBase = path.resolve(path.dirname(sourcePath), statement.moduleSpecifier.text);
    const candidates = [`${importBase}.ts`, `${importBase}.d.ts`, path.join(importBase, 'index.ts')];
    const resolvedPath = candidates.find((candidate) => existsSync(candidate));
    if (!resolvedPath) {
      continue;
    }

    const importedSource = ts.createSourceFile(
      resolvedPath,
      readFileSync(resolvedPath, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    return {
      declarationName: imported.propertyName?.text ?? imported.name.text,
      sourceFile: importedSource,
      sourcePath: resolvedPath,
    };
  }

  return undefined;
}

function resolveTypeMembers(typeNode, sourceFile, sourcePath, seen = new Set()) {
  if (!typeNode) {
    return [];
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    return [...typeNode.members];
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return resolveTypeMembers(typeNode.type, sourceFile, sourcePath, seen);
  }

  if (ts.isIntersectionTypeNode(typeNode) || ts.isUnionTypeNode(typeNode)) {
    return typeNode.types.flatMap((member) => resolveTypeMembers(member, sourceFile, sourcePath, seen));
  }

  if (!ts.isTypeReferenceNode(typeNode) || !ts.isIdentifier(typeNode.typeName)) {
    return [];
  }

  const typeName = typeNode.typeName.text;
  const seenKey = `${sourcePath}:${typeName}`;
  if (seen.has(seenKey)) {
    return [];
  }
  seen.add(seenKey);

  const localDeclaration = sourceFile.statements.find(
    (statement) =>
      (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
      declarationName(statement) === typeName,
  );

  if (localDeclaration) {
    if (ts.isInterfaceDeclaration(localDeclaration)) {
      const ownMembers = [...localDeclaration.members];
      const inheritedMembers = (localDeclaration.heritageClauses ?? []).flatMap((clause) =>
        clause.types.flatMap((heritageType) =>
          resolveTypeMembers(
            ts.factory.createTypeReferenceNode(heritageType.expression.getText(sourceFile), heritageType.typeArguments),
            sourceFile,
            sourcePath,
            seen,
          ),
        ),
      );
      return [...ownMembers, ...inheritedMembers];
    }
    return resolveTypeMembers(localDeclaration.type, sourceFile, sourcePath, seen);
  }

  const imported = resolveRelativeTypeImport(typeName, sourceFile, sourcePath);
  if (!imported) {
    return [];
  }

  return resolveTypeMembers(
    ts.factory.createTypeReferenceNode(imported.declarationName, undefined),
    imported.sourceFile,
    imported.sourcePath,
    seen,
  );
}

function memberName(member, sourceFile) {
  if (!member.name) {
    return undefined;
  }
  if (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) || ts.isNumericLiteral(member.name)) {
    return member.name.text;
  }
  return member.name.getText(sourceFile).replace(/^['"]|['"]$/gu, '');
}

function componentProps(sourceFile, sourcePath) {
  const macroCall = findMacroCall(sourceFile, 'defineProps');
  return new Set(
    resolveTypeMembers(macroCall?.typeArguments?.[0], sourceFile, sourcePath)
      .map((member) => memberName(member, sourceFile))
      .filter(Boolean),
  );
}

function literalEventNames(typeNode) {
  if (!typeNode) {
    return [];
  }
  if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
    return [typeNode.literal.text];
  }
  if (ts.isUnionTypeNode(typeNode)) {
    return typeNode.types.flatMap(literalEventNames);
  }
  return [];
}

function componentEmits(sourceFile, sourcePath) {
  const macroCall = findMacroCall(sourceFile, 'defineEmits');
  const members = resolveTypeMembers(macroCall?.typeArguments?.[0], sourceFile, sourcePath);
  const eventNames = [];

  for (const member of members) {
    const name = memberName(member, sourceFile);
    if (name) {
      eventNames.push(name);
      continue;
    }

    if (ts.isCallSignatureDeclaration(member)) {
      eventNames.push(...literalEventNames(member.parameters[0]?.type));
    }
  }

  return new Set(eventNames);
}

function normalizeDynamicSlot(expression) {
  return expression
    .trim()
    .replace(/^`|`$/gu, '')
    .replace(/\$\{[^}]*\.key\}/gu, '{key}')
    .replace(/^['"]|['"]$/gu, '');
}

function componentSlots(templateAst) {
  const slots = new Set();

  function visit(node) {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.type === 1 && node.tag === 'slot') {
      let slotName = 'default';
      for (const property of node.props ?? []) {
        if (property.type === 6 && property.name === 'name' && property.value) {
          slotName = property.value.content;
        } else if (
          property.type === 7 &&
          property.name === 'bind' &&
          property.arg?.type === 4 &&
          property.arg.content === 'name' &&
          property.exp?.type === 4
        ) {
          slotName = normalizeDynamicSlot(property.exp.content);
        }
      }
      slots.add(slotName);
    }

    for (const child of node.children ?? []) {
      visit(child);
    }
    for (const branch of node.branches ?? []) {
      visit(branch);
    }
  }

  visit(templateAst);
  return slots;
}

function documentationTableNames(source, heading) {
  const headingPattern = new RegExp(`^## ${heading}\\s*$`, 'mu');
  const headingMatch = headingPattern.exec(source);
  if (!headingMatch) {
    return { duplicates: [], names: new Set() };
  }

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const rest = source.slice(sectionStart);
  const nextHeading = rest.search(/^##\s+/mu);
  const section = nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
  const names = [];

  for (const line of section.split('\n')) {
    if (!line.trimStart().startsWith('|')) {
      continue;
    }
    const firstCell = line.split('|')[1]?.trim().replaceAll('`', '').replace(/\?$/u, '');
    if (!firstCell || firstCell === 'Name' || firstCell === '—' || /^-+$/u.test(firstCell)) {
      continue;
    }
    names.push(firstCell);
  }

  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  return { duplicates: [...new Set(duplicates)], names: new Set(names) };
}

function compareContractSet(component, contractName, actual, documented, docsSource) {
  const docsLine = lineNumberAt(docsSource, docsSource.search(new RegExp(`^## ${contractName}`, 'mu')));
  const missing = [...actual].filter((name) => !documented.names.has(name));
  const stale = [...documented.names].filter((name) => !actual.has(name));

  if (missing.length > 0) {
    report(
      component.docsPath,
      docsLine,
      `${component.componentName} omits ${contractName.toLowerCase()}: ${missing.join(', ')}.`,
    );
  }
  if (stale.length > 0) {
    report(
      component.docsPath,
      docsLine,
      `${component.componentName} documents stale ${contractName.toLowerCase()}: ${stale.join(', ')}.`,
    );
  }
  if (documented.duplicates.length > 0) {
    report(
      component.docsPath,
      docsLine,
      `${component.componentName} duplicates ${contractName.toLowerCase()}: ${documented.duplicates.join(', ')}.`,
    );
  }
}

function checkComponentDocumentation() {
  const contracts = publicComponentContracts();

  for (const component of contracts) {
    if (!component.sourcePath || !existsSync(component.sourcePath)) {
      report(component.docsPath, 1, `cannot locate source for public component ${component.componentName}.`);
      continue;
    }
    if (!existsSync(component.docsPath)) {
      report(component.sourcePath, 1, `public component ${component.componentName} has no API documentation.`);
      continue;
    }

    const sfcSource = readFileSync(component.sourcePath, 'utf8');
    const parsed = parseSfc(sfcSource, { filename: component.sourcePath });
    const script = parsed.descriptor.scriptSetup;
    if (!script) {
      report(component.sourcePath, 1, `public component ${component.componentName} has no script setup contract.`);
      continue;
    }

    const scriptSource = ts.createSourceFile(
      component.sourcePath,
      script.content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const docsSource = readFileSync(component.docsPath, 'utf8');

    compareContractSet(
      component,
      'Props',
      componentProps(scriptSource, component.sourcePath),
      documentationTableNames(docsSource, 'Props'),
      docsSource,
    );
    compareContractSet(
      component,
      'Emits',
      componentEmits(scriptSource, component.sourcePath),
      documentationTableNames(docsSource, 'Emits'),
      docsSource,
    );
    compareContractSet(
      component,
      'Slots',
      componentSlots(parsed.descriptor.template?.ast),
      documentationTableNames(docsSource, 'Slots'),
      docsSource,
    );
  }

  return contracts.length;
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
const componentCount = checkComponentDocumentation();
if (componentCount < 58) {
  issues.push(
    `Public catalog component inventory unexpectedly shrank from 58 to ${componentCount}; review exports and documentation discovery.`,
  );
}
checkReadmeContracts();

if (issues.length > 0) {
  console.error(`Documentation contract validation failed with ${issues.length} issue(s):\n`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(
  `Documentation contracts passed for ${markdownFiles.length} Markdown files, ${componentCount} catalog component APIs, and ${publicPackages.size} packages.`,
);
