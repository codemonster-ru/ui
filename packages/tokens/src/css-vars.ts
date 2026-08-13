import type { CmThemeTokens } from './theme-preset.js';

export type CmCssVariableName = `--cm-${string}`;

function tokenNameToCssVariable(name: string): CmCssVariableName {
  return `--cm-${name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase()}`;
}

export function serializeCmThemeTokensToCssVars(
  tokens: Readonly<Partial<CmThemeTokens>>,
): Readonly<Record<CmCssVariableName, string>> {
  return Object.freeze(
    Object.fromEntries(Object.entries(tokens).map(([name, value]) => [tokenNameToCssVariable(name), value])) as Record<
      CmCssVariableName,
      string
    >,
  );
}
