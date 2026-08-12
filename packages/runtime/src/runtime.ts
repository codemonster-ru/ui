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

function controllerNames(element: Element): string[] {
  return [...new Set((element.getAttribute(controllerAttribute) ?? '').split(/\s+/u).filter(Boolean))];
}

function discoverElements(root: ParentNode): Element[] {
  const elements = [...root.querySelectorAll(controllerSelector)];
  if (root.nodeType === 1) {
    const element = root as Element;
    if (element.matches(controllerSelector)) {
      elements.unshift(element);
    }
  }
  return elements;
}

export class CmRuntime {
  readonly #factories = new Map<string, CmControllerFactory>();
  readonly #connections: ConnectedController[] = [];
  readonly #controllersByElement = new WeakMap<Element, Map<string, CmController>>();

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
    for (const element of discoverElements(root)) {
      for (const name of controllerNames(element)) {
        const factory = this.#factories.get(name);
        const controllers = this.#controllersByElement.get(element);
        if (!factory || controllers?.has(name)) {
          continue;
        }

        const controller = factory(element);
        controller.connect();
        const nextControllers = controllers ?? new Map<string, CmController>();
        nextControllers.set(name, controller);
        this.#controllersByElement.set(element, nextControllers);
        this.#connections.push({ controller, element, name });
      }
    }
  }

  stop(root?: ParentNode): void {
    const disconnected = root
      ? this.#connections.filter(({ element }) => element === root || root.contains(element))
      : [...this.#connections];

    for (const connection of disconnected.reverse()) {
      connection.controller.disconnect();
      const controllers = this.#controllersByElement.get(connection.element);
      controllers?.delete(connection.name);
      if (controllers?.size === 0) {
        this.#controllersByElement.delete(connection.element);
      }
    }

    if (root) {
      const disconnectedControllers = new Set(disconnected.map(({ controller }) => controller));
      const retained = this.#connections.filter(({ controller }) => !disconnectedControllers.has(controller));
      this.#connections.splice(0, this.#connections.length, ...retained);
    } else {
      this.#connections.splice(0);
    }
  }
}
