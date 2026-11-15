# Dialog contract

Status: Active

Component: `Dialog`

## Purpose and structure

Dialog presents a modal task in a native `<dialog>`. `id` is a required stable prefix. Supply a
`title`, header slot, `aria-label`, or `aria-labelledby` to name the dialog. Explicit
`aria-labelledby` takes precedence, followed by `aria-label` and then the internal heading.
Optional `description` is escaped supporting text. Explicit `aria-describedby` replaces the
generated description relationship. `size` is `sm`, `md`, or `lg`; `dividers` separates the header and footer
regions. The default slot is the body and the optional `footer` slot contains task actions. Trusted
`header`, `description`, and `actions` slots replace their escaped text fallbacks without changing
the deterministic accessible relationships. Header content remains inside the component-owned
`h2`; consumers must not supply another heading root. The close button has an escaped `closeLabel`
accessible name. `dismissible=false` disables
that control and prevents user-initiated Escape dismissal while an application-owned task is busy.

The root owns `cm-dialog`, `data-cm-controller="dialog"`, and `data-cm-dialog-state`. Internal title
and description IDs are derived from `id`. Vue derives initial state from `defaultOpen` when `open`
is omitted. `open` takes precedence when supplied. Vanilla HTML uses the native `open` attribute
to indicate initial state. Both adapters use `showModal()` when available.

## Interaction and focus

Opening stores the previously focused element, displays the modal, and focuses the first focusable
descendant or the close button. Tab and Shift+Tab remain inside the open Dialog. When `dismissible`
is true, Escape and the close button request closure. Closing restores focus to the stored connected element. Vue reports
`openChange` and maps state to `v-model:open`; Vanilla HTML renders initial state and the shared runtime
owns subsequent DOM state.

Use `closeOnEscape=false` in Vue or `data-cm-dialog-close-on-escape="false"` on the Vanilla root
to keep the dialog open on Escape while preserving dismissal through close controls. Nested
dialogs handle their own keys and focus. A blocked Escape on an inner dialog keeps both open.

Vue body, actions, and footer slots receive a `close()` callback. Like the owned close button, this
user-dismissal callback does nothing while `dismissible=false`; controlled application state can
still close the Dialog. Vanilla HTML content can use the contract-owned `data-cm-dialog-close` hook when it
needs an additional dismiss action, with the same lock behavior.

Backdrop clicks leave Dialog open by default. Vue can opt in to backdrop dismissal with
`closeOnOverlayClick`. The application owns the trigger and persistent state. Closed server markup
remains in the DOM and the native element is hidden.
