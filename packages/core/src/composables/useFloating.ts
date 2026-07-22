import {
  autoUpdate,
  computePosition,
  type MiddlewareType,
} from '@codemonster-ru/floater.js';
import { computed, nextTick, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

type FloatingPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end';

type FloatingStrategy = 'absolute' | 'fixed';

interface FloatingMiddleware {
  name: string;
  fn(context: FloatingMiddlewareContext): FloatingMiddlewareResult;
  params?: unknown;
}

interface FloatingMiddlewareResult {
  x: number;
  y: number;
  placement: FloatingPlacement;
  arrowX?: number;
  arrowY?: number;
  baseX?: number;
  baseY?: number;
}

interface FloatingMiddlewareContext extends FloatingMiddlewareResult {
  options: {
    placement?: FloatingPlacement;
    middleware?: FloatingMiddleware[];
    strategy?: FloatingStrategy;
  };
  primaryX: number;
  primaryY: number;
  floating: HTMLElement;
  reference:
    | HTMLElement
    | {
        offsetTop: number;
        offsetLeft: number;
        getBoundingClientRect(): {
          [key: string]: number;
          x: number;
          y: number;
          width: number;
          height: number;
          top: number;
          right: number;
          bottom: number;
          left: number;
        };
      };
}

export interface UseFloatingOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  placement?: MaybeRefOrGetter<FloatingPlacement>;
  middleware?: MaybeRefOrGetter<FloatingMiddleware[] | undefined>;
  strategy?: MaybeRefOrGetter<FloatingStrategy | undefined>;
}

export interface FloatingMiddlewareData {
  [key: string]: unknown;
}

export function useFloating(
  referenceRef: Ref<HTMLElement | null>,
  floatingRef: Ref<HTMLElement | null>,
  options: UseFloatingOptions = {},
) {
  const x = ref(0);
  const y = ref(0);
  const placement = ref<FloatingPlacement>(toValue(options.placement) ?? 'bottom');
  const middlewareData = ref<FloatingMiddlewareData>({});
  const cleanupAutoUpdate = ref<(() => void) | null>(null);
  let watchRunId = 0;

  const styles = computed(() => ({
    left: `${x.value}px`,
    top: `${y.value}px`,
  }));

  async function update() {
    if (!referenceRef.value || !floatingRef.value) {
      return;
    }

    const result = await computePosition(referenceRef.value, floatingRef.value, {
      placement: toValue(options.placement) ?? placement.value,
      middleware: toValue(options.middleware) as MiddlewareType[] | undefined,
      strategy: toValue(options.strategy),
    });

    x.value = result.x;
    y.value = result.y;
    placement.value = result.placement;
    middlewareData.value = result.middlewareData ?? {};
  }

  function cleanup() {
    cleanupAutoUpdate.value?.();
    cleanupAutoUpdate.value = null;
  }

  watch(
    [() => toValue(options.enabled) !== false, referenceRef, floatingRef],
    async ([enabled]) => {
      watchRunId += 1;
      const currentRunId = watchRunId;

      cleanup();

      if (!enabled || !referenceRef.value || !floatingRef.value) {
        return;
      }

      await nextTick();

      if (
        currentRunId !== watchRunId ||
        toValue(options.enabled) === false ||
        !referenceRef.value ||
        !floatingRef.value
      ) {
        return;
      }

      await update();

      if (
        currentRunId !== watchRunId ||
        toValue(options.enabled) === false ||
        !referenceRef.value ||
        !floatingRef.value
      ) {
        return;
      }

      cleanupAutoUpdate.value = autoUpdate(referenceRef.value, () => {
        void update();
      });
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    cleanup();
  });

  return {
    x,
    y,
    placement,
    middlewareData,
    styles,
    update,
    cleanup,
  };
}
