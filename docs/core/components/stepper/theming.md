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
