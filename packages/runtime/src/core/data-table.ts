/**
 * Data table sorting, selection and pagination rules, with no DOM and no framework.
 */

export type CmDataTableSortDirection = 'ascending' | 'descending';

export interface CmDataTableSortState {
  readonly direction: CmDataTableSortDirection;
  readonly key: string;
}

/** Which of the three sort labels applies, named after the state the header is currently in. */
export type CmDataTableSortLabel = 'ascending' | 'clear' | 'descending';

/**
 * Resolves the sort state after activating a column header.
 *
 * One column cycles ascending, descending, unsorted. Moving to a different column starts that
 * column at ascending rather than continuing the previous column's place in the cycle.
 */
export function nextSortState(current: CmDataTableSortState | null, key: string): CmDataTableSortState | null {
  if (current === null || current.key !== key) {
    return { direction: 'ascending', key };
  }

  return current.direction === 'ascending' ? { direction: 'descending', key } : null;
}

/**
 * Resolves which label a sort header should carry.
 *
 * The label names what activating the header will do next, not the state it is in, so an unsorted
 * column offers to sort ascending and a descending one offers to clear.
 */
export function sortLabelFor(current: CmDataTableSortState | null, key: string): CmDataTableSortLabel {
  if (current === null || current.key !== key) {
    return 'ascending';
  }

  return current.direction === 'ascending' ? 'descending' : 'clear';
}

/** The `aria-sort` value for a header, given the table's sort state. */
export function ariaSortFor(current: CmDataTableSortState | null, key: string): CmDataTableSortDirection | 'none' {
  return current !== null && current.key === key ? current.direction : 'none';
}

/**
 * Substitutes `{name}` placeholders in a label template.
 *
 * A missing placeholder is left alone rather than treated as an error: a consumer's translation
 * that drops one still renders the rest of its sentence.
 */
export function formatTemplate(template: string, values: Readonly<Record<string, number | string>>): string {
  return Object.entries(values).reduce(
    (result, [name, value]) => result.split(`{${name}}`).join(String(value)),
    template,
  );
}

export interface CmDataTableSelectionState {
  /** Every selectable row is selected. */
  readonly all: boolean;
  /** Some but not all are selected — the select-all box renders indeterminate. */
  readonly partial: boolean;
}

/**
 * Resolves the select-all checkbox state.
 *
 * A table with nothing selectable is neither checked nor indeterminate, rather than counting as
 * "all of zero rows selected".
 */
export function resolveSelectionState(
  selectableIds: readonly string[],
  selectedIds: readonly string[],
): CmDataTableSelectionState {
  const selected = new Set(selectedIds);
  const all = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  return { all, partial: !all && selectableIds.some((id) => selected.has(id)) };
}

/**
 * Resolves the selection after toggling the select-all checkbox, preserving the order rows are
 * rendered in rather than the order they were clicked.
 */
export function toggleAllSelection(
  rowIds: readonly string[],
  selectableIds: readonly string[],
  selectedIds: readonly string[],
  checked: boolean,
): string[] {
  const next = new Set(selectedIds);
  for (const id of selectableIds) {
    if (checked) next.add(id);
    else next.delete(id);
  }

  return rowIds.filter((id) => next.has(id));
}

/** Clamps a requested page into the pages that exist. */
export function clampPage(page: number, pageCount: number): number {
  return Math.min(Math.max(pageCount, 1), Math.max(1, page));
}
