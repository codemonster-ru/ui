# Avatar contract

Status: Active

Avatar renders `span.cm-avatar` with `cm-avatar--{size}` except at the default `md` size and
`cm-avatar--circle` for its circular shape. A non-empty image takes precedence and renders
`img.cm-avatar__image` with the supplied alternative text. Otherwise a non-empty label renders
`span.cm-avatar__label`; the trusted default slot is the final fallback.

Avatar is not interactive. Decorative images use the default empty alt text. When the avatar itself
conveys an identity not stated nearby, consumers provide meaningful image alt text or an accessible
root label.
