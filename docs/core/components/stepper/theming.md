# Theming

Component styling surface: available classes and design tokens.

## CSS Classes

Documented CSS classes and their intended usage.

| Class | Description |
| --- | --- |
| `vf-stepper` | Root stepper element. |
| `vf-stepper--horizontal` | Horizontal orientation modifier. |
| `vf-stepper--vertical` | Vertical orientation modifier. |
| `vf-stepper--content-above` | Horizontal layout with content above the marker. |
| `vf-stepper--content-below` | Horizontal layout with content below the marker. |
| `vf-stepper--content-start` | Vertical layout with content before the marker column. |
| `vf-stepper--content-end` | Vertical layout with content after the marker column. |
| `vf-stepper__item--complete` | Completed step state. |
| `vf-stepper__item--current` | Current step state. |
| `vf-stepper__item--upcoming` | Upcoming step state. |
| `vf-stepper__item--disabled` | Disabled step state. |

## Design Tokens

Available design tokens and corresponding CSS variables.

| Token | CSS Variable | Description |
| --- | --- | --- |
| Stepper marker size | `--vf-stepper-marker-size` | Marker diameter used by the component layout. |
| Stepper rail size | `--vf-stepper-rail-size` | Line thickness used for connector and progress rails. |
| Stepper rails | `--vf-stepper-rail-color`, `--vf-stepper-progress-color` | Remaining and completed rail colors. |
| Stepper base marker | `--vf-stepper-marker-background`, `--vf-stepper-marker-border-color`, `--vf-stepper-marker-color` | Default marker palette. |
| Stepper base content | `--vf-stepper-trigger-color`, `--vf-stepper-label-color`, `--vf-stepper-description-color` | Default trigger and content colors. |
| Completed step | `--vf-stepper-complete-marker-*`, `--vf-stepper-complete-label-color`, `--vf-stepper-complete-description-color` | Completed marker and content palette. |
| Current step | `--vf-stepper-current-marker-*`, `--vf-stepper-current-label-color`, `--vf-stepper-current-description-color` | Current marker and content palette. |
| Upcoming step | `--vf-stepper-upcoming-label-color`, `--vf-stepper-upcoming-description-color` | Upcoming content palette. |
| Disabled step | `--vf-stepper-disabled-color` | Shared disabled foreground color. |
| Focus ring | `--vf-stepper-focus-ring-color` | Keyboard focus ring color around the marker. |
