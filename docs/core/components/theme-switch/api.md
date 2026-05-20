# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `variant?` | `'switch' \| 'button'` | `switch` | Visual variant for component appearance. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `disabled?` | `boolean` | `false` | Disables user interaction. |
| `label?` | `string` | — | Accessible label text. |
| `thumbContrast?` | `VfSwitchThumbContrast` | `auto` | Thumb contrast strategy against current surface tone. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | custom label |
| `thumb` | `[scope: { checked: boolean }]` | `void` | custom thumb content for `switch` variant |

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
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
