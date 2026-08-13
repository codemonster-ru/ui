# Link contract

Status: Active

Component: `Link`

Razor tag: `cm-link`

## Purpose and native element

Link renders one native `<a>` for navigation. `href` is required and non-empty. The anchor owns
`cm-link`, optional finite presentation modifiers, and no wrapper. Safe native attributes and
listeners are forwarded to it, including `target`, `rel`, `download`, `hreflang`, `referrerpolicy`,
and ARIA attributes. Consumer classes merge after contract classes.

The default slot is the accessible link content. Link does not accept router objects or resolve a
framework router component; applications bind router-generated href strings to the native contract.

## Security and interaction

When `target="_blank"` is present and `rel` is absent, adapters render
`rel="noopener noreferrer"`. An explicit rel is preserved. Link does not implement disabled state,
synthetic keyboard behavior, or click suppression. Use a button when an action cannot navigate.
