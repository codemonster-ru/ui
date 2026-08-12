import { cmBorderTokenNames, cmRadiusTokenNames, cmShadowTokenNames } from './borders.js';
import { cmBreakpointTokenNames } from './breakpoints.js';
import { cmMotionTokenNames } from './motion.js';
import { cmPrimitiveColorTokenNames } from './primitive-colors.js';
import { cmSemanticColorTokenNames } from './semantic-colors.js';
import { cmSizingTokenNames, cmSpacingTokenNames } from './spacing-sizing.js';
import { cmTypographyTokenNames } from './typography.js';
import type { CmThemeTokenName } from './theme-preset.js';

export const cmThemeTokenSchema = Object.freeze({
  primitiveColor: cmPrimitiveColorTokenNames,
  semanticColor: cmSemanticColorTokenNames,
  spacing: cmSpacingTokenNames,
  sizing: cmSizingTokenNames,
  typography: cmTypographyTokenNames,
  border: cmBorderTokenNames,
  radius: cmRadiusTokenNames,
  shadow: cmShadowTokenNames,
  motion: cmMotionTokenNames,
  breakpoint: cmBreakpointTokenNames,
} as const);

export type CmThemeTokenGroupName = keyof typeof cmThemeTokenSchema;

export const cmThemeTokenNames = Object.freeze(Object.values(cmThemeTokenSchema).flat() as CmThemeTokenName[]);
