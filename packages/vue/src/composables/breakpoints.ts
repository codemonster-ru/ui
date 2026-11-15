import { cmBreakpointNames, cmBreakpoints, type CmBreakpointName } from '@codemonster-ru/ui-tokens';
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
} from 'vue';

export type {
  CmBreakpointName as VfBreakpointName,
  CmBreakpointValue as VfBreakpointValue,
} from '@codemonster-ru/ui-tokens';

export interface UseBreakpointOptions {
  direction?: 'min' | 'max';
}

export type VfBreakpointValues<T> = Partial<Record<CmBreakpointName, T>> & { base: T };

export function useBreakpoint(
  breakpoint: MaybeRefOrGetter<CmBreakpointName | number>,
  options: UseBreakpointOptions = {},
) {
  const matches = ref(false);
  const instance = getCurrentInstance();
  let stopQuery: (() => void) | undefined;

  onMounted(() => {
    const view = (instance?.vnode.el as Node | null | undefined)?.ownerDocument?.defaultView;
    if (typeof view?.matchMedia !== 'function') return;

    stopQuery = watchEffect((onCleanup) => {
      const target = toValue(breakpoint);
      const width = typeof target === 'number' ? target : cmBreakpoints[target];
      const query = options.direction === 'max' ? `(max-width: ${width - 0.02}px)` : `(min-width: ${width}px)`;
      const media = view.matchMedia(query);
      const sync = () => (matches.value = media.matches);
      sync();
      media.addEventListener('change', sync);
      onCleanup(() => media.removeEventListener('change', sync));
    });
  });

  onBeforeUnmount(() => stopQuery?.());
  return matches;
}

export function useBreakpoints() {
  const queries = cmBreakpointNames.map((name) => [name, useBreakpoint(name)] as const);
  return computed(
    () => Object.fromEntries(queries.map(([name, match]) => [name, match.value])) as Record<CmBreakpointName, boolean>,
  );
}

export function useBreakpointValue<T>(values: MaybeRefOrGetter<VfBreakpointValues<T>>) {
  const breakpoints = useBreakpoints();
  return computed(() => {
    const resolved = toValue(values);
    let result = resolved.base;
    for (const name of cmBreakpointNames) {
      if (breakpoints.value[name] && name in resolved) result = resolved[name] as T;
    }
    return result;
  });
}
