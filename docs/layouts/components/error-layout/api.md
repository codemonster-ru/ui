# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `as?` | `string` | `section` | Underlying HTML tag name used for rendering. |
| `code?` | `string \| number \| null` | — | Source code string rendered in the block. |
| `title?` | `string \| null` | `null` | Text title shown in the component header area. |
| `description?` | `string \| null` | `null` | Fallback description value displayed when `description` slot is absent. |
| `fillViewport?` | `boolean` | `true` | Expands layout to viewport height. |
| `centered?` | `boolean` | `true` | Centers content along cross axis within layout viewport. |
| `surface?` | `boolean` | `true` | Applies elevated/surface panel styling. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `code` | `—` | `void` | Slot for `code` content. |
| `title` | `—` | `void` | Slot for `title` content. |
| `description` | `—` | `void` | Slot for `description` content. |
| `actions` | `—` | `void` | Slot for `actions` content. |

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
| `—` | `—` |
