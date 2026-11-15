# CommandPalette contract

Status: Active

Component: `CommandPalette`

## Purpose and model

CommandPalette is a modal command search built on native `<dialog>`. `id` is a stable prefix,
`title` is its visible accessible heading, and `commands` is an ordered collection with
unique kebab-case `id`, non-empty escaped `label`, optional string `keywords`, and optional
`disabled`. `query` is the current plain-text filter. Matching is case-insensitive against label and
keywords; original order is preserved.

An empty collection with an empty query renders the localized `idleText`; a non-empty query without
matches renders `emptyText`. `loading` replaces results with the localized live `loadingText` status.
The `actions`, `loading`, `idle`, `empty`, and `footer` slots accept trusted platform content.
`command{UpperCamelId}` replaces only one command's escaped label inside the component-owned option;
Vue receives `{ command, active }` while Vanilla HTML uses explicit markup.

The search input uses the ARIA combobox pattern and keeps DOM focus. Its `aria-activedescendant`
references the current enabled matching `role="option"` in the listbox. Non-matches use native
`hidden`; an empty-message region is shown only when no command matches.

## State and interaction

`open` maps to Vue `v-model:open` and Vanilla HTML initial state. Opening focuses the input. Input updates
filter results and reports `queryChange`. ArrowDown and ArrowUp wrap the active enabled match; Home
and End move to its boundaries. Enter reports the active command id and closes. Pointer selection
does the same. Disabled commands never become active or select. Escape and the close button dismiss
and restore prior focus. Tab remains inside the modal.

Vue owns interaction directly. Vanilla HTML uses the shared controller and may request opening with
`cm:command-palette-open-request`. Both preserve order when filtering is disabled for host-ranked
results. Both can leave selection inactive until the user navigates, submit an unmatched query,
keep the dialog open on selection, or control Escape and backdrop dismissal independently.
Vanilla opts in with attributes on the dialog:

| Vue prop or event | Vanilla HTML attribute or event |
| --- | --- |
| `defaultOpen` | `open` |
| `defaultQuery` | `value` on the search input |
| `:filter="false"` | `data-cm-command-palette-filter="false"` |
| `:auto-activate="false"` | `data-cm-command-palette-auto-activate="false"` |
| `:close-on-select="false"` | `data-cm-command-palette-close-on-select="false"` |
| `:close-on-escape="false"` | `data-cm-command-palette-close-on-escape="false"` |
| `:close-on-overlay-click="true"` | `data-cm-command-palette-close-on-overlay-click="true"` |
| `:dividers="false"` | `data-cm-command-palette-dividers="false"` |
| `maxHeight` | `--cm-command-palette-max-height` |
| `submit(query)` | `cm:command-palette-submit` with `detail.query` |

`VfCommandPalette` supports the historical `v-model` query, caller-supplied items and object
selection payload, a scoped default result renderer and item slot, and default footer keyboard
hints. Its result renderer highlights text matches without inserting HTML. The native modal is
shown in the browser's top layer; this entry does not move it to an authored Teleport target.
The component does not execute commands, implement global shortcuts or persist command history.
