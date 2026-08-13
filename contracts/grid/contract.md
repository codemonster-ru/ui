# Grid contract

Status: Active

Component: `Grid`

Razor tag: `cm-grid`

Grid uses auto-fitting columns, the shared minimum item inline-size, and the shared layout gap.
`element` is `div`, `section`, `ul`, or `ol` and defaults to `div`. Consumers provide list items,
section headings, and accessible names required by their chosen semantics. Root attributes and
classes reach the selected element. Grid does not expose column-count callbacks, measure the
viewport, reorder content, or add interaction.
