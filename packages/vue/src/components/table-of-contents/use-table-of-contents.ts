import { onBeforeUnmount, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import type { CmTableOfContentsItem } from './table-of-contents.types';

export interface UseTableOfContentsOptions {
  items: MaybeRefOrGetter<readonly CmTableOfContentsItem[]>;
  offset?: MaybeRefOrGetter<number | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
}

const headingObservationTimeout = 5000;

export function useTableOfContents(options: UseTableOfContentsOptions) {
  const activeId = ref<string>();
  let view: Window | undefined;
  let pendingFrame: number | undefined;
  let observer: MutationObserver | undefined;
  let observerTimeout: number | undefined;

  function updateActiveId(): boolean {
    if (!view) return false;

    const items = toValue(options.items);
    if (toValue(options.disabled) || items.length === 0) {
      activeId.value = undefined;
      return true;
    }

    const offset = toValue(options.offset) ?? 0;
    const top = Number.isFinite(offset) ? offset : 0;
    let nextActive: string | undefined;
    for (const { id } of items) {
      const heading = view.document.getElementById(id);
      if (!heading) continue;

      nextActive ??= id;
      if (heading.getBoundingClientRect().top > top) break;
      nextActive = id;
    }

    activeId.value = nextActive;
    return nextActive !== undefined;
  }

  function stopObservingHeadings(): void {
    observer?.disconnect();
    observer = undefined;
    if (observerTimeout !== undefined) view?.clearTimeout(observerTimeout);
    observerTimeout = undefined;
  }

  function onViewportChange(): void {
    if (updateActiveId()) stopObservingHeadings();
  }

  function cancelRefresh(): void {
    if (pendingFrame !== undefined) view?.cancelAnimationFrame(pendingFrame);
    pendingFrame = undefined;
    stopObservingHeadings();
  }

  function refreshAfterRender(): void {
    if (!view) return;

    cancelRefresh();
    pendingFrame = view.requestAnimationFrame(() => {
      pendingFrame = undefined;
      if (updateActiveId() || !view?.document.body || typeof MutationObserver === 'undefined') return;

      observer = new MutationObserver(onViewportChange);
      observer.observe(view.document.body, { childList: true, subtree: true });
      observerTimeout = view.setTimeout(stopObservingHeadings, headingObservationTimeout);
    });
  }

  onMounted(() => {
    view = window;
    view.addEventListener('scroll', onViewportChange, { passive: true });
    view.addEventListener('resize', onViewportChange);
    view.addEventListener('hashchange', onViewportChange);
    refreshAfterRender();
  });

  onBeforeUnmount(() => {
    cancelRefresh();
    view?.removeEventListener('scroll', onViewportChange);
    view?.removeEventListener('resize', onViewportChange);
    view?.removeEventListener('hashchange', onViewportChange);
    view = undefined;
  });

  watch(
    [() => toValue(options.items).map(({ id }) => id), () => toValue(options.offset), () => toValue(options.disabled)],
    refreshAfterRender,
    { flush: 'post' },
  );

  return { activeId, updateActiveId };
}
