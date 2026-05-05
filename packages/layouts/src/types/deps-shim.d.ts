declare module '@codemonster-ru/vueforge-core' {
  import type { Plugin } from 'vue';

  export type VfThemeMode = 'light' | 'dark' | 'system' | (string & {});

  export interface VfThemeConfig {
    preset?: unknown;
    [key: string]: unknown;
  }

  export interface VfVueForgeOptions {
    theme?: VfThemeConfig;
    defaultTheme?: VfThemeMode;
    themeStorageKey?: string;
    themeAttribute?: string;
  }

  export const defaultThemePreset: unknown;
  const VueForgeCore: Plugin;
  export default VueForgeCore;
}

declare module '@codemonster-ru/vueforge-core/foundation' {
  export type VfBreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  export const vfBreakpoints: Record<VfBreakpointName, number>;

  export function toMinWidthQuery(value: number | string): string;
  export function toMaxWidthQuery(value: number | string): string;
  export function useBreakpoint(): VfBreakpointName;
  export function useBreakpoints(): Record<VfBreakpointName, boolean>;
  export function useBreakpointValue<T>(map: Partial<Record<VfBreakpointName, T>>, fallback: T): T;
}

declare module '@codemonster-ru/vueforge-theme' {
  export interface VfThemeTokens {
    [key: string]: string | number | undefined;
  }

  export interface VfThemePreset {
    name?: string;
    tokens: VfThemeTokens;
    dark?: Partial<VfThemeTokens>;
  }

  export interface VfThemeConfig {
    preset?: VfThemePreset;
    extend?: Partial<VfThemeTokens>;
    light?: Partial<VfThemeTokens>;
    dark?: Partial<VfThemeTokens>;
    options?: Record<string, unknown>;
  }

  export function createThemePreset(preset: VfThemePreset): VfThemePreset;
  export function resolveThemePreset(config: VfThemeConfig): VfThemePreset;
  export function resolveThemePresetOptions(options?: Record<string, unknown>): Record<string, unknown>;
  export function themePresetToCssText(config: unknown): string;
  export function themeTokensToCssVars(tokens: Partial<VfThemeTokens>, prefix?: string): string;
  export function applyThemeConfig(config: unknown, targetDocument?: Document): void;
}
