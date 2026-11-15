# Dropdown contract

Status: Active

Component: `Dropdown`

## Purpose and composition

Dropdown is a button disclosure that owns one action Menu. `id` is a required stable prefix;
`label` is the required accessible trigger name. Supply `items` following the Menu item contract
or author the action content in the default slot. The root owns
`cm-dropdown` and `data-cm-controller="dropdown"`. Its native button has
`aria-haspopup="menu"`, `aria-expanded`, and a deterministic relationship to `{id}-menu`.

The menu remains in DOM and uses native `hidden` while closed, allowing server rendering with
an inline CSS placement. Both interactive adapters use the requested `bottom-start` or
`bottom-end`, flip above the trigger if needed, and shift away from the viewport edge. The
Menu keeps its own controller and keyboard contract. `variant="pills"` gives active items the
selected background, including hover and pressed states.

Vue can move the open menu to a selector or element with `teleportTo`, including `"body"`. When
that trigger sits inside a dialog, a body portal uses the dialog so the menu stays interactive.
`disableTeleport` keeps the menu inline. Vanilla keeps the attached Menu controller inside the
authored Dropdown and uses the same collision rules there.

The trusted `trigger` slot replaces visible trigger content inside the component-owned button, so
arbitrary icons and markup cannot replace its button semantics. Vue receives `{ open, disabled,
toggle }`; an icon-only trigger uses `label` through `aria-label`. Author only noninteractive
content here. The owned button handles clicks. Vanilla templates place the same markup inside the button.

The trusted default slot replaces the generated actions inside the owned menu and receives
`{ open, close }` in Vue. Use focusable native actions with `role="menuitem"` and give the
first enabled item `tabindex="0"` and the remaining items `tabindex="-1"`. Set `data-cm-menu-item`
and `data-cm-menu-value` for Vanilla runtime enhancement and portable selection events.

## State and interaction

`defaultOpen` sets the initial state when `open` is omitted. Vue maps `open` to `v-model:open`; Vanilla HTML renders server state and
the shared runtime manages the current client disclosure state. Clicking the trigger toggles.
ArrowDown, Enter, or Space opens and focuses the first enabled item; ArrowUp opens and focuses the
last. Escape and enabled item selection close and return focus to the trigger. Outside clicks close
without moving focus. Set `closeOnSelect=false` to report selection and leave the menu open, or set
`data-cm-dropdown-close-on-select="false"` on the Vanilla root. Disabled Dropdowns use the native
disabled attribute and stay closed.

Dropdown reports open changes and selected item ids. A menu action that consumes Escape does
not also dismiss its containing modal. Dropdown does not trap focus or own modal semantics.
