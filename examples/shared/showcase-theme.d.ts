import type { CmThemeMode } from '@codemonster-ru/ui-runtime/core';

export function readShowcaseTheme(fallback?: CmThemeMode): CmThemeMode;
export function applyShowcaseTheme(mode: CmThemeMode): void;
export function saveShowcaseTheme(mode: CmThemeMode): void;
export function followShowcaseTheme(sync: (mode: CmThemeMode) => void, fallback?: CmThemeMode): () => void;
