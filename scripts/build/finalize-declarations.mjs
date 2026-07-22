import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const targetArgument = process.argv[2];

if (!targetArgument) {
  throw new Error('Usage: node scripts/build/finalize-declarations.mjs <declaration-directory>');
}

const declarationDirectory = resolve(process.cwd(), targetArgument);
if (!existsSync(declarationDirectory) || !statSync(declarationDirectory).isDirectory()) {
  throw new Error(`Declaration directory does not exist: ${declarationDirectory}`);
}

const declarationFiles = [];
const relativeSpecifierPattern =
  /(\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])(\.{1,2}(?:\/[^'"]*)?)\2/g;
const runtimeExtensionPattern = /(?:\.d\.[cm]?ts|\.[cm]?js|\.json)$/;
const cssSideEffectPattern = /^\s*import\s*['"][^'"]+\.css['"]\s*;?\s*$/gm;

function collectDeclarationFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      collectDeclarationFiles(entryPath);
    } else if (entry.isFile() && /\.d\.[cm]?ts$/.test(entry.name)) {
      declarationFiles.push(entryPath);
    }
  }
}

function hasDeclarationFile(basePath) {
  return ['.d.ts', '.d.cts', '.d.mts'].some((extension) => existsSync(`${basePath}${extension}`));
}

function toRuntimeSafeSpecifier(filePath, specifier) {
  const declarationTarget = resolve(dirname(filePath), specifier);
  if (hasDeclarationFile(declarationTarget)) {
    return `${specifier}.js`;
  }

  if (hasDeclarationFile(resolve(declarationTarget, 'index'))) {
    return `${specifier.replace(/\/$/, '')}/index.js`;
  }

  throw new Error(
    `Cannot resolve declaration specifier ${specifier} from ${relative(declarationDirectory, filePath)}.`,
  );
}

collectDeclarationFiles(declarationDirectory);

let rewrittenFiles = 0;
let rewrittenSpecifiers = 0;
let removedCssImports = 0;

for (const filePath of declarationFiles) {
  const original = readFileSync(filePath, 'utf8');
  let content = original.replace(cssSideEffectPattern, () => {
    removedCssImports += 1;
    return '';
  });

  content = content.replace(relativeSpecifierPattern, (match, prefix, quote, specifier) => {
    if (runtimeExtensionPattern.test(specifier)) {
      return match;
    }

    rewrittenSpecifiers += 1;
    return `${prefix}${quote}${toRuntimeSafeSpecifier(filePath, specifier)}${quote}`;
  });

  if (content !== original) {
    writeFileSync(filePath, content);
    rewrittenFiles += 1;
  }
}

const invalidSpecifiers = [];
for (const filePath of declarationFiles) {
  const content = readFileSync(filePath, 'utf8');
  if (cssSideEffectPattern.test(content)) {
    invalidSpecifiers.push(`${relative(declarationDirectory, filePath)} retains a CSS side-effect import`);
  }
  cssSideEffectPattern.lastIndex = 0;

  for (const match of content.matchAll(relativeSpecifierPattern)) {
    const specifier = match[3];
    if (!runtimeExtensionPattern.test(specifier)) {
      invalidSpecifiers.push(`${relative(declarationDirectory, filePath)} -> ${specifier}`);
    }
  }
}

if (invalidSpecifiers.length > 0) {
  throw new Error(`Unsafe declaration specifiers remain:\n${invalidSpecifiers.join('\n')}`);
}

console.log(
  `[declarations] ${relative(process.cwd(), declarationDirectory) || '.'}: ` +
    `${rewrittenFiles} files, ${rewrittenSpecifiers} specifiers, ${removedCssImports} CSS imports normalized.`,
);
