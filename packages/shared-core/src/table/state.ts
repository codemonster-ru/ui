// Platform-independent presentation rules for VfTable.
//
// VfDataTable writes the same `vf-table` class vocabulary into its own markup,
// and is not migrated: nothing here is shared with it, and it must not start
// importing these rules as a side effect of this file existing.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** The four modifier props. */
export interface VfTableAppearance {
  columnDividers: boolean;
  compact: boolean;
  striped: boolean;
  stickyHeader: boolean;
}

/** Which of the table's optional children render. */
export interface VfTableSections {
  /** `caption.vf-table__caption`. */
  caption: boolean;
  /** `thead.vf-table__head`. */
  head: boolean;
  /** `tbody.vf-table__body`. */
  body: boolean;
  /** `tfoot.vf-table__foot`. */
  foot: boolean;
}

/**
 * The table's class list, in the order the reference emits it.
 *
 * The order is fixed - column dividers, compact, striped, sticky header -
 * whatever order a consumer writes the props in. The classes belong to the
 * table, never to the wrapper that carries the consumer's attributes.
 */
export function resolveTableClasses({ columnDividers, compact, striped, stickyHeader }: VfTableAppearance): string[] {
  const classes = ['vf-table'];

  if (columnDividers) classes.push('vf-table--column-dividers');
  if (compact) classes.push('vf-table--compact');
  if (striped) classes.push('vf-table--striped');
  if (stickyHeader) classes.push('vf-table--sticky-header');

  return classes;
}

/**
 * Which children the table renders.
 *
 * The caption opens for a truthy caption prop - "" is none, "0" is one - or a
 * caption slot; the three row groups open for their slot alone, keyed on its
 * presence rather than on what it renders, so an empty slot is an empty
 * section. No prop opens a row group.
 */
export function resolveTableSections(input: {
  caption?: string | null;
  hasCaptionSlot: boolean;
  hasHeaderSlot: boolean;
  hasDefaultSlot: boolean;
  hasFooterSlot: boolean;
}): VfTableSections {
  return {
    caption: Boolean(input.caption) || input.hasCaptionSlot,
    head: input.hasHeaderSlot,
    body: input.hasDefaultSlot,
    foot: input.hasFooterSlot,
  };
}
