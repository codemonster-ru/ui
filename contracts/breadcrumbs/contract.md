# Breadcrumbs contract

Status: Active

Component: `Breadcrumbs`

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

Labels are ordinary escaped strings. The optional `separator` slot receives `{ item, index }` for
each item before the last. It replaces the visual separator. `CmBreadcrumbs` uses `/` by default.
`VfBreadcrumbs` from `@codemonster-ru/ui-vue/historical` uses a decorative right chevron.

Vanilla HTML uses native anchors for navigable items. Vue also accepts `to` and resolves it
through the registered `RouterLink` or the supplied `component`. Safe attributes target the nav
root.
