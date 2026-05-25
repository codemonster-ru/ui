# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

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

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `code` | `—` | `void` | Slot for `code` content. |
| `title` | `—` | `void` | Slot for `title` content. |
| `description` | `—` | `void` | Slot for `description` content. |
| `actions` | `—` | `void` | Slot for `actions` content. |

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
| `—` | `—` |
