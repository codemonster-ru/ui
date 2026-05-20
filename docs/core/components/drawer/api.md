# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open?` | `boolean` | — | Controlled open state. |
| `defaultOpen?` | `boolean` | `false` | Initial uncontrolled open state. |
| `title?` | `string` | — | Text title shown in the component header area. |
| `size?` | `VfDrawerSize` | `md` | Size token for spacing and dimensions. |
| `placement?` | `VfDrawerPlacement` | `right` | Controls floating panel placement relative to trigger. |
| `closeOnOverlayClick?` | `boolean` | `true` | Closes component when overlay/backdrop is clicked. |
| `closeOnEscape?` | `boolean` | `true` | Closes component when `Escape` key is pressed. |
| `closable?` | `boolean` | `true` | Shows close control and allows explicit dismiss action. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:open` | `[value: boolean]` | `void` | Emitted with next open state. |
| `openChange` | `[value: boolean]` | `void` | Emitted when open state changes. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `header` | `—` | `void` | Slot for `header` content. |
| `actions` | `[scope: { close: () => void }]` | `void` | gets `{ close }` |
| `default` | `[scope: { close: () => void }]` | `void` | body |
| `footer` | `[scope: { close: () => void }]` | `void` | gets `{ close }` |

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
| `VfDrawerPlacement` | `'left' \| 'right' \| 'top' \| 'bottom'` |
| `VfDrawerSize` | `VfDialogSize \| 'full'` |
