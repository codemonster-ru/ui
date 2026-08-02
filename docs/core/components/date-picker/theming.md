# Theming

`VfDatePicker` uses the existing VueForge control, field, selectable, surface, and overlay token
contracts. It intentionally introduces no Date Picker-specific public theme fields.

## Shared token groups

| Token group       | Representative CSS variables                                                                           | Purpose                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Select surface    | `--vf-select-background`, `--vf-select-border-color`, `--vf-select-color`                              | Trigger surface, border, and text.                    |
| Select states     | `--vf-select-hover-border-color`, `--vf-select-focus-border-color`, `--vf-select-invalid-border-color` | Hover, focus, and invalid trigger states.             |
| Selectable states | `--vf-selectable-color`, `--vf-selectable-hover-background`, `--vf-selectable-active-background`       | Day, month, and year interaction states.              |
| Field geometry    | `--vf-field-*`                                                                                         | Sizes, icon placement, clearing, and floating labels. |
| Control geometry  | `--vf-control-height-*`, `--vf-control-font-size-*`, `--vf-radius-control`                             | Shared control sizing and radius.                     |
| Floating surfaces | `--vf-surface-padding-compact`, `--vf-surface-gap-compact`, `--vf-overlay-viewport-padding`            | Calendar spacing and viewport positioning.            |
| Focus and motion  | `--vf-color-focus-ring`, `--vf-focus-ring-width`, `--vf-motion-duration-fast`                          | Keyboard focus and open/close transitions.            |

The time selectors reuse `VfSelect`; navigation and calendar cells reuse `VfIconButton` and
`VfButton`. Theme those primitives to keep the combined control consistent with the rest of the
application.
