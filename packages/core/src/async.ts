import {
  defineAsyncComponent,
  defineComponent,
  h,
  type AsyncComponentLoader,
  type Component,
  type DefineComponent,
} from 'vue';
import { VfSkeleton } from './components/skeleton';

export interface CreateAsyncWithSkeletonOptions<T extends Component = Component> {
  loader: AsyncComponentLoader<T>;
  delay?: number;
  radius?: string;
  defaultMinHeight?: string | number;
  minHeightPropKeys?: string[];
}

const DEFAULT_MIN_HEIGHT = 'var(--vf-async-skeleton-min-height)';

const toCssLength = (value: unknown): string | undefined => {
  if (value == null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return `${value}px`;
  }

  return String(value);
};

const resolveMinHeightFromAttrs = (attrs: Record<string, unknown>, keys: readonly string[]): string | undefined => {
  for (const key of keys) {
    const resolved = toCssLength(attrs[key]);
    if (resolved != null) {
      return resolved;
    }
  }

  return undefined;
};

export const createAsyncWithSkeleton = <T extends Component = Component>(
  options: CreateAsyncWithSkeletonOptions<T>,
): T => {
  const {
    loader,
    delay = 0,
    radius = 'var(--vf-radius-overlay)',
    defaultMinHeight = DEFAULT_MIN_HEIGHT,
    minHeightPropKeys = ['height', 'minHeight', 'min-height'],
  } = options;

  const loadingComponent: DefineComponent = defineComponent({
    name: 'VfAsyncSkeletonLoading',
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => {
        const minHeight = resolveMinHeightFromAttrs(attrs, minHeightPropKeys) ?? toCssLength(defaultMinHeight);

        return h(VfSkeleton, {
          minHeight,
          radius,
        });
      };
    },
  });

  return defineAsyncComponent({
    loader,
    loadingComponent,
    delay,
  }) as T;
};
