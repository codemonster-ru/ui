# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `VfTableOfContentsItem[]` | — | Required prop. |
| `activeId?` | `string` | — | Controlled active heading id. |
| `smooth?` | `boolean` | `false` | Enables smooth-scrolling on item navigation. |
| `scrollOffset?` | `number` | `0` | Pixel offset applied when scrolling to section anchors. |
| `variant?` | `'default' \| 'pills'` | `default` | Visual variant for component appearance. |

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
| `VfTableOfContentsItem` | `interface` | `—` | Table-of-contents item with id, label, level, and optional href. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `—` | `—` |
