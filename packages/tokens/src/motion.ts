export const cmMotionTokens = Object.freeze({
  motionDurationNone: '0ms',
  motionDurationFast: '220ms',
  motionDurationNormal: '320ms',
  motionEaseStandard: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const);

export type CmMotionTokenName = keyof typeof cmMotionTokens;
export type CmMotionTokens = Readonly<Record<CmMotionTokenName, string>>;
export type CmMotionOverrides = Partial<CmMotionTokens>;

export const cmMotionTokenNames = Object.freeze(Object.keys(cmMotionTokens) as CmMotionTokenName[]);
export const cmMotionDurationsMs = Object.freeze({
  none: 0,
  fast: 220,
  normal: 320,
} as const);
