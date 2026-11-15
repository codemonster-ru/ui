# Progress

`CmProgressBar` and `CmProgressSpinner` expose the same static DOM and accessibility contract in Vue and Vanilla HTML. They are stateless presentation primitives: the application owns progress state, timing, async work, and status announcements outside the component.

## Progress bar

Use `CmProgressBar` (also `VfProgressBar`) for a bounded task with a known value, or set `indeterminate` while the total is unknown. Supply a task-specific `label` when the default name, “Progress,” would be ambiguous.

```html
<CmProgressBar label="Uploading report" :value="42" :max="100" show-value />
<CmProgressBar label="Synchronizing account" indeterminate tone="warning" />
<CmProgressBar label="Installing modules" :value="64" :height="16" striped animated show-value />
```

Vanilla markup: [progress-bar HTML](../../contracts/progress-bar/cases/determinate.html).

The [striped HTML case](../../contracts/progress-bar/cases/striped.html) uses
`--cm-progress-bar-height`, `cm-progress-bar--striped`, and `cm-progress-bar--animated`.
Animation applies only to the striped style. Reduced motion stops the stripes and keeps an
indeterminate bar visible with a stationary fill.

The component clamps finite `value` input to `0..max`. An invalid or non-positive `max` falls back to `100`. Determinate bars render `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`; indeterminate bars deliberately omit all three. `showValue` renders a rounded percentage only for determinate progress.

Supported tones are `neutral`, `primary`, `success`, `info`, `warning`, `help`, `danger`, and `contrast`. Height, stripes, and consumer-controlled animation are intentionally outside the contract.

## Progress spinner

Use `CmProgressSpinner` when the operation has no meaningful completion percentage. The SVG geometry is internal and cannot be replaced by consumer markup.

```html
<CmProgressSpinner label="Loading search results" />
<CmProgressSpinner label="Deleting record" size="lg" tone="danger" />
```

Vanilla markup: [progress-spinner HTML](../../contracts/progress-spinner/cases/default.html).

Sizes are limited to `sm`, `md`, and `lg`; tones match `CmProgressBar`. The required `label` gives the `progressbar` an accessible name. The spinner has no numeric ARIA state because it always represents indeterminate progress. Its CSS stops motion when `prefers-reduced-motion: reduce` is active, and neither adapter requires a browser runtime.
