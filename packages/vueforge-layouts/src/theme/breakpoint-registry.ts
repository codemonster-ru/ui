import {
  resolveVfBreakpointQuery,
  vfBreakpointQueryAliases,
  vfBreakpointRegistry,
} from '../../../theme/src/breakpoint-queries';

export type VfBreakpointRegistryEntry = {
  px: number;
};

export type VfBreakpointRegistry = Record<string, VfBreakpointRegistryEntry>;

export const vfLayoutBreakpointRegistry: VfBreakpointRegistry = vfBreakpointRegistry;
export const vfLayoutCustomMediaAliases: Record<string, string> = vfBreakpointQueryAliases;

export type VfLayoutCustomMediaAlias = keyof typeof vfLayoutCustomMediaAliases;

export function resolveLayoutCustomMedia(alias: string): string | null {
  return resolveVfBreakpointQuery(alias);
}
