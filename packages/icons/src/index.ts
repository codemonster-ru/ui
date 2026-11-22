import { cmIconNames as generatedIconNames } from './generated/index.js';

export { cmIconFamilies, cmIconVariants, resolveCmIcon, scopeCmIconIds } from './types.js';
export type { CmIconFamily, CmIconGeometry, CmIconRendering, CmIconVariant } from './types.js';
export * from './generated/index.js';
export { sortAscending, sortDescending, sortNeutral } from './sort-icons.js';

export const cmIconNames = [...generatedIconNames, 'sortAscending', 'sortDescending', 'sortNeutral'] as const;
