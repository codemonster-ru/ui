# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `IconName \| string` | — | Icon name or custom icon identifier. |
| `variant?` | `VfButtonVariant` | `ghost` | Visual variant for component appearance. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `type?` | `'button' \| 'submit' \| 'reset'` | `button` | Native HTML `type` forwarded to underlying control. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No public slots. |

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
| `IconName` | `Union of generated icon names.` |
| `VfButtonVariant` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warn' \| 'help' \| 'danger' \| 'contrast' \| 'ghost'` |
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
