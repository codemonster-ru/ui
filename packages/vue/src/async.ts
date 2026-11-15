import { defineAsyncComponent, defineComponent, h, type AsyncComponentLoader, type Component } from 'vue';

import CmSkeleton from './components/skeleton/CmSkeleton.vue';

export interface CreateAsyncWithSkeletonOptions<T extends Component = Component> {
  loader: AsyncComponentLoader<T>;
  delay?: number;
  radius?: string;
  defaultMinHeight?: string | number;
  minHeightPropKeys?: string[];
}

export function createAsyncWithSkeleton<T extends Component = Component>(
  options: CreateAsyncWithSkeletonOptions<T>,
): T {
  const {
    loader,
    delay = 0,
    radius = 'var(--cm-radius-overlay)',
    defaultMinHeight = '120px',
    minHeightPropKeys = ['height', 'minHeight', 'min-height'],
  } = options;

  const loadingComponent = defineComponent({
    name: 'CmAsyncSkeletonLoading',
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => {
        const height =
          minHeightPropKeys
            .map((key) => attrs[key])
            .find(
              (value): value is string | number =>
                typeof value === 'number' || (typeof value === 'string' && value !== ''),
            ) ?? defaultMinHeight;
        return h(CmSkeleton, {
          style: { minHeight: typeof height === 'number' ? `${height}px` : height, borderRadius: radius },
        });
      };
    },
  });

  return defineAsyncComponent<T>({ loader, loadingComponent, delay });
}
