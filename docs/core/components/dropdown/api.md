# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open?` | `boolean` | — | Controlled open state. |
| `defaultOpen?` | `boolean` | `false` | Initial uncontrolled open state. |
| `placement?` | `VfDropdownPlacement` | `bottom-start` | Controls floating panel placement relative to trigger. |
| `closeOnSelect?` | `boolean` | `true` | Closes popup after selecting an item. |
| `variant?` | `'default' \| 'pills'` | `default` | Visual variant for component appearance. |
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
| `trigger` | `[scope: { open: boolean; toggle: () => void }]` | `void` | trigger node (`{ open, toggle }`) |
| `default` | `[scope: { close: () => void; open: boolean }]` | `void` | menu body (`{ close, open }`) |

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
