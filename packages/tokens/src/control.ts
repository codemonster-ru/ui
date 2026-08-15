export const cmControlTokens = Object.freeze({
  focusRingWidth: '3px',
  controlFontSizeSm: 'var(--cm-font-size-md)',
  controlFontSizeMd: 'var(--cm-font-size-xl)',
  controlFontSizeLg: 'var(--cm-font-size-2xl)',
  controlLineHeight: 'var(--cm-line-height-tight)',
  buttonPaddingSm: '0.25rem 0.5rem',
  buttonPaddingMd: '0.3125rem 0.75rem',
  buttonPaddingLg: '0.5rem 1rem',
  buttonGap: '0.5rem',
  fieldPaddingBlockSm: '0.25rem',
  fieldPaddingBlockMd: '0.3125rem',
  fieldPaddingBlockLg: '0.5rem',
  fieldPaddingInlineSm: '0.5rem',
  fieldPaddingInlineMd: '0.75rem',
  fieldPaddingInlineLg: '0.875rem',
  fieldPaddingSm: 'var(--cm-field-padding-block-sm) var(--cm-field-padding-inline-sm)',
  fieldPaddingMd: 'var(--cm-field-padding-block-md) var(--cm-field-padding-inline-md)',
  fieldPaddingLg: 'var(--cm-field-padding-block-lg) var(--cm-field-padding-inline-lg)',
} as const);

export type CmControlTokenName = keyof typeof cmControlTokens;
export type CmControlTokens = Readonly<Record<CmControlTokenName, string>>;
export type CmControlOverrides = Partial<CmControlTokens>;

export const cmControlTokenNames = Object.freeze(Object.keys(cmControlTokens) as CmControlTokenName[]);
