export const iconVariants = ['solid', 'regular', 'light', 'thin'] as const;

export type IconVariant = (typeof iconVariants)[number];

export const outlineIconVariants = ['regular', 'light', 'thin'] as const satisfies readonly IconVariant[];

export type OutlineIconVariant = (typeof outlineIconVariants)[number];

export const iconStrokeWidths = {
  regular: 2,
  light: 1.5,
  thin: 1,
} as const satisfies Record<OutlineIconVariant, number>;
