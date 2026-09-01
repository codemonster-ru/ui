/**
 * The canonical DOM declares which controller enhances a component, and `ui-runtime` is where that
 * controller has to exist. Nothing checked the two against each other, so a component could ship
 * with markup naming a controller nobody had written: DOM parity stays green, because the markup is
 * identical, while the progressively enhanced adapter does nothing at all.
 */

const controllerAttributePattern = /data-cm-controller="([a-z][a-z0-9-]*)"/gu;
const factoryPattern = /export \{[^}]*\bcreateCm([A-Za-z0-9]+)Controller\b/gu;

/** Reads the controller names the canonical fixtures ask for. */
export function collectDeclaredControllers(fixtureSources) {
  const declared = new Set();

  for (const source of fixtureSources) {
    for (const match of source.matchAll(controllerAttributePattern)) {
      declared.add(match[1]);
    }
  }

  return declared;
}

/** Reads the controller factories the runtime package exports. */
export function collectImplementedControllers(runtimeIndexSource) {
  const implemented = new Set();

  for (const match of runtimeIndexSource.matchAll(factoryPattern)) {
    implemented.add(match[1]);
  }

  return implemented;
}

/** `nav-menu` names `createCmNavMenuController`, which is the whole naming rule. */
export function factoryNameFor(controller) {
  const pascal = controller
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return `createCm${pascal}Controller`;
}

/** Reports controllers the markup asks for and the runtime does not provide. */
export function findMissingControllers(declared, implemented) {
  return [...declared]
    .filter((controller) => {
      const pascal = controller
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      return !implemented.has(pascal);
    })
    .sort();
}

/**
 * Reports interactive contracts with no behaviour scenarios.
 *
 * A scenario is not documentation: the parity suites replay its steps against the Vue component and
 * against the controller running on the canonical markup, and compare what each ends up with. A
 * component with a controller and no scenario has both halves tested separately and nothing
 * checking they agree, which is the only claim that matters for two adapters.
 */
export function findInteractiveContractsWithoutScenarios(contracts) {
  return contracts
    .filter(
      ({ fixtures, hasScenarios }) => !hasScenarios && fixtures.some((source) => source.includes('data-cm-controller')),
    )
    .map(({ slug }) => slug)
    .sort();
}

const ssrSlugPatterns = [/contracts\/([a-z][a-z0-9-]*)\/cases/gu, /'?([a-z][a-z0-9-]*)'?\s*:\s*Cm[A-Za-z]+/gu];

/** Reads the contract slugs a set of Vue SSR test sources compares against the canonical fixtures. */
export function collectSsrCoveredSlugs(testSources) {
  const covered = new Set();

  for (const source of testSources) {
    if (!source.includes('compareSignificantDom')) continue;
    for (const pattern of ssrSlugPatterns) {
      for (const match of source.matchAll(pattern)) covered.add(match[1]);
    }
  }

  return covered;
}

/**
 * Reports contracts whose Vue output is never compared against the canonical fixture.
 *
 * The Razor adapter has a parity test per component, so a contract missing from here is one where
 * the canonical markup is enforced on one adapter only — and the fixture stops being a contract
 * between two platforms the moment just one of them has to satisfy it.
 */
export function findContractsWithoutSsrCoverage(slugs, covered) {
  return slugs.filter((slug) => !covered.has(slug)).sort();
}
