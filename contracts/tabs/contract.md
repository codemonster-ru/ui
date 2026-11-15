# Tabs contract

Status: Active

Component: `Tabs`

## Purpose and item model

Tabs switches among related content panels. Vue generates a stable DOM prefix when `id` is
omitted. `items` is a
non-empty ordered collection of records with unique non-empty string `value`, non-empty `label`, optional
escaped string `content`, optional `disabled`, and optional `tabId` and `panelId`. At least one
item is enabled.

`value` is the active enabled item value. `defaultValue` selects the initial uncontrolled value.
When both are omitted or invalid, the first enabled item is active.
Vue maps it to `modelValue`; Vanilla HTML renders the current server state. User activation reports the
next value but adapters do not invent application content state.

## Structure and relationships

The root owns `cm-tabs`, `data-cm-controller="tabs"`, and `data-cm-tabs-value`. It contains a
horizontal `role="tablist"` and one native button per item. Owned panels use `role="tabpanel"` and
only the active panel is visible. The default IDs are `{id}-tab-{value}` and
`{id}-panel-{value}`. Vue encodes other value spellings to preserve valid IDs and exposes the
original value in `data-cm-tab-value`. Item-level IDs replace the generated IDs, which must be
unique on a page.
A tab with neither owned content nor a `panelId` omits `aria-controls`. Disabled tabs use the native
disabled attribute.

To render panels outside the component, set `panelId` and use it as the ID of an external
`role="tabpanel"`. Label it with the corresponding tab ID. Vue callers own the visibility of their
external panels. The Vanilla controller uses `data-cm-tab-value` on buttons with custom IDs or without
a panel to resolve the value independently of the DOM ID. It synchronizes any associated panel in
the same document.

Each item accepts trusted `tab{UpperCamelValue}` and `panel{UpperCamelValue}` platform content, such
as `tabAccountDetails`. Vue item slots receive `{ item, active }`. Existing item panels remain mounted
when their tab is inactive. The shared `tab` slot is a fallback for an item without its own tab slot
and receives `{ item, isActive, index }`. The shared `panel` slot provides a fallback for an item
without an item panel slot or text content. It receives `{ activeValue }` and mounts its content only
while that item is selected. Vanilla HTML authors the corresponding markup directly.

## Keyboard behavior

Tabs use automatic activation. Click selects an enabled tab. Left/Right arrows (direction-aware),
Home, and End move focus and selection among enabled tabs with wrapping. Disabled tabs are skipped.
Each active tab has `tabindex="0"`; other tabs have `-1`. The behavior scenarios are normative for
Vue and shared progressive enhancement. Up and Down continue to scroll the document when the
focus is on a horizontal tab.

By default, Vue adds scroll buttons when the horizontal list overflows. Set `scrollControls` to
`true` to include them, initially hidden, in server markup, or to `false` to use native scrolling.
Vanilla authors both hidden buttons as siblings of the list, with `data-cm-tabs-scroll="start"`
and `data-cm-tabs-scroll="end"`. Give the list a unique ID and reference it from the buttons'
`aria-controls`. The [overflow case](cases/overflow.html) shows the complete HTML.

Buttons scroll one logical step without selecting a tab. Focus stays usable when a button
disappears at an edge, and reduced-motion preferences select an immediate scroll. Without
enhancement, touch, horizontal wheel, and native focus scrolling remain available.
