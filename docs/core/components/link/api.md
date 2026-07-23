# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name         | Type                                | Default   | Description                                                   |
| ------------ | ----------------------------------- | --------- | ------------------------------------------------------------- |
| `href?`      | `string`                            | —         | Native link URL target.                                       |
| `to?`        | `string \| Record<string, unknown>` | —         | Router location target when using router-aware mode.          |
| `target?`    | `string`                            | —         | Native link target attribute (for example `_blank`).          |
| `rel?`       | `string`                            | —         | Native link `rel` attribute value.                            |
| `underline?` | `VfLinkUnderline`                   | `none`    | Underline display behavior for link text.                     |
| `tone?`      | `VfLinkTone`                        | `default` | Visual tone variant.                                          |
| `component?` | `string \| Component`               | —         | Component used instead of `RouterLink` when `to` is provided. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description      |
| ---- | ---------- | ---------- | ---------------- |
| `—`  | `—`        | `void`     | No custom emits. |

## Slots

Available slots and their slot props.

| Name      | Parameters | ReturnType | Description   |
| --------- | ---------- | ---------- | ------------- |
| `default` | `—`        | `void`     | Link content. |

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

| Name              | Values                          |
| ----------------- | ------------------------------- |
| `VfLinkTone`      | `'default' \| 'muted'`          |
| `VfLinkUnderline` | `'none' \| 'hover' \| 'always'` |
