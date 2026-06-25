# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value?` | `number` | `0` | Current progress value for determinate progress. Values are clamped between `0` and `max`. |
| `max?` | `number` | `100` | Maximum determinate progress value. Non-positive or non-finite values resolve to `100`. |
| `indeterminate?` | `boolean` | `false` | Renders an animated progress state without current value semantics. |
| `label?` | `string` | `'Progress'` | Accessible label for the progressbar. |
| `height?` | `string \| number` | `—` | Track height. Numeric values are interpreted as pixels. |
| `showValue?` | `boolean` | `false` | Shows a rounded percentage label for determinate progress. |
| `tone?` | `VfFeedbackTone` | `'primary'` | Visual feedback tone. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No slots. |

## Events

Native DOM events exposed by the component.

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `—` | `—` | `—` | No dedicated interfaces in this component contract. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `VfFeedbackTone` | `'neutral' \| 'primary' \| 'success' \| 'info' \| 'warn' \| 'help' \| 'danger' \| 'contrast'` |
