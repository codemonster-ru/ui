# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `label?` | `string` | — | Visible field label rendered above the control. |
| `description?` | `string` | — | Helper text rendered below the control. |
| `error?` | `string` | — | Error text rendered below the control. |
| `invalid?` | `boolean` | `false` | Forces invalid styling/state even when `error` is absent. |
| `required?` | `boolean` | `false` | Shows a visual required marker next to the label and exposes required state to the default slot; does not set native `required` on the wrapped control. |
| `labelPlacement?` | `'top' \| 'floating'` | `'top'` | Chooses between the default stacked label and floating label layout for supported text-like controls. |
| `floatingVariant?` | `'in' \| 'on' \| 'over'` | `'in'` | Adjusts the visual resting position of the floating label when `labelPlacement` is set to `floating`. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No component events are emitted. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `[scope: { controlId: string; describedBy?: string; invalid: boolean; required: boolean }]` | `void` | Wraps the control and exposes a11y metadata to bind onto it. |
| `label` | `—` | `void` | Custom label content. |
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
