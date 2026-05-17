import { nextTick, onMounted, onUnmounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import type { VfTableOfContentsItem } from '@/types/components';

interface UseTableOfContentsOptions {
  items: MaybeRefOrGetter<VfTableOfContentsItem[]>;
  offset?: MaybeRefOrGetter<number | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
}

export function useTableOfContents(options: UseTableOfContentsOptions) {
  const activeId = ref<string | undefined>(undefined);
  let headingsObserver: MutationObserver | undefined;
  let headingsObserverTimeout: number | undefined;

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
      stopHeadingsObserver();
      return true;
    }

    const items = resolveItems();

    if (!items.length) {
      activeId.value = undefined;
      stopHeadingsObserver();
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

  function stopHeadingsObserver() {
    headingsObserver?.disconnect();
    headingsObserver = undefined;

    if (headingsObserverTimeout !== undefined) {
      window.clearTimeout(headingsObserverTimeout);
      headingsObserverTimeout = undefined;
    }
  }

  function startHeadingsObserver() {
    if (
      headingsObserver ||
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      typeof MutationObserver === 'undefined' ||
      !document.body ||
      isDisabled() ||
      !resolveItems().length
    ) {
      return;
    }

    headingsObserver = new MutationObserver(() => {
      if (!updateActiveId()) {
        return;
      }

      stopHeadingsObserver();
      void animationFrame().then(() => {
        updateActiveId();
      });
    });

    headingsObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    headingsObserverTimeout = window.setTimeout(() => {
      stopHeadingsObserver();
    }, 5000);
  }

  async function updateActiveIdAfterRender() {
    await nextTick();
    await animationFrame();

    if (updateActiveId()) {
      stopHeadingsObserver();
      return;
    }

    await animationFrame();

    if (updateActiveId()) {
      stopHeadingsObserver();
      return;
    }

    startHeadingsObserver();
  }

  onMounted(() => {
    void updateActiveIdAfterRender();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    window.addEventListener('hashchange', handleScroll);
  });

  onUnmounted(() => {
    stopHeadingsObserver();

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
      stopHeadingsObserver();
      void updateActiveIdAfterRender();
    },
    { flush: 'post', immediate: true },
  );

  return {
    activeId,
    updateActiveId,
  };
}
