import { cmBreakpoints, cmBreakpointNames, type CmBreakpointName } from '@codemonster-ru/ui-tokens';
import { computed, onBeforeUnmount, onMounted, ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue';

export { cmBreakpoints, cmBreakpoints as vfBreakpoints };
export type {
  CmBreakpointName as VfBreakpointName,
  CmBreakpointValue as VfBreakpointValue,
} from '@codemonster-ru/ui-tokens';

export function toMinWidthQuery(value: number): string {
  return `(min-width: ${value}px)`;
}

export function toMaxWidthQuery(value: number): string {
  return `(max-width: ${value - 0.02}px)`;
}

export interface UseBreakpointOptions {
  direction?: 'min' | 'max';
}

export type VfBreakpointValues<T> = Partial<Record<CmBreakpointName, T>> & { base: T };

export function useBreakpoint(
  breakpoint: MaybeRefOrGetter<CmBreakpointName | number>,
  options: UseBreakpointOptions = {},
) {
  const matches = ref(false);
  onMounted(() => {
    watchEffect((onCleanup) => {
      if (typeof window.matchMedia !== 'function') return;
      const value = toValue(breakpoint);
      const width = typeof value === 'number' ? value : cmBreakpoints[value];
      const query = options.direction === 'max' ? toMaxWidthQuery(width) : toMinWidthQuery(width);
      const media = window.matchMedia(query);
      const sync = () => (matches.value = media.matches);
      sync();
      media.addEventListener('change', sync);
      onCleanup(() => media.removeEventListener('change', sync));
    });
  });
  return matches;
}

export function useBreakpoints() {
  const media = cmBreakpointNames.map((name) => [name, useBreakpoint(name)] as const);
  return computed(
    () => Object.fromEntries(media.map(([name, match]) => [name, match.value])) as Record<CmBreakpointName, boolean>,
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

function toPixels(value: string, fontSize: number): number | undefined {
  const length = /^([+-]?\d*\.?\d+)(px|em|rem)?$/iu.exec(value.trim());
  if (!length) return undefined;
  return Number(length[1]) * (/em$/iu.test(length[2] ?? '') ? fontSize : 1);
}

export function useCssVarBreakpoints() {
  const breakpoints = ref<Record<CmBreakpointName, number>>({ ...cmBreakpoints });
  let observer: MutationObserver | undefined;
  let frame: number | undefined;

  function update() {
    const style = window.getComputedStyle(document.documentElement);
    const fontSize = Number.parseFloat(style.fontSize) || 16;
    breakpoints.value = Object.fromEntries(
      cmBreakpointNames.map((name) => [
        name,
        toPixels(style.getPropertyValue(`--vf-breakpoint-${name}`), fontSize) ??
          toPixels(style.getPropertyValue(`--cm-breakpoint-${name}`), fontSize) ??
          cmBreakpoints[name],
      ]),
    ) as Record<CmBreakpointName, number>;
  }

  function scheduleUpdate() {
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      update();
    });
  }

  onMounted(() => {
    update();
    window.addEventListener('resize', scheduleUpdate);
    observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.documentElement, { attributes: true, childList: true });
    if (document.body) observer.observe(document.body, { attributes: true });
    observer.observe(document.head, { attributes: true, childList: true, subtree: true, characterData: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', scheduleUpdate);
    observer?.disconnect();
    if (frame !== undefined) window.cancelAnimationFrame(frame);
  });

  return breakpoints;
}
