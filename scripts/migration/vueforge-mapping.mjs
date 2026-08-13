import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVueForgeBaseline } from './vueforge-baseline.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const mappingPath = resolve(repositoryRoot, 'migration/vueforge-to-codemonster-ui.json');

export function readVueForgeMapping(path = mappingPath) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function namedExports(source, prefix) {
  return new Set(source.match(new RegExp(`\\b${prefix}[A-Z][A-Za-z0-9]+`, 'gu')) ?? []);
}

function defaultComponentExports(source, prefix) {
  return new Set(
    [...source.matchAll(new RegExp(`default as (${prefix}[A-Z][A-Za-z0-9]+)`, 'gu'))].map((match) => match[1]),
  );
}

export function discoverLegacyComponents(root = repositoryRoot) {
  const core = readFileSync(resolve(root, 'packages/core/src/components/index.ts'), 'utf8');
  const layouts = readFileSync(resolve(root, 'packages/layouts/src/index.ts'), 'utf8');
  return new Set([...namedExports(core, 'Vf'), ...defaultComponentExports(layouts, 'Vf')]);
}

export function discoverCodeMonsterComponents(root = repositoryRoot) {
  return defaultComponentExports(readFileSync(resolve(root, 'packages/vue/src/index.ts'), 'utf8'), 'Cm');
}

export function validateVueForgeMapping(mapping, baseline, legacyComponents, targetComponents) {
  const issues = [];
  if (mapping?.schemaVersion !== 1) issues.push('Mapping schemaVersion must be 1.');

  const packageMappings = Array.isArray(mapping?.packageMappings) ? mapping.packageMappings : [];
  const packageSources = packageMappings.map(({ source }) => source);
  for (const { name } of baseline.packages) {
    if (packageSources.filter((source) => source === name).length !== 1) {
      issues.push(`Frozen package must have exactly one mapping: ${name}.`);
    }
  }
  for (const source of packageSources) {
    if (!baseline.packages.some(({ name }) => name === source))
      issues.push(`Mapping references unknown package: ${source}.`);
  }

  const componentMappings = Array.isArray(mapping?.componentMappings) ? mapping.componentMappings : [];
  const componentSources = componentMappings.map(({ source }) => source);
  for (const source of legacyComponents) {
    if (componentSources.filter((candidate) => candidate === source).length !== 1) {
      issues.push(`Public component must have exactly one mapping: ${source}.`);
    }
  }
  for (const entry of componentMappings) {
    if (!legacyComponents.has(entry.source)) issues.push(`Mapping references unknown component: ${entry.source}.`);
    if (!['replace', 'compose', 'manual'].includes(entry.action)) {
      issues.push(`Component ${entry.source} has unknown action ${entry.action}.`);
    }
    if (entry.action === 'replace' && entry.targets.length !== 1) {
      issues.push(`Replacement ${entry.source} must name exactly one target.`);
    }
    for (const target of entry.targets) {
      if (!targetComponents.has(target))
        issues.push(`Component ${entry.source} references unavailable target ${target}.`);
    }
  }
  return issues;
}

export function checkVueForgeMapping(root = repositoryRoot) {
  return validateVueForgeMapping(
    readVueForgeMapping(resolve(root, 'migration/vueforge-to-codemonster-ui.json')),
    readVueForgeBaseline(resolve(root, 'migration/vueforge-feature-baseline.json')),
    discoverLegacyComponents(root),
    discoverCodeMonsterComponents(root),
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mapping = readVueForgeMapping();
  const issues = checkVueForgeMapping();
  if (issues.length > 0) {
    for (const issue of issues) console.error(`[vueforge-mapping] ${issue}`);
    process.exitCode = 1;
  } else {
    console.log(
      `[vueforge-mapping] OK: ${mapping.packageMappings.length} package and ${mapping.componentMappings.length} component mapping(s).`,
    );
  }
}
