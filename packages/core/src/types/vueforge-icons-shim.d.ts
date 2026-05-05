declare module '@codemonster-ru/vueforge-icons' {
  import type { DefineComponent } from 'vue';

  export const VueIconify: DefineComponent<{
    icon?: string;
    size?: number | string;
    role?: string;
    'aria-label'?: string;
  }>;

  export const icons: Record<string, string>;
  export type IconName = string;
}
