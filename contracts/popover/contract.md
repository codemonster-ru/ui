# Popover contract

Status: Active

Component: `Popover`

## Purpose and structure

Popover is a non-modal button disclosure for supplemental interactive content. `id` is a stable
prefix, `label` is escaped trigger text, the trusted `trigger` slot can replace its visible content,
and the default slot is the panel. The component always owns the native button semantics; arbitrary
interactive trigger roots are intentionally not accepted. The native trigger owns
`aria-expanded` and `aria-controls`; the panel has `role="dialog"`, is labelled by the trigger, and
remains in the DOM and is hidden while closed. Both adapters position the open panel 10 pixels
away from the trigger. The panel can flip vertically and shift horizontally at the viewport edge.
The authored CSS fallback accepts `top`, `bottom-start`, or `bottom-end`.

Vue can teleport the open panel to a selector or element with `teleportTo`, while `disableTeleport`
keeps it inline. A body request chooses the containing dialog when nested. Vanilla keeps the
panel attached to its non-modal disclosure.

## Interaction

`open` binds Vue `v-model:open`, and `defaultOpen` applies when it is omitted. Vanilla HTML uses
the authored trigger's `aria-expanded` and panel's `hidden` attributes. Pointer, Enter and Space
toggle the panel. ArrowDown focuses the designated `data-autofocus` or first focusable descendant.
With `focusOnOpen`, pointer activation also moves focus. Vanilla uses
`data-cm-popover-focus-on-open="true"` on the root and `tabindex="-1"` on the panel.

Escape closes and restores focus to the trigger; an outside click closes without moving focus.
Set `:close-on-escape="false"` or `:close-on-outside-click="false"` in Vue, or set the matching
`data-cm-popover-close-on-escape="false"` or `data-cm-popover-close-on-outside-click="false"` on the
Vanilla root, to opt out separately. The Vue panel slot receives `open` and `close()`.
