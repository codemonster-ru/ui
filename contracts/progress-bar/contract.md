# ProgressBar contract

Status: Active

ProgressBar renders `div.cm-progress-bar[role=progressbar]` with a required non-empty accessible
`label`. Determinate progress exposes `aria-valuemin="0"`, a positive finite `aria-valuemax`, and a
finite `aria-valuenow` clamped into that range. Invalid `max` values normalize to `100`; invalid
`value` values normalize to `0`. Its owned `span.cm-progress-bar__value` receives the bounded inline
percentage, and `showValue` adds the rounded percentage in `span.cm-progress-bar__label`.

Indeterminate progress adds `cm-progress-bar--indeterminate`, omits all numeric ARIA values and the
visible percentage, and relies on the same accessible label. The default `primary` tone has no
modifier; other finite semantic tones add `cm-progress-bar--{tone}`. Consumer root attributes and
classes are preserved, but cannot override the owned progress role or ARIA value relationships.
Progress is display-only, has no events, and requires no runtime.
