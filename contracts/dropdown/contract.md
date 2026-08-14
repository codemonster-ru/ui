# Dropdown contract

Status: Active

Component: `Dropdown`

Razor tag: `cm-dropdown`

## Purpose and composition

Dropdown is a button disclosure that owns one action Menu. `id` is a required stable prefix;
`label` is the required accessible trigger name; `items` follows the Menu item contract. The root owns
`cm-dropdown` and `data-cm-controller="dropdown"`. Its native button has
`aria-haspopup="menu"`, `aria-expanded`, and a deterministic relationship to `{id}-menu`.

The menu remains in DOM and uses native `hidden` while closed, allowing server rendering and
progressive enhancement without a positioning dependency. `placement` is limited to
`bottom-start` and `bottom-end` and controls a CSS modifier. The Menu keeps its own controller and
keyboard contract.

The trusted `trigger` slot replaces visible trigger content inside the component-owned button, so
arbitrary icons and markup cannot replace its button semantics. Vue receives `{ open, disabled,
toggle }`; an icon-only trigger still uses `label` through `aria-label`, while Razor receives
`RenderedHtml`. Dropdown keeps its Menu collection and menuitem semantics component-owned.

## State and interaction

`open` is the semantic current state. Vue maps it to `v-model:open`; Razor renders server state and
the shared runtime manages the current client disclosure state. Clicking the trigger toggles.
ArrowDown, Enter, or Space opens and focuses the first enabled item; ArrowUp opens and focuses the
last. Escape, outside pointer activation, or enabled item selection closes and restores trigger
focus. Disabled Dropdowns never open and use the native disabled attribute.

Dropdown reports open changes and selected item ids. It does not teleport, calculate floating
coordinates, trap focus, or own modal semantics.
