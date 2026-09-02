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
  const layouts = readFileSync(resolve(root, 'packages/vueforge-layouts/src/index.ts'), 'utf8');
  const icons = readFileSync(resolve(root, 'packages/vueforge-icons/src/lib/index.ts'), 'utf8');

  // The icons package publishes one component and it does not use the Vf prefix, so it was outside
  // this set entirely while icons were mapped at package level. It is a public VueForge component
  // with a CodeMonster successor now, and leaving it out would let that successor go untracked.
  const iconComponents = [...icons.matchAll(/export \{ default as (VueIconify) \}/gu)].map((match) => match[1]);

  return new Set([...namedExports(core, 'Vf'), ...defaultComponentExports(layouts, 'Vf'), ...iconComponents]);
}

export function discoverCodeMonsterComponents(root = repositoryRoot) {
  // Layouts are a separate published line but are migration targets like any other, so both entry
  // points are read; otherwise a layout could be mapped to a target this check calls unavailable.
  return new Set([
    ...defaultComponentExports(readFileSync(resolve(root, 'packages/vue/src/index.ts'), 'utf8'), 'Cm'),
    ...defaultComponentExports(readFileSync(resolve(root, 'packages/layouts/src/index.ts'), 'utf8'), 'Cm'),
  ]);
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
    // `drop` says the concept is not carried forward at all, which `manual` cannot express:
    // manual means the application takes it over, and these have no successor to take over.
    if (!['replace', 'compose', 'manual', 'drop'].includes(entry.action)) {
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
