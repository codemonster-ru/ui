# API

## Props

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

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

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
