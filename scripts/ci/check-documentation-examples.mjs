#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import { resolveContainedPath, resolveVirtualFilePath } from './documentation-example-paths.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ignoredDirectoryNames = new Set(['.git', '.npm-cache', 'build', 'coverage', 'dist', 'node_modules']);
const temporaryRoot = path.join(repositoryRoot, '.npm-cache');
mkdirSync(temporaryRoot, { recursive: true });
const temporaryDirectory = mkdtempSync(path.join(temporaryRoot, 'vueforge-documentation-examples-'));
const sourceDirectory = path.join(temporaryDirectory, 'src');
const generatedExamples = [];
const vueTscCli = path.join(repositoryRoot, 'node_modules/vue-tsc/bin/vue-tsc.js');

function listMarkdownFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectoryNames.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(entryPath));
    } else if (entryPath.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files;
}

function lineNumberAt(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function safeStem(filePath, line) {
  return `${path
    .relative(repositoryRoot, filePath)
    .replace(/[^a-z\d]+/giu, '-')
    .replace(/^-|-$/gu, '')}-${line}`;
}

function collectPublicImports(code, language, filePath, line) {
  const scriptKind = language === 'js' || language === 'javascript' ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    `${safeStem(filePath, line)}.${scriptKind === ts.ScriptKind.JS ? 'js' : 'ts'}`,
    code,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const imports = sourceFile.statements
    .filter((statement) => ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier))
    .filter((statement) => {
      const specifier = statement.moduleSpecifier.text;
      return specifier === 'vue' || specifier.startsWith('vue/') || specifier.startsWith('@codemonster-ru/vueforge-');
    })
    .map((statement) => statement.getText(sourceFile));

  if (imports.length === 0) {
    return;
  }

  const targetPath = path.join(sourceDirectory, `${safeStem(filePath, line)}-imports.ts`);
  writeFileSync(targetPath, `${imports.join('\n')}\n`, 'utf8');
  generatedExamples.push(targetPath);
}

function sectionRanges(source, heading) {
  const ranges = [];
  const headingPattern = new RegExp(`^## ${heading}\\s*$`, 'gimu');

  for (const match of source.matchAll(headingPattern)) {
    const start = match.index ?? 0;
    const rest = source.slice(start + match[0].length);
    const nextHeading = rest.search(/^##\s+/mu);
    ranges.push([start, nextHeading < 0 ? source.length : start + match[0].length + nextHeading]);
  }

  return ranges;
}

function writeRunnableTypeScript(code, filePath, line) {
  const fixtureDirectory = path.join(sourceDirectory, safeStem(filePath, line));
  const targetPath = path.join(fixtureDirectory, 'example.ts');
  const sourceFile = ts.createSourceFile(targetPath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  mkdirSync(fixtureDirectory, { recursive: true });
  writeFileSync(targetPath, code, 'utf8');
  generatedExamples.push(targetPath);

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    const specifier = statement.moduleSpecifier.text;
    if (!specifier.startsWith('.') || !specifier.endsWith('.vue')) {
      continue;
    }

    const stubPath = resolveContainedPath(fixtureDirectory, specifier);
    mkdirSync(path.dirname(stubPath), { recursive: true });
    writeFileSync(stubPath, '<template><div /></template>\n', 'utf8');
    generatedExamples.push(stubPath);
  }
}

function collectExamples() {
  const scriptPattern = /^```(ts|typescript|js|javascript)([^\n]*)\n([\s\S]*?)^```\s*$/gmu;
  const vuePattern = /^```vue([^\n]*)\n([\s\S]*?)^```\s*$/gmu;
  const playgroundPattern = /^````playground-src[^\n]*\n([\s\S]*?)^````\s*$/gmu;

  for (const filePath of listMarkdownFiles(repositoryRoot)) {
    const source = readFileSync(filePath, 'utf8');
    const playgroundRanges = [];
    const quickStartRanges = sectionRanges(source, 'Quick start');

    for (const playgroundMatch of source.matchAll(playgroundPattern)) {
      const playgroundLine = lineNumberAt(source, playgroundMatch.index ?? 0);
      const playgroundDirectory = path.join(sourceDirectory, safeStem(filePath, playgroundLine));
      const playgroundSource = playgroundMatch[1];
      const playgroundStart = playgroundMatch.index ?? 0;

      playgroundRanges.push([playgroundStart, playgroundStart + playgroundMatch[0].length]);

      for (const vueMatch of playgroundSource.matchAll(vuePattern)) {
        const virtualPath = vueMatch[1].match(/(?:^|\s)file=(\/[^\s]+)/u)?.[1];
        if (!virtualPath) {
          continue;
        }

        const targetPath = resolveVirtualFilePath(playgroundDirectory, virtualPath);
        mkdirSync(path.dirname(targetPath), { recursive: true });
        writeFileSync(targetPath, vueMatch[2], 'utf8');
        generatedExamples.push(targetPath);
      }
    }

    for (const match of source.matchAll(scriptPattern)) {
      const line = lineNumberAt(source, match.index ?? 0);
      const code = match[3];
      collectPublicImports(code, match[1], filePath, line);

      const offset = match.index ?? 0;
      const isQuickStart = quickStartRanges.some(([start, end]) => offset >= start && offset < end);
      const isRunnableFile = /(?:^|\s)file=\/[^\s]+/u.test(match[2]);
      if (isQuickStart || isRunnableFile) {
        writeRunnableTypeScript(code, filePath, line);
      }
    }

    for (const match of source.matchAll(vuePattern)) {
      const info = match[1];
      const code = match[2];
      const line = lineNumberAt(source, match.index ?? 0);
      const isRunnableFile = /(?:^|\s)file=\/[^\s]+/u.test(info);
      const isCompleteSfc = /<script(?:\s|>)/u.test(code) && /<template>/u.test(code);

      if (isRunnableFile) {
        const offset = match.index ?? 0;
        if (playgroundRanges.some(([start, end]) => offset >= start && offset < end)) {
          continue;
        }
      } else if (!isCompleteSfc) {
        continue;
      }

      const virtualPath = info.match(/(?:^|\s)file=(\/[^\s]+)/u)?.[1];
      const targetPath = virtualPath
        ? resolveVirtualFilePath(path.join(sourceDirectory, safeStem(filePath, line)), virtualPath)
        : path.join(sourceDirectory, `${safeStem(filePath, line)}.vue`);
      mkdirSync(path.dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, code, 'utf8');
      generatedExamples.push(targetPath);
    }
  }
}

try {
  mkdirSync(sourceDirectory, { recursive: true });
  collectExamples();

  writeFileSync(
    path.join(sourceDirectory, 'environment.d.ts'),
    [
      "declare module '*.css';",
      "declare module 'virtual:vueforge-playground/*' {",
      '  const component: unknown;',
      '  export default component;',
      '}',
      '',
    ].join('\n'),
    'utf8',
  );
  writeFileSync(
    path.join(temporaryDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          allowJs: true,
          checkJs: true,
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: 'ES2022',
        },
        include: ['src/**/*'],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  execFileSync(
    process.execPath,
    [vueTscCli, '--project', path.join(temporaryDirectory, 'tsconfig.json'), '--pretty', 'false'],
    {
      cwd: temporaryDirectory,
      stdio: 'inherit',
    },
  );

  console.log(`Documentation example typecheck passed for ${generatedExamples.length} generated fixtures.`);
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
