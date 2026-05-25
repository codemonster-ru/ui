# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

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

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:open` | `[value: boolean]` | `void` | Emitted with next open state. |
| `openChange` | `[value: boolean]` | `void` | Emitted when open state changes. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `header` | `—` | `void` | Slot for `header` content. |
| `actions` | `[scope: { close: () => void }]` | `void` | gets `{ close }` |
| `default` | `[scope: { close: () => void }]` | `void` | body |
| `footer` | `[scope: { close: () => void }]` | `void` | gets `{ close }` |

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
| `VfDrawerPlacement` | `'left' \| 'right' \| 'top' \| 'bottom'` |
| `VfDrawerSize` | `VfDialogSize \| 'full'` |
