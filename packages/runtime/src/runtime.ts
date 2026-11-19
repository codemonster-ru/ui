import { cmFrameworkOwnership } from './core/ownership.js';

export interface CmController {
  connect(): void;
  disconnect(): void;
}

export type CmControllerFactory = (element: Element) => CmController;

interface ConnectedController {
  controller: CmController;
  element: Element;
  name: string;
}

const controllerAttribute = 'data-cm-controller';
const controllerSelector = `[${controllerAttribute}]`;
const adminShellClass = 'cm-admin-shell';
const adminShellClassToken = /(?:^|[\t\n\f\r ])cm-admin-shell(?:$|[\t\n\f\r ])/u;
const shellMetricsName = 'shell-metrics';
// A framework adapter renders the same controller hook so its markup matches the canonical DOM,
// but it owns that element's state declaratively. It marks the element once it has taken over, and
// the runtime leaves those alone rather than writing the same attributes imperatively behind it.
const { attribute: hydratedAttribute, claimEvent } = cmFrameworkOwnership;

function controllerNames(element: Element): Set<string> {
  if (element.hasAttribute(hydratedAttribute)) return new Set();
  const names = new Set((element.getAttribute(controllerAttribute) ?? '').split(/\s+/u).filter(Boolean));
  // AdminShell HTML shipped without controller attributes. Its public class identifies that frame.
  if (element.classList.contains(adminShellClass)) names.add(shellMetricsName);
  return names;
}

function discoverElements(root: ParentNode, selector: string): Element[] {
  const elements = [...root.querySelectorAll(selector)];
  if (root.nodeType === 1) {
    const element = root as Element;
    if (element.matches(selector)) {
      elements.unshift(element);
    }
  }
  return elements;
}

export class CmRuntime {
  readonly #factories = new Map<string, CmControllerFactory>();
  #connections: ConnectedController[] = [];
  readonly #controllersByElement = new WeakMap<Element, Map<string, CmController>>();
  readonly #observerDisposers = new Map<ParentNode, () => void>();
  readonly #observedElements = new WeakSet<Element>();

  register(name: string, factory: CmControllerFactory): this {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(name)) {
      throw new TypeError(`Controller name must use lowercase kebab-case: ${name}.`);
    }
    if (this.#factories.has(name)) {
      throw new Error(`Controller is already registered: ${name}.`);
    }

    this.#factories.set(name, factory);
    return this;
  }

  start(root: ParentNode = document): void {
    const selector = this.#factories.has(shellMetricsName)
      ? `${controllerSelector}, .${adminShellClass}`
      : controllerSelector;
    for (const element of discoverElements(root, selector)) {
      this.#startElement(element, controllerNames(element));
    }
  }

  #startElement(element: Element, names: Set<string>): void {
    for (const name of names) {
      const factory = this.#factories.get(name);
      const controllers = this.#controllersByElement.get(element);
      if (!factory || controllers?.has(name)) {
        continue;
      }

      const controller = factory(element);
      controller.connect();
      if (!controllers) element.addEventListener(claimEvent, this.#handleFrameworkClaim);
      const nextControllers = controllers ?? new Map<string, CmController>();
      nextControllers.set(name, controller);
      this.#controllersByElement.set(element, nextControllers);
      this.#connections.push({ controller, element, name });
    }

    if (this.#controllersByElement.has(element) && this.#isObserved(element)) {
      this.#observedElements.add(element);
    }
  }

  readonly #handleFrameworkClaim = (event: Event): void => {
    const element = event.currentTarget as Element | null;
    if (event.target !== element || !element?.hasAttribute(hydratedAttribute)) return;
    this.#disconnectWhere((connection) => connection.element === element);
  };

  observe(root: ParentNode = document): () => void {
    const currentDisposer = this.#observerDisposers.get(root);
    if (currentDisposer) {
      return currentDisposer;
    }

    const ownerDocument = root.nodeType === 9 ? (root as Document) : root.ownerDocument;
    const MutationObserverConstructor = ownerDocument?.defaultView?.MutationObserver;
    if (!MutationObserverConstructor) {
      throw new Error('MutationObserver is not available for the observed root.');
    }

    this.start(root);
    const observeAdminShells = this.#factories.has(shellMetricsName);
    const observer = new MutationObserverConstructor((records) => {
      const added = new Set<ParentNode>();
      const changed = new Map<Element, Set<string>>();
      let removedSubtree = false;

      for (const record of records) {
        if (record.type === 'attributes') {
          const element = record.target as Element;
          // Ordinary styling changes do not retarget a controller.
          if (
            record.attributeName === 'class' &&
            element.classList.contains(adminShellClass) === adminShellClassToken.test(record.oldValue ?? '')
          )
            continue;
          if (root.contains(element)) changed.set(element, controllerNames(element));
          continue;
        }
        removedSubtree ||= [...record.removedNodes].some((node) => node.nodeType === 1);
        record.addedNodes.forEach((node) => {
          if ('querySelectorAll' in node && root.contains(node)) added.add(node as ParentNode);
        });
      }

      // Mutation records describe intermediate states. A moved node can still belong to an
      // observed root, and an added node can already be gone by the time this callback runs.
      if (removedSubtree || changed.size > 0) {
        this.#disconnectWhere(({ element, name }) => {
          const names = changed.get(element);
          return (names !== undefined && !names.has(name)) || (removedSubtree && this.#lostObservation(element));
        });
      }
      changed.forEach((names, element) => this.#startElement(element, names));
      added.forEach((node) => this.start(node));
    });
    observer.observe(root, {
      attributeFilter: observeAdminShells
        ? [controllerAttribute, hydratedAttribute, 'class']
        : [controllerAttribute, hydratedAttribute],
      attributeOldValue: observeAdminShells,
      attributes: true,
      childList: true,
      subtree: true,
    });

    const dispose = (): void => {
      if (this.#observerDisposers.get(root) !== dispose) return;
      observer.disconnect();
      this.#observerDisposers.delete(root);
      this.#disconnectWhere(({ element }) => this.#lostObservation(element));
    };
    this.#observerDisposers.set(root, dispose);
    for (const { element } of this.#connections) {
      if (root.contains(element)) this.#observedElements.add(element);
    }
    return dispose;
  }

  stop(root?: ParentNode): void {
    this.#disconnectWhere(({ element }) => root === undefined || root.contains(element));
  }

  #isObserved(element: Element): boolean {
    for (const root of this.#observerDisposers.keys()) {
      if (root.contains(element)) return true;
    }
    return false;
  }

  #lostObservation(element: Element): boolean {
    return this.#observedElements.has(element) && !this.#isObserved(element);
  }

  #disconnectWhere(predicate: (connection: ConnectedController) => boolean): void {
    const disconnected = new Set(this.#connections.filter(predicate));
    if (disconnected.size === 0) return;

    for (const connection of [...disconnected].reverse()) {
      connection.controller.disconnect();
      const controllers = this.#controllersByElement.get(connection.element);
      controllers?.delete(connection.name);
      if (controllers?.size === 0) {
        connection.element.removeEventListener(claimEvent, this.#handleFrameworkClaim);
        this.#controllersByElement.delete(connection.element);
        this.#observedElements.delete(connection.element);
      }
    }

    this.#connections = this.#connections.filter((connection) => !disconnected.has(connection));
  }
}
