import breakpointValues from './breakpoints.json';

export const vfBreakpoints = breakpointValues;

export type VfBreakpointName = keyof typeof vfBreakpoints;
export type VfBreakpointValue = (typeof vfBreakpoints)[VfBreakpointName];

export function toMinWidthQuery(value: number) {
  return `(min-width: ${value}px)`;
}

export function toMaxWidthQuery(value: number) {
  return `(max-width: ${value - 0.02}px)`;
}
