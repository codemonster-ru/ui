# Tooltip contract

Status: Active

Component: `Tooltip`

Razor tag: `cm-tooltip`

Tooltip supplies brief non-interactive text for a native button trigger. `id` is a stable prefix,
`label` is the trigger's escaped accessible and visible content, and `content` is escaped tooltip
text. The trigger references the `role="tooltip"` region through `aria-describedby`. `placement` is
`top`, `bottom`, `start`, or `end` and controls only a finite CSS modifier.

Hover or focus shows the tooltip after the optional `delay` (`none`, `short`, or `long`). Pointer
exit or focus exit hides it. Escape hides it while preserving trigger focus. Tooltip content cannot
contain interactive controls, is never required to operate the trigger, and is not exposed only on
hover. The panel remains in the DOM and the shared runtime owns its `hidden` state for Razor; Vue
owns the same behavior directly. `defaultVisible` supplies only the initial render state for visual
examples and server-authored introductions; interaction remains authoritative afterward. Tooltip
has no controlled-open API or selection event.
