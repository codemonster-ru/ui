# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `tone?` | `VfFeedbackTone` | `primary` | Visual tone variant. |
| `title?` | `string` | — | Text title shown in the component header area. |
| `icon?` | `IconName \| string` | — | Icon name or custom icon identifier. |
| `hideIcon?` | `boolean` | `false` | Hides leading icon rendering. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | alert body content |
| `icon` | `—` | `void` | custom leading icon |
| `title` | `—` | `void` | custom title markup |

## Events

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `—` | `—` | `—` | No dedicated interfaces in this component contract. |

## Types

| Name | Values |
| --- | --- |
| `IconName` | `Union of generated icon names.` |
| `VfFeedbackTone` | `'neutral' \| 'primary' \| 'success' \| 'info' \| 'warn' \| 'help' \| 'danger' \| 'contrast'` |
