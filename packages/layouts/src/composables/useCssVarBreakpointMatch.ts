import { onBeforeUnmount, onMounted, ref } from 'vue';

type MatchDirection = 'max' | 'min';

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

export function useCssVarBreakpointMatch(cssVarName: string, fallbackPx: number, direction: MatchDirection = 'max') {
  const matches = ref(false);
  let mutationObserver: MutationObserver | null = null;
  let rafId: number | null = null;

  const updateMatches = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      matches.value = false;
      return;
    }

    const rootElement = document.documentElement;
    const rootStyles = window.getComputedStyle(rootElement);
    const rootFontSize = Number.parseFloat(rootStyles.fontSize) || 16;
    const cssVarValue = rootStyles.getPropertyValue(cssVarName);
    const breakpointPx = parseCssLength(cssVarValue, rootFontSize) ?? fallbackPx;

    matches.value = direction === 'max' ? window.innerWidth < breakpointPx : window.innerWidth >= breakpointPx;
  };

  const scheduleUpdate = () => {
    if (typeof window === 'undefined') {
      updateMatches();
      return;
    }

    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      updateMatches();
    });
  };

  onMounted(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    updateMatches();
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

  return matches;
}
