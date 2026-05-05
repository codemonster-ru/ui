import { onBeforeUnmount, onMounted, ref, toValue, type MaybeRefOrGetter, watchEffect } from 'vue';
import { toMaxWidthQuery, toMinWidthQuery, vfBreakpoints, type VfBreakpointName } from './breakpoints';

export interface UseBreakpointOptions {
  direction?: 'min' | 'max';
}

export function useBreakpoint(
  breakpoint: MaybeRefOrGetter<VfBreakpointName | number>,
  options: UseBreakpointOptions = {},
) {
  const matches = ref(false);
  let mediaQuery: MediaQueryList | null = null;

  const sync = () => {
    matches.value = mediaQuery?.matches ?? false;
  };

  const getQuery = () => {
    const value = toValue(breakpoint);
    const width = typeof value === 'number' ? value : vfBreakpoints[value];

    return options.direction === 'max' ? toMaxWidthQuery(width) : toMinWidthQuery(width);
  };

  const cleanup = () => {
    mediaQuery?.removeEventListener('change', sync);
    mediaQuery = null;
  };

  watchEffect((onCleanup) => {
    if (typeof window === 'undefined') {
      matches.value = false;
      return;
    }

    cleanup();
    mediaQuery = window.matchMedia(getQuery());
    sync();
    mediaQuery.addEventListener('change', sync);

    onCleanup(() => {
      cleanup();
    });
  });

  onMounted(sync);
  onBeforeUnmount(cleanup);

  return matches;
}
