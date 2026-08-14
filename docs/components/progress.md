# Progress

`CmProgressBar` and `CmProgressSpinner` expose the same static DOM and accessibility contract in Vue and Razor. They are stateless presentation primitives: the application owns progress state, timing, async work, and status announcements outside the component.

## Progress bar

Use `CmProgressBar` for a bounded task with a known value, or set `indeterminate` while the total is unknown. `label` is required and must describe the task rather than repeat its numeric value.

```html
<CmProgressBar label="Uploading report" :value="42" :max="100" show-value />
<CmProgressBar label="Synchronizing account" indeterminate tone="warning" />
```

Razor uses the same semantic props with kebab-case markup names:

```html
<x-cm-progress-bar label="Uploading report" value="42" max="100" show-value />
<x-cm-progress-bar label="Synchronizing account" indeterminate tone="warning" />
```

The component clamps finite `value` input to `0..max`. An invalid or non-positive `max` falls back to `100`. Determinate bars render `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`; indeterminate bars deliberately omit all three. `showValue` renders a rounded percentage only for determinate progress.

Supported tones are `neutral`, `primary`, `success`, `info`, `warning`, `help`, `danger`, and `contrast`. Height, stripes, and consumer-controlled animation are intentionally outside the contract.

## Progress spinner

Use `CmProgressSpinner` when the operation has no meaningful completion percentage. The SVG geometry is internal and cannot be replaced by consumer markup.

```html
<CmProgressSpinner label="Loading search results" />
<CmProgressSpinner label="Deleting record" size="lg" tone="danger" />
```

```html
<x-cm-progress-spinner label="Loading search results" />
<x-cm-progress-spinner label="Deleting record" size="lg" tone="danger" />
```

Sizes are limited to `sm`, `md`, and `lg`; tones match `CmProgressBar`. The required `label` gives the `progressbar` an accessible name. The spinner has no numeric ARIA state because it always represents indeterminate progress. Its CSS stops motion when `prefers-reduced-motion: reduce` is active, and neither adapter requires a browser runtime.
