export const vfMotionTokens = {
  durationFast: '220ms',
  durationNormal: '320ms',
  easeStandard: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

function motionTokenToMs(value: string) {
  return Number.parseInt(value, 10);
}

export const vfMotionDurationsMs = {
  fast: motionTokenToMs(vfMotionTokens.durationFast),
  normal: motionTokenToMs(vfMotionTokens.durationNormal),
} as const;
