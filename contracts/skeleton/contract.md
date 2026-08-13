# Skeleton contract

Status: Active

Skeleton renders one decorative `div.cm-skeleton[aria-hidden=true]`. Animated output adds
`cm-skeleton--animated`; radius always adds `cm-skeleton--radius-{radius}`. `minHeight` accepts a
finite non-negative number, serialized in pixels, or a non-negative CSS length using `px`, `rem`,
`em`, `%`, `vh`, `vw`, `dvh`, `dvw`, `ch`, or `ex`. Adapters reject other values and own the
resulting `min-height` style.

The placeholder never exposes loading content to assistive technology. The surrounding application
owns any busy or live-region semantics. Shared CSS disables shimmer when reduced motion is
requested.
