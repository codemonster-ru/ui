export const vfBreakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type VfBreakpointName = keyof typeof vfBreakpoints;
export type VfBreakpointValue = (typeof vfBreakpoints)[VfBreakpointName];
