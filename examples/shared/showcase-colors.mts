import { cmPrimitiveColorTokens, serializeCmThemeTokensToCssVars } from '@codemonster-ru/ui-tokens';

export const families = new Map<string, { variable: string; step: string }[]>();
for (const variable of Object.keys(serializeCmThemeTokensToCssVars(cmPrimitiveColorTokens))) {
  const parts = variable.slice('--cm-palette-'.length).split('-');
  const step = parts.pop() ?? '';
  const family = parts.join('-');
  const entries = families.get(family) ?? [];
  entries.push({ variable, step });
  families.set(family, entries);
}

export const surfaceSamples = [
  { label: 'Surface', background: 'background-surface', foreground: 'text-primary' },
  { label: 'Subtle', background: 'background-surface-subtle', foreground: 'text-muted' },
  { label: 'Inverse', background: 'background-inverse', foreground: 'text-inverse' },
] as const;

export const selectedSamples = [
  { label: 'Selected', background: 'background-surface-selected' },
  { label: 'Hover', background: 'background-surface-selected-hover' },
  { label: 'Active', background: 'background-surface-selected-active' },
] as const;

export const contrastRows = [
  ['Text / surface', 'text-primary', 'background-surface'],
  ['Muted / canvas', 'text-muted', 'background-canvas'],
  ['Border / surface', 'border-interactive', 'background-surface'],
  ['Focus / surface', 'focus-ring', 'background-surface'],
  ['Primary button', 'interactive-primary-foreground', 'interactive-primary-background'],
  ['Selected active', 'selected-foreground', 'background-surface-selected-active'],
] as const;
