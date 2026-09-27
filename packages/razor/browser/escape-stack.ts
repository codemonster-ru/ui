// The page-wide Escape stack of the reference's useEscapeKey, for every Razor
// controller that registers on it.
//
// Until M30 this lived inside dropdown.ts and was shared by every dropdown on
// the page - and by nothing else. The reference has one stack for every
// consumer of useEscapeKey: a VfDropdown open inside a VfPopover is closed by
// the first Escape and the popover by the second, whichever component each
// is. Two controllers with a stack each would both listen on the document,
// and the one registered first would take the Escape: the popover would
// close under an open dropdown. So the stack is one module, and a controller
// holds no stack of its own.
//
// Moved, not rewritten: an entry is removed and pushed again whenever it
// activates, the single document listener exists only while an entry does,
// and only the last entry sees an Escape nobody has prevented. The entry
// decides what to do with it; one that returns without preventing it - a
// popover with closeOnEscape=false - still takes it, and the entries below
// never see it, as in the reference.
export type EscapeEntry = (event: KeyboardEvent) => void;

const escapeEntries: EscapeEntry[] = [];
let escapeListener: ((event: KeyboardEvent) => void) | null = null;

export function removeEscapeEntry(entry: EscapeEntry): void {
  const index = escapeEntries.indexOf(entry);
  if (index >= 0) escapeEntries.splice(index, 1);

  if (escapeEntries.length === 0 && escapeListener) {
    document.removeEventListener('keydown', escapeListener);
    escapeListener = null;
  }
}

export function activateEscapeEntry(entry: EscapeEntry): void {
  removeEscapeEntry(entry);
  escapeEntries.push(entry);

  if (escapeListener) return;

  escapeListener = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    escapeEntries[escapeEntries.length - 1]?.(event);
  };
  document.addEventListener('keydown', escapeListener);
}
