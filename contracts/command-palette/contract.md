# CommandPalette contract

Status: Active

Component: `CommandPalette`

Razor tag: `cm-command-palette`

## Purpose and model

CommandPalette is a modal command search built on native `<dialog>`. `id` is a stable prefix,
`title` is its visible accessible heading, and `commands` is a non-empty ordered collection with
unique kebab-case `id`, non-empty escaped `label`, optional string `keywords`, and optional
`disabled`. `query` is the current plain-text filter. Matching is case-insensitive against label and
keywords; original order is preserved.

The search input uses the ARIA combobox pattern and keeps DOM focus. Its `aria-activedescendant`
references the current enabled matching `role="option"` in the listbox. Non-matches use native
`hidden`; an empty-message region is shown only when no command matches.

## State and interaction

`open` maps to Vue `v-model:open` and Razor initial state. Opening focuses the input. Input updates
filter results and reports `queryChange`. ArrowDown and ArrowUp wrap the active enabled match; Home
and End move to its boundaries. Enter reports the active command id and closes. Pointer selection
does the same. Disabled commands never become active or select. Escape and the close button dismiss
and restore prior focus. Tab remains inside the modal.

Vue owns interaction directly. Razor uses the shared controller and may request opening with
`cm:command-palette-open-request`. The component does not execute commands, implement global
shortcuts, persist history, or perform fuzzy ranking.
