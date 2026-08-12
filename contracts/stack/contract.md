# Stack contract

Status: Active

Component: `Stack`

Razor tag: `cm-stack`

Stack arranges direct children vertically with the shared layout gap. `element` is one of `div`,
`section`, `ul`, or `ol` and defaults to `div`. List roots require `li` children; semantic sections
remain the consumer's responsibility. Root attributes and consumer classes reach the selected
element. The default slot is trusted composition. Stack adds no role, state, or interaction.
