import type { CmRuntime } from '@codemonster-ru/ui-runtime';

export function mountLayoutRecipes(root: HTMLElement): () => void;
export function matchesWarehouseFilter(cells: readonly (string | number)[], query: string): boolean;
export function mountWarehousePagination(root: HTMLElement, runtime: CmRuntime): void;
