import type { CmThemeMode } from '@codemonster-ru/ui-runtime/core';

export const showcaseThemeStorageKey: string;
export function readShowcaseTheme(fallback?: CmThemeMode): CmThemeMode;
export function applyShowcaseTheme(mode: CmThemeMode): void;
export function saveShowcaseTheme(mode: CmThemeMode): void;
export function followShowcaseTheme(sync: (mode: CmThemeMode) => void, fallback?: CmThemeMode): () => void;
export function followShowcaseFrameTheme(sync: (mode: CmThemeMode) => void): void;
