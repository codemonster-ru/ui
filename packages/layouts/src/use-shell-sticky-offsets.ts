import { computed, ref, watchPostEffect, type Ref } from 'vue';
import { shellStickyOffsets } from '@codemonster-ru/ui-runtime/core';

function useObservedHeight(element: Readonly<Ref<HTMLElement | null>>, enabled: Readonly<Ref<boolean>>) {
  const height = ref(0);
  watchPostEffect((onCleanup) => {
    const target = element.value;
    if (!target || !enabled.value) {
      height.value = 0;
      return;
    }

    const measure = () => (height.value = Math.round(target.getBoundingClientRect().height));
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(target);
      onCleanup(() => observer.disconnect());
    }
  });
  return height;
}

export function useShellStickyOffsets(
  header: Readonly<Ref<HTMLElement | null>>,
  subheader: Readonly<Ref<HTMLElement | null>>,
  hasHeader: Readonly<Ref<boolean>>,
  hasSubheader: Readonly<Ref<boolean>>,
  sticky: Readonly<Ref<boolean>>,
) {
  const headerHeight = useObservedHeight(header, sticky);
  const subheaderHeight = useObservedHeight(subheader, sticky);
  return computed(() =>
    shellStickyOffsets({
      hasHeader: hasHeader.value,
      hasSubheader: hasSubheader.value,
      headerHeight: headerHeight.value,
      subheaderHeight: subheaderHeight.value,
    }),
  );
}
