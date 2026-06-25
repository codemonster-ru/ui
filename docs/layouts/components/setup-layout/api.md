# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `as?` | `string` | `main` | Underlying HTML tag name used for rendering. |
| `title?` | `string \| null` | `null` | Text title shown in the setup header area. |
| `description?` | `string \| null` | `null` | Fallback description value displayed when `description` slot is absent. |
| `fillViewport?` | `boolean` | `true` | Expands layout to viewport height. |
| `surface?` | `boolean` | `true` | Applies panel surface styling. |
| `asidePosition?` | `'left' \| 'right'` | `left` | Places the aside column on medium and wider viewports. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `brand` | `—` | `void` | Logo, product mark, or setup product identity. |
| `toolbar` | `—` | `void` | Secondary header controls or compact progress content. |
| `title` | `—` | `void` | Slot for `title` content. Keep content phrasing-level because it is rendered inside the heading element. |
| `description` | `—` | `void` | Slot for `description` content. |
| `aside` | `—` | `void` | Step navigation, requirements, or contextual setup content. |
| `default` | `—` | `void` | Primary setup step content. |
| `actions` | `—` | `void` | Back, continue, or submit controls. |
| `footer` | `—` | `void` | Secondary legal/help content outside the setup panel. |

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
