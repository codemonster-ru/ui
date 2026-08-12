# Dialog contract

Status: Active

Component: `Dialog`

Razor tag: `cm-dialog`

## Purpose and structure

Dialog presents a modal task in a native `<dialog>`. `id` is a required stable prefix, `title` is
the accessible heading, optional `description` is escaped supporting text, and `open` is the
semantic current state. The default slot is the body and the optional `footer` slot contains task
actions. The close button has an escaped `closeLabel` accessible name.

The root owns `cm-dialog`, `data-cm-controller="dialog"`, and `data-cm-dialog-state`. Title and
description ids are derived from `id`. Adapters own the native `open` attribute and use
`showModal()` when available; consumer attributes cannot override the component relationships.

## Interaction and focus

Opening stores the previously focused element, displays the modal, and focuses the first focusable
descendant or the close button. Tab and Shift+Tab remain inside the open Dialog. Escape and the
close button request closure. Closing restores focus to the stored connected element. Vue reports
`openChange` and maps state to `v-model:open`; Razor renders initial state and the shared runtime
owns subsequent DOM state.

Dialog does not close from backdrop pointer activation and does not render a trigger. The
application owns the trigger and persistent state. Closed server markup remains in the DOM but the
native element is not displayed.
