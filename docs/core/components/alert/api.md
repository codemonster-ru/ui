# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `tone?` | `VfFeedbackTone` | `primary` | Visual tone variant. |
| `title?` | `string` | — | Text title shown in the component header area. |
| `icon?` | `IconName \| string` | — | Icon name or custom icon identifier. |
| `hideIcon?` | `boolean` | `false` | Hides leading icon rendering. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | alert body content |
| `icon` | `—` | `void` | custom leading icon |
| `title` | `—` | `void` | custom title markup |

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
| `IconName` | `Union of generated icon names.` |
| `VfFeedbackTone` | `'neutral' \| 'primary' \| 'success' \| 'info' \| 'warn' \| 'help' \| 'danger' \| 'contrast'` |
