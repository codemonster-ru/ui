# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `layout?` | `'content' \| 'sidebar-content' \| 'sidebar-content-aside'` | `content` | Layout preset used to arrange page regions. |
| `fillViewport?` | `boolean` | `false` | Expands layout to viewport height. |
| `edgeNotches?` | `boolean` | `false` | Enables decorative edge-notch accents for document layout. |
| `showSubheader?` | `boolean` | `true` | Renders subheader region when slot is provided. |
| `showContentSubheader?` | `boolean` | `true` | Renders content-subheader region when slot is provided. |
| `stickyHeader?` | `boolean` | — | Makes header sticky on scroll. |
| `stickySidebar?` | `boolean` | `false` | Makes sidebar sticky on scroll. |
| `stickyAside?` | `boolean` | `false` | Makes aside sticky on scroll. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `header` | `—` | `void` | Slot for `header` content. |
| `subheader` | `—` | `void` | Slot for `subheader` content. |
| `sidebar` | `—` | `void` | Slot for `sidebar` content. |
| `content-subheader` | `—` | `void` | Slot for `content-subheader` content. |
| `default` | `—` | `void` | Slot for `default` content. |
| `aside` | `—` | `void` | Slot for `aside` content. |
| `footer` | `—` | `void` | Slot for `footer` content. |

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
