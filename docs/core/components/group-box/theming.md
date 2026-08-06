# Theming

Component styling surface: available classes and design tokens.

## CSS Classes

| Class                        | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| `.vf-group-box`              | Root outlined group.                              |
| `.vf-group-box--titled`      | Group with a legend and adjusted top spacing.     |
| `.vf-group-box--collapsible` | Group with disclosure behavior enabled.           |
| `.vf-group-box--collapsed`   | Collapsed group state.                            |
| `.vf-group-box__legend`      | Title container placed on the border.             |
| `.vf-group-box__trigger`     | Disclosure button inside the legend.              |
| `.vf-group-box__title`       | Legend text.                                      |
| `.vf-group-box__icon`        | Default or custom disclosure indicator container. |
| `.vf-group-box__content`     | Expanded content container.                       |

## Design Tokens

| Token         | CSS Variable                  | Description                  |
| ------------- | ----------------------------- | ---------------------------- |
| Border color  | `--vf-group-box-border-color` | Outline color.               |
| Background    | `--vf-group-box-background`   | Group and legend background. |
| Content color | `--vf-group-box-color`        | Default content color.       |
| Title color   | `--vf-group-box-title-color`  | Legend text and icon color.  |

The collapsible trigger uses the `VfButton` medium ghost appearance and its button design tokens.
