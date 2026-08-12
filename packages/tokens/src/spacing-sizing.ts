export const cmSpacingTokens = Object.freeze({
  space0: '0',
  space1: '0.25rem',
  space2: '0.5rem',
  space3: '0.75rem',
  space4: '1rem',
  space5: '1.25rem',
  space6: '1.5rem',
  space8: '2rem',
  space10: '2.5rem',
  space12: '3rem',
  space16: '4rem',
} as const);

export type CmSpacingTokenName = keyof typeof cmSpacingTokens;
export type CmSpacingTokens = Readonly<Record<CmSpacingTokenName, string>>;
export type CmSpacingOverrides = Partial<CmSpacingTokens>;

export const cmSpacingTokenNames = Object.freeze(Object.keys(cmSpacingTokens) as CmSpacingTokenName[]);

export const cmSizingTokens = Object.freeze({
  controlHeightSm: '1.75rem',
  controlHeightMd: '2.25rem',
  controlHeightLg: '2.5rem',
  iconSizeSm: '0.875rem',
  iconSizeMd: '1rem',
  iconSizeLg: '1.125rem',
  iconSizeXl: '1.5rem',
} as const);

export type CmSizingTokenName = keyof typeof cmSizingTokens;
export type CmSizingTokens = Readonly<Record<CmSizingTokenName, string>>;
export type CmSizingOverrides = Partial<CmSizingTokens>;

export const cmSizingTokenNames = Object.freeze(Object.keys(cmSizingTokens) as CmSizingTokenName[]);
