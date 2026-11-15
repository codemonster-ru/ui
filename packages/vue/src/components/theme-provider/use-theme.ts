import { inject, type ComputedRef, type InjectionKey, type Ref } from 'vue';
import type { CmResolvedTheme, CmThemeMode } from '@codemonster-ru/ui-runtime/core';

export interface CmThemeProviderProps {
  defaultTheme?: CmThemeMode;
  storageKey?: string;
  attribute?: string;
}

export interface CmThemeContext {
  theme: Ref<CmThemeMode>;
  resolvedTheme: ComputedRef<CmResolvedTheme>;
  setTheme: (mode: CmThemeMode) => void;
  toggleTheme: () => void;
}

export const cmThemeContextKey: InjectionKey<CmThemeContext> = Symbol('CodeMonster UI theme');

export function useCmTheme(): CmThemeContext {
  const theme = inject(cmThemeContextKey);
  if (!theme) throw new Error('useCmTheme must be used inside CmThemeProvider.');
  return theme;
}
