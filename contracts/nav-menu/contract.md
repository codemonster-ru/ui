# Navigation menu

Use a navigation landmark with a list. Branch controls are native buttons with `aria-expanded`.
Use links for destinations and mark the current page with `aria-current="page"`. A collapsed
branch's descendants stay in the document and are outside the keyboard tab order. Group children
remain available without a disclosure button.

The Vue adapter passes an enabled leaf's `to` string or object to the registered `RouterLink` or
the supplied `linkComponent`. Vanilla renders the resolved `href` directly. Disabled routes
omit their destination and have `aria-disabled="true"` and `tabindex="-1"`. A link with
`target="_blank"` defaults to `rel="noopener noreferrer"`.
Add the decorative external-link glyph to enabled links that open a new tab. Decorative leading
icons go inside the item content before the label. The native Vue adapter accepts icon geometry
as `leadingIcon`; the historical Vue adapter accepts a catalog name.

In Vue, use `v-model` or the existing `v-model:value` to control selection.
`defaultValue` supplies the initial selection when both bindings are omitted. Supply the
current destination through `aria-current="page"` when rendering Vanilla markup.

Use `compact` with the sidebar variant to show an icon rail for top-level items with icons.
The menu keeps their accessible names and its current disclosure state. `compact=false` forces
the expanded presentation. Vanilla can apply `cm-nav-menu--sidebar-compact` or
`cm-nav-menu--sidebar-expanded` to the sidebar root.

The canonical [sidebar](./cases/default.html) and [pills](./cases/pills.html) are the same tree.
The root pills class changes appearance and keeps labels visible at narrow widths. It does not
change the disclosure controls or link semantics.
