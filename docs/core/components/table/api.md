# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name              | Type      | Default | Description                                         |
| ----------------- | --------- | ------- | --------------------------------------------------- |
| `caption?`        | `string`  | —       | Optional table caption for accessible summary text. |
| `columnDividers?` | `boolean` | `false` | Adds vertical separators between table columns.     |
| `compact?`        | `boolean` | `false` | Reduces inner spacing density.                      |
| `striped?`        | `boolean` | `false` | Applies alternating row background styling.         |
| `stickyHeader?`   | `boolean` | `false` | Makes header sticky on scroll.                      |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description      |
| ---- | ---------- | ---------- | ---------------- |
| `—`  | `—`        | `void`     | No custom emits. |

## Slots

Available slots and their slot props.

| Name      | Parameters | ReturnType | Description                 |
| --------- | ---------- | ---------- | --------------------------- |
| `caption` | `—`        | `void`     | Slot for `caption` content. |
| `header`  | `—`        | `void`     | Slot for `header` content.  |
| `default` | `—`        | `void`     | (table body rows)           |
| `footer`  | `—`        | `void`     | Slot for `footer` content.  |

## Events

Native DOM events exposed by the component.

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| `—`  | `—`  | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description                                         |
| ---- | ---- | ------- | --------------------------------------------------- |
| `—`  | `—`  | `—`     | No dedicated interfaces in this component contract. |

## Types

Exported utility and union types.

| Name | Values |
| ---- | ------ |
| `—`  | `—`    |
