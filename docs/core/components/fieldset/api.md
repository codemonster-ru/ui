# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `label?` | `string` | — | Visible legend rendered above the grouped controls. |
| `description?` | `string` | — | Helper text rendered below the grouped controls. |
| `error?` | `string` | — | Error text rendered below the grouped controls. |
| `invalid?` | `boolean` | `false` | Forces invalid styling/state even when `error` is absent. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No component events are emitted. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `[scope: { describedBy?: string; invalid: boolean }]` | `void` | Wraps grouped controls and exposes shared a11y metadata. |
| `label` | `—` | `void` | Custom legend content. |
| `description` | `—` | `void` | Custom helper text content. |
| `error` | `—` | `void` | Custom error content. |

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
| `—` | No dedicated public types are exported for this component. |
