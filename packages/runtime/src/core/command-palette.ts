/**
 * Command palette filtering and keyboard rules, with no DOM and no framework.
 */

export interface CmCommandCoreItem {
  readonly disabled?: boolean;
  readonly id: string;
  readonly keywords?: string;
  readonly label: string;
}

export type CmCommandPaletteAction =
  { readonly index: number; readonly type: 'activate' } | { readonly type: 'commit' };

/** Reduces a typed query to the form matching compares against. */
export function normalizeCommandQuery(query: string): string {
  return query.trim().toLocaleLowerCase();
}

/**
 * Reports whether a command matches an already-normalized query.
 *
 * Internal to this module: `filterCommands` is what adapters need, and exporting the single-command
 * form as well only widens the surface without answering a question anyone has asked.
 *
 * Label and keywords are searched together, so a command can be found by a synonym it never
 * displays. An empty query matches everything.
 */
export function matchesCommandQuery(command: CmCommandCoreItem, needle: string): boolean {
  if (needle === '') {
    return true;
  }

  return `${command.label} ${command.keywords ?? ''}`.toLocaleLowerCase().includes(needle);
}

/** Filters commands by a raw, un-normalized query. */
export function filterCommands<T extends CmCommandCoreItem>(commands: readonly T[], query: string): T[] {
  const needle = normalizeCommandQuery(query);
  return commands.filter((command) => matchesCommandQuery(command, needle));
}

/**
 * Resolves what a key does to the palette's list.
 *
 * The arrows are not symmetric, and deliberately so: from "nothing active" ArrowDown starts at the
 * first command while ArrowUp jumps to the last, which is what makes an empty-handed ArrowUp reach
 * the bottom of the list in one press.
 */
export function commandPaletteKeyAction(
  key: string,
  { activeIndex, count }: { readonly activeIndex: number; readonly count: number },
): CmCommandPaletteAction | null {
  if (key === 'Enter') {
    return activeIndex >= 0 ? { type: 'commit' } : null;
  }

  if (count === 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
    return null;
  }

  const last = count - 1;
  const index =
    key === 'Home'
      ? 0
      : key === 'End'
        ? last
        : key === 'ArrowDown'
          ? (Math.max(activeIndex, -1) + 1) % count
          : activeIndex <= 0
            ? last
            : activeIndex - 1;

  return { index, type: 'activate' };
}
