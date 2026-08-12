export const cmBorderTokens = Object.freeze({
  borderWidth: '1px',
  borderWidthThick: '2px',
} as const);

export type CmBorderTokenName = keyof typeof cmBorderTokens;
export type CmBorderTokens = Readonly<Record<CmBorderTokenName, string>>;
export type CmBorderOverrides = Partial<CmBorderTokens>;

export const cmBorderTokenNames = Object.freeze(Object.keys(cmBorderTokens) as CmBorderTokenName[]);

export const cmRadiusTokens = Object.freeze({
  radiusControl: '0.625rem',
  radiusControlTight: '0.5rem',
  radiusSurface: '0.75rem',
  radiusOverlay: '0.875rem',
  radiusRound: '999px',
} as const);

export type CmRadiusTokenName = keyof typeof cmRadiusTokens;
export type CmRadiusTokens = Readonly<Record<CmRadiusTokenName, string>>;
export type CmRadiusOverrides = Partial<CmRadiusTokens>;

export const cmRadiusTokenNames = Object.freeze(Object.keys(cmRadiusTokens) as CmRadiusTokenName[]);

export const cmShadowTokens = Object.freeze({
  shadowNone: 'none',
  shadowSurface: '0 1px 2px color-mix(in srgb, var(--cm-palette-neutral-1000) 4%, transparent)',
  shadowOverlay:
    '0 0.25rem 0.625rem color-mix(in srgb, var(--cm-palette-neutral-1000) 16%, transparent), 0 1px 0.125rem color-mix(in srgb, var(--cm-palette-neutral-1000) 10%, transparent)',
} as const);

export type CmShadowTokenName = keyof typeof cmShadowTokens;
export type CmShadowTokens = Readonly<Record<CmShadowTokenName, string>>;
export type CmShadowOverrides = Partial<CmShadowTokens>;

export const cmShadowTokenNames = Object.freeze(Object.keys(cmShadowTokens) as CmShadowTokenName[]);
