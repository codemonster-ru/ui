import { cmIconFamilies, cmIconVariants, type CmIconGeometry, type CmIconRendering } from './types.js';

const forms = cmIconFamilies.flatMap((family) => cmIconVariants.map((variant) => `${family}/${variant}`));

/** Expands the generated bodies, whose numeric entries reuse an earlier weight's SVG. */
export function createIconGeometry(bodies: readonly (string | number | null)[], viewBox = '0 0 24 24'): CmIconGeometry {
  const geometry: Record<string, CmIconRendering> = {};
  for (const [index, entry] of bodies.entries()) {
    const body = typeof entry === 'number' ? bodies[entry] : entry;
    if (typeof body === 'string') geometry[forms[index]] = { body, viewBox };
  }
  return geometry;
}
