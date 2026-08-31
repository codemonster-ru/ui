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
