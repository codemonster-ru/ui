import { onBeforeUnmount, onMounted, ref } from 'vue';
import { vfBreakpoints, type VfBreakpointName } from '@codemonster-ru/vueforge-core/foundation';

type ResolvedBreakpoints = Record<VfBreakpointName, number>;

function parseCssLength(value: string, rootFontSize: number) {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  const numericValue = Number.parseFloat(normalizedValue);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  if (normalizedValue.endsWith('px') || /^[+-]?\d*\.?\d+$/.test(normalizedValue)) {
    return numericValue;
  }

  if (normalizedValue.endsWith('rem') || normalizedValue.endsWith('em')) {
    return numericValue * rootFontSize;
  }

  return null;
}

function breakpointToCssVarName(name: VfBreakpointName) {
  return `--vf-breakpoint-${name}`;
}

function readResolvedBreakpoints(): ResolvedBreakpoints {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { ...vfBreakpoints };
  }

  const rootStyles = window.getComputedStyle(document.documentElement);
  const rootFontSize = Number.parseFloat(rootStyles.fontSize) || 16;

  return Object.fromEntries(
    Object.entries(vfBreakpoints).map(([name, fallbackValue]) => {
      const cssVarValue = rootStyles.getPropertyValue(breakpointToCssVarName(name as VfBreakpointName));

      return [name, parseCssLength(cssVarValue, rootFontSize) ?? fallbackValue];
    }),
  ) as ResolvedBreakpoints;
}

export function useCssVarBreakpoints() {
  const breakpoints = ref<ResolvedBreakpoints>({ ...vfBreakpoints });
  let mutationObserver: MutationObserver | null = null;
  let rafId: number | null = null;

  const updateBreakpoints = () => {
    breakpoints.value = readResolvedBreakpoints();
  };

  const scheduleUpdate = () => {
    if (typeof window === 'undefined') {
      updateBreakpoints();
      return;
    }

    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      updateBreakpoints();
    });
  };

  onMounted(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    updateBreakpoints();
    window.addEventListener('resize', scheduleUpdate);

    mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: false,
    });

    if (document.body) {
      mutationObserver.observe(document.body, {
        attributes: true,
        childList: false,
        subtree: false,
      });
    }

    mutationObserver.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', scheduleUpdate);

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    }

    mutationObserver?.disconnect();
  });

  return breakpoints;
}
