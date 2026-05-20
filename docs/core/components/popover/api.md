# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open?` | `boolean` | — | Controlled open state. |
| `defaultOpen?` | `boolean` | `false` | Initial uncontrolled open state. |
| `placement?` | `VfDropdownPlacement` | `bottom-start` | Controls floating panel placement relative to trigger. |
| `closeOnOutsideClick?` | `boolean` | `true` | Closes popup when pointer interaction happens outside content. |
| `closeOnEscape?` | `boolean` | `true` | Closes component when `Escape` key is pressed. |
| `teleportTo?` | `string \| HTMLElement \| null \| false` | — | Teleport target selector/element; `null`/`false` disables teleport resolution. |
| `disableTeleport?` | `boolean` | `false` | Forces in-place rendering without teleport. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:open` | `[value: boolean]` | `void` | Emitted with next open state. |
| `openChange` | `[value: boolean]` | `void` | Emitted when open state changes. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `trigger` | `[scope: { open: boolean; toggle: () => void }]` | `void` | trigger content (`{ open, toggle }`) |
| `default` | `[scope: { open: boolean; close: () => void }]` | `void` | popover content (`{ open, close }`) |

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
| `VfDropdownPlacement` | `'bottom-start' \| 'bottom-end'` |
