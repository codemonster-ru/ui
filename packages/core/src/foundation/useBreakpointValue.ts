import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { vfBreakpoints, type VfBreakpointName } from './breakpoints';
import { useBreakpoints } from './useBreakpoints';

export type VfBreakpointValues<T> = Partial<Record<VfBreakpointName, T>> & {
  base: T;
};

const breakpointOrder = Object.keys(vfBreakpoints) as VfBreakpointName[];

export function useBreakpointValue<T>(values: MaybeRefOrGetter<VfBreakpointValues<T>>) {
  const breakpoints = useBreakpoints();

  return computed(() => {
    const resolvedValues = toValue(values);
    let result = resolvedValues.base;

    for (const breakpoint of breakpointOrder) {
      if (breakpoints.value[breakpoint] && breakpoint in resolvedValues) {
        result = resolvedValues[breakpoint] as T;
      }
    }

    return result;
  });
}
