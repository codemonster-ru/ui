export const cmBreakpoints = Object.freeze({
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const);

export type CmBreakpointName = keyof typeof cmBreakpoints;
export type CmBreakpointValue = (typeof cmBreakpoints)[CmBreakpointName];

export const cmBreakpointNames = Object.freeze(Object.keys(cmBreakpoints) as CmBreakpointName[]);

export const cmBreakpointTokens = Object.freeze({
  breakpointXs: `${cmBreakpoints.xs}px`,
  breakpointSm: `${cmBreakpoints.sm}px`,
  breakpointMd: `${cmBreakpoints.md}px`,
  breakpointLg: `${cmBreakpoints.lg}px`,
  breakpointXl: `${cmBreakpoints.xl}px`,
  breakpoint2xl: `${cmBreakpoints['2xl']}px`,
} as const);

export type CmBreakpointTokenName = keyof typeof cmBreakpointTokens;
export type CmBreakpointTokens = Readonly<Record<CmBreakpointTokenName, string>>;
export type CmBreakpointOverrides = Partial<CmBreakpointTokens>;

export const cmBreakpointTokenNames = Object.freeze(
  Object.keys(cmBreakpointTokens) as CmBreakpointTokenName[],
);

export function resolveCmBreakpoint(name: string): CmBreakpointValue | null {
  return cmBreakpoints[name as CmBreakpointName] ?? null;
}
