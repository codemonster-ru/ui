# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

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

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:open` | `[value: boolean]` | `void` | Emitted with next open state. |
| `openChange` | `[value: boolean]` | `void` | Emitted when open state changes. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `trigger` | `[scope: { open: boolean; toggle: () => void }]` | `void` | trigger node (`{ open, toggle }`) |
| `default` | `[scope: { close: () => void; open: boolean }]` | `void` | menu body (`{ close, open }`) |

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
| `VfDropdownPlacement` | `'bottom-start' \| 'bottom-end'` |
