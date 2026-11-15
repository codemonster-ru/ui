# ProgressSpinner contract

Status: Active

ProgressSpinner renders `span.cm-progress-spinner[role=progressbar]` with a required non-empty
accessible `label`. A finite `sm`, `md`, or `lg` size adds `cm-progress-spinner--{size}`. The default
`primary` tone has no modifier; other finite semantic tones add `cm-progress-spinner--{tone}`.

The owned SVG and its track and value circles are decorative, `aria-hidden`, and not focusable.
Both circles have the same `strokeWidth` in SVG units. It defaults to `4` and accepts finite
non-negative numbers. The root intentionally omits `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`
because Spinner is always indeterminate.
Reduced-motion styles remove both SVG animations while retaining a visible static indicator.
Consumer root attributes and classes are preserved, but cannot override the owned progress role.
ProgressSpinner has no events and requires no runtime.
