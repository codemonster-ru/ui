#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const excludedDirectoryNames = new Set(['.git', 'build', 'coverage', 'dist', 'node_modules', 'storage', 'var']);
const supportedExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.md',
  '.mjs',
  '.sass',
  '.scss',
  '.ts',
  '.tsx',
  '.vue',
]);

const tokenRenames = {
  colorBg: 'colorBackgroundCanvas',
  colorSurface: 'colorBackgroundSurface',
  colorSurfaceMuted: 'colorBackgroundSurfaceSubtle',
  colorText: 'colorTextPrimary',
  colorMuted: 'colorTextMuted',
  colorBorder: 'colorBorderDefault',
  colorPrimary: 'colorInteractivePrimaryBackground',
  colorPrimaryContrast: 'colorInteractivePrimaryForeground',
  colorPrimarySoft: 'colorInteractivePrimarySubtleBackground',
  colorPrimaryBorderSoft: 'colorInteractivePrimaryBorder',
  colorSuccess: 'colorStatusSuccessSolidBackground',
  colorSuccessContrast: 'colorStatusSuccessSolidForeground',
  colorSuccessSoft: 'colorStatusSuccessSubtleBackground',
  colorSuccessBorderSoft: 'colorStatusSuccessBorder',
  colorInfo: 'colorStatusInfoSolidBackground',
  colorInfoContrast: 'colorStatusInfoSolidForeground',
  colorInfoSoft: 'colorStatusInfoSubtleBackground',
  colorInfoBorderSoft: 'colorStatusInfoBorder',
  colorWarn: 'colorStatusWarningSolidBackground',
  colorWarnContrast: 'colorStatusWarningSolidForeground',
  colorWarnSoft: 'colorStatusWarningSubtleBackground',
  colorWarnBorderSoft: 'colorStatusWarningBorder',
  colorHelp: 'colorStatusHelpSolidBackground',
  colorHelpContrast: 'colorStatusHelpSolidForeground',
  colorHelpSoft: 'colorStatusHelpSubtleBackground',
  colorHelpBorderSoft: 'colorStatusHelpBorder',
  colorDanger: 'colorStatusDangerSolidBackground',
  colorDangerContrast: 'colorStatusDangerSolidForeground',
  colorDangerSoft: 'colorStatusDangerSubtleBackground',
  colorDangerBorderSoft: 'colorStatusDangerBorder',
  colorContrast: 'colorBackgroundInverse',
  colorContrastContrast: 'colorTextInverse',
  colorContrastSoft: 'colorBackgroundInverseSubtle',
  colorContrastBorderSoft: 'colorBorderInverse',
  overlayBackdrop: 'colorBackgroundBackdrop',
};

const typeRenames = {
  VueforgePlaygroundVirtualEntryConfig: 'VueForgePlaygroundVirtualEntryConfig',
  VueforgePlaygroundVirtualEntryValue: 'VueForgePlaygroundVirtualEntryValue',
  VueforgePlaygroundVirtualExportMode: 'VueForgePlaygroundVirtualExportMode',
  VueforgePlaygroundVirtualPluginOptions: 'VueForgePlaygroundVirtualPluginOptions',
};
const tokenRenameEntries = Object.entries(tokenRenames).sort(([left], [right]) => right.length - left.length);
const legacyThemeFieldPattern = new RegExp(
  `\\b(?:${Object.keys(tokenRenames)
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
    .join('|')})\\b`,
  'g',
);

const manualPatterns = [
  {
    label: 'legacy data-theme attribute (replace only where VueForge owns the theme boundary)',
    pattern: /(?<![a-z0-9-])data-theme(?![a-z0-9-])/g,
  },
  {
    label: 'legacy theme token fields (use the migration guide mapping in VueForge theme objects)',
    pattern: legacyThemeFieldPattern,
  },
  {
    label: 'legacy Shiki theme constants (remove the import and use the component theme mode)',
    pattern: /\bSHIKI_(?:LIGHT|DARK)_THEME\b/g,
  },
  {
    label: 'CodeBlock package-root imports (split between /view and /highlight)',
    pattern: /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['"]@codemonster-ru\/vueforge-codeblock['"]/g,
  },
  {
    label: 'Playground package-root imports (split between /ui and /runtime)',
    pattern: /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['"]@codemonster-ru\/vueforge-playground['"]/g,
  },
  {
    label: 'removed button filter hooks (replace with explicit state colors)',
    pattern: /(?:\bbuttonSolid(?:Hover|Active)Filter\b|--vf-button-solid-(?:hover|active)-filter(?![a-z0-9-]))/g,
  },
  {
    label: 'removed generic shadow token (choose a component-specific shadow)',
    pattern: /--vf-shadow(?![a-z0-9-])/g,
  },
  {
    label: 'removed CodeBlock opacity hooks',
    pattern: /--vf-codeblock-(?:action|disabled)-opacity(?![a-z0-9-])/g,
  },
  {
    label: 'removed Layouts surface-subtle token',
    pattern: /--vf-layout-surface-subtle(?![a-z0-9-])/g,
  },
  {
    label: 'removed Table of Contents title-color hook',
    pattern: /(?:\btableOfContentsTitleColor\b|--vf-table-of-contents-title-color(?![a-z0-9-]))/g,
  },
  {
    label: 'removed Playground styling hooks',
    pattern:
      /--vf-playground-(?:surface-muted|text-muted|run-(?:bg|text|border)|radius-md|control-(?:height-md|font-size-md|font-weight|line-height|padding-md)|focus-ring-width|toolbar-(?:gap|padding))(?![a-z0-9-])/g,
  },
  {
    label: 'removed dual-style Icons export',
    pattern: /\bdualStyleCoreIconNames\b/g,
  },
  {
    label: 'removed VueIconify solid style prop',
    pattern: /<VueIconify\b[^>]*\b(?:v-bind:|:)?style\s*=\s*['"]solid['"][^>]*>/g,
  },
];

function printUsage() {
  console.log(`Usage: node scripts/migrate-to-v2.mjs [--write] <path ...>

Without --write the command reports deterministic VueForge 2 migrations and exits with status 1
when changes are available. Manual migrations are reported separately and exit with status 2.`);
}

function camelToKebab(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findClosingParenthesis(source, openingIndex) {
  let depth = 0;
  let quote = null;

  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index];
    const previous = source[index - 1];

    if (quote) {
      if (character === quote && previous !== '\\') {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function splitVarArguments(contents) {
  let depth = 0;
  let quote = null;

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];
    const previous = contents[index - 1];

    if (quote) {
      if (character === quote && previous !== '\\') {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      return [contents.slice(0, index).trim(), contents.slice(index + 1).trim()];
    }
  }

  return [contents.trim(), null];
}

function parseWholeVar(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('var(')) {
    return null;
  }

  const closingIndex = findClosingParenthesis(trimmed, 3);
  if (closingIndex !== trimmed.length - 1) {
    return null;
  }

  const [name, fallback] = splitVarArguments(trimmed.slice(4, -1));
  return { fallback, name };
}

function collapseSelfFallbacks(source, collapsibleNames) {
  let output = '';

  for (let index = 0; index < source.length; index += 1) {
    if (!source.startsWith('var(', index)) {
      output += source[index];
      continue;
    }

    const closingIndex = findClosingParenthesis(source, index + 3);
    if (closingIndex === -1) {
      output += source[index];
      continue;
    }

    const original = source.slice(index, closingIndex + 1);
    const [name, fallback] = splitVarArguments(original.slice(4, -1));
    if (!fallback) {
      output += original;
      index = closingIndex;
      continue;
    }

    const rewrittenFallback = collapseSelfFallbacks(fallback, collapsibleNames);
    const nested = parseWholeVar(rewrittenFallback);

    if (nested?.name === name && collapsibleNames.has(name)) {
      output += nested.fallback ? `var(${name}, ${nested.fallback})` : `var(${name})`;
    } else if (rewrittenFallback !== fallback) {
      output += `var(${name}, ${rewrittenFallback})`;
    } else {
      output += original;
    }
    index = closingIndex;
  }

  return output;
}

function replaceWord(source, from, to) {
  return source.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, 'g'), to);
}

function migrateSource(source) {
  let migrated = source;
  let rewroteCssToken = false;
  const collapsibleNames = new Set();

  for (const [legacyName, semanticName] of tokenRenameEntries) {
    const legacyCssName = `--vf-${camelToKebab(legacyName)}`;
    const semanticCssName = `--vf-${camelToKebab(semanticName)}`;
    migrated = migrated.replace(new RegExp(`${escapeRegExp(legacyCssName)}(?![a-z0-9-])`, 'g'), () => {
      rewroteCssToken = true;
      collapsibleNames.add(semanticCssName);
      return semanticCssName;
    });
  }

  if (rewroteCssToken) {
    migrated = collapseSelfFallbacks(migrated, collapsibleNames);
  }

  for (const [legacyName, canonicalName] of Object.entries(typeRenames)) {
    migrated = replaceWord(migrated, legacyName, canonicalName);
  }

  return migrated;
}

function collectFiles(targetPath) {
  const stats = statSync(targetPath);
  if (stats.isFile()) {
    return supportedExtensions.has(extname(targetPath)) ? [targetPath] : [];
  }
  if (!stats.isDirectory()) {
    return [];
  }

  return readdirSync(targetPath, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) {
      return [];
    }
    if (entry.isDirectory() && excludedDirectoryNames.has(entry.name)) {
      return [];
    }
    return collectFiles(resolve(targetPath, entry.name));
  });
}

const arguments_ = process.argv.slice(2);
const write = arguments_.includes('--write');
const help = arguments_.includes('--help') || arguments_.includes('-h');
const targets = arguments_.filter((argument) => !argument.startsWith('--'));

if (help) {
  printUsage();
  process.exit(0);
}
if (targets.length === 0) {
  printUsage();
  process.exit(64);
}

const files = [...new Set(targets.flatMap((target) => collectFiles(resolve(target))))].sort();
const changedFiles = [];
const manualFindings = [];

for (const filePath of files) {
  const source = readFileSync(filePath, 'utf8');
  const migrated = migrateSource(source);

  if (migrated !== source) {
    changedFiles.push(filePath);
    if (write) {
      writeFileSync(filePath, migrated);
    }
  }

  for (const { label, pattern } of manualPatterns) {
    const matches = migrated.match(pattern);
    if (matches?.length) {
      manualFindings.push({ count: matches.length, filePath, label });
    }
  }
}

const action = write ? 'Updated' : 'Would update';
console.log(`${action} ${changedFiles.length} file(s).`);
for (const filePath of changedFiles) {
  console.log(`  ${filePath}`);
}

if (manualFindings.length > 0) {
  console.error('Manual migration required:');
  for (const finding of manualFindings) {
    console.error(`  ${finding.filePath}: ${finding.label} (${finding.count})`);
  }
  process.exitCode = 2;
} else if (!write && changedFiles.length > 0) {
  process.exitCode = 1;
}
