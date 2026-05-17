import { nextTick, onMounted, onUnmounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import type { VfTableOfContentsItem } from '@/types/components';

interface UseTableOfContentsOptions {
  items: MaybeRefOrGetter<VfTableOfContentsItem[]>;
  offset?: MaybeRefOrGetter<number | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
}

export function useTableOfContents(options: UseTableOfContentsOptions) {
  const activeId = ref<string | undefined>(undefined);

  function resolveItems() {
    return toValue(options.items);
  }

  function resolveOffset() {
    return toValue(options.offset) ?? 0;
  }

  function isDisabled() {
    return Boolean(toValue(options.disabled));
  }

  function updateActiveId(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    if (isDisabled()) {
      activeId.value = undefined;
      return true;
    }

    const items = resolveItems();

    if (!items.length) {
      activeId.value = undefined;
      return true;
    }

    const offset = resolveOffset();
    const resolved = items
      .map((item) => ({
        id: item.id,
        element: document.getElementById(item.id),
      }))
      .filter(
        (
          entry,
        ): entry is {
          id: string;
          element: HTMLElement;
        } => Boolean(entry.element),
      );

    if (!resolved.length) {
      return false;
    }

    let nextActiveId = resolved[0]?.id;

    for (const entry of resolved) {
      const rect = entry.element.getBoundingClientRect();

      if (rect.top - offset <= 0) {
        nextActiveId = entry.id;
        continue;
      }

      if (!nextActiveId) {
        nextActiveId = entry.id;
      }
      break;
    }

    activeId.value = nextActiveId;
    return true;
  }

  function handleScroll() {
    updateActiveId();
  }

  function animationFrame() {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame === 'undefined') {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  async function updateActiveIdAfterRender() {
    await nextTick();
    await animationFrame();

    if (updateActiveId()) {
      return;
    }

    await animationFrame();
    updateActiveId();
  }

  onMounted(() => {
    void updateActiveIdAfterRender();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    window.addEventListener('hashchange', handleScroll);
  });

  onUnmounted(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleScroll);
    window.removeEventListener('hashchange', handleScroll);
  });

  watch(
    () => [
      resolveItems()
        .map((item) => item.id)
        .join('|'),
      resolveOffset(),
      isDisabled(),
    ],
    () => {
      void updateActiveIdAfterRender();
    },
    { flush: 'post', immediate: true },
  );

  return {
    activeId,
    updateActiveId,
  };
}
