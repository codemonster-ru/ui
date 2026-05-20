# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `text?` | `string` | — | Tooltip text used when default slot is trigger only. |
| `placement?` | `VfTooltipPlacement` | `top` | Controls floating panel placement relative to trigger. |
| `openDelay?` | `number` | `80` | Delay in milliseconds before tooltip opens. |
| `teleportTo?` | `string \| HTMLElement \| null \| false` | — | Teleport target selector/element; `null`/`false` disables teleport resolution. |
| `disableTeleport?` | `boolean` | `false` | Forces in-place rendering without teleport. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | trigger element |
| `content` | `—` | `void` | custom tooltip body |

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
| `VfTooltipPlacement` | `'top' \| 'bottom'` |
