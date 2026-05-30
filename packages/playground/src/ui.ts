import './critical.css';
import './playground.css';

import type { Component } from 'vue';
import { createAsyncWithSkeleton } from '@codemonster-ru/vueforge-core/async';

export * from './index';
export const VfPlaygroundAsync = createAsyncWithSkeleton<Component>({
  loader: async () => {
    const module = await import('./VfPlayground.vue');

    return module.default;
  },
  delay: 0,
  radius: 'var(--vf-playground-radius-lg, var(--vf-radius-overlay))',
  defaultMinHeight: 'var(--vf-playground-height, var(--vf-breakpoint-xs))',
});
