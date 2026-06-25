# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `label?` | `string` | `'Loading'` | Accessible label for the progressbar. |
| `size?` | `string \| number` | `—` | Spinner size. Numeric values are interpreted as pixels. |
| `strokeWidth?` | `number` | `4` | SVG stroke width for track and value circles. |
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
