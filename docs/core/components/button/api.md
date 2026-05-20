# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `variant?` | `VfButtonVariant` | `primary` | Visual variant for component appearance. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `block?` | `boolean` | `false` | Makes component fill available inline width. |
| `type?` | `'button' \| 'submit' \| 'reset'` | `button` | Native HTML `type` forwarded to underlying control. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | button content |

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
| `VfButtonVariant` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warn' \| 'help' \| 'danger' \| 'contrast' \| 'ghost'` |
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
