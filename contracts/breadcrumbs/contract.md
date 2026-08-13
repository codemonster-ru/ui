# Breadcrumbs contract

Status: Active

Component: `Breadcrumbs`

Razor tag: `cm-breadcrumbs`

## Purpose and structure

Breadcrumbs communicates the current page's position in a hierarchy. The root is
`nav.cm-breadcrumbs` with an accessible `aria-label`, containing one ordered list. Every item is an
`li.cm-breadcrumbs__item`; separators are presentation-only and hidden from assistive technology.

Items are ordered records with required non-empty `label` and optional `href`, `current`, and
`disabled`. At most one item is explicitly current. When none is marked, the last item is current.
The current item renders as a span with `aria-current="page"`. Enabled non-current items with href
render native anchors. Disabled or non-navigable items render spans and never receive synthetic
link semantics.

## Content and routing

Labels are ordinary escaped strings. The optional separator slot replaces the visual `/` separator
for all positions and is a trusted composition boundary. Breadcrumbs consumes native href strings
and does not resolve router objects. Safe attributes target the nav root.
