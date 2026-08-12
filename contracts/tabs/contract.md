# Tabs contract

Status: Active

Component: `Tabs`

Razor tag: `cm-tabs`

## Purpose and item model

Tabs switches among related content panels. `id` is a required stable DOM prefix. `items` is a
non-empty ordered collection of records with unique kebab-case `value`, non-empty `label`, escaped
string `content`, and optional `disabled`. At least one item is enabled.

`value` is the active enabled item value. When omitted or invalid, the first enabled item is active.
Vue maps it to `modelValue`; Razor renders the current server state. User activation reports the
next value but adapters do not invent application content state.

## Structure and relationships

The root owns `cm-tabs`, `data-cm-controller="tabs"`, and `data-cm-tabs-value`. It contains a
horizontal `role="tablist"`, one native button per item, and one `role="tabpanel"` per item. Tab and
panel ids are `{id}-tab-{value}` and `{id}-panel-{value}`. Only the active panel is visible. Disabled
tabs use the native disabled attribute and are never active.

## Keyboard behavior

Tabs use automatic activation. Click selects an enabled tab. Left/Right arrows (direction-aware),
Home, and End move focus and selection among enabled tabs with wrapping. Disabled tabs are skipped.
Each active tab has `tabindex="0"`; other tabs have `-1`. The behavior scenarios are normative for
Vue and shared progressive enhancement.
