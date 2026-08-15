export const cmBorderTokens = Object.freeze({
  borderWidth: '1px',
  borderWidthThick: '2px',
} as const);

export type CmBorderTokenName = keyof typeof cmBorderTokens;
export type CmBorderTokens = Readonly<Record<CmBorderTokenName, string>>;
export type CmBorderOverrides = Partial<CmBorderTokens>;

export const cmBorderTokenNames = Object.freeze(Object.keys(cmBorderTokens) as CmBorderTokenName[]);

export const cmRadiusTokens = Object.freeze({
  radius: '0.75rem',
  radiusControl: 'calc(var(--cm-radius) - 0.125rem)',
  radiusControlTight: 'calc(var(--cm-radius) - 0.25rem)',
  radiusSurface: 'var(--cm-radius)',
  radiusOverlay: 'calc(var(--cm-radius) + 0.125rem)',
  radiusRound: '999px',
} as const);

export type CmRadiusTokenName = keyof typeof cmRadiusTokens;
export type CmRadiusTokens = Readonly<Record<CmRadiusTokenName, string>>;
export type CmRadiusOverrides = Partial<CmRadiusTokens>;

export const cmRadiusTokenNames = Object.freeze(Object.keys(cmRadiusTokens) as CmRadiusTokenName[]);

export const cmShadowTokens = Object.freeze({
  shadowNone: 'none',
  shadowSurface: '0 1px 2px color-mix(in srgb, var(--cm-color-text-primary) 4%, transparent)',
  shadowOverlay:
    '0 var(--cm-space-1) calc(var(--cm-space-4) * 0.625) color-mix(in srgb, var(--cm-palette-neutral-1000) 16%, transparent), 0 var(--cm-border-width) calc(var(--cm-space-1) / 2) color-mix(in srgb, var(--cm-palette-neutral-1000) 10%, transparent)',
} as const);

export type CmShadowTokenName = keyof typeof cmShadowTokens;
export type CmShadowTokens = Readonly<Record<CmShadowTokenName, string>>;
export type CmShadowOverrides = Partial<CmShadowTokens>;

export const cmShadowTokenNames = Object.freeze(Object.keys(cmShadowTokens) as CmShadowTokenName[]);
