import { onBeforeUnmount, onMounted, toValue, type MaybeRefOrGetter, type Ref } from 'vue';

interface UseClickOutsideOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  event?: keyof DocumentEventMap;
}

export function useClickOutside(
  target: Ref<HTMLElement | null> | Array<Ref<HTMLElement | null>>,
  handler: (event: MouseEvent | PointerEvent) => void,
  options: UseClickOutsideOptions = {},
) {
  const eventName = options.event ?? 'pointerdown';

  const listener = (event: Event) => {
    if (toValue(options.enabled) === false) {
      return;
    }

    const node = event.target;

    if (!(node instanceof Node)) {
      return;
    }

    const elements = Array.isArray(target)
      ? target.map((item) => item.value).filter((item): item is HTMLElement => item instanceof HTMLElement)
      : [target.value].filter((item): item is HTMLElement => item instanceof HTMLElement);

    if (elements.length === 0 || elements.some((element) => element.contains(node))) {
      return;
    }

    handler(event as MouseEvent | PointerEvent);
  };

  onMounted(() => {
    document.addEventListener(eventName, listener);
  });

  onBeforeUnmount(() => {
    document.removeEventListener(eventName, listener);
  });
}
