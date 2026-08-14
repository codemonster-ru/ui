import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectComponentManifests } from '../contracts/component-manifests.mjs';
import { readVueForgeMapping } from './vueforge-mapping.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const coveragePath = resolve(repositoryRoot, 'migration/codemonster-ui-coverage.json');

const capabilityStatuses = new Set(['pending', 'supported', 'superseded', 'application-owned', 'retained', 'missing']);
const backlogDestinations = new Set(['phase-17', 'phase-18', 'recipe', 'application-owned', 'retained-product']);

export function readCodeMonsterCoverage(path = coveragePath) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function defaultComponentExports(source) {
  return new Set([...source.matchAll(/default as (Cm[A-Z][A-Za-z0-9]+)/gu)].map((match) => match[1]));
}

function razorComponentRegistrations(source) {
  return new Map(
    [...source.matchAll(/'([^']+)'\s*=>\s*new\s+(Cm[A-Z][A-Za-z0-9]+)\b/gu)].map((match) => [match[2], match[1]]),
  );
}

export function discoverCoverageArtifacts(coverage, root = repositoryRoot) {
  const contractsRoot = resolve(root, 'contracts');
  const contractManifests = new Map(
    collectComponentManifests(contractsRoot).map(({ manifest, slug }) => [slug, manifest]),
  );
  const referencedFiles = new Set();

  if (coverage?.catalog) referencedFiles.add(coverage.catalog);
  if (coverage?.backlog) {
    referencedFiles.add(coverage.backlog);
    const backlogPath = resolve(root, coverage.backlog);
    if (existsSync(backlogPath)) {
      try {
        const backlog = JSON.parse(readFileSync(backlogPath, 'utf8'));
        if (backlog?.consumerInventory) referencedFiles.add(backlog.consumerInventory);
        if (backlog?.documentation) referencedFiles.add(backlog.documentation);
      } catch {
        // Validation reports malformed backlog JSON below.
      }
    }
  }

  for (const component of Object.values(coverage?.components ?? {})) {
    if (component?.delivery?.documentation) referencedFiles.add(component.delivery.documentation);
    if (component?.delivery?.showcase) referencedFiles.add(component.delivery.showcase);
    for (const capability of component?.capabilities ?? []) {
      for (const evidence of capability?.evidence ?? []) referencedFiles.add(evidence.split('#')[0]);
    }
  }

  return {
    contractManifests,
    contracts: new Set(contractManifests.keys()),
    files: new Map(
      [...referencedFiles].map((path) => {
        const absolutePath = resolve(root, path);
        return [path, existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : null];
      }),
    ),
    razorComponents: razorComponentRegistrations(
      readFileSync(resolve(root, 'packages/razor/src/UiComponentProvider.php'), 'utf8'),
    ),
    vueComponents: defaultComponentExports(readFileSync(resolve(root, 'packages/vue/src/index.ts'), 'utf8')),
  };
}

export function validateCodeMonsterCoverage(coverage, mapping, artifacts) {
  const issues = [];
  if (coverage?.schemaVersion !== 1) issues.push('Coverage schemaVersion must be 1.');
  if (coverage?.baseline !== mapping?.baseline) {
    issues.push(`Coverage baseline must match mapping baseline ${mapping?.baseline}.`);
  }
  if (!['pending', 'complete'].includes(coverage?.audits?.directReplacements)) {
    issues.push('Coverage directReplacements audit must be pending or complete.');
  }
  if (!['pending', 'complete'].includes(coverage?.audits?.composeAndManual)) {
    issues.push('Coverage composeAndManual audit must be pending or complete.');
  }
  if (!['pending', 'complete'].includes(coverage?.maturity?.directReplacements)) {
    issues.push('Coverage directReplacements maturity must be pending or complete.');
  }

  const components = coverage?.components && typeof coverage.components === 'object' ? coverage.components : {};
  const mappings = Array.isArray(mapping?.componentMappings) ? mapping.componentMappings : [];
  const mappingBySource = new Map(mappings.map((entry) => [entry.source, entry]));
  const expectedTargets = new Set(
    mappings.filter(({ action }) => action === 'replace').flatMap(({ targets }) => targets),
  );
  const deliveredTargets = new Set();
  const deliveredContracts = new Set();

  for (const [source, component] of Object.entries(components)) {
    const capabilities = Array.isArray(component.capabilities) ? component.capabilities : [];
    if (capabilities.length === 0) issues.push(`${source} must declare at least one capability.`);
    const capabilityIds = new Set();
    for (const capability of capabilities) {
      if (typeof capability?.id !== 'string' || capability.id.length === 0) {
        issues.push(`${source} has a capability without an id.`);
      } else if (capabilityIds.has(capability.id)) {
        issues.push(`${source} has duplicate capability ${capability.id}.`);
      } else {
        capabilityIds.add(capability.id);
      }
      if (!capabilityStatuses.has(capability?.status)) {
        issues.push(`${source} capability ${capability?.id} has unknown status ${capability?.status}.`);
      }
      if (capability?.status === 'pending' && !/^CMUI-\d+$/u.test(capability?.roadmapItem ?? '')) {
        issues.push(`${source} pending capability ${capability?.id} must name a roadmap item.`);
      }
      if (
        capability?.status !== 'pending' &&
        (!Array.isArray(capability?.evidence) ||
          capability.evidence.length === 0 ||
          capability.evidence.some((item) => typeof item !== 'string' || item.length === 0))
      ) {
        issues.push(`${source} classified capability ${capability?.id} must provide evidence.`);
      }
      for (const evidence of capability?.evidence ?? []) {
        const evidencePath = evidence.split('#')[0];
        if (artifacts.files.get(evidencePath) === null || artifacts.files.get(evidencePath) === undefined) {
          issues.push(`${source} capability ${capability?.id} references missing evidence ${evidencePath}.`);
        }
      }
    }
  }

  for (const mappingEntry of mappings) {
    const component = components[mappingEntry.source];
    if (!component) {
      issues.push(`Mapped component is missing from coverage: ${mappingEntry.source}.`);
      continue;
    }

    if (component.disposition !== mappingEntry.action) {
      issues.push(
        `${mappingEntry.source} coverage disposition ${component.disposition} does not match mapping action ${mappingEntry.action}.`,
      );
    }

    if (
      coverage?.audits?.directReplacements === 'complete' &&
      mappingEntry.action === 'replace' &&
      component.capabilities.some(
        (capability) => capability.status === 'pending' || capability.id === 'legacy-capability-audit',
      )
    ) {
      issues.push(`${mappingEntry.source} has an incomplete direct-replacement capability audit.`);
    }
    if (
      coverage?.maturity?.directReplacements === 'complete' &&
      mappingEntry.action === 'replace' &&
      component.capabilities.some((capability) => capability.status === 'missing' || capability.status === 'pending')
    ) {
      issues.push(`${mappingEntry.source} has an incomplete direct-replacement maturity outcome.`);
    }
    if (
      coverage?.audits?.composeAndManual === 'complete' &&
      mappingEntry.action !== 'replace' &&
      component.capabilities.some(
        (capability) => capability.status === 'pending' || capability.id === 'migration-outcome',
      )
    ) {
      issues.push(`${mappingEntry.source} has an incomplete compose/manual disposition audit.`);
    }

    if (mappingEntry.action !== 'replace') continue;

    const delivery = component.delivery;
    const target = mappingEntry.targets[0];
    if (!delivery || delivery.target !== target) {
      issues.push(`${mappingEntry.source} delivery must target ${target}.`);
      continue;
    }

    deliveredTargets.add(target);
    deliveredContracts.add(delivery.contract);
    if (!artifacts.contracts.has(delivery.contract)) {
      issues.push(`${mappingEntry.source} references missing contract ${delivery.contract}.`);
    } else {
      const manifest = artifacts.contractManifests?.get(delivery.contract);
      if (!manifest) {
        issues.push(`${mappingEntry.source} contract ${delivery.contract} is missing manifest metadata.`);
      } else {
        if (`Cm${manifest.name}` !== target) {
          issues.push(
            `${mappingEntry.source} contract ${delivery.contract} manifest name ${manifest.name} does not match target ${target}.`,
          );
        }
        if (manifest.slug !== delivery.contract) {
          issues.push(
            `${mappingEntry.source} contract ${delivery.contract} manifest slug ${manifest.slug} does not match its delivery contract.`,
          );
        }
        if (manifest.razorTag !== `cm-${delivery.razorTag}`) {
          issues.push(
            `${mappingEntry.source} contract ${delivery.contract} manifest razorTag ${manifest.razorTag} does not match delivery Razor tag ${delivery.razorTag}.`,
          );
        }
      }
    }
    if (!artifacts.vueComponents.has(target)) {
      issues.push(`${mappingEntry.source} target ${target} is not exported by the Vue adapter.`);
    }
    if (artifacts.razorComponents.get(target) !== delivery.razorTag) {
      issues.push(`${mappingEntry.source} target ${target} is not registered as Razor tag ${delivery.razorTag}.`);
    }
    for (const [kind, path] of [
      ['documentation', delivery.documentation],
      ['showcase', delivery.showcase],
    ]) {
      const source = artifacts.files.get(path);
      if (source === null || source === undefined) {
        issues.push(`${mappingEntry.source} references missing ${kind} ${path}.`);
      } else if (!source.includes(target)) {
        issues.push(`${mappingEntry.source} ${kind} ${path} does not reference ${target}.`);
      }
    }
  }

  for (const source of Object.keys(components)) {
    if (!mappingBySource.has(source)) issues.push(`Coverage references unknown component: ${source}.`);
  }
  for (const target of artifacts.vueComponents) {
    if (!deliveredTargets.has(target)) issues.push(`Vue component is missing from coverage delivery: ${target}.`);
  }
  for (const target of artifacts.razorComponents.keys()) {
    if (!deliveredTargets.has(target)) issues.push(`Razor component is missing from coverage delivery: ${target}.`);
  }
  for (const contract of artifacts.contracts) {
    if (!deliveredContracts.has(contract)) issues.push(`Contract is missing from coverage delivery: ${contract}.`);
  }

  const expectedGaps = new Map();
  for (const [source, component] of Object.entries(components)) {
    for (const capability of component.capabilities ?? []) {
      if (capability.status === 'missing') expectedGaps.set(`${source}:${capability.id}`, capability);
    }
  }

  const backlogPath = coverage?.backlog;
  const backlogSource = typeof backlogPath === 'string' ? artifacts.files.get(backlogPath) : undefined;
  if (typeof backlogPath !== 'string' || backlogPath.length === 0) {
    issues.push('Coverage must name the maturity backlog path.');
  } else if (backlogSource === null || backlogSource === undefined) {
    issues.push(`Coverage references missing maturity backlog ${backlogPath}.`);
  } else {
    let backlog;
    try {
      backlog = JSON.parse(backlogSource);
    } catch {
      issues.push(`Maturity backlog ${backlogPath} must contain valid JSON.`);
    }

    if (backlog) {
      if (backlog.schemaVersion !== 1) issues.push('Maturity backlog schemaVersion must be 1.');
      if (backlog.coverage !== 'migration/codemonster-ui-coverage.json') {
        issues.push('Maturity backlog must reference the canonical coverage inventory.');
      }
      if (
        typeof backlog.consumerInventory !== 'string' ||
        backlog.consumerInventory.length === 0 ||
        artifacts.files.get(backlog.consumerInventory) === null ||
        artifacts.files.get(backlog.consumerInventory) === undefined
      ) {
        issues.push('Maturity backlog must reference the consumer usage inventory.');
      }
      if (
        typeof backlog.documentation !== 'string' ||
        backlog.documentation.length === 0 ||
        artifacts.files.get(backlog.documentation) === null ||
        artifacts.files.get(backlog.documentation) === undefined
      ) {
        issues.push('Maturity backlog must reference its published documentation.');
      }

      const backlogItems = Array.isArray(backlog.items) ? backlog.items : [];
      const backlogIds = new Set();
      const assignedGaps = new Map();
      for (const [index, item] of backlogItems.entries()) {
        if (typeof item?.id !== 'string' || !/^CMUI-B\d{3}$/u.test(item.id) || backlogIds.has(item.id)) {
          issues.push(`Maturity backlog item at order ${item?.order} must have a unique CMUI-Bxxx id.`);
        } else {
          backlogIds.add(item.id);
        }
        if (item?.order !== index + 1) issues.push(`Maturity backlog order must be contiguous at ${index + 1}.`);
        if (!/^CMUI-\d+$/u.test(item?.roadmapItem ?? '')) {
          issues.push(`Maturity backlog item ${item?.id} must name a roadmap item.`);
        }
        if (!backlogDestinations.has(item?.destination)) {
          issues.push(`Maturity backlog item ${item?.id} has unknown destination ${item?.destination}.`);
        }
        const roadmapNumber = Number.parseInt(item?.roadmapItem?.slice(5) ?? '', 10);
        const expectedDestination =
          roadmapNumber >= 177 && roadmapNumber <= 183
            ? 'phase-17'
            : roadmapNumber === 187
              ? 'recipe'
              : roadmapNumber === 188
                ? 'application-owned'
                : roadmapNumber >= 184 && roadmapNumber <= 191
                  ? 'phase-18'
                  : undefined;
        if (expectedDestination && item?.destination !== expectedDestination) {
          issues.push(`Maturity backlog item ${item?.id} must use destination ${expectedDestination}.`);
        }
        if (!['P0', 'P1', 'P2'].includes(item?.priority)) {
          issues.push(`Maturity backlog item ${item?.id} has unknown priority ${item?.priority}.`);
        }
        for (const field of ['summary', 'reason']) {
          if (typeof item?.[field] !== 'string' || item[field].length === 0) {
            issues.push(`Maturity backlog item ${item?.id} must provide ${field}.`);
          }
        }
        if (!Array.isArray(item?.gaps)) {
          issues.push(`Maturity backlog item ${item?.id} must provide a gaps array.`);
          continue;
        }
        for (const gap of item.gaps) {
          if (!assignedGaps.has(gap)) assignedGaps.set(gap, []);
          assignedGaps.get(gap).push(item);
        }
      }

      for (const [gap, capability] of expectedGaps) {
        const assignments = assignedGaps.get(gap) ?? [];
        if (assignments.length !== 1) {
          issues.push(`Coverage gap must appear exactly once in the maturity backlog: ${gap}.`);
        } else if (assignments[0].roadmapItem !== capability.roadmapItem) {
          issues.push(`Maturity backlog roadmap assignment is stale: ${gap}.`);
        }
      }
      for (const gap of assignedGaps.keys()) {
        if (!expectedGaps.has(gap)) issues.push(`Maturity backlog references unknown coverage gap: ${gap}.`);
      }

      const expectedRetainedPackages = new Set(
        (mapping?.packageMappings ?? []).filter(({ action }) => action === 'retain').map(({ source }) => source),
      );
      const retainedProducts = Array.isArray(backlog.retainedProducts) ? backlog.retainedProducts : [];
      const retainedNames = retainedProducts.map((entry) => entry?.package);
      for (const packageName of expectedRetainedPackages) {
        if (retainedNames.filter((name) => name === packageName).length !== 1) {
          issues.push(`Retained product must appear exactly once in the maturity backlog: ${packageName}.`);
        }
      }
      for (const entry of retainedProducts) {
        if (!expectedRetainedPackages.has(entry?.package)) {
          issues.push(`Maturity backlog references unknown retained product: ${entry?.package}.`);
        }
        if (typeof entry?.reason !== 'string' || entry.reason.length === 0) {
          issues.push(`Retained product ${entry?.package} must provide a reason.`);
        }
      }
    }
  }

  const catalogPath = coverage?.catalog;
  const catalogSource = typeof catalogPath === 'string' ? artifacts.files.get(catalogPath) : undefined;
  if (typeof catalogPath !== 'string' || catalogPath.length === 0) {
    issues.push('Coverage must name the component catalog path.');
  } else if (catalogSource === null || catalogSource === undefined) {
    issues.push(`Coverage references missing component catalog ${catalogPath}.`);
  } else {
    let catalog;
    try {
      catalog = JSON.parse(catalogSource);
    } catch {
      issues.push(`Component catalog ${catalogPath} must contain valid JSON.`);
    }

    if (catalog) {
      if (catalog.schemaVersion !== 1) issues.push('Component catalog schemaVersion must be 1.');
      const catalogComponents = Array.isArray(catalog.components) ? catalog.components : [];
      const catalogNames = catalogComponents.map(({ name }) => name);
      for (const target of expectedTargets) {
        if (catalogNames.filter((name) => name === target).length !== 1) {
          issues.push(`Stable component must appear exactly once in the catalog: ${target}.`);
        }
      }
      for (const entry of catalogComponents) {
        if (!expectedTargets.has(entry.name))
          issues.push(`Catalog references unknown stable component: ${entry.name}.`);
        if (typeof entry.group !== 'string' || entry.group.length === 0) {
          issues.push(`Catalog component ${entry.name} must name a group.`);
        }
        if (typeof entry.demoHref !== 'string' || !/^(?:#[a-z][a-z0-9-]*|\/[a-z][a-z0-9-]*)$/u.test(entry.demoHref)) {
          issues.push(`Catalog component ${entry.name} has invalid demoHref ${entry.demoHref}.`);
        } else if (entry.demoHref.startsWith('#')) {
          const mappedSource = [...mappingBySource.values()].find(
            ({ action, targets }) => action === 'replace' && targets[0] === entry.name,
          )?.source;
          const showcasePath = mappedSource ? components[mappedSource]?.delivery?.showcase : undefined;
          const source = showcasePath ? artifacts.files.get(showcasePath) : undefined;
          if (typeof source !== 'string' || !source.includes(`id="${entry.demoHref.slice(1)}"`)) {
            issues.push(`Catalog component ${entry.name} references missing showcase anchor ${entry.demoHref}.`);
          }
        }
      }

      const catalogGaps = Array.isArray(catalog.migrationGaps) ? catalog.migrationGaps : [];
      const catalogGapKeys = catalogGaps.map(({ source, capabilityId }) => `${source}:${capabilityId}`);
      for (const [key, capability] of expectedGaps) {
        if (catalogGapKeys.filter((candidate) => candidate === key).length !== 1) {
          issues.push(`Migration gap must appear exactly once in the catalog: ${key}.`);
          continue;
        }
        const gap = catalogGaps.find(({ source, capabilityId }) => `${source}:${capabilityId}` === key);
        if (gap.roadmapItem !== capability.roadmapItem || gap.summary !== capability.notes) {
          issues.push(`Catalog migration gap metadata is stale: ${key}.`);
        }
      }
      for (const key of catalogGapKeys) {
        if (!expectedGaps.has(key)) issues.push(`Catalog references unknown migration gap: ${key}.`);
      }

      const showcaseSources = new Set(
        Object.values(components)
          .map((component) => component?.delivery?.showcase)
          .filter(Boolean)
          .map((path) => artifacts.files.get(path)),
      );
      const availableShowcaseSources = [...showcaseSources].filter((source) => typeof source === 'string');
      if (
        availableShowcaseSources.length > 0 &&
        !availableShowcaseSources.some(
          (source) =>
            typeof source === 'string' &&
            source.includes('./component-catalog.json') &&
            source.includes('catalog.components') &&
            source.includes('catalog.migrationGaps'),
        )
      ) {
        issues.push('The component showcase must render stable components and migration gaps from the catalog.');
      }
    }
  }

  return issues;
}

export function checkCodeMonsterCoverage(root = repositoryRoot) {
  const coverage = readCodeMonsterCoverage(resolve(root, 'migration/codemonster-ui-coverage.json'));
  const mapping = readVueForgeMapping(resolve(root, 'migration/vueforge-to-codemonster-ui.json'));
  return validateCodeMonsterCoverage(coverage, mapping, discoverCoverageArtifacts(coverage, root));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const coverage = readCodeMonsterCoverage();
  const issues = checkCodeMonsterCoverage();
  if (issues.length > 0) {
    for (const issue of issues) console.error(`[codemonster-ui-coverage] ${issue}`);
    process.exitCode = 1;
  } else {
    console.log(
      `[codemonster-ui-coverage] OK: ${Object.keys(coverage.components).length} component disposition(s) are tracked.`,
    );
  }
}
