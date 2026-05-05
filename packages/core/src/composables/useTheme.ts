import { inject } from 'vue';
import { themeContextKey } from '@/providers/themeContext';

export function useTheme() {
  const theme = inject(themeContextKey);

  if (!theme) {
    throw new Error('useTheme must be used inside VfThemeProvider.');
  }

  return {
    theme: theme.mode,
    resolvedTheme: theme.resolvedTheme,
    setTheme: theme.setTheme,
    toggleTheme: theme.toggleTheme,
  };
}
