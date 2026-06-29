# Theming

Component styling surface: available classes and design tokens.

## CSS Classes

Documented CSS classes and their intended usage.

| Class                             | Description                      |
| --------------------------------- | -------------------------------- |
| `.vf-progress-bar`                | Root progress track.             |
| `.vf-progress-bar__value`         | Filled progress indicator.       |
| `.vf-progress-bar--indeterminate` | Animated indeterminate state.    |
| `.vf-progress-bar--striped`       | Striped determinate value style. |
| `.vf-progress-bar--animated`      | Animated striped value style.    |
| `.vf-progress-bar--neutral`       | Neutral tone modifier.           |
| `.vf-progress-bar--success`       | Success tone modifier.           |
| `.vf-progress-bar--info`          | Info tone modifier.              |
| `.vf-progress-bar--warn`          | Warning tone modifier.           |
| `.vf-progress-bar--help`          | Help tone modifier.              |
| `.vf-progress-bar--danger`        | Danger tone modifier.            |
| `.vf-progress-bar--contrast`      | Contrast tone modifier.          |

## Design Tokens

Available design tokens and corresponding CSS variables.

| Token                                   | CSS Variable                                   | Description                                              |
| --------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Progress bar height                     | `--vf-progress-bar-height`                     | Track height.                                            |
| Progress bar radius                     | `--vf-progress-bar-radius`                     | Track and value radius.                                  |
| Progress bar track background           | `--vf-progress-bar-track-background`           | Track background.                                        |
| Progress bar label font size            | `--vf-progress-bar-label-font-size`            | Percentage label size.                                   |
| Progress bar value color                | `--vf-progress-bar-value-color`                | Filled value color.                                      |
| Progress bar label color                | `--vf-progress-bar-label-color`                | Percentage label color.                                  |
| Progress bar transition duration        | `--vf-progress-bar-transition-duration`        | Determinate value transition duration.                   |
| Progress bar transition easing          | `--vf-progress-bar-transition-easing`          | Determinate value transition easing.                     |
| Progress bar indeterminate duration     | `--vf-progress-bar-indeterminate-duration`     | Indeterminate animation duration.                        |
| Progress bar indeterminate long easing  | `--vf-progress-bar-indeterminate-long-easing`  | Long indeterminate segment easing.                       |
| Progress bar indeterminate short easing | `--vf-progress-bar-indeterminate-short-easing` | Short indeterminate segment easing.                      |
| Progress bar indeterminate short delay  | `--vf-progress-bar-indeterminate-short-delay`  | Short indeterminate segment delay.                       |
| Progress bar label padding              | `--vf-progress-bar-label-padding-inline`       | Percentage label inline padding.                         |
| Progress bar striped angle              | `--vf-progress-bar-striped-angle`              | Striped pattern angle.                                   |
| Progress bar striped segment size       | `--vf-progress-bar-striped-segment-size`       | Width of each striped pattern segment.                   |
| Progress bar striped size               | `--vf-progress-bar-striped-size`               | Striped pattern tile size and animation travel distance. |
| Progress bar striped tint ratio         | `--vf-progress-bar-striped-tint-ratio`         | Value-color ratio used for alternate stripe tinting.     |
| Progress bar striped animation duration | `--vf-progress-bar-striped-animation-duration` | Animated striped pattern duration.                       |
