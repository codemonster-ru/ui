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
| `dividers?` | `boolean` | `false` | Shows separators between header/body/footer regions. |
| `rounded?` | `boolean` | `false` | Enables rounded outer corners. |
| `offsetTop?` | `string \| number` | — | Sets the shell-oriented top offset CSS variable. |
| `bodyPadding?` | `string \| number` | — | Overrides body padding through the component CSS variable. |
| `teleportTo?` | `string \| HTMLElement \| null \| false` | — | Teleport target; `null`/`false` disables teleport resolution. |
| `disableTeleport?` | `boolean` | `false` | Forces in-place rendering. |
| `scrollLockTarget?` | `HTMLElement \| null \| false` | — | Custom lock target; `false` explicitly disables scroll locking. |
| `closeOnOverlayClick?` | `boolean` | `true` | Closes component when overlay/backdrop is clicked. |
| `closeOnEscape?` | `boolean` | `true` | Closes component when `Escape` key is pressed. |
| `closable?` | `boolean` | `true` | Shows close control and allows explicit dismiss action. |
| `ariaLabel?` | `string` | — | Explicit accessible name; takes precedence over the generated title relationship. |
| `ariaLabelledby?` | `string` | — | Explicit ID reference for the accessible name. |
| `ariaDescribedby?` | `string` | — | Explicit ID reference for the accessible description. |

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
| `header` | `[scope: { titleId: string }]` | `void` | Custom heading, wrapped by the generated title ID. |
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
