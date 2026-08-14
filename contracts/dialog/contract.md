# Dialog contract

Status: Active

Component: `Dialog`

Razor tag: `cm-dialog`

## Purpose and structure

Dialog presents a modal task in a native `<dialog>`. `id` is a required stable prefix, `title` is
the accessible heading, optional `description` is escaped supporting text, and `open` is the
semantic current state. `size` is `sm`, `md`, or `lg`; `dividers` separates the header and footer
regions. The default slot is the body and the optional `footer` slot contains task actions. Trusted
`header`, `description`, and `actions` slots replace their escaped text fallbacks without changing
the deterministic accessible relationships. Header content remains inside the component-owned
`h2`; consumers must not supply another heading root. The close button has an escaped `closeLabel`
accessible name. `dismissible=false` disables
that control and prevents user-initiated Escape dismissal while an application-owned task is busy.

The root owns `cm-dialog`, `data-cm-controller="dialog"`, and `data-cm-dialog-state`. Title and
description ids are derived from `id`. Adapters own the native `open` attribute and use
`showModal()` when available; consumer attributes cannot override the component relationships.

## Interaction and focus

Opening stores the previously focused element, displays the modal, and focuses the first focusable
descendant or the close button. Tab and Shift+Tab remain inside the open Dialog. When `dismissible`
is true, Escape and the close button request closure. Closing restores focus to the stored connected element. Vue reports
`openChange` and maps state to `v-model:open`; Razor renders initial state and the shared runtime
owns subsequent DOM state.

Vue body, actions, and footer slots receive a `close()` callback. Like the owned close button, this
user-dismissal callback does nothing while `dismissible=false`; controlled application state can
still close the Dialog. Razor content can use the contract-owned `data-cm-dialog-close` hook when it
needs an additional dismiss action, with the same lock behavior.

Dialog does not close from backdrop pointer activation and does not render a trigger. The
application owns the trigger and persistent state. Closed server markup remains in the DOM but the
native element is not displayed.
