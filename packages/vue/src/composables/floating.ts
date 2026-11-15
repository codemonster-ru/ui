import { autoUpdate, computePosition } from '@codemonster-ru/floater.js';
import { computed, onBeforeUnmount, onMounted, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

type FloatingPlacement = `${'top' | 'right' | 'bottom' | 'left'}${'' | '-start' | '-end'}`;
type FloatingStrategy = 'absolute' | 'fixed';

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

interface FloatingMiddleware {
  name: string;
  fn(context: FloatingMiddlewareContext): FloatingMiddlewareResult;
  params?: unknown;
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

type ComputeOptions = NonNullable<Parameters<typeof computePosition>[2]>;

export function useFloating(
  reference: Ref<HTMLElement | null>,
  floating: Ref<HTMLElement | null>,
  options: UseFloatingOptions = {},
) {
  const x = ref(0);
  const y = ref(0);
  const placement = ref<FloatingPlacement>(toValue(options.placement) ?? 'bottom');
  const middlewareData = ref<FloatingMiddlewareData>({});
  const styles = computed(() => ({ left: `${x.value}px`, top: `${y.value}px` }));
  let mounted = false;
  let revision = 0;
  let stopAutoUpdate: (() => void) | undefined;
  let stopWatching: (() => void) | undefined;

  async function measure(automatic: boolean): Promise<void> {
    const anchor = reference.value;
    const panel = floating.value;
    if (!mounted || !anchor || !panel || (automatic && toValue(options.enabled) === false)) return;

    const request = ++revision;
    const result = await computePosition(anchor, panel, {
      placement: toValue(options.placement) ?? placement.value,
      middleware: toValue(options.middleware) as ComputeOptions['middleware'],
      strategy: toValue(options.strategy),
    });
    if (request !== revision || anchor !== reference.value || panel !== floating.value) return;
    if (automatic && toValue(options.enabled) === false) return;

    x.value = result.x;
    y.value = result.y;
    placement.value = result.placement;
    middlewareData.value = result.middlewareData ?? {};
  }

  function update(): Promise<void> {
    return measure(false);
  }

  function cleanup(): void {
    revision += 1;
    stopAutoUpdate?.();
    stopAutoUpdate = undefined;
  }

  onMounted(() => {
    mounted = true;
    stopWatching = watch(
      [
        reference,
        floating,
        () => toValue(options.enabled) !== false,
        () => toValue(options.placement),
        () => toValue(options.middleware),
        () => toValue(options.strategy),
      ],
      ([anchor, panel, enabled]) => {
        cleanup();
        if (!enabled || !anchor || !panel) return;

        let observing = true;
        const refresh = () => {
          if (observing) void measure(true);
        };
        const stop = autoUpdate(anchor, refresh, panel);
        stopAutoUpdate = () => {
          observing = false;
          stop();
        };
        refresh();
      },
      { immediate: true, flush: 'post' },
    );
  });

  onBeforeUnmount(() => {
    mounted = false;
    stopWatching?.();
    cleanup();
  });

  return { x, y, placement, middlewareData, styles, update, cleanup };
}
