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
| `.vf-field__required-mark` | Visual required marker rendered next to the label. |
| `.vf-field__description` | Helper text below the control. |
| `.vf-field__error` | Error text below the control. |

## Design Tokens

Available design tokens and corresponding CSS variables.

| Token | CSS Variable | Description |
| --- | --- | --- |
| Field label typography | `--vf-text-label-*` | Label font size, weight, and line height. |
| Field helper typography | `--vf-text-caption-*` | Description and error text typography. |
| Field spacing | `--vf-surface-gap-compact` | Vertical gap between field parts. |
| Required marker spacing | `--vf-surface-gap-compact` | Inline gap between label text and the required marker. |
| Helper text color | `--vf-color-muted` | Neutral helper text tone. |
| Error text color | `--vf-color-danger` | Error text tone. |
| Floating label base position | `--vf-field-floating-label-offset-block-default`, `--vf-field-floating-label-translate-y-default` | Default resting vertical position for floating labels. |
| Floating label resting offsets | `--vf-field-floating-label-resting-offset-block-sm-default`, `--vf-field-floating-label-resting-offset-block-md-default`, `--vf-field-floating-label-resting-offset-block-lg-default` | Resting offsets by control size. |
| Floating label active position | `--vf-field-floating-label-active-offset-block-default`, `--vf-field-floating-label-active-translate-y-default` | Default active position used when the field is focused or filled. |
| Floating `in` variant | `--vf-field-floating-in-*` | Padding and active label defaults for the `in` floating variant. |
| Floating `on` variant | `--vf-field-floating-on-*` | Padding, label offset, and active label inset defaults for the `on` floating variant. |
| Floating `over` variant | `--vf-field-floating-over-*` | Padding, label offset, and label background defaults for the `over` floating variant. |
| Floating control offsets | `--vf-field-floating-control-offset-inline-*`, `--vf-field-floating-input-offset-inline-*` | Inline label offsets for text-like controls and input wrappers. |
| Floating textarea offsets | `--vf-field-floating-textarea-*` | Textarea-specific resting offsets and label translation. |
