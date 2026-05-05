import { onBeforeUnmount, onMounted, toValue, type MaybeRefOrGetter } from 'vue';

interface UseEscapeKeyOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  event?: 'keydown' | 'keyup';
}

export function useEscapeKey(handler: (event: KeyboardEvent) => void, options: UseEscapeKeyOptions = {}) {
  const eventName = options.event ?? 'keydown';

  const listener = (event: KeyboardEvent) => {
    if (toValue(options.enabled) === false || event.key !== 'Escape') {
      return;
    }

    handler(event);
  };

  onMounted(() => {
    document.addEventListener(eventName, listener);
  });

  onBeforeUnmount(() => {
    document.removeEventListener(eventName, listener);
  });
}
