# Theming

Component styling surface: available classes and design tokens.

## CSS Classes

Documented CSS classes and their intended usage.

| Class | Description |
| --- | --- |
| `.vf-field` | Root field wrapper with vertical spacing. |
| `.vf-field--floating` | Floating label layout active for supported text-like controls. |
| `.vf-field__label` | Visible field label. |
| `.vf-field__label--floating` | Floating label rendered inside the control area. |
| `.vf-field__description` | Helper text below the control. |
| `.vf-field__error` | Error text below the control. |

## Design Tokens

Available design tokens and corresponding CSS variables.

| Token | CSS Variable | Description |
| --- | --- | --- |
| Field label typography | `--vf-text-label-*` | Label font size, weight, and line height. |
| Field helper typography | `--vf-text-caption-*` | Description and error text typography. |
| Field spacing | `--vf-surface-gap-tight` | Vertical gap between field parts. |
| Helper text color | `--vf-color-muted` | Neutral helper text tone. |
| Error text color | `--vf-color-danger` | Error text tone. |
