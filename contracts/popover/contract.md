# Popover contract

Status: Active

Component: `Popover`

Razor tag: `cm-popover`

## Purpose and structure

Popover is a non-modal button disclosure for supplemental interactive content. `id` is a stable
prefix, `label` is escaped trigger text, the trusted `trigger` slot can replace its visible content,
and the default slot is the panel. The component always owns the native button semantics; arbitrary
interactive trigger roots are intentionally not accepted. The native trigger owns
`aria-expanded` and `aria-controls`; the panel has `role="dialog"`, is labelled by the trigger, and
remains in the DOM. `placement` is `top`, `bottom-start`, or `bottom-end` and controls only a finite
CSS modifier. Popover does not calculate coordinates or teleport content.

## Interaction

`open` is controlled through Vue `v-model:open` and supplies Razor's initial server state. Pointer
or Enter/Space trigger activation toggles it. ArrowDown opens it and focuses the first focusable
panel descendant when one exists. Escape and outside pointer activation close it and restore focus
to the trigger. Focus may otherwise leave the non-modal panel naturally. The shared runtime owns
enhanced Razor state and reports `openChange`; closed server markup is hidden safely.
