# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `variant?` | `'switch' \| 'button'` | `switch` | Visual variant for component appearance. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `disabled?` | `boolean` | `false` | Disables user interaction. |
| `label?` | `string` | — | Accessible label text. |
| `thumbContrast?` | `VfSwitchThumbContrast` | `auto` | Thumb contrast strategy against current surface tone. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | custom label |
| `thumb` | `[scope: { checked: boolean }]` | `void` | custom thumb content for `switch` variant |

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
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
