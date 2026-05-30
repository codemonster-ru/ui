declare module '@codemonster-ru/vueforge-core/async' {
  import type { Component } from 'vue';

  export interface CreateAsyncWithSkeletonOptions<TComponent extends Component = Component> {
    loader: () => Promise<TComponent>;
    delay?: number;
    radius?: string;
    defaultMinHeight?: string;
    normalizeContentSpacing?: boolean;
    containerMinHeight?: string;
  }

  export function createAsyncWithSkeleton<TComponent extends Component = Component>(
    options: CreateAsyncWithSkeletonOptions<TComponent>
  ): TComponent;
}
