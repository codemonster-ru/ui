import {
  cmPrimitiveColorTokens,
  cmSemanticLightColorTokens,
  serializeCmThemeTokensToCssVars,
} from '@codemonster-ru/ui-tokens';

export const colorHero = {
  eyebrow: 'CodeMonster UI color system · semantic palette',
  title: 'Perceptual materials, semantic decisions',
  description:
    'Primitive OKLCH scales feed semantic roles. Components consume only the canonical UI semantic token layer.',
};

export const families = new Map<string, { variable: string; step: string }[]>();
for (const variable of Object.keys(serializeCmThemeTokensToCssVars(cmPrimitiveColorTokens))) {
  const parts = variable.slice('--cm-palette-'.length).split('-');
  const step = parts.pop() ?? '';
  const family = parts.join('-');
  const entries = families.get(family) ?? [];
  entries.push({ variable, step });
  families.set(family, entries);
}

export const semanticSwatches = Object.keys(serializeCmThemeTokensToCssVars(cmSemanticLightColorTokens)).map(
  (variable) =>
    [
      variable
        .slice('--cm-color-'.length)
        .replace(
          /(^|-)([a-z])/gu,
          (_, separator: string, letter: string) => (separator ? ' ' : '') + letter.toUpperCase(),
        ),
      variable,
    ] as const,
);

export const contrastRows = [
  ['Primary text / surface', 'text-primary', 'background-surface'],
  ['Muted text / canvas', 'text-muted', 'background-canvas'],
  ['Interactive border / surface', 'border-interactive', 'background-surface'],
  ['Focus ring / surface', 'focus-ring', 'background-surface'],
  ['Primary solid / foreground', 'interactive-primary-foreground', 'interactive-primary-background'],
  ['Selected strongest state', 'selected-foreground', 'background-surface-selected-active'],
] as const;
