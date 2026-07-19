# Theming

Component styling surface: available classes and design tokens.

## CSS Classes

Documented CSS classes and their intended usage.

| Class | Description |
| --- | --- |
| `.vf-alert` | Root feedback container. |
| `.vf-alert__icon` | Leading decorative status icon. |
| `.vf-alert__content` | Text content wrapper. |
| `.vf-alert__title` | Alert title element. |
| `.vf-alert__body` | Alert body content. |

## Design Tokens

Available design tokens and corresponding CSS variables.

| Token | CSS Variable | Description |
| --- | --- | --- |
| Alert icon offset | `--vf-alert-icon-offset-y` | Vertical offset that aligns the leading icon with the title first line. |
| Alert content gap | `--vf-alert-content-gap` | Vertical gap between title and body content. |
| Alert title font size | `--vf-alert-title-font-size` | Title typography size. |
| Alert body color | `--vf-alert-body-color` | Muted body text color. |
| Alert variant surfaces | `--vf-alert-*-background`, `--vf-alert-*-border-color` | Background and border colors for semantic variants. |
