/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module '@codemonster-ru/vueforge-codeblock/view' {
  import type { DefineComponent } from 'vue';
  export const VfCodeBlock: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
}

declare module 'virtual:vueforge-playground/*' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
