# Inline contract

Status: Active

Component: `Inline`

Razor tag: `cm-inline`

Inline arranges direct children on the inline axis, aligns them centrally on the cross axis, and
uses the shared layout gap. It wraps by default; `wrap=false` adds `cm-inline--nowrap`. `element` is
`div`, `nav`, or `ul` and defaults to `div`. Consumers provide list semantics and accessible names
where applicable. Root attributes and classes are forwarded. Inline adds no behavior or ARIA role.
