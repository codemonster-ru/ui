export type CmCustomEventInit<T> = Omit<CustomEventInit<T>, 'detail'>;

function eventType(name: string): `cm:${string}` {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(name)) {
    throw new TypeError(`Event name must use lowercase kebab-case: ${name}.`);
  }
  return `cm:${name}`;
}

function customEventConstructor(target: EventTarget): typeof CustomEvent {
  const node = target as Node;
  const ownerDocument = node.nodeType === 9 ? (node as Document) : node.ownerDocument;
  const constructor = ownerDocument?.defaultView?.CustomEvent;
  if (!constructor) {
    throw new Error('CustomEvent is not available for the event target.');
  }
  return constructor;
}

export function createCmEvent<T>(
  target: EventTarget,
  name: string,
  detail: T,
  init: CmCustomEventInit<T> = {},
): CustomEvent<T> {
  const CustomEventConstructor = customEventConstructor(target);
  return new CustomEventConstructor(eventType(name), {
    bubbles: true,
    composed: true,
    ...init,
    detail,
  });
}

export function dispatchCmEvent<T>(
  target: EventTarget,
  name: string,
  detail: T,
  init: CmCustomEventInit<T> = {},
): CustomEvent<T> {
  const event = createCmEvent(target, name, detail, init);
  target.dispatchEvent(event);
  return event;
}
