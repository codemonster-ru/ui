# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

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
| `ariaLabel?` | `string` | — | Explicit accessible name; takes precedence over the generated title relationship. |
| `ariaLabelledby?` | `string` | — | Explicit ID reference for the accessible name. |
| `ariaDescribedby?` | `string` | — | Explicit ID reference for the accessible description. |
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
| `default` | `[scope: { close: () => void }]` | `void` | dialog body (`{ close }` slot prop available) |
| `header` | `[scope: { titleId: string }]` | `void` | Custom heading, wrapped by the generated title ID. |
| `description` | `[scope: { descriptionId: string }]` | `void` | Custom description, wrapped by the generated description ID. |
| `actions` | `[scope: { close: () => void }]` | `void` | (`{ close }` slot prop available) |
| `footer` | `[scope: { close: () => void }]` | `void` | (`{ close }` slot prop available) |

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
| `VfDialogSize` | `'sm' \| 'md' \| 'lg'` |
