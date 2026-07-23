# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name         | Type                  | Default      | Description                                                          |
| ------------ | --------------------- | ------------ | -------------------------------------------------------------------- |
| `items`      | `VfBreadcrumbItem[]`  | —            | Required prop.                                                       |
| `ariaLabel?` | `string`              | `Breadcrumb` | Accessible label for screen readers.                                 |
| `component?` | `string \| Component` | —            | Component used instead of `RouterLink` for items with a `to` target. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description      |
| ---- | ---------- | ---------- | ---------------- |
| `—`  | `—`        | `void`     | No custom emits. |

## Slots

Available slots and their slot props.

| Name        | Parameters                                           | ReturnType | Description                           |
| ----------- | ---------------------------------------------------- | ---------- | ------------------------------------- |
| `separator` | `[scope: { item: VfBreadcrumbItem; index: number }]` | `void`     | Replaces the separator after an item. |

## Events

Native DOM events exposed by the component.

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| `—`  | `—`  | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name               | Type        | Default | Description                                            |
| ------------------ | ----------- | ------- | ------------------------------------------------------ |
| `VfBreadcrumbItem` | `interface` | `—`     | Breadcrumb entry definition used by navigation trails. |

## Types

Exported utility and union types.

| Name | Values |
| ---- | ------ |
| `—`  | `—`    |
