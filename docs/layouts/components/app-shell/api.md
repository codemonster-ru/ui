# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `layout?` | `'content' \| 'sidebar-content' \| 'sidebar-content-aside'` | `sidebar-content-aside` | Layout preset used to arrange page regions. |
| `fillViewport?` | `boolean` | `false` | Expands layout to viewport height. |
| `stickyHeader?` | `boolean` | — | Makes header sticky on scroll. |
| `stickySidebar?` | `boolean` | `false` | Makes sidebar sticky on scroll. |
| `stickyAside?` | `boolean` | `false` | Makes aside sticky on scroll. |
| `sidebarCollapsed?` | `boolean` | — | Controlled sidebar collapsed state. |
| `defaultSidebarCollapsed?` | `boolean` | `false` | Initial uncontrolled sidebar collapsed state. |
| `sidebarAppearance?` | `'default' \| 'plain'` | `default` | Visual style for sidebar area. |
| `asideAppearance?` | `'default' \| 'plain'` | `default` | Visual style for aside area. |
| `contentAppearance?` | `'default' \| 'plain'` | `default` | Visual style for content area. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:sidebarCollapsed` | `—` | `void` | Emitted with next sidebar collapsed state. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `header` | `—` | `void` | Slot for `header` content. |
| `subheader` | `—` | `void` | Slot for `subheader` content. |
| `sidebar` | `[scope: { isSidebarCollapsed: boolean; collapseSidebar: () => void; expandSidebar: () => void; toggleSidebarCollapsed: () => void }]` | `void` | (`is-sidebar-collapsed`, `collapse-sidebar`, `expand-sidebar`, `toggle-sidebar-collapsed`) |
| `content-subheader` | `—` | `void` | Slot for `content-subheader` content. |
| `default` | `[scope: { isSidebarCollapsed: boolean; collapseSidebar: () => void; expandSidebar: () => void; toggleSidebarCollapsed: () => void }]` | `void` | (`is-sidebar-collapsed`, `collapse-sidebar`, `expand-sidebar`, `toggle-sidebar-collapsed`) |
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
