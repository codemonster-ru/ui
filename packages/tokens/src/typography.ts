export const cmTypographyTokens = Object.freeze({
  fontFamilyBase: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontFamilyHeading:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
  fontSizeXs: '0.75rem',
  fontSizeSm: '0.8125rem',
  fontSizeMd: '0.875rem',
  fontSizeLg: '0.9375rem',
  fontSizeXl: '1rem',
  fontSize2xl: '1.125rem',
  fontSize3xl: '1.25rem',
  lineHeightTight: '1.2',
  lineHeightNormal: '1.5',
  lineHeightRelaxed: '1.65',
} as const);

export type CmTypographyTokenName = keyof typeof cmTypographyTokens;
export type CmTypographyTokens = Readonly<Record<CmTypographyTokenName, string>>;
export type CmTypographyOverrides = Partial<CmTypographyTokens>;

export const cmTypographyTokenNames = Object.freeze(Object.keys(cmTypographyTokens) as CmTypographyTokenName[]);
