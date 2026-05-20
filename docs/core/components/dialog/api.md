# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open?` | `boolean` | — | Controlled open state. |
| `defaultOpen?` | `boolean` | `false` | Initial uncontrolled open state. |
| `title?` | `string` | — | Text title shown in the component header area. |
| `description?` | `string` | — | Supporting helper text. |
| `size?` | `VfDialogSize` | `md` | Size token for spacing and dimensions. |
| `dividers?` | `boolean` | `false` | Shows separators between header/body/footer regions. |
| `closeOnOverlayClick?` | `boolean` | `true` | Closes component when overlay/backdrop is clicked. |
| `closeOnEscape?` | `boolean` | `true` | Closes component when `Escape` key is pressed. |
| `closable?` | `boolean` | `true` | Shows close control and allows explicit dismiss action. |
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
| `default` | `[scope: { close: () => void }]` | `void` | dialog body (`{ close }` slot prop available) |
| `header` | `—` | `void` | Slot for `header` content. |
| `description` | `—` | `void` | Slot for `description` content. |
| `actions` | `[scope: { close: () => void }]` | `void` | (`{ close }` slot prop available) |
| `footer` | `[scope: { close: () => void }]` | `void` | (`{ close }` slot prop available) |

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
| `VfDialogSize` | `'sm' \| 'md' \| 'lg'` |
