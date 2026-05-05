import type { App, Plugin } from 'vue';
import VfPlaygroundComponent from './VfPlayground.vue';

export { default as VfPlayground } from './VfPlayground.vue';
export type { VfPlaygroundProps } from './props';

export interface VfPlaygroundPluginOptions {
  componentName?: string;
}

export const VfPlaygroundPlugin: Plugin = {
  install(app: App, options: VfPlaygroundPluginOptions = {}) {
    app.component(options.componentName ?? 'VfPlayground', VfPlaygroundComponent);
  }
};
