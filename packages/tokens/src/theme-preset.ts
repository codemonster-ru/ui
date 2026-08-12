import { cmBorderTokens, cmRadiusTokens, cmShadowTokens } from './borders.js';
import { cmBreakpointTokens } from './breakpoints.js';
import { cmMotionTokens } from './motion.js';
import { cmPrimitiveColorTokens } from './primitive-colors.js';
import { cmSemanticLightColorTokens } from './semantic-colors.js';
import { cmSizingTokens, cmSpacingTokens } from './spacing-sizing.js';
import { cmTypographyTokens } from './typography.js';
import type { CmBorderTokens, CmRadiusTokens, CmShadowTokens } from './borders.js';
import type { CmBreakpointTokens } from './breakpoints.js';
import type { CmMotionTokens } from './motion.js';
import type { CmPrimitiveColorTokens } from './primitive-colors.js';
import type { CmSemanticColorTokens } from './semantic-colors.js';
import type { CmSizingTokens, CmSpacingTokens } from './spacing-sizing.js';
import type { CmTypographyTokens } from './typography.js';

export type CmThemeMode = 'light' | 'dark';
export type CmThemeTokens = CmPrimitiveColorTokens &
  CmSemanticColorTokens &
  CmSpacingTokens &
  CmSizingTokens &
  CmTypographyTokens &
  CmBorderTokens &
  CmRadiusTokens &
  CmShadowTokens &
  CmMotionTokens &
  CmBreakpointTokens;
export type CmThemeTokenName = keyof CmThemeTokens;

export interface CmThemePreset {
  readonly mode: CmThemeMode;
  readonly name: string;
  readonly tokens: CmThemeTokens;
}

const cmLightThemeTokens: CmThemeTokens = Object.freeze({
  ...cmPrimitiveColorTokens,
  ...cmSemanticLightColorTokens,
  ...cmSpacingTokens,
  ...cmSizingTokens,
  ...cmTypographyTokens,
  ...cmBorderTokens,
  ...cmRadiusTokens,
  ...cmShadowTokens,
  ...cmMotionTokens,
  ...cmBreakpointTokens,
});

export const cmLightThemePreset: CmThemePreset = Object.freeze({
  mode: 'light',
  name: 'codemonster-light',
  tokens: cmLightThemeTokens,
});
