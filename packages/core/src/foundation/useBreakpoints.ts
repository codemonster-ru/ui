import { computed, type ComputedRef } from 'vue';
import type { VfBreakpointName } from './breakpoints';
import { useBreakpoint } from './useBreakpoint';

export function useBreakpoints() {
  const matches = {
    xs: useBreakpoint('xs'),
    sm: useBreakpoint('sm'),
    md: useBreakpoint('md'),
    lg: useBreakpoint('lg'),
    xl: useBreakpoint('xl'),
    '2xl': useBreakpoint('2xl'),
  } satisfies Record<VfBreakpointName, ReturnType<typeof useBreakpoint>>;

  return computed(() => ({
    xs: matches.xs.value,
    sm: matches.sm.value,
    md: matches.md.value,
    lg: matches.lg.value,
    xl: matches.xl.value,
    '2xl': matches['2xl'].value,
  })) as ComputedRef<Record<VfBreakpointName, boolean>>;
}
