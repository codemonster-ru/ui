import { onBeforeUnmount, onMounted, toValue, watch, type MaybeRefOrGetter, type WatchStopHandle } from 'vue';

export interface UseEscapeKeyOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  event?: 'keydown' | 'keyup';
}

interface EscapeKeyEntry {
  handler: (event: KeyboardEvent) => void;
}

const activeEntries: Record<'keydown' | 'keyup', EscapeKeyEntry[]> = {
  keydown: [],
  keyup: [],
};

const documentListeners: Partial<Record<'keydown' | 'keyup', (event: KeyboardEvent) => void>> = {};

function removeEntry(eventName: 'keydown' | 'keyup', entry: EscapeKeyEntry) {
  const entries = activeEntries[eventName];
  const index = entries.indexOf(entry);

  if (index >= 0) {
    entries.splice(index, 1);
  }

  const listener = documentListeners[eventName];
  if (entries.length === 0 && listener && typeof document !== 'undefined') {
    document.removeEventListener(eventName, listener);
    delete documentListeners[eventName];
  }
}

function activateEntry(eventName: 'keydown' | 'keyup', entry: EscapeKeyEntry) {
  removeEntry(eventName, entry);
  activeEntries[eventName].push(entry);

  if (documentListeners[eventName] || typeof document === 'undefined') {
    return;
  }

  const listener = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) {
      return;
    }

    const entries = activeEntries[eventName];
    entries[entries.length - 1]?.handler(event);
  };

  documentListeners[eventName] = listener;
  document.addEventListener(eventName, listener);
}

export function useEscapeKey(handler: (event: KeyboardEvent) => void, options: UseEscapeKeyOptions = {}) {
  const eventName = options.event ?? 'keydown';
  const entry: EscapeKeyEntry = { handler };
  let stopEnabledWatch: WatchStopHandle | undefined;

  onMounted(() => {
    stopEnabledWatch = watch(
      () => toValue(options.enabled) !== false,
      (enabled) => {
        if (enabled) {
          activateEntry(eventName, entry);
        } else {
          removeEntry(eventName, entry);
        }
      },
      { immediate: true, flush: 'sync' },
    );
  });

  onBeforeUnmount(() => {
    stopEnabledWatch?.();
    removeEntry(eventName, entry);
  });
}
