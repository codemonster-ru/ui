# Theming

Component styling surface: available classes and design tokens.

## CSS Classes

Documented CSS classes and their intended usage.

| Class | Description |
| --- | --- |
| `.vf-progress-spinner` | Root progress spinner. |
| `.vf-progress-spinner__svg` | Animated SVG wrapper. |
| `.vf-progress-spinner__track` | Static circular track. |
| `.vf-progress-spinner__value` | Animated circular value stroke. |
| `.vf-progress-spinner--neutral` | Neutral tone modifier. |
| `.vf-progress-spinner--success` | Success tone modifier. |
| `.vf-progress-spinner--info` | Info tone modifier. |
| `.vf-progress-spinner--warn` | Warning tone modifier. |
| `.vf-progress-spinner--help` | Help tone modifier. |
| `.vf-progress-spinner--danger` | Danger tone modifier. |
| `.vf-progress-spinner--contrast` | Contrast tone modifier. |

## Design Tokens

Available design tokens and corresponding CSS variables.

| Token | CSS Variable | Description |
| --- | --- | --- |
| Progress spinner size | `--vf-progress-spinner-size` | Spinner size. |
| Progress spinner track color | `--vf-progress-spinner-track-color` | Track color. |
| Progress spinner value color | `--vf-progress-spinner-value-color` | Animated stroke color. |
| Progress spinner duration | `--vf-progress-spinner-duration` | Animation duration. |
| Progress spinner rotate easing | `--vf-progress-spinner-rotate-easing` | Spinner rotation easing. |
| Progress spinner dash easing | `--vf-progress-spinner-dash-easing` | Spinner dash easing. |
| Inline spinner track color | `--vf-progress-spinner-inline-track-color` | Track color used when the spinner is embedded in controls such as `VfButton`. |
| Inline spinner value color | `--vf-progress-spinner-inline-value-color` | Value color used when the spinner is embedded in controls such as `VfButton`. |
