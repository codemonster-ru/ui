import { vfBreakpoints } from './breakpoints.js';

export type VfBreakpointRegistryEntry = {
  px: number;
};

export type VfBreakpointRegistry = Record<string, VfBreakpointRegistryEntry>;

export const vfBreakpointRegistry = {
  xs: { px: vfBreakpoints.xs },
  sm: { px: vfBreakpoints.sm },
  md: { px: vfBreakpoints.md },
  lg: { px: vfBreakpoints.lg },
  xl: { px: vfBreakpoints.xl },
  '2xl': { px: vfBreakpoints['2xl'] },
} satisfies VfBreakpointRegistry;

function toMaxWidthPx(value: number) {
  return `${value - 0.02}px`;
}

export const vfBreakpointQueryAliases = {
  '--vf-bp-xs-up': `(min-width: ${vfBreakpoints.xs}px)`,
  '--vf-bp-sm-up': `(min-width: ${vfBreakpoints.sm}px)`,
  '--vf-bp-md-up': `(min-width: ${vfBreakpoints.md}px)`,
  '--vf-bp-lg-up': `(min-width: ${vfBreakpoints.lg}px)`,
  '--vf-bp-xl-up': `(min-width: ${vfBreakpoints.xl}px)`,
  '--vf-bp-2xl-up': `(min-width: ${vfBreakpoints['2xl']}px)`,
  '--vf-bp-xs-down': `(max-width: ${toMaxWidthPx(vfBreakpoints.xs)})`,
  '--vf-bp-sm-down': `(max-width: ${toMaxWidthPx(vfBreakpoints.sm)})`,
  '--vf-bp-md-down': `(max-width: ${toMaxWidthPx(vfBreakpoints.md)})`,
  '--vf-bp-lg-down': `(max-width: ${toMaxWidthPx(vfBreakpoints.lg)})`,
  '--vf-bp-xl-down': `(max-width: ${toMaxWidthPx(vfBreakpoints.xl)})`,
  '--vf-bp-2xl-down': `(max-width: ${toMaxWidthPx(vfBreakpoints['2xl'])})`,
} as const satisfies Record<string, string>;

export type VfBreakpointQueryAlias = keyof typeof vfBreakpointQueryAliases;

export function resolveVfBreakpointQuery(alias: string) {
  return vfBreakpointQueryAliases[alias as VfBreakpointQueryAlias] ?? null;
}

export function expandVfBreakpointQueries(code: string) {
  const unknownAliases = new Set<string>();
  const transformed = code.replace(
    /@(media|container)(\s+[a-z_][a-z0-9_-]*)?\s*\(\s*(--vf-bp-[a-z0-9-]+)\s*\)/gi,
    (fullMatch, atRule: string, containerName: string | undefined, alias: string) => {
      const query = resolveVfBreakpointQuery(alias);
      if (!query) {
        unknownAliases.add(alias);
        return fullMatch;
      }

      return `@${atRule}${containerName ?? ''} ${query}`;
    },
  );

  return { transformed, unknownAliases };
}
