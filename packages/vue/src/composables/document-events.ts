import { getCurrentInstance, onBeforeUnmount, onMounted, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

export interface UseClickOutsideOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  event?: keyof DocumentEventMap;
}

export interface UseEscapeKeyOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  event?: 'keydown' | 'keyup';
}

type ClickTarget = Ref<HTMLElement | null>;
type EscapeEvent = NonNullable<UseEscapeKeyOptions['event']>;
type EscapeHandler = (event: KeyboardEvent) => void;
type EscapeEntry = { handler: EscapeHandler };

interface EscapeStack {
  entries: EscapeEntry[];
  listener: EscapeHandler;
}

const escapeStacks = new WeakMap<Document, Map<EscapeEvent, EscapeStack>>();

function onDocumentMounted(register: (owner: Document) => () => void): void {
  const instance = getCurrentInstance();
  let dispose: (() => void) | undefined;
  onMounted(() => {
    const owner = (instance?.vnode.el as Node | null | undefined)?.ownerDocument;
    if (owner) dispose = register(owner);
  });
  onBeforeUnmount(() => dispose?.());
}

export function useClickOutside(
  target: ClickTarget | readonly ClickTarget[],
  handler: (event: MouseEvent | PointerEvent) => void,
  options: UseClickOutsideOptions = {},
): void {
  const eventName = options.event ?? 'pointerdown';
  const targets = 'value' in target ? [target] : target;

  onDocumentMounted((owner) => {
    function onPointer(event: Event): void {
      if (toValue(options.enabled) === false) return;

      const path = event.composedPath();
      let hasTarget = false;
      for (const { value: element } of targets) {
        if (element?.ownerDocument !== owner) continue;
        if (path.includes(element)) return;
        hasTarget = true;
      }
      if (hasTarget) handler(event as MouseEvent | PointerEvent);
    }

    owner.addEventListener(eventName, onPointer);
    return () => owner.removeEventListener(eventName, onPointer);
  });
}

function registerEscape(owner: Document, eventName: EscapeEvent, handler: EscapeHandler): () => void {
  let stacks = escapeStacks.get(owner);
  if (!stacks) {
    stacks = new Map();
    escapeStacks.set(owner, stacks);
  }

  let stack = stacks.get(eventName);
  if (!stack) {
    const entries: EscapeEntry[] = [];
    function listener(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !event.defaultPrevented) entries[entries.length - 1]?.handler(event);
    }

    stack = { entries, listener };
    stacks.set(eventName, stack);
    owner.addEventListener(eventName, listener);
  }

  const { entries, listener } = stack;
  const entry = { handler };
  entries.push(entry);
  return () => {
    const index = entries.indexOf(entry);
    if (index === -1) return;

    entries.splice(index, 1);
    if (entries.length === 0) {
      owner.removeEventListener(eventName, listener);
      stacks.delete(eventName);
      if (stacks.size === 0) escapeStacks.delete(owner);
    }
  };
}

export function useEscapeKey(handler: EscapeHandler, options: UseEscapeKeyOptions = {}): void {
  const eventName = options.event ?? 'keydown';

  onDocumentMounted((owner) =>
    watch(
      () => toValue(options.enabled) !== false,
      (enabled, _previous, onCleanup) => {
        if (enabled) onCleanup(registerEscape(owner, eventName, handler));
      },
      { immediate: true, flush: 'sync' },
    ),
  );
}
